/**
 * ParticleTransitionRenderer - WebGL2 рендерер для particle переходов
 * Реализует dynamic эффекты с particle systems на базе унифицированной библиотеки
 */

import { createLogger } from "@/lib/tauri-logger"
import { BaseRenderer, type RendererOptions } from "@/lib/webgl"

const logger = createLogger("ParticleTransitionRenderer")

/**
 * Типы particle эффектов
 */
export type ParticleEffectType = "particle-dissolve" | "liquid-morph" | "glass-shatter" | "fire-burn" | "organic-growth"

/**
 * Параметры particle системы
 */
export interface ParticleSystemParams {
  count: number
  size: number
  speed: number
  gravity: number
  turbulence: number
  fadeOut?: boolean
  color?: string
}

/**
 * Параметры физики
 */
export interface PhysicsParams {
  explosionForce?: number
  gravity?: number
  windForce?: number
  viscosity?: number
  elasticity?: number
}

/**
 * Параметры рендеринга particle перехода
 */
export interface ParticleRenderParams {
  sourceTexture: WebGLTexture
  targetTexture: WebGLTexture
  progress: number
  effectType: ParticleEffectType
  particles?: ParticleSystemParams
  physics?: PhysicsParams
  parameters?: Record<string, any>
}

/**
 * Particle рендерер переходов
 */
export class ParticleTransitionRenderer extends BaseRenderer {
  private particleBuffers = new Map<string, WebGLBuffer>()
  private particleStates = new Map<string, Float32Array>()

  constructor(options?: Partial<RendererOptions>) {
    super({
      name: "particle-transitions",
      createCanvas: true,
      ...options,
    })
  }

  /**
   * Инициализация particle шейдеров
   */
  protected async onInitialize(): Promise<void> {
    if (!this.gl) return

    // Настройка WebGL для particle рендеринга
    this.gl.enable(this.gl.BLEND)
    this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA)

    // Компилируем particle шейдеры
    await this.compileParticleShaders()
  }

  /**
   * Рендеринг particle перехода
   */
  public async renderParticleTransition(params: ParticleRenderParams): Promise<boolean> {
    if (!this.gl) return false

    const { sourceTexture, targetTexture, progress, effectType, particles, parameters } = params

    try {
      const program = this.useProgram(`particle-${effectType}`)
      if (!program) {
        logger.errorSync(`Shader not found: particle-${effectType}`)
        return false
      }

      // Базовые uniforms
      this.setUniform("progress", progress)
      this.setUniform("resolution", [this.viewport.width, this.viewport.height])

      // Particle параметры
      if (particles) {
        this.updateParticleSystem(effectType, particles, progress)
        this.setUniform("particleCount", particles.count)
        this.setUniform("particleSize", particles.size)
        this.setUniform("gravity", particles.gravity)
        this.setUniform("turbulence", particles.turbulence)
        this.setUniform("speed", particles.speed)
      }

      // Специфичные параметры эффектов
      this.setEffectParameters(effectType, parameters || {})

      // Биндим текстуры
      this.gl.activeTexture(this.gl.TEXTURE0)
      this.gl.bindTexture(this.gl.TEXTURE_2D, sourceTexture)
      this.setUniform("textureA", 0)

      this.gl.activeTexture(this.gl.TEXTURE1)
      this.gl.bindTexture(this.gl.TEXTURE_2D, targetTexture)
      this.setUniform("textureB", 1)

      // Рендерим
      this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4)

      return true
    } catch (error) {
      logger.errorSync("Particle render error", { effectType, error })
      return false
    }
  }

  /**
   * Абстрактный метод render
   */
  public render(_deltaTime: number): void {
    // Не используется - используем renderParticleTransition
  }

  /**
   * Обновление particle системы
   */
  private updateParticleSystem(
    effectType: ParticleEffectType,
    particles: ParticleSystemParams,
    progress: number,
  ): void {
    if (!this.gl) return

    const stateKey = `${effectType}_particles`
    let particleState = this.particleStates.get(stateKey)

    // Инициализация частиц при первом запуске
    if (!particleState) {
      particleState = this.initializeParticles(particles.count)
      this.particleStates.set(stateKey, particleState)
    }

    // Обновляем состояние частиц
    this.simulateParticles(particleState, particles, progress)

    // Создаем или обновляем буфер частиц
    let buffer = this.particleBuffers.get(stateKey)
    if (!buffer) {
      buffer = this.gl.createBuffer()!
      this.particleBuffers.set(stateKey, buffer)
    }

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer)
    this.gl.bufferData(this.gl.ARRAY_BUFFER, particleState, this.gl.DYNAMIC_DRAW)
  }

  /**
   * Инициализация частиц
   */
  private initializeParticles(count: number): Float32Array {
    const particlesPerAttribute = 6 // x, y, vx, vy, life, size
    const data = new Float32Array(count * particlesPerAttribute)

    for (let i = 0; i < count; i++) {
      const offset = i * particlesPerAttribute
      // Позиция
      data[offset] = Math.random()
      data[offset + 1] = Math.random()
      // Скорость
      data[offset + 2] = (Math.random() - 0.5) * 0.1
      data[offset + 3] = (Math.random() - 0.5) * 0.1
      // Жизнь
      data[offset + 4] = 1.0
      // Размер
      data[offset + 5] = Math.random() * 0.5 + 0.5
    }

    return data
  }

  /**
   * Симуляция частиц
   */
  private simulateParticles(state: Float32Array, params: ParticleSystemParams, progress: number): void {
    const particlesPerAttribute = 6
    const count = state.length / particlesPerAttribute

    for (let i = 0; i < count; i++) {
      const offset = i * particlesPerAttribute

      // Обновляем позицию
      state[offset] += state[offset + 2] * params.speed
      state[offset + 1] += state[offset + 3] * params.speed

      // Применяем гравитацию
      state[offset + 3] += params.gravity * 0.01

      // Применяем турбулентность
      state[offset + 2] += (Math.random() - 0.5) * params.turbulence * 0.01
      state[offset + 3] += (Math.random() - 0.5) * params.turbulence * 0.01

      // Обновляем жизнь частицы
      if (params.fadeOut) {
        state[offset + 4] = Math.max(0, 1.0 - progress)
      }
    }
  }

  /**
   * Установка параметров для конкретного эффекта
   */
  private setEffectParameters(effectType: ParticleEffectType, params: Record<string, any>): void {
    switch (effectType) {
      case "liquid-morph":
        this.setUniform("viscosity", params.viscosity ?? 0.8)
        this.setUniform("turbulence", params.turbulence ?? 0.4)
        this.setUniform("waveHeight", params.waveHeight ?? 20)
        this.setUniform("waveFrequency", params.waveFrequency ?? 3)
        if (params.color?.tint) {
          this.setUniform("tintColor", this.hexToRgb(params.color.tint))
        }
        break

      case "glass-shatter":
        this.setUniform("impactPoint", params.impactPoint || [0.5, 0.5])
        this.setUniform("shardCount", params.shards?.count ?? 150)
        this.setUniform("explosionForce", params.shards?.explosionForce ?? 2.0)
        this.setUniform("gravity", params.shards?.gravity ?? 0.5)
        break

      case "fire-burn":
        this.setUniform("intensity", params.intensity ?? 1.0)
        this.setUniform("spread", params.spread ?? 0.5)
        this.setUniform("heatDistortion", params.heatDistortion ?? 0.3)
        break

      case "organic-growth":
        this.setUniform("growthPattern", params.growthPattern ?? 0)
        this.setUniform("branches", params.branches ?? 5)
        this.setUniform("speed", params.speed ?? 1.0)
        break
    }
  }

  /**
   * Компиляция particle шейдеров
   */
  private async compileParticleShaders(): Promise<void> {
    const shaderTypes: ParticleEffectType[] = [
      "particle-dissolve",
      "liquid-morph",
      "glass-shatter",
      "fire-burn",
      "organic-growth",
    ]

    // Базовый вершинный шейдер для particle эффектов
    const vertexShader = `#version 300 es
      in vec2 a_position;
      in vec2 a_texCoord;
      out vec2 v_texCoord;

      void main() {
        gl_Position = vec4(a_position, 0.0, 1.0);
        v_texCoord = a_texCoord;
      }`

    // Компилируем каждый шейдер через shaderPool
    const { shaderPool } = await import("@/lib/webgl")

    for (const type of shaderTypes) {
      const fragmentShader = this.getFragmentShader(type)
      if (fragmentShader) {
        const shaderSource = { vertex: vertexShader, fragment: fragmentShader }
        const compiled = shaderPool.getProgram(`particle-${type}`, shaderSource)

        if (!compiled) {
          logger.errorSync(`Failed to compile particle shader: ${type}`)
        } else {
          logger.debugSync(`Compiled particle shader: ${type}`)
          this.programs.set(`particle-${type}`, compiled)
        }
      }
    }
  }

  /**
   * Получить fragment shader для particle эффекта
   */
  private getFragmentShader(type: ParticleEffectType): string {
    const baseUniforms = `#version 300 es
      precision highp float;

      uniform sampler2D textureA;
      uniform sampler2D textureB;
      uniform float progress;
      uniform vec2 resolution;

      in vec2 v_texCoord;
      out vec4 fragColor;`

    const noiseFunc = `
      // Noise function
      float random(vec2 co) {
        return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453);
      }`

    switch (type) {
      case "particle-dissolve":
        return `${baseUniforms}
          uniform float particleCount;
          uniform float particleSize;
          uniform float speed;
          ${noiseFunc}

          void main() {
            vec2 uv = v_texCoord;
            float noise = random(floor(uv * particleCount));

            if (noise < progress) {
              uv += (vec2(random(uv), random(uv + 1.0)) - 0.5) * particleSize * progress;
            }

            vec4 colorA = texture(textureA, uv);
            vec4 colorB = texture(textureB, uv);
            float alpha = smoothstep(noise - 0.1, noise + 0.1, progress);
            fragColor = mix(colorA, colorB, alpha);
          }`

      case "liquid-morph":
        return `${baseUniforms}
          uniform float viscosity;
          uniform float turbulence;
          uniform float waveHeight;
          uniform float waveFrequency;

          void main() {
            vec2 uv = v_texCoord;
            float wave = sin(uv.x * waveFrequency + progress * 3.14159) * waveHeight * (1.0 - viscosity) * progress * 0.01;
            uv.y += wave;

            vec4 colorA = texture(textureA, uv);
            vec4 colorB = texture(textureB, uv);
            fragColor = mix(colorA, colorB, progress);
          }`

      case "glass-shatter":
        return `${baseUniforms}
          uniform vec2 impactPoint;
          uniform float shardCount;
          uniform float explosionForce;
          uniform float gravity;
          ${noiseFunc}

          void main() {
            vec2 uv = v_texCoord;
            vec2 toImpact = uv - impactPoint;
            float dist = length(toImpact);
            float shard = floor(atan(toImpact.y, toImpact.x) * shardCount / 6.28318);
            float noise = random(vec2(shard, 0.0));

            if (progress > noise * 0.5) {
              vec2 offset = normalize(toImpact) * explosionForce * progress * 0.1;
              offset.y -= gravity * progress * progress * 0.1;
              uv += offset;
            }

            vec4 colorA = texture(textureA, uv);
            vec4 colorB = texture(textureB, uv);
            float alpha = smoothstep(noise * 0.5, noise * 0.5 + 0.2, progress);
            fragColor = mix(colorA, colorB, alpha);
          }`

      case "fire-burn":
        return `${baseUniforms}
          uniform float intensity;
          uniform float spread;
          uniform float heatDistortion;
          ${noiseFunc}

          void main() {
            vec2 uv = v_texCoord;
            float noise = random(uv);
            float burn = progress + (noise - 0.5) * spread;

            if (burn > 0.5) {
              uv += (vec2(random(uv), random(uv + 1.0)) - 0.5) * heatDistortion * 0.05;
            }

            vec4 colorA = texture(textureA, uv);
            vec4 colorB = texture(textureB, uv);

            // Fire edge effect
            float edge = smoothstep(burn - 0.1, burn, 0.5) - smoothstep(burn, burn + 0.1, 0.5);
            vec3 fireColor = vec3(1.0, 0.5, 0.0) * edge * intensity;

            vec4 mixed = mix(colorA, colorB, smoothstep(burn - 0.2, burn, 0.5));
            fragColor = vec4(mixed.rgb + fireColor, mixed.a);
          }`

      case "organic-growth":
        return `${baseUniforms}
          uniform float growthPattern;
          uniform float branches;
          uniform float speed;
          ${noiseFunc}

          void main() {
            vec2 uv = v_texCoord;
            vec2 center = vec2(0.5);
            vec2 toCenter = uv - center;
            float angle = atan(toCenter.y, toCenter.x);
            float dist = length(toCenter);

            float branch = floor(angle * branches / 6.28318);
            float noise = random(vec2(branch, dist));
            float growth = progress * speed + noise * 0.2;

            vec4 colorA = texture(textureA, uv);
            vec4 colorB = texture(textureB, uv);
            float alpha = smoothstep(dist - growth, dist - growth + 0.2, 0.0);
            fragColor = mix(colorA, colorB, alpha);
          }`

      default:
        return `${baseUniforms}
          void main() {
            vec4 colorA = texture(textureA, v_texCoord);
            vec4 colorB = texture(textureB, v_texCoord);
            fragColor = mix(colorA, colorB, progress);
          }`
    }
  }

  /**
   * Конвертация HEX в RGB
   */
  private hexToRgb(hex: string): number[] {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result
      ? [
          Number.parseInt(result[1], 16) / 255,
          Number.parseInt(result[2], 16) / 255,
          Number.parseInt(result[3], 16) / 255,
        ]
      : [1, 1, 1]
  }

  /**
   * Очистка particle ресурсов
   */
  protected onDispose(): void {
    if (!this.gl) return

    // Удаляем particle буферы
    for (const buffer of this.particleBuffers.values()) {
      this.gl.deleteBuffer(buffer)
    }
    this.particleBuffers.clear()
    this.particleStates.clear()
  }
}

/**
 * Глобальный экземпляр
 */
export const particleTransitionRenderer = new ParticleTransitionRenderer()

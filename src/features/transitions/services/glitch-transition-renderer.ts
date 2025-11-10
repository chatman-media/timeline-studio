/**
 * GlitchTransitionRenderer - WebGL2 рендерер для glitch переходов
 * Реализует 10 glitch эффектов на базе унифицированной библиотеки
 */

import { createLogger } from "@/lib/tauri-logger"
import { BaseRenderer, type RendererOptions } from "@/lib/webgl"

const logger = createLogger("GlitchTransitionRenderer")

/**
 * Типы glitch эффектов
 */
export type GlitchEffectType =
  | "digital-glitch"
  | "rgb-split"
  | "data-corruption"
  | "analog-distortion"
  | "signal-interference"
  | "pixel-storm"
  | "codec-error"
  | "matrix-rain"
  | "screen-tear"
  | "bit-crush"

/**
 * Параметры рендеринга glitch перехода
 */
export interface GlitchRenderParams {
  sourceTexture: WebGLTexture
  targetTexture: WebGLTexture
  progress: number
  effectType: GlitchEffectType
  parameters?: Record<string, any>
}

/**
 * Glitch рендерер переходов
 */
export class GlitchTransitionRenderer extends BaseRenderer {
  private currentTime = 0

  constructor(options?: Partial<RendererOptions>) {
    super({
      name: "glitch-transitions",
      createCanvas: true,
      ...options,
    })
  }

  /**
   * Инициализация glitch шейдеров
   */
  protected async onInitialize(): Promise<void> {
    if (!this.gl) return

    // Компилируем все glitch шейдеры
    await this.compileGlitchShaders()
  }

  /**
   * Рендеринг glitch перехода
   */
  public async renderGlitchTransition(params: GlitchRenderParams): Promise<boolean> {
    if (!this.gl) return false

    const { sourceTexture, targetTexture, progress, effectType, parameters } = params

    try {
      const program = this.useProgram(`glitch-${effectType}`)
      if (!program) {
        logger.errorSync(`Shader not found: glitch-${effectType}`)
        return false
      }

      // Базовые uniforms
      this.setUniform("progress", progress)
      this.setUniform("u_time", this.currentTime)
      this.setUniform("resolution", [this.viewport.width, this.viewport.height])

      // Специфичные параметры для каждого эффекта
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
      logger.errorSync("Glitch render error", { effectType, error })
      return false
    }
  }

  /**
   * Обновление времени для анимации
   */
  public render(deltaTime: number): void {
    this.currentTime += deltaTime
  }

  /**
   * Установка параметров для конкретного эффекта
   */
  private setEffectParameters(effectType: GlitchEffectType, params: Record<string, any>): void {
    switch (effectType) {
      case "digital-glitch":
        this.setUniform("u_blockSize", params.blockSize ?? 16)
        this.setUniform("u_intensity", params.intensity ?? 0.5)
        this.setUniform("u_frequency", params.frequency ?? 0.3)
        break

      case "rgb-split":
        this.setUniform("u_separation", params.separation ?? 10)
        this.setUniform("u_angle", params.angle ?? 0)
        this.setUniform("u_aberration", params.aberration ?? 0.5)
        break

      case "data-corruption":
        this.setUniform("u_corruptionLevel", params.corruptionLevel ?? 0.3)
        this.setUniform("u_noiseAmount", params.noiseAmount ?? 0.2)
        break

      case "analog-distortion":
        this.setUniform("u_tracking", params.tracking ?? 0.3)
        this.setUniform("u_jitter", params.jitter ?? 0.2)
        this.setUniform("u_colorBleed", params.colorBleed ?? 0.5)
        break

      case "signal-interference":
        this.setUniform("u_waveFrequency", params.waveFrequency ?? 5)
        this.setUniform("u_waveAmplitude", params.waveAmplitude ?? 0.3)
        this.setUniform("u_ghosting", params.ghosting ?? 0.2)
        break

      case "pixel-storm":
        this.setUniform("u_pixelSize", params.pixelSize ?? 4)
        this.setUniform("u_chaos", params.chaos ?? 0.5)
        this.setUniform("u_speed", params.speed ?? 1)
        break

      case "codec-error":
        this.setUniform("u_macroblockSize", params.macroblockSize ?? 16)
        this.setUniform("u_compressionArtifacts", params.compressionArtifacts ?? 0.4)
        break

      case "matrix-rain":
        this.setUniform("u_density", params.density ?? 0.5)
        this.setUniform("u_speed", params.speed ?? 1)
        this.setUniform("u_colorTint", this.hexToRgb(params.colorTint || "#00ff00"))
        break

      case "screen-tear":
        this.setUniform("u_tearCount", params.tearCount ?? 3)
        this.setUniform("u_displacement", params.displacement ?? 20)
        this.setUniform("u_wobble", params.wobble ?? 0.3)
        break

      case "bit-crush":
        this.setUniform("u_bitDepth", params.bitDepth ?? 4)
        this.setUniform("u_colorPalette", params.colorPalette ?? 16)
        break
    }
  }

  /**
   * Компиляция glitch шейдеров
   * Примечание: Шейдеры вынесены в отдельные методы для читаемости
   */
  private async compileGlitchShaders(): Promise<void> {
    const shaderTypes: GlitchEffectType[] = [
      "digital-glitch",
      "rgb-split",
      "data-corruption",
      "analog-distortion",
      "signal-interference",
      "pixel-storm",
      "codec-error",
      "matrix-rain",
      "screen-tear",
      "bit-crush",
    ]

    // Базовый вершинный шейдер для всех glitch эффектов
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
        const compiled = shaderPool.getProgram(`glitch-${type}`, shaderSource)

        if (!compiled) {
          logger.errorSync(`Failed to compile glitch shader: ${type}`)
        } else {
          logger.debugSync(`Compiled glitch shader: ${type}`)
          this.programs.set(`glitch-${type}`, compiled)
        }
      }
    }
  }

  /**
   * Получить fragment shader для glitch эффекта
   */
  private getFragmentShader(type: GlitchEffectType): string {
    const baseUniforms = `#version 300 es
      precision highp float;

      uniform sampler2D textureA;
      uniform sampler2D textureB;
      uniform float progress;
      uniform float u_time;
      uniform vec2 resolution;

      in vec2 v_texCoord;
      out vec4 fragColor;`

    const noiseFunc = `
      // Noise function
      float random(vec2 co) {
        return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453);
      }`

    switch (type) {
      case "digital-glitch":
        return `${baseUniforms}
          uniform float u_blockSize;
          uniform float u_intensity;
          uniform float u_frequency;
          ${noiseFunc}

          void main() {
            vec2 uv = v_texCoord;
            float block = floor(uv.y * resolution.y / u_blockSize);
            float noise = random(vec2(block, u_time));

            if (noise < u_frequency * progress) {
              uv.x += (random(vec2(block, u_time + 1.0)) - 0.5) * u_intensity * progress;
            }

            vec4 colorA = texture(textureA, uv);
            vec4 colorB = texture(textureB, uv);
            fragColor = mix(colorA, colorB, progress);
          }`

      case "rgb-split":
        return `${baseUniforms}
          uniform float u_separation;
          uniform float u_angle;
          uniform float u_aberration;

          void main() {
            vec2 offset = vec2(cos(u_angle), sin(u_angle)) * u_separation * progress / resolution.x;

            float r = mix(texture(textureA, v_texCoord + offset).r, texture(textureB, v_texCoord + offset).r, progress);
            float g = mix(texture(textureA, v_texCoord).g, texture(textureB, v_texCoord).g, progress);
            float b = mix(texture(textureA, v_texCoord - offset).b, texture(textureB, v_texCoord - offset).b, progress);

            fragColor = vec4(r, g, b, 1.0);
          }`

      case "data-corruption":
        return `${baseUniforms}
          uniform float u_corruptionLevel;
          uniform float u_noiseAmount;
          ${noiseFunc}

          void main() {
            vec2 uv = v_texCoord;
            float noise = random(uv + u_time);

            if (noise < u_corruptionLevel * progress) {
              uv = vec2(random(uv), random(uv + 1.0));
            }

            vec4 colorA = texture(textureA, uv);
            vec4 colorB = texture(textureB, uv);
            vec4 mixed = mix(colorA, colorB, progress);

            if (noise < u_noiseAmount * progress) {
              mixed = vec4(vec3(random(uv + u_time)), 1.0);
            }

            fragColor = mixed;
          }`

      case "analog-distortion":
        return `${baseUniforms}
          uniform float u_tracking;
          uniform float u_jitter;
          uniform float u_colorBleed;
          ${noiseFunc}

          void main() {
            vec2 uv = v_texCoord;
            float scanline = floor(uv.y * resolution.y);
            float jitter = (random(vec2(scanline, u_time)) - 0.5) * u_jitter * progress;

            uv.x += jitter;
            uv.y += sin(uv.x * 10.0 + u_time) * u_tracking * progress;

            vec4 colorA = texture(textureA, uv);
            vec4 colorB = texture(textureB, uv);
            vec4 mixed = mix(colorA, colorB, progress);

            // Color bleeding
            mixed.r = mix(mixed.r, texture(textureB, uv + vec2(0.01 * u_colorBleed, 0.0)).r, progress);

            fragColor = mixed;
          }`

      case "signal-interference":
        return `${baseUniforms}
          uniform float u_waveFrequency;
          uniform float u_waveAmplitude;
          uniform float u_ghosting;

          void main() {
            vec2 uv = v_texCoord;
            float wave = sin(uv.y * u_waveFrequency + u_time * 2.0) * u_waveAmplitude * progress;
            uv.x += wave;

            vec4 colorA = texture(textureA, uv);
            vec4 colorB = texture(textureB, uv);
            vec4 mixed = mix(colorA, colorB, progress);

            // Ghosting effect
            vec4 ghost = texture(textureA, uv - vec2(u_ghosting * progress, 0.0));
            mixed = mix(mixed, ghost, 0.3 * progress);

            fragColor = mixed;
          }`

      case "pixel-storm":
        return `${baseUniforms}
          uniform float u_pixelSize;
          uniform float u_chaos;
          uniform float u_speed;
          ${noiseFunc}

          void main() {
            vec2 pixelated = floor(v_texCoord * resolution / u_pixelSize) * u_pixelSize / resolution;
            float noise = random(pixelated + u_time * u_speed);

            vec2 uv = mix(v_texCoord, pixelated, progress);
            if (noise < u_chaos * progress) {
              uv = vec2(random(pixelated), random(pixelated + 1.0));
            }

            vec4 colorA = texture(textureA, uv);
            vec4 colorB = texture(textureB, uv);
            fragColor = mix(colorA, colorB, progress);
          }`

      case "codec-error":
        return `${baseUniforms}
          uniform float u_macroblockSize;
          uniform float u_compressionArtifacts;
          ${noiseFunc}

          void main() {
            vec2 block = floor(v_texCoord * resolution / u_macroblockSize);
            vec2 blockUV = block * u_macroblockSize / resolution;
            float noise = random(block + u_time);

            vec2 uv = v_texCoord;
            if (noise < u_compressionArtifacts * progress) {
              uv = blockUV;
            }

            vec4 colorA = texture(textureA, uv);
            vec4 colorB = texture(textureB, uv);
            fragColor = mix(colorA, colorB, progress);
          }`

      case "matrix-rain":
        return `${baseUniforms}
          uniform float u_density;
          uniform float u_speed;
          uniform vec3 u_colorTint;
          ${noiseFunc}

          void main() {
            float column = floor(v_texCoord.x * resolution.x / 20.0);
            float fall = fract(v_texCoord.y + u_time * u_speed);
            float noise = random(vec2(column, floor(fall * 20.0)));

            vec4 colorA = texture(textureA, v_texCoord);
            vec4 colorB = texture(textureB, v_texCoord);
            vec4 mixed = mix(colorA, colorB, progress);

            if (noise < u_density * progress) {
              mixed = vec4(u_colorTint * noise, 1.0);
            }

            fragColor = mixed;
          }`

      case "screen-tear":
        return `${baseUniforms}
          uniform float u_tearCount;
          uniform float u_displacement;
          uniform float u_wobble;
          ${noiseFunc}

          void main() {
            vec2 uv = v_texCoord;
            float tear = floor(uv.y * u_tearCount);
            float offset = random(vec2(tear, u_time)) * u_displacement * progress / resolution.x;
            offset += sin(u_time * 5.0 + tear) * u_wobble * progress / resolution.x;

            uv.x += offset;

            vec4 colorA = texture(textureA, uv);
            vec4 colorB = texture(textureB, uv);
            fragColor = mix(colorA, colorB, progress);
          }`

      case "bit-crush":
        return `${baseUniforms}
          uniform float u_bitDepth;
          uniform float u_colorPalette;

          void main() {
            vec4 colorA = texture(textureA, v_texCoord);
            vec4 colorB = texture(textureB, v_texCoord);
            vec4 mixed = mix(colorA, colorB, progress);

            float levels = pow(2.0, u_bitDepth);
            mixed.rgb = floor(mixed.rgb * levels * progress + mixed.rgb * (1.0 - progress) * 256.0) / levels;

            fragColor = mixed;
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
}

/**
 * Глобальный экземпляр
 */
export const glitchTransitionRenderer = new GlitchTransitionRenderer()

/**
 * Сервис для динамических переходов с GPU ускорением
 * Поддерживает particle systems, physics simulation и complex shaders
 */

import { createLogger } from "@/lib/tauri-logger"

const logger = createLogger("DynamicTransitionService")

// Типы динамических шейдеров
export type DynamicShaderType =
  | "particle-dissolve"
  | "liquid-morph"
  | "glass-shatter"
  | "fire-burn"
  | "organic-growth"
  | "water-drop"
  | "smoke-reveal"
  | "tornado-twist"
  | "electric-discharge"
  | "crystal-formation"
  | "sand-dispersion"
  | "magnetic-field"
  | "bubble-pop"
  | "ink-splash"
  | "paper-fold"
  // Glitch effects
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
  // 3D effects
  | "page-flip"
  | "card-shuffle"
  | "helix-spin"
  | "sphere-mapping"
  | "book-open"
  | "cylinder-roll"
  | "origami-fold"
  | "polyhedron-transform"
  | "mobius-strip"

// Параметры для particle систем
interface ParticleSystemParams {
  count: number
  size: number
  speed: number
  gravity: number
  turbulence: number
  fadeOut?: boolean
  color?: string
}

// Параметры для физической симуляции
interface PhysicsParams {
  explosionForce?: number
  gravity?: number
  windForce?: number
  viscosity?: number
  elasticity?: number
}

// Расширенные параметры рендеринга
export interface DynamicRenderParams {
  canvas: HTMLCanvasElement
  sourceTexture: WebGLTexture
  targetTexture: WebGLTexture
  progress: number
  shaderType: DynamicShaderType
  parameters: {
    particles?: ParticleSystemParams
    physics?: PhysicsParams
  } & Record<string, any>
}

export class DynamicTransitionService {
  private gl: WebGL2RenderingContext | null = null
  private shaderPrograms = new Map<DynamicShaderType, WebGLProgram>()
  private particleBuffers = new Map<string, WebGLBuffer>()
  private frameBuffers = new Map<string, WebGLFramebuffer>()
  private computeShaders = new Map<string, WebGLProgram>()

  // Uniform locations cache
  private uniformLocations = new Map<string, WebGLUniformLocation>()

  // Particle system state
  private particleStates = new Map<string, Float32Array>()

  // Animation frame ID for continuous effects
  private animationFrameId: number | null = null

  /**
   * Инициализация WebGL2 контекста
   */
  public async initialize(canvas: HTMLCanvasElement): Promise<boolean> {
    try {
      this.gl = canvas.getContext("webgl2", {
        alpha: true,
        premultipliedAlpha: false,
        preserveDrawingBuffer: true,
        antialias: true,
        powerPreference: "high-performance",
      })

      if (!this.gl) {
        logger.error("WebGL2 not supported")
        return false
      }

      // Проверяем необходимые расширения
      const requiredExtensions = ["EXT_color_buffer_float", "OES_texture_float_linear", "WEBGL_color_buffer_float"]

      for (const ext of requiredExtensions) {
        if (!this.gl.getExtension(ext)) {
          logger.warn("Extension not supported", { extension: ext })
        }
      }

      // Настройка WebGL
      this.gl.enable(this.gl.BLEND)
      this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA)
      this.gl.clearColor(0, 0, 0, 0)

      // Компилируем динамические шейдеры
      await this.compileDynamicShaders()

      return true
    } catch (error) {
      logger.error("WebGL2 initialization error", { error })
      return false
    }
  }

  /**
   * Компиляция динамических шейдеров
   */
  private async compileDynamicShaders(): Promise<void> {
    if (!this.gl) return

    const shaderTypes: DynamicShaderType[] = [
      "particle-dissolve",
      "liquid-morph",
      "glass-shatter",
      "fire-burn",
      "organic-growth",
      // Glitch shaders
      "digital-glitch",
      "rgb-split",
      "data-corruption",
      "analog-distortion",
      "signal-interference",
      "pixel-storm",
      "matrix-rain",
      "codec-error",
      "screen-tear",
      "bit-crush",
      // 3D shaders
      "page-flip",
      "card-shuffle",
      "helix-spin",
      "sphere-mapping",
    ]

    for (const shaderType of shaderTypes) {
      try {
        const fragmentSource = await this.loadShaderSource(shaderType)
        if (fragmentSource) {
          const program = this.createShaderProgram(this.getVertexShader(), fragmentSource)
          if (program) {
            this.shaderPrograms.set(shaderType, program)
            this.cacheUniformLocations(shaderType, program)
          }
        }
      } catch (error) {
        logger.error("Shader compilation error", { shaderType, error })
      }
    }
  }

  /**
   * Загрузка исходного кода шейдера
   */
  private async loadShaderSource(shaderType: DynamicShaderType): Promise<string | null> {
    // В реальном приложении здесь будет загрузка из файлов
    // Для демонстрации возвращаем встроенные шейдеры
    const shaderSources: Record<DynamicShaderType, string> = {
      "particle-dissolve": this.getParticleDissolveShader(),
      "liquid-morph": this.getLiquidMorphShader(),
      "glass-shatter": this.getGlassShatterShader(),
      "fire-burn": this.getFireBurnShader(),
      "organic-growth": this.getOrganicGrowthShader(),
      "water-drop": this.getWaterDropShader(),
      "smoke-reveal": this.getSmokeRevealShader(),
      "tornado-twist": this.getTornadoTwistShader(),
      "electric-discharge": this.getElectricDischargeShader(),
      "crystal-formation": this.getCrystalFormationShader(),
      "sand-dispersion": this.getSandDispersionShader(),
      "magnetic-field": this.getMagneticFieldShader(),
      "bubble-pop": this.getBubblePopShader(),
      "ink-splash": this.getInkSplashShader(),
      "paper-fold": this.getPaperFoldShader(),
      // Glitch effects
      "digital-glitch": this.getDigitalGlitchShader(),
      "rgb-split": this.getRgbSplitShader(),
      "data-corruption": this.getDataCorruptionShader(),
      "analog-distortion": this.getAnalogDistortionShader(),
      "signal-interference": this.getSignalInterferenceShader(),
      "pixel-storm": this.getPixelStormShader(),
      "codec-error": this.getCodecErrorShader(),
      "matrix-rain": this.getMatrixRainShader(),
      "screen-tear": this.getScreenTearShader(),
      "bit-crush": this.getBitCrushShader(),
      // 3D effects
      "page-flip": this.getPageFlipShader(),
      "card-shuffle": this.getCardShuffleShader(),
      "helix-spin": this.getHelixSpinShader(),
      "sphere-mapping": this.getSphereMapShader(),
      "book-open": this.getBookOpenShader(),
      "cylinder-roll": this.getCylinderRollShader(),
      "origami-fold": this.getOrigamiFoldShader(),
      "polyhedron-transform": this.getPolyhedronTransformShader(),
      "mobius-strip": this.getMobiusStripShader(),
    }

    return shaderSources[shaderType] || null
  }

  /**
   * Создание текстуры из изображения
   */
  public async createTextureFromImage(image: HTMLImageElement): Promise<WebGLTexture | null> {
    if (!this.gl) return null

    const texture = this.gl.createTexture()
    if (!texture) return null

    this.gl.bindTexture(this.gl.TEXTURE_2D, texture)
    this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, image)

    // Настраиваем параметры текстуры
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE)
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE)
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR)
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR)

    return texture
  }

  /**
   * Рендеринг динамического перехода
   */
  public async renderDynamicTransition(params: DynamicRenderParams): Promise<boolean> {
    if (!this.gl) return false

    const { canvas, sourceTexture, targetTexture, progress, shaderType, parameters } = params
    const program = this.shaderPrograms.get(shaderType)

    if (!program) {
      logger.error("Shader not found", { shaderType })
      return false
    }

    try {
      // Настройка viewport
      this.gl.viewport(0, 0, canvas.width, canvas.height)
      this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT)

      // Используем программу
      this.gl.useProgram(program)

      // Настройка атрибутов
      this.setupVertexAttributes(program)

      // Биндим текстуры
      this.bindTextures(sourceTexture, targetTexture, program)

      // Устанавливаем uniforms
      this.setDynamicUniforms(program, shaderType, progress, parameters, canvas)

      // Специальная обработка для particle систем
      if (parameters.particles) {
        this.updateParticleSystem(shaderType, parameters.particles, progress)
      }

      // Рендерим
      this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4)

      return true
    } catch (error) {
      logger.error("Render error", { shaderType, error })
      return false
    }
  }

  /**
   * Обновление particle системы
   */
  private updateParticleSystem(shaderType: DynamicShaderType, particles: ParticleSystemParams, progress: number): void {
    if (!this.gl) return

    const stateKey = `${shaderType}_particles`
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
   * Установка dynamic uniforms
   */
  private setDynamicUniforms(
    program: WebGLProgram,
    shaderType: DynamicShaderType,
    progress: number,
    parameters: any,
    canvas: HTMLCanvasElement,
  ): void {
    if (!this.gl) return

    // Базовые uniforms
    this.setUniform(program, "progress", progress)
    this.setUniform(program, "resolution", [canvas.width, canvas.height])

    // Специфичные для типа шейдера uniforms
    switch (shaderType) {
      case "particle-dissolve":
        if (parameters.particles) {
          this.setUniform(program, "particleCount", parameters.particles.count)
          this.setUniform(program, "particleSize", parameters.particles.size)
          this.setUniform(program, "gravity", parameters.particles.gravity)
          this.setUniform(program, "turbulence", parameters.particles.turbulence)
          this.setUniform(program, "speed", parameters.particles.speed)
        }
        break

      case "liquid-morph":
        this.setUniform(program, "viscosity", parameters.viscosity || 0.8)
        this.setUniform(program, "turbulence", parameters.turbulence || 0.4)
        this.setUniform(program, "waveHeight", parameters.waveHeight || 20)
        this.setUniform(program, "waveFrequency", parameters.waveFrequency || 3)
        if (parameters.color?.tint) {
          this.setUniform(program, "tintColor", this.hexToRGB(parameters.color.tint))
        }
        break

      case "glass-shatter":
        this.setUniform(program, "impactPoint", parameters.impactPoint || [0.5, 0.5])
        this.setUniform(program, "shardCount", parameters.shards?.count || 150)
        this.setUniform(program, "explosionForce", parameters.shards?.explosionForce || 2.0)
        this.setUniform(program, "gravity", parameters.shards?.gravity || 0.5)
        this.setUniform(program, "rotation", parameters.shards?.rotation ? 1.0 : 0.0)
        break

      case "digital-glitch":
        this.setUniform(program, "u_blockSize", parameters.blockSize || 16)
        this.setUniform(program, "u_intensity", parameters.intensity || 0.5)
        this.setUniform(program, "u_frequency", parameters.frequency || 0.3)
        this.setUniform(program, "u_colorShift", parameters.colorShift || true)
        this.setUniform(program, "u_time", Date.now() / 1000)
        break

      case "rgb-split":
        this.setUniform(program, "u_separation", parameters.separation || 10)
        this.setUniform(program, "u_angle", parameters.angle || 0)
        this.setUniform(program, "u_animate", parameters.animate || true)
        this.setUniform(program, "u_aberration", parameters.aberration || 0.5)
        this.setUniform(program, "u_time", Date.now() / 1000)
        break

      case "data-corruption":
        this.setUniform(program, "u_corruptionLevel", parameters.corruptionLevel || 0.3)
        this.setUniform(program, "u_scanLines", parameters.scanLines || true)
        this.setUniform(program, "u_noiseAmount", parameters.noiseAmount || 0.2)
        this.setUniform(program, "u_pixelSort", parameters.pixelSort || true)
        this.setUniform(program, "u_time", Date.now() / 1000)
        break

      case "analog-distortion":
        this.setUniform(program, "u_tracking", parameters.tracking || 0.3)
        this.setUniform(program, "u_jitter", parameters.jitter || 0.2)
        this.setUniform(program, "u_colorBleed", parameters.colorBleed || 0.5)
        this.setUniform(program, "u_static", parameters.static || 0.1)
        this.setUniform(program, "u_time", Date.now() / 1000)
        break

      case "signal-interference":
        this.setUniform(program, "u_waveFrequency", parameters.waveFrequency || 5)
        this.setUniform(program, "u_waveAmplitude", parameters.waveAmplitude || 0.3)
        this.setUniform(program, "u_ghosting", parameters.ghosting || 0.2)
        this.setUniform(program, "u_sync", parameters.sync || 0.9)
        this.setUniform(program, "u_time", Date.now() / 1000)
        break

      case "pixel-storm":
        this.setUniform(program, "u_pixelSize", parameters.pixelSize || 4)
        this.setUniform(program, "u_chaos", parameters.chaos || 0.5)
        this.setUniform(program, "u_speed", parameters.speed || 1)
        this.setUniform(program, "u_colorMix", parameters.colorMix || true)
        this.setUniform(program, "u_time", Date.now() / 1000)
        break

      case "matrix-rain":
        this.setUniform(program, "u_density", parameters.density || 0.5)
        this.setUniform(program, "u_speed", parameters.speed || 1)
        this.setUniform(program, "u_colorTint", this.hexToRGB(parameters.colorTint || "#00ff00"))
        this.setUniform(program, "u_textMode", parameters.textMode || true)
        this.setUniform(program, "u_time", Date.now() / 1000)
        break

      case "codec-error":
        this.setUniform(program, "u_macroblockSize", parameters.macroblockSize || 16)
        this.setUniform(program, "u_compressionArtifacts", parameters.compressionArtifacts || 0.4)
        this.setUniform(program, "u_keyframeError", parameters.keyframeError || true)
        this.setUniform(program, "u_motionVector", parameters.motionVector || 0.3)
        this.setUniform(program, "u_time", Date.now() / 1000)
        break

      case "screen-tear":
        this.setUniform(program, "u_tearCount", parameters.tearCount || 3)
        this.setUniform(program, "u_displacement", parameters.displacement || 20)
        this.setUniform(program, "u_wobble", parameters.wobble || 0.3)
        this.setUniform(program, "u_flicker", parameters.flicker || true)
        this.setUniform(program, "u_time", Date.now() / 1000)
        break

      case "bit-crush":
        this.setUniform(program, "u_bitDepth", parameters.bitDepth || 4)
        this.setUniform(program, "u_colorPalette", parameters.colorPalette || 16)
        this.setUniform(program, "u_dithering", parameters.dithering || true)
        this.setUniform(program, "u_posterize", parameters.posterize || 0.5)
        this.setUniform(program, "u_time", Date.now() / 1000)
        break

      // 3D effects
      case "page-flip":
        this.setUniform(program, "u_flipDirection", parameters.flipDirection ?? 1) // 0=left, 1=right, 2=up, 3=down
        this.setUniform(program, "u_perspective", parameters.perspective || 1000)
        this.setUniform(program, "u_curvature", parameters.curvature || 0.6)
        this.setUniform(program, "u_shadowIntensity", parameters.shadowIntensity || 0.4)
        this.setUniform(program, "u_time", Date.now() / 1000)
        break

      case "card-shuffle":
        this.setUniform(program, "u_cardCount", parameters.cardCount || 16)
        this.setUniform(program, "u_shufflePattern", parameters.shufflePattern ?? 0) // 0=riffle, 1=overhand, 2=spiral, 3=random
        this.setUniform(program, "u_rotationChaos", parameters.rotationChaos || 0.7)
        this.setUniform(program, "u_gravity", parameters.gravity || 0.5)
        this.setUniform(program, "u_time", Date.now() / 1000)
        break

      case "helix-spin":
        this.setUniform(program, "u_helixTurns", parameters.helixTurns || 2)
        this.setUniform(program, "u_radius", parameters.radius || 0.3)
        this.setUniform(program, "u_axis", parameters.axis ?? 1) // 0=horizontal, 1=vertical, 2=diagonal
        this.setUniform(program, "u_twist", parameters.twist || 1)
        this.setUniform(program, "u_time", Date.now() / 1000)
        break

      case "sphere-mapping":
        this.setUniform(program, "u_sphereRadius", parameters.sphereRadius || 0.8)
        this.setUniform(program, "u_rotationSpeed", parameters.rotationSpeed || 1.0)
        this.setUniform(program, "u_lightPosition", parameters.lightPosition || [0.5, -0.5, 1.0])
        this.setUniform(program, "u_reflectivity", parameters.reflectivity || 0.3)
        this.setUniform(program, "u_time", Date.now() / 1000)
        break

      default:
        // Неизвестный тип шейдера - используем базовые uniforms
        logger.warn("Unknown shader type", { shaderType })
        break
    }
  }

  /**
   * Вспомогательные методы для установки uniforms
   */
  private setUniform(program: WebGLProgram, name: string, value: any): void {
    if (!this.gl) return

    const location = this.gl.getUniformLocation(program, name)
    if (!location) return

    if (typeof value === "number") {
      this.gl.uniform1f(location, value)
    } else if (Array.isArray(value)) {
      switch (value.length) {
        case 2:
          this.gl.uniform2fv(location, value)
          break
        case 3:
          this.gl.uniform3fv(location, value)
          break
        case 4:
          this.gl.uniform4fv(location, value)
          break
        default:
          logger.warn("Unsupported array length for uniform", { name, length: value.length })
          break
      }
    }
  }

  /**
   * Конвертация HEX в RGB
   */
  private hexToRGB(hex: string): number[] {
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
   * Базовый вершинный шейдер
   */
  private getVertexShader(): string {
    return `#version 300 es
    in vec2 a_position;
    in vec2 a_texCoord;
    out vec2 v_texCoord;
    
    void main() {
      gl_Position = vec4(a_position, 0.0, 1.0);
      v_texCoord = a_texCoord;
    }`
  }

  /**
   * Встроенные шейдеры (для демонстрации)
   */
  private getParticleDissolveShader(): string {
    return `#version 300 es
    precision highp float;
    
    uniform sampler2D textureA;
    uniform sampler2D textureB;
    uniform float progress;
    uniform vec2 resolution;
    uniform float particleCount;
    uniform float particleSize;
    uniform float gravity;
    uniform float turbulence;
    uniform float speed;
    
    in vec2 v_texCoord;
    out vec4 fragColor;
    
    float random(vec2 st) {
      return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
    }
    
    void main() {
      vec2 uv = v_texCoord;
      vec4 colorA = texture(textureA, uv);
      vec4 colorB = texture(textureB, uv);
      
      // Particle dissolution logic
      float dissolve = smoothstep(0.0, 1.0, progress);
      vec4 finalColor = mix(colorA, colorB, dissolve);
      
      fragColor = finalColor;
    }`
  }

  private getLiquidMorphShader(): string {
    return `#version 300 es
    precision highp float;
    
    uniform sampler2D textureA;
    uniform sampler2D textureB;
    uniform float progress;
    uniform vec2 resolution;
    uniform float viscosity;
    uniform float turbulence;
    uniform vec3 tintColor;
    
    in vec2 v_texCoord;
    out vec4 fragColor;
    
    void main() {
      vec2 uv = v_texCoord;
      vec4 colorA = texture(textureA, uv);
      vec4 colorB = texture(textureB, uv);
      
      float morph = smoothstep(0.0, 1.0, progress);
      vec4 finalColor = mix(colorA, colorB, morph);
      
      fragColor = finalColor;
    }`
  }

  private getGlassShatterShader(): string {
    return `#version 300 es
    precision highp float;
    
    uniform sampler2D textureA;
    uniform sampler2D textureB;
    uniform float progress;
    uniform vec2 resolution;
    uniform vec2 impactPoint;
    uniform float shardCount;
    
    in vec2 v_texCoord;
    out vec4 fragColor;
    
    void main() {
      vec2 uv = v_texCoord;
      vec4 colorA = texture(textureA, uv);
      vec4 colorB = texture(textureB, uv);
      
      float shatter = smoothstep(0.0, 1.0, progress);
      vec4 finalColor = mix(colorA, colorB, shatter);
      
      fragColor = finalColor;
    }`
  }

  private getFireBurnShader(): string {
    return `#version 300 es
    precision highp float;
    
    uniform sampler2D textureA;
    uniform sampler2D textureB;
    uniform float progress;
    
    in vec2 v_texCoord;
    out vec4 fragColor;
    
    void main() {
      vec2 uv = v_texCoord;
      vec4 colorA = texture(textureA, uv);
      vec4 colorB = texture(textureB, uv);
      
      float burn = smoothstep(0.0, 1.0, progress);
      vec4 finalColor = mix(colorA, colorB, burn);
      
      fragColor = finalColor;
    }`
  }

  private getOrganicGrowthShader(): string {
    return `#version 300 es
    precision highp float;
    
    uniform sampler2D textureA;
    uniform sampler2D textureB;
    uniform float progress;
    
    in vec2 v_texCoord;
    out vec4 fragColor;
    
    void main() {
      vec2 uv = v_texCoord;
      vec4 colorA = texture(textureA, uv);
      vec4 colorB = texture(textureB, uv);
      
      float growth = smoothstep(0.0, 1.0, progress);
      vec4 finalColor = mix(colorA, colorB, growth);
      
      fragColor = finalColor;
    }`
  }

  // Остальные методы-заглушки для других шейдеров
  private getWaterDropShader(): string {
    return ""
  }
  private getSmokeRevealShader(): string {
    return ""
  }
  private getTornadoTwistShader(): string {
    return ""
  }
  private getElectricDischargeShader(): string {
    return ""
  }
  private getCrystalFormationShader(): string {
    return ""
  }
  private getSandDispersionShader(): string {
    return ""
  }
  private getMagneticFieldShader(): string {
    return ""
  }
  private getBubblePopShader(): string {
    return ""
  }
  private getInkSplashShader(): string {
    return ""
  }
  private getPaperFoldShader(): string {
    return ""
  }

  // Glitch shader methods
  private getDigitalGlitchShader(): string {
    return `#version 300 es
    precision highp float;
    
    uniform sampler2D textureA;
    uniform sampler2D textureB;
    uniform vec2 resolution;
    uniform float progress;
    uniform float u_time;
    
    // Параметры глитча
    uniform float u_blockSize;
    uniform float u_intensity;
    uniform float u_frequency;
    uniform bool u_colorShift;
    
    in vec2 v_texCoord;
    out vec4 fragColor;
    
    // Псевдослучайная функция
    float random(vec2 st) {
      return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
    }
    
    // Генерация блочного шума
    float blockNoise(vec2 uv, float blockSize) {
      vec2 blockPos = floor(uv * blockSize) / blockSize;
      return random(blockPos + vec2(u_time * 0.1));
    }
    
    // RGB сдвиг
    vec3 rgbShift(sampler2D tex, vec2 uv, float amount) {
      float r = texture(tex, uv + vec2(amount, 0.0)).r;
      float g = texture(tex, uv).g;
      float b = texture(tex, uv - vec2(amount, 0.0)).b;
      return vec3(r, g, b);
    }
    
    // Цифровое искажение
    vec2 digitalDistortion(vec2 uv, float intensity) {
      float glitchTime = floor(u_time * 15.0) / 15.0;
      float noise = random(vec2(glitchTime));
      
      if (noise < u_frequency) {
        // Горизонтальные полосы искажений
        float bandY = floor(uv.y * 10.0) / 10.0;
        float bandNoise = random(vec2(bandY, glitchTime));
        
        if (bandNoise > 0.5) {
          uv.x += (random(vec2(bandY * 2.0, glitchTime)) - 0.5) * intensity;
        }
        
        // Блочные искажения
        float blockIntensity = blockNoise(uv, u_blockSize);
        if (blockIntensity > 0.7) {
          uv += (random(uv + glitchTime) - 0.5) * intensity * 0.1;
        }
      }
      
      return uv;
    }
    
    void main() {
      vec2 uv = v_texCoord;
      
      // Применяем цифровые искажения
      vec2 distortedUV = digitalDistortion(uv, u_intensity * progress);
      
      // Получаем цвета из текстур
      vec4 color1, color2;
      
      if (u_colorShift) {
        // С RGB сдвигом
        float shiftAmount = u_intensity * progress * 0.01;
        color1 = vec4(rgbShift(textureA, distortedUV, shiftAmount), 1.0);
        color2 = vec4(rgbShift(textureB, distortedUV, shiftAmount), 1.0);
      } else {
        // Без RGB сдвига
        color1 = texture(textureA, distortedUV);
        color2 = texture(textureB, distortedUV);
      }
      
      // Смешиваем с глитч артефактами
      vec4 mixedColor = mix(color1, color2, progress);
      
      // Добавляем случайные артефакты
      float glitchNoise = random(vec2(floor(uv.y * 100.0), u_time));
      if (glitchNoise > 0.98 && progress > 0.3 && progress < 0.7) {
        // Яркие горизонтальные линии
        mixedColor.rgb = vec3(1.0);
      }
      
      // Блочные цветовые искажения
      float blockGlitch = blockNoise(uv, u_blockSize * 0.5);
      if (blockGlitch > 0.9 && progress > 0.2 && progress < 0.8) {
        // Инвертируем цвета в блоке
        mixedColor.rgb = 1.0 - mixedColor.rgb;
      }
      
      // Добавляем мерцание
      float flicker = random(vec2(u_time * 10.0)) * 0.05;
      mixedColor.rgb += flicker * u_intensity * sin(progress * 3.14159);
      
      fragColor = mixedColor;
    }`
  }

  private getRgbSplitShader(): string {
    return `#version 300 es
    precision highp float;
    
    uniform sampler2D textureA;
    uniform sampler2D textureB;
    uniform vec2 resolution;
    uniform float progress;
    uniform float u_time;
    
    // Параметры RGB разделения
    uniform float u_separation;
    uniform float u_angle;
    uniform bool u_animate;
    uniform float u_aberration;
    
    in vec2 v_texCoord;
    out vec4 fragColor;
    
    // Поворот вектора на угол
    vec2 rotate(vec2 v, float angle) {
      float s = sin(angle);
      float c = cos(angle);
      return vec2(v.x * c - v.y * s, v.x * s + v.y * c);
    }
    
    // Хроматическая аберрация
    vec3 chromaticAberration(sampler2D tex, vec2 uv, vec2 direction, float amount) {
      float r = texture(tex, uv + direction * amount).r;
      float g = texture(tex, uv).g;
      float b = texture(tex, uv - direction * amount).b;
      return vec3(r, g, b);
    }
    
    // Волновое искажение для анимации
    vec2 waveDistortion(vec2 uv, float progress) {
      float wave = sin(uv.y * 10.0 + u_time * 5.0) * 0.01;
      return vec2(wave * progress, 0.0);
    }
    
    void main() {
      vec2 uv = v_texCoord;
      
      // Вычисляем направление разделения
      float angleRad = radians(u_angle);
      vec2 direction = vec2(cos(angleRad), sin(angleRad));
      
      // Анимация разделения
      float animatedProgress = progress;
      if (u_animate) {
        animatedProgress *= (1.0 + sin(u_time * 3.0) * 0.2);
      }
      
      // Вычисляем смещение для каждого канала
      float separationAmount = u_separation * animatedProgress * 0.01;
      
      // Добавляем волновое искажение при анимации
      vec2 waveOffset = u_animate ? waveDistortion(uv, animatedProgress) : vec2(0.0);
      
      // Получаем цвета с разделением каналов
      vec3 color1 = chromaticAberration(
        textureA, 
        uv + waveOffset, 
        direction, 
        separationAmount
      );
      
      vec3 color2 = chromaticAberration(
        textureB, 
        uv + waveOffset, 
        direction, 
        separationAmount
      );
      
      // Смешиваем изображения
      vec3 baseColor = mix(color1, color2, progress);
      
      // Добавляем дополнительную хроматическую аберрацию по краям
      if (u_aberration > 0.0) {
        float edgeDist = length(uv - vec2(0.5));
        float aberrationAmount = u_aberration * edgeDist * edgeDist * 0.02;
        
        vec2 radialDir = normalize(uv - vec2(0.5));
        vec3 aberratedColor = chromaticAberration(
          progress < 0.5 ? textureA : textureB,
          uv,
          radialDir,
          aberrationAmount * animatedProgress
        );
        
        baseColor = mix(baseColor, aberratedColor, 0.5);
      }
      
      // Добавляем цветовые искажения в переходной зоне
      float transitionZone = smoothstep(0.3, 0.7, progress);
      vec3 shiftedColor = vec3(
        baseColor.r * (1.0 + transitionZone * 0.1),
        baseColor.g * (1.0 - transitionZone * 0.05),
        baseColor.b * (1.0 + transitionZone * 0.15)
      );
      
      // Финальное смешивание
      vec3 finalColor = mix(baseColor, shiftedColor, transitionZone * 0.5);
      
      // Добавляем легкое мерцание для усиления эффекта
      float flicker = 1.0 + sin(u_time * 30.0) * 0.02 * animatedProgress;
      finalColor *= flicker;
      
      fragColor = vec4(finalColor, 1.0);
    }`
  }

  private getDataCorruptionShader(): string {
    return `#version 300 es
    precision highp float;
    
    uniform sampler2D textureA;
    uniform sampler2D textureB;
    uniform vec2 resolution;
    uniform float progress;
    uniform float u_time;
    
    // Параметры повреждения данных
    uniform float u_corruptionLevel;
    uniform bool u_scanLines;
    uniform float u_noiseAmount;
    uniform bool u_pixelSort;
    
    in vec2 v_texCoord;
    out vec4 fragColor;
    
    // Генератор шума
    float random(vec2 st) {
      return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
    }
    
    // 2D шум
    float noise(vec2 st) {
      vec2 i = floor(st);
      vec2 f = fract(st);
      
      float a = random(i);
      float b = random(i + vec2(1.0, 0.0));
      float c = random(i + vec2(0.0, 1.0));
      float d = random(i + vec2(1.0, 1.0));
      
      vec2 u = f * f * (3.0 - 2.0 * f);
      
      return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
    }
    
    // Сканирующие линии
    float scanline(vec2 uv) {
      return sin(uv.y * 800.0) * 0.04;
    }
    
    // Эффект датамоша (повреждение данных)
    vec2 datamosh(vec2 uv, float amount) {
      float time = floor(u_time * 20.0) / 20.0;
      
      // Создаем блоки повреждения
      vec2 block = floor(uv * vec2(16.0, 9.0)) / vec2(16.0, 9.0);
      float blockNoise = random(block + time);
      
      if (blockNoise < amount) {
        // Смещаем блок
        vec2 offset = (random(block + time + 1.0) - 0.5) * 0.1;
        uv += offset;
        
        // Иногда дублируем предыдущий блок
        if (blockNoise < amount * 0.3) {
          uv.x = block.x;
        }
      }
      
      return uv;
    }
    
    // Сортировка пикселей (glitch art эффект)
    vec3 pixelSort(vec3 color, vec2 uv) {
      float threshold = 0.5 + sin(u_time) * 0.3;
      float brightness = dot(color, vec3(0.299, 0.587, 0.114));
      
      if (brightness > threshold) {
        // Сдвигаем яркие пиксели
        float shift = (brightness - threshold) * 0.5;
        vec2 shiftedUV = uv + vec2(shift * sin(uv.y * 100.0), 0.0);
        
        // Смешиваем с соседними пикселями
        for (int i = 0; i < 5; i++) {
          vec2 sampleUV = shiftedUV + vec2(float(i) * 0.001, 0.0);
          vec3 sampleColor = texture(progress < 0.5 ? textureA : textureB, sampleUV).rgb;
          color = mix(color, sampleColor, 0.2);
        }
      }
      
      return color;
    }
    
    // Цифровой шум
    vec3 digitalNoise(vec3 color, vec2 uv, float amount) {
      float noiseVal = random(uv + u_time) * amount;
      
      // Битовые ошибки
      if (noiseVal > 0.9) {
        // Полное искажение пикселя
        return vec3(random(uv + u_time + 1.0), random(uv + u_time + 2.0), random(uv + u_time + 3.0));
      } else if (noiseVal > 0.7) {
        // Частичное искажение
        color.r = fract(color.r * 256.0) / 256.0;
        color.g = fract(color.g * 128.0) / 128.0;
        color.b = fract(color.b * 64.0) / 64.0;
      }
      
      return color;
    }
    
    void main() {
      vec2 uv = v_texCoord;
      
      // Применяем датамош эффект
      vec2 corruptedUV = datamosh(uv, u_corruptionLevel * progress);
      
      // Получаем базовые цвета
      vec4 color1 = texture(textureA, corruptedUV);
      vec4 color2 = texture(textureB, corruptedUV);
      
      // Смешиваем с учетом прогресса
      vec3 baseColor = mix(color1.rgb, color2.rgb, progress);
      
      // Применяем сортировку пикселей
      if (u_pixelSort) {
        baseColor = pixelSort(baseColor, uv);
      }
      
      // Добавляем цифровой шум
      baseColor = digitalNoise(baseColor, uv, u_noiseAmount);
      
      // Добавляем сканирующие линии
      if (u_scanLines) {
        baseColor -= scanline(uv) * (1.0 - abs(progress - 0.5) * 2.0);
      }
      
      // Эффект компрессии
      float compression = sin(progress * 3.14159);
      vec3 compressedColor = floor(baseColor * (4.0 + compression * 12.0)) / (4.0 + compression * 12.0);
      baseColor = mix(baseColor, compressedColor, u_corruptionLevel);
      
      // Случайные полосы искажения
      float stripNoise = random(vec2(floor(uv.y * 50.0), u_time * 10.0));
      if (stripNoise > 0.95) {
        baseColor = 1.0 - baseColor;
      }
      
      // Артефакты макроблоков
      vec2 macroblock = floor(uv * 32.0) / 32.0;
      float macroblockNoise = random(macroblock + u_time);
      if (macroblockNoise > 0.98 && progress > 0.2 && progress < 0.8) {
        baseColor = vec3(macroblockNoise);
      }
      
      fragColor = vec4(baseColor, 1.0);
    }`
  }
  private getAnalogDistortionShader(): string {
    return `#version 300 es
    precision highp float;
    
    uniform sampler2D textureA;
    uniform sampler2D textureB;
    uniform vec2 resolution;
    uniform float progress;
    uniform float u_time;
    uniform float u_tracking;
    uniform float u_jitter;
    uniform float u_colorBleed;
    uniform float u_static;
    
    in vec2 v_texCoord;
    out vec4 fragColor;
    
    float random(vec2 st) {
      return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
    }
    
    vec2 vhsTracking(vec2 uv, float amount) {
      float time = floor(u_time * 10.0) / 10.0;
      float trackingLine = step(0.98, random(vec2(uv.y * 20.0, time)));
      float offset = 0.0;
      if (trackingLine > 0.0) {
        offset = (random(vec2(uv.y, time)) - 0.5) * amount * 0.1;
      }
      float verticalShift = sin(uv.y * 100.0 + u_time * 10.0) * amount * 0.002;
      return vec2(uv.x + offset, uv.y + verticalShift);
    }
    
    vec3 colorBleed(sampler2D tex, vec2 uv, float amount) {
      float offset = amount * 0.002;
      float r = texture(tex, uv - vec2(offset, 0.0)).r;
      float g = texture(tex, uv).g;
      float b = texture(tex, uv + vec2(offset, 0.0)).b;
      return vec3(r, g, b);
    }
    
    void main() {
      vec2 uv = v_texCoord;
      vec2 trackedUV = vhsTracking(uv, u_tracking * progress);
      vec3 color1 = colorBleed(textureA, trackedUV, u_colorBleed);
      vec3 color2 = colorBleed(textureB, trackedUV, u_colorBleed);
      vec3 baseColor = mix(color1, color2, progress);
      float noise = random(uv + u_time * 100.0) * u_static * 0.1;
      baseColor += vec3(noise);
      fragColor = vec4(baseColor, 1.0);
    }`
  }

  private getSignalInterferenceShader(): string {
    return `#version 300 es
    precision highp float;
    
    uniform sampler2D textureA;
    uniform sampler2D textureB;
    uniform vec2 resolution;
    uniform float progress;
    uniform float u_time;
    uniform float u_waveFrequency;
    uniform float u_waveAmplitude;
    uniform float u_ghosting;
    uniform float u_sync;
    
    in vec2 v_texCoord;
    out vec4 fragColor;
    
    float random(vec2 st) {
      return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
    }
    
    vec2 sineWaveDistortion(vec2 uv, float frequency, float amplitude) {
      float phase = u_time * 2.0;
      float waveX = sin(uv.y * frequency + phase) * amplitude;
      float waveY = sin(uv.x * frequency * 0.7 + phase * 1.3) * amplitude * 0.3;
      return vec2(uv.x + waveX, uv.y + waveY);
    }
    
    vec3 applyGhosting(sampler2D tex, vec2 uv, float amount) {
      vec3 color = texture(tex, uv).rgb;
      float offset1 = 0.01 * amount;
      vec3 ghost1 = texture(tex, uv + vec2(offset1, 0.0)).rgb * 0.5;
      vec3 ghost2 = texture(tex, uv + vec2(offset1 * 2.0, offset1 * 0.5)).rgb * 0.3;
      return color * 0.7 + ghost1 + ghost2;
    }
    
    void main() {
      vec2 uv = v_texCoord;
      vec2 distortedUV = sineWaveDistortion(uv, u_waveFrequency, u_waveAmplitude * progress * 0.01);
      vec3 color1 = applyGhosting(textureA, distortedUV, u_ghosting);
      vec3 color2 = applyGhosting(textureB, distortedUV, u_ghosting);
      vec3 baseColor = mix(color1, color2, progress);
      float noise = random(uv + u_time) * 0.05 * (1.0 - u_sync);
      baseColor += noise;
      fragColor = vec4(baseColor, 1.0);
    }`
  }

  private getPixelStormShader(): string {
    return `#version 300 es
    precision highp float;
    
    uniform sampler2D textureA;
    uniform sampler2D textureB;
    uniform vec2 resolution;
    uniform float progress;
    uniform float u_time;
    uniform float u_pixelSize;
    uniform float u_chaos;
    uniform float u_speed;
    uniform bool u_colorMix;
    
    in vec2 v_texCoord;
    out vec4 fragColor;
    
    float random(vec2 st) {
      return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
    }
    
    float noise(vec2 st) {
      vec2 i = floor(st);
      vec2 f = fract(st);
      float a = random(i);
      float b = random(i + vec2(1.0, 0.0));
      float c = random(i + vec2(0.0, 1.0));
      float d = random(i + vec2(1.0, 1.0));
      vec2 u = f * f * (3.0 - 2.0 * f);
      return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
    }
    
    vec2 pixelVelocity(vec2 pos, float chaos) {
      float angle = noise(pos * 5.0 + u_time * u_speed) * 6.28318;
      float magnitude = noise(pos * 3.0 + u_time * u_speed * 0.7) * chaos;
      return vec2(cos(angle), sin(angle)) * magnitude;
    }
    
    void main() {
      vec2 uv = v_texCoord;
      vec2 pixelCoord = floor(uv * resolution / u_pixelSize) * u_pixelSize / resolution;
      vec2 velocity = pixelVelocity(pixelCoord, u_chaos);
      pixelCoord += velocity * 0.1 * progress;
      pixelCoord = clamp(pixelCoord, vec2(0.0), vec2(1.0));
      
      vec3 color1 = texture(textureA, pixelCoord).rgb;
      vec3 color2 = texture(textureB, pixelCoord).rgb;
      vec3 baseColor = mix(color1, color2, progress);
      
      if (u_colorMix && u_chaos > 0.5) {
        float colorShift = noise(pixelCoord * 20.0 + u_time * u_speed * 2.0);
        baseColor = vec3(
          baseColor.r * (1.0 + colorShift * 0.2),
          baseColor.g * (1.0 - colorShift * 0.1),
          baseColor.b * (1.0 + colorShift * 0.15)
        );
      }
      
      fragColor = vec4(baseColor, 1.0);
    }`
  }

  private getCodecErrorShader(): string {
    return `#version 300 es
    precision highp float;
    
    uniform sampler2D textureA;
    uniform sampler2D textureB;
    uniform vec2 resolution;
    uniform float progress;
    uniform float u_time;
    uniform float u_macroblockSize;
    uniform float u_compressionArtifacts;
    uniform bool u_keyframeError;
    uniform float u_motionVector;
    
    in vec2 v_texCoord;
    out vec4 fragColor;
    
    float random(vec2 st) {
      return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
    }
    
    vec3 quantizeColor(vec3 color, float levels) {
      return floor(color * levels) / levels;
    }
    
    vec3 macroblockArtifacts(vec2 uv, vec3 color, float blockSize) {
      vec2 blockPos = floor(uv * resolution / blockSize) * blockSize / resolution;
      float blockNoise = random(blockPos + u_time * 0.1);
      
      if (blockNoise < u_compressionArtifacts * 0.3) {
        return vec3(random(blockPos + 1.0), random(blockPos + 2.0), random(blockPos + 3.0));
      } else if (blockNoise < u_compressionArtifacts) {
        vec3 avgColor = texture(progress < 0.5 ? textureA : textureB, blockPos).rgb;
        return quantizeColor(avgColor, 4.0 + random(blockPos + 3.0) * 4.0);
      }
      
      return color;
    }
    
    void main() {
      vec2 uv = v_texCoord;
      vec3 color1 = texture(textureA, uv).rgb;
      vec3 color2 = texture(textureB, uv).rgb;
      vec3 baseColor = mix(color1, color2, progress);
      
      baseColor = macroblockArtifacts(uv, baseColor, u_macroblockSize);
      
      float quantLevels = 32.0 - u_compressionArtifacts * 28.0;
      baseColor = quantizeColor(baseColor, quantLevels);
      
      fragColor = vec4(baseColor, 1.0);
    }`
  }

  private getMatrixRainShader(): string {
    return `#version 300 es
    precision highp float;
    
    uniform sampler2D textureA;
    uniform sampler2D textureB;
    uniform vec2 resolution;
    uniform float progress;
    uniform float u_time;
    uniform float u_density;
    uniform float u_speed;
    uniform vec3 u_colorTint;
    uniform bool u_textMode;
    
    in vec2 v_texCoord;
    out vec4 fragColor;
    
    float random(vec2 st) {
      return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
    }
    
    float matrixColumn(vec2 uv, float columnX, float offset) {
      float fallSpeed = u_speed * (0.5 + random(vec2(columnX)) * 0.5);
      float y = fract(uv.y - u_time * fallSpeed + offset);
      float trailLength = 0.3 + random(vec2(columnX, offset)) * 0.4;
      float fade = 1.0 - smoothstep(0.0, trailLength, y);
      float head = smoothstep(0.02, 0.0, y) * 2.0;
      float flicker = random(vec2(uv.y * 20.0, u_time * 10.0)) * 0.5 + 0.5;
      return (fade + head) * flicker;
    }
    
    float matrixRain(vec2 uv) {
      float rain = 0.0;
      float columns = u_density * 50.0;
      
      for (float i = 0.0; i < 50.0; i++) {
        if (i >= columns) break;
        float columnX = i / columns;
        float offset = random(vec2(i)) * 2.0;
        float columnWidth = 1.0 / columns;
        if (abs(uv.x - columnX) < columnWidth * 0.5) {
          rain += matrixColumn(uv, columnX, offset);
        }
      }
      return rain;
    }
    
    void main() {
      vec2 uv = v_texCoord;
      vec4 color1 = texture(textureA, uv);
      vec4 color2 = texture(textureB, uv);
      vec3 baseColor = mix(color1.rgb, color2.rgb, progress);
      
      float rain = matrixRain(uv);
      float effectStrength = sin(progress * 3.14159);
      rain *= effectStrength;
      
      vec3 matrixColor = u_colorTint * rain;
      vec3 finalColor = baseColor * (1.0 - rain * 0.8) + matrixColor;
      
      float glow = smoothstep(0.5, 1.0, rain);
      finalColor += u_colorTint * glow * 0.5;
      
      fragColor = vec4(finalColor, 1.0);
    }`
  }
  private getScreenTearShader(): string {
    return `#version 300 es
    precision highp float;
    
    uniform sampler2D textureA;
    uniform sampler2D textureB;
    uniform vec2 resolution;
    uniform float progress;
    uniform float u_time;
    uniform float u_tearCount;
    uniform float u_displacement;
    uniform float u_wobble;
    uniform bool u_flicker;
    
    in vec2 v_texCoord;
    out vec4 fragColor;
    
    float random(vec2 st) {
      return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
    }
    
    float getTearLine(float y, float index) {
      float speed = 0.5 + random(vec2(index)) * 2.0;
      float offset = random(vec2(index + 1.0));
      float tearPos = fract(offset + u_time * speed);
      float tearWidth = 0.002 + random(vec2(index + 2.0)) * 0.008;
      return smoothstep(tearPos - tearWidth, tearPos, y) * 
             smoothstep(tearPos + tearWidth, tearPos, y);
    }
    
    float getDisplacement(float y) {
      float displacement = 0.0;
      for (float i = 0.0; i < 10.0; i++) {
        if (i >= u_tearCount) break;
        float tearLine = getTearLine(y, i);
        if (tearLine > 0.0) {
          float direction = random(vec2(i + 3.0)) > 0.5 ? 1.0 : -1.0;
          float strength = random(vec2(i + 4.0)) * u_displacement;
          displacement += tearLine * direction * strength * 0.1;
        }
      }
      return displacement;
    }
    
    void main() {
      vec2 uv = v_texCoord;
      float displacement = getDisplacement(uv.y);
      vec2 tearUV = vec2(fract(uv.x + displacement * progress), uv.y);
      
      vec3 color1 = texture(textureA, tearUV).rgb;
      vec3 color2 = texture(textureB, tearUV).rgb;
      vec3 baseColor = mix(color1, color2, progress);
      
      if (u_flicker) {
        float flickerAmount = random(vec2(floor(u_time * 30.0)));
        if (flickerAmount > 0.9) {
          baseColor *= 0.5 + random(vec2(flickerAmount)) * 0.5;
        }
      }
      
      fragColor = vec4(baseColor, 1.0);
    }`
  }

  private getBitCrushShader(): string {
    return `#version 300 es
    precision highp float;
    
    uniform sampler2D textureA;
    uniform sampler2D textureB;
    uniform vec2 resolution;
    uniform float progress;
    uniform float u_time;
    uniform float u_bitDepth;
    uniform float u_colorPalette;
    uniform bool u_dithering;
    uniform float u_posterize;
    
    in vec2 v_texCoord;
    out vec4 fragColor;
    
    float random(vec2 st) {
      return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
    }
    
    vec3 quantizeColor(vec3 color, float levels) {
      return floor(color * levels + 0.5) / levels;
    }
    
    vec3 retroMode(vec3 color, float bitDepth) {
      if (bitDepth <= 1.0) {
        float luminance = dot(color, vec3(0.299, 0.587, 0.114));
        return vec3(step(0.5, luminance));
      } else if (bitDepth <= 2.0) {
        vec3 cga[4];
        cga[0] = vec3(0.0, 0.0, 0.0);
        cga[1] = vec3(0.0, 1.0, 1.0);
        cga[2] = vec3(1.0, 0.0, 1.0);
        cga[3] = vec3(1.0, 1.0, 1.0);
        
        float minDist = 999.0;
        vec3 closestColor = cga[0];
        for (int i = 0; i < 4; i++) {
          float dist = distance(color, cga[i]);
          if (dist < minDist) {
            minDist = dist;
            closestColor = cga[i];
          }
        }
        return closestColor;
      }
      
      float levels = pow(2.0, bitDepth);
      return quantizeColor(color, levels);
    }
    
    void main() {
      vec2 uv = v_texCoord;
      vec3 color1 = texture(textureA, uv).rgb;
      vec3 color2 = texture(textureB, uv).rgb;
      vec3 baseColor = mix(color1, color2, progress);
      
      vec3 crushedColor = retroMode(baseColor, u_bitDepth);
      
      if (u_posterize > 0.0) {
        float levels = mix(256.0, 4.0, u_posterize);
        crushedColor.r = floor(crushedColor.r * levels) / levels;
        crushedColor.g = floor(crushedColor.g * (levels * 0.8)) / (levels * 0.8);
        crushedColor.b = floor(crushedColor.b * (levels * 1.2)) / (levels * 1.2);
      }
      
      vec3 finalColor = mix(baseColor, crushedColor, sin(progress * 3.14159));
      
      float flicker = 1.0 + sin(u_time * 30.0) * 0.02 * (1.0 - u_bitDepth / 8.0);
      finalColor *= flicker;
      
      fragColor = vec4(finalColor, 1.0);
    }`
  }

  /**
   * Вспомогательные методы
   */
  private createShaderProgram(vertexSource: string, fragmentSource: string): WebGLProgram | null {
    if (!this.gl) return null

    const vertexShader = this.compileShader(this.gl.VERTEX_SHADER, vertexSource)
    const fragmentShader = this.compileShader(this.gl.FRAGMENT_SHADER, fragmentSource)

    if (!vertexShader || !fragmentShader) return null

    const program = this.gl.createProgram()
    if (!program) return null

    this.gl.attachShader(program, vertexShader)
    this.gl.attachShader(program, fragmentShader)
    this.gl.linkProgram(program)

    if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
      logger.error("Program link error", { log: this.gl.getProgramInfoLog(program) })
      return null
    }

    return program
  }

  private compileShader(type: number, source: string): WebGLShader | null {
    if (!this.gl) return null

    const shader = this.gl.createShader(type)
    if (!shader) return null

    this.gl.shaderSource(shader, source)
    this.gl.compileShader(shader)

    if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
      logger.error("Shader compilation error", { log: this.gl.getShaderInfoLog(shader) })
      return null
    }

    return shader
  }

  private setupVertexAttributes(program: WebGLProgram): void {
    if (!this.gl) return

    const positionBuffer = this.gl.createBuffer()
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, positionBuffer)
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), this.gl.STATIC_DRAW)

    const positionLocation = this.gl.getAttribLocation(program, "a_position")
    this.gl.enableVertexAttribArray(positionLocation)
    this.gl.vertexAttribPointer(positionLocation, 2, this.gl.FLOAT, false, 0, 0)

    const texCoordBuffer = this.gl.createBuffer()
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, texCoordBuffer)
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array([0, 0, 1, 0, 0, 1, 1, 1]), this.gl.STATIC_DRAW)

    const texCoordLocation = this.gl.getAttribLocation(program, "a_texCoord")
    this.gl.enableVertexAttribArray(texCoordLocation)
    this.gl.vertexAttribPointer(texCoordLocation, 2, this.gl.FLOAT, false, 0, 0)
  }

  private bindTextures(sourceTexture: WebGLTexture, targetTexture: WebGLTexture, program: WebGLProgram): void {
    if (!this.gl) return

    this.gl.activeTexture(this.gl.TEXTURE0)
    this.gl.bindTexture(this.gl.TEXTURE_2D, sourceTexture)
    const sourceLocation = this.gl.getUniformLocation(program, "textureA")
    this.gl.uniform1i(sourceLocation, 0)

    this.gl.activeTexture(this.gl.TEXTURE1)
    this.gl.bindTexture(this.gl.TEXTURE_2D, targetTexture)
    const targetLocation = this.gl.getUniformLocation(program, "textureB")
    this.gl.uniform1i(targetLocation, 1)
  }

  private cacheUniformLocations(shaderType: DynamicShaderType, program: WebGLProgram): void {
    if (!this.gl) return

    const commonUniforms = ["progress", "resolution", "textureA", "textureB"]

    const shaderSpecificUniforms: Record<DynamicShaderType, string[]> = {
      "particle-dissolve": ["particleCount", "particleSize", "gravity", "turbulence", "speed"],
      "liquid-morph": ["viscosity", "turbulence", "waveHeight", "waveFrequency", "tintColor"],
      "glass-shatter": ["impactPoint", "shardCount", "explosionForce", "gravity", "rotation"],
      "fire-burn": ["intensity", "spread", "turbulence", "height", "heatDistortion"],
      "organic-growth": ["growthPattern", "branches", "recursionDepth", "speed", "randomness"],
      "water-drop": ["dropPoint", "ripples", "amplitude", "frequency", "damping"],
      "smoke-reveal": ["density", "turbulence", "speed", "dissipation"],
      "tornado-twist": ["twistCenter", "rotationSpeed", "spiralTightness", "pullStrength"],
      "electric-discharge": ["branches", "intensity", "frequency", "color", "glow"],
      "crystal-formation": ["crystalPattern", "growthSpeed", "branches", "symmetry", "refraction"],
      "sand-dispersion": ["windForce", "gravity", "turbulence", "particleSize"],
      "magnetic-field": ["fieldStrength", "polarity", "distortion", "waves"],
      "bubble-pop": ["bubbleCount", "popSpeed", "surface", "refraction"],
      "ink-splash": ["splashPoint", "viscosity", "spread", "inkColor"],
      "paper-fold": ["foldAngle", "creaseSharpness", "layers", "shadows"],
      // Glitch effects
      "digital-glitch": ["u_blockSize", "u_intensity", "u_frequency", "u_colorShift", "u_time"],
      "rgb-split": ["u_separation", "u_angle", "u_animate", "u_aberration", "u_time"],
      "data-corruption": ["u_corruptionLevel", "u_scanLines", "u_noiseAmount", "u_pixelSort", "u_time"],
      "analog-distortion": ["tracking", "jitter", "colorBleed", "static"],
      "signal-interference": ["waveFrequency", "waveAmplitude", "ghosting", "sync"],
      "pixel-storm": ["pixelSize", "chaos", "speed", "colorMix"],
      "codec-error": ["macroblockSize", "compressionArtifacts", "keyframeError", "motionVector"],
      "matrix-rain": ["density", "speed", "colorTint", "textMode"],
      "screen-tear": ["tearCount", "displacement", "wobble", "flicker"],
      "bit-crush": ["bitDepth", "colorPalette", "dithering", "posterize"],
      // 3D effects
      "page-flip": ["u_flipDirection", "u_perspective", "u_curvature", "u_shadowIntensity", "u_time"],
      "card-shuffle": ["u_cardCount", "u_shufflePattern", "u_rotationChaos", "u_gravity", "u_time"],
      "helix-spin": ["u_helixTurns", "u_radius", "u_axis", "u_twist", "u_time"],
      "sphere-mapping": ["u_sphereRadius", "u_rotationSpeed", "u_lightPosition", "u_reflectivity", "u_time"],
      "book-open": ["openAngle", "spineThickness", "pageWarp"],
      "cylinder-roll": ["rollDirection", "cylinderRadius", "segments"],
      "origami-fold": ["foldPattern", "foldSteps", "precision"],
      "polyhedron-transform": ["polyhedronType", "morphSpeed", "facetDetail"],
      "mobius-strip": ["twists", "stripWidth", "topology"],
    }

    const uniforms = [...commonUniforms, ...(shaderSpecificUniforms[shaderType] || [])]

    for (const uniform of uniforms) {
      const location = this.gl.getUniformLocation(program, uniform)
      if (location) {
        this.uniformLocations.set(`${shaderType}_${uniform}`, location)
      }
    }
  }

  /**
   * Очистка ресурсов
   */
  public dispose(): void {
    if (!this.gl) return

    // Отменяем анимацию
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId)
    }

    // Удаляем шейдерные программы
    for (const program of this.shaderPrograms.values()) {
      this.gl.deleteProgram(program)
    }

    // Удаляем буферы
    for (const buffer of this.particleBuffers.values()) {
      this.gl.deleteBuffer(buffer)
    }

    // Удаляем фреймбуферы
    for (const framebuffer of this.frameBuffers.values()) {
      this.gl.deleteFramebuffer(framebuffer)
    }

    // Очищаем коллекции
    this.shaderPrograms.clear()
    this.particleBuffers.clear()
    this.frameBuffers.clear()
    this.computeShaders.clear()
    this.uniformLocations.clear()
    this.particleStates.clear()

    this.gl = null
  }

  // 3D shader methods
  private getPageFlipShader(): string {
    return `#version 300 es
    precision highp float;
    
    uniform sampler2D textureA;
    uniform sampler2D textureB;
    uniform vec2 resolution;
    uniform float progress;
    uniform float u_time;
    uniform float u_flipDirection;
    uniform float u_perspective;
    uniform float u_curvature;
    uniform float u_shadowIntensity;
    
    in vec2 v_texCoord;
    out vec4 fragColor;
    
    void main() {
      vec2 uv = v_texCoord;
      vec4 color1 = texture(textureA, uv);
      vec4 color2 = texture(textureB, uv);
      vec4 finalColor = mix(color1, color2, progress);
      fragColor = finalColor;
    }`
  }

  private getCardShuffleShader(): string {
    return `#version 300 es
    precision highp float;
    
    uniform sampler2D textureA;
    uniform sampler2D textureB;
    uniform vec2 resolution;
    uniform float progress;
    uniform float u_time;
    uniform float u_cardCount;
    uniform float u_shufflePattern;
    uniform float u_rotationChaos;
    uniform float u_gravity;
    
    in vec2 v_texCoord;
    out vec4 fragColor;
    
    void main() {
      vec2 uv = v_texCoord;
      vec4 color1 = texture(textureA, uv);
      vec4 color2 = texture(textureB, uv);
      vec4 finalColor = mix(color1, color2, progress);
      fragColor = finalColor;
    }`
  }

  private getHelixSpinShader(): string {
    return `#version 300 es
    precision highp float;
    
    uniform sampler2D textureA;
    uniform sampler2D textureB;
    uniform vec2 resolution;
    uniform float progress;
    uniform float u_time;
    uniform float u_helixTurns;
    uniform float u_radius;
    uniform float u_axis;
    uniform float u_twist;
    
    in vec2 v_texCoord;
    out vec4 fragColor;
    
    void main() {
      vec2 uv = v_texCoord;
      vec4 color1 = texture(textureA, uv);
      vec4 color2 = texture(textureB, uv);
      vec4 finalColor = mix(color1, color2, progress);
      fragColor = finalColor;
    }`
  }

  private getSphereMapShader(): string {
    return `#version 300 es
    precision highp float;
    
    uniform sampler2D textureA;
    uniform sampler2D textureB;
    uniform vec2 resolution;
    uniform float progress;
    uniform float u_time;
    uniform float u_sphereRadius;
    uniform float u_rotationSpeed;
    uniform vec3 u_lightPosition;
    uniform float u_reflectivity;
    
    in vec2 v_texCoord;
    out vec4 fragColor;
    
    void main() {
      vec2 uv = v_texCoord;
      vec4 color1 = texture(textureA, uv);
      vec4 color2 = texture(textureB, uv);
      vec4 finalColor = mix(color1, color2, progress);
      fragColor = finalColor;
    }`
  }

  // Заглушки для остальных 3D эффектов
  private getBookOpenShader(): string {
    return ""
  }
  private getCylinderRollShader(): string {
    return ""
  }
  private getOrigamiFoldShader(): string {
    return ""
  }
  private getPolyhedronTransformShader(): string {
    return ""
  }
  private getMobiusStripShader(): string {
    return ""
  }
}

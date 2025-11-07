/**
 * Live Filters Preview Service
 *
 * Система live предпросмотра фильтров:
 * - Color grading фильтры
 * - LUT (Look-Up Tables) применение
 * - Временные фильтры (цветовая коррекция по времени)
 * - Real-time обработка с WebGL
 */

export interface FilterLUT {
  name: string
  data: Float32Array // RGB lookup data
  size: number // LUT size (typically 32 or 64)
}

export interface FilterSettings {
  filterId: string
  enabled: boolean
  parameters: Record<string, any>
  intensity: number
  timeRange?: { start: number; end: number }
}

export interface ColorGradingParams {
  // Shadows, Midtones, Highlights
  shadows: { r: number; g: number; b: number }
  midtones: { r: number; g: number; b: number }
  highlights: { r: number; g: number; b: number }

  // Lift, Gamma, Gain
  lift: { r: number; g: number; b: number }
  gamma: { r: number; g: number; b: number }
  gain: { r: number; g: number; b: number }

  // Master controls
  exposure: number
  contrast: number
  saturation: number
  temperature: number // Color temperature in Kelvin
  tint: number

  // Curves (simplified as control points)
  rgbCurve: Array<{ x: number; y: number }>
  redCurve: Array<{ x: number; y: number }>
  greenCurve: Array<{ x: number; y: number }>
  blueCurve: Array<{ x: number; y: number }>
}

export class FiltersPreviewService {
  private static instance: FiltersPreviewService
  private canvas: HTMLCanvasElement | null = null
  private gl: WebGL2RenderingContext | null = null
  private programs = new Map<string, WebGLProgram>()
  private luts = new Map<string, FilterLUT>()
  private animationFrame: number | null = null

  static getInstance(): FiltersPreviewService {
    if (!FiltersPreviewService.instance) {
      FiltersPreviewService.instance = new FiltersPreviewService()
    }
    return FiltersPreviewService.instance
  }

  constructor() {
    this.initializeWebGL()
    this.loadDefaultLUTs()
    this.createFilterShaders()
  }

  /**
   * Инициализация WebGL2
   */
  private initializeWebGL(): void {
    try {
      // Skip initialization during SSR
      if (typeof document === "undefined") {
        logger.warn("Filters WebGL initialization skipped (SSR)")
        return
      }

      this.canvas = document.createElement("canvas")
      this.gl = this.canvas.getContext("webgl2", {
        premultipliedAlpha: false,
        preserveDrawingBuffer: true,
      })

      if (!this.gl) {
        throw new Error("WebGL2 not supported")
      }

      logger.info("Filters preview WebGL2 initialized")
    } catch (error) {
      logger.error("Filters WebGL initialization failed:", error)
    }
  }

  /**
   * Загрузка стандартных LUT таблиц
   */
  private loadDefaultLUTs(): void {
    // Создаем несколько базовых LUT

    // Identity LUT (no change)
    const identityLUT = this.generateIdentityLUT(32)
    this.luts.set("identity", {
      name: "Identity",
      data: identityLUT,
      size: 32,
    })

    // Cinematic LUT
    const cinematicLUT = this.generateCinematicLUT(32)
    this.luts.set("cinematic", {
      name: "Cinematic",
      data: cinematicLUT,
      size: 32,
    })

    // Warm LUT
    const warmLUT = this.generateWarmLUT(32)
    this.luts.set("warm", {
      name: "Warm",
      data: warmLUT,
      size: 32,
    })

    // Cool LUT
    const coolLUT = this.generateCoolLUT(32)
    this.luts.set("cool", {
      name: "Cool",
      data: coolLUT,
      size: 32,
    })

    // High Contrast LUT
    const highContrastLUT = this.generateHighContrastLUT(32)
    this.luts.set("high-contrast", {
      name: "High Contrast",
      data: highContrastLUT,
      size: 32,
    })
  }

  /**
   * Генерация Identity LUT
   */
  private generateIdentityLUT(size: number): Float32Array {
    const data = new Float32Array(size * size * size * 3)
    let index = 0

    for (let b = 0; b < size; b++) {
      for (let g = 0; g < size; g++) {
        for (let r = 0; r < size; r++) {
          data[index++] = r / (size - 1)
          data[index++] = g / (size - 1)
          data[index++] = b / (size - 1)
        }
      }
    }

    return data
  }

  /**
   * Генерация Cinematic LUT (теплые тона, пониженная насыщенность)
   */
  private generateCinematicLUT(size: number): Float32Array {
    const data = new Float32Array(size * size * size * 3)
    let index = 0

    for (let b = 0; b < size; b++) {
      for (let g = 0; g < size; g++) {
        for (let r = 0; r < size; r++) {
          let red = r / (size - 1)
          let green = g / (size - 1)
          let blue = b / (size - 1)

          // Cinematic look: тёплые тени, холодные света
          const luminance = 0.299 * red + 0.587 * green + 0.114 * blue

          if (luminance < 0.5) {
            // Shadows: добавляем тепло
            red = Math.min(1, red * 1.1)
            green = Math.min(1, green * 1.05)
            blue = Math.min(1, blue * 0.9)
          } else {
            // Highlights: немного охлаждаем
            red = Math.min(1, red * 0.95)
            green = Math.min(1, green * 1.0)
            blue = Math.min(1, blue * 1.1)
          }

          // Снижаем насыщенность
          const saturation = 0.8
          const gray = 0.299 * red + 0.587 * green + 0.114 * blue
          red = gray + saturation * (red - gray)
          green = gray + saturation * (green - gray)
          blue = gray + saturation * (blue - gray)

          data[index++] = Math.max(0, Math.min(1, red))
          data[index++] = Math.max(0, Math.min(1, green))
          data[index++] = Math.max(0, Math.min(1, blue))
        }
      }
    }

    return data
  }

  /**
   * Генерация Warm LUT
   */
  private generateWarmLUT(size: number): Float32Array {
    const data = new Float32Array(size * size * size * 3)
    let index = 0

    for (let b = 0; b < size; b++) {
      for (let g = 0; g < size; g++) {
        for (let r = 0; r < size; r++) {
          let red = r / (size - 1)
          let green = g / (size - 1)
          let blue = b / (size - 1)

          // Warm look: усиливаем красный и жёлтый
          red = Math.min(1, red * 1.15)
          green = Math.min(1, green * 1.1)
          blue = Math.min(1, blue * 0.85)

          data[index++] = red
          data[index++] = green
          data[index++] = blue
        }
      }
    }

    return data
  }

  /**
   * Генерация Cool LUT
   */
  private generateCoolLUT(size: number): Float32Array {
    const data = new Float32Array(size * size * size * 3)
    let index = 0

    for (let b = 0; b < size; b++) {
      for (let g = 0; g < size; g++) {
        for (let r = 0; r < size; r++) {
          let red = r / (size - 1)
          let green = g / (size - 1)
          let blue = b / (size - 1)

          // Cool look: усиливаем синий и циан
          red = Math.min(1, red * 0.85)
          green = Math.min(1, green * 1.05)
          blue = Math.min(1, blue * 1.2)

          data[index++] = red
          data[index++] = green
          data[index++] = blue
        }
      }
    }

    return data
  }

  /**
   * Генерация High Contrast LUT
   */
  private generateHighContrastLUT(size: number): Float32Array {
    const data = new Float32Array(size * size * size * 3)
    let index = 0

    for (let b = 0; b < size; b++) {
      for (let g = 0; g < size; g++) {
        for (let r = 0; r < size; r++) {
          let red = r / (size - 1)
          let green = g / (size - 1)
          let blue = b / (size - 1)

          // S-curve для контраста
          const applyCurve = (value: number): number => {
            if (value < 0.5) {
              return 2 * value * value
            }
            return 1 - 2 * (1 - value) * (1 - value)
          }

          red = applyCurve(red)
          green = applyCurve(green)
          blue = applyCurve(blue)

          data[index++] = red
          data[index++] = green
          data[index++] = blue
        }
      }
    }

    return data
  }

  /**
   * Создание шейдеров для фильтров
   */
  private createFilterShaders(): void {
    if (!this.gl) return

    // Color Grading Shader
    const colorGradingVertexShader = `#version 300 es
      in vec2 a_position;
      in vec2 a_texCoord;
      out vec2 v_texCoord;
      
      void main() {
        gl_Position = vec4(a_position, 0.0, 1.0);
        v_texCoord = a_texCoord;
      }
    `

    const colorGradingFragmentShader = `#version 300 es
      precision highp float;
      
      in vec2 v_texCoord;
      out vec4 fragColor;
      
      uniform sampler2D u_texture;
      uniform sampler3D u_lutTexture;
      uniform float u_lutIntensity;
      
      // Color grading parameters
      uniform vec3 u_shadows;
      uniform vec3 u_midtones;
      uniform vec3 u_highlights;
      uniform vec3 u_lift;
      uniform vec3 u_gamma;
      uniform vec3 u_gain;
      uniform float u_exposure;
      uniform float u_contrast;
      uniform float u_saturation;
      uniform float u_temperature;
      uniform float u_tint;
      uniform float u_intensity;
      
      vec3 colorTemperature(vec3 color, float temp) {
        // Simplified color temperature adjustment
        float t = temp / 6500.0; // Normalize around daylight
        
        vec3 warm = vec3(1.0, 0.9, 0.8);
        vec3 cool = vec3(0.8, 0.9, 1.0);
        
        return mix(color * cool, color * warm, t);
      }
      
      vec3 applyLiftGammaGain(vec3 color, vec3 lift, vec3 gamma, vec3 gain) {
        // Lift
        color = color + lift;
        
        // Gamma
        color = pow(max(vec3(0.0), color), 1.0 / gamma);
        
        // Gain
        color = color * gain;
        
        return color;
      }
      
      vec3 applyShadowMidtoneHighlight(vec3 color, vec3 shadows, vec3 midtones, vec3 highlights) {
        float luminance = dot(color, vec3(0.299, 0.587, 0.114));
        
        // Weight functions for shadows, midtones, highlights
        float shadowWeight = 1.0 - smoothstep(0.0, 0.5, luminance);
        float highlightWeight = smoothstep(0.5, 1.0, luminance);
        float midtoneWeight = 1.0 - shadowWeight - highlightWeight;
        
        vec3 result = color;
        result = mix(result, result * shadows, shadowWeight);
        result = mix(result, result * midtones, midtoneWeight);
        result = mix(result, result * highlights, highlightWeight);
        
        return result;
      }
      
      vec3 applyLUT(vec3 color, sampler3D lutTexture, float intensity) {
        vec3 lutColor = texture(lutTexture, color).rgb;
        return mix(color, lutColor, intensity);
      }
      
      void main() {
        vec4 color = texture(u_texture, v_texCoord);
        vec3 rgb = color.rgb;
        
        // Exposure
        rgb *= pow(2.0, u_exposure);
        
        // Color temperature
        rgb = colorTemperature(rgb, u_temperature);
        
        // Tint (green/magenta)
        rgb.g = mix(rgb.g, rgb.g * (1.0 + u_tint * 0.1), abs(u_tint));
        
        // Lift, Gamma, Gain
        rgb = applyLiftGammaGain(rgb, u_lift, u_gamma, u_gain);
        
        // Shadow/Midtone/Highlight
        rgb = applyShadowMidtoneHighlight(rgb, u_shadows, u_midtones, u_highlights);
        
        // Contrast
        rgb = ((rgb - 0.5) * u_contrast) + 0.5;
        
        // Saturation
        float luminance = dot(rgb, vec3(0.299, 0.587, 0.114));
        rgb = mix(vec3(luminance), rgb, u_saturation);
        
        // Apply LUT if available
        if (u_lutIntensity > 0.0) {
          rgb = applyLUT(clamp(rgb, 0.0, 1.0), u_lutTexture, u_lutIntensity);
        }
        
        // Mix with original
        rgb = mix(color.rgb, rgb, u_intensity);
        
        fragColor = vec4(clamp(rgb, 0.0, 1.0), color.a);
      }
    `

    this.createShaderProgram("color-grading", colorGradingVertexShader, colorGradingFragmentShader)
  }

  /**
   * Создание шейдерной программы
   */
  private createShaderProgram(name: string, vertexSource: string, fragmentSource: string): void {
    if (!this.gl) return

    const gl = this.gl

    const vertexShader = this.compileShader(gl.VERTEX_SHADER, vertexSource)
    const fragmentShader = this.compileShader(gl.FRAGMENT_SHADER, fragmentSource)

    if (!vertexShader || !fragmentShader) return

    const program = gl.createProgram()
    if (!program) return

    gl.attachShader(program, vertexShader)
    gl.attachShader(program, fragmentShader)
    gl.linkProgram(program)

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      logger.error(`${name} program linking error:`, gl.getProgramInfoLog(program))
      gl.deleteProgram(program)
      return
    }

    this.programs.set(name, program)
  }

  /**
   * Компиляция шейдера
   */
  private compileShader(type: number, source: string): WebGLShader | null {
    if (!this.gl) return null

    const shader = this.gl.createShader(type)
    if (!shader) return null

    this.gl.shaderSource(shader, source)
    this.gl.compileShader(shader)

    if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
      logger.error("Shader compilation error:", this.gl.getShaderInfoLog(shader))
      this.gl.deleteShader(shader)
      return null
    }

    return shader
  }

  /**
   * Создание 3D LUT текстуры
   */
  private create3DLUTTexture(lut: FilterLUT): WebGLTexture | null {
    if (!this.gl) return null

    const gl = this.gl
    const texture = gl.createTexture()
    if (!texture) return null

    gl.bindTexture(gl.TEXTURE_3D, texture)
    gl.texImage3D(
      gl.TEXTURE_3D,
      0, // level
      gl.RGB32F, // internal format
      lut.size, // width
      lut.size, // height
      lut.size, // depth
      0, // border
      gl.RGB, // format
      gl.FLOAT, // type
      lut.data,
    )

    gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_R, gl.CLAMP_TO_EDGE)

    return texture
  }

  /**
   * Применение color grading фильтра
   */
  async applyColorGrading(
    video: HTMLVideoElement,
    params: ColorGradingParams,
    lutId?: string,
    outputCanvas?: HTMLCanvasElement,
  ): Promise<boolean> {
    if (!this.gl || !this.canvas) return false

    const program = this.programs.get("color-grading")
    if (!program) return false

    try {
      const gl = this.gl

      // Устанавливаем размеры
      this.canvas.width = video.videoWidth || 1920
      this.canvas.height = video.videoHeight || 1080

      if (outputCanvas) {
        outputCanvas.width = this.canvas.width
        outputCanvas.height = this.canvas.height
      }

      gl.viewport(0, 0, this.canvas.width, this.canvas.height)

      // Создаем input texture
      const inputTexture = gl.createTexture()
      gl.bindTexture(gl.TEXTURE_2D, inputTexture)
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, video)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)

      // Создаем LUT texture если нужно
      let lutTexture: WebGLTexture | null = null
      let lutIntensity = 0

      if (lutId && this.luts.has(lutId)) {
        const lut = this.luts.get(lutId)!
        lutTexture = this.create3DLUTTexture(lut)
        lutIntensity = 1.0
      }

      gl.useProgram(program)

      // Геометрия fullscreen quad
      const positions = new Float32Array([-1, -1, 0, 0, 1, -1, 1, 0, -1, 1, 0, 1, -1, 1, 0, 1, 1, -1, 1, 0, 1, 1, 1, 1])

      const positionBuffer = gl.createBuffer()
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
      gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW)

      const positionLocation = gl.getAttribLocation(program, "a_position")
      const texCoordLocation = gl.getAttribLocation(program, "a_texCoord")

      gl.enableVertexAttribArray(positionLocation)
      gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 16, 0)

      gl.enableVertexAttribArray(texCoordLocation)
      gl.vertexAttribPointer(texCoordLocation, 2, gl.FLOAT, false, 16, 8)

      // Устанавливаем uniforms
      gl.uniform1i(gl.getUniformLocation(program, "u_texture"), 0)

      if (lutTexture) {
        gl.activeTexture(gl.TEXTURE1)
        gl.bindTexture(gl.TEXTURE_3D, lutTexture)
        gl.uniform1i(gl.getUniformLocation(program, "u_lutTexture"), 1)
        gl.uniform1f(gl.getUniformLocation(program, "u_lutIntensity"), lutIntensity)
      } else {
        gl.uniform1f(gl.getUniformLocation(program, "u_lutIntensity"), 0)
      }

      // Color grading parameters
      gl.uniform3fv(gl.getUniformLocation(program, "u_shadows"), [params.shadows.r, params.shadows.g, params.shadows.b])
      gl.uniform3fv(gl.getUniformLocation(program, "u_midtones"), [
        params.midtones.r,
        params.midtones.g,
        params.midtones.b,
      ])
      gl.uniform3fv(gl.getUniformLocation(program, "u_highlights"), [
        params.highlights.r,
        params.highlights.g,
        params.highlights.b,
      ])
      gl.uniform3fv(gl.getUniformLocation(program, "u_lift"), [params.lift.r, params.lift.g, params.lift.b])
      gl.uniform3fv(gl.getUniformLocation(program, "u_gamma"), [params.gamma.r, params.gamma.g, params.gamma.b])
      gl.uniform3fv(gl.getUniformLocation(program, "u_gain"), [params.gain.r, params.gain.g, params.gain.b])
      gl.uniform1f(gl.getUniformLocation(program, "u_exposure"), params.exposure)
      gl.uniform1f(gl.getUniformLocation(program, "u_contrast"), params.contrast)
      gl.uniform1f(gl.getUniformLocation(program, "u_saturation"), params.saturation)
      gl.uniform1f(gl.getUniformLocation(program, "u_temperature"), params.temperature)
      gl.uniform1f(gl.getUniformLocation(program, "u_tint"), params.tint)
      gl.uniform1f(gl.getUniformLocation(program, "u_intensity"), 1.0)

      // Рендерим
      gl.drawArrays(gl.TRIANGLES, 0, 6)

      // Копируем в output canvas
      if (outputCanvas) {
        const ctx = outputCanvas.getContext("2d")
        if (ctx) {
          ctx.drawImage(this.canvas, 0, 0)
        }
      }

      // Очищаем ресурсы
      gl.deleteTexture(inputTexture)
      if (lutTexture) gl.deleteTexture(lutTexture)
      gl.deleteBuffer(positionBuffer)

      return true
    } catch (error) {
      logger.error("Color grading failed:", error)
      return false
    }
  }

  /**
   * Получение списка доступных LUT
   */
  getAvailableLUTs(): Array<{ id: string; name: string }> {
    return Array.from(this.luts.entries()).map(([id, lut]) => ({
      id,
      name: lut.name,
    }))
  }

  /**
   * Загрузка пользовательского LUT
   */
  async loadCustomLUT(id: string, name: string, lutData: Float32Array, size: number): Promise<boolean> {
    try {
      this.luts.set(id, {
        name,
        data: lutData,
        size,
      })
      return true
    } catch (error) {
      logger.error("Custom LUT loading failed:", error)
      return false
    }
  }

  /**
   * Создание стандартных параметров color grading
   */
  getDefaultColorGradingParams(): ColorGradingParams {
    return {
      shadows: { r: 1.0, g: 1.0, b: 1.0 },
      midtones: { r: 1.0, g: 1.0, b: 1.0 },
      highlights: { r: 1.0, g: 1.0, b: 1.0 },
      lift: { r: 0.0, g: 0.0, b: 0.0 },
      gamma: { r: 1.0, g: 1.0, b: 1.0 },
      gain: { r: 1.0, g: 1.0, b: 1.0 },
      exposure: 0.0,
      contrast: 1.0,
      saturation: 1.0,
      temperature: 6500, // Daylight
      tint: 0.0,
      rgbCurve: [
        { x: 0, y: 0 },
        { x: 1, y: 1 },
      ],
      redCurve: [
        { x: 0, y: 0 },
        { x: 1, y: 1 },
      ],
      greenCurve: [
        { x: 0, y: 0 },
        { x: 1, y: 1 },
      ],
      blueCurve: [
        { x: 0, y: 0 },
        { x: 1, y: 1 },
      ],
    }
  }

  /**
   * Очистка ресурсов
   */
  dispose(): void {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame)
      this.animationFrame = null
    }

    if (this.gl) {
      for (const program of this.programs.values()) {
        this.gl.deleteProgram(program)
      }
      this.programs.clear()
    }

    this.canvas = null
    this.gl = null
    this.luts.clear()
  }
}

// Lazy initialization to avoid SSR issues
export const getFiltersPreviewService = () => FiltersPreviewService.getInstance()

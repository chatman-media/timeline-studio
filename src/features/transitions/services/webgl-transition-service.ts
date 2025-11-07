import type { Transition } from "@/features/transitions/types/transitions"
import { createLogger } from "@/lib/tauri-logger"

const logger = createLogger("WebGLTransitionService")

/**
 * Параметры для рендеринга перехода
 */
interface TransitionRenderParams {
  canvas: HTMLCanvasElement
  sourceTexture: WebGLTexture
  targetTexture: WebGLTexture
  progress: number // 0.0 - 1.0
  parameters: Transition["parameters"]
}

/**
 * Результат рендеринга
 */
interface RenderResult {
  success: boolean
  error?: string
  renderTime?: number
}

/**
 * Базовые WebGL шейдеры
 */
const VERTEX_SHADER_SOURCE = `
attribute vec2 a_position;
attribute vec2 a_texCoord;
varying vec2 v_texCoord;

void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
  v_texCoord = a_texCoord;
}
`

/**
 * Шейдер для размытия
 */
const BLUR_FRAGMENT_SHADER = `
precision mediump float;
uniform sampler2D u_sourceTexture;
uniform sampler2D u_targetTexture;
uniform float u_progress;
uniform float u_blurAmount;
uniform int u_blurType; // 0=gaussian, 1=motion, 2=radial
uniform vec2 u_resolution;
varying vec2 v_texCoord;

vec4 gaussianBlur(sampler2D tex, vec2 coord, float amount) {
  vec2 texelSize = 1.0 / u_resolution;
  vec4 color = vec4(0.0);
  float total = 0.0;
  
  for (int x = -4; x <= 4; x++) {
    for (int y = -4; y <= 4; y++) {
      vec2 offset = vec2(float(x), float(y)) * texelSize * amount;
      float weight = exp(-0.5 * (float(x*x + y*y)) / 2.0);
      color += texture2D(tex, coord + offset) * weight;
      total += weight;
    }
  }
  
  return color / total;
}

vec4 motionBlur(sampler2D tex, vec2 coord, float amount) {
  vec4 color = vec4(0.0);
  int samples = 8;
  
  for (int i = 0; i < 8; i++) {
    float offset = (float(i) - 3.5) / 8.0 * amount * 0.01;
    color += texture2D(tex, coord + vec2(offset, 0.0));
  }
  
  return color / float(samples);
}

vec4 radialBlur(sampler2D tex, vec2 coord, float amount) {
  vec2 center = vec2(0.5, 0.5);
  vec2 dir = coord - center;
  vec4 color = vec4(0.0);
  int samples = 8;
  
  for (int i = 0; i < 8; i++) {
    float scale = 1.0 - (float(i) / float(samples)) * amount * 0.01;
    color += texture2D(tex, center + dir * scale);
  }
  
  return color / float(samples);
}

void main() {
  vec4 sourceColor = texture2D(u_sourceTexture, v_texCoord);
  vec4 targetColor = texture2D(u_targetTexture, v_texCoord);
  
  // Применяем размытие к исходному изображению
  vec4 blurredSource;
  if (u_blurType == 0) {
    blurredSource = gaussianBlur(u_sourceTexture, v_texCoord, u_blurAmount);
  } else if (u_blurType == 1) {
    blurredSource = motionBlur(u_sourceTexture, v_texCoord, u_blurAmount);
  } else {
    blurredSource = radialBlur(u_sourceTexture, v_texCoord, u_blurAmount);
  }
  
  // Смешиваем с учетом прогресса
  gl_FragColor = mix(blurredSource, targetColor, u_progress);
}
`

/**
 * Шейдер для цветовых эффектов
 */
const COLOR_FRAGMENT_SHADER = `
precision mediump float;
uniform sampler2D u_sourceTexture;
uniform sampler2D u_targetTexture;
uniform float u_progress;
uniform vec3 u_colorTint;
uniform float u_saturation;
uniform float u_brightness;
uniform vec2 u_resolution;
varying vec2 v_texCoord;

vec3 rgb2hsv(vec3 c) {
  vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
  vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
  vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));
  
  float d = q.x - min(q.w, q.y);
  float e = 1.0e-10;
  return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
}

vec3 hsv2rgb(vec3 c) {
  vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
  vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
  return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

vec4 adjustColor(vec4 color, vec3 tint, float saturation, float brightness) {
  // Применяем оттенок
  vec3 tinted = color.rgb * tint;
  
  // Настраиваем насыщенность
  vec3 hsv = rgb2hsv(tinted);
  hsv.y = clamp(hsv.y + saturation * 0.01, 0.0, 1.0);
  tinted = hsv2rgb(hsv);
  
  // Настраиваем яркость
  tinted = clamp(tinted + brightness * 0.01, 0.0, 1.0);
  
  return vec4(tinted, color.a);
}

void main() {
  vec4 sourceColor = texture2D(u_sourceTexture, v_texCoord);
  vec4 targetColor = texture2D(u_targetTexture, v_texCoord);
  
  // Применяем цветовые эффекты к исходному изображению
  vec4 adjustedSource = adjustColor(sourceColor, u_colorTint, u_saturation, u_brightness);
  
  // Смешиваем с учетом прогресса
  gl_FragColor = mix(adjustedSource, targetColor, u_progress);
}
`

/**
 * Сервис для WebGL рендеринга переходов
 */
export class WebGLTransitionService {
  private gl: WebGLRenderingContext | null = null
  private shaderPrograms = new Map<string, WebGLProgram>()
  private vertexBuffer: WebGLBuffer | null = null
  private texCoordBuffer: WebGLBuffer | null = null

  /**
   * Инициализация WebGL контекста
   */
  public initialize(canvas: HTMLCanvasElement): boolean {
    try {
      this.gl = (canvas.getContext("webgl") || canvas.getContext("experimental-webgl")) as WebGLRenderingContext | null

      if (!this.gl) {
        logger.error("WebGL not supported")
        return false
      }

      // Создаем буферы для геометрии полноэкранного четырехугольника
      this.createBuffers()

      // Компилируем основные шейдеры
      this.compileShaders()

      return true
    } catch (error) {
      logger.error("WebGL initialization error", { error })
      return false
    }
  }

  /**
   * Рендеринг перехода
   */
  public async renderTransition(params: TransitionRenderParams): Promise<RenderResult> {
    if (!this.gl) {
      return { success: false, error: "WebGL не инициализирован" }
    }

    const startTime = performance.now()

    try {
      const { canvas, sourceTexture, targetTexture, progress, parameters } = params

      // Настраиваем viewport
      this.gl.viewport(0, 0, canvas.width, canvas.height)
      this.gl.clear(this.gl.COLOR_BUFFER_BIT)

      // Выбираем подходящий шейдер
      const shaderName = this.selectShader(parameters)
      const program = this.shaderPrograms.get(shaderName)

      if (!program) {
        return { success: false, error: `Шейдер ${shaderName} не найден` }
      }

      this.gl.useProgram(program)

      // Настраиваем атрибуты и uniform'ы
      this.setupAttributes(program)
      this.setupUniforms(program, params)

      // Биндим текстуры
      this.bindTextures(sourceTexture, targetTexture)

      // Рендерим
      this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4)

      const renderTime = performance.now() - startTime
      return { success: true, renderTime }
    } catch (error) {
      logger.error("Transition render error", { error })
      return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
    }
  }

  /**
   * Создание текстуры из изображения
   */
  public createTextureFromImage(image: HTMLImageElement): WebGLTexture | null {
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
   * Создание буферов для геометрии
   */
  private createBuffers(): void {
    if (!this.gl) return

    // Вершины полноэкранного четырехугольника
    const vertices = new Float32Array([-1.0, -1.0, 1.0, -1.0, -1.0, 1.0, 1.0, 1.0])

    this.vertexBuffer = this.gl.createBuffer()
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer)
    this.gl.bufferData(this.gl.ARRAY_BUFFER, vertices, this.gl.STATIC_DRAW)

    // Текстурные координаты
    const texCoords = new Float32Array([0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 1.0, 1.0])

    this.texCoordBuffer = this.gl.createBuffer()
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.texCoordBuffer)
    this.gl.bufferData(this.gl.ARRAY_BUFFER, texCoords, this.gl.STATIC_DRAW)
  }

  /**
   * Компиляция шейдеров
   */
  private compileShaders(): void {
    if (!this.gl) return

    // Компилируем шейдер для размытия
    const blurProgram = this.createShaderProgram(VERTEX_SHADER_SOURCE, BLUR_FRAGMENT_SHADER)
    if (blurProgram) {
      this.shaderPrograms.set("blur", blurProgram)
    }

    // Компилируем шейдер для цветовых эффектов
    const colorProgram = this.createShaderProgram(VERTEX_SHADER_SOURCE, COLOR_FRAGMENT_SHADER)
    if (colorProgram) {
      this.shaderPrograms.set("color", colorProgram)
    }
  }

  /**
   * Создание шейдерной программы
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
      logger.error("Shader program link error", { log: this.gl.getProgramInfoLog(program) })
      this.gl.deleteProgram(program)
      return null
    }

    return program
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
      logger.error("Shader compilation error", { log: this.gl.getShaderInfoLog(shader) })
      this.gl.deleteShader(shader)
      return null
    }

    return shader
  }

  /**
   * Выбор подходящего шейдера на основе параметров
   */
  private selectShader(parameters?: Transition["parameters"]): string {
    if (parameters?.blur?.enabled) {
      return "blur"
    }
    if (parameters?.color?.enabled) {
      return "color"
    }
    return "blur" // Fallback
  }

  /**
   * Настройка атрибутов шейдера
   */
  private setupAttributes(program: WebGLProgram): void {
    if (!this.gl) return

    // Позиции вершин
    const positionLocation = this.gl.getAttribLocation(program, "a_position")
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer)
    this.gl.enableVertexAttribArray(positionLocation)
    this.gl.vertexAttribPointer(positionLocation, 2, this.gl.FLOAT, false, 0, 0)

    // Текстурные координаты
    const texCoordLocation = this.gl.getAttribLocation(program, "a_texCoord")
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.texCoordBuffer)
    this.gl.enableVertexAttribArray(texCoordLocation)
    this.gl.vertexAttribPointer(texCoordLocation, 2, this.gl.FLOAT, false, 0, 0)
  }

  /**
   * Настройка uniform переменных
   */
  private setupUniforms(program: WebGLProgram, params: TransitionRenderParams): void {
    if (!this.gl) return

    const { progress, parameters } = params

    // Базовые uniform'ы
    const progressLocation = this.gl.getUniformLocation(program, "u_progress")
    this.gl.uniform1f(progressLocation, progress)

    const resolutionLocation = this.gl.getUniformLocation(program, "u_resolution")
    this.gl.uniform2f(resolutionLocation, params.canvas.width, params.canvas.height)

    // Uniform'ы для размытия
    if (parameters?.blur?.enabled) {
      const blurAmountLocation = this.gl.getUniformLocation(program, "u_blurAmount")
      this.gl.uniform1f(blurAmountLocation, (parameters.blur.amount || 0) / 100)

      const blurTypeLocation = this.gl.getUniformLocation(program, "u_blurType")
      const blurTypeIndex = parameters.blur.type === "motion" ? 1 : parameters.blur.type === "radial" ? 2 : 0
      this.gl.uniform1i(blurTypeLocation, blurTypeIndex)
    }

    // Uniform'ы для цвета
    if (parameters?.color?.enabled) {
      const colorTintLocation = this.gl.getUniformLocation(program, "u_colorTint")
      const tint = this.hexToRgb(parameters.color.tint || "#FFFFFF")
      this.gl.uniform3f(colorTintLocation, tint.r, tint.g, tint.b)

      const saturationLocation = this.gl.getUniformLocation(program, "u_saturation")
      this.gl.uniform1f(saturationLocation, parameters.color.saturation || 0)

      const brightnessLocation = this.gl.getUniformLocation(program, "u_brightness")
      this.gl.uniform1f(brightnessLocation, parameters.color.brightness || 0)
    }
  }

  /**
   * Привязка текстур
   */
  private bindTextures(sourceTexture: WebGLTexture, targetTexture: WebGLTexture): void {
    if (!this.gl) return

    // Исходная текстура
    this.gl.activeTexture(this.gl.TEXTURE0)
    this.gl.bindTexture(this.gl.TEXTURE_2D, sourceTexture)

    // Целевая текстура
    this.gl.activeTexture(this.gl.TEXTURE1)
    this.gl.bindTexture(this.gl.TEXTURE_2D, targetTexture)
  }

  /**
   * Конвертация hex цвета в RGB
   */
  private hexToRgb(hex: string): { r: number; g: number; b: number } {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result
      ? {
          r: Number.parseInt(result[1], 16) / 255,
          g: Number.parseInt(result[2], 16) / 255,
          b: Number.parseInt(result[3], 16) / 255,
        }
      : { r: 1, g: 1, b: 1 }
  }

  /**
   * Освобождение ресурсов
   */
  public dispose(): void {
    if (!this.gl) return

    // Удаляем шейдерные программы
    this.shaderPrograms.forEach((program) => {
      this.gl?.deleteProgram(program)
    })
    this.shaderPrograms.clear()

    // Удаляем буферы
    if (this.vertexBuffer) {
      this.gl.deleteBuffer(this.vertexBuffer)
      this.vertexBuffer = null
    }

    if (this.texCoordBuffer) {
      this.gl.deleteBuffer(this.texCoordBuffer)
      this.texCoordBuffer = null
    }

    this.gl = null
  }
}

// Глобальный экземпляр сервиса
export const webglTransitionService = new WebGLTransitionService()

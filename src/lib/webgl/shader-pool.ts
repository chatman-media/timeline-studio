/**
 * Пул шейдеров для повторного использования
 * Избегает дублирования компиляции шейдеров
 */

import { createLogger } from "../tauri-logger"
import { contextManager } from "./context-manager"

const logger = createLogger("ShaderPool")

/**
 * Описание шейдера
 */
export interface ShaderSource {
  vertex: string
  fragment: string
}

/**
 * Скомпилированная шейдерная программа
 */
export interface ShaderProgram {
  program: WebGLProgram
  uniformLocations: Map<string, WebGLUniformLocation>
  attributeLocations: Map<string, number>
  uniformBlockIndices: Map<string, number>
  refCount: number
}

/**
 * Встроенные шейдеры
 */
export const BUILTIN_SHADERS = {
  // Базовый шейдер для копирования текстуры
  copy: {
    vertex: `#version 300 es
      in vec2 a_position;
      in vec2 a_texCoord;
      out vec2 v_texCoord;
      
      void main() {
        gl_Position = vec4(a_position, 0.0, 1.0);
        v_texCoord = a_texCoord;
      }`,
    fragment: `#version 300 es
      precision highp float;
      
      uniform sampler2D u_texture;
      in vec2 v_texCoord;
      out vec4 fragColor;
      
      void main() {
        fragColor = texture(u_texture, v_texCoord);
      }`,
  },

  // Шейдер для смешивания двух текстур
  blend: {
    vertex: `#version 300 es
      in vec2 a_position;
      in vec2 a_texCoord;
      out vec2 v_texCoord;
      
      void main() {
        gl_Position = vec4(a_position, 0.0, 1.0);
        v_texCoord = a_texCoord;
      }`,
    fragment: `#version 300 es
      precision highp float;
      
      uniform sampler2D u_texture0;
      uniform sampler2D u_texture1;
      uniform float u_mixAmount;
      uniform int u_blendMode; // 0=normal, 1=add, 2=multiply, 3=screen
      
      in vec2 v_texCoord;
      out vec4 fragColor;
      
      vec4 blendNormal(vec4 a, vec4 b, float amount) {
        return mix(a, b, amount);
      }
      
      vec4 blendAdd(vec4 a, vec4 b, float amount) {
        return a + b * amount;
      }
      
      vec4 blendMultiply(vec4 a, vec4 b, float amount) {
        return mix(a, a * b, amount);
      }
      
      vec4 blendScreen(vec4 a, vec4 b, float amount) {
        return mix(a, 1.0 - (1.0 - a) * (1.0 - b), amount);
      }
      
      void main() {
        vec4 color0 = texture(u_texture0, v_texCoord);
        vec4 color1 = texture(u_texture1, v_texCoord);
        
        if (u_blendMode == 1) {
          fragColor = blendAdd(color0, color1, u_mixAmount);
        } else if (u_blendMode == 2) {
          fragColor = blendMultiply(color0, color1, u_mixAmount);
        } else if (u_blendMode == 3) {
          fragColor = blendScreen(color0, color1, u_mixAmount);
        } else {
          fragColor = blendNormal(color0, color1, u_mixAmount);
        }
      }`,
  },

  // Шейдер для цветокоррекции
  colorCorrection: {
    vertex: `#version 300 es
      in vec2 a_position;
      in vec2 a_texCoord;
      out vec2 v_texCoord;
      
      void main() {
        gl_Position = vec4(a_position, 0.0, 1.0);
        v_texCoord = a_texCoord;
      }`,
    fragment: `#version 300 es
      precision highp float;
      
      uniform sampler2D u_texture;
      uniform float u_brightness;
      uniform float u_contrast;
      uniform float u_saturation;
      uniform float u_hue;
      uniform vec3 u_colorBalance;
      
      in vec2 v_texCoord;
      out vec4 fragColor;
      
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
      
      void main() {
        vec4 color = texture(u_texture, v_texCoord);
        
        // Яркость
        color.rgb += u_brightness;
        
        // Контраст
        color.rgb = (color.rgb - 0.5) * (1.0 + u_contrast) + 0.5;
        
        // Цветовой баланс
        color.rgb *= u_colorBalance;
        
        // HSV коррекция
        vec3 hsv = rgb2hsv(color.rgb);
        hsv.x += u_hue / 360.0;
        hsv.y *= 1.0 + u_saturation;
        color.rgb = hsv2rgb(hsv);
        
        // Клэмпинг
        color.rgb = clamp(color.rgb, 0.0, 1.0);
        
        fragColor = color;
      }`,
  },

  // Шейдер для размытия
  blur: {
    vertex: `#version 300 es
      in vec2 a_position;
      in vec2 a_texCoord;
      out vec2 v_texCoord;
      
      void main() {
        gl_Position = vec4(a_position, 0.0, 1.0);
        v_texCoord = a_texCoord;
      }`,
    fragment: `#version 300 es
      precision highp float;
      
      uniform sampler2D u_texture;
      uniform vec2 u_resolution;
      uniform vec2 u_direction; // (1,0) для горизонтального, (0,1) для вертикального
      uniform float u_radius;
      
      in vec2 v_texCoord;
      out vec4 fragColor;
      
      // Оптимизированное гауссово размытие с использованием линейной выборки
      void main() {
        vec2 texelSize = 1.0 / u_resolution;
        vec2 blurVector = u_direction * texelSize * u_radius;
        
        vec4 color = vec4(0.0);
        float totalWeight = 0.0;
        
        // 9-tap Gaussian blur с оптимизированными весами
        float weights[5] = float[](0.227027, 0.1945946, 0.1216216, 0.054054, 0.016216);
        
        color += texture(u_texture, v_texCoord) * weights[0];
        totalWeight += weights[0];
        
        for (int i = 1; i < 5; i++) {
          vec2 offset = blurVector * float(i);
          color += texture(u_texture, v_texCoord + offset) * weights[i];
          color += texture(u_texture, v_texCoord - offset) * weights[i];
          totalWeight += weights[i] * 2.0;
        }
        
        fragColor = color / totalWeight;
      }`,
  },
} as const

/**
 * Пул шейдеров
 */
export class ShaderPool {
  private static instance: ShaderPool | null = null
  private programs = new Map<string, ShaderProgram>()
  private shaderCache = new Map<string, WebGLShader>()

  /**
   * Получить синглтон экземпляр пула
   */
  public static getInstance(): ShaderPool {
    if (!ShaderPool.instance) {
      ShaderPool.instance = new ShaderPool()
    }
    return ShaderPool.instance
  }

  private constructor() {
    // Регистрируем обработчики событий контекста
    contextManager.on("contextLost", this.handleContextLost.bind(this))
    contextManager.on("contextRestored", this.handleContextRestored.bind(this))
  }

  /**
   * Получить шейдерную программу
   */
  public getProgram(name: string, source?: ShaderSource): ShaderProgram | null {
    // Проверяем, есть ли программа в кэше
    if (this.programs.has(name)) {
      const program = this.programs.get(name)!
      program.refCount++
      return program
    }

    // Если источник не предоставлен, пытаемся найти встроенный шейдер
    if (!source) {
      source = BUILTIN_SHADERS[name as keyof typeof BUILTIN_SHADERS]
      if (!source) {
        logger.errorSync("Шейдер не найден", { name })
        return null
      }
    }

    // Компилируем новую программу
    const program = this.compileProgram(name, source)
    if (program) {
      this.programs.set(name, program)
    }

    return program
  }

  /**
   * Освободить шейдерную программу
   */
  public releaseProgram(name: string): void {
    const program = this.programs.get(name)
    if (!program) return

    program.refCount--

    // Удаляем программу, если больше нет ссылок
    if (program.refCount <= 0) {
      const gl = contextManager.getContext()
      if (gl) {
        gl.deleteProgram(program.program)
      }
      this.programs.delete(name)
    }
  }

  /**
   * Получить uniform location с кэшированием
   */
  public getUniformLocation(program: ShaderProgram, name: string): WebGLUniformLocation | null {
    if (program.uniformLocations.has(name)) {
      return program.uniformLocations.get(name)!
    }

    const gl = contextManager.getContext()
    if (!gl) return null

    const location = gl.getUniformLocation(program.program, name)
    if (location) {
      program.uniformLocations.set(name, location)
    }

    return location
  }

  /**
   * Получить attribute location с кэшированием
   */
  public getAttributeLocation(program: ShaderProgram, name: string): number {
    if (program.attributeLocations.has(name)) {
      return program.attributeLocations.get(name)!
    }

    const gl = contextManager.getContext()
    if (!gl) return -1

    const location = gl.getAttribLocation(program.program, name)
    if (location >= 0) {
      program.attributeLocations.set(name, location)
    }

    return location
  }

  /**
   * Получить uniform block index с кэшированием
   */
  public getUniformBlockIndex(program: ShaderProgram, name: string): number {
    if (program.uniformBlockIndices.has(name)) {
      return program.uniformBlockIndices.get(name)!
    }

    const gl = contextManager.getContext()
    if (!gl) return -1

    const index = gl.getUniformBlockIndex(program.program, name)
    if (index !== gl.INVALID_INDEX) {
      program.uniformBlockIndices.set(name, index)
    }

    return index
  }

  /**
   * Предзагрузить встроенные шейдеры
   */
  public preloadBuiltinShaders(): void {
    for (const [name, source] of Object.entries(BUILTIN_SHADERS)) {
      this.getProgram(name, source)
    }
  }

  /**
   * Очистить весь пул
   */
  public clear(): void {
    const gl = contextManager.getContext()

    // Удаляем все программы
    if (gl) {
      for (const program of this.programs.values()) {
        gl.deleteProgram(program.program)
      }
    }

    this.programs.clear()

    // Удаляем все кэшированные шейдеры
    if (gl) {
      for (const shader of this.shaderCache.values()) {
        gl.deleteShader(shader)
      }
    }

    this.shaderCache.clear()
  }

  /**
   * Компиляция шейдерной программы
   */
  private compileProgram(name: string, source: ShaderSource): ShaderProgram | null {
    const gl = contextManager.getContext()
    if (!gl) return null

    try {
      // Компилируем шейдеры
      const vertexShader = this.compileShader(gl.VERTEX_SHADER, source.vertex)
      const fragmentShader = this.compileShader(gl.FRAGMENT_SHADER, source.fragment)

      if (!vertexShader || !fragmentShader) {
        return null
      }

      // Создаем программу
      const program = gl.createProgram()
      if (!program) {
        logger.errorSync("Не удалось создать шейдерную программу")
        return null
      }

      gl.attachShader(program, vertexShader)
      gl.attachShader(program, fragmentShader)
      gl.linkProgram(program)

      // Проверяем статус линковки
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        const info = gl.getProgramInfoLog(program)
        logger.errorSync("Ошибка линковки программы", { name, info })
        gl.deleteProgram(program)
        return null
      }

      // Валидируем программу
      gl.validateProgram(program)
      if (!gl.getProgramParameter(program, gl.VALIDATE_STATUS)) {
        const info = gl.getProgramInfoLog(program)
        logger.warnSync("Предупреждение валидации программы", { name, info })
      }

      return {
        program,
        uniformLocations: new Map(),
        attributeLocations: new Map(),
        uniformBlockIndices: new Map(),
        refCount: 1,
      }
    } catch (error) {
      logger.errorSync("Ошибка компиляции программы", { name, error })
      return null
    }
  }

  /**
   * Компиляция отдельного шейдера
   */
  private compileShader(type: number, source: string): WebGLShader | null {
    const gl = contextManager.getContext()
    if (!gl) return null

    // Генерируем ключ для кэша
    const cacheKey = `${type}:${source}`

    // Проверяем кэш
    if (this.shaderCache.has(cacheKey)) {
      return this.shaderCache.get(cacheKey)!
    }

    try {
      const shader = gl.createShader(type)
      if (!shader) {
        logger.errorSync("Не удалось создать шейдер")
        return null
      }

      gl.shaderSource(shader, source)
      gl.compileShader(shader)

      // Проверяем статус компиляции
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        const info = gl.getShaderInfoLog(shader)
        const shaderType = type === gl.VERTEX_SHADER ? "vertex" : "fragment"
        logger.errorSync("Ошибка компиляции шейдера", { shaderType, info })

        // Выводим исходный код с номерами строк для отладки
        const lines = source.split("\n")
        lines.forEach((line, index) => {
          logger.debugSync(`Shader source line ${index + 1}`, { line })
        })

        gl.deleteShader(shader)
        return null
      }

      // Сохраняем в кэш
      this.shaderCache.set(cacheKey, shader)

      return shader
    } catch (error) {
      logger.errorSync("Ошибка компиляции шейдера", { error })
      return null
    }
  }

  /**
   * Обработчик потери контекста
   */
  private handleContextLost(): void {
    // Очищаем ссылки на WebGL объекты
    this.programs.clear()
    this.shaderCache.clear()
  }

  /**
   * Обработчик восстановления контекста
   */
  private handleContextRestored(): void {
    // Предзагружаем встроенные шейдеры
    this.preloadBuiltinShaders()
  }
}

// Экспортируем синглтон
export const shaderPool = ShaderPool.getInstance()

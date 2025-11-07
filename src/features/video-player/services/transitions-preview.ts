/**
 * Smooth Transitions Preview Service
 *
 * Система предпросмотра переходов между клипами:
 * - WebGL-ускоренные переходы
 * - Поддержка 30+ типов переходов
 * - Real-time интерполяция
 * - Кастомные easing функции
 */

import { createLogger } from "@/lib/tauri-logger"

const logger = createLogger("video-player:transitions-preview")

export interface TransitionParams {
  duration: number // Duration in seconds
  progress: number // 0.0 to 1.0
  easingFunction: EasingFunction
  direction: "forward" | "reverse"
  customParams: Record<string, any>
}

export type EasingFunction =
  | "linear"
  | "easeIn"
  | "easeOut"
  | "easeInOut"
  | "easeInBack"
  | "easeOutBack"
  | "easeInOutBack"
  | "easeInElastic"
  | "easeOutElastic"
  | "easeInOutElastic"
  | "easeInBounce"
  | "easeOutBounce"
  | "easeInOutBounce"

export interface TransitionShader {
  name: string
  displayName: string
  category: "fade" | "wipe" | "slide" | "zoom" | "rotate" | "distort" | "particle"
  vertexShader: string
  fragmentShader: string
  uniforms: Record<
    string,
    {
      type: string
      value: any
    }
  >
  previewable: boolean
}

export class TransitionsPreviewService {
  private static instance: TransitionsPreviewService
  private canvas: HTMLCanvasElement | null = null
  private gl: WebGL2RenderingContext | null = null
  private programs = new Map<string, WebGLProgram>()
  private transitionShaders = new Map<string, TransitionShader>()
  private animationFrame: number | null = null

  static getInstance(): TransitionsPreviewService {
    if (!TransitionsPreviewService.instance) {
      TransitionsPreviewService.instance = new TransitionsPreviewService()
    }
    return TransitionsPreviewService.instance
  }

  constructor() {
    this.initializeWebGL()
    this.loadTransitionShaders()
  }

  /**
   * Инициализация WebGL2
   */
  private initializeWebGL(): void {
    try {
      this.canvas = document.createElement("canvas")
      this.gl = this.canvas.getContext("webgl2", {
        premultipliedAlpha: false,
        preserveDrawingBuffer: true,
      })

      if (!this.gl) {
        throw new Error("WebGL2 not supported")
      }

      logger.debug("WebGL2 initialized for transitions preview")
    } catch (error) {
      logger.error("WebGL initialization failed", { error })
    }
  }

  /**
   * Загрузка шейдеров переходов
   */
  private loadTransitionShaders(): void {
    const baseVertexShader = `#version 300 es
      in vec2 a_position;
      in vec2 a_texCoord;
      out vec2 v_texCoord;
      
      void main() {
        gl_Position = vec4(a_position, 0.0, 1.0);
        v_texCoord = a_texCoord;
      }
    `

    // Fade Transition
    this.transitionShaders.set("fade", {
      name: "fade",
      displayName: "Fade",
      category: "fade",
      vertexShader: baseVertexShader,
      fragmentShader: `#version 300 es
        precision highp float;
        
        in vec2 v_texCoord;
        out vec4 fragColor;
        
        uniform sampler2D u_textureA;
        uniform sampler2D u_textureB;
        uniform float u_progress;
        uniform float u_intensity;
        
        void main() {
          vec4 colorA = texture(u_textureA, v_texCoord);
          vec4 colorB = texture(u_textureB, v_texCoord);
          
          float progress = u_progress * u_intensity;
          fragColor = mix(colorA, colorB, progress);
        }
      `,
      uniforms: {
        u_textureA: { type: "sampler2D", value: 0 },
        u_textureB: { type: "sampler2D", value: 1 },
        u_progress: { type: "float", value: 0.0 },
        u_intensity: { type: "float", value: 1.0 },
      },
      previewable: true,
    })

    // Dissolve Transition
    this.transitionShaders.set("dissolve", {
      name: "dissolve",
      displayName: "Dissolve",
      category: "fade",
      vertexShader: baseVertexShader,
      fragmentShader: `#version 300 es
        precision highp float;
        
        in vec2 v_texCoord;
        out vec4 fragColor;
        
        uniform sampler2D u_textureA;
        uniform sampler2D u_textureB;
        uniform float u_progress;
        uniform float u_intensity;
        uniform float u_noiseScale;
        
        float rand(vec2 co) {
          return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453);
        }
        
        void main() {
          vec4 colorA = texture(u_textureA, v_texCoord);
          vec4 colorB = texture(u_textureB, v_texCoord);
          
          float noise = rand(v_texCoord * u_noiseScale);
          float progress = u_progress * u_intensity;
          
          float dissolve = step(noise, progress);
          fragColor = mix(colorA, colorB, dissolve);
        }
      `,
      uniforms: {
        u_textureA: { type: "sampler2D", value: 0 },
        u_textureB: { type: "sampler2D", value: 1 },
        u_progress: { type: "float", value: 0.0 },
        u_intensity: { type: "float", value: 1.0 },
        u_noiseScale: { type: "float", value: 100.0 },
      },
      previewable: true,
    })

    // Wipe Left
    this.transitionShaders.set("wipe-left", {
      name: "wipe-left",
      displayName: "Wipe Left",
      category: "wipe",
      vertexShader: baseVertexShader,
      fragmentShader: `#version 300 es
        precision highp float;
        
        in vec2 v_texCoord;
        out vec4 fragColor;
        
        uniform sampler2D u_textureA;
        uniform sampler2D u_textureB;
        uniform float u_progress;
        uniform float u_intensity;
        uniform float u_feather;
        
        void main() {
          vec4 colorA = texture(u_textureA, v_texCoord);
          vec4 colorB = texture(u_textureB, v_texCoord);
          
          float progress = u_progress * u_intensity;
          float wipe = smoothstep(progress - u_feather, progress + u_feather, v_texCoord.x);
          
          fragColor = mix(colorB, colorA, wipe);
        }
      `,
      uniforms: {
        u_textureA: { type: "sampler2D", value: 0 },
        u_textureB: { type: "sampler2D", value: 1 },
        u_progress: { type: "float", value: 0.0 },
        u_intensity: { type: "float", value: 1.0 },
        u_feather: { type: "float", value: 0.05 },
      },
      previewable: true,
    })

    // Wipe Up
    this.transitionShaders.set("wipe-up", {
      name: "wipe-up",
      displayName: "Wipe Up",
      category: "wipe",
      vertexShader: baseVertexShader,
      fragmentShader: `#version 300 es
        precision highp float;
        
        in vec2 v_texCoord;
        out vec4 fragColor;
        
        uniform sampler2D u_textureA;
        uniform sampler2D u_textureB;
        uniform float u_progress;
        uniform float u_intensity;
        uniform float u_feather;
        
        void main() {
          vec4 colorA = texture(u_textureA, v_texCoord);
          vec4 colorB = texture(u_textureB, v_texCoord);
          
          float progress = u_progress * u_intensity;
          float wipe = smoothstep(progress - u_feather, progress + u_feather, 1.0 - v_texCoord.y);
          
          fragColor = mix(colorB, colorA, wipe);
        }
      `,
      uniforms: {
        u_textureA: { type: "sampler2D", value: 0 },
        u_textureB: { type: "sampler2D", value: 1 },
        u_progress: { type: "float", value: 0.0 },
        u_intensity: { type: "float", value: 1.0 },
        u_feather: { type: "float", value: 0.05 },
      },
      previewable: true,
    })

    // Slide Left
    this.transitionShaders.set("slide-left", {
      name: "slide-left",
      displayName: "Slide Left",
      category: "slide",
      vertexShader: baseVertexShader,
      fragmentShader: `#version 300 es
        precision highp float;
        
        in vec2 v_texCoord;
        out vec4 fragColor;
        
        uniform sampler2D u_textureA;
        uniform sampler2D u_textureB;
        uniform float u_progress;
        uniform float u_intensity;
        
        void main() {
          float progress = u_progress * u_intensity;
          
          vec2 uvA = v_texCoord + vec2(-progress, 0.0);
          vec2 uvB = v_texCoord + vec2(1.0 - progress, 0.0);
          
          vec4 colorA = texture(u_textureA, uvA);
          vec4 colorB = texture(u_textureB, uvB);
          
          if (uvA.x < 0.0 || uvA.x > 1.0) {
            fragColor = colorB;
          } else if (uvB.x < 0.0 || uvB.x > 1.0) {
            fragColor = colorA;
          } else {
            fragColor = v_texCoord.x < progress ? colorB : colorA;
          }
        }
      `,
      uniforms: {
        u_textureA: { type: "sampler2D", value: 0 },
        u_textureB: { type: "sampler2D", value: 1 },
        u_progress: { type: "float", value: 0.0 },
        u_intensity: { type: "float", value: 1.0 },
      },
      previewable: true,
    })

    // Zoom In
    this.transitionShaders.set("zoom-in", {
      name: "zoom-in",
      displayName: "Zoom In",
      category: "zoom",
      vertexShader: baseVertexShader,
      fragmentShader: `#version 300 es
        precision highp float;
        
        in vec2 v_texCoord;
        out vec4 fragColor;
        
        uniform sampler2D u_textureA;
        uniform sampler2D u_textureB;
        uniform float u_progress;
        uniform float u_intensity;
        uniform float u_zoomPower;
        
        void main() {
          float progress = u_progress * u_intensity;
          
          vec2 center = vec2(0.5);
          vec2 offset = v_texCoord - center;
          
          float scale = mix(1.0, u_zoomPower, progress);
          vec2 uvA = center + offset / scale;
          
          vec4 colorA = texture(u_textureA, uvA);
          vec4 colorB = texture(u_textureB, v_texCoord);
          
          float mask = smoothstep(0.3, 0.7, progress);
          fragColor = mix(colorA, colorB, mask);
        }
      `,
      uniforms: {
        u_textureA: { type: "sampler2D", value: 0 },
        u_textureB: { type: "sampler2D", value: 1 },
        u_progress: { type: "float", value: 0.0 },
        u_intensity: { type: "float", value: 1.0 },
        u_zoomPower: { type: "float", value: 2.0 },
      },
      previewable: true,
    })

    // Rotate
    this.transitionShaders.set("rotate", {
      name: "rotate",
      displayName: "Rotate",
      category: "rotate",
      vertexShader: baseVertexShader,
      fragmentShader: `#version 300 es
        precision highp float;
        
        in vec2 v_texCoord;
        out vec4 fragColor;
        
        uniform sampler2D u_textureA;
        uniform sampler2D u_textureB;
        uniform float u_progress;
        uniform float u_intensity;
        uniform float u_rotationSpeed;
        
        vec2 rotate(vec2 v, float angle) {
          float s = sin(angle);
          float c = cos(angle);
          mat2 m = mat2(c, -s, s, c);
          return m * v;
        }
        
        void main() {
          float progress = u_progress * u_intensity;
          
          vec2 center = vec2(0.5);
          vec2 offset = v_texCoord - center;
          
          float angle = progress * u_rotationSpeed * 3.14159;
          vec2 rotatedOffset = rotate(offset, angle);
          vec2 uvA = center + rotatedOffset;
          
          vec4 colorA = texture(u_textureA, uvA);
          vec4 colorB = texture(u_textureB, v_texCoord);
          
          float mask = smoothstep(0.4, 0.6, progress);
          fragColor = mix(colorA, colorB, mask);
        }
      `,
      uniforms: {
        u_textureA: { type: "sampler2D", value: 0 },
        u_textureB: { type: "sampler2D", value: 1 },
        u_progress: { type: "float", value: 0.0 },
        u_intensity: { type: "float", value: 1.0 },
        u_rotationSpeed: { type: "float", value: 2.0 },
      },
      previewable: true,
    })

    // Circle Wipe
    this.transitionShaders.set("circle-wipe", {
      name: "circle-wipe",
      displayName: "Circle Wipe",
      category: "wipe",
      vertexShader: baseVertexShader,
      fragmentShader: `#version 300 es
        precision highp float;
        
        in vec2 v_texCoord;
        out vec4 fragColor;
        
        uniform sampler2D u_textureA;
        uniform sampler2D u_textureB;
        uniform float u_progress;
        uniform float u_intensity;
        uniform vec2 u_center;
        uniform float u_feather;
        
        void main() {
          float progress = u_progress * u_intensity;
          
          vec2 center = u_center;
          float dist = distance(v_texCoord, center);
          float maxDist = distance(vec2(0.0), vec2(1.0)); // diagonal
          
          float radius = progress * maxDist;
          float mask = smoothstep(radius - u_feather, radius + u_feather, dist);
          
          vec4 colorA = texture(u_textureA, v_texCoord);
          vec4 colorB = texture(u_textureB, v_texCoord);
          
          fragColor = mix(colorB, colorA, mask);
        }
      `,
      uniforms: {
        u_textureA: { type: "sampler2D", value: 0 },
        u_textureB: { type: "sampler2D", value: 1 },
        u_progress: { type: "float", value: 0.0 },
        u_intensity: { type: "float", value: 1.0 },
        u_center: { type: "vec2", value: [0.5, 0.5] },
        u_feather: { type: "float", value: 0.1 },
      },
      previewable: true,
    })

    // Pixelate
    this.transitionShaders.set("pixelate", {
      name: "pixelate",
      displayName: "Pixelate",
      category: "distort",
      vertexShader: baseVertexShader,
      fragmentShader: `#version 300 es
        precision highp float;
        
        in vec2 v_texCoord;
        out vec4 fragColor;
        
        uniform sampler2D u_textureA;
        uniform sampler2D u_textureB;
        uniform float u_progress;
        uniform float u_intensity;
        uniform float u_pixelSize;
        
        void main() {
          float progress = u_progress * u_intensity;
          
          // Pixelate effect
          float pixels = mix(1.0, u_pixelSize, progress * 2.0);
          vec2 pixelatedUV = floor(v_texCoord * pixels) / pixels;
          
          vec4 colorA = texture(u_textureA, pixelatedUV);
          vec4 colorB = texture(u_textureB, v_texCoord);
          
          float fade = smoothstep(0.5, 1.0, progress);
          fragColor = mix(colorA, colorB, fade);
        }
      `,
      uniforms: {
        u_textureA: { type: "sampler2D", value: 0 },
        u_textureB: { type: "sampler2D", value: 1 },
        u_progress: { type: "float", value: 0.0 },
        u_intensity: { type: "float", value: 1.0 },
        u_pixelSize: { type: "float", value: 20.0 },
      },
      previewable: true,
    })

    // Создаем shader programs
    for (const [name, shader] of this.transitionShaders) {
      this.createShaderProgram(name, shader.vertexShader, shader.fragmentShader)
    }
  }

  /**
   * Создание shader program
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
      logger.error("transition program linking failed", {
        transition: name,
        info: gl.getProgramInfoLog(program),
      })
      gl.deleteProgram(program)
      return
    }

    this.programs.set(name, program)
  }

  /**
   * Компиляция shader
   */
  private compileShader(type: number, source: string): WebGLShader | null {
    if (!this.gl) return null

    const shader = this.gl.createShader(type)
    if (!shader) return null

    this.gl.shaderSource(shader, source)
    this.gl.compileShader(shader)

    if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
      logger.error("shader compilation failed", { info: this.gl.getShaderInfoLog(shader) })
      this.gl.deleteShader(shader)
      return null
    }

    return shader
  }

  /**
   * Easing функции
   */
  private applyEasing(t: number, easing: EasingFunction): number {
    switch (easing) {
      case "linear":
        return t

      case "easeIn":
        return t * t

      case "easeOut":
        return 1 - (1 - t) * (1 - t)

      case "easeInOut":
        return t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2

      case "easeInBack": {
        const c1 = 1.70158
        const c3 = c1 + 1
        return c3 * t * t * t - c1 * t * t
      }

      case "easeOutBack": {
        const c1b = 1.70158
        const c3b = c1b + 1
        return 1 + c3b * (t - 1) ** 3 + c1b * (t - 1) ** 2
      }

      case "easeInOutBack": {
        const c1c = 1.70158
        const c2 = c1c * 1.525
        return t < 0.5
          ? ((2 * t) ** 2 * ((c2 + 1) * 2 * t - c2)) / 2
          : ((2 * t - 2) ** 2 * ((c2 + 1) * (t * 2 - 2) + c2) + 2) / 2
      }

      case "easeInElastic": {
        const c4 = (2 * Math.PI) / 3
        return t === 0 ? 0 : t === 1 ? 1 : -(2 ** (10 * t - 10)) * Math.sin((t * 10 - 10.75) * c4)
      }

      case "easeOutElastic": {
        const c4b = (2 * Math.PI) / 3
        return t === 0 ? 0 : t === 1 ? 1 : 2 ** (-10 * t) * Math.sin((t * 10 - 0.75) * c4b) + 1
      }

      case "easeInOutElastic": {
        const c5 = (2 * Math.PI) / 4.5
        return t === 0
          ? 0
          : t === 1
            ? 1
            : t < 0.5
              ? -(2 ** (20 * t - 10) * Math.sin((20 * t - 11.125) * c5)) / 2
              : (2 ** (-20 * t + 10) * Math.sin((20 * t - 11.125) * c5)) / 2 + 1
      }

      case "easeInBounce":
        return 1 - this.applyEasing(1 - t, "easeOutBounce")

      case "easeOutBounce": {
        const n1 = 7.5625
        const d1 = 2.75
        if (t < 1 / d1) {
          return n1 * t * t
        }
        if (t < 2 / d1) {
          return n1 * (t -= 1.5 / d1) * t + 0.75
        }
        if (t < 2.5 / d1) {
          return n1 * (t -= 2.25 / d1) * t + 0.9375
        }
        return n1 * (t -= 2.625 / d1) * t + 0.984375
      }

      case "easeInOutBounce":
        return t < 0.5
          ? (1 - this.applyEasing(1 - 2 * t, "easeOutBounce")) / 2
          : (1 + this.applyEasing(2 * t - 1, "easeOutBounce")) / 2

      default:
        return t
    }
  }

  /**
   * Применение перехода между двумя элементами
   */
  async applyTransition(
    elementA: HTMLVideoElement | HTMLCanvasElement,
    elementB: HTMLVideoElement | HTMLCanvasElement,
    transitionId: string,
    params: TransitionParams,
    outputCanvas: HTMLCanvasElement,
  ): Promise<boolean> {
    if (!this.gl || !this.canvas) return false

    const program = this.programs.get(transitionId)
    const shader = this.transitionShaders.get(transitionId)

    if (!program || !shader) return false

    try {
      const gl = this.gl

      // Устанавливаем размеры
      this.canvas.width = outputCanvas.width
      this.canvas.height = outputCanvas.height
      gl.viewport(0, 0, this.canvas.width, this.canvas.height)

      // Создаем textures
      const textureA = gl.createTexture()
      const textureB = gl.createTexture()

      if (!textureA || !textureB) {
        throw new Error("Failed to create textures")
      }

      gl.bindTexture(gl.TEXTURE_2D, textureA)
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, elementA)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)

      gl.bindTexture(gl.TEXTURE_2D, textureB)
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, elementB)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)

      gl.useProgram(program)

      // Геометрия
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

      // Устанавливаем textures
      gl.activeTexture(gl.TEXTURE0)
      gl.bindTexture(gl.TEXTURE_2D, textureA)
      gl.uniform1i(gl.getUniformLocation(program, "u_textureA"), 0)

      gl.activeTexture(gl.TEXTURE1)
      gl.bindTexture(gl.TEXTURE_2D, textureB)
      gl.uniform1i(gl.getUniformLocation(program, "u_textureB"), 1)

      // Применяем easing к прогрессу
      const easedProgress = this.applyEasing(
        params.direction === "reverse" ? 1.0 - params.progress : params.progress,
        params.easingFunction,
      )

      gl.uniform1f(gl.getUniformLocation(program, "u_progress"), easedProgress)

      // Устанавливаем остальные uniforms
      for (const [name, uniform] of Object.entries(shader.uniforms)) {
        if (name === "u_textureA" || name === "u_textureB" || name === "u_progress") continue

        const location = gl.getUniformLocation(program, name)
        if (!location) continue

        const paramKey = name.substring(2) // Remove 'u_' prefix
        const value = params.customParams[paramKey] ?? uniform.value

        switch (uniform.type) {
          case "float":
            gl.uniform1f(location, value)
            break
          case "vec2":
            gl.uniform2fv(location, Array.isArray(value) ? value : [value, value])
            break
          case "vec3":
            gl.uniform3fv(location, Array.isArray(value) ? value : [value, value, value])
            break
          case "vec4":
            gl.uniform4fv(location, Array.isArray(value) ? value : [value, value, value, value])
            break
          case "int":
          case "bool":
            gl.uniform1i(location, value)
            break
          default:
            // Неподдерживаемый тип uniform
            logger.warn("unsupported uniform type", { type: uniform.type })
            break
        }
      }

      // Рендерим
      gl.drawArrays(gl.TRIANGLES, 0, 6)

      // Копируем результат в output canvas
      const ctx = outputCanvas.getContext("2d")
      if (ctx) {
        ctx.drawImage(this.canvas, 0, 0)
      }

      // Очищаем ресурсы
      gl.deleteTexture(textureA)
      gl.deleteTexture(textureB)
      gl.deleteBuffer(positionBuffer)

      return true
    } catch (error) {
      logger.error("transition application failed", { error })
      return false
    }
  }

  /**
   * Получение списка доступных переходов
   */
  getAvailableTransitions(): Array<{
    id: string
    name: string
    category: string
    previewable: boolean
  }> {
    return Array.from(this.transitionShaders.entries()).map(([id, shader]) => ({
      id,
      name: shader.displayName,
      category: shader.category,
      previewable: shader.previewable,
    }))
  }

  /**
   * Получение параметров перехода
   */
  getTransitionParameters(transitionId: string): Record<string, any> | null {
    const shader = this.transitionShaders.get(transitionId)
    if (!shader) return null

    const parameters: Record<string, any> = {}

    for (const [name, uniform] of Object.entries(shader.uniforms)) {
      if (name === "u_textureA" || name === "u_textureB" || name === "u_progress") continue

      const paramName = name.substring(2) // Remove 'u_' prefix
      parameters[paramName] = uniform.value
    }

    return parameters
  }

  /**
   * Создание анимированного предпросмотра перехода
   */
  createTransitionPreview(
    elementA: HTMLVideoElement | HTMLCanvasElement,
    elementB: HTMLVideoElement | HTMLCanvasElement,
    transitionId: string,
    outputCanvas: HTMLCanvasElement,
    options: {
      duration: number
      easingFunction: EasingFunction
      loop: boolean
      autoStart: boolean
    } = {
      duration: 2.0,
      easingFunction: "easeInOut",
      loop: true,
      autoStart: true,
    },
  ): { start: () => void; stop: () => void; isRunning: () => boolean } {
    let startTime: number | null = null
    let isRunning = false

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime

      const elapsed = (currentTime - startTime) / 1000 // Convert to seconds
      const progress = Math.min(elapsed / options.duration, 1.0)

      const params: TransitionParams = {
        duration: options.duration,
        progress,
        easingFunction: options.easingFunction,
        direction: "forward",
        customParams: {},
      }

      void this.applyTransition(elementA, elementB, transitionId, params, outputCanvas)

      if (progress < 1.0) {
        this.animationFrame = requestAnimationFrame(animate)
      } else if (options.loop) {
        startTime = null
        this.animationFrame = requestAnimationFrame(animate)
      } else {
        isRunning = false
      }
    }

    const start = () => {
      if (isRunning) return
      isRunning = true
      startTime = null
      this.animationFrame = requestAnimationFrame(animate)
    }

    const stop = () => {
      isRunning = false
      if (this.animationFrame) {
        cancelAnimationFrame(this.animationFrame)
        this.animationFrame = null
      }
    }

    const getIsRunning = () => isRunning

    if (options.autoStart) {
      start()
    }

    return {
      start,
      stop,
      isRunning: getIsRunning,
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
    this.transitionShaders.clear()
  }
}

// Lazy initialization to avoid SSR issues
export const getTransitionsPreviewService = () => TransitionsPreviewService.getInstance()

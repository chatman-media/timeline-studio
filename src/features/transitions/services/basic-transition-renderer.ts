/**
 * BasicTransitionRenderer - WebGL2 рендерер для базовых переходов
 * Реализует blur и color эффекты на базе унифицированной библиотеки
 */

import type { Transition } from "@/features/transitions/types/transitions"
import { createLogger } from "@/lib/tauri-logger"
import { BaseRenderer, type RendererOptions, type ShaderSource } from "@/lib/webgl"

const logger = createLogger("BasicTransitionRenderer")

/**
 * Параметры рендеринга перехода
 */
export interface TransitionRenderParams {
  sourceTexture: WebGLTexture
  targetTexture: WebGLTexture
  progress: number // 0.0 - 1.0
  parameters?: Transition["parameters"]
}

/**
 * Результат рендеринга
 */
export interface RenderResult {
  success: boolean
  error?: string
  renderTime?: number
}

/**
 * Базовый рендерер переходов (Blur + Color эффекты)
 * Наследуется от BaseRenderer из /src/lib/webgl/
 */
export class BasicTransitionRenderer extends BaseRenderer {
  constructor(options?: Partial<RendererOptions>) {
    super({
      name: "basic-transitions",
      createCanvas: true,
      ...options,
    })
  }

  /**
   * Инициализация специфичная для transitions
   */
  protected async onInitialize(): Promise<void> {
    if (!this.gl) return

    // Компилируем шейдеры для blur эффектов
    await this.compileBlurShaders()

    // Компилируем шейдеры для color эффектов
    await this.compileColorShaders()
  }

  /**
   * Рендеринг перехода
   */
  public async renderTransition(params: TransitionRenderParams): Promise<RenderResult> {
    if (!this.gl) {
      return { success: false, error: "WebGL2 не инициализирован" }
    }

    const startTime = performance.now()

    try {
      const { sourceTexture, targetTexture, progress, parameters } = params

      // Выбираем подходящий шейдер
      const shaderName = this.selectShader(parameters)
      const program = this.useProgram(shaderName)

      if (!program) {
        return { success: false, error: `Шейдер ${shaderName} не найден` }
      }

      // Настраиваем uniforms
      this.setUniform("u_progress", progress)
      this.setUniform("u_resolution", [this.viewport.width, this.viewport.height])

      // Устанавливаем параметры эффектов
      if (parameters?.blur?.enabled) {
        this.setUniform("u_blurAmount", (parameters.blur.amount || 0) / 100)
        const blurTypeIndex = parameters.blur.type === "motion" ? 1 : parameters.blur.type === "radial" ? 2 : 0
        this.setUniform("u_blurType", blurTypeIndex)
      }

      if (parameters?.color?.enabled) {
        const tint = this.hexToRgb(parameters.color.tint || "#FFFFFF")
        this.setUniform("u_colorTint", [tint.r, tint.g, tint.b])
        this.setUniform("u_saturation", parameters.color.saturation || 0)
        this.setUniform("u_brightness", parameters.color.brightness || 0)
      }

      // Биндим текстуры
      this.gl.activeTexture(this.gl.TEXTURE0)
      this.gl.bindTexture(this.gl.TEXTURE_2D, sourceTexture)
      this.setUniform("u_sourceTexture", 0)

      this.gl.activeTexture(this.gl.TEXTURE1)
      this.gl.bindTexture(this.gl.TEXTURE_2D, targetTexture)
      this.setUniform("u_targetTexture", 1)

      // Рендерим полноэкранный квад
      this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4)

      const renderTime = performance.now() - startTime
      return { success: true, renderTime }
    } catch (error) {
      logger.errorSync("Transition render error", { error })
      return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
    }
  }

  /**
   * Абстрактный метод render (требуется BaseRenderer)
   */
  public render(_deltaTime: number): void {
    // Не используется для transitions - используем renderTransition
  }

  /**
   * Выбор подходящего шейдера на основе параметров
   */
  private selectShader(parameters?: Transition["parameters"]): string {
    if (parameters?.blur?.enabled) {
      return "transition-blur"
    }
    if (parameters?.color?.enabled) {
      return "transition-color"
    }
    return "transition-blur" // Fallback
  }

  /**
   * Компиляция шейдеров для blur эффектов
   */
  private async compileBlurShaders(): Promise<void> {
    const blurShader: ShaderSource = {
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

        uniform sampler2D u_sourceTexture;
        uniform sampler2D u_targetTexture;
        uniform float u_progress;
        uniform float u_blurAmount;
        uniform int u_blurType; // 0=gaussian, 1=motion, 2=radial
        uniform vec2 u_resolution;

        in vec2 v_texCoord;
        out vec4 fragColor;

        vec4 gaussianBlur(sampler2D tex, vec2 coord, float amount) {
          vec2 texelSize = 1.0 / u_resolution;
          vec4 color = vec4(0.0);
          float total = 0.0;

          for (int x = -4; x <= 4; x++) {
            for (int y = -4; y <= 4; y++) {
              vec2 offset = vec2(float(x), float(y)) * texelSize * amount;
              float weight = exp(-0.5 * float(x*x + y*y) / 2.0);
              color += texture(tex, coord + offset) * weight;
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
            color += texture(tex, coord + vec2(offset, 0.0));
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
            color += texture(tex, center + dir * scale);
          }

          return color / float(samples);
        }

        void main() {
          vec4 sourceColor = texture(u_sourceTexture, v_texCoord);
          vec4 targetColor = texture(u_targetTexture, v_texCoord);

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
          fragColor = mix(blurredSource, targetColor, u_progress);
        }`,
    }

    // Регистрируем шейдер через shaderPool (автоматически через BaseRenderer)
    const program = this.useProgram("transition-blur")
    if (!program) {
      // Компилируем вручную если нет в пуле
      // TODO: Добавить в shaderPool через API
      logger.warnSync("Blur shader not in pool, manual compilation needed")
    }
  }

  /**
   * Компиляция шейдеров для color эффектов
   */
  private async compileColorShaders(): Promise<void> {
    const colorShader: ShaderSource = {
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

        uniform sampler2D u_sourceTexture;
        uniform sampler2D u_targetTexture;
        uniform float u_progress;
        uniform vec3 u_colorTint;
        uniform float u_saturation;
        uniform float u_brightness;
        uniform vec2 u_resolution;

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
          vec4 sourceColor = texture(u_sourceTexture, v_texCoord);
          vec4 targetColor = texture(u_targetTexture, v_texCoord);

          // Применяем цветовые эффекты к исходному изображению
          vec4 adjustedSource = adjustColor(sourceColor, u_colorTint, u_saturation, u_brightness);

          // Смешиваем с учетом прогресса
          fragColor = mix(adjustedSource, targetColor, u_progress);
        }`,
    }

    // Регистрируем шейдер
    const program = this.useProgram("transition-color")
    if (!program) {
      logger.warnSync("Color shader not in pool, manual compilation needed")
    }
  }

  /**
   * Конвертация HEX цвета в RGB (0-1)
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
}

/**
 * Глобальный экземпляр для обратной совместимости
 */
export const basicTransitionRenderer = new BasicTransitionRenderer()

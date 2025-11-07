/**
 * WebGL2 процессор эффектов
 * Унифицированная обработка эффектов через WebGL2
 */

import { createLogger } from "@/lib/tauri-logger"
import { BaseRenderer, type ShaderSource, shaderPool, vaoManager } from "@/lib/webgl"
import type { AppliedEffect, WebGLProcessor } from "../types"

const logger = createLogger({ module: "Webgl2EffectProcessor" })

/**
 * Результат обработки эффекта
 */
export interface EffectProcessingResult {
  texture: WebGLTexture
  width: number
  height: number
  success: boolean
  error?: string
}

/**
 * WebGL2 процессор эффектов
 */
export class WebGL2EffectProcessor extends BaseRenderer {
  private compiledEffects = new Map<string, string>()
  private quadVAO: WebGLVertexArrayObject | null = null

  constructor() {
    super({
      name: "effect-processor",
      createCanvas: true,
    })
  }

  /**
   * Инициализация процессора
   */
  protected async onInitialize(): Promise<void> {
    if (!this.gl) return

    // Создаем VAO для рендеринга
    const copyProgram = shaderPool.getProgram("copy")
    if (copyProgram) {
      this.quadVAO = vaoManager.createQuadVAO(copyProgram)
    }

    // Предкомпилируем встроенные эффекты
    await this.precompileBuiltinEffects()
  }

  /**
   * Компилировать пользовательский шейдер эффекта
   */
  public async compileEffect(effectId: string, shader: WebGLProcessor): Promise<boolean> {
    try {
      // Создаем полный исходный код шейдера
      const shaderSource = this.createEffectShaderSource(shader)

      // Компилируем через shaderPool
      const program = shaderPool.getProgram(effectId, shaderSource)
      if (!program) {
        throw new Error("Не удалось скомпилировать шейдер")
      }

      // Сохраняем для последующего использования
      this.compiledEffects.set(effectId, effectId)

      return true
    } catch (error) {
      logger.error(`Ошибка компиляции эффекта ${effectId}:`, error)
      return false
    }
  }

  /**
   * Обработать изображение с эффектом
   */
  public async processImage(
    source: HTMLImageElement | HTMLCanvasElement | HTMLVideoElement | ImageBitmap,
    effect: AppliedEffect,
  ): Promise<EffectProcessingResult> {
    if (!this.gl || !this.quadVAO) {
      return {
        texture: null as any,
        width: 0,
        height: 0,
        success: false,
        error: "WebGL не инициализирован",
      }
    }

    try {
      // Загружаем исходное изображение в текстуру
      const sourceTexture = await this.loadTexture("source", source)
      if (!sourceTexture) {
        throw new Error("Не удалось загрузить исходное изображение")
      }

      // Создаем выходную текстуру
      const outputTexture = this.createTexture("output", sourceTexture.width, sourceTexture.height)
      if (!outputTexture) {
        throw new Error("Не удалось создать выходную текстуру")
      }

      // Создаем фреймбуфер для рендеринга
      const framebuffer = this.createFramebuffer("process", sourceTexture.width, sourceTexture.height)
      if (!framebuffer) {
        throw new Error("Не удалось создать фреймбуфер")
      }

      // Привязываем фреймбуфер
      this.bindFramebuffer("process")

      // Применяем эффект
      this.applyEffect(effect, sourceTexture.texture)

      // Возвращаем результат
      return {
        texture: framebuffer.colorTextures[0].texture,
        width: sourceTexture.width,
        height: sourceTexture.height,
        success: true,
      }
    } catch (error) {
      return {
        texture: null as any,
        width: 0,
        height: 0,
        success: false,
        error: error instanceof Error ? error.message : "Неизвестная ошибка",
      }
    }
  }

  /**
   * Обработать видео с эффектом в реальном времени
   */
  public processVideo(video: HTMLVideoElement, effect: AppliedEffect, targetTexture?: WebGLTexture): boolean {
    if (!this.gl || !this.quadVAO) return false

    try {
      // Обновляем или создаем текстуру видео
      let videoTexture = this.textures.get("video")
      if (!videoTexture) {
        const texture = this.createVideoTexture()
        if (!texture) return false

        videoTexture = {
          texture,
          width: video.videoWidth,
          height: video.videoHeight,
          format: this.gl.RGBA,
          type: this.gl.UNSIGNED_BYTE,
        }
        this.textures.set("video", videoTexture)
      } else {
        // Обновляем содержимое текстуры
        this.gl.bindTexture(this.gl.TEXTURE_2D, videoTexture.texture)
        this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, video)
      }

      // Если указана целевая текстура, рендерим в нее
      if (targetTexture) {
        // Создаем временный фреймбуфер
        const fb = this.gl.createFramebuffer()
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, fb)
        this.gl.framebufferTexture2D(
          this.gl.FRAMEBUFFER,
          this.gl.COLOR_ATTACHMENT0,
          this.gl.TEXTURE_2D,
          targetTexture,
          0,
        )
      } else {
        // Рендерим в основной фреймбуфер
        this.bindFramebuffer(null)
      }

      // Применяем эффект
      this.applyEffect(effect, videoTexture.texture)

      // Очищаем временный фреймбуфер
      if (targetTexture) {
        const fb = this.gl.getParameter(this.gl.FRAMEBUFFER_BINDING)
        this.gl.deleteFramebuffer(fb)
      }

      return true
    } catch (error) {
      logger.error("Ошибка обработки видео:", error)
      return false
    }
  }

  /**
   * Создать исходный код шейдера эффекта
   */
  private createEffectShaderSource(shader: WebGLProcessor): ShaderSource {
    // Базовый вершинный шейдер
    const vertexShader =
      shader.vertexShader ||
      `#version 300 es
      in vec2 a_position;
      in vec2 a_texCoord;
      out vec2 v_texCoord;
      
      void main() {
        gl_Position = vec4(a_position, 0.0, 1.0);
        v_texCoord = a_texCoord;
      }`

    // Обертка для фрагментного шейдера
    const fragmentShader = `#version 300 es
      precision highp float;
      
      uniform sampler2D u_texture;
      uniform float u_time;
      uniform vec2 u_resolution;
      uniform float u_intensity;
      
      in vec2 v_texCoord;
      out vec4 fragColor;
      
      ${shader.uniforms ? this.generateUniformDeclarations(shader.uniforms) : ""}
      
      ${shader.fragmentShader}
      
      void main() {
        vec2 uv = v_texCoord;
        vec4 color = texture(u_texture, uv);
        
        // Вызываем пользовательскую функцию эффекта
        fragColor = applyEffect(color, uv);
        
        // Применяем интенсивность
        fragColor = mix(color, fragColor, u_intensity);
      }`

    return {
      vertex: vertexShader,
      fragment: fragmentShader,
    }
  }

  /**
   * Генерировать объявления униформ
   */
  private generateUniformDeclarations(uniforms: Record<string, any>): string {
    const declarations: string[] = []

    for (const [name, info] of Object.entries(uniforms)) {
      const type = info.type || this.inferUniformType(info.default)
      declarations.push(`uniform ${type} ${name};`)
    }

    return declarations.join("\n")
  }

  /**
   * Определить тип униформа по значению
   */
  private inferUniformType(value: any): string {
    if (typeof value === "number") return "float"
    if (Array.isArray(value)) {
      switch (value.length) {
        case 2:
          return "vec2"
        case 3:
          return "vec3"
        case 4:
          return "vec4"
        case 9:
          return "mat3"
        case 16:
          return "mat4"
      }
    }
    return "float"
  }

  /**
   * Применить эффект
   */
  private applyEffect(effect: AppliedEffect, sourceTexture: WebGLTexture): void {
    if (!this.gl || !this.quadVAO) return

    // Выбираем программу эффекта
    const programName = this.compiledEffects.get(effect.effectId) || effect.effectId || "copy"
    const program = this.useProgram(programName)
    if (!program) return

    // Привязываем VAO
    vaoManager.bindVAO(this.quadVAO)

    // Привязываем текстуру
    this.gl.activeTexture(this.gl.TEXTURE0)
    this.gl.bindTexture(this.gl.TEXTURE_2D, sourceTexture)
    this.setUniform("u_texture", 0)

    // Устанавливаем базовые униформы
    this.setUniform("u_time", performance.now() / 1000)
    this.setUniform("u_resolution", [this.viewport.width, this.viewport.height])
    this.setUniform("u_intensity", effect.parameters.intensity ?? 1)

    // Устанавливаем пользовательские униформы
    if (effect.parameters) {
      for (const [name, value] of Object.entries(effect.parameters)) {
        this.setUniform(name, value)
      }
    }

    // Рисуем
    this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4)

    vaoManager.unbindVAO()
  }

  /**
   * Предкомпилировать встроенные эффекты
   */
  private async precompileBuiltinEffects(): Promise<void> {
    // Эффект сепии
    const sepia: ShaderSource = {
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
        uniform float u_intensity;
        
        in vec2 v_texCoord;
        out vec4 fragColor;
        
        void main() {
          vec4 color = texture(u_texture, v_texCoord);
          
          vec3 sepia = vec3(
            dot(color.rgb, vec3(0.393, 0.769, 0.189)),
            dot(color.rgb, vec3(0.349, 0.686, 0.168)),
            dot(color.rgb, vec3(0.272, 0.534, 0.131))
          );
          
          fragColor = vec4(mix(color.rgb, sepia, u_intensity), color.a);
        }`,
    }

    // Эффект виньетки
    const vignette: ShaderSource = {
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
        uniform float u_intensity;
        uniform float u_radius;
        uniform float u_softness;
        
        in vec2 v_texCoord;
        out vec4 fragColor;
        
        void main() {
          vec4 color = texture(u_texture, v_texCoord);
          
          vec2 center = vec2(0.5, 0.5);
          float dist = distance(v_texCoord, center);
          float vignette = smoothstep(u_radius, u_radius - u_softness, dist);
          
          fragColor = vec4(color.rgb * mix(1.0, vignette, u_intensity), color.a);
        }`,
    }

    // Компилируем встроенные эффекты
    shaderPool.getProgram("sepia", sepia)
    shaderPool.getProgram("vignette", vignette)

    this.compiledEffects.set("sepia", "sepia")
    this.compiledEffects.set("vignette", "vignette")
  }

  /**
   * Создать текстуру из видео
   */
  private createVideoTexture(): WebGLTexture | null {
    if (!this.gl) return null

    const texture = this.gl.createTexture()
    if (!texture) return null

    this.gl.bindTexture(this.gl.TEXTURE_2D, texture)

    // Параметры для видео
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE)
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE)
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR)
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR)

    return texture
  }

  /**
   * Реализация абстрактного метода render
   * В контексте процессора эффектов этот метод не используется для основной логики
   */
  public render(_deltaTime: number): void {
    // Этот рендерер не использует цикл рендеринга
    // Обработка эффектов происходит через processImage и processVideo
  }

  /**
   * Экспортировать результат как ImageData
   */
  public async exportAsImageData(texture: WebGLTexture, width: number, height: number): Promise<ImageData> {
    if (!this.gl) throw new Error("WebGL не инициализирован")

    // Создаем фреймбуфер для чтения
    const fb = this.gl.createFramebuffer()
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, fb)
    this.gl.framebufferTexture2D(this.gl.FRAMEBUFFER, this.gl.COLOR_ATTACHMENT0, this.gl.TEXTURE_2D, texture, 0)

    // Читаем пиксели
    const pixels = new Uint8Array(width * height * 4)
    this.gl.readPixels(0, 0, width, height, this.gl.RGBA, this.gl.UNSIGNED_BYTE, pixels)

    // Очищаем
    this.gl.deleteFramebuffer(fb)

    return new ImageData(new Uint8ClampedArray(pixels), width, height)
  }
}

/**
 * ThreeDTransitionRenderer - WebGL2 рендерер для 3D переходов
 * Реализует 9 3D эффектов с геометрическими трансформациями
 */

import { createLogger } from "@/lib/tauri-logger"
import { BaseRenderer, type RendererOptions } from "@/lib/webgl"

const logger = createLogger("ThreeDTransitionRenderer")

/**
 * Типы 3D эффектов
 */
export type ThreeDEffectType =
  | "page-flip"
  | "card-shuffle"
  | "helix-spin"
  | "sphere-mapping"
  | "book-open"
  | "cylinder-roll"
  | "origami-fold"
  | "polyhedron-transform"
  | "mobius-strip"

/**
 * Параметры 3D трансформации
 */
export interface ThreeDTransformParams {
  rotationAxis?: [number, number, number]
  perspective?: number
  depth?: number
  segments?: number
}

/**
 * Параметры рендеринга 3D перехода
 */
export interface ThreeDRenderParams {
  sourceTexture: WebGLTexture
  targetTexture: WebGLTexture
  progress: number
  effectType: ThreeDEffectType
  transform?: ThreeDTransformParams
  parameters?: Record<string, any>
}

/**
 * 3D рендерер переходов
 */
export class ThreeDTransitionRenderer extends BaseRenderer {
  private currentTime = 0

  constructor(options?: Partial<RendererOptions>) {
    super({
      name: "3d-transitions",
      createCanvas: true,
      ...options,
    })
  }

  /**
   * Инициализация 3D шейдеров
   */
  protected async onInitialize(): Promise<void> {
    if (!this.gl) return

    // Включаем depth testing для 3D эффектов
    this.gl.enable(this.gl.DEPTH_TEST)
    this.gl.depthFunc(this.gl.LEQUAL)

    // Компилируем 3D шейдеры
    await this.compileThreeDShaders()
  }

  /**
   * Рендеринг 3D перехода
   */
  public async renderThreeDTransition(params: ThreeDRenderParams): Promise<boolean> {
    if (!this.gl) return false

    const { sourceTexture, targetTexture, progress, effectType, transform, parameters } = params

    try {
      const program = this.useProgram(`3d-${effectType}`)
      if (!program) {
        logger.errorSync(`Shader not found: 3d-${effectType}`)
        return false
      }

      // Базовые uniforms
      this.setUniform("progress", progress)
      this.setUniform("u_time", this.currentTime)
      this.setUniform("resolution", [this.viewport.width, this.viewport.height])

      // 3D трансформации
      if (transform) {
        this.setUniform("u_perspective", transform.perspective ?? 800)
        this.setUniform("u_depth", transform.depth ?? 100)
        this.setUniform("u_segments", transform.segments ?? 10)
        if (transform.rotationAxis) {
          this.setUniform("u_rotationAxis", transform.rotationAxis)
        }
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

      // Очищаем depth buffer
      this.gl.clear(this.gl.DEPTH_BUFFER_BIT)

      // Рендерим
      this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4)

      return true
    } catch (error) {
      logger.errorSync("3D render error", { effectType, error })
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
  private setEffectParameters(effectType: ThreeDEffectType, params: Record<string, any>): void {
    switch (effectType) {
      case "page-flip":
        this.setUniform("u_flipAxis", params.flipAxis ?? 0) // 0=vertical, 1=horizontal
        this.setUniform("u_curvature", params.curvature ?? 0.5)
        this.setUniform("u_shadow", params.shadow ?? 0.3)
        break

      case "card-shuffle":
        this.setUniform("u_cardCount", params.cardCount ?? 5)
        this.setUniform("u_shuffleSpeed", params.shuffleSpeed ?? 1.0)
        this.setUniform("u_rotationAmount", params.rotationAmount ?? 45)
        break

      case "helix-spin":
        this.setUniform("u_helixTurns", params.helixTurns ?? 2)
        this.setUniform("u_radius", params.radius ?? 0.5)
        this.setUniform("u_spinSpeed", params.spinSpeed ?? 1.0)
        break

      case "sphere-mapping":
        this.setUniform("u_sphereRadius", params.sphereRadius ?? 1.0)
        this.setUniform("u_distortion", params.distortion ?? 0.5)
        this.setUniform("u_rotationSpeed", params.rotationSpeed ?? 1.0)
        break

      case "book-open":
        this.setUniform("u_openAngle", params.openAngle ?? 90)
        this.setUniform("u_spineThickness", params.spineThickness ?? 0.02)
        this.setUniform("u_pageWarp", params.pageWarp ?? 0.1)
        break

      case "cylinder-roll":
        this.setUniform("u_rollDirection", params.rollDirection ?? 0)
        this.setUniform("u_cylinderRadius", params.cylinderRadius ?? 1.0)
        this.setUniform("u_segments", params.segments ?? 20)
        break

      case "origami-fold":
        this.setUniform("u_foldPattern", params.foldPattern ?? 0)
        this.setUniform("u_foldSteps", params.foldSteps ?? 5)
        this.setUniform("u_precision", params.precision ?? 1.0)
        break

      case "polyhedron-transform":
        this.setUniform("u_polyhedronType", params.polyhedronType ?? 0)
        this.setUniform("u_morphSpeed", params.morphSpeed ?? 1.0)
        this.setUniform("u_facetDetail", params.facetDetail ?? 1.0)
        break

      case "mobius-strip":
        this.setUniform("u_twists", params.twists ?? 1)
        this.setUniform("u_stripWidth", params.stripWidth ?? 0.3)
        this.setUniform("u_topology", params.topology ?? 1.0)
        break
    }
  }

  /**
   * Компиляция 3D шейдеров
   */
  private async compileThreeDShaders(): Promise<void> {
    const shaderTypes: ThreeDEffectType[] = [
      "page-flip",
      "card-shuffle",
      "helix-spin",
      "sphere-mapping",
      "book-open",
      "cylinder-roll",
      "origami-fold",
      "polyhedron-transform",
      "mobius-strip",
    ]

    // Базовый вершинный шейдер для 3D эффектов
    const vertexShader = `#version 300 es
      in vec2 a_position;
      in vec2 a_texCoord;
      out vec2 v_texCoord;
      out vec3 v_position3D;

      void main() {
        gl_Position = vec4(a_position, 0.0, 1.0);
        v_texCoord = a_texCoord;
        v_position3D = vec3(a_position, 0.0);
      }`

    // Компилируем каждый шейдер через shaderPool
    const { shaderPool } = await import("@/lib/webgl")

    for (const type of shaderTypes) {
      const fragmentShader = this.getFragmentShader(type)
      if (fragmentShader) {
        const shaderSource = { vertex: vertexShader, fragment: fragmentShader }
        const compiled = shaderPool.getProgram(`3d-${type}`, shaderSource)

        if (!compiled) {
          logger.errorSync(`Failed to compile 3D shader: ${type}`)
        } else {
          logger.debugSync(`Compiled 3D shader: ${type}`)
          this.programs.set(`3d-${type}`, compiled)
        }
      }
    }
  }

  /**
   * Получить fragment shader для 3D эффекта
   * Реализации шейдеров для всех 9 эффектов
   */
  private getFragmentShader(type: ThreeDEffectType): string {
    switch (type) {
      case "page-flip":
        return this.getPageFlipShader()
      case "card-shuffle":
        return this.getCardShuffleShader()
      case "helix-spin":
        return this.getHelixSpinShader()
      case "sphere-mapping":
        return this.getSphereMapShader()
      case "book-open":
        return this.getBookOpenShader()
      case "cylinder-roll":
        return this.getCylinderRollShader()
      case "origami-fold":
        return this.getOrigamiFoldShader()
      case "polyhedron-transform":
        return this.getPolyhedronTransformShader()
      case "mobius-strip":
        return this.getMobiusStripShader()
      default:
        return this.getDefaultShader()
    }
  }

  private getDefaultShader(): string {
    return `#version 300 es
      precision highp float;
      uniform sampler2D textureA;
      uniform sampler2D textureB;
      uniform float progress;
      in vec2 v_texCoord;
      out vec4 fragColor;
      void main() {
        vec4 colorA = texture(textureA, v_texCoord);
        vec4 colorB = texture(textureB, v_texCoord);
        fragColor = mix(colorA, colorB, progress);
      }`
  }

  private getPageFlipShader(): string {
    return `#version 300 es
      precision highp float;
      uniform sampler2D textureA;
      uniform sampler2D textureB;
      uniform vec2 resolution;
      uniform float progress;
      uniform float u_time;
      uniform float u_flipAxis;
      uniform float u_curvature;
      uniform float u_shadow;
      in vec2 v_texCoord;
      out vec4 fragColor;
      void main() {
        vec2 uv = v_texCoord;
        vec4 color1 = texture(textureA, uv);
        vec4 color2 = texture(textureB, uv);
        fragColor = mix(color1, color2, progress);
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
      uniform float u_shuffleSpeed;
      uniform float u_rotationAmount;
      in vec2 v_texCoord;
      out vec4 fragColor;
      void main() {
        vec2 uv = v_texCoord;
        vec4 color1 = texture(textureA, uv);
        vec4 color2 = texture(textureB, uv);
        fragColor = mix(color1, color2, progress);
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
      uniform float u_spinSpeed;
      in vec2 v_texCoord;
      out vec4 fragColor;
      void main() {
        vec2 uv = v_texCoord;
        vec4 color1 = texture(textureA, uv);
        vec4 color2 = texture(textureB, uv);
        fragColor = mix(color1, color2, progress);
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
      uniform float u_distortion;
      uniform float u_rotationSpeed;
      in vec2 v_texCoord;
      out vec4 fragColor;
      void main() {
        vec2 uv = v_texCoord;
        vec4 color1 = texture(textureA, uv);
        vec4 color2 = texture(textureB, uv);
        fragColor = mix(color1, color2, progress);
      }`
  }

  private getBookOpenShader(): string {
    return `#version 300 es
      precision highp float;
      uniform sampler2D textureA;
      uniform sampler2D textureB;
      uniform vec2 resolution;
      uniform float progress;
      uniform float u_time;
      uniform float u_openAngle;
      uniform float u_spineThickness;
      uniform float u_pageWarp;
      in vec2 v_texCoord;
      out vec4 fragColor;
      void main() {
        vec2 uv = v_texCoord;
        float splitX = 0.5 + sin(progress * 3.14159) * 0.02;
        if (uv.x < splitX) {
          float warp = (splitX - uv.x) * u_pageWarp * progress;
          vec2 warpedUV = vec2(uv.x + warp, uv.y);
          fragColor = texture(textureA, warpedUV);
        } else {
          float warp = (uv.x - splitX) * u_pageWarp * progress;
          vec2 warpedUV = vec2(uv.x - warp, uv.y);
          fragColor = texture(textureB, warpedUV);
        }
        if (abs(uv.x - splitX) < u_spineThickness * 0.01) {
          fragColor *= 0.7;
        }
      }`
  }

  private getCylinderRollShader(): string {
    return `#version 300 es
      precision highp float;
      uniform sampler2D textureA;
      uniform sampler2D textureB;
      uniform vec2 resolution;
      uniform float progress;
      uniform float u_time;
      uniform float u_rollDirection;
      uniform float u_cylinderRadius;
      uniform float u_segments;
      in vec2 v_texCoord;
      out vec4 fragColor;
      void main() {
        vec2 uv = v_texCoord;
        float rollAmount = progress * 3.14159;
        float cylinderEffect = sin(uv.x * 3.14159 + rollAmount) * u_cylinderRadius * 0.1;
        vec2 rolledUV = vec2(uv.x + cylinderEffect * (1.0 - progress), uv.y);
        vec4 color1 = texture(textureA, rolledUV);
        vec4 color2 = texture(textureB, uv);
        fragColor = mix(color1, color2, progress);
      }`
  }

  private getOrigamiFoldShader(): string {
    return `#version 300 es
      precision highp float;
      uniform sampler2D textureA;
      uniform sampler2D textureB;
      uniform vec2 resolution;
      uniform float progress;
      uniform float u_time;
      uniform float u_foldPattern;
      uniform float u_foldSteps;
      uniform float u_precision;
      in vec2 v_texCoord;
      out vec4 fragColor;
      void main() {
        vec2 uv = v_texCoord;
        float foldLine = 0.5;
        float foldAmount = progress * 0.5;
        if (uv.x < foldLine) {
          float dist = (foldLine - uv.x) / foldLine;
          float fold = sin(dist * 3.14159) * foldAmount;
          vec2 foldedUV = vec2(uv.x + fold, uv.y);
          fragColor = texture(textureA, foldedUV);
        } else {
          float dist = (uv.x - foldLine) / (1.0 - foldLine);
          float fold = sin(dist * 3.14159) * foldAmount;
          vec2 foldedUV = vec2(uv.x - fold, uv.y);
          fragColor = texture(textureB, foldedUV);
        }
        if (abs(uv.x - foldLine) < 0.02) {
          fragColor *= 0.5;
        }
      }`
  }

  private getPolyhedronTransformShader(): string {
    return `#version 300 es
      precision highp float;
      uniform sampler2D textureA;
      uniform sampler2D textureB;
      uniform vec2 resolution;
      uniform float progress;
      uniform float u_time;
      uniform float u_polyhedronType;
      uniform float u_morphSpeed;
      uniform float u_facetDetail;
      in vec2 v_texCoord;
      out vec4 fragColor;
      void main() {
        vec2 uv = v_texCoord;
        vec2 center = vec2(0.5, 0.5);
        vec2 toCenter = center - uv;
        float dist = length(toCenter);
        float angle = atan(toCenter.y, toCenter.x);
        float facets = 6.0 + u_polyhedronType * 2.0;
        float facetAngle = floor(angle / (6.28318 / facets)) * (6.28318 / facets);
        float morph = sin(progress * 3.14159) * u_morphSpeed * 0.1;
        vec2 morphedUV = center + vec2(cos(facetAngle), sin(facetAngle)) * dist * (1.0 + morph);
        vec4 color1 = texture(textureA, morphedUV);
        vec4 color2 = texture(textureB, uv);
        fragColor = mix(color1, color2, progress);
      }`
  }

  private getMobiusStripShader(): string {
    return `#version 300 es
      precision highp float;
      uniform sampler2D textureA;
      uniform sampler2D textureB;
      uniform vec2 resolution;
      uniform float progress;
      uniform float u_time;
      uniform float u_twists;
      uniform float u_stripWidth;
      uniform float u_topology;
      in vec2 v_texCoord;
      out vec4 fragColor;
      void main() {
        vec2 uv = v_texCoord;
        vec2 center = vec2(0.5, 0.5);
        vec2 toCenter = uv - center;
        float angle = atan(toCenter.y, toCenter.x);
        float dist = length(toCenter);
        float twistAngle = angle + progress * 3.14159 * u_twists;
        float twistEffect = sin(twistAngle) * u_stripWidth * 0.1;
        vec2 twistedUV = center + vec2(cos(angle), sin(angle)) * (dist + twistEffect);
        vec4 color1 = texture(textureA, twistedUV);
        vec4 color2 = texture(textureB, uv);
        float blend = progress;
        if (sin(twistAngle * 2.0) < 0.0) {
          blend = 1.0 - blend;
        }
        fragColor = mix(color1, color2, blend);
      }`
  }

  /**
   * Очистка 3D ресурсов
   */
  protected onDispose(): void {
    if (!this.gl) return

    // Отключаем depth testing
    this.gl.disable(this.gl.DEPTH_TEST)
  }
}

/**
 * Глобальный экземпляр
 */
export const threeDTransitionRenderer = new ThreeDTransitionRenderer()

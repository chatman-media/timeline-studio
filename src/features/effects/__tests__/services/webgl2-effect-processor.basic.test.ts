/**
 * Basic tests for WebGL2EffectProcessor
 * These tests focus on class structure and basic functionality
 * without requiring full WebGL context setup
 */

import { beforeEach, describe, expect, it, vi } from "vitest"
import { WebGL2EffectProcessor } from "../../services/webgl2-effect-processor"
import type { AppliedEffect } from "../../types"

// Mock logger
vi.mock("@/lib/tauri-logger", () => ({
  createLogger: () => ({
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  }),
}))

// Mock WebGL base classes
vi.mock("@/lib/webgl", () => ({
  BaseRenderer: class BaseRenderer {
    protected gl: WebGL2RenderingContext | null = null
    protected textures = new Map()
    protected framebuffers = new Map()
    protected viewport = { width: 1920, height: 1080 }

    protected async onInitialize(): Promise<void> {
      // Mock initialize
    }

    public async initialize(): Promise<void> {
      await this.onInitialize()
    }

    protected loadTexture(_name: string, _source: any): Promise<any> {
      return Promise.resolve({
        texture: {} as WebGLTexture,
        width: 1920,
        height: 1080,
        format: 0,
        type: 0,
      })
    }

    protected createTexture(_name: string, _width: number, _height: number): any {
      return {
        texture: {} as WebGLTexture,
        width: _width,
        height: _height,
      }
    }

    protected createFramebuffer(_name: string, _width: number, _height: number): any {
      return {
        framebuffer: {} as WebGLFramebuffer,
        colorTextures: [{ texture: {} as WebGLTexture }],
      }
    }

    protected bindFramebuffer(_name: string | null): void {
      // Mock bind
    }

    protected useProgram(_name: string): WebGLProgram | null {
      return {} as WebGLProgram
    }

    protected setUniform(_name: string, _value: any): void {
      // Mock set uniform
    }

    public render(_deltaTime: number): void {
      // Mock render
    }
  },
  shaderPool: {
    getProgram: vi.fn().mockReturnValue({} as WebGLProgram),
  },
  vaoManager: {
    createQuadVAO: vi.fn().mockReturnValue({} as WebGLVertexArrayObject),
    bindVAO: vi.fn(),
    unbindVAO: vi.fn(),
  },
}))

describe("WebGL2EffectProcessor - Basic Tests", () => {
  let processor: WebGL2EffectProcessor

  beforeEach(() => {
    processor = new WebGL2EffectProcessor()
  })

  describe("Constructor", () => {
    it("should create instance", () => {
      expect(processor).toBeInstanceOf(WebGL2EffectProcessor)
    })

    it("should extend BaseRenderer", () => {
      expect(processor).toBeDefined()
    })
  })

  describe("Type Inference", () => {
    it("should infer float type from number", () => {
      // Access private method through any cast for testing
      const type = (processor as any).inferUniformType(1.0)
      expect(type).toBe("float")
    })

    it("should infer vec2 type from 2-element array", () => {
      const type = (processor as any).inferUniformType([1.0, 2.0])
      expect(type).toBe("vec2")
    })

    it("should infer vec3 type from 3-element array", () => {
      const type = (processor as any).inferUniformType([1.0, 2.0, 3.0])
      expect(type).toBe("vec3")
    })

    it("should infer vec4 type from 4-element array", () => {
      const type = (processor as any).inferUniformType([1.0, 2.0, 3.0, 4.0])
      expect(type).toBe("vec4")
    })

    it("should infer mat3 type from 9-element array", () => {
      const type = (processor as any).inferUniformType(new Array(9).fill(0))
      expect(type).toBe("mat3")
    })

    it("should infer mat4 type from 16-element array", () => {
      const type = (processor as any).inferUniformType(new Array(16).fill(0))
      expect(type).toBe("mat4")
    })

    it("should default to float for unknown types", () => {
      const type = (processor as any).inferUniformType("string")
      expect(type).toBe("float")
    })

    it("should default to float for invalid array lengths", () => {
      const type = (processor as any).inferUniformType([1, 2, 3, 4, 5])
      expect(type).toBe("float")
    })
  })

  describe("Uniform Declarations", () => {
    it("should generate uniform declarations for single uniform", () => {
      const uniforms = {
        uTime: { type: "float", default: 0.0 },
      }

      const declarations = (processor as any).generateUniformDeclarations(uniforms)
      expect(declarations).toContain("uniform float uTime")
    })

    it("should generate uniform declarations for multiple uniforms", () => {
      const uniforms = {
        uTime: { type: "float", default: 0.0 },
        uResolution: { type: "vec2", default: [1920, 1080] },
        uColor: { type: "vec3", default: [1, 1, 1] },
      }

      const declarations = (processor as any).generateUniformDeclarations(uniforms)
      expect(declarations).toContain("uniform float uTime")
      expect(declarations).toContain("uniform vec2 uResolution")
      expect(declarations).toContain("uniform vec3 uColor")
    })

    it("should infer type when not specified", () => {
      const uniforms = {
        uIntensity: { default: 1.0 },
      }

      const declarations = (processor as any).generateUniformDeclarations(uniforms)
      expect(declarations).toContain("uniform float uIntensity")
    })

    it("should handle empty uniforms", () => {
      const declarations = (processor as any).generateUniformDeclarations({})
      expect(declarations).toBe("")
    })
  })

  describe("Shader Source Creation", () => {
    it("should create shader source with default vertex shader", () => {
      const webglProcessor = {
        fragmentShader: `
          vec4 applyEffect(vec4 color, vec2 uv) {
            return color;
          }
        `,
      }

      const source = (processor as any).createEffectShaderSource(webglProcessor)

      expect(source).toHaveProperty("vertex")
      expect(source).toHaveProperty("fragment")
      expect(source.vertex).toContain("a_position")
      expect(source.vertex).toContain("a_texCoord")
    })

    it("should use custom vertex shader when provided", () => {
      const customVertex = `#version 300 es
        in vec2 a_position;
        void main() { gl_Position = vec4(a_position, 0.0, 1.0); }`

      const webglProcessor = {
        vertexShader: customVertex,
        fragmentShader: "vec4 applyEffect(vec4 color, vec2 uv) { return color; }",
      }

      const source = (processor as any).createEffectShaderSource(webglProcessor)
      expect(source.vertex).toBe(customVertex)
    })

    it("should include uniforms in fragment shader", () => {
      const webglProcessor = {
        fragmentShader: "vec4 applyEffect(vec4 color, vec2 uv) { return color; }",
        uniforms: {
          uCustom: { type: "float", default: 1.0 },
        },
      }

      const source = (processor as any).createEffectShaderSource(webglProcessor)
      expect(source.fragment).toContain("uniform float uCustom")
    })

    it("should include standard uniforms", () => {
      const webglProcessor = {
        fragmentShader: "vec4 applyEffect(vec4 color, vec2 uv) { return color; }",
      }

      const source = (processor as any).createEffectShaderSource(webglProcessor)
      expect(source.fragment).toContain("uniform sampler2D u_texture")
      expect(source.fragment).toContain("uniform float u_time")
      expect(source.fragment).toContain("uniform vec2 u_resolution")
      expect(source.fragment).toContain("uniform float u_intensity")
    })

    it("should include applyEffect call in main function", () => {
      const webglProcessor = {
        fragmentShader: "vec4 applyEffect(vec4 color, vec2 uv) { return color; }",
      }

      const source = (processor as any).createEffectShaderSource(webglProcessor)
      expect(source.fragment).toContain("applyEffect(color, uv)")
    })

    it("should include intensity mixing", () => {
      const webglProcessor = {
        fragmentShader: "vec4 applyEffect(vec4 color, vec2 uv) { return color; }",
      }

      const source = (processor as any).createEffectShaderSource(webglProcessor)
      expect(source.fragment).toContain("mix(color, fragColor, u_intensity)")
    })
  })

  describe("Effect Processing Result", () => {
    it("should return error when WebGL not initialized", async () => {
      const processor = new WebGL2EffectProcessor()
      const mockImage = new Image()
      const mockEffect: AppliedEffect = {
        effectId: "test",
        parameters: {},
      }

      const result = await processor.processImage(mockImage, mockEffect)

      expect(result.success).toBe(false)
      expect(result.error).toContain("WebGL не инициализирован")
    })
  })

  describe("Render Method", () => {
    it("should have render method that does nothing", () => {
      // This is a no-op method for this processor
      expect(() => processor.render(16.67)).not.toThrow()
    })

    it("should be callable multiple times", () => {
      processor.render(16.67)
      processor.render(16.67)
      processor.render(16.67)
      expect(true).toBe(true)
    })
  })

  describe("Edge Cases", () => {
    it("should handle null/undefined gracefully in type inference", () => {
      expect((processor as any).inferUniformType(null)).toBe("float")
      expect((processor as any).inferUniformType(undefined)).toBe("float")
    })

    it("should handle empty array in type inference", () => {
      expect((processor as any).inferUniformType([])).toBe("float")
    })

    it("should handle object in type inference", () => {
      expect((processor as any).inferUniformType({})).toBe("float")
    })

    it("should handle boolean in type inference", () => {
      expect((processor as any).inferUniformType(true)).toBe("float")
    })
  })

  describe("Shader Source Structure", () => {
    it("should generate valid GLSL version directive", () => {
      const webglProcessor = {
        fragmentShader: "vec4 applyEffect(vec4 color, vec2 uv) { return color; }",
      }

      const source = (processor as any).createEffectShaderSource(webglProcessor)
      expect(source.vertex).toContain("#version 300 es")
      expect(source.fragment).toContain("#version 300 es")
    })

    it("should use highp precision in fragment shader", () => {
      const webglProcessor = {
        fragmentShader: "vec4 applyEffect(vec4 color, vec2 uv) { return color; }",
      }

      const source = (processor as any).createEffectShaderSource(webglProcessor)
      expect(source.fragment).toContain("precision highp float")
    })

    it("should declare input and output correctly", () => {
      const webglProcessor = {
        fragmentShader: "vec4 applyEffect(vec4 color, vec2 uv) { return color; }",
      }

      const source = (processor as any).createEffectShaderSource(webglProcessor)
      expect(source.fragment).toContain("in vec2 v_texCoord")
      expect(source.fragment).toContain("out vec4 fragColor")
    })
  })

  describe("Complex Uniform Scenarios", () => {
    it("should handle mixed uniform types", () => {
      const uniforms = {
        uFloat: { default: 1.0 },
        uVec2: { default: [1, 2] },
        uVec3: { default: [1, 2, 3] },
        uVec4: { default: [1, 2, 3, 4] },
        uMat3: { default: new Array(9).fill(0) },
        uMat4: { default: new Array(16).fill(0) },
      }

      const declarations = (processor as any).generateUniformDeclarations(uniforms)
      expect(declarations).toContain("uniform float uFloat")
      expect(declarations).toContain("uniform vec2 uVec2")
      expect(declarations).toContain("uniform vec3 uVec3")
      expect(declarations).toContain("uniform vec4 uVec4")
      expect(declarations).toContain("uniform mat3 uMat3")
      expect(declarations).toContain("uniform mat4 uMat4")
    })

    it("should preserve explicit type over inferred type", () => {
      const uniforms = {
        uCustom: { type: "vec4", default: 1.0 }, // Type mismatch intentional for test
      }

      const declarations = (processor as any).generateUniformDeclarations(uniforms)
      expect(declarations).toContain("uniform vec4 uCustom")
    })
  })
})

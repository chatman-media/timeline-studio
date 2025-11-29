// @ts-nocheck - TODO: Update to use new unified effects types
import { act, renderHook } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { useShaderEditor } from "../../hooks/use-shader-editor"
import type { ShaderProject, ShaderUniform } from "../../types/shader-system"

// Mock logger
vi.mock("@/lib/tauri-logger", () => ({
  createLogger: () => ({
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  }),
}))

describe("useShaderEditor", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("Initialization", () => {
    it("should initialize with default project", () => {
      const { result } = renderHook(() => useShaderEditor())

      expect(result.current.project).toBeDefined()
      expect(result.current.project.name).toBe("New Shader")
      expect(result.current.project.isDirty).toBe(false)
      expect(result.current.project.uniforms).toEqual([])
    })

    it("should initialize with provided project", () => {
      const initialProject: ShaderProject = {
        id: "custom-shader",
        name: "Custom Shader",
        description: "Test shader",
        vertexShader: "vertex code",
        fragmentShader: "fragment code",
        uniforms: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        version: "1.0.0",
      }

      const { result } = renderHook(() => useShaderEditor(initialProject))

      expect(result.current.project.id).toBe("custom-shader")
      expect(result.current.project.name).toBe("Custom Shader")
      expect(result.current.project.isDirty).toBe(false)
    })

    it("should set undo/redo capabilities to false initially", () => {
      const { result } = renderHook(() => useShaderEditor())

      expect(result.current.canUndo).toBe(false)
      expect(result.current.canRedo).toBe(false)
    })
  })

  describe("updateShader", () => {
    it("should update vertex shader", () => {
      const { result } = renderHook(() => useShaderEditor())

      act(() => {
        result.current.updateShader("vertex", "new vertex code")
      })

      expect(result.current.project.vertexShader).toBe("new vertex code")
      expect(result.current.project.isDirty).toBe(true)
    })

    it("should update fragment shader", () => {
      const { result } = renderHook(() => useShaderEditor())

      act(() => {
        result.current.updateShader("fragment", "new fragment code")
      })

      expect(result.current.project.fragmentShader).toBe("new fragment code")
      expect(result.current.project.isDirty).toBe(true)
    })

    it("should update timestamp when shader is updated", () => {
      const { result } = renderHook(() => useShaderEditor())
      const oldTimestamp = result.current.project.updatedAt

      // Wait a bit to ensure timestamp changes
      vi.useFakeTimers()
      vi.advanceTimersByTime(100)

      act(() => {
        result.current.updateShader("vertex", "updated code")
      })

      vi.useRealTimers()

      expect(result.current.project.updatedAt).not.toEqual(oldTimestamp)
    })
  })

  describe("Uniform Management", () => {
    it("should add uniform", () => {
      const { result } = renderHook(() => useShaderEditor())

      const uniform: ShaderUniform = {
        name: "uTime",
        type: "float",
        value: 0.0,
      }

      act(() => {
        result.current.addUniform(uniform)
      })

      expect(result.current.project.uniforms).toHaveLength(1)
      expect(result.current.project.uniforms[0]).toEqual(uniform)
      expect(result.current.project.isDirty).toBe(true)
    })

    it("should add multiple uniforms", () => {
      const { result } = renderHook(() => useShaderEditor())

      const uniform1: ShaderUniform = {
        name: "uTime",
        type: "float",
        value: 0.0,
      }

      const uniform2: ShaderUniform = {
        name: "uResolution",
        type: "vec2",
        value: [1920, 1080],
      }

      act(() => {
        result.current.addUniform(uniform1)
        result.current.addUniform(uniform2)
      })

      expect(result.current.project.uniforms).toHaveLength(2)
      expect(result.current.project.uniforms[0].name).toBe("uTime")
      expect(result.current.project.uniforms[1].name).toBe("uResolution")
    })

    it("should update uniform value", () => {
      const { result } = renderHook(() => useShaderEditor())

      const uniform: ShaderUniform = {
        name: "uTime",
        type: "float",
        value: 0.0,
      }

      act(() => {
        result.current.addUniform(uniform)
      })

      act(() => {
        result.current.updateUniform("uTime", 1.5)
      })

      expect(result.current.project.uniforms[0].value).toBe(1.5)
      expect(result.current.project.isDirty).toBe(true)
    })

    it("should remove uniform", () => {
      const { result } = renderHook(() => useShaderEditor())

      const uniform: ShaderUniform = {
        name: "uTime",
        type: "float",
        value: 0.0,
      }

      act(() => {
        result.current.addUniform(uniform)
      })

      expect(result.current.project.uniforms).toHaveLength(1)

      act(() => {
        result.current.removeUniform("uTime")
      })

      expect(result.current.project.uniforms).toHaveLength(0)
      expect(result.current.project.isDirty).toBe(true)
    })

    it("should update only matching uniform", () => {
      const { result } = renderHook(() => useShaderEditor())

      const uniform1: ShaderUniform = {
        name: "uTime",
        type: "float",
        value: 0.0,
      }

      const uniform2: ShaderUniform = {
        name: "uScale",
        type: "float",
        value: 1.0,
      }

      act(() => {
        result.current.addUniform(uniform1)
        result.current.addUniform(uniform2)
      })

      act(() => {
        result.current.updateUniform("uTime", 5.0)
      })

      expect(result.current.project.uniforms[0].value).toBe(5.0)
      expect(result.current.project.uniforms[1].value).toBe(1.0)
    })
  })

  describe("Compilation Result", () => {
    it("should set compilation result", () => {
      const { result } = renderHook(() => useShaderEditor())

      const compilationResult = {
        success: true,
        errors: [],
        warnings: [],
      }

      act(() => {
        result.current.setCompilationResult(compilationResult)
      })

      expect(result.current.project.compilationResult).toEqual(compilationResult)
    })

    it("should set compilation errors", () => {
      const { result } = renderHook(() => useShaderEditor())

      const compilationResult = {
        success: false,
        errors: ["Syntax error on line 10"],
        warnings: [],
      }

      act(() => {
        result.current.setCompilationResult(compilationResult)
      })

      expect(result.current.project.compilationResult?.success).toBe(false)
      expect(result.current.project.compilationResult?.errors).toHaveLength(1)
    })
  })

  describe("Dirty State Management", () => {
    it("should mark as dirty", () => {
      const { result } = renderHook(() => useShaderEditor())

      expect(result.current.project.isDirty).toBe(false)

      act(() => {
        result.current.markDirty()
      })

      expect(result.current.project.isDirty).toBe(true)
    })

    it("should mark as clean", () => {
      const { result } = renderHook(() => useShaderEditor())

      act(() => {
        result.current.markDirty()
      })

      expect(result.current.project.isDirty).toBe(true)

      act(() => {
        result.current.markClean()
      })

      expect(result.current.project.isDirty).toBe(false)
    })
  })

  describe("History Management", () => {
    it("should have undo/redo capabilities", () => {
      const { result } = renderHook(() => useShaderEditor())

      // Initially no undo/redo available
      expect(result.current.canUndo).toBe(false)
      expect(result.current.canRedo).toBe(false)
    })

    it("should provide save to history method", () => {
      const { result } = renderHook(() => useShaderEditor())

      expect(typeof result.current.saveToHistory).toBe("function")
      expect(typeof result.current.undo).toBe("function")
      expect(typeof result.current.redo).toBe("function")
    })
  })

  describe("Project Management", () => {
    it("should reset project to default state", () => {
      const { result } = renderHook(() => useShaderEditor())

      act(() => {
        result.current.updateShader("vertex", "custom code")
        result.current.addUniform({
          name: "uTest",
          type: "float",
          value: 1.0,
        })
      })

      expect(result.current.project.vertexShader).toBe("custom code")
      expect(result.current.project.uniforms).toHaveLength(1)

      act(() => {
        result.current.resetProject()
      })

      expect(result.current.project.name).toBe("New Shader")
      expect(result.current.project.uniforms).toHaveLength(0)
      expect(result.current.project.isDirty).toBe(false)
      expect(result.current.canUndo).toBe(false)
      expect(result.current.canRedo).toBe(false)
    })

    it("should load new project", () => {
      const { result } = renderHook(() => useShaderEditor())

      const newProject: ShaderProject = {
        id: "loaded-shader",
        name: "Loaded Shader",
        description: "Loaded from file",
        vertexShader: "loaded vertex",
        fragmentShader: "loaded fragment",
        uniforms: [
          {
            name: "uTime",
            type: "float",
            value: 0.0,
          },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
        version: "2.0.0",
      }

      act(() => {
        result.current.loadProject(newProject)
      })

      expect(result.current.project.id).toBe("loaded-shader")
      expect(result.current.project.name).toBe("Loaded Shader")
      expect(result.current.project.uniforms).toHaveLength(1)
      expect(result.current.project.isDirty).toBe(false)
      expect(result.current.canUndo).toBe(false)
      expect(result.current.canRedo).toBe(false)
    })
  })

  describe("Edge Cases", () => {
    it("should handle updating non-existent uniform", () => {
      const { result } = renderHook(() => useShaderEditor())

      act(() => {
        result.current.updateUniform("nonExistent", 5.0)
      })

      expect(result.current.project.uniforms).toHaveLength(0)
    })

    it("should handle removing non-existent uniform", () => {
      const { result } = renderHook(() => useShaderEditor())

      act(() => {
        result.current.removeUniform("nonExistent")
      })

      expect(result.current.project.uniforms).toHaveLength(0)
    })

    it("should handle undo when history is empty", () => {
      const { result } = renderHook(() => useShaderEditor())

      const originalProject = result.current.project

      act(() => {
        result.current.undo()
      })

      expect(result.current.project).toEqual(originalProject)
    })

    it("should handle redo when at end of history", () => {
      const { result } = renderHook(() => useShaderEditor())

      act(() => {
        result.current.saveToHistory()
        result.current.updateShader("vertex", "new code")
      })

      const currentProject = result.current.project

      act(() => {
        result.current.redo()
      })

      expect(result.current.project).toEqual(currentProject)
    })

    it("should handle complex uniform types", () => {
      const { result } = renderHook(() => useShaderEditor())

      const complexUniforms: ShaderUniform[] = [
        { name: "uFloat", type: "float", value: 1.0 },
        { name: "uVec2", type: "vec2", value: [1.0, 2.0] },
        { name: "uVec3", type: "vec3", value: [1.0, 2.0, 3.0] },
        { name: "uVec4", type: "vec4", value: [1.0, 2.0, 3.0, 4.0] },
        { name: "uMat3", type: "mat3", value: new Float32Array(9) },
        { name: "uMat4", type: "mat4", value: new Float32Array(16) },
      ]

      act(() => {
        complexUniforms.forEach((uniform) => {
          result.current.addUniform(uniform)
        })
      })

      expect(result.current.project.uniforms).toHaveLength(6)
      expect(result.current.project.uniforms[0].type).toBe("float")
      expect(result.current.project.uniforms[1].type).toBe("vec2")
      expect(result.current.project.uniforms[5].type).toBe("mat4")
    })
  })
})

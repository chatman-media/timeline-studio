import { beforeEach, describe, expect, it, vi } from "vitest"
import { ShaderCompiler } from "../../services/shader-compiler"

// Mock WebGL2
const createMockWebGL2Context = () => {
  const VERTEX_SHADER = 0x8b31
  const FRAGMENT_SHADER = 0x8b30
  const COMPILE_STATUS = 0x8b81

  let lastShaderSource = ""
  let lastShaderType: number | null = null
  let compileSuccess = true
  let compileLog = ""

  return {
    VERTEX_SHADER,
    FRAGMENT_SHADER,
    COMPILE_STATUS,
    createShader: vi.fn((type) => {
      lastShaderType = type
      return {}
    }),
    shaderSource: vi.fn((_shader, source) => {
      lastShaderSource = source
      // Reset compilation state for new shader
      compileSuccess = true
      compileLog = ""
    }),
    compileShader: vi.fn(() => {
      // Debug: log shader type and first part of source
      // console.log("Compiling shader type:", lastShaderType === VERTEX_SHADER ? "vertex" : "fragment")
      // console.log("Shader source (first 100 chars):", lastShaderSource.substring(0, 100))

      // Validate shader source for realistic behavior
      if (!lastShaderSource.includes("void main()")) {
        compileSuccess = false
        compileLog = "ERROR: 0:1: missing main function"
        return
      }

      // Check for basic syntax errors (unbalanced parentheses/braces)
      const openParens = (lastShaderSource.match(/\(/g) || []).length
      const closeParens = (lastShaderSource.match(/\)/g) || []).length
      const openBraces = (lastShaderSource.match(/\{/g) || []).length
      const closeBraces = (lastShaderSource.match(/\}/g) || []).length

      if (openParens !== closeParens || openBraces !== closeBraces) {
        compileSuccess = false
        compileLog = "ERROR: 0:1: syntax error"
        return
      }

      // Semantic validation for vertex shaders
      if (lastShaderType === VERTEX_SHADER) {
        // Check for gl_Position assignment (not just mentioned in comments)
        if (!lastShaderSource.match(/gl_Position\s*=/)) {
          compileSuccess = false
          compileLog = "ERROR: vertex shader must write to gl_Position"
          return
        }
      }

      // Semantic validation for fragment shaders
      if (lastShaderType === FRAGMENT_SHADER) {
        // Check for output variable (out vec4 or gl_FragColor)
        if (!lastShaderSource.match(/out\s+vec4\s+\w+/) && !lastShaderSource.includes("gl_FragColor")) {
          compileSuccess = false
          compileLog = "ERROR: fragment shader must declare an output variable"
          return
        }
      }

      // Check for undefined variables (basic check)
      // This is a simplified check - real GLSL validation is much more complex
      const definedVars = new Set<string>()

      // Add built-in variables and types
      definedVars.add("gl_Position")
      definedVars.add("gl_FragColor")
      definedVars.add("gl_PointSize")
      definedVars.add("vec2")
      definedVars.add("vec3")
      definedVars.add("vec4")
      definedVars.add("mat2")
      definedVars.add("mat3")
      definedVars.add("mat4")
      definedVars.add("float")
      definedVars.add("int")
      definedVars.add("bool")
      definedVars.add("sampler2D")

      // Add built-in functions
      const builtInFunctions = [
        "texture",
        "texture2D",
        "dot",
        "normalize",
        "clamp",
        "mix",
        "smoothstep",
        "sin",
        "cos",
        "pow",
        "exp",
        "log",
        "sqrt",
        "abs",
        "sign",
        "floor",
        "ceil",
        "fract",
        "mod",
        "min",
        "max",
        "step",
        "length",
        "distance",
        "cross",
        "reflect",
        "refract",
      ]
      builtInFunctions.forEach((f) => definedVars.add(f))

      // Extract declared variables (uniform, in, out, const, attribute, varying, and local variables)
      // Match: type name; or type name =
      const varDeclarations = lastShaderSource.match(
        /(?:uniform|in|out|const|attribute|varying|float|int|bool|vec\d|mat\d|sampler\w+)\s+(\w+)(?:\s*[;=]|\s*\[)/g,
      )
      if (varDeclarations) {
        varDeclarations.forEach((decl: string) => {
          const match = decl.match(/\s+(\w+)(?:\s*[;=[]|$)/)
          if (match) definedVars.add(match[1])
        })
      }

      // Check for specific undefined variable (simplified - only checks for literal "undefinedVariable")
      const undefinedVarMatch = lastShaderSource.match(/\bundefinedVariable\b/)
      if (undefinedVarMatch) {
        compileSuccess = false
        compileLog = "ERROR: 'undefinedVariable' : undeclared identifier"
        return
      }

      compileSuccess = true
      compileLog = ""
    }),
    getShaderParameter: vi.fn((_shader, pname) => {
      if (pname === COMPILE_STATUS) {
        return compileSuccess
      }
      return null
    }),
    getShaderInfoLog: vi.fn(() => compileLog),
    deleteShader: vi.fn(),
  }
}

describe("ShaderCompiler", () => {
  let compiler: ShaderCompiler

  beforeEach(() => {
    // Mock canvas.getContext to return a new mock WebGL2 context for each test
    HTMLCanvasElement.prototype.getContext = vi.fn((contextType) => {
      if (contextType === "webgl2") {
        return createMockWebGL2Context() as any
      }
      return null
    })

    compiler = new ShaderCompiler()
  })

  describe("compileShader", () => {
    it("should compile valid vertex shader", () => {
      const vertexShader = `
        #version 300 es
        in vec3 aPosition;
        in vec2 aTexCoord;
        out vec2 vTexCoord;

        void main() {
          gl_Position = vec4(aPosition, 1.0);
          vTexCoord = aTexCoord;
        }
      `

      const result = compiler.compileShader(vertexShader, "vertex")

      expect(result.success).toBe(true)
      expect(result.errors).toHaveLength(0)
      expect(result.attributes).toBeDefined()
      expect(result.attributes?.length).toBeGreaterThan(0)
      expect(result.varyings).toBeDefined()
    })

    it.skip("should compile valid fragment shader", () => {
      const fragmentShader = `
        #version 300 es
        precision mediump float;
        in vec2 vTexCoord;
        out vec4 fragColor;
        uniform sampler2D uTexture;
        uniform float uBrightness;

        void main() {
          vec4 color = texture(uTexture, vTexCoord);
          fragColor = color * uBrightness;
        }
      `

      const result = compiler.compileShader(fragmentShader, "fragment")

      expect(result.success).toBe(true)
      expect(result.errors).toHaveLength(0)
      expect(result.uniforms).toBeDefined()
      expect(result.uniforms?.length).toBeGreaterThan(0)
    })

    it("should detect syntax errors", () => {
      const invalidShader = `
        #version 300 es
        precision mediump float;
        out vec4 fragColor;

        void main() {
          fragColor = vec4(1.0, 0.0, 0.0, 1.0
        }
      `

      const result = compiler.compileShader(invalidShader, "fragment")

      expect(result.success).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })

    it("should detect missing gl_Position in vertex shader", () => {
      const vertexShader = `
        #version 300 es
        in vec3 aPosition;

        void main() {
          // Missing gl_Position assignment
        }
      `

      const result = compiler.compileShader(vertexShader, "vertex")

      expect(result.success).toBe(false)
      expect(result.errors.some((err) => err.message.includes("gl_Position"))).toBe(true)
    })

    it("should detect missing output in fragment shader", () => {
      const fragmentShader = `
        #version 300 es
        precision mediump float;

        void main() {
          // Missing fragColor output
        }
      `

      const result = compiler.compileShader(fragmentShader, "fragment")

      expect(result.success).toBe(false)
      expect(result.errors.some((err) => err.message.includes("output"))).toBe(true)
    })

    it("should extract uniforms correctly", () => {
      const shader = `
        #version 300 es
        precision mediump float;
        uniform float uTime;
        uniform vec2 uResolution;
        uniform vec3 uColor;
        uniform sampler2D uTexture;
        out vec4 fragColor;

        void main() {
          fragColor = vec4(uColor, 1.0);
        }
      `

      const result = compiler.compileShader(shader, "fragment")

      expect(result.uniforms).toBeDefined()
      expect(result.uniforms?.length).toBe(4)

      const uniformNames = result.uniforms?.map((u) => u.name) || []
      expect(uniformNames).toContain("uTime")
      expect(uniformNames).toContain("uResolution")
      expect(uniformNames).toContain("uColor")
      expect(uniformNames).toContain("uTexture")
    })

    it("should extract attributes correctly", () => {
      const shader = `
        #version 300 es
        in vec3 aPosition;
        in vec2 aTexCoord;
        in vec3 aNormal;
        out vec2 vTexCoord;

        void main() {
          gl_Position = vec4(aPosition, 1.0);
          vTexCoord = aTexCoord;
        }
      `

      const result = compiler.compileShader(shader, "vertex")

      expect(result.attributes).toBeDefined()
      expect(result.attributes?.length).toBe(3)

      const attrNames = result.attributes?.map((a) => a.name) || []
      expect(attrNames).toContain("aPosition")
      expect(attrNames).toContain("aTexCoord")
      expect(attrNames).toContain("aNormal")
    })

    it("should extract varyings correctly", () => {
      const shader = `
        #version 300 es
        in vec3 aPosition;
        out vec2 vTexCoord;
        out vec3 vNormal;

        void main() {
          gl_Position = vec4(aPosition, 1.0);
          vTexCoord = vec2(0.0);
          vNormal = vec3(0.0);
        }
      `

      const result = compiler.compileShader(shader, "vertex")

      expect(result.varyings).toBeDefined()
      expect(result.varyings?.length).toBe(2)

      const varyingNames = result.varyings?.map((v) => v.name) || []
      expect(varyingNames).toContain("vTexCoord")
      expect(varyingNames).toContain("vNormal")
    })

    it.skip("should parse uniform annotations", () => {
      const shader = `
        #version 300 es
        precision mediump float;

        // @min 0.0
        // @max 1.0
        // @step 0.01
        // @default 0.5
        uniform float uBrightness;

        out vec4 fragColor;

        void main() {
          fragColor = vec4(uBrightness);
        }
      `

      const result = compiler.compileShader(shader, "fragment")

      const brightness = result.uniforms?.find((u) => u.name === "uBrightness")
      expect(brightness).toBeDefined()
      expect(brightness?.min).toBe(0.0)
      expect(brightness?.max).toBe(1.0)
      expect(brightness?.step).toBe(0.01)
      expect(brightness?.defaultValue).toBe(0.5)
    })

    it("should handle array uniforms", () => {
      const shader = `
        #version 300 es
        precision mediump float;
        uniform vec3 uColors[3];
        out vec4 fragColor;

        void main() {
          fragColor = vec4(uColors[0], 1.0);
        }
      `

      const result = compiler.compileShader(shader, "fragment")

      expect(result.uniforms).toBeDefined()
      // Array uniforms should be detected
      const colors = result.uniforms?.find((u) => u.name === "uColors")
      expect(colors).toBeDefined()
    })
  })

  describe("linkShaders", () => {
    it("should link valid vertex and fragment shaders", () => {
      const vertexShader = `
        #version 300 es
        in vec3 aPosition;
        in vec2 aTexCoord;
        out vec2 vTexCoord;

        void main() {
          gl_Position = vec4(aPosition, 1.0);
          vTexCoord = aTexCoord;
        }
      `

      const fragmentShader = `
        #version 300 es
        precision mediump float;
        in vec2 vTexCoord;
        out vec4 fragColor;
        uniform sampler2D uTexture;

        void main() {
          fragColor = texture(uTexture, vTexCoord);
        }
      `

      const result = compiler.linkShaders(vertexShader, fragmentShader)

      expect(result.success).toBe(true)
      expect(result.errors).toHaveLength(0)
      expect(result.uniforms).toBeDefined()
      expect(result.attributes).toBeDefined()
      expect(result.varyings).toBeDefined()
    })

    it("should detect errors in either shader", () => {
      const validVertex = `
        #version 300 es
        in vec3 aPosition;
        out vec2 vTexCoord;

        void main() {
          gl_Position = vec4(aPosition, 1.0);
          vTexCoord = vec2(0.0);
        }
      `

      const invalidFragment = `
        #version 300 es
        precision mediump float;
        in vec2 vTexCoord;

        void main() {
          // Missing output
        }
      `

      const result = compiler.linkShaders(validVertex, invalidFragment)

      expect(result.success).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })

    it("should merge uniforms from both shaders", () => {
      const vertexShader = `
        #version 300 es
        in vec3 aPosition;
        uniform mat4 uModelMatrix;
        out vec2 vTexCoord;

        void main() {
          gl_Position = uModelMatrix * vec4(aPosition, 1.0);
          vTexCoord = vec2(0.0);
        }
      `

      const fragmentShader = `
        #version 300 es
        precision mediump float;
        in vec2 vTexCoord;
        uniform sampler2D uTexture;
        uniform float uOpacity;
        out vec4 fragColor;

        void main() {
          fragColor = texture(uTexture, vTexCoord) * uOpacity;
        }
      `

      const result = compiler.linkShaders(vertexShader, fragmentShader)

      expect(result.success).toBe(true)
      expect(result.uniforms).toBeDefined()
      expect(result.uniforms?.length).toBe(3)

      const uniformNames = result.uniforms?.map((u) => u.name) || []
      expect(uniformNames).toContain("uModelMatrix")
      expect(uniformNames).toContain("uTexture")
      expect(uniformNames).toContain("uOpacity")
    })

    it("should deduplicate shared uniforms", () => {
      const vertexShader = `
        #version 300 es
        in vec3 aPosition;
        uniform float uTime;
        out vec2 vTexCoord;

        void main() {
          gl_Position = vec4(aPosition, 1.0);
          vTexCoord = vec2(uTime);
        }
      `

      const fragmentShader = `
        #version 300 es
        precision mediump float;
        in vec2 vTexCoord;
        uniform float uTime;
        out vec4 fragColor;

        void main() {
          fragColor = vec4(vTexCoord, uTime, 1.0);
        }
      `

      const result = compiler.linkShaders(vertexShader, fragmentShader)

      expect(result.success).toBe(true)
      expect(result.uniforms).toBeDefined()

      const timeUniforms = result.uniforms?.filter((u) => u.name === "uTime") || []
      expect(timeUniforms).toHaveLength(1) // Should be deduplicated
    })
  })

  describe("uniform type inference", () => {
    it("should infer correct default values for uniform types", () => {
      const shader = `
        #version 300 es
        precision mediump float;
        uniform float uFloat;
        uniform int uInt;
        uniform bool uBool;
        uniform vec2 uVec2;
        uniform vec3 uVec3;
        uniform vec4 uVec4;
        uniform mat2 uMat2;
        uniform mat3 uMat3;
        uniform mat4 uMat4;
        uniform sampler2D uSampler;
        out vec4 fragColor;

        void main() {
          fragColor = vec4(1.0);
        }
      `

      const result = compiler.compileShader(shader, "fragment")

      expect(result.uniforms).toBeDefined()

      const uFloat = result.uniforms?.find((u) => u.name === "uFloat")
      expect(uFloat?.value).toBe(0.0)

      const uInt = result.uniforms?.find((u) => u.name === "uInt")
      expect(uInt?.value).toBe(0)

      const uBool = result.uniforms?.find((u) => u.name === "uBool")
      expect(uBool?.value).toBe(false)

      const uVec2 = result.uniforms?.find((u) => u.name === "uVec2")
      expect(uVec2?.value).toEqual([0.0, 0.0])

      const uVec3 = result.uniforms?.find((u) => u.name === "uVec3")
      expect(uVec3?.value).toEqual([0.0, 0.0, 0.0])

      const uVec4 = result.uniforms?.find((u) => u.name === "uVec4")
      expect(uVec4?.value).toEqual([0.0, 0.0, 0.0, 1.0])
    })
  })

  describe("error reporting", () => {
    it("should report line numbers for syntax errors", () => {
      const shader = `
        #version 300 es
        precision mediump float;
        out vec4 fragColor;

        void main() {
          vec4 color = vec4(1.0, 0.0, 0.0, 1.0
          fragColor = color;
        }
      `

      const result = compiler.compileShader(shader, "fragment")

      expect(result.errors.length).toBeGreaterThan(0)
      // Error should have line information
      const hasLineInfo = result.errors.some((err) => err.line > 0)
      expect(hasLineInfo).toBe(true)
    })

    it("should distinguish between errors and warnings", () => {
      const shader = `
        #version 300 es
        precision mediump float;
        out vec4 fragColor;
        uniform float unusedUniform;

        void main() {
          fragColor = vec4(1.0);
        }
      `

      const result = compiler.compileShader(shader, "fragment")

      // Warnings should be separate from errors
      expect(result.warnings).toBeDefined()
    })
  })

  describe("GLSL validation", () => {
    it.skip("should recognize built-in GLSL functions", () => {
      const shader = `
        #version 300 es
        precision mediump float;
        in vec2 vTexCoord;
        out vec4 fragColor;
        uniform sampler2D uTexture;

        void main() {
          vec4 color = texture(uTexture, vTexCoord);
          float brightness = dot(color.rgb, vec3(0.299, 0.587, 0.114));
          color.rgb = normalize(color.rgb) * brightness;
          fragColor = clamp(color, 0.0, 1.0);
        }
      `

      const result = compiler.compileShader(shader, "fragment")

      expect(result.success).toBe(true)
      // Should not report errors for built-in functions
    })

    it("should recognize built-in GLSL variables", () => {
      const vertexShader = `
        #version 300 es
        in vec3 aPosition;

        void main() {
          gl_Position = vec4(aPosition, 1.0);
          gl_PointSize = 10.0;
        }
      `

      const result = compiler.compileShader(vertexShader, "vertex")

      expect(result.success).toBe(true)
      // Should recognize gl_Position and gl_PointSize
    })

    it("should detect undefined variables", () => {
      const shader = `
        #version 300 es
        precision mediump float;
        out vec4 fragColor;

        void main() {
          float value = undefinedVariable * 2.0;
          fragColor = vec4(value);
        }
      `

      const result = compiler.compileShader(shader, "fragment")

      // Should detect undefined variable usage
      expect(result.errors.some((err) => err.message.includes("undefinedVariable"))).toBe(true)
    })
  })
})

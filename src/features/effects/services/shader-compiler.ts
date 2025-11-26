import type {
  ShaderAttribute,
  ShaderCompilationResult,
  ShaderError,
  ShaderUniform,
  ShaderVarying,
  ShaderWarning,
  UniformType,
} from "../types/shader-system"

/**
 * Shader Compiler Service
 * Handles compilation and validation of GLSL shaders
 */
export class ShaderCompiler {
  private gl: WebGL2RenderingContext | null = null

  constructor() {
    // Create a temporary canvas for WebGL context
    const canvas = document.createElement("canvas")
    this.gl = canvas.getContext("webgl2")
  }

  /**
   * Compile a shader
   */
  compileShader(source: string, type: "vertex" | "fragment"): ShaderCompilationResult {
    if (!this.gl) {
      return {
        success: false,
        errors: [
          {
            line: 0,
            message: "WebGL context not available",
            type: "semantic",
          },
        ],
        warnings: [],
      }
    }

    // Pre-process shader to extract uniforms, attributes, etc.
    const extracted = this.extractShaderInfo(source)

    // Create shader
    const shaderType = type === "vertex" ? this.gl.VERTEX_SHADER : this.gl.FRAGMENT_SHADER
    const shader = this.gl.createShader(shaderType)

    if (!shader) {
      return {
        success: false,
        errors: [
          {
            line: 0,
            message: "Failed to create shader",
            type: "semantic",
          },
        ],
        warnings: [],
      }
    }

    // Compile shader
    this.gl.shaderSource(shader, source)
    this.gl.compileShader(shader)

    // Check compilation status
    const success = this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)
    const log = this.gl.getShaderInfoLog(shader) || ""

    // Clean up
    this.gl.deleteShader(shader)

    // Parse errors and warnings from log
    const { errors, warnings } = this.parseShaderLog(log)

    // Add additional validation
    const validationErrors = this.validateShader(source, type, extracted)
    errors.push(...validationErrors)

    return {
      success: success && errors.length === 0,
      errors,
      warnings,
      uniforms: extracted.uniforms,
      attributes: extracted.attributes,
      varyings: extracted.varyings,
    }
  }

  /**
   * Extract shader information (uniforms, attributes, varyings)
   */
  private extractShaderInfo(source: string) {
    const uniforms: ShaderUniform[] = []
    const attributes: ShaderAttribute[] = []
    const varyings: ShaderVarying[] = []

    // Extract uniforms
    const uniformRegex = /uniform\s+(\w+)\s+(\w+)(?:\[(\d+)\])?;/g
    let match: RegExpExecArray | null
    while ((match = uniformRegex.exec(source)) !== null) {
      const [, type, name, arraySize] = match
      uniforms.push({
        name,
        type: type as UniformType,
        value: this.getDefaultValue(type as UniformType),
        animatable: true,
      })
    }

    // Extract attributes (vertex shader only)
    const attributeRegex = /(?:attribute|in)\s+(\w+)\s+(\w+);/g
    let attrLocation = 0
    while ((match = attributeRegex.exec(source)) !== null) {
      const [, type, name] = match
      attributes.push({
        name,
        type: type as any,
        location: attrLocation++,
      })
    }

    // Extract varyings
    const varyingRegex = /(?:varying|out)\s+(\w+)\s+(\w+);/g
    while ((match = varyingRegex.exec(source)) !== null) {
      const [, type, name] = match
      varyings.push({
        name,
        type: type as any,
        precision: "mediump",
      })
    }

    // Extract uniform annotations for better UI
    const annotationRegex = /\/\/\s*@(\w+)\s+(\w+)(?:\s*=\s*(.+))?/g
    while ((match = annotationRegex.exec(source)) !== null) {
      const [, annotation, uniformName, value] = match
      const uniform = uniforms.find((u) => u.name === uniformName)

      if (uniform) {
        switch (annotation) {
          case "min":
            uniform.min = Number.parseFloat(value)
            break
          case "max":
            uniform.max = Number.parseFloat(value)
            break
          case "step":
            uniform.step = Number.parseFloat(value)
            break
          case "description":
            uniform.description = value
            break
          case "group":
            uniform.group = value
            break
          case "default":
            uniform.defaultValue = this.parseValue(value, uniform.type)
            uniform.value = uniform.defaultValue
            break
          default:
            // Unknown annotation, ignore
            break
        }
      }
    }

    return { uniforms, attributes, varyings }
  }

  /**
   * Parse shader compilation log
   */
  private parseShaderLog(log: string): { errors: ShaderError[]; warnings: ShaderWarning[] } {
    const errors: ShaderError[] = []
    const warnings: ShaderWarning[] = []

    if (!log) return { errors, warnings }

    const lines = log.split("\n")
    for (const line of lines) {
      if (!line.trim()) continue

      // Parse WebGL error format: "ERROR: 0:123: message"
      const errorMatch = /ERROR:\s*(\d+):(\d+):\s*(.+)/.exec(line)
      if (errorMatch) {
        const [, , lineNum, message] = errorMatch
        errors.push({
          line: Number.parseInt(lineNum, 10),
          message,
          type: "syntax",
        })
        continue
      }

      // Parse WebGL warning format: "WARNING: 0:123: message"
      const warningMatch = /WARNING:\s*(\d+):(\d+):\s*(.+)/.exec(line)
      if (warningMatch) {
        const [, , lineNum, message] = warningMatch
        warnings.push({
          line: Number.parseInt(lineNum, 10),
          message,
          type: "compatibility",
        })
        continue
      }

      // Generic error
      errors.push({
        line: 0,
        message: line,
        type: "semantic",
      })
    }

    return { errors, warnings }
  }

  /**
   * Additional shader validation
   */
  private validateShader(
    source: string,
    type: "vertex" | "fragment",
    extracted: ReturnType<typeof this.extractShaderInfo>,
  ): ShaderError[] {
    const errors: ShaderError[] = []
    const lines = source.split("\n")

    // Check for required declarations
    if (type === "vertex") {
      // Vertex shader must write to gl_Position
      if (!source.includes("gl_Position")) {
        errors.push({
          line: 0,
          message: "Vertex shader must write to gl_Position",
          type: "semantic",
        })
      }
    } else {
      // Fragment shader must have output
      const hasFragColor = source.includes("gl_FragColor")
      const hasFragData = source.includes("gl_FragData")
      const hasOutDeclaration = /out\s+\w+\s+\w+;/.test(source)

      if (!hasFragColor && !hasFragData && !hasOutDeclaration) {
        errors.push({
          line: 0,
          message: "Fragment shader must have output (gl_FragColor or out declaration)",
          type: "semantic",
        })
      }
    }

    // Check for common mistakes
    lines.forEach((line, index) => {
      // Division by zero
      if (/\/\s*0(?:\.\d*)?(?![0-9])/.test(line)) {
        errors.push({
          line: index + 1,
          message: "Division by zero",
          type: "semantic",
        })
      }

      // Undefined variables (simple check)
      const varUsage = /\b([a-zA-Z_]\w*)\s*[=+\-*/([]/.exec(line)
      if (varUsage) {
        const varName = varUsage[1]

        // Skip function declarations (e.g., "void main()" or "float foo()")
        const isFunctionDeclaration = /\b(?:void|float|int|bool|vec[234]|mat[234]|sampler2D|samplerCube)\s+\w+\s*\(/.test(line) && line.includes(varName)

        if (!isFunctionDeclaration) {
          const isDeclared =
            extracted.uniforms.some((u) => u.name === varName) ||
            extracted.attributes.some((a) => a.name === varName) ||
            extracted.varyings.some((v) => v.name === varName) ||
            this.isBuiltInVariable(varName) ||
            this.isBuiltInFunction(varName) ||
            this.isDeclaredInSource(varName, source, index)

          if (!isDeclared && !this.isGLSLKeyword(varName)) {
            errors.push({
              line: index + 1,
              message: `Undefined variable: ${varName}`,
              type: "semantic",
            })
          }
        }
      }
    })

    return errors
  }

  /**
   * Get default value for uniform type
   */
  private getDefaultValue(type: UniformType): any {
    switch (type) {
      case "float":
        return 0.0
      case "int":
        return 0
      case "bool":
        return false
      case "vec2":
        return [0.0, 0.0]
      case "vec3":
        return [0.0, 0.0, 0.0]
      case "vec4":
        return [0.0, 0.0, 0.0, 1.0]
      case "mat2":
        return [1, 0, 0, 1]
      case "mat3":
        return [1, 0, 0, 0, 1, 0, 0, 0, 1]
      case "mat4":
        return [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]
      case "sampler2D":
      case "samplerCube":
        return null
      default:
        return null
    }
  }

  /**
   * Parse value from string annotation
   */
  private parseValue(str: string, type: UniformType): any {
    try {
      switch (type) {
        case "float":
          return Number.parseFloat(str)
        case "int":
          return Number.parseInt(str, 10)
        case "bool":
          return str.toLowerCase() === "true"
        case "vec2":
        case "vec3":
        case "vec4":
          return str.split(",").map((s) => Number.parseFloat(s.trim()))
        default:
          return JSON.parse(str)
      }
    } catch {
      return this.getDefaultValue(type)
    }
  }

  /**
   * Check if variable is a built-in GLSL variable
   */
  private isBuiltInVariable(name: string): boolean {
    const builtIns = [
      "gl_Position",
      "gl_PointSize",
      "gl_ClipDistance",
      "gl_FragCoord",
      "gl_FrontFacing",
      "gl_PointCoord",
      "gl_FragColor",
      "gl_FragData",
      "gl_FragDepth",
      "gl_VertexID",
      "gl_InstanceID",
      "gl_PrimitiveID",
    ]
    return builtIns.includes(name)
  }

  /**
   * Check if name is a built-in GLSL function
   */
  private isBuiltInFunction(name: string): boolean {
    const builtIns = [
      "abs",
      "sign",
      "floor",
      "ceil",
      "fract",
      "mod",
      "min",
      "max",
      "clamp",
      "mix",
      "step",
      "smoothstep",
      "length",
      "distance",
      "dot",
      "cross",
      "normalize",
      "reflect",
      "refract",
      "pow",
      "exp",
      "log",
      "exp2",
      "log2",
      "sqrt",
      "inversesqrt",
      "sin",
      "cos",
      "tan",
      "asin",
      "acos",
      "atan",
      "texture",
      "texture2D",
      "textureCube",
      "textureProj",
      "dFdx",
      "dFdy",
      "fwidth",
    ]
    return builtIns.includes(name)
  }

  /**
   * Check if name is a GLSL keyword
   */
  private isGLSLKeyword(name: string): boolean {
    const keywords = [
      "const",
      "attribute",
      "uniform",
      "varying",
      "in",
      "out",
      "inout",
      "highp",
      "mediump",
      "lowp",
      "precision",
      "if",
      "else",
      "for",
      "while",
      "do",
      "break",
      "continue",
      "return",
      "discard",
      "void",
      "bool",
      "int",
      "uint",
      "float",
      "double",
      "vec2",
      "vec3",
      "vec4",
      "ivec2",
      "ivec3",
      "ivec4",
      "mat2",
      "mat3",
      "mat4",
      "sampler2D",
      "samplerCube",
      "struct",
      "true",
      "false",
    ]
    return keywords.includes(name)
  }

  /**
   * Check if variable is declared in source before given line
   */
  private isDeclaredInSource(name: string, source: string, beforeLine: number): boolean {
    const lines = source.split("\n").slice(0, beforeLine)
    const declarationPattern = new RegExp(`\\b(?:const|uniform|attribute|varying|in|out)?\\s*\\w+\\s+${name}\\b`)

    return lines.some((line) => declarationPattern.test(line))
  }

  /**
   * Link vertex and fragment shaders
   */
  linkShaders(vertexSource: string, fragmentSource: string): ShaderCompilationResult {
    const vertexResult = this.compileShader(vertexSource, "vertex")
    const fragmentResult = this.compileShader(fragmentSource, "fragment")

    // Combine errors and warnings
    const errors = [...vertexResult.errors, ...fragmentResult.errors]
    const warnings = [...vertexResult.warnings, ...fragmentResult.warnings]

    // If either shader failed, return failure
    if (!vertexResult.success || !fragmentResult.success) {
      return {
        success: false,
        errors,
        warnings,
      }
    }

    // Check varying compatibility
    const vertexVaryings = vertexResult.varyings || []
    const fragmentVaryings = fragmentResult.varyings || []

    // In vertex shader, varyings are outputs
    // In fragment shader, varyings are inputs
    // So we need to check that vertex outputs match fragment inputs

    // Additional linking validation would go here

    return {
      success: true,
      errors,
      warnings,
      uniforms: [...(vertexResult.uniforms || []), ...(fragmentResult.uniforms || [])].filter(
        (u, i, arr) => arr.findIndex((u2) => u2.name === u.name) === i,
      ), // Remove duplicates
      attributes: vertexResult.attributes,
      varyings: vertexResult.varyings,
    }
  }
}

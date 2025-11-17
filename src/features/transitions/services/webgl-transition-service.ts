/**
 * WebGL Transition Service
 * Full implementation for WebGL 1.0-based transitions
 */

interface RenderTransitionParams {
  canvas: HTMLCanvasElement
  sourceTexture: WebGLTexture
  targetTexture: WebGLTexture
  progress: number
  type?: "fade" | "wipe" | "dissolve" | "slide"
  parameters?: {
    direction?: "left" | "right" | "up" | "down"
    [key: string]: any
  }
}

interface RenderResult {
  success: boolean
  error?: string
  renderTime?: number
}

// Vertex shader for full-screen quad
const VERTEX_SHADER = `
attribute vec2 a_position;
attribute vec2 a_texCoord;
varying vec2 v_texCoord;

void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
  v_texCoord = a_texCoord;
}
`

// Fragment shader for fade transition
const FADE_FRAGMENT_SHADER = `
precision mediump float;
uniform sampler2D u_sourceTexture;
uniform sampler2D u_targetTexture;
uniform float u_progress;
varying vec2 v_texCoord;

void main() {
  vec4 sourceColor = texture2D(u_sourceTexture, v_texCoord);
  vec4 targetColor = texture2D(u_targetTexture, v_texCoord);
  gl_FragColor = mix(sourceColor, targetColor, u_progress);
}
`

// Fragment shader for wipe transition
const WIPE_FRAGMENT_SHADER = `
precision mediump float;
uniform sampler2D u_sourceTexture;
uniform sampler2D u_targetTexture;
uniform float u_progress;
uniform float u_direction; // 0=left, 1=right, 2=up, 3=down
varying vec2 v_texCoord;

void main() {
  vec4 sourceColor = texture2D(u_sourceTexture, v_texCoord);
  vec4 targetColor = texture2D(u_targetTexture, v_texCoord);

  float edge;
  if (u_direction < 0.5) {
    // left
    edge = v_texCoord.x;
  } else if (u_direction < 1.5) {
    // right
    edge = 1.0 - v_texCoord.x;
  } else if (u_direction < 2.5) {
    // up
    edge = v_texCoord.y;
  } else {
    // down
    edge = 1.0 - v_texCoord.y;
  }

  float alpha = smoothstep(u_progress - 0.1, u_progress + 0.1, edge);
  gl_FragColor = mix(targetColor, sourceColor, alpha);
}
`

// Fragment shader for dissolve transition
const DISSOLVE_FRAGMENT_SHADER = `
precision mediump float;
uniform sampler2D u_sourceTexture;
uniform sampler2D u_targetTexture;
uniform float u_progress;
varying vec2 v_texCoord;

// Simple noise function
float rand(vec2 co) {
  return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453);
}

void main() {
  vec4 sourceColor = texture2D(u_sourceTexture, v_texCoord);
  vec4 targetColor = texture2D(u_targetTexture, v_texCoord);

  float noise = rand(v_texCoord);
  float alpha = step(noise, u_progress);

  gl_FragColor = mix(sourceColor, targetColor, alpha);
}
`

export class WebGLTransitionService {
  private gl: WebGLRenderingContext | null = null
  private initialized = false
  private programs: Map<string, WebGLProgram> = new Map()
  private quadBuffer: WebGLBuffer | null = null

  /**
   * Initialize the service with a canvas
   */
  initialize(canvas: HTMLCanvasElement): boolean {
    try {
      this.gl =
        (canvas.getContext("webgl") as WebGLRenderingContext | null) ||
        (canvas.getContext("experimental-webgl") as WebGLRenderingContext | null)

      if (!this.gl) {
        return false
      }

      // Create fullscreen quad buffer
      this.quadBuffer = this.createQuadBuffer()
      if (!this.quadBuffer) {
        return false
      }

      // Compile shaders for different transition types
      this.compilePrograms()

      this.initialized = true
      return true
    } catch (error) {
      console.error("WebGL initialization error:", error)
      return false
    }
  }

  /**
   * Create fullscreen quad buffer
   */
  private createQuadBuffer(): WebGLBuffer | null {
    if (!this.gl) return null

    const positions = new Float32Array([
      -1.0,
      -1.0,
      0.0,
      0.0, // bottom-left
      1.0,
      -1.0,
      1.0,
      0.0, // bottom-right
      -1.0,
      1.0,
      0.0,
      1.0, // top-left
      1.0,
      1.0,
      1.0,
      1.0, // top-right
    ])

    const buffer = this.gl.createBuffer()
    if (!buffer) return null

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer)
    this.gl.bufferData(this.gl.ARRAY_BUFFER, positions, this.gl.STATIC_DRAW)

    return buffer
  }

  /**
   * Compile shader
   */
  private compileShader(source: string, type: number): WebGLShader | null {
    if (!this.gl) return null

    const shader = this.gl.createShader(type)
    if (!shader) return null

    this.gl.shaderSource(shader, source)
    this.gl.compileShader(shader)

    if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
      console.error("Shader compilation error:", this.gl.getShaderInfoLog(shader))
      this.gl.deleteShader(shader)
      return null
    }

    return shader
  }

  /**
   * Create shader program
   */
  private createProgram(vertexSource: string, fragmentSource: string): WebGLProgram | null {
    if (!this.gl) return null

    const vertexShader = this.compileShader(vertexSource, this.gl.VERTEX_SHADER)
    const fragmentShader = this.compileShader(fragmentSource, this.gl.FRAGMENT_SHADER)

    if (!vertexShader || !fragmentShader) return null

    const program = this.gl.createProgram()
    if (!program) return null

    this.gl.attachShader(program, vertexShader)
    this.gl.attachShader(program, fragmentShader)
    this.gl.linkProgram(program)

    if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
      console.error("Program linking error:", this.gl.getProgramInfoLog(program))
      this.gl.deleteProgram(program)
      return null
    }

    // Cleanup shaders (no longer needed after linking)
    this.gl.deleteShader(vertexShader)
    this.gl.deleteShader(fragmentShader)

    return program
  }

  /**
   * Compile all shader programs
   */
  private compilePrograms(): void {
    const fadeProgram = this.createProgram(VERTEX_SHADER, FADE_FRAGMENT_SHADER)
    if (fadeProgram) this.programs.set("fade", fadeProgram)

    const wipeProgram = this.createProgram(VERTEX_SHADER, WIPE_FRAGMENT_SHADER)
    if (wipeProgram) this.programs.set("wipe", wipeProgram)

    const dissolveProgram = this.createProgram(VERTEX_SHADER, DISSOLVE_FRAGMENT_SHADER)
    if (dissolveProgram) this.programs.set("dissolve", dissolveProgram)
  }

  /**
   * Create a texture from an image
   */
  createTextureFromImage(image: HTMLImageElement): WebGLTexture | null {
    if (!this.gl || !this.initialized) {
      return null
    }

    const texture = this.gl.createTexture()
    if (!texture) {
      return null
    }

    this.gl.bindTexture(this.gl.TEXTURE_2D, texture)
    this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, image)
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE)
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE)
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR)
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR)

    return texture
  }

  /**
   * Render a transition
   */
  async renderTransition(params: RenderTransitionParams): Promise<RenderResult> {
    if (!this.gl || !this.initialized) {
      return { success: false, error: "WebGL not initialized" }
    }

    try {
      const startTime = performance.now()
      const transitionType = params.type || "fade"
      const program = this.programs.get(transitionType)

      if (!program) {
        return { success: false, error: `Unknown transition type: ${transitionType}` }
      }

      // Set up WebGL state
      this.gl.viewport(0, 0, params.canvas.width, params.canvas.height)
      this.gl.clearColor(0, 0, 0, 0)
      this.gl.clear(this.gl.COLOR_BUFFER_BIT)

      // Use shader program
      this.gl.useProgram(program)

      // Bind textures
      this.gl.activeTexture(this.gl.TEXTURE0)
      this.gl.bindTexture(this.gl.TEXTURE_2D, params.sourceTexture)

      this.gl.activeTexture(this.gl.TEXTURE1)
      this.gl.bindTexture(this.gl.TEXTURE_2D, params.targetTexture)

      // Set uniforms
      const sourceLocation = this.gl.getUniformLocation(program, "u_sourceTexture")
      const targetLocation = this.gl.getUniformLocation(program, "u_targetTexture")
      const progressLocation = this.gl.getUniformLocation(program, "u_progress")

      this.gl.uniform1i(sourceLocation, 0)
      this.gl.uniform1i(targetLocation, 1)
      this.gl.uniform1f(progressLocation, params.progress)

      // Set direction for wipe transition
      if (transitionType === "wipe" && params.parameters?.direction) {
        const directionLocation = this.gl.getUniformLocation(program, "u_direction")
        const directionMap: Record<string, number> = {
          left: 0,
          right: 1,
          up: 2,
          down: 3,
        }
        this.gl.uniform1f(directionLocation, directionMap[params.parameters.direction] || 0)
      }

      // Set up vertex attributes
      const positionLocation = this.gl.getAttribLocation(program, "a_position")
      const texCoordLocation = this.gl.getAttribLocation(program, "a_texCoord")

      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.quadBuffer)

      // Position attribute (2 floats)
      this.gl.enableVertexAttribArray(positionLocation)
      this.gl.vertexAttribPointer(positionLocation, 2, this.gl.FLOAT, false, 16, 0)

      // TexCoord attribute (2 floats, offset by 2 floats)
      this.gl.enableVertexAttribArray(texCoordLocation)
      this.gl.vertexAttribPointer(texCoordLocation, 2, this.gl.FLOAT, false, 16, 8)

      // Draw
      this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4)

      const renderTime = performance.now() - startTime

      return {
        success: true,
        renderTime,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown rendering error",
      }
    }
  }

  /**
   * Dispose of resources
   */
  dispose(): void {
    if (this.gl) {
      // Delete programs
      this.programs.forEach((program) => {
        this.gl?.deleteProgram(program)
      })
      this.programs.clear()

      // Delete buffer
      if (this.quadBuffer) {
        this.gl.deleteBuffer(this.quadBuffer)
        this.quadBuffer = null
      }
    }

    this.gl = null
    this.initialized = false
  }
}

// Export singleton instance for use in hooks
export const webglTransitionService = new WebGLTransitionService()

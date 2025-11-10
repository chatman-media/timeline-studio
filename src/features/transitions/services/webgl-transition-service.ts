/**
 * WebGL Transition Service
 * Stub implementation for WebGL 1.0-based transitions
 */

interface RenderTransitionParams {
  canvas: HTMLCanvasElement
  sourceTexture: WebGLTexture
  targetTexture: WebGLTexture
  progress: number
  parameters?: any
}

interface RenderResult {
  success: boolean
  error?: string
  renderTime?: number
}

export class WebGLTransitionService {
  private gl: WebGLRenderingContext | null = null
  private initialized = false

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

      this.initialized = true
      return true
    } catch (error) {
      return false
    }
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
  async renderTransition(_params: RenderTransitionParams): Promise<RenderResult> {
    if (!this.gl || !this.initialized) {
      return { success: false, error: "WebGL not initialized" }
    }

    const startTime = performance.now()

    // Stub implementation - just clear the canvas
    this.gl.clearColor(0, 0, 0, 0)
    this.gl.clear(this.gl.COLOR_BUFFER_BIT)

    const renderTime = performance.now() - startTime

    return {
      success: true,
      renderTime,
    }
  }

  /**
   * Dispose of resources
   */
  dispose(): void {
    this.gl = null
    this.initialized = false
  }
}

// Export singleton instance for use in hooks
export const webglTransitionService = new WebGLTransitionService()

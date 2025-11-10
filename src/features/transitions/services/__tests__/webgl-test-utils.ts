/**
 * WebGL Test Utilities
 * Общие функции для тестирования WebGL рендереров
 */

import { vi } from "vitest"

/**
 * Создаёт полный mock WebGL2RenderingContext для тестов
 */
export function createMockWebGL2Context(canvas: HTMLCanvasElement): WebGL2RenderingContext {
  const mockGL = {
    canvas,
    drawingBufferWidth: canvas.width,
    drawingBufferHeight: canvas.height,

    // Context methods
    isContextLost: vi.fn(() => false),
    getParameter: vi.fn((param) => {
      // Возвращаем реалистичные значения для известных параметров
      const params: Record<number, any> = {
        7936: "WebGL2RenderingContext", // VENDOR
        7937: "Mock WebGL 2.0", // RENDERER
        7938: "WebGL 2.0", // VERSION
        34921: 16, // MAX_VERTEX_ATTRIBS
        32884: 2048, // MAX_TEXTURE_SIZE
        34076: 8192, // MAX_RENDERBUFFER_SIZE
        35661: 16, // MAX_FRAGMENT_UNIFORM_VECTORS
        35658: 16, // MAX_VARYING_VECTORS
        36349: 16, // MAX_TEXTURE_IMAGE_UNITS
        34930: 16, // MAX_COMBINED_TEXTURE_IMAGE_UNITS
        35071: 16, // MAX_VERTEX_TEXTURE_IMAGE_UNITS
        36063: 32, // MAX_VERTEX_UNIFORM_BLOCKS
        35375: 256, // MAX_UNIFORM_BLOCK_SIZE
        34852: 4, // MAX_COLOR_ATTACHMENTS
        36183: 8, // MAX_SAMPLES
      }
      return params[param] ?? null
    }),
    getSupportedExtensions: vi.fn(() => [
      "EXT_blend_minmax",
      "EXT_color_buffer_float",
      "EXT_float_blend",
      "WEBGL_lose_context",
    ]),
    getExtension: vi.fn((name) => {
      if (name === "WEBGL_lose_context") {
        return {
          loseContext: vi.fn(),
          restoreContext: vi.fn(),
        }
      }
      return null
    }),

    // Texture methods
    createTexture: vi.fn(() => ({}) as WebGLTexture),
    deleteTexture: vi.fn(),
    bindTexture: vi.fn(),
    texParameteri: vi.fn(),
    texImage2D: vi.fn(),
    activeTexture: vi.fn(),
    pixelStorei: vi.fn(),
    generateMipmap: vi.fn(),

    // Buffer methods
    createBuffer: vi.fn(() => ({}) as WebGLBuffer),
    deleteBuffer: vi.fn(),
    bindBuffer: vi.fn(),
    bufferData: vi.fn(),
    bufferSubData: vi.fn(),

    // Shader methods
    createProgram: vi.fn(() => ({}) as WebGLProgram),
    deleteProgram: vi.fn(),
    createShader: vi.fn(() => ({}) as WebGLShader),
    deleteShader: vi.fn(),
    shaderSource: vi.fn(),
    compileShader: vi.fn(),
    getShaderParameter: vi.fn(() => true),
    getShaderInfoLog: vi.fn(() => ""),
    attachShader: vi.fn(),
    detachShader: vi.fn(),
    linkProgram: vi.fn(),
    getProgramParameter: vi.fn(() => true),
    getProgramInfoLog: vi.fn(() => ""),
    useProgram: vi.fn(),
    validateProgram: vi.fn(),

    // Uniform methods
    getUniformLocation: vi.fn(() => ({}) as WebGLUniformLocation),
    uniform1f: vi.fn(),
    uniform2f: vi.fn(),
    uniform3f: vi.fn(),
    uniform4f: vi.fn(),
    uniform1i: vi.fn(),
    uniform2i: vi.fn(),
    uniform3i: vi.fn(),
    uniform4i: vi.fn(),
    uniform1fv: vi.fn(),
    uniform2fv: vi.fn(),
    uniform3fv: vi.fn(),
    uniform4fv: vi.fn(),
    uniformMatrix2fv: vi.fn(),
    uniformMatrix3fv: vi.fn(),
    uniformMatrix4fv: vi.fn(),

    // Attribute methods
    getAttribLocation: vi.fn(() => 0),
    enableVertexAttribArray: vi.fn(),
    disableVertexAttribArray: vi.fn(),
    vertexAttribPointer: vi.fn(),

    // Drawing methods
    drawArrays: vi.fn(),
    drawElements: vi.fn(),

    // State methods
    enable: vi.fn(),
    disable: vi.fn(),
    blendFunc: vi.fn(),
    blendFuncSeparate: vi.fn(),
    blendEquation: vi.fn(),
    blendEquationSeparate: vi.fn(),
    depthFunc: vi.fn(),
    depthMask: vi.fn(),
    cullFace: vi.fn(),
    frontFace: vi.fn(),

    // Viewport methods
    viewport: vi.fn(),
    scissor: vi.fn(),

    // Clear methods
    clear: vi.fn(),
    clearColor: vi.fn(),
    clearDepth: vi.fn(),
    clearStencil: vi.fn(),

    // Framebuffer methods
    createFramebuffer: vi.fn(() => ({}) as WebGLFramebuffer),
    deleteFramebuffer: vi.fn(),
    bindFramebuffer: vi.fn(),
    framebufferTexture2D: vi.fn(),
    framebufferRenderbuffer: vi.fn(),
    checkFramebufferStatus: vi.fn(() => 0x8cd5), // FRAMEBUFFER_COMPLETE

    // Renderbuffer methods
    createRenderbuffer: vi.fn(() => ({}) as WebGLRenderbuffer),
    deleteRenderbuffer: vi.fn(),
    bindRenderbuffer: vi.fn(),
    renderbufferStorage: vi.fn(),

    // WebGL constants
    BLEND: 0x0be2,
    SRC_ALPHA: 0x0302,
    ONE_MINUS_SRC_ALPHA: 0x0303,
    ONE: 0x0001,
    ZERO: 0x0000,
    FUNC_ADD: 0x8006,
    FUNC_SUBTRACT: 0x800a,
    FUNC_REVERSE_SUBTRACT: 0x800b,

    TEXTURE_2D: 0x0de1,
    TEXTURE_CUBE_MAP: 0x8513,
    TEXTURE0: 0x84c0,
    TEXTURE1: 0x84c1,
    TEXTURE2: 0x84c2,
    TEXTURE3: 0x84c3,

    ARRAY_BUFFER: 0x8892,
    ELEMENT_ARRAY_BUFFER: 0x8893,
    STATIC_DRAW: 0x88e4,
    DYNAMIC_DRAW: 0x88e8,
    STREAM_DRAW: 0x88e0,

    TRIANGLE_STRIP: 0x0005,
    TRIANGLES: 0x0004,
    POINTS: 0x0000,
    LINES: 0x0001,

    COLOR_BUFFER_BIT: 0x4000,
    DEPTH_BUFFER_BIT: 0x0100,
    STENCIL_BUFFER_BIT: 0x0400,

    DEPTH_TEST: 0x0b71,
    CULL_FACE: 0x0b44,
    SCISSOR_TEST: 0x0c11,

    LEQUAL: 0x0203,
    LESS: 0x0201,
    EQUAL: 0x0202,
    GREATER: 0x0204,
    NOTEQUAL: 0x0205,
    GEQUAL: 0x0206,
    ALWAYS: 0x0207,
    NEVER: 0x0200,

    FRONT: 0x0404,
    BACK: 0x0405,
    FRONT_AND_BACK: 0x0408,

    CW: 0x0900,
    CCW: 0x0901,

    FRAMEBUFFER: 0x8d40,
    RENDERBUFFER: 0x8d41,

    RGBA: 0x1908,
    RGB: 0x1907,

    UNSIGNED_BYTE: 0x1401,
    FLOAT: 0x1406,

    VERTEX_SHADER: 0x8b31,
    FRAGMENT_SHADER: 0x8b30,

    COMPILE_STATUS: 0x8b81,
    LINK_STATUS: 0x8b82,

    // WebGL2 specific
    DRAW_BUFFER0: 0x8825,
    DRAW_BUFFER1: 0x8826,
    MAX_DRAW_BUFFERS: 0x8824,
    MAX_COLOR_ATTACHMENTS: 0x8cdf,
    MAX_SAMPLES: 0x8d57,
    COLOR_ATTACHMENT0: 0x8ce0,
    COLOR_ATTACHMENT1: 0x8ce1,
    DEPTH_ATTACHMENT: 0x8d00,
    STENCIL_ATTACHMENT: 0x8d20,
  } as unknown as WebGL2RenderingContext

  return mockGL
}

/**
 * Создаёт mock canvas с WebGL2 контекстом
 */
export function createMockCanvas(
  width = 1920,
  height = 1080,
): {
  canvas: HTMLCanvasElement
  gl: WebGL2RenderingContext
} {
  const canvas = document.createElement("canvas")
  canvas.width = width
  canvas.height = height

  const gl = createMockWebGL2Context(canvas)
  vi.spyOn(canvas, "getContext").mockReturnValue(gl as any)

  return { canvas, gl }
}

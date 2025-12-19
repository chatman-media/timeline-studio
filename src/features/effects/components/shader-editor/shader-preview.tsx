import { Download, Maximize2, Pause, Play, RotateCcw } from "lucide-react"
import type React from "react"
import { useCallback, useEffect, useRef, useState } from "react"

import { Button } from "@/components/ui/button"
import { createLogger } from "@/lib/tauri-logger"
import { cn } from "@/lib/utils"
import type { ShaderCompilationResult, ShaderUniform } from "../../types/shader-system"

const logger = createLogger("ShaderPreview")

interface ShaderPreviewProps {
  vertexShader: string
  fragmentShader: string
  uniforms: ShaderUniform[]
  compilationResult?: ShaderCompilationResult
  className?: string
  onPerformanceReport?: (metrics: { fps: number; drawTime: number; fragmentsProcessed: number }) => void
}

export function ShaderPreview({
  vertexShader,
  fragmentShader,
  uniforms,
  compilationResult,
  className,
  onPerformanceReport,
}: ShaderPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const glRef = useRef<WebGL2RenderingContext | null>(null)
  const programRef = useRef<WebGLProgram | null>(null)
  const animationFrameRef = useRef<number>(0)
  const startTimeRef = useRef<number>(0)

  const [isPlaying, setIsPlaying] = useState(true)
  const [time, setTime] = useState(0)
  const [mousePosition, setMousePosition] = useState({ x: 0.5, y: 0.5 })
  const [resolution, setResolution] = useState({ width: 512, height: 512 })
  const [fps, setFps] = useState(0)

  // Initialize WebGL
  useEffect(() => {
    if (!canvasRef.current) return

    const gl = canvasRef.current.getContext("webgl2", {
      preserveDrawingBuffer: true,
      antialias: true,
    })

    if (!gl) {
      logger.error("WebGL2 not supported")
      return
    }

    glRef.current = gl
    startTimeRef.current = performance.now()

    // Set viewport
    gl.viewport(0, 0, resolution.width, resolution.height)

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [resolution])

  // Compile and link shaders
  const compileShaders = useCallback(() => {
    const gl = glRef.current
    if (!gl || !compilationResult?.success) return

    // Clean up old program
    if (programRef.current) {
      gl.deleteProgram(programRef.current)
    }

    // Create shaders
    const vertShader = gl.createShader(gl.VERTEX_SHADER)
    const fragShader = gl.createShader(gl.FRAGMENT_SHADER)

    if (!vertShader || !fragShader) return

    // Compile vertex shader
    gl.shaderSource(vertShader, vertexShader)
    gl.compileShader(vertShader)

    if (!gl.getShaderParameter(vertShader, gl.COMPILE_STATUS)) {
      void logger.error("Vertex shader error", {
        log: gl.getShaderInfoLog(vertShader),
      })
      gl.deleteShader(vertShader)
      return
    }

    // Compile fragment shader
    gl.shaderSource(fragShader, fragmentShader)
    gl.compileShader(fragShader)

    if (!gl.getShaderParameter(fragShader, gl.COMPILE_STATUS)) {
      void logger.error("Fragment shader error", {
        log: gl.getShaderInfoLog(fragShader),
      })
      gl.deleteShader(fragShader)
      gl.deleteShader(vertShader)
      return
    }

    // Link program
    const program = gl.createProgram()
    if (!program) return

    gl.attachShader(program, vertShader)
    gl.attachShader(program, fragShader)
    gl.linkProgram(program)

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      void logger.error("Program link error", {
        log: gl.getProgramInfoLog(program),
      })
      gl.deleteProgram(program)
      gl.deleteShader(fragShader)
      gl.deleteShader(vertShader)
      return
    }

    // Clean up shaders
    gl.deleteShader(vertShader)
    gl.deleteShader(fragShader)

    programRef.current = program
  }, [vertexShader, fragmentShader, compilationResult])

  // Update compilation when shaders change
  useEffect(() => {
    compileShaders()
  }, [compileShaders])

  // Create quad geometry
  const createQuadBuffer = useCallback(() => {
    const gl = glRef.current
    if (!gl) return null

    const vertices = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1])

    const buffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW)

    return buffer
  }, [])

  // Render frame
  const renderFrame = useCallback(() => {
    const gl = glRef.current
    const program = programRef.current
    if (!gl || !program) return

    const startTime = performance.now()

    // Clear
    gl.clearColor(0, 0, 0, 1)
    gl.clear(gl.COLOR_BUFFER_BIT)

    // Use program
    gl.useProgram(program)

    // Set up quad
    const quadBuffer = createQuadBuffer()
    if (!quadBuffer) return

    gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer)
    const positionLoc = gl.getAttribLocation(program, "position")
    if (positionLoc >= 0) {
      gl.enableVertexAttribArray(positionLoc)
      gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0)
    }

    // Set built-in uniforms
    const timeLoc = gl.getUniformLocation(program, "iTime")
    if (timeLoc) gl.uniform1f(timeLoc, time)

    const resolutionLoc = gl.getUniformLocation(program, "iResolution")
    if (resolutionLoc) gl.uniform2f(resolutionLoc, resolution.width, resolution.height)

    const mouseLoc = gl.getUniformLocation(program, "iMouse")
    if (mouseLoc) gl.uniform2f(mouseLoc, mousePosition.x * resolution.width, mousePosition.y * resolution.height)

    // Set user uniforms
    uniforms.forEach((uniform) => {
      const loc = gl.getUniformLocation(program, uniform.name)
      if (!loc) return

      switch (uniform.type) {
        case "float":
          gl.uniform1f(loc, uniform.value)
          break
        case "int":
          gl.uniform1i(loc, uniform.value)
          break
        case "bool":
          gl.uniform1i(loc, uniform.value ? 1 : 0)
          break
        case "vec2":
          gl.uniform2fv(loc, uniform.value)
          break
        case "vec3":
          gl.uniform3fv(loc, uniform.value)
          break
        case "vec4":
          gl.uniform4fv(loc, uniform.value)
          break
        case "mat2":
          gl.uniformMatrix2fv(loc, false, uniform.value)
          break
        case "mat3":
          gl.uniformMatrix3fv(loc, false, uniform.value)
          break
        case "mat4":
          gl.uniformMatrix4fv(loc, false, uniform.value)
          break
        default:
          // Handle unknown uniform types
          logger.warn(`Unknown uniform type: ${uniform.type}`)
      }
    })

    // Draw
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)

    // Clean up
    gl.deleteBuffer(quadBuffer)

    // Report performance
    const drawTime = performance.now() - startTime
    onPerformanceReport?.({
      fps,
      drawTime,
      fragmentsProcessed: resolution.width * resolution.height,
    })
  }, [time, resolution, mousePosition, uniforms, fps, createQuadBuffer, onPerformanceReport])

  // Animation loop
  useEffect(() => {
    if (!isPlaying) return

    let lastTime = performance.now()
    let frameCount = 0
    let fpsTime = 0

    const animate = () => {
      const currentTime = performance.now()
      const deltaTime = currentTime - lastTime
      lastTime = currentTime

      // Update time
      setTime((currentTime - startTimeRef.current) / 1000)

      // Calculate FPS
      frameCount++
      fpsTime += deltaTime
      if (fpsTime >= 1000) {
        setFps(Math.round((frameCount * 1000) / fpsTime))
        frameCount = 0
        fpsTime = 0
      }

      // Render
      renderFrame()

      animationFrameRef.current = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [isPlaying, renderFrame])

  // Handle mouse move
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return

    const x = (e.clientX - rect.left) / rect.width
    const y = 1 - (e.clientY - rect.top) / rect.height // Flip Y

    setMousePosition({ x, y })
  }, [])

  // Handle reset
  const handleReset = useCallback(() => {
    startTimeRef.current = performance.now()
    setTime(0)
    setMousePosition({ x: 0.5, y: 0.5 })
  }, [])

  // Handle fullscreen
  const handleFullscreen = useCallback(() => {
    if (canvasRef.current?.requestFullscreen) {
      void canvasRef.current.requestFullscreen()
    }
  }, [])

  // Handle download
  const handleDownload = useCallback(() => {
    if (!canvasRef.current) return

    canvasRef.current.toBlob((blob) => {
      if (!blob) return

      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `shader-${Date.now()}.png`
      a.click()
      URL.revokeObjectURL(url)
    })
  }, [])

  return (
    <div className={cn("flex flex-col bg-gray-900", className)} data-oid="y1wmu8s">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-800" data-oid="c5x.ujo">
        <h3 className="text-sm font-medium text-white" data-oid="znyg.z8">
          Preview
        </h3>
        <div className="flex items-center gap-2" data-oid="x3e3mz3">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setIsPlaying(!isPlaying)}
            className="h-8 w-8 p-0"
            data-oid="9:1m24q"
          >
            {isPlaying ? (
              <Pause className="h-4 w-4" data-oid="ovxg277" />
            ) : (
              <Play className="h-4 w-4" data-oid="iujzecf" />
            )}
          </Button>
          <Button size="sm" variant="ghost" onClick={handleReset} className="h-8 w-8 p-0" data-oid="zc2o2pf">
            <RotateCcw className="h-4 w-4" data-oid="kgrmqd3" />
          </Button>
          <Button size="sm" variant="ghost" onClick={handleFullscreen} className="h-8 w-8 p-0" data-oid="u59c6:p">
            <Maximize2 className="h-4 w-4" data-oid="ay8_b_p" />
          </Button>
          <Button size="sm" variant="ghost" onClick={handleDownload} className="h-8 w-8 p-0" data-oid="0:kw-m4">
            <Download className="h-4 w-4" data-oid="u-c_7cd" />
          </Button>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 flex items-center justify-center p-4" data-oid="-7mzc-7">
        <div className="relative" data-oid="t.3m6__">
          <canvas
            ref={canvasRef}
            width={resolution.width}
            height={resolution.height}
            onMouseMove={handleMouseMove}
            className={cn("border border-gray-700 cursor-crosshair", !compilationResult?.success && "opacity-50")}
            style={{
              maxWidth: "100%",
              maxHeight: "calc(100vh - 200px)",
            }}
            data-oid="oterst3"
          />

          {/* Error overlay */}
          {compilationResult && !compilationResult.success && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/80" data-oid="35dr5mb">
              <div className="text-center" data-oid="rj23:de">
                <p className="text-red-400 text-sm font-medium" data-oid="n3g1qer">
                  Shader Compilation Error
                </p>
                <p className="text-gray-400 text-xs mt-1" data-oid="vyazif_">
                  {compilationResult.errors[0]?.message || "Unknown error"}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Status bar */}
      <div
        className="flex items-center justify-between px-4 py-2 border-t border-gray-800 text-xs text-gray-500"
        data-oid="_yee-ke"
      >
        <div className="flex items-center gap-4" data-oid="7fiyr9t">
          <span data-oid="8bw_hy3">
            {resolution.width}×{resolution.height}
          </span>
          <span data-oid="i8icom7">Time: {time.toFixed(2)}s</span>
          <span data-oid="f16p._k">
            Mouse: ({mousePosition.x.toFixed(2)}, {mousePosition.y.toFixed(2)})
          </span>
        </div>
        <div className="flex items-center gap-4" data-oid="rjziz85">
          <span
            className={cn(fps > 50 ? "text-green-400" : fps > 30 ? "text-yellow-400" : "text-red-400")}
            data-oid="wjtotyx"
          >
            {fps} FPS
          </span>
          <span data-oid="-wlv40i">WebGL2</span>
        </div>
      </div>
    </div>
  )
}

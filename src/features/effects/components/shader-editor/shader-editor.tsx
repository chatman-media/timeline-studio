import { Button } from "@timeline-studio/ui/components/button"
import { Input } from "@timeline-studio/ui/components/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@timeline-studio/ui/components/tabs"
import { BookOpen, Code, FileText, Package, Save } from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import { useShaderEditor } from "../../hooks/use-shader-editor"
import { ShaderCompiler } from "../../services/shader-compiler"
import type { ShaderExportOptions, ShaderProject } from "../../types/shader-system"
import { GLSLCodeEditor } from "./glsl-code-editor"
import { ShaderPreview } from "./shader-preview"
import { UniformsPanel } from "./uniforms-panel"

interface ShaderEditorProps {
  initialProject?: ShaderProject
  onSave?: (project: ShaderProject) => void
  onExport?: (project: ShaderProject, options: ShaderExportOptions) => void
  className?: string
}

// Default shader templates
const DEFAULT_VERTEX_SHADER = `#version 300 es
precision highp float;

in vec2 position;
out vec2 vUv;

void main() {
  vUv = position * 0.5 + 0.5;
  gl_Position = vec4(position, 0.0, 1.0);
}`

const DEFAULT_FRAGMENT_SHADER = `#version 300 es
precision highp float;

// Built-in uniforms
uniform float iTime;
uniform vec2 iResolution;
uniform vec2 iMouse;

// Custom uniforms
// @group Color
// @description Base color of the shader
uniform vec3 baseColor; // @default = 1.0, 0.5, 0.2

// @description Glow intensity
// @min intensity = 0.0
// @max intensity = 2.0
uniform float intensity; // @default = 1.0

in vec2 vUv;
out vec4 fragColor;

void main() {
  // Simple gradient with time animation
  vec2 uv = vUv;
  
  // Create animated gradient
  float gradient = sin(uv.x * 3.14159 + iTime) * 0.5 + 0.5;
  gradient *= sin(uv.y * 3.14159 + iTime * 0.7) * 0.5 + 0.5;
  
  // Apply color
  vec3 color = baseColor * gradient * intensity;
  
  // Add mouse interaction
  float mouseDist = distance(uv, iMouse / iResolution);
  color += vec3(0.2) * (1.0 - smoothstep(0.0, 0.3, mouseDist));
  
  fragColor = vec4(color, 1.0);
}`

export function ShaderEditor({ initialProject, onSave, onExport, className }: ShaderEditorProps) {
  const compiler = new ShaderCompiler()
  const { project, updateShader, updateUniform, setCompilationResult, markDirty, markClean } =
    useShaderEditor(initialProject)

  const [activeTab, setActiveTab] = useState<"vertex" | "fragment">("fragment")
  const [performanceMetrics, setPerformanceMetrics] = useState({
    fps: 0,
    drawTime: 0,
    fragmentsProcessed: 0,
  })

  // Compile shaders when they change
  const compileShaders = useCallback(() => {
    const result = compiler.linkShaders(project.vertexShader, project.fragmentShader)
    setCompilationResult(result)

    // Update uniforms if compilation succeeded
    if (result.success && result.uniforms) {
      // Merge with existing uniforms to preserve values
      const mergedUniforms = result.uniforms.map((uniform) => {
        const existing = project.uniforms.find((u) => u.name === uniform.name)
        if (existing) {
          return { ...uniform, value: existing.value }
        }
        return uniform
      })

      // Update project uniforms
      project.uniforms = mergedUniforms
    }
  }, [project, compiler, setCompilationResult])

  // Auto-compile on shader change
  useEffect(() => {
    const timer = setTimeout(() => {
      compileShaders()
    }, 500) // Debounce

    return () => clearTimeout(timer)
  }, [project.vertexShader, project.fragmentShader, compileShaders])

  // Handle save
  const handleSave = useCallback(() => {
    onSave?.(project)
    markClean()
  }, [project, onSave, markClean])

  // Handle export
  const handleExport = useCallback(() => {
    const options: ShaderExportOptions = {
      format: "effect",
      includePresets: true,
      minify: false,
      embedTextures: false,
    }
    onExport?.(project, options)
  }, [project, onExport])

  // Handle uniform change
  const handleUniformChange = useCallback(
    (name: string, value: any) => {
      updateUniform(name, value)
    },
    [updateUniform],
  )

  return (
    <div className={cn("flex flex-col h-full bg-gray-950", className)} data-oid="9kp:k0-">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-800" data-oid="vw738di">
        <div className="flex items-center gap-4" data-oid="wksb8y:">
          <Code className="h-5 w-5 text-blue-400" data-oid="j2h-158" />
          <Input
            value={project.name}
            onChange={(e) => {
              project.name = e.target.value
              markDirty()
            }}
            className="w-48 bg-gray-900 border-gray-700"
            placeholder="Shader name..."
            data-oid="6pbrvd."
          />

          {project.isDirty && (
            <span className="text-xs text-yellow-400" data-oid="7ke_ut9">
              • Unsaved changes
            </span>
          )}
        </div>

        <div className="flex items-center gap-2" data-oid="82gwt:l">
          <Button size="sm" variant="ghost" onClick={handleSave} disabled={!project.isDirty} data-oid="gxm:psl">
            <Save className="h-4 w-4 mr-2" data-oid="lbewu6n" />
            Save
          </Button>
          <Button size="sm" variant="ghost" onClick={handleExport} data-oid="55bq8fx">
            <Package className="h-4 w-4 mr-2" data-oid="8ajyymq" />
            Export
          </Button>
          <Button size="sm" variant="ghost" data-oid=":on50zd">
            <BookOpen className="h-4 w-4 mr-2" data-oid="cs-5r5v" />
            Examples
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden" data-oid="in37gj6">
        {/* Left panel - Code editor */}
        <div className="flex-1 flex flex-col" data-oid="j3z97:s">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} data-oid="-agnl2:">
            <TabsList
              className="w-full justify-start rounded-none bg-gray-900 border-b border-gray-800"
              data-oid="r1pk.lw"
            >
              <TabsTrigger value="vertex" className="data-[state=active]:bg-gray-800" data-oid="kaz_7s-">
                <FileText className="h-4 w-4 mr-2" data-oid="67k:tdg" />
                Vertex Shader
              </TabsTrigger>
              <TabsTrigger value="fragment" className="data-[state=active]:bg-gray-800" data-oid="vmu8n_5">
                <FileText className="h-4 w-4 mr-2" data-oid="x0e5czl" />
                Fragment Shader
              </TabsTrigger>
            </TabsList>

            <TabsContent value="vertex" className="flex-1 m-0" data-oid="91a7f9:">
              <GLSLCodeEditor
                value={project.vertexShader}
                onChange={(value) => updateShader("vertex", value)}
                shaderType="vertex"
                errors={project.compilationResult?.errors.filter((e) => e.type === "syntax")}
                className="h-full"
                data-oid="836u:75"
              />
            </TabsContent>

            <TabsContent value="fragment" className="flex-1 m-0" data-oid=".a-1:wn">
              <GLSLCodeEditor
                value={project.fragmentShader}
                onChange={(value) => updateShader("fragment", value)}
                shaderType="fragment"
                errors={project.compilationResult?.errors.filter((e) => e.type === "syntax")}
                className="h-full"
                data-oid="7lx430b"
              />
            </TabsContent>
          </Tabs>
        </div>

        {/* Right panel - Preview and uniforms */}
        <div className="w-1/2 flex" data-oid="-l2kqe:">
          {/* Uniforms panel */}
          <div className="w-64 border-l border-gray-800" data-oid="9-__nje">
            <UniformsPanel
              uniforms={project.uniforms}
              onChange={handleUniformChange}
              className="h-full"
              data-oid="5wlk1yi"
            />
          </div>

          {/* Preview */}
          <div className="flex-1 border-l border-gray-800" data-oid="_:d-nno">
            <ShaderPreview
              vertexShader={project.vertexShader}
              fragmentShader={project.fragmentShader}
              uniforms={project.uniforms}
              compilationResult={project.compilationResult}
              onPerformanceReport={setPerformanceMetrics}
              className="h-full"
              data-oid="-ajuano"
            />
          </div>
        </div>
      </div>

      {/* Status bar */}
      <div
        className="flex items-center justify-between px-4 py-2 border-t border-gray-800 text-xs text-gray-500"
        data-oid="2jknrqp"
      >
        <div className="flex items-center gap-4" data-oid="0flecq_">
          {project.compilationResult?.success ? (
            <span className="text-green-400" data-oid="s9nd1f0">
              ✓ Compilation successful
            </span>
          ) : project.compilationResult ? (
            <span className="text-red-400" data-oid="4h3zdxv">
              ✗ {project.compilationResult.errors.length} errors, {project.compilationResult.warnings.length} warnings
            </span>
          ) : (
            <span data-oid=".aq43l9">Ready</span>
          )}
          <span data-oid="mlou2j-">{project.uniforms.length} uniforms</span>
        </div>
        <div className="flex items-center gap-4" data-oid="yaaja3n">
          <span data-oid="-26:zv7">Draw: {performanceMetrics.drawTime.toFixed(2)}ms</span>
          <span data-oid="v0rctof">Fragments: {(performanceMetrics.fragmentsProcessed / 1000).toFixed(0)}K</span>
          <span data-oid="le-en2p">Version: {project.version}</span>
        </div>
      </div>
    </div>
  )
}

// Export default shader templates
export { DEFAULT_FRAGMENT_SHADER, DEFAULT_VERTEX_SHADER }

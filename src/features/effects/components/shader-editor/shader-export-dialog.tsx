import { Code, Cpu, Package } from "lucide-react"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import type { ShaderExportOptions, ShaderProject } from "../../types/shader-system"
import type { BaseEffect, EffectParameter } from "../../types/unified-effects"

interface ShaderExportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  project: ShaderProject
  onExport: (effect: BaseEffect) => void
}

export function ShaderExportDialog({ open, onOpenChange, project, onExport }: ShaderExportDialogProps) {
  const [exportOptions, setExportOptions] = useState<ShaderExportOptions>({
    format: "effect",
    includePresets: true,
    minify: false,
    embedTextures: true,
    targetVersion: "webgl2",
  })

  const [effectMetadata, setEffectMetadata] = useState({
    category: "stylize" as const,
    complexity: "high" as const,
    tags: ["custom", "shader", "glsl"],
  })

  const handleExport = () => {
    // Convert shader to effect format
    const effect: BaseEffect = {
      id: `shader-${project.id}`,
      name: {
        en: project.name,
        ru: project.name,
      },
      category: effectMetadata.category,
      scope: ["clip"],
      processingType: "realtime",
      description: {
        en: project.description || "Custom GLSL shader effect",
        ru: project.description || "Пользовательский GLSL шейдер",
      },
      complexity: effectMetadata.complexity,
      gpuAccelerated: true,
      parameters: project.uniforms.map((uniform): EffectParameter => ({
        id: uniform.name,
        name: {
          en: uniform.name,
          ru: uniform.name,
        },
        type: mapUniformTypeToParameterType(uniform.type),
        defaultValue: uniform.value,
        ...(uniform.min !== undefined && { min: uniform.min }),
        ...(uniform.max !== undefined && { max: uniform.max }),
        ...(uniform.step !== undefined && { step: uniform.step }),
        animatable: true,
      })),
      processors: {
        webgl: {
          vertexShader: exportOptions.minify ? minifyShader(project.vertexShader) : project.vertexShader,
          fragmentShader: exportOptions.minify ? minifyShader(project.fragmentShader) : project.fragmentShader,
          uniforms: Object.fromEntries(project.uniforms.map((u) => [u.name, u.value])),
        },
      },
      tags: effectMetadata.tags,
      version: project.version,
      author: project.metadata?.author,
      presets: exportOptions.includePresets ? (generatePresets(project) || []) : [],
    }

    onExport(effect)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Export Shader as Effect</DialogTitle>
          <DialogDescription>Configure how to export your shader as a reusable effect</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="metadata" className="mt-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="metadata">
              <Package className="h-4 w-4 mr-2" />
              Metadata
            </TabsTrigger>
            <TabsTrigger value="format">
              <Code className="h-4 w-4 mr-2" />
              Format
            </TabsTrigger>
            <TabsTrigger value="performance">
              <Cpu className="h-4 w-4 mr-2" />
              Performance
            </TabsTrigger>
          </TabsList>

          <TabsContent value="metadata" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Effect Name</Label>
              <Input
                value={project.name}
                onChange={(e) => {
                  project.name = e.target.value
                }}
                placeholder="My Custom Effect"
              />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={project.description}
                onChange={(e) => {
                  project.description = e.target.value
                }}
                placeholder="Describe what this effect does..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Category</Label>
              <Select
                value={effectMetadata.category}
                onValueChange={(value) =>
                  setEffectMetadata({
                    ...effectMetadata,
                    category: value as "stylize",
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="custom">Custom</SelectItem>
                  <SelectItem value="color">Color Correction</SelectItem>
                  <SelectItem value="distortion">Distortion</SelectItem>
                  <SelectItem value="stylize">Stylize</SelectItem>
                  <SelectItem value="blur">Blur & Sharpen</SelectItem>
                  <SelectItem value="generate">Generate</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Complexity</Label>
              <Select
                value={effectMetadata.complexity}
                onValueChange={(value: any) =>
                  setEffectMetadata({
                    ...effectMetadata,
                    complexity: value,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="basic">Basic</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                  <SelectItem value="pro">Professional</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Tags</Label>
              <Input
                value={effectMetadata.tags.join(", ")}
                onChange={(e) =>
                  setEffectMetadata({
                    ...effectMetadata,
                    tags: e.target.value
                      .split(",")
                      .map((t) => t.trim())
                      .filter(Boolean),
                  })
                }
                placeholder="custom, shader, glsl"
              />
            </div>
          </TabsContent>

          <TabsContent value="format" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Export Format</Label>
              <Select
                value={exportOptions.format}
                onValueChange={(value: any) =>
                  setExportOptions({
                    ...exportOptions,
                    format: value,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="effect">Timeline Studio Effect</SelectItem>
                  <SelectItem value="standalone">Standalone Shader</SelectItem>
                  <SelectItem value="node">Node Component</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <Label>Include Presets</Label>
              <Switch
                checked={exportOptions.includePresets}
                onCheckedChange={(checked) =>
                  setExportOptions({
                    ...exportOptions,
                    includePresets: checked,
                  })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <Label>Embed Textures</Label>
              <Switch
                checked={exportOptions.embedTextures}
                onCheckedChange={(checked) =>
                  setExportOptions({
                    ...exportOptions,
                    embedTextures: checked,
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Target Version</Label>
              <Select
                value={exportOptions.targetVersion}
                onValueChange={(value) =>
                  setExportOptions({
                    ...exportOptions,
                    targetVersion: value,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="webgl">WebGL 1.0</SelectItem>
                  <SelectItem value="webgl2">WebGL 2.0</SelectItem>
                  <SelectItem value="webgpu">WebGPU (Experimental)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </TabsContent>

          <TabsContent value="performance" className="space-y-4 mt-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Minify Shaders</Label>
                <p className="text-xs text-gray-500 mt-1">Remove comments and whitespace to reduce size</p>
              </div>
              <Switch
                checked={exportOptions.minify}
                onCheckedChange={(checked) =>
                  setExportOptions({
                    ...exportOptions,
                    minify: checked,
                  })
                }
              />
            </div>

            <div className="rounded-lg bg-gray-900 p-4 space-y-2">
              <h4 className="text-sm font-medium">Performance Analysis</h4>
              <div className="text-xs space-y-1 text-gray-400">
                <div className="flex justify-between">
                  <span>Uniforms:</span>
                  <span>{project.uniforms.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Texture Samplers:</span>
                  <span>{project.uniforms.filter((u) => u.type.includes("sampler")).length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Estimated GPU Load:</span>
                  <span className={cn(project.uniforms.length > 20 ? "text-yellow-400" : "text-green-400")}>
                    {project.uniforms.length > 20 ? "High" : "Normal"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Shader Size:</span>
                  <span>{Math.round((project.vertexShader.length + project.fragmentShader.length) / 1024)}KB</span>
                </div>
              </div>
            </div>

            <div className="rounded-lg bg-yellow-900/20 border border-yellow-700 p-3">
              <p className="text-xs text-yellow-400">
                ⚠️ Complex shaders may impact performance on lower-end devices. Consider providing quality presets for
                different performance levels.
              </p>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleExport}>Export Effect</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Helper functions
function mapUniformTypeToParameterType(
  uniformType: string,
): "number" | "boolean" | "point" | "color" | "file" | "text" | "angle" | "dropdown" | "keyframes" {
  const typeMap: Record<
    string,
    "number" | "boolean" | "point" | "color" | "file" | "text" | "angle" | "dropdown" | "keyframes"
  > = {
    float: "number",
    int: "number",
    bool: "boolean",
    vec2: "point",
    vec3: "color",
    vec4: "color",
    sampler2D: "file",
  }
  return typeMap[uniformType] || "number"
}

function minifyShader(shader: string): string {
  return shader
    .replace(/\/\*[\s\S]*?\*\//g, "") // Remove block comments
    .replace(/\/\/.*/g, "") // Remove line comments
    .replace(/\s+/g, " ") // Collapse whitespace
    .replace(/\s*([{}();,=+\-*/<>!])\s*/g, "$1") // Remove spaces around operators
    .trim()
}

function generatePresets(project: ShaderProject): any[] {
  // Generate some default presets based on uniforms
  const presets = [
    {
      name: "Default",
      values: project.uniforms.reduce(
        (acc, u) => {
          acc[u.name] = u.defaultValue || u.value
          return acc
        },
        {} as Record<string, any>,
      ),
    },
  ]

  // Add min/max presets for numeric values
  const hasNumericParams = project.uniforms.some(
    (u) => ["float", "int"].includes(u.type) && u.min !== undefined && u.max !== undefined,
  )

  if (hasNumericParams) {
    presets.push({
      name: "Minimal",
      values: project.uniforms.reduce(
        (acc, u) => {
          acc[u.name] = u.min !== undefined ? u.min : u.value
          return acc
        },
        {} as Record<string, any>,
      ),
    })

    presets.push({
      name: "Maximum",
      values: project.uniforms.reduce(
        (acc, u) => {
          acc[u.name] = u.max !== undefined ? u.max : u.value
          return acc
        },
        {} as Record<string, any>,
      ),
    })
  }

  return presets
}

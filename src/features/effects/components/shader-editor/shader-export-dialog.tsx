import { Button } from "@timeline-studio/ui/components/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@timeline-studio/ui/components/dialog"
import { Input } from "@timeline-studio/ui/components/input"
import { Label } from "@timeline-studio/ui/components/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@timeline-studio/ui/components/select"
import { Switch } from "@timeline-studio/ui/components/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@timeline-studio/ui/components/tabs"
import { Textarea } from "@timeline-studio/ui/components/textarea"
import { Code, Cpu, Package } from "lucide-react"
import { useState } from "react"
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
      parameters: project.uniforms.map(
        (uniform): EffectParameter => ({
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
        }),
      ),
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
      presets: exportOptions.includePresets ? generatePresets(project) || [] : [],
    }

    onExport(effect)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange} data-oid="k8fkoh4">
      <DialogContent className="max-w-2xl" data-oid="rcr4agy">
        <DialogHeader data-oid=":zs0weg">
          <DialogTitle data-oid="dt6j-0a">Export Shader as Effect</DialogTitle>
          <DialogDescription data-oid="q3-e504">
            Configure how to export your shader as a reusable effect
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="metadata" className="mt-4" data-oid="1y6136n">
          <TabsList className="grid w-full grid-cols-3" data-oid="bqdig-9">
            <TabsTrigger value="metadata" data-oid="t3id9z.">
              <Package className="h-4 w-4 mr-2" data-oid="1cjlmsb" />
              Metadata
            </TabsTrigger>
            <TabsTrigger value="format" data-oid="b_e8:-m">
              <Code className="h-4 w-4 mr-2" data-oid="i4tk20l" />
              Format
            </TabsTrigger>
            <TabsTrigger value="performance" data-oid="4fd:q4e">
              <Cpu className="h-4 w-4 mr-2" data-oid="rtx4r6:" />
              Performance
            </TabsTrigger>
          </TabsList>

          <TabsContent value="metadata" className="space-y-4 mt-4" data-oid="8v4kxyy">
            <div className="space-y-2" data-oid="scscmyf">
              <Label data-oid="rz_wh6e">Effect Name</Label>
              <Input
                value={project.name}
                onChange={(e) => {
                  project.name = e.target.value
                }}
                placeholder="My Custom Effect"
                data-oid="6m2f_cs"
              />
            </div>

            <div className="space-y-2" data-oid="k1qg5nn">
              <Label data-oid="dzd.iiv">Description</Label>
              <Textarea
                value={project.description}
                onChange={(e) => {
                  project.description = e.target.value
                }}
                placeholder="Describe what this effect does..."
                rows={3}
                data-oid="5umv_8f"
              />
            </div>

            <div className="space-y-2" data-oid="1mys02-">
              <Label data-oid="vac8.sf">Category</Label>
              <Select
                value={effectMetadata.category}
                onValueChange={(value) =>
                  setEffectMetadata({
                    ...effectMetadata,
                    category: value as "stylize",
                  })
                }
                data-oid="at:b:ma"
              >
                <SelectTrigger data-oid="3nch_vz">
                  <SelectValue data-oid="g3j4wxb" />
                </SelectTrigger>
                <SelectContent data-oid=":q9wotf">
                  <SelectItem value="custom" data-oid="-c7.mhz">
                    Custom
                  </SelectItem>
                  <SelectItem value="color" data-oid="hd0qxkm">
                    Color Correction
                  </SelectItem>
                  <SelectItem value="distortion" data-oid="5w6j8xa">
                    Distortion
                  </SelectItem>
                  <SelectItem value="stylize" data-oid="bqf5uw0">
                    Stylize
                  </SelectItem>
                  <SelectItem value="blur" data-oid="b2chcvz">
                    Blur & Sharpen
                  </SelectItem>
                  <SelectItem value="generate" data-oid="_hw88wj">
                    Generate
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2" data-oid="2ufmy_y">
              <Label data-oid="o8d_svw">Complexity</Label>
              <Select
                value={effectMetadata.complexity}
                onValueChange={(value: any) =>
                  setEffectMetadata({
                    ...effectMetadata,
                    complexity: value,
                  })
                }
                data-oid="aj3ibwr"
              >
                <SelectTrigger data-oid="ndtsen0">
                  <SelectValue data-oid="b41e1vx" />
                </SelectTrigger>
                <SelectContent data-oid="rzuwzpi">
                  <SelectItem value="basic" data-oid="-cnv9-3">
                    Basic
                  </SelectItem>
                  <SelectItem value="intermediate" data-oid="jf65cw5">
                    Intermediate
                  </SelectItem>
                  <SelectItem value="advanced" data-oid="6py6sqs">
                    Advanced
                  </SelectItem>
                  <SelectItem value="pro" data-oid="seifs9m">
                    Professional
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2" data-oid="1dvmjdv">
              <Label data-oid="p:mal1x">Tags</Label>
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
                data-oid=".ej4i_3"
              />
            </div>
          </TabsContent>

          <TabsContent value="format" className="space-y-4 mt-4" data-oid="1v40dwk">
            <div className="space-y-2" data-oid="9cl06ba">
              <Label data-oid="vfg8mvi">Export Format</Label>
              <Select
                value={exportOptions.format}
                onValueChange={(value: any) =>
                  setExportOptions({
                    ...exportOptions,
                    format: value,
                  })
                }
                data-oid="sf:zg10"
              >
                <SelectTrigger data-oid="-.1ac7.">
                  <SelectValue data-oid="ade1_vd" />
                </SelectTrigger>
                <SelectContent data-oid="fx1g0qg">
                  <SelectItem value="effect" data-oid=".rfg4kk">
                    Timeline Studio Effect
                  </SelectItem>
                  <SelectItem value="standalone" data-oid="i42oop6">
                    Standalone Shader
                  </SelectItem>
                  <SelectItem value="node" data-oid="-kqbzal">
                    Node Component
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between" data-oid="2nk6fas">
              <Label data-oid="w87yjq1">Include Presets</Label>
              <Switch
                checked={exportOptions.includePresets}
                onCheckedChange={(checked) =>
                  setExportOptions({
                    ...exportOptions,
                    includePresets: checked,
                  })
                }
                data-oid="ql6io38"
              />
            </div>

            <div className="flex items-center justify-between" data-oid="73fbnrb">
              <Label data-oid="_l265dr">Embed Textures</Label>
              <Switch
                checked={exportOptions.embedTextures}
                onCheckedChange={(checked) =>
                  setExportOptions({
                    ...exportOptions,
                    embedTextures: checked,
                  })
                }
                data-oid="fyg-vrf"
              />
            </div>

            <div className="space-y-2" data-oid="mf_:48p">
              <Label data-oid="q0e8:ra">Target Version</Label>
              <Select
                value={exportOptions.targetVersion}
                onValueChange={(value) =>
                  setExportOptions({
                    ...exportOptions,
                    targetVersion: value,
                  })
                }
                data-oid="n1a6i0i"
              >
                <SelectTrigger data-oid="yezcpb:">
                  <SelectValue data-oid="he9ana_" />
                </SelectTrigger>
                <SelectContent data-oid="crpinvj">
                  <SelectItem value="webgl" data-oid="-7n45b9">
                    WebGL 1.0
                  </SelectItem>
                  <SelectItem value="webgl2" data-oid="m6ja3:8">
                    WebGL 2.0
                  </SelectItem>
                  <SelectItem value="webgpu" data-oid="x2h8n9p">
                    WebGPU (Experimental)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </TabsContent>

          <TabsContent value="performance" className="space-y-4 mt-4" data-oid="o57epdp">
            <div className="flex items-center justify-between" data-oid="ig1bcjy">
              <div data-oid="j9iklnc">
                <Label data-oid="d0n4wec">Minify Shaders</Label>
                <p className="text-xs text-gray-500 mt-1" data-oid="y9o9x.3">
                  Remove comments and whitespace to reduce size
                </p>
              </div>
              <Switch
                checked={exportOptions.minify}
                onCheckedChange={(checked) =>
                  setExportOptions({
                    ...exportOptions,
                    minify: checked,
                  })
                }
                data-oid="_gzskst"
              />
            </div>

            <div className="rounded-lg bg-gray-900 p-4 space-y-2" data-oid="nvgspj-">
              <h4 className="text-sm font-medium" data-oid="uzit6kt">
                Performance Analysis
              </h4>
              <div className="text-xs space-y-1 text-gray-400" data-oid="l:g6xz:">
                <div className="flex justify-between" data-oid="jnw5coq">
                  <span data-oid="oxx3k2v">Uniforms:</span>
                  <span data-oid="t7moni0">{project.uniforms.length}</span>
                </div>
                <div className="flex justify-between" data-oid="hc8txcc">
                  <span data-oid="wslv_uf">Texture Samplers:</span>
                  <span data-oid="t_-sclb">{project.uniforms.filter((u) => u.type.includes("sampler")).length}</span>
                </div>
                <div className="flex justify-between" data-oid="xc:gv8z">
                  <span data-oid="s9umu_z">Estimated GPU Load:</span>
                  <span
                    className={cn(project.uniforms.length > 20 ? "text-yellow-400" : "text-green-400")}
                    data-oid="v60by17"
                  >
                    {project.uniforms.length > 20 ? "High" : "Normal"}
                  </span>
                </div>
                <div className="flex justify-between" data-oid="jrw0gkv">
                  <span data-oid=":4vrllc">Shader Size:</span>
                  <span data-oid="qruseag">
                    {Math.round((project.vertexShader.length + project.fragmentShader.length) / 1024)}
                    KB
                  </span>
                </div>
              </div>
            </div>

            <div className="rounded-lg bg-yellow-900/20 border border-yellow-700 p-3" data-oid="7lvprfa">
              <p className="text-xs text-yellow-400" data-oid="7zzjjgl">
                ⚠️ Complex shaders may impact performance on lower-end devices. Consider providing quality presets for
                different performance levels.
              </p>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter data-oid="acj_b8a">
          <Button variant="outline" onClick={() => onOpenChange(false)} data-oid="gy68hna">
            Cancel
          </Button>
          <Button onClick={handleExport} data-oid="5j4113.">
            Export Effect
          </Button>
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

import { useMemo, useState } from "react"

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"

import type { ShaderUniform } from "../../types/shader-system"

interface UniformsPanelProps {
  uniforms: ShaderUniform[]
  onChange: (name: string, value: any) => void
  className?: string
}

export function UniformsPanel({ uniforms, onChange, className }: UniformsPanelProps) {
  const [searchQuery, setSearchQuery] = useState("")

  // Group uniforms by category
  const groupedUniforms = useMemo(() => {
    const groups: Record<string, ShaderUniform[]> = {
      General: [],
    }

    uniforms.forEach((uniform) => {
      const group = uniform.group || "General"
      if (!groups[group]) {
        groups[group] = []
      }
      groups[group].push(uniform)
    })

    // Filter by search
    if (searchQuery) {
      const filtered: Record<string, ShaderUniform[]> = {}
      const query = searchQuery.toLowerCase()

      Object.entries(groups).forEach(([groupName, groupUniforms]) => {
        const matchingUniforms = groupUniforms.filter(
          (u) => u.name.toLowerCase().includes(query) || u.description?.toLowerCase().includes(query),
        )
        if (matchingUniforms.length > 0) {
          filtered[groupName] = matchingUniforms
        }
      })

      return filtered
    }

    return groups
  }, [uniforms, searchQuery])

  const renderUniformControl = (uniform: ShaderUniform) => {
    switch (uniform.type) {
      case "float":
        return (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">{uniform.name}</Label>
              <Input
                type="number"
                value={uniform.value}
                onChange={(e) => onChange(uniform.name, Number.parseFloat(e.target.value))}
                className="w-20 h-8 text-xs"
                step={uniform.step || 0.01}
              />
            </div>
            {uniform.min !== undefined && uniform.max !== undefined && (
              <Slider
                value={[uniform.value]}
                onValueChange={([value]) => onChange(uniform.name, value)}
                min={uniform.min}
                max={uniform.max}
                step={uniform.step || 0.01}
                className="w-full"
              />
            )}
            {uniform.description && <p className="text-xs text-gray-500">{uniform.description}</p>}
          </div>
        )

      case "int":
        return (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">{uniform.name}</Label>
              <Input
                type="number"
                value={uniform.value}
                onChange={(e) => onChange(uniform.name, Number.parseInt(e.target.value, 10))}
                className="w-20 h-8 text-xs"
                step={1}
              />
            </div>
            {uniform.min !== undefined && uniform.max !== undefined && (
              <Slider
                value={[uniform.value]}
                onValueChange={([value]) => onChange(uniform.name, Math.round(value))}
                min={uniform.min}
                max={uniform.max}
                step={1}
                className="w-full"
              />
            )}
            {uniform.description && <p className="text-xs text-gray-500">{uniform.description}</p>}
          </div>
        )

      case "bool":
        return (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">{uniform.name}</Label>
              <Switch checked={uniform.value} onCheckedChange={(checked) => onChange(uniform.name, checked)} />
            </div>
            {uniform.description && <p className="text-xs text-gray-500">{uniform.description}</p>}
          </div>
        )

      case "vec2":
        return (
          <div className="space-y-2">
            <Label className="text-sm font-medium">{uniform.name}</Label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs text-gray-500">X</Label>
                <Input
                  type="number"
                  value={uniform.value[0]}
                  onChange={(e) => onChange(uniform.name, [Number.parseFloat(e.target.value), uniform.value[1]])}
                  className="h-8 text-xs"
                  step={uniform.step || 0.01}
                />
              </div>
              <div>
                <Label className="text-xs text-gray-500">Y</Label>
                <Input
                  type="number"
                  value={uniform.value[1]}
                  onChange={(e) => onChange(uniform.name, [uniform.value[0], Number.parseFloat(e.target.value)])}
                  className="h-8 text-xs"
                  step={uniform.step || 0.01}
                />
              </div>
            </div>
            {uniform.description && <p className="text-xs text-gray-500">{uniform.description}</p>}
          </div>
        )

      case "vec3": {
        const isColor = uniform.name.toLowerCase().includes("color") || uniform.name.toLowerCase().includes("tint")

        if (isColor) {
          // Convert vec3 to hex color
          const toHex = (val: number) =>
            Math.round(val * 255)
              .toString(16)
              .padStart(2, "0")
          const hexColor = `#${toHex(uniform.value[0])}${toHex(uniform.value[1])}${toHex(uniform.value[2])}`

          return (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">{uniform.name}</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={hexColor}
                    onChange={(e) => {
                      const hex = e.target.value
                      const r = Number.parseInt(hex.substring(1, 3), 16) / 255
                      const g = Number.parseInt(hex.substring(3, 5), 16) / 255
                      const b = Number.parseInt(hex.substring(5, 7), 16) / 255
                      onChange(uniform.name, [r, g, b])
                    }}
                    className="w-8 h-8 rounded cursor-pointer"
                  />
                  <span className="text-xs text-gray-500">{hexColor}</span>
                </div>
              </div>
              {uniform.description && <p className="text-xs text-gray-500">{uniform.description}</p>}
            </div>
          )
        }

        return (
          <div className="space-y-2">
            <Label className="text-sm font-medium">{uniform.name}</Label>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <Label className="text-xs text-gray-500">X</Label>
                <Input
                  type="number"
                  value={uniform.value[0]}
                  onChange={(e) =>
                    onChange(uniform.name, [Number.parseFloat(e.target.value), uniform.value[1], uniform.value[2]])
                  }
                  className="h-8 text-xs"
                  step={uniform.step || 0.01}
                />
              </div>
              <div>
                <Label className="text-xs text-gray-500">Y</Label>
                <Input
                  type="number"
                  value={uniform.value[1]}
                  onChange={(e) =>
                    onChange(uniform.name, [uniform.value[0], Number.parseFloat(e.target.value), uniform.value[2]])
                  }
                  className="h-8 text-xs"
                  step={uniform.step || 0.01}
                />
              </div>
              <div>
                <Label className="text-xs text-gray-500">Z</Label>
                <Input
                  type="number"
                  value={uniform.value[2]}
                  onChange={(e) =>
                    onChange(uniform.name, [uniform.value[0], uniform.value[1], Number.parseFloat(e.target.value)])
                  }
                  className="h-8 text-xs"
                  step={uniform.step || 0.01}
                />
              </div>
            </div>
            {uniform.description && <p className="text-xs text-gray-500">{uniform.description}</p>}
          </div>
        )
      }

      case "vec4": {
        const isColorWithAlpha =
          uniform.name.toLowerCase().includes("color") || uniform.name.toLowerCase().includes("tint")

        if (isColorWithAlpha) {
          const toHex = (val: number) =>
            Math.round(val * 255)
              .toString(16)
              .padStart(2, "0")
          const hexColor = `#${toHex(uniform.value[0])}${toHex(uniform.value[1])}${toHex(uniform.value[2])}`

          return (
            <div className="space-y-2">
              <Label className="text-sm font-medium">{uniform.name}</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={hexColor}
                  onChange={(e) => {
                    const hex = e.target.value
                    const r = Number.parseInt(hex.substring(1, 3), 16) / 255
                    const g = Number.parseInt(hex.substring(3, 5), 16) / 255
                    const b = Number.parseInt(hex.substring(5, 7), 16) / 255
                    onChange(uniform.name, [r, g, b, uniform.value[3]])
                  }}
                  className="w-8 h-8 rounded cursor-pointer"
                />
                <div className="flex-1">
                  <Label className="text-xs text-gray-500">Alpha</Label>
                  <Slider
                    value={[uniform.value[3]]}
                    onValueChange={([value]) => onChange(uniform.name, [...uniform.value.slice(0, 3), value])}
                    min={0}
                    max={1}
                    step={0.01}
                    className="w-full"
                  />
                </div>
              </div>
              {uniform.description && <p className="text-xs text-gray-500">{uniform.description}</p>}
            </div>
          )
        }

        return (
          <div className="space-y-2">
            <Label className="text-sm font-medium">{uniform.name}</Label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs text-gray-500">X</Label>
                <Input
                  type="number"
                  value={uniform.value[0]}
                  onChange={(e) => {
                    const newValue = [...uniform.value]
                    newValue[0] = Number.parseFloat(e.target.value)
                    onChange(uniform.name, newValue)
                  }}
                  className="h-8 text-xs"
                  step={uniform.step || 0.01}
                />
              </div>
              <div>
                <Label className="text-xs text-gray-500">Y</Label>
                <Input
                  type="number"
                  value={uniform.value[1]}
                  onChange={(e) => {
                    const newValue = [...uniform.value]
                    newValue[1] = Number.parseFloat(e.target.value)
                    onChange(uniform.name, newValue)
                  }}
                  className="h-8 text-xs"
                  step={uniform.step || 0.01}
                />
              </div>
              <div>
                <Label className="text-xs text-gray-500">Z</Label>
                <Input
                  type="number"
                  value={uniform.value[2]}
                  onChange={(e) => {
                    const newValue = [...uniform.value]
                    newValue[2] = Number.parseFloat(e.target.value)
                    onChange(uniform.name, newValue)
                  }}
                  className="h-8 text-xs"
                  step={uniform.step || 0.01}
                />
              </div>
              <div>
                <Label className="text-xs text-gray-500">W</Label>
                <Input
                  type="number"
                  value={uniform.value[3]}
                  onChange={(e) => {
                    const newValue = [...uniform.value]
                    newValue[3] = Number.parseFloat(e.target.value)
                    onChange(uniform.name, newValue)
                  }}
                  className="h-8 text-xs"
                  step={uniform.step || 0.01}
                />
              </div>
            </div>
            {uniform.description && <p className="text-xs text-gray-500">{uniform.description}</p>}
          </div>
        )
      }

      default:
        return <div className="text-xs text-gray-500">Unsupported uniform type: {uniform.type}</div>
    }
  }

  return (
    <div className={cn("flex flex-col h-full bg-gray-900", className)}>
      {/* Header */}
      <div className="p-4 border-b border-gray-800">
        <h3 className="text-sm font-medium text-white mb-3">Shader Uniforms</h3>
        <Input
          type="text"
          placeholder="Search uniforms..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="bg-gray-800 border-gray-700 text-white placeholder-gray-500"
        />
      </div>

      {/* Uniforms list */}
      <div className="flex-1 overflow-auto p-4">
        {Object.keys(groupedUniforms).length === 0 ? (
          <div className="text-center text-gray-500 text-sm py-8">No uniforms found</div>
        ) : Object.keys(groupedUniforms).length === 1 && groupedUniforms.General ? (
          // Single group - no accordion
          <div className="space-y-4">
            {groupedUniforms.General.map((uniform) => (
              <div key={uniform.name}>{renderUniformControl(uniform)}</div>
            ))}
          </div>
        ) : (
          // Multiple groups - use accordion
          <Accordion type="multiple" defaultValue={Object.keys(groupedUniforms)}>
            {Object.entries(groupedUniforms).map(([groupName, groupUniforms]) => (
              <AccordionItem key={groupName} value={groupName}>
                <AccordionTrigger className="text-sm font-medium">
                  {groupName} ({groupUniforms.length})
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4 pt-2">
                    {groupUniforms.map((uniform) => (
                      <div key={uniform.name}>{renderUniformControl(uniform)}</div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-800 text-xs text-gray-500">
        <div>{uniforms.length} uniforms</div>
        <div>{uniforms.filter((u) => u.animatable).length} animatable</div>
      </div>
    </div>
  )
}

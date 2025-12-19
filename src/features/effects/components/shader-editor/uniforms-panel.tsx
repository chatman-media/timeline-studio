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
          <div className="space-y-2" data-oid="s_q5jzi">
            <div className="flex items-center justify-between" data-oid="arn1_rk">
              <Label className="text-sm font-medium" data-oid="zwude_x">
                {uniform.name}
              </Label>
              <Input
                type="number"
                value={uniform.value}
                onChange={(e) => onChange(uniform.name, Number.parseFloat(e.target.value))}
                className="w-20 h-8 text-xs"
                step={uniform.step || 0.01}
                data-oid="5fyn2tb"
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
                data-oid="hsw3mt:"
              />
            )}
            {uniform.description && (
              <p className="text-xs text-gray-500" data-oid="ecxrzzf">
                {uniform.description}
              </p>
            )}
          </div>
        )

      case "int":
        return (
          <div className="space-y-2" data-oid="q1qbs.n">
            <div className="flex items-center justify-between" data-oid="udun9w1">
              <Label className="text-sm font-medium" data-oid="gv6gfp5">
                {uniform.name}
              </Label>
              <Input
                type="number"
                value={uniform.value}
                onChange={(e) => onChange(uniform.name, Number.parseInt(e.target.value, 10))}
                className="w-20 h-8 text-xs"
                step={1}
                data-oid="8xumzbp"
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
                data-oid="51f75wl"
              />
            )}
            {uniform.description && (
              <p className="text-xs text-gray-500" data-oid="d:fvimz">
                {uniform.description}
              </p>
            )}
          </div>
        )

      case "bool":
        return (
          <div className="space-y-2" data-oid="tl1b_32">
            <div className="flex items-center justify-between" data-oid="pf232n7">
              <Label className="text-sm font-medium" data-oid="r4s-8ha">
                {uniform.name}
              </Label>
              <Switch
                checked={uniform.value}
                onCheckedChange={(checked) => onChange(uniform.name, checked)}
                data-oid="8fn1c5m"
              />
            </div>
            {uniform.description && (
              <p className="text-xs text-gray-500" data-oid="ihsfzt0">
                {uniform.description}
              </p>
            )}
          </div>
        )

      case "vec2":
        return (
          <div className="space-y-2" data-oid="uteugkq">
            <Label className="text-sm font-medium" data-oid="gfokrz6">
              {uniform.name}
            </Label>
            <div className="grid grid-cols-2 gap-2" data-oid="8hjm5iq">
              <div data-oid="kvwrfrj">
                <Label className="text-xs text-gray-500" data-oid="wcj_yc0">
                  X
                </Label>
                <Input
                  type="number"
                  value={uniform.value[0]}
                  onChange={(e) => onChange(uniform.name, [Number.parseFloat(e.target.value), uniform.value[1]])}
                  className="h-8 text-xs"
                  step={uniform.step || 0.01}
                  data-oid="w7gf_7q"
                />
              </div>
              <div data-oid="vcddldv">
                <Label className="text-xs text-gray-500" data-oid="m8lqv8z">
                  Y
                </Label>
                <Input
                  type="number"
                  value={uniform.value[1]}
                  onChange={(e) => onChange(uniform.name, [uniform.value[0], Number.parseFloat(e.target.value)])}
                  className="h-8 text-xs"
                  step={uniform.step || 0.01}
                  data-oid="0_6x9ni"
                />
              </div>
            </div>
            {uniform.description && (
              <p className="text-xs text-gray-500" data-oid="_.1o5__">
                {uniform.description}
              </p>
            )}
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
            <div className="space-y-2" data-oid="xzobr.n">
              <div className="flex items-center justify-between" data-oid="l9jhqxe">
                <Label className="text-sm font-medium" data-oid="imot4r1">
                  {uniform.name}
                </Label>
                <div className="flex items-center gap-2" data-oid="1hfaipz">
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
                    data-oid=".daw6wk"
                  />

                  <span className="text-xs text-gray-500" data-oid="8ylsbki">
                    {hexColor}
                  </span>
                </div>
              </div>
              {uniform.description && (
                <p className="text-xs text-gray-500" data-oid="ca6drlx">
                  {uniform.description}
                </p>
              )}
            </div>
          )
        }

        return (
          <div className="space-y-2" data-oid="em8oz8g">
            <Label className="text-sm font-medium" data-oid="jexu0h3">
              {uniform.name}
            </Label>
            <div className="grid grid-cols-3 gap-2" data-oid="zxioo1c">
              <div data-oid="c.emll2">
                <Label className="text-xs text-gray-500" data-oid="2.45vw7">
                  X
                </Label>
                <Input
                  type="number"
                  value={uniform.value[0]}
                  onChange={(e) =>
                    onChange(uniform.name, [Number.parseFloat(e.target.value), uniform.value[1], uniform.value[2]])
                  }
                  className="h-8 text-xs"
                  step={uniform.step || 0.01}
                  data-oid="bdaf_ri"
                />
              </div>
              <div data-oid="l15l9xu">
                <Label className="text-xs text-gray-500" data-oid="hpeu9n7">
                  Y
                </Label>
                <Input
                  type="number"
                  value={uniform.value[1]}
                  onChange={(e) =>
                    onChange(uniform.name, [uniform.value[0], Number.parseFloat(e.target.value), uniform.value[2]])
                  }
                  className="h-8 text-xs"
                  step={uniform.step || 0.01}
                  data-oid="d0kj_ew"
                />
              </div>
              <div data-oid="oex6kvu">
                <Label className="text-xs text-gray-500" data-oid="e6m-4ss">
                  Z
                </Label>
                <Input
                  type="number"
                  value={uniform.value[2]}
                  onChange={(e) =>
                    onChange(uniform.name, [uniform.value[0], uniform.value[1], Number.parseFloat(e.target.value)])
                  }
                  className="h-8 text-xs"
                  step={uniform.step || 0.01}
                  data-oid="l0796l."
                />
              </div>
            </div>
            {uniform.description && (
              <p className="text-xs text-gray-500" data-oid="pokoou:">
                {uniform.description}
              </p>
            )}
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
            <div className="space-y-2" data-oid="s1ahi62">
              <Label className="text-sm font-medium" data-oid="ou3v9t-">
                {uniform.name}
              </Label>
              <div className="flex items-center gap-2" data-oid=":0jf88e">
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
                  data-oid="p-efuj7"
                />

                <div className="flex-1" data-oid="ogzm1cb">
                  <Label className="text-xs text-gray-500" data-oid="0jwyrru">
                    Alpha
                  </Label>
                  <Slider
                    value={[uniform.value[3]]}
                    onValueChange={([value]) => onChange(uniform.name, [...uniform.value.slice(0, 3), value])}
                    min={0}
                    max={1}
                    step={0.01}
                    className="w-full"
                    data-oid="81h4i7o"
                  />
                </div>
              </div>
              {uniform.description && (
                <p className="text-xs text-gray-500" data-oid="1_hc556">
                  {uniform.description}
                </p>
              )}
            </div>
          )
        }

        return (
          <div className="space-y-2" data-oid="b7wu.il">
            <Label className="text-sm font-medium" data-oid="2af_9b6">
              {uniform.name}
            </Label>
            <div className="grid grid-cols-2 gap-2" data-oid="9xpa5iy">
              <div data-oid="2fqmyju">
                <Label className="text-xs text-gray-500" data-oid=":rkwooc">
                  X
                </Label>
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
                  data-oid=":.w7_xm"
                />
              </div>
              <div data-oid="q71e-fd">
                <Label className="text-xs text-gray-500" data-oid="nt03ys0">
                  Y
                </Label>
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
                  data-oid="1lh:rqb"
                />
              </div>
              <div data-oid="q1_gkfa">
                <Label className="text-xs text-gray-500" data-oid="_n-0xd4">
                  Z
                </Label>
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
                  data-oid="l25zzf2"
                />
              </div>
              <div data-oid="-n8ke_6">
                <Label className="text-xs text-gray-500" data-oid="gf_gt:y">
                  W
                </Label>
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
                  data-oid="oklvdm9"
                />
              </div>
            </div>
            {uniform.description && (
              <p className="text-xs text-gray-500" data-oid="we:cgxr">
                {uniform.description}
              </p>
            )}
          </div>
        )
      }

      default:
        return (
          <div className="text-xs text-gray-500" data-oid="gezp35q">
            Unsupported uniform type: {uniform.type}
          </div>
        )
    }
  }

  return (
    <div className={cn("flex flex-col h-full bg-gray-900", className)} data-oid="my40v44">
      {/* Header */}
      <div className="p-4 border-b border-gray-800" data-oid="qwx-gqt">
        <h3 className="text-sm font-medium text-white mb-3" data-oid="-1gwq0_">
          Shader Uniforms
        </h3>
        <Input
          type="text"
          placeholder="Search uniforms..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="bg-gray-800 border-gray-700 text-white placeholder-gray-500"
          data-oid="5aa4fnm"
        />
      </div>

      {/* Uniforms list */}
      <div className="flex-1 overflow-auto p-4" data-oid="hnr3kbn">
        {Object.keys(groupedUniforms).length === 0 ? (
          <div className="text-center text-gray-500 text-sm py-8" data-oid="3.lk4y1">
            No uniforms found
          </div>
        ) : Object.keys(groupedUniforms).length === 1 && groupedUniforms.General ? (
          // Single group - no accordion
          <div className="space-y-4" data-oid="5gwp:uq">
            {groupedUniforms.General.map((uniform) => (
              <div key={uniform.name} data-oid="6e_zy0l">
                {renderUniformControl(uniform)}
              </div>
            ))}
          </div>
        ) : (
          // Multiple groups - use accordion
          <Accordion type="multiple" defaultValue={Object.keys(groupedUniforms)} data-oid="grmlew5">
            {Object.entries(groupedUniforms).map(([groupName, groupUniforms]) => (
              <AccordionItem key={groupName} value={groupName} data-oid="cmz7igj">
                <AccordionTrigger className="text-sm font-medium" data-oid="5du-667">
                  {groupName} ({groupUniforms.length})
                </AccordionTrigger>
                <AccordionContent data-oid="nqid:a4">
                  <div className="space-y-4 pt-2" data-oid="ko6duen">
                    {groupUniforms.map((uniform) => (
                      <div key={uniform.name} data-oid="7dkyf-z">
                        {renderUniformControl(uniform)}
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-800 text-xs text-gray-500" data-oid="w4icoz7">
        <div data-oid="oaco:1a">{uniforms.length} uniforms</div>
        <div data-oid="cvggy95">{uniforms.filter((u) => u.animatable).length} animatable</div>
      </div>
    </div>
  )
}

import { Button } from "@timeline-studio/ui/components/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@timeline-studio/ui/components/dialog"
import { Label } from "@timeline-studio/ui/components/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@timeline-studio/ui/components/select"
import { Slider } from "@timeline-studio/ui/components/slider"
import { useState } from "react"
import { useTranslation } from "react-i18next"

import type { MidiMapping } from "../../services/midi/midi-engine"

interface MidiMappingEditorProps {
  mapping: MidiMapping
  onSave: (updates: Partial<MidiMapping>) => void
  onClose: () => void
}

export function MidiMappingEditor({ mapping, onSave, onClose }: MidiMappingEditorProps) {
  const { t } = useTranslation()
  const [min, setMin] = useState(mapping.min)
  const [max, setMax] = useState(mapping.max)
  const [curve, setCurve] = useState(mapping.curve)

  const handleSave = () => {
    onSave({
      min,
      max,
      curve,
    })
  }

  return (
    <Dialog open onOpenChange={onClose} data-oid="4dbetol">
      <DialogContent className="sm:max-w-md" data-oid="15ct6yk">
        <DialogHeader data-oid="lo.4::p">
          <DialogTitle data-oid="1uom5n7">{t("fairlightAudio.midi.mappingEditor.title")}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4" data-oid="izk._5t">
          {/* Mapping Info */}
          <div className="p-3 bg-zinc-900/50 rounded-lg space-y-1" data-oid="2lhol-9">
            <p className="text-sm font-medium text-zinc-100" data-oid="b7ua94m">
              {mapping.targetParameter}
            </p>
            <p className="text-xs text-zinc-500" data-oid="050liuq">
              {mapping.messageType.toUpperCase()}
              {mapping.controller !== undefined && ` CC${mapping.controller}`}
              {mapping.channel && ` CH${mapping.channel}`}
            </p>
          </div>

          {/* Min Value */}
          <div className="space-y-2" data-oid="2a9-unn">
            <div className="flex items-center justify-between" data-oid="gi9.p4t">
              <Label className="text-xs text-zinc-400" data-oid="lfzcrze">
                {t("fairlightAudio.midi.mappingEditor.minimumValue")}
              </Label>
              <span className="text-xs text-zinc-500" data-oid="s2ucx2.">
                {min.toFixed(2)}
              </span>
            </div>
            <Slider
              value={[min]}
              onValueChange={([v]) => setMin(v)}
              min={0}
              max={1}
              step={0.01}
              className="w-full"
              data-oid="b6ppze0"
            />
          </div>

          {/* Max Value */}
          <div className="space-y-2" data-oid="4h-l94k">
            <div className="flex items-center justify-between" data-oid="-avnhu3">
              <Label className="text-xs text-zinc-400" data-oid="6s29wl_">
                {t("fairlightAudio.midi.mappingEditor.maximumValue")}
              </Label>
              <span className="text-xs text-zinc-500" data-oid="6xyr_ty">
                {max.toFixed(2)}
              </span>
            </div>
            <Slider
              value={[max]}
              onValueChange={([v]) => setMax(v)}
              min={0}
              max={1}
              step={0.01}
              className="w-full"
              data-oid="1jl9jdx"
            />
          </div>

          {/* Curve Type */}
          <div data-oid="jqqq79o">
            <Label htmlFor="curve-type" className="text-xs text-zinc-400" data-oid="w-ozvqu">
              {t("fairlightAudio.midi.mappingEditor.responseCurve")}
            </Label>
            <Select value={curve} onValueChange={(v) => setCurve(v as typeof curve)} data-oid="vki:x3a">
              <SelectTrigger id="curve-type" className="mt-1" data-oid="v9lvmih">
                <SelectValue data-oid="0y5us7c" />
              </SelectTrigger>
              <SelectContent data-oid="pfqz-li">
                <SelectItem value="linear" data-oid="p6sxoy_">
                  {t("fairlightAudio.midi.mappingEditor.curves.linear")}
                </SelectItem>
                <SelectItem value="exponential" data-oid="ng69sf2">
                  {t("fairlightAudio.midi.mappingEditor.curves.exponential")}
                </SelectItem>
                <SelectItem value="logarithmic" data-oid="0s3t-6e">
                  {t("fairlightAudio.midi.mappingEditor.curves.logarithmic")}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Curve Preview */}
          <div className="p-4 bg-zinc-900/50 rounded-lg" data-oid="eurrfdv">
            <div className="relative h-32" data-oid="_o-z5p:">
              <svg className="w-full h-full" viewBox="0 0 100 100" data-oid="wnv-mkr">
                {/* Grid */}
                <g className="stroke-zinc-800" strokeWidth="0.5" data-oid=".ump_88">
                  <line x1="0" y1="50" x2="100" y2="50" data-oid="-gq5-ie" />
                  <line x1="50" y1="0" x2="50" y2="100" data-oid="qtb_rig" />
                </g>

                {/* Curve */}
                <path
                  d={generateCurvePath(curve, min, max)}
                  fill="none"
                  stroke="rgb(59, 130, 246)"
                  strokeWidth="2"
                  data-oid="4xhu9-h"
                />

                {/* Min/Max indicators */}
                <circle cx="0" cy={100 - min * 100} r="3" fill="rgb(59, 130, 246)" data-oid="6g_wl:h" />
                <circle cx="100" cy={100 - max * 100} r="3" fill="rgb(59, 130, 246)" data-oid="8natd1b" />
              </svg>
            </div>
            <p className="text-xs text-zinc-500 text-center mt-2" data-oid="4m-lqbp">
              {t("fairlightAudio.midi.mappingEditor.responseCurvePreview")}
            </p>
          </div>
        </div>

        <DialogFooter data-oid="6cuy7sl">
          <Button variant="outline" onClick={onClose} data-oid="09p7prr">
            {t("fairlightAudio.midi.mappingEditor.cancel")}
          </Button>
          <Button onClick={handleSave} data-oid="472a61p">
            {t("fairlightAudio.midi.mappingEditor.saveChanges")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function generateCurvePath(curve: string, min: number, max: number): string {
  const points: string[] = []
  const steps = 50

  for (let i = 0; i <= steps; i++) {
    const x = (i / steps) * 100
    const t = i / steps
    let y: number

    switch (curve) {
      case "exponential":
        y = min + (max - min) * (t * t)
        break
      case "logarithmic":
        y = min + ((max - min) * Math.log(t + 1)) / Math.log(2)
        break
      default: // linear
        y = min + (max - min) * t
    }

    points.push(`${x},${100 - y * 100}`)
  }

  return `M ${points.join(" L ")}`
}

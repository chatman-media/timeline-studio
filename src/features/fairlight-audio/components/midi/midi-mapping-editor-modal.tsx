import { useState } from "react"

import { useTranslation } from "react-i18next"

import { Button } from "@timeline-studio/ui/components/button"
import { Label } from "@timeline-studio/ui/components/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@timeline-studio/ui/components/select"
import { Slider } from "@timeline-studio/ui/components/slider"
import { useModals } from "@/features/modals/services"

import type { MidiMapping } from "../../services/midi/midi-engine"

export function MidiMappingEditorModal() {
  const { t } = useTranslation()
  const { modalData, closeModal } = useModals()

  const { mapping, onSave } = (modalData || {}) as {
    mapping?: MidiMapping
    onSave?: (updates: Partial<MidiMapping>) => void
  }

  const [min, setMin] = useState(mapping?.min ?? 0)
  const [max, setMax] = useState(mapping?.max ?? 1)
  const [curve, setCurve] = useState<"linear" | "exponential" | "logarithmic">(mapping?.curve ?? "linear")

  const handleSave = () => {
    if (onSave) {
      onSave({
        min,
        max,
        curve,
      })
    }
    closeModal()
  }

  if (!mapping) {
    return null
  }

  return (
    <div className="sm:max-w-md" data-oid="hb5tcux">
      <div className="space-y-4 py-4" data-oid="0of0st7">
        {/* Mapping Info */}
        <div className="p-3 bg-zinc-900/50 rounded-lg space-y-1" data-oid="yeqzjes">
          <p className="text-sm font-medium text-zinc-100" data-oid="sifvhc7">
            {mapping.targetParameter}
          </p>
          <p className="text-xs text-zinc-500" data-oid="4ary1:i">
            {mapping.messageType.toUpperCase()}
            {mapping.controller !== undefined && ` CC${mapping.controller}`}
            {mapping.channel && ` CH${mapping.channel}`}
          </p>
        </div>

        {/* Min Value */}
        <div className="space-y-2" data-oid="zv1sbbk">
          <div className="flex items-center justify-between" data-oid="fdzd2xo">
            <Label className="text-xs text-zinc-400" data-oid="1992g4m">
              {t("fairlightAudio.midi.mappingEditor.minimumValue")}
            </Label>
            <span className="text-xs text-zinc-500" data-oid="rvdrg:w">
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
            data-oid="ak2e5sp"
          />
        </div>

        {/* Max Value */}
        <div className="space-y-2" data-oid="71r7bmw">
          <div className="flex items-center justify-between" data-oid="b3_ur55">
            <Label className="text-xs text-zinc-400" data-oid="9h_rx1g">
              {t("fairlightAudio.midi.mappingEditor.maximumValue")}
            </Label>
            <span className="text-xs text-zinc-500" data-oid="ww:ny3a">
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
            data-oid="nltmbu2"
          />
        </div>

        {/* Curve Type */}
        <div data-oid="a-302jx">
          <Label htmlFor="curve-type" className="text-xs text-zinc-400" data-oid="um_avbl">
            {t("fairlightAudio.midi.mappingEditor.responseCurve")}
          </Label>
          <Select value={curve} onValueChange={(v) => setCurve(v as typeof curve)} data-oid="xy8t-md">
            <SelectTrigger id="curve-type" className="mt-1" data-oid="qns8sqe">
              <SelectValue data-oid="dquz0hf" />
            </SelectTrigger>
            <SelectContent data-oid="lwc2ryj">
              <SelectItem value="linear" data-oid="d7svj_1">
                {t("fairlightAudio.midi.mappingEditor.curves.linear")}
              </SelectItem>
              <SelectItem value="exponential" data-oid="j3u_liv">
                {t("fairlightAudio.midi.mappingEditor.curves.exponential")}
              </SelectItem>
              <SelectItem value="logarithmic" data-oid="v-b7fdw">
                {t("fairlightAudio.midi.mappingEditor.curves.logarithmic")}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Curve Preview */}
        <div className="p-4 bg-zinc-900/50 rounded-lg" data-oid="bm6g82i">
          <div className="relative h-32" data-oid="dfwqc6n">
            <svg className="w-full h-full" viewBox="0 0 100 100" data-oid="s1kx4h.">
              {/* Grid */}
              <g className="stroke-zinc-800" strokeWidth="0.5" data-oid="ymwi4l4">
                <line x1="0" y1="50" x2="100" y2="50" data-oid="xvyeda1" />
                <line x1="50" y1="0" x2="50" y2="100" data-oid="e1l0ic1" />
              </g>

              {/* Curve */}
              <path
                d={generateCurvePath(curve, min, max)}
                fill="none"
                stroke="rgb(59, 130, 246)"
                strokeWidth="2"
                data-oid="jmg5eal"
              />

              {/* Min/Max indicators */}
              <circle cx="0" cy={100 - min * 100} r="3" fill="rgb(59, 130, 246)" data-oid="c00.tsj" />
              <circle cx="100" cy={100 - max * 100} r="3" fill="rgb(59, 130, 246)" data-oid="hatf64v" />
            </svg>
          </div>
          <p className="text-xs text-zinc-500 text-center mt-2" data-oid="100he3i">
            {t("fairlightAudio.midi.mappingEditor.responseCurvePreview")}
          </p>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4 border-t" data-oid="ek.fpi.">
        <Button variant="outline" onClick={closeModal} data-oid="p14f2sn">
          {t("fairlightAudio.midi.mappingEditor.cancel")}
        </Button>
        <Button onClick={handleSave} data-oid="zpgxe62">
          {t("fairlightAudio.midi.mappingEditor.saveChanges")}
        </Button>
      </div>
    </div>
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

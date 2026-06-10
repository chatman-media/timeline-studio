/**
 * Channel-specific Noise Reduction Component
 * Simplified UI for channel strip integration
 */

import { Button } from "@timeline-studio/ui/components/button"
import { Label } from "@timeline-studio/ui/components/label"
import { Popover, PopoverContent, PopoverTrigger } from "@timeline-studio/ui/components/popover"
import { Slider } from "@timeline-studio/ui/components/slider"
import { Switch } from "@timeline-studio/ui/components/switch"
import { Mic, MicOff } from "lucide-react"
import { useCallback, useState } from "react"
import { useTranslation } from "react-i18next"

import type { NoiseReductionConfig } from "../../services/noise-reduction/noise-reduction-engine"

interface ChannelNoiseReductionProps {
  channelId: string
  enabled: boolean
  strength: number
  onToggle: (enabled: boolean) => void
  onStrengthChange: (strength: number) => void
  onOpenAdvanced?: () => void
}

export function ChannelNoiseReduction({
  enabled,
  strength,
  onToggle,
  onStrengthChange,
  onOpenAdvanced,
}: ChannelNoiseReductionProps) {
  const { t } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="px-2 py-1 border-t border-zinc-800" data-oid="6_syu94">
      <div className="flex items-center justify-between" data-oid="kqi2:e6">
        <Popover open={isOpen} onOpenChange={setIsOpen} data-oid="rm9fjb8">
          <PopoverTrigger asChild data-oid="klc0gt4">
            <Button
              variant="ghost"
              size="sm"
              className={`h-6 px-2 ${enabled ? "text-green-400" : "text-zinc-500"}`}
              data-oid="z_poo4s"
            >
              {enabled ? (
                <Mic className="w-3 h-3" data-oid="-xykopa" />
              ) : (
                <MicOff className="w-3 h-3" data-oid="h53v-g." />
              )}
              <span className="ml-1 text-xs" data-oid="d585h69">
                {t("fairlightAudio.effects.noiseReduction.channelStrip.nr")}
              </span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-56" align="start" data-oid="h2:rr:4">
            <div className="space-y-3" data-oid="68yu3hz">
              <div className="flex items-center justify-between" data-oid="yfr61h5">
                <Label className="text-xs font-medium" data-oid="1nektmt">
                  {t("fairlightAudio.effects.noiseReduction.channelStrip.noiseReduction")}
                </Label>
                <Switch
                  checked={enabled}
                  onCheckedChange={onToggle}
                  aria-label={t("fairlightAudio.effects.noiseReduction.enable")}
                  data-oid="chr5b:l"
                />
              </div>

              <div className="space-y-2" data-oid="w7.au.9">
                <div className="flex items-center justify-between" data-oid="qm8.46n">
                  <Label className="text-xs" data-oid="f.skvo-">
                    {t("fairlightAudio.effects.noiseReduction.channelStrip.strength")}
                  </Label>
                  <span className="text-xs text-muted-foreground" data-oid="u1k03:8">
                    {strength}%
                  </span>
                </div>
                <Slider
                  min={0}
                  max={100}
                  step={1}
                  value={[strength]}
                  onValueChange={([value]) => onStrengthChange(value)}
                  disabled={!enabled}
                  className="w-full"
                  data-oid="cge9r3c"
                />
              </div>

              {onOpenAdvanced && (
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full text-xs"
                  onClick={() => {
                    setIsOpen(false)
                    onOpenAdvanced()
                  }}
                  data-oid="oj925l."
                >
                  {t("fairlightAudio.effects.noiseReduction.channelStrip.advancedSettings")}
                </Button>
              )}
            </div>
          </PopoverContent>
        </Popover>

        <span className="text-xs text-zinc-500" data-oid=":-m72z9">
          {enabled && `${strength}%`}
        </span>
      </div>
    </div>
  )
}

/**
 * Inline Noise Reduction Strip
 * For integration into channel strips
 */
interface NoiseReductionStripProps {
  enabled: boolean
  config: NoiseReductionConfig
  onToggle: (enabled: boolean) => void
  onConfigChange: (config: NoiseReductionConfig) => void
}

export function NoiseReductionStrip({ enabled, config, onToggle, onConfigChange }: NoiseReductionStripProps) {
  const { t } = useTranslation()
  const handleStrengthChange = useCallback(
    (strength: number) => {
      onConfigChange({
        ...config,
        strength,
      })
    },
    [config, onConfigChange],
  )

  const handlePreserveVoiceToggle = useCallback(
    (preserveVoice: boolean) => {
      onConfigChange({
        ...config,
        preserveVoice,
      })
    },
    [config, onConfigChange],
  )

  return (
    <div className="bg-zinc-900/50 rounded p-2 space-y-2" data-oid="-z8i7yc">
      <div className="flex items-center justify-between" data-oid="4-smqw4">
        <div className="flex items-center gap-2" data-oid="j2emnn1">
          <Button
            variant="ghost"
            size="sm"
            className={`h-6 w-6 p-0 ${enabled ? "text-green-400" : "text-zinc-500"}`}
            onClick={() => onToggle(!enabled)}
            data-oid="qvf0m.5"
          >
            {enabled ? (
              <Mic className="w-3 h-3" data-oid="d2jsn8-" />
            ) : (
              <MicOff className="w-3 h-3" data-oid="s0du.bk" />
            )}
          </Button>
          <Label className="text-xs" data-oid="9g2e3l7">
            {t("fairlightAudio.effects.noiseReduction.channelStrip.noiseReduction")}
          </Label>
        </div>
        <span className="text-xs text-zinc-500" data-oid="-maqd3g">
          {config.algorithm === "ai" ? "AI" : config.algorithm}
        </span>
      </div>

      {enabled && (
        <>
          <div className="space-y-1" data-oid=".co.76u">
            <div className="flex items-center justify-between" data-oid="t:lmtti">
              <Label className="text-xs text-zinc-400" data-oid="l0vjbf7">
                {t("fairlightAudio.effects.noiseReduction.channelStrip.strength")}
              </Label>
              <span className="text-xs text-zinc-500" data-oid="ffzqqmm">
                {config.strength}%
              </span>
            </div>
            <Slider
              min={0}
              max={100}
              step={1}
              value={[config.strength]}
              onValueChange={([value]) => handleStrengthChange(value)}
              className="h-1"
              data-oid="1b.-5o5"
            />
          </div>

          {(config.algorithm === "ai" || config.algorithm === "adaptive") && (
            <div className="flex items-center justify-between" data-oid="u_mj:_0">
              <Label className="text-xs text-zinc-400" data-oid="mgbcn_i">
                {t("fairlightAudio.effects.noiseReduction.channelStrip.voice")}
              </Label>
              <Switch
                checked={config.preserveVoice}
                onCheckedChange={handlePreserveVoiceToggle}
                className="h-4 w-7"
                data-oid="j_:ihwk"
              />
            </div>
          )}
        </>
      )}
    </div>
  )
}

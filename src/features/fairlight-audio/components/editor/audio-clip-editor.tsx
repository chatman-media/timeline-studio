import { Button } from "@timeline-studio/ui/components/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@timeline-studio/ui/components/select"
import { Slider } from "@timeline-studio/ui/components/slider"
import { Scissors, TrendingDown, TrendingUp, Volume2, Zap } from "lucide-react"
import { useState } from "react"
import { useTranslation } from "react-i18next"

import { useAudioEngine } from "../../hooks/use-audio-engine"
import type { AudioClip, FadeOptions } from "../../services/audio-clip-editor"

interface AudioClipEditorProps {
  clip: AudioClip
  onUpdate: (clip: AudioClip) => void
  onSplit: (time: number) => void
}

export function AudioClipEditorComponent({ clip, onUpdate, onSplit }: AudioClipEditorProps) {
  const { t } = useTranslation()
  const { engine: audioEngine } = useAudioEngine()
  const [fadeInDuration, setFadeInDuration] = useState(clip.fadeIn || 0)
  const [fadeOutDuration, setFadeOutDuration] = useState(clip.fadeOut || 0)
  const [fadeType, setFadeType] = useState<FadeOptions["type"]>("cosine")
  const [splitPosition, setSplitPosition] = useState(50)
  const [isNormalizing, setIsNormalizing] = useState(false)

  const handleFadeIn = () => {
    if (!audioEngine?.clipEditor) return

    const updatedClip = audioEngine.clipEditor.applyFadeIn(clip, {
      type: fadeType,
      duration: fadeInDuration,
    })

    onUpdate(updatedClip)
  }

  const handleFadeOut = () => {
    if (!audioEngine?.clipEditor) return

    const updatedClip = audioEngine.clipEditor.applyFadeOut(clip, {
      type: fadeType,
      duration: fadeOutDuration,
    })

    onUpdate(updatedClip)
  }

  const handleSplit = () => {
    const splitTime = (clip.duration * splitPosition) / 100
    onSplit(splitTime)
  }

  const handleNormalize = async () => {
    if (!audioEngine?.clipEditor) return

    setIsNormalizing(true)
    try {
      const normalizedClip = audioEngine.clipEditor.normalizeClip(clip, -3)
      onUpdate(normalizedClip)
    } finally {
      setIsNormalizing(false)
    }
  }

  return (
    <div className="p-4 space-y-4 bg-zinc-900 rounded-lg" data-oid="x9bk4p0">
      <h3 className="text-sm font-semibold text-zinc-100" data-oid="z4e6s65">
        {t("fairlightAudio.audioClipEditor.title")}
      </h3>

      {/* Fade Controls */}
      <div className="space-y-3" data-oid="r5bibpr">
        <div className="flex items-center gap-2" data-oid="jdy:-g_">
          <Select value={fadeType} onValueChange={(v) => setFadeType(v as FadeOptions["type"])} data-oid="vmhjf_2">
            <SelectTrigger className="w-32 h-8" data-oid="om_mcbq">
              <SelectValue data-oid="eymoy2_" />
            </SelectTrigger>
            <SelectContent data-oid="igfey_4">
              <SelectItem value="linear" data-oid="izsy0yb">
                {t("fairlightAudio.audioClipEditor.fadeTypes.linear")}
              </SelectItem>
              <SelectItem value="exponential" data-oid="37x2:d9">
                {t("fairlightAudio.audioClipEditor.fadeTypes.exponential")}
              </SelectItem>
              <SelectItem value="logarithmic" data-oid="9uaord5">
                {t("fairlightAudio.audioClipEditor.fadeTypes.logarithmic")}
              </SelectItem>
              <SelectItem value="cosine" data-oid="inbv-km">
                {t("fairlightAudio.audioClipEditor.fadeTypes.cosine")}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Fade In */}
        <div className="space-y-1" data-oid="pg-1qua">
          <div className="flex items-center justify-between" data-oid="uaw_mc1">
            <label className="text-xs text-zinc-400 flex items-center gap-1" data-oid="h_1:_r9">
              <TrendingUp className="w-3 h-3" data-oid="-thl-wg" />
              {t("fairlightAudio.audioClipEditor.fadeIn")}
            </label>
            <span className="text-xs text-zinc-500" data-oid="r6-o1b3">
              {fadeInDuration.toFixed(1)}s
            </span>
          </div>
          <div className="flex items-center gap-2" data-oid="zh3zu3_">
            <Slider
              value={[fadeInDuration]}
              onValueChange={([v]) => setFadeInDuration(v)}
              min={0}
              max={5}
              step={0.1}
              className="flex-1"
              data-oid="6165vzy"
            />

            <Button size="sm" variant="secondary" onClick={handleFadeIn} className="h-7 px-2" data-oid="7hyty6q">
              {t("fairlightAudio.audioClipEditor.apply")}
            </Button>
          </div>
        </div>

        {/* Fade Out */}
        <div className="space-y-1" data-oid="g6zlwf_">
          <div className="flex items-center justify-between" data-oid="b52_gpx">
            <label className="text-xs text-zinc-400 flex items-center gap-1" data-oid="t90zvuw">
              <TrendingDown className="w-3 h-3" data-oid="w21co_0" />
              {t("fairlightAudio.audioClipEditor.fadeOut")}
            </label>
            <span className="text-xs text-zinc-500" data-oid="cnc.ryt">
              {fadeOutDuration.toFixed(1)}s
            </span>
          </div>
          <div className="flex items-center gap-2" data-oid=".izt4j6">
            <Slider
              value={[fadeOutDuration]}
              onValueChange={([v]) => setFadeOutDuration(v)}
              min={0}
              max={5}
              step={0.1}
              className="flex-1"
              data-oid="a7kxnio"
            />

            <Button size="sm" variant="secondary" onClick={handleFadeOut} className="h-7 px-2" data-oid="t8zy4yf">
              {t("fairlightAudio.audioClipEditor.apply")}
            </Button>
          </div>
        </div>
      </div>

      {/* Split Control */}
      <div className="space-y-2" data-oid="zab7bok">
        <div className="flex items-center justify-between" data-oid="o2fl7-m">
          <label className="text-xs text-zinc-400 flex items-center gap-1" data-oid="hr5dwr1">
            <Scissors className="w-3 h-3" data-oid="rthnqg6" />
            {t("fairlightAudio.audioClipEditor.splitPosition")}
          </label>
          <span className="text-xs text-zinc-500" data-oid="8fmq0m5">
            {splitPosition}%
          </span>
        </div>
        <div className="flex items-center gap-2" data-oid="55n31kw">
          <Slider
            value={[splitPosition]}
            onValueChange={([v]) => setSplitPosition(v)}
            min={0}
            max={100}
            step={1}
            className="flex-1"
            data-oid="xodzai3"
          />

          <Button size="sm" variant="secondary" onClick={handleSplit} className="h-7 px-2" data-oid="h53stu-">
            {t("fairlightAudio.audioClipEditor.split")}
          </Button>
        </div>
      </div>

      {/* Normalize */}
      <div className="flex items-center justify-between pt-2 border-t border-zinc-800" data-oid="9istpw-">
        <div className="flex items-center gap-2" data-oid="k5-gdlz">
          <Volume2 className="w-4 h-4 text-zinc-400" data-oid="mkqh.hu" />
          <span className="text-xs text-zinc-400" data-oid="rq:8t6q">
            {t("fairlightAudio.audioClipEditor.normalizeTo")}
          </span>
        </div>
        <Button
          size="sm"
          variant="secondary"
          onClick={handleNormalize}
          disabled={isNormalizing}
          className="h-7 px-3"
          data-oid="glsy6-s"
        >
          {isNormalizing ? (
            <Zap className="w-3 h-3 animate-pulse" data-oid="pojwhcp" />
          ) : (
            t("fairlightAudio.audioClipEditor.normalize")
          )}
        </Button>
      </div>
    </div>
  )
}

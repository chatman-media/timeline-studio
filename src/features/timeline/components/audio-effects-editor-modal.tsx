import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useModals } from "@/domains/system-integration"

import type { AppliedEffect } from "@/domains/video-editing/types/unified-effects"

// Тип для активного аудио эффекта
interface ActiveAudioEffect {
  id: string
  name: string
  type: string
  enabled: boolean
  params: Record<string, any>
}

// Предустановленные аудио эффекты
const audioEffectPresets = {
  fadeIn: {
    id: "fade-in",
    name: "Fade In",
    type: "AudioFadeIn",
    enabled: true,
    params: { duration: 1.0 },
  },
  fadeOut: {
    id: "fade-out",
    name: "Fade Out",
    type: "AudioFadeOut",
    enabled: true,
    params: { duration: 1.0 },
  },
  equalizer: {
    id: "equalizer",
    name: "Equalizer",
    type: "AudioEqualizer",
    enabled: true,
    params: { gain_low: 0, gain_mid: 0, gain_high: 0 },
  },
  compressor: {
    id: "compressor",
    name: "Compressor",
    type: "AudioCompressor",
    enabled: true,
    params: { threshold: -20, ratio: 4, attack: 5, release: 50 },
  },
  reverb: {
    id: "reverb",
    name: "Reverb",
    type: "AudioReverb",
    enabled: true,
    params: { room_size: 0.5, damping: 0.5, wet: 0.3 },
  },
  delay: {
    id: "delay",
    name: "Delay",
    type: "AudioDelay",
    enabled: true,
    params: { delay: 0.5, decay: 0.3 },
  },
  normalize: {
    id: "normalize",
    name: "Normalize",
    type: "AudioNormalize",
    enabled: true,
    params: { target: -23 },
  },
  denoise: {
    id: "denoise",
    name: "Denoise",
    type: "AudioDenoise",
    enabled: true,
    params: { amount: 0.5 },
  },
}

export function AudioEffectsEditorModal() {
  const { modalData, closeModal } = useModals()

  // Получаем данные из modalData
  const clip = modalData?.clip
  const track = modalData?.track
  const onApplyEffects = modalData?.onApplyEffects as ((effects: AppliedEffect[]) => void) | undefined

  const [activeEffects, setActiveEffects] = useState<Record<string, ActiveAudioEffect>>(
    (modalData?.activeEffects as Record<string, ActiveAudioEffect>) || {},
  )
  const [selectedTab, setSelectedTab] = useState("basic")

  const toggleEffect = (effectId: string, preset: ActiveAudioEffect) => {
    if (activeEffects[effectId]) {
      const { [effectId]: _, ...rest } = activeEffects
      setActiveEffects(rest)
    } else {
      setActiveEffects({
        ...activeEffects,
        [effectId]: { ...preset },
      })
    }
  }

  const updateEffectParam = (effectId: string, param: string, value: number) => {
    if (activeEffects[effectId]) {
      setActiveEffects({
        ...activeEffects,
        [effectId]: {
          ...activeEffects[effectId],
          params: {
            ...activeEffects[effectId].params,
            [param]: value,
          },
        },
      })
    }
  }

  const handleApply = () => {
    const effects: AppliedEffect[] = Object.values(activeEffects).map((effect, index) => ({
      id: `applied-audio-effect-${Date.now()}-${index}`,
      effectId: effect.id,
      startTime: 0,
      enabled: true,
      order: index,
      parameters: effect.params,
      keyframes: {},
      masks: [],
      blendMode: "normal" as const,
      opacity: 1,
      effectVersion: "1.0",
      createdAt: new Date(),
      modifiedAt: new Date(),
    }))

    if (onApplyEffects) {
      onApplyEffects(effects)
    }
    closeModal()
  }

  return (
    <div className="max-w-3xl max-h-[80vh] overflow-y-auto">
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="basic">Базовые</TabsTrigger>
          <TabsTrigger value="dynamics">Динамика</TabsTrigger>
          <TabsTrigger value="spatial">Пространство</TabsTrigger>
          <TabsTrigger value="correction">Коррекция</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-4">
          {/* Fade In/Out */}
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg">
              <div>
                <h4 className="font-medium">Fade In</h4>
                <p className="text-sm text-muted-foreground">Плавное нарастание громкости</p>
              </div>
              <Switch
                checked={!!activeEffects["fade-in"]}
                onCheckedChange={() => toggleEffect("fade-in", audioEffectPresets.fadeIn)}
              />
            </div>
            {activeEffects["fade-in"] && (
              <div className="pl-4 space-y-2">
                <Label>Длительность (сек)</Label>
                <Slider
                  min={0.1}
                  max={5}
                  step={0.1}
                  value={[activeEffects["fade-in"].params.duration]}
                  onValueChange={(value) => updateEffectParam("fade-in", "duration", value[0])}
                />
              </div>
            )}

            <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg">
              <div>
                <h4 className="font-medium">Fade Out</h4>
                <p className="text-sm text-muted-foreground">Плавное затухание громкости</p>
              </div>
              <Switch
                checked={!!activeEffects["fade-out"]}
                onCheckedChange={() => toggleEffect("fade-out", audioEffectPresets.fadeOut)}
              />
            </div>
            {activeEffects["fade-out"] && (
              <div className="pl-4 space-y-2">
                <Label>Длительность (сек)</Label>
                <Slider
                  min={0.1}
                  max={5}
                  step={0.1}
                  value={[activeEffects["fade-out"].params.duration]}
                  onValueChange={(value) => updateEffectParam("fade-out", "duration", value[0])}
                />
              </div>
            )}
          </div>

          {/* Equalizer */}
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg">
              <div>
                <h4 className="font-medium">Эквалайзер</h4>
                <p className="text-sm text-muted-foreground">Настройка частот</p>
              </div>
              <Switch
                checked={!!activeEffects.equalizer}
                onCheckedChange={() => toggleEffect("equalizer", audioEffectPresets.equalizer)}
              />
            </div>
            {activeEffects.equalizer && (
              <div className="pl-4 space-y-4">
                <div className="space-y-2">
                  <Label>Низкие частоты (100Hz)</Label>
                  <Slider
                    min={-20}
                    max={20}
                    step={0.1}
                    value={[activeEffects.equalizer.params.gain_low]}
                    onValueChange={(value) => updateEffectParam("equalizer", "gain_low", value[0])}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Средние частоты (1kHz)</Label>
                  <Slider
                    min={-20}
                    max={20}
                    step={0.1}
                    value={[activeEffects.equalizer.params.gain_mid]}
                    onValueChange={(value) => updateEffectParam("equalizer", "gain_mid", value[0])}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Высокие частоты (10kHz)</Label>
                  <Slider
                    min={-20}
                    max={20}
                    step={0.1}
                    value={[activeEffects.equalizer.params.gain_high]}
                    onValueChange={(value) => updateEffectParam("equalizer", "gain_high", value[0])}
                  />
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="dynamics" className="space-y-4">
          {/* Compressor */}
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg">
              <div>
                <h4 className="font-medium">Компрессор</h4>
                <p className="text-sm text-muted-foreground">Выравнивание динамического диапазона</p>
              </div>
              <Switch
                checked={!!activeEffects.compressor}
                onCheckedChange={() => toggleEffect("compressor", audioEffectPresets.compressor)}
              />
            </div>
            {activeEffects.compressor && (
              <div className="pl-4 space-y-4">
                <div className="space-y-2">
                  <Label>Порог (dB)</Label>
                  <Slider
                    min={-60}
                    max={0}
                    step={1}
                    value={[activeEffects.compressor.params.threshold]}
                    onValueChange={(value) => updateEffectParam("compressor", "threshold", value[0])}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Степень сжатия</Label>
                  <Slider
                    min={1}
                    max={20}
                    step={0.1}
                    value={[activeEffects.compressor.params.ratio]}
                    onValueChange={(value) => updateEffectParam("compressor", "ratio", value[0])}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Normalize */}
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg">
              <div>
                <h4 className="font-medium">Нормализация</h4>
                <p className="text-sm text-muted-foreground">Выравнивание громкости</p>
              </div>
              <Switch
                checked={!!activeEffects.normalize}
                onCheckedChange={() => toggleEffect("normalize", audioEffectPresets.normalize)}
              />
            </div>
            {activeEffects.normalize && (
              <div className="pl-4 space-y-2">
                <Label>Целевая громкость (LUFS)</Label>
                <Slider
                  min={-40}
                  max={-10}
                  step={1}
                  value={[activeEffects.normalize.params.target]}
                  onValueChange={(value) => updateEffectParam("normalize", "target", value[0])}
                />
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="spatial" className="space-y-4">
          {/* Reverb */}
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg">
              <div>
                <h4 className="font-medium">Реверберация</h4>
                <p className="text-sm text-muted-foreground">Добавление пространства</p>
              </div>
              <Switch
                checked={!!activeEffects.reverb}
                onCheckedChange={() => toggleEffect("reverb", audioEffectPresets.reverb)}
              />
            </div>
            {activeEffects.reverb && (
              <div className="pl-4 space-y-4">
                <div className="space-y-2">
                  <Label>Размер помещения</Label>
                  <Slider
                    min={0}
                    max={1}
                    step={0.01}
                    value={[activeEffects.reverb.params.room_size]}
                    onValueChange={(value) => updateEffectParam("reverb", "room_size", value[0])}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Микс (Dry/Wet)</Label>
                  <Slider
                    min={0}
                    max={1}
                    step={0.01}
                    value={[activeEffects.reverb.params.wet]}
                    onValueChange={(value) => updateEffectParam("reverb", "wet", value[0])}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Delay */}
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg">
              <div>
                <h4 className="font-medium">Задержка (Delay)</h4>
                <p className="text-sm text-muted-foreground">Эхо эффект</p>
              </div>
              <Switch
                checked={!!activeEffects.delay}
                onCheckedChange={() => toggleEffect("delay", audioEffectPresets.delay)}
              />
            </div>
            {activeEffects.delay && (
              <div className="pl-4 space-y-4">
                <div className="space-y-2">
                  <Label>Время задержки (сек)</Label>
                  <Slider
                    min={0.05}
                    max={2}
                    step={0.05}
                    value={[activeEffects.delay.params.delay]}
                    onValueChange={(value) => updateEffectParam("delay", "delay", value[0])}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Затухание</Label>
                  <Slider
                    min={0}
                    max={1}
                    step={0.01}
                    value={[activeEffects.delay.params.decay]}
                    onValueChange={(value) => updateEffectParam("delay", "decay", value[0])}
                  />
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="correction" className="space-y-4">
          {/* Denoise */}
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg">
              <div>
                <h4 className="font-medium">Шумоподавление</h4>
                <p className="text-sm text-muted-foreground">Удаление фонового шума</p>
              </div>
              <Switch
                checked={!!activeEffects.denoise}
                onCheckedChange={() => toggleEffect("denoise", audioEffectPresets.denoise)}
              />
            </div>
            {activeEffects.denoise && (
              <div className="pl-4 space-y-2">
                <Label>Сила подавления</Label>
                <Slider
                  min={0}
                  max={1}
                  step={0.01}
                  value={[activeEffects.denoise.params.amount]}
                  onValueChange={(value) => updateEffectParam("denoise", "amount", value[0])}
                />
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button variant="outline" onClick={closeModal}>
          Отмена
        </Button>
        <Button onClick={handleApply}>Применить эффекты</Button>
      </div>
    </div>
  )
}

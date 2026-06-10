import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useModals } from "@timeline-studio/core/hooks"

import type { AppliedEffect } from "@timeline-studio/core/types"

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
    <div className="max-w-3xl max-h-[80vh] overflow-y-auto" data-oid="2vvdtnq">
      <Tabs value={selectedTab} onValueChange={setSelectedTab} data-oid="22kbuk7">
        <TabsList className="grid w-full grid-cols-4" data-oid="k.feonl">
          <TabsTrigger value="basic" data-oid="-fb6yb-">
            Базовые
          </TabsTrigger>
          <TabsTrigger value="dynamics" data-oid="ny9je6f">
            Динамика
          </TabsTrigger>
          <TabsTrigger value="spatial" data-oid="-boxhgc">
            Пространство
          </TabsTrigger>
          <TabsTrigger value="correction" data-oid="tq3rw9i">
            Коррекция
          </TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-4" data-oid="k5:v-nu">
          {/* Fade In/Out */}
          <div className="space-y-4" data-oid="_w9z_lq">
            <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg" data-oid="7f-7pbw">
              <div data-oid="vmya3h2">
                <h4 className="font-medium" data-oid="8c3a6ve">
                  Fade In
                </h4>
                <p className="text-sm text-muted-foreground" data-oid="ne1tuxa">
                  Плавное нарастание громкости
                </p>
              </div>
              <Switch
                checked={!!activeEffects["fade-in"]}
                onCheckedChange={() => toggleEffect("fade-in", audioEffectPresets.fadeIn)}
                data-oid="qyhcz2u"
              />
            </div>
            {activeEffects["fade-in"] && (
              <div className="pl-4 space-y-2" data-oid="1n_kv5f">
                <Label data-oid="u7cc7f1">Длительность (сек)</Label>
                <Slider
                  min={0.1}
                  max={5}
                  step={0.1}
                  value={[activeEffects["fade-in"].params.duration]}
                  onValueChange={(value) => updateEffectParam("fade-in", "duration", value[0])}
                  data-oid="mt70m3q"
                />
              </div>
            )}

            <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg" data-oid="7.azhzm">
              <div data-oid="9ml0uyu">
                <h4 className="font-medium" data-oid="8av8iep">
                  Fade Out
                </h4>
                <p className="text-sm text-muted-foreground" data-oid="m_c.cae">
                  Плавное затухание громкости
                </p>
              </div>
              <Switch
                checked={!!activeEffects["fade-out"]}
                onCheckedChange={() => toggleEffect("fade-out", audioEffectPresets.fadeOut)}
                data-oid="_8xvi8x"
              />
            </div>
            {activeEffects["fade-out"] && (
              <div className="pl-4 space-y-2" data-oid="jdhfk05">
                <Label data-oid="ggt9qo9">Длительность (сек)</Label>
                <Slider
                  min={0.1}
                  max={5}
                  step={0.1}
                  value={[activeEffects["fade-out"].params.duration]}
                  onValueChange={(value) => updateEffectParam("fade-out", "duration", value[0])}
                  data-oid="0rg7m89"
                />
              </div>
            )}
          </div>

          {/* Equalizer */}
          <div className="space-y-4" data-oid="vu0m61d">
            <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg" data-oid="x8m2oyf">
              <div data-oid=".e8.lqz">
                <h4 className="font-medium" data-oid="n1d-nwt">
                  Эквалайзер
                </h4>
                <p className="text-sm text-muted-foreground" data-oid="jb-xevm">
                  Настройка частот
                </p>
              </div>
              <Switch
                checked={!!activeEffects.equalizer}
                onCheckedChange={() => toggleEffect("equalizer", audioEffectPresets.equalizer)}
                data-oid="c4qimts"
              />
            </div>
            {activeEffects.equalizer && (
              <div className="pl-4 space-y-4" data-oid="nbuh1ql">
                <div className="space-y-2" data-oid="9kkqsi0">
                  <Label data-oid="x2bz-2w">Низкие частоты (100Hz)</Label>
                  <Slider
                    min={-20}
                    max={20}
                    step={0.1}
                    value={[activeEffects.equalizer.params.gain_low]}
                    onValueChange={(value) => updateEffectParam("equalizer", "gain_low", value[0])}
                    data-oid="moy9zkf"
                  />
                </div>
                <div className="space-y-2" data-oid="9s_4fuj">
                  <Label data-oid="ykjx1zr">Средние частоты (1kHz)</Label>
                  <Slider
                    min={-20}
                    max={20}
                    step={0.1}
                    value={[activeEffects.equalizer.params.gain_mid]}
                    onValueChange={(value) => updateEffectParam("equalizer", "gain_mid", value[0])}
                    data-oid="d9jhpcm"
                  />
                </div>
                <div className="space-y-2" data-oid="59dom4g">
                  <Label data-oid="cqq.v_u">Высокие частоты (10kHz)</Label>
                  <Slider
                    min={-20}
                    max={20}
                    step={0.1}
                    value={[activeEffects.equalizer.params.gain_high]}
                    onValueChange={(value) => updateEffectParam("equalizer", "gain_high", value[0])}
                    data-oid="8fe1p5b"
                  />
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="dynamics" className="space-y-4" data-oid="73:c_:o">
          {/* Compressor */}
          <div className="space-y-4" data-oid="4c47i0f">
            <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg" data-oid="xk80k:2">
              <div data-oid="8kkg-6r">
                <h4 className="font-medium" data-oid="t77b1fb">
                  Компрессор
                </h4>
                <p className="text-sm text-muted-foreground" data-oid="1z5c:lx">
                  Выравнивание динамического диапазона
                </p>
              </div>
              <Switch
                checked={!!activeEffects.compressor}
                onCheckedChange={() => toggleEffect("compressor", audioEffectPresets.compressor)}
                data-oid="obtosn7"
              />
            </div>
            {activeEffects.compressor && (
              <div className="pl-4 space-y-4" data-oid="br.rm0.">
                <div className="space-y-2" data-oid="owl--_0">
                  <Label data-oid="12xfc80">Порог (dB)</Label>
                  <Slider
                    min={-60}
                    max={0}
                    step={1}
                    value={[activeEffects.compressor.params.threshold]}
                    onValueChange={(value) => updateEffectParam("compressor", "threshold", value[0])}
                    data-oid="r0:avto"
                  />
                </div>
                <div className="space-y-2" data-oid="cfujrve">
                  <Label data-oid="-pm4c3i">Степень сжатия</Label>
                  <Slider
                    min={1}
                    max={20}
                    step={0.1}
                    value={[activeEffects.compressor.params.ratio]}
                    onValueChange={(value) => updateEffectParam("compressor", "ratio", value[0])}
                    data-oid="62mcchh"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Normalize */}
          <div className="space-y-4" data-oid="phl0-3q">
            <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg" data-oid="x9kmeu_">
              <div data-oid="8a:nu_5">
                <h4 className="font-medium" data-oid=":puqn5-">
                  Нормализация
                </h4>
                <p className="text-sm text-muted-foreground" data-oid="x_lj2xh">
                  Выравнивание громкости
                </p>
              </div>
              <Switch
                checked={!!activeEffects.normalize}
                onCheckedChange={() => toggleEffect("normalize", audioEffectPresets.normalize)}
                data-oid="1uerq02"
              />
            </div>
            {activeEffects.normalize && (
              <div className="pl-4 space-y-2" data-oid="ytty8zk">
                <Label data-oid="mnyxq.m">Целевая громкость (LUFS)</Label>
                <Slider
                  min={-40}
                  max={-10}
                  step={1}
                  value={[activeEffects.normalize.params.target]}
                  onValueChange={(value) => updateEffectParam("normalize", "target", value[0])}
                  data-oid="bk--63d"
                />
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="spatial" className="space-y-4" data-oid="6cxtmpm">
          {/* Reverb */}
          <div className="space-y-4" data-oid="i_-h9jg">
            <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg" data-oid="2i:wrmh">
              <div data-oid="urz0eod">
                <h4 className="font-medium" data-oid="1c87a.g">
                  Реверберация
                </h4>
                <p className="text-sm text-muted-foreground" data-oid="pp516_2">
                  Добавление пространства
                </p>
              </div>
              <Switch
                checked={!!activeEffects.reverb}
                onCheckedChange={() => toggleEffect("reverb", audioEffectPresets.reverb)}
                data-oid="l91qecd"
              />
            </div>
            {activeEffects.reverb && (
              <div className="pl-4 space-y-4" data-oid="_01ldbr">
                <div className="space-y-2" data-oid="3n7c4sm">
                  <Label data-oid="p6rq.nc">Размер помещения</Label>
                  <Slider
                    min={0}
                    max={1}
                    step={0.01}
                    value={[activeEffects.reverb.params.room_size]}
                    onValueChange={(value) => updateEffectParam("reverb", "room_size", value[0])}
                    data-oid="jolar2g"
                  />
                </div>
                <div className="space-y-2" data-oid="nbotcqe">
                  <Label data-oid="7y4tn5x">Микс (Dry/Wet)</Label>
                  <Slider
                    min={0}
                    max={1}
                    step={0.01}
                    value={[activeEffects.reverb.params.wet]}
                    onValueChange={(value) => updateEffectParam("reverb", "wet", value[0])}
                    data-oid="fkw.6ml"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Delay */}
          <div className="space-y-4" data-oid="3rxiwmd">
            <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg" data-oid="k2pxu3w">
              <div data-oid="yvhjgc9">
                <h4 className="font-medium" data-oid="qvjhxii">
                  Задержка (Delay)
                </h4>
                <p className="text-sm text-muted-foreground" data-oid="frlmt95">
                  Эхо эффект
                </p>
              </div>
              <Switch
                checked={!!activeEffects.delay}
                onCheckedChange={() => toggleEffect("delay", audioEffectPresets.delay)}
                data-oid=":as26wv"
              />
            </div>
            {activeEffects.delay && (
              <div className="pl-4 space-y-4" data-oid="2hlv479">
                <div className="space-y-2" data-oid="0ue657a">
                  <Label data-oid="0:gavme">Время задержки (сек)</Label>
                  <Slider
                    min={0.05}
                    max={2}
                    step={0.05}
                    value={[activeEffects.delay.params.delay]}
                    onValueChange={(value) => updateEffectParam("delay", "delay", value[0])}
                    data-oid="88gdruc"
                  />
                </div>
                <div className="space-y-2" data-oid="jsd1rld">
                  <Label data-oid="h-7si7u">Затухание</Label>
                  <Slider
                    min={0}
                    max={1}
                    step={0.01}
                    value={[activeEffects.delay.params.decay]}
                    onValueChange={(value) => updateEffectParam("delay", "decay", value[0])}
                    data-oid="pw35pd8"
                  />
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="correction" className="space-y-4" data-oid="i6-h2z8">
          {/* Denoise */}
          <div className="space-y-4" data-oid="2i6j05x">
            <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg" data-oid="ybw4-f0">
              <div data-oid=":mhpl0x">
                <h4 className="font-medium" data-oid="m1qpmw_">
                  Шумоподавление
                </h4>
                <p className="text-sm text-muted-foreground" data-oid="zyi:4n8">
                  Удаление фонового шума
                </p>
              </div>
              <Switch
                checked={!!activeEffects.denoise}
                onCheckedChange={() => toggleEffect("denoise", audioEffectPresets.denoise)}
                data-oid="qtp.soz"
              />
            </div>
            {activeEffects.denoise && (
              <div className="pl-4 space-y-2" data-oid="0__4rm5">
                <Label data-oid="6r7on24">Сила подавления</Label>
                <Slider
                  min={0}
                  max={1}
                  step={0.01}
                  value={[activeEffects.denoise.params.amount]}
                  onValueChange={(value) => updateEffectParam("denoise", "amount", value[0])}
                  data-oid="9ke.6uw"
                />
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end gap-2 pt-4 border-t" data-oid="d3b27hi">
        <Button variant="outline" onClick={closeModal} data-oid="p08wv3f">
          Отмена
        </Button>
        <Button onClick={handleApply} data-oid=".7s1lh9">
          Применить эффекты
        </Button>
      </div>
    </div>
  )
}

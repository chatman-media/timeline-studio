/**
 * AI Marker Settings Modal
 * Модальное окно настроек для AI маркеров
 */

import { useEffect, useState } from "react"

import { Button } from "@timeline-studio/ui/components/button"
import { Label } from "@timeline-studio/ui/components/label"
import { Slider } from "@timeline-studio/ui/components/slider"
import { Switch } from "@timeline-studio/ui/components/switch"
import { useModals } from "@timeline-studio/core/hooks"

import type { AIMarkerConfig } from "../../services/ai-marker-service"

export function AIMarkerSettingsModal() {
  const { modalData, closeModal } = useModals()

  const initialConfig = modalData?.config as AIMarkerConfig | undefined
  const onSave = modalData?.onSave as ((config: AIMarkerConfig) => void) | undefined

  const [markerConfig, setMarkerConfig] = useState<AIMarkerConfig>({
    createSceneMarkers: true,
    createKeyMomentMarkers: true,
    createQualityMarkers: false,
    createEmotionalMarkers: true,
    minConfidence: 0.7,
    minSceneDuration: 2,
    minQualityScore: 80,
    groupNearbyMarkers: true,
    groupingThreshold: 2,
  })

  // Инициализация значений при открытии модального окна
  useEffect(() => {
    if (initialConfig) {
      setMarkerConfig(initialConfig)
    }
  }, [initialConfig])

  const updateConfig = (key: keyof AIMarkerConfig, value: any) => {
    setMarkerConfig((prev) => ({ ...prev, [key]: value }))
  }

  const handleSave = () => {
    onSave?.(markerConfig)
    closeModal()
  }

  return (
    <div className="space-y-6" data-oid="c8lbc6p">
      {/* Типы маркеров */}
      <div className="space-y-4" data-oid="f7.rjo:">
        <h4 className="text-sm font-medium" data-oid="dxl1xml">
          Типы маркеров
        </h4>

        <div className="flex items-center justify-between" data-oid=".0y3fph">
          <Label htmlFor="scene-markers" data-oid="8o2a4ej">
            Маркеры смены сцен
          </Label>
          <Switch
            id="scene-markers"
            checked={markerConfig.createSceneMarkers}
            onCheckedChange={(checked) => updateConfig("createSceneMarkers", checked)}
            data-oid="fuot2m-"
          />
        </div>

        <div className="flex items-center justify-between" data-oid="eilsq4-">
          <Label htmlFor="moment-markers" data-oid="-0yof-n">
            Ключевые моменты
          </Label>
          <Switch
            id="moment-markers"
            checked={markerConfig.createKeyMomentMarkers}
            onCheckedChange={(checked) => updateConfig("createKeyMomentMarkers", checked)}
            data-oid="c9mf9zb"
          />
        </div>

        <div className="flex items-center justify-between" data-oid="oa7pj9c">
          <Label htmlFor="quality-markers" data-oid="hf:e0wj">
            Маркеры качества
          </Label>
          <Switch
            id="quality-markers"
            checked={markerConfig.createQualityMarkers}
            onCheckedChange={(checked) => updateConfig("createQualityMarkers", checked)}
            data-oid="2sdmpf3"
          />
        </div>

        <div className="flex items-center justify-between" data-oid="v33oos.">
          <Label htmlFor="emotion-markers" data-oid="sc_v87y">
            Эмоциональные маркеры
          </Label>
          <Switch
            id="emotion-markers"
            checked={markerConfig.createEmotionalMarkers}
            onCheckedChange={(checked) => updateConfig("createEmotionalMarkers", checked)}
            data-oid="afrjn-z"
          />
        </div>
      </div>

      {/* Параметры фильтрации */}
      <div className="space-y-4" data-oid="lx8ap6:">
        <h4 className="text-sm font-medium" data-oid="_b2y8xd">
          Параметры фильтрации
        </h4>

        <div className="space-y-2" data-oid=":x7b6x_">
          <div className="flex items-center justify-between" data-oid="ls5i:lm">
            <Label htmlFor="confidence" data-oid=":g7nr8k">
              Минимальная уверенность
            </Label>
            <span className="text-sm text-muted-foreground" data-oid="810d254">
              {Math.round(markerConfig.minConfidence * 100)}%
            </span>
          </div>
          <Slider
            id="confidence"
            min={0}
            max={1}
            step={0.05}
            value={[markerConfig.minConfidence]}
            onValueChange={([value]) => updateConfig("minConfidence", value)}
            data-oid="-lt1m50"
          />
        </div>

        <div className="space-y-2" data-oid="32zjfvw">
          <div className="flex items-center justify-between" data-oid="0nnubae">
            <Label htmlFor="scene-duration" data-oid="k1l-tgn">
              Мин. длительность сцены (сек)
            </Label>
            <span className="text-sm text-muted-foreground" data-oid="5pse:wi">
              {markerConfig.minSceneDuration}с
            </span>
          </div>
          <Slider
            id="scene-duration"
            min={0.5}
            max={10}
            step={0.5}
            value={[markerConfig.minSceneDuration]}
            onValueChange={([value]) => updateConfig("minSceneDuration", value)}
            data-oid="jpfj3.9"
          />
        </div>

        {markerConfig.createQualityMarkers && (
          <div className="space-y-2" data-oid="czd3io9">
            <div className="flex items-center justify-between" data-oid="l4em1mi">
              <Label htmlFor="quality-score" data-oid="5oy..sm">
                Минимальное качество
              </Label>
              <span className="text-sm text-muted-foreground" data-oid="kvhjxle">
                {markerConfig.minQualityScore}%
              </span>
            </div>
            <Slider
              id="quality-score"
              min={50}
              max={100}
              step={5}
              value={[markerConfig.minQualityScore]}
              onValueChange={([value]) => updateConfig("minQualityScore", value)}
              data-oid="8soo1:u"
            />
          </div>
        )}
      </div>

      {/* Группировка */}
      <div className="space-y-4" data-oid="z_sr6v2">
        <h4 className="text-sm font-medium" data-oid="q:geuxx">
          Группировка маркеров
        </h4>

        <div className="flex items-center justify-between" data-oid="aai1lhy">
          <Label htmlFor="group-markers" data-oid="8jxr7h7">
            Группировать близкие маркеры
          </Label>
          <Switch
            id="group-markers"
            checked={markerConfig.groupNearbyMarkers}
            onCheckedChange={(checked) => updateConfig("groupNearbyMarkers", checked)}
            data-oid="h6jm0ky"
          />
        </div>

        {markerConfig.groupNearbyMarkers && (
          <div className="space-y-2" data-oid="6rpsnng">
            <div className="flex items-center justify-between" data-oid="wd0ecej">
              <Label htmlFor="group-threshold" data-oid="af1h4dl">
                Порог группировки (сек)
              </Label>
              <span className="text-sm text-muted-foreground" data-oid="4e.sz6h">
                {markerConfig.groupingThreshold}с
              </span>
            </div>
            <Slider
              id="group-threshold"
              min={0.5}
              max={5}
              step={0.5}
              value={[markerConfig.groupingThreshold]}
              onValueChange={([value]) => updateConfig("groupingThreshold", value)}
              data-oid="l-0.qnh"
            />
          </div>
        )}
      </div>

      <div className="flex justify-end gap-2" data-oid="n7-5tev">
        <Button variant="outline" onClick={closeModal} data-oid="mqr2kca">
          Отмена
        </Button>
        <Button onClick={handleSave} data-oid="t9flb3_">
          Сохранить
        </Button>
      </div>
    </div>
  )
}

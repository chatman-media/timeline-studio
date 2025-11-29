/**
 * AI Marker Settings Modal
 * Модальное окно настроек для AI маркеров
 */

import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { useModals } from "@/domains/system-integration"

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
    <div className="space-y-6">
      {/* Типы маркеров */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium">Типы маркеров</h4>

        <div className="flex items-center justify-between">
          <Label htmlFor="scene-markers">Маркеры смены сцен</Label>
          <Switch
            id="scene-markers"
            checked={markerConfig.createSceneMarkers}
            onCheckedChange={(checked) => updateConfig("createSceneMarkers", checked)}
          />
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="moment-markers">Ключевые моменты</Label>
          <Switch
            id="moment-markers"
            checked={markerConfig.createKeyMomentMarkers}
            onCheckedChange={(checked) => updateConfig("createKeyMomentMarkers", checked)}
          />
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="quality-markers">Маркеры качества</Label>
          <Switch
            id="quality-markers"
            checked={markerConfig.createQualityMarkers}
            onCheckedChange={(checked) => updateConfig("createQualityMarkers", checked)}
          />
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="emotion-markers">Эмоциональные маркеры</Label>
          <Switch
            id="emotion-markers"
            checked={markerConfig.createEmotionalMarkers}
            onCheckedChange={(checked) => updateConfig("createEmotionalMarkers", checked)}
          />
        </div>
      </div>

      {/* Параметры фильтрации */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium">Параметры фильтрации</h4>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="confidence">Минимальная уверенность</Label>
            <span className="text-sm text-muted-foreground">{Math.round(markerConfig.minConfidence * 100)}%</span>
          </div>
          <Slider
            id="confidence"
            min={0}
            max={1}
            step={0.05}
            value={[markerConfig.minConfidence]}
            onValueChange={([value]) => updateConfig("minConfidence", value)}
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="scene-duration">Мин. длительность сцены (сек)</Label>
            <span className="text-sm text-muted-foreground">{markerConfig.minSceneDuration}с</span>
          </div>
          <Slider
            id="scene-duration"
            min={0.5}
            max={10}
            step={0.5}
            value={[markerConfig.minSceneDuration]}
            onValueChange={([value]) => updateConfig("minSceneDuration", value)}
          />
        </div>

        {markerConfig.createQualityMarkers && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="quality-score">Минимальное качество</Label>
              <span className="text-sm text-muted-foreground">{markerConfig.minQualityScore}%</span>
            </div>
            <Slider
              id="quality-score"
              min={50}
              max={100}
              step={5}
              value={[markerConfig.minQualityScore]}
              onValueChange={([value]) => updateConfig("minQualityScore", value)}
            />
          </div>
        )}
      </div>

      {/* Группировка */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium">Группировка маркеров</h4>

        <div className="flex items-center justify-between">
          <Label htmlFor="group-markers">Группировать близкие маркеры</Label>
          <Switch
            id="group-markers"
            checked={markerConfig.groupNearbyMarkers}
            onCheckedChange={(checked) => updateConfig("groupNearbyMarkers", checked)}
          />
        </div>

        {markerConfig.groupNearbyMarkers && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="group-threshold">Порог группировки (сек)</Label>
              <span className="text-sm text-muted-foreground">{markerConfig.groupingThreshold}с</span>
            </div>
            <Slider
              id="group-threshold"
              min={0.5}
              max={5}
              step={0.5}
              value={[markerConfig.groupingThreshold]}
              onValueChange={([value]) => updateConfig("groupingThreshold", value)}
            />
          </div>
        )}
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={closeModal}>
          Отмена
        </Button>
        <Button onClick={handleSave}>Сохранить</Button>
      </div>
    </div>
  )
}

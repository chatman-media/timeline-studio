import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react"

import { Slider } from "@/components/ui/slider"
import { useUserSettings } from "@/features/user-settings"

// Интерфейс для компонента слайдера громкости
export interface VolumeSliderProps {
  volume: number
  volumeRef?: React.RefObject<number> // Опциональный параметр
  onValueChange: (value: number[]) => void
  onValueCommit: () => void
}

// Мемоизированный компонент слайдера громкости для предотвращения лишних рендеров
const VolumeSlider = memo(({ volume, volumeRef, onValueChange, onValueCommit }: VolumeSliderProps) => {
  const { playerVolume } = useUserSettings()
  // Используем локальное состояние для отображения слайдера
  const [localVolume, setLocalVolume] = useState(playerVolume)

  // Используем ref для отслеживания, находится ли слайдер в процессе перетаскивания
  const isDraggingRef = useRef(false)

  // Используем ref для дебаунсинга обновлений
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Обновляем локальное состояние при изменении громкости извне,
  // но только если слайдер не перетаскивается в данный момент
  useEffect(() => {
    if (!isDraggingRef.current) {
      setLocalVolume(volume)
    }
  }, [volume])

  // Обработчик изменения громкости внутри компонента
  const handleLocalVolumeChange = useCallback(
    (value: number[]) => {
      const newVolume = value[0] // Теперь значение уже в диапазоне 0-100

      // Устанавливаем флаг, что слайдер перетаскивается
      isDraggingRef.current = true

      // Обновляем локальное состояние для визуального отображения
      setLocalVolume(newVolume)

      // Обновляем значение в volumeRef, если он предоставлен
      if (typeof volumeRef?.current !== "undefined") {
        volumeRef.current = newVolume
      }

      // Используем дебаунсинг для уменьшения количества обновлений
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current)
      }

      // Вызываем onValueChange с задержкой для уменьшения нагрузки
      updateTimeoutRef.current = setTimeout(() => {
        onValueChange(value)
        updateTimeoutRef.current = null
      }, 50) // Небольшая задержка для снижения частоты обновлений
    },
    [onValueChange, volumeRef],
  )

  // Обработчик завершения изменения громкости
  const handleValueCommit = useCallback(() => {
    // Сбрасываем флаг перетаскивания
    isDraggingRef.current = false

    // Очищаем таймаут, если он был установлен
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current)
      updateTimeoutRef.current = null
    }

    // Вызываем колбэк завершения
    onValueCommit()
  }, [onValueCommit])

  // Вычисляем стили для слайдера
  const normalizedVolume = typeof localVolume === "number" && !Number.isNaN(localVolume) ? localVolume / 100 : 0 // Преобразуем из диапазона 0-100 в 0-1 для стилей
  const fillStyle = useMemo(() => ({ width: `${normalizedVolume * 100}%` }), [normalizedVolume])
  const thumbStyle = useMemo(() => ({ left: `calc(${normalizedVolume * 100}% - 6px)` }), [normalizedVolume])

  return (
    <div className="relative h-1 w-20 rounded-full border border-black dark:border-white bg-white dark:bg-black cursor-pointer">
      <div
        className="absolute top-0 left-0 h-full rounded-full bg-black dark:bg-white transition-all duration-200 ease-out"
        style={fillStyle}
      />
      <div
        className="absolute top-1/2 h-[12px] w-[12px] -translate-y-1/2 rounded-full border border-black dark:border-white bg-gray-100 dark:bg-background transition-all duration-200 ease-out cursor-pointer"
        style={thumbStyle}
      />
      <Slider
        value={[localVolume]}
        min={0}
        max={100}
        step={1}
        onValueChange={handleLocalVolumeChange}
        onValueCommit={handleValueCommit}
        className="absolute inset-0 h-full w-full opacity-0"
        data-testid="volume-slider"
      />
    </div>
  )
})

VolumeSlider.displayName = "VolumeSlider"

export { VolumeSlider }

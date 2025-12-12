import { useCallback, useState } from "react"
import type { TimelineClip as DomainTimelineClip, Timeline } from "@/domains/video-editing/types"
import {
  calculateNewDuration,
  createSpeedKeyframe,
  getSpeedAtTime,
  SPEED_RAMPING_PRESETS,
  type SpeedInterpolationType,
  type SpeedKeyframe,
  type SpeedRampingConfig,
  type SpeedRampingPreset,
} from "../types/speed-ramping"
import type { TimelineClip } from "@/features/timeline/types"
import { useTimeline } from "./use-timeline"

export interface UseSpeedRampingReturn {
  // Конфигурация
  getConfig: (clipId: string) => SpeedRampingConfig | null
  setConfig: (clipId: string, config: SpeedRampingConfig) => void

  // Управление keyframes
  addKeyframe: (clipId: string, time: number, value: number, interpolation?: SpeedInterpolationType) => void
  updateKeyframe: (clipId: string, keyframeId: string, updates: Partial<SpeedKeyframe>) => void
  removeKeyframe: (clipId: string, keyframeId: string) => void
  moveKeyframe: (clipId: string, keyframeId: string, newTime: number) => void

  // Пресеты
  applyPreset: (clipId: string, presetId: string) => void
  getPresets: () => SpeedRampingPreset[]
  createPresetFromClip: (clipId: string, name: string) => SpeedRampingPreset | null

  // Включение/выключение
  enableSpeedRamping: (clipId: string) => void
  disableSpeedRamping: (clipId: string) => void
  toggleSpeedRamping: (clipId: string) => void

  // Утилиты
  getSpeedAtTime: (clipId: string, time: number) => number
  getNewDuration: (clipId: string) => number
  resetToConstantSpeed: (clipId: string, speed: number) => void

  // Визуализация
  getSpeedCurveData: (clipId: string, resolution?: number) => Array<{ time: number; speed: number }>
}

export function useSpeedRamping(): UseSpeedRampingReturn {
  const { project, send } = useTimeline()
  const [configs, setConfigs] = useState(() => new Map<string, SpeedRampingConfig>())

  // Адаптер для преобразования domain клипа в feature клип
  const adaptDomainClipToFeatureClip = (domainClip: DomainTimelineClip): TimelineClip => {
    return {
      ...domainClip,
      mediaFile: undefined,
      mediaStartTime: domainClip.sourceIn,
      mediaEndTime: domainClip.sourceOut,
      speed: domainClip.playbackRate || 1,
      isReversed: (domainClip.playbackRate || 1) < 0,
      maintainPitch: false,
      offset: 0,
      type: undefined,
    } as unknown as TimelineClip
  }

  // Получение конфигурации для клипа
  const getConfig = useCallback(
    (clipId: string): SpeedRampingConfig | null => {
      // Сначала проверяем локальный кэш
      const cachedConfig = configs.get(clipId)
      if (cachedConfig) return cachedConfig

      // Если нет в кэше, читаем из клипа
      const clip = findClip(project, clipId)
      if (clip && "speedRamping" in clip && clip.speedRamping) {
        // Сохраняем в кэш для быстрого доступа
        const speedRampingConfig = clip.speedRamping as SpeedRampingConfig
        setConfigs((prev) => {
          const newConfigs = new Map(prev)
          newConfigs.set(clipId, speedRampingConfig)
          return newConfigs
        })
        return speedRampingConfig
      }

      return null
    },
    [configs, project],
  )

  // Установка конфигурации
  const setConfig = useCallback(
    (clipId: string, config: SpeedRampingConfig) => {
      const newConfigs = new Map(configs)
      newConfigs.set(clipId, config)
      setConfigs(newConfigs)

      // Обновляем клип с новой длительностью и конфигурацией
      const clip = findClip(project, clipId)
      if (clip) {
        const newDuration = calculateNewDuration(clip.duration, config.keyframes)

        send({
          type: "UPDATE_CLIP",
          clipId,
          updates: {
            playbackRate: config.keyframes.length > 0 ? config.keyframes[0].value : 1.0,
            duration: newDuration,
            speedRamping: config, // Сохраняем конфигурацию в клип
          },
        })
      }
    },
    [configs, project, send],
  )

  // Добавление keyframe
  const addKeyframe = useCallback(
    (clipId: string, time: number, value: number, interpolation: SpeedInterpolationType = "linear") => {
      setConfigs((prevConfigs) => {
        const config = prevConfigs.get(clipId) || {
          enabled: true,
          keyframes: [],
          maintainPitch: true,
          minSpeed: 0.1,
          maxSpeed: 10.0,
          showGraph: true,
          graphHeight: 60,
          graphOpacity: 0.8,
        }

        const keyframe = createSpeedKeyframe(time, value, interpolation)
        const newKeyframes = [...config.keyframes, keyframe].sort((a, b) => a.time - b.time)

        const newConfig = {
          ...config,
          keyframes: newKeyframes,
        }

        const newConfigs = new Map(prevConfigs)
        newConfigs.set(clipId, newConfig)

        // Обновляем клип с новой длительностью
        const clip = findClip(project, clipId)
        if (clip) {
          const newDuration = calculateNewDuration(clip.duration, newKeyframes)
          send({
            type: "UPDATE_CLIP",
            clipId,
            updates: {
              playbackRate: newKeyframes.length > 0 ? newKeyframes[0].value : 1.0,
              duration: newDuration,
              speedRamping: newConfig,
            },
          })
        }

        return newConfigs
      })
    },
    [project, send],
  )

  // Обновление keyframe
  const updateKeyframe = useCallback(
    (clipId: string, keyframeId: string, updates: Partial<SpeedKeyframe>) => {
      setConfigs((prevConfigs) => {
        const config = prevConfigs.get(clipId)
        if (!config) return prevConfigs

        const newKeyframes = config.keyframes
          .map((kf) => (kf.id === keyframeId ? { ...kf, ...updates } : kf))
          .sort((a, b) => a.time - b.time)

        const newConfig = {
          ...config,
          keyframes: newKeyframes,
        }

        const newConfigs = new Map(prevConfigs)
        newConfigs.set(clipId, newConfig)

        // Обновляем клип если нужно
        const clip = findClip(project, clipId)
        if (clip && config.enabled) {
          const newDuration = calculateNewDuration(clip.duration, newKeyframes)
          send({
            type: "UPDATE_CLIP",
            clipId,
            updates: {
              playbackRate: newKeyframes.length > 0 ? newKeyframes[0].value : 1.0,
              duration: newDuration,
              speedRamping: newConfig,
            },
          })
        }

        return newConfigs
      })
    },
    [project, send],
  )

  // Удаление keyframe
  const removeKeyframe = useCallback(
    (clipId: string, keyframeId: string) => {
      setConfigs((prevConfigs) => {
        const config = prevConfigs.get(clipId)
        if (!config) return prevConfigs

        const newKeyframes = config.keyframes.filter((kf) => kf.id !== keyframeId)

        const newConfig = {
          ...config,
          keyframes: newKeyframes,
        }

        const newConfigs = new Map(prevConfigs)
        newConfigs.set(clipId, newConfig)

        // Обновляем клип если нужно
        const clip = findClip(project, clipId)
        if (clip && config.enabled) {
          const newDuration = calculateNewDuration(clip.duration, newKeyframes)
          send({
            type: "UPDATE_CLIP",
            clipId,
            updates: {
              playbackRate: newKeyframes.length > 0 ? newKeyframes[0].value : 1.0,
              duration: newDuration,
              speedRamping: newConfig,
            },
          })
        }

        return newConfigs
      })
    },
    [project, send],
  )

  // Перемещение keyframe
  const moveKeyframe = useCallback(
    (clipId: string, keyframeId: string, newTime: number) => {
      const clip = findClip(project, clipId)
      if (!clip) return

      // Ограничиваем время в пределах клипа
      const clampedTime = Math.max(0, Math.min(clip.duration, newTime))

      updateKeyframe(clipId, keyframeId, { time: clampedTime })
    },
    [project, updateKeyframe],
  )

  // Применение пресета
  const applyPreset = useCallback(
    (clipId: string, presetId: string) => {
      const preset = SPEED_RAMPING_PRESETS.find((p) => p.id === presetId)
      if (!preset) return

      const clip = findClip(project, clipId)
      if (!clip) return

      const config = getConfig(clipId) || {
        enabled: true,
        keyframes: [],
        maintainPitch: true,
        minSpeed: 0.1,
        maxSpeed: 10.0,
        showGraph: true,
        graphHeight: 60,
        graphOpacity: 0.8,
      }

      // Адаптируем keyframes пресета к длительности клипа
      const keyframes = preset.keyframes.map((kf) =>
        createSpeedKeyframe(
          kf.time * clip.duration, // Масштабируем время
          kf.value,
          kf.interpolation,
        ),
      )

      setConfig(clipId, {
        ...config,
        keyframes,
      })
    },
    [project, getConfig, setConfig],
  )

  // Получение списка пресетов
  const getPresets = useCallback(() => SPEED_RAMPING_PRESETS, [])

  // Создание пресета из клипа
  const createPresetFromClip = useCallback(
    (clipId: string, name: string): SpeedRampingPreset | null => {
      const config = getConfig(clipId)
      const clip = findClip(project, clipId)

      if (!config || !clip || config.keyframes.length === 0) return null

      // Нормализуем keyframes к диапазону 0-1
      const normalizedKeyframes = config.keyframes.map((kf) => ({
        id: kf.id,
        time: kf.time / clip.duration,
        value: kf.value,
        interpolation: kf.interpolation,
        bezierHandles: kf.bezierHandles,
        isLocked: kf.isLocked,
        label: kf.label,
      }))

      return {
        id: `custom-${Date.now()}`,
        name,
        category: "custom",
        keyframes: normalizedKeyframes,
      }
    },
    [project, getConfig],
  )

  // Включение speed ramping
  const enableSpeedRamping = useCallback(
    (clipId: string) => {
      setConfigs((prevConfigs) => {
        const config = prevConfigs.get(clipId) || {
          enabled: true,
          keyframes: [],
          maintainPitch: true,
          minSpeed: 0.1,
          maxSpeed: 10.0,
          showGraph: true,
          graphHeight: 60,
          graphOpacity: 0.8,
        }

        const newConfig = {
          ...config,
          enabled: true,
        }

        const newConfigs = new Map(prevConfigs)
        newConfigs.set(clipId, newConfig)

        // Обновляем клип с новой конфигурацией
        const clip = findClip(project, clipId)
        if (clip) {
          send({
            type: "UPDATE_CLIP",
            clipId,
            updates: {
              speedRamping: newConfig,
            },
          })
        }

        return newConfigs
      })
    },
    [project, send],
  )

  // Выключение speed ramping
  const disableSpeedRamping = useCallback(
    (clipId: string) => {
      setConfigs((prevConfigs) => {
        const config = prevConfigs.get(clipId)
        if (!config) return prevConfigs

        const newConfig = {
          ...config,
          enabled: false,
        }

        const newConfigs = new Map(prevConfigs)
        newConfigs.set(clipId, newConfig)

        // Сбрасываем скорость клипа
        const clip = findClip(project, clipId)
        if (clip) {
          send({
            type: "UPDATE_CLIP",
            clipId,
            updates: {
              playbackRate: 1.0,
              duration: clip.duration,
              speedRamping: newConfig, // Сохраняем с enabled: false
            },
          })
        }

        return newConfigs
      })
    },
    [project, send],
  )

  // Переключение speed ramping
  const toggleSpeedRamping = useCallback(
    (clipId: string) => {
      const config = getConfig(clipId)
      if (!config || !config.enabled) {
        enableSpeedRamping(clipId)
      } else {
        disableSpeedRamping(clipId)
      }
    },
    [getConfig, enableSpeedRamping, disableSpeedRamping],
  )

  // Получение скорости в определенный момент
  const getSpeedAtTimeForClip = useCallback(
    (clipId: string, time: number): number => {
      const config = getConfig(clipId)
      const clip = findClip(project, clipId)

      if (!config || !clip || !config.enabled || config.keyframes.length === 0) {
        return clip?.playbackRate || 1.0
      }

      return getSpeedAtTime(config.keyframes, time, clip.duration)
    },
    [project, getConfig],
  )

  // Получение новой длительности
  const getNewDuration = useCallback(
    (clipId: string): number => {
      const config = getConfig(clipId)
      const clip = findClip(project, clipId)

      if (!config || !clip || !config.enabled || config.keyframes.length === 0) {
        return clip?.duration || 0
      }

      return calculateNewDuration(clip.duration, config.keyframes)
    },
    [project, getConfig],
  )

  // Сброс к постоянной скорости
  const resetToConstantSpeed = useCallback(
    (clipId: string, speed: number) => {
      setConfigs((prevConfigs) => {
        const config = prevConfigs.get(clipId) || {
          enabled: true,
          keyframes: [],
          maintainPitch: true,
          minSpeed: 0.1,
          maxSpeed: 10.0,
          showGraph: true,
          graphHeight: 60,
          graphOpacity: 0.8,
        }

        const newConfig = {
          ...config,
          keyframes: [createSpeedKeyframe(0, speed, "linear")],
        }

        const newConfigs = new Map(prevConfigs)
        newConfigs.set(clipId, newConfig)

        // Обновляем клип
        const clip = findClip(project, clipId)
        if (clip) {
          send({
            type: "UPDATE_CLIP",
            clipId,
            updates: {
              playbackRate: speed,
              duration: clip.duration / speed,
              speedRamping: newConfig,
            },
          })
        }

        return newConfigs
      })
    },
    [project, send],
  )

  // Получение данных для визуализации кривой скорости
  const getSpeedCurveData = useCallback(
    (clipId: string, resolution = 100): Array<{ time: number; speed: number }> => {
      const config = getConfig(clipId)
      const clip = findClip(project, clipId)

      if (!config || !clip || !config.enabled || config.keyframes.length === 0) {
        return []
      }

      const data: Array<{ time: number; speed: number }> = []
      const step = clip.duration / resolution

      for (let i = 0; i <= resolution; i++) {
        const time = i * step
        const speed = getSpeedAtTime(config.keyframes, time, clip.duration)
        data.push({ time, speed })
      }

      return data
    },
    [project, getConfig],
  )

  return {
    getConfig,
    setConfig,
    addKeyframe,
    updateKeyframe,
    removeKeyframe,
    moveKeyframe,
    applyPreset,
    getPresets,
    createPresetFromClip,
    enableSpeedRamping,
    disableSpeedRamping,
    toggleSpeedRamping,
    getSpeedAtTime: getSpeedAtTimeForClip,
    getNewDuration,
    resetToConstantSpeed,
    getSpeedCurveData,
  }
}

// Локальная утилита для поиска клипа в Timeline (domain типы)
function findClip(timeline: Timeline | null, clipId: string): DomainTimelineClip | null {
  if (!timeline) return null

  // Ищем в глобальных треках
  for (const track of timeline.globalTracks || []) {
    const clip = track.clips.find((c) => c.id === clipId)
    if (clip) return clip
  }

  // Ищем в секциях
  for (const section of timeline.sections || []) {
    for (const track of section.tracks || []) {
      const clip = track.clips.find((c) => c.id === clipId)
      if (clip) return clip
    }
  }

  return null
}

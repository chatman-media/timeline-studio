/**
 * Хук для управления мультикамерным монтажом
 * Обертка над useLinkedClips с дополнительной логикой для работы с несколькими камерами
 */

import { useCallback, useEffect, useMemo, useState } from "react"

import { useLinkedClips } from "@/features/timeline/hooks/use-linked-clips"
import { useTimeline } from "@/features/timeline/hooks/use-timeline"
import { usePlayer } from "@/features/video-player/services/player-provider"
import { createLogger } from "@/lib/tauri-logger"
import { multicamManager } from "../services/multicam-manager"
import type { MulticamAngle } from "../types/multicam"
import { useCameraSync } from "./use-camera-sync"
import { useMulticamShortcuts } from "./use-multicam-shortcuts"

const logger = createLogger({ module: "UseMulticam" })

// Ре-экспорт для обратной совместимости
export type { MulticamAngle }

export interface MulticamState {
  angles: MulticamAngle[]
  activeAngleIndex: number
  activeAngle: MulticamAngle | null
  isSync: boolean
  syncOffsets: number[]
}

export interface UseMulticamReturn extends MulticamState {
  // Переключение камер
  switchToAngle: (angleIndex: number) => void
  switchToNextAngle: () => void
  switchToPreviousAngle: () => void
  switchToAngleByClipId: (clipId: string) => void

  // Синхронизация
  syncAngles: () => void
  setSyncOffset: (angleIndex: number, offset: number) => void
  autoSyncByAudio: () => Promise<void>
  autoSyncByTimecode: () => Promise<void>

  // Управление группой
  addAngle: (clipId: string) => void
  removeAngle: (angleIndex: number) => void
  reorderAngles: (fromIndex: number, toIndex: number) => void

  // Информация
  getAngleByClipId: (clipId: string) => MulticamAngle | null
  isMulticamClip: (clipId: string) => boolean
  hasMulticamSupport: boolean

  // Состояние синхронизации (делегировано из useCameraSync)
  syncStatus: import("../types/multicam").SyncStatus
  syncProgress: number
  syncError: string | null
}

export function useMulticam(baseClipId?: string): UseMulticamReturn {
  const { getMulticamPairs, getMulticamGroup, syncLinkedClips, linkClips, unlinkClips } = useLinkedClips()

  const { currentTime, project } = useTimeline()
  const { playerSelectClip } = usePlayer()

  // Используем хук синхронизации камер
  const cameraSync = useCameraSync({ baseClipId: baseClipId || "" })

  // Регистрируем горячие клавиши
  useMulticamShortcuts()

  // Состояние активного угла
  const [activeAngleIndex, setActiveAngleIndex] = useState(0)

  // Получаем все клипы мультикамерной группы
  const multicamClips = useMemo(() => {
    if (!baseClipId) return []
    return getMulticamGroup(baseClipId)
  }, [baseClipId, getMulticamGroup])

  // Преобразуем клипы в углы камер
  const angles = useMemo((): MulticamAngle[] => {
    return multicamClips.map((clip, index) => {
      // Находим медиафайл для клипа
      const mediaFile = project?.resources.media.find((m) => m.id === clip.mediaId)

      return {
        id: `angle-${clip.id}`,
        name: clip.name || `Camera ${index + 1}`,
        clipId: clip.id,
        clip,
        mediaPath: mediaFile?.path,
        syncOffset: cameraSync.getSyncOffset(clip.id),
        isActive: index === activeAngleIndex,
      }
    })
  }, [multicamClips, activeAngleIndex, project, cameraSync])

  // Синхронизируем состояние с менеджером
  useEffect(() => {
    if (baseClipId) {
      multicamManager.setBaseClip(baseClipId)
    }

    // Слушаем события переключения камер
    const handleCameraSwitch = (angleIndex: number) => {
      // Проверяем, что индекс в пределах доступных углов
      if (angleIndex >= 0 && angleIndex < angles.length) {
        setActiveAngleIndex(angleIndex)

        // Автоматически переключаем плеер на выбранный клип
        const angle = angles[angleIndex]
        if (angle) {
          playerSelectClip(angle.clipId).catch((error: unknown) => {
            logger.error("[useMulticam] Failed to switch player clip:", { error })
          })
        }
      } else {
        logger.warn(`[useMulticam] Camera ${angleIndex + 1} not available (only ${angles.length} cameras in group)`)
      }
    }

    multicamManager.on("camera-switched", handleCameraSwitch)

    return () => {
      multicamManager.removeListener("camera-switched", handleCameraSwitch)
    }
  }, [baseClipId, angles, playerSelectClip])

  const activeAngle = angles[activeAngleIndex] || null
  const hasMulticamSupport = angles.length > 1

  // Переключение на конкретный угол
  const switchToAngle = useCallback(
    (angleIndex: number) => {
      if (angleIndex >= 0 && angleIndex < angles.length) {
        // Используем менеджер для переключения (он вызовет событие и обновит состояние)
        multicamManager.switchToCamera(angleIndex)

        // Переключаем плеер на выбранный клип
        const angle = angles[angleIndex]
        if (angle) {
          logger.info(`[useMulticam] Switching to angle ${angleIndex + 1}:`, { angleName: angle.name })
          // Вызываем API плеера для переключения на другой клип
          playerSelectClip(angle.clipId).catch((error: unknown) => {
            logger.error("[useMulticam] Failed to switch player clip:", { error })
          })
        }
      }
    },
    [angles, playerSelectClip],
  )

  // Переключение на следующий угол
  const switchToNextAngle = useCallback(() => {
    const nextIndex = (activeAngleIndex + 1) % angles.length
    switchToAngle(nextIndex)
  }, [activeAngleIndex, angles.length, switchToAngle])

  // Переключение на предыдущий угол
  const switchToPreviousAngle = useCallback(() => {
    const prevIndex = activeAngleIndex === 0 ? angles.length - 1 : activeAngleIndex - 1
    switchToAngle(prevIndex)
  }, [activeAngleIndex, angles.length, switchToAngle])

  // Переключение по ID клипа
  const switchToAngleByClipId = useCallback(
    (clipId: string) => {
      const angleIndex = angles.findIndex((angle) => angle.clipId === clipId)
      if (angleIndex !== -1) {
        switchToAngle(angleIndex)
      }
    },
    [angles, switchToAngle],
  )

  // Синхронизация всех углов
  const syncAngles = useCallback(() => {
    if (baseClipId) {
      cameraSync.applySyncResults()
    }
  }, [baseClipId, cameraSync])

  // Установка смещения синхронизации для угла
  const setSyncOffset = useCallback(
    (angleIndex: number, offset: number) => {
      const angle = angles[angleIndex]
      if (angle) {
        cameraSync.syncManual(angle.clipId, offset)
      }
    },
    [angles, cameraSync],
  )

  // Автоматическая синхронизация по аудио
  const autoSyncByAudio = useCallback(async () => {
    if (!baseClipId || angles.length < 2) {
      logger.warn("[useMulticam] Need base clip and at least 2 angles for sync")
      return
    }

    await cameraSync.syncByAudio()
  }, [baseClipId, angles.length, cameraSync])

  // Автоматическая синхронизация по таймкоду
  const autoSyncByTimecode = useCallback(async () => {
    if (!baseClipId || angles.length < 2) {
      logger.warn("[useMulticam] Need base clip and at least 2 angles for sync")
      return
    }

    await cameraSync.syncByTimecode()
  }, [baseClipId, angles.length, cameraSync])

  // Добавление нового угла
  const addAngle = useCallback(
    (clipId: string) => {
      if (!baseClipId || !hasMulticamSupport) return

      // Связываем новый клип с существующими
      linkClips(baseClipId, clipId)
    },
    [baseClipId, hasMulticamSupport, linkClips],
  )

  // Удаление угла
  const removeAngle = useCallback(
    (angleIndex: number) => {
      const angle = angles[angleIndex]
      if (!angle) return

      // Разрываем связи для этого клипа
      angles.forEach((otherAngle, index) => {
        if (index !== angleIndex) {
          unlinkClips(angle.clipId, otherAngle.clipId)
        }
      })
    },
    [angles, unlinkClips],
  )

  // Изменение порядка углов
  const reorderAngles = useCallback((fromIndex: number, toIndex: number) => {
    // TODO: Требует расширения архитектуры
    // Текущая реализация хранит мультикамерные связи как граф (каждый клип связан с каждым)
    // Порядок определяется порядком обхода графа в getMulticamGroup
    //
    // Для реализации reorder нужно:
    // 1. Добавить поле multicamOrder?: number в TimelineClip
    // 2. Обновить getMulticamGroup для сортировки по multicamOrder
    // 3. Реализовать логику перестановки здесь
    //
    // Альтернатива: использовать trackId для визуального порядка
    // (клипы на разных треках сортируются по trackId)

    logger.info("[useMulticam] Reorder angles:", { fromIndex, toIndex })
    logger.warn("[useMulticam] reorderAngles requires architecture extension (multicamOrder field)")
  }, [])

  // Получение угла по ID клипа
  const getAngleByClipId = useCallback(
    (clipId: string): MulticamAngle | null => {
      return angles.find((angle) => angle.clipId === clipId) || null
    },
    [angles],
  )

  // Проверка, является ли клип частью мультикамерной группы
  const isMulticamClip = useCallback(
    (clipId: string): boolean => {
      return angles.some((angle) => angle.clipId === clipId)
    },
    [angles],
  )

  // Мемоизированные смещения синхронизации
  const syncOffsets = useMemo(() => angles.map((angle) => cameraSync.getSyncOffset(angle.clipId)), [angles, cameraSync])

  return {
    // Состояние
    angles,
    activeAngleIndex,
    activeAngle,
    isSync: cameraSync.syncStatus === "success",
    syncOffsets,

    // Методы переключения
    switchToAngle,
    switchToNextAngle,
    switchToPreviousAngle,
    switchToAngleByClipId,

    // Методы синхронизации
    syncAngles,
    setSyncOffset,
    autoSyncByAudio,
    autoSyncByTimecode,

    // Управление группой
    addAngle,
    removeAngle,
    reorderAngles,

    // Информация
    getAngleByClipId,
    isMulticamClip,
    hasMulticamSupport,

    // Состояние синхронизации (делегировано из useCameraSync)
    syncStatus: cameraSync.syncStatus,
    syncProgress: cameraSync.syncProgress,
    syncError: cameraSync.syncError,
  }
}

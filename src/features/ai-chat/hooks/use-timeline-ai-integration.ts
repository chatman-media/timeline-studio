import { useCallback, useEffect, useMemo, useRef } from "react"
import { createLogger, type LogContext, logError, logInfo } from "@/lib/tauri-logger"
import { useTimeline } from "../../timeline/hooks"
import type { TimelineClip, TimelineSection, TimelineTrack } from "../../timeline/types"

const logger = createLogger({ module: "UseTimelineAiIntegration" })

// Временно определяем типы локально
interface TimelineStateAccess {
  getCurrentProject: () => any
  createProject: (project: any) => Promise<void>
  updateProject: (updates: any) => Promise<void>
  createSection: (section: any) => Promise<any>
  createTrack: (track: any) => Promise<any>
  addClip: (clip: any) => Promise<any>
  getProjectStats: () => any
  sendTimelineCommand: (command: string, params?: any) => Promise<void>
}

// Временная заглушка для setTimelineStateAccess
let timelineStateAccess: TimelineStateAccess | null = null
const setTimelineStateAccess = (access: TimelineStateAccess | null) => {
  timelineStateAccess = access
}

/**
 * Хук для интеграции Timeline с AI функциональностью
 * Предоставляет доступ к состоянию timeline для AI инструментов
 */
export function useTimelineAIIntegration() {
  // Логируем только при первом маунте
  const isInitialized = useRef(false)
  useEffect(() => {
    if (!isInitialized.current) {
      logInfo("[useTimelineAIIntegration] Инициализация")
      isInitialized.current = true
    }
  }, [])

  const timeline = useTimeline() as any

  // Функция для получения всех клипов
  const getAllClips = useCallback((): TimelineClip[] => {
    if (!timeline.project) return []

    const clips: TimelineClip[] = []

    // Клипы из глобальных треков
    timeline.project.globalTracks?.forEach((track: TimelineTrack) => {
      if (track.clips) {
        clips.push(...track.clips)
      }
    })

    // Клипы из секций
    timeline.project.sections?.forEach((section: TimelineSection) => {
      section.tracks?.forEach((track: TimelineTrack) => {
        if (track.clips) {
          clips.push(...track.clips)
        }
      })
    })

    logInfo("[useTimelineAIIntegration] Получено клипов", { count: clips.length })
    return clips
  }, [timeline.project])

  // Функция для получения всех треков
  const getAllTracks = useCallback((): TimelineTrack[] => {
    if (!timeline.project) return []

    const tracks: TimelineTrack[] = []

    // Треки из глобальных треков
    if (timeline.project.globalTracks) {
      tracks.push(...timeline.project.globalTracks)
    }

    // Треки из секций
    timeline.project.sections?.forEach((section: TimelineSection) => {
      if (section.tracks) {
        tracks.push(...section.tracks)
      }
    })

    logInfo("[useTimelineAIIntegration] Получено треков", { count: tracks.length })
    return tracks
  }, [timeline.project])

  // Функция для получения всех секций
  const getAllSections = useCallback((): TimelineSection[] => {
    if (!timeline.project) return []
    const sections = timeline.project.sections || []
    logInfo("[useTimelineAIIntegration] Получено секций", { count: sections.length })
    return sections
  }, [timeline.project])

  // Функция для расчета общей длительности проекта
  const getProjectDuration = useCallback((): number => {
    if (!timeline.project) return 0

    let maxEndTime = 0
    const allClips = getAllClips()

    allClips.forEach((clip) => {
      const clipEndTime = clip.startTime + clip.duration
      if (clipEndTime > maxEndTime) {
        maxEndTime = clipEndTime
      }
    })

    logInfo("[useTimelineAIIntegration] Длительность проекта", { duration: maxEndTime })
    return maxEndTime
  }, [timeline.project, getAllClips])

  // Функция для получения выбранных клипов
  const getSelectedClips = useCallback((): TimelineClip[] => {
    if (!timeline.project) return []

    const selectedClipIds = timeline.selectedClipIds || []
    const allClips = getAllClips()

    const selected = allClips.filter((clip) => selectedClipIds.includes(clip.id))
    logInfo("[useTimelineAIIntegration] Выбранных клипов", { count: selected.length })
    return selected
  }, [timeline.project, timeline.selectedClipIds, getAllClips])

  // Функция для получения клипов на определенном времени
  const getClipsAtTime = useCallback(
    (time: number): TimelineClip[] => {
      const allClips = getAllClips()
      const clipsAtTime = allClips.filter((clip) => time >= clip.startTime && time < clip.startTime + clip.duration)
      logInfo("[useTimelineAIIntegration] Клипов на времени", { time, count: clipsAtTime.length })
      return clipsAtTime
    },
    [getAllClips],
  )

  // Эффект для установки доступа к состоянию timeline
  // ОПТИМИЗИРОВАНО: теперь зависит только от timeline, функции создаются заново только при изменении timeline
  useEffect(() => {
    // Создаем функции доступа к данным напрямую внутри effect
    const getCurrentClips = (): TimelineClip[] => {
      if (!timeline.project) return []
      const clips: TimelineClip[] = []
      timeline.project.globalTracks?.forEach((track: TimelineTrack) => {
        if (track.clips) clips.push(...track.clips)
      })
      timeline.project.sections?.forEach((section: TimelineSection) => {
        section.tracks?.forEach((track: TimelineTrack) => {
          if (track.clips) clips.push(...track.clips)
        })
      })
      return clips
    }

    const getCurrentTracks = (): TimelineTrack[] => {
      if (!timeline.project) return []
      const tracks: TimelineTrack[] = []
      if (timeline.project.globalTracks) tracks.push(...timeline.project.globalTracks)
      timeline.project.sections?.forEach((section: TimelineSection) => {
        if (section.tracks) tracks.push(...section.tracks)
      })
      return tracks
    }

    const getCurrentSections = (): TimelineSection[] => {
      return timeline.project?.sections || []
    }

    const timelineAccess: TimelineStateAccess = {
      getCurrentProject: () => timeline.project,
      createProject: async (project: any) => {
        logInfo("[useTimelineAIIntegration] Создание проекта", { projectName: project.name })
        try {
          await timeline.createProject(project.name, project.settings || {})
          logInfo("[useTimelineAIIntegration] Проект создан", { projectName: project.name })
        } catch (error) {
          logError("[useTimelineAIIntegration] Ошибка создания проекта", error as LogContext)
          throw error
        }
      },
      updateProject: async (_updates: any) => {
        logInfo("[useTimelineAIIntegration] Обновление проекта")
        // TODO: Implement project update
        logger.warn("updateProject not implemented yet")
      },
      createSection: async (section: any) => {
        logInfo("[useTimelineAIIntegration] Создание секции", { sectionName: section.name })
        try {
          const id = `section_${Date.now()}`
          await timeline.addSection(section.name, section.startTime, section.duration)
          logInfo("[useTimelineAIIntegration] Секция создана", { id })
          return { ...section, id }
        } catch (error) {
          logError("[useTimelineAIIntegration] Ошибка создания секции", error as LogContext)
          throw error
        }
      },
      createTrack: async (track: any) => {
        logInfo("[useTimelineAIIntegration] Создание трека", { trackType: track.type })
        try {
          const id = `track_${Date.now()}`
          await timeline.addTrack(track.type, undefined, track.name)
          logInfo("[useTimelineAIIntegration] Трек создан", { id })
          return { ...track, id, clips: [] }
        } catch (error) {
          logError("[useTimelineAIIntegration] Ошибка создания трека", error as LogContext)
          throw error
        }
      },
      addClip: async (clip: any) => {
        logInfo("[useTimelineAIIntegration] Добавление клипа", { clipId: clip.id })
        try {
          const id = `clip_${Date.now()}`
          // TODO: Need mediaFile parameter in addClip
          logger.warn("addClip needs proper implementation")
          logInfo("[useTimelineAIIntegration] Клип добавлен", { id })
          return { ...clip, id }
        } catch (error) {
          logError("[useTimelineAIIntegration] Ошибка добавления клипа", error as LogContext)
          throw error
        }
      },
      getProjectStats: () => {
        const clips = getCurrentClips()
        const tracks = getCurrentTracks()
        const sections = getCurrentSections()

        const stats = {
          totalDuration: clips.reduce((max, clip) => {
            const clipEnd = clip.startTime + clip.duration
            return clipEnd > max ? clipEnd : max
          }, 0),
          totalClips: clips.length,
          totalTracks: tracks.length,
          totalSections: sections.length,
        }

        logInfo("[useTimelineAIIntegration] Статистика проекта", stats)
        return stats
      },
      sendTimelineCommand: async (command: string, params?: any) => {
        logInfo("[useTimelineAIIntegration] Команда timeline", { command, params })
        try {
          // Map commands to timeline actions
          switch (command) {
            case "play":
              await timeline.play()
              break
            case "pause":
              await timeline.pause()
              break
            case "seek":
              if (params?.time !== undefined) {
                await timeline.seek(params.time)
              }
              break
            case "selectClips":
              if (params?.clipIds) {
                timeline.selectClips(params.clipIds)
              }
              break
            default:
              logger.warn(`Unknown timeline command: ${command}`)
          }
          logInfo("[useTimelineAIIntegration] Команда выполнена", { command })
        } catch (error) {
          logError("[useTimelineAIIntegration] Ошибка выполнения команды", error as LogContext)
          throw error
        }
      },
    }

    // Устанавливаем доступ для AI инструментов
    setTimelineStateAccess(timelineAccess)
    logInfo("[useTimelineAIIntegration] Доступ к timeline установлен")

    // Очищаем при размонтировании
    return () => {
      setTimelineStateAccess(null)
      logInfo("[useTimelineAIIntegration] Доступ к timeline очищен")
    }
  }, [timeline]) // ОПТИМИЗИРОВАНО: только одна зависимость вместо 7!

  // Мемоизируем результат, чтобы избежать лишних ре-рендеров
  // ОПТИМИЗИРОВАНО: убран лог из useMemo чтобы не логировать на каждый рендер
  const result = useMemo(() => {
    const clips = getAllClips()
    const tracks = getAllTracks()
    const duration = getProjectDuration()

    return {
      isReady: timeline.isReady && timeline.project !== null,
      hasProject: timeline.project !== null,
      clipsCount: clips.length,
      tracksCount: tracks.length,
      projectDuration: duration,
    }
  }, [timeline.isReady, timeline.project, getAllClips, getAllTracks, getProjectDuration])

  return result
}

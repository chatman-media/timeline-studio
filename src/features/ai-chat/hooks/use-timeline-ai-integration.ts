import { setTimelineStateAccess, type TimelineStateAccess } from "@timeline-studio/core/services/timeline-state-access"
import { useCallback, useEffect, useMemo, useRef } from "react"
import { createLogger, type LogContext, logError, logInfo } from "@/lib/tauri-logger"
import { useTimeline } from "../../timeline/hooks"
import type { TimelineClip, TimelineSection, TimelineTrack } from "../../timeline/types"

const logger = createLogger({ module: "UseTimelineAiIntegration" })

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

  // Стабильная ссылка на timeline для использования в useEffect
  const timelineRef = useRef(timeline)
  timelineRef.current = timeline

  // Функция для получения всех клипов (без логирования - вызывается часто)
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

    return clips
  }, [timeline.project])

  // Функция для получения всех треков (без логирования - вызывается часто)
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

    return tracks
  }, [timeline.project])

  // Функция для получения всех секций (без логирования - вызывается часто)
  const getAllSections = useCallback((): TimelineSection[] => {
    if (!timeline.project) return []
    return timeline.project.sections || []
  }, [timeline.project])

  // Функция для расчета общей длительности проекта (без логирования - вызывается часто)
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

    return maxEndTime
  }, [timeline.project, getAllClips])

  // Функция для получения выбранных клипов (без логирования - вызывается часто)
  const getSelectedClips = useCallback((): TimelineClip[] => {
    if (!timeline.project) return []

    const selectedClipIds = timeline.selectedClipIds || []
    const allClips = getAllClips()

    return allClips.filter((clip) => selectedClipIds.includes(clip.id))
  }, [timeline.project, timeline.selectedClipIds, getAllClips])

  // Функция для получения клипов на определенном времени (без логирования - вызывается часто)
  const getClipsAtTime = useCallback(
    (time: number): TimelineClip[] => {
      const allClips = getAllClips()
      return allClips.filter((clip) => time >= clip.startTime && time < clip.startTime + clip.duration)
    },
    [getAllClips],
  )

  // Эффект для установки доступа к состоянию timeline
  // ОПТИМИЗИРОВАНО: используем ref и пустой массив зависимостей для предотвращения повторных setup/cleanup
  useEffect(() => {
    // Создаем функции доступа к данным, используя timelineRef для актуальных данных
    const getCurrentClips = (): TimelineClip[] => {
      const tl = timelineRef.current
      if (!tl.project) return []
      const clips: TimelineClip[] = []
      tl.project.globalTracks?.forEach((track: TimelineTrack) => {
        if (track.clips) clips.push(...track.clips)
      })
      tl.project.sections?.forEach((section: TimelineSection) => {
        section.tracks?.forEach((track: TimelineTrack) => {
          if (track.clips) clips.push(...track.clips)
        })
      })
      return clips
    }

    const getCurrentTracks = (): TimelineTrack[] => {
      const tl = timelineRef.current
      if (!tl.project) return []
      const tracks: TimelineTrack[] = []
      if (tl.project.globalTracks) tracks.push(...tl.project.globalTracks)
      tl.project.sections?.forEach((section: TimelineSection) => {
        if (section.tracks) tracks.push(...section.tracks)
      })
      return tracks
    }

    const getCurrentSections = (): TimelineSection[] => {
      return timelineRef.current.project?.sections || []
    }

    const timelineAccess: TimelineStateAccess = {
      getCurrentProject: () => timelineRef.current.project,
      createProject: async (project: any) => {
        logInfo("[useTimelineAIIntegration] Создание проекта", { projectName: project.name })
        try {
          await timelineRef.current.createProject(project.name, project.settings || {})
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
          await timelineRef.current.addSection(section.name, section.startTime, section.duration)
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
          const id = await timelineRef.current.addTrack(track.type, track.name, track.sectionId)
          if (!id) {
            throw new Error("Timeline addTrack did not return track id")
          }
          logInfo("[useTimelineAIIntegration] Трек создан", { id })
          return { ...track, id, clips: [] }
        } catch (error) {
          logError("[useTimelineAIIntegration] Ошибка создания трека", error as LogContext)
          throw error
        }
      },
      addClip: async (clip: any) => {
        const trackId = clip.trackId || clip.targetTrackId
        const mediaId = clip.mediaId || clip.resourceId
        const startTime = clip.startTime ?? clip.time ?? 0
        logInfo("[useTimelineAIIntegration] Добавление клипа", { clipId: clip.id, trackId, mediaId })
        try {
          if (!trackId) {
            throw new Error("trackId is required for AI timeline addClip")
          }
          if (!mediaId && !clip.mediaFile) {
            throw new Error("mediaId or mediaFile is required for AI timeline addClip")
          }

          const mediaFile = clip.mediaFile ?? findMediaFileForClip(timelineRef.current.project, mediaId)
          const id = await timelineRef.current.addClip(trackId, mediaFile ?? mediaId, startTime)
          if (!id) {
            throw new Error("Timeline addClip did not return clip id")
          }
          logInfo("[useTimelineAIIntegration] Клип добавлен", { id })
          return { ...clip, id, trackId, mediaId }
        } catch (error) {
          logError("[useTimelineAIIntegration] Ошибка добавления клипа", error as LogContext)
          throw error
        }
      },
      getProjectStats: () => {
        const clips = getCurrentClips()
        const tracks = getCurrentTracks()
        const sections = getCurrentSections()

        return {
          totalDuration: clips.reduce((max, clip) => {
            const clipEnd = clip.startTime + clip.duration
            return clipEnd > max ? clipEnd : max
          }, 0),
          totalClips: clips.length,
          totalTracks: tracks.length,
          totalSections: sections.length,
        }
      },
      sendTimelineCommand: async (command: string, params?: any) => {
        logInfo("[useTimelineAIIntegration] Команда timeline", { command, params })
        try {
          const tl = timelineRef.current
          // Map commands to timeline actions
          switch (command) {
            case "play":
              await tl.play()
              break
            case "pause":
              await tl.pause()
              break
            case "seek":
              if (params?.time !== undefined) {
                await tl.seek(params.time)
              }
              break
            case "selectClips":
              if (params?.clipIds) {
                tl.selectClips(params.clipIds)
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // ОПТИМИЗИРОВАНО: пустой массив - setup/cleanup только при mount/unmount

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

function findMediaFileForClip(project: any, mediaId: string | undefined): any | undefined {
  if (!project || !mediaId) return undefined

  const resourceGroups = [project.resources?.music, project.resources?.media]
  for (const resources of resourceGroups) {
    if (!Array.isArray(resources)) continue

    const resource = resources.find((item: any) => {
      const file = item?.file && typeof item.file === "object" ? item.file : item
      return item?.resourceId === mediaId || item?.id === mediaId || file?.id === mediaId
    })
    if (resource) {
      return resource.file && typeof resource.file === "object" ? resource.file : resource
    }
  }

  const mediaPoolItems = project.media_pool?.items ?? project.mediaPool?.items
  const mediaPoolItem = mediaPoolItems?.[mediaId]
  if (mediaPoolItem) {
    return {
      id: mediaPoolItem.id ?? mediaId,
      name: mediaPoolItem.name ?? mediaId,
      path: mediaPoolItem.path,
      type: String(mediaPoolItem.media_type ?? mediaPoolItem.mediaType ?? "audio").toLowerCase(),
      isAudio: String(mediaPoolItem.media_type ?? mediaPoolItem.mediaType ?? "").toLowerCase().includes("audio"),
      duration: mediaPoolItem.duration ?? 0,
    }
  }

  return undefined
}

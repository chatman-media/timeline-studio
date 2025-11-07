/**
 * Hook для интеграции Person Identification с Timeline
 * Управляет отображением персон на клипах и их данными
 */

import { useCallback, useEffect, useState } from "react"

import { usePersonIdentification } from "@/features/person-identification/hooks/use-person-identification"
import type { BoundingBox, PersonProfile } from "@/features/person-identification/types/person"
import { createLogger } from "@/lib/tauri-logger"
import type { TimelineClip } from "../types/timeline"
import { useTimeline } from "./use-timeline"

const logger = createLogger("UseTimelinePersons")

// Упрощенная версия PersonAppearance для Timeline (использует numbers вместо Timecode)
export interface TimelinePersonAppearance {
  id: string
  personId: string
  clipId: string
  startTime: number
  endTime: number
  confidence: number
  boundingBox?: BoundingBox
  thumbnailPath?: string
  detectedAt: Date
}

interface TimelinePersonsState {
  isAnalyzing: boolean
  analysisProgress: number
  appearances: TimelinePersonAppearance[]
  error: string | null
}

export interface TimelinePersonsHook {
  // Состояние
  state: TimelinePersonsState
  persons: PersonProfile[]

  // Получение данных для клипа
  getPersonsForClip: (clipId: string) => PersonProfile[]
  getAppearancesForClip: (clipId: string) => TimelinePersonAppearance[]

  // Анализ персон
  analyzeClipForPersons: (clip: TimelineClip) => Promise<void>
  analyzeTimelineForPersons: () => Promise<void>

  // Управление
  showPersonDetail: (personId: string) => void
  clearPersonsAnalysis: () => void

  // Настройки
  enablePersonDetection: boolean
  setEnablePersonDetection: (enabled: boolean) => void
  confidenceThreshold: number
  setConfidenceThreshold: (threshold: number) => void
}

export function useTimelinePersons(): TimelinePersonsHook {
  const { project } = useTimeline()
  const {
    persons,
    detectFaces,
    identifyPerson,
    createPersonFromFace,
    analyzeVideoForPersons,
    error: personError,
  } = usePersonIdentification()

  // Состояние анализа персон
  const [state, setState] = useState<TimelinePersonsState>({
    isAnalyzing: false,
    analysisProgress: 0,
    appearances: [],
    error: null,
  })

  // Настройки
  const [enablePersonDetection, setEnablePersonDetection] = useState(true)
  const [confidenceThreshold, setConfidenceThreshold] = useState(0.7)

  // Синхронизация ошибок
  useEffect(() => {
    if (personError) {
      setState((prev) => ({ ...prev, error: personError }))
    }
  }, [personError])

  // Получение персон для конкретного клипа
  const getPersonsForClip = useCallback(
    (clipId: string): PersonProfile[] => {
      const clipAppearances = state.appearances.filter((app) => app.clipId === clipId)
      return persons.filter((person) => clipAppearances.some((app) => app.personId === person.id))
    },
    [persons, state.appearances],
  )

  // Получение появлений для конкретного клипа
  const getAppearancesForClip = useCallback(
    (clipId: string): TimelinePersonAppearance[] => {
      return state.appearances.filter((app) => app.clipId === clipId)
    },
    [state.appearances],
  )

  // Анализ клипа на наличие персон
  const analyzeClipForPersons = useCallback(
    async (clip: TimelineClip) => {
      if (!clip.mediaId || !enablePersonDetection || state.isAnalyzing) return

      setState((prev) => ({
        ...prev,
        isAnalyzing: true,
        analysisProgress: 0,
        error: null,
      }))

      try {
        // Этап 1: Обнаружение лиц
        setState((prev) => ({ ...prev, analysisProgress: 20 }))

        // TODO: Получить путь к файлу из mediaId
        const mediaPath = "" // Нужно получить через MediaFile
        const detectedFaces = await detectFaces(mediaPath, {
          start: clip.startTime,
          end: clip.startTime + clip.duration,
        })

        setState((prev) => ({ ...prev, analysisProgress: 50 }))

        // Этап 2: Идентификация персон
        const newAppearances: TimelinePersonAppearance[] = []

        for (let i = 0; i < detectedFaces.length; i++) {
          const face = detectedFaces[i]

          // Пытаемся идентифицировать персону
          const identification = await identifyPerson(face)

          if (identification && identification.confidence >= confidenceThreshold) {
            // Найдена известная персона
            const appearance: TimelinePersonAppearance = {
              id: `${clip.id}-${identification.person.id}-${face.frameNumber}`,
              personId: identification.person.id,
              clipId: clip.id,
              startTime: face.timestamp.seconds,
              endTime: face.timestamp.seconds + 1, // Предполагаем 1 секунду длительности
              confidence: identification.confidence,
              boundingBox: face.bbox,
              thumbnailPath: undefined, // TODO: thumbnail не доступен в DetectedFace
              detectedAt: new Date(),
            }

            newAppearances.push(appearance)
          } else if (face.confidence >= confidenceThreshold) {
            // Неизвестное лицо с высокой уверенностью - можно предложить создать персону
            logger.info("Unknown face detected with high confidence:", { face })
          }

          setState((prev) => ({
            ...prev,
            analysisProgress: 50 + Math.round(((i + 1) / detectedFaces.length) * 40),
          }))
        }

        // Обновляем список появлений
        setState((prev) => ({
          ...prev,
          appearances: [
            ...prev.appearances.filter((app) => app.clipId !== clip.id), // Удаляем старые данные для этого клипа
            ...newAppearances,
          ],
          analysisProgress: 100,
          isAnalyzing: false,
        }))
      } catch (error) {
        logger.error("Failed to analyze clip for persons:", { error })
        setState((prev) => ({
          ...prev,
          isAnalyzing: false,
          error: error instanceof Error ? error.message : "Ошибка анализа персон",
        }))
      }
    },
    [detectFaces, identifyPerson, confidenceThreshold, enablePersonDetection, state.isAnalyzing],
  )

  // Анализ всего Timeline на наличие персон
  const analyzeTimelineForPersons = useCallback(async () => {
    if (!project || !enablePersonDetection) return

    // Получаем все видео клипы
    const allClips = (project.sections || [])
      .flatMap((section) => (section.tracks || []).flatMap((track) => track.clips || []))
      .concat((project.globalTracks || []).flatMap((track) => track.clips || []))
      .filter((clip) => clip.mediaId) // TODO: Фильтровать по типу трека

    if (allClips.length === 0) return

    setState((prev) => ({
      ...prev,
      isAnalyzing: true,
      analysisProgress: 0,
      error: null,
    }))

    try {
      for (let i = 0; i < allClips.length; i++) {
        const clip = allClips[i]
        await analyzeClipForPersons(clip)

        setState((prev) => ({
          ...prev,
          analysisProgress: Math.round(((i + 1) / allClips.length) * 100),
        }))
      }
    } catch (error) {
      logger.error("Timeline persons analysis failed:", { error })
      setState((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : "Ошибка анализа Timeline",
      }))
    } finally {
      setState((prev) => ({ ...prev, isAnalyzing: false }))
    }
  }, [project, enablePersonDetection, analyzeClipForPersons])

  // Показать детали персоны
  const showPersonDetail = useCallback((personId: string) => {
    // TODO: Имплементировать отображение деталей персоны
    logger.info("Show person detail:", { personId })
  }, [])

  // Очистка анализа персон
  const clearPersonsAnalysis = useCallback(() => {
    setState({
      isAnalyzing: false,
      analysisProgress: 0,
      appearances: [],
      error: null,
    })
  }, [])

  // Автоматический анализ новых клипов
  useEffect(() => {
    if (!enablePersonDetection || !project) return

    // Получаем все видео клипы
    const allClips = (project.sections || [])
      .flatMap((section) => (section.tracks || []).flatMap((track) => track.clips || []))
      .concat((project.globalTracks || []).flatMap((track) => track.clips || []))
      .filter((clip) => clip.mediaId) // TODO: Фильтровать по типу трека

    // Находим клипы, которые еще не были проанализированы
    const unanalyzedClips = allClips.filter(
      (clip) => !state.appearances.some((app) => app.clipId === clip.id) && !state.isAnalyzing,
    )

    if (unanalyzedClips.length > 0) {
      // Анализируем первый непроанализированный клип
      const timer = setTimeout(() => {
        void analyzeClipForPersons(unanalyzedClips[0])
      }, 2000) // Задержка для избежания частых анализов

      return () => clearTimeout(timer)
    }
  }, [project, enablePersonDetection, analyzeClipForPersons, state.appearances, state.isAnalyzing])

  return {
    state,
    persons,
    getPersonsForClip,
    getAppearancesForClip,
    analyzeClipForPersons,
    analyzeTimelineForPersons,
    showPersonDetail,
    clearPersonsAnalysis,
    enablePersonDetection,
    setEnablePersonDetection,
    confidenceThreshold,
    setConfidenceThreshold,
  }
}

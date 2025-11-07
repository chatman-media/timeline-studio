import { invoke } from "@tauri-apps/api/core"
import { open } from "@tauri-apps/plugin-dialog"
import { useCallback, useState } from "react"
import { toast } from "sonner"

import { useTimeline } from "@/features/timeline/hooks/use-timeline"
import type { TrackType } from "@/features/timeline/types"
import { createLogger } from "@/lib/tauri-logger"
import type { SubtitleImportResult } from "../types/subtitles"
import { parseSubtitleFile } from "../utils/subtitle-parsers"

const logger = createLogger("UseSubtitlesImport")

// Генерация уникального ID для субтитров
const generateSubtitleId = () => `subtitle-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`

/**
 * Хук для импорта файлов субтитров
 * Позволяет импортировать SRT, VTT, ASS файлы и добавлять их на таймлайн
 */
export function useSubtitlesImport() {
  const [isImporting, setIsImporting] = useState(false)
  const { project, send } = useTimeline()

  /**
   * Добавление субтитров на таймлайн
   * @param trackId - ID трека для субтитров
   * @param subtitle - Данные субтитра
   */
  const addSubtitleClip = useCallback(
    async (
      trackId: string,
      subtitle: {
        id: string
        type: "subtitle"
        startTime: number
        duration: number
        text: string
        style?: any
        position?: any
        subtitlePosition?: any
      },
    ) => {
      // Находим или создаем трек для субтитров
      const subtitleType: TrackType = "subtitle"
      const subtitleTrack = project?.sections[0]?.tracks.find((track) => track.type === ("subtitle" as TrackType))

      if (!subtitleTrack) {
        // Создаем новый трек для субтитров
        send({
          type: "ADD_TRACK",
          track: {
            id: trackId,
            type: "subtitle",
            name: "Субтитры",
            clips: [],
            height: 60,
            locked: false,
            muted: false,
            visible: true,
          },
        })
      }

      // Добавляем клип субтитра
      send({
        type: "ADD_CLIP",
        trackId: subtitleTrack?.id || trackId,
        clip: {
          id: subtitle.id,
          type: "subtitle",
          startTime: subtitle.startTime,
          duration: subtitle.duration,
          text: subtitle.text,
          style: subtitle.style || {
            fontSize: 24,
            fontFamily: "Arial",
            color: "#FFFFFF",
            backgroundColor: "rgba(0, 0, 0, 0.8)",
            position: "bottom",
          },
          position: subtitle.position,
          subtitlePosition: subtitle.subtitlePosition,
        },
      })
    },
    [project, send],
  )

  /**
   * Импорт файлов субтитров (SRT, VTT, ASS)
   */
  const importSubtitleFiles = useCallback(async () => {
    if (isImporting) return

    setIsImporting(true)
    try {
      const selected = await open({
        multiple: true,
        filters: [
          {
            name: "Subtitle Files",
            extensions: ["srt", "vtt", "ass", "ssa"],
          },
        ],
      })

      if (selected) {
        const files = Array.isArray(selected) ? selected : [selected]
        let totalImported = 0

        for (const filePath of files) {
          try {
            // Читаем файл через Tauri
            const result = await invoke<SubtitleImportResult>("read_subtitle_file", {
              file_path: filePath,
            })

            // Парсим субтитры
            const subtitles = parseSubtitleFile(result.content, result.format as any)

            // Добавляем субтитры на таймлайн
            // Находим или создаем трек для субтитров
            const subtitleType: TrackType = "subtitle"
            let subtitleTrackId = project?.sections[0]?.tracks.find((track) => track.type === ("subtitle" as TrackType))?.id

            if (!subtitleTrackId) {
              subtitleTrackId = `subtitle-track-${Date.now()}`
            }

            for (const subtitle of subtitles) {
              await addSubtitleClip(subtitleTrackId, {
                ...subtitle,
                id: generateSubtitleId(),
              })
            }

            totalImported += subtitles.length
          } catch (error) {
            logger.error(`Ошибка при импорте файла ${filePath}:`, { error })
            toast.error("Ошибка импорта", {
              description: `Не удалось импортировать файл ${filePath}`,
            })
          }
        }

        if (totalImported > 0) {
          toast.success("Субтитры импортированы", {
            description: `Импортировано ${totalImported} субтитров из ${files.length} файлов`,
          })
        }
      }
    } catch (error) {
      logger.error("Ошибка при импорте субтитров:", { error })
      toast.error("Ошибка", {
        description: "Не удалось импортировать субтитры",
      })
    } finally {
      setIsImporting(false)
    }
  }, [isImporting, addSubtitleClip, project])

  /**
   * Импорт одного файла субтитров
   */
  const importSubtitleFile = useCallback(async () => {
    if (isImporting) return

    setIsImporting(true)
    try {
      const selected = await open({
        multiple: false,
        filters: [
          {
            name: "Subtitle Files",
            extensions: ["srt", "vtt", "ass", "ssa"],
          },
        ],
      })

      if (selected && typeof selected === "string") {
        try {
          // Читаем файл через Tauri
          const result = await invoke<SubtitleImportResult>("read_subtitle_file", {
            file_path: selected,
          })

          // Парсим субтитры
          const subtitles = parseSubtitleFile(result.content, result.format as any)

          // Добавляем субтитры на таймлайн
          const subtitleType: TrackType = "subtitle"
          let subtitleTrackId = project?.sections[0]?.tracks.find((track) => track.type === ("subtitle" as TrackType))?.id

          if (!subtitleTrackId) {
            subtitleTrackId = `subtitle-track-${Date.now()}`
          }

          for (const subtitle of subtitles) {
            await addSubtitleClip(subtitleTrackId, {
              ...subtitle,
              id: generateSubtitleId(),
            })
          }

          toast.success("Субтитры импортированы", {
            description: `Импортировано ${subtitles.length} субтитров из файла ${result.file_name}`,
          })
        } catch (error) {
          logger.error("Ошибка при импорте файла:", { error })
          toast.error("Ошибка импорта", {
            description: "Не удалось импортировать файл субтитров",
          })
        }
      }
    } catch (error) {
      logger.error("Ошибка при выборе файла:", { error })
      toast.error("Ошибка", {
        description: "Не удалось выбрать файл",
      })
    } finally {
      setIsImporting(false)
    }
  }, [isImporting, addSubtitleClip, project])

  return {
    importSubtitleFiles,
    importSubtitleFile,
    isImporting,
  }
}

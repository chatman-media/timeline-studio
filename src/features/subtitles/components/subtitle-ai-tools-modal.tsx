import { useTranslation } from "react-i18next"

import { useNotifications } from "@/core/hooks"
import { useModals } from "@/core/hooks"
import { useTimeline } from "@/features/timeline/hooks/state/use-timeline"
import type { TrackType } from "@/features/timeline/types"
import { EnhancedTranscriptionPanel } from "@/features/transcription/components/enhanced-transcription-panel"

// Функция генерации уникального ID для субтитров
const generateSubtitleId = () => `subtitle-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`

export function SubtitleAIToolsModal() {
  const { t } = useTranslation()
  const { modalData, closeModal } = useModals()
  const { project, send } = useTimeline()
  const { showSuccess } = useNotifications()

  /**
   * Обработчик добавления субтитров на таймлайн
   */
  const handleAddToTimeline = (segments: any[]) => {
    // Находим или создаем трек для субтитров
    let subtitleTrack = project?.sections[0]?.tracks.find((track) => track.type === ("subtitle" as TrackType))

    if (!subtitleTrack) {
      const trackId = `subtitle-track-${Date.now()}`
      // Создаем новый трек для субтитров
      send({
        type: "ADD_TRACK",
        track: {
          id: trackId,
          type: "subtitle",
          name: t("subtitles.trackName", "Субтитры"),
          clips: [],
          height: 60,
          locked: false,
          muted: false,
          visible: true,
        },
      })
      subtitleTrack = { id: trackId } as any
    }

    // Добавляем субтитры на трек
    segments.forEach((segment) => {
      // Конвертируем время из секунд в миллисекунды для Timeline
      const startTime = typeof segment.start === "number" ? segment.start * 1000 : segment.startTime
      const endTime = typeof segment.end === "number" ? segment.end * 1000 : segment.endTime

      send({
        type: "ADD_CLIP",
        trackId: subtitleTrack!.id,
        clip: {
          id: generateSubtitleId(),
          type: "subtitle",
          startTime,
          duration: endTime - startTime,
          text: segment.text,
          style: {
            fontSize: 24,
            fontFamily: "Arial",
            color: "#FFFFFF",
            backgroundColor: "rgba(0, 0, 0, 0.8)",
            position: "bottom",
          },
          // Дополнительная информация от Enhanced AI
          speaker: segment.speaker,
          confidence: segment.confidence,
        },
      })
    })

    showSuccess(
      t("subtitles.ai.success", "Субтитры добавлены"),
      t("subtitles.ai.successDesc", "Добавлено {{count}} субтитров", {
        count: segments.length,
      }),
    )

    closeModal()
  }

  return (
    <div className="w-full h-[700px]" data-oid="id47wc3">
      <EnhancedTranscriptionPanel onAddToTimeline={handleAddToTimeline} data-oid="c7usu0s" />
    </div>
  )
}

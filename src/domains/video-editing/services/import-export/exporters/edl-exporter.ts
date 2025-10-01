/**
 * EDL (Edit Decision List) Exporter
 *
 * Экспортирует Timeline в CMX 3600 EDL формат
 */

import type { Timeline, TimelineClip, Track } from "../../../types"
import { type EDLEvent, type Exporter, type ExportOptions, formatTimecode, secondsToTimecode } from "../types"

export class EDLExporter implements Exporter {
  private frameRate = 30
  private eventCounter = 0

  async export(project: Timeline, options: ExportOptions): Promise<string> {
    this.frameRate = project.fps || 30
    this.eventCounter = 1

    const lines: string[] = []

    // Добавляем заголовок
    lines.push(`TITLE: ${project.name}`)
    lines.push("")
    lines.push("FCM: NON-DROP FRAME") // TODO: поддержка drop-frame
    lines.push("")

    // Собираем все треки
    const allTracks = [...project.globalTracks, ...project.sections.flatMap((s) => s.tracks)]

    // Сортируем треки по порядку
    const sortedTracks = allTracks.sort((a, b) => (a.order ?? 0) - (b.order ?? 0))

    // Обрабатываем каждый трек
    for (const track of sortedTracks) {
      if (!options.includeDisabledClips && (track.isMuted || track.isHidden)) {
        continue
      }

      const events = this.createEventsFromTrack(track, options)

      for (const event of events) {
        lines.push(this.formatEvent(event))

        // Добавляем дополнительную информацию
        if (event.comment) {
          const commentLines = event.comment.split("\n").filter((line) => line.trim())
          for (const commentLine of commentLines) {
            lines.push(`* ${commentLine}`)
          }
        }

        // Добавляем информацию о файле
        const clip = track.clips.find((c) => c.name?.includes(event.reel))
        if (clip?.mediaFile?.path) {
          lines.push(`* SOURCE FILE: ${clip.mediaFile.path}`)
        }

        lines.push("")
      }
    }

    return lines.join("\n")
  }

  getFileExtension(): string {
    return ".edl"
  }

  getMimeType(): string {
    return "text/plain"
  }

  private createEventsFromTrack(track: Track, options: ExportOptions): EDLEvent[] {
    const events: EDLEvent[] = []

    // Определяем тип трека для EDL
    const trackType = this.getEDLTrackType(track)

    // Сортируем клипы по времени начала
    const sortedClips = [...track.clips].sort((a, b) => a.startTime - b.startTime)

    for (const clip of sortedClips) {
      // Пропускаем отключенные клипы если указано
      if (!options.includeDisabledClips && !clip.isSelected) {
        continue
      }

      const event = this.createEventFromClip(clip, trackType, options)
      events.push(event)
    }

    return events
  }

  private getEDLTrackType(track: Track): "V" | "A" | "AA" | "B" {
    switch (track.type) {
      case "video":
        return "V"
      case "audio":
      case "music":
      case "voiceover":
      case "sfx":
      case "ambient":
        // Определяем номер аудио трека
        // TODO: поддержка множественных аудио треков (A1, A2, etc.)
        return "A"
      default:
        return "V" // По умолчанию видео
    }
  }

  private createEventFromClip(clip: TimelineClip, trackType: "V" | "A" | "AA" | "B", options: ExportOptions): EDLEvent {
    // Вычисляем timecodes
    const sourceIn = secondsToTimecode(clip.mediaStartTime || 0, this.frameRate)
    const sourceOut = secondsToTimecode(clip.mediaEndTime || (clip.mediaStartTime || 0) + clip.duration, this.frameRate)
    const recordIn = secondsToTimecode(clip.startTime, this.frameRate)
    const recordOut = secondsToTimecode(clip.startTime + clip.duration, this.frameRate)

    // Определяем тип редактирования
    let editType: "C" | "D" | "W" | "K" = "C" // По умолчанию Cut
    let comment = ""

    // Проверяем переходы
    if (options.includeTransitions && clip.transitions && clip.transitions.length > 0) {
      const transition = clip.transitions.find((t) => t.isEnabled && t.type === "cross")

      if (transition) {
        const transitionType = this.getTransitionType(transition.transitionId)
        editType = transitionType.editType
        comment += `TRANSITION: ${transitionType.name} (${transition.duration}s)\n`
      }
    }

    // Добавляем информацию об эффектах
    if (options.includeEffects && clip.effects && clip.effects.length > 0) {
      const enabledEffects = clip.effects.filter((e) => e.enabled)
      if (enabledEffects.length > 0) {
        comment += `EFFECTS: ${enabledEffects.map((e) => e.effectId).join(", ")}\n`
      }
    }

    // Добавляем информацию о скорости
    if (clip.speed !== 1.0) {
      comment += `SPEED: ${(clip.speed * 100).toFixed(0)}%\n`
    }

    // Добавляем информацию о громкости
    if (clip.volume !== 1.0) {
      comment += `AUDIO LEVEL: ${(clip.volume * 100).toFixed(0)}%\n`
    }

    const event: EDLEvent = {
      eventNumber: this.eventCounter++,
      reel: this.getReelName(clip),
      trackType,
      editType,
      sourceIn: formatTimecode(sourceIn),
      sourceOut: formatTimecode(sourceOut),
      recordIn: formatTimecode(recordIn),
      recordOut: formatTimecode(recordOut),
      comment: comment.trim(),
    }

    return event
  }

  private getReelName(clip: TimelineClip): string {
    // Попытка получить имя из медиафайла
    if (clip.mediaFile?.name) {
      // Убираем расширение и делаем uppercase (стандарт EDL)
      const name = clip.mediaFile.name.split(".")[0].toUpperCase()
      // Ограничиваем длину до 8 символов (стандарт EDL)
      return name.substring(0, 8)
    }

    // Если нет медиафайла, используем имя клипа
    if (clip.name) {
      const name = clip.name.replace(/[^A-Z0-9]/gi, "").toUpperCase()
      return name.substring(0, 8) || "CLIP"
    }

    // Fallback
    return "UNKNOWN"
  }

  private getTransitionType(transitionId: string): { editType: "D" | "W"; name: string } {
    // Маппинг переходов на EDL типы
    const transitionMap: Record<string, { editType: "D" | "W"; name: string }> = {
      // Dissolve типы
      dissolve: { editType: "D", name: "Dissolve" },
      fade: { editType: "D", name: "Fade" },
      crossfade: { editType: "D", name: "Cross Fade" },
      "dip-to-black": { editType: "D", name: "Dip to Black" },

      // Wipe типы
      wipe: { editType: "W", name: "Wipe" },
      "wipe-left": { editType: "W", name: "Wipe Left" },
      "wipe-right": { editType: "W", name: "Wipe Right" },
      "wipe-up": { editType: "W", name: "Wipe Up" },
      "wipe-down": { editType: "W", name: "Wipe Down" },
      "push-left": { editType: "W", name: "Push Left" },
      "push-right": { editType: "W", name: "Push Right" },
      "slide-left": { editType: "W", name: "Slide Left" },
      "slide-right": { editType: "W", name: "Slide Right" },
    }

    return transitionMap[transitionId] || { editType: "D", name: transitionId }
  }

  private formatEvent(event: EDLEvent): string {
    // Форматируем событие в стандартный EDL формат
    // Пример: "001  AX  V  C  00:00:00:00 00:00:10:00 00:00:00:00 00:00:10:00"

    const eventNum = String(event.eventNumber).padStart(3, "0")
    const reel = event.reel.padEnd(8, " ")
    const track = event.trackType.padEnd(3, " ")
    const edit = event.editType

    return `${eventNum}  ${reel}  ${track}  ${edit}  ${event.sourceIn} ${event.sourceOut} ${event.recordIn} ${event.recordOut}`
  }
}

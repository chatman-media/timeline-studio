/**
 * EDL (Edit Decision List) Importer
 *
 * Поддерживает импорт CMX 3600 EDL формата
 */

// Функция для генерации UUID
import type { MediaFile } from "@/features/media/types/media"

import type { Timeline, TimelineClip, Track, TrackType } from "../../../types"
import {
  type EDLEvent,
  type ImportError,
  type Importer,
  type ImportOptions,
  type ImportResult,
  type ImportWarning,
  type MediaReference,
  parseTimecode,
  timecodeToSeconds,
} from "../types"

function uuidv4(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === "x" ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

export class EDLImporter implements Importer {
  private frameRate = 30
  private errors: ImportError[] = []
  private warnings: ImportWarning[] = []
  private mediaReferences = new Map<string, MediaReference>()

  async import(content: string, options: ImportOptions): Promise<ImportResult> {
    this.frameRate = options.frameRate || 30
    this.errors = []
    this.warnings = []
    this.mediaReferences.clear()

    try {
      if (!this.validateContent(content)) {
        return {
          success: false,
          errors: this.errors,
          warnings: this.warnings,
          mediaFiles: [],
        }
      }

      const events = this.parseEDL(content)
      const project = this.createTimeline(events, options)

      // Создаем массив MediaFile из mediaReferences для результата
      const mediaFiles = this.createMediaFilesFromReferences()

      return {
        success: true,
        project,
        errors: this.errors,
        warnings: this.warnings,
        mediaFiles,
      }
    } catch (error) {
      this.errors.push({
        message: error instanceof Error ? error.message : "Unknown error during import",
        code: "PARSE_ERROR",
      })

      return {
        success: false,
        errors: this.errors,
        warnings: this.warnings,
        mediaFiles: this.createMediaFilesFromReferences(),
      }
    }
  }

  validateContent(content: string): boolean {
    // Базовая валидация EDL
    const lines = content.split("\n").filter((line) => line.trim())

    if (lines.length === 0) {
      this.errors.push({
        message: "Empty EDL file",
        code: "EMPTY_FILE",
      })
      return false
    }

    // Проверяем наличие хотя бы одного события
    const hasEvent = lines.some((line) => /^\d{3,6}\s+/.test(line.trim()))

    if (!hasEvent) {
      this.errors.push({
        message: "No valid EDL events found",
        code: "NO_EVENTS",
      })
      return false
    }

    return true
  }

  private parseEDL(content: string): EDLEvent[] {
    const lines = content.split("\n")
    const events: EDLEvent[] = []
    let currentEvent: Partial<EDLEvent> | null = null
    let lineNumber = 0

    for (const line of lines) {
      lineNumber++
      const trimmedLine = line.trim()

      // Пропускаем пустые строки
      if (!trimmedLine) {
        continue
      }

      // Проверяем, является ли строка комментарием (начинается с *)
      if (trimmedLine.startsWith("*")) {
        // FROM CLIP NAME
        const clipNameMatch = /^\*\s*FROM CLIP NAME:\s*(.+)/.exec(trimmedLine)
        if (clipNameMatch && currentEvent) {
          currentEvent.reel = clipNameMatch[1].trim()
        }

        // SOURCE FILE
        const sourceFileMatch = /^\*\s*SOURCE FILE:\s*(.+)/.exec(trimmedLine)
        if (sourceFileMatch) {
          this.addMediaReference(sourceFileMatch[1].trim())
        }

        // COMMENT
        const commentMatch = /^\*\s*COMMENT:\s*(.+)/.exec(trimmedLine)
        if (commentMatch && currentEvent) {
          currentEvent.comment = `${(currentEvent.comment || "") + commentMatch[1].trim()}\n`
        }

        continue
      }

      // Парсим строку события (например: "001  AX  V  C  00:00:00:00 00:00:10:00 00:00:00:00 00:00:10:00")
      const eventMatch = /^(\d{3,6})\s+(\S+)\s+(V|A|AA|B)\s+(C|D|W|K)\s+([\d:]+)\s+([\d:]+)\s+([\d:]+)\s+([\d:]+)/.exec(
        trimmedLine,
      )

      if (eventMatch) {
        // Сохраняем предыдущее событие
        if (currentEvent && this.isCompleteEvent(currentEvent)) {
          events.push(currentEvent as EDLEvent)
        }

        // Создаем новое событие
        currentEvent = {
          eventNumber: Number.parseInt(eventMatch[1], 10),
          reel: eventMatch[2],
          trackType: eventMatch[3] as "V" | "A" | "AA" | "B",
          editType: eventMatch[4] as "C" | "D" | "W" | "K",
          sourceIn: eventMatch[5],
          sourceOut: eventMatch[6],
          recordIn: eventMatch[7],
          recordOut: eventMatch[8],
        }
      } else {
        // Проверяем стандартные EDL заголовки
        const isHeaderLine =
          trimmedLine.startsWith("TITLE:") ||
          trimmedLine.startsWith("FCM:") ||
          trimmedLine.startsWith("DROP FRAME") ||
          trimmedLine.startsWith("NON-DROP FRAME")

        // Если не распознали строку и это не заголовок, добавляем предупреждение
        if (!isHeaderLine && trimmedLine.length > 0) {
          this.warnings.push({
            line: lineNumber,
            message: `Unrecognized line format: "${trimmedLine}"`,
            code: "UNRECOGNIZED_LINE",
          })
        }
      }
    }

    // Добавляем последнее событие
    if (currentEvent && this.isCompleteEvent(currentEvent)) {
      events.push(currentEvent as EDLEvent)
    }

    return events
  }

  private isCompleteEvent(event: Partial<EDLEvent>): boolean {
    return !!(
      event.eventNumber !== undefined &&
      event.reel &&
      event.trackType &&
      event.editType &&
      event.sourceIn &&
      event.sourceOut &&
      event.recordIn &&
      event.recordOut
    )
  }

  private addMediaReference(path: string): void {
    if (!this.mediaReferences.has(path)) {
      this.mediaReferences.set(path, {
        originalPath: path,
        exists: false, // TODO: проверить существование файла через Tauri
      })
    }
  }

  private createTimeline(events: EDLEvent[], _options: ImportOptions): Timeline {
    const project: Timeline = {
      id: uuidv4(),
      name: "Imported EDL Project",
      duration: 0,
      fps: this.frameRate,
      sampleRate: 48000,
      sections: [],
      globalTracks: [],
      resources: {
        effects: [],
        filters: [],
        transitions: [],
        templates: [],
        styleTemplates: [],
        subtitleStyles: [],
        music: [],
        media: [],
        timelineTransitions: [],
      },
      settings: {
        resolution: { width: 1920, height: 1080 },
        fps: this.frameRate,
        aspectRatio: "16:9",
        sampleRate: 48000,
        channels: 2,
        bitDepth: 16,
        timeFormat: "timecode" as const,
        snapToGrid: false,
        gridSize: 1,
        autoSave: true,
        autoSaveInterval: 300,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      version: "1.0.0",
    }

    // Группируем события по типу трека
    const videoEvents = events.filter((e) => e.trackType === "V" || e.trackType === "B")
    const audioEvents = events.filter((e) => e.trackType === "A" || e.trackType === "AA" || e.trackType === "B")

    // Создаем треки
    const tracks: Track[] = []

    if (videoEvents.length > 0) {
      const videoTrack = this.createTrack("video", 0)
      videoTrack.clips = this.createClipsFromEvents(videoEvents, "video")
      tracks.push(videoTrack)
    }

    if (audioEvents.length > 0) {
      const audioTrack = this.createTrack("audio", 1)
      audioTrack.clips = this.createClipsFromEvents(audioEvents, "audio")
      tracks.push(audioTrack)
    }

    // Добавляем треки в проект
    if (tracks.length > 0) {
      project.globalTracks = tracks

      // Вычисляем общую длительность проекта
      const lastClip = this.findLastClip(tracks)
      if (lastClip) {
        project.duration = lastClip.startTime + lastClip.duration
      }
    }

    // Создаем медиафайлы для ресурсов
    const mediaFiles = this.createMediaFiles()
    project.resources.media = mediaFiles

    // Также обновляем mediaReferences с созданными файлами
    mediaFiles.forEach((file) => {
      if (this.mediaReferences.has(file.path)) {
        this.mediaReferences.get(file.path)!.resolvedPath = file.path
      }
    })

    return project
  }

  private createTrack(type: TrackType, order: number): Track {
    return {
      id: uuidv4(),
      name: type === "video" ? "Video Track 1" : "Audio Track 1",
      type,
      order,
      clips: [],
      isLocked: false,
      isMuted: false,
      isHidden: false,
      isSolo: false,
      volume: 1.0,
      height: 60,
      pan: 0,
      trackEffects: [],
      trackFilters: [],
      transitions: [],
    }
  }

  private createClipsFromEvents(events: EDLEvent[], trackType: "video" | "audio"): TimelineClip[] {
    return events.map((event) => {
      const sourceIn = timecodeToSeconds(parseTimecode(event.sourceIn, this.frameRate), this.frameRate)
      const sourceOut = timecodeToSeconds(parseTimecode(event.sourceOut, this.frameRate), this.frameRate)
      const recordIn = timecodeToSeconds(parseTimecode(event.recordIn, this.frameRate), this.frameRate)
      const recordOut = timecodeToSeconds(parseTimecode(event.recordOut, this.frameRate), this.frameRate)

      const duration = recordOut - recordIn
      const sourceDuration = sourceOut - sourceIn

      // Создаем или находим медиафайл
      const mediaFile = this.getOrCreateMediaFile(event.reel, trackType)

      const clip: TimelineClip = {
        id: uuidv4(),
        name: `${event.reel} - Event ${event.eventNumber}`,
        mediaId: mediaFile.id,
        mediaFile,
        trackId: "", // Будет установлен позже
        startTime: recordIn,
        duration,
        mediaStartTime: sourceIn,
        mediaEndTime: sourceOut,
        offset: 0,
        mediaDuration: sourceDuration,
        volume: 1.0,
        speed: 1.0,
        isReversed: false,
        opacity: 1.0,
        effects: [],
        filters: [],
        transitions: this.createTransitions(event),
        isSelected: false,
        isLocked: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      return clip
    })
  }

  private getOrCreateMediaFile(reel: string, type: "video" | "audio"): any {
    // Упрощенная версия - создаем placeholder медиафайл
    const mediaId = `media-${reel}`

    return {
      id: mediaId,
      name: reel,
      path: `placeholder://${reel}`,
      size: 0,
      duration: 0,
      createdAt: new Date(),
      isVideo: type === "video",
      isAudio: type === "audio",
      isImage: false,
    }
  }

  private createTransitions(event: EDLEvent): any[] {
    const transitions: any[] = []

    // Создаем переходы на основе типа редактирования
    switch (event.editType) {
      case "D": // Dissolve
        transitions.push({
          id: uuidv4(),
          transitionId: "dissolve",
          duration: 1.0, // По умолчанию 1 секунда
          type: "cross",
          isEnabled: true,
        })
        break
      case "W": // Wipe
        transitions.push({
          id: uuidv4(),
          transitionId: "wipe",
          duration: 1.0,
          type: "cross",
          isEnabled: true,
        })
        break
      default:
        // "C" (Cut), "K" (Key) и другие типы не требуют переходов
        break
    }

    return transitions
  }

  private findLastClip(tracks: Track[]): TimelineClip | null {
    let lastClip: TimelineClip | null = null
    let maxEndTime = 0

    for (const track of tracks) {
      for (const clip of track.clips) {
        const endTime = clip.startTime + clip.duration
        if (endTime > maxEndTime) {
          maxEndTime = endTime
          lastClip = clip
        }
      }
    }

    return lastClip
  }

  private createMediaFiles(): any[] {
    const mediaFiles: MediaFile[] = []
    let index = 0

    // Добавляем медиафайлы из mediaReferences
    for (const [path, reference] of Array.from(this.mediaReferences)) {
      mediaFiles.push({
        id: `media-file-${index++}`,
        name: path.split("/").pop() || path,
        path: reference.resolvedPath || path,
        size: 0,
        duration: 0,
        createdAt: new Date().toISOString(),
        isVideo: this.isVideoFile(path),
        isAudio: this.isAudioFile(path),
        isImage: false,
      })
    }

    return mediaFiles
  }

  private isVideoFile(path: string): boolean {
    const ext = path.split(".").pop()?.toLowerCase()
    return ["mp4", "mov", "avi", "mkv", "webm"].includes(ext || "")
  }

  private isAudioFile(path: string): boolean {
    const ext = path.split(".").pop()?.toLowerCase()
    return ["mp3", "wav", "aac", "m4a", "ogg"].includes(ext || "")
  }

  private createMediaFilesFromReferences(): any[] {
    const mediaFiles: MediaFile[] = []
    let index = 0

    for (const [path, reference] of Array.from(this.mediaReferences)) {
      const fileName = path.split("/").pop() || path

      mediaFiles.push({
        id: `imported-media-${index++}`,
        name: fileName,
        path: reference.resolvedPath || reference.originalPath,
        size: 0,
        duration: 0,
        createdAt: new Date().toISOString(),
        isVideo: this.isVideoFile(path),
        isAudio: this.isAudioFile(path),
        isImage: false,
      })
    }

    return mediaFiles
  }
}

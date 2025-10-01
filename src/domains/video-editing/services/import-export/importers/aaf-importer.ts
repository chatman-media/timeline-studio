/**
 * AAF (Advanced Authoring Format) Importer
 *
 * Базовая поддержка импорта AAF XML формата
 * Примечание: Это упрощенная реализация AAF XML, не полный бинарный AAF
 */

import type { MediaFile } from "@/features/media/types/media"

import type { Timeline, TimelineClip, Track, TrackType } from "../../../types"
import { featureToDomainMediaFile } from "../../../utils/media-file-adapter"
import type { ImportError, Importer, ImportOptions, ImportResult, ImportWarning } from "../types"

// Функция для генерации UUID
function uuidv4(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === "x" ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

// AAF специфичные типы
interface AAFComposition {
  name: string
  usage?: string
  mobID: string
  tracks: AAFTrack[]
}

interface AAFTrack {
  trackID: number
  trackName?: string
  physicalTrackNumber?: number
  segments: AAFSegment[]
}

interface AAFSegment {
  type: "SourceClip" | "Filler" | "Transition" | "Sequence"
  sourceID?: string
  sourceTrackID?: number
  startTime?: number
  length?: number
  name?: string
  dataDefinition?: string // Picture, Sound, etc.
}

interface AAFMob {
  mobID: string
  name: string
  usage?: string // Master, Source, etc.
  tracks?: AAFTrack[]
  descriptor?: AAFEssenceDescriptor
}

interface AAFEssenceDescriptor {
  type: string
  locator?: string
  sampleRate?: string
  videoFormat?: {
    width: number
    height: number
    aspectRatio?: string
  }
}

export class AAFImporter implements Importer {
  private frameRate = 30
  private errors: ImportError[] = []
  private warnings: ImportWarning[] = []
  private mobs = new Map<string, AAFMob>()
  private mediaFiles = new Map<string, MediaFile>()

  async import(content: string, options: ImportOptions): Promise<ImportResult> {
    this.frameRate = options.frameRate || 30
    this.errors = []
    this.warnings = []
    this.mobs.clear()
    this.mediaFiles.clear()

    try {
      if (!this.validateContent(content)) {
        return {
          success: false,
          errors: this.errors,
          warnings: this.warnings,
          mediaFiles: [],
        }
      }

      const aafData = this.parseAAF(content)
      const project = this.createTimeline(aafData, options)

      return {
        success: true,
        project,
        errors: this.errors,
        warnings: this.warnings,
        mediaFiles: Array.from(this.mediaFiles.values()) as any[],
      }
    } catch (error) {
      this.errors.push({
        message: error instanceof Error ? error.message : "Unknown error during AAF import",
        code: "PARSE_ERROR",
      })

      return {
        success: false,
        errors: this.errors,
        warnings: this.warnings,
        mediaFiles: Array.from(this.mediaFiles.values()) as any[],
      }
    }
  }

  validateContent(content: string): boolean {
    // Проверяем, что это XML (может быть без XML declaration)
    const trimmedContent = content.trim()
    if (!trimmedContent.startsWith("<?xml") && !trimmedContent.startsWith("<")) {
      this.errors.push({
        message: "Invalid XML format",
        code: "INVALID_XML",
      })
      return false
    }

    // Проверяем наличие AAF элементов
    if (!content.includes("<AAF") && !content.includes("CompositionMob")) {
      this.errors.push({
        message: "Not a valid AAF XML file - missing AAF elements",
        code: "INVALID_AAF",
      })
      return false
    }

    return true
  }

  private parseAAF(content: string): { compositions: AAFComposition[]; mobs: AAFMob[] } {
    const compositions: AAFComposition[] = []
    const mobs: AAFMob[] = []

    // Парсим все Mob элементы - используем [\s\S]*? для работы с новыми строками
    const mobRegex = /<(CompositionMob|MasterMob|SourceMob)[^>]*>([\s\S]*?)<\/\1>/g

    let mobMatch: RegExpExecArray | null
    while ((mobMatch = mobRegex.exec(content)) !== null) {
      const match = mobMatch
      const mobType = match[1]
      const mobContent = match[2]

      const mob: AAFMob = {
        mobID: this.extractValue(mobContent, "MobID[^>]*>([^<]+)") || uuidv4(),
        name: this.extractValue(mobContent, "Name[^>]*>([^<]+)") || "Unknown Mob",
        usage: mobType === "CompositionMob" ? "Composition" : mobType === "MasterMob" ? "Master" : "Source",
      }

      // Парсим треки
      if (mobType === "CompositionMob") {
        const comp: AAFComposition = {
          name: mob.name,
          mobID: mob.mobID,
          usage: mob.usage,
          tracks: this.parseTracks(match[0]), // Парсим весь контент мобы, а не только внутренний
        }
        compositions.push(comp)
      }

      // Парсим дескрипторы для медиа
      if (mobType === "SourceMob") {
        const descriptor = this.parseEssenceDescriptor(mobContent)
        if (descriptor) {
          mob.descriptor = descriptor
          this.createMediaFileFromMob(mob)
        }
      }

      this.mobs.set(mob.mobID, mob)
      mobs.push(mob)
    }

    return { compositions, mobs }
  }

  private extractValue(content: string, pattern: string): string | null {
    const match = new RegExp(pattern).exec(content)
    return match ? match[1] : null
  }

  private parseTracks(content: string): AAFTrack[] {
    const tracks: AAFTrack[] = []

    // Ищем все TimelineMobSlot элементы - используем [\s\S]*? для многострочного контента
    const trackRegex = /<TimelineMobSlot[^>]*>([\s\S]*?)<\/TimelineMobSlot>/g
    let trackMatch: RegExpExecArray | null
    while ((trackMatch = trackRegex.exec(content)) !== null) {
      const match = trackMatch
      const trackContent = match[1]

      const track: AAFTrack = {
        trackID: Number.parseInt(this.extractValue(trackContent, "TrackID[^>]*>([^<]+)") || "0", 10),
        trackName: this.extractValue(trackContent, "TrackName[^>]*>([^<]+)") || undefined,
        physicalTrackNumber:
          Number.parseInt(this.extractValue(trackContent, "PhysicalTrackNumber[^>]*>([^<]+)") || "0", 10) || undefined,
        segments: this.parseSegments(trackContent),
      }

      tracks.push(track)
    }

    return tracks
  }

  private parseSegments(content: string): AAFSegment[] {
    const segments: AAFSegment[] = []

    // Сначала проверяем, есть ли Sequence - исправляем regex для многострочного контента
    const sequenceMatch = /<Sequence[^>]*>([\s\S]*?)<\/Sequence>/.exec(content)
    const searchContent = sequenceMatch ? sequenceMatch[1] : content

    // Ищем различные типы сегментов - используем [\s\S]*? для многострочного контента
    const segmentRegex = /<(SourceClip|Filler|Transition)[^>]*>([\s\S]*?)<\/\1>/g
    let segmentMatch: RegExpExecArray | null
    while ((segmentMatch = segmentRegex.exec(searchContent)) !== null) {
      const match = segmentMatch
      const segmentType = match[1] as AAFSegment["type"]
      const segmentContent = match[2]

      const segment: AAFSegment = {
        type: segmentType,
        name: this.extractValue(segmentContent, "Name[^>]*>([^<]+)") || undefined,
        dataDefinition: this.extractValue(segmentContent, "DataDefinition[^>]*>([^<]+)") || undefined,
      }

      // Парсим длину для всех типов сегментов
      const length = this.extractValue(segmentContent, "Length[^>]*>([^<]+)")
      if (length) segment.length = Number.parseInt(length, 10)

      // Для SourceClip парсим дополнительную информацию
      if (segmentType === "SourceClip") {
        segment.sourceID = this.extractValue(segmentContent, "SourceID[^>]*>([^<]+)") || undefined
        segment.sourceTrackID =
          Number.parseInt(this.extractValue(segmentContent, "SourceTrackID[^>]*>([^<]+)") || "0", 10) || undefined

        const startTime = this.extractValue(segmentContent, "StartTime[^>]*>([^<]+)")
        if (startTime) segment.startTime = Number.parseInt(startTime, 10)
      }

      segments.push(segment)
    }

    return segments
  }

  private parseEssenceDescriptor(content: string): AAFEssenceDescriptor | null {
    const descriptorMatch = /<EssenceDescriptor[^>]*>([\s\S]*?)<\/EssenceDescriptor>/.exec(content)
    if (!descriptorMatch) return null

    const descriptorContent = descriptorMatch[1]

    const descriptor: AAFEssenceDescriptor = {
      type: this.extractValue(descriptorContent, "Type[^>]*>([^<]+)") || "Unknown",
      locator: this.extractValue(descriptorContent, "Locator[^>]*>([^<]+)") || undefined,
      sampleRate: this.extractValue(descriptorContent, "SampleRate[^>]*>([^<]+)") || undefined,
    }

    // Парсим видео формат если есть
    const width = this.extractValue(descriptorContent, "StoredWidth[^>]*>([^<]+)")
    const height = this.extractValue(descriptorContent, "StoredHeight[^>]*>([^<]+)")

    if (width && height) {
      descriptor.videoFormat = {
        width: Number.parseInt(width, 10),
        height: Number.parseInt(height, 10),
        aspectRatio: this.extractValue(descriptorContent, "AspectRatio[^>]*>([^<]+)") || undefined,
      }
    }

    return descriptor
  }

  private createMediaFileFromMob(mob: AAFMob): void {
    if (!mob.descriptor || this.mediaFiles.has(mob.mobID)) return

    const descriptor = mob.descriptor
    const isVideo = descriptor.type.includes("Picture") || !!descriptor.videoFormat
    const isAudio = descriptor.type.includes("Sound") || descriptor.type.includes("Audio")

    const mediaFile: MediaFile = {
      id: mob.mobID,
      name: mob.name,
      path: descriptor.locator || `aaf://${mob.mobID}`,
      size: 0,
      duration: 0, // AAF не хранит длительность в дескрипторе
      createdAt: new Date().toISOString(),
      isVideo,
      isAudio,
      isImage: false,
    }

    // descriptor.videoFormat не поддерживается в MediaFile

    this.mediaFiles.set(mob.mobID, mediaFile)
  }

  private createTimeline(aafData: any, _options: ImportOptions): Timeline {
    const composition = aafData.compositions[0] // Берем первую композицию

    if (!composition) {
      throw new Error("No composition found in AAF file")
    }

    const project: Timeline = {
      id: uuidv4(),
      name: composition.name,
      duration: 0,
      fps: this.frameRate,
      sampleRate: 48000,
      sections: [],
      globalTracks: [],
      resources: {
        effects: [],
        filters: [],
        transitions: [],
        timelineTransitions: [],
        templates: [],
        styleTemplates: [],
        subtitleStyles: [],
        music: [],
        media: Array.from(this.mediaFiles.values()).map(featureToDomainMediaFile),
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

    // Создаем треки из композиции
    project.globalTracks = this.createTracksFromComposition(composition)

    // Вычисляем длительность проекта
    const lastClip = this.findLastClip(project.globalTracks)
    if (lastClip) {
      project.duration = lastClip.startTime + lastClip.duration
    }

    return project
  }

  private createTracksFromComposition(composition: AAFComposition): Track[] {
    const tracks: Track[] = []

    for (const aafTrack of composition.tracks) {
      const trackType = this.determineTrackType(aafTrack)
      const track: Track = {
        id: uuidv4(),
        name: aafTrack.trackName || `Track ${aafTrack.trackID}`,
        type: trackType,
        order: aafTrack.trackID - 1, // AAF trackID начинается с 1
        clips: [],
        isLocked: false,
        isMuted: false,
        isHidden: false,
        isSolo: false,
        volume: 1.0,
        pan: 0,
        height: 60,
        trackEffects: [],
        trackFilters: [],
        transitions: [],
      }

      // Создаем клипы из сегментов
      let currentTime = 0

      for (const segment of aafTrack.segments) {
        if (segment.type === "SourceClip" && segment.sourceID) {
          const clip = this.createClipFromSegment(segment, track.id, currentTime)
          if (clip) {
            track.clips.push(clip)
            currentTime += clip.duration
          }
        } else if (segment.type === "Filler" && segment.length) {
          // Filler - это пустое пространство
          currentTime += segment.length / this.frameRate
        }
      }

      tracks.push(track)
    }

    return tracks
  }

  private determineTrackType(track: AAFTrack): TrackType {
    // Определяем тип трека по первому сегменту с dataDefinition
    const segment = track.segments.find((s) => s.dataDefinition)

    if (segment?.dataDefinition) {
      if (segment.dataDefinition.includes("Picture")) return "video"
      if (segment.dataDefinition.includes("Sound")) return "audio"
    }

    // По умолчанию считаем видео
    return "video"
  }

  private createClipFromSegment(segment: AAFSegment, trackId: string, startTime: number): TimelineClip | null {
    if (!segment.sourceID || segment.length === undefined) return null

    // Ищем медиафайл по sourceID
    const mediaFile = this.mediaFiles.get(segment.sourceID)
    if (!mediaFile) {
      this.warnings.push({
        message: `Media file not found for source ID: ${segment.sourceID}`,
        code: "MISSING_MEDIA",
      })
    }

    const duration = segment.length / this.frameRate
    const mediaStartTime = (segment.startTime || 0) / this.frameRate

    return {
      id: uuidv4(),
      name: segment.name || `Clip from ${segment.sourceID}`,
      mediaId: mediaFile?.id || segment.sourceID,
      mediaFile: mediaFile ? featureToDomainMediaFile(mediaFile) : undefined,
      trackId,
      startTime,
      duration,
      mediaStartTime,
      mediaEndTime: mediaStartTime + duration,
      offset: 0,
      mediaDuration: duration,
      volume: 1.0,
      speed: 1.0,
      isReversed: false,
      opacity: 1.0,
      effects: [],
      filters: [],
      transitions: [],
      isSelected: false,
      isLocked: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
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
}

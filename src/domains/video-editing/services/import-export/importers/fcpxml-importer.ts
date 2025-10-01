/**
 * FCPXML (Final Cut Pro XML) Importer
 *
 * Поддерживает импорт Final Cut Pro XML формата
 */

// Функция для генерации UUID
import { MediaFile } from "@/features/media/types/media"
import type { Timeline, TimelineClip, Track, TrackType } from "../../../types"
import { featureToDomainMediaFile } from "../../../utils/media-file-adapter"

import type { FCPXMLResource, ImportError, Importer, ImportOptions, ImportResult, ImportWarning } from "../types"

function uuidv4(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === "x" ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

interface FCPXMLProject {
  name: string
  duration: string
  format: {
    frameDuration: string
    width: number
    height: number
  }
  resources: FCPXMLResource[]
  sequence?: FCPXMLSequence
}

interface FCPXMLSequence {
  duration: string
  format: string
  spine: FCPXMLClipItem[]
}

interface FCPXMLClipItem {
  name: string
  ref: string
  offset?: string
  duration?: string
  start?: string
  enabled?: boolean
  lane?: number
}

export class FCPXMLImporter implements Importer {
  private frameRate = 30
  private errors: ImportError[] = []
  private warnings: ImportWarning[] = []
  private mediaReferences = new Map<string, MediaFile>()
  private resources = new Map<string, FCPXMLResource>()

  async import(content: string, options: ImportOptions): Promise<ImportResult> {
    this.frameRate = options.frameRate || 30
    this.errors = []
    this.warnings = []
    this.mediaReferences.clear()
    this.resources.clear()

    try {
      if (!this.validateContent(content)) {
        return {
          success: false,
          errors: this.errors,
          warnings: this.warnings,
          mediaFiles: [],
        }
      }

      const fcpxmlProject = this.parseFCPXML(content)
      const project = this.createTimeline(fcpxmlProject, options)

      return {
        success: true,
        project,
        errors: this.errors,
        warnings: this.warnings,
        mediaFiles: Array.from(this.mediaReferences.values()) as any[],
      }
    } catch (error) {
      this.errors.push({
        message: error instanceof Error ? error.message : "Unknown error during FCPXML import",
        code: "PARSE_ERROR",
      })

      return {
        success: false,
        errors: this.errors,
        warnings: this.warnings,
        mediaFiles: Array.from(this.mediaReferences.values()) as any[],
      }
    }
  }

  validateContent(content: string): boolean {
    // Проверяем, что это XML
    if (!content.trim().startsWith("<?xml")) {
      this.errors.push({
        message: "Invalid XML format",
        code: "INVALID_XML",
      })
      return false
    }

    // Проверяем наличие fcpxml root элемента
    if (!content.includes("<fcpxml")) {
      this.errors.push({
        message: "Not a valid FCPXML file - missing fcpxml root element",
        code: "INVALID_FCPXML",
      })
      return false
    }

    return true
  }

  private parseFCPXML(content: string): FCPXMLProject {
    // Простой XML парсер для FCPXML
    // В реальном проекте лучше использовать DOMParser или xml2js

    // Извлекаем название проекта из тега <project>
    const projectName = this.extractValue(content, '<project[^>]+name="([^"]*)"') || "Imported FCPXML Project"

    // Извлекаем параметры из тега <format>
    const formatSection = this.extractSection(content, "<format[^>]*>", "</format>")
    const sequenceSection = this.extractSection(content, "<sequence[^>]*>", "</sequence>")

    const project: FCPXMLProject = {
      name: projectName,
      duration: this.extractValue(sequenceSection || content, 'duration="([^"]*)"') || "0s",
      format: {
        frameDuration: this.extractValue(formatSection || content, 'frameDuration="([^"]*)"') || "1/30s",
        width: Number.parseInt(this.extractValue(formatSection || content, 'width="([^"]*)"') || "1920", 10),
        height: Number.parseInt(this.extractValue(formatSection || content, 'height="([^"]*)"') || "1080", 10),
      },
      resources: this.parseResources(content),
      sequence: this.parseSequence(content),
    }

    return project
  }

  private extractValue(content: string, pattern: string): string | null {
    const match = new RegExp(pattern).exec(content)
    return match ? match[1] : null
  }

  private extractSection(content: string, startPattern: string, endPattern: string): string | null {
    const match = new RegExp(`${startPattern}(.*?)${endPattern}`, "s").exec(content)
    return match ? match[0] : null
  }

  private parseResources(content: string): FCPXMLResource[] {
    const resources: FCPXMLResource[] = []

    // Ищем все asset элементы
    const assetMatches = content.matchAll(/<asset[^>]*>/g)

    for (const match of assetMatches) {
      const assetTag = match[0]

      const resource: FCPXMLResource = {
        id: this.extractAttributeValue(assetTag, "id") || uuidv4(),
        name: this.extractAttributeValue(assetTag, "name") || "Unknown Asset",
        src: this.extractAttributeValue(assetTag, "src") || "",
        hasVideo: this.extractAttributeValue(assetTag, "hasVideo") === "1",
        hasAudio: this.extractAttributeValue(assetTag, "hasAudio") === "1",
        duration: this.extractAttributeValue(assetTag, "duration") || undefined,
      }

      resources.push(resource)
      this.resources.set(resource.id, resource)

      // Создаем MediaFile для каждого ресурса
      this.createMediaFileFromResource(resource)
    }

    return resources
  }

  private extractAttributeValue(tag: string, attribute: string): string | null {
    const match = new RegExp(`${attribute}="([^"]*)"`).exec(tag)
    return match ? match[1] : null
  }

  private parseSequence(content: string): FCPXMLSequence | undefined {
    const sequenceMatch = /<sequence[^>]*>(.*?)<\/sequence>/s.exec(content)
    if (!sequenceMatch) return undefined

    const sequenceContent = sequenceMatch[1]

    return {
      duration: this.extractValue(sequenceContent, 'duration="([^"]*)"') || "0s",
      format: this.extractValue(sequenceContent, 'format="([^"]*)"') || "",
      spine: this.parseSpine(sequenceContent),
    }
  }

  private parseSpine(content: string): FCPXMLClipItem[] {
    const clips: FCPXMLClipItem[] = []

    // Ищем все clip элементы в spine
    const clipMatches = content.matchAll(/<(clip|asset-clip)[^>]*(?:\/?>|>.*?<\/(?:clip|asset-clip)>)/gs)

    for (const match of clipMatches) {
      const clipTag = match[0]

      const clip: FCPXMLClipItem = {
        name: this.extractAttributeValue(clipTag, "name") || "Unknown Clip",
        ref: this.extractAttributeValue(clipTag, "ref") || "",
        offset: this.extractAttributeValue(clipTag, "offset") || undefined,
        duration: this.extractAttributeValue(clipTag, "duration") || undefined,
        start: this.extractAttributeValue(clipTag, "start") || undefined,
        enabled: this.extractAttributeValue(clipTag, "enabled") !== "0",
        lane: Number.parseInt(this.extractAttributeValue(clipTag, "lane") || "0", 10),
      }

      clips.push(clip)
    }

    return clips
  }

  private createMediaFileFromResource(resource: FCPXMLResource): void {
    if (this.mediaReferences.has(resource.id)) return

    // Определяем тип медиафайла
    const isVideo = resource.hasVideo
    const isAudio = resource.hasAudio && !resource.hasVideo

    const mediaFile: MediaFile = {
      id: resource.id,
      name: resource.name,
      path: resource.src,
      size: 0,
      duration: this.parseDurationToSeconds(resource.duration || "0s"),
      createdAt: new Date().toISOString(),
      isVideo,
      isAudio,
      isImage: false,
    }

    this.mediaReferences.set(resource.id, mediaFile)
  }

  private parseDurationToSeconds(duration: string): number {
    // FCPXML использует формат "100/30s" или "3000s"
    if (duration.endsWith("s")) {
      const numPart = duration.slice(0, -1)

      if (numPart.includes("/")) {
        const [numerator, denominator] = numPart.split("/").map(Number)
        return numerator / denominator
      }

      return Number.parseFloat(numPart)
    }

    return 0
  }

  private createTimeline(fcpxmlProject: FCPXMLProject, _options: ImportOptions): Timeline {
    // Вычисляем frame rate из frameDuration
    const frameDuration = fcpxmlProject.format.frameDuration
    this.frameRate = this.parseFrameRate(frameDuration)

    const project: Timeline = {
      id: uuidv4(),
      name: fcpxmlProject.name,
      duration: this.parseDurationToSeconds(fcpxmlProject.duration),
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
        timelineTransitions: [],
        music: [],
        media: Array.from(this.mediaReferences.values()) as any[],
      },
      settings: {
        resolution: {
          width: fcpxmlProject.format.width,
          height: fcpxmlProject.format.height,
        },
        fps: this.frameRate,
        aspectRatio: this.calculateAspectRatio(fcpxmlProject.format.width, fcpxmlProject.format.height),
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

    // Создаем треки из sequence
    if (fcpxmlProject.sequence) {
      project.globalTracks = this.createTracksFromSequence(fcpxmlProject.sequence)

      // Пересчитываем длительность проекта
      const lastClip = this.findLastClip(project.globalTracks)
      if (lastClip) {
        project.duration = lastClip.startTime + lastClip.duration
      }
    }

    return project
  }

  private parseFrameRate(frameDuration: string): number {
    // frameDuration в формате "1001/30000s" означает 29.97 fps
    if (frameDuration.includes("/")) {
      const numPart = frameDuration.replace("s", "")
      const [numerator, denominator] = numPart.split("/").map(Number)
      return denominator / numerator
    }

    return 30 // По умолчанию
  }

  private calculateAspectRatio(width: number, height: number): string {
    const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b))
    const divisor = gcd(width, height)

    const aspectWidth = width / divisor
    const aspectHeight = height / divisor

    // Стандартные соотношения
    if (aspectWidth === 16 && aspectHeight === 9) return "16:9"
    if (aspectWidth === 4 && aspectHeight === 3) return "4:3"
    if (aspectWidth === 21 && aspectHeight === 9) return "21:9"

    return `${aspectWidth}:${aspectHeight}`
  }

  private createTracksFromSequence(sequence: FCPXMLSequence): Track[] {
    const tracks: Track[] = []
    const trackMap = new Map<number, Track>()

    // Группируем клипы по lanes (дорожкам)
    for (const clip of sequence.spine) {
      const lane = clip.lane || 0

      if (!trackMap.has(lane)) {
        const trackType: TrackType = this.determineTrackType(clip)
        const track = this.createTrack(trackType, lane, tracks.length)
        trackMap.set(lane, track)
        tracks.push(track)
      }

      const track = trackMap.get(lane)!
      const timelineClip = this.createTimelineClip(clip, track.id)
      track.clips.push(timelineClip)
    }

    return tracks
  }

  private determineTrackType(clip: FCPXMLClipItem): TrackType {
    const resource = this.resources.get(clip.ref)

    if (resource?.hasVideo) return "video"
    if (resource?.hasAudio) return "audio"

    return "video" // По умолчанию
  }

  private createTrack(type: TrackType, _lane: number, index: number): Track {
    return {
      id: uuidv4(),
      name: `${type === "video" ? "Video" : "Audio"} Track ${index + 1}`,
      type,
      order: index,
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

  private createTimelineClip(fcpClip: FCPXMLClipItem, trackId: string): TimelineClip {
    const resource = this.resources.get(fcpClip.ref)
    const mediaFile = resource ? this.mediaReferences.get(resource.id) : null

    const startTime = fcpClip.offset ? this.parseDurationToSeconds(fcpClip.offset) : 0
    const duration = fcpClip.duration ? this.parseDurationToSeconds(fcpClip.duration) : 0
    const mediaStart = fcpClip.start ? this.parseDurationToSeconds(fcpClip.start) : 0

    return {
      id: uuidv4(),
      name: fcpClip.name,
      mediaId: mediaFile?.id || "",
      mediaFile: mediaFile ? featureToDomainMediaFile(mediaFile) : undefined,
      trackId,
      startTime,
      duration,
      mediaStartTime: mediaStart,
      mediaEndTime: mediaStart + duration,
      offset: 0,
      mediaDuration: duration,
      volume: 1.0,
      speed: 1.0,
      isReversed: false,
      opacity: fcpClip.enabled !== false ? 1.0 : 0.0,
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

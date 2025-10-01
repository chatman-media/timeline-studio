/**
 * FCPXML (Final Cut Pro XML) Exporter
 *
 * Экспортирует Timeline в Final Cut Pro XML формат
 */

import type { Timeline, TimelineClip, Track } from "../../../types"
import { MediaFileUtils } from "../../../types/media"

import type { Exporter, ExportOptions } from "../types"

export class FCPXMLExporter implements Exporter {
  private frameRate = 30
  private projectWidth = 1920
  private projectHeight = 1080

  async export(project: Timeline, options: ExportOptions): Promise<string> {
    this.frameRate = project.fps || 30
    this.projectWidth = project.settings.resolution.width
    this.projectHeight = project.settings.resolution.height

    const xml = this.generateFCPXML(project, options)
    return xml
  }

  getFileExtension(): string {
    return ".fcpxml"
  }

  getMimeType(): string {
    return "application/xml"
  }

  private generateFCPXML(project: Timeline, options: ExportOptions): string {
    const lines: string[] = []

    // XML Declaration
    lines.push('<?xml version="1.0" encoding="UTF-8"?>')
    lines.push("<!DOCTYPE fcpxml>")
    lines.push("")

    // FCPXML Root
    lines.push('<fcpxml version="1.11">')
    lines.push("")

    // Resources section
    lines.push("  <resources>")
    this.generateResources(project, options, lines)
    lines.push("  </resources>")
    lines.push("")

    // Library
    lines.push("  <library>")
    lines.push(`    <event name="${this.escapeXml(project.name)}">`)

    // Project
    lines.push(`      <project name="${this.escapeXml(project.name)}">`)
    this.generateSequence(project, options, lines)
    lines.push("      </project>")

    lines.push("    </event>")
    lines.push("  </library>")
    lines.push("")
    lines.push("</fcpxml>")

    return lines.join("\n")
  }

  private generateResources(project: Timeline, _options: ExportOptions, lines: string[]): void {
    // Format definition
    const frameDuration = this.calculateFrameDuration(this.frameRate)

    lines.push(
      `    <format id="r1" name="FFVideoFormat${this.projectWidth}x${this.projectHeight}p${this.frameRate}" frameDuration="${frameDuration}" width="${this.projectWidth}" height="${this.projectHeight}"/>`,
    )
    lines.push("")

    // Media assets
    const mediaFiles = this.collectMediaFiles(project)

    for (const [index, mediaFile] of mediaFiles.entries()) {
      if (!mediaFile) continue

      const assetId = `r${index + 2}` // r1 занят форматом
      const hasVideo = MediaFileUtils.hasVideo(mediaFile) ? "1" : "0"
      const hasAudio = MediaFileUtils.hasAudio(mediaFile) ? "1" : "0"

      const duration = this.secondsToFCPXMLDuration(mediaFile.duration || 0)

      lines.push(
        `    <asset id="${assetId}" name="${this.escapeXml(mediaFile.name)}" ` +
          `src="${this.escapeXml(this.getRelativePath(mediaFile.path))}" ` +
          `start="0s" duration="${duration}" ` +
          `hasVideo="${hasVideo}" hasAudio="${hasAudio}"/>`,
      )
    }
  }

  private collectMediaFiles(project: Timeline): ((typeof project.resources.media)[0] | undefined)[] {
    const mediaFiles = new Set<string>()
    const result: ((typeof project.resources.media)[0] | undefined)[] = []

    // Собираем все медиафайлы из треков
    const allTracks = [...project.globalTracks, ...project.sections.flatMap((s) => s.tracks)]

    for (const track of allTracks) {
      for (const clip of track.clips) {
        if (clip.mediaFile && !mediaFiles.has(clip.mediaFile.id)) {
          mediaFiles.add(clip.mediaFile.id)
          result.push(clip.mediaFile)
        }
      }
    }

    return result
  }

  private generateSequence(project: Timeline, options: ExportOptions, lines: string[]): void {
    const duration = this.secondsToFCPXMLDuration(project.duration)

    lines.push(`        <sequence format="r1" duration="${duration}">`)
    lines.push("          <spine>")

    // Обрабатываем треки
    const allTracks = [...project.globalTracks, ...project.sections.flatMap((s) => s.tracks)]
    const sortedTracks = allTracks.sort((a, b) => (a.order ?? 0) - (b.order ?? 0))

    for (const track of sortedTracks) {
      if (!options.includeDisabledClips && (track.isMuted || track.isHidden)) {
        continue
      }

      this.generateTrackClips(track, options, lines, 3)
    }

    lines.push("          </spine>")
    lines.push("        </sequence>")
  }

  private generateTrackClips(track: Track, options: ExportOptions, lines: string[], indent: number): void {
    const indentStr = "  ".repeat(indent)
    const sortedClips = [...track.clips].sort((a, b) => a.startTime - b.startTime)

    for (const clip of sortedClips) {
      // Пропускаем отключенные клипы если указано
      if (!options.includeDisabledClips && !clip.isSelected && clip.opacity === 0) {
        continue
      }

      this.generateClip(clip, track, options, lines, indent)
    }
  }

  private generateClip(
    clip: TimelineClip,
    track: Track,
    options: ExportOptions,
    lines: string[],
    indent: number,
  ): void {
    const indentStr = "  ".repeat(indent)

    // Находим asset ref для клипа
    const mediaFile = clip.mediaFile
    if (!mediaFile) {
      lines.push(`${indentStr}<!-- Missing media file for clip: ${clip.name} -->`)
      return
    }

    const assetRef = this.findAssetRef(mediaFile)
    const offset = this.secondsToFCPXMLDuration(clip.startTime)
    const duration = this.secondsToFCPXMLDuration(clip.duration)
    const start = this.secondsToFCPXMLDuration(clip.mediaStartTime || 0)

    const enabled = clip.opacity > 0 ? "1" : "0"
    const lane = this.getTrackLane(track)

    let clipTag = `<asset-clip ref="${assetRef}" name="${this.escapeXml(clip.name)}" `
    clipTag += `offset="${offset}" duration="${duration}" start="${start}" enabled="${enabled}"`

    if (lane !== 0) {
      clipTag += ` lane="${lane}"`
    }

    // Проверяем, есть ли эффекты или параметры
    const hasEffects = options.includeEffects && clip.effects && clip.effects.length > 0
    const hasTransitions = options.includeTransitions && clip.transitions && clip.transitions.length > 0
    const hasAdjustments = clip.volume !== 1.0 || clip.speed !== 1.0 || clip.opacity !== 1.0

    if (!hasEffects && !hasTransitions && !hasAdjustments) {
      lines.push(`${indentStr}${clipTag}/>`)
    } else {
      lines.push(`${indentStr}${clipTag}>`)

      // Добавляем параметры
      if (hasAdjustments) {
        this.generateClipAdjustments(clip, options, lines, indent + 1)
      }

      // Добавляем эффекты
      if (hasEffects) {
        this.generateClipEffects(clip, options, lines, indent + 1)
      }

      // Добавляем переходы
      if (hasTransitions) {
        this.generateClipTransitions(clip, options, lines, indent + 1)
      }

      lines.push(`${indentStr}</asset-clip>`)
    }
  }

  private generateClipAdjustments(clip: TimelineClip, _options: ExportOptions, lines: string[], indent: number): void {
    const indentStr = "  ".repeat(indent)

    // Громкость
    if (clip.volume !== 1.0) {
      const volumeDb = this.volumeToDb(clip.volume)
      lines.push(`${indentStr}<adjust-volume amount="${volumeDb}db"/>`)
    }

    // Скорость
    if (clip.speed !== 1.0) {
      lines.push(`${indentStr}<timeMap>`)
      lines.push(`${indentStr}  <timept time="0s" value="0s" interp="smooth2"/>`)
      const endTime = this.secondsToFCPXMLDuration(clip.duration)
      const scaledDuration = this.secondsToFCPXMLDuration(clip.duration / clip.speed)
      lines.push(`${indentStr}  <timept time="${endTime}" value="${scaledDuration}" interp="smooth2"/>`)
      lines.push(`${indentStr}</timeMap>`)
    }

    // Непрозрачность
    if (clip.opacity !== 1.0) {
      lines.push(`${indentStr}<adjust-opacity amount="${(clip.opacity * 100).toFixed(0)}%"/>`)
    }
  }

  private generateClipEffects(clip: TimelineClip, _options: ExportOptions, lines: string[], indent: number): void {
    if (!clip.effects) return

    const indentStr = "  ".repeat(indent)

    for (const effect of clip.effects) {
      if (!effect.enabled) continue

      lines.push(
        `${indentStr}<filter-video ref="effect.${effect.effectId}" name="${this.escapeXml(effect.effectId)}"/>`,
      )
    }
  }

  private generateClipTransitions(clip: TimelineClip, _options: ExportOptions, lines: string[], indent: number): void {
    if (!clip.transitions) return

    const indentStr = "  ".repeat(indent)

    for (const transition of clip.transitions) {
      if (!transition.isEnabled) continue

      const duration = this.secondsToFCPXMLDuration(transition.duration)
      lines.push(
        `${indentStr}<transition-video name="${this.escapeXml(transition.transitionId)}" duration="${duration}"/>`,
      )
    }
  }

  private findAssetRef(_mediaFile: any): string {
    // В реальной реализации здесь должен быть поиск по ресурсам
    // Для упрощения возвращаем r2 (первый asset после format)
    return "r2"
  }

  private getTrackLane(track: Track): number {
    // FCPXML использует lane для разделения треков
    // 0 - основная дорожка (primary storyline)
    // Положительные - верхние дорожки
    // Отрицательные - нижние дорожки

    switch (track.type) {
      case "video":
        return track.order || 0
      case "audio":
      case "music":
      case "voiceover":
        return -(track.order || 1) // Аудио треки ниже основной дорожки
      default:
        return 0
    }
  }

  private calculateFrameDuration(frameRate: number): string {
    // Стандартные frame durations для разных fps
    const frameRateMappings: Record<number, string> = {
      23.976: "1001/24000s",
      24: "1/24s",
      25: "1/25s",
      29.97: "1001/30000s",
      30: "1/30s",
      50: "1/50s",
      59.94: "1001/60000s",
      60: "1/60s",
    }

    const closestFrameRate = Object.keys(frameRateMappings)
      .map(Number)
      .reduce((prev, curr) => (Math.abs(curr - frameRate) < Math.abs(prev - frameRate) ? curr : prev))

    return frameRateMappings[closestFrameRate] || `1/${frameRate}s`
  }

  private secondsToFCPXMLDuration(seconds: number): string {
    // Конвертируем секунды в FCPXML формат
    if (seconds === 0) return "0s"

    const frames = Math.round(seconds * this.frameRate)
    return `${frames}/${this.frameRate}s`
  }

  private volumeToDb(volume: number): number {
    // Конвертируем линейный volume в децибелы
    if (volume <= 0) return -96 // Минимум
    return Math.round(20 * Math.log10(volume))
  }

  private getRelativePath(absolutePath: string): string {
    // Упрощенная версия - возвращаем только имя файла
    // В реальной реализации нужно делать относительные пути
    return absolutePath.split("/").pop() || absolutePath
  }

  private escapeXml(str: string): string {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#x27;")
  }
}

/**
 * AAF (Advanced Authoring Format) Exporter
 *
 * Базовая поддержка экспорта в AAF XML формат
 * Примечание: Это упрощенная реализация AAF XML, не полный бинарный AAF
 */

import type { Timeline, TimelineClip, Track } from "../../../types"
import { MediaFileUtils } from "../../../types/media"
import type { Exporter, ExportOptions } from "../types"

export class AAFExporter implements Exporter {
  private frameRate = 30
  // private projectWidth: number | undefined
  // private projectHeight: number | undefined
  private mobIDCounter = 0

  async export(project: Timeline, options: ExportOptions): Promise<string> {
    this.frameRate = project.fps || 30
    // this.projectWidth = project.settings.resolution.width
    // this.projectHeight = project.settings.resolution.height
    this.mobIDCounter = 1

    const xml = this.generateAAFXML(project, options)
    return xml
  }

  getFileExtension(): string {
    return ".aaf"
  }

  getMimeType(): string {
    return "application/xml"
  }

  private generateAAFXML(project: Timeline, options: ExportOptions): string {
    const lines: string[] = []

    // XML Declaration
    lines.push('<?xml version="1.0" encoding="UTF-8"?>')
    lines.push("")

    // AAF Root
    lines.push("<AAF>")
    lines.push("  <Header>")
    lines.push("    <ToolkitVersion>Timeline Studio AAF Export 1.0</ToolkitVersion>")
    lines.push(`    <CreationDate>${new Date().toISOString()}</CreationDate>`)
    lines.push("  </Header>")
    lines.push("")

    // Dictionary (определения)
    lines.push("  <Dictionary>")
    lines.push("    <!-- Standard AAF definitions -->")
    lines.push("  </Dictionary>")
    lines.push("")

    // Content Storage
    lines.push("  <ContentStorage>")

    // Создаем CompositionMob для проекта
    this.generateCompositionMob(project, options, lines)

    // Создаем SourceMobs для медиафайлов
    this.generateSourceMobs(project, options, lines)

    lines.push("  </ContentStorage>")
    lines.push("")
    lines.push("</AAF>")

    return lines.join("\n")
  }

  private generateCompositionMob(project: Timeline, options: ExportOptions, lines: string[]): void {
    const compositionMobID = this.generateMobID()

    lines.push("    <CompositionMob>")
    lines.push(`      <MobID>${compositionMobID}</MobID>`)
    lines.push(`      <Name>${this.escapeXml(project.name)}</Name>`)
    lines.push(`      <CreateDate>${project.createdAt.toISOString()}</CreateDate>`)
    lines.push(`      <ModifyDate>${project.updatedAt.toISOString()}</ModifyDate>`)
    lines.push("")

    // Slots (треки)
    lines.push("      <Slots>")

    const allTracks = [...project.globalTracks, ...project.sections.flatMap((s) => s.tracks)]
    const sortedTracks = allTracks.sort((a, b) => (a.order ?? 0) - (b.order ?? 0))

    let slotID = 1
    for (const track of sortedTracks) {
      if (!options.includeDisabledClips && (track.isMuted || track.isHidden)) {
        continue
      }

      this.generateTimelineMobSlot(track, slotID++, options, lines)
    }

    lines.push("      </Slots>")
    lines.push("    </CompositionMob>")
    lines.push("")
  }

  private generateTimelineMobSlot(track: Track, slotID: number, options: ExportOptions, lines: string[]): void {
    lines.push("        <TimelineMobSlot>")
    lines.push(`          <SlotID>${slotID}</SlotID>`)
    lines.push(`          <TrackID>${slotID}</TrackID>`)
    lines.push(`          <TrackName>${this.escapeXml(track.name)}</TrackName>`)
    lines.push(`          <PhysicalTrackNumber>${slotID}</PhysicalTrackNumber>`)
    lines.push(`          <EditRate>${this.frameRate}/1</EditRate>`)
    lines.push("")

    // Segment (последовательность клипов)
    lines.push("          <Segment>")
    lines.push("            <Sequence>")
    lines.push(`              <DataDefinition>${this.getDataDefinition(track.type)}</DataDefinition>`)
    lines.push(`              <Length>${this.calculateTrackLength(track)}</Length>`)
    lines.push("")
    lines.push("              <Components>")

    // Сортируем клипы по времени
    const sortedClips = [...track.clips].sort((a, b) => a.startTime - b.startTime)

    let currentTime = 0
    for (const clip of sortedClips) {
      // Добавляем Filler если есть пробел
      if (clip.startTime > currentTime) {
        const gapDuration = clip.startTime - currentTime
        this.generateFiller(gapDuration, lines, 8)
        currentTime = clip.startTime
      }

      // Добавляем клип
      this.generateSourceClip(clip, options, lines, 8)
      currentTime = clip.startTime + clip.duration
    }

    lines.push("              </Components>")
    lines.push("            </Sequence>")
    lines.push("          </Segment>")
    lines.push("        </TimelineMobSlot>")
  }

  private generateSourceClip(clip: TimelineClip, options: ExportOptions, lines: string[], indent: number): void {
    const indentStr = "  ".repeat(indent)
    const sourceID = clip.mediaFile?.id || this.generateMobID()

    lines.push(`${indentStr}<SourceClip>`)
    lines.push(`${indentStr}  <Name>${this.escapeXml(clip.name)}</Name>`)
    lines.push(
      `${indentStr}  <DataDefinition>${clip.mediaFile && MediaFileUtils.isVideo(clip.mediaFile) ? "Picture" : "Sound"}</DataDefinition>`,
    )
    lines.push(`${indentStr}  <Length>${Math.round(clip.duration * this.frameRate)}</Length>`)
    lines.push(`${indentStr}  <SourceID>${sourceID}</SourceID>`)
    lines.push(`${indentStr}  <SourceTrackID>1</SourceTrackID>`)
    lines.push(`${indentStr}  <StartTime>${Math.round((clip.mediaStartTime || 0) * this.frameRate)}</StartTime>`)

    // Добавляем эффекты если указано
    if (options.includeEffects && clip.effects && clip.effects.length > 0) {
      lines.push(`${indentStr}  <Effects>`)
      for (const effect of clip.effects) {
        if (effect.enabled) {
          lines.push(`${indentStr}    <Effect name="${this.escapeXml(effect.effectId)}"/>`)
        }
      }
      lines.push(`${indentStr}  </Effects>`)
    }

    // Добавляем переходы если указано
    if (options.includeTransitions && clip.transitions && clip.transitions.length > 0) {
      lines.push(`${indentStr}  <Transitions>`)
      for (const transition of clip.transitions) {
        if (transition.isEnabled) {
          lines.push(
            `${indentStr}    <Transition type="${this.escapeXml(transition.transitionId)}" duration="${Math.round(transition.duration * this.frameRate)}"/>`,
          )
        }
      }
      lines.push(`${indentStr}  </Transitions>`)
    }

    lines.push(`${indentStr}</SourceClip>`)
  }

  private generateFiller(duration: number, lines: string[], indent: number): void {
    const indentStr = "  ".repeat(indent)
    const frames = Math.round(duration * this.frameRate)

    lines.push(`${indentStr}<Filler>`)
    lines.push(`${indentStr}  <DataDefinition>Unknown</DataDefinition>`)
    lines.push(`${indentStr}  <Length>${frames}</Length>`)
    lines.push(`${indentStr}</Filler>`)
  }

  private generateSourceMobs(project: Timeline, _options: ExportOptions, lines: string[]): void {
    const processedMedia = new Set<string>()

    // Собираем все уникальные медиафайлы
    const allTracks = [...project.globalTracks, ...project.sections.flatMap((s) => s.tracks)]

    for (const track of allTracks) {
      for (const clip of track.clips) {
        if (clip.mediaFile && !processedMedia.has(clip.mediaFile.id)) {
          processedMedia.add(clip.mediaFile.id)
          this.generateSourceMob(clip.mediaFile, lines)
        }
      }
    }
  }

  private generateSourceMob(mediaFile: any, lines: string[]): void {
    lines.push("    <SourceMob>")
    lines.push(`      <MobID>${mediaFile.id}</MobID>`)
    lines.push(`      <Name>${this.escapeXml(mediaFile.name)}</Name>`)
    lines.push(`      <CreateDate>${mediaFile.createdAt?.toISOString() || new Date().toISOString()}</CreateDate>`)
    lines.push("")

    // EssenceDescriptor
    lines.push("      <EssenceDescriptor>")
    lines.push(`        <Type>${mediaFile.hasVideo ? "FileDescriptor" : "WaveAudioDescriptor"}</Type>`)
    lines.push(`        <Locator>${this.escapeXml(mediaFile.path)}</Locator>`)

    if (mediaFile.hasVideo && mediaFile.width && mediaFile.height) {
      lines.push(`        <StoredWidth>${mediaFile.width}</StoredWidth>`)
      lines.push(`        <StoredHeight>${mediaFile.height}</StoredHeight>`)
      lines.push(`        <AspectRatio>${this.calculateAspectRatio(mediaFile.width, mediaFile.height)}</AspectRatio>`)
    }

    if (mediaFile.hasAudio) {
      lines.push("        <SampleRate>48000/1</SampleRate>")
      lines.push("        <AudioChannels>2</AudioChannels>")
    }

    lines.push("      </EssenceDescriptor>")
    lines.push("    </SourceMob>")
    lines.push("")
  }

  private calculateTrackLength(track: Track): number {
    if (track.clips.length === 0) return 0

    const lastClip = track.clips.reduce((latest, clip) => {
      const clipEnd = clip.startTime + clip.duration
      const latestEnd = latest.startTime + latest.duration
      return clipEnd > latestEnd ? clip : latest
    })

    return Math.round((lastClip.startTime + lastClip.duration) * this.frameRate)
  }

  private getDataDefinition(trackType: string): string {
    switch (trackType) {
      case "video":
        return "Picture"
      case "audio":
      case "music":
      case "voiceover":
      case "sfx":
      case "ambient":
        return "Sound"
      case "subtitle":
        return "Subtitle"
      default:
        return "Unknown"
    }
  }

  private generateMobID(): string {
    // Упрощенная генерация MobID
    const timestamp = Date.now().toString(16)
    const counter = (this.mobIDCounter++).toString(16).padStart(4, "0")
    return `urn:smpte:umid:060a2b34.01010101.01010f00.13000000.${timestamp}${counter}0000`
  }

  private calculateAspectRatio(width: number, height: number): string {
    const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b))
    const divisor = gcd(width, height)
    return `${width / divisor}:${height / divisor}`
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

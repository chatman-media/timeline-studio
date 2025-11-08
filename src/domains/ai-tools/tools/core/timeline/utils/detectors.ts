/**
 * Функции детектирования для Timeline AI инструментов
 */

import type { TimelineClip } from "@/features/timeline/types/timeline"

export function determineContentType(clip: TimelineClip): string {
  // Определение типа контента на основе метаданных

  // Приоритет: анализ реальных метаданных файла
  if (clip.mediaFile?.isVideo) {
    return "Video"
  }

  if (clip.mediaFile?.isAudio) {
    return "Audio"
  }

  // Анализ типа медиафайла
  if (clip.mediaFile?.isImage) {
    return "Image"
  }

  // Анализ расширения файла
  if (clip.name) {
    const extension = clip.name.split(".").pop()?.toLowerCase()
    switch (extension) {
      case "mp4":
      case "mov":
      case "avi":
      case "mkv":
      case "webm":
        return "Video"
      case "mp3":
      case "wav":
      case "aac":
      case "flac":
      case "ogg":
        return "Audio"
      case "jpg":
      case "jpeg":
      case "png":
      case "gif":
      case "webp":
        return "Image"
      default:
        break
    }
  }

  // Fallback: анализ по track ID
  if (clip.trackId.includes("video")) return "Video"
  if (clip.trackId.includes("audio")) return "Audio"
  if (clip.trackId.includes("music")) return "Music"
  if (clip.trackId.includes("image")) return "Image"

  return "Unknown"
}

export function getColorForContentType(contentType: string): string {
  const colors: Record<string, string> = {
    Video: "#3B82F6",
    Audio: "#10B981",
    Music: "#8B5CF6",
    Image: "#F59E0B",
    Unknown: "#6B7280",
  }
  return colors[contentType] || "#6B7280"
}

export function detectClipOverlaps(clips: TimelineClip[]): any[] {
  const overlaps: any[] = []

  // Группируем клипы по трекам
  const trackClips = new Map<string, TimelineClip[]>()

  clips.forEach((clip) => {
    if (!trackClips.has(clip.trackId)) {
      trackClips.set(clip.trackId, [])
    }
    trackClips.get(clip.trackId)!.push(clip)
  })

  // Проверяем перекрытия на каждом треке
  for (const [trackId, trackClipList] of Array.from(trackClips.entries())) {
    const sortedClips = trackClipList.sort((a, b) => a.startTime - b.startTime)

    for (let i = 0; i < sortedClips.length - 1; i++) {
      const clip1 = sortedClips[i]
      const clip2 = sortedClips[i + 1]

      if (clip1.startTime + clip1.duration > clip2.startTime) {
        overlaps.push({
          trackId,
          clipId: clip1.id,
          conflicts: [clip2.id],
          overlapDuration: clip1.startTime + clip1.duration - clip2.startTime,
        })
      }
    }
  }

  return overlaps
}

export function detectScenesBasic(clip: TimelineClip, sensitivity: string): any[] {
  // Базовая детекция сцен на основе длительности и предполагаемых изменений
  const scenes: any[] = []
  const { duration, startTime } = clip

  // Определяем минимальную длительность сцены в зависимости от чувствительности
  const minSceneDuration =
    {
      low: duration / 3,
      medium: duration / 5,
      high: duration / 10,
    }[sensitivity] || duration / 5

  // Создаем сцены на основе равномерного деления
  const numScenes = Math.max(1, Math.floor(duration / minSceneDuration))
  const sceneDuration = duration / numScenes

  for (let i = 0; i < numScenes; i++) {
    scenes.push({
      index: i,
      startTime: startTime + i * sceneDuration,
      endTime: startTime + (i + 1) * sceneDuration,
      duration: sceneDuration,
      type: i === 0 ? "opening" : i === numScenes - 1 ? "closing" : "middle",
      confidence: 0.7, // Базовая уверенность
    })
  }

  return scenes
}

export function detectMusicBeats(audioData: any, bpm?: number): number[] {
  // Простая симуляция детекции битов
  if (!bpm) {
    // Предполагаем стандартный BPM если не указан
    bpm = 120
  }

  const beatInterval = 60 / bpm // секунд на бит
  const beats: number[] = []
  const duration = audioData.duration || 60 // предполагаем 60 секунд если не указано

  for (let time = 0; time < duration; time += beatInterval) {
    beats.push(time)
  }

  return beats
}

export function detectKeyMoments(clips: TimelineClip[]): Array<{ time: number; type: string; confidence: number }> {
  const keyMoments: Array<{ time: number; type: string; confidence: number }> = []

  // Детекция начала и конца
  if (clips.length > 0) {
    keyMoments.push({
      time: 0,
      type: "start",
      confidence: 1.0,
    })

    const lastClip = clips[clips.length - 1]
    keyMoments.push({
      time: lastClip.startTime + lastClip.duration,
      type: "end",
      confidence: 1.0,
    })
  }

  // Детекция больших пауз между клипами
  for (let i = 1; i < clips.length; i++) {
    const prevEnd = clips[i - 1].startTime + clips[i - 1].duration
    const currentStart = clips[i].startTime
    const gap = currentStart - prevEnd

    if (gap > 2) {
      // Пауза больше 2 секунд
      keyMoments.push({
        time: prevEnd + gap / 2,
        type: "transition",
        confidence: 0.8,
      })
    }
  }

  // Детекция изменения типа контента
  for (let i = 1; i < clips.length; i++) {
    const prevType = determineContentType(clips[i - 1])
    const currentType = determineContentType(clips[i])

    if (prevType !== currentType) {
      keyMoments.push({
        time: clips[i].startTime,
        type: "content-change",
        confidence: 0.9,
      })
    }
  }

  return keyMoments.sort((a, b) => a.time - b.time)
}

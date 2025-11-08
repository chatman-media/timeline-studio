/**
 * Функции экспорта для Timeline AI инструментов
 */

import type { TimelineClip, TimelineProject } from "@/features/timeline/types/timeline"

import { escapeCsv, escapeXml, formatTimecode } from "./formatters"

export function exportAsJSON(project: TimelineProject, includeData: any): any {
  // Основные данные проекта
  const exportData: any = {
    project_info: {
      name: project.name,
      duration: project.duration,
      resolution: project.settings.resolution,
      fps: project.settings.fps,
      created_at: project.createdAt?.toISOString(),
      updated_at: project.updatedAt?.toISOString(),
    },
    sections: project.sections.map((section) => ({
      id: section.id,
      name: section.name,
      start_time: section.startTime,
      duration: section.duration,
      real_start_time: section.realStartTime?.toISOString(),
    })),
  }

  // Дополнительные данные
  if (includeData.includeTracks) {
    exportData.tracks = [...project.globalTracks, ...project.sections.flatMap((s) => s.tracks)].map((track) => ({
      id: track.id,
      name: track.name,
      type: track.type,
      clips_count: track.clips.length,
    }))
  }

  if (includeData.includeClips) {
    const allClips: TimelineClip[] = []
    project.globalTracks.forEach((track) => allClips.push(...track.clips))
    project.sections.forEach((section) => {
      section.tracks.forEach((track) => allClips.push(...track.clips))
    })

    exportData.clips = allClips.map((clip) => ({
      id: clip.id,
      name: clip.name,
      start_time: clip.startTime,
      duration: clip.duration,
      media_file: clip.mediaFile?.name,
      track_id: clip.trackId,
    }))
  }

  return exportData
}

export function exportAsXML(project: TimelineProject, includeData: any): string {
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n'
  xml += "<timeline_project>\n"

  // Информация о проекте
  xml += "  <project_info>\n"
  xml += `    <name>${escapeXml(project.name)}</name>\n`
  xml += `    <duration>${project.duration}</duration>\n`
  xml += `    <fps>${project.settings.fps}</fps>\n`
  xml += "  </project_info>\n"

  // Секции
  xml += "  <sections>\n"
  project.sections.forEach((section) => {
    xml += `    <section id="${section.id}">\n`
    xml += `      <name>${escapeXml(section.name)}</name>\n`
    xml += `      <start_time>${section.startTime}</start_time>\n`
    xml += `      <duration>${section.duration}</duration>\n`
    xml += "    </section>\n"
  })
  xml += "  </sections>\n"

  // Треки (если запрошено)
  if (includeData.includeTracks) {
    xml += "  <tracks>\n"
    const allTracks = [...project.globalTracks, ...project.sections.flatMap((s) => s.tracks)]
    allTracks.forEach((track) => {
      xml += `    <track id="${track.id}" type="${track.type}">\n`
      xml += `      <name>${escapeXml(track.name)}</name>\n`
      xml += `      <clips_count>${track.clips.length}</clips_count>\n`
      xml += "    </track>\n"
    })
    xml += "  </tracks>\n"
  }

  xml += "</timeline_project>"
  return xml
}

export function exportAsCSV(project: TimelineProject, includeData: any): string {
  let csv = ""

  if (includeData.includeClips) {
    // Экспорт клипов
    csv += "Clip ID,Name,Start Time,Duration,Track ID,Media File\n"

    const allClips: TimelineClip[] = []
    project.globalTracks.forEach((track) => allClips.push(...track.clips))
    project.sections.forEach((section) => {
      section.tracks.forEach((track) => allClips.push(...track.clips))
    })

    allClips.forEach((clip) => {
      csv += `${clip.id},"${escapeCsv(clip.name)}",${clip.startTime},${clip.duration},${clip.trackId},"${escapeCsv(clip.mediaFile?.name ?? "")}"\n`
    })
  } else {
    // Экспорт секций
    csv += "Section ID,Name,Start Time,Duration\n"
    project.sections.forEach((section) => {
      csv += `${section.id},"${escapeCsv(section.name)}",${section.startTime},${section.duration}\n`
    })
  }

  return csv
}

export function exportAsEDL(project: TimelineProject, _includeData: any): string {
  // EDL (Edit Decision List) формат
  let edl = `TITLE: ${project.name}\n`
  edl += "FCM: NON-DROP FRAME\n\n"

  let eventNumber = 1

  // Собираем все клипы и сортируем по времени
  const allClips: TimelineClip[] = []
  project.globalTracks.forEach((track) => allClips.push(...track.clips))
  project.sections.forEach((section) => {
    section.tracks.forEach((track) => allClips.push(...track.clips))
  })

  const sortedClips = allClips.sort((a, b) => a.startTime - b.startTime)

  sortedClips.forEach((clip) => {
    const sourceIn = formatTimecode(clip.mediaStartTime || 0, project.settings.fps)
    const sourceOut = formatTimecode((clip.mediaStartTime || 0) + clip.duration, project.settings.fps)
    const recordIn = formatTimecode(clip.startTime, project.settings.fps)
    const recordOut = formatTimecode(clip.startTime + clip.duration, project.settings.fps)

    edl += `${String(eventNumber).padStart(3, "0")}  ${clip.mediaFile?.name.substring(0, 8).toUpperCase().padEnd(8)} V     C        ${sourceIn} ${sourceOut} ${recordIn} ${recordOut}\n`
    eventNumber++
  })

  return edl
}

export function exportAsFCPXML(project: TimelineProject, _includeData: any): string {
  // Final Cut Pro XML формат
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n'
  xml += "<!DOCTYPE fcpxml>\n"
  xml += '<fcpxml version="1.10">\n'
  xml += "<resources>\n"

  // Медиа ресурсы
  const allClips: TimelineClip[] = []
  project.globalTracks.forEach((track) => allClips.push(...track.clips))
  project.sections.forEach((section) => {
    section.tracks.forEach((track) => allClips.push(...track.clips))
  })

  const uniqueMedia = new Map<string, TimelineClip>()
  allClips.forEach((clip) => {
    if (clip.mediaId && !uniqueMedia.has(clip.mediaId)) {
      uniqueMedia.set(clip.mediaId, clip)
    }
  })

  uniqueMedia.forEach((clip, mediaId) => {
    xml += `  <asset id="r${mediaId}" name="${escapeXml(clip.mediaFile?.name ?? "")}" src="file://${escapeXml(clip.mediaFile?.path ?? "")}">\n`
    xml += `    <media-rep kind="original-media" src="file://${escapeXml(clip.mediaFile?.path ?? "")}"/>\n`
    xml += "  </asset>\n"
  })

  xml += "</resources>\n"
  xml += "<library>\n"
  xml += `  <event name="${escapeXml(project.name)}">\n`
  xml += `    <project name="${escapeXml(project.name)}">\n`
  xml += `      <sequence format="r1" duration="${project.duration * project.settings.fps}/${project.settings.fps}s">\n`
  xml += "        <spine>\n"

  // Добавляем клипы
  const sortedClips = allClips.sort((a, b) => a.startTime - b.startTime)
  sortedClips.forEach((clip) => {
    const offset = `${Math.round(clip.startTime * project.settings.fps)}/${project.settings.fps}s`
    const duration = `${Math.round(clip.duration * project.settings.fps)}/${project.settings.fps}s`
    xml += `          <clip name="${escapeXml(clip.name)}" offset="${offset}" duration="${duration}">\n`
    xml += `            <asset-clip ref="r${clip.mediaId}" offset="0s" duration="${duration}"/>\n`
    xml += "          </clip>\n"
  })

  xml += "        </spine>\n"
  xml += "      </sequence>\n"
  xml += "    </project>\n"
  xml += "  </event>\n"
  xml += "</library>\n"
  xml += "</fcpxml>"

  return xml
}

export function exportAsDaVinciResolve(project: TimelineProject, _includeData: any): string {
  // DaVinci Resolve .drt формат (упрощенный)
  let drt = "# DaVinci Resolve Timeline Export\n"
  drt += `# Project: ${project.name}\n`
  drt += `# FPS: ${project.settings.fps}\n`
  drt += `# Resolution: ${project.settings.resolution.width}x${project.settings.resolution.height}\n\n`

  const allClips: TimelineClip[] = []
  project.globalTracks.forEach((track) => allClips.push(...track.clips))
  project.sections.forEach((section) => {
    section.tracks.forEach((track) => allClips.push(...track.clips))
  })

  const sortedClips = allClips.sort((a, b) => a.startTime - b.startTime)

  sortedClips.forEach((clip, index) => {
    drt += `Clip ${index + 1}:\n`
    drt += `  Name: ${clip.name}\n`
    drt += `  Start: ${formatTimecode(clip.startTime, project.settings.fps)}\n`
    drt += `  End: ${formatTimecode(clip.startTime + clip.duration, project.settings.fps)}\n`
    drt += `  Duration: ${formatTimecode(clip.duration, project.settings.fps)}\n`
    drt += `  Track: ${clip.trackId}\n`
    if (clip.mediaFile) {
      drt += `  Media: ${clip.mediaFile.name}\n`
    }
    drt += "\n"
  })

  return drt
}

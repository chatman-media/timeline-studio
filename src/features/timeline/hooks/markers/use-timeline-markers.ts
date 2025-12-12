import { useMemo } from "react"
import { useTimelineMarkers as useDomainTimelineMarkers } from "@/domains/video-editing"
import { createMarker, type ExtendedTimelineMarker, type MarkerType } from "../../types/markers"

export interface AddMarkerData {
  time: number
  name: string
  type: MarkerType
  color: string
  description?: string
  duration?: number
}

export interface UseTimelineMarkersReturn {
  markers: ExtendedTimelineMarker[]
  addMarker: (data: AddMarkerData) => void
  updateMarker: (markerId: string, updates: Partial<ExtendedTimelineMarker>) => void
  removeMarker: (markerId: string) => void
  goToMarker: (markerId: string) => void
  getMarkerTypes: () => MarkerType[]
  getMarkersByType: (type: MarkerType) => ExtendedTimelineMarker[]
  exportMarkers: (format: "edl" | "csv" | "json" | "fcpxml" | "srt") => string
}

/**
 * Хук для работы с маркерами timeline
 * Использует domain provider + добавляет export функциональность
 */
export function useTimelineMarkers(): UseTimelineMarkersReturn {
  // Используем domain provider для основных операций
  const domainMarkers = useDomainTimelineMarkers()

  // Преобразуем domain markers в feature markers с дополнительными полями
  const markers = useMemo(() => {
    return domainMarkers.markers.map((marker) => ({
      ...marker,
      isLocked: false,
    })) as ExtendedTimelineMarker[]
  }, [domainMarkers.markers])

  const addMarker = async (data: AddMarkerData) => {
    const marker = createMarker(data.time, data.name, data.type, data.description)

    // Устанавливаем пользовательский цвет если указан
    if (data.color) {
      marker.color = data.color
    }

    // Backend команда через domain provider
    await domainMarkers.addMarker({
      name: data.name,
      time: data.time,
      type: data.type,
      color: data.color,
      description: data.description,
    })
  }

  const updateMarker = async (markerId: string, updates: Partial<ExtendedTimelineMarker>) => {
    // Backend команда через domain provider
    await domainMarkers.updateMarker(markerId, updates)
  }

  const removeMarker = async (markerId: string) => {
    // Backend команда через domain provider
    await domainMarkers.removeMarker(markerId)
  }

  const goToMarker = (markerId: string) => {
    // Используем domain provider
    domainMarkers.goToMarker(markerId)
  }

  const getMarkerTypes = (): MarkerType[] => {
    const types = new Set<MarkerType>()
    markers.forEach((marker) => {
      if (marker.type) {
        types.add(marker.type)
      }
    })
    return Array.from(types)
  }

  const getMarkersByType = (type: MarkerType): ExtendedTimelineMarker[] => {
    return markers.filter((marker) => marker.type === type)
  }

  const exportMarkers = (format: "edl" | "csv" | "json" | "fcpxml" | "srt"): string => {
    switch (format) {
      case "edl":
        return exportToEDL(markers)
      case "csv":
        return exportToCSV(markers)
      case "json":
        return exportToJSON(markers)
      case "fcpxml":
        return exportToFCPXML(markers)
      case "srt":
        return exportToSRT(markers)
      default:
        throw new Error(`Unsupported export format: ${format}`)
    }
  }

  return {
    markers,
    addMarker,
    updateMarker,
    removeMarker,
    goToMarker,
    getMarkerTypes,
    getMarkersByType,
    exportMarkers,
  }
}

// Функции экспорта
function exportToEDL(markers: ExtendedTimelineMarker[]): string {
  let edl = "* MARKERS\n"

  markers.forEach((marker, index) => {
    const trackNumber = String(index + 1).padStart(3, "0")
    const clipNumber = "001"
    const track = "V"
    const transition = "C"

    const timeCode = formatTimeCode(marker.time)
    const endTimeCode = formatTimeCode(marker.time + 0.04) // 1 frame duration

    edl += `${trackNumber}  ${clipNumber}      ${track}     ${transition}        ${timeCode} ${endTimeCode} ${marker.name}\n`
  })

  return edl
}

function exportToCSV(markers: ExtendedTimelineMarker[]): string {
  let csv = "Name,Type,Time,Color\n"

  markers.forEach((marker) => {
    csv += `${marker.name},${marker.type},${marker.time},${marker.color}\n`
  })

  return csv
}

function exportToJSON(markers: ExtendedTimelineMarker[]): string {
  return JSON.stringify(
    {
      markers: markers.map((marker) => ({
        id: marker.id,
        name: marker.name,
        type: marker.type,
        time: marker.time,
        color: marker.color,
        description: marker.description,
        duration: marker.duration,
      })),
      exportedAt: new Date().toISOString(),
    },
    null,
    2,
  )
}

function exportToFCPXML(_markers: ExtendedTimelineMarker[]): string {
  const projectName = "Timeline Studio Project"

  const fcpxml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE fcpxml>
<fcpxml version="1.11">
  <resources>
    <format id="r1" name="FFVideoFormat1080p25" frameDuration="1001/25000s" width="1920" height="1080" colorSpace="1-1-1 (Rec. 709)"/>
  </resources>
  <library>
    <event name="${projectName}">
      <project name="${projectName}">
        <sequence duration="300s" format="r1" tcStart="0s" tcFormat="NDF" audioLayout="stereo" audioRate="48k">
          <spine>
            <clip name="Main" duration="300s" format="r1" tcStart="0s">
              <video>
                <gap name="Gap" duration="300s" start="0s"/>
              </video>
            </clip>
          </spine>
          <metadata>
            <md key="com.apple.proapps.spotlight.kMDItemTitle" value="${projectName}"/>
          </metadata>
        </sequence>
      </project>
    </event>
  </library>
</fcpxml>`

  // Простая версия без маркеров в spine - FCPXML сложен для полной реализации
  // В реальном проекте потребуется более полная реализация XML структуры
  return fcpxml
}

function exportToSRT(markers: ExtendedTimelineMarker[]): string {
  let srt = ""

  markers.forEach((marker, index) => {
    const startTime = formatSRTTime(marker.time)
    const endTime = formatSRTTime(marker.time + (marker.duration || 2)) // 2 секунды по умолчанию

    srt += `${index + 1}\n`
    srt += `${startTime} --> ${endTime}\n`
    srt += `${marker.name}\n`
    if (marker.description) {
      srt += `${marker.description}\n`
    }
    srt += "\n"
  })

  return srt
}

function formatSRTTime(timeInSeconds: number): string {
  const hours = Math.floor(timeInSeconds / 3600)
  const minutes = Math.floor((timeInSeconds % 3600) / 60)
  const seconds = Math.floor(timeInSeconds % 60)
  const milliseconds = Math.floor((timeInSeconds % 1) * 1000)

  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")},${milliseconds.toString().padStart(3, "0")}`
}

function formatTimeCode(timeInSeconds: number): string {
  const hours = Math.floor(timeInSeconds / 3600)
  const minutes = Math.floor((timeInSeconds % 3600) / 60)
  const seconds = Math.floor(timeInSeconds % 60)
  const frames = Math.floor((timeInSeconds % 1) * 25) // 25 FPS

  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}:${frames.toString().padStart(2, "0")}`
}

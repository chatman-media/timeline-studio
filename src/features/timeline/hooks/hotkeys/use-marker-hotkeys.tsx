import { useEffect } from "react"

import { shortcutsRegistry } from "@/features/keyboard-shortcuts"
import { useTimelineMarkers } from "../markers/use-timeline-markers"
import { useTimeline } from "../state/use-timeline"

export function useMarkerHotkeys() {
  const { currentTime, seek } = useTimeline()
  const { addMarker, removeMarker, markers } = useTimelineMarkers()

  // Получить маркер в указанное время
  const getMarkerAtTime = (time: number) => {
    return markers.find((marker) => Math.abs(marker.time - time) < 0.1)
  }

  // Перейти к следующему маркеру
  const goToNextMarker = () => {
    const nextMarker = markers.find((marker) => marker.time > currentTime)
    if (nextMarker) {
      void seek(nextMarker.time)
    }
  }

  // Перейти к предыдущему маркеру
  const goToPreviousMarker = () => {
    const sortedMarkers = [...markers].sort((a, b) => b.time - a.time)
    const prevMarker = sortedMarkers.find((marker) => marker.time < currentTime)
    if (prevMarker) {
      void seek(prevMarker.time)
    }
  }

  // Перейти к следующему маркеру главы
  const goToNextChapterMarker = () => {
    const nextChapter = markers.find((marker) => marker.time > currentTime && marker.type === "chapter")
    if (nextChapter) {
      void seek(nextChapter.time)
    } else {
      // Fallback to next marker
      goToNextMarker()
    }
  }

  // Перейти к предыдущему маркеру главы
  const goToPreviousChapterMarker = () => {
    const sortedMarkers = [...markers].sort((a, b) => b.time - a.time)
    const prevChapter = sortedMarkers.find((marker) => marker.time < currentTime && marker.type === "chapter")
    if (prevChapter) {
      void seek(prevChapter.time)
    } else {
      // Fallback to previous marker
      goToPreviousMarker()
    }
  }

  // Register keyboard shortcuts for marker operations
  useEffect(() => {
    const shortcuts = [
      {
        id: "add-marker",
        action: () => {
          const markerName = `Marker ${new Date().toLocaleTimeString()}`
          addMarker({
            time: currentTime,
            name: markerName,
            type: "note",
            color: "#3b82f6",
          })
        },
      },
      {
        id: "add-chapter-marker",
        action: () => {
          const markerName = `Chapter ${new Date().toLocaleTimeString()}`
          addMarker({
            time: currentTime,
            name: markerName,
            type: "chapter",
            color: "#10b981",
          })
        },
      },
      {
        id: "add-export-marker",
        action: () => {
          const markerName = `Export ${new Date().toLocaleTimeString()}`
          addMarker({
            time: currentTime,
            name: markerName,
            type: "export",
            color: "#f59e0b",
          })
        },
      },
      {
        id: "delete-marker",
        action: () => {
          const marker = getMarkerAtTime(currentTime)
          if (marker && !marker.isLocked) {
            removeMarker(marker.id)
          }
        },
      },
      {
        id: "next-marker",
        action: () => goToNextMarker(),
      },
      {
        id: "previous-marker",
        action: () => goToPreviousMarker(),
      },
      {
        id: "next-chapter-marker",
        action: () => goToNextChapterMarker(),
      },
      {
        id: "previous-chapter-marker",
        action: () => goToPreviousChapterMarker(),
      },
    ]

    // Регистрируем все shortcuts
    shortcuts.forEach(({ id, action }) => {
      shortcutsRegistry.updateAction(id, action)
    })

    // Очищаем actions при размонтировании
    return () => {
      shortcuts.forEach(({ id }) => {
        shortcutsRegistry.updateAction(id, undefined)
      })
    }
  }, [
    currentTime,
    addMarker,
    removeMarker,
    getMarkerAtTime,
    goToNextMarker,
    goToPreviousMarker,
    goToNextChapterMarker,
    goToPreviousChapterMarker,
  ])
}

/**
 * Filter Drag & Drop Integration Hook
 *
 * Provides drag and drop functionality for filters onto timeline clips
 */

import { useCallback } from "react"

import type { VideoFilter } from "../types/filters"
import { useFilterTimelineIntegration } from "./use-filter-timeline-integration"

interface UseFilterDragDropReturn {
  /**
   * Handle drag start for a filter
   */
  onFilterDragStart: (filter: VideoFilter, event: React.DragEvent) => void

  /**
   * Handle drag end
   */
  onFilterDragEnd: (event: React.DragEvent) => void

  /**
   * Handle drop on a clip
   */
  onClipDrop: (clipId: string, event: React.DragEvent) => void

  /**
   * Check if a drag event contains filter data
   */
  isFilterDrag: (event: React.DragEvent) => boolean
}

/**
 * Hook for drag and drop integration of filters with timeline
 *
 * This hook provides drag and drop functionality to apply filters to clips.
 * It integrates with the timeline-machine drag state.
 *
 * Usage:
 * ```tsx
 * const { onFilterDragStart, onClipDrop } = useFilterDragDrop()
 *
 * // In filter preview component:
 * <div draggable onDragStart={(e) => onFilterDragStart(filter, e)}>
 *
 * // In clip component:
 * <div onDrop={(e) => onClipDrop(clipId, e)}>
 * ```
 */
export function useFilterDragDrop(): UseFilterDragDropReturn {
  const { applyFilterToClip } = useFilterTimelineIntegration()

  /**
   * Handle filter drag start
   */
  const onFilterDragStart = useCallback((filter: VideoFilter, event: React.DragEvent) => {
    // Set drag data
    event.dataTransfer.effectAllowed = "copy"
    event.dataTransfer.setData("application/filter", JSON.stringify(filter))
    event.dataTransfer.setData("text/plain", filter.name)

    // Set drag image (optional - could use filter preview)
    // const dragImage = event.currentTarget.cloneNode(true) as HTMLElement
    // event.dataTransfer.setDragImage(dragImage, 0, 0)

    console.info("[Filter Drag Drop] Drag start", {
      filterId: filter.id,
      filterName: filter.name,
    })
  }, [])

  /**
   * Handle filter drag end
   */
  const onFilterDragEnd = useCallback((event: React.DragEvent) => {
    // Clean up drag state
    console.info("[Filter Drag Drop] Drag end", {
      dropEffect: event.dataTransfer.dropEffect,
    })
  }, [])

  /**
   * Check if drag event contains filter data
   */
  const isFilterDrag = useCallback((event: React.DragEvent): boolean => {
    return event.dataTransfer.types.includes("application/filter")
  }, [])

  /**
   * Handle drop on a clip
   */
  const onClipDrop = useCallback(
    (clipId: string, event: React.DragEvent) => {
      event.preventDefault()
      event.stopPropagation()

      // Check if this is a filter drag
      if (!isFilterDrag(event)) {
        return
      }

      // Get filter data
      const filterData = event.dataTransfer.getData("application/filter")
      if (!filterData) {
        console.warn("[Filter Drag Drop] No filter data in drop event")
        return
      }

      try {
        const filter = JSON.parse(filterData) as VideoFilter

        // Apply filter to clip
        const appliedFilter = applyFilterToClip(clipId, filter)

        console.info("[Filter Drag Drop] Filter applied via drag & drop", {
          clipId,
          filterId: filter.id,
          filterName: filter.name,
          appliedFilterId: appliedFilter.id,
        })

        // Show success feedback (could emit event for toast notification)
        // toast.success(`${filter.name} applied to clip`)
      } catch (error) {
        console.error("[Filter Drag Drop] Failed to parse filter data", error)
      }
    },
    [isFilterDrag, applyFilterToClip],
  )

  return {
    onFilterDragStart,
    onFilterDragEnd,
    onClipDrop,
    isFilterDrag,
  }
}

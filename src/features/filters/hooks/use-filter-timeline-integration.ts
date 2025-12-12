/**
 * Timeline Integration Hook for Filters
 *
 * Provides functionality to apply filters to timeline clips
 */

import { useCallback, useRef } from "react"

import { useClips } from "@/features/timeline/hooks/use-clips"
import { useTimeline } from "@/features/timeline/hooks/use-timeline"
import type { AppliedFilter } from "@/features/timeline/types"
import type { VideoFilter } from "../types/filters"

interface UseFilterTimelineIntegrationReturn {
  /**
   * Apply a filter to a clip on the timeline
   */
  applyFilterToClip: (clipId: string, filter: VideoFilter, customParams?: Record<string, any>) => AppliedFilter

  /**
   * Remove a filter from a clip
   */
  removeFilterFromClip: (clipId: string, filterId: string) => void

  /**
   * Update filter parameters on a clip
   */
  updateFilterParams: (clipId: string, filterId: string, params: Record<string, any>) => void

  /**
   * Get all filters applied to a clip
   */
  getClipFilters: (clipId: string) => AppliedFilter[]

  /**
   * Create AppliedFilter from VideoFilter
   */
  createAppliedFilter: (filter: VideoFilter, customParams?: Record<string, any>) => AppliedFilter
}

/**
 * Hook for integrating filters with timeline clips
 *
 * This hook provides methods to apply, remove, and manage filters on timeline clips.
 * It works with the timeline-machine to update clip state.
 */
export function useFilterTimelineIntegration(): UseFilterTimelineIntegrationReturn {
  const { updateClip } = useTimeline()
  const { findClip } = useClips()

  // Counter for generating unique IDs
  const counterRef = useRef(0)

  /**
   * Get all filters applied to a specific clip
   */
  const getClipFilters = useCallback(
    (clipId: string): AppliedFilter[] => {
      const clip = findClip(clipId)
      return clip?.filters || []
    },
    [findClip],
  )

  /**
   * Create an AppliedFilter instance from a VideoFilter
   */
  const createAppliedFilter = useCallback((filter: VideoFilter, customParams?: Record<string, any>): AppliedFilter => {
    counterRef.current += 1
    return {
      id: `applied-${filter.id}-${Date.now()}-${counterRef.current}`,
      filterId: filter.id,
      customParams: customParams || filter.params,
      isEnabled: true,
      order: 0, // Will be set based on existing filters
    }
  }, [])

  /**
   * Apply a filter to a timeline clip
   *
   * @param clipId - ID of the clip to apply filter to
   * @param filter - The filter to apply
   * @param customParams - Optional custom parameters to override filter defaults
   * @returns The created AppliedFilter instance
   */
  const applyFilterToClip = useCallback(
    (clipId: string, filter: VideoFilter, customParams?: Record<string, any>): AppliedFilter => {
      const appliedFilter = createAppliedFilter(filter, customParams)

      // Get current clip filters
      const currentFilters = getClipFilters(clipId)

      // Add new filter to the clip
      updateClip(clipId, {
        filters: [...currentFilters, appliedFilter],
      }).catch((error) => {
        console.error("[Filter Timeline Integration] Failed to apply filter:", error)
      })

      console.info("[Filter Timeline Integration] Applied filter to clip", {
        clipId,
        filterId: filter.id,
        filterName: filter.name,
        appliedFilterId: appliedFilter.id,
      })

      return appliedFilter
    },
    [createAppliedFilter, updateClip, getClipFilters],
  )

  /**
   * Remove a filter from a timeline clip
   */
  const removeFilterFromClip = useCallback(
    (clipId: string, filterId: string) => {
      const currentFilters = getClipFilters(clipId)
      const updatedFilters = currentFilters.filter((f) => f.id !== filterId)

      updateClip(clipId, {
        filters: updatedFilters,
      }).catch((error) => {
        console.error("[Filter Timeline Integration] Failed to remove filter:", error)
      })

      console.info("[Filter Timeline Integration] Removed filter from clip", {
        clipId,
        filterId,
      })
    },
    [updateClip, getClipFilters],
  )

  /**
   * Update filter parameters on a clip
   */
  const updateFilterParams = useCallback(
    (clipId: string, filterId: string, params: Record<string, any>) => {
      const currentFilters = getClipFilters(clipId)
      const updatedFilters = currentFilters.map((f) =>
        f.id === filterId
          ? {
              ...f,
              customParams: { ...f.customParams, ...params },
            }
          : f,
      )

      updateClip(clipId, {
        filters: updatedFilters,
      }).catch((error) => {
        console.error("[Filter Timeline Integration] Failed to update filter params:", error)
      })

      console.info("[Filter Timeline Integration] Updated filter params", {
        clipId,
        filterId,
        params,
      })
    },
    [updateClip, getClipFilters],
  )

  return {
    applyFilterToClip,
    removeFilterFromClip,
    updateFilterParams,
    getClipFilters,
    createAppliedFilter,
  }
}

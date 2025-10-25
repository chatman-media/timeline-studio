/**
 * Main hook for Timeline drag and drop functionality
 */

import type { DragEndEvent, DragOverEvent, DragStartEvent } from "@dnd-kit/core"
import { useCallback, useState } from "react"
import { handleInterModuleDrag, isInterModuleDrag } from "../services/drag-drop-bridge"
import type { TrackType } from "../types"
import type { DragData, DragState } from "../types/drag-drop"
import type { SnapPoint } from "../types/edit-modes"
import {
  calculateTimelinePosition,
  canDropOnTrack,
  findInsertionPoint,
  getTrackTypeForMediaFile,
  snapToGrid,
} from "../utils/drag-calculations"
import { useTimeline } from "./use-timeline"
import { useTimelineActions } from "./use-timeline-actions"

export interface UseDragDropTimelineReturn {
  dragState: DragState
  handleDragStart: (event: DragStartEvent) => void
  handleDragOver: (event: DragOverEvent) => void
  handleDragEnd: (event: DragEndEvent) => void
  isValidDropTarget: (trackId: string, trackType: string) => boolean
  isValidDropTargetForNewTrack: (expectedTrackType?: TrackType) => boolean
}

export function useDragDropTimeline(): UseDragDropTimelineReturn {
  const uiState = { timeScale: 50, snapMode: "grid" as const } // Temporary fallback
  const { addSingleMediaToTimeline, addMediaToTimeline } = useTimelineActions()
  const { addTrack } = useTimeline()

  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    draggedItem: null,
    dragOverTrack: null,
    dropPosition: null,
    snapPoint: null,
    snapActive: false,
  })

  // Handle drag start
  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event

    // Обработка перетаскивания ресурсов
    if (active.data.current?.type?.startsWith("drag-")) {
      const resourceType = active.data.current.type.replace("drag-", "")
      const resource = active.data.current.resource

      setDragState({
        isDragging: true,
        draggedItem: null,
        dragOverTrack: null,
        dropPosition: null,
        draggedResourceType: resourceType,
        draggedResource: resource,
      })

      console.log(`[DragDrop] Started dragging ${resourceType}:`, resource.name)
      return
    }

    const dragData = active.data.current as DragData | undefined

    if (dragData) {
      // Определяем количество файлов для multi-select визуализации
      const draggedCount = dragData.isMultiSelect && dragData.selectedFiles ? dragData.selectedFiles.length : 1

      setDragState({
        isDragging: true,
        draggedItem: dragData,
        dragOverTrack: null,
        dropPosition: null,
        draggedCount,
      })

      console.log(
        "[DragDrop] Drag started:",
        dragData.isMultiSelect ? `${draggedCount} files (multi-select)` : dragData.mediaFile.name,
      )
    }
  }, [])

  // Handle drag over (for visual feedback)
  const handleDragOver = useCallback(
    (event: DragOverEvent) => {
      const { active, over } = event

      if (!over || !dragState.draggedItem) {
        setDragState((prev) => ({
          ...prev,
          dragOverTrack: null,
          dropPosition: null,
          snapPoint: null,
          snapActive: false,
        }))
        return
      }

      const dragData = active.data.current as DragData
      const dropData = over.data.current as any

      if (!dropData || !dragData) {
        return
      }

      // Handle track insertion zones
      if (dropData.type === "track-insertion") {
        const expectedTrackType = getTrackTypeForMediaFile(dragData.mediaFile)
        setDragState((prev) => ({
          ...prev,
          dragOverTrack: null,
          dropPosition: {
            type: "track-insertion",
            insertIndex: dropData.insertIndex,
            trackType: expectedTrackType,
            startTime: 0,
          } as any,
        }))
        return
      }

      // Handle transition drop zones
      if (dropData.type === "transition-drop") {
        // For transition drops, we don't need to calculate position
        setDragState((prev) => ({
          ...prev,
          dragOverTrack: dropData.trackId,
          dropPosition: {
            type: "transition",
            leftClipId: dropData.leftClipId,
            rightClipId: dropData.rightClipId,
            trackId: dropData.trackId,
          } as any,
        }))
        return
      }

      // Handle existing track drops
      if (dropData.trackId && dropData.trackType) {
        // Check if this is a valid drop target
        const isValid = canDropOnTrack(dragData.mediaFile, dropData.trackType)

        if (isValid) {
          // Calculate drop position based on mouse position
          const mouseX = (event.activatorEvent as MouseEvent).clientX
          const trackElement = document.querySelector(`[data-track-id="${dropData.trackId}"]`)

          if (trackElement) {
            const rect = trackElement.getBoundingClientRect()
            const scrollLeft = trackElement.scrollLeft || 0

            let timePosition = calculateTimelinePosition(mouseX, rect, scrollLeft, uiState.timeScale)

            // Apply snapping if enabled
            const originalPosition = timePosition
            timePosition = snapToGrid(timePosition, uiState.snapMode)

            // Создаем SnapPoint если произошел snap
            let snapPoint: SnapPoint | null = null
            const snapActive = Math.abs(originalPosition - timePosition) > 0.1

            if (snapActive) {
              snapPoint = {
                position: timePosition * uiState.timeScale,
                type: "grid",
                strength: 1,
              }
            }

            // Find insertion point (avoiding overlaps)
            const insertionTime = findInsertionPoint(timePosition, dropData.trackId, dragData.mediaFile.duration || 10)

            setDragState((prev) => ({
              ...prev,
              dragOverTrack: dropData.trackId,
              dropPosition: {
                trackId: dropData.trackId,
                startTime: insertionTime.insertionTime,
              },
              snapPoint,
              snapActive,
            }))
          }
        } else {
          setDragState((prev) => ({
            ...prev,
            dragOverTrack: null,
            dropPosition: null,
            snapPoint: null,
            snapActive: false,
          }))
        }
      }
    },
    [dragState.draggedItem, uiState.timeScale, uiState.snapMode],
  )

  // Handle drag end (actual drop)
  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event

      // Сначала проверяем межмодульный drag & drop через bridge
      if (isInterModuleDrag(event)) {
        const bridgeHandled = handleInterModuleDrag(
          event,
          {
            addSingleMediaToTimeline,
            addMediaToTimeline,
          },
          { dropPosition: dragState.dropPosition ? { startTime: dragState.dropPosition.startTime } : undefined },
        )
        if (bridgeHandled) {
          console.log("[DragDrop] Inter-module drag handled by bridge")
          // Сбрасываем состояние
          setDragState({
            isDragging: false,
            draggedItem: null,
            dragOverTrack: null,
            dropPosition: null,
            snapPoint: null,
            snapActive: false,
          })
          return
        }
      }

      // Обычный внутренний Timeline drag & drop
      if (over && dragState.draggedItem && dragState.dropPosition) {
        const dragData = active.data.current as DragData
        const dropData = over.data.current as any

        if (dropData && dragData) {
          // Handle track insertion (create new track)
          if (dropData.type === "track-insertion") {
            const trackType = getTrackTypeForMediaFile(dragData.mediaFile)
            const trackName = `${trackType.charAt(0).toUpperCase() + trackType.slice(1)} Track`

            console.log("[DragDrop] Creating new track:", trackName, "for media:", dragData.mediaFile.name)

            // Create new track and add media to it
            void addTrack(trackType as any, trackName)

            // TODO: We need to get the newly created track ID to add the media
            // For now, we'll add it to the first compatible track
            // This needs to be improved with proper track creation callback
            setTimeout(() => {
              addSingleMediaToTimeline(dragData.mediaFile, undefined, 0)
            }, 100)
          } else if (dropData.type === "transition-drop" && dragState.dropPosition?.type === "transition") {
            // Handle transition drop
            console.log(
              "[DragDrop] Dropping transition between clips:",
              dragState.dropPosition.leftClipId,
              dragState.dropPosition.rightClipId,
            )

            // The actual transition application is handled by the TransitionDropZone component
            // through its onDrop callback
          } else if (dropData.type === "clip-drop" && dragState.draggedResourceType) {
            // Handle resource drop on clip
            console.log("[DragDrop] Dropping", dragState.draggedResourceType, "on clip:", dropData.clipId)

            // The actual resource application is handled by the ClipDropZone component
            // Resources are applied through TimelineEffectsProvider
          } else if (dropData.trackId && dropData.trackType) {
            // Handle existing track drop
            const isValid = canDropOnTrack(dragData.mediaFile, dropData.trackType)

            if (isValid) {
              console.log(
                "[DragDrop] Dropping media:",
                dragData.mediaFile.name,
                "on track:",
                dropData.trackId,
                "at time:",
                dragState.dropPosition.startTime,
              )

              // Use enhanced timeline action with custom positioning
              addSingleMediaToTimeline(
                dragData.mediaFile,
                dragState.dropPosition.trackId,
                dragState.dropPosition.startTime,
              )
            }
          }
        }
      }

      // Reset drag state
      setDragState({
        isDragging: false,
        draggedItem: null,
        dragOverTrack: null,
        dropPosition: null,
        snapPoint: null,
        snapActive: false,
      })

      console.log("[DragDrop] Drag ended")
    },
    [dragState.draggedItem, dragState.dropPosition, addSingleMediaToTimeline, addTrack],
  )

  // Check if a track is a valid drop target for the current drag
  const isValidDropTarget = useCallback(
    (_trackId: string, trackType: string) => {
      if (!dragState.isDragging || !dragState.draggedItem) {
        return false
      }

      return canDropOnTrack(dragState.draggedItem.mediaFile, trackType as any)
    },
    [dragState.isDragging, dragState.draggedItem],
  )

  // Check if a track insertion zone is valid for the current drag
  const isValidDropTargetForNewTrack = useCallback(
    (expectedTrackType?: TrackType) => {
      if (!dragState.isDragging || !dragState.draggedItem) {
        return false
      }

      const requiredTrackType = getTrackTypeForMediaFile(dragState.draggedItem.mediaFile)

      // If no expected track type is specified, any media can create a new track
      if (!expectedTrackType) {
        return true
      }

      // Check if the expected track type matches what the media file requires
      return requiredTrackType === expectedTrackType
    },
    [dragState.isDragging, dragState.draggedItem],
  )

  return {
    dragState,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    isValidDropTarget,
    isValidDropTargetForNewTrack,
  }
}

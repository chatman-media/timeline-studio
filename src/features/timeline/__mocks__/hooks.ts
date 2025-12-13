import React from "react"

import { vi } from "vitest"
import type { TimelineClip, TimelineProject } from "../types"
import { mockTimelineService } from "./services"

// Mock useTimeline hook
export const mockUseTimeline = vi.fn(() => ({
  project: mockTimelineService.getProject(),
  uiState: {
    timeScale: 10,
    selectedClipIds: [],
    selectedTrackIds: [],
    selectedSectionIds: [],
  },
  currentTime: 0,
  loading: false,
  error: null,
  send: vi.fn(),

  // Project actions
  createNewProject: vi.fn((name?: string) => mockTimelineService.createProject(name)),
  saveProject: vi.fn((project: TimelineProject) => mockTimelineService.saveProject(project)),
  loadProject: vi.fn((path: string) => mockTimelineService.loadProject(path)),

  // Section actions
  addSection: vi.fn((name: string, startTime: number, duration: number) =>
    mockTimelineService.addSection(name, startTime, duration),
  ),

  // Track actions
  addTrack: vi.fn((type: "video" | "audio", sectionId?: string, index?: number) =>
    mockTimelineService.addTrack(type, sectionId, index),
  ),
  removeTrack: vi.fn((trackId: string) => mockTimelineService.removeTrack(trackId)),

  // Clip actions
  addClip: vi.fn((trackId: string, mediaFile: any, position?: number) =>
    mockTimelineService.addClip(trackId, mediaFile, position),
  ),
  removeClip: vi.fn((trackId: string, clipId: string) => mockTimelineService.removeClip(trackId, clipId)),
  moveClip: vi.fn((trackId: string, clipId: string, newStartTime: number) =>
    mockTimelineService.moveClip(trackId, clipId, newStartTime),
  ),
}))

// Mock useTimelineSelection hook
export const mockUseTimelineSelection = vi.fn(() => ({
  selectedClips: [] as string[],
  selectedTracks: [] as string[],

  selectClip: vi.fn((_clipId: string, _multi?: boolean) => {}),
  selectTrack: vi.fn((_trackId: string, _multi?: boolean) => {}),
  clearSelection: vi.fn(),

  isClipSelected: vi.fn((_clipId: string) => false),
  isTrackSelected: vi.fn((_trackId: string) => false),
}))

// Mock useTimelinePlayback hook
export const mockUseTimelinePlayback = vi.fn(() => ({
  currentTime: 0,
  duration: mockTimelineService.getProject().duration,
  isPlaying: false,

  play: vi.fn(),
  pause: vi.fn(),
  seek: vi.fn((_time: number) => {}),

  frameRate: 30,
  nextFrame: vi.fn(),
  previousFrame: vi.fn(),
}))

// Mock useTimelineZoom hook
export const mockUseTimelineZoom = vi.fn(() => ({
  scale: 1,
  minScale: 0.1,
  maxScale: 10,

  zoomIn: vi.fn(),
  zoomOut: vi.fn(),
  zoomToFit: vi.fn(),
  setScale: vi.fn((_scale: number) => {}),
}))

// Mock useTimelineUndo hook
export const mockUseTimelineUndo = vi.fn(() => ({
  canUndo: false,
  canRedo: false,

  undo: vi.fn(),
  redo: vi.fn(),

  history: [] as any[],
  historyIndex: -1,
}))

// Mock useClips hook
export const mockUseClips = vi.fn(() => ({
  clips: [] as TimelineClip[],

  getClipById: vi.fn((_clipId: string) => undefined),
  getClipsInRange: vi.fn((_startTime: number, _endTime: number) => []),
  getClipsOnTrack: vi.fn((_trackId: string) => []),

  splitClip: vi.fn((_clipId: string, _time: number) => {}),
  trimClip: vi.fn((_clipId: string, _start: number, _end: number) => {}),

  applyEffect: vi.fn((_clipId: string, _effect: any) => {}),
  removeEffect: vi.fn((_clipId: string, _effectId: string) => {}),
}))

// Mock useTracks hook
export const mockUseTracks = vi.fn(() => ({
  tracks: mockTimelineService.getAllTracks(),

  getTrackById: vi.fn((trackId: string) => mockTimelineService.getTrack(trackId)),
  getTracksByType: vi.fn((type: "video" | "audio") =>
    mockTimelineService.getAllTracks().filter((t) => t.type === type),
  ),

  reorderTracks: vi.fn((_fromIndex: number, _toIndex: number) => {}),
  toggleTrackMute: vi.fn((_trackId: string) => {}),
  toggleTrackLock: vi.fn((_trackId: string) => {}),

  setTrackHeight: vi.fn((_trackId: string, _height: number) => {}),
}))

// Mock useDragDropTimeline hook
export const mockUseDragDropTimeline = vi.fn(() => ({
  dragState: {
    isDragging: false,
    draggedItem: null,
    dragOverTrack: null,
    dropPosition: null,
  },
  handleDragStart: vi.fn(),
  handleDragOver: vi.fn(),
  handleDragEnd: vi.fn(),
  isValidDropTarget: vi.fn(() => false),
  isValidDropTargetForNewTrack: vi.fn(() => false),
}))

// Mock useEditModeContext hook
export const mockUseEditModeContext = vi.fn(() => ({
  editMode: "select",
  setEditMode: vi.fn(),
  isEditMode: vi.fn((mode: string) => mode === "select"),
}))

// Mock useClipEditing hook
export const mockUseClipEditing = vi.fn(() => ({
  isEditing: false,
  preview: null,
  handleTrimStart: vi.fn(),
  handleTrimMove: vi.fn(),
  handleTrimEnd: vi.fn(),
  handleSplit: vi.fn(),
  clip: null,
  track: null,
}))

// Export all mocks for easy importing
export const timelineHookMocks = {
  useTimeline: mockUseTimeline,
  useTimelineSelection: mockUseTimelineSelection,
  useTimelinePlayback: mockUseTimelinePlayback,
  useTimelineZoom: mockUseTimelineZoom,
  useTimelineUndo: mockUseTimelineUndo,
  useClips: mockUseClips,
  useTracks: mockUseTracks,
  useDragDropTimeline: mockUseDragDropTimeline,
  useEditModeContext: mockUseEditModeContext,
  useClipEditing: mockUseClipEditing,
}

// Set up vi.mock calls - updated paths after hooks reorganization
vi.mock("../hooks/state/use-timeline", () => ({
  useTimeline: mockUseTimeline,
}))

vi.mock("../hooks/state/use-timeline-selection", () => ({
  useTimelineSelection: mockUseTimelineSelection,
}))

vi.mock("../hooks/state/use-timeline-playback", () => ({
  useTimelinePlayback: mockUseTimelinePlayback,
}))

vi.mock("../hooks/state/use-timeline-zoom", () => ({
  useTimelineZoom: mockUseTimelineZoom,
}))

vi.mock("../hooks/state/use-timeline-undo", () => ({
  useTimelineUndo: mockUseTimelineUndo,
}))

vi.mock("../hooks/clips/use-clips", () => ({
  useClips: mockUseClips,
}))

vi.mock("../hooks/state/use-tracks", () => ({
  useTracks: mockUseTracks,
}))

vi.mock("../hooks/drag-drop/use-drag-drop-timeline", () => ({
  useDragDropTimeline: mockUseDragDropTimeline,
}))

vi.mock("../hooks/editing/use-edit-mode", () => ({
  useEditModeContext: mockUseEditModeContext,
  EditModeProvider: ({ children }: { children: React.ReactNode }) => children,
}))

// Mock TimelineProvider - use a simple passthrough that doesn't cause re-renders
export const MockTimelineProvider = ({ children }: { children: React.ReactNode }) => {
  // Create a stable mock context value that doesn't change between renders
  const mockContext = React.useMemo(
    () => ({
      project: mockTimelineService.getProject(),
      uiState: {
        timeScale: 10,
        selectedClipIds: [],
        selectedTrackIds: [],
        selectedSectionIds: [],
      },
      currentTime: 0,
      loading: false,
      error: null,
      send: vi.fn(),
      createNewProject: vi.fn(),
      saveProject: vi.fn(),
      loadProject: vi.fn(),
      addSection: vi.fn(),
      addTrack: vi.fn(),
      removeTrack: vi.fn(),
      addClip: vi.fn(),
      removeClip: vi.fn(),
      moveClip: vi.fn(),
    }),
    [],
  )

  return React.createElement("div", { "data-testid": "mock-timeline-provider" }, children)
}

vi.mock("../services/timeline-provider", () => ({
  TimelineProvider: MockTimelineProvider,
  useTimeline: mockUseTimeline,
}))

vi.mock("../hooks/use-clip-editing", () => ({
  useClipEditing: mockUseClipEditing,
}))

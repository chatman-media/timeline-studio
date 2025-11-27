import { renderHook } from "@testing-library/react"
import type React from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import type { MediaItem } from "@/types/generated/tauri-bindings"

import { useMediaFiles } from "../../hooks/use-media-files"
import { AppProvider } from "../../services/app-provider"

const mockMediaFiles: MediaItem[] = [
  {
    id: "file1",
    path: "/path/to/video1.mp4",
    name: "video1.mp4",
    media_type: "Video" as const,
    duration: 120,
    metadata: {
      format: "mp4",
      codec: "h264",
      resolution: { width: 1920, height: 1080 },
      frame_rate: 30,
      bitrate: 5000,
      audio_channels: 2,
      sample_rate: 48000,
      creation_time: null,
    },
    usage_count: 1,
    thumbnail: null,
  },
  {
    id: "file2",
    path: "/path/to/audio1.mp3",
    name: "audio1.mp3",
    media_type: "Audio" as const,
    duration: 180,
    metadata: {
      format: "mp3",
      codec: "mp3",
      resolution: null,
      frame_rate: null,
      bitrate: 320,
      audio_channels: 2,
      sample_rate: 44100,
      creation_time: null,
    },
    usage_count: 0,
    thumbnail: null,
  },
  {
    id: "file3",
    path: "/path/to/image1.jpg",
    name: "image1.jpg",
    media_type: "Image" as const,
    duration: null,
    metadata: {
      format: "jpg",
      codec: null,
      resolution: { width: 1920, height: 1080 },
      frame_rate: null,
      bitrate: null,
      audio_channels: null,
      sample_rate: null,
      creation_time: null,
    },
    usage_count: 0,
    thumbnail: null,
  },
]

const mockProjectState = {
  project: {
    id: "test-project",
    metadata: {
      name: "Test Project",
      created_at: new Date().toISOString(),
      modified_at: new Date().toISOString(),
      is_dirty: false,
      file_path: null,
      description: null,
      version: "1.0.0",
    },
    timeline: { duration: 300, fps: 30, sample_rate: 44100, tracks: [], markers: [] },
    media_pool: { items: { file1: mockMediaFiles[0], file2: mockMediaFiles[1], file3: mockMediaFiles[2] } },
    settings: {
      resolution: { width: 1920, height: 1080 },
      frame_rate: 30,
      audio_sample_rate: 44100,
      audio_channels: 2,
    },
  },
  ui_state: { selected_clips: [], selected_tracks: [], timeline_zoom: 1, timeline_scroll: 0, active_tool: "selection" },
  playback_state: {
    is_playing: false,
    current_time: 0,
    playback_rate: 1.0,
    loop_enabled: false,
    loop_start: null,
    loop_end: null,
    volume: 1.0,
    current_media_id: null,
    selected_clip_id: null,
    video_source: "browser" as const,
    applied_effects: [],
    applied_filters: [],
    applied_template: null,
    is_loading: false,
    is_seeking: false,
    duration: 300,
  },
  version: 1,
}

const mockAppState = {
  context: { projectState: mockProjectState, isConnected: true, error: null },
  matches: (state: string) => state === "connected",
}

// Мок actor
const mockAppActor = {
  getSnapshot: vi.fn(() => mockAppState),
  subscribe: vi.fn(() => ({ unsubscribe: vi.fn() })),
  send: vi.fn(),
}

vi.mock("@/domains/project-management/services/project-management-orchestrator", () => ({
  getProjectManagementOrchestrator: vi.fn(() => ({
    getAppActor: vi.fn(() => mockAppActor),
    getAppState: vi.fn(() => mockAppState),
    subscribeToAppState: vi.fn(() => () => {}),
  })),
}))

vi.mock("@xstate/react", () => ({
  useSelector: vi.fn((actor, selector) => selector(mockAppState)),
}))

vi.mock("../../services/backend-sync", () => ({
  getBackendSync: vi.fn(() => ({
    executeCommand: vi.fn().mockResolvedValue({ success: true }),
  })),
}))

const wrapper = ({ children }: { children: React.ReactNode }) => <AppProvider>{children}</AppProvider>

describe("useMediaFiles", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("должен возвращать список медиа-файлов", () => {
    const { result } = renderHook(() => useMediaFiles(), { wrapper })
    expect(result.current.mediaFiles).toEqual(mockMediaFiles)
    expect(result.current.mediaFiles).toHaveLength(3)
  })

  it("должен предоставлять методы управления медиа-файлами", () => {
    const { result } = renderHook(() => useMediaFiles(), { wrapper })
    expect(typeof result.current.addMediaFile).toBe("function")
    expect(typeof result.current.removeMediaFile).toBe("function")
    expect(typeof result.current.updateMediaFile).toBe("function")
  })

  it("должен корректно работать с пустым списком", () => {
    const { result } = renderHook(() => useMediaFiles(), { wrapper })
    expect(Array.isArray(result.current.mediaFiles)).toBe(true)
  })

  it("должен корректно обрабатывать различные типы медиа-файлов", () => {
    const { result } = renderHook(() => useMediaFiles(), { wrapper })
    expect(result.current.mediaFiles.find((f) => f.media_type === "Video")).toBeDefined()
    expect(result.current.mediaFiles.find((f) => f.media_type === "Audio")).toBeDefined()
    expect(result.current.mediaFiles.find((f) => f.media_type === "Image")).toBeDefined()
  })
})

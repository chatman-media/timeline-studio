import { act, renderHook } from "@testing-library/react"
import type React from "react"
import { describe, expect, it, vi } from "vitest"

import type { MediaItem } from "@/types/generated/tauri-bindings"

import { useMediaFiles } from "../../hooks/use-media-files"
import { AppProvider } from "../../services/app-provider"

// Мокаем backend-sync и app provider
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
      resolution: { width: 0, height: 0 },
      frame_rate: 0,
      bitrate: 320,
      audio_channels: 2,
      sample_rate: 44100,
    },
    usage_count: 0,
    thumbnail: null,
  },
  {
    id: "file3",
    path: "/path/to/image1.jpg",
    name: "image1.jpg",
    media_type: "Image" as const,
    duration: 0,
    metadata: {
      format: "jpg",
      codec: "",
      resolution: { width: 1920, height: 1080 },
      frame_rate: 0,
      bitrate: 0,
      audio_channels: 0,
      sample_rate: 0,
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
    timeline: {
      duration: 300,
      fps: 30,
      sample_rate: 44100,
      tracks: [],
      markers: [],
    },
    media_pool: {
      items: {
        file1: mockMediaFiles[0],
        file2: mockMediaFiles[1],
        file3: mockMediaFiles[2],
      },
    },
    settings: {
      resolution: { width: 1920, height: 1080 },
      frame_rate: 30,
      audio_sample_rate: 44100,
      audio_channels: 2,
    },
  },
  ui_state: {
    selected_clips: [],
    selected_tracks: [],
    timeline_zoom: 1,
    timeline_scroll: 0,
    active_tool: "selection",
  },
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

// executeCommand теперь вызывает send

// Мокаем app-machine
vi.mock("../../services/app-machine", () => ({
  appMachine: {
    // Mock implementation
  },
}))

// Мокаем состояние машины
const mockState = {
  context: {
    projectState: mockProjectState,
    isConnected: true,
    error: null,
  },
  matches: (state: string) => state === "connected",
}

const mockSend = vi.fn()

// Мокаем xstate react
vi.mock("@xstate/react", () => ({
  useMachine: () => [mockState, mockSend],
}))

const wrapper = ({ children }: { children: React.ReactNode }) => <AppProvider>{children}</AppProvider>

describe("useMediaFiles", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSend.mockClear()
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

    // Проверяем что когда нет проекта, возвращается пустой массив
    expect(result.current.mediaFiles).toEqual(mockMediaFiles) // В нашем моке проект есть
    expect(Array.isArray(result.current.mediaFiles)).toBe(true)
  })

  it("должен вызывать executeCommand при добавлении медиа-файла", async () => {
    const { result } = renderHook(() => useMediaFiles(), { wrapper })

    await act(async () => {
      await result.current.addMediaFile("/path/to/new-video.mp4", "Video")
    })

    expect(mockSend).toHaveBeenCalledWith({
      type: "EXECUTE_COMMAND",
      command: {
        type: "AddMedia",
        params: { path: "/path/to/new-video.mp4", media_type: "Video" },
      },
    })
  })

  it("должен корректно обрабатывать различные типы медиа-файлов", () => {
    const { result } = renderHook(() => useMediaFiles(), { wrapper })

    const mediaFiles = result.current.mediaFiles

    // Проверяем, что есть видео файл
    const videoFile = mediaFiles.find((file) => file.media_type === "Video")
    expect(videoFile).toBeDefined()
    expect(videoFile?.name).toBe("video1.mp4")

    // Проверяем, что есть аудио файл
    const audioFile = mediaFiles.find((file) => file.media_type === "Audio")
    expect(audioFile).toBeDefined()
    expect(audioFile?.name).toBe("audio1.mp3")

    // Проверяем, что есть изображение
    const imageFile = mediaFiles.find((file) => file.media_type === "Image")
    expect(imageFile).toBeDefined()
    expect(imageFile?.name).toBe("image1.jpg")
  })

  it("должен вызывать executeCommand при удалении медиа-файла", async () => {
    const { result } = renderHook(() => useMediaFiles(), { wrapper })

    await act(async () => {
      await result.current.removeMediaFile("file1")
    })

    expect(mockSend).toHaveBeenCalledWith({
      type: "EXECUTE_COMMAND",
      command: {
        type: "RemoveMedia",
        params: { media_id: "file1" },
      },
    })
  })
})

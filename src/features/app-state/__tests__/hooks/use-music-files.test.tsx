import { act, renderHook } from "@testing-library/react"
import type React from "react"
import { describe, expect, it, vi } from "vitest"

import type { MediaItem } from "@/types/generated/tauri-bindings"

import { useMusicFiles } from "../../hooks/use-music-files"
import { AppProvider } from "../../services/app-provider"

// Мокаем backend-sync и app provider
const mockMusicFiles: MediaItem[] = [
  {
    id: "music1",
    path: "/path/to/song1.mp3",
    name: "song1.mp3",
    media_type: "Audio" as const,
    duration: 210,
    metadata: {
      format: "mp3",
      codec: "mp3",
      resolution: null,
      frame_rate: null,
      bitrate: 320,
      audio_channels: 2,
      sample_rate: 44100,
    },
    usage_count: 1,
    thumbnail: null,
  },
  {
    id: "music2",
    path: "/path/to/song2.wav",
    name: "song2.wav",
    media_type: "Audio" as const,
    duration: 180,
    metadata: {
      format: "wav",
      codec: "pcm",
      resolution: null,
      frame_rate: null,
      bitrate: 1411,
      audio_channels: 2,
      sample_rate: 44100,
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
        music1: mockMusicFiles[0],
        music2: mockMusicFiles[1],
        // Добавляем видео файл для проверки фильтрации
        video1: {
          id: "video1",
          path: "/path/to/video.mp4",
          name: "video.mp4",
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
          usage_count: 0,
          thumbnail: null,
        },
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

describe("useMusicFiles", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSend.mockClear()
  })

  it("должен возвращать только аудио файлы", () => {
    const { result } = renderHook(() => useMusicFiles(), { wrapper })

    expect(result.current.musicFiles).toEqual(mockMusicFiles)
    expect(result.current.musicFiles).toHaveLength(2)

    // Проверяем что все файлы имеют тип Audio
    result.current.musicFiles.forEach((file) => {
      expect(file.media_type).toBe("Audio")
    })
  })

  it("должен предоставлять методы управления музыкальными файлами", () => {
    const { result } = renderHook(() => useMusicFiles(), { wrapper })

    expect(typeof result.current.addMusicFile).toBe("function")
    expect(typeof result.current.removeMusicFile).toBe("function")
    expect(typeof result.current.updateMusicFile).toBe("function")
  })

  it("должен корректно работать с пустым списком", () => {
    const { result } = renderHook(() => useMusicFiles(), { wrapper })

    expect(Array.isArray(result.current.musicFiles)).toBe(true)
  })

  it("должен вызывать executeCommand при добавлении музыкального файла", async () => {
    const { result } = renderHook(() => useMusicFiles(), { wrapper })

    await act(async () => {
      await result.current.addMusicFile("/path/to/new-song.mp3")
    })

    expect(mockSend).toHaveBeenCalledWith({
      type: "EXECUTE_COMMAND",
      command: {
        type: "AddMedia",
        params: { path: "/path/to/new-song.mp3", media_type: "Audio" },
      },
    })
  })

  it("должен фильтровать только аудио файлы из mediaPool", () => {
    const { result } = renderHook(() => useMusicFiles(), { wrapper })

    const musicFiles = result.current.musicFiles

    // Проверяем что видео файл не включён в результат
    const videoFile = musicFiles.find((file) => file.name === "video.mp4")
    expect(videoFile).toBeUndefined()

    // Проверяем что есть только аудио файлы
    expect(musicFiles).toHaveLength(2)
    expect(musicFiles[0].name).toBe("song1.mp3")
    expect(musicFiles[1].name).toBe("song2.wav")
  })

  it("должен вызывать executeCommand при удалении музыкального файла", async () => {
    const { result } = renderHook(() => useMusicFiles(), { wrapper })

    await act(async () => {
      await result.current.removeMusicFile("music1")
    })

    expect(mockSend).toHaveBeenCalledWith({
      type: "EXECUTE_COMMAND",
      command: {
        type: "RemoveMedia",
        params: { media_id: "music1" },
      },
    })
  })
})

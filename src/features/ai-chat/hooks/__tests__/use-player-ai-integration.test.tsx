/**
 * Тесты для usePlayerAIIntegration
 */

import { renderHook } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { usePlayerAIIntegration } from "../use-player-ai-integration"

// Mock player state
const mockPlayer = {
  previewMedia: null,
  currentVideo: null,
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  currentPlaybackRate: 1,
  volume: 100,
  isSeeking: false,
  isVideoLoading: false,
  isVideoReady: false,
  appliedEffects: [],
  appliedFilters: [],
  appliedTemplate: null,
  videoSource: "timeline",
  play: vi.fn(),
  pause: vi.fn(),
  seek: vi.fn(),
  setVolume: vi.fn(),
  setPlaybackRate: vi.fn(),
  applyEffect: vi.fn(),
  clearEffects: vi.fn(),
  applyFilter: vi.fn(),
  clearFilters: vi.fn(),
  applyTemplate: vi.fn(),
  clearTemplate: vi.fn(),
  setPreviewMedia: vi.fn(),
  setVideoSource: vi.fn(),
  speedRampingEnabled: false,
}

vi.mock("../../video-player", () => ({
  usePlayer: () => mockPlayer,
}))

describe("usePlayerAIIntegration", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset player state
    Object.assign(mockPlayer, {
      previewMedia: null,
      currentVideo: null,
      isPlaying: false,
      currentTime: 0,
      duration: 0,
      isVideoReady: false,
      appliedEffects: [],
      appliedFilters: [],
      appliedTemplate: null,
    })
  })

  it("должен вернуть определенное состояние", () => {
    const { result } = renderHook(() => usePlayerAIIntegration())

    // Проверяем, что hook работает и не вызывает ошибок
    expect(result.current).toBeDefined()
    expect(result.current).toHaveProperty("isReady")
    expect(result.current).toHaveProperty("hasMedia")
    expect(result.current).toHaveProperty("isPlaying")
    expect(result.current).toHaveProperty("effectsCount")
    expect(result.current).toHaveProperty("filtersCount")
  })

  it("должен вернуть правильное состояние плеера", () => {
    const { result } = renderHook(() => usePlayerAIIntegration())

    expect(result.current).toBeDefined()
    expect(result.current.isPlaying).toBeDefined()
    expect(result.current.effectsCount).toBeDefined()
    expect(result.current.filtersCount).toBeDefined()
  })

  it("должен обрабатывать пустые массивы эффектов и фильтров", () => {
    mockPlayer.appliedEffects = []
    mockPlayer.appliedFilters = []

    const { result } = renderHook(() => usePlayerAIIntegration())

    expect(result.current.effectsCount).toBe(0)
    expect(result.current.filtersCount).toBe(0)
  })

  it("должен обрабатывать null эффекты и фильтры", () => {
    mockPlayer.appliedEffects = null as any
    mockPlayer.appliedFilters = null as any

    const { result } = renderHook(() => usePlayerAIIntegration())

    expect(result.current.effectsCount).toBe(0)
    expect(result.current.filtersCount).toBe(0)
  })

  it("должен реагировать на ререндеры", () => {
    const { result, rerender } = renderHook(() => usePlayerAIIntegration())

    expect(result.current).toBeDefined()

    // Ререндер не должен вызывать ошибки
    rerender()
    rerender()

    expect(result.current).toBeDefined()
  })
})

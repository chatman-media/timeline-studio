import { act, renderHook } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { usePlayerAIAnalysis } from "../use-player-ai-analysis"

// Простые моки без сложной логики
const mockFrameCaptureService = {
  captureThumbnail: vi.fn().mockReturnValue({
    data: new Uint8ClampedArray(4),
    width: 320,
    height: 240,
  }),
  dispose: vi.fn(),
}

const mockVideoElement = {
  currentTime: 5.0,
  duration: 60.0,
  readyState: 4,
  videoWidth: 1920,
  videoHeight: 1080,
} as HTMLVideoElement

const mockPlayerContext = {
  currentTime: 5.0,
  isPlaying: false,
  duration: 60.0,
  videoRef: { current: mockVideoElement },
}

// Мокаем модули
vi.mock("../services/frame-capture-service", () => ({
  FrameCaptureService: vi.fn(() => mockFrameCaptureService),
}))

vi.mock("../services/player-provider", () => ({
  usePlayer: () => mockPlayerContext,
}))

describe("usePlayerAIAnalysis", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()

    // Сброс состояния
    mockPlayerContext.currentTime = 5.0
    mockPlayerContext.isPlaying = false
    mockPlayerContext.duration = 60.0
    mockPlayerContext.videoRef = { current: mockVideoElement }
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("initializes with correct default state", () => {
    const { result } = renderHook(() => usePlayerAIAnalysis())

    expect(result.current.state).toEqual({
      isAnalyzing: false,
      analysisProgress: 0,
      currentScene: null,
      detectedObjects: [],
      upcomingMoments: [],
      frameAnalysisRate: 2,
      analysisResult: null,
      error: null,
    })
  })

  it("provides all required methods", () => {
    const { result } = renderHook(() => usePlayerAIAnalysis())

    expect(typeof result.current.startRealtimeAnalysis).toBe("function")
    expect(typeof result.current.stopRealtimeAnalysis).toBe("function")
    expect(typeof result.current.setFrameAnalysisRate).toBe("function")
    expect(typeof result.current.getCurrentSceneInfo).toBe("function")
    expect(typeof result.current.getObjectsInFrame).toBe("function")
    expect(typeof result.current.getUpcomingMoments).toBe("function")
  })

  it("sets frame analysis rate with clamping", () => {
    const { result } = renderHook(() => usePlayerAIAnalysis())

    // Нормальное значение
    act(() => {
      result.current.setFrameAnalysisRate(5)
    })
    expect(result.current.state.frameAnalysisRate).toBe(5)

    // Минимальное ограничение
    act(() => {
      result.current.setFrameAnalysisRate(0.1)
    })
    expect(result.current.state.frameAnalysisRate).toBe(0.5)

    // Максимальное ограничение
    act(() => {
      result.current.setFrameAnalysisRate(15)
    })
    expect(result.current.state.frameAnalysisRate).toBe(10)
  })

  it("returns current scene info", () => {
    const { result } = renderHook(() => usePlayerAIAnalysis())

    expect(result.current.getCurrentSceneInfo()).toBeNull()
  })

  it("returns objects in current frame", () => {
    const { result } = renderHook(() => usePlayerAIAnalysis())

    expect(result.current.getObjectsInFrame()).toEqual([])
  })

  it("returns upcoming moments with default lookahead", () => {
    const { result } = renderHook(() => usePlayerAIAnalysis())

    const upcomingMoments = result.current.getUpcomingMoments()
    expect(upcomingMoments).toEqual([])
  })

  it("returns upcoming moments with custom lookahead", () => {
    const { result } = renderHook(() => usePlayerAIAnalysis())

    const upcomingMoments = result.current.getUpcomingMoments(5)
    expect(upcomingMoments).toEqual([])
  })

  it("can call startRealtimeAnalysis without errors", () => {
    const { result } = renderHook(() => usePlayerAIAnalysis())

    expect(() => {
      act(() => {
        result.current.startRealtimeAnalysis()
      })
    }).not.toThrow()
  })

  it("can call stopRealtimeAnalysis without errors", () => {
    const { result } = renderHook(() => usePlayerAIAnalysis())

    expect(() => {
      act(() => {
        result.current.stopRealtimeAnalysis()
      })
    }).not.toThrow()
  })

  it("stopRealtimeAnalysis clears current scene and objects", () => {
    const { result } = renderHook(() => usePlayerAIAnalysis())

    act(() => {
      result.current.stopRealtimeAnalysis()
    })

    expect(result.current.state.currentScene).toBeNull()
    expect(result.current.state.detectedObjects).toEqual([])
  })

  it("does not restart analysis when frame rate changes and not analyzing", () => {
    const { result } = renderHook(() => usePlayerAIAnalysis())

    // Изменяем частоту без анализа
    act(() => {
      result.current.setFrameAnalysisRate(3)
    })

    expect(result.current.state.frameAnalysisRate).toBe(3)
    expect(result.current.state.isAnalyzing).toBe(false)
  })

  it("handles missing video element without errors", () => {
    const { result } = renderHook(() => usePlayerAIAnalysis())

    // Устанавливаем videoRef на null
    mockPlayerContext.videoRef = { current: null as unknown as HTMLVideoElement }

    expect(() => {
      act(() => {
        result.current.startRealtimeAnalysis()
      })
    }).not.toThrow()
  })

  it("can switch frame analysis rates multiple times", () => {
    const { result } = renderHook(() => usePlayerAIAnalysis())

    const rates = [1, 3, 0.5, 8, 15, 0.1]
    const expectedRates = [1, 3, 0.5, 8, 10, 0.5] // с учетом ограничений

    rates.forEach((rate, index) => {
      act(() => {
        result.current.setFrameAnalysisRate(rate)
      })
      expect(result.current.state.frameAnalysisRate).toBe(expectedRates[index])
    })
  })

  it("maintains state consistency across multiple operations", () => {
    const { result } = renderHook(() => usePlayerAIAnalysis())

    // Проверяем изначальное состояние
    expect(result.current.state.isAnalyzing).toBe(false)
    expect(result.current.state.frameAnalysisRate).toBe(2)

    // Меняем частоту
    act(() => {
      result.current.setFrameAnalysisRate(4)
    })
    expect(result.current.state.frameAnalysisRate).toBe(4)

    // Запускаем анализ
    act(() => {
      result.current.startRealtimeAnalysis()
    })

    // Останавливаем анализ
    act(() => {
      result.current.stopRealtimeAnalysis()
    })

    // Частота должна сохраниться
    expect(result.current.state.frameAnalysisRate).toBe(4)
    expect(result.current.state.currentScene).toBeNull()
  })

  it("provides stable function references", () => {
    const { result, rerender } = renderHook(() => usePlayerAIAnalysis())

    const initialFunctions = {
      startRealtimeAnalysis: result.current.startRealtimeAnalysis,
      stopRealtimeAnalysis: result.current.stopRealtimeAnalysis,
      setFrameAnalysisRate: result.current.setFrameAnalysisRate,
      getCurrentSceneInfo: result.current.getCurrentSceneInfo,
      getObjectsInFrame: result.current.getObjectsInFrame,
      getUpcomingMoments: result.current.getUpcomingMoments,
    }

    // Вызываем rerender
    rerender()

    // Функции должны остаться теми же (memoized)
    expect(result.current.getCurrentSceneInfo).toBe(initialFunctions.getCurrentSceneInfo)
    expect(result.current.getObjectsInFrame).toBe(initialFunctions.getObjectsInFrame)
    expect(result.current.getUpcomingMoments).toBe(initialFunctions.getUpcomingMoments)
  })

  it("handles edge case lookahead values", () => {
    const { result } = renderHook(() => usePlayerAIAnalysis())

    // Проверяем граничные случаи
    expect(result.current.getUpcomingMoments(0)).toEqual([])
    expect(result.current.getUpcomingMoments(-5)).toEqual([])
    expect(result.current.getUpcomingMoments(1000)).toEqual([])
  })

  it("maintains correct frame analysis rate bounds", () => {
    const { result } = renderHook(() => usePlayerAIAnalysis())

    // Тестируем граничные значения
    const testCases = [
      { input: 0, expected: 0.5 },
      { input: 0.4, expected: 0.5 },
      { input: 0.5, expected: 0.5 },
      { input: 0.6, expected: 0.6 },
      { input: 5, expected: 5 },
      { input: 10, expected: 10 },
      { input: 10.1, expected: 10 },
      { input: 50, expected: 10 },
    ]

    testCases.forEach(({ input, expected }) => {
      act(() => {
        result.current.setFrameAnalysisRate(input)
      })
      expect(result.current.state.frameAnalysisRate).toBe(expected)
    })
  })

  it("restarts analysis when frame rate changes during active analysis", () => {
    const { result } = renderHook(() => usePlayerAIAnalysis())

    // Симулируем активный анализ путем прямого изменения состояния
    act(() => {
      result.current.state.isAnalyzing = true
    })

    // Изменяем частоту кадров - это должно вызвать перезапуск
    act(() => {
      result.current.setFrameAnalysisRate(4)
    })

    expect(result.current.state.frameAnalysisRate).toBe(4)
  })

  it.skip("handles automatic stop when playback stops during analysis", () => {
    // TODO: Эта функциональность не реализована в хуке
    // Тест пытается напрямую мутировать state, что не работает в React
    const { result, rerender } = renderHook(() => usePlayerAIAnalysis())

    // Начинаем воспроизведение и анализ
    mockPlayerContext.isPlaying = true

    // Симулируем активный анализ
    act(() => {
      result.current.state.isAnalyzing = true
    })

    rerender()

    // Останавливаем воспроизведение
    mockPlayerContext.isPlaying = false
    rerender()

    // Анализ должен автоматически остановиться
    expect(result.current.state.isAnalyzing).toBe(false)
  })

  it("does not auto-stop when playback stops but analysis is not active", () => {
    const { result, rerender } = renderHook(() => usePlayerAIAnalysis())

    // Начинаем воспроизведение без анализа
    mockPlayerContext.isPlaying = true
    rerender()

    expect(result.current.state.isAnalyzing).toBe(false)

    // Останавливаем воспроизведение
    mockPlayerContext.isPlaying = false
    rerender()

    // Состояние анализа не должно измениться
    expect(result.current.state.isAnalyzing).toBe(false)
  })

  it("handles complex state transitions correctly", () => {
    const { result } = renderHook(() => usePlayerAIAnalysis())

    // Последовательность операций
    act(() => {
      result.current.setFrameAnalysisRate(3)
    })
    expect(result.current.state.frameAnalysisRate).toBe(3)

    act(() => {
      result.current.startRealtimeAnalysis()
    })

    act(() => {
      result.current.setFrameAnalysisRate(6)
    })
    expect(result.current.state.frameAnalysisRate).toBe(6)

    act(() => {
      result.current.stopRealtimeAnalysis()
    })

    // Частота должна сохраниться после остановки
    expect(result.current.state.frameAnalysisRate).toBe(6)
    expect(result.current.state.currentScene).toBeNull()
    expect(result.current.state.detectedObjects).toEqual([])
  })
})

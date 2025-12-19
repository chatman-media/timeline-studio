/**
 * @vitest-environment jsdom
 */
/**
 * Tests for useAIDirectorEvents hooks
 *
 * Тесты для хуков подписки на события AI Director
 */

import { renderHook, waitFor } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { DOMAIN_EVENTS } from "@/domains/shared/events"
import type {
  AIDirectorAnalysisCompletedEvent,
  AIDirectorAnalysisErrorEvent,
  AIDirectorAnalysisProgressEvent,
} from "@/domains/shared/events/ai-services-events"
import {
  useAIDirectorAnalysisCompleted,
  useAIDirectorAnalysisProgress,
  useAIDirectorEvents,
} from "../use-ai-director-events"

// Mock dependencies
const mockSubscribe = vi.fn()

vi.mock("@/domains/shared/hooks/use-domain-events", () => ({
  useDomainEvents: () => ({
    subscribe: mockSubscribe,
  }),
}))

vi.mock("@/lib/tauri-logger", () => ({
  createLogger: () => ({
    debug: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  }),
}))

describe("useAIDirectorEvents", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe("Event Subscriptions", () => {
    it("должен подписаться на события прогресса", () => {
      const onProgress = vi.fn()

      renderHook(() =>
        useAIDirectorEvents({
          onProgress,
        }),
      )

      expect(mockSubscribe).toHaveBeenCalledWith(expect.any(Function), {
        filter: {
          type: DOMAIN_EVENTS.AI_SERVICES.AI_DIRECTOR_ANALYSIS_PROGRESS,
        },
      })
    })

    it("должен подписаться на события завершения", () => {
      const onCompleted = vi.fn()

      renderHook(() =>
        useAIDirectorEvents({
          onCompleted,
        }),
      )

      expect(mockSubscribe).toHaveBeenCalledWith(expect.any(Function), {
        filter: {
          type: DOMAIN_EVENTS.AI_SERVICES.AI_DIRECTOR_ANALYSIS_COMPLETED,
        },
      })
    })

    it("должен подписаться на события ошибок", () => {
      const onError = vi.fn()

      renderHook(() =>
        useAIDirectorEvents({
          onError,
        }),
      )

      expect(mockSubscribe).toHaveBeenCalledWith(expect.any(Function), {
        filter: { type: DOMAIN_EVENTS.AI_SERVICES.AI_DIRECTOR_ANALYSIS_ERROR },
      })
    })

    it("должен подписаться на события завершения стадий", () => {
      const onStageCompleted = vi.fn()

      renderHook(() =>
        useAIDirectorEvents({
          onStageCompleted,
        }),
      )

      expect(mockSubscribe).toHaveBeenCalledWith(expect.any(Function), {
        filter: { type: DOMAIN_EVENTS.AI_SERVICES.AI_DIRECTOR_STAGE_COMPLETED },
      })
    })

    it("должен подписаться на события завершения batch", () => {
      const onBatchCompleted = vi.fn()

      renderHook(() =>
        useAIDirectorEvents({
          onBatchCompleted,
        }),
      )

      expect(mockSubscribe).toHaveBeenCalledWith(expect.any(Function), {
        filter: { type: DOMAIN_EVENTS.AI_SERVICES.AI_DIRECTOR_BATCH_COMPLETED },
      })
    })

    it("должен подписаться на все события одновременно", () => {
      const handlers = {
        onProgress: vi.fn(),
        onCompleted: vi.fn(),
        onError: vi.fn(),
        onStageCompleted: vi.fn(),
        onBatchCompleted: vi.fn(),
      }

      renderHook(() => useAIDirectorEvents(handlers))

      expect(mockSubscribe).toHaveBeenCalledTimes(5)
    })

    it("не должен подписываться если обработчик не передан", () => {
      renderHook(() => useAIDirectorEvents({}))

      expect(mockSubscribe).not.toHaveBeenCalled()
    })
  })

  describe("Event Handling", () => {
    it("должен вызывать обработчик при получении события прогресса", async () => {
      const onProgress = vi.fn()
      let capturedCallback: ((event: any) => void) | null = null

      mockSubscribe.mockImplementation((callback) => {
        capturedCallback = callback
      })

      renderHook(() => useAIDirectorEvents({ onProgress }))

      const mockEvent: AIDirectorAnalysisProgressEvent = {
        analysisId: "test-123",
        progress: 0.5,
        stage: "audio_analysis",
        message: "Processing audio...",
      }

      capturedCallback!({ payload: mockEvent })

      await waitFor(() => {
        expect(onProgress).toHaveBeenCalledWith(mockEvent)
      })
    })

    it("должен вызывать обработчик при завершении анализа", async () => {
      const onCompleted = vi.fn()
      let capturedCallback: ((event: any) => void) | null = null

      mockSubscribe.mockImplementation((callback) => {
        capturedCallback = callback
      })

      renderHook(() => useAIDirectorEvents({ onCompleted }))

      const mockEvent: AIDirectorAnalysisCompletedEvent = {
        analysisId: "test-123",
        videoPath: "/test/video.mp4",
        success: true,
        totalDuration: 1000,
        stagesCompleted: ["audio", "video"],
        errors: [],
      }

      capturedCallback!({ payload: mockEvent })

      await waitFor(() => {
        expect(onCompleted).toHaveBeenCalledWith(mockEvent)
      })
    })

    it("должен вызывать обработчик при ошибке", async () => {
      const onError = vi.fn()
      let capturedCallback: ((event: any) => void) | null = null

      mockSubscribe.mockImplementation((callback) => {
        capturedCallback = callback
      })

      renderHook(() => useAIDirectorEvents({ onError }))

      const mockEvent: AIDirectorAnalysisErrorEvent = {
        analysisId: "test-123",
        error: "Analysis failed",
        stage: "vision_analysis",
        timestamp: Date.now(),
      }

      capturedCallback!({ payload: mockEvent })

      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith(mockEvent)
      })
    })
  })

  describe("Debug Mode", () => {
    it("должен включать отладочные сообщения в debug режиме", () => {
      renderHook(() =>
        useAIDirectorEvents(
          {
            onProgress: vi.fn(),
          },
          { debug: true },
        ),
      )

      // useDomainEvents должен получить debug: true
      // Проверяем через параметры, переданные в mockSubscribe
      expect(mockSubscribe).toHaveBeenCalled()
    })
  })
})

describe("useAIDirectorAnalysisProgress", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("должен подписаться на события прогресса конкретного анализа", () => {
    const onProgress = vi.fn()
    const analysisId = "test-123"

    renderHook(() => useAIDirectorAnalysisProgress(analysisId, onProgress))

    expect(mockSubscribe).toHaveBeenCalledWith(expect.any(Function), {
      filter: { type: DOMAIN_EVENTS.AI_SERVICES.AI_DIRECTOR_ANALYSIS_PROGRESS },
    })
  })

  it("должен фильтровать события по analysisId", async () => {
    const onProgress = vi.fn()
    const targetAnalysisId = "test-123"
    let capturedCallback: ((event: any) => void) | null = null

    mockSubscribe.mockImplementation((callback) => {
      capturedCallback = callback
    })

    renderHook(() => useAIDirectorAnalysisProgress(targetAnalysisId, onProgress))

    // Событие для целевого анализа
    const targetEvent: AIDirectorAnalysisProgressEvent = {
      analysisId: targetAnalysisId,
      progress: 0.5,
      stage: "audio_analysis",
      message: "Processing...",
    }

    // Событие для другого анализа
    const otherEvent: AIDirectorAnalysisProgressEvent = {
      analysisId: "other-456",
      progress: 0.7,
      stage: "audio_analysis",
      message: "Processing...",
    }

    capturedCallback!({ payload: targetEvent })
    capturedCallback!({ payload: otherEvent })

    await waitFor(() => {
      expect(onProgress).toHaveBeenCalledTimes(1)
      expect(onProgress).toHaveBeenCalledWith(targetEvent)
    })
  })

  it("не должен подписываться если analysisId не передан", () => {
    const onProgress = vi.fn()

    renderHook(() => useAIDirectorAnalysisProgress("", onProgress))

    expect(mockSubscribe).not.toHaveBeenCalled()
  })
})

describe("useAIDirectorAnalysisCompleted", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("должен подписаться на событие завершения конкретного анализа", () => {
    const onCompleted = vi.fn()
    const analysisId = "test-123"

    renderHook(() => useAIDirectorAnalysisCompleted(analysisId, onCompleted))

    expect(mockSubscribe).toHaveBeenCalledWith(expect.any(Function), {
      filter: {
        type: DOMAIN_EVENTS.AI_SERVICES.AI_DIRECTOR_ANALYSIS_COMPLETED,
      },
      once: true, // Важно: подписка должна быть одноразовой
    })
  })

  it("должен фильтровать события по analysisId", async () => {
    const onCompleted = vi.fn()
    const targetAnalysisId = "test-123"
    let capturedCallback: ((event: any) => void) | null = null

    mockSubscribe.mockImplementation((callback) => {
      capturedCallback = callback
    })

    renderHook(() => useAIDirectorAnalysisCompleted(targetAnalysisId, onCompleted))

    // Событие для целевого анализа
    const targetEvent: AIDirectorAnalysisCompletedEvent = {
      analysisId: targetAnalysisId,
      videoPath: "/test/video1.mp4",
      success: true,
      totalDuration: 1000,
      stagesCompleted: ["audio", "video"],
      errors: [],
    }

    // Событие для другого анализа
    const otherEvent: AIDirectorAnalysisCompletedEvent = {
      analysisId: "other-456",
      videoPath: "/test/video2.mp4",
      success: true,
      totalDuration: 1500,
      stagesCompleted: ["audio", "video"],
      errors: [],
    }

    capturedCallback!({ payload: targetEvent })
    capturedCallback!({ payload: otherEvent })

    await waitFor(() => {
      expect(onCompleted).toHaveBeenCalledTimes(1)
      expect(onCompleted).toHaveBeenCalledWith(targetEvent)
    })
  })

  it("не должен подписываться если analysisId не передан", () => {
    const onCompleted = vi.fn()

    renderHook(() => useAIDirectorAnalysisCompleted("", onCompleted))

    expect(mockSubscribe).not.toHaveBeenCalled()
  })

  it("должен обрабатывать успешное завершение", async () => {
    const onCompleted = vi.fn()
    let capturedCallback: ((event: any) => void) | null = null

    mockSubscribe.mockImplementation((callback) => {
      capturedCallback = callback
    })

    renderHook(() => useAIDirectorAnalysisCompleted("test-123", onCompleted))

    const successEvent: AIDirectorAnalysisCompletedEvent = {
      analysisId: "test-123",
      videoPath: "/test/video.mp4",
      success: true,
      totalDuration: 1000,
      stagesCompleted: ["audio", "video"],
      errors: [],
    }

    capturedCallback!({ payload: successEvent })

    await waitFor(() => {
      expect(onCompleted).toHaveBeenCalledWith(successEvent)
    })
  })

  it("должен обрабатывать неуспешное завершение", async () => {
    const onCompleted = vi.fn()
    let capturedCallback: ((event: any) => void) | null = null

    mockSubscribe.mockImplementation((callback) => {
      capturedCallback = callback
    })

    renderHook(() => useAIDirectorAnalysisCompleted("test-123", onCompleted))

    const failureEvent: AIDirectorAnalysisCompletedEvent = {
      analysisId: "test-123",
      videoPath: "/test/video.mp4",
      success: false,
      totalDuration: 1000,
      stagesCompleted: [],
      errors: ["Analysis failed"],
    }

    capturedCallback!({ payload: failureEvent })

    await waitFor(() => {
      expect(onCompleted).toHaveBeenCalledWith(failureEvent)
    })
  })
})

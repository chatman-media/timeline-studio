/**
 * @vitest-environment jsdom
 */
/**
 * Тесты для useResourcesAIIntegration
 */

import { renderHook } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { useResourcesAIIntegration } from "../use-resources-ai-integration"

// Mock resources provider
const mockResources = {
  mediaResources: [],
  musicResources: [],
  effectResources: [],
  filterResources: [],
  transitionResources: [],
  templateResources: [],
  styleTemplateResources: [],
  subtitleResources: [],
  addMedia: vi.fn(),
  addMusic: vi.fn(),
  addEffect: vi.fn(),
  addFilter: vi.fn(),
  addTransition: vi.fn(),
  addTemplate: vi.fn(),
  addStyleTemplate: vi.fn(),
  addSubtitle: vi.fn(),
  removeResource: vi.fn(),
  updateResource: vi.fn(),
}

vi.mock("@/domains/video-editing", () => ({
  useResources: () => mockResources,
}))

// Mock logger
vi.mock("@/lib/tauri-logger", () => ({
  logInfo: vi.fn(),
  logError: vi.fn(),
}))

describe("useResourcesAIIntegration", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockResources.mediaResources = []
    mockResources.musicResources = []
    mockResources.effectResources = []
    mockResources.filterResources = []
  })

  it("должен вернуть isIntegrated: true", () => {
    const { result } = renderHook(() => useResourcesAIIntegration())

    expect(result.current.isIntegrated).toBe(true)
  })

  it("должен вернуть пустую статистику когда нет ресурсов", () => {
    const { result } = renderHook(() => useResourcesAIIntegration())

    expect(result.current.resourceStats).toEqual({
      totalMedia: 0,
      totalEffects: 0,
      totalFilters: 0,
      totalSize: 0,
      totalDuration: 0,
      totalMusic: 0,
      mediaFiles: [],
    })
  })

  it("должен подсчитать статистику медиа ресурсов", () => {
    mockResources.mediaResources = [
      {
        id: "media-1",
        file: { id: "file-1", size: 1000000, duration: 60 } as any,
      },
      {
        id: "media-2",
        file: { id: "file-2", size: 2000000, duration: 120 } as any,
      },
    ] as any

    const { result } = renderHook(() => useResourcesAIIntegration())

    expect(result.current.resourceStats.totalMedia).toBe(2)
    expect(result.current.resourceStats.totalSize).toBe(3000000)
    expect(result.current.resourceStats.totalDuration).toBe(180)
  })

  it("должен подсчитать статистику музыки", () => {
    mockResources.musicResources = [
      {
        id: "music-1",
        file: { id: "file-1", size: 500000, duration: 180 } as any,
      },
      {
        id: "music-2",
        file: { id: "file-2", size: 600000, duration: 200 } as any,
      },
    ] as any

    const { result } = renderHook(() => useResourcesAIIntegration())

    expect(result.current.resourceStats.totalMusic).toBe(2)
    expect(result.current.resourceStats.totalSize).toBe(1100000)
    expect(result.current.resourceStats.totalDuration).toBe(380)
  })

  it("должен подсчитать эффекты и фильтры", () => {
    mockResources.effectResources = [{ id: "effect-1" }, { id: "effect-2" }] as any
    mockResources.filterResources = [{ id: "filter-1" }, { id: "filter-2" }, { id: "filter-3" }] as any

    const { result } = renderHook(() => useResourcesAIIntegration())

    expect(result.current.resourceStats.totalEffects).toBe(2)
    expect(result.current.resourceStats.totalFilters).toBe(3)
  })

  it("должен обрабатывать отсутствующие size и duration", () => {
    mockResources.mediaResources = [
      {
        id: "media-1",
        file: { id: "file-1" } as any,
      },
      {
        id: "media-2",
        file: { id: "file-2", size: 1000 } as any,
      },
    ] as any

    const { result } = renderHook(() => useResourcesAIIntegration())

    expect(result.current.resourceStats.totalSize).toBe(1000)
    expect(result.current.resourceStats.totalDuration).toBe(0)
  })

  it("должен подсчитать общий размер медиа и музыки", () => {
    mockResources.mediaResources = [
      {
        id: "media-1",
        file: { id: "file-1", size: 1000000, duration: 60 } as any,
      },
    ] as any

    mockResources.musicResources = [
      {
        id: "music-1",
        file: { id: "file-2", size: 500000, duration: 180 } as any,
      },
    ] as any

    const { result } = renderHook(() => useResourcesAIIntegration())

    expect(result.current.resourceStats.totalSize).toBe(1500000)
    expect(result.current.resourceStats.totalDuration).toBe(240)
  })

  it("должен обновить статистику при изменении ресурсов", () => {
    const { result, rerender } = renderHook(() => useResourcesAIIntegration())

    expect(result.current.resourceStats.totalMedia).toBe(0)

    mockResources.mediaResources = [
      {
        id: "media-1",
        file: { id: "file-1", size: 1000000, duration: 60 } as any,
      },
    ] as any

    rerender()

    expect(result.current.resourceStats.totalMedia).toBe(1)
  })

  it("должен мемоизировать результат", () => {
    const { result, rerender } = renderHook(() => useResourcesAIIntegration())

    const firstResult = result.current

    // Ререндер без изменения зависимостей
    rerender()

    // Результат должен быть тем же объектом
    expect(result.current).toBe(firstResult)
  })

  it("должен создать новый результат при изменении ресурсов", () => {
    const { result, rerender } = renderHook(() => useResourcesAIIntegration())

    const firstResult = result.current

    mockResources.mediaResources = [
      {
        id: "media-1",
        file: { id: "file-1", size: 1000000, duration: 60 } as any,
      },
    ] as any

    rerender()

    // Результат должен быть новым объектом
    expect(result.current).not.toBe(firstResult)
  })
})

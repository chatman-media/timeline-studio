import { act, cleanup, fireEvent, screen } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, type Mock, vi } from "vitest"

import { renderWithBase } from "@/test/test-utils"
import { CacheStatisticsModal } from "../../components/cache-statistics-modal"
import { useCacheStats } from "../../hooks/use-cache-stats"

// Мокаем хук useCacheStats
vi.mock("../../hooks/use-cache-stats", () => ({
  useCacheStats: vi.fn(),
  formatCacheRatio: vi.fn((ratio) => `${(ratio * 100).toFixed(1)}%`),
}))

const mockUseCacheStats = useCacheStats as Mock

// Мок функции
const mockClearPreviewCache = vi.fn()
const mockClearAllCache = vi.fn()
const mockRefreshStats = vi.fn()

describe("CacheStatisticsModal", () => {
  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  beforeEach(() => {
    vi.clearAllMocks()
    // Устанавливаем дефолтный мок
    mockUseCacheStats.mockReturnValue({
      stats: {
        total_entries: 350,
        hit_ratio: 0.75,
        preview_hits: 150,
        preview_misses: 50,
        preview_hit_ratio: 0.75,
        metadata_hits: 200,
        metadata_misses: 100,
        memory_usage: {
          total_bytes: 52428800, // 50 MB
          preview_bytes: 31457280, // 30 MB
          metadata_bytes: 20971520, // 20 MB
          render_bytes: 0,
        },
        cache_size_mb: 50,
      },
      isLoading: false,
      error: null,
      refreshStats: mockRefreshStats,
      clearPreviewCache: mockClearPreviewCache,
      clearAllCache: mockClearAllCache,
    })
  })

  it("должен отображать общую эффективность кэша", () => {
    renderWithBase(<CacheStatisticsModal />)

    expect(screen.getByText("videoCompiler.cache.overallEfficiency")).toBeInTheDocument()
    expect(screen.getAllByText("75.0%")).toHaveLength(2) // overall and preview efficiency
  })

  it("должен отображать статистику превью", () => {
    renderWithBase(<CacheStatisticsModal />)

    // Заголовок
    expect(screen.getByText("videoCompiler.cache.preview")).toBeInTheDocument()

    // Статистика
    expect(screen.getByText("150")).toBeInTheDocument() // hits
    expect(screen.getByText("50")).toBeInTheDocument() // misses
    expect(screen.getAllByText("75.0%")).toHaveLength(2) // overall and preview efficiency
  })

  it("должен отображать статистику метаданных", () => {
    renderWithBase(<CacheStatisticsModal />)

    // Заголовок
    expect(screen.getByText("videoCompiler.cache.metadata")).toBeInTheDocument()

    // Статистика
    expect(screen.getByText("200")).toBeInTheDocument() // hits
    expect(screen.getByText("100")).toBeInTheDocument() // misses
    expect(screen.getByText("50.0 MB")).toBeInTheDocument() // memory usage
  })

  it("должен отображать прогресс бар для hit rate", () => {
    renderWithBase(<CacheStatisticsModal />)

    const progressBar = screen.getByRole("progressbar")
    expect(progressBar).toBeInTheDocument()
    expect(progressBar).toHaveAttribute("aria-valuenow", "75")
  })

  it("должен очищать кэш превью при подтверждении", async () => {
    renderWithBase(<CacheStatisticsModal />)

    const clearPreviewButton = screen.getByText("videoCompiler.cache.clearPreview")

    // Мокаем window.confirm
    window.confirm = vi.fn().mockReturnValue(true)

    await act(async () => {
      fireEvent.click(clearPreviewButton)
    })

    expect(window.confirm).toHaveBeenCalledWith("videoCompiler.cache.confirmClearPreview")
    expect(mockClearPreviewCache).toHaveBeenCalled()
  })

  it("не должен очищать кэш при отмене", async () => {
    renderWithBase(<CacheStatisticsModal />)

    const clearPreviewButton = screen.getByText("videoCompiler.cache.clearPreview")

    // Мокаем window.confirm для отмены
    window.confirm = vi.fn().mockReturnValue(false)

    await act(async () => {
      fireEvent.click(clearPreviewButton)
    })

    expect(window.confirm).toHaveBeenCalled()
    expect(mockClearPreviewCache).not.toHaveBeenCalled()
  })

  it("должен обновлять статистику при клике на refresh", async () => {
    renderWithBase(<CacheStatisticsModal />)

    const refreshButton = screen.getByText("videoCompiler.cache.refresh")

    await act(async () => {
      fireEvent.click(refreshButton)
    })

    expect(mockRefreshStats).toHaveBeenCalled()
  })

  it("должен отображать состояние загрузки", () => {
    // Переопределяем мок для этого теста
    mockUseCacheStats.mockReturnValueOnce({
      stats: null,
      isLoading: true,
      error: null,
      refreshStats: vi.fn(),
      clearPreviewCache: vi.fn(),
      clearAllCache: vi.fn(),
    })

    renderWithBase(<CacheStatisticsModal />)

    // Должен показывать спиннер
    expect(screen.getByTestId("loader2-icon")).toBeInTheDocument()
  })

  it("должен отображать ошибку", () => {
    // Переопределяем мок для этого теста
    mockUseCacheStats.mockReturnValueOnce({
      stats: null,
      isLoading: false,
      error: "Failed to load cache statistics",
      refreshStats: vi.fn(),
      clearPreviewCache: vi.fn(),
      clearAllCache: vi.fn(),
    })

    renderWithBase(<CacheStatisticsModal />)

    expect(screen.getByText("Failed to load cache statistics")).toBeInTheDocument()
    expect(screen.getByText("videoCompiler.cache.retry")).toBeInTheDocument()
  })

  it("должен отображать сообщение когда нет данных", () => {
    // Переопределяем мок для этого теста
    mockUseCacheStats.mockReturnValueOnce({
      stats: null,
      isLoading: false,
      error: null,
      refreshStats: vi.fn(),
      clearPreviewCache: vi.fn(),
      clearAllCache: vi.fn(),
    })

    renderWithBase(<CacheStatisticsModal />)

    expect(screen.getByText("videoCompiler.cache.noData")).toBeInTheDocument()
    expect(screen.getByText("videoCompiler.cache.loadData")).toBeInTheDocument()
  })

  it("должен применять правильные стили для эффективности кэша", () => {
    renderWithBase(<CacheStatisticsModal />)

    // Находим badge с эффективностью превью (75%)
    const efficiencyBadges = screen.getAllByText("75.0%")
    const previewEfficiencyBadge = efficiencyBadges[1] // второй - это эффективность превью

    // Должен иметь зеленый цвет для высокой эффективности (>70%)
    expect(previewEfficiencyBadge).toHaveClass("border-green-600")
  })

  it("должен отключать кнопку refresh во время загрузки", () => {
    // Переопределяем мок для этого теста
    mockUseCacheStats.mockReturnValueOnce({
      stats: {
        total_entries: 0,
        hit_ratio: 0.75,
        preview_hits: 150,
        preview_misses: 50,
        preview_hit_ratio: 0.75,
        metadata_hits: 200,
        metadata_misses: 100,
        memory_usage: {
          total_bytes: 0,
          preview_bytes: 0,
          metadata_bytes: 0,
          render_bytes: 0,
        },
        cache_size_mb: 0,
      },
      isLoading: true, // Загрузка в процессе
      error: null,
      refreshStats: vi.fn(),
      clearPreviewCache: vi.fn(),
      clearAllCache: vi.fn(),
    })

    renderWithBase(<CacheStatisticsModal />)

    const refreshButton = screen.getByText("videoCompiler.cache.refresh")
    expect(refreshButton).toBeDisabled()
  })
})

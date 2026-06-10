import { fireEvent, screen, waitFor } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { indexedDBCacheService } from "@/core/services/media-cache-service"
import { renderWithProviders } from "@/test/test-utils"
import { CacheSettingsModal } from "../../components/cache-settings-modal"

// Мокаем сервис кеша
vi.mock("@/core/services/media-cache-service", () => ({
  indexedDBCacheService: {
    getCacheStatistics: vi.fn(),
    clearPreviewCache: vi.fn(),
    clearFrameCache: vi.fn(),
    clearRecognitionCache: vi.fn(),
    clearSubtitleCache: vi.fn(),
    clearAllCache: vi.fn(),
    cleanupExpiredCache: vi.fn(),
  },
}))

// Мокаем sonner
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

// Мокаем react-i18next
vi.mock("react-i18next", async (importOriginal) => {
  const actual = (await importOriginal()) as any
  return {
    ...actual,
    useTranslation: () => ({
      t: (key: string, options?: any) => {
        if (options) {
          let result = key
          Object.keys(options).forEach((param) => {
            result = result.replace(`{{${param}}}`, options[param])
          })
          return result
        }
        return key
      },
    }),
  }
})

describe("CacheSettingsModal", () => {
  const mockStatistics = {
    previewCache: { count: 10, size: 5 * 1024 * 1024 }, // 5MB
    frameCache: { count: 20, size: 10 * 1024 * 1024 }, // 10MB
    recognitionCache: { count: 5, size: 3 * 1024 * 1024 }, // 3MB
    subtitleCache: { count: 15, size: 2 * 1024 * 1024 }, // 2MB
    totalSize: 20 * 1024 * 1024, // 20MB
  }

  beforeEach(() => {
    vi.clearAllMocks()

    // Настраиваем моки сервиса кеша
    vi.mocked(indexedDBCacheService.getCacheStatistics).mockResolvedValue(mockStatistics)
    vi.mocked(indexedDBCacheService.clearPreviewCache).mockResolvedValue(undefined)
    vi.mocked(indexedDBCacheService.clearFrameCache).mockResolvedValue(undefined)
    vi.mocked(indexedDBCacheService.clearRecognitionCache).mockResolvedValue(undefined)
    vi.mocked(indexedDBCacheService.clearSubtitleCache).mockResolvedValue(undefined)
    vi.mocked(indexedDBCacheService.clearAllCache).mockResolvedValue(undefined)
    vi.mocked(indexedDBCacheService.cleanupExpiredCache).mockResolvedValue(undefined)
  })

  afterEach(() => {
    vi.clearAllTimers()
  })

  it("should render cache settings component", async () => {
    renderWithProviders(<CacheSettingsModal data-oid="_x59ypj" />)

    // Ждем загрузки статистики
    await waitFor(() => {
      expect(screen.getByText("browser.media.cache.title")).toBeInTheDocument()
    })

    // Проверяем описание
    expect(screen.getByText("browser.media.cache.description")).toBeInTheDocument()
  })

  it("should display loading state initially", () => {
    renderWithProviders(<CacheSettingsModal data-oid="6r:g-x0" />)

    // Проверяем спиннер загрузки
    expect(document.querySelector(".animate-spin")).toBeInTheDocument()
  })

  it("should display cache statistics after loading", async () => {
    renderWithProviders(<CacheSettingsModal data-oid="cmxwgfh" />)

    // Ждем загрузки статистики
    await waitFor(() => {
      expect(screen.getByText("browser.media.cache.title")).toBeInTheDocument()
    })

    // Проверяем отображение различных типов кеша
    expect(screen.getByText("browser.media.cache.previewCache.title")).toBeInTheDocument()
    expect(screen.getByText("browser.media.cache.frameCache.title")).toBeInTheDocument()
    expect(screen.getByText("browser.media.cache.recognitionCache.title")).toBeInTheDocument()
    expect(screen.getByText("browser.media.cache.subtitleCache.title")).toBeInTheDocument()

    // Проверяем кнопки очистки
    const clearButtons = screen.getAllByText("browser.media.cache.actions.clear")
    expect(clearButtons).toHaveLength(4) // По одной для каждого типа кеша
  })

  it("should clear preview cache", async () => {
    renderWithProviders(<CacheSettingsModal data-oid="_8eixbg" />)

    // Ждем загрузки компонента
    await waitFor(() => {
      expect(screen.getByText("browser.media.cache.title")).toBeInTheDocument()
    })

    // Находим кнопку очистки превью
    const clearButtons = screen.getAllByText("browser.media.cache.actions.clear")
    const previewClearButton = clearButtons[0]

    // Кликаем на кнопку
    fireEvent.click(previewClearButton)

    // Проверяем, что сервис был вызван
    await waitFor(() => {
      expect(indexedDBCacheService.clearPreviewCache).toHaveBeenCalledTimes(1)
    })
  })

  it("should clear frame cache", async () => {
    renderWithProviders(<CacheSettingsModal data-oid="gvvqky:" />)

    // Ждем загрузки компонента
    await waitFor(() => {
      expect(screen.getByText("browser.media.cache.title")).toBeInTheDocument()
    })

    const clearButtons = screen.getAllByText("browser.media.cache.actions.clear")

    // Очищаем кеш кадров
    fireEvent.click(clearButtons[1])
    await waitFor(() => {
      expect(indexedDBCacheService.clearFrameCache).toHaveBeenCalledTimes(1)
    })
  })

  it("should clear recognition cache", async () => {
    renderWithProviders(<CacheSettingsModal data-oid="f8km7gm" />)

    // Ждем загрузки компонента
    await waitFor(() => {
      expect(screen.getByText("browser.media.cache.title")).toBeInTheDocument()
    })

    const clearButtons = screen.getAllByText("browser.media.cache.actions.clear")

    // Очищаем кеш распознавания
    fireEvent.click(clearButtons[2])
    await waitFor(() => {
      expect(indexedDBCacheService.clearRecognitionCache).toHaveBeenCalledTimes(1)
    })
  })

  it("should clear subtitle cache", async () => {
    renderWithProviders(<CacheSettingsModal data-oid="319-l2z" />)

    // Ждем загрузки компонента
    await waitFor(() => {
      expect(screen.getByText("browser.media.cache.title")).toBeInTheDocument()
    })

    const clearButtons = screen.getAllByText("browser.media.cache.actions.clear")

    // Очищаем кеш субтитров
    fireEvent.click(clearButtons[3])
    await waitFor(() => {
      expect(indexedDBCacheService.clearSubtitleCache).toHaveBeenCalledTimes(1)
    })
  })

  it("should clear all cache at once", async () => {
    renderWithProviders(<CacheSettingsModal data-oid="u59o2ly" />)

    // Ждем загрузки компонента
    await waitFor(() => {
      expect(screen.getByText("browser.media.cache.title")).toBeInTheDocument()
    })

    // Находим кнопку очистки всего кеша
    const clearAllButton = screen.getByText("browser.media.cache.actions.clearAll")

    // Кликаем на кнопку
    fireEvent.click(clearAllButton)

    // Проверяем, что сервис был вызван
    await waitFor(() => {
      expect(indexedDBCacheService.clearAllCache).toHaveBeenCalledTimes(1)
    })
  })

  it("should test cleanup expired cache", async () => {
    renderWithProviders(<CacheSettingsModal data-oid="bqi796." />)

    // Ждем загрузки компонента
    await waitFor(() => {
      expect(screen.getByText("browser.media.cache.title")).toBeInTheDocument()
    })

    // Находим кнопку очистки устаревшего кеша
    const cleanupButton = screen.getByText("browser.media.cache.actions.cleanupExpired")

    // Кликаем на кнопку
    fireEvent.click(cleanupButton)

    // Проверяем, что сервис был вызван
    await waitFor(() => {
      expect(indexedDBCacheService.cleanupExpiredCache).toHaveBeenCalledTimes(1)
    })
  })

  it("should show empty state when no cache", async () => {
    const emptyStatistics = {
      previewCache: { count: 0, size: 0 },
      frameCache: { count: 0, size: 0 },
      recognitionCache: { count: 0, size: 0 },
      subtitleCache: { count: 0, size: 0 },
      totalSize: 0,
    }

    vi.mocked(indexedDBCacheService.getCacheStatistics).mockResolvedValue(emptyStatistics)

    renderWithProviders(<CacheSettingsModal data-oid="52tl8z9" />)

    // Ждем загрузки компонента
    await waitFor(() => {
      expect(screen.getByText("browser.media.cache.title")).toBeInTheDocument()
    })

    // Проверяем отображение нулевых значений в строке общего размера
    expect(screen.getByText("0.0 B")).toBeInTheDocument()
  })
})

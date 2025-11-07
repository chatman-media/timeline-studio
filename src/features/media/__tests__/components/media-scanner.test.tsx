import { fireEvent, screen, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { renderWithProviders } from "@/test/test-utils"

import { MediaScanner } from "../../components/media-scanner"

// Мокаем Tauri dialog API
vi.mock("@tauri-apps/plugin-dialog", () => ({
  open: vi.fn(),
}))

// Мокаем useMediaProcessor
vi.mock("../../hooks/use-media-processor", () => ({
  useMediaProcessor: vi.fn(),
}))

describe("MediaScanner", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should render media scanner interface", async () => {
    // Мокаем useMediaProcessor для этого теста
    const { useMediaProcessor } = await import("../../hooks/use-media-processor")
    vi.mocked(useMediaProcessor).mockReturnValue({
      scanFolder: vi.fn().mockResolvedValue([]),
      scanFolderWithThumbnails: vi.fn().mockResolvedValue([]),
      processFiles: vi.fn().mockResolvedValue([]),
      processFilesWithThumbnails: vi.fn().mockResolvedValue([]),
      isProcessing: false,
      progress: { current: 0, total: 0 },
      errors: new Map(),
      clearErrors: vi.fn(),
      cancelProcessing: vi.fn().mockResolvedValue(undefined),
    })

    renderWithProviders(<MediaScanner />)

    // Проверяем основные элементы интерфейса
    expect(screen.getByText("Сканирование медиафайлов")).toBeInTheDocument()
    expect(screen.getByText("Выберите папку для асинхронного сканирования и обработки медиафайлов")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /выбрать папку/i })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /начать сканирование/i })).toBeInTheDocument()
  })

  it("should disable scan button when no folder selected", async () => {
    // Мокаем useMediaProcessor для этого теста
    const { useMediaProcessor } = await import("../../hooks/use-media-processor")
    vi.mocked(useMediaProcessor).mockReturnValue({
      scanFolder: vi.fn().mockResolvedValue([]),
      scanFolderWithThumbnails: vi.fn().mockResolvedValue([]),
      processFiles: vi.fn().mockResolvedValue([]),
      processFilesWithThumbnails: vi.fn().mockResolvedValue([]),
      isProcessing: false,
      progress: { current: 0, total: 0 },
      errors: new Map(),
      clearErrors: vi.fn(),
      cancelProcessing: vi.fn().mockResolvedValue(undefined),
    })

    renderWithProviders(<MediaScanner />)

    // Кнопка сканирования должна быть отключена, если папка не выбрана
    expect(screen.getByRole("button", { name: /начать сканирование/i })).toBeDisabled()
  })

  it("should handle folder selection", async () => {
    const { open } = await import("@tauri-apps/plugin-dialog")
    const { useMediaProcessor } = await import("../../hooks/use-media-processor")

    vi.mocked(open).mockResolvedValue("/path/to/test/folder")
    vi.mocked(useMediaProcessor).mockReturnValue({
      scanFolder: vi.fn().mockResolvedValue([]),
      scanFolderWithThumbnails: vi.fn().mockResolvedValue([]),
      processFiles: vi.fn().mockResolvedValue([]),
      processFilesWithThumbnails: vi.fn().mockResolvedValue([]),
      isProcessing: false,
      progress: { current: 0, total: 0 },
      errors: new Map(),
      clearErrors: vi.fn(),
      cancelProcessing: vi.fn().mockResolvedValue(undefined),
    })

    renderWithProviders(<MediaScanner />)

    // Кликаем на кнопку выбора папки
    fireEvent.click(screen.getByRole("button", { name: /выбрать папку/i }))

    await waitFor(() => {
      expect(open).toHaveBeenCalledWith({
        directory: true,
        multiple: false,
        title: "Выберите папку для сканирования",
      })
    })

    await waitFor(() => {
      // Проверяем, что отображается выбранная папка
      expect(screen.getByText("Выбрана папка: /path/to/test/folder")).toBeInTheDocument()
      // Кнопка должна поменять текст
      expect(screen.getByRole("button", { name: /изменить папку/i })).toBeInTheDocument()
      // Кнопка сканирования должна стать доступной
      expect(screen.getByRole("button", { name: /начать сканирование/i })).not.toBeDisabled()
    })
  })

  it("should handle folder selection cancellation", async () => {
    const { open } = await import("@tauri-apps/plugin-dialog")
    const { useMediaProcessor } = await import("../../hooks/use-media-processor")

    vi.mocked(open).mockResolvedValue(null) // Пользователь отменил выбор
    vi.mocked(useMediaProcessor).mockReturnValue({
      scanFolder: vi.fn().mockResolvedValue([]),
      scanFolderWithThumbnails: vi.fn().mockResolvedValue([]),
      processFiles: vi.fn().mockResolvedValue([]),
      processFilesWithThumbnails: vi.fn().mockResolvedValue([]),
      isProcessing: false,
      progress: { current: 0, total: 0 },
      errors: new Map(),
      clearErrors: vi.fn(),
      cancelProcessing: vi.fn().mockResolvedValue(undefined),
    })

    renderWithProviders(<MediaScanner />)

    fireEvent.click(screen.getByRole("button", { name: /выбрать папку/i }))

    await waitFor(() => {
      expect(open).toHaveBeenCalled()
    })

    // Проверяем, что состояние не изменилось
    expect(screen.queryByText(/выбрана папка/i)).not.toBeInTheDocument()
    expect(screen.getByRole("button", { name: /начать сканирование/i })).toBeDisabled()
  })

  it("should handle folder scanning", async () => {
    const mockFiles = [
      {
        id: "file1",
        name: "video1.mp4",
        path: "/path/to/video1.mp4",
        isVideo: true,
        isAudio: false,
        isImage: false,
        duration: 120,
      },
      {
        id: "file2",
        name: "audio1.mp3",
        path: "/path/to/audio1.mp3",
        isVideo: false,
        isAudio: true,
        isImage: false,
        duration: 180,
      },
    ]

    const { open } = await import("@tauri-apps/plugin-dialog")
    const { useMediaProcessor } = await import("../../hooks/use-media-processor")

    vi.mocked(open).mockResolvedValue("/path/to/test/folder")

    const mockScanFolderWithThumbnails = vi.fn().mockResolvedValue(mockFiles)
    vi.mocked(useMediaProcessor).mockReturnValue({
      scanFolder: vi.fn(),
      scanFolderWithThumbnails: mockScanFolderWithThumbnails,
      processFiles: vi.fn(),
      processFilesWithThumbnails: vi.fn(),
      isProcessing: false,
      progress: { current: 0, total: 0 },
      errors: new Map(),
      clearErrors: vi.fn(),
      cancelProcessing: vi.fn().mockResolvedValue(undefined),
    })

    renderWithProviders(<MediaScanner />)

    // Выбираем папку
    fireEvent.click(screen.getByRole("button", { name: /выбрать папку/i }))
    await waitFor(() => {
      expect(screen.getByText("Выбрана папка: /path/to/test/folder")).toBeInTheDocument()
    })

    // Запускаем сканирование
    fireEvent.click(screen.getByRole("button", { name: /начать сканирование/i }))

    await waitFor(() => {
      expect(mockScanFolderWithThumbnails).toHaveBeenCalledWith("/path/to/test/folder", 320, 180)
    })

    await waitFor(() => {
      // Проверяем, что отобразились результаты сканирования
      expect(screen.getByText("Обработано файлов: 2")).toBeInTheDocument()
      expect(screen.getByText("video1.mp4")).toBeInTheDocument()
      expect(screen.getByText("audio1.mp3")).toBeInTheDocument()
      expect(screen.getByText(/Видео/)).toBeInTheDocument()
      expect(screen.getByText(/Аудио/)).toBeInTheDocument()
    })
  })

  it("should show processing state", async () => {
    const { useMediaProcessor } = await import("../../hooks/use-media-processor")

    // Мокаем состояние обработки
    vi.mocked(useMediaProcessor).mockReturnValue({
      scanFolder: vi.fn().mockResolvedValue([]),
      scanFolderWithThumbnails: vi.fn().mockResolvedValue([]),
      processFiles: vi.fn().mockResolvedValue([]),
      processFilesWithThumbnails: vi.fn().mockResolvedValue([]),
      isProcessing: true,
      progress: { current: 5, total: 10 },
      errors: new Map(),
      clearErrors: vi.fn(),
      cancelProcessing: vi.fn().mockResolvedValue(undefined),
    })

    renderWithProviders(<MediaScanner />)

    // Проверяем индикатор загрузки
    expect(screen.getByText("Сканирование...")).toBeInTheDocument()
    expect(screen.getByText("Обработка файлов")).toBeInTheDocument()
    expect(screen.getByText("5 / 10")).toBeInTheDocument()

    // Кнопки должны быть отключены во время обработки
    expect(screen.getByRole("button", { name: /выбрать папку/i })).toBeDisabled()
    expect(screen.getByRole("button", { name: /сканирование/i })).toBeDisabled()
  })

  it("should display processing errors", async () => {
    const { useMediaProcessor } = await import("../../hooks/use-media-processor")
    const mockErrors = new Map([
      ["file1", "Failed to read metadata"],
      ["file2", "Thumbnail generation failed"],
    ])

    // Мокаем состояние с ошибками
    vi.mocked(useMediaProcessor).mockReturnValue({
      scanFolder: vi.fn().mockResolvedValue([]),
      scanFolderWithThumbnails: vi.fn().mockResolvedValue([]),
      processFiles: vi.fn().mockResolvedValue([]),
      processFilesWithThumbnails: vi.fn().mockResolvedValue([]),
      isProcessing: false,
      progress: { current: 0, total: 0 },
      errors: mockErrors,
      clearErrors: vi.fn(),
      cancelProcessing: vi.fn().mockResolvedValue(undefined),
    })

    renderWithProviders(<MediaScanner />)

    // Проверяем отображение ошибок
    expect(screen.getByText("Ошибки при обработке (2)")).toBeInTheDocument()
    expect(screen.getByText("file1:")).toBeInTheDocument()
    expect(screen.getByText("Failed to read metadata")).toBeInTheDocument()
    expect(screen.getByText("file2:")).toBeInTheDocument()
    expect(screen.getByText("Thumbnail generation failed")).toBeInTheDocument()
  })

  it("should show file type indicators", async () => {
    const mockFiles = [
      {
        id: "file1",
        name: "video.mp4",
        path: "/path/to/video.mp4",
        isVideo: true,
        isAudio: false,
        isImage: false,
        duration: 120,
      },
      {
        id: "file2",
        name: "audio.mp3",
        path: "/path/to/audio.mp3",
        isVideo: false,
        isAudio: true,
        isImage: false,
        duration: 180,
      },
      {
        id: "file3",
        name: "image.jpg",
        path: "/path/to/image.jpg",
        isVideo: false,
        isAudio: false,
        isImage: true,
      },
    ]

    const { open } = await import("@tauri-apps/plugin-dialog")
    const { useMediaProcessor } = await import("../../hooks/use-media-processor")

    vi.mocked(open).mockResolvedValue("/path/to/test/folder")

    const mockScanFolderWithThumbnails = vi.fn().mockResolvedValue(mockFiles)
    vi.mocked(useMediaProcessor).mockReturnValue({
      scanFolder: vi.fn(),
      scanFolderWithThumbnails: mockScanFolderWithThumbnails,
      processFiles: vi.fn(),
      processFilesWithThumbnails: vi.fn(),
      isProcessing: false,
      progress: { current: 0, total: 0 },
      errors: new Map(),
      clearErrors: vi.fn(),
      cancelProcessing: vi.fn().mockResolvedValue(undefined),
    })

    renderWithProviders(<MediaScanner />)

    // Выбираем папку и запускаем сканирование
    fireEvent.click(screen.getByRole("button", { name: /выбрать папку/i }))
    await waitFor(() => {
      expect(screen.getByText("Выбрана папка: /path/to/test/folder")).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole("button", { name: /начать сканирование/i }))

    await waitFor(() => {
      // Проверяем индикаторы типов файлов
      expect(screen.getByText(/Видео/)).toBeInTheDocument()
      expect(screen.getByText(/Аудио/)).toBeInTheDocument()
      expect(screen.getByText(/Изображение/)).toBeInTheDocument()

      // Проверяем отображение длительности для видео и аудио
      expect(screen.getByText(/\(120с\)/)).toBeInTheDocument()
      expect(screen.getByText(/\(180с\)/)).toBeInTheDocument()
    })
  })

  it("should clear errors when selecting new folder", async () => {
    const { open } = await import("@tauri-apps/plugin-dialog")
    const { useMediaProcessor } = await import("../../hooks/use-media-processor")

    const mockErrors = new Map([["file1", "Some error"]])
    const mockClearErrors = vi.fn()

    vi.mocked(useMediaProcessor).mockReturnValue({
      scanFolder: vi.fn().mockResolvedValue([]),
      scanFolderWithThumbnails: vi.fn().mockResolvedValue([]),
      processFiles: vi.fn().mockResolvedValue([]),
      processFilesWithThumbnails: vi.fn().mockResolvedValue([]),
      isProcessing: false,
      progress: { current: 0, total: 0 },
      errors: mockErrors,
      clearErrors: mockClearErrors,
      cancelProcessing: vi.fn().mockResolvedValue(undefined),
    })

    vi.mocked(open).mockResolvedValue("/new/path")

    renderWithProviders(<MediaScanner />)

    // Кликаем на выбор папки
    fireEvent.click(screen.getByRole("button", { name: /выбрать папку/i }))

    await waitFor(() => {
      expect(mockClearErrors).toHaveBeenCalled()
    })
  })

  it("should handle scan errors gracefully", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})

    const { open } = await import("@tauri-apps/plugin-dialog")
    const { useMediaProcessor } = await import("../../hooks/use-media-processor")

    vi.mocked(open).mockResolvedValue("/path/to/test/folder")

    const mockScanFolderWithThumbnails = vi.fn().mockRejectedValue(new Error("Scan failed"))
    vi.mocked(useMediaProcessor).mockReturnValue({
      scanFolder: vi.fn(),
      scanFolderWithThumbnails: mockScanFolderWithThumbnails,
      processFiles: vi.fn(),
      processFilesWithThumbnails: vi.fn(),
      isProcessing: false,
      progress: { current: 0, total: 0 },
      errors: new Map(),
      clearErrors: vi.fn(),
      cancelProcessing: vi.fn().mockResolvedValue(undefined),
    })

    renderWithProviders(<MediaScanner />)

    // Выбираем папку
    fireEvent.click(screen.getByRole("button", { name: /выбрать папку/i }))
    await waitFor(() => {
      expect(screen.getByText("Выбрана папка: /path/to/test/folder")).toBeInTheDocument()
    })

    // Запускаем сканирование
    fireEvent.click(screen.getByRole("button", { name: /начать сканирование/i }))

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith("Ошибка сканирования:", expect.any(Error))
    })

    consoleSpy.mockRestore()
  })

  it("should not scan without selected folder", async () => {
    const { useMediaProcessor } = await import("../../hooks/use-media-processor")
    const mockScanFolderWithThumbnails = vi.fn()

    vi.mocked(useMediaProcessor).mockReturnValue({
      scanFolder: vi.fn(),
      scanFolderWithThumbnails: mockScanFolderWithThumbnails,
      processFiles: vi.fn(),
      processFilesWithThumbnails: vi.fn(),
      isProcessing: false,
      progress: { current: 0, total: 0 },
      errors: new Map(),
      clearErrors: vi.fn(),
      cancelProcessing: vi.fn().mockResolvedValue(undefined),
    })

    renderWithProviders(<MediaScanner />)

    // Попытка запустить сканирование без выбранной папки (кнопка отключена)
    const scanButton = screen.getByRole("button", { name: /начать сканирование/i })
    expect(scanButton).toBeDisabled()

    // scanFolderWithThumbnails не должен быть вызван
    expect(mockScanFolderWithThumbnails).not.toHaveBeenCalled()
  })
})

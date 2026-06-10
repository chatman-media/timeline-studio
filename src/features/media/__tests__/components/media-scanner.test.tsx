import { fireEvent, screen, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { render } from "@/test/test-utils"

import { MediaScanner } from "../../components/media-scanner"

// Мокаем container с платформенным сервисом
vi.mock("@/core", () => ({
  container: {
    hasPlatform: vi.fn().mockReturnValue(true),
    getPlatform: vi.fn().mockReturnValue({
      showOpenDialog: vi.fn(),
    }),
  },
}))

// Мокаем mediaProcessorService
vi.mock("@/domains/media-management/services/media-processor-service", () => ({
  mediaProcessorService: {
    scanFolder: vi.fn(),
    scanFolderWithThumbnails: vi.fn(),
    processFiles: vi.fn(),
    processFilesWithThumbnails: vi.fn(),
    cancelProcessing: vi.fn(),
    processFileSimple: vi.fn(),
  },
}))

// Мокаем useMediaProcessor
vi.mock("@/features/media/hooks/media-management", () => ({
  useMediaProcessor: vi.fn(),
}))

describe("MediaScanner", () => {
  let mockShowOpenDialog: any

  beforeEach(async () => {
    vi.clearAllMocks()
    const { container } = await import("@/core")
    mockShowOpenDialog = container.getPlatform().showOpenDialog as any
  })

  it("should render media scanner interface", async () => {
    // Мокаем useMediaProcessor для этого теста
    const { useMediaProcessor } = await import("@/features/media/hooks/media-management")
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

    render(<MediaScanner data-oid="xnkn-:4" />)

    // Проверяем основные элементы интерфейса
    expect(screen.getByText("Сканирование медиафайлов")).toBeInTheDocument()
    expect(screen.getByText("Выберите папку для асинхронного сканирования и обработки медиафайлов")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /выбрать папку/i })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /начать сканирование/i })).toBeInTheDocument()
  })

  it("should disable scan button when no folder selected", async () => {
    // Мокаем useMediaProcessor для этого теста
    const { useMediaProcessor } = await import("@/features/media/hooks/media-management")
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

    render(<MediaScanner data-oid="8xypai." />)

    // Кнопка сканирования должна быть отключена, если папка не выбрана
    expect(screen.getByRole("button", { name: /начать сканирование/i })).toBeDisabled()
  })

  it("should handle folder selection", async () => {
    const { useMediaProcessor } = await import("@/features/media/hooks/media-management")

    mockShowOpenDialog.mockResolvedValue(["/path/to/test/folder"])
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

    render(<MediaScanner data-oid="zu_03u." />)

    // Кликаем на кнопку выбора папки
    fireEvent.click(screen.getByRole("button", { name: /выбрать папку/i }))

    await waitFor(() => {
      expect(mockShowOpenDialog).toHaveBeenCalledWith({
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
    const { useMediaProcessor } = await import("@/features/media/hooks/media-management")

    mockShowOpenDialog.mockResolvedValue(null) // Пользователь отменил выбор
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

    render(<MediaScanner data-oid="w1tykz2" />)

    fireEvent.click(screen.getByRole("button", { name: /выбрать папку/i }))

    await waitFor(() => {
      expect(mockShowOpenDialog).toHaveBeenCalled()
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

    const { useMediaProcessor } = await import("@/features/media/hooks/media-management")

    mockShowOpenDialog.mockResolvedValue(["/path/to/test/folder"])

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

    render(<MediaScanner data-oid="afcgbmq" />)

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
    const { useMediaProcessor } = await import("@/features/media/hooks/media-management")

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

    render(<MediaScanner data-oid="zdu4you" />)

    // Проверяем индикатор загрузки
    expect(screen.getByText("Сканирование...")).toBeInTheDocument()
    expect(screen.getByText("Обработка файлов")).toBeInTheDocument()
    expect(screen.getByText("5 / 10")).toBeInTheDocument()

    // Кнопки должны быть отключены во время обработки
    expect(screen.getByRole("button", { name: /выбрать папку/i })).toBeDisabled()
    expect(screen.getByRole("button", { name: /сканирование/i })).toBeDisabled()
  })

  it("should display processing errors", async () => {
    const { useMediaProcessor } = await import("@/features/media/hooks/media-management")
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

    render(<MediaScanner data-oid="ubjh6_g" />)

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

    const { useMediaProcessor } = await import("@/features/media/hooks/media-management")

    mockShowOpenDialog.mockResolvedValue(["/path/to/test/folder"])

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

    render(<MediaScanner data-oid="nci:067" />)

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
    const { useMediaProcessor } = await import("@/features/media/hooks/media-management")

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

    mockShowOpenDialog.mockResolvedValue(["/new/path"])

    render(<MediaScanner data-oid="n5h6r7f" />)

    // Кликаем на выбор папки
    fireEvent.click(screen.getByRole("button", { name: /выбрать папку/i }))

    await waitFor(() => {
      expect(mockClearErrors).toHaveBeenCalled()
    })
  })

  it("should handle scan errors gracefully", async () => {
    const { useMediaProcessor } = await import("@/features/media/hooks/media-management")

    mockShowOpenDialog.mockResolvedValue(["/path/to/test/folder"])

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

    render(<MediaScanner data-oid="1.jpl69" />)

    // Выбираем папку
    fireEvent.click(screen.getByRole("button", { name: /выбрать папку/i }))
    await waitFor(() => {
      expect(screen.getByText("Выбрана папка: /path/to/test/folder")).toBeInTheDocument()
    })

    // Запускаем сканирование
    fireEvent.click(screen.getByRole("button", { name: /начать сканирование/i }))

    await waitFor(() => {
      // Проверяем, что функция сканирования была вызвана
      expect(mockScanFolderWithThumbnails).toHaveBeenCalledWith("/path/to/test/folder", 320, 180)
    })

    // Проверяем, что компонент не крашится и UI остается стабильным
    expect(screen.getByText("Сканирование медиафайлов")).toBeInTheDocument()
    expect(screen.getByText("Выбрана папка: /path/to/test/folder")).toBeInTheDocument()
  })

  it("should not scan without selected folder", async () => {
    const { useMediaProcessor } = await import("@/features/media/hooks/media-management")
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

    render(<MediaScanner data-oid="k0rbhhj" />)

    // Попытка запустить сканирование без выбранной папки (кнопка отключена)
    const scanButton = screen.getByRole("button", {
      name: /начать сканирование/i,
    })
    expect(scanButton).toBeDisabled()

    // scanFolderWithThumbnails не должен быть вызван
    expect(mockScanFolderWithThumbnails).not.toHaveBeenCalled()
  })
})

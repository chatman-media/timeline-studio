import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

// Мокаем MediaRestorationService
vi.mock("@/domains/media-management/services/media-restoration-service", () => ({
  promptUserToFindFile: vi.fn(),
}))

// Мокаем tauri-logger
vi.mock("@/lib/tauri-logger", () => ({
  createLogger: vi.fn(() => ({
    error: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
  })),
}))

import type { SavedMediaFile } from "@/features/media/types/saved-media"

import { MissingFilesDialog } from "../../components/missing-files-dialog"

// Мокаем UI компоненты
vi.mock("@/components/ui/alert-dialog", () => ({
  AlertDialog: ({ children, open }: any) => (open ? <div data-testid="alert-dialog">{children}</div> : null),
  AlertDialogContent: ({ children }: any) => <div data-testid="dialog-content">{children}</div>,
  AlertDialogHeader: ({ children }: any) => <div data-testid="dialog-header">{children}</div>,
  AlertDialogTitle: ({ children }: any) => <h2 data-testid="dialog-title">{children}</h2>,
  AlertDialogDescription: ({ children }: any) => <p data-testid="dialog-description">{children}</p>,
  AlertDialogFooter: ({ children }: any) => <div data-testid="dialog-footer">{children}</div>,
  AlertDialogAction: ({ children, onClick }: any) => (
    <button data-testid="dialog-action" onClick={onClick}>
      {children}
    </button>
  ),
  AlertDialogCancel: ({ children, onClick }: any) => (
    <button data-testid="dialog-cancel" onClick={onClick}>
      {children}
    </button>
  ),
}))

vi.mock("@/components/ui/button", () => ({
  Button: ({ children, onClick, variant, size, ...props }: any) => (
    <button onClick={onClick} data-testid={`button-${variant || "default"}`} data-size={size} {...props}>
      {children}
    </button>
  ),
}))

vi.mock("@/components/ui/separator", () => ({
  Separator: () => <hr data-testid="separator" />,
}))

// Мокаем иконки
vi.mock("lucide-react", () => ({
  AlertTriangle: () => <div data-testid="alert-triangle-icon" />,
  CheckCircle: () => <div data-testid="check-circle-icon" />,
  FileX: () => <div data-testid="file-x-icon" />,
  Search: () => <div data-testid="search-icon" />,
  Trash2: () => <div data-testid="trash-icon" />,
}))

const { promptUserToFindFile } = await import("@/domains/media-management/services/media-restoration-service")
const mockPromptUserToFindFile = vi.mocked(promptUserToFindFile)

describe("MissingFilesDialog", () => {
  const mockMissingFiles: SavedMediaFile[] = [
    {
      id: "file-1",
      originalPath: "/path/to/video1.mp4",
      name: "video1.mp4",
      size: 1024,
      lastModified: Date.now(),
      isVideo: true,
      isAudio: false,
      isImage: false,
      metadata: { duration: 120 },
      status: "missing",
      lastChecked: Date.now(),
    },
    {
      id: "file-2",
      originalPath: "/path/to/audio.mp3",
      name: "audio.mp3",
      size: 512,
      lastModified: Date.now(),
      isVideo: false,
      isAudio: true,
      isImage: false,
      metadata: { duration: 180 },
      status: "missing",
      lastChecked: Date.now(),
    },
  ]

  const mockOnResolve = vi.fn()
  const mockOnOpenChange = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("должен отображаться когда open=true", () => {
    render(
      <MissingFilesDialog
        open
        onOpenChange={mockOnOpenChange}
        missingFiles={mockMissingFiles}
        onResolve={mockOnResolve}
      />,
    )

    expect(screen.getByTestId("alert-dialog")).toBeInTheDocument()
    expect(screen.getByTestId("dialog-title")).toHaveTextContent("Отсутствующие медиафайлы")
  })

  it("не должен отображаться когда open=false", () => {
    render(
      <MissingFilesDialog
        open={false}
        onOpenChange={mockOnOpenChange}
        missingFiles={mockMissingFiles}
        onResolve={mockOnResolve}
      />,
    )

    expect(screen.queryByTestId("alert-dialog")).not.toBeInTheDocument()
  })

  it("должен отображать список отсутствующих файлов", () => {
    render(
      <MissingFilesDialog
        open
        onOpenChange={mockOnOpenChange}
        missingFiles={mockMissingFiles}
        onResolve={mockOnResolve}
      />,
    )

    expect(screen.getByText("video1.mp4")).toBeInTheDocument()
    expect(screen.getByText("audio.mp3")).toBeInTheDocument()
    expect(screen.getByText("/path/to/video1.mp4")).toBeInTheDocument()
    expect(screen.getByText("/path/to/audio.mp3")).toBeInTheDocument()
  })

  it("должен показывать правильные иконки статуса", () => {
    render(
      <MissingFilesDialog
        open
        onOpenChange={mockOnOpenChange}
        missingFiles={mockMissingFiles}
        onResolve={mockOnResolve}
      />,
    )

    // Должны быть иконки предупреждения: 1 в заголовке + 2 для файлов = 3
    expect(screen.getAllByTestId("alert-triangle-icon")).toHaveLength(3)
  })

  it("должен позволять найти файл", async () => {
    const user = userEvent.setup()
    mockPromptUserToFindFile.mockResolvedValue("/new/path/video1.mp4")

    render(
      <MissingFilesDialog
        open
        onOpenChange={mockOnOpenChange}
        missingFiles={[mockMissingFiles[0]]}
        onResolve={mockOnResolve}
      />,
    )

    const findButtons = screen.getAllByTestId("search-icon")
    await user.click(findButtons[0].closest("button")!)

    await waitFor(() => {
      expect(mockPromptUserToFindFile).toHaveBeenCalledWith(mockMissingFiles[0])
    })

    // Проверяем, что статус изменился на "найден"
    await waitFor(() => {
      expect(screen.getByTestId("check-circle-icon")).toBeInTheDocument()
    })
  })

  it("должен позволять удалить файл из проекта", async () => {
    const user = userEvent.setup()

    render(
      <MissingFilesDialog
        open
        onOpenChange={mockOnOpenChange}
        missingFiles={[mockMissingFiles[0]]}
        onResolve={mockOnResolve}
      />,
    )

    const removeButtons = screen.getAllByTestId("trash-icon")
    await user.click(removeButtons[0].closest("button")!)

    // Проверяем, что статус изменился на "удален" (иконка остается trash-icon, но меняется текст)
    await waitFor(() => {
      expect(screen.getByText("Удалить")).toBeInTheDocument()
    })
  })

  it('должен применять изменения при нажатии "Применить изменения"', async () => {
    const user = userEvent.setup()
    mockPromptUserToFindFile.mockResolvedValue("/new/path/video1.mp4")

    render(
      <MissingFilesDialog
        open
        onOpenChange={mockOnOpenChange}
        missingFiles={mockMissingFiles}
        onResolve={mockOnResolve}
      />,
    )

    // Найдем первый файл
    const findButtons = screen.getAllByTestId("search-icon")
    await user.click(findButtons[0].closest("button")!)

    await waitFor(() => {
      expect(screen.getByTestId("check-circle-icon")).toBeInTheDocument()
    })

    // Удалим второй файл
    const removeButtons = screen.getAllByTestId("trash-icon")
    await user.click(removeButtons[0].closest("button")!)

    await waitFor(() => {
      expect(screen.getByText("Удалить")).toBeInTheDocument()
    })

    // Применим изменения
    const applyButton = screen.getByTestId("dialog-action")
    await user.click(applyButton)

    expect(mockOnResolve).toHaveBeenCalledWith([
      {
        file: mockMissingFiles[0],
        newPath: "/new/path/video1.mp4",
        action: "found",
      },
      {
        file: mockMissingFiles[1],
        action: "remove",
      },
    ])
  })

  it('должен закрываться при нажатии "Пропустить все"', async () => {
    const user = userEvent.setup()

    render(
      <MissingFilesDialog
        open
        onOpenChange={mockOnOpenChange}
        missingFiles={mockMissingFiles}
        onResolve={mockOnResolve}
      />,
    )

    const skipButton = screen.getByTestId("dialog-cancel")
    await user.click(skipButton)

    expect(mockOnOpenChange).toHaveBeenCalledWith(false)
  })

  it("должен показывать правильное количество файлов в заголовке", () => {
    render(
      <MissingFilesDialog
        open
        onOpenChange={mockOnOpenChange}
        missingFiles={mockMissingFiles}
        onResolve={mockOnResolve}
      />,
    )

    // Количество файлов показывается в статистике, а не в описании
    expect(screen.getByText("Файлов: 2")).toBeInTheDocument()
  })

  it("должен обрабатывать отмену поиска файла", async () => {
    const user = userEvent.setup()
    mockPromptUserToFindFile.mockResolvedValue(null) // Пользователь отменил

    render(
      <MissingFilesDialog
        open
        onOpenChange={mockOnOpenChange}
        missingFiles={[mockMissingFiles[0]]}
        onResolve={mockOnResolve}
      />,
    )

    const findButton = screen.getAllByTestId("search-icon")[0]
    await user.click(findButton.closest("button")!)

    await waitFor(() => {
      expect(mockPromptUserToFindFile).toHaveBeenCalled()
    })

    // Статус должен остаться "отсутствует"
    expect(screen.getByTestId("alert-triangle-icon")).toBeInTheDocument()
  })

  it("должен показывать размер файла в читаемом формате", () => {
    render(
      <MissingFilesDialog
        open
        onOpenChange={mockOnOpenChange}
        missingFiles={[mockMissingFiles[0]]}
        onResolve={mockOnResolve}
      />,
    )

    // Размер показывается в МБ, а не в KB (1024 байт = 0.0 МБ)
    expect(
      screen.getByText((content, _element) => {
        return content.includes("0.0") && content.includes("МБ")
      }),
    ).toBeInTheDocument()
  })
})

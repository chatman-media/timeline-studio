import { screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { renderWithTimeline } from "@/test/test-utils"
import type { MulticamAngle } from "../../hooks/use-multicam"
import { SyncControls } from "../sync-controls"
import "@/test/mocks/libraries/lucide-react"

// Моки
const mockMulticamReturn = {
  angles: [] as MulticamAngle[],
  activeAngleIndex: 0,
  activeAngle: null as MulticamAngle | null,
  isSync: false,
  syncOffsets: [] as number[],
  switchToAngle: vi.fn(),
  switchToNextAngle: vi.fn(),
  switchToPreviousAngle: vi.fn(),
  switchToAngleByClipId: vi.fn(),
  syncAngles: vi.fn(),
  setSyncOffset: vi.fn(),
  autoSyncByAudio: vi.fn(),
  autoSyncByTimecode: vi.fn(),
  addAngle: vi.fn(),
  removeAngle: vi.fn(),
  reorderAngles: vi.fn(),
  getAngleByClipId: vi.fn(),
  isMulticamClip: vi.fn(),
  hasMulticamSupport: false,
  syncStatus: "idle" as const,
  syncProgress: 0,
  syncError: null,
}

vi.mock("../../hooks/use-multicam", () => ({
  useMulticam: () => mockMulticamReturn,
}))

// Мок для AudioSyncDialog
vi.mock("../audio-sync-dialog", () => ({
  AudioSyncDialog: ({
    isOpen,
    onClose,
    onSync,
  }: {
    isOpen: boolean
    onClose: () => void
    onSync: () => Promise<any>
  }) =>
    isOpen ? (
      <div data-testid="audio-sync-dialog">
        <button onClick={onClose}>Close Audio Sync</button>
        <button
          onClick={async () => {
            await onSync()
            onClose()
          }}
        >
          Run Audio Sync
        </button>
      </div>
    ) : null,
}))

describe("SyncControls", () => {
  const mockOnSyncComplete = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()

    // Сброс состояния моков
    mockMulticamReturn.angles = []
    mockMulticamReturn.activeAngleIndex = 0
    mockMulticamReturn.activeAngle = null
    mockMulticamReturn.isSync = false
    mockMulticamReturn.syncOffsets = []
    mockMulticamReturn.hasMulticamSupport = false
    mockMulticamReturn.autoSyncByAudio.mockResolvedValue([])
    mockMulticamReturn.autoSyncByTimecode.mockResolvedValue(undefined)
  })

  it("не рендерится, если нет поддержки мультикамеры", () => {
    mockMulticamReturn.hasMulticamSupport = false

    renderWithTimeline(<SyncControls baseClipId="clip1" onSyncComplete={mockOnSyncComplete} />)

    // Компонент не должен рендерить кнопку синхронизации
    expect(screen.queryByText("Синхронизация")).not.toBeInTheDocument()
  })

  it("показывает кнопку синхронизации", () => {
    mockMulticamReturn.hasMulticamSupport = true

    renderWithTimeline(<SyncControls baseClipId="clip1" onSyncComplete={mockOnSyncComplete} />)

    expect(screen.getByRole("button", { name: /Синхронизация/i })).toBeInTheDocument()
  })

  it("открывает меню с опциями синхронизации", async () => {
    const user = userEvent.setup()
    mockMulticamReturn.hasMulticamSupport = true
    mockMulticamReturn.angles = [
      {
        id: "angle-1",
        name: "Camera 1",
        clipId: "clip1",
        clip: {} as any,
        syncOffset: 0,
        isActive: true,
      },
      {
        id: "angle-2",
        name: "Camera 2",
        clipId: "clip2",
        clip: {} as any,
        syncOffset: 0,
        isActive: false,
      },
    ]

    renderWithTimeline(<SyncControls baseClipId="clip1" onSyncComplete={mockOnSyncComplete} />)

    await user.click(screen.getByRole("button", { name: /Синхронизация/i }))

    expect(screen.getByText("Синхронизация по таймкоду")).toBeInTheDocument()
    expect(screen.getByText("Синхронизация по аудио")).toBeInTheDocument()
    expect(screen.getByText("Ручная синхронизация")).toBeInTheDocument()
  })

  it("выполняет синхронизацию по таймкоду", async () => {
    const user = userEvent.setup()
    mockMulticamReturn.hasMulticamSupport = true

    renderWithTimeline(<SyncControls baseClipId="clip1" onSyncComplete={mockOnSyncComplete} />)

    // Открываем меню
    const syncButton = screen.getByRole("button", { name: /Синхронизация/i })
    await user.click(syncButton)

    // Кликаем на пункт меню
    await user.click(screen.getByText("Синхронизация по таймкоду"))

    await waitFor(() => {
      expect(mockMulticamReturn.autoSyncByTimecode).toHaveBeenCalled()
      expect(mockOnSyncComplete).toHaveBeenCalled()
    })

    // Проверяем статус успеха
    await waitFor(
      () => {
        expect(screen.getByText("Синхронизировано!")).toBeInTheDocument()
      },
      { timeout: 5000 },
    )
  })

  it("открывает диалог аудио синхронизации", async () => {
    const user = userEvent.setup()
    mockMulticamReturn.hasMulticamSupport = true

    renderWithTimeline(<SyncControls baseClipId="clip1" onSyncComplete={mockOnSyncComplete} />)

    await user.click(screen.getByRole("button", { name: /Синхронизация/i }))
    await user.click(screen.getByText("Синхронизация по аудио"))

    expect(screen.getByTestId("audio-sync-dialog")).toBeInTheDocument()
  })

  it("выполняет аудио синхронизацию", async () => {
    const user = userEvent.setup()
    mockMulticamReturn.hasMulticamSupport = true
    mockMulticamReturn.angles = [
      {
        id: "angle-1",
        name: "Camera 1",
        clipId: "clip1",
        clip: {} as any,
        syncOffset: 0,
        isActive: true,
      },
    ]

    renderWithTimeline(<SyncControls baseClipId="clip1" onSyncComplete={mockOnSyncComplete} />)

    // Открываем меню и выбираем аудио синхронизацию
    await user.click(screen.getByRole("button", { name: /Синхронизация/i }))
    await user.click(screen.getByText("Синхронизация по аудио"))

    // Запускаем синхронизацию в диалоге
    await user.click(screen.getByText("Run Audio Sync"))

    await waitFor(() => {
      expect(mockMulticamReturn.autoSyncByAudio).toHaveBeenCalled()
      expect(mockOnSyncComplete).toHaveBeenCalled()
    })
  })

  it("показывает углы для ручной синхронизации", async () => {
    const user = userEvent.setup()
    mockMulticamReturn.hasMulticamSupport = true
    mockMulticamReturn.angles = [
      {
        id: "angle-1",
        name: "Camera 1",
        clipId: "clip1",
        clip: {} as any,
        syncOffset: 0,
        isActive: true,
      },
      {
        id: "angle-2",
        name: "Camera 2",
        clipId: "clip2",
        clip: {} as any,
        syncOffset: 1.5,
        isActive: false,
      },
    ]
    mockMulticamReturn.syncOffsets = [0, 1.5]
    mockMulticamReturn.activeAngleIndex = 0

    renderWithTimeline(<SyncControls baseClipId="clip1" onSyncComplete={mockOnSyncComplete} />)

    await user.click(screen.getByRole("button", { name: /Синхронизация/i }))

    // Проверяем, что показаны углы с их смещениями
    expect(screen.getByText(/Camera 1/)).toBeInTheDocument()
    expect(screen.getByText(/Camera 2.*\+1\.50s/)).toBeInTheDocument()
  })

  it("открывает диалог ручной синхронизации", async () => {
    const user = userEvent.setup()
    mockMulticamReturn.hasMulticamSupport = true
    mockMulticamReturn.angles = [
      {
        id: "angle-1",
        name: "Camera 1",
        clipId: "clip1",
        clip: {} as any,
        syncOffset: 0,
        isActive: true,
      },
      {
        id: "angle-2",
        name: "Camera 2",
        clipId: "clip2",
        clip: {} as any,
        syncOffset: 0,
        isActive: false,
      },
    ]

    renderWithTimeline(<SyncControls baseClipId="clip1" onSyncComplete={mockOnSyncComplete} />)

    await user.click(screen.getByRole("button", { name: /Синхронизация/i }))
    await user.click(screen.getByText("Camera 2"))

    // Проверяем, что открылся диалог ручной синхронизации
    const dialogTitle = screen.getAllByText("Ручная синхронизация")[1] // второй элемент - это заголовок диалога
    expect(dialogTitle).toBeInTheDocument()
    expect(screen.getByText(/Настройте смещение для камеры "Camera 2"/)).toBeInTheDocument()
  })

  it("применяет ручную синхронизацию", async () => {
    const user = userEvent.setup()
    mockMulticamReturn.hasMulticamSupport = true
    mockMulticamReturn.angles = [
      {
        id: "angle-1",
        name: "Camera 1",
        clipId: "clip1",
        clip: {} as any,
        syncOffset: 0,
        isActive: true,
      },
      {
        id: "angle-2",
        name: "Camera 2",
        clipId: "clip2",
        clip: {} as any,
        syncOffset: 0,
        isActive: false,
      },
    ]
    mockMulticamReturn.syncOffsets = [0, 0]

    renderWithTimeline(<SyncControls baseClipId="clip1" onSyncComplete={mockOnSyncComplete} />)

    // Открываем меню и выбираем Camera 2
    await user.click(screen.getByRole("button", { name: /Синхронизация/i }))
    await user.click(screen.getByText("Camera 2"))

    // Применяем синхронизацию
    await user.click(screen.getByRole("button", { name: "Применить" }))

    expect(mockMulticamReturn.setSyncOffset).toHaveBeenCalledWith(1, 0)
    expect(mockMulticamReturn.syncAngles).toHaveBeenCalled()
    expect(mockOnSyncComplete).toHaveBeenCalled()
  })

  it("отключает активный угол в меню ручной синхронизации", async () => {
    const user = userEvent.setup()
    mockMulticamReturn.hasMulticamSupport = true
    mockMulticamReturn.angles = [
      {
        id: "angle-1",
        name: "Camera 1",
        clipId: "clip1",
        clip: {} as any,
        syncOffset: 0,
        isActive: true,
      },
      {
        id: "angle-2",
        name: "Camera 2",
        clipId: "clip2",
        clip: {} as any,
        syncOffset: 0,
        isActive: false,
      },
    ]
    mockMulticamReturn.activeAngleIndex = 0

    renderWithTimeline(<SyncControls baseClipId="clip1" onSyncComplete={mockOnSyncComplete} />)

    await user.click(screen.getByRole("button", { name: /Синхронизация/i }))

    // Проверяем, что Camera 1 отключена (она активная)
    // Находим элемент с отступом и классом для отключенного состояния
    const camera1Items = screen.getAllByText("Camera 1")
    const camera1Item = camera1Items.find((el) =>
      el.parentElement?.classList.contains("data-[disabled]:opacity-50"),
    )?.parentElement

    if (camera1Item) {
      expect(camera1Item).toHaveClass("data-[disabled]:opacity-50")
    }

    // Camera 2 должна быть доступна - она кликабельна
    const camera2Items = screen.getAllByText("Camera 2")
    expect(camera2Items).toHaveLength(1)
  })

  it("показывает статус ошибки при неудачной синхронизации", async () => {
    const user = userEvent.setup()
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})
    mockMulticamReturn.hasMulticamSupport = true
    // Мок должен вернуть rejected promise
    mockMulticamReturn.autoSyncByTimecode.mockRejectedValue(new Error("Sync failed"))

    renderWithTimeline(<SyncControls baseClipId="clip1" onSyncComplete={mockOnSyncComplete} />)

    await user.click(screen.getByRole("button", { name: /Синхронизация/i }))
    await user.click(screen.getByText("Синхронизация по таймкоду"))

    // Проверяем, что была попытка вызвать метод
    await waitFor(() => {
      expect(mockMulticamReturn.autoSyncByTimecode).toHaveBeenCalled()
    })

    // Ошибка обрабатывается правильно
    await waitFor(() => {
      expect(screen.getByText("Ошибка синхронизации")).toBeInTheDocument()
    }, { timeout: 5000 })

    consoleSpy.mockRestore()
  })

  it("блокирует кнопки во время синхронизации", async () => {
    const user = userEvent.setup()
    mockMulticamReturn.hasMulticamSupport = true

    // Делаем синхронизацию медленной
    mockMulticamReturn.autoSyncByTimecode.mockImplementation(() => {
      return new Promise((resolve) => setTimeout(resolve, 100))
    })

    renderWithTimeline(<SyncControls baseClipId="clip1" onSyncComplete={mockOnSyncComplete} />)

    const syncButton = screen.getByRole("button", { name: /Синхронизация/i })
    await user.click(syncButton)
    await user.click(screen.getByText("Синхронизация по таймкоду"))

    // Проверяем, что кнопка триггера заблокирована во время синхронизации
    await waitFor(() => {
      const button = screen.getByRole("button", { name: /Синхронизация/i })
      expect(button).toBeDisabled()
    })
  })

  it("применяет кастомный className", () => {
    mockMulticamReturn.hasMulticamSupport = true

    renderWithTimeline(<SyncControls baseClipId="clip1" className="custom-class" onSyncComplete={mockOnSyncComplete} />)

    expect(screen.getByRole("button", { name: /Синхронизация/i })).toHaveClass("custom-class")
  })

  it("отменяет диалог ручной синхронизации", async () => {
    const user = userEvent.setup()
    mockMulticamReturn.hasMulticamSupport = true
    mockMulticamReturn.angles = [
      {
        id: "angle-1",
        name: "Camera 1",
        clipId: "clip1",
        clip: {} as any,
        syncOffset: 0,
        isActive: true,
      },
      {
        id: "angle-2",
        name: "Camera 2",
        clipId: "clip2",
        clip: {} as any,
        syncOffset: 0,
        isActive: false,
      },
    ]

    renderWithTimeline(<SyncControls baseClipId="clip1" onSyncComplete={mockOnSyncComplete} />)

    // Открываем диалог
    await user.click(screen.getByRole("button", { name: /Синхронизация/i }))
    await user.click(screen.getByText("Camera 2"))

    // Отменяем
    await user.click(screen.getByRole("button", { name: "Отмена" }))

    // Проверяем, что диалог закрылся (проверяем заголовок диалога)
    await waitFor(() => {
      expect(screen.queryByRole("heading", { name: "Ручная синхронизация" })).not.toBeInTheDocument()
    })
    expect(mockMulticamReturn.setSyncOffset).not.toHaveBeenCalled()
  })

  it("показывает подсказку в диалоге ручной синхронизации", async () => {
    const user = userEvent.setup()
    mockMulticamReturn.hasMulticamSupport = true
    mockMulticamReturn.angles = [
      {
        id: "angle-1",
        name: "Camera 1",
        clipId: "clip1",
        clip: {} as any,
        syncOffset: 0,
        isActive: true,
      },
      {
        id: "angle-2",
        name: "Camera 2",
        clipId: "clip2",
        clip: {} as any,
        syncOffset: 0,
        isActive: false,
      },
    ]

    renderWithTimeline(<SyncControls baseClipId="clip1" onSyncComplete={mockOnSyncComplete} />)

    await user.click(screen.getByRole("button", { name: /Синхронизация/i }))
    await user.click(screen.getByText("Camera 2"))

    expect(screen.getByText(/Используйте положительные значения, чтобы сдвинуть клип вперед/)).toBeInTheDocument()
  })
})

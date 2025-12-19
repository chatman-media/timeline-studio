import { screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"
import "@testing-library/jest-dom"
import { renderWithTimeline } from "@/test/test-utils"
import type { MulticamAngle } from "../../hooks/use-multicam"
import { AngleViewer } from "../angle-viewer"
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

// Мок для видео элементов
const mockVideoPlay = vi.fn().mockResolvedValue(undefined)
const mockVideoPause = vi.fn()

describe("AngleViewer", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Сброс состояния моков
    mockMulticamReturn.angles = []
    mockMulticamReturn.activeAngleIndex = 0
    mockMulticamReturn.activeAngle = null
    mockMulticamReturn.isSync = false
    mockMulticamReturn.syncOffsets = []
    mockMulticamReturn.hasMulticamSupport = false
    mockMulticamReturn.autoSyncByTimecode.mockResolvedValue(undefined)

    // Мок для HTMLVideoElement
    HTMLVideoElement.prototype.play = mockVideoPlay
    HTMLVideoElement.prototype.pause = mockVideoPause
  })

  it("показывает сообщение, когда нет углов камер", () => {
    mockMulticamReturn.angles = []
    mockMulticamReturn.hasMulticamSupport = true

    renderWithTimeline(<AngleViewer baseClipId="clip1" data-oid="l4qckqy" />)

    expect(screen.getByText("Нет доступных углов камер")).toBeInTheDocument()
    // Когда нет углов, не должно быть кнопки синхронизации
    expect(screen.queryByText("Синхронизация")).not.toBeInTheDocument()
  })

  it("рендерит сетку углов камер", () => {
    const angles: MulticamAngle[] = [
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

    mockMulticamReturn.angles = angles
    mockMulticamReturn.activeAngleIndex = 0
    mockMulticamReturn.activeAngle = angles[0]
    mockMulticamReturn.hasMulticamSupport = true

    renderWithTimeline(<AngleViewer baseClipId="clip1" data-oid="_6g70u." />)

    expect(screen.getByText("Camera 1")).toBeInTheDocument()
    expect(screen.getByText("Camera 2")).toBeInTheDocument()
    // SyncControls рендерится как DropdownMenu
    expect(screen.getByText("Синхронизация")).toBeInTheDocument()
  })

  it("показывает активный угол с особым стилем", () => {
    mockMulticamReturn.hasMulticamSupport = true
    const angles: MulticamAngle[] = [
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

    mockMulticamReturn.angles = angles
    mockMulticamReturn.activeAngleIndex = 0
    mockMulticamReturn.activeAngle = angles[0]

    renderWithTimeline(<AngleViewer baseClipId="clip1" data-oid="vcgubra" />)

    // Проверяем, что есть элементы с нужными классами
    const borders = screen.getByText("Camera 1").closest(".border-primary")
    expect(borders).toBeInTheDocument()
    expect(borders).toHaveClass("ring-2")
    expect(borders).toHaveClass("ring-primary")

    const mutedBorder = screen.getByText("Camera 2").closest(".border-muted")
    expect(mutedBorder).toBeInTheDocument()
    expect(mutedBorder).not.toHaveClass("ring-2")
  })

  it("переключает углы при клике", async () => {
    mockMulticamReturn.hasMulticamSupport = true
    const user = userEvent.setup()
    const angles: MulticamAngle[] = [
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

    mockMulticamReturn.angles = angles
    mockMulticamReturn.activeAngleIndex = 0
    mockMulticamReturn.activeAngle = angles[0]

    const onAngleClick = vi.fn()
    renderWithTimeline(<AngleViewer baseClipId="clip1" onAngleClick={onAngleClick} data-oid="42vcdnd" />)

    // Находим контейнер второй камеры по классу border-muted
    const camera2Container = screen.getByText("Camera 2").closest(".border-muted")
    expect(camera2Container).toBeInTheDocument()

    await user.click(camera2Container!)

    expect(mockMulticamReturn.switchToAngle).toHaveBeenCalledWith(1)
    expect(onAngleClick).toHaveBeenCalledWith(mockMulticamReturn.angles[1], 1)
  })

  it("управляет воспроизведением видео", async () => {
    mockMulticamReturn.hasMulticamSupport = true
    const user = userEvent.setup()
    const angles: MulticamAngle[] = [
      {
        id: "angle-1",
        name: "Camera 1",
        clipId: "clip1",
        clip: {} as any,
        syncOffset: 0,
        isActive: true,
        mediaPath: "path/to/video1.mp4",
      },
    ]

    mockMulticamReturn.angles = angles

    renderWithTimeline(<AngleViewer baseClipId="clip1" data-oid="_52vrtj" />)

    // Изначально должна быть кнопка Play
    expect(screen.getByTestId("play-icon")).toBeInTheDocument()

    // Кликаем на кнопку воспроизведения
    const playButton = screen.getByTestId("play-icon").parentElement
    await user.click(playButton!)

    // Ждем, чтобы компонент обновился и появилась кнопка паузы
    await waitFor(() => {
      expect(screen.getByTestId("pause-icon")).toBeInTheDocument()
    })

    // Кликаем на кнопку паузы
    const pauseButton = screen.getByTestId("pause-icon").parentElement
    await user.click(pauseButton!)

    // Ждем, чтобы компонент обновился и снова появилась кнопка play
    await waitFor(() => {
      expect(screen.getByTestId("play-icon")).toBeInTheDocument()
    })
  })

  it("показывает метки камер, когда showLabels=true", () => {
    mockMulticamReturn.hasMulticamSupport = true
    const angles: MulticamAngle[] = [
      {
        id: "angle-1",
        name: "Camera 1",
        clipId: "clip1",
        clip: {} as any,
        syncOffset: 0,
        isActive: true,
      },
    ]

    mockMulticamReturn.angles = angles

    renderWithTimeline(<AngleViewer baseClipId="clip1" showLabels={true} data-oid="b656dnt" />)
    expect(screen.getByText("Camera 1")).toBeInTheDocument()
  })

  it("скрывает метки камер, когда showLabels=false", () => {
    mockMulticamReturn.hasMulticamSupport = true
    const angles: MulticamAngle[] = [
      {
        id: "angle-1",
        name: "Camera 1",
        clipId: "clip1",
        clip: {} as any,
        syncOffset: 0,
        isActive: true,
      },
    ]

    mockMulticamReturn.angles = angles

    renderWithTimeline(<AngleViewer baseClipId="clip1" showLabels={false} data-oid=".k._typ" />)
    expect(screen.queryByText("Camera 1")).not.toBeInTheDocument()
  })

  it("показывает таймкод, когда showTimecode=true", () => {
    mockMulticamReturn.hasMulticamSupport = true
    const angles: MulticamAngle[] = [
      {
        id: "angle-1",
        name: "Camera 1",
        clipId: "clip1",
        clip: {} as any,
        syncOffset: 0,
        isActive: true,
      },
    ]

    mockMulticamReturn.angles = angles

    renderWithTimeline(<AngleViewer baseClipId="clip1" showTimecode={true} data-oid="bnh0.jp" />)
    expect(screen.getByText("00:00:00")).toBeInTheDocument()
  })

  it("показывает индикатор синхронизации для смещенных углов", () => {
    const angles: MulticamAngle[] = [
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

    mockMulticamReturn.angles = angles
    mockMulticamReturn.isSync = true
    mockMulticamReturn.syncOffsets = [0, 1.5]
    mockMulticamReturn.hasMulticamSupport = true

    renderWithTimeline(<AngleViewer baseClipId="clip1" data-oid="r7u3cvg" />)
    expect(screen.getByText("+1.5s")).toBeInTheDocument()
  })

  it("рассчитывает оптимальное количество колонок", () => {
    // 2 камеры = 2 колонки
    const angles2: MulticamAngle[] = Array(2)
      .fill(null)
      .map((_, i) => ({
        id: `angle-${i}`,
        name: `Camera ${i + 1}`,
        clipId: `clip${i}`,
        clip: {} as any,
        syncOffset: 0,
        isActive: i === 0,
      }))
    mockMulticamReturn.angles = angles2
    mockMulticamReturn.hasMulticamSupport = true
    mockMulticamReturn.activeAngleIndex = 0
    mockMulticamReturn.activeAngle = angles2[0]

    const { container } = renderWithTimeline(<AngleViewer baseClipId="clip1" data-oid="s-o0-gw" />)
    // Находим элемент с классом grid
    const grid = container.querySelector(".grid")
    expect(grid).toHaveStyle({ gridTemplateColumns: "repeat(2, 1fr)" })
  })

  it("ограничивает максимальное количество колонок", () => {
    const angles20: MulticamAngle[] = Array(20)
      .fill(null)
      .map((_, i) => ({
        id: `angle-${i}`,
        name: `Camera ${i + 1}`,
        clipId: `clip${i}`,
        clip: {} as any,
        syncOffset: 0,
        isActive: i === 0,
      }))
    mockMulticamReturn.angles = angles20
    mockMulticamReturn.hasMulticamSupport = true

    renderWithTimeline(<AngleViewer baseClipId="clip1" maxColumns={3} data-oid="j62o0ag" />)
    const grid = screen.getByText("Camera 1").parentElement?.parentElement?.parentElement
    expect(grid).toHaveStyle({ gridTemplateColumns: "repeat(3, 1fr)" })
  })

  it("применяет кастомный className", () => {
    mockMulticamReturn.hasMulticamSupport = true
    const angles: MulticamAngle[] = [
      {
        id: "angle-1",
        name: "Camera 1",
        clipId: "clip1",
        clip: {} as any,
        syncOffset: 0,
        isActive: true,
      },
    ]

    mockMulticamReturn.angles = angles

    renderWithTimeline(<AngleViewer baseClipId="clip1" className="custom-class" data-oid="ae0mcxv" />)
    const container = screen.getByText("Camera 1").closest(".custom-class")
    expect(container).toBeInTheDocument()
  })

  it("показывает заглушку при ошибке загрузки видео", async () => {
    const angles: MulticamAngle[] = [
      {
        id: "angle-1",
        name: "Camera 1",
        clipId: "clip1",
        clip: {} as any,
        syncOffset: 0,
        isActive: true,
        mediaPath: "invalid/path.mp4",
      },
    ]

    mockMulticamReturn.angles = angles
    mockMulticamReturn.hasMulticamSupport = true

    renderWithTimeline(<AngleViewer baseClipId="clip1" data-oid="a94:8ut" />)

    const video = screen.getByText("Camera 1").parentElement?.parentElement?.querySelector("video") as HTMLVideoElement

    // Эмулируем ошибку загрузки видео
    video.dispatchEvent(new Event("error"))

    await waitFor(() => {
      const errorIcon = screen.getByText("Camera 1").parentElement?.parentElement?.querySelector(".bg-muted")
      expect(errorIcon).toBeInTheDocument()
    })
  })

  it("вызывает onSyncComplete при завершении синхронизации", async () => {
    mockMulticamReturn.hasMulticamSupport = true
    const user = userEvent.setup()
    const consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {})

    const angles: MulticamAngle[] = [
      {
        id: "angle-1",
        name: "Camera 1",
        clipId: "clip1",
        clip: {} as any,
        syncOffset: 0,
        isActive: true,
      },
    ]

    mockMulticamReturn.angles = angles

    renderWithTimeline(<AngleViewer baseClipId="clip1" data-oid="48hpct4" />)

    // Открываем меню синхронизации
    const syncButton = screen.getByText("Синхронизация")
    await user.click(syncButton)

    // Выбираем синхронизацию по таймкоду
    const timecodeSync = screen.getByText("Синхронизация по таймкоду")
    await user.click(timecodeSync)

    // Ждем завершения синхронизации
    await waitFor(() => {
      expect(mockMulticamReturn.autoSyncByTimecode).toHaveBeenCalled()
    })

    expect(consoleLogSpy).toHaveBeenCalledWith("[AngleViewer] Sync completed")

    consoleLogSpy.mockRestore()
  })
})

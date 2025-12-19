/**
 * @vitest-environment jsdom
 */
import { fireEvent, screen, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { render } from "@/test/test-utils"

import { SubtitleSyncTools } from "../../components/subtitle-sync-tools"

const mockUpdateClip = vi.fn()
const mockToast = vi.fn()

vi.mock("@/features/timeline/hooks/state/use-timeline", () => ({
  useTimeline: () => ({
    updateClip: mockUpdateClip,
  }),
}))

vi.mock("@/features/timeline/hooks/state/use-tracks", () => ({
  useTracks: () => ({
    tracks: [
      {
        id: "subtitle-track-1",
        type: "subtitle",
        clips: [
          {
            id: "sub-1",
            trackId: "subtitle-track-1",
            type: "subtitle",
            startTime: 1,
            duration: 2,
            text: "First subtitle",
          },
          {
            id: "sub-2",
            trackId: "subtitle-track-1",
            type: "subtitle",
            startTime: 4,
            duration: 2,
            text: "Second subtitle",
          },
        ],
      },
    ],
  }),
}))

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({
    toast: mockToast,
  }),
}))

vi.mock("react-i18next", async () => {
  const actual = await vi.importActual("react-i18next")
  return {
    ...actual,
    useTranslation: () => ({
      t: (key: string, fallback?: string, options?: any) => {
        if (options?.count) {
          return fallback?.replace("{{count}}", options.count.toString()) || key
        }
        if (options?.time) {
          return fallback?.replace("{{time}}", options.time.toString()) || key
        }
        return fallback || key
      },
    }),
  }
})

describe("SubtitleSyncTools", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should render sync button", () => {
    render(<SubtitleSyncTools data-oid="ii9n54_" />)

    expect(screen.getByText("Синхронизация")).toBeInTheDocument()
  })

  it("should open popover when clicked", () => {
    render(<SubtitleSyncTools data-oid="7abg9ht" />)

    const syncButton = screen.getByText("Синхронизация")
    fireEvent.click(syncButton)

    expect(screen.getByText("Настройка времени")).toBeInTheDocument()
    expect(screen.getByLabelText("Временной сдвиг (секунды)")).toBeInTheDocument()
  })

  it("should update time offset with input", () => {
    render(<SubtitleSyncTools data-oid="ysk3:si" />)

    const syncButton = screen.getByText("Синхронизация")
    fireEvent.click(syncButton)

    const input = screen.getByLabelText("Временной сдвиг (секунды)")
    fireEvent.change(input, { target: { value: "2.5" } })

    expect(input).toHaveValue(2.5)
  })

  it("should increase time offset with plus button", () => {
    render(<SubtitleSyncTools data-oid="x:lu09b" />)

    const syncButton = screen.getByText("Синхронизация")
    fireEvent.click(syncButton)

    const plusButton = screen.getAllByRole("button")[2] // Third button is plus
    fireEvent.click(plusButton)

    const input = screen.getByLabelText("Временной сдвиг (секунды)")
    expect(input).toHaveValue(0.1)
  })

  it("should decrease time offset with minus button", () => {
    render(<SubtitleSyncTools data-oid="xj1uqk5" />)

    const syncButton = screen.getByText("Синхронизация")
    fireEvent.click(syncButton)

    const minusButton = screen.getAllByRole("button")[1] // Second button is minus
    fireEvent.click(minusButton)

    const input = screen.getByLabelText("Временной сдвиг (секунды)")
    expect(input).toHaveValue(-0.1)
  })

  it("should reset time offset", () => {
    render(<SubtitleSyncTools data-oid="n9xd0:a" />)

    const syncButton = screen.getByText("Синхронизация")
    fireEvent.click(syncButton)

    // Set offset
    const input = screen.getByLabelText("Временной сдвиг (секунды)")
    fireEvent.change(input, { target: { value: "5" } })

    // Reset
    const resetButton = screen.getAllByRole("button")[3] // Fourth button is reset
    fireEvent.click(resetButton)

    expect(input).toHaveValue(0)
  })

  it("should apply time offset to subtitles", async () => {
    mockUpdateClip.mockResolvedValue(undefined)

    render(<SubtitleSyncTools data-oid="_sdt97:" />)

    const syncButton = screen.getByText("Синхронизация")
    fireEvent.click(syncButton)

    const input = screen.getByLabelText("Временной сдвиг (секунды)")
    fireEvent.change(input, { target: { value: "2" } })

    const applyButton = screen.getByText("Применить")
    fireEvent.click(applyButton)

    await waitFor(() => {
      expect(mockUpdateClip).toHaveBeenCalledTimes(2)
      expect(mockUpdateClip).toHaveBeenCalledWith("sub-1", {
        startTime: 3, // 1 + 2
      })
      expect(mockUpdateClip).toHaveBeenCalledWith("sub-2", {
        startTime: 6, // 4 + 2
      })
    })

    // Toast вызывается через console.log заглушку, что видно в логах тестов
  })

  it("should not allow negative start times", async () => {
    mockUpdateClip.mockResolvedValue(undefined)

    render(<SubtitleSyncTools data-oid="rxha77x" />)

    const syncButton = screen.getByText("Синхронизация")
    fireEvent.click(syncButton)

    const input = screen.getByLabelText("Временной сдвиг (секунды)")
    fireEvent.change(input, { target: { value: "-2" } })

    const applyButton = screen.getByText("Применить")
    fireEvent.click(applyButton)

    await waitFor(() => {
      expect(mockUpdateClip).toHaveBeenCalledWith("sub-1", {
        startTime: 0, // Max(0, 1 - 2) = 0
      })
    })
  })

  it("should disable apply button when offset is 0", () => {
    render(<SubtitleSyncTools data-oid="wkue9ap" />)

    const syncButton = screen.getByText("Синхронизация")
    fireEvent.click(syncButton)

    const applyButton = screen.getByText("Применить")
    expect(applyButton).toBeDisabled()
  })

  it("should show appropriate message based on offset", () => {
    render(<SubtitleSyncTools data-oid="1r6wh92" />)

    const syncButton = screen.getByText("Синхронизация")
    fireEvent.click(syncButton)

    // No shift
    expect(screen.getByText("Субтитры не будут сдвинуты")).toBeInTheDocument()

    // Positive shift
    const input = screen.getByLabelText("Временной сдвиг (секунды)")
    fireEvent.change(input, { target: { value: "2.5" } })
    expect(screen.getByText("Субтитры будут сдвинуты вперед на 2.5с")).toBeInTheDocument()

    // Negative shift
    fireEvent.change(input, { target: { value: "-1.5" } })
    expect(screen.getByText("Субтитры будут сдвинуты назад на 1.5с")).toBeInTheDocument()
  })
})

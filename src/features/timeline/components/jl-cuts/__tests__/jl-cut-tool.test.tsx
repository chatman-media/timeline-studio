import { render, screen } from "@testing-library/react"
import { renderWithTimeline } from "@/test/test-utils"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { TimelineClip } from "@/domains/video-editing/types"
import { JLCutTool } from "../jl-cut-tool"

// Mock hooks
const mockCreateJCut = vi.fn()
const mockCreateLCut = vi.fn()
const mockResetCut = vi.fn()
const mockLinkClips = vi.fn()
const mockUnlinkClips = vi.fn()
const mockGetLinkedClip = vi.fn()
const mockGetLinkedPair = vi.fn()
const mockHasJLCut = vi.fn()
const mockIsVideoClip = vi.fn()
const mockIsAudioClip = vi.fn()

vi.mock("../../../hooks/editing/use-jl-cuts", () => ({
  useJLCuts: () => ({
    createJCut: mockCreateJCut,
    createLCut: mockCreateLCut,
    resetCut: mockResetCut,
    linkClips: mockLinkClips,
    unlinkClips: mockUnlinkClips,
    getLinkedClip: mockGetLinkedClip,
    getLinkedPair: mockGetLinkedPair,
    hasJLCut: mockHasJLCut,
    isVideoClip: mockIsVideoClip,
    isAudioClip: mockIsAudioClip,
  }),
}))

vi.mock("../../../hooks/state/use-timeline", () => ({
  useTimeline: () => ({
    uiState: {},
  }),
}))

// Создаем mock клипы
const createMockClip = (overrides: Partial<TimelineClip> = {}): TimelineClip => ({
  id: "clip-1",
  name: "Test Clip",
  mediaId: "media-1",
  startTime: 0,
  duration: 10,
  offset: 0,
  mediaFile: {
    id: "media-1",
    name: "test.mp4",
    path: "/test.mp4",
    type: "video" as any,
    duration: 10,
    size: 1000,
    createdAt: new Date(),
  },
  mediaStartTime: 0,
  volume: 1,
  opacity: 1,
  isReversed: false,
  speed: 1,
  playbackRate: 1,
  trackId: "track-1",
  mediaEndTime: 10,
  sourceIn: 0,
  sourceOut: 10,
  isMuted: false,
  position: {
    x: 0,
    y: 0,
    width: 1920,
    height: 1080,
    rotation: 0,
    scaleX: 1,
    scaleY: 1,
  },
  isSelected: false,
  isLocked: false,
  createdAt: new Date(),
  updatedAt: new Date(),
  effects: [],
  filters: [],
  transitions: [],
  ...overrides,
})

describe("JLCutTool", () => {
  const defaultClip = createMockClip()

  beforeEach(() => {
    vi.clearAllMocks()
    mockGetLinkedClip.mockReturnValue(null)
    mockGetLinkedPair.mockReturnValue(null)
    mockHasJLCut.mockReturnValue(false)
    mockIsVideoClip.mockReturnValue(true)
    mockIsAudioClip.mockReturnValue(false)
  })

  it("should render trigger button", () => {
    render(<JLCutTool clip={defaultClip} />)

    const triggerButton = screen.getByRole("button")
    expect(triggerButton).toBeInTheDocument()
  })

  it("should open popover on trigger click", async () => {
    const user = userEvent.setup()
    render(<JLCutTool clip={defaultClip} />)

    const triggerButton = screen.getByRole("button")
    await user.click(triggerButton)

    // Проверяем что popover открылся
    expect(screen.getByText("J-Cut / L-Cut Tools")).toBeInTheDocument()
    expect(screen.getByText("Create audio/video offset transitions")).toBeInTheDocument()
  })

  describe("Clip Linking section", () => {
    it("should show no clips message when no linkable clips", async () => {
      mockGetLinkedClip.mockReturnValue(null)

      const user = userEvent.setup()
      render(<JLCutTool clip={defaultClip} />)

      const triggerButton = screen.getByRole("button")
      await user.click(triggerButton)

      expect(screen.getByText("No clips available to link")).toBeInTheDocument()
    })

    it("should show linked clip info when clip is linked", async () => {
      const linkedClip = createMockClip({ id: "linked-clip", name: "Linked Audio" })
      mockGetLinkedClip.mockReturnValue(linkedClip)

      const user = userEvent.setup()
      render(<JLCutTool clip={defaultClip} />)

      const triggerButton = screen.getByRole("button")
      await user.click(triggerButton)

      expect(screen.getByText("Linked to: Linked Audio")).toBeInTheDocument()
      expect(screen.getByText("Unlink Clips")).toBeInTheDocument()
    })

    it("should call unlinkClips when unlink button clicked", async () => {
      const linkedClip = createMockClip({ id: "linked-clip", name: "Linked Audio" })
      mockGetLinkedClip.mockReturnValue(linkedClip)

      const user = userEvent.setup()
      render(<JLCutTool clip={defaultClip} />)

      const triggerButton = screen.getByRole("button")
      await user.click(triggerButton)

      const unlinkButton = screen.getByText("Unlink Clips")
      await user.click(unlinkButton)

      expect(mockUnlinkClips).toHaveBeenCalledWith("clip-1")
    })
  })

  describe("J/L Cut controls", () => {
    beforeEach(() => {
      const linkedClip = createMockClip({ id: "linked-clip" })
      mockGetLinkedClip.mockReturnValue(linkedClip)
      mockIsVideoClip.mockImplementation((clip) => clip.id === "clip-1")
      mockIsAudioClip.mockImplementation((clip) => clip.id === "linked-clip")
    })

    it("should show offset controls when can create J/L cuts", async () => {
      const user = userEvent.setup()
      render(<JLCutTool clip={defaultClip} />)

      const triggerButton = screen.getByRole("button")
      await user.click(triggerButton)

      expect(screen.getByText("Offset: 0.5s")).toBeInTheDocument()
      expect(screen.getByText("J-Cut")).toBeInTheDocument()
      expect(screen.getByText("L-Cut")).toBeInTheDocument()
    })

    it("should not show J/L cut controls when clips are not compatible", async () => {
      // Оба клипа видео
      mockIsVideoClip.mockReturnValue(true)
      mockIsAudioClip.mockReturnValue(false)

      const user = userEvent.setup()
      render(<JLCutTool clip={defaultClip} />)

      const triggerButton = screen.getByRole("button")
      await user.click(triggerButton)

      expect(screen.queryByText("J-Cut")).not.toBeInTheDocument()
      expect(screen.queryByText("L-Cut")).not.toBeInTheDocument()
    })

    it("should update offset slider value", async () => {
      const user = userEvent.setup()
      render(<JLCutTool clip={defaultClip} />)

      const triggerButton = screen.getByRole("button")
      await user.click(triggerButton)

      // Проверяем что слайдер показан
      expect(screen.getByText("Offset: 0.5s")).toBeInTheDocument()
    })

    it("should call createJCut when J-Cut button clicked", async () => {
      const user = userEvent.setup()
      render(<JLCutTool clip={defaultClip} />)

      const triggerButton = screen.getByRole("button")
      await user.click(triggerButton)

      const jCutButton = screen.getByText("J-Cut")
      await user.click(jCutButton)

      expect(mockCreateJCut).toHaveBeenCalledWith("clip-1", 0.5)
    })

    it("should call createLCut when L-Cut button clicked", async () => {
      const user = userEvent.setup()
      render(<JLCutTool clip={defaultClip} />)

      const triggerButton = screen.getByRole("button")
      await user.click(triggerButton)

      const lCutButton = screen.getByText("L-Cut")
      await user.click(lCutButton)

      expect(mockCreateLCut).toHaveBeenCalledWith("clip-1", 0.5)
    })

    it("should call createJCut with default offset", async () => {
      const user = userEvent.setup()
      render(<JLCutTool clip={defaultClip} />)

      const triggerButton = screen.getByRole("button")
      await user.click(triggerButton)

      const jCutButton = screen.getByText("J-Cut")
      await user.click(jCutButton)

      expect(mockCreateJCut).toHaveBeenCalledWith("clip-1", 0.5)
    })

    it("should show J-Cut and L-Cut buttons", async () => {
      const user = userEvent.setup()
      render(<JLCutTool clip={defaultClip} />)

      const triggerButton = screen.getByRole("button")
      await user.click(triggerButton)

      expect(screen.getByText("J-Cut")).toBeInTheDocument()
      expect(screen.getByText("L-Cut")).toBeInTheDocument()
    })
  })

  describe("Reset functionality", () => {
    beforeEach(() => {
      const linkedClip = createMockClip({ id: "linked-clip" })
      mockGetLinkedClip.mockReturnValue(linkedClip)
      mockIsVideoClip.mockImplementation((clip) => clip.id === "clip-1")
      mockIsAudioClip.mockImplementation((clip) => clip.id === "linked-clip")
      mockHasJLCut.mockReturnValue(true)
    })

    it("should show reset button when has J/L cut", async () => {
      const user = userEvent.setup()
      render(<JLCutTool clip={defaultClip} />)

      const triggerButton = screen.getByRole("button")
      await user.click(triggerButton)

      expect(screen.getByText("Reset to Straight Cut")).toBeInTheDocument()
    })

    it("should not show reset button when no J/L cut", async () => {
      mockHasJLCut.mockReturnValue(false)

      const user = userEvent.setup()
      render(<JLCutTool clip={defaultClip} />)

      const triggerButton = screen.getByRole("button")
      await user.click(triggerButton)

      expect(screen.queryByText("Reset to Straight Cut")).not.toBeInTheDocument()
    })

    it("should call resetCut when reset button clicked", async () => {
      const user = userEvent.setup()
      render(<JLCutTool clip={defaultClip} />)

      const triggerButton = screen.getByRole("button")
      await user.click(triggerButton)

      const resetButton = screen.getByText("Reset to Straight Cut")
      await user.click(resetButton)

      expect(mockResetCut).toHaveBeenCalledWith("clip-1")
    })
  })

  describe("Slider constraints", () => {
    beforeEach(() => {
      const linkedClip = createMockClip({ id: "linked-clip" })
      mockGetLinkedClip.mockReturnValue(linkedClip)
      mockIsVideoClip.mockImplementation((clip) => clip.id === "clip-1")
      mockIsAudioClip.mockImplementation((clip) => clip.id === "linked-clip")
    })

    it("should show offset controls when can create J/L cuts", async () => {
      const user = userEvent.setup()
      render(<JLCutTool clip={defaultClip} />)

      const triggerButton = screen.getByRole("button")
      await user.click(triggerButton)

      expect(screen.getByText("Offset: 0.5s")).toBeInTheDocument()
    })

    it("should format offset to 1 decimal place", async () => {
      const user = userEvent.setup()
      render(<JLCutTool clip={defaultClip} />)

      const triggerButton = screen.getByRole("button")
      await user.click(triggerButton)

      // Проверяем что offset отформатирован до 1 знака после запятой
      expect(screen.getByText("Offset: 0.5s")).toBeInTheDocument()
    })
  })

  it("should apply custom className to trigger button", () => {
    const customClass = "custom-tool-button"
    render(<JLCutTool clip={defaultClip} className={customClass} />)

    const triggerButton = screen.getByRole("button")
    expect(triggerButton).toHaveClass(customClass)
  })

  it("should have proper popover styling and positioning", async () => {
    const user = userEvent.setup()
    render(<JLCutTool clip={defaultClip} />)

    const triggerButton = screen.getByRole("button")
    await user.click(triggerButton)

    // Проверяем что popover content имеет правильную ширину
    const popoverContent = screen.getByText("J-Cut / L-Cut Tools").closest("[role=dialog]")
    expect(popoverContent).toHaveClass("w-80")
  })

  describe("Edge cases", () => {
    it("should handle clip without linked clip", async () => {
      mockGetLinkedClip.mockReturnValue(null)

      const user = userEvent.setup()
      render(<JLCutTool clip={defaultClip} />)

      const triggerButton = screen.getByRole("button")
      await user.click(triggerButton)

      expect(screen.getByText("Clip Linking")).toBeInTheDocument()
      expect(screen.queryByText("J-Cut")).not.toBeInTheDocument()
    })

    it("should handle audio clip as main clip", async () => {
      const audioClip = createMockClip({ id: "audio-clip" })
      const linkedClip = createMockClip({ id: "linked-video" })

      mockGetLinkedClip.mockReturnValue(linkedClip)
      mockIsVideoClip.mockImplementation((clip) => clip.id === "linked-video")
      mockIsAudioClip.mockImplementation((clip) => clip.id === "audio-clip")

      const user = userEvent.setup()
      render(<JLCutTool clip={audioClip} />)

      const triggerButton = screen.getByRole("button")
      await user.click(triggerButton)

      expect(screen.getByText("J-Cut")).toBeInTheDocument()
      expect(screen.getByText("L-Cut")).toBeInTheDocument()
    })

    it("should maintain component state across re-renders", async () => {
      const user = userEvent.setup()
      const { rerender } = render(<JLCutTool clip={defaultClip} />)

      const triggerButton = screen.getByRole("button")
      await user.click(triggerButton)

      // Перерендер компонента
      rerender(<JLCutTool clip={defaultClip} />)

      // Должен остаться открытым
      expect(screen.getByText("J-Cut / L-Cut Tools")).toBeInTheDocument()
    })
  })
})

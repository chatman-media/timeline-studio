/**
 * StoryboardEditor Tests
 */

import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import type { ScriptFragment, ScriptPlan } from "@/features/timeline/types/script"

import { StoryboardEditor } from "../storyboard-editor"

const mockPlan: ScriptPlan = {
  id: "plan-1",
  name: "Динамичный ролик",
  targetDuration: 120,
  style: "dynamic-action",
  scenes: [
    {
      id: "scene-1",
      order: 0,
      fragmentId: "frag-1",
      startTime: 0,
      endTime: 10,
      duration: 10,
      transition: "CUT",
    },
    {
      id: "scene-2",
      order: 1,
      fragmentId: "frag-2",
      startTime: 10,
      endTime: 25,
      duration: 15,
      transition: "FADE",
    },
  ],
  settings: {
    prioritizeQuality: true,
    prioritizeEngagement: true,
    syncWithMusic: false,
    includeFaces: true,
    includeDynamic: true,
    paceLevel: 70,
    transitionComplexity: 50,
  },
  stats: {
    totalScenes: 2,
    totalTransitions: 1,
    totalDuration: 25,
    qualityScore: 88,
    engagementScore: 92,
    coherenceScore: 85,
  },
  createdAt: new Date(),
  updatedAt: new Date(),
}

describe("StoryboardEditor", () => {
  it("should render storyboard editor", () => {
    render(<StoryboardEditor plan={null} />)
    expect(screen.getByTestId("storyboard-editor")).toBeInTheDocument()
  })

  it("should show empty state when no plan", () => {
    render(<StoryboardEditor plan={null} />)
    expect(screen.getByText(/План пуст/i)).toBeInTheDocument()
  })

  it("should display plan name", () => {
    render(<StoryboardEditor plan={mockPlan} />)
    expect(screen.getByText("Динамичный ролик")).toBeInTheDocument()
  })

  it("should display plan stats", () => {
    render(<StoryboardEditor plan={mockPlan} />)

    expect(screen.getByText(/Длительность: 25.0s/i)).toBeInTheDocument()
    expect(screen.getByText(/Сцен: 2/i)).toBeInTheDocument()
    expect(screen.getByText(/Качество: 88%/i)).toBeInTheDocument()
  })

  it("should render all scenes", () => {
    render(<StoryboardEditor plan={mockPlan} />)

    expect(screen.getByTestId("scene-card-scene-1")).toBeInTheDocument()
    expect(screen.getByTestId("scene-card-scene-2")).toBeInTheDocument()
  })

  it("should display scene details", () => {
    render(<StoryboardEditor plan={mockPlan} />)

    expect(screen.getByText("1. Сцена (10.0s)")).toBeInTheDocument()
    expect(screen.getByText("Переход: CUT")).toBeInTheDocument()
    expect(screen.getByText("2. Сцена (15.0s)")).toBeInTheDocument()
    expect(screen.getByText("Переход: FADE")).toBeInTheDocument()
  })

  it("should call onRemoveScene when remove button clicked", async () => {
    const user = userEvent.setup()
    const onRemoveScene = vi.fn()

    render(<StoryboardEditor plan={mockPlan} onRemoveScene={onRemoveScene} />)

    await user.click(screen.getByTestId("remove-scene-scene-1"))

    expect(onRemoveScene).toHaveBeenCalledWith("scene-1")
  })

  it("should display default title when no plan name", () => {
    const planWithoutName = { ...mockPlan, name: "" }
    render(<StoryboardEditor plan={planWithoutName} />)

    expect(screen.getByText("Новый план монтажа")).toBeInTheDocument()
  })

  it("should call onDropFragment when fragment dropped", () => {
    const onDropFragment = vi.fn()
    const mockFragment: ScriptFragment = {
      id: "frag-3",
      fileId: "file-1",
      startTime: 25,
      endTime: 35,
      duration: 10,
      qualityScore: 90,
      tags: ["action"],
      emotions: ["exciting"],
      objects: ["car"],
    }

    render(<StoryboardEditor plan={mockPlan} onDropFragment={onDropFragment} />)

    const dropZone = screen.getByTestId("drop-zone")

    // Create mock dataTransfer with fragment data
    const mockDataTransfer = {
      getData: vi.fn(() => JSON.stringify(mockFragment)),
      setData: vi.fn(),
      effectAllowed: "",
      clearData: vi.fn(),
      dropEffect: "none",
      files: [],
      items: [],
      types: [],
    }

    // Create drop event
    const dropEvent = new MouseEvent("drop", { bubbles: true })
    Object.defineProperty(dropEvent, "dataTransfer", {
      value: mockDataTransfer,
      writable: false,
    })

    dropZone.dispatchEvent(dropEvent)

    expect(onDropFragment).toHaveBeenCalledWith(mockFragment)
  })

  it("should handle dragOver event on drop zone", () => {
    render(<StoryboardEditor plan={null} />)

    const dropZone = screen.getByTestId("drop-zone")

    // Create mock dataTransfer
    const mockDataTransfer = {
      getData: vi.fn(),
      setData: vi.fn(),
      effectAllowed: "",
      clearData: vi.fn(),
      dropEffect: "none",
      files: [],
      items: [],
      types: [],
    }

    // Create dragOver event
    const dragOverEvent = new MouseEvent("dragover", { bubbles: true })
    Object.defineProperty(dragOverEvent, "dataTransfer", {
      value: mockDataTransfer,
      writable: false,
    })

    dropZone.dispatchEvent(dragOverEvent)

    // dropEffect should be set to "copy"
    expect(mockDataTransfer.dropEffect).toBe("copy")
  })
})

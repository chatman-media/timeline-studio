/**
 * FragmentLibrary Tests
 */

import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import type { ScriptFragment } from "@/features/timeline/types/script"

import { FragmentLibrary } from "../fragment-library"

const mockFragments: ScriptFragment[] = [
  {
    id: "frag-1",
    fileId: "file-1",
    startTime: 0,
    endTime: 10,
    duration: 10,
    qualityScore: 85,
    tags: ["intro"],
    emotions: ["happy"],
    objects: ["person"],
  },
  {
    id: "frag-2",
    fileId: "file-1",
    startTime: 10,
    endTime: 25,
    duration: 15,
    qualityScore: 92,
    tags: ["action"],
    emotions: ["exciting"],
    objects: ["car", "person"],
    facesCount: 2,
  },
]

describe("FragmentLibrary", () => {
  it("should render fragment library", () => {
    render(<FragmentLibrary fragments={[]} />)
    expect(screen.getByTestId("fragment-library")).toBeInTheDocument()
  })

  it("should show empty state when no fragments", () => {
    render(<FragmentLibrary fragments={[]} />)
    expect(screen.getByText(/Нет фрагментов/i)).toBeInTheDocument()
  })

  it("should display fragments count", () => {
    render(<FragmentLibrary fragments={mockFragments} />)
    expect(screen.getByText("Всего: 2")).toBeInTheDocument()
  })

  it("should render all fragments", () => {
    render(<FragmentLibrary fragments={mockFragments} />)

    expect(screen.getByTestId("fragment-frag-1")).toBeInTheDocument()
    expect(screen.getByTestId("fragment-frag-2")).toBeInTheDocument()
  })

  it("should display fragment details", () => {
    render(<FragmentLibrary fragments={mockFragments} />)

    expect(screen.getByText("0.0s - 10.0s")).toBeInTheDocument()
    expect(screen.getByText("Quality: 85%")).toBeInTheDocument()
    expect(screen.getByText("10.0s - 25.0s")).toBeInTheDocument()
    expect(screen.getByText("Quality: 92%")).toBeInTheDocument()
  })

  it("should call onSelectFragment when fragment clicked", async () => {
    const user = userEvent.setup()
    const onSelectFragment = vi.fn()

    render(<FragmentLibrary fragments={mockFragments} onSelectFragment={onSelectFragment} />)

    await user.click(screen.getByTestId("fragment-frag-1"))

    expect(onSelectFragment).toHaveBeenCalledWith(mockFragments[0])
  })

  it("should call onDragStart when fragment dragged", () => {
    const onDragStart = vi.fn()

    render(<FragmentLibrary fragments={mockFragments} onDragStart={onDragStart} />)

    const fragment = screen.getByTestId("fragment-frag-1")

    // Create a mock dataTransfer object
    const mockDataTransfer = {
      setData: vi.fn(),
      effectAllowed: "",
      getData: vi.fn(),
      clearData: vi.fn(),
      dropEffect: "none",
      files: [],
      items: [],
      types: [],
    }

    // Create DragEvent with mock dataTransfer
    const dragEvent = new MouseEvent("dragstart", { bubbles: true })
    Object.defineProperty(dragEvent, "dataTransfer", {
      value: mockDataTransfer,
      writable: false,
    })

    fragment.dispatchEvent(dragEvent)

    expect(onDragStart).toHaveBeenCalledWith(mockFragments[0])
    expect(mockDataTransfer.setData).toHaveBeenCalledWith("application/json", JSON.stringify(mockFragments[0]))
    expect(mockDataTransfer.effectAllowed).toBe("copy")
  })
})

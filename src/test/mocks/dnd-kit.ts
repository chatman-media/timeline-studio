/**
 * Mock for @dnd-kit/core hooks and utilities
 */

import { vi } from "vitest"

// Mock useDroppable hook
export const mockUseDroppable = vi.fn(() => ({
  isOver: false,
  setNodeRef: vi.fn(),
  active: null,
  over: null,
}))

// Mock useDraggable hook
export const mockUseDraggable = vi.fn(() => ({
  attributes: {
    role: "button",
    tabIndex: 0,
    "aria-pressed": false,
    "aria-roledescription": "draggable",
    "aria-describedby": undefined,
  },
  listeners: undefined, // Safer to return undefined than empty object
  setNodeRef: vi.fn(),
  transform: null,
  isDragging: false,
  active: null,
}))

// Mock DndContext component
export const MockDndContext = vi.fn(({ children }: { children: React.ReactNode }) => children)

// Mock DragOverlay component
export const MockDragOverlay = vi.fn(({ children }: { children?: React.ReactNode }) => children || null)

// Set up vi.mock calls
vi.mock("@dnd-kit/core", () => ({
  useDroppable: mockUseDroppable,
  useDraggable: mockUseDraggable,
  DndContext: MockDndContext,
  DragOverlay: MockDragOverlay,
  MouseSensor: vi.fn(),
  TouchSensor: vi.fn(),
  useSensor: vi.fn(),
  useSensors: vi.fn(() => []),
}))

vi.mock("@dnd-kit/modifiers", () => ({
  createSnapModifier: vi.fn(() => vi.fn()),
}))

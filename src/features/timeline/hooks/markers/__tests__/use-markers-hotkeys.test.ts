import { renderHook } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

// Mock shortcuts registry
vi.mock("@/features/keyboard-shortcuts", () => ({
  shortcutsRegistry: {
    updateAction: vi.fn(),
  },
}))

import { shortcutsRegistry } from "@/features/keyboard-shortcuts"

import { useMarkerHotkeys } from "../use-marker-hotkeys"

// Mock keyboard event
const mockKeyboardEvent = new KeyboardEvent("keydown", { key: "Enter" })
const mockHotkeyEvent = { keys: ["enter"], scope: "all", element: null }

// Mock timeline hook
const mockUseTimeline = {
  currentTime: 15.5,
  seek: vi.fn(),
}

vi.mock("../../../hooks/use-timeline", () => ({
  useTimeline: () => mockUseTimeline,
}))

// Mock timeline markers hook
const mockUseTimelineMarkers = {
  addMarker: vi.fn(),
  removeMarker: vi.fn(),
  clearAllMarkers: vi.fn(),
  markers: [
    {
      id: "marker-at-10",
      time: 10,
      name: "Marker 1",
      type: "note",
      color: "#3b82f6",
    },
    {
      id: "marker-at-15.5",
      time: 15.5,
      name: "Current Marker",
      type: "note",
      color: "#3b82f6",
    },
    {
      id: "marker-at-25",
      time: 25,
      name: "Marker 2",
      type: "chapter",
      color: "#10b981",
    },
  ],
}

vi.mock("../../../hooks/use-timeline-markers", () => ({
  useTimelineMarkers: () => mockUseTimelineMarkers,
}))

describe("useMarkersHotkeys", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseTimeline.currentTime = 15.5
  })

  it("регистрирует горячие клавиши для маркеров", () => {
    renderHook(() => useMarkerHotkeys())

    // Проверяем, что shortcuts были зарегистрированы
    expect(vi.mocked(shortcutsRegistry).updateAction).toHaveBeenCalledTimes(8)

    // Проверяем некоторые ключевые shortcuts
    expect(vi.mocked(shortcutsRegistry).updateAction).toHaveBeenCalledWith("add-marker", expect.any(Function))
    expect(vi.mocked(shortcutsRegistry).updateAction).toHaveBeenCalledWith("add-chapter-marker", expect.any(Function))
    expect(vi.mocked(shortcutsRegistry).updateAction).toHaveBeenCalledWith("delete-marker", expect.any(Function))
    expect(vi.mocked(shortcutsRegistry).updateAction).toHaveBeenCalledWith("next-marker", expect.any(Function))
    expect(vi.mocked(shortcutsRegistry).updateAction).toHaveBeenCalledWith("previous-marker", expect.any(Function))
  })

  it("добавляет маркер при нажатии M", () => {
    renderHook(() => useMarkerHotkeys())

    // Получаем action для add-marker
    const addMarkerAction = vi
      .mocked(shortcutsRegistry)
      .updateAction.mock.calls.find((call) => call[0] === "add-marker")?.[1]

    expect(addMarkerAction).toBeDefined()

    // Вызываем action
    addMarkerAction?.(mockKeyboardEvent, mockHotkeyEvent as any)

    expect(mockUseTimelineMarkers.addMarker).toHaveBeenCalledWith({
      time: 15.5,
      name: expect.stringContaining("Marker"),
      type: "note",
      color: "#3b82f6",
    })
  })

  it("добавляет маркер главы при нажатии Shift+M", () => {
    renderHook(() => useMarkerHotkeys())

    // Получаем action для add-chapter-marker
    const addChapterAction = vi
      .mocked(shortcutsRegistry)
      .updateAction.mock.calls.find((call) => call[0] === "add-chapter-marker")?.[1]

    expect(addChapterAction).toBeDefined()

    // Вызываем action
    addChapterAction?.(mockKeyboardEvent, mockHotkeyEvent as any)

    expect(mockUseTimelineMarkers.addMarker).toHaveBeenCalledWith({
      time: 15.5,
      name: expect.stringContaining("Chapter"),
      type: "chapter",
      color: "#10b981",
    })
  })

  it("удаляет выбранный маркер при нажатии Delete", () => {
    renderHook(() => useMarkerHotkeys())

    // Получаем action для delete-marker
    const deleteAction = vi
      .mocked(shortcutsRegistry)
      .updateAction.mock.calls.find((call) => call[0] === "delete-marker")?.[1]

    expect(deleteAction).toBeDefined()

    // Вызываем action
    deleteAction?.(mockKeyboardEvent, mockHotkeyEvent as any)

    expect(mockUseTimelineMarkers.removeMarker).toHaveBeenCalledWith("marker-at-15.5")
  })

  it("не удаляет маркер если ничего не выбрано", () => {
    mockUseTimeline.currentTime = 5 // Время где нет маркера

    renderHook(() => useMarkerHotkeys())

    const deleteAction = vi
      .mocked(shortcutsRegistry)
      .updateAction.mock.calls.find((call) => call[0] === "delete-marker")?.[1]

    expect(deleteAction).toBeDefined()

    deleteAction?.(mockKeyboardEvent, mockHotkeyEvent as any)

    expect(mockUseTimelineMarkers.removeMarker).not.toHaveBeenCalled()
  })

  it("переходит к предыдущему маркеру при нажатии ; (semicolon)", () => {
    renderHook(() => useMarkerHotkeys())

    // Получаем action для previous-marker
    const prevMarkerAction = vi
      .mocked(shortcutsRegistry)
      .updateAction.mock.calls.find((call) => call[0] === "previous-marker")?.[1]

    expect(prevMarkerAction).toBeDefined()

    prevMarkerAction?.(mockKeyboardEvent, mockHotkeyEvent as any)

    // Должен вызывать seek с временем предыдущего маркера (10 секунд)
    expect(mockUseTimeline.seek).toHaveBeenCalledWith(10)
  })

  it("переходит к следующему маркеру при нажатии ' (apostrophe)", () => {
    renderHook(() => useMarkerHotkeys())

    // Получаем action для next-marker
    const nextMarkerAction = vi
      .mocked(shortcutsRegistry)
      .updateAction.mock.calls.find((call) => call[0] === "next-marker")?.[1]

    expect(nextMarkerAction).toBeDefined()

    nextMarkerAction?.(mockKeyboardEvent, mockHotkeyEvent as any)

    // Должен вызывать seek с временем следующего маркера (25 секунд)
    expect(mockUseTimeline.seek).toHaveBeenCalledWith(25)
  })

  it("генерирует правильные имена для новых маркеров", () => {
    renderHook(() => useMarkerHotkeys())

    const addMarkerAction = vi
      .mocked(shortcutsRegistry)
      .updateAction.mock.calls.find((call) => call[0] === "add-marker")?.[1]

    expect(addMarkerAction).toBeDefined()

    addMarkerAction?.(mockKeyboardEvent, mockHotkeyEvent as any)

    expect(mockUseTimelineMarkers.addMarker).toHaveBeenCalledWith({
      time: 15.5,
      name: expect.stringContaining("Marker"),
      type: "note",
      color: "#3b82f6",
    })
  })

  it("настраивает правильные опции для горячих клавиш", () => {
    renderHook(() => useMarkerHotkeys())

    // Проверяем количество зарегистрированных shortcuts
    expect(vi.mocked(shortcutsRegistry).updateAction).toHaveBeenCalledTimes(8)
  })
})

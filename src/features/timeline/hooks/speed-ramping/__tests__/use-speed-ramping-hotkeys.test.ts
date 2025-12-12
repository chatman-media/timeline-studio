import { renderHook } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

// Mock shortcuts registry
vi.mock("@/features/keyboard-shortcuts", () => ({
  shortcutsRegistry: {
    updateAction: vi.fn(),
  },
}))

import { shortcutsRegistry } from "@/features/keyboard-shortcuts"

import { useSpeedRampingHotkeys } from '../use-speed-ramping-hotkeys'

// Mock keyboard event
const mockKeyboardEvent = new KeyboardEvent("keydown", { key: "Enter" })
const mockHotkeyEvent = { keys: ["enter"], scope: "all", element: null }

// Mock useSpeedRamping
const mockUseSpeedRamping = {
  resetToConstantSpeed: vi.fn(),
}

vi.mock("../../../hooks/use-speed-ramping", () => ({
  useSpeedRamping: () => mockUseSpeedRamping,
}))

// Mock useTimeline
const mockSend = vi.fn()
const mockUseTimeline = {
  send: mockSend,
  selectedClipIds: ["test-clip-1", "test-clip-2"],
}

vi.mock("../../../hooks/use-timeline", () => ({
  useTimeline: () => mockUseTimeline,
}))

describe("useSpeedRampingHotkeys", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("регистрирует горячие клавиши", () => {
    renderHook(() => useSpeedRampingHotkeys())

    // Проверяем, что shortcuts были зарегистрированы
    expect(vi.mocked(shortcutsRegistry).updateAction).toHaveBeenCalledWith("enable-speed-ramping", expect.any(Function))

    expect(vi.mocked(shortcutsRegistry).updateAction).toHaveBeenCalledWith("reset-speed", expect.any(Function))

    expect(vi.mocked(shortcutsRegistry).updateAction).toHaveBeenCalledWith("speed-half", expect.any(Function))

    expect(vi.mocked(shortcutsRegistry).updateAction).toHaveBeenCalledWith("speed-double", expect.any(Function))

    expect(vi.mocked(shortcutsRegistry).updateAction).toHaveBeenCalledWith("speed-quad", expect.any(Function))

    expect(vi.mocked(shortcutsRegistry).updateAction).toHaveBeenCalledWith("reverse-speed", expect.any(Function))
  })

  it("включает speed ramping при нажатии Cmd+Shift+R", () => {
    renderHook(() => useSpeedRampingHotkeys())

    // Получаем action для enable-speed-ramping
    const enableAction = vi
      .mocked(shortcutsRegistry)
      .updateAction.mock.calls.find((call) => call[0] === "enable-speed-ramping")?.[1]

    expect(enableAction).toBeDefined()

    // Вызываем action
    enableAction?.(mockKeyboardEvent, mockHotkeyEvent as any)

    expect(mockSend).toHaveBeenCalledWith({
      type: "ENABLE_SPEED_RAMPING",
      clipId: "test-clip-1",
    })

    expect(mockSend).toHaveBeenCalledWith({
      type: "ENABLE_SPEED_RAMPING",
      clipId: "test-clip-2",
    })
  })

  it("сбрасывает к нормальной скорости при нажатии Cmd+Alt+R", () => {
    renderHook(() => useSpeedRampingHotkeys())

    // Получаем action для reset-speed
    const resetAction = vi
      .mocked(shortcutsRegistry)
      .updateAction.mock.calls.find((call) => call[0] === "reset-speed")?.[1]

    expect(resetAction).toBeDefined()

    // Вызываем action
    resetAction?.(mockKeyboardEvent, mockHotkeyEvent as any)

    expect(mockUseSpeedRamping.resetToConstantSpeed).toHaveBeenCalledWith("test-clip-1", 1)
    expect(mockUseSpeedRamping.resetToConstantSpeed).toHaveBeenCalledWith("test-clip-2", 1)
  })

  it("устанавливает скорость 0.5x при нажатии клавиши 5", () => {
    renderHook(() => useSpeedRampingHotkeys())

    // Получаем action для speed-half
    const slowAction = vi
      .mocked(shortcutsRegistry)
      .updateAction.mock.calls.find((call) => call[0] === "speed-half")?.[1]

    expect(slowAction).toBeDefined()

    // Вызываем action
    slowAction?.(mockKeyboardEvent, mockHotkeyEvent as any)

    expect(mockUseSpeedRamping.resetToConstantSpeed).toHaveBeenCalledWith("test-clip-1", 0.5)
    expect(mockUseSpeedRamping.resetToConstantSpeed).toHaveBeenCalledWith("test-clip-2", 0.5)
  })

  it("устанавливает скорость 2x при нажатии клавиши 2", () => {
    renderHook(() => useSpeedRampingHotkeys())

    // Получаем action для speed-double
    const fastAction = vi
      .mocked(shortcutsRegistry)
      .updateAction.mock.calls.find((call) => call[0] === "speed-double")?.[1]

    expect(fastAction).toBeDefined()

    // Вызываем action
    fastAction?.(mockKeyboardEvent, mockHotkeyEvent as any)

    expect(mockUseSpeedRamping.resetToConstantSpeed).toHaveBeenCalledWith("test-clip-1", 2)
    expect(mockUseSpeedRamping.resetToConstantSpeed).toHaveBeenCalledWith("test-clip-2", 2)
  })

  it("устанавливает скорость 4x при нажатии клавиши 4", () => {
    renderHook(() => useSpeedRampingHotkeys())

    // Получаем action для speed-quad
    const veryFastAction = vi
      .mocked(shortcutsRegistry)
      .updateAction.mock.calls.find((call) => call[0] === "speed-quad")?.[1]

    expect(veryFastAction).toBeDefined()

    // Вызываем action
    veryFastAction?.(mockKeyboardEvent, mockHotkeyEvent as any)

    expect(mockUseSpeedRamping.resetToConstantSpeed).toHaveBeenCalledWith("test-clip-1", 4)
    expect(mockUseSpeedRamping.resetToConstantSpeed).toHaveBeenCalledWith("test-clip-2", 4)
  })

  it("не выполняет действия если нет выбранных клипов", () => {
    // Временно очищаем выбранные клипы
    mockUseTimeline.selectedClipIds = []

    renderHook(() => useSpeedRampingHotkeys())

    // Получаем action для enable-speed-ramping
    const enableAction = vi
      .mocked(shortcutsRegistry)
      .updateAction.mock.calls.find((call) => call[0] === "enable-speed-ramping")?.[1]

    expect(enableAction).toBeDefined()

    // Вызываем action
    enableAction?.(mockKeyboardEvent, mockHotkeyEvent as any)

    // Функции не должны быть вызваны
    expect(mockSend).not.toHaveBeenCalled()

    // Восстанавливаем состояние
    mockUseTimeline.selectedClipIds = ["test-clip-1", "test-clip-2"]
  })

  it("настраивает правильные опции для горячих клавиш", () => {
    renderHook(() => useSpeedRampingHotkeys())

    // Проверяем что shortcuts были зарегистрированы
    expect(vi.mocked(shortcutsRegistry).updateAction).toHaveBeenCalledTimes(6)
  })
})

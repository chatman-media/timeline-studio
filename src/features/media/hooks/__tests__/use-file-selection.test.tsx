import { act, renderHook } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { BrowserProvider } from "@/domains/browser"
import { MediaType } from "@/features/media/types/media"
import { resetMockBrowserState } from "@/test/mocks/backend-sync"
import { useFileSelection } from "../use-file-selection"

// Mock данные
const mockFile = {
  id: "test-file-1",
  name: "test.mp4",
  path: "/path/test.mp4",
  type: MediaType.Video,
  isVideo: true,
  isAudio: false,
  isImage: false,
  size: 1024,
  duration: 10,
}

// Wrapper для тестов
function TestWrapper({ children }: { children: React.ReactNode }) {
  return <BrowserProvider>{children}</BrowserProvider>
}

describe("useFileSelection", () => {
  beforeEach(async () => {
    // Важно: сброс состояния должен быть синхронным
    resetMockBrowserState()
    // Даем время на обработку изменений состояния
    await new Promise((resolve) => setTimeout(resolve, 0))
  })

  it("должен возвращать правильное начальное состояние", () => {
    const { result } = renderHook(() => useFileSelection(mockFile), {
      wrapper: TestWrapper,
    })

    expect(result.current.isSelected).toBe(false)
    expect(typeof result.current.toggleSelection).toBe("function")
    expect(typeof result.current.selectFile).toBe("function")
    expect(typeof result.current.deselectFile).toBe("function")
    expect(typeof result.current.handleToggleSelection).toBe("function")
  })

  it("должен переключать состояние выбора файла", async () => {
    const { result } = renderHook(() => useFileSelection(mockFile), {
      wrapper: TestWrapper,
    })

    expect(result.current.isSelected).toBe(false)

    await act(async () => {
      await result.current.toggleSelection()
      // Ждем завершения микротасков
      await new Promise((resolve) => setTimeout(resolve, 0))
    })

    expect(result.current.isSelected).toBe(true)

    await act(async () => {
      await result.current.toggleSelection()
      // Ждем завершения микротасков
      await new Promise((resolve) => setTimeout(resolve, 0))
    })

    expect(result.current.isSelected).toBe(false)
  })

  it("должен выбирать файл", async () => {
    const { result } = renderHook(() => useFileSelection(mockFile), {
      wrapper: TestWrapper,
    })

    expect(result.current.isSelected).toBe(false)

    await act(async () => {
      await result.current.selectFile()
      // Ждем завершения микротасков
      await new Promise((resolve) => setTimeout(resolve, 0))
    })

    expect(result.current.isSelected).toBe(true)
  })

  it("должен отменять выбор файла", async () => {
    const { result } = renderHook(() => useFileSelection(mockFile), {
      wrapper: TestWrapper,
    })

    // Сначала выберем файл
    await act(async () => {
      await result.current.selectFile()
      // Ждем завершения микротасков
      await new Promise((resolve) => setTimeout(resolve, 0))
    })

    expect(result.current.isSelected).toBe(true)

    // Теперь отменим выбор
    await act(async () => {
      await result.current.deselectFile()
      // Ждем завершения микротасков
      await new Promise((resolve) => setTimeout(resolve, 0))
    })

    expect(result.current.isSelected).toBe(false)
  })

  it("должен предотвращать всплытие события в handleToggleSelection", async () => {
    const { result } = renderHook(() => useFileSelection(mockFile), {
      wrapper: TestWrapper,
    })

    const mockEvent = {
      stopPropagation: vi.fn(),
    } as unknown as React.MouseEvent

    // handleToggleSelection вызывает toggleSelection асинхронно (fire and forget)
    // но мы можем проверить, что stopPropagation был вызван
    act(() => {
      result.current.handleToggleSelection(mockEvent)
    })

    expect(mockEvent.stopPropagation).toHaveBeenCalledOnce()

    // Подождем завершения асинхронной операции
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0))
    })

    expect(result.current.isSelected).toBe(true)
  })
})

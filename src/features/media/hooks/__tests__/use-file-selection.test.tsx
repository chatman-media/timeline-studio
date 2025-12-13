/**
 * @vitest-environment jsdom
 */
import { act, renderHook, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { BrowserProvider } from "@/domains/browser"
import { MediaType } from "@/domains/media-management"
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
    // Сброс состояния
    resetMockBrowserState()
    // Даем время на обработку изменений состояния и инициализацию provider
    await new Promise((resolve) => setTimeout(resolve, 10))
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

    // Переключаем выбор файла
    await act(async () => {
      await result.current.toggleSelection()
      // Даем время на обработку microtasks и event propagation
      await new Promise((resolve) => setTimeout(resolve, 100))
    })

    // Ждем, пока состояние обновится через backend events
    await waitFor(
      () => {
        expect(result.current.isSelected).toBe(true)
      },
      { timeout: 1000 },
    )

    // Переключаем обратно
    await act(async () => {
      await result.current.toggleSelection()
      // Даем время на обработку microtasks и event propagation
      await new Promise((resolve) => setTimeout(resolve, 100))
    })

    // Ждем, пока состояние обновится
    await waitFor(
      () => {
        expect(result.current.isSelected).toBe(false)
      },
      { timeout: 1000 },
    )
  })

  it("должен выбирать файл", async () => {
    const { result } = renderHook(() => useFileSelection(mockFile), {
      wrapper: TestWrapper,
    })

    expect(result.current.isSelected).toBe(false)

    // Выбираем файл
    await act(async () => {
      await result.current.selectFile()
      // Даем время на обработку microtasks и event propagation
      await new Promise((resolve) => setTimeout(resolve, 100))
    })

    // Ждем, пока состояние обновится через backend events
    await waitFor(
      () => {
        expect(result.current.isSelected).toBe(true)
      },
      { timeout: 1000 },
    )
  })

  it("должен отменять выбор файла", async () => {
    const { result } = renderHook(() => useFileSelection(mockFile), {
      wrapper: TestWrapper,
    })

    // Сначала выберем файл
    await act(async () => {
      await result.current.selectFile()
      // Даем время на обработку microtasks и event propagation
      await new Promise((resolve) => setTimeout(resolve, 100))
    })

    // Ждем, пока файл будет выбран
    await waitFor(
      () => {
        expect(result.current.isSelected).toBe(true)
      },
      { timeout: 1000 },
    )

    // Теперь отменим выбор
    await act(async () => {
      await result.current.deselectFile()
      // Даем время на обработку microtasks и event propagation
      await new Promise((resolve) => setTimeout(resolve, 100))
    })

    // Ждем, пока выбор будет отменен
    await waitFor(
      () => {
        expect(result.current.isSelected).toBe(false)
      },
      { timeout: 1000 },
    )
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
    await act(async () => {
      result.current.handleToggleSelection(mockEvent)
      // Даем время на обработку microtasks и event propagation
      await new Promise((resolve) => setTimeout(resolve, 100))
    })

    expect(mockEvent.stopPropagation).toHaveBeenCalledOnce()

    // Ждем, пока состояние обновится через backend events
    await waitFor(
      () => {
        expect(result.current.isSelected).toBe(true)
      },
      { timeout: 1000 },
    )
  })
})

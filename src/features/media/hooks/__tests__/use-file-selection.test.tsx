import { act, renderHook, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { BrowserProvider } from "@/domains/browser"
import { resetMockBrowserState } from "@/test/mocks/backend-sync"
import { useFileSelection } from "../use-file-selection"

// Mock данные
const mockFile = {
  id: "test-file-1",
  name: "test.mp4",
  path: "/path/test.mp4",
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
  beforeEach(() => {
    resetMockBrowserState()
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
    })

    await waitFor(() => {
      expect(result.current.isSelected).toBe(true)
    })

    await act(async () => {
      await result.current.toggleSelection()
    })

    await waitFor(() => {
      expect(result.current.isSelected).toBe(false)
    })
  })

  it("должен выбирать файл", async () => {
    const { result } = renderHook(() => useFileSelection(mockFile), {
      wrapper: TestWrapper,
    })

    expect(result.current.isSelected).toBe(false)

    await act(async () => {
      await result.current.selectFile()
    })

    await waitFor(() => {
      expect(result.current.isSelected).toBe(true)
    })
  })

  it("должен отменять выбор файла", async () => {
    const { result } = renderHook(() => useFileSelection(mockFile), {
      wrapper: TestWrapper,
    })

    // Сначала выберем файл
    await act(async () => {
      await result.current.selectFile()
    })

    await waitFor(() => {
      expect(result.current.isSelected).toBe(true)
    })

    // Теперь отменим выбор
    await act(async () => {
      await result.current.deselectFile()
    })

    await waitFor(() => {
      expect(result.current.isSelected).toBe(false)
    })
  })

  it("должен предотвращать всплытие события в handleToggleSelection", async () => {
    const { result } = renderHook(() => useFileSelection(mockFile), {
      wrapper: TestWrapper,
    })

    const mockEvent = {
      stopPropagation: vi.fn(),
    } as unknown as React.MouseEvent

    await act(async () => {
      result.current.handleToggleSelection(mockEvent)
      // Wait for the async toggleSelection to complete
      await new Promise(resolve => setTimeout(resolve, 0))
    })

    expect(mockEvent.stopPropagation).toHaveBeenCalledOnce()

    await waitFor(() => {
      expect(result.current.isSelected).toBe(true)
    })
  })
})

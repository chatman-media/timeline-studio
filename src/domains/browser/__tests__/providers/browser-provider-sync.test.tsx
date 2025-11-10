/**
 * Browser Provider State Synchronization Tests
 *
 * Tests for state synchronization between frontend and backend:
 * - Backend state changes
 * - Set updates
 * - Real-time synchronization
 */

import { act, cleanup, renderHook, waitFor } from "@testing-library/react"
import type { ReactNode } from "react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { clearStateChangeHandlers, resetExecuteCommandMock, resetMockBrowserState } from "@/test/mocks/backend-sync"
import { BrowserProvider, useBrowser } from "../../providers/browser-provider"

// Test wrapper component - creates a fresh wrapper for each test
const createWrapper = () => {
  const Wrapper = ({ children }: { children: ReactNode }) => <BrowserProvider>{children}</BrowserProvider>
  Wrapper.displayName = `BrowserProviderWrapper-${Date.now()}-${Math.random()}`
  return Wrapper
}

describe("BrowserProvider - State Synchronization", () => {
  beforeEach(() => {
    clearStateChangeHandlers()
    vi.clearAllMocks()
    resetMockBrowserState()
    resetExecuteCommandMock()
  })

  afterEach(() => {
    cleanup()
    clearStateChangeHandlers()
    resetMockBrowserState()
    resetExecuteCommandMock()
    vi.clearAllMocks()
  })

  it("should reflect backend state changes", async () => {
    const { result } = renderHook(() => useBrowser(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current).not.toBeNull()
      expect(result.current.isLoading).toBe(false)
    })

    // Select a file
    await act(async () => {
      await result.current.selectFile("file-1")
    })

    // State should update
    await waitFor(() => {
      expect(result.current.isFileSelected("file-1")).toBe(true)
    })
  })

  it("should update selectedFiles Set when backend state changes", async () => {
    const { result } = renderHook(() => useBrowser(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current).not.toBeNull()
      expect(result.current.isLoading).toBe(false)
    })

    const initialSize = result.current.selectedFiles.size

    await act(async () => {
      await result.current.selectFile("file-1")
    })

    await waitFor(() => {
      expect(result.current.selectedFiles.size).toBe(initialSize + 1)
    })
  })
})

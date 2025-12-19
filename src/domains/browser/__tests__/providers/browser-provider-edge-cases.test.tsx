/**
 * @vitest-environment jsdom
 */
/**
 * Browser Provider Edge Cases Tests
 *
 * Tests for edge cases and boundary conditions:
 * - Empty selections
 * - Duplicate operations
 * - Non-existent items
 * - Rapid operations
 */

import { act, cleanup, renderHook, waitFor } from "@testing-library/react"
import type { ReactNode } from "react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { clearStateChangeHandlers, resetExecuteCommandMock, resetMockBrowserState } from "@/test/mocks/backend-sync"
import { BrowserProvider, useBrowser } from "../../providers/browser-provider"

// Test wrapper component - creates a fresh wrapper for each test
const createWrapper = () => {
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <BrowserProvider data-oid="ai44vy9">{children}</BrowserProvider>
  )

  Wrapper.displayName = `BrowserProviderWrapper-${Date.now()}-${Math.random()}`
  return Wrapper
}

describe("BrowserProvider - Edge Cases", () => {
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

  it("should handle empty file selection", async () => {
    const { result } = renderHook(() => useBrowser(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current).not.toBeNull()
      expect(result.current.isLoading).toBe(false)
    })

    await act(async () => {
      await result.current.selectAllFiles([])
    })

    expect(result.current.selectedFiles.size).toBe(0)
  })

  it("should handle selecting the same file twice", async () => {
    const { result } = renderHook(() => useBrowser(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current).not.toBeNull()
      expect(result.current.isLoading).toBe(false)
    })

    await act(async () => {
      await result.current.selectFile("file-1")
    })

    await act(async () => {
      await result.current.selectFile("file-1")
    })

    // Should still be selected
    await waitFor(() => {
      expect(result.current.isFileSelected("file-1")).toBe(true)
    })
  })

  it("should handle deselecting non-selected file", async () => {
    const { result } = renderHook(() => useBrowser(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current).not.toBeNull()
      expect(result.current.isLoading).toBe(false)
    })

    await act(async () => {
      await result.current.deselectFile("file-1")
    })

    expect(result.current.isFileSelected("file-1")).toBe(false)
  })

  it("should handle rapid tab switches", async () => {
    const { result } = renderHook(() => useBrowser(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current).not.toBeNull()
      expect(result.current.isLoading).toBe(false)
    })

    // Rapidly switch tabs
    await act(async () => {
      await Promise.all([
        result.current.switchTab("effects"),
        result.current.switchTab("filters"),
        result.current.switchTab("transitions"),
      ])
    })

    // Should not crash
    expect(result.current.activeTab).toBeDefined()
  })

  it("should handle settings for non-existent tab gracefully", async () => {
    const { result } = renderHook(() => useBrowser(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current).not.toBeNull()
      expect(result.current.isLoading).toBe(false)
    })

    // currentTabSettings should always return valid settings
    expect(result.current.currentTabSettings).toBeDefined()
    expect(result.current.currentTabSettings.search_query).toBeDefined()
  })
})

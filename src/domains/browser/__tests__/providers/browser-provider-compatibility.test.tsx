/**
 * @vitest-environment jsdom
 */
/**
 * Browser Provider Backwards Compatibility Tests
 *
 * Tests for backwards compatibility features:
 * - useBrowserState alias
 * - clearBrowserState method
 * - Legacy API support
 */

import { cleanup, renderHook, waitFor } from "@testing-library/react"
import type { ReactNode } from "react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { clearStateChangeHandlers, resetExecuteCommandMock, resetMockBrowserState } from "@/test/mocks/backend-sync"
import { BrowserProvider, useBrowser, useBrowserState } from "../../providers/browser-provider"

// Test wrapper component - creates a fresh wrapper for each test
const createWrapper = () => {
  const Wrapper = ({ children }: { children: ReactNode }) => <BrowserProvider>{children}</BrowserProvider>
  Wrapper.displayName = `BrowserProviderWrapper-${Date.now()}-${Math.random()}`
  return Wrapper
}

describe("BrowserProvider - Backwards Compatibility", () => {
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

  it("should provide useBrowserState alias", async () => {
    const { result } = renderHook(() => useBrowserState(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current).not.toBeNull()
      expect(result.current.isLoading).toBe(false)
    })

    // Should have all the same properties as useBrowser
    expect(result.current.activeTab).toBeDefined()
    expect(result.current.selectedFiles).toBeDefined()
    expect(result.current.currentTabSettings).toBeDefined()
  })

  it("should provide clearBrowserState for compatibility", async () => {
    const { result } = renderHook(() => useBrowser(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current).not.toBeNull()
      expect(result.current.isLoading).toBe(false)
    })

    // Should not throw
    expect(() => result.current.clearBrowserState()).not.toThrow()
  })
})

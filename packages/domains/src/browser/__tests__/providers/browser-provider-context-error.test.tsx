/**
 * @vitest-environment jsdom
 */
/**
 * Browser Provider Context Error Tests
 *
 * Tests for error handling when hook is used outside provider
 */

import { renderHook } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { useBrowser } from "../../providers/browser-provider"

describe("BrowserProvider - Context Error", () => {
  it("should throw error when used outside provider", () => {
    // Suppress console.error for this test since we expect an error
    const originalError = console.error
    console.error = vi.fn()

    try {
      // The hook should throw an error when used without provider
      expect(() => {
        const { result } = renderHook(() => useBrowser())
        // Try to access result.current to trigger the error
        const _ = result.current
      }).toThrow(/useBrowser must be used within BrowserProvider/)
    } finally {
      console.error = originalError
    }
  })
})

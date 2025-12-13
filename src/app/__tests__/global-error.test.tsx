/**
 * @vitest-environment jsdom
 * Tests for GlobalError component
 */

import { describe, expect, it, vi } from "vitest"

describe("GlobalError", () => {
  const mockReset = vi.fn()
  const mockError = new Error("Test error")

  it("should export default function", async () => {
    const module = await import("../global-error")
    expect(module.default).toBeDefined()
    expect(typeof module.default).toBe("function")
  })

  it("should be a valid React component", async () => {
    const module = await import("../global-error")
    const GlobalError = module.default

    // Verify it's a function (React component)
    expect(typeof GlobalError).toBe("function")

    // Verify it can be called with props without throwing
    expect(() => GlobalError({ error: mockError, reset: mockReset })).not.toThrow()
  })

  it("should accept error and reset props", async () => {
    const module = await import("../global-error")
    const GlobalError = module.default

    // Component should accept error and reset props
    const result = GlobalError({ error: mockError, reset: mockReset })
    expect(result).toBeDefined()
  })
})

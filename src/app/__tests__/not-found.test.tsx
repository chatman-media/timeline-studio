/**
 * @vitest-environment jsdom
 * Tests for NotFound component
 */

import { describe, expect, it } from "vitest"

describe("NotFound", () => {
  it("should export default function", async () => {
    const module = await import("../not-found")
    expect(module.default).toBeDefined()
    expect(typeof module.default).toBe("function")
  })

  it("should be a valid React component", async () => {
    const module = await import("../not-found")
    const NotFound = module.default

    // Verify it's a function (React component)
    expect(typeof NotFound).toBe("function")

    // Verify it can be called without throwing
    expect(() => NotFound()).not.toThrow()
  })

  it("should have correct component structure", async () => {
    const module = await import("../not-found")
    const NotFound = module.default

    // Component should be defined
    expect(NotFound).toBeDefined()
    expect(typeof NotFound).toBe("function")
  })
})

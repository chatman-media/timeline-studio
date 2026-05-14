/**
 * @vitest-environment jsdom
 * Tests for Home page component
 *
 * Note: Home page is a simple wrapper that renders MediaStudio.
 * MediaStudio has comprehensive tests in src/features/media-studio/__tests__/
 * These tests verify the basic structure and export of the Home component.
 */

import { describe, expect, it } from "vitest"

describe("Home Page", () => {
  it("should export default function", async () => {
    const module = await import("../page")
    expect(module.default).toBeDefined()
    expect(typeof module.default).toBe("function")
  }, 20000)

  it("should be a valid React component", async () => {
    const module = await import("../page")
    const Home = module.default

    // Verify it's a function (React component)
    expect(typeof Home).toBe("function")

    // Verify it can be called without throwing
    expect(() => Home()).not.toThrow()
  })

  it("should have correct display name or type", async () => {
    const module = await import("../page")
    const Home = module.default

    // Component should be defined
    expect(Home).toBeDefined()
    expect(typeof Home).toBe("function")
  })
})

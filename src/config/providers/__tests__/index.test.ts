/**
 * Unit tests for config/providers exports
 */

import { describe, expect, it } from "vitest"
import { Providers, ThemeProvider, useTheme } from "../index"

describe("Config providers exports", () => {
  it("should export Providers", () => {
    expect(Providers).toBeDefined()
    expect(typeof Providers).toBe("function")
  })

  it("should export ThemeProvider", () => {
    expect(ThemeProvider).toBeDefined()
    expect(typeof ThemeProvider).toBe("function")
  })

  it("should export useTheme", () => {
    expect(useTheme).toBeDefined()
    expect(typeof useTheme).toBe("function")
  })

  it("should have all expected exports", () => {
    const exports = { Providers, ThemeProvider, useTheme }

    expect(Object.keys(exports)).toHaveLength(3)
    expect(exports).toHaveProperty("Providers")
    expect(exports).toHaveProperty("ThemeProvider")
    expect(exports).toHaveProperty("useTheme")
  })
})

describe("Export types", () => {
  it("Providers should be a React component", () => {
    expect(Providers).toHaveProperty("name")
    expect(typeof Providers).toBe("function")
  })

  it("ThemeProvider should be a React component", () => {
    expect(ThemeProvider).toHaveProperty("name")
    expect(typeof ThemeProvider).toBe("function")
  })

  it("useTheme should be a hook function", () => {
    expect(typeof useTheme).toBe("function")
  })
})

/**
 * Tests for language feature exports
 */

import { describe, expect, it } from "vitest"
import * as LanguageExports from "../index"

describe("Language Feature Exports", () => {
  it("should export useLanguage hook", () => {
    expect(LanguageExports.useLanguage).toBeDefined()
    expect(typeof LanguageExports.useLanguage).toBe("function")
  })

  it("should export all expected members", () => {
    const exports = Object.keys(LanguageExports)
    expect(exports).toContain("useLanguage")
  })

  it("should only export expected members", () => {
    const exports = Object.keys(LanguageExports)
    expect(exports).toEqual(["useLanguage"])
  })
})

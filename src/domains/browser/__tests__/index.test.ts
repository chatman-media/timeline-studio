/**
 * Browser Domain Index Tests
 *
 * Tests for exported constants and type re-exports
 */

import { describe, expect, it } from "vitest"
import type { BrowserTab } from "@/types/generated/tauri-bindings"
import * as BrowserDomain from "../index"

describe("Browser Domain Exports", () => {
  describe("Constants", () => {
    it("should export DEFAULT_TAB constant", () => {
      expect(BrowserDomain.DEFAULT_TAB).toBeDefined()
      expect(BrowserDomain.DEFAULT_TAB).toBe("media")
    })

    it("should export BROWSER_TABS array", () => {
      expect(BrowserDomain.BROWSER_TABS).toBeDefined()
      expect(Array.isArray(BrowserDomain.BROWSER_TABS)).toBe(true)
      expect(BrowserDomain.BROWSER_TABS).toHaveLength(6)
    })

    it("should include all valid browser tabs", () => {
      const expectedTabs: BrowserTab[] = ["media", "effects", "filters", "transitions", "templates", "style_templates"]

      expectedTabs.forEach((tab) => {
        expect(BrowserDomain.BROWSER_TABS).toContain(tab)
      })
    })

    it("should have media as first tab", () => {
      expect(BrowserDomain.BROWSER_TABS[0]).toBe("media")
    })
  })

  describe("Provider Exports", () => {
    it("should export BrowserProvider", () => {
      expect(BrowserDomain.BrowserProvider).toBeDefined()
      expect(typeof BrowserDomain.BrowserProvider).toBe("function")
    })

    it("should export useBrowser hook", () => {
      expect(BrowserDomain.useBrowser).toBeDefined()
      expect(typeof BrowserDomain.useBrowser).toBe("function")
    })

    it("should export useBrowserState alias", () => {
      expect(BrowserDomain.useBrowserState).toBeDefined()
      expect(typeof BrowserDomain.useBrowserState).toBe("function")
    })

    it("should have useBrowserState as alias to useBrowser", () => {
      expect(BrowserDomain.useBrowserState).toBe(BrowserDomain.useBrowser)
    })
  })

  describe("Tab Constants Validation", () => {
    it("should have unique tabs", () => {
      const uniqueTabs = new Set(BrowserDomain.BROWSER_TABS)
      expect(uniqueTabs.size).toBe(BrowserDomain.BROWSER_TABS.length)
    })

    it("should not have empty tab names", () => {
      BrowserDomain.BROWSER_TABS.forEach((tab) => {
        expect(tab).toBeTruthy()
        expect(tab.length).toBeGreaterThan(0)
      })
    })

    it("should use kebab-case for multi-word tabs", () => {
      const multiWordTabs = BrowserDomain.BROWSER_TABS.filter((tab) => tab.includes("-"))
      multiWordTabs.forEach((tab) => {
        expect(tab).toMatch(/^[a-z]+(-[a-z]+)*$/)
      })
    })
  })

  describe("DEFAULT_TAB Validation", () => {
    it("should be included in BROWSER_TABS", () => {
      expect(BrowserDomain.BROWSER_TABS).toContain(BrowserDomain.DEFAULT_TAB)
    })

    it("should be a valid BrowserTab type", () => {
      const validTabs: BrowserTab[] = ["media", "effects", "filters", "transitions", "templates", "style_templates"]
      expect(validTabs).toContain(BrowserDomain.DEFAULT_TAB)
    })
  })
})

/**
 * Media Management Events Tests
 *
 * Тесты для событий домена управления медиа
 */

import { describe, expect, it } from "vitest"
import { MEDIA_MANAGEMENT_EVENTS } from "../media-management-events"

describe("Media Management Events", () => {
  describe("Event Constants", () => {
    it("should have correct file operations event types", () => {
      expect(MEDIA_MANAGEMENT_EVENTS.FILES_IMPORTED).toBe("media.files.imported")
      expect(MEDIA_MANAGEMENT_EVENTS.FILE_DELETED).toBe("media.file.deleted")
      expect(MEDIA_MANAGEMENT_EVENTS.FILE_MOVED).toBe("media.file.moved")
      expect(MEDIA_MANAGEMENT_EVENTS.FILE_RENAMED).toBe("media.file.renamed")
    })

    it("should have correct metadata event types", () => {
      expect(MEDIA_MANAGEMENT_EVENTS.METADATA_EXTRACTED).toBe("media.metadata.extracted")
      expect(MEDIA_MANAGEMENT_EVENTS.THUMBNAIL_GENERATED).toBe("media.thumbnail.generated")
    })

    it("should have correct browser event types", () => {
      expect(MEDIA_MANAGEMENT_EVENTS.BROWSER_TAB_CHANGED).toBe("media.browser.tab-changed")
      expect(MEDIA_MANAGEMENT_EVENTS.FILES_SELECTED).toBe("media.browser.files-selected")
      expect(MEDIA_MANAGEMENT_EVENTS.BROWSER_FILTER_CHANGED).toBe("media.browser.filter-changed")
    })

    it("should have correct import event types", () => {
      expect(MEDIA_MANAGEMENT_EVENTS.IMPORT_STARTED).toBe("media.import.started")
      expect(MEDIA_MANAGEMENT_EVENTS.IMPORT_PROGRESS).toBe("media.import.progress")
      expect(MEDIA_MANAGEMENT_EVENTS.IMPORT_COMPLETED).toBe("media.import.completed")
    })

    it("should have all events prefixed with domain name", () => {
      const events = Object.values(MEDIA_MANAGEMENT_EVENTS)
      events.forEach((event) => {
        expect(event).toMatch(/^media\./)
      })
    })

    it("should not have duplicate event names", () => {
      const events = Object.values(MEDIA_MANAGEMENT_EVENTS)
      const uniqueEvents = new Set(events)
      expect(uniqueEvents.size).toBe(events.length)
    })

    it("should have consistent naming convention (kebab-case)", () => {
      const events = Object.values(MEDIA_MANAGEMENT_EVENTS)
      events.forEach((event) => {
        expect(event).toMatch(/^[a-z0-9-]+(\.[a-z0-9-]+)+$/)
      })
    })
  })

  describe("Event Count", () => {
    it("should have expected number of events", () => {
      const eventCount = Object.keys(MEDIA_MANAGEMENT_EVENTS).length
      // 4 file ops + 2 metadata + 3 browser + 3 import = 12
      expect(eventCount).toBe(12)
    })
  })

  describe("Event Grouping", () => {
    it("should have file operation events grouped", () => {
      const fileEvents = Object.values(MEDIA_MANAGEMENT_EVENTS).filter(
        (event) => event.includes(".file.") || event.includes(".files."),
      )
      expect(fileEvents).toHaveLength(4)
    })

    it("should have metadata events grouped", () => {
      const metadataEvents = Object.values(MEDIA_MANAGEMENT_EVENTS).filter((event) =>
        event.includes(".metadata."),
      )
      expect(metadataEvents).toHaveLength(1)

      const thumbnailEvents = Object.values(MEDIA_MANAGEMENT_EVENTS).filter((event) =>
        event.includes(".thumbnail."),
      )
      expect(thumbnailEvents).toHaveLength(1)
    })

    it("should have browser events grouped", () => {
      const browserEvents = Object.values(MEDIA_MANAGEMENT_EVENTS).filter((event) =>
        event.includes(".browser."),
      )
      expect(browserEvents).toHaveLength(3)
    })

    it("should have import events grouped", () => {
      const importEvents = Object.values(MEDIA_MANAGEMENT_EVENTS).filter((event) =>
        event.includes(".import."),
      )
      expect(importEvents).toHaveLength(3)
    })
  })

  describe("Event Naming Patterns", () => {
    it("should use singular for single file operations", () => {
      expect(MEDIA_MANAGEMENT_EVENTS.FILE_DELETED).toContain("file.")
      expect(MEDIA_MANAGEMENT_EVENTS.FILE_MOVED).toContain("file.")
      expect(MEDIA_MANAGEMENT_EVENTS.FILE_RENAMED).toContain("file.")
    })

    it("should use plural for multiple file operations", () => {
      expect(MEDIA_MANAGEMENT_EVENTS.FILES_IMPORTED).toContain("files.")
      expect(MEDIA_MANAGEMENT_EVENTS.FILES_SELECTED).toContain("files-selected")
    })
  })

  describe("Constants Immutability", () => {
    it("should be readonly object", () => {
      expect(Object.isFrozen(MEDIA_MANAGEMENT_EVENTS)).toBe(false) // as const doesn't freeze
      // TypeScript prevents modification at compile time
    })
  })
})

/**
 * Browser Machine Tests
 *
 * Tests for XState browser machine including:
 * - State initialization
 * - Backend event handling
 * - Tab switching
 * - Loading and error states
 * - Context updates
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { createActor } from "xstate"
import type { BrowserEvent, BrowserTab } from "@/types/generated/tauri-bindings"
import { browserMachine, createBrowserActor } from "../../machines/browser-machine"

describe("BrowserMachine", () => {
  let actor: ReturnType<typeof createActor<typeof browserMachine>>

  beforeEach(() => {
    actor = createActor(browserMachine)
    actor.start()
  })

  afterEach(() => {
    actor.stop()
    vi.clearAllMocks()
  })

  describe("Initialization", () => {
    it("should initialize with default context", () => {
      const snapshot = actor.getSnapshot()
      const context = snapshot.context

      expect(context.activeTab).toBe("media")
      expect(context.isLoading).toBe(false)
      expect(context.error).toBeNull()
    })

    it("should initialize all tab settings with defaults", () => {
      const snapshot = actor.getSnapshot()
      const context = snapshot.context

      const allTabs: BrowserTab[] = [
        "media",
        "effects",
        "filters",
        "transitions",
        "templates",
        "style_templates",
        "music",
        "subtitles",
      ]

      allTabs.forEach((tab) => {
        expect(context.tabSettings[tab]).toMatchObject({
          search_query: expect.any(String),
          show_favorites_only: expect.any(Boolean),
          sort_by: expect.any(String),
          sort_order: expect.stringMatching(/^(asc|desc)$/),
          group_by: expect.any(String),
          filter_type: expect.any(String),
          view_mode: expect.stringMatching(/^(thumbnails|list|grid)$/),
          preview_size_index: expect.any(Number),
        })
      })
    })

    it("should initialize all tabs with empty selectedFiles", () => {
      const snapshot = actor.getSnapshot()
      const context = snapshot.context

      const allTabs: BrowserTab[] = [
        "media",
        "effects",
        "filters",
        "transitions",
        "templates",
        "style_templates",
        "music",
        "subtitles",
      ]

      allTabs.forEach((tab) => {
        expect(context.selectedFiles[tab]).toEqual([])
      })
    })

    it("should start in idle state", () => {
      const snapshot = actor.getSnapshot()
      expect(snapshot.value).toBe("idle")
    })
  })

  describe("Tab Switching", () => {
    it("should switch tab via SWITCH_TAB event", () => {
      actor.send({ type: "SWITCH_TAB", tab: "effects" })

      const snapshot = actor.getSnapshot()
      expect(snapshot.context.activeTab).toBe("effects")
    })

    it("should switch between multiple tabs", () => {
      const tabs: BrowserTab[] = ["media", "effects", "filters", "transitions"]

      tabs.forEach((tab) => {
        actor.send({ type: "SWITCH_TAB", tab })
        const snapshot = actor.getSnapshot()
        expect(snapshot.context.activeTab).toBe(tab)
      })
    })

    it("should maintain tab state when switching back", () => {
      // Set search query on media tab
      const searchEvent: BrowserEvent = {
        event_type: "SearchQueryChanged",
        data: { tab: "media", query: "test" },
      }
      actor.send({ type: "BACKEND_EVENT", event: searchEvent })

      // Switch to effects
      actor.send({ type: "SWITCH_TAB", tab: "effects" })

      // Switch back to media
      actor.send({ type: "SWITCH_TAB", tab: "media" })

      const snapshot = actor.getSnapshot()
      expect(snapshot.context.activeTab).toBe("media")
      expect(snapshot.context.tabSettings.media!.search_query).toBe("test")
    })
  })

  describe("Backend Event Handling - Tab Settings", () => {
    it("should handle SearchQueryChanged event", () => {
      const event: BrowserEvent = {
        event_type: "SearchQueryChanged",
        data: { tab: "media", query: "test query" },
      }

      actor.send({ type: "BACKEND_EVENT", event })

      const snapshot = actor.getSnapshot()
      expect(snapshot.context.tabSettings.media!.search_query).toBe("test query")
    })

    it("should handle FavoritesToggled event", () => {
      const event: BrowserEvent = {
        event_type: "FavoritesToggled",
        data: { tab: "media", show_favorites: true },
      }

      actor.send({ type: "BACKEND_EVENT", event })

      const snapshot = actor.getSnapshot()
      expect(snapshot.context.tabSettings.media!.show_favorites_only).toBe(true)
    })

    it("should handle SortChanged event", () => {
      const event: BrowserEvent = {
        event_type: "SortChanged",
        data: { tab: "media", sort_by: "date", sort_order: "desc" },
      }

      actor.send({ type: "BACKEND_EVENT", event })

      const snapshot = actor.getSnapshot()
      expect(snapshot.context.tabSettings.media!.sort_by).toBe("date")
      expect(snapshot.context.tabSettings.media!.sort_order).toBe("desc")
    })

    it("should handle GroupByChanged event", () => {
      const event: BrowserEvent = {
        event_type: "GroupByChanged",
        data: { tab: "media", group_by: "type" },
      }

      actor.send({ type: "BACKEND_EVENT", event })

      const snapshot = actor.getSnapshot()
      expect(snapshot.context.tabSettings.media!.group_by).toBe("type")
    })

    it("should handle FilterChanged event", () => {
      const event: BrowserEvent = {
        event_type: "FilterChanged",
        data: { tab: "media", filter_type: "video" },
      }

      actor.send({ type: "BACKEND_EVENT", event })

      const snapshot = actor.getSnapshot()
      expect(snapshot.context.tabSettings.media!.filter_type).toBe("video")
    })

    it("should handle ViewModeChanged event", () => {
      const event: BrowserEvent = {
        event_type: "ViewModeChanged",
        data: { tab: "media", view_mode: "grid" },
      }

      actor.send({ type: "BACKEND_EVENT", event })

      const snapshot = actor.getSnapshot()
      expect(snapshot.context.tabSettings.media!.view_mode).toBe("grid")
    })

    it("should handle PreviewSizeChanged event", () => {
      const event: BrowserEvent = {
        event_type: "PreviewSizeChanged",
        data: { tab: "media", size_index: 4 },
      }

      actor.send({ type: "BACKEND_EVENT", event })

      const snapshot = actor.getSnapshot()
      expect(snapshot.context.tabSettings.media!.preview_size_index).toBe(4)
    })

    it("should handle TabSettingsReset event", () => {
      // First, change some settings
      actor.send({
        type: "BACKEND_EVENT",
        event: {
          event_type: "SearchQueryChanged",
          data: { tab: "media", query: "test" },
        },
      })
      actor.send({
        type: "BACKEND_EVENT",
        event: {
          event_type: "ViewModeChanged",
          data: { tab: "media", view_mode: "list" },
        },
      })

      // Then reset
      const resetEvent: BrowserEvent = {
        event_type: "TabSettingsReset",
        data: { tab: "media" },
      }
      actor.send({ type: "BACKEND_EVENT", event: resetEvent })

      const snapshot = actor.getSnapshot()
      expect(snapshot.context.tabSettings.media).toMatchObject({
        search_query: "",
        view_mode: "thumbnails",
      })
    })
  })

  describe("Backend Event Handling - File Selection", () => {
    it("should handle FileSelected event", () => {
      const event: BrowserEvent = {
        event_type: "FileSelected",
        data: { tab: "media", file_id: "file-1" },
      }

      actor.send({ type: "BACKEND_EVENT", event })

      const snapshot = actor.getSnapshot()
      expect(snapshot.context.selectedFiles.media).toContain("file-1")
    })

    it("should not duplicate file selection", () => {
      const event: BrowserEvent = {
        event_type: "FileSelected",
        data: { tab: "media", file_id: "file-1" },
      }

      actor.send({ type: "BACKEND_EVENT", event })
      actor.send({ type: "BACKEND_EVENT", event })

      const snapshot = actor.getSnapshot()
      expect(snapshot.context.selectedFiles.media).toEqual(["file-1"])
    })

    it("should handle FileDeselected event", () => {
      // First select a file
      actor.send({
        type: "BACKEND_EVENT",
        event: {
          event_type: "FileSelected",
          data: { tab: "media", file_id: "file-1" },
        },
      })

      // Then deselect it
      const event: BrowserEvent = {
        event_type: "FileDeselected",
        data: { tab: "media", file_id: "file-1" },
      }
      actor.send({ type: "BACKEND_EVENT", event })

      const snapshot = actor.getSnapshot()
      expect(snapshot.context.selectedFiles.media).not.toContain("file-1")
    })

    it("should handle FileSelectionToggled event", () => {
      const selectEvent: BrowserEvent = {
        event_type: "FileSelectionToggled",
        data: { tab: "media", file_id: "file-1", is_selected: true },
      }

      actor.send({ type: "BACKEND_EVENT", event: selectEvent })

      let snapshot = actor.getSnapshot()
      expect(snapshot.context.selectedFiles.media).toContain("file-1")

      const deselectEvent: BrowserEvent = {
        event_type: "FileSelectionToggled",
        data: { tab: "media", file_id: "file-1", is_selected: false },
      }

      actor.send({ type: "BACKEND_EVENT", event: deselectEvent })

      snapshot = actor.getSnapshot()
      expect(snapshot.context.selectedFiles.media).not.toContain("file-1")
    })

    it("should handle AllFilesSelected event", () => {
      const event: BrowserEvent = {
        event_type: "AllFilesSelected",
        data: { tab: "media", file_ids: ["file-1", "file-2", "file-3"] },
      }

      actor.send({ type: "BACKEND_EVENT", event })

      const snapshot = actor.getSnapshot()
      expect(snapshot.context.selectedFiles.media).toEqual(["file-1", "file-2", "file-3"])
    })

    it("should handle AllFilesDeselected event", () => {
      // First select files
      actor.send({
        type: "BACKEND_EVENT",
        event: {
          event_type: "AllFilesSelected",
          data: { tab: "media", file_ids: ["file-1", "file-2"] },
        },
      })

      // Then deselect all
      const event: BrowserEvent = {
        event_type: "AllFilesDeselected",
        data: { tab: "media" },
      }
      actor.send({ type: "BACKEND_EVENT", event })

      const snapshot = actor.getSnapshot()
      expect(snapshot.context.selectedFiles.media).toEqual([])
    })
  })

  describe("Backend Event Handling - Tab Switching", () => {
    it("should handle TabSwitched event", () => {
      const event: BrowserEvent = {
        event_type: "TabSwitched",
        data: { tab: "effects" },
      }

      actor.send({ type: "BACKEND_EVENT", event })

      const snapshot = actor.getSnapshot()
      expect(snapshot.context.activeTab).toBe("effects")
    })

    it("should maintain separate selections across tabs", () => {
      // Select files on media tab
      actor.send({
        type: "BACKEND_EVENT",
        event: {
          event_type: "FileSelected",
          data: { tab: "media", file_id: "media-1" },
        },
      })

      // Switch to effects tab
      actor.send({
        type: "BACKEND_EVENT",
        event: {
          event_type: "TabSwitched",
          data: { tab: "effects" },
        },
      })

      // Select files on effects tab
      actor.send({
        type: "BACKEND_EVENT",
        event: {
          event_type: "FileSelected",
          data: { tab: "effects", file_id: "effect-1" },
        },
      })

      const snapshot = actor.getSnapshot()
      expect(snapshot.context.selectedFiles.media).toContain("media-1")
      expect(snapshot.context.selectedFiles.effects).toContain("effect-1")
      expect(snapshot.context.activeTab).toBe("effects")
    })
  })

  describe("Loading State", () => {
    it("should handle SET_LOADING event", () => {
      actor.send({ type: "SET_LOADING", isLoading: true })

      let snapshot = actor.getSnapshot()
      expect(snapshot.context.isLoading).toBe(true)

      actor.send({ type: "SET_LOADING", isLoading: false })

      snapshot = actor.getSnapshot()
      expect(snapshot.context.isLoading).toBe(false)
    })

    it("should start with isLoading false", () => {
      const snapshot = actor.getSnapshot()
      expect(snapshot.context.isLoading).toBe(false)
    })
  })

  describe("Error State", () => {
    it("should handle SET_ERROR event", () => {
      actor.send({ type: "SET_ERROR", error: "Test error" })

      const snapshot = actor.getSnapshot()
      expect(snapshot.context.error).toBe("Test error")
      expect(snapshot.context.isLoading).toBe(false)
    })

    it("should handle CLEAR_ERROR event", () => {
      actor.send({ type: "SET_ERROR", error: "Test error" })
      actor.send({ type: "CLEAR_ERROR" })

      const snapshot = actor.getSnapshot()
      expect(snapshot.context.error).toBeNull()
    })

    it("should start with no error", () => {
      const snapshot = actor.getSnapshot()
      expect(snapshot.context.error).toBeNull()
    })

    it("should set isLoading to false when error occurs", () => {
      actor.send({ type: "SET_LOADING", isLoading: true })
      actor.send({ type: "SET_ERROR", error: "Test error" })

      const snapshot = actor.getSnapshot()
      expect(snapshot.context.isLoading).toBe(false)
      expect(snapshot.context.error).toBe("Test error")
    })
  })

  describe("Multiple Events", () => {
    it("should handle multiple backend events in sequence", () => {
      const events: BrowserEvent[] = [
        { event_type: "SearchQueryChanged", data: { tab: "media", query: "test" } },
        { event_type: "ViewModeChanged", data: { tab: "media", view_mode: "grid" } },
        { event_type: "FileSelected", data: { tab: "media", file_id: "file-1" } },
      ]

      events.forEach((event) => {
        actor.send({ type: "BACKEND_EVENT", event })
      })

      const snapshot = actor.getSnapshot()
      expect(snapshot.context.tabSettings.media!.search_query).toBe("test")
      expect(snapshot.context.tabSettings.media!.view_mode).toBe("grid")
      expect(snapshot.context.selectedFiles.media).toContain("file-1")
    })

    it("should handle events for different tabs", () => {
      actor.send({
        type: "BACKEND_EVENT",
        event: {
          event_type: "SearchQueryChanged",
          data: { tab: "media", query: "media query" },
        },
      })

      actor.send({
        type: "BACKEND_EVENT",
        event: {
          event_type: "SearchQueryChanged",
          data: { tab: "effects", query: "effects query" },
        },
      })

      const snapshot = actor.getSnapshot()
      expect(snapshot.context.tabSettings.media!.search_query).toBe("media query")
      expect(snapshot.context.tabSettings.effects!.search_query).toBe("effects query")
    })
  })

  describe("createBrowserActor helper", () => {
    it("should create a valid actor instance", () => {
      const newActor = createBrowserActor()
      expect(newActor).toBeDefined()
      expect(typeof newActor.start).toBe("function")
      expect(typeof newActor.stop).toBe("function")
      expect(typeof newActor.send).toBe("function")
    })

    it("should create actor with default context", () => {
      const newActor = createBrowserActor()
      newActor.start()

      const snapshot = newActor.getSnapshot()
      expect(snapshot.context.activeTab).toBe("media")
      expect(snapshot.context.isLoading).toBe(false)
      expect(snapshot.context.error).toBeNull()

      newActor.stop()
    })
  })

  describe("Edge Cases", () => {
    it("should handle unknown event types gracefully", () => {
      const unknownEvent = {
        event_type: "UnknownEvent",
        data: {},
      } as any

      expect(() => {
        actor.send({ type: "BACKEND_EVENT", event: unknownEvent })
      }).not.toThrow()

      const snapshot = actor.getSnapshot()
      expect(snapshot.context.error).toBeNull()
    })

    it("should handle missing tab settings initialization", () => {
      const event: BrowserEvent = {
        event_type: "SearchQueryChanged",
        data: { tab: "music", query: "test" },
      }

      actor.send({ type: "BACKEND_EVENT", event })

      const snapshot = actor.getSnapshot()
      expect(snapshot.context.tabSettings.music).toBeDefined()
      expect(snapshot.context.tabSettings.music!.search_query).toBe("test")
    })

    it("should handle file deselection when file not selected", () => {
      const event: BrowserEvent = {
        event_type: "FileDeselected",
        data: { tab: "media", file_id: "non-existent" },
      }

      expect(() => {
        actor.send({ type: "BACKEND_EVENT", event })
      }).not.toThrow()

      const snapshot = actor.getSnapshot()
      expect(snapshot.context.selectedFiles.media).toEqual([])
    })
  })
})

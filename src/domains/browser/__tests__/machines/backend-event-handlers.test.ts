/**
 * Backend Event Handlers Tests
 *
 * Tests for browser backend event handlers including:
 * - Tab management events
 * - Tab settings events
 * - File selection events
 * - Edge cases and error handling
 */

import { beforeEach, describe, expect, it } from "vitest"
import type { BrowserEvent, BrowserTab } from "@/types/generated/tauri-bindings"
import { DEFAULT_TAB_SETTINGS } from "../../__mocks__"
import { handleBrowserBackendEvent } from "../../machines/backend-event-handlers"
import type { BrowserMachineContext } from "../../machines/browser-machine"

describe("Backend Event Handlers", () => {
  let baseContext: BrowserMachineContext

  beforeEach(() => {
    baseContext = {
      activeTab: "media",
      tabSettings: {
        media: { ...DEFAULT_TAB_SETTINGS },
        effects: { ...DEFAULT_TAB_SETTINGS },
        filters: { ...DEFAULT_TAB_SETTINGS },
        transitions: { ...DEFAULT_TAB_SETTINGS },
        templates: { ...DEFAULT_TAB_SETTINGS },
        style_templates: { ...DEFAULT_TAB_SETTINGS },
        music: { ...DEFAULT_TAB_SETTINGS },
        subtitles: { ...DEFAULT_TAB_SETTINGS },
      },
      selectedFiles: {
        media: [],
        effects: [],
        filters: [],
        transitions: [],
        templates: [],
        style_templates: [],
        music: [],
        subtitles: [],
      },
      isLoading: false,
      error: null,
    }
  })

  describe("Tab Management", () => {
    it("should handle TabSwitched event", () => {
      const event: BrowserEvent = {
        event_type: "TabSwitched",
        data: { tab: "effects" },
      }

      const updates = handleBrowserBackendEvent(baseContext, event)

      expect(updates).toEqual({
        activeTab: "effects",
      })
    })

    it("should switch to all available tabs", () => {
      const tabs: BrowserTab[] = ["media", "effects", "filters", "transitions", "templates", "style_templates"]

      tabs.forEach((tab) => {
        const event: BrowserEvent = {
          event_type: "TabSwitched",
          data: { tab },
        }

        const updates = handleBrowserBackendEvent(baseContext, event)
        expect(updates.activeTab).toBe(tab)
      })
    })
  })

  describe("Search Settings", () => {
    it("should handle SearchQueryChanged event", () => {
      const event: BrowserEvent = {
        event_type: "SearchQueryChanged",
        data: { tab: "media", query: "test query" },
      }

      const updates = handleBrowserBackendEvent(baseContext, event)

      expect(updates.tabSettings).toBeDefined()
      expect(updates.tabSettings!.media.search_query).toBe("test query")
    })

    it("should update search query for specific tab", () => {
      const event: BrowserEvent = {
        event_type: "SearchQueryChanged",
        data: { tab: "effects", query: "blur effect" },
      }

      const updates = handleBrowserBackendEvent(baseContext, event)

      expect(updates.tabSettings!.effects.search_query).toBe("blur effect")
      // Other tab settings should remain unchanged in base context
      expect(baseContext.tabSettings.media.search_query).toBe("")
    })

    it("should preserve other tab settings when changing search query", () => {
      baseContext.tabSettings.media.view_mode = "grid"
      baseContext.tabSettings.media.sort_by = "date"

      const event: BrowserEvent = {
        event_type: "SearchQueryChanged",
        data: { tab: "media", query: "new query" },
      }

      const updates = handleBrowserBackendEvent(baseContext, event)

      expect(updates.tabSettings!.media.search_query).toBe("new query")
      expect(updates.tabSettings!.media.view_mode).toBe("grid")
      expect(updates.tabSettings!.media.sort_by).toBe("date")
    })
  })

  describe("Favorites Settings", () => {
    it("should handle FavoritesToggled event", () => {
      const event: BrowserEvent = {
        event_type: "FavoritesToggled",
        data: { tab: "media", show_favorites: true },
      }

      const updates = handleBrowserBackendEvent(baseContext, event)

      expect(updates.tabSettings!.media.show_favorites_only).toBe(true)
    })

    it("should toggle favorites for specific tab", () => {
      const event: BrowserEvent = {
        event_type: "FavoritesToggled",
        data: { tab: "filters", show_favorites: true },
      }

      const updates = handleBrowserBackendEvent(baseContext, event)

      expect(updates.tabSettings!.filters.show_favorites_only).toBe(true)
    })
  })

  describe("Sort Settings", () => {
    it("should handle SortChanged event", () => {
      const event: BrowserEvent = {
        event_type: "SortChanged",
        data: { tab: "media", sort_by: "date", sort_order: "desc" },
      }

      const updates = handleBrowserBackendEvent(baseContext, event)

      expect(updates.tabSettings!.media.sort_by).toBe("date")
      expect(updates.tabSettings!.media.sort_order).toBe("desc")
    })

    it("should update sort for specific tab", () => {
      const event: BrowserEvent = {
        event_type: "SortChanged",
        data: { tab: "effects", sort_by: "name", sort_order: "asc" },
      }

      const updates = handleBrowserBackendEvent(baseContext, event)

      expect(updates.tabSettings!.effects.sort_by).toBe("name")
      expect(updates.tabSettings!.effects.sort_order).toBe("asc")
    })
  })

  describe("Group Settings", () => {
    it("should handle GroupByChanged event", () => {
      const event: BrowserEvent = {
        event_type: "GroupByChanged",
        data: { tab: "media", group_by: "type" },
      }

      const updates = handleBrowserBackendEvent(baseContext, event)

      expect(updates.tabSettings!.media.group_by).toBe("type")
    })

    it("should update group_by for specific tab", () => {
      const event: BrowserEvent = {
        event_type: "GroupByChanged",
        data: { tab: "transitions", group_by: "category" },
      }

      const updates = handleBrowserBackendEvent(baseContext, event)

      expect(updates.tabSettings!.transitions.group_by).toBe("category")
    })
  })

  describe("Filter Settings", () => {
    it("should handle FilterChanged event", () => {
      const event: BrowserEvent = {
        event_type: "FilterChanged",
        data: { tab: "media", filter_type: "video" },
      }

      const updates = handleBrowserBackendEvent(baseContext, event)

      expect(updates.tabSettings!.media.filter_type).toBe("video")
    })

    it("should update filter for specific tab", () => {
      const event: BrowserEvent = {
        event_type: "FilterChanged",
        data: { tab: "media", filter_type: "image" },
      }

      const updates = handleBrowserBackendEvent(baseContext, event)

      expect(updates.tabSettings!.media.filter_type).toBe("image")
    })
  })

  describe("View Mode Settings", () => {
    it("should handle ViewModeChanged event", () => {
      const event: BrowserEvent = {
        event_type: "ViewModeChanged",
        data: { tab: "media", view_mode: "grid" },
      }

      const updates = handleBrowserBackendEvent(baseContext, event)

      expect(updates.tabSettings!.media.view_mode).toBe("grid")
    })

    it("should update view mode for specific tab", () => {
      const event: BrowserEvent = {
        event_type: "ViewModeChanged",
        data: { tab: "effects", view_mode: "list" },
      }

      const updates = handleBrowserBackendEvent(baseContext, event)

      expect(updates.tabSettings!.effects.view_mode).toBe("list")
    })

    it("should handle all view modes", () => {
      const viewModes: Array<"thumbnails" | "list" | "grid"> = ["thumbnails", "list", "grid"]

      viewModes.forEach((viewMode) => {
        const event: BrowserEvent = {
          event_type: "ViewModeChanged",
          data: { tab: "media", view_mode: viewMode },
        }

        const updates = handleBrowserBackendEvent(baseContext, event)
        expect(updates.tabSettings!.media.view_mode).toBe(viewMode)
      })
    })
  })

  describe("Preview Size Settings", () => {
    it("should handle PreviewSizeChanged event", () => {
      const event: BrowserEvent = {
        event_type: "PreviewSizeChanged",
        data: { tab: "media", size_index: 4 },
      }

      const updates = handleBrowserBackendEvent(baseContext, event)

      expect(updates.tabSettings!.media.preview_size_index).toBe(4)
    })

    it("should update preview size for specific tab", () => {
      const event: BrowserEvent = {
        event_type: "PreviewSizeChanged",
        data: { tab: "filters", size_index: 3 },
      }

      const updates = handleBrowserBackendEvent(baseContext, event)

      expect(updates.tabSettings!.filters.preview_size_index).toBe(3)
    })

    it("should handle all size indices", () => {
      const sizeIndices = [0, 1, 2, 3, 4]

      sizeIndices.forEach((sizeIndex) => {
        const event: BrowserEvent = {
          event_type: "PreviewSizeChanged",
          data: { tab: "media", size_index: sizeIndex },
        }

        const updates = handleBrowserBackendEvent(baseContext, event)
        expect(updates.tabSettings!.media.preview_size_index).toBe(sizeIndex)
      })
    })
  })

  describe("Tab Settings Reset", () => {
    it("should handle TabSettingsReset event", () => {
      // Modify settings first
      baseContext.tabSettings.media.search_query = "test"
      baseContext.tabSettings.media.view_mode = "list"
      baseContext.tabSettings.media.sort_by = "date"

      const event: BrowserEvent = {
        event_type: "TabSettingsReset",
        data: { tab: "media" },
      }

      const updates = handleBrowserBackendEvent(baseContext, event)

      expect(updates.tabSettings!.media).toMatchObject({
        search_query: "",
        view_mode: "thumbnails",
        sort_by: "name",
        sort_order: "asc",
      })
    })

    it("should reset only specific tab settings", () => {
      baseContext.tabSettings.media.search_query = "media query"
      baseContext.tabSettings.effects.search_query = "effects query"

      const event: BrowserEvent = {
        event_type: "TabSettingsReset",
        data: { tab: "media" },
      }

      const updates = handleBrowserBackendEvent(baseContext, event)

      expect(updates.tabSettings!.media.search_query).toBe("")
      // Effects tab should not be reset
      expect(baseContext.tabSettings.effects.search_query).toBe("effects query")
    })
  })

  describe("File Selection", () => {
    it("should handle FileSelected event", () => {
      const event: BrowserEvent = {
        event_type: "FileSelected",
        data: { tab: "media", file_id: "file-1" },
      }

      const updates = handleBrowserBackendEvent(baseContext, event)

      expect(updates.selectedFiles!.media).toContain("file-1")
    })

    it("should not duplicate file selection", () => {
      baseContext.selectedFiles.media = ["file-1"]

      const event: BrowserEvent = {
        event_type: "FileSelected",
        data: { tab: "media", file_id: "file-1" },
      }

      const updates = handleBrowserBackendEvent(baseContext, event)

      expect(updates.selectedFiles!.media).toEqual(["file-1"])
    })

    it("should add to existing selection", () => {
      baseContext.selectedFiles.media = ["file-1"]

      const event: BrowserEvent = {
        event_type: "FileSelected",
        data: { tab: "media", file_id: "file-2" },
      }

      const updates = handleBrowserBackendEvent(baseContext, event)

      expect(updates.selectedFiles!.media).toContain("file-1")
      expect(updates.selectedFiles!.media).toContain("file-2")
    })

    it("should select files on specific tab", () => {
      const event: BrowserEvent = {
        event_type: "FileSelected",
        data: { tab: "effects", file_id: "effect-1" },
      }

      const updates = handleBrowserBackendEvent(baseContext, event)

      expect(updates.selectedFiles!.effects).toContain("effect-1")
    })
  })

  describe("File Deselection", () => {
    it("should handle FileDeselected event", () => {
      baseContext.selectedFiles.media = ["file-1", "file-2"]

      const event: BrowserEvent = {
        event_type: "FileDeselected",
        data: { tab: "media", file_id: "file-1" },
      }

      const updates = handleBrowserBackendEvent(baseContext, event)

      expect(updates.selectedFiles!.media).not.toContain("file-1")
      expect(updates.selectedFiles!.media).toContain("file-2")
    })

    it("should handle deselecting non-existent file", () => {
      baseContext.selectedFiles.media = ["file-1"]

      const event: BrowserEvent = {
        event_type: "FileDeselected",
        data: { tab: "media", file_id: "non-existent" },
      }

      const updates = handleBrowserBackendEvent(baseContext, event)

      expect(updates.selectedFiles!.media).toEqual(["file-1"])
    })

    it("should deselect from specific tab", () => {
      baseContext.selectedFiles.media = ["media-1"]
      baseContext.selectedFiles.effects = ["effect-1", "effect-2"]

      const event: BrowserEvent = {
        event_type: "FileDeselected",
        data: { tab: "effects", file_id: "effect-1" },
      }

      const updates = handleBrowserBackendEvent(baseContext, event)

      expect(updates.selectedFiles!.effects).not.toContain("effect-1")
      // Media selection should not be affected
      expect(baseContext.selectedFiles.media).toEqual(["media-1"])
    })
  })

  describe("File Selection Toggle", () => {
    it("should handle FileSelectionToggled event - select", () => {
      const event: BrowserEvent = {
        event_type: "FileSelectionToggled",
        data: { tab: "media", file_id: "file-1", is_selected: true },
      }

      const updates = handleBrowserBackendEvent(baseContext, event)

      expect(updates.selectedFiles!.media).toContain("file-1")
    })

    it("should handle FileSelectionToggled event - deselect", () => {
      baseContext.selectedFiles.media = ["file-1"]

      const event: BrowserEvent = {
        event_type: "FileSelectionToggled",
        data: { tab: "media", file_id: "file-1", is_selected: false },
      }

      const updates = handleBrowserBackendEvent(baseContext, event)

      expect(updates.selectedFiles!.media).not.toContain("file-1")
    })

    it("should not duplicate when toggling to selected", () => {
      baseContext.selectedFiles.media = ["file-1"]

      const event: BrowserEvent = {
        event_type: "FileSelectionToggled",
        data: { tab: "media", file_id: "file-1", is_selected: true },
      }

      const updates = handleBrowserBackendEvent(baseContext, event)

      expect(updates.selectedFiles!.media).toEqual(["file-1"])
    })
  })

  describe("Select All Files", () => {
    it("should handle AllFilesSelected event", () => {
      const event: BrowserEvent = {
        event_type: "AllFilesSelected",
        data: { tab: "media", file_ids: ["file-1", "file-2", "file-3"] },
      }

      const updates = handleBrowserBackendEvent(baseContext, event)

      expect(updates.selectedFiles!.media).toEqual(["file-1", "file-2", "file-3"])
    })

    it("should replace existing selection", () => {
      baseContext.selectedFiles.media = ["old-1", "old-2"]

      const event: BrowserEvent = {
        event_type: "AllFilesSelected",
        data: { tab: "media", file_ids: ["new-1", "new-2"] },
      }

      const updates = handleBrowserBackendEvent(baseContext, event)

      expect(updates.selectedFiles!.media).toEqual(["new-1", "new-2"])
      expect(updates.selectedFiles!.media).not.toContain("old-1")
    })

    it("should select all files for specific tab", () => {
      const event: BrowserEvent = {
        event_type: "AllFilesSelected",
        data: { tab: "filters", file_ids: ["filter-1", "filter-2"] },
      }

      const updates = handleBrowserBackendEvent(baseContext, event)

      expect(updates.selectedFiles!.filters).toEqual(["filter-1", "filter-2"])
    })
  })

  describe("Deselect All Files", () => {
    it("should handle AllFilesDeselected event", () => {
      baseContext.selectedFiles.media = ["file-1", "file-2", "file-3"]

      const event: BrowserEvent = {
        event_type: "AllFilesDeselected",
        data: { tab: "media" },
      }

      const updates = handleBrowserBackendEvent(baseContext, event)

      expect(updates.selectedFiles!.media).toEqual([])
    })

    it("should deselect all files for specific tab", () => {
      baseContext.selectedFiles.media = ["media-1"]
      baseContext.selectedFiles.effects = ["effect-1", "effect-2"]

      const event: BrowserEvent = {
        event_type: "AllFilesDeselected",
        data: { tab: "effects" },
      }

      const updates = handleBrowserBackendEvent(baseContext, event)

      expect(updates.selectedFiles!.effects).toEqual([])
      // Media selection should not be affected
      expect(baseContext.selectedFiles.media).toEqual(["media-1"])
    })

    it("should handle deselecting when no files selected", () => {
      const event: BrowserEvent = {
        event_type: "AllFilesDeselected",
        data: { tab: "media" },
      }

      const updates = handleBrowserBackendEvent(baseContext, event)

      expect(updates.selectedFiles!.media).toEqual([])
    })
  })

  describe("Edge Cases", () => {
    it("should handle unknown event type", () => {
      const unknownEvent = {
        event_type: "UnknownEventType",
        data: {},
      } as any

      const updates = handleBrowserBackendEvent(baseContext, unknownEvent)

      expect(updates).toEqual({})
    })

    it("should create default tab settings if missing", () => {
      const contextWithMissingTab = {
        ...baseContext,
        tabSettings: {
          ...baseContext.tabSettings,
          music: undefined as any,
        },
      }

      const event: BrowserEvent = {
        event_type: "SearchQueryChanged",
        data: { tab: "music", query: "test" },
      }

      const updates = handleBrowserBackendEvent(contextWithMissingTab, event)

      expect(updates.tabSettings!.music).toBeDefined()
      expect(updates.tabSettings!.music.search_query).toBe("test")
    })

    it("should create empty selected files array if missing", () => {
      const contextWithMissingFiles = {
        ...baseContext,
        selectedFiles: {
          ...baseContext.selectedFiles,
          music: undefined as any,
        },
      }

      const event: BrowserEvent = {
        event_type: "FileSelected",
        data: { tab: "music", file_id: "song-1" },
      }

      const updates = handleBrowserBackendEvent(contextWithMissingFiles, event)

      expect(updates.selectedFiles!.music).toBeDefined()
      expect(updates.selectedFiles!.music).toContain("song-1")
    })

    it("should not modify original context", () => {
      const originalContext = JSON.parse(JSON.stringify(baseContext))

      const event: BrowserEvent = {
        event_type: "SearchQueryChanged",
        data: { tab: "media", query: "test" },
      }

      handleBrowserBackendEvent(baseContext, event)

      // Original context should not be modified
      expect(baseContext.tabSettings.media.search_query).toBe(originalContext.tabSettings.media.search_query)
    })
  })

  describe("Multiple Events Sequence", () => {
    it("should handle multiple settings changes", () => {
      let context = baseContext

      const events: BrowserEvent[] = [
        { event_type: "SearchQueryChanged", data: { tab: "media", query: "test" } },
        { event_type: "ViewModeChanged", data: { tab: "media", view_mode: "grid" } },
        { event_type: "SortChanged", data: { tab: "media", sort_by: "date", sort_order: "desc" } },
      ]

      events.forEach((event) => {
        const updates = handleBrowserBackendEvent(context, event)
        context = { ...context, ...updates }
      })

      expect(context.tabSettings.media.search_query).toBe("test")
      expect(context.tabSettings.media.view_mode).toBe("grid")
      expect(context.tabSettings.media.sort_by).toBe("date")
      expect(context.tabSettings.media.sort_order).toBe("desc")
    })

    it("should handle multiple file operations", () => {
      let context = baseContext

      const events: BrowserEvent[] = [
        { event_type: "FileSelected", data: { tab: "media", file_id: "file-1" } },
        { event_type: "FileSelected", data: { tab: "media", file_id: "file-2" } },
        { event_type: "FileDeselected", data: { tab: "media", file_id: "file-1" } },
      ]

      events.forEach((event) => {
        const updates = handleBrowserBackendEvent(context, event)
        context = { ...context, ...updates }
      })

      expect(context.selectedFiles.media).toEqual(["file-2"])
    })
  })
})

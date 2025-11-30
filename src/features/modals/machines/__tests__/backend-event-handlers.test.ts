import { beforeEach, describe, expect, it, vi } from "vitest"
import type { ModalMachineContext } from "@/domains/system-integration/machines/modal-machine"
import { handleModalBackendEvent, type ModalBackendEvent } from "../backend-event-handlers"

// Mock logger
vi.mock("@/lib/tauri-logger", () => ({
  createLogger: () => ({
    info: vi.fn(),
    debug: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  }),
}))

describe("Backend Event Handlers", () => {
  let mockContext: ModalMachineContext

  beforeEach(() => {
    vi.clearAllMocks()
    mockContext = {
      modalType: "none",
      modalData: null,
      previousModal: null,
    }
  })

  describe("handleModalBackendEvent", () => {
    it("should handle ModalOpened event", () => {
      const event: ModalBackendEvent = {
        type: "ModalOpened",
        payload: {
          modal_type: "export",
          modal_data: { format: "mp4" },
        },
      }

      const result = handleModalBackendEvent(mockContext, event)

      expect(result).toEqual({
        modalType: "export",
        modalData: { format: "mp4" },
      })
    })

    it("should handle ModalOpened event with null data", () => {
      const event: ModalBackendEvent = {
        type: "ModalOpened",
        payload: {
          modal_type: "user-settings",
          modal_data: null,
        },
      }

      const result = handleModalBackendEvent(mockContext, event)

      expect(result).toEqual({
        modalType: "user-settings",
        modalData: null,
      })
    })

    it("should handle ModalClosed event without previousModal", () => {
      const event: ModalBackendEvent = {
        type: "ModalClosed",
        payload: {},
      }

      const result = handleModalBackendEvent(mockContext, event)

      expect(result).toEqual({
        modalType: "none",
        modalData: null,
        previousModal: null,
      })
    })

    it("should handle ModalClosed event with previousModal", () => {
      const contextWithPrevious: ModalMachineContext = {
        modalType: "cache-settings",
        modalData: null,
        previousModal: "user-settings",
      }

      const event: ModalBackendEvent = {
        type: "ModalClosed",
        payload: {},
      }

      const result = handleModalBackendEvent(contextWithPrevious, event)

      expect(result).toEqual({
        modalType: "user-settings",
        modalData: null,
        previousModal: null,
      })
    })

    it("should handle ModalSubmitted event", () => {
      const event: ModalBackendEvent = {
        type: "ModalSubmitted",
        payload: {
          data: { result: "success" },
        },
      }

      const result = handleModalBackendEvent(mockContext, event)

      expect(result).toEqual({
        modalType: "none",
        modalData: null,
        previousModal: null,
      })
    })

    it("should handle ModalSubmitted event with null data", () => {
      const event: ModalBackendEvent = {
        type: "ModalSubmitted",
        payload: {
          data: null,
        },
      }

      const result = handleModalBackendEvent(mockContext, event)

      expect(result).toEqual({
        modalType: "none",
        modalData: null,
        previousModal: null,
      })
    })

    it("should handle unknown event type", () => {
      const event: ModalBackendEvent = {
        type: "UnknownEvent",
        payload: {},
      }

      const result = handleModalBackendEvent(mockContext, event)

      expect(result).toEqual({})
    })

    it("should handle event with custom payload", () => {
      const event: ModalBackendEvent = {
        type: "CustomEvent",
        payload: { custom: "data" },
      }

      const result = handleModalBackendEvent(mockContext, event)

      expect(result).toEqual({})
    })
  })

  describe("ModalOpened event variations", () => {
    it("should handle all standard modal types", () => {
      const modalTypes = [
        "project-settings",
        "user-settings",
        "camera-capture",
        "voice-recording",
        "export",
        "cache-settings",
        "cache-statistics",
        "subtitle-editor",
        "person-form",
        "missing-files",
        "ai-marker-settings",
        "subtitle-ai-tools",
        "audio-effects",
        "midi-learn",
        "midi-mapping",
        "midi-configuration",
        "effect-detail",
        "color-grading",
        "ai-director",
      ]

      modalTypes.forEach((modalType) => {
        const event: ModalBackendEvent = {
          type: "ModalOpened",
          payload: {
            modal_type: modalType,
            modal_data: null,
          },
        }

        const result = handleModalBackendEvent(mockContext, event)

        expect(result.modalType).toBe(modalType)
        expect(result.modalData).toBeNull()
      })
    })

    it("should handle complex modal data structures", () => {
      const complexData = {
        dialogClass: "custom-class",
        subtitle: {
          id: "123",
          text: "Test subtitle",
          startTime: 10.5,
          endTime: 15.0,
        },
        options: {
          autoSave: true,
          quality: "high",
        },
      }

      const event: ModalBackendEvent = {
        type: "ModalOpened",
        payload: {
          modal_type: "subtitle-editor",
          modal_data: complexData,
        },
      }

      const result = handleModalBackendEvent(mockContext, event)

      expect(result).toEqual({
        modalType: "subtitle-editor",
        modalData: complexData,
      })
    })
  })

  describe("ModalClosed event variations", () => {
    it("should reset to none when no previous modal exists", () => {
      const contexts = [
        { modalType: "export" as const, modalData: null, previousModal: null },
        { modalType: "user-settings" as const, modalData: { test: 1 }, previousModal: null },
        { modalType: "camera-capture" as const, modalData: {}, previousModal: null },
      ]

      contexts.forEach((ctx) => {
        const event: ModalBackendEvent = {
          type: "ModalClosed",
          payload: {},
        }

        const result = handleModalBackendEvent(ctx, event)

        expect(result.modalType).toBe("none")
        expect(result.modalData).toBeNull()
        expect(result.previousModal).toBeNull()
      })
    })

    it("should return to previous modal when it exists", () => {
      const event: ModalBackendEvent = {
        type: "ModalClosed",
        payload: {},
      }

      const context: ModalMachineContext = {
        modalType: "cache-settings",
        modalData: { cacheSize: 1000 },
        previousModal: "user-settings",
      }

      const result = handleModalBackendEvent(context, event)

      expect(result.modalType).toBe("user-settings")
      expect(result.modalData).toBeNull()
      expect(result.previousModal).toBeNull()
    })
  })

  describe("ModalSubmitted event variations", () => {
    it("should close modal with various data types", () => {
      const dataTypes = [
        { result: "success" },
        { id: 123, name: "test" },
        ["item1", "item2"],
        "simple string",
        42,
        true,
        null,
      ]

      dataTypes.forEach((data) => {
        const event: ModalBackendEvent = {
          type: "ModalSubmitted",
          payload: { data },
        }

        const result = handleModalBackendEvent(mockContext, event)

        expect(result).toEqual({
          modalType: "none",
          modalData: null,
          previousModal: null,
        })
      })
    })

    it("should always close modal regardless of current context", () => {
      const contexts: ModalMachineContext[] = [
        { modalType: "export", modalData: null, previousModal: null },
        { modalType: "user-settings", modalData: { test: 1 }, previousModal: "project-settings" },
        { modalType: "camera-capture", modalData: {}, previousModal: null },
      ]

      contexts.forEach((ctx) => {
        const event: ModalBackendEvent = {
          type: "ModalSubmitted",
          payload: { data: { result: "ok" } },
        }

        const result = handleModalBackendEvent(ctx, event)

        expect(result).toEqual({
          modalType: "none",
          modalData: null,
          previousModal: null,
        })
      })
    })
  })

  describe("Edge cases", () => {
    it("should handle empty payload", () => {
      const event: ModalBackendEvent = {
        type: "ModalOpened",
        payload: {
          modal_type: "",
          modal_data: null,
        },
      }

      const result = handleModalBackendEvent(mockContext, event)

      expect(result.modalType).toBe("")
      expect(result.modalData).toBeNull()
    })

    it("should handle undefined in modal_data", () => {
      const event: ModalBackendEvent = {
        type: "ModalOpened",
        payload: {
          modal_type: "export",
          modal_data: undefined as any,
        },
      }

      const result = handleModalBackendEvent(mockContext, event)

      expect(result.modalType).toBe("export")
      expect(result.modalData).toBeNull()
    })

    it("should preserve modal data type coercion", () => {
      const event: ModalBackendEvent = {
        type: "ModalOpened",
        payload: {
          modal_type: "export",
          modal_data: 0, // falsy but not null/undefined
        },
      }

      const result = handleModalBackendEvent(mockContext, event)

      expect(result.modalType).toBe("export")
      // The || null in the handler converts 0 to null, which is expected behavior
      expect(result.modalData).toBeNull()
    })
  })
})

/**
 * Tests for Modal Machine
 */

import { beforeEach, describe, expect, it } from "vitest"
import { createActor } from "xstate"
import { type ModalType, modalMachine } from "../../machines/modal-machine"

describe("Modal Machine", () => {
  let actor: ReturnType<typeof createActor<typeof modalMachine>>

  beforeEach(() => {
    actor = createActor(modalMachine)
    actor.start()
  })

  afterEach(() => {
    actor.stop()
  })

  describe("Initial State", () => {
    it("should start in closed state", () => {
      expect(actor.getSnapshot().value).toBe("closed")
    })

    it("should have initial context values", () => {
      const snapshot = actor.getSnapshot()

      expect(snapshot.context.modalType).toBe("none")
      expect(snapshot.context.modalData).toBeNull()
      expect(snapshot.context.previousModal).toBeNull()
    })

    it("should match closed state", () => {
      expect(actor.getSnapshot().matches("closed")).toBe(true)
      expect(actor.getSnapshot().matches("opened")).toBe(false)
    })
  })

  describe("Opening Modals", () => {
    it("should transition to opened state when modal is opened", () => {
      actor.send({ type: "OPEN_MODAL", modalType: "user-settings" })

      const snapshot = actor.getSnapshot()
      expect(snapshot.value).toBe("opened")
      expect(snapshot.matches("opened")).toBe(true)
    })

    it("should set modal type in context", () => {
      actor.send({ type: "OPEN_MODAL", modalType: "project-settings" })

      const snapshot = actor.getSnapshot()
      expect(snapshot.context.modalType).toBe("project-settings")
    })

    it("should set modal data when provided", () => {
      const data = { key: "value", nested: { prop: "test" } }

      actor.send({ type: "OPEN_MODAL", modalType: "export", modalData: data })

      const snapshot = actor.getSnapshot()
      expect(snapshot.context.modalData).toEqual(data)
    })

    it("should open modal without data", () => {
      actor.send({ type: "OPEN_MODAL", modalType: "keyboard-shortcuts" })

      const snapshot = actor.getSnapshot()
      expect(snapshot.context.modalType).toBe("keyboard-shortcuts")
      expect(snapshot.context.modalData).toBeNull()
    })

    it("should open different modal types", () => {
      const modalTypes: ModalType[] = [
        "camera-capture",
        "voice-recording",
        "export",
        "project-settings",
        "user-settings",
        "keyboard-shortcuts",
        "effect-detail",
      ]

      modalTypes.forEach((modalType) => {
        actor = createActor(modalMachine)
        actor.start()

        actor.send({ type: "OPEN_MODAL", modalType })

        const snapshot = actor.getSnapshot()
        expect(snapshot.context.modalType).toBe(modalType)
        expect(snapshot.matches("opened")).toBe(true)

        actor.stop()
      })
    })
  })

  describe("Closing Modals", () => {
    it("should transition to closed state when modal is closed", () => {
      actor.send({ type: "OPEN_MODAL", modalType: "user-settings" })
      actor.send({ type: "CLOSE_MODAL" })

      const snapshot = actor.getSnapshot()
      expect(snapshot.value).toBe("closed")
      expect(snapshot.matches("closed")).toBe(true)
    })

    it("should reset modal type to none", () => {
      actor.send({ type: "OPEN_MODAL", modalType: "export" })
      actor.send({ type: "CLOSE_MODAL" })

      const snapshot = actor.getSnapshot()
      expect(snapshot.context.modalType).toBe("none")
    })

    it("should clear modal data", () => {
      const data = { key: "value" }

      actor.send({ type: "OPEN_MODAL", modalType: "export", modalData: data })
      expect(actor.getSnapshot().context.modalData).toEqual(data)

      actor.send({ type: "CLOSE_MODAL" })

      const snapshot = actor.getSnapshot()
      expect(snapshot.context.modalData).toBeNull()
    })

    it("should clear previous modal reference", () => {
      actor.send({ type: "OPEN_MODAL", modalType: "user-settings" })
      actor.send({ type: "OPEN_MODAL", modalType: "export" })
      actor.send({ type: "CLOSE_MODAL" })

      const snapshot = actor.getSnapshot()
      expect(snapshot.context.previousModal).toBeNull()
    })
  })

  describe("Submitting Modals", () => {
    it("should transition to closed state when modal is submitted", () => {
      actor.send({ type: "OPEN_MODAL", modalType: "project-settings" })
      actor.send({ type: "SUBMIT_MODAL" })

      const snapshot = actor.getSnapshot()
      expect(snapshot.value).toBe("closed")
      expect(snapshot.matches("closed")).toBe(true)
    })

    it("should reset modal type on submit", () => {
      actor.send({ type: "OPEN_MODAL", modalType: "project-settings" })
      actor.send({ type: "SUBMIT_MODAL", data: { name: "New Project" } })

      const snapshot = actor.getSnapshot()
      expect(snapshot.context.modalType).toBe("none")
    })

    it("should clear modal data on submit", () => {
      const initialData = { setting: "value" }

      actor.send({ type: "OPEN_MODAL", modalType: "project-settings", modalData: initialData })
      actor.send({ type: "SUBMIT_MODAL", data: { name: "Updated" } })

      const snapshot = actor.getSnapshot()
      expect(snapshot.context.modalData).toBeNull()
    })
  })

  describe("Modal Stack Behavior", () => {
    it("should support opening modal over another modal", () => {
      actor.send({ type: "OPEN_MODAL", modalType: "user-settings" })

      const firstSnapshot = actor.getSnapshot()
      expect(firstSnapshot.context.modalType).toBe("user-settings")

      actor.send({ type: "OPEN_MODAL", modalType: "keyboard-shortcuts" })

      const secondSnapshot = actor.getSnapshot()
      expect(secondSnapshot.context.modalType).toBe("keyboard-shortcuts")
      expect(secondSnapshot.context.previousModal).toBe("user-settings")
    })

    it("should return to previous modal when closing with returnTo", () => {
      actor.send({ type: "OPEN_MODAL", modalType: "user-settings" })
      actor.send({
        type: "OPEN_MODAL",
        modalType: "keyboard-shortcuts",
        modalData: { returnTo: "user-settings" },
      })

      expect(actor.getSnapshot().context.modalType).toBe("keyboard-shortcuts")
      expect(actor.getSnapshot().context.previousModal).toBe("user-settings")

      actor.send({ type: "CLOSE_MODAL" })

      const snapshot = actor.getSnapshot()
      expect(snapshot.context.modalType).toBe("user-settings")
      expect(snapshot.matches("opened")).toBe(true)
    })

    it("should close completely if no previous modal", () => {
      actor.send({ type: "OPEN_MODAL", modalType: "export" })
      actor.send({ type: "CLOSE_MODAL" })

      const snapshot = actor.getSnapshot()
      expect(snapshot.matches("closed")).toBe(true)
      expect(snapshot.context.modalType).toBe("none")
    })

    it("should handle multiple modal levels", () => {
      actor.send({ type: "OPEN_MODAL", modalType: "user-settings" })
      actor.send({
        type: "OPEN_MODAL",
        modalType: "project-settings",
        modalData: { returnTo: "user-settings" },
      })
      actor.send({ type: "OPEN_MODAL", modalType: "export", modalData: { returnTo: "project-settings" } })

      expect(actor.getSnapshot().context.modalType).toBe("export")
      expect(actor.getSnapshot().context.previousModal).toBe("project-settings")
    })
  })

  describe("Edge Cases", () => {
    it("should handle CLOSE_MODAL when already closed", () => {
      expect(actor.getSnapshot().matches("closed")).toBe(true)

      actor.send({ type: "CLOSE_MODAL" })

      expect(actor.getSnapshot().matches("closed")).toBe(true)
      expect(actor.getSnapshot().context.modalType).toBe("none")
    })

    it("should handle SUBMIT_MODAL when already closed", () => {
      expect(actor.getSnapshot().matches("closed")).toBe(true)

      // This event is only handled in opened state, so it should be ignored
      actor.send({ type: "SUBMIT_MODAL" })

      expect(actor.getSnapshot().matches("closed")).toBe(true)
    })

    it("should handle rapid OPEN_MODAL events", () => {
      actor.send({ type: "OPEN_MODAL", modalType: "user-settings" })
      actor.send({ type: "OPEN_MODAL", modalType: "project-settings" })
      actor.send({ type: "OPEN_MODAL", modalType: "export" })

      const snapshot = actor.getSnapshot()
      expect(snapshot.context.modalType).toBe("export")
      expect(snapshot.matches("opened")).toBe(true)
    })

    it("should handle opening same modal type twice", () => {
      actor.send({ type: "OPEN_MODAL", modalType: "export" })
      actor.send({ type: "OPEN_MODAL", modalType: "export" })

      const snapshot = actor.getSnapshot()
      expect(snapshot.context.modalType).toBe("export")
      expect(snapshot.matches("opened")).toBe(true)
    })

    it("should overwrite modal data when opening same modal", () => {
      actor.send({ type: "OPEN_MODAL", modalType: "export", modalData: { format: "mp4" } })

      expect(actor.getSnapshot().context.modalData).toEqual({ format: "mp4" })

      actor.send({ type: "OPEN_MODAL", modalType: "export", modalData: { format: "avi" } })

      const snapshot = actor.getSnapshot()
      expect(snapshot.context.modalData).toEqual({ format: "avi" })
    })
  })

  describe("State Persistence", () => {
    it("should maintain state across multiple transitions", () => {
      actor.send({ type: "OPEN_MODAL", modalType: "user-settings" })
      expect(actor.getSnapshot().matches("opened")).toBe(true)

      actor.send({ type: "CLOSE_MODAL" })
      expect(actor.getSnapshot().matches("closed")).toBe(true)

      actor.send({ type: "OPEN_MODAL", modalType: "project-settings" })
      expect(actor.getSnapshot().matches("opened")).toBe(true)

      actor.send({ type: "SUBMIT_MODAL" })
      expect(actor.getSnapshot().matches("closed")).toBe(true)
    })
  })

  describe("Context Updates", () => {
    it("should update context correctly on each transition", () => {
      // Initial state
      let snapshot = actor.getSnapshot()
      expect(snapshot.context.modalType).toBe("none")
      expect(snapshot.context.modalData).toBeNull()

      // Open modal
      actor.send({ type: "OPEN_MODAL", modalType: "export", modalData: { key: "value" } })
      snapshot = actor.getSnapshot()
      expect(snapshot.context.modalType).toBe("export")
      expect(snapshot.context.modalData).toEqual({ key: "value" })

      // Close modal
      actor.send({ type: "CLOSE_MODAL" })
      snapshot = actor.getSnapshot()
      expect(snapshot.context.modalType).toBe("none")
      expect(snapshot.context.modalData).toBeNull()
    })
  })
})

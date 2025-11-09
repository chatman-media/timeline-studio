/**
 * Media Import Machine Tests
 *
 * Тесты для media import state machine
 */

import { invoke } from "@tauri-apps/api/core"
import { createActor, waitFor } from "xstate"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { mockCompletedOperation, mockImportOperation } from "../../__mocks__"
import { mediaImportMachine } from "../media-import-machine"
import type { MediaImportOptions } from "../../types"

vi.mock("@tauri-apps/api/core")
vi.mock("@/lib/tauri-logger", () => ({
  createLogger: vi.fn(() => ({
    trace: vi.fn(),
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  })),
}))

describe("MediaImportMachine", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("initial state", () => {
    it("should start in idle state with empty context", () => {
      const actor = createActor(mediaImportMachine)
      actor.start()

      const snapshot = actor.getSnapshot()

      expect(snapshot.value).toBe("idle")
      expect(snapshot.context.files).toEqual([])
      expect(snapshot.context.operations).toEqual([])
      expect(snapshot.context.totalProgress).toBe(0)
      expect(snapshot.context.errors).toEqual([])

      actor.stop()
    })

    it("should have default options", () => {
      const actor = createActor(mediaImportMachine)
      actor.start()

      const snapshot = actor.getSnapshot()

      expect(snapshot.context.options).toEqual({
        copyToProject: true,
        createProxies: false,
        analyzeContent: true,
        generateThumbnails: true,
        preserveMetadata: true,
      })

      actor.stop()
    })
  })

  describe("ADD_FILES event", () => {
    it("should add files to context", () => {
      const actor = createActor(mediaImportMachine)
      const snapshot = actor.start()

      actor.send({
        type: "ADD_FILES",
        files: ["/test/video1.mp4", "/test/video2.mp4"],
      })

      const updatedSnapshot = actor.getSnapshot()

      expect(updatedSnapshot.context.files).toEqual(["/test/video1.mp4", "/test/video2.mp4"])

      actor.stop()
    })

    it("should remove duplicate files", () => {
      const actor = createActor(mediaImportMachine)
      actor.start()

      actor.send({
        type: "ADD_FILES",
        files: ["/test/video1.mp4", "/test/video2.mp4"],
      })

      actor.send({
        type: "ADD_FILES",
        files: ["/test/video2.mp4", "/test/video3.mp4"],
      })

      const snapshot = actor.getSnapshot()

      expect(snapshot.context.files).toEqual([
        "/test/video1.mp4",
        "/test/video2.mp4",
        "/test/video3.mp4",
      ])

      actor.stop()
    })

    it("should keep existing files when adding new ones", () => {
      const actor = createActor(mediaImportMachine)
      actor.start()

      actor.send({
        type: "ADD_FILES",
        files: ["/test/video1.mp4"],
      })

      actor.send({
        type: "ADD_FILES",
        files: ["/test/video2.mp4"],
      })

      const snapshot = actor.getSnapshot()

      expect(snapshot.context.files).toHaveLength(2)

      actor.stop()
    })
  })

  describe("REMOVE_FILE event", () => {
    it("should remove file from context", () => {
      const actor = createActor(mediaImportMachine)
      actor.start()

      actor.send({
        type: "ADD_FILES",
        files: ["/test/video1.mp4", "/test/video2.mp4", "/test/video3.mp4"],
      })

      actor.send({
        type: "REMOVE_FILE",
        file: "/test/video2.mp4",
      })

      const snapshot = actor.getSnapshot()

      expect(snapshot.context.files).toEqual(["/test/video1.mp4", "/test/video3.mp4"])

      actor.stop()
    })

    it("should not change context if file not found", () => {
      const actor = createActor(mediaImportMachine)
      actor.start()

      actor.send({
        type: "ADD_FILES",
        files: ["/test/video1.mp4"],
      })

      actor.send({
        type: "REMOVE_FILE",
        file: "/test/nonexistent.mp4",
      })

      const snapshot = actor.getSnapshot()

      expect(snapshot.context.files).toEqual(["/test/video1.mp4"])

      actor.stop()
    })
  })

  describe("UPDATE_OPTIONS event", () => {
    it("should update import options", () => {
      const actor = createActor(mediaImportMachine)
      actor.start()

      actor.send({
        type: "UPDATE_OPTIONS",
        options: {
          copyToProject: false,
          createProxies: true,
        },
      })

      const snapshot = actor.getSnapshot()

      expect(snapshot.context.options.copyToProject).toBe(false)
      expect(snapshot.context.options.createProxies).toBe(true)
      expect(snapshot.context.options.analyzeContent).toBe(true) // unchanged

      actor.stop()
    })

    it("should merge options with existing ones", () => {
      const actor = createActor(mediaImportMachine)
      actor.start()

      const originalOptions = actor.getSnapshot().context.options

      actor.send({
        type: "UPDATE_OPTIONS",
        options: {
          generateThumbnails: false,
        },
      })

      const snapshot = actor.getSnapshot()

      expect(snapshot.context.options).toEqual({
        ...originalOptions,
        generateThumbnails: false,
      })

      actor.stop()
    })
  })

  describe("START_IMPORT event", () => {
    it("should not transition to importing if no files", () => {
      const actor = createActor(mediaImportMachine)
      actor.start()

      actor.send({ type: "START_IMPORT" })

      const snapshot = actor.getSnapshot()

      expect(snapshot.value).toBe("idle")

      actor.stop()
    })

    it("should transition to importing state with files", async () => {
      const mockInvoke = vi.mocked(invoke)
      mockInvoke.mockResolvedValue([{ path: "/project/video1.mp4" }])

      const actor = createActor(mediaImportMachine)
      actor.start()

      actor.send({
        type: "ADD_FILES",
        files: ["/test/video1.mp4"],
      })

      actor.send({ type: "START_IMPORT" })

      await waitFor(actor, (state) => state.value === "importing")

      const snapshot = actor.getSnapshot()

      expect(snapshot.value).toBe("importing")
      expect(snapshot.context.operations.length).toBeGreaterThan(0)

      actor.stop()
    })

    it("should create operations for each file", async () => {
      const mockInvoke = vi.mocked(invoke)
      mockInvoke.mockResolvedValue([])

      const actor = createActor(mediaImportMachine)
      actor.start()

      actor.send({
        type: "ADD_FILES",
        files: ["/test/video1.mp4", "/test/video2.mp4", "/test/video3.mp4"],
      })

      actor.send({ type: "START_IMPORT" })

      await waitFor(actor, (state) => state.value === "importing")

      const snapshot = actor.getSnapshot()

      expect(snapshot.context.operations).toHaveLength(3)
      expect(snapshot.context.operations[0].type).toBe("import")
      expect(snapshot.context.operations[0].status).toBe("pending")

      actor.stop()
    })
  })

  describe("importing state", () => {
    it("should transition to completed on successful import", async () => {
      const mockInvoke = vi.mocked(invoke)
      mockInvoke.mockResolvedValue([
        { path: "/project/video1.mp4", thumbnail: "/project/cache/video1-thumb.jpg" },
      ])

      const actor = createActor(mediaImportMachine)
      actor.start()

      actor.send({
        type: "ADD_FILES",
        files: ["/test/video1.mp4"],
      })

      actor.send({ type: "START_IMPORT" })

      await waitFor(actor, (state) => state.value === "completed")

      const snapshot = actor.getSnapshot()

      expect(snapshot.value).toBe("completed")
      expect(snapshot.context.totalProgress).toBe(100)
      expect(snapshot.context.operations[0].status).toBe("completed")

      actor.stop()
    })

    it("should transition to failed on import error", async () => {
      const mockInvoke = vi.mocked(invoke)
      mockInvoke.mockRejectedValue(new Error("Import failed"))

      const actor = createActor(mediaImportMachine)
      actor.start()

      actor.send({
        type: "ADD_FILES",
        files: ["/test/video1.mp4"],
      })

      actor.send({ type: "START_IMPORT" })

      await waitFor(actor, (state) => state.value === "failed")

      const snapshot = actor.getSnapshot()

      expect(snapshot.value).toBe("failed")
      expect(snapshot.context.errors.length).toBeGreaterThan(0)

      actor.stop()
    })

    it("should handle CANCEL_IMPORT event", async () => {
      const mockInvoke = vi.mocked(invoke)
      // Mock a long-running import
      mockInvoke.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve([]), 1000)),
      )

      const actor = createActor(mediaImportMachine)
      actor.start()

      actor.send({
        type: "ADD_FILES",
        files: ["/test/video1.mp4"],
      })

      actor.send({ type: "START_IMPORT" })

      await waitFor(actor, (state) => state.value === "importing")

      actor.send({ type: "CANCEL_IMPORT" })

      await waitFor(actor, (state) => state.value === "cancelled")

      const snapshot = actor.getSnapshot()

      expect(snapshot.value).toBe("cancelled")

      actor.stop()
    })
  })

  describe("IMPORT_PROGRESS event", () => {
    it("should update operation progress", async () => {
      const mockInvoke = vi.mocked(invoke)
      mockInvoke.mockImplementation(() => new Promise(() => {})) // Never resolves

      const actor = createActor(mediaImportMachine)
      actor.start()

      actor.send({
        type: "ADD_FILES",
        files: ["/test/video1.mp4"],
      })

      actor.send({ type: "START_IMPORT" })

      await waitFor(actor, (state) => state.value === "importing")

      const operationId = actor.getSnapshot().context.operations[0].id

      actor.send({
        type: "IMPORT_PROGRESS",
        operationId,
        progress: 50,
      })

      const snapshot = actor.getSnapshot()

      expect(snapshot.context.operations[0].progress).toBe(50)
      expect(snapshot.context.operations[0].status).toBe("processing")
      expect(snapshot.context.totalProgress).toBe(50)

      actor.stop()
    })

    it("should calculate total progress correctly", async () => {
      const mockInvoke = vi.mocked(invoke)
      mockInvoke.mockImplementation(() => new Promise(() => {}))

      const actor = createActor(mediaImportMachine)
      actor.start()

      actor.send({
        type: "ADD_FILES",
        files: ["/test/video1.mp4", "/test/video2.mp4"],
      })

      actor.send({ type: "START_IMPORT" })

      await waitFor(actor, (state) => state.value === "importing")

      const operations = actor.getSnapshot().context.operations

      actor.send({
        type: "IMPORT_PROGRESS",
        operationId: operations[0].id,
        progress: 100,
      })

      actor.send({
        type: "IMPORT_PROGRESS",
        operationId: operations[1].id,
        progress: 50,
      })

      const snapshot = actor.getSnapshot()

      expect(snapshot.context.totalProgress).toBe(75) // (100 + 50) / 2

      actor.stop()
    })
  })

  describe("RESET event", () => {
    it("should reset to idle from completed", async () => {
      const mockInvoke = vi.mocked(invoke)
      mockInvoke.mockResolvedValue([])

      const actor = createActor(mediaImportMachine)
      actor.start()

      actor.send({
        type: "ADD_FILES",
        files: ["/test/video1.mp4"],
      })

      actor.send({ type: "START_IMPORT" })

      await waitFor(actor, (state) => state.value === "completed")

      actor.send({ type: "RESET" })

      const snapshot = actor.getSnapshot()

      expect(snapshot.value).toBe("idle")
      expect(snapshot.context.files).toEqual([])
      expect(snapshot.context.operations).toEqual([])
      expect(snapshot.context.totalProgress).toBe(0)
      expect(snapshot.context.errors).toEqual([])

      actor.stop()
    })

    it("should reset to idle from failed", async () => {
      const mockInvoke = vi.mocked(invoke)
      mockInvoke.mockRejectedValue(new Error("Import failed"))

      const actor = createActor(mediaImportMachine)
      actor.start()

      actor.send({
        type: "ADD_FILES",
        files: ["/test/video1.mp4"],
      })

      actor.send({ type: "START_IMPORT" })

      await waitFor(actor, (state) => state.value === "failed")

      actor.send({ type: "RESET" })

      const snapshot = actor.getSnapshot()

      expect(snapshot.value).toBe("idle")
      expect(snapshot.context.errors).toEqual([])

      actor.stop()
    })
  })

  describe("retry from failed state", () => {
    it("should allow retry after failure", async () => {
      const mockInvoke = vi.mocked(invoke)

      // First call fails
      mockInvoke.mockRejectedValueOnce(new Error("Network error"))

      const actor = createActor(mediaImportMachine)
      actor.start()

      actor.send({
        type: "ADD_FILES",
        files: ["/test/video1.mp4"],
      })

      actor.send({ type: "START_IMPORT" })

      await waitFor(actor, (state) => state.value === "failed")

      // Second call succeeds
      mockInvoke.mockResolvedValueOnce([{ path: "/project/video1.mp4" }])

      actor.send({ type: "START_IMPORT" })

      await waitFor(actor, (state) => state.value === "completed")

      const snapshot = actor.getSnapshot()

      expect(snapshot.value).toBe("completed")

      actor.stop()
    })
  })

  describe("edge cases", () => {
    it("should handle empty file list", () => {
      const actor = createActor(mediaImportMachine)
      actor.start()

      actor.send({
        type: "ADD_FILES",
        files: [],
      })

      const snapshot = actor.getSnapshot()

      expect(snapshot.context.files).toEqual([])

      actor.stop()
    })

    it("should handle very long file paths", () => {
      const actor = createActor(mediaImportMachine)
      actor.start()

      const longPath = "/very/long/path/".repeat(50) + "video.mp4"

      actor.send({
        type: "ADD_FILES",
        files: [longPath],
      })

      const snapshot = actor.getSnapshot()

      expect(snapshot.context.files).toEqual([longPath])

      actor.stop()
    })

    it("should handle special characters in file paths", () => {
      const actor = createActor(mediaImportMachine)
      actor.start()

      const specialPath = "/test/файл с пробелами & спецсимволами (1).mp4"

      actor.send({
        type: "ADD_FILES",
        files: [specialPath],
      })

      const snapshot = actor.getSnapshot()

      expect(snapshot.context.files).toEqual([specialPath])

      actor.stop()
    })
  })
})

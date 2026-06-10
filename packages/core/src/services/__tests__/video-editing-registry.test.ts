import { afterEach, describe, expect, it, vi } from "vitest"
import {
  clearVideoEditingBindings,
  getVideoEditingBindings,
  setVideoEditingBindings,
  type VideoEditingBindings,
} from "../video-editing-registry"

function createBindings(): VideoEditingBindings {
  return {
    getVideoEditingOrchestrator: vi.fn(() => ({ id: "orchestrator" })),
    UndoRedoHelpers: {
      createAddClipAction: vi.fn(),
      createBatchOperationAction: vi.fn(),
      createMoveClipAction: vi.fn(),
      createRemoveClipAction: vi.fn(),
    },
    useUndoRedo: vi.fn(() => ({ canUndo: false, canRedo: false })),
  }
}

describe("video-editing-registry", () => {
  afterEach(() => {
    clearVideoEditingBindings()
  })

  it("throws before video editing bindings are registered", () => {
    clearVideoEditingBindings()

    expect(() => getVideoEditingBindings().getVideoEditingOrchestrator()).toThrow(
      'Video editing binding "getVideoEditingOrchestrator" is not registered',
    )
  })

  it("stores registered video editing bindings", () => {
    const bindings = createBindings()
    setVideoEditingBindings(bindings)

    expect(getVideoEditingBindings().getVideoEditingOrchestrator()).toEqual({ id: "orchestrator" })
  })
})

import { beforeEach, describe, expect, it, vi } from "vitest"

import type { ProjectSchema } from "@/core/types/video-editing"

import { addEffectToClip, addFilterToClip, removeEffectFromClip, removeFilterFromClip } from "../user-effects"

const mockInvoke = vi.hoisted(() => vi.fn())

vi.mock("@tauri-apps/api/core", () => ({
  invoke: mockInvoke,
}))

vi.mock("@/lib/tauri-logger", () => ({
  createLogger: () => ({
    info: vi.fn(),
    error: vi.fn(),
  }),
}))

describe("core user effects service", () => {
  const projectSchema = {
    version: "1.0.0",
    metadata: {},
    timeline: {},
    tracks: [],
    effects: [],
    transitions: [],
    filters: [],
    templates: [],
    style_templates: [],
    subtitles: [],
    settings: {},
  } as ProjectSchema

  beforeEach(() => {
    mockInvoke.mockReset()
    mockInvoke.mockResolvedValue(projectSchema)
  })

  it("adds effects to clips through Tauri", async () => {
    await expect(addEffectToClip(projectSchema, "clip-1", "effect-1")).resolves.toBe(projectSchema)

    expect(mockInvoke).toHaveBeenCalledWith("add_effect_to_clip", {
      clipId: "clip-1",
      effectId: "effect-1",
      projectSchema,
    })
  })

  it("adds filters to clips through Tauri", async () => {
    await expect(addFilterToClip(projectSchema, "clip-1", "filter-1")).resolves.toBe(projectSchema)

    expect(mockInvoke).toHaveBeenCalledWith("add_filter_to_clip", {
      clipId: "clip-1",
      filterId: "filter-1",
      projectSchema,
    })
  })

  it("removes effects from clips through Tauri", async () => {
    await expect(removeEffectFromClip(projectSchema, "clip-1", "effect-1")).resolves.toBe(projectSchema)

    expect(mockInvoke).toHaveBeenCalledWith("remove_effect_from_clip", {
      clipId: "clip-1",
      effectId: "effect-1",
      projectSchema,
    })
  })

  it("removes filters from clips through Tauri", async () => {
    await expect(removeFilterFromClip(projectSchema, "clip-1", "filter-1")).resolves.toBe(projectSchema)

    expect(mockInvoke).toHaveBeenCalledWith("remove_filter_from_clip", {
      clipId: "clip-1",
      filterId: "filter-1",
      projectSchema,
    })
  })
})

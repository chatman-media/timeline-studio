import { beforeEach, describe, expect, it, vi } from "vitest"

import { analyzeScenesByPath } from "../content-intelligence"

const mockInvoke = vi.hoisted(() => vi.fn())

vi.mock("@tauri-apps/api/core", () => ({
  invoke: mockInvoke,
}))

vi.mock("@/lib/tauri-logger", () => ({
  createLogger: () => ({
    info: vi.fn(),
  }),
}))

describe("core content intelligence service", () => {
  beforeEach(() => {
    mockInvoke.mockReset()
    mockInvoke.mockResolvedValue([])
  })

  it("analyzes scenes by path through Tauri", async () => {
    await expect(analyzeScenesByPath("/media/video.mp4")).resolves.toEqual([])

    expect(mockInvoke).toHaveBeenCalledWith("analyze_scenes_by_path_command", {
      filePath: "/media/video.mp4",
    })
  })
})

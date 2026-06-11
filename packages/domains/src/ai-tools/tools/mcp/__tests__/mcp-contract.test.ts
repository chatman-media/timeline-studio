import { describe, expect, it } from "vitest"

import {
  MCPAddClipTool,
  MCPAddTransitionTool,
  MCPApplyColorGradingTool,
  MCPApplyFilterTool,
  MCPAddTextOverlayTool,
  MCPCreatePreviewTool,
  MCPExportVideoTool,
  MCPListMediaFilesTool,
  MCPMoveClipTool,
  MCPSplitClipTool,
} from "../index"

describe("MCP tool contracts", () => {
  it("keeps mcp-add-clip aligned with the Rust timeline command contract", () => {
    const schema = new MCPAddClipTool().getSchema().input

    expect(schema.required).toEqual(["track_id", "media_id", "time"])
    expect(schema.properties).toHaveProperty("track_id")
    expect(schema.properties).toHaveProperty("media_id")
    expect(schema.properties).toHaveProperty("time")
    expect(schema.properties).not.toHaveProperty("video_path")
    expect(schema.properties).not.toHaveProperty("start_time")
    expect(schema.properties).not.toHaveProperty("track_index")
  })

  it("documents canonical schemas for key timeline MCP edit tools", () => {
    expect(new MCPMoveClipTool().getSchema().input.required).toEqual(["clip_id", "new_track_id", "new_time"])
    expect(new MCPSplitClipTool().getSchema().input.required).toEqual(["clip_id", "time"])
    expect(new MCPListMediaFilesTool().getSchema().input.properties.filter_type.enum).toEqual([
      "all",
      "video",
      "audio",
      "image",
    ])
  })

  it("keeps planned MCP tools visible but not production-ready", () => {
    const plannedTools = [
      new MCPApplyFilterTool(),
      new MCPAddTransitionTool(),
      new MCPApplyColorGradingTool(),
      new MCPAddTextOverlayTool(),
      new MCPExportVideoTool(),
      new MCPCreatePreviewTool(),
    ]

    expect(plannedTools.map((tool) => tool.metadata.name)).toEqual([
      "mcp-apply-filter",
      "mcp-add-transition",
      "mcp-apply-color-grading",
      "mcp-add-text-overlay",
      "mcp-export-video",
      "mcp-create-preview",
    ])
  })
})

/**
 * @vitest-environment jsdom
 */

import { renderHook } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { useTimelineAI, useTimelineAIQuick } from "../use-timeline-ai"

describe("useTimelineAI", () => {
  it("returns an explicit unsupported result for legacy timeline creation", async () => {
    const { result } = renderHook(() => useTimelineAI())

    const response = await result.current.createTimelineFromPrompt("Create a timeline")

    expect(response).toMatchObject({
      executionTime: 0,
      operation: "create-timeline",
      success: false,
    })
    expect(response.message).toContain("Legacy TimelineAIService is disabled")
    expect(result.current.timelineAI.createTimelineFromPrompt).toBe(result.current.createTimelineFromPrompt)
  })

  it("keeps quick command helpers available through the compatibility hook", async () => {
    const { result } = renderHook(() => useTimelineAIQuick())

    const response = await result.current.syncVideoWithMusic()

    expect(response).toMatchObject({
      executionTime: 0,
      operation: "execute-command",
      success: false,
    })
    expect(response.warnings).toContain("useTimelineAI is kept for compatibility only")
  })
})

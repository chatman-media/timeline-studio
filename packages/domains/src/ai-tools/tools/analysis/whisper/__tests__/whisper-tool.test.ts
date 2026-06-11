import { describe, expect, it } from "vitest"

import { SpeechAnalysisTool, WhisperTranscriptionTool } from "../index"

const executionOptions = {
  retries: 1,
  retryDelay: 0,
  enableLogging: false,
}

describe("Whisper tools", () => {
  it("fails without audioPath instead of returning demo transcription text", async () => {
    const tool = new WhisperTranscriptionTool()

    const result = await tool.execute(
      {
        operation: "transcribe",
        language: "en",
      },
      executionOptions,
    )

    expect(result.success).toBe(false)
    expect(result.errors?.join(" ")).toContain("demo transcription output is disabled")
    expect(result.data).toBeUndefined()
  })

  it("fails without audioPath instead of returning demo speech analysis", async () => {
    const tool = new SpeechAnalysisTool()

    const result = await tool.execute(
      {
        operation: "analyze_speech",
        language: "en",
      },
      executionOptions,
    )

    expect(result.success).toBe(false)
    expect(result.errors?.join(" ")).toContain("demo speech analysis output is disabled")
    expect(result.data).toBeUndefined()
  })
})

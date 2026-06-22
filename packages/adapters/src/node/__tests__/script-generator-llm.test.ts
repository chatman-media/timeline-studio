import { describe, expect, it } from "vitest"
import { NodeLlmScriptPlanner, type NodeLlmScriptPlannerFetch } from "../script-generator-llm"

const VALID_DRAFT = {
  title: "Product Promo",
  hook: "Save hours every day.",
  scenes: [
    { index: 0, shot: "product on desk", voiceover: "Meet our product." },
    { index: 1, shot: "happy user smiling", voiceover: "You will love how fast it is." },
  ],
  summary: "Short product promo.",
  totalDurationSeconds: 20,
}

function createFetch(body: unknown, status = 200): NodeLlmScriptPlannerFetch {
  return async () =>
    ({
      ok: status >= 200 && status < 300,
      status,
      statusText: status === 200 ? "OK" : "Error",
      json: async () => body,
      text: async () => JSON.stringify(body),
    }) as Response
}

describe("NodeLlmScriptPlanner", () => {
  it("calls OpenAI-compatible endpoint and returns a valid ScriptPlannerResult", async () => {
    const planner = new NodeLlmScriptPlanner({
      apiKey: "test-key",
      fetch: createFetch({
        choices: [{ message: { content: JSON.stringify(VALID_DRAFT) }, finish_reason: "stop" }],
        usage: { total_tokens: 120 },
      }),
    })

    const result = await planner.generateScriptPlan({
      idea: "Show how our product saves time.",
      targetDurationSeconds: 20,
    })

    expect(result.provider).toBe("llm-script")
    expect(result.script.scenes).toHaveLength(2)
    expect(result.script.hook).toBe("Save hours every day.")
    expect(result.script.title).toBe("Product Promo")
    expect(result.metadata?.model).toBeDefined()
  })

  it("extracts JSON from fenced markdown response", async () => {
    const fenced = `Here is your storyboard:\n\`\`\`json\n${JSON.stringify(VALID_DRAFT)}\n\`\`\``
    const planner = new NodeLlmScriptPlanner({
      apiKey: "test-key",
      fetch: createFetch({ choices: [{ message: { content: fenced }, finish_reason: "stop" }] }),
    })

    const result = await planner.generateScriptPlan({ idea: "some idea" })

    expect(result.script.scenes.length).toBeGreaterThan(0)
  })

  it("throws when provider returns HTTP error", async () => {
    const planner = new NodeLlmScriptPlanner({
      apiKey: "test-key",
      fetch: createFetch({ error: "unauthorized" }, 401),
    })

    await expect(planner.generateScriptPlan({ idea: "some idea" })).rejects.toThrow("HTTP 401")
  })

  it("throws when provider returns empty content", async () => {
    const planner = new NodeLlmScriptPlanner({
      apiKey: "test-key",
      fetch: createFetch({ choices: [{ message: { content: "" }, finish_reason: "stop" }] }),
    })

    await expect(planner.generateScriptPlan({ idea: "some idea" })).rejects.toThrow("empty response")
  })

  it("throws when JSON draft fails validation (empty scenes)", async () => {
    const invalid = { ...VALID_DRAFT, scenes: [] }
    const planner = new NodeLlmScriptPlanner({
      apiKey: "test-key",
      fetch: createFetch({ choices: [{ message: { content: JSON.stringify(invalid) } }] }),
    })

    await expect(planner.generateScriptPlan({ idea: "some idea" })).rejects.toThrow("ScriptDraft")
  })

  it("throws when API key is missing", async () => {
    const planner = new NodeLlmScriptPlanner({
      fetch: createFetch({}),
    })

    await expect(planner.generateScriptPlan({ idea: "some idea" })).rejects.toThrow("API key")
  })

  it("passes targetPlatform, sceneCount, and language in the user prompt (smoke)", async () => {
    let capturedBody: unknown
    const fetchSpy: NodeLlmScriptPlannerFetch = async (_url, init) => {
      capturedBody = JSON.parse(init?.body as string)
      return {
        ok: true,
        status: 200,
        json: async () => ({ choices: [{ message: { content: JSON.stringify(VALID_DRAFT) }, finish_reason: "stop" }] }),
        text: async () => "",
      } as Response
    }

    const planner = new NodeLlmScriptPlanner({ apiKey: "test-key", fetch: fetchSpy })
    await planner.generateScriptPlan({
      idea: "product demo",
      targetPlatform: "tiktok",
      sceneCount: 4,
      language: "ru",
    })

    const messages = (capturedBody as { messages: Array<{ role: string; content: string }> }).messages
    const userMessage = messages.find((m) => m.role === "user")?.content ?? ""
    expect(userMessage).toContain("tiktok")
    expect(userMessage).toContain("ru")
    expect(userMessage).toContain("4")
  })
})

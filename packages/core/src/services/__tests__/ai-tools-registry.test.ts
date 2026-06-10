import { afterEach, describe, expect, it } from "vitest"
import type { IAITool } from "@timeline-studio/core/types/ai-tools"
import { clearAITools, getAITools, setAITools } from "../ai-tools-registry"

const createTool = (name: string): IAITool => ({
  metadata: {
    category: "timeline",
    description: `${name} description`,
    domain: "core",
    name,
    version: "1.0.0",
  },
  execute: async () => ({
    executionId: `${name}-execution`,
    executionTime: 0,
    success: true,
    toolName: name,
  }),
  getMetadata() {
    return this.metadata
  },
  getSchema: () => ({ input: {}, output: {} }),
  getToolName: () => name,
  validate: () => true,
})

describe("ai-tools-registry", () => {
  afterEach(() => {
    clearAITools()
  })

  it("stores and returns registered AI tools", () => {
    const tools = [createTool("first-tool"), createTool("second-tool")]

    setAITools(tools)

    expect(getAITools().map((tool) => tool.metadata.name)).toEqual(["first-tool", "second-tool"])
  })

  it("returns a copy so consumers cannot mutate the registry array", () => {
    setAITools([createTool("safe-tool")])

    const tools = getAITools()
    tools.pop()

    expect(getAITools()).toHaveLength(1)
  })
})

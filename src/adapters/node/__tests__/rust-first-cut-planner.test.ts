import fs from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { createBotProjectSchemaFromRenderJob } from "@/core"
import { FIRST_CUT_PLANNER_VALID_FIXTURES } from "@/core/services/__tests__/fixtures/first-cut-planner-fixtures"
import { NodeRustFirstCutPlanner } from "../rust-first-cut-planner"

describe("NodeRustFirstCutPlanner", () => {
  let tempDir: string

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "rust-first-cut-planner-"))
  })

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true })
  })

  it("runs timeline montage-plan and reads ProjectSchema output", async () => {
    const project = createProject()
    const runCommand = vi.fn(async (_command: string, args: string[]) => {
      const outputPath = args[args.indexOf("--output") + 1]
      if (!outputPath) throw new Error("Expected output path")
      await fs.writeFile(outputPath, JSON.stringify(project))
      return { stdout: "", stderr: "ok montage-plan" }
    })
    const planner = new NodeRustFirstCutPlanner({
      command: "timeline",
      tempDir,
      idFactory: () => "plan-1",
      runCommand,
    })

    const result = await planner.generatePlan({
      sourceMedia: [
        { type: "file", value: "/tmp/a.mp4" },
        { type: "file", value: "/tmp/b.mp4" },
      ],
      targetPlatform: "tiktok",
      targetDurationSeconds: 15,
      style: "music-video",
      sceneSampleCount: 4,
    })

    expect(runCommand).toHaveBeenCalledWith(
      "timeline",
      [
        "montage-plan",
        "/tmp/a.mp4",
        "/tmp/b.mp4",
        "--platform",
        "tiktok",
        "--duration",
        "15",
        "--style",
        "music-video",
        "--scenes",
        "4",
        "--output",
        path.join(tempDir, "plan-1.project.json"),
        "--schema-only",
      ],
      expect.any(Object),
    )
    expect(result).toMatchObject({
      provider: "montage-plan",
      projectSchema: project,
      diagnostics: ["ok montage-plan"],
    })
  })

  it("runs timeline llm-plan when API key and goal are available", async () => {
    const project = createProject()
    const runCommand = vi.fn(async (_command: string, args: string[]) => {
      const outputPath = args[args.indexOf("--output") + 1]
      if (!outputPath) throw new Error("Expected output path")
      await fs.writeFile(outputPath, JSON.stringify(project))
      return { stdout: "", stderr: "" }
    })
    const planner = new NodeRustFirstCutPlanner({
      command: "timeline",
      tempDir,
      idFactory: () => "plan-2",
      apiKey: "sk-secret",
      apiUrl: "https://llm.example.com/v1",
      model: "model-1",
      runCommand,
    })

    const result = await planner.generatePlan({
      sourceMedia: [{ type: "file", value: "/tmp/a.mp4" }],
      goal: "make a product launch short",
      publishDestination: "youtube",
    })

    const args = runCommand.mock.calls[0]?.[1] ?? []
    expect(args).toEqual([
      "llm-plan",
      "--goal",
      "make a product launch short",
      "--platform",
      "youtube",
      "--api-key",
      "sk-secret",
      "--output",
      path.join(tempDir, "plan-2.project.json"),
      "--input",
      "/tmp/a.mp4",
      "--api-url",
      "https://llm.example.com/v1",
      "--model",
      "model-1",
    ])
    expect(result.provider).toBe("llm-plan")
    const metadataArgs = result.metadata?.args as string[]
    expect(metadataArgs).toContain("[redacted]")
    expect(metadataArgs).not.toContain("sk-secret")
  })

  it.each(FIRST_CUT_PLANNER_VALID_FIXTURES)("reads valid ProjectSchema fixture output for $id", async (fixture) => {
    const runCommand = vi.fn(async (_command: string, args: string[]) => {
      const outputPath = args[args.indexOf("--output") + 1]
      if (!outputPath) throw new Error("Expected output path")
      await fs.writeFile(outputPath, JSON.stringify(fixture.projectSchema))
      return { stdout: "", stderr: fixture.diagnostics?.join("\n") ?? "" }
    })
    const planner = new NodeRustFirstCutPlanner({
      command: "timeline",
      tempDir,
      idFactory: () => fixture.id,
      plannerKind: fixture.provider,
      apiKey: fixture.provider === "llm-plan" ? "sk-secret" : undefined,
      runCommand,
    })

    const result = await planner.generatePlan({
      sourceMedia: [{ type: "file", value: "/tmp/input.mp4" }],
      goal: "make a fixture promo",
      publishDestination: "telegram",
    })

    expect(result).toMatchObject({
      provider: fixture.provider,
      projectSchema: fixture.projectSchema,
      diagnostics: fixture.diagnostics ?? [],
      metadata: {
        outputPath: path.join(tempDir, `${fixture.id}.project.json`),
      },
    })
  })
})

function createProject() {
  const project = createBotProjectSchemaFromRenderJob({
    source: "bot",
    media: [{ type: "file", value: "/tmp/input.mp4", name: "input.mp4" }],
    output: { format: "mp4", destination: "telegram" },
  })
  if (!project) throw new Error("Expected project")
  return project
}

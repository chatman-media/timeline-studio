import type { ProjectSchema } from "@/types/contracts/project-schema"

import type { BotFirstCutProvider } from "../../../ports"
import { createBotProjectSchemaFromRenderJob } from "../../bot-project-assembler"

export interface FirstCutPlannerValidFixture {
  id: string
  provider: Exclude<BotFirstCutProvider, "deterministic-fallback">
  projectSchema: ProjectSchema
  diagnostics?: string[]
}

export interface FirstCutPlannerInvalidFixture {
  id: string
  provider: Exclude<BotFirstCutProvider, "deterministic-fallback">
  projectSchema: unknown
  expectedDiagnostic: string
}

const montageProject = createFixtureProject("montage-plan-valid", "telegram")
montageProject.metadata.description = "Valid montage-plan first cut fixture."
montageProject.settings.custom = {
  ...montageProject.settings.custom,
  plannerFixture: {
    id: "montage-plan-valid",
    provider: "montage-plan",
  },
}

const llmProject = createFixtureProject("llm-plan-valid", "youtube")
llmProject.metadata.description = "Valid llm-plan first cut fixture."
llmProject.settings.custom = {
  ...llmProject.settings.custom,
  plannerFixture: {
    id: "llm-plan-valid",
    provider: "llm-plan",
    goal: "make a product launch short",
  },
}

export const FIRST_CUT_PLANNER_VALID_FIXTURES: readonly FirstCutPlannerValidFixture[] = [
  {
    id: "montage-plan-valid",
    provider: "montage-plan",
    projectSchema: montageProject,
    diagnostics: ["montage-plan fixture"],
  },
  {
    id: "llm-plan-valid",
    provider: "llm-plan",
    projectSchema: llmProject,
    diagnostics: ["llm-plan fixture"],
  },
]

export const FIRST_CUT_PLANNER_INVALID_FIXTURES: readonly FirstCutPlannerInvalidFixture[] = [
  {
    id: "legacy-simplified-output",
    provider: "llm-plan",
    projectSchema: {
      id: "legacy-plan",
      name: "Legacy plan",
      timeline: {
        tracks: [],
      },
      tracks: [],
      settings: {},
      meta: {},
    },
    expectedDiagnostic: "version must be a non-empty string",
  },
  {
    id: "missing-required-arrays",
    provider: "montage-plan",
    projectSchema: {
      version: "1.0.0",
      metadata: {
        name: "Broken planner output",
      },
      timeline: {
        duration: 12,
        fps: 30,
        resolution: [1920, 1080],
      },
      tracks: [],
      settings: {},
    },
    expectedDiagnostic: "effects must be an array",
  },
]

function createFixtureProject(name: string, destination: "telegram" | "youtube"): ProjectSchema {
  const project = createBotProjectSchemaFromRenderJob({
    source: "bot",
    media: [{ type: "file", value: `/tmp/${name}.mp4`, name: `${name}.mp4` }],
    output: { format: "mp4", destination },
  })
  if (!project) throw new Error(`Expected ProjectSchema fixture for ${name}`)
  return project
}

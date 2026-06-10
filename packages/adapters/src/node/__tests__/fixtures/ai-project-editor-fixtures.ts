import type { AIProjectEditorResult } from "@timeline-studio/core"
import type { BotRenderJobDestination } from "@timeline-studio/core/types"
import type { ProjectSchema } from "@/types/contracts/project-schema"

export interface AIProjectEditorFixture {
  id: string
  instruction: string
  targetPlatform?: BotRenderJobDestination
  createResult(project: ProjectSchema): AIProjectEditorResult
}

export const AI_PROJECT_EDITOR_VALID_FIXTURES: readonly AIProjectEditorFixture[] = [
  {
    id: "promo_creation",
    instruction: "make a fast launch promo",
    targetPlatform: "telegram",
    createResult(project) {
      const nextProject = cloneProject(project)
      nextProject.metadata.name = "Launch promo"
      nextProject.metadata.description = "Short launch promo for Telegram review."
      nextProject.metadata.modified_at = "2026-06-09T12:00:00.000Z"
      nextProject.settings.custom = {
        ...nextProject.settings.custom,
        aiFixture: {
          id: "promo_creation",
          style: "fast_promo",
        },
      }

      return {
        nextProject,
        summary: "Created a faster launch promo structure.",
        changedAreas: ["metadata.name", "metadata.description", "settings.custom.aiFixture"],
        commands: [
          {
            type: "set_project_metadata",
            params: {
              name: "Launch promo",
              description: "Short launch promo for Telegram review.",
            },
            rationale: "User asked for a launch promo.",
          },
        ],
        diagnostics: [{ level: "info", code: "fixture_promo_creation", message: "Promo fixture applied." }],
        metadata: { fixtureId: "promo_creation" },
      }
    },
  },
  {
    id: "shorten_intro",
    instruction: "shorten the intro by two seconds",
    createResult(project) {
      const nextProject = cloneProject(project)
      const duration = Math.max(1, project.timeline.duration - 2)
      nextProject.timeline.duration = duration
      nextProject.settings.output = {
        ...nextProject.settings.output,
        duration,
      }
      nextProject.metadata.modified_at = "2026-06-09T12:01:00.000Z"

      return {
        nextProject,
        summary: "Shortened the intro and adjusted timeline duration.",
        changedAreas: ["timeline.duration", "settings.output.duration"],
        commands: [
          {
            type: "set_timeline_duration",
            params: { duration },
            rationale: "User asked to shorten the intro.",
          },
        ],
        diagnostics: [{ level: "info", code: "fixture_shorten_intro", message: "Intro shortened." }],
        metadata: { fixtureId: "shorten_intro" },
      }
    },
  },
  {
    id: "add_title_captions",
    instruction: "add a title card and captions",
    targetPlatform: "telegram",
    createResult(project) {
      const nextProject = cloneProject(project)
      nextProject.metadata.modified_at = "2026-06-09T12:02:00.000Z"
      nextProject.subtitles = [
        ...nextProject.subtitles,
        {
          id: "fixture-title-caption",
          text: "Launch day",
          start_time: 0,
          end_time: 2.5,
          position: "bottom",
        },
      ] as ProjectSchema["subtitles"]

      return {
        nextProject,
        summary: "Added an opening title caption.",
        changedAreas: ["subtitles"],
        commands: [
          {
            type: "add_subtitle",
            targetId: "fixture-title-caption",
            params: {
              text: "Launch day",
              start_time: 0,
              end_time: 2.5,
            },
            rationale: "User asked for a title card and captions.",
          },
        ],
        diagnostics: [{ level: "info", code: "fixture_add_title_captions", message: "Caption added." }],
        metadata: { fixtureId: "add_title_captions" },
      }
    },
  },
  {
    id: "platform_adaptation",
    instruction: "adapt this for YouTube",
    targetPlatform: "youtube",
    createResult(project) {
      const nextProject = cloneProject(project)
      nextProject.metadata.description = "YouTube-ready edit with clearer title metadata."
      nextProject.metadata.modified_at = "2026-06-09T12:03:00.000Z"
      nextProject.settings.custom = {
        ...nextProject.settings.custom,
        aiFixture: {
          id: "platform_adaptation",
          targetPlatform: "youtube",
          titleSafeArea: true,
        },
      }

      return {
        nextProject,
        summary: "Adapted the project metadata for YouTube.",
        changedAreas: ["metadata.description", "settings.custom.aiFixture"],
        commands: [
          {
            type: "set_project_metadata",
            params: {
              description: "YouTube-ready edit with clearer title metadata.",
              targetPlatform: "youtube",
            },
            rationale: "User asked to adapt the edit for YouTube.",
          },
        ],
        diagnostics: [{ level: "info", code: "fixture_platform_adaptation", message: "Platform metadata updated." }],
        metadata: { fixtureId: "platform_adaptation" },
      }
    },
  },
]

export const AI_PROJECT_EDITOR_INVALID_RESPONSE_FIXTURE = {
  id: "invalid_missing_project_shape",
  instruction: "make a valid edit from a malformed provider response",
  response: {
    nextProject: { tracks: [] },
    summary: "",
    commands: [],
    diagnostics: [],
    metadata: { fixtureId: "invalid_missing_project_shape" },
  },
} as const

function cloneProject(project: ProjectSchema): ProjectSchema {
  return structuredClone(project)
}

import {
  type AIProjectEditCommand,
  type AIProjectEditorRequest,
  type AIProjectEditorResult,
  cloneProjectSchema,
  type IAIProjectEditor,
} from "@timeline-studio/core"
import type { ProjectSchema } from "@/types/contracts/project-schema"

export interface MockAIProjectEditorOptions {
  now?: () => string
  edit?: (request: AIProjectEditorRequest) => AIProjectEditorResult | Promise<AIProjectEditorResult>
}

export class MockAIProjectEditor implements IAIProjectEditor {
  constructor(private readonly options: MockAIProjectEditorOptions = {}) {}

  async editProject(request: AIProjectEditorRequest): Promise<AIProjectEditorResult> {
    if (this.options.edit) {
      return this.options.edit(request)
    }

    const nextProject = cloneProjectSchema(request.currentProject)
    const timestamp = this.options.now?.() ?? new Date().toISOString()
    applyMockEditMetadata(nextProject, request, timestamp)

    const command: AIProjectEditCommand = {
      type: "custom",
      params: {
        instruction: request.userInstruction,
      },
      rationale: "Deterministic mock AI project edit",
    }

    return {
      nextProject,
      summary: `Applied instruction: ${request.userInstruction}`,
      changedAreas: ["project.metadata", "project.settings.custom.aiProjectEditor"],
      commands: [command],
      diagnostics: [
        {
          level: "info",
          message: "Mock AI project editor applied deterministic metadata update.",
          code: "mock_editor",
        },
      ],
    }
  }
}

function applyMockEditMetadata(project: ProjectSchema, request: AIProjectEditorRequest, timestamp: string): void {
  project.metadata.modified_at = timestamp
  project.settings.custom = {
    ...project.settings.custom,
    aiProjectEditor: {
      lastInstruction: request.userInstruction,
      targetPlatform: request.targetPlatform ?? null,
      sourceMediaCount: request.sourceMedia.length,
      revisionCount: request.revisionHistory?.length ?? 0,
      updatedAt: timestamp,
    },
  }
}

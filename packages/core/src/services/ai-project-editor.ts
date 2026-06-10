import type { ProjectSchema } from "@/types/contracts/project-schema"

import type {
  AIProjectEditCommand,
  AIProjectEditDiagnostic,
  AIProjectEditorRequest,
  AIProjectEditorResult,
  AIProjectEditRepairContext,
  AIProjectEditValidationError,
  IAIProjectEditor,
} from "../ports"

export interface AIProjectEditRunOptions {
  maxRepairAttempts?: number
  repair?: (context: AIProjectEditRepairContext) => Promise<AIProjectEditorResult>
}

export type AIProjectEditRunResult =
  | {
      ok: true
      result: AIProjectEditorResult
      attempts: number
      warnings: AIProjectEditValidationError[]
    }
  | {
      ok: false
      errors: AIProjectEditValidationError[]
      attempts: number
      lastResult?: AIProjectEditorResult
    }

export async function runAIProjectEdit(
  editor: IAIProjectEditor,
  request: AIProjectEditorRequest,
  options: AIProjectEditRunOptions = {},
): Promise<AIProjectEditRunResult> {
  const requestErrors = validateAIProjectEditRequest(request)
  if (requestErrors.length > 0) {
    return {
      ok: false,
      errors: requestErrors,
      attempts: 0,
    }
  }

  const maxRepairAttempts = Math.max(0, Math.trunc(options.maxRepairAttempts ?? 0))
  const repair = options.repair ?? editor.repairProjectEdit?.bind(editor)
  let result = await editor.editProject(request)
  let attempts = 1

  for (let repairAttempt = 0; repairAttempt <= maxRepairAttempts; repairAttempt++) {
    const errors = validateAIProjectEditResult(request, result)
    if (errors.length === 0) {
      return {
        ok: true,
        result,
        attempts,
        warnings: [],
      }
    }

    if (!repair || repairAttempt >= maxRepairAttempts) {
      return {
        ok: false,
        errors,
        attempts,
        lastResult: result,
      }
    }

    result = await repair({
      request,
      result,
      errors,
      attempt: repairAttempt + 1,
    })
    attempts += 1
  }

  return {
    ok: false,
    errors: validateAIProjectEditResult(request, result),
    attempts,
    lastResult: result,
  }
}

export function validateAIProjectEditRequest(request: AIProjectEditorRequest): AIProjectEditValidationError[] {
  const errors: AIProjectEditValidationError[] = []
  errors.push(...validateProjectSchemaShape(request.currentProject, "currentProject"))

  if (!request.userInstruction.trim()) {
    errors.push({
      code: "missing_instruction",
      field: "userInstruction",
      message: "User instruction is required for AI project editing",
    })
  }

  request.sourceMedia.forEach((media, index) => {
    if (!media.value.trim()) {
      errors.push({
        code: "invalid_media",
        field: `sourceMedia.${index}.value`,
        message: "Source media value cannot be empty",
      })
    }
  })

  return errors
}

export function validateAIProjectEditResult(
  _request: AIProjectEditorRequest,
  result: AIProjectEditorResult,
): AIProjectEditValidationError[] {
  const errors: AIProjectEditValidationError[] = []
  errors.push(...validateProjectSchemaShape(result.nextProject, "nextProject"))

  if (!result.summary.trim()) {
    errors.push({
      code: "missing_summary",
      field: "summary",
      message: "AI project edit result must include a user-facing summary",
    })
  }

  if (!Array.isArray(result.commands) || result.commands.length === 0) {
    errors.push({
      code: "missing_commands",
      field: "commands",
      message: "AI project edit result must include at least one edit command",
    })
  } else {
    result.commands.forEach((command, index) => errors.push(...validateAIProjectEditCommand(command, index)))
  }

  result.diagnostics.forEach((diagnostic, index) => errors.push(...validateAIProjectEditDiagnostic(diagnostic, index)))

  return errors
}

export function validateProjectSchemaShape(value: unknown, field: string): AIProjectEditValidationError[] {
  const errors: AIProjectEditValidationError[] = []
  if (!isRecord(value)) {
    return [
      {
        code: "missing_project",
        field,
        message: "ProjectSchema must be an object",
      },
    ]
  }

  if (typeof value.version !== "string" || value.version.trim().length === 0) {
    errors.push(invalidProject(field, "version must be a non-empty string"))
  }
  if (!isRecord(value.metadata) || typeof value.metadata.name !== "string") {
    errors.push(invalidProject(field, "metadata.name must be a string"))
  }
  if (!isRecord(value.timeline)) {
    errors.push(invalidProject(field, "timeline must be an object"))
  } else {
    if (typeof value.timeline.duration !== "number" || value.timeline.duration < 0) {
      errors.push(invalidProject(field, "timeline.duration must be a non-negative number"))
    }
    if (typeof value.timeline.fps !== "number" || value.timeline.fps <= 0) {
      errors.push(invalidProject(field, "timeline.fps must be a positive number"))
    }
    if (!Array.isArray(value.timeline.resolution) || value.timeline.resolution.length !== 2) {
      errors.push(invalidProject(field, "timeline.resolution must be a [width, height] tuple"))
    }
  }

  for (const key of ["tracks", "effects", "transitions", "filters", "templates", "style_templates", "subtitles"]) {
    if (!Array.isArray(value[key])) {
      errors.push(invalidProject(field, `${key} must be an array`))
    }
  }

  if (!isRecord(value.settings)) {
    errors.push(invalidProject(field, "settings must be an object"))
  }

  return errors
}

export function cloneProjectSchema(project: ProjectSchema): ProjectSchema {
  return structuredClone(project)
}

function validateAIProjectEditCommand(command: AIProjectEditCommand, index: number): AIProjectEditValidationError[] {
  if (!command.type) {
    return [
      {
        code: "invalid_command",
        field: `commands.${index}.type`,
        message: "AI project edit command type is required",
      },
    ]
  }

  return []
}

function validateAIProjectEditDiagnostic(
  diagnostic: AIProjectEditDiagnostic,
  index: number,
): AIProjectEditValidationError[] {
  if (!["info", "warning", "error"].includes(diagnostic.level) || !diagnostic.message.trim()) {
    return [
      {
        code: "invalid_diagnostic",
        field: `diagnostics.${index}`,
        message: "AI project edit diagnostic must include a valid level and message",
      },
    ]
  }

  return []
}

function invalidProject(field: string, message: string): AIProjectEditValidationError {
  return {
    code: "invalid_project",
    field,
    message,
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

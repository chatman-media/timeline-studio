import {
  type AIProjectEditCommand,
  type AIProjectEditDiagnostic,
  type AIProjectEditorRequest,
  type AIProjectEditorResult,
  type AIProjectEditRepairContext,
  cloneProjectSchema,
  type IAIProjectEditor,
  validateAIProjectEditResult,
} from "@timeline-studio/core"
import type { ProjectSchema } from "@/types/contracts/project-schema"
import { redactSensitiveMetadata } from "./sensitive-metadata"

export type NodeAIProjectEditorFetch = typeof fetch

export interface NodeAIProjectEditorOptions {
  apiKey?: string
  apiUrl?: string
  provider?: string
  model?: string
  temperature?: number
  maxTokens?: number
  timeoutMs?: number
  headers?: Record<string, string>
  responseFormat?: "json_object" | false
  fetch?: NodeAIProjectEditorFetch
  now?: () => string
  promptId?: string
  maxProjectChars?: number
}

interface ChatCompletionResponse {
  choices?: Array<{
    message?: {
      content?: string | null
    }
    finish_reason?: string | null
  }>
  usage?: unknown
}

interface EditGenerationContext {
  repair?: AIProjectEditRepairContext
}

const DEFAULT_API_URL = "https://api.openai.com/v1"
const DEFAULT_MODEL = "gpt-4o-mini"
const DEFAULT_PROVIDER = "openai-compatible"
const DEFAULT_PROMPT_ID = "ai-project-editor/v1"
const DEFAULT_MAX_PROJECT_CHARS = 60_000

export class NodeAIProjectEditor implements IAIProjectEditor {
  private readonly apiUrl: string
  private readonly provider: string
  private readonly model: string
  private readonly promptId: string

  constructor(private readonly options: NodeAIProjectEditorOptions = {}) {
    this.apiUrl = trimTrailingSlash(options.apiUrl ?? DEFAULT_API_URL)
    this.provider = options.provider ?? DEFAULT_PROVIDER
    this.model = options.model ?? DEFAULT_MODEL
    this.promptId = options.promptId ?? DEFAULT_PROMPT_ID
  }

  async editProject(request: AIProjectEditorRequest): Promise<AIProjectEditorResult> {
    return this.generateEdit(request)
  }

  async repairProjectEdit(context: AIProjectEditRepairContext): Promise<AIProjectEditorResult> {
    return this.generateEdit(context.request, { repair: context })
  }

  private async generateEdit(
    request: AIProjectEditorRequest,
    context: EditGenerationContext = {},
  ): Promise<AIProjectEditorResult> {
    const apiKey = this.resolveApiKey()
    if (!apiKey) {
      return this.createNoopResult(request, {
        level: "error",
        code: "missing_api_key",
        message: "AI project editor is not configured: API key is missing.",
      })
    }

    const fetchImpl = this.options.fetch ?? globalThis.fetch
    if (!fetchImpl) {
      return this.createNoopResult(request, {
        level: "error",
        code: "missing_fetch",
        message: "AI project editor cannot run because fetch is not available in this runtime.",
      })
    }

    try {
      const response = await this.callProvider(fetchImpl, apiKey, request, context)
      if (!response.ok) {
        const body = await safeReadResponseText(response)
        return this.createNoopResult(request, {
          level: "error",
          code: "provider_http_error",
          message: `AI project editor provider returned HTTP ${response.status}: ${truncateText(body || response.statusText, 500)}`,
        })
      }

      const raw = (await response.json()) as ChatCompletionResponse
      const content = raw.choices?.[0]?.message?.content?.trim()
      if (!content) {
        return this.createNoopResult(request, {
          level: "error",
          code: "provider_empty_response",
          message: "AI project editor provider returned an empty response.",
        })
      }

      let parsed: unknown
      try {
        parsed = parseJsonObject(content)
      } catch (error) {
        return this.createNoopResult(request, {
          level: "error",
          code: "provider_invalid_json",
          message: `AI project editor provider returned invalid JSON: ${formatUnknownError(error)}`,
        })
      }

      let normalized: AIProjectEditorResult
      try {
        normalized = this.normalizeProviderResult(request, parsed, {
          finishReason: raw.choices?.[0]?.finish_reason ?? null,
          usage: raw.usage ?? null,
          repairAttempt: context.repair?.attempt ?? null,
        })
      } catch (error) {
        return this.createNoopResult(request, {
          level: "error",
          code: "provider_invalid_output",
          message: `AI project editor provider returned invalid output: ${formatUnknownError(error)}`,
        })
      }

      const validationErrors = validateAIProjectEditResult(request, normalized)
      if (validationErrors.length > 0) {
        return this.createNoopResult(request, {
          level: "error",
          code: "provider_invalid_output",
          message: `AI project editor provider returned invalid output: ${validationErrors
            .map((error) => `${error.field}: ${error.message}`)
            .join("; ")}`,
        })
      }

      return normalized
    } catch (error) {
      return this.createNoopResult(request, {
        level: "error",
        code: "provider_request_failed",
        message: `AI project editor provider request failed: ${formatUnknownError(error)}`,
      })
    }
  }

  private async callProvider(
    fetchImpl: NodeAIProjectEditorFetch,
    apiKey: string,
    request: AIProjectEditorRequest,
    context: EditGenerationContext,
  ): Promise<Response> {
    const controller = this.options.timeoutMs ? new AbortController() : undefined
    const timeout =
      controller && this.options.timeoutMs
        ? setTimeout(() => controller.abort(), Math.max(1, this.options.timeoutMs))
        : undefined

    try {
      return await fetchImpl(`${this.apiUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
          ...(this.options.headers ?? {}),
        },
        body: JSON.stringify(this.createProviderRequest(request, context)),
        ...(controller ? { signal: controller.signal } : {}),
      })
    } finally {
      if (timeout) clearTimeout(timeout)
    }
  }

  private createProviderRequest(
    request: AIProjectEditorRequest,
    context: EditGenerationContext,
  ): Record<string, unknown> {
    const body: Record<string, unknown> = {
      model: this.model,
      temperature: this.options.temperature ?? 0.2,
      max_tokens: this.options.maxTokens ?? 4096,
      messages: [
        {
          role: "system",
          content: this.systemPrompt(),
        },
        {
          role: "user",
          content: this.userPrompt(request, context),
        },
      ],
    }

    if (this.options.responseFormat !== false) {
      body.response_format = { type: this.options.responseFormat ?? "json_object" }
    }

    return body
  }

  private systemPrompt(): string {
    return [
      "You are Timeline Studio's production AI project editor.",
      "Return only one JSON object. Do not use markdown.",
      "The JSON object must match this TypeScript shape:",
      "{",
      '  "nextProject": ProjectSchema,',
      '  "summary": "short user-facing summary",',
      '  "changedAreas": ["project path or area"],',
      '  "commands": [{"type": "trim_clip|remove_clip|move_clip|reorder_clips|set_clip_speed|set_clip_volume|add_subtitle|update_subtitle|remove_subtitle|set_project_metadata|set_timeline_duration|custom", "targetId": "...", "trackId": "...", "params": {}, "rationale": "..."}],',
      '  "diagnostics": [{"level": "info|warning|error", "message": "...", "code": "...", "path": "..."}],',
      '  "metadata": {"optional": "machine-readable metadata"}',
      "}",
      "Rules:",
      "- Preserve ProjectSchema validity and all unrelated project data.",
      "- Use only source media paths/URLs provided by the request.",
      "- Do not invent rendered artifacts or publishing success.",
      "- If the instruction cannot be fully applied, return the safest valid nextProject and add warning diagnostics.",
      "- Include at least one machine-readable command that describes the edit.",
    ].join("\n")
  }

  private userPrompt(request: AIProjectEditorRequest, context: EditGenerationContext): string {
    const project = stringifyForPrompt(
      request.currentProject,
      this.options.maxProjectChars ?? DEFAULT_MAX_PROJECT_CHARS,
    )
    const payload = {
      promptId: this.promptId,
      provider: this.provider,
      model: this.model,
      instruction: request.userInstruction,
      targetPlatform: request.targetPlatform ?? null,
      sourceMedia: request.sourceMedia.map((media) => ({
        type: media.type,
        value: media.value,
        name: media.name ?? null,
        metadata: media.metadata ?? null,
      })),
      revisionHistory: request.revisionHistory ?? [],
      constraints: request.constraints ?? {},
      artifactMetadata: request.metadata ?? {},
      repair: context.repair
        ? {
            attempt: context.repair.attempt,
            validationErrors: context.repair.errors,
            previousResult: context.repair.result,
          }
        : null,
    }

    return [
      "Apply this user instruction to the current Timeline Studio ProjectSchema.",
      "",
      "Request context:",
      JSON.stringify(payload, null, 2),
      "",
      "Current ProjectSchema JSON:",
      project,
    ].join("\n")
  }

  private normalizeProviderResult(
    request: AIProjectEditorRequest,
    value: unknown,
    metadata: Record<string, unknown>,
  ): AIProjectEditorResult {
    if (!isRecord(value)) {
      throw new Error("AI project editor JSON response must be an object")
    }

    const nextProject = resolveNextProject(value)
    const commands = normalizeCommands(value.commands)

    return {
      nextProject,
      summary: stringField(value, "summary") ?? "Applied requested edit.",
      changedAreas: stringArrayField(value, "changedAreas"),
      commands:
        commands.length > 0
          ? commands
          : [
              {
                type: "custom",
                params: { instruction: request.userInstruction },
                rationale: "AI provider omitted command details.",
              },
            ],
      diagnostics: normalizeDiagnostics(value.diagnostics),
      metadata: redactSensitiveMetadata({
        ...(isRecord(value.metadata) ? value.metadata : {}),
        ...metadata,
        provider: this.provider,
        model: this.model,
        promptId: this.promptId,
      }),
    }
  }

  private createNoopResult(
    request: AIProjectEditorRequest,
    diagnostic: AIProjectEditDiagnostic,
  ): AIProjectEditorResult {
    const nextProject = cloneProjectSchema(request.currentProject)
    return {
      nextProject,
      summary: "No AI edit was applied; the current project was preserved.",
      changedAreas: [],
      commands: [
        {
          type: "custom",
          params: {
            instruction: request.userInstruction,
            noop: true,
          },
          rationale: "AI project editor could not safely apply the requested edit.",
        },
      ],
      diagnostics: [diagnostic],
      metadata: {
        provider: this.provider,
        model: this.model,
        promptId: this.promptId,
        noop: true,
        generatedAt: this.options.now?.() ?? new Date().toISOString(),
      },
    }
  }

  private resolveApiKey(): string | undefined {
    return this.options.apiKey ?? process.env.OPENAI_API_KEY ?? process.env.LLM_API_KEY
  }
}

function resolveNextProject(value: Record<string, unknown>): ProjectSchema {
  if (isRecord(value.nextProject)) return value.nextProject as unknown as ProjectSchema
  if (isRecord(value.project)) return value.project as unknown as ProjectSchema
  if (isRecord(value.next_project)) return value.next_project as unknown as ProjectSchema
  if ("version" in value && "timeline" in value && "tracks" in value) return value as unknown as ProjectSchema
  throw new Error("AI project editor JSON response is missing nextProject")
}

function normalizeCommands(value: unknown): AIProjectEditCommand[] {
  if (!Array.isArray(value)) return []

  return value.filter(isRecord).map((command) => ({
    type: normalizeCommandType(command.type),
    ...(typeof command.targetId === "string" ? { targetId: command.targetId } : {}),
    ...(typeof command.trackId === "string" ? { trackId: command.trackId } : {}),
    ...(isRecord(command.params) ? { params: command.params } : {}),
    ...(typeof command.rationale === "string" ? { rationale: command.rationale } : {}),
  }))
}

function normalizeCommandType(value: unknown): AIProjectEditCommand["type"] {
  if (
    value === "trim_clip" ||
    value === "remove_clip" ||
    value === "move_clip" ||
    value === "reorder_clips" ||
    value === "set_clip_speed" ||
    value === "set_clip_volume" ||
    value === "add_subtitle" ||
    value === "update_subtitle" ||
    value === "remove_subtitle" ||
    value === "set_project_metadata" ||
    value === "set_timeline_duration"
  ) {
    return value
  }

  return "custom"
}

function normalizeDiagnostics(value: unknown): AIProjectEditDiagnostic[] {
  if (!Array.isArray(value)) return []

  return value.filter(isRecord).map((diagnostic) => ({
    level: normalizeDiagnosticLevel(diagnostic.level),
    message: typeof diagnostic.message === "string" ? diagnostic.message : "AI project editor diagnostic",
    ...(typeof diagnostic.code === "string" ? { code: diagnostic.code } : {}),
    ...(typeof diagnostic.path === "string" ? { path: diagnostic.path } : {}),
  }))
}

function normalizeDiagnosticLevel(value: unknown): AIProjectEditDiagnostic["level"] {
  return value === "warning" || value === "error" || value === "info" ? value : "info"
}

function parseJsonObject(content: string): unknown {
  const trimmed = content.trim()
  const fenced = extractFencedJson(trimmed)
  const raw = fenced ?? extractBracedJson(trimmed) ?? trimmed
  return JSON.parse(raw)
}

function extractFencedJson(value: string): string | undefined {
  const match = value.match(/```(?:json)?\s*([\s\S]*?)```/)
  return match?.[1]?.trim()
}

function extractBracedJson(value: string): string | undefined {
  const start = value.indexOf("{")
  const end = value.lastIndexOf("}")
  if (start === -1 || end === -1 || end <= start) return undefined
  return value.slice(start, end + 1)
}

function stringifyForPrompt(value: unknown, maxChars: number): string {
  const text = JSON.stringify(value, null, 2)
  if (text.length <= maxChars) return text
  return `${text.slice(0, maxChars)}\n... truncated ${text.length - maxChars} chars`
}

function stringField(value: Record<string, unknown>, key: string): string | undefined {
  const field = value[key]
  return typeof field === "string" ? field : undefined
}

function stringArrayField(value: Record<string, unknown>, key: string): string[] {
  const field = value[key]
  return Array.isArray(field) ? field.filter((item): item is string => typeof item === "string") : []
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, "")
}

async function safeReadResponseText(response: Response): Promise<string> {
  try {
    return await response.text()
  } catch {
    return ""
  }
}

function truncateText(value: string, maxLength: number): string {
  return value.length > maxLength ? `${value.slice(0, maxLength)}...` : value
}

function formatUnknownError(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

import type {
  IScriptPlanner,
  ScriptDraft,
  ScriptGeneratorRequest,
  ScriptPlannerResult,
  ScriptScene,
} from "@timeline-studio/core"
import { validateScriptDraftShape } from "@timeline-studio/core"

export type NodeLlmScriptPlannerFetch = typeof fetch

export interface NodeLlmScriptPlannerOptions {
  apiKey?: string
  apiUrl?: string
  provider?: string
  model?: string
  temperature?: number
  maxTokens?: number
  timeoutMs?: number
  headers?: Record<string, string>
  responseFormat?: "json_object" | false
  fetch?: NodeLlmScriptPlannerFetch
  now?: () => string
}

interface ChatCompletionResponse {
  choices?: Array<{
    message?: { content?: string | null }
    finish_reason?: string | null
  }>
  usage?: unknown
}

const DEFAULT_API_URL = "https://api.openai.com/v1"
const DEFAULT_MODEL = "gpt-4o-mini"
const DEFAULT_PROVIDER = "openai-compatible"
const DEFAULT_MAX_TOKENS = 2048
const PROMPT_ID = "llm-script-planner/v1"

export class NodeLlmScriptPlanner implements IScriptPlanner {
  private readonly apiUrl: string
  private readonly provider: string
  private readonly model: string

  constructor(private readonly options: NodeLlmScriptPlannerOptions = {}) {
    this.apiUrl = trimTrailingSlash(options.apiUrl ?? DEFAULT_API_URL)
    this.provider = options.provider ?? DEFAULT_PROVIDER
    this.model = options.model ?? DEFAULT_MODEL
  }

  async generateScriptPlan(request: ScriptGeneratorRequest): Promise<ScriptPlannerResult> {
    const apiKey = this.resolveApiKey()
    if (!apiKey) {
      throw new Error("NodeLlmScriptPlanner requires an API key (set apiKey option or OPENAI_API_KEY / LLM_API_KEY env)")
    }

    const fetchImpl = this.options.fetch ?? globalThis.fetch
    if (!fetchImpl) {
      throw new Error("NodeLlmScriptPlanner cannot run: fetch is not available in this runtime")
    }

    const controller = this.options.timeoutMs ? new AbortController() : undefined
    const timeout =
      controller && this.options.timeoutMs
        ? setTimeout(() => controller.abort(), Math.max(1, this.options.timeoutMs))
        : undefined

    let response: Response
    try {
      response = await fetchImpl(`${this.apiUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
          ...(this.options.headers ?? {}),
        },
        body: JSON.stringify(this.buildProviderRequest(request)),
        ...(controller ? { signal: controller.signal } : {}),
      })
    } finally {
      if (timeout) clearTimeout(timeout)
    }

    if (!response.ok) {
      const body = await safeReadText(response)
      throw new Error(
        `LLM script planner provider returned HTTP ${response.status}: ${truncate(body || response.statusText, 400)}`,
      )
    }

    const raw = (await response.json()) as ChatCompletionResponse
    const content = raw.choices?.[0]?.message?.content?.trim()
    if (!content) {
      throw new Error("LLM script planner provider returned an empty response")
    }

    const parsed = parseJsonObject(content)
    const draft = normalizeDraftResponse(parsed, request)

    const validationErrors = validateScriptDraftShape(draft, "script")
    if (validationErrors.length > 0) {
      throw new Error(`LLM script planner returned invalid ScriptDraft: ${validationErrors.join("; ")}`)
    }

    return {
      script: draft,
      provider: "llm-script",
      summary: stringField(parsed, "summary") ?? `Generated storyboard with ${this.model}.`,
      diagnostics: [],
      metadata: {
        provider: this.provider,
        model: this.model,
        promptId: PROMPT_ID,
        finishReason: raw.choices?.[0]?.finish_reason ?? null,
        usage: raw.usage ?? null,
      },
    }
  }

  private buildProviderRequest(request: ScriptGeneratorRequest): Record<string, unknown> {
    const body: Record<string, unknown> = {
      model: this.model,
      temperature: this.options.temperature ?? 0.7,
      max_tokens: this.options.maxTokens ?? DEFAULT_MAX_TOKENS,
      messages: [
        { role: "system", content: systemPrompt() },
        { role: "user", content: userPrompt(request) },
      ],
    }
    if (this.options.responseFormat !== false) {
      body.response_format = { type: this.options.responseFormat ?? "json_object" }
    }
    return body
  }

  private resolveApiKey(): string | undefined {
    return this.options.apiKey ?? process.env.OPENAI_API_KEY ?? process.env.LLM_API_KEY
  }
}

function systemPrompt(): string {
  return [
    "You are a creative social-media video scriptwriter.",
    "Return only one JSON object. Do not use markdown fences.",
    "The JSON object must match this TypeScript shape:",
    "{",
    '  "title": "short video title (max 8 words)",',
    '  "hook": "attention-grabbing opener for the first 3 seconds (max 14 words)",',
    '  "scenes": [',
    "    {",
    '      "index": 0,',
    '      "shot": "what to film / show on screen",',
    '      "voiceover": "what to say / narrate",',
    '      "onScreenText": "optional caption (omit if same as voiceover)",',
    '      "durationSeconds": 5',
    "    }",
    "  ],",
    '  "summary": "one-sentence description",',
    '  "totalDurationSeconds": 30',
    "}",
    "Rules:",
    "- scenes must be a non-empty array (minimum 1 element).",
    "- Every scene must have non-empty shot and voiceover strings.",
    "- Fit the target platform style when provided.",
    "- Keep the hook under 14 words and punchy.",
    "- Return valid JSON only. No extra keys outside the schema above.",
  ].join("\n")
}

function userPrompt(request: ScriptGeneratorRequest): string {
  const lines = [`Idea: ${request.idea}`]
  if (request.targetPlatform) lines.push(`Platform: ${request.targetPlatform}`)
  if (request.targetDurationSeconds) lines.push(`Target duration: ${request.targetDurationSeconds}s`)
  if (request.sceneCount) lines.push(`Scene count: ${request.sceneCount}`)
  if (request.style) lines.push(`Style: ${request.style}`)
  if (request.language) lines.push(`Language: ${request.language}`)
  lines.push("Generate a concise, engaging storyboard.")
  return lines.join("\n")
}

function normalizeDraftResponse(parsed: unknown, request: ScriptGeneratorRequest): ScriptDraft {
  if (!isRecord(parsed)) {
    throw new Error("LLM script planner JSON response must be an object")
  }

  const rawScenes = parsed.scenes
  const scenes: ScriptScene[] = Array.isArray(rawScenes)
    ? rawScenes
        .filter(isRecord)
        .map((scene, index) => ({
          index: typeof scene.index === "number" ? scene.index : index,
          shot: String(scene.shot ?? "").trim(),
          voiceover: String(scene.voiceover ?? "").trim(),
          ...(isNonEmptyString(scene.onScreenText) ? { onScreenText: String(scene.onScreenText).trim() } : {}),
          ...(isPositiveNumber(scene.durationSeconds) ? { durationSeconds: scene.durationSeconds as number } : {}),
        }))
        .filter((scene) => scene.shot.length > 0 && scene.voiceover.length > 0)
    : []

  return {
    ...(isNonEmptyString(parsed.title) ? { title: String(parsed.title).trim() } : {}),
    ...(isNonEmptyString(parsed.hook) ? { hook: String(parsed.hook).trim() } : {}),
    scenes,
    ...(isNonEmptyString(parsed.summary) ? { summary: String(parsed.summary).trim() } : {}),
    ...(request.targetPlatform ? { targetPlatform: request.targetPlatform } : {}),
    ...(isPositiveNumber(parsed.totalDurationSeconds)
      ? { totalDurationSeconds: parsed.totalDurationSeconds as number }
      : request.targetDurationSeconds
        ? { totalDurationSeconds: request.targetDurationSeconds }
        : {}),
    ...(request.language ? { language: request.language } : {}),
  }
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

function stringField(value: unknown, key: string): string | undefined {
  if (!isRecord(value)) return undefined
  const field = value[key]
  return typeof field === "string" && field.trim().length > 0 ? field.trim() : undefined
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0
}

function isPositiveNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0
}

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, "")
}

async function safeReadText(response: Response): Promise<string> {
  try {
    return await response.text()
  } catch {
    return ""
  }
}

function truncate(value: string, maxLength: number): string {
  return value.length > maxLength ? `${value.slice(0, maxLength)}...` : value
}

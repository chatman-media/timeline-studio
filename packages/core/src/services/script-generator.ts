import type {
  IScriptGenerator,
  IScriptPlanner,
  ScriptDraft,
  ScriptGeneratorRequest,
  ScriptGeneratorResult,
  ScriptPlannerResult,
  ScriptScene,
} from "../ports"

export interface ScriptGeneratorOptions {
  planner?: IScriptPlanner
  /** When false, planner failures throw instead of using the deterministic fallback. */
  fallbackToDeterministic?: boolean
  defaultSceneCount?: number
}

const DEFAULT_SCENE_COUNT = 3
const MIN_SCENE_COUNT = 1
const MAX_SCENE_COUNT = 12
const MAX_TITLE_WORDS = 8
const MAX_HOOK_WORDS = 14

export class DefaultScriptGenerator implements IScriptGenerator {
  constructor(private readonly options: ScriptGeneratorOptions = {}) {}

  async generateScript(request: ScriptGeneratorRequest): Promise<ScriptGeneratorResult> {
    const idea = request.idea?.trim()
    if (!idea) {
      throw new Error("Cannot generate a script without an idea")
    }
    const normalizedRequest: ScriptGeneratorRequest = { ...request, idea }
    const fallbackDiagnostics: string[] = []

    if (this.options.planner) {
      try {
        const planned = await this.options.planner.generateScriptPlan(normalizedRequest)
        const validationErrors = validateScriptDraftShape(planned.script, "script")
        if (validationErrors.length === 0) {
          return createPlannedScriptResult(normalizedRequest, planned)
        }

        const diagnostic = `Script planner ${planned.provider} output failed validation: ${validationErrors.join("; ")}`
        if (this.options.fallbackToDeterministic === false) {
          throw new Error(diagnostic)
        }
        fallbackDiagnostics.push(diagnostic)
      } catch (error) {
        if (this.options.fallbackToDeterministic === false) {
          throw error
        }
        fallbackDiagnostics.push(`Script planner failed; using deterministic fallback: ${formatUnknownError(error)}`)
      }
    }

    const script = createDeterministicScriptDraft(normalizedRequest, this.resolveSceneCount(request))
    return {
      script,
      provider: "deterministic-fallback",
      summary: `Generated deterministic storyboard with ${script.scenes.length} scene(s) from the idea.`,
      diagnostics: fallbackDiagnostics,
    }
  }

  private resolveSceneCount(request: ScriptGeneratorRequest): number {
    return clampSceneCount(request.sceneCount ?? this.options.defaultSceneCount ?? DEFAULT_SCENE_COUNT)
  }
}

function createPlannedScriptResult(
  request: ScriptGeneratorRequest,
  planned: ScriptPlannerResult,
): ScriptGeneratorResult {
  const script = normalizeScriptDraft(planned.script, request)
  return {
    script,
    provider: planned.provider,
    summary: planned.summary ?? `Generated storyboard with ${planned.provider}.`,
    diagnostics: planned.diagnostics ?? [],
    ...(planned.metadata ? { metadata: planned.metadata } : {}),
  }
}

/**
 * Build a deterministic storyboard from an idea without any model call.
 * Splits the idea into sentences and distributes them across the requested
 * number of scenes; the first sentence doubles as the hook.
 */
export function createDeterministicScriptDraft(
  request: ScriptGeneratorRequest,
  sceneCount: number,
): ScriptDraft {
  const idea = request.idea.trim()
  const sentences = splitIntoSentences(idea)
  const targetScenes = clampSceneCount(Math.min(sceneCount, Math.max(MIN_SCENE_COUNT, sentences.length)))
  const chunks = chunkEvenly(sentences, targetScenes)

  const perSceneDuration =
    request.targetDurationSeconds && targetScenes > 0
      ? roundToTenth(request.targetDurationSeconds / targetScenes)
      : undefined

  const scenes: ScriptScene[] = chunks.map((chunk, index) => {
    const line = chunk.join(" ").trim() || idea
    return {
      index,
      shot: `Film a shot that illustrates: ${line}`,
      voiceover: line,
      ...(perSceneDuration ? { durationSeconds: perSceneDuration } : {}),
    }
  })

  return {
    title: truncateWords(idea, MAX_TITLE_WORDS),
    hook: truncateWords(sentences[0] ?? idea, MAX_HOOK_WORDS),
    scenes,
    summary: `Storyboard from idea: ${truncateWords(idea, MAX_HOOK_WORDS)}`,
    ...(request.targetPlatform ? { targetPlatform: request.targetPlatform } : {}),
    ...(request.targetDurationSeconds ? { totalDurationSeconds: request.targetDurationSeconds } : {}),
    ...(request.language ? { language: request.language } : {}),
    metadata: {
      provider: "deterministic-fallback",
      source: request.source ?? "text",
    },
  }
}

/**
 * Validate the structural shape of a script draft. Returns an array of
 * human-readable problems (empty when the draft is usable).
 */
export function validateScriptDraftShape(value: unknown, field = "script"): string[] {
  const errors: string[] = []
  if (!isRecord(value)) {
    return [`${field} must be an object`]
  }

  const scenes = value.scenes
  if (!Array.isArray(scenes) || scenes.length === 0) {
    errors.push(`${field}.scenes must be a non-empty array`)
    return errors
  }

  scenes.forEach((scene, index) => {
    if (!isRecord(scene)) {
      errors.push(`${field}.scenes[${index}] must be an object`)
      return
    }
    if (!isNonEmptyString(scene.shot)) {
      errors.push(`${field}.scenes[${index}].shot must be a non-empty string`)
    }
    if (!isNonEmptyString(scene.voiceover)) {
      errors.push(`${field}.scenes[${index}].voiceover must be a non-empty string`)
    }
  })

  return errors
}

/**
 * Normalize a (validated) draft: sequential scene indices, trimmed copy, and
 * request-derived defaults for platform/language.
 */
export function normalizeScriptDraft(draft: ScriptDraft, request: ScriptGeneratorRequest): ScriptDraft {
  const scenes: ScriptScene[] = draft.scenes.map((scene, index) => ({
    index,
    shot: scene.shot.trim(),
    voiceover: scene.voiceover.trim(),
    ...(isNonEmptyString(scene.onScreenText) ? { onScreenText: scene.onScreenText.trim() } : {}),
    ...(isPositiveNumber(scene.durationSeconds) ? { durationSeconds: scene.durationSeconds } : {}),
  }))

  return {
    ...(isNonEmptyString(draft.title) ? { title: draft.title.trim() } : {}),
    ...(isNonEmptyString(draft.hook) ? { hook: draft.hook.trim() } : {}),
    scenes,
    ...(isNonEmptyString(draft.summary) ? { summary: draft.summary.trim() } : {}),
    targetPlatform: draft.targetPlatform ?? request.targetPlatform,
    ...(isPositiveNumber(draft.totalDurationSeconds)
      ? { totalDurationSeconds: draft.totalDurationSeconds }
      : request.targetDurationSeconds
        ? { totalDurationSeconds: request.targetDurationSeconds }
        : {}),
    language: draft.language ?? request.language,
    ...(draft.metadata ? { metadata: draft.metadata } : {}),
  }
}

/** Compose a goal string that folds the storyboard into a single instruction. */
export function describeScriptDraftAsGoal(script: ScriptDraft, fallbackGoal?: string): string | undefined {
  const lines: string[] = []
  const heading = script.title ?? fallbackGoal
  if (heading) lines.push(heading)
  if (script.hook) lines.push(`Hook: ${script.hook}`)
  script.scenes.forEach((scene) => {
    lines.push(`Scene ${scene.index + 1}: ${scene.shot} — say: ${scene.voiceover}`)
  })
  const composed = lines.join("\n").trim()
  return composed.length > 0 ? composed : fallbackGoal
}

function splitIntoSentences(idea: string): string[] {
  const sentences = idea
    .split(/(?<=[.!?…])\s+|\n+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 0)
  return sentences.length > 0 ? sentences : [idea]
}

function chunkEvenly<T>(items: T[], buckets: number): T[][] {
  const safeBuckets = Math.max(1, buckets)
  const result: T[][] = Array.from({ length: safeBuckets }, () => [])
  if (items.length === 0) return result

  const base = Math.floor(items.length / safeBuckets)
  const remainder = items.length % safeBuckets
  let cursor = 0
  for (let bucket = 0; bucket < safeBuckets; bucket++) {
    const size = base + (bucket < remainder ? 1 : 0)
    result[bucket] = items.slice(cursor, cursor + size)
    cursor += size
  }
  return result
}

function truncateWords(value: string, maxWords: number): string {
  const words = value.trim().split(/\s+/).filter(Boolean)
  if (words.length <= maxWords) return words.join(" ")
  return `${words.slice(0, maxWords).join(" ")}…`
}

function roundToTenth(value: number): number {
  return Math.round(value * 10) / 10
}

function clampSceneCount(value: number): number {
  if (!Number.isFinite(value)) return DEFAULT_SCENE_COUNT
  return Math.min(MAX_SCENE_COUNT, Math.max(MIN_SCENE_COUNT, Math.round(value)))
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

function formatUnknownError(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

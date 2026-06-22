/**
 * Script generation contract.
 *
 * Turns a raw idea (text, or voice already transcribed via the existing
 * transcription pipeline) into a structured {@link ScriptDraft} storyboard:
 * an ordered list of scenes describing what to shoot and what to say. The draft
 * feeds the bot-first first-cut generator so the assembled timeline reflects the
 * intended narrative instead of just stitching raw media together.
 */

import type { BotRenderJobDestination } from "../types"

export type ScriptSource = "text" | "voice"

export type ScriptGeneratorProvider = "llm-script" | "deterministic-fallback"

/**
 * One storyboard beat. `shot` describes what to film/show on screen, while
 * `voiceover` describes what to say. Both are user-facing copy.
 */
export interface ScriptScene {
  index: number
  /** What to shoot / show on screen ("что снять"). */
  shot: string
  /** What to say / narrate ("что сказать"). */
  voiceover: string
  /** Optional on-screen caption distinct from the spoken voiceover. */
  onScreenText?: string
  durationSeconds?: number
}

export interface ScriptDraft {
  title?: string
  /** Attention-grabbing opener for the first ~3 seconds. */
  hook?: string
  scenes: ScriptScene[]
  summary?: string
  targetPlatform?: string
  totalDurationSeconds?: number
  language?: string
  metadata?: Record<string, unknown>
}

export interface ScriptGeneratorRequest {
  /** Raw idea text. For voice ideas, transcribe first and pass the text here. */
  idea: string
  source?: ScriptSource
  targetPlatform?: string
  publishDestination?: BotRenderJobDestination
  targetDurationSeconds?: number
  sceneCount?: number
  language?: string
  style?: string
  metadata?: Record<string, unknown>
}

export interface ScriptGeneratorResult {
  script: ScriptDraft
  provider: ScriptGeneratorProvider
  summary: string
  diagnostics: string[]
  metadata?: Record<string, unknown>
}

export interface ScriptPlannerResult {
  script: ScriptDraft
  provider: Exclude<ScriptGeneratorProvider, "deterministic-fallback">
  summary?: string
  diagnostics?: string[]
  metadata?: Record<string, unknown>
}

/**
 * Pluggable planner that produces a script draft from an idea (e.g. an LLM).
 * Implementations may throw or return an invalid draft; the generator validates
 * and falls back to deterministic scaffolding when configured to do so.
 */
export interface IScriptPlanner {
  generateScriptPlan(request: ScriptGeneratorRequest): Promise<ScriptPlannerResult>
}

export interface IScriptGenerator {
  generateScript(request: ScriptGeneratorRequest): Promise<ScriptGeneratorResult>
}

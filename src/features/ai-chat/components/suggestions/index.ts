/**
 * AI Suggestions Panel - умные промты для AI Chat
 */

export type { AISuggestionsPanelProps } from "./ai-suggestions-panel"
export { AISuggestionsPanel } from "./ai-suggestions-panel"

export { analyzeContextForPrompts, createAnalysisContext } from "./context-analyzer"

export { CONTEXTUAL_PROMPTS, EMPTY_STATE_PROMPTS, UNIVERSAL_PROMPTS } from "./prompt-templates"

export type { AnalysisContext, PromptCategory, SuggestedPrompt } from "./types"

/**
 * AI Suggestions Panel - Real Integration
 * Интеграция настоящего AI Content Intelligence в таймлайн
 */

import { EnhancedAIPanel } from "./enhanced-ai-panel"

interface AISuggestionsPanelProps {
  className?: string
}

export function AISuggestionsPanel({ className }: AISuggestionsPanelProps) {
  return <EnhancedAIPanel className={className} data-oid="2k5_1gl" />
}

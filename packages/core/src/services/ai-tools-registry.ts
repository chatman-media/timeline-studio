import type { IAITool } from "@timeline-studio/core/types/ai-tools"

let registeredAITools: IAITool[] = []

export function setAITools(tools: readonly IAITool[]): void {
  registeredAITools = [...tools]
}

export function getAITools(): IAITool[] {
  return [...registeredAITools]
}

export function clearAITools(): void {
  registeredAITools = []
}

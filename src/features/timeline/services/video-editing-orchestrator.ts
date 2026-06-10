import { getVideoEditingBindings } from "@timeline-studio/core/services/video-editing-registry"

export type VideoEditingOrchestrator = ReturnType<typeof getVideoEditingOrchestrator>

export function getVideoEditingOrchestrator() {
  return getVideoEditingBindings().getVideoEditingOrchestrator()
}

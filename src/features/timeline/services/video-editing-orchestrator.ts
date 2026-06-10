import { getVideoEditingBindings } from "@/core/services/video-editing-registry"

export type VideoEditingOrchestrator = ReturnType<typeof getVideoEditingOrchestrator>

export function getVideoEditingOrchestrator() {
  return getVideoEditingBindings().getVideoEditingOrchestrator()
}

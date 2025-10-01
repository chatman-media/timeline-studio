/**
 * Re-export timeline machine from new domain location
 * Для обратной совместимости
 */

export type { TimelineMachine } from "@/domains/video-editing"
export { timelineMachine } from "@/domains/video-editing/machines/timeline-machine"

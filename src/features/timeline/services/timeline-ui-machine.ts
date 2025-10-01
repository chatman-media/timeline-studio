/**
 * Timeline UI Machine - Legacy re-export
 *
 * @deprecated Используйте импорт из @/domains/video-editing
 * Этот файл оставлен для обратной совместимости
 */

// Re-export everything from the new domain location
export type {
  TimelineEvent,
  TimelineMachine,
  TimelineUIContext,
} from "@/domains/video-editing/machines/timeline-machine"
// Для обратной совместимости экспортируем под старым именем
export {
  timelineMachine as timelineUiMachine,
  timelineMachine,
} from "@/domains/video-editing/machines/timeline-machine"

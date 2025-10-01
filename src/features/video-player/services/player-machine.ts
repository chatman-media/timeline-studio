/**
 * Player Machine - Legacy re-export
 *
 * @deprecated Используйте импорт из @/domains/video-editing
 * Этот файл оставлен для обратной совместимости
 */

// Re-export everything from the new domain location
export type {
  PlayerContext,
  PlayerContext as PlayerContextType, // Alias для обратной совместимости
  PlayerEvent,
  PlayerMachine,
} from "@/domains/video-editing/machines/player-machine"

export { playerMachine } from "@/domains/video-editing/machines/player-machine"

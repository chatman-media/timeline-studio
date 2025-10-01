/**
 * Re-export player machine from new domain location
 * Для обратной совместимости
 */

export type { PlayerMachine } from "@/domains/video-editing"
export type { PlayerContext, PlayerEvent } from "@/domains/video-editing/machines/player-machine"
export { playerMachine } from "@/domains/video-editing/machines/player-machine"

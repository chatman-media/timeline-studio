import type { JsonValue, PlayerSource, ProjectCommand } from "@/types/generated/tauri-bindings"

export const PlayerCommands = {
  playerSetMedia: (mediaId: string, startTime?: number): ProjectCommand => ({
    type: "PlayerSetMedia",
    params: { media_id: mediaId, start_time: startTime ?? null },
  }),

  playerSetVolume: (volume: number): ProjectCommand => ({
    type: "PlayerSetVolume",
    params: { volume },
  }),

  playerSelectClip: (clipId: string): ProjectCommand => ({
    type: "PlayerSelectClip",
    params: { clip_id: clipId },
  }),

  playerClearSelection: (): ProjectCommand => ({
    type: "PlayerClearSelection",
  }),

  playerSetSource: (source: PlayerSource): ProjectCommand => ({
    type: "PlayerSetSource",
    params: { source },
  }),

  playerApplyEffect: (effectId: string, params: JsonValue): ProjectCommand => ({
    type: "PlayerApplyEffect",
    params: { effect_id: effectId, params },
  }),

  playerApplyFilter: (filterId: string, params: JsonValue): ProjectCommand => ({
    type: "PlayerApplyFilter",
    params: { filter_id: filterId, params },
  }),

  playerApplyTemplate: (templateId: string, mediaIds: string[]): ProjectCommand => ({
    type: "PlayerApplyTemplate",
    params: { template_id: templateId, media_ids: mediaIds },
  }),

  playerClearEffects: (): ProjectCommand => ({
    type: "PlayerClearEffects",
  }),

  playerClearFilters: (): ProjectCommand => ({
    type: "PlayerClearFilters",
  }),

  playerClearTemplate: (): ProjectCommand => ({
    type: "PlayerClearTemplate",
  }),
}

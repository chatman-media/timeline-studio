// Export from player-machine with renamed type to avoid conflict

export type { CodecProfile, FormatDetectionResult, OptimizationSettings } from "./codec-support"
// Export new services
// Lazy initialization functions for SSR compatibility
export { getCodecSupportService } from "./codec-support"
export type { EffectChain, EffectPreviewOptions, EffectShader } from "./effects-preview"
export { getEffectsPreviewService } from "./effects-preview"
export type { ColorGradingParams, FilterLUT, FilterSettings } from "./filters-preview"
export { getFiltersPreviewService } from "./filters-preview"
export type { HDRMetadata, VideoCodecInfo } from "./hdr-support"
export { getHDRSupportService } from "./hdr-support"
export type {
  PlayerContextType as PlayerMachineContextType,
  PlayerEvent,
} from "./player-machine"
export { playerMachine } from "./player-machine"
export type {
  PlayerContextType,
  PlayerContextType,
} from "./player-provider"
// Export from player-provider
export {
  PlayerProvider,
  usePlayer,
} from "./player-provider"
export type { EasingFunction, TransitionParams, TransitionShader } from "./transitions-preview"
export { getTransitionsPreviewService } from "./transitions-preview"
export type { VideoFrame } from "./webgl-video-renderer"
export { WebGLVideoRenderer } from "./webgl-video-renderer"

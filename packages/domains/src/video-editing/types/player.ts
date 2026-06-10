/**
 * Video Player Types
 *
 * Типы для видеоплеера и воспроизведения медиа
 */

export interface PlayerState {
  isPlaying: boolean
  currentTime: number
  duration: number
  volume: number
  isLoading: boolean
  isReady: boolean
}

export interface PlaybackMode {
  mode: "normal" | "loop" | "shuffle"
  speed: number
}

export interface VideoMetadata {
  width: number
  height: number
  fps: number
  codec: string
  bitrate: number
}

export interface FrameInfo {
  frameNumber: number
  timestamp: number
  isKeyframe: boolean
}

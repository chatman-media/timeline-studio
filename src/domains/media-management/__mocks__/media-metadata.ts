/**
 * Mock Media Metadata
 *
 * Тестовые данные для медиа метаданных
 */

import type { MediaAnalysisResult, MediaInfo, MediaMetadata, QualityMetrics, SceneDetectionResult } from "../types"

export const mockVideoMetadata: MediaMetadata = {
  type: "Video",
  width: 1920,
  height: 1080,
  fps: 30,
  duration: 120.5,
  codec: "h264",
  bitrate: 5_000_000,
  hasAudio: true,
  audioCodec: "aac",
  audioChannels: 2,
  audioSampleRate: 48000,
}

export const mockAudioMetadata: MediaMetadata = {
  type: "Audio",
  duration: 180.0,
  codec: "mp3",
  channels: 2,
  sample_rate: 44100,
  bitrate: 320_000,
  album: "Test Album",
  artist: "Test Artist",
  title: "Test Track",
}

export const mockImageMetadata: MediaMetadata = {
  type: "Image",
  width: 3840,
  height: 2160,
}

export const mockQualityMetrics: QualityMetrics = {
  resolution: "1920x1080",
  bitrate: 5_000_000,
  fps: 30,
  codec: "h264",
  qualityScore: 85,
}

export const mockSceneDetectionResults: SceneDetectionResult[] = [
  {
    startTime: 0,
    endTime: 10.5,
    confidence: 0.95,
    thumbnailPath: "/tmp/scene-1.jpg",
  },
  {
    startTime: 10.5,
    endTime: 25.3,
    confidence: 0.88,
    thumbnailPath: "/tmp/scene-2.jpg",
  },
  {
    startTime: 25.3,
    endTime: 45.0,
    confidence: 0.92,
  },
]

export const mockVideoAnalysis: MediaAnalysisResult = {
  metadata: mockVideoMetadata,
  thumbnailPath: "/tmp/thumbnail.jpg",
  scenes: mockSceneDetectionResults,
  quality: mockQualityMetrics,
}

export const mockAudioAnalysis: MediaAnalysisResult = {
  metadata: mockAudioMetadata,
  waveformData: new Float32Array([0.1, 0.5, 0.8, 0.3, -0.2, -0.6, -0.4, 0.0]),
}

export const mockMediaInfo: MediaInfo = {
  path: "/test/video.mp4",
  name: "video.mp4",
  type: "Video",
  metadata: mockVideoMetadata,
  size: 102_400_000,
  duration: 120.5,
  thumbnailPath: "/tmp/thumbnail.jpg",
}

export const createMockMediaInfo = (overrides?: Partial<MediaInfo>): MediaInfo => ({
  ...mockMediaInfo,
  ...overrides,
})

export const createMockMetadata = (type: "Video" | "Audio" | "Image"): MediaMetadata => {
  switch (type) {
    case "Video":
      return { ...mockVideoMetadata }
    case "Audio":
      return { ...mockAudioMetadata }
    case "Image":
      return { ...mockImageMetadata }
  }
}

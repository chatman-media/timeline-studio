export interface BoundingBox {
  x: number
  y: number
  width: number
  height: number
}

export interface QualityMetrics {
  overall: number
  sharpness: number
  brightness: number
  contrast: number
  saturation: number
  stability: number
  noise: number
}

export interface SceneInfo {
  id: string
  type: string
  startTime: number
  endTime: number
  duration: number
  confidence: number
  description?: string
}

export enum KeyMomentType {
  CLIMAX = "climax",
  EMOTIONAL_PEAK = "emotional_peak",
  ACTION_PEAK = "action_peak",
  DIALOGUE_HIGHLIGHT = "dialogue_highlight",
  VISUAL_HIGHLIGHT = "visual_highlight",
  AUDIO_PEAK = "audio_peak",
}

export interface KeyMoment {
  id: string
  timestamp: number
  duration: number
  type: KeyMomentType
  score: number
  description: string
  sceneId: string
}

export type ContentType =
  | "narrative"
  | "documentary"
  | "tutorial"
  | "vlog"
  | "music_video"
  | "commercial"
  | "news"
  | "sports"
  | "gaming"

export type Genre =
  | "action"
  | "comedy"
  | "drama"
  | "horror"
  | "romance"
  | "scifi"
  | "documentary"
  | "educational"
  | "lifestyle"
  | "travel"
  | "tech"
  | "fashion"
  | "food"
  | "fitness"
  | "general"

export type Emotion =
  | "happy"
  | "sad"
  | "excited"
  | "calm"
  | "tense"
  | "inspiring"
  | "mysterious"
  | "romantic"
  | "comedic"
  | "dramatic"
  | "neutral"

export interface EmotionalTone {
  primary: Emotion
  secondary?: Emotion
  intensity: number
}

export interface Audience {
  ageRange: {
    min: number
    max: number
  }
  interests: string[]
  demographics: {
    primary: string
    secondary?: string[]
  }
}

export interface MediaFileInfo {
  path: string
  filename: string
  name: string
  size: number
  format: string
  duration: number
}

export interface TechnicalSpecs {
  resolution: {
    width: number
    height: number
    aspectRatio: string
  }
  frameRate: number
  bitrate: number
  codec: string
  audioChannels: number
  audioCodec: string
  audioBitrate: number
  duration: number
}

export interface ObjectDetection {
  id: string
  label: string
  confidence: number
  boundingBox: BoundingBox
  frameNumber: number
  timestamp: number
}

export interface FaceDetection {
  id: string
  personId?: string
  confidence: number
  boundingBox: BoundingBox
  emotion?: {
    emotion: Emotion
    confidence: number
  }
}

export interface TextDetection {
  text: string
  confidence: number
  boundingBox: BoundingBox
  language?: string
}

export interface AudioDetections {
  speech: Array<{
    startTime: number
    endTime: number
    text: string
    transcript?: string
    speaker?: string
    language?: string
    confidence: number
  }>
  music: Array<{
    startTime: number
    endTime: number
    genre?: string
    mood?: string
    tempo?: number
  }>
  soundEffects: Array<{
    startTime: number
    endTime: number
    type: string
    description: string
  }>
  silence: Array<{
    startTime: number
    endTime: number
    duration: number
  }>
}

export interface SceneDetection {
  sceneNumber: number
  startTime: number
  endTime: number
  duration: number
  changeScore: number
}

export interface ContentElements {
  objects: ObjectDetection[]
  faces: FaceDetection[]
  text: TextDetection[]
  activities: Array<{
    activity: string
    confidence: number
    startFrame: number
    endFrame: number
  }>
  identifiedPersons?: unknown[]
}

export interface SceneTransition {
  type: string
  direction: "incoming" | "outgoing"
  targetSceneId: string
  startTime: number
  endTime: number
  duration: number
  confidence: number
  metadata?: Record<string, unknown>
}

export interface SceneAnalysis extends SceneInfo {
  keyFrames: Array<{
    time: number
    timestamp: number
    thumbnailPath: string
    isKeyMoment: boolean
    score: number
    composition?: Record<string, unknown>
  }>
  quality: QualityMetrics
  content: ContentElements
  transitions: SceneTransition[]
}

export interface ContentDetections {
  objects: ObjectDetection[]
  faces: FaceDetection[]
  text: TextDetection[]
  audio: AudioDetections
  scenes: SceneDetection[]
}

export interface ContentInsights {
  summary: string
  highlights: string[]
  suggestions: string[]
  warnings: string[]
  opportunities: string[]
  strengths: string[]
  weaknesses: string[]
  recommendations: string[]
  marketingAngles: string[]
  targetDemographics: string[]
  qualityMetrics?: QualityMetrics
  mood?: {
    dominantEmotion: string
    intensity: number
    valence: number
    arousal: number
  }
  improvements?: string[]
}

export interface UnifiedContentAnalysis {
  mediaFile: MediaFileInfo
  scenes: SceneAnalysis[]
  keyMoments: KeyMoment[]
  contentType: ContentType
  genres: Genre[]
  mood: EmotionalTone
  targetAudience: Audience
  technicalSpecs: TechnicalSpecs
  qualityMetrics: QualityMetrics
  detections: ContentDetections
  insights: ContentInsights
  videoAnalysis?: unknown
  audioAnalysis?: unknown
}

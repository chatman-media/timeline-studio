// Types for Analysis Dashboard frontend components

export interface AnalysisProject {
  id: string
  name: string
  description?: string
  status: AnalysisStatus
  config: AnalysisConfig
  files: AnalysisMediaFile[]
  created_at: string
  updated_at: string
}

export interface AnalysisMediaFile {
  id: string
  project_id: string
  file_path: string
  file_name: string
  file_size: number
  media_type: MediaType
  duration?: number
  width?: number
  height?: number
  created_at: string
}

export enum MediaType {
  Video = "Video",
  Audio = "Audio",
  Image = "Image",
}

export enum AnalysisStatus {
  Created = "Created",
  InProgress = "InProgress",
  Completed = "Completed",
  Failed = "Failed",
  Cancelled = "Cancelled",
}

export interface AnalysisConfig {
  enable_scene_detection: boolean
  enable_person_recognition: boolean
  enable_object_detection: boolean
  enable_emotion_analysis: boolean
  enable_audio_analysis: boolean
  enable_quality_analysis: boolean
  enable_text_recognition: boolean
  quality_mode: QualityMode
  frame_skip: number
  resolution_scale: number
  scene_change_threshold: number
  face_confidence_threshold: number
  object_confidence_threshold: number
  motion_detection_threshold: number
  max_processing_time?: number
  max_memory_usage?: number
  use_gpu: boolean
  generate_thumbnails: boolean
  generate_previews: boolean
  save_keyframes: boolean
  include_raw_data: boolean
}

export enum QualityMode {
  Fast = "Fast",
  Balanced = "Balanced",
  Detailed = "Detailed",
}

export interface AnalysisProgress {
  project_id: string
  status: AnalysisStatus
  stage: AnalysisStage
  progress: number
  current_file?: string
  start_time: string
  estimated_completion?: string
  error_message?: string
}

export enum AnalysisStage {
  MediaAnalysis = "MediaAnalysis",
  SceneDetection = "SceneDetection",
  PersonRecognition = "PersonRecognition",
  EmotionAnalysis = "EmotionAnalysis",
  QualityAnalysis = "QualityAnalysis",
  AudioAnalysis = "AudioAnalysis",
  KeyMomentDetection = "KeyMomentDetection",
  DataAggregation = "DataAggregation",
  IndexGeneration = "IndexGeneration",
  Finalization = "Finalization",
}

export interface AnalysisScene {
  id: string
  project_id: string
  file_id: string
  start_time: number
  end_time: number
  duration: number
  scene_type: SceneType
  sub_type?: string
  confidence: number
  dominant_colors: string[]
  brightness: number
  contrast: number
  saturation: number
  motion_level: number
  composition_score: number
  rule_of_thirds_compliance: number
  visual_balance: number
  quality_score: number
  sharpness: number
  noise_level: number
  stability: number
  persons_present: string[]
  objects_detected: string[]
  has_text: boolean
  has_faces: boolean
  emotional_tone?: EmotionalTone
  energy_level: number
  auto_description?: string
  user_description?: string
  tags: string[]
  user_rating?: number
  representative_frame: number
  keyframes: number[]
  created_at: string
}

export enum SceneType {
  Wide = "Wide",
  Medium = "Medium",
  Closeup = "Closeup",
  Dynamic = "Dynamic",
  Static = "Static",
  Cinematic = "Cinematic",
}

export interface EmotionalTone {
  primary_emotion: string
  intensity: number
  confidence: number
  secondary_emotions: Array<{
    emotion: string
    intensity: number
  }>
}

export interface KeyMoment {
  id: string
  project_id: string
  file_id: string
  scene_id?: string
  timestamp: number
  duration: number
  moment_type: MomentType
  sub_type?: string
  importance_score: number
  scoring_factors: ScoringFactors
  description: string
  auto_description?: string
  user_notes?: string
  involved_persons: string[]
  involved_objects: string[]
  associated_emotions: string[]
  content_tags: string[]
  mood_tags: string[]
  technical_tags: string[]
  user_rating?: number
  is_bookmarked: boolean
  is_hidden: boolean
  thumbnail_frame: number
  preview_start: number
  preview_end: number
  created_at: string
  updated_at: string
}

export enum MomentType {
  ActionClimax = "ActionClimax",
  EmotionalPeak = "EmotionalPeak",
  DialogueHighlight = "DialogueHighlight",
  VisualStunning = "VisualStunning",
  ComedicMoment = "ComedicMoment",
  DramaticPause = "DramaticPause",
  SceneTransition = "SceneTransition",
  AudioPeak = "AudioPeak",
  QualityPeak = "QualityPeak",
  MotionPeak = "MotionPeak",
  UserDefined = "UserDefined",
}

export interface ScoringFactors {
  emotion_intensity: number
  emotion_variety: number
  emotional_change: number
  visual_quality: number
  composition_quality: number
  color_vibrancy: number
  motion_interest: number
  audio_clarity: number
  audio_dynamics: number
  speech_quality: number
  music_sync: number
  person_prominence: number
  object_interest: number
  scene_uniqueness: number
  narrative_importance: number
  overall_quality: number
  stability: number
  focus_quality: number
  lighting_quality: number
  weighted_score: number
  confidence: number
  ranking_position?: number
}

export interface ProjectStatistics {
  project_id: string
  total_files: number
  total_duration: number
  total_scenes: number
  total_moments: number
  total_persons: number
  average_quality: number
  scene_type_distribution: Record<SceneType, number>
  moment_type_distribution: Record<MomentType, number>
  quality_distribution: QualityDistribution
  temporal_distribution: TemporalDistribution
  dominant_emotions: string[]
  most_frequent_objects: string[]
  analysis_completion_time: number
  created_at: string
  updated_at: string
}

export interface QualityDistribution {
  excellent: number // 0.8-1.0
  good: number // 0.6-0.8
  average: number // 0.4-0.6
  poor: number // 0-0.4
}

export interface TemporalDistribution {
  scenes_per_minute: number
  moments_per_minute: number
  average_scene_duration: number
}

export interface AnalysisSearchResult {
  id: string
  result_type: SearchResultType
  title: string
  description: string
  timestamp?: number
  file_id: string
  relevance_score: number
  highlight_text?: string
  thumbnail_url?: string
}

export enum SearchResultType {
  Scene = "Scene",
  Moment = "Moment",
  Person = "Person",
  Object = "Object",
  Emotion = "Emotion",
  Tag = "Tag",
}

// Dashboard specific types
export interface DashboardData {
  projects: AnalysisProject[]
  activeProject?: AnalysisProject
  progress?: AnalysisProgress
  statistics?: ProjectStatistics
  recentScenes: AnalysisScene[]
  topMoments: KeyMoment[]
}

export interface AnalysisFilter {
  dateRange?: {
    start: string
    end: string
  }
  status?: AnalysisStatus[]
  mediaTypes?: MediaType[]
  sceneTypes?: SceneType[]
  momentTypes?: MomentType[]
  qualityRange?: {
    min: number
    max: number
  }
  persons?: string[]
  tags?: string[]
}

export interface AnalysisSort {
  field: "created_at" | "name" | "progress" | "quality_score" | "importance_score"
  direction: "asc" | "desc"
}

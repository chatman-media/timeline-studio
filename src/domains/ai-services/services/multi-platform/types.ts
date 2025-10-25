/**
 * Типы для Multi-Platform Engine
 */

import { AspectRatio } from "lightningcss"
import { AdaptedContent, PlatformId } from "../../types"
import { UnifiedContentAnalysis } from "@/domains/ai-services/types/unified-analysis"
import { GeneratedScript } from "../script-generation"

export interface MultiPlatformConfig {
  // Настройки адаптации
  adaptation: {
    autoDetectBestFormat: boolean
    preserveOriginalQuality: boolean
    optimizeForMobile: boolean
    generateThumbnails: boolean
    generatePreviews: boolean
  }

  // Языковые настройки
  language: {
    autoTranslate: boolean
    translationService: "deepl" | "google" | "openai"
    preserveOriginalAudio: boolean
    generateSubtitles: boolean
    dubbing: boolean
  }

  // Настройки обработки
  processing: {
    parallel: boolean
    maxConcurrent: number
    priority: "quality" | "speed" | "balanced"
    cacheResults: boolean
  }

  // AI настройки
  ai: {
    model: string
    temperature: number
    enhanceDescriptions: boolean
    generateHashtags: boolean
    optimizeSEO: boolean
  }
}

export interface PlatformAdaptationContext {
  analysis: UnifiedContentAnalysis
  script?: GeneratedScript
  targetPlatform: Platform
  sourceLanguage: string
  targetLanguages: string[]
  userPreferences?: UserPreferences
}

export interface UserPreferences {
  brandingElements?: BrandingConfig
  styleGuide?: StyleGuide
  contentGuidelines?: PlatformContentGuidelines
  targetAudience?: AudienceProfile
}

export interface BrandingConfig {
  logo?: ImageAsset
  watermark?: WatermarkConfig
  colors: ColorPalette
  fonts: FontConfig
  intros?: VideoAsset[]
  outros?: VideoAsset[]
}

export interface ImageAsset {
  url: string
  width: number
  height: number
  format: string
}

export interface VideoAsset {
  url: string
  duration: number
  format: string
}

export interface WatermarkConfig {
  image: ImageAsset
  position: "top-left" | "top-right" | "bottom-left" | "bottom-right" | "center"
  opacity: number
  scale: number
}

export interface ColorPalette {
  primary: string
  secondary: string
  accent: string
  background: string
  text: string
}

export interface FontConfig {
  heading: FontSettings
  body: FontSettings
  caption: FontSettings
}

export interface FontSettings {
  family: string
  weight: number
  size: number
  lineHeight: number
}

export interface StyleGuide {
  visualStyle: "minimal" | "bold" | "elegant" | "playful" | "professional"
  colorGrading: "natural" | "vibrant" | "muted" | "cinematic" | "vintage"
  transitionStyle: "cuts" | "smooth" | "dynamic" | "creative"
  textAnimation: "none" | "subtle" | "dynamic" | "kinetic"
}

export interface PlatformContentGuidelines {
  tone: "casual" | "professional" | "educational" | "entertaining" | "inspirational"
  pacing: "slow" | "moderate" | "fast" | "variable"
  musicStyle?: "upbeat" | "calm" | "dramatic" | "minimal" | "none"
  avoidTopics?: string[]
  requiredElements?: string[]
}

export interface AudienceProfile {
  ageRange: { min: number; max: number }
  interests: string[]
  location?: string[]
  language: string[]
  techSavvy: "low" | "medium" | "high"
}

export interface AdaptationStrategy {
  platform: PlatformId
  videoStrategy: VideoAdaptationStrategy
  audioStrategy: AudioAdaptationStrategy
  textStrategy: TextAdaptationStrategy
  graphicsStrategy: GraphicsAdaptationStrategy
  timingStrategy: TimingAdaptationStrategy
}

export interface VideoAdaptationStrategy {
  targetResolution: VideoResolution
  targetAspectRatio: AspectRatio
  cropStrategy: "center" | "smart" | "manual" | "none"
  qualityPreset: "preserve" | "optimize" | "compress"
  enhancementFilters?: VideoEnhancement[]
}

export interface VideoResolution {
  width: number
  height: number
  label: string // e.g., "1080p", "4K"
}

export interface VideoEnhancement {
  type: "stabilization" | "denoise" | "sharpen" | "color_correction" | "upscale"
  intensity: number // 0-1
  params?: Record<string, any>
}

export interface AudioAdaptationStrategy {
  normalize: boolean
  compressDynamics: boolean
  enhanceVoice: boolean
  removeBackground: boolean
  targetLoudness: number // LUFS
  addBackgroundMusic?: {
    style: string
    volume: number
    fadeIn: boolean
    fadeOut: boolean
  }
}

export interface TextAdaptationStrategy {
  generateTitle: boolean
  generateDescription: boolean
  generateHashtags: boolean
  hashtagCount: number
  seoOptimization: boolean
  callToAction: CTAConfig
  localization: LocalizationConfig
}

export interface CTAConfig {
  type: "subscribe" | "like" | "share" | "visit" | "buy" | "custom"
  text: string
  placement: "beginning" | "middle" | "end"
  style: "subtle" | "prominent" | "animated"
}

export interface LocalizationConfig {
  translateTitle: boolean
  translateDescription: boolean
  adaptCulturally: boolean
  useLocalTrends: boolean
}

export interface GraphicsAdaptationStrategy {
  addIntro: boolean
  addOutro: boolean
  addLowerThirds: boolean
  addCaptions: CaptionConfig
  addProgress: boolean
  addBranding: boolean
  overlays: OverlayConfig[]
}

export interface CaptionConfig {
  style: "minimal" | "bold" | "animated" | "custom"
  position: "top" | "center" | "bottom"
  backgroundColor?: string
  textColor?: string
  font?: string
  autoGenerate: boolean
  burnIn: boolean // Жёсткие субтитры
}

export interface OverlayConfig {
  type: "text" | "image" | "shape" | "animation"
  content: any
  timing: { start: number; end: number }
  position: { x: number; y: number }
  animation?: AnimationConfig
}

export interface AnimationConfig {
  type: "fade" | "slide" | "scale" | "rotate" | "custom"
  duration: number
  easing: string
  params?: Record<string, any>
}

export interface TimingAdaptationStrategy {
  targetDuration?: number
  speedAdjustment?: number // 0.5x - 2x
  trimStrategy: "smart" | "manual" | "none"
  highlights: HighlightConfig[]
  loops?: LoopConfig[]
}

export interface HighlightConfig {
  start: number
  end: number
  importance: number // 0-1
  keepAudio: boolean
}

export interface LoopConfig {
  start: number
  end: number
  count: number
  seamless: boolean
}

export interface BatchAdaptationRequest {
  sourceContent: SourceContent
  targetPlatforms: PlatformId[]
  languages: string[]
  strategies: AdaptationStrategy[]
  preferences?: UserPreferences
}

export interface SourceContent {
  analysis: UnifiedContentAnalysis
  script?: GeneratedScript
  mediaFiles: MediaFile[]
  metadata?: ContentMetadata
}

export interface MediaFile {
  id: string
  path: string
  type: "video" | "audio" | "image"
  duration?: number
  metadata?: Record<string, any>
}

export interface ContentMetadata {
  title?: string
  description?: string
  tags?: string[]
  category?: string
  copyright?: string
  credits?: string[]
}

export interface AdaptationResult {
  platform: PlatformId
  content: AdaptedContent
  quality: AdaptationQuality
  issues?: AdaptationIssue[]
  suggestions?: string[]
}

export interface AdaptationQuality {
  overall: number // 0-1
  video: number
  audio: number
  text: number
  engagement: number
  technical: number
}

export interface AdaptationIssue {
  type: "warning" | "error"
  category: "video" | "audio" | "text" | "timing" | "platform"
  message: string
  severity: "low" | "medium" | "high"
  suggestion?: string
}

export interface PlatformOptimizationResult {
  recommendedSettings: Partial<AdaptationStrategy>
  estimatedPerformance: PerformanceMetrics
  competitorAnalysis?: CompetitorInsights
  trendingElements?: TrendingElements
}

export interface PerformanceMetrics {
  estimatedViews: { min: number; max: number }
  engagementRate: number // 0-1
  shareability: number // 0-1
  algorithmScore: number // 0-1
}

export interface CompetitorInsights {
  similarContent: SimilarContent[]
  avgPerformance: PerformanceMetrics
  successFactors: string[]
}

export interface SimilarContent {
  title: string
  platform: PlatformId
  views: number
  engagement: number
  publishDate: Date
  tags: string[]
}

export interface TrendingElements {
  hashtags: string[]
  sounds?: string[]
  effects?: string[]
  topics: string[]
  formats: string[]
}

// Platform Adaptation Types

import type { ContentType } from "./content-analysis"

// Platform Types
export interface Platform {
  id: PlatformId
  name: string
  specifications: PlatformSpecs
  bestPractices: BestPractices
  algorithms: AlgorithmPreferences
}

export enum PlatformId {
  YOUTUBE = "youtube",
  YOUTUBE_SHORTS = "youtube_shorts",
  TIKTOK = "tiktok",
  INSTAGRAM_REELS = "instagram_reels",
  INSTAGRAM_FEED = "instagram_feed",
  INSTAGRAM_STORIES = "instagram_stories",
  FACEBOOK = "facebook",
  TWITTER = "twitter",
  TELEGRAM = "telegram",
  LINKEDIN = "linkedin",
  VIMEO = "vimeo",
  TWITCH = "twitch",
  SNAPCHAT = "snapchat",
}

export interface PlatformSpecs {
  videoSpecs: VideoSpecs
  audioSpecs: AudioSpecs
  duration: DurationLimits
  fileSize: FileSizeLimits
  features: PlatformFeatures
}

export interface VideoSpecs {
  resolution: PlatformResolution[]
  aspectRatio: AspectRatio[]
  frameRate: number[]
  codec: string[]
  bitrate: BitrateLimits
}

export interface PlatformResolution {
  width: number
  height: number
  preferred: boolean
}

export interface AspectRatio {
  ratio: string
  width: number
  height: number
  preferred: boolean
}

export interface BitrateLimits {
  min: number
  max: number
  recommended: number
}

export interface AudioSpecs {
  channels: number[]
  sampleRate: number[]
  codec: string[]
  bitrate: BitrateLimits
}

export interface DurationLimits {
  min: number
  max: number
  optimal: DurationRange
}

export interface DurationRange {
  min: number
  max: number
}

export interface FileSizeLimits {
  max: number
  recommended: number
}

export interface PlatformFeatures {
  captions: boolean
  hashtags: boolean
  mentions: boolean
  thumbnails: boolean
  endScreens: boolean
  chapters: boolean
  polls: boolean
  stickers: boolean
}

// Best Practices
export interface BestPractices {
  engagement: EngagementTips
  content: ContentGuidelines
  timing: PostingStrategy
  optimization: OptimizationTips
}

export interface EngagementTips {
  hookDuration: number // First X seconds
  ctaPlacement: CTAPlacement[]
  interactionPrompts: string[]
}

export interface CTAPlacement {
  timing: "beginning" | "middle" | "end"
  duration: number
  type: CTAType
}

export enum CTAType {
  SUBSCRIBE = "subscribe",
  LIKE = "like",
  COMMENT = "comment",
  SHARE = "share",
  FOLLOW = "follow",
  VISIT = "visit",
  SWIPE_UP = "swipe_up",
  LINK_IN_BIO = "link_in_bio",
}

export interface ContentGuidelines {
  preferredTypes: ContentType[]
  avoidTypes: ContentType[]
  toneRecommendations: string[]
  visualStyle: string[]
}

export interface PostingStrategy {
  optimalTimes: TimeSlot[]
  frequency: PostingFrequency
  consistency: string
}

export interface TimeSlot {
  dayOfWeek: DayOfWeek
  startHour: number
  endHour: number
  timezone: string
}

export enum DayOfWeek {
  MONDAY = "monday",
  TUESDAY = "tuesday",
  WEDNESDAY = "wednesday",
  THURSDAY = "thursday",
  FRIDAY = "friday",
  SATURDAY = "saturday",
  SUNDAY = "sunday",
}

export interface PostingFrequency {
  min: number
  max: number
  unit: "day" | "week" | "month"
}

export interface OptimizationTips {
  seo: SEOGuidelines
  thumbnails: ThumbnailGuidelines
  accessibility: AccessibilityGuidelines
}

export interface SEOGuidelines {
  titleLength: LengthLimits
  descriptionLength: LengthLimits
  keywordDensity: number
  hashtagCount: LengthLimits
}

export interface LengthLimits {
  min: number
  max: number
  optimal: number
}

export interface ThumbnailGuidelines {
  resolution: PlatformResolution
  textOverlay: boolean
  contrast: number
  brandingPlacement: string
}

export interface AccessibilityGuidelines {
  captions: CaptionRequirements
  audioDescription: boolean
  colorContrast: number
}

export interface CaptionRequirements {
  required: boolean
  languages: string[]
  accuracy: number
}

// Algorithm Preferences
export interface AlgorithmPreferences {
  signals: EngagementSignal[]
  weights: SignalWeight[]
  penalties: ContentPenalty[]
}

export interface EngagementSignal {
  type: SignalType
  importance: PlatformImportance
  timeframe: number // seconds
}

export enum SignalType {
  VIEW_DURATION = "view_duration",
  LIKES = "likes",
  COMMENTS = "comments",
  SHARES = "shares",
  SAVES = "saves",
  REPLAYS = "replays",
  PROFILE_VISITS = "profile_visits",
  FOLLOW_RATE = "follow_rate",
}

export interface SignalWeight {
  signal: SignalType
  weight: number // 0-1
}

export interface ContentPenalty {
  type: PenaltyType
  severity: number // 0-1
  description: string
}

export enum PenaltyType {
  LOW_QUALITY = "low_quality",
  CLICKBAIT = "clickbait",
  REPOST = "repost",
  SPAM = "spam",
  INAPPROPRIATE = "inappropriate",
}

// Adapted Content
export interface AdaptedContent {
  id: string
  platform: PlatformId
  originalContent: ContentReference
  adaptations: ContentAdaptation
  metadata: AdaptationMetadata
  preview?: ContentPreview
  // Additional fields for extended functionality
  platformId?: PlatformId
  platformName?: string
  duration?: number
  fileSize?: number
  quality?: {
    video: number
    audio: number
    overall: number
  }
  format?: {
    container: string
    videoCodec: string
    audioCodec: string
  }
  optimizations?: {
    compressed: boolean
    enhanced: boolean
    aiProcessed: boolean
  }
  processingDetails?: {
    adaptationDate: Date
    strategy: any
    hooks: any[]
    callToActions: any[]
    brandingApplied: boolean
  }
}

export interface ContentReference {
  scriptId?: string
  sceneIds: string[]
  duration: number
}

export interface ContentAdaptation {
  video: VideoAdaptation
  audio: AudioAdaptation
  text: TextAdaptation
  graphics: GraphicsAdaptation
  timing: TimingAdaptation
}

export interface VideoAdaptation {
  resolution: PlatformResolution
  aspectRatio: AspectRatio
  frameRate: number
  codec: string
  bitrate: number
  filters?: VideoFilter[]
  crops?: CropArea[]
}

export interface VideoFilter {
  type: FilterType
  intensity: number
  timing?: PlatformTiming
}

export enum FilterType {
  BRIGHTNESS = "brightness",
  CONTRAST = "contrast",
  SATURATION = "saturation",
  BLUR = "blur",
  SHARPEN = "sharpen",
  VIGNETTE = "vignette",
  COLOR_GRADE = "color_grade",
}

export interface CropArea {
  x: number
  y: number
  width: number
  height: number
  timing: PlatformTiming
}

export interface AudioAdaptation {
  volume: VolumeAdjustment[]
  compression: AudioCompression
  normalization: boolean
  enhancements: AudioEnhancement[]
}

export interface VolumeAdjustment {
  level: number // 0-1
  timing: PlatformTiming
}

export interface AudioCompression {
  threshold: number
  ratio: number
  attack: number
  release: number
}

export interface AudioEnhancement {
  type: EnhancementType
  intensity: number
}

export enum EnhancementType {
  NOISE_REDUCTION = "noise_reduction",
  EQ = "eq",
  REVERB = "reverb",
  LIMITING = "limiting",
}

export interface TextAdaptation {
  title: LocalizedText
  description: LocalizedText
  captions: CaptionAdaptation
  hashtags: string[]
  mentions: string[]
}

export interface LocalizedText {
  text: string
  language: string
  characterCount: number
}

export interface CaptionAdaptation {
  enabled: boolean
  style: CaptionStyle
  language: string
  content: Caption[]
  translations?: Record<string, Caption[]>
}

export interface CaptionStyle {
  font: string
  size: number
  color: string
  background: string
  position: CaptionPosition
}

export enum CaptionPosition {
  TOP = "top",
  CENTER = "center",
  BOTTOM = "bottom",
}

export interface Caption {
  text: string
  startTime: number
  endTime: number
}

export interface GraphicsAdaptation {
  overlays: GraphicOverlay[]
  watermark?: Watermark
  endScreen?: EndScreen
  thumbnail?: Thumbnail
}

export interface GraphicOverlay {
  type: OverlayType
  content: string | ImageData
  position: Position
  timing: PlatformTiming
  animation?: Animation
}

export enum OverlayType {
  TEXT = "text",
  IMAGE = "image",
  LOGO = "logo",
  CTA = "cta",
  PROGRESS_BAR = "progress_bar",
  TIMER = "timer",
}

export interface Position {
  x: number
  y: number
  anchor: Anchor
}

export enum Anchor {
  TOP_LEFT = "top_left",
  TOP_CENTER = "top_center",
  TOP_RIGHT = "top_right",
  CENTER_LEFT = "center_left",
  CENTER = "center",
  CENTER_RIGHT = "center_right",
  BOTTOM_LEFT = "bottom_left",
  BOTTOM_CENTER = "bottom_center",
  BOTTOM_RIGHT = "bottom_right",
}

export interface Animation {
  type: AnimationType
  duration: number
  easing: EasingFunction
}

export enum AnimationType {
  FADE_IN = "fade_in",
  FADE_OUT = "fade_out",
  SLIDE_IN = "slide_in",
  SLIDE_OUT = "slide_out",
  SCALE = "scale",
  ROTATE = "rotate",
  BOUNCE = "bounce",
}

export enum EasingFunction {
  LINEAR = "linear",
  EASE_IN = "ease_in",
  EASE_OUT = "ease_out",
  EASE_IN_OUT = "ease_in_out",
  BOUNCE = "bounce",
  ELASTIC = "elastic",
}

export interface Watermark {
  image: ImageData
  position: Position
  opacity: number
  size: Size
}

export interface Size {
  width: number
  height: number
}

export interface EndScreen {
  template: EndScreenTemplate
  elements: EndScreenElement[]
  duration: number
}

export enum EndScreenTemplate {
  GRID = "grid",
  SIDEBAR = "sidebar",
  FULLSCREEN = "fullscreen",
  MINIMAL = "minimal",
}

export interface EndScreenElement {
  type: EndScreenElementType
  content: any
  position: Position
  size: Size
  link?: string
}

export enum EndScreenElementType {
  VIDEO = "video",
  PLAYLIST = "playlist",
  SUBSCRIBE = "subscribe",
  CHANNEL = "channel",
  LINK = "link",
}

export interface Thumbnail {
  image: ImageData
  text?: ThumbnailText
  branding?: BrandingElement[]
}

export interface ThumbnailText {
  primary: string
  secondary?: string
  style: TextStyle
}

export interface TextStyle {
  font: string
  size: number
  color: string
  weight: FontWeight
  shadow?: Shadow
}

export enum FontWeight {
  LIGHT = "light",
  REGULAR = "regular",
  MEDIUM = "medium",
  BOLD = "bold",
  BLACK = "black",
}

export interface Shadow {
  x: number
  y: number
  blur: number
  color: string
}

export interface BrandingElement {
  type: "logo" | "text" | "color"
  content: any
  position: Position
  size: Size
}

export interface TimingAdaptation {
  cuts: Cut[]
  speed: SpeedAdjustment[]
  loops?: Loop[]
}

export interface Cut {
  startTime: number
  endTime: number
  transition?: TransitionEffect
}

export interface TransitionEffect {
  type: PlatformTransitionType
  duration: number
}

export enum PlatformTransitionType {
  CUT = "cut",
  FADE = "fade",
  DISSOLVE = "dissolve",
  WIPE = "wipe",
  SLIDE = "slide",
  ZOOM = "zoom",
}

export interface SpeedAdjustment {
  factor: number // 0.5 = slow motion, 2.0 = double speed
  timing: PlatformTiming
  smoothing: boolean
}

export interface Loop {
  startTime: number
  endTime: number
  count: number
}

// Adaptation Metadata
export interface AdaptationMetadata {
  createdAt: Date
  language: string
  targetRegion?: string
  tags: string[]
  analytics?: AnalyticsSetup
  // Extended metadata fields
  title?: string
  description?: string
  hashtags?: string[]
  mentions?: string[]
  translations?: Record<
    string,
    {
      title: string
      description: string
      hashtags: string[]
    }
  >
  culturalAdaptations?: Record<string, any>
}

export interface AnalyticsSetup {
  trackingId?: string
  events: TrackingEvent[]
  goals: AnalyticsGoal[]
}

export interface TrackingEvent {
  name: string
  trigger: EventTrigger
  parameters?: Record<string, any>
}

export enum EventTrigger {
  VIEW = "view",
  PLAY = "play",
  PAUSE = "pause",
  COMPLETE = "complete",
  CLICK = "click",
  SHARE = "share",
  LIKE = "like",
  COMMENT = "comment",
}

export interface AnalyticsGoal {
  type: GoalType
  target: number
  timeframe: number // days
}

export enum GoalType {
  VIEWS = "views",
  ENGAGEMENT_RATE = "engagement_rate",
  WATCH_TIME = "watch_time",
  SHARES = "shares",
  CONVERSIONS = "conversions",
}

// Content Preview
export interface ContentPreview {
  thumbnail: string
  duration: number
  fileSize: number
  dimensions: Dimensions
}

export interface Dimensions {
  width: number
  height: number
}

// Common Types
export interface PlatformTiming {
  start: number
  end: number
}

export interface ImageData {
  url?: string
  base64?: string
  path?: string
}

export enum PlatformImportance {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  CRITICAL = "critical",
}

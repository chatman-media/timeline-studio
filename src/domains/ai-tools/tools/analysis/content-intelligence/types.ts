/**
 * Content Intelligence Types
 * Типы для интеллектуального анализа контента
 */

// Типы для интеллектуального анализа контента
export interface ContentIntelligenceInput {
  operation:
    | "analyze_content"
    | "detect_scenes"
    | "classify_content"
    | "adapt_platform"
    | "generate_multilanguage"
    | "generate_variants"
    | "analyze_audience"
    | "optimize_engagement"
  mediaFiles?: string[]
  analysisDepth?: "quick" | "normal" | "deep"
  targetPlatforms?: ("youtube" | "tiktok" | "instagram" | "telegram" | "twitter" | "facebook" | "linkedin")[]
  languages?: string[]
  enablePersonTracking?: boolean
  generateScript?: boolean
  sourceContent?: {
    script?: string
    scenes?: any[]
    metadata?: any
  }
  targetPlatform?:
    | "youtube_long"
    | "youtube_shorts"
    | "tiktok"
    | "instagram_reels"
    | "instagram_igtv"
    | "facebook"
    | "linkedin"
    | "twitter"
    | "telegram"
  adaptationDepth?: "basic" | "advanced" | "algorithm_optimized"
  includeSeo?: boolean
  generateVariants?: number
  targetLanguages?: string[]
  localizationLevel?: "translation" | "localization" | "cultural_adaptation"
  maintainTiming?: boolean
  culturalSensitivity?: boolean
  variantStrategies?: ("emotional_tone" | "content_length" | "hook_style" | "cta_approach" | "visual_style")[]
  contentGoal?: "engagement" | "conversion" | "awareness" | "education" | "entertainment"
  testingMetrics?: ("ctr" | "engagement" | "retention" | "conversion")[]
  audienceSegments?: ("demographic" | "behavioral" | "psychographic" | "contextual")[]
  analysisScope?: "full_content" | "key_moments" | "audience_segments" | "performance_factors"
  competitorBenchmarking?: boolean
  predictiveModeling?: boolean
  engagementFactors?: ("thumbnail" | "title" | "hook" | "pacing" | "music" | "effects" | "cta")[]
  optimizationGoals?: ("reach" | "engagement" | "retention" | "conversion" | "virality")[]
  platformAlgorithms?: boolean
  timeRange?: {
    start: number
    end: number
  }
  includeRecommendations?: boolean
  generateReport?: boolean
  reason: string
}

export interface ContentAnalysisResult {
  analysisType: string
  sceneDetection?: {
    scenes: Array<{
      startTime: number
      endTime: number
      type: string
      confidence: number
      keyElements: string[]
    }>
    totalScenes: number
    avgSceneLength: number
  }
  contentClassification?: {
    genre: string
    style: string
    mood: string
    target_audience: string
    content_rating: string
    topics: string[]
  }
  personTracking?: {
    detectedPersons: Array<{
      id: string
      appearances: Array<{
        startTime: number
        endTime: number
        confidence: number
      }>
    }>
    totalPersons: number
  }
  scriptGeneration?: {
    generatedScript: string
    structure: {
      intro: string
      body: string[]
      conclusion: string
    }
    timing: Array<{
      text: string
      startTime: number
      endTime: number
    }>
  }
  platformAdaptation?: {
    platform: string
    optimizations: {
      duration?: number
      aspectRatio?: string
      thumbnailSuggestions?: string[]
      titleVariations?: string[]
      descriptionOptimized?: string
      hashtagSuggestions?: string[]
      bestPostingTimes?: string[]
    }
  }
  audienceAnalysis?: {
    segments: Array<{
      name: string
      characteristics: string[]
      engagement_prediction: number
      content_preferences: string[]
    }>
    overallScore: number
  }
  engagementOptimization?: {
    currentScore: number
    improvementAreas: Array<{
      factor: string
      currentRating: number
      suggestions: string[]
      potential_impact: number
    }>
    predictedImprovement: number
  }
}

export interface ContentVariant {
  id: string
  strategy: string
  changes: Array<{
    element: string
    original: string
    modified: string
    rationale: string
  }>
  predictedPerformance: {
    engagement: number
    retention: number
    conversion: number
  }
}

export interface ContentIntelligenceResult {
  operation: string
  success: boolean
  processedFiles: string[]
  analysisResults?: ContentAnalysisResult
  contentVariants?: ContentVariant[]
  multiLanguageVersions?: Array<{
    language: string
    content: any
    culturalAdaptations: string[]
  }>
  statistics: {
    totalFiles: number
    processingTime: number
    analysisDepth: string
    confidenceScore: number
  }
  recommendations: string[]
  warnings?: string[]
  nextActions: string[]
}

// Интерфейсы для совместимости со старым API
export interface ContentIntelligenceToolResult {
  success: boolean
  message: string
  data?: {
    contentAnalysis?: any
    sceneDetection?: any
    contentClassification?: any
    platformAdaptation?: any
    multiLanguageVersions?: any[]
    contentVariants?: any[]
    audienceAnalysis?: any
    engagementOptimization?: any
    recommendations?: string[]
    warnings?: string[]
  }
  errors?: string[]
  nextActions?: string[]
}

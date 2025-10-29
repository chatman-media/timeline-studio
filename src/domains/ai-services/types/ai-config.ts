/**
 * AI Configuration types
 */

// AI Provider configuration
export interface AIConfig {
  provider: AIProvider
  model: string
  apiKey?: string
  baseUrl?: string
  temperature?: number
  maxTokens?: number
  stream?: boolean
  timeout?: number
  retryAttempts?: number
  customHeaders?: Record<string, string>
}

export type AIProvider = 
  | "openai"
  | "claude"
  | "grok"
  | "deepseek"
  | "ollama"
  | "custom"

// Intelligent content analysis result
export interface IntelligentContent {
  id: string
  type: "video" | "audio" | "text" | "mixed"
  analysis: {
    summary: string
    keyPoints: string[]
    sentiment: SentimentAnalysis
    topics: string[]
    entities: Entity[]
    quality: QualityAssessment
  }
  suggestions: ContentSuggestion[]
  metadata: {
    analyzedAt: Date
    model: string
    confidence: number
  }
}

export interface SentimentAnalysis {
  overall: "positive" | "negative" | "neutral" | "mixed"
  score: number // -1 to 1
  emotions: {
    joy: number
    sadness: number
    anger: number
    fear: number
    surprise: number
    disgust: number
  }
}

export interface Entity {
  type: "person" | "place" | "organization" | "product" | "event"
  name: string
  relevance: number
  mentions: number
}

export interface QualityAssessment {
  overall: number // 0-100
  technical: number
  content: number
  engagement: number
  accessibility: number
}

export interface ContentSuggestion {
  type: "improvement" | "warning" | "opportunity"
  category: string
  message: string
  priority: "low" | "medium" | "high"
  actionable: boolean
}
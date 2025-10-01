/**
 * AI Services Domain Events
 *
 * События домена AI сервисов
 */

import type { MediaFile, MontagePlan } from "@/domains/ai-services/types/montage-planner"

// === Chat Events ===

export interface ChatMessageSentEvent {
  sessionId: string
  message: {
    id: string
    content: string
    role: "user" | "assistant"
  }
}

export interface ChatResponseReceivedEvent {
  sessionId: string
  message: {
    id: string
    content: string
    role: "assistant"
  }
  tokens?: number
  model?: string
}

export interface ChatTimelineCreatedEvent {
  sessionId: string
  timelineId: string
  prompt: string
  mediaFiles: MediaFile[]
}

// === Content Intelligence Events ===

export interface ContentAnalysisStartedEvent {
  analysisId: string
  mediaFiles: MediaFile[]
  analysisTypes: string[]
}

export interface ContentAnalysisCompletedEvent {
  analysisId: string
  results: {
    scenes?: any[]
    objects?: any[]
    emotions?: any[]
    transcript?: string
  }
  duration: number
}

export interface ScriptGeneratedEvent {
  scriptId: string
  mediaFiles: MediaFile[]
  scriptType: string
  language: string
  content: string
}

// === Montage Planner Events ===

export interface MontagePlanGeneratedEvent {
  planId: string
  plan: MontagePlan
  mediaFiles: MediaFile[]
  style: string
  duration: number
}

export interface MontagePlanAppliedEvent {
  planId: string
  timelineId: string
  fragmentsApplied: number
}

// === Recognition Events ===

export interface PersonsIdentifiedEvent {
  videoId: string
  persons: Array<{
    id: string
    name?: string
    confidence: number
    appearances: number
  }>
}

export interface ObjectsDetectedEvent {
  frameId: string
  objects: Array<{
    type: string
    confidence: number
    bbox: [number, number, number, number]
  }>
}

// === Event Type Constants ===

export const AI_SERVICES_EVENTS = {
  // Chat
  CHAT_MESSAGE_SENT: "ai-services.chat.message-sent",
  CHAT_RESPONSE_RECEIVED: "ai-services.chat.response-received",
  CHAT_TIMELINE_CREATED: "ai-services.chat.timeline-created",

  // Content Intelligence
  CONTENT_ANALYSIS_STARTED: "ai-services.content.analysis-started",
  CONTENT_ANALYSIS_COMPLETED: "ai-services.content.analysis-completed",
  SCRIPT_GENERATED: "ai-services.content.script-generated",

  // Montage Planner
  MONTAGE_PLAN_GENERATED: "ai-services.montage.plan-generated",
  MONTAGE_PLAN_APPLIED: "ai-services.montage.plan-applied",

  // Recognition
  PERSONS_IDENTIFIED: "ai-services.recognition.persons-identified",
  OBJECTS_DETECTED: "ai-services.recognition.objects-detected",
} as const

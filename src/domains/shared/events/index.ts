/**
 * Domain Events
 *
 * Централизованный экспорт всех событий и EventBus
 */

// Domain-specific events
export * from "./ai-services-events"
// Core exports
export * from "./domain-event"
export * from "./domain-event-bus"
export * from "./media-management-events"
export * from "./project-management-events"
export * from "./system-integration-events"
export * from "./video-editing-events"

// Объединенный объект всех событий для удобства
import { AI_SERVICES_EVENTS } from "./ai-services-events"
import { MEDIA_MANAGEMENT_EVENTS } from "./media-management-events"
import { PROJECT_MANAGEMENT_EVENTS } from "./project-management-events"
import { SYSTEM_INTEGRATION_EVENTS } from "./system-integration-events"
import { VIDEO_EDITING_EVENTS } from "./video-editing-events"

export const DOMAIN_EVENTS = {
  AI_SERVICES: AI_SERVICES_EVENTS,
  MEDIA: MEDIA_MANAGEMENT_EVENTS,
  VIDEO: VIDEO_EDITING_EVENTS,
  PROJECT: PROJECT_MANAGEMENT_EVENTS,
  SYSTEM: SYSTEM_INTEGRATION_EVENTS,
} as const

// Type helpers
export type AllEventTypes =
  | (typeof AI_SERVICES_EVENTS)[keyof typeof AI_SERVICES_EVENTS]
  | (typeof MEDIA_MANAGEMENT_EVENTS)[keyof typeof MEDIA_MANAGEMENT_EVENTS]
  | (typeof VIDEO_EDITING_EVENTS)[keyof typeof VIDEO_EDITING_EVENTS]
  | (typeof PROJECT_MANAGEMENT_EVENTS)[keyof typeof PROJECT_MANAGEMENT_EVENTS]
  | (typeof SYSTEM_INTEGRATION_EVENTS)[keyof typeof SYSTEM_INTEGRATION_EVENTS]

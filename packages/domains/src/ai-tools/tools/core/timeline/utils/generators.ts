/**
 * Генераторы ID для различных сущностей Timeline
 */

export function generateProjectId(): string {
  return `project_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`
}

export function generateTrackId(): string {
  return `track_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`
}

export function generateClipId(): string {
  return `clip_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`
}

export function generateSectionId(): string {
  return `section_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`
}

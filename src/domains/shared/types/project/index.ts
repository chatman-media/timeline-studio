/**
 * Project Types
 *
 * Типы для настроек проекта, разрешений и параметров
 */

export * from "./settings"

// Re-export ProjectFile from features/project-settings for backward compatibility
export type { ProjectFile } from "@/features/project-settings/types/project"

/**
 * Timeline Studio Project - новая унифицированная структура проекта
 * Вдохновлено лучшими практиками DaVinci Resolve, Adobe Premiere Pro и Final Cut Pro
 *
 * Canonical source in domains/project-management/types
 */

import type { MediaPool, MediaPoolItem } from "@/domains/media-management"
import type { ProjectSettings } from "@/domains/shared/types/project"
import type { Sequence } from "@/domains/video-editing/types"

/**
 * Метаданные проекта
 */
export interface ProjectMetadata {
  /** Уникальный идентификатор проекта */
  id: string

  /** Название проекта */
  name: string

  /** Версия формата файла (для миграций) */
  version: string

  /** Дата создания */
  created: Date

  /** Дата последнего изменения */
  modified: Date

  /** Автор проекта */
  author?: string

  /** Описание проекта */
  description?: string

  /** Теги для организации */
  tags?: string[]

  /** Путь к превью проекта */
  thumbnail?: string

  /** Платформа создания */
  platform: "windows" | "macos" | "linux"

  /** Версия приложения */
  appVersion: string
}

/**
 * Настройки экспорта
 */
export interface ExportPreset {
  id: string
  name: string
  format: "mp4" | "mov" | "webm" | "prores" | "dnxhd"
  settings: {
    video: {
      codec: string
      bitrate: number
      quality: "low" | "medium" | "high" | "best"
      resolution?: { width: number; height: number }
      frameRate?: number
    }
    audio: {
      codec: string
      bitrate: number
      sampleRate: number
      channels: number
    }
    container: {
      fastStart?: boolean
      metadata?: Record<string, string>
    }
  }
}

/**
 * Кэш проекта
 */
export interface ProjectCache {
  /** Миниатюры медиафайлов */
  thumbnails: Map<
    string,
    {
      path: string
      generated: Date
      size: "small" | "medium" | "large"
    }
  >

  /** Волновые формы аудио */
  waveforms: Map<
    string,
    {
      data: Float32Array
      generated: Date
      resolution: number
    }
  >

  /** Прокси файлы */
  proxies: Map<
    string,
    {
      path: string
      resolution: string
      codec: string
      generated: Date
    }
  >

  /** Анализ сцен */
  sceneAnalysis: Map<
    string,
    {
      scenes: Array<{ start: number; end: number; confidence: number }>
      generated: Date
    }
  >

  /** Размер кэша */
  totalSize: number

  /** Последняя очистка */
  lastCleaned?: Date
}

/**
 * Настройки коллаборации
 */
export interface CollaborationSettings {
  enabled: boolean
  mode: "local" | "cloud"

  /** Для локальной коллаборации */
  local?: {
    sharedPath: string
    lockFiles: boolean
  }

  /** Для облачной коллаборации */
  cloud?: {
    workspaceId: string
    syncInterval: number
    autoResolveConflicts: boolean
  }

  /** Участники */
  collaborators?: Array<{
    id: string
    name: string
    email: string
    role: "owner" | "editor" | "viewer"
    color: string // Цвет для выделения изменений
  }>
}

/**
 * Резервные копии проекта
 */
export interface ProjectBackup {
  /** Автосохранение */
  autoSave: {
    enabled: boolean
    interval: number // Минуты
    keepVersions: number // Количество версий
  }

  /** История версий */
  versions: Array<{
    id: string
    timestamp: Date
    size: number
    description?: string
    path: string
  }>

  /** Последнее сохранение */
  lastSaved: Date
}

/**
 * Основная структура проекта Timeline Studio
 */
export interface TimelineStudioProject {
  /** Метаданные проекта */
  metadata: ProjectMetadata

  /** Настройки проекта (видео, аудио, цвет) */
  settings: ProjectSettings & {
    /** Дополнительные настройки аудио */
    audio: {
      sampleRate: number
      bitDepth: number
      channels: number
      masterVolume: number
      panLaw: "-3dB" | "-4.5dB" | "-6dB"
    }

    /** Настройки превью */
    preview: {
      resolution: "full" | "1/2" | "1/4" | "1/8"
      quality: "draft" | "better" | "best"
      renderDuringPlayback: boolean
      useGPU: boolean
    }

    /** Пресеты экспорта */
    exportPresets: ExportPreset[]
  }

  /** Media Pool - централизованное хранилище медиа */
  mediaPool: MediaPool

  /** Секвенции (таймлайны) */
  sequences: Map<string, Sequence>

  /** ID активной секвенции */
  activeSequenceId: string

  /** Кэш проекта */
  cache: ProjectCache

  /** Настройки рабочего пространства */
  workspace: {
    /** Раскладка панелей */
    layout: "edit" | "color" | "effects" | "audio" | "custom"

    /** Настройки панелей */
    panels: Record<
      string,
      {
        visible: boolean
        position: { x: number; y: number }
        size: { width: number; height: number }
        docked: boolean
      }
    >

    /** Последние использованные инструменты */
    recentTools: string[]

    /** Настройки сетки и привязки */
    grid: {
      enabled: boolean
      size: number
      snapToGrid: boolean
      snapToClips: boolean
      magneticTimeline: boolean
    }
  }

  /** Коллаборация */
  collaboration?: CollaborationSettings

  /** Резервные копии */
  backup: ProjectBackup

  /** Расширения и плагины */
  extensions?: {
    installed: Array<{
      id: string
      name: string
      version: string
      enabled: boolean
      settings?: any
    }>
  }
}

/**
 * Операции с проектом
 */
export interface ProjectOperations {
  /** Создать новый проект */
  createProject(
    name: string,
    settings?: Partial<ProjectSettings>,
  ): TimelineStudioProject | Promise<TimelineStudioProject>

  /** Открыть проект */
  openProject(path: string): Promise<TimelineStudioProject>

  /** Сохранить проект */
  saveProject(project: TimelineStudioProject, path: string): Promise<void>

  /** Экспортировать проект для обмена */
  exportForExchange(project: TimelineStudioProject, format: "xml" | "aaf" | "edl"): string

  /** Импортировать из другого формата */
  importFromFormat(data: string, format: "xml" | "aaf" | "edl"): TimelineStudioProject

  /** Оптимизировать проект */
  optimizeProject(project: TimelineStudioProject): {
    removedItems: number
    freedSpace: number
    optimizedCaches: boolean
  }

  /** Проверить целостность проекта */
  validateProject(project: TimelineStudioProject): {
    isValid: boolean
    issues: string[]
    missingMedia: string[]
    corruptedSequences: string[]
  }

  /** Создать резервную копию */
  createBackup(project: TimelineStudioProject): Promise<string>

  /** Восстановить из резервной копии */
  restoreFromBackup(backupPath: string): Promise<TimelineStudioProject>
}

/**
 * События проекта
 */
export interface ProjectEvents {
  onProjectOpened: (project: TimelineStudioProject) => void
  onProjectSaved: (project: TimelineStudioProject) => void
  onProjectClosed: () => void
  onProjectModified: (changes: any) => void
  onMediaImported: (items: MediaPoolItem[]) => void
  onSequenceCreated: (sequence: Sequence) => void
  onSequenceDeleted: (sequenceId: string) => void
  onBackupCreated: (backupPath: string) => void
  onCacheUpdated: (cacheType: keyof ProjectCache) => void
}

/**
 * Состояние проекта для UI
 */
export interface ProjectState {
  /** Текущий проект */
  project: TimelineStudioProject | null

  /** Путь к файлу проекта */
  projectPath: string | null

  /** Флаг несохраненных изменений */
  isDirty: boolean

  /** Загружается ли проект */
  isLoading: boolean

  /** Сохраняется ли проект */
  isSaving: boolean

  /** Ошибка */
  error: string | null

  /** Прогресс операции */
  progress: {
    operation: string
    current: number
    total: number
  } | null
}

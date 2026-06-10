/**
 * Сервис для работы с новой структурой проекта Timeline Studio
 */

import { nanoid } from "nanoid"

import { container, type IPlatformService } from "@timeline-studio/core"
import { createEmptyMediaPool } from "@/domains/media-management"
import { DEFAULT_PROJECT_SETTINGS, type ProjectSettings } from "@/domains/shared/types/project"
import type { Sequence } from "@/domains/video-editing/types"
import { createLogger } from "@/lib/tauri-logger"
import type { ProjectMetadata, ProjectOperations, TimelineStudioProject } from "../types/timeline-studio-project"

const logger = createLogger("TimelineStudioProjectService")

/**
 * Класс сервиса для управления проектами Timeline Studio
 */
export class TimelineStudioProjectService implements ProjectOperations {
  private static instance: TimelineStudioProjectService

  private constructor() {}

  static getInstance(): TimelineStudioProjectService {
    if (!TimelineStudioProjectService.instance) {
      TimelineStudioProjectService.instance = new TimelineStudioProjectService()
    }
    return TimelineStudioProjectService.instance
  }

  /**
   * Получить IPlatformService из DI container
   */
  private getPlatformService(): IPlatformService {
    if (!container.hasPlatform()) {
      throw new Error("Platform service not available")
    }
    return container.getPlatform()
  }

  /**
   * Создать новый проект (синхронная версия)
   */
  createProjectSync(name: string, settings?: Partial<ProjectSettings>): TimelineStudioProject {
    const projectId = nanoid()
    const now = new Date()

    // Создаем метаданные
    const metadata: ProjectMetadata = {
      id: projectId,
      name,
      version: "2.0.0", // Новая версия формата
      created: now,
      modified: now,
      platform: this.getPlatform(),
      appVersion: "1.0.0", // Используем заглушку для синхронной версии
    }

    // Создаем первую секвенцию
    const mainSequence = this.createDefaultSequence(name, settings)
    const sequences = new Map([[mainSequence.id, mainSequence]])

    // Создаем проект
    const project: TimelineStudioProject = {
      metadata,
      settings: {
        ...DEFAULT_PROJECT_SETTINGS,
        ...settings,
        audio: {
          sampleRate: 48000,
          bitDepth: 24,
          channels: 2,
          masterVolume: 1.0,
          panLaw: "-3dB",
        },
        preview: {
          resolution: "1/2",
          quality: "better",
          renderDuringPlayback: true,
          useGPU: true,
        },
        exportPresets: [],
      },
      mediaPool: createEmptyMediaPool(),
      sequences,
      activeSequenceId: mainSequence.id,
      cache: {
        thumbnails: new Map(),
        waveforms: new Map(),
        proxies: new Map(),
        sceneAnalysis: new Map(),
        totalSize: 0,
      },
      workspace: {
        layout: "edit",
        panels: {},
        recentTools: [],
        grid: {
          enabled: false,
          size: 10,
          snapToGrid: false,
          snapToClips: true,
          magneticTimeline: true,
        },
      },
      backup: {
        autoSave: {
          enabled: true,
          interval: 5,
          keepVersions: 10,
        },
        versions: [],
        lastSaved: now,
      },
    }

    return project
  }

  /**
   * Создать новый проект (асинхронная версия)
   */
  async createProject(name: string, settings?: Partial<ProjectSettings>): Promise<TimelineStudioProject> {
    const projectId = nanoid()
    const now = new Date()

    // Получаем актуальную версию приложения
    const platformService = this.getPlatformService()
    const appVersion = await platformService.getVersion()

    // Создаем метаданные
    const metadata: ProjectMetadata = {
      id: projectId,
      name,
      version: "2.0.0", // Новая версия формата
      created: now,
      modified: now,
      platform: this.getPlatform(),
      appVersion, // Используем актуальную версию
    }

    // Создаем первую секвенцию
    const mainSequence = this.createDefaultSequence(name, settings)
    const sequences = new Map([[mainSequence.id, mainSequence]])

    // Создаем проект
    const project: TimelineStudioProject = {
      metadata,
      settings: {
        ...DEFAULT_PROJECT_SETTINGS,
        ...settings,
        audio: {
          sampleRate: 48000,
          bitDepth: 24,
          channels: 2,
          masterVolume: 1.0,
          panLaw: "-3dB",
        },
        preview: {
          resolution: "1/2",
          quality: "better",
          renderDuringPlayback: true,
          useGPU: true,
        },
        exportPresets: [],
      },
      mediaPool: createEmptyMediaPool(),
      sequences,
      activeSequenceId: mainSequence.id,
      cache: {
        thumbnails: new Map(),
        waveforms: new Map(),
        proxies: new Map(),
        sceneAnalysis: new Map(),
        totalSize: 0,
      },
      workspace: {
        layout: "edit",
        panels: {},
        recentTools: [],
        grid: {
          enabled: false,
          size: 10,
          snapToGrid: false,
          snapToClips: true,
          magneticTimeline: true,
        },
      },
      backup: {
        autoSave: {
          enabled: true,
          interval: 5,
          keepVersions: 10,
        },
        versions: [],
        lastSaved: now,
      },
    }

    return project
  }

  /**
   * Открыть проект из файла
   */
  async openProject(path: string): Promise<TimelineStudioProject> {
    try {
      const platformService = this.getPlatformService()
      const projectData = await platformService.readTextFile(path)

      // Проверяем что файл не пустой
      if (!projectData || projectData.trim() === "") {
        throw new Error("Project file is empty")
      }

      const parsed = JSON.parse(projectData)

      // Проверяем версию формата
      if (parsed.metadata?.version?.startsWith("2.")) {
        // Новый формат
        return this.deserializeProject(parsed)
      }
      if (parsed.meta) {
        // Старый формат - нужна миграция
        throw new Error("Old project format detected. Please migrate the project first.")
      }
      throw new Error("Unknown project format")
    } catch (error) {
      logger.error("Failed to open project:", { error })
      throw new Error(`Failed to open project: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  /**
   * Сохранить проект
   */
  async saveProject(project: TimelineStudioProject, path: string): Promise<void> {
    try {
      const platformService = this.getPlatformService()

      // Обновляем метаданные
      project.metadata.modified = new Date()
      project.backup.lastSaved = new Date()

      // Сериализуем проект
      const serialized = this.serializeProject(project)
      const content = JSON.stringify(serialized, null, 2)

      // Сохраняем файл
      await platformService.writeTextFile(path, content)

      logger.info(`Project saved to ${path}`)
    } catch (error) {
      logger.error("Failed to save project:", { error })
      throw new Error(`Failed to save project: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  /**
   * Экспортировать проект для обмена
   */
  exportForExchange(project: TimelineStudioProject, format: "xml" | "aaf" | "edl"): string {
    switch (format) {
      case "xml":
        return this.exportToFCPXML(project)
      case "aaf":
        return this.exportToAAF(project)
      case "edl":
        return this.exportToEDL(project)
      default:
        throw new Error(`Unsupported export format: ${format}`)
    }
  }

  /**
   * Импортировать из другого формата
   */
  importFromFormat(data: string, format: "xml" | "aaf" | "edl"): TimelineStudioProject {
    switch (format) {
      case "xml":
        return this.importFromFCPXML(data)
      case "aaf":
        return this.importFromAAF(data)
      case "edl":
        return this.importFromEDL(data)
      default:
        throw new Error(`Unsupported import format: ${format}`)
    }
  }

  /**
   * Оптимизировать проект
   */
  optimizeProject(project: TimelineStudioProject): {
    removedItems: number
    freedSpace: number
    optimizedCaches: boolean
  } {
    let removedItems = 0
    let freedSpace = 0

    // Удаляем неиспользуемые медиа элементы
    const usedMediaIds = new Set<string>()

    // Собираем все используемые медиа ID из всех секвенций
    for (const sequence of project.sequences.values()) {
      for (const track of sequence.composition.tracks) {
        for (const clip of track.clips) {
          if ("mediaId" in clip && clip.mediaId) {
            usedMediaIds.add(clip.mediaId)
          }
        }
      }
    }

    // Удаляем неиспользуемые элементы
    for (const [id, item] of project.mediaPool.items) {
      if (!usedMediaIds.has(id)) {
        project.mediaPool.items.delete(id)
        removedItems++
        freedSpace += item.metadata.fileSize
      }
    }

    // Очищаем кэш для удаленных элементов
    for (const id of project.cache.thumbnails.keys()) {
      if (!project.mediaPool.items.has(id)) {
        project.cache.thumbnails.delete(id)
      }
    }

    for (const id of project.cache.waveforms.keys()) {
      if (!project.mediaPool.items.has(id)) {
        project.cache.waveforms.delete(id)
      }
    }

    for (const id of project.cache.proxies.keys()) {
      if (!project.mediaPool.items.has(id)) {
        project.cache.proxies.delete(id)
      }
    }

    // Обновляем статистику
    project.mediaPool.stats.totalItems = project.mediaPool.items.size
    project.mediaPool.stats.totalSize -= freedSpace
    project.mediaPool.stats.unusedItems = 0

    return {
      removedItems,
      freedSpace,
      optimizedCaches: true,
    }
  }

  /**
   * Проверить целостность проекта
   */
  validateProject(project: TimelineStudioProject): {
    isValid: boolean
    issues: string[]
    missingMedia: string[]
    corruptedSequences: string[]
  } {
    const issues: string[] = []
    const missingMedia: string[] = []
    const corruptedSequences: string[] = []

    // Проверяем метаданные
    if (!project.metadata.id || !project.metadata.name) {
      issues.push("Project metadata is incomplete")
    }

    // Проверяем медиа файлы
    for (const [id, item] of project.mediaPool.items) {
      if (item.status === "missing" || item.status === "offline") {
        missingMedia.push(item.source.path)
      }
    }

    // Проверяем секвенции
    if (project.sequences.size === 0) {
      issues.push("Project has no sequences")
    }

    for (const [id, sequence] of project.sequences) {
      try {
        this.validateSequence(sequence)
      } catch (error) {
        corruptedSequences.push(sequence.name)
        issues.push(
          `Sequence "${sequence.name}" is corrupted: ${error instanceof Error ? error.message : String(error)}`,
        )
      }
    }

    // Проверяем активную секвенцию
    if (!project.sequences.has(project.activeSequenceId)) {
      issues.push("Active sequence not found")
    }

    return {
      isValid: issues.length === 0 && missingMedia.length === 0 && corruptedSequences.length === 0,
      issues,
      missingMedia,
      corruptedSequences,
    }
  }

  /**
   * Создать резервную копию
   */
  async createBackup(project: TimelineStudioProject): Promise<string> {
    if (!project || !project.metadata || !project.metadata.name) {
      throw new Error("Invalid project: missing metadata or name")
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-")
    const backupPath = `${project.metadata.name}_backup_${timestamp}.tlsp`

    // Сохраняем копию проекта
    await this.saveProject(project, backupPath)

    // Добавляем в историю версий
    project.backup.versions.push({
      id: nanoid(),
      timestamp: new Date(),
      size: JSON.stringify(project).length,
      path: backupPath,
    })

    // Ограничиваем количество версий
    if (project.backup.versions.length > project.backup.autoSave.keepVersions) {
      project.backup.versions = project.backup.versions.slice(-project.backup.autoSave.keepVersions)
    }

    return backupPath
  }

  /**
   * Восстановить из резервной копии
   */
  async restoreFromBackup(backupPath: string): Promise<TimelineStudioProject> {
    return this.openProject(backupPath)
  }

  // Вспомогательные методы

  private getPlatform(): "windows" | "macos" | "linux" {
    // Use userAgent as navigator.platform is deprecated
    const userAgent = window.navigator.userAgent.toLowerCase()
    if (userAgent.includes("win")) return "windows"
    if (userAgent.includes("mac")) return "macos"
    return "linux"
  }

  private createDefaultSequence(name: string, settings?: Partial<ProjectSettings>): Sequence {
    const resolution = settings?.resolution || DEFAULT_PROJECT_SETTINGS.resolution
    const [width, height] = resolution.split("x").map(Number)
    const frameRate = Number(settings?.frameRate || DEFAULT_PROJECT_SETTINGS.frameRate)

    return {
      id: nanoid(),
      name: `${name} - Sequence 1`,
      type: "main",
      settings: {
        resolution: { width, height },
        frameRate,
        aspectRatio: settings?.aspectRatio?.value.name || "16:9",
        duration: 0,
        audio: {
          sampleRate: 48000,
          bitDepth: 24,
          channels: 2,
        },
      },
      composition: {
        tracks: [],
        masterClips: [],
      },
      resources: {
        effects: new Map(),
        filters: new Map(),
        transitions: new Map(),
        colorGrades: new Map(),
        titles: new Map(),
        generators: new Map(),
      },
      markers: [],
      history: [],
      historyPosition: -1,
      metadata: {
        created: new Date(),
        modified: new Date(),
      },
    }
  }

  private validateSequence(sequence: Sequence): void {
    if (!sequence.id || !sequence.name) {
      throw new Error("Sequence is missing required fields")
    }

    if (!sequence.composition || !sequence.composition.tracks) {
      throw new Error("Sequence has invalid composition")
    }
  }

  private serializeProject(project: TimelineStudioProject): any {
    // Конвертируем Map в объекты для JSON
    return {
      ...project,
      mediaPool: {
        ...project.mediaPool,
        items: Object.fromEntries(project.mediaPool.items),
        bins: Object.fromEntries(project.mediaPool.bins),
      },
      sequences: Object.fromEntries(project.sequences),
      cache: {
        ...project.cache,
        thumbnails: Object.fromEntries(project.cache.thumbnails),
        waveforms: Object.fromEntries(project.cache.waveforms),
        proxies: Object.fromEntries(project.cache.proxies),
        sceneAnalysis: Object.fromEntries(project.cache.sceneAnalysis),
      },
    }
  }

  private deserializeProject(data: any): TimelineStudioProject {
    // Конвертируем объекты обратно в Map
    return {
      ...data,
      metadata: {
        ...data.metadata,
        created: new Date(data.metadata.created),
        modified: new Date(data.metadata.modified),
      },
      mediaPool: {
        ...data.mediaPool,
        items: new Map(Object.entries(data.mediaPool.items || {})),
        bins: new Map(Object.entries(data.mediaPool.bins || {})),
      },
      sequences: new Map(Object.entries(data.sequences || {})),
      cache: {
        ...data.cache,
        thumbnails: new Map(Object.entries(data.cache.thumbnails || {})),
        waveforms: new Map(Object.entries(data.cache.waveforms || {})),
        proxies: new Map(Object.entries(data.cache.proxies || {})),
        sceneAnalysis: new Map(Object.entries(data.cache.sceneAnalysis || {})),
      },
      backup: {
        ...data.backup,
        lastSaved: new Date(data.backup.lastSaved),
        versions: data.backup.versions.map((v: any) => ({
          ...v,
          timestamp: new Date(v.timestamp),
        })),
      },
    }
  }

  // Заглушки для экспорта/импорта (будут реализованы позже)

  private exportToFCPXML(_project: TimelineStudioProject): string {
    // TODO: Implement FCPXML export
    throw new Error("FCPXML export not implemented yet")
  }

  private exportToAAF(_project: TimelineStudioProject): string {
    // TODO: Implement AAF export
    throw new Error("AAF export not implemented yet")
  }

  private exportToEDL(_project: TimelineStudioProject): string {
    // TODO: Implement EDL export
    throw new Error("EDL export not implemented yet")
  }

  private importFromFCPXML(_data: string): TimelineStudioProject {
    // TODO: Implement FCPXML import
    throw new Error("FCPXML import not implemented yet")
  }

  private importFromAAF(_data: string): TimelineStudioProject {
    // TODO: Implement AAF import
    throw new Error("AAF import not implemented yet")
  }

  private importFromEDL(_data: string): TimelineStudioProject {
    // TODO: Implement EDL import
    throw new Error("EDL import not implemented yet")
  }
}

// Экспортируем singleton экземпляр
export const projectService = TimelineStudioProjectService.getInstance()

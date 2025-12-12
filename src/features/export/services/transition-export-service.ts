/**
 * Сервис экспорта переходов через FFmpeg
 * Конвертирует Timeline переходы в FFmpeg команды
 */

import type { TimelineTransition } from "@/domains/video-editing/types"
import type { TimelineProject } from "@/features/timeline/types"
import type { Transition } from "@/features/transitions/types/transitions"
import { createLogger } from "@/lib/tauri-logger"
import type { ExportSettings } from "../types/export-types"
import {
  FFMPEG_TRANSITION_TEMPLATES,
  type FFmpegTransitionCommand,
  type FFmpegTransitionConfig,
  TRANSITION_FFMPEG_MAPPING,
  type TransitionExportInfo,
  type TransitionExportResult,
  type TransitionExportStatus,
  type TransitionFFmpegParameters,
  type TransitionOptimizationSettings,
  type TransitionType,
} from "../types/transition-export-types"

const logger = createLogger({ module: "TransitionExportService" })

export class TransitionExportService {
  private static instance: TransitionExportService
  private exportStatuses = new Map<string, TransitionExportStatus>()
  private optimizationSettings: TransitionOptimizationSettings

  private constructor() {
    this.optimizationSettings = {
      enableTransitionCache: true,
      maxCacheSize: 500, // 500MB
      prerenderTransitions: false,
      prerenderQuality: 85,
      batchSimilarTransitions: true,
      maxBatchSize: 10,
      enableParallelProcessing: true,
      maxWorkers: 4,
      prioritizeSpeed: false,
      adaptiveQuality: true,
      enableFallbacks: true,
      fallbackToSoftware: true,
      skipFailedTransitions: false,
    }
  }

  static getInstance(): TransitionExportService {
    if (!TransitionExportService.instance) {
      TransitionExportService.instance = new TransitionExportService()
    }
    return TransitionExportService.instance
  }

  /**
   * Получить все переходы из проекта для экспорта
   * @param project - Проект таймлайна
   * @param availableTransitions - Мапа доступных переходов (ID -> Transition object)
   */
  extractTransitionsFromProject(
    project: TimelineProject,
    availableTransitions: Map<string, Transition>,
  ): TransitionExportInfo[] {
    const transitions: TransitionExportInfo[] = []

    // Собираем все треки
    const allTracks = [...project.sections.flatMap((s) => s.tracks), ...project.globalTracks]

    for (const track of allTracks) {
      if (!track.transitions || track.transitions.length === 0) continue

      // Получаем переходы трека
      for (const transitionId of track.transitions) {
        const transition = project.resources.timelineTransitions?.find((t) => t.id === transitionId)

        if (!transition) {
          logger.warn(`Timeline transition not found: ${transitionId}`)
          continue
        }

        // Находим ресурс перехода в переданной мапе
        const resource = availableTransitions.get(transition.transitionId)

        if (!resource) {
          logger.warn(`Transition resource not found: ${transition.transitionId}`)
          continue
        }

        // После проверок transition и resource гарантированно не undefined
        const exportInfo: TransitionExportInfo = {
          transition,
          resource,
          trackId: track.id,
          startTime: transition.position,
          endTime: transition.position + transition.duration,
          duration: transition.duration,
          sourceClipId: transition.startClipId,
          targetClipId: transition.endClipId,
          renderQuality: this.calculateTransitionQuality(transition, resource),
          gpuAccelerated: resource.gpuAccelerated ?? false,
          shaderType: resource.webglShader ?? "basic",
          customParameters: transition.parameters,
        }

        transitions.push(exportInfo)
      }
    }

    // Сортируем по времени
    return transitions.sort((a, b) => a.startTime - b.startTime)
  }

  /**
   * Создать конфигурации FFmpeg для переходов
   */
  async createFFmpegConfigs(
    transitions: TransitionExportInfo[],
    exportSettings: ExportSettings,
    clipPaths: Map<string, string>,
  ): Promise<FFmpegTransitionConfig[]> {
    const configs: FFmpegTransitionConfig[] = []

    for (const transitionInfo of transitions) {
      try {
        const config = await this.createSingleTransitionConfig(transitionInfo, exportSettings, clipPaths)
        if (config) {
          configs.push(config)
        }
      } catch (error) {
        logger.error(`Failed to create config for transition ${transitionInfo.transition.id}: ${String(error)}`)

        if (!this.optimizationSettings.skipFailedTransitions) {
          throw error
        }
      }
    }

    return configs
  }

  /**
   * Создать конфигурацию для одного перехода
   */
  private async createSingleTransitionConfig(
    transitionInfo: TransitionExportInfo,
    exportSettings: ExportSettings,
    clipPaths: Map<string, string>,
  ): Promise<FFmpegTransitionConfig | null> {
    const { transition, resource } = transitionInfo

    // Определяем тип перехода для FFmpeg
    const ffmpegType = this.mapTransitionType(resource.id)

    // Получаем пути к клипам
    const inputA = transition.startClipId ? clipPaths.get(transition.startClipId) : null
    const inputB = transition.endClipId ? clipPaths.get(transition.endClipId) : null

    if (!inputA || !inputB) {
      logger.warn(`Missing clip paths for transition ${transition.id}`)
      return null
    }

    // Создаем конфигурацию
    const config: FFmpegTransitionConfig = {
      id: transition.id,
      type: ffmpegType,
      startTime: transition.position,
      duration: transition.duration,
      parameters: this.convertParameters(transition.parameters),
      inputA,
      inputB,
      output: this.generateOutputPath(transition.id, exportSettings),
      quality: this.getQualityValue(exportSettings.quality),
      resolution: this.getResolution(exportSettings),
      useGpu: !!(exportSettings.enableGPU && resource.gpuAccelerated),
      gpuDevice: exportSettings.enableGPU ? "auto" : undefined,
    }

    return config
  }

  /**
   * Сгенерировать FFmpeg команды из конфигураций
   */
  generateFFmpegCommands(configs: FFmpegTransitionConfig[]): FFmpegTransitionCommand[] {
    return configs.map((config) => this.createFFmpegCommand(config))
  }

  /**
   * Создать FFmpeg команду для одного перехода
   */
  private createFFmpegCommand(config: FFmpegTransitionConfig): FFmpegTransitionCommand {
    const template = FFMPEG_TRANSITION_TEMPLATES[config.type]

    if (!template) {
      throw new Error(`Unknown transition type: ${config.type}`)
    }

    // Подставляем параметры в шаблон
    const filterGraph = template
      .replace("{duration}", config.duration.toString())
      .replace("{offset}", config.startTime.toString())

    // Создаем входы
    const inputs = [
      {
        path: config.inputA,
        options: ["-ss", config.startTime.toString()],
      },
      {
        path: config.inputB,
        options: ["-ss", (config.startTime + config.duration).toString()],
      },
    ]

    // Настройки вывода
    const outputOptions = [
      "-c:v",
      config.useGpu ? "h264_nvenc" : "libx264",
      "-crf",
      this.qualityToCrf(config.quality).toString(),
      "-preset",
      "medium",
      "-s",
      `${config.resolution.width}x${config.resolution.height}`,
    ]

    // GPU ускорение
    if (config.useGpu && config.gpuDevice) {
      outputOptions.push("-hwaccel", "cuda", "-hwaccel_device", config.gpuDevice)
    }

    return {
      inputs,
      filterGraph,
      output: {
        path: config.output,
        options: outputOptions,
      },
      globalOptions: ["-y", "-loglevel", "error"],
      metadata: {
        transitionId: config.id,
        transitionType: config.type,
        duration: config.duration,
        quality: config.quality,
      },
    }
  }

  /**
   * Выполнить экспорт переходов
   * @param project - Проект таймлайна
   * @param exportSettings - Настройки экспорта
   * @param clipPaths - Мапа путей к клипам
   * @param availableTransitions - Мапа доступных переходов
   * @param onProgress - Коллбек прогресса
   */
  async exportTransitions(
    project: TimelineProject,
    exportSettings: ExportSettings,
    clipPaths: Map<string, string>,
    availableTransitions: Map<string, Transition>,
    onProgress?: (status: TransitionExportStatus) => void,
  ): Promise<TransitionExportResult> {
    const startTime = Date.now()

    // Извлекаем переходы
    const transitions = this.extractTransitionsFromProject(project, availableTransitions)

    if (transitions.length === 0) {
      return {
        success: true,
        totalTransitions: 0,
        processedTransitions: 0,
        failedTransitions: [],
        outputPath: "",
        tempFiles: [],
        totalRenderTime: 0,
        averageTransitionTime: 0,
        gpuAccelerated: exportSettings.enableGPU,
        ffmpegLogs: [],
        errors: [],
        warnings: [],
      }
    }

    // Создаем конфигурации
    const configs = await this.createFFmpegConfigs(transitions, exportSettings, clipPaths)

    // Генерируем команды
    const commands = this.generateFFmpegCommands(configs)

    // Выполняем экспорт
    const results = await this.executeTransitionCommands(commands, onProgress)

    const endTime = Date.now()
    const totalRenderTime = endTime - startTime

    return {
      success: results.every((r) => r.status === "completed"),
      totalTransitions: transitions.length,
      processedTransitions: results.filter((r) => r.status === "completed").length,
      failedTransitions: results.filter((r) => r.status === "failed"),
      outputPath: exportSettings.savePath,
      tempFiles: configs.map((c) => c.output),
      totalRenderTime,
      averageTransitionTime: totalRenderTime / transitions.length,
      gpuAccelerated: exportSettings.enableGPU,
      ffmpegLogs: [], // TODO: Собирать логи из FFmpeg
      errors: results.filter((r) => r.error).map((r) => r.error!),
      warnings: [],
    }
  }

  /**
   * Выполнить команды FFmpeg
   */
  private async executeTransitionCommands(
    commands: FFmpegTransitionCommand[],
    onProgress?: (status: TransitionExportStatus) => void,
  ): Promise<TransitionExportStatus[]> {
    const results: TransitionExportStatus[] = []

    // Параллельное или последовательное выполнение
    if (this.optimizationSettings.enableParallelProcessing) {
      const workers = Math.min(this.optimizationSettings.maxWorkers, commands.length)
      const chunks = this.chunkArray(commands, Math.ceil(commands.length / workers))

      const promises = chunks.map((chunk) => this.processCommandChunk(chunk, onProgress))

      const chunkResults = await Promise.all(promises)
      results.push(...chunkResults.flat())
    } else {
      for (const command of commands) {
        const result = await this.executeCommand(command, onProgress)
        results.push(result)
      }
    }

    return results
  }

  /**
   * Выполнить один chunk команд
   */
  private async processCommandChunk(
    commands: FFmpegTransitionCommand[],
    onProgress?: (status: TransitionExportStatus) => void,
  ): Promise<TransitionExportStatus[]> {
    const results: TransitionExportStatus[] = []

    for (const command of commands) {
      const result = await this.executeCommand(command, onProgress)
      results.push(result)
    }

    return results
  }

  /**
   * Выполнить одну FFmpeg команду
   */
  private async executeCommand(
    command: FFmpegTransitionCommand,
    onProgress?: (status: TransitionExportStatus) => void,
  ): Promise<TransitionExportStatus> {
    const transitionId = command.metadata.transitionId
    const startTime = Date.now()

    const status: TransitionExportStatus = {
      transitionId,
      status: "processing",
      progress: 0,
      startTime: new Date(startTime),
    }

    this.exportStatuses.set(transitionId, status)

    if (onProgress) {
      onProgress(status)
    }

    try {
      // TODO: Интеграция с реальным FFmpeg executor
      // Пока что эмулируем выполнение
      await this.simulateFFmpegExecution(command, (progress) => {
        status.progress = progress
        if (onProgress) {
          onProgress(status)
        }
      })

      const endTime = Date.now()
      status.status = "completed"
      status.progress = 100
      status.endTime = new Date(endTime)
      status.renderTimeMs = endTime - startTime

      if (onProgress) {
        onProgress(status)
      }

      return status
    } catch (error) {
      status.status = "failed"
      status.error = error instanceof Error ? error.message : "Unknown error"
      status.endTime = new Date()

      if (onProgress) {
        onProgress(status)
      }

      return status
    }
  }

  /**
   * Симуляция выполнения FFmpeg (заменить на реальную интеграцию)
   */
  private async simulateFFmpegExecution(
    command: FFmpegTransitionCommand,
    onProgress: (progress: number) => void,
  ): Promise<void> {
    const duration = command.metadata.duration * 1000 // ms
    const steps = 10
    const stepDuration = duration / steps

    for (let i = 0; i <= steps; i++) {
      await new Promise((resolve) => setTimeout(resolve, stepDuration))
      onProgress((i / steps) * 100)
    }
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  private mapTransitionType(transitionId: string): TransitionType {
    return TRANSITION_FFMPEG_MAPPING[transitionId] || TRANSITION_FFMPEG_MAPPING["*"]
  }

  private convertParameters(params: Record<string, any>): TransitionFFmpegParameters {
    // Конвертируем параметры Timeline в FFmpeg формат
    return {
      intensity: params.intensity ?? 1.0,
      direction: params.direction ?? "center",
      blur: params.blur
        ? {
            enabled: params.blur.enabled ?? false,
            amount: params.blur.amount,
            type: params.blur.type,
          }
        : { enabled: false, amount: 0, type: "gaussian" },
      color: params.color
        ? {
            enabled: params.color.enabled ?? false,
            tint: params.color.tint,
            saturation: params.color.saturation,
            brightness: params.color.brightness,
          }
        : { enabled: false, tint: "#FFFFFF", saturation: 0, brightness: 0 },
    }
  }

  private generateOutputPath(transitionId: string, settings: ExportSettings): string {
    return `${settings.savePath}/transitions/transition_${transitionId}.${settings.format}`
  }

  private getQualityValue(quality: string): number {
    const qualityMap = { normal: 75, good: 85, best: 95 }
    return qualityMap[quality as keyof typeof qualityMap] || 85
  }

  private getResolution(settings: ExportSettings) {
    const resolutions = {
      "720": { width: 1280, height: 720 },
      "1080": { width: 1920, height: 1080 },
      "1440": { width: 2560, height: 1440 },
      "4k": { width: 3840, height: 2160 },
      timeline: { width: 1920, height: 1080 }, // Default
    }
    return resolutions[settings.resolution] || resolutions.timeline
  }

  private qualityToCrf(quality: number): number {
    // Конвертируем качество (0-100) в CRF (0-51)
    return Math.round(51 - (quality / 100) * 51)
  }

  private calculateTransitionQuality(transition: TimelineTransition, resource: Transition): number {
    // Базовое качество
    let quality = 85

    // Учитываем сложность перехода
    if (resource.gpuAccelerated) quality += 5
    // Проверяем blur в параметрах (они имеют тип Record<string, any>)
    if (transition.parameters?.blur && typeof transition.parameters.blur === "object") {
      const blur = transition.parameters.blur as { enabled?: boolean }
      if (blur.enabled) quality -= 5
    }
    if (transition.duration < 0.5) quality -= 10

    return Math.max(50, Math.min(100, quality))
  }

  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks = []
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize))
    }
    return chunks
  }

  /**
   * Получить статус экспорта
   */
  getExportStatus(transitionId: string): TransitionExportStatus | undefined {
    return this.exportStatuses.get(transitionId)
  }

  /**
   * Очистить статусы
   */
  clearStatuses(): void {
    this.exportStatuses.clear()
  }

  /**
   * Обновить настройки оптимизации
   */
  updateOptimizationSettings(settings: Partial<TransitionOptimizationSettings>): void {
    this.optimizationSettings = { ...this.optimizationSettings, ...settings }
  }
}

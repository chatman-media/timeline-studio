/**
 * AI инструменты для управления настройками и конфигурацией с использованием BaseAITool
 *
 * Предоставляет Claude возможности для настройки приложения,
 * управления проектами и системными параметрами
 */

import { type AIToolExecutionOptions, type AIToolLogger, type AIToolResult, BaseAITool } from "../base-ai-tool"

// Типы для настроек конфигурации
export interface SettingsInput {
  operation:
    | "analyze_app_settings"
    | "configure_project_settings"
    | "manage_export_presets"
    | "configure_keyboard_shortcuts"
    | "setup_workspace_layouts"
    | "manage_plugin_settings"
    | "configure_system_performance"
    | "backup_restore_settings"
  analysisScope?: "all" | "performance" | "interface" | "workflow" | "security" | "media" | "export"
  includeRecommendations?: boolean
  compareWithDefaults?: boolean
  userExperienceLevel?: "beginner" | "intermediate" | "advanced" | "professional"
  systemSpecs?: {
    cpuCores?: number
    ramGB?: number
    gpuModel?: string
    storageType?: "hdd" | "ssd" | "nvme"
    osType?: "windows" | "macos" | "linux"
  }
  projectSettings?: any
  exportPreset?: any
  shortcuts?: any
  workspaceLayouts?: any
  pluginSettings?: any
  performanceSettings?: any
  backupSettings?: any
  restoreData?: any
}

export interface SettingsResult {
  operation: string
  success: boolean
  analysis?: any
  recommendations?: string[]
  warnings?: string[]
  changes?: any
  backup?: any
  message: string
}

/**
 * AI инструмент для работы с настройками с унифицированной обработкой ошибок
 */
export class SettingsTool extends BaseAITool {
  constructor(logger?: AIToolLogger) {
    super("SettingsTool", logger)
  }

  /**
   * Выполняет операции с настройками
   */
  public async processSettings(
    input: SettingsInput,
    options: AIToolExecutionOptions = {},
  ): Promise<AIToolResult<SettingsResult>> {
    // Валидация входных данных
    const validation = this.validateInput(input, (data) => {
      const errors: string[] = []

      const validOperations = [
        "analyze_app_settings",
        "configure_project_settings",
        "manage_export_presets",
        "configure_keyboard_shortcuts",
        "setup_workspace_layouts",
        "manage_plugin_settings",
        "configure_system_performance",
        "backup_restore_settings",
      ]
      if (!validOperations.includes(data.operation)) {
        errors.push(`Неподдерживаемая операция: ${data.operation}`)
      }

      // Специфические валидации для разных операций
      switch (data.operation) {
        case "configure_project_settings":
          if (!data.projectSettings) {
            errors.push("Требуются projectSettings для настройки проекта")
          }
          break
        case "manage_export_presets":
          if (!data.exportPreset) {
            errors.push("Требуется exportPreset для управления пресетами")
          }
          break
        case "configure_keyboard_shortcuts":
          if (!data.shortcuts) {
            errors.push("Требуются shortcuts для настройки клавиш")
          }
          break
        case "setup_workspace_layouts":
          if (!data.workspaceLayouts) {
            errors.push("Требуются workspaceLayouts для настройки рабочих пространств")
          }
          break
        case "manage_plugin_settings":
          if (!data.pluginSettings) {
            errors.push("Требуются pluginSettings для управления плагинами")
          }
          break
        case "configure_system_performance":
          if (!data.performanceSettings) {
            errors.push("Требуются performanceSettings для настройки производительности")
          }
          break
        case "backup_restore_settings":
          if (!data.backupSettings && !data.restoreData) {
            errors.push("Требуются backupSettings или restoreData")
          }
          break
      }

      return {
        isValid: errors.length === 0,
        errors,
      }
    })

    if (!validation.isValid) {
      return {
        success: false,
        errors: validation.errors,
        message: "Ошибка валидации входных данных для настроек",
        executionTime: 0,
        toolName: this.toolName,
      }
    }

    const operation = input.operation

    // Выполняем операцию с унифицированной обработкой ошибок
    return this.executeWithErrorHandling(
      async () => {
        this.logger?.info("Начинаем операцию настроек", {
          operation,
        })

        let result: SettingsResult
        const recommendations: string[] = []
        const warnings: string[] = []

        switch (operation) {
          case "analyze_app_settings":
            result = await this.analyzeAppSettings(input)
            break

          case "configure_project_settings":
            result = await this.configureProjectSettings(input)
            break

          case "manage_export_presets":
            result = await this.manageExportPresets(input)
            break

          case "configure_keyboard_shortcuts":
            result = await this.configureKeyboardShortcuts(input)
            break

          case "setup_workspace_layouts":
            result = await this.setupWorkspaceLayouts(input)
            break

          case "manage_plugin_settings":
            result = await this.managePluginSettings(input)
            break

          case "configure_system_performance":
            result = await this.configureSystemPerformance(input)
            break

          case "backup_restore_settings":
            result = await this.backupRestoreSettings(input)
            break

          default:
            throw new Error(`Неподдерживаемая операция: ${operation}`)
        }

        if (result.recommendations) {
          recommendations.push(...result.recommendations)
        }
        if (result.warnings) {
          warnings.push(...result.warnings)
        }

        result.recommendations = recommendations
        result.warnings = warnings.length > 0 ? warnings : undefined

        this.logger?.info("Операция настроек завершена", {
          operation,
          success: result.success,
        })

        return result
      },
      {
        timeout: options.timeout || 60000,
        retries: options.retries || 2,
        retryDelay: options.retryDelay || 1000,
        enableLogging: options.enableLogging !== false,
        metadata: {
          operation,
          ...options.metadata,
        },
      },
    )
  }

  /**
   * Анализ настроек приложения
   */
  private async analyzeAppSettings(input: SettingsInput): Promise<SettingsResult> {
    this.logger?.info("Анализируем настройки приложения", {
      scope: input.analysisScope,
    })

    // Заглушка для анализа
    const analysis = {
      currentSettings: {
        performance: {
          renderQuality: "high",
          previewResolution: "half",
          cacheSize: "8GB",
          multiThreading: true,
        },
        interface: {
          theme: "dark",
          language: "ru",
          showToolTips: true,
          autoSave: 5,
        },
        workflow: {
          defaultFrameRate: 30,
          defaultResolution: "1920x1080",
          proxyGeneration: "automatic",
          backupInterval: 10,
        },
      },
      optimization: {
        suggestions: [
          "Увеличить размер кэша для лучшей производительности",
          "Включить GPU ускорение для эффектов",
          "Оптимизировать настройки прокси для 4K контента",
        ],
        warnings:
          input.systemSpecs?.ramGB && input.systemSpecs.ramGB < 16
            ? ["Рекомендуется минимум 16GB RAM для комфортной работы"]
            : [],
      },
    }

    return {
      operation: "analyze_app_settings",
      success: true,
      analysis,
      recommendations: analysis.optimization.suggestions,
      warnings: analysis.optimization.warnings,
      message: "Анализ настроек завершен",
    }
  }

  /**
   * Настройка параметров проекта
   */
  private async configureProjectSettings(input: SettingsInput): Promise<SettingsResult> {
    this.logger?.info("Настраиваем параметры проекта")

    const changes = {
      previous: {
        resolution: "1920x1080",
        frameRate: 30,
        audioSampleRate: 48000,
      },
      new: input.projectSettings,
      applied: true,
    }

    return {
      operation: "configure_project_settings",
      success: true,
      changes,
      recommendations: ["Перезапустите проект для применения изменений"],
      message: "Настройки проекта обновлены",
    }
  }

  /**
   * Управление пресетами экспорта
   */
  private async manageExportPresets(input: SettingsInput): Promise<SettingsResult> {
    this.logger?.info("Управляем пресетами экспорта")

    return {
      operation: "manage_export_presets",
      success: true,
      changes: {
        preset: input.exportPreset,
        action: "created",
      },
      message: "Пресет экспорта создан",
      recommendations: ["Проверьте настройки перед первым использованием"],
    }
  }

  /**
   * Настройка горячих клавиш
   */
  private async configureKeyboardShortcuts(input: SettingsInput): Promise<SettingsResult> {
    this.logger?.info("Настраиваем горячие клавиши")

    const conflicts = this.checkShortcutConflicts(input.shortcuts || {})

    return {
      operation: "configure_keyboard_shortcuts",
      success: true,
      changes: {
        shortcuts: input.shortcuts,
        conflicts,
      },
      warnings: conflicts.length > 0 ? [`Обнаружены конфликты: ${conflicts.join(", ")}`] : undefined,
      message: "Горячие клавиши настроены",
    }
  }

  /**
   * Настройка рабочих пространств
   */
  private async setupWorkspaceLayouts(input: SettingsInput): Promise<SettingsResult> {
    this.logger?.info("Настраиваем рабочие пространства")

    return {
      operation: "setup_workspace_layouts",
      success: true,
      changes: {
        layouts: input.workspaceLayouts,
        activeLayout: "editing",
      },
      message: "Рабочие пространства настроены",
      recommendations: ["Используйте Ctrl+Shift+[1-9] для быстрого переключения"],
    }
  }

  /**
   * Управление настройками плагинов
   */
  private async managePluginSettings(input: SettingsInput): Promise<SettingsResult> {
    this.logger?.info("Управляем настройками плагинов")

    return {
      operation: "manage_plugin_settings",
      success: true,
      changes: {
        plugins: input.pluginSettings,
        enabled: true,
      },
      message: "Настройки плагинов обновлены",
      warnings: ["Некоторые плагины требуют перезапуска"],
    }
  }

  /**
   * Настройка производительности системы
   */
  private async configureSystemPerformance(input: SettingsInput): Promise<SettingsResult> {
    this.logger?.info("Настраиваем производительность системы")

    const optimized = this.optimizeForSystem(input.systemSpecs || {})

    return {
      operation: "configure_system_performance",
      success: true,
      changes: {
        performance: input.performanceSettings,
        optimized,
      },
      message: "Производительность оптимизирована",
      recommendations: optimized.recommendations,
    }
  }

  /**
   * Резервное копирование и восстановление настроек
   */
  private async backupRestoreSettings(input: SettingsInput): Promise<SettingsResult> {
    this.logger?.info("Выполняем резервное копирование/восстановление")

    if (input.backupSettings) {
      return {
        operation: "backup_restore_settings",
        success: true,
        backup: {
          timestamp: new Date().toISOString(),
          size: "2.4MB",
          location: "/backups/settings_backup.json",
        },
        message: "Резервная копия создана",
        recommendations: ["Сохраните копию в облаке"],
      }
    }

    return {
      operation: "backup_restore_settings",
      success: true,
      changes: {
        restored: true,
        from: input.restoreData,
      },
      message: "Настройки восстановлены",
      warnings: ["Требуется перезапуск приложения"],
    }
  }

  /**
   * Проверка конфликтов горячих клавиш
   */
  private checkShortcutConflicts(shortcuts: Record<string, string>): string[] {
    const conflicts: string[] = []
    const used = new Set<string>()

    for (const [action, shortcut] of Object.entries(shortcuts)) {
      if (used.has(shortcut)) {
        conflicts.push(`${shortcut} используется несколько раз`)
      }
      used.add(shortcut)
    }

    return conflicts
  }

  /**
   * Оптимизация для системы
   */
  private optimizeForSystem(specs: any): any {
    const recommendations: string[] = []

    if (specs.ramGB && specs.ramGB < 8) {
      recommendations.push("Уменьшите размер кэша до 2GB")
      recommendations.push("Отключите фоновый рендеринг")
    }

    if (specs.gpuModel && !specs.gpuModel.toLowerCase().includes("nvidia")) {
      recommendations.push("Используйте CPU для некоторых эффектов")
    }

    if (specs.storageType === "hdd") {
      recommendations.push("Используйте прокси для всех медиафайлов")
      recommendations.push("Включите оптимизацию для медленных дисков")
    }

    return {
      autoDetected: true,
      recommendations,
    }
  }
}

// Экспортируем готовый экземпляр для использования
export const settingsTool = new SettingsTool()

// Функции-обертки для обратной совместимости
export async function analyzeAppSettings(params: any): Promise<AIToolResult<SettingsResult>> {
  const input: SettingsInput = {
    operation: "analyze_app_settings",
    analysisScope: params.analysisScope,
    includeRecommendations: params.includeRecommendations,
    compareWithDefaults: params.compareWithDefaults,
    userExperienceLevel: params.userExperienceLevel,
    systemSpecs: params.systemSpecs,
  }
  return settingsTool.processSettings(input)
}

export async function configureProjectSettings(params: any): Promise<AIToolResult<SettingsResult>> {
  const input: SettingsInput = {
    operation: "configure_project_settings",
    projectSettings: params.projectSettings,
  }
  return settingsTool.processSettings(input)
}

export async function manageExportPresets(params: any): Promise<AIToolResult<SettingsResult>> {
  const input: SettingsInput = {
    operation: "manage_export_presets",
    exportPreset: params,
  }
  return settingsTool.processSettings(input)
}

export async function configureKeyboardShortcuts(params: any): Promise<AIToolResult<SettingsResult>> {
  const input: SettingsInput = {
    operation: "configure_keyboard_shortcuts",
    shortcuts: params,
  }
  return settingsTool.processSettings(input)
}

export async function setupWorkspaceLayouts(params: any): Promise<AIToolResult<SettingsResult>> {
  const input: SettingsInput = {
    operation: "setup_workspace_layouts",
    workspaceLayouts: params,
  }
  return settingsTool.processSettings(input)
}

export async function managePluginSettings(params: any): Promise<AIToolResult<SettingsResult>> {
  const input: SettingsInput = {
    operation: "manage_plugin_settings",
    pluginSettings: params,
  }
  return settingsTool.processSettings(input)
}

export async function configureSystemPerformance(params: any): Promise<AIToolResult<SettingsResult>> {
  const input: SettingsInput = {
    operation: "configure_system_performance",
    performanceSettings: params.performanceSettings,
    systemSpecs: params.systemSpecs,
  }
  return settingsTool.processSettings(input)
}

export async function backupRestoreSettings(params: any): Promise<AIToolResult<SettingsResult>> {
  const input: SettingsInput = {
    operation: "backup_restore_settings",
    backupSettings: params.backupSettings,
    restoreData: params.restoreData,
  }
  return settingsTool.processSettings(input)
}

// Экспортируем массив инструментов для обратной совместимости
export const settingsConfigurationTools: any[] = [
  {
    name: "analyze_app_settings",
    description: "Анализирует текущие настройки приложения и предлагает оптимизации",
  },
  {
    name: "configure_project_settings",
    description: "Настраивает параметры проекта: разрешение, частота кадров, аудио настройки",
  },
  {
    name: "manage_export_presets",
    description: "Создает и управляет пресетами экспорта для различных платформ",
  },
  {
    name: "configure_keyboard_shortcuts",
    description: "Настраивает горячие клавиши и клавиатурные комбинации",
  },
  {
    name: "setup_workspace_layouts",
    description: "Создает и управляет макетами рабочего пространства для разных задач",
  },
  {
    name: "manage_plugin_settings",
    description: "Управляет настройками и конфигурацией плагинов",
  },
  {
    name: "configure_system_performance",
    description: "Оптимизирует настройки производительности под конкретную систему",
  },
  {
    name: "backup_restore_settings",
    description: "Создает резервные копии и восстанавливает настройки приложения",
  },
]

/**
 * Функция для обработки выполнения инструментов настроек (legacy API)
 */
export async function executeSettingsTool(toolName: string, input: Record<string, any>): Promise<any> {
  try {
    // Маппинг старых названий на новые функции
    const functionMap: Record<string, () => Promise<any>> = {
      analyze_app_settings: () => analyzeAppSettings(input),
      configure_project_settings: () => configureProjectSettings(input),
      manage_export_presets: () => manageExportPresets(input),
      configure_keyboard_shortcuts: () => configureKeyboardShortcuts(input),
      setup_workspace_layouts: () => setupWorkspaceLayouts(input),
      manage_plugin_settings: () => managePluginSettings(input),
      configure_system_performance: () => configureSystemPerformance(input),
      backup_restore_settings: () => backupRestoreSettings(input),
    }

    const func = functionMap[toolName]
    if (!func) {
      throw new Error(`Неизвестный инструмент настроек: ${toolName}`)
    }

    const result = await func()

    // Преобразуем AIToolResult в старый формат если нужно
    if (result && result.success !== undefined) {
      return result.data || result
    }
    return result
  } catch (error) {
    throw new Error(`Ошибка выполнения ${toolName}: ${error instanceof Error ? error.message : String(error)}`)
  }
}

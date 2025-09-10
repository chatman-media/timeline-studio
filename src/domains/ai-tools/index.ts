/**
 * AI Tools Domain
 * Главный экспорт домена AI инструментов
 */

// Базовые компоненты
export {
  BaseAITool,
  ConsoleAIToolLogger,
  ExecutionEngine,
  NoOpAIToolLogger,
  ToolRegistry,
} from "./base"

// DI Container
export {
  AIToolsContainer,
  AIToolsContainerUtils,
  getAIToolsContainer,
  type IAIToolsContainer,
} from "./container"

// Инструменты
export {
  AI_TOOLS_DOMAIN_STATS,
  // Все инструменты
  allAITools,
  analyzeDependencies,
  browserTools,
  CORE_TOOLS_COUNT,
  CORE_TOOLS_STATS,
  checkToolsIntegrity,
  // Core Tools
  coreTools,
  // Утилиты поиска и группировки
  findToolByName,
  getAllToolMetadata,
  getAllToolSchemas,
  getTagsStatistics,
  getToolsByCategory,
  getToolsByDomain,
  getToolsByTags,
  getToolsGroupedByCategory,
  getToolsGroupedByDomain,
  getToolsWithDependencies,
  playerTools,
  // Регистрация
  registerAllToolsInContainer,
  resourceTools,
  timelineTools,
  // Валидация и анализ
  validateAllTools,
} from "./tools"

// Типы
export type {
  AIToolCategory,
  // Домены и категории
  AIToolDomain,
  AIToolExample,
  // Контексты выполнения
  AIToolExecutionContext,
  AIToolExecutionEvent,
  AIToolExecutionOptions,
  // Статусы и приоритеты
  AIToolExecutionStatus,
  AIToolLogger,
  AIToolMetadata,
  // Плагины
  AIToolPlugin,
  AIToolPriority,
  // Результаты и опции
  AIToolResult,
  // Конфигурация
  AIToolsConfig,
  AIToolsDomainConfig,
  // События
  AIToolsEventMap,
  AIToolsStatistics,
  // Задачи и метрики
  AIToolTask,
  AnalysisToolCategory,
  AutomationToolCategory,
  BatchExecutionContext,
  // Результаты выполнения
  BatchExecutionResult,
  CoreToolCategory,
  DebugContext,
  // Статистика
  DomainStats,
  ExecutionMetrics,
  FullExecutionContext,
  // Основные интерфейсы
  IAITool,
  IExecutionEngine,
  IntegrationToolCategory,
  IToolRegistry,
  // Миграция
  MigrationInfo,
  MigrationStep,
  PerformanceAnalysisResult,
  PerformanceContext,
  PipelineExecutionContext,
  PipelineExecutionResult,
  SecurityContext,
  ToolSearchFilters,
  ToolSearchMatch,
  // Поиск
  ToolSearchResult,
  ToolValidationResult,
} from "./types"

// Константы
export {
  AI_TOOL_DOMAINS,
  AI_TOOL_EXECUTION_STATUSES,
  AI_TOOL_PRIORITIES,
  ANALYSIS_TOOL_CATEGORIES,
  AUTOMATION_TOOL_CATEGORIES,
  CORE_TOOL_CATEGORIES,
  INTEGRATION_TOOL_CATEGORIES,
} from "./types"

/**
 * Утилитарные функции для работы с доменом
 */
export const AIToolsDomainUtils = {
  /**
   * Быстрая инициализация домена
   */
  async initialize(config?: Partial<import("./types").AIToolsConfig>) {
    const container = getAIToolsContainer()
    if (config) {
      container.updateConfig(config)
    }
    await container.initialize()
    return container
  },

  /**
   * Регистрация инструмента
   */
  registerTool(tool: import("./types").IAITool) {
    const container = getAIToolsContainer()
    const registry = container.getToolRegistry()
    registry.register(tool)
  },

  /**
   * Выполнение инструмента
   */
  async executeTool(toolName: string, input: any, options?: import("./types").AIToolExecutionOptions) {
    const container = getAIToolsContainer()
    const engine = container.getExecutionEngine()
    return engine.execute(toolName, input, options)
  },

  /**
   * Поиск инструментов
   */
  searchTools(query: string, filters?: import("./types").ToolSearchFilters) {
    const container = getAIToolsContainer()
    const registry = container.getToolRegistry()
    return registry.search(query, filters)
  },

  /**
   * Получение статистики домена
   */
  getStatistics() {
    const container = getAIToolsContainer()
    return container.getContainerStats()
  },

  /**
   * Завершение работы домена
   */
  async shutdown() {
    const container = getAIToolsContainer()
    await container.shutdown()
  },
}

/**
 * Версия домена
 */
export const AI_TOOLS_DOMAIN_VERSION = "1.0.0"

/**
 * Информация о домене
 */
export const AI_TOOLS_DOMAIN_INFO = {
  name: "ai-tools",
  version: AI_TOOLS_DOMAIN_VERSION,
  description: "Домен AI инструментов для Timeline Studio",
  author: "Timeline Studio Team",
  license: "MIT",

  // Поддерживаемые домены инструментов
  supportedDomains: [
    "core", // Основные инструменты (timeline, resources, browser, player)
    "analysis", // Анализ (video, audio, content-intelligence, whisper, multimodal)
    "automation", // Автоматизация (batch, workflow, templates, performance)
    "integration", // Интеграция (export, platform-integration)
  ] as const,

  // Общее количество поддерживаемых инструментов
  totalSupportedTools: 48,

  // Статистика по доменам
  toolsByDomain: {
    core: 18,
    analysis: 15,
    automation: 10,
    integration: 5,
  },

  // Возможности
  features: [
    "Унифицированный интерфейс для всех AI инструментов",
    "Автоматическое управление жизненным циклом",
    "Параллельное выполнение и batch обработка",
    "Мониторинг производительности и метрики",
    "Система событий и плагинов",
    "Поиск и фильтрация инструментов",
    "Валидация входных и выходных данных",
    "Обработка ошибок и retry логика",
    "Кэширование результатов",
    "Логирование и отладка",
  ],

  // Требования
  requirements: {
    node: ">=18.0.0",
    typescript: ">=5.0.0",
    dependencies: ["@tauri-apps/api", "react", "typescript"],
  },
}

/**
 * Проверка совместимости
 */
export function checkCompatibility(): { compatible: boolean; issues: string[] } {
  const issues: string[] = []

  // Проверяем наличие необходимых глобальных объектов
  if (typeof window === "undefined") {
    issues.push("Домен AI Tools требует браузерного окружения")
  }

  // Проверяем поддержку современных JS функций
  if (!Promise.allSettled) {
    issues.push("Требуется поддержка Promise.allSettled")
  }

  if (!Array.prototype.flatMap) {
    issues.push("Требуется поддержка Array.prototype.flatMap")
  }

  return {
    compatible: issues.length === 0,
    issues,
  }
}

/**
 * Экспорт для обратной совместимости с существующими AI Chat tools
 */
export const LegacyAIToolsCompat = {
  /**
   * Создание адаптера для старых инструментов
   */
  createLegacyAdapter(legacyTool: any): import("./types").IAITool {
    // Здесь будет логика адаптации старых инструментов
    // к новому интерфейсу IAITool
    throw new Error("Legacy adapter not implemented yet")
  },

  /**
   * Миграция старых конфигураций
   */
  migrateLegacyConfig(legacyConfig: any): import("./types").AIToolsConfig {
    // Здесь будет логика миграции старых конфигураций
    throw new Error("Legacy config migration not implemented yet")
  },
}

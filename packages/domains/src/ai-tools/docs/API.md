# AI Tools Domain - API Reference

## Table of Contents

- [Core Exports](#core-exports)
- [DI Container](#di-container)
- [Base Classes](#base-classes)
- [Tool Collections](#tool-collections)
- [Utilities](#utilities)
- [Types](#types)

---

## Core Exports

### AIToolsDomainUtils

Утилитарные функции для работы с доменом.

```typescript
import { AIToolsDomainUtils } from "@/domains/ai-tools"

// Инициализация домена
const container = await AIToolsDomainUtils.initialize({
  enableLogging: true,
  maxConcurrentExecutions: 10
})

// Регистрация инструмента
AIToolsDomainUtils.registerTool(myTool)

// Выполнение инструмента
const result = await AIToolsDomainUtils.executeTool("CreateProjectTool", input)

// Поиск инструментов
const found = AIToolsDomainUtils.searchTools("timeline")

// Получение статистики
const stats = AIToolsDomainUtils.getStatistics()

// Завершение работы
await AIToolsDomainUtils.shutdown()
```

---

## DI Container

### AIToolsContainer

Singleton DI контейнер для управления зависимостями.

```typescript
import { getAIToolsContainer, AIToolsContainer } from "@/domains/ai-tools"

const container = getAIToolsContainer()

// Основные сервисы
const registry = container.getToolRegistry()
const engine = container.getExecutionEngine()
const logger = container.getLogger()

// Конфигурация
const config = container.getConfig()
container.updateConfig({ enableLogging: false })

// Жизненный цикл
await container.initialize()
await container.shutdown()

// Регистрация сервисов
container.registerService("MyService", myService)
const service = container.getService<MyService>("MyService")

// Статистика
const stats = container.getContainerStats()
```

### AIToolsContainerUtils

Утилиты для настройки контейнера.

```typescript
import { AIToolsContainerUtils } from "@/domains/ai-tools"

// Инициализация с конфигурацией
const container = await AIToolsContainerUtils.initializeWithConfig({
  defaultTimeout: 30000,
  maxConcurrentExecutions: 10
})

// Быстрая настройка для разработки
const devContainer = await AIToolsContainerUtils.setupForDevelopment()

// Быстрая настройка для продакшена
const prodContainer = await AIToolsContainerUtils.setupForProduction()

// Настройка для тестирования
const testContainer = await AIToolsContainerUtils.setupForTesting()
```

---

## Base Classes

### BaseAITool

Базовый абстрактный класс для создания инструментов.

```typescript
import { BaseAITool } from "@/domains/ai-tools"

class MyTool extends BaseAITool<MyInput, MyOutput> {
  name = "MyTool"
  description = "My custom tool"

  protected async executeInternal(input: MyInput): Promise<MyOutput> {
    // Реализация логики инструмента
    return result
  }
}
```

**Методы:**
| Method | Description |
|--------|-------------|
| `execute(input)` | Выполнение с обработкой ошибок и retry |
| `validate(input)` | Валидация входных данных |
| `getMetadata()` | Получение метаданных инструмента |
| `getSchema()` | Получение JSON Schema параметров |

---

### ToolRegistry

Реестр инструментов.

```typescript
import { ToolRegistry } from "@/domains/ai-tools"

const registry = ToolRegistry.getInstance()

// Регистрация инструмента
registry.register(myTool)

// Получение инструмента
const tool = registry.get("MyTool")

// Проверка наличия
const exists = registry.has("MyTool")

// Поиск инструментов
const results = registry.search("timeline", {
  domain: "core",
  category: "timeline"
})

// Получение по домену/категории
const coreTools = registry.getToolsByDomain("core")
const timelineTools = registry.getToolsByCategory("timeline")

// Получение всех инструментов
const allTools = registry.getAll()

// Статистика
const stats = registry.getStatistics()

// Очистка
registry.clear()
```

---

### ExecutionEngine

Движок выполнения инструментов.

```typescript
import { ExecutionEngine } from "@/domains/ai-tools"

const engine = ExecutionEngine.getInstance()

// Выполнение инструмента
const result = await engine.execute("MyTool", input, {
  timeout: 30000,
  retries: 3
})

// Batch выполнение
const results = await engine.executeBatch([
  { toolName: "Tool1", input: input1 },
  { toolName: "Tool2", input: input2 }
])

// Pipeline выполнение
const pipelineResult = await engine.executePipeline([
  { toolName: "AnalyzeTool", input },
  { toolName: "ProcessTool" }, // Получает output предыдущего
  { toolName: "ExportTool" }
])

// Активные выполнения
const active = engine.getActiveExecutions()

// Метрики
const metrics = engine.getMetrics()

// Настройка concurrency
engine.setMaxConcurrentExecutions(20)

// События
engine.addEventListener("execution:started", handler)
engine.addEventListener("execution:completed", handler)
engine.addEventListener("execution:failed", handler)

// Сброс
engine.reset()
```

---

### Loggers

```typescript
import { ConsoleAIToolLogger, NoOpAIToolLogger } from "@/domains/ai-tools"

// Console logger с prefix
const logger = new ConsoleAIToolLogger("[AITools]")
logger.info("Message", { data: "value" })
logger.warn("Warning")
logger.error("Error", { error })
logger.debug("Debug info")

// No-op logger (для тестов/продакшена)
const noop = new NoOpAIToolLogger()
```

---

## Tool Collections

### All Tools

```typescript
import { allAITools } from "@/domains/ai-tools"

// Массив всех инструментов
const tools = allAITools // IAITool[]
```

### By Domain

```typescript
import {
  coreTools,      // Core tools (24)
  browserTools,   // Browser tools
  playerTools,    // Player tools
  resourceTools,  // Resource tools
  timelineTools   // Timeline tools
} from "@/domains/ai-tools"
```

### Tool Search & Grouping

```typescript
import {
  findToolByName,
  getAllToolMetadata,
  getAllToolSchemas,
  getTagsStatistics,
  getToolsByCategory,
  getToolsByDomain,
  getToolsByTags,
  getToolsGroupedByCategory,
  getToolsGroupedByDomain,
  getToolsWithDependencies
} from "@/domains/ai-tools"

// Поиск по имени
const tool = findToolByName("CreateProjectTool")

// Метаданные всех инструментов
const metadata = getAllToolMetadata()

// JSON Schemas всех инструментов
const schemas = getAllToolSchemas()

// Статистика тегов
const tagStats = getTagsStatistics()

// По категории/домену
const byCategory = getToolsByCategory("timeline")
const byDomain = getToolsByDomain("core")
const byTags = getToolsByTags(["video", "analysis"])

// Группировка
const groupedByCategory = getToolsGroupedByCategory()
const groupedByDomain = getToolsGroupedByDomain()

// С зависимостями
const withDeps = getToolsWithDependencies("CreateProjectTool")
```

### Tool Validation

```typescript
import {
  validateAllTools,
  checkToolsIntegrity,
  analyzeDependencies
} from "@/domains/ai-tools"

// Валидация всех инструментов
const validation = validateAllTools()

// Проверка целостности
const integrity = checkToolsIntegrity()

// Анализ зависимостей
const deps = analyzeDependencies()
```

### Registration

```typescript
import { registerAllToolsInContainer } from "@/domains/ai-tools"

// Регистрация всех инструментов в контейнере
await registerAllToolsInContainer(container)
```

---

## Utilities

### checkCompatibility

Проверка совместимости окружения.

```typescript
import { checkCompatibility } from "@/domains/ai-tools"

const { compatible, issues } = checkCompatibility()
if (!compatible) {
  console.error("Issues:", issues)
}
```

---

## Types

### Core Types

```typescript
import type {
  // Основные интерфейсы
  IAITool,
  IToolRegistry,
  IExecutionEngine,
  IAIToolsContainer,

  // Результаты
  AIToolResult,
  BatchExecutionResult,
  PipelineExecutionResult,
  ToolValidationResult,

  // Контексты
  AIToolExecutionContext,
  AIToolExecutionOptions,
  BatchExecutionContext,
  PipelineExecutionContext,
  FullExecutionContext,

  // Конфигурация
  AIToolsConfig,
  AIToolsDomainConfig,

  // Метаданные
  AIToolMetadata,
  AIToolExample,

  // Домены и категории
  AIToolDomain,
  AIToolCategory,
  CoreToolCategory,
  AnalysisToolCategory,
  AutomationToolCategory,
  IntegrationToolCategory,

  // Статусы
  AIToolExecutionStatus,
  AIToolPriority,

  // События
  AIToolExecutionEvent,
  AIToolsEventMap,

  // Статистика
  AIToolsStatistics,
  DomainStats,
  ExecutionMetrics,

  // Поиск
  ToolSearchResult,
  ToolSearchMatch,
  ToolSearchFilters,

  // Плагины
  AIToolPlugin,
  AIToolLogger,
  AIToolTask,

  // Специальные контексты
  DebugContext,
  PerformanceContext,
  SecurityContext,

  // Анализ
  PerformanceAnalysisResult,

  // Миграция
  MigrationInfo,
  MigrationStep
} from "@/domains/ai-tools"
```

### Constants

```typescript
import {
  AI_TOOL_DOMAINS,
  AI_TOOL_EXECUTION_STATUSES,
  AI_TOOL_PRIORITIES,
  CORE_TOOL_CATEGORIES,
  ANALYSIS_TOOL_CATEGORIES,
  AUTOMATION_TOOL_CATEGORIES,
  INTEGRATION_TOOL_CATEGORIES
} from "@/domains/ai-tools"
```

### Statistics

```typescript
import {
  AI_TOOLS_DOMAIN_STATS,
  CORE_TOOLS_COUNT,
  CORE_TOOLS_STATS,
  AI_TOOLS_DOMAIN_VERSION,
  AI_TOOLS_DOMAIN_INFO
} from "@/domains/ai-tools"
```

---

## AIToolsConfig

```typescript
interface AIToolsConfig {
  defaultTimeout: number      // Default: 30000ms
  defaultRetries: number      // Default: 1
  enableLogging: boolean      // Default: true
  enableMetrics: boolean      // Default: true
  maxConcurrentExecutions: number  // Default: 10
  cacheResults: boolean       // Default: false
  cacheTTL: number           // Default: 300000ms (5 min)
}
```

---

## AIToolResult

```typescript
interface AIToolResult<T = any> {
  success: boolean
  data?: T
  error?: string
  executionTime: number
  metadata?: {
    toolName: string
    executionId: string
    timestamp: string
    retryCount?: number
  }
}
```

---

## AIToolMetadata

```typescript
interface AIToolMetadata {
  name: string
  description: string
  domain: AIToolDomain
  category: AIToolCategory
  version: string
  author?: string
  tags?: string[]
  examples?: AIToolExample[]
  dependencies?: string[]
  inputSchema: JSONSchema
  outputSchema: JSONSchema
}
```

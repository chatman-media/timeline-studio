# AI Intelligence Orchestrator

Координатор всех AI процессов, управляющий работой движков и сервисов.

> ⚠️ **Важно**: Файлы оркестратора находятся в `shared/services/`, а не в `orchestrator/`. Эта папка содержит только документацию.

## 🎯 Назначение

Orchestrator является центральной точкой управления всеми AI функциями в модуле. Он координирует работу различных движков, управляет pipeline обработки и предоставляет единый API для использования AI возможностей.

## 🏗️ Архитектура

```
shared/services/
├── ai-intelligence-orchestrator.ts      # Основной оркестратор (XState)
├── ai-intelligence-machine.ts           # XState машина состояний
└── ...

orchestrator/
└── README.md  # Документация (этот файл)
```

Оркестратор находится в `shared/services/` для лучшей организации кода и использует XState для управления состоянием.

### Архитектура оркестратора:
- **Подход**: Декларативная архитектура на базе XState машины состояний
- **Управление состоянием**: Автоматическое через state machine
- **Обработка событий**: Встроенная система событий XState
- **Контроль процесса**: Продвинутый (pause/resume/cancel встроены в машину)
- **Интеграция**: Использует actors для асинхронных операций
- **Выполнение**: Поддержка параллельного выполнения операций

### Основные преимущества XState подхода:
1. **Надежность** - невозможны недопустимые переходы состояний
2. **Визуализация** - можно визуализировать поток обработки
3. **Отладка** - лучшая отслеживаемость состояний
4. **Масштабируемость** - легко добавлять новые состояния и переходы
5. **Тестируемость** - можно тестировать машину состояний отдельно

## 🚀 Основные функции

### Инициализация

```typescript
import { AIIntelligenceOrchestrator } from '@/features/ai-content-intelligence/shared/services/ai-intelligence-orchestrator'
import { createLogger } from '@/lib/tauri-logger'

const logger = createLogger('Example')

const orchestrator = AIIntelligenceOrchestrator.getInstance()
await orchestrator.initialize()
```

### Анализ контента

```typescript
const analysis = await orchestrator.analyzeContent({
  mediaFile: {
    path: '/path/to/video.mp4',
    filename: 'video.mp4',
    duration: 120,
    size: 1024000,
    format: 'mp4'
  }
})
```

### Полная обработка проекта

```typescript
const result = await orchestrator.processProject(
  mediaFiles,
  {
    providers: [{
      provider: 'openai',
      model: 'gpt-4'
    }],
    features: {
      sceneAnalysis: true,
      scriptGeneration: true,
      multiPlatform: true
    },
    platforms: ['youtube', 'tiktok']
  }
)
```

## 🔄 Pipeline обработки

### Этапы обработки

1. **Initialization** - Инициализация движков
2. **Scene Analysis** - Анализ сцен и видео
3. **Content Classification** - Классификация контента
4. **Script Generation** - Генерация скриптов
5. **Platform Adaptation** - Адаптация под платформы
6. **Finalization** - Финализация результатов

### Управление процессом

```typescript
// Получить прогресс
const progress = orchestrator.getProgress()
logger.debugSync(progress.overall) // 0-100%
logger.debugSync(progress.currentStep) // Текущий шаг

// Управление
orchestrator.pause()   // Пауза
orchestrator.resume()  // Продолжить
orchestrator.cancel()  // Отменить

// События
orchestrator.onProgress((progress) => {
  logger.debugSync(`Прогресс: ${progress.overall}%`)
})

orchestrator.onEvent((event) => {
  if (event.type === 'STEP_COMPLETED') {
    logger.debugSync(`Завершен шаг: ${event.step}`)
  }
})
```

## 🎭 XState машина состояний

Оркестратор использует XState для управления состоянием:

```typescript
// Состояния машины
- idle          // Ожидание
- initializing  // Инициализация
- analyzing     // Анализ
  - scene       // Анализ сцен
  - script      // Генерация скриптов
  - platform    // Адаптация платформ
- finalizing    // Финализация
- completed     // Завершено
- error         // Ошибка
- paused        // Пауза
```

### События машины

```typescript
// Основные события
- START_PROCESSING
- ANALYSIS_COMPLETE
- SCRIPT_GENERATED
- PLATFORM_ADAPTED
- PAUSE
- RESUME
- CANCEL
- ERROR
```

## 🔌 Интеграция с движками

### Scene Analysis Engine

```typescript
// Автоматически вызывается в pipeline
const sceneResult = await sceneEngine.process(mediaFile)
```

### Script Generation Engine

```typescript
// Использует результаты анализа сцен
const script = await scriptEngine.generateScript(
  sceneResult,
  params
)
```

### Multi-Platform Engine

```typescript
// Адаптирует контент и скрипт
const adaptations = await platformEngine.adaptContent(
  unifiedAnalysis,
  platforms
)
```

## 📊 Типы данных

### PipelineControl

```typescript
interface PipelineControl {
  start: () => Promise<void>
  pause: () => void
  resume: () => void
  cancel: () => void
  getProgress: () => PipelineProgress
  onProgress: (callback: (progress: PipelineProgress) => void) => () => void
  onEvent: (callback: (event: PipelineEvent) => void) => () => void
}
```

### PipelineProgress

```typescript
interface PipelineProgress {
  overall: number // 0-100
  currentStep: string
  steps: Array<{
    name: string
    progress: number
    status: 'pending' | 'running' | 'completed' | 'error'
  }>
  messages: string[]
}
```

## 🔧 Конфигурация

### AIConfig

```typescript
interface AIConfig {
  providers: AIProvider[]
  defaultProvider: string
  features: {
    sceneAnalysis: boolean
    scriptGeneration: boolean
    multiPlatform: boolean
    contentClassification: boolean
    qualityEnhancement: boolean
    autoSuggestions: boolean
  }
  processing: {
    parallel: boolean
    maxConcurrent: number
    batchSize: number
    cacheResults: boolean
    cacheDuration: number
    retryAttempts: number
    timeout: number
  }
  quality: {
    analysisDepth: 'basic' | 'standard' | 'deep'
    accuracy: 'fast' | 'balanced' | 'precise'
    speed: 'slow' | 'normal' | 'fast'
    resourceUsage: {
      maxCPU: number
      maxRAM: number
      maxDiskSpace: number
    }
  }
  platforms?: PlatformId[]
}
```

## ⚡ Оптимизация

### Параллельная обработка

```typescript
// Обработка нескольких файлов одновременно
const results = await orchestrator.processMultiple(
  files,
  {
    processing: {
      parallel: true,
      maxConcurrent: 3
    }
  }
)
```

### Кэширование

```typescript
// Результаты кэшируются автоматически
const config = {
  processing: {
    cacheResults: true,
    cacheDuration: 24 * 60 * 60 // 24 часа
  }
}
```

## 🔍 Отладка

```typescript
// Включить debug режим
orchestrator.debug = true

// Логирование событий
orchestrator.onEvent((event) => {
  logger.debugSync(`[${event.timestamp}] ${event.type}:`, event.data)
})

// Получить статистику
const stats = orchestrator.getStats()
logger.debugSync(stats.processedFiles)
logger.debugSync(stats.totalProcessingTime)
logger.debugSync(stats.averageFileTime)
```

## 📝 Примеры использования

### Управление процессом с XState

```typescript
const orchestrator = AIIntelligenceOrchestrator.getInstance()

// Создаем контроллер для управления pipeline
const control = orchestrator.createPipelineControl()

// Подписываемся на события прогресса
control.onProgress((progress) => {
  logger.debugSync(`Общий прогресс: ${progress.overall}%`)
  logger.debugSync(`Текущий шаг: ${progress.currentStep}`)
})

// Запускаем обработку
const resultPromise = orchestrator.processProject(files, config)

// Можем управлять процессом
control.pause()   // Приостановить
control.resume()  // Продолжить
control.cancel()  // Отменить

// Получаем результат
const result = await resultPromise
```

### Базовый workflow

```typescript
// 1. Получить экземпляр оркестратора (Singleton)
const orchestrator = AIIntelligenceOrchestrator.getInstance()

// 2. Инициализировать
await orchestrator.initialize()

// 3. Обработать контент
const result = await orchestrator.processProject(
  [videoFile],
  {
    features: {
      sceneAnalysis: true,
      scriptGeneration: true,
      multiPlatform: true
    },
    platforms: ['youtube', 'tiktok']
  }
)

// 4. Использовать результаты
logger.debugSync(result.analysis)      // Анализ
logger.debugSync(result.scripts)       // Скрипты
logger.debugSync(result.adaptations)   // Адаптации
```

### Интеграция с UI

```typescript
function VideoProcessor() {
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState('')
  
  const processVideo = async (file) => {
    const orchestrator = AIIntelligenceOrchestrator.getInstance()
    
    // Создаем pipeline control для управления процессом
    const control = orchestrator.createPipelineControl()
    
    control.onProgress((p) => {
      setProgress(p.overall)
      setStatus(p.currentStep)
    })
    
    const result = await orchestrator.analyzeContent([file])
    
    return result
  }
}
```

## ⚠️ Обработка ошибок

```typescript
try {
  const result = await orchestrator.processProject(files, config)
} catch (error) {
  if (error.code === 'INITIALIZATION_FAILED') {
    // Ошибка инициализации
  } else if (error.code === 'PROCESSING_TIMEOUT') {
    // Таймаут обработки
  } else if (error.code === 'INSUFFICIENT_RESOURCES') {
    // Недостаточно ресурсов
  }
}

// Или через события
orchestrator.onEvent((event) => {
  if (event.type === 'ERROR') {
    logger.errorSync(event.error)
  }
})
```
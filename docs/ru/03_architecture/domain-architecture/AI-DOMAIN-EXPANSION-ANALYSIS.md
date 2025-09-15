# AI Domain Expansion Analysis - Полный анализ оставшегося функционала

## 🎯 Обзор

После завершения базовой миграции AI модулей на доменную архитектуру, обнаружен значительный объем функционала, который требует дальнейшего расширения доменного дизайна. Анализ показывает **~200+ AI-связанных компонентов, сервисов и инструментов**, которые нуждаются в систематизации.

## 📊 Статистика оставшегося функционала

### AI Chat Tools (48 инструментов)
- **Core Domain**: 18 инструментов (timeline, resources, browser, player)
- **Analysis Domain**: 15 инструментов (video/audio analysis, content intelligence)
- **Automation Domain**: 10 инструментов (batch processing, workflows)
- **Integration Domain**: 5 инструментов (export, platform integration)

### Оставшиеся AI Features
- **ai-content-intelligence**: 25+ компонентов/сервисов/хуков
- **montage-planner**: 15+ AI-интеграционных сервисов
- **person-identification**: 8+ сервисов и компонентов
- **recognition**: 6+ сервисов YOLO/scene detection
- **transcription**: 5+ компонентов и хуков

## 🏗️ Предлагаемое расширение доменной архитектуры

### Новые домены

#### 1. `domains/ai-tools` - AI Инструменты для чата
```
domains/ai-tools/
├── core/                    # Основные инструменты Timeline Studio
│   ├── timeline/           # Управление проектами и таймлайном
│   ├── resources/          # Эффекты, фильтры, переходы
│   ├── browser/            # Навигация по медиа
│   ├── player/             # Управление плеером
│   └── settings/           # Конфигурация проекта
├── analysis/               # Инструменты анализа
│   ├── video-analysis/     # Анализ видео (сцены, качество)
│   ├── audio-analysis/     # Анализ аудио (тишина, ритм)
│   ├── content-intelligence/ # Интеллектуальный анализ
│   ├── whisper-tools/      # Транскрипция речи
│   └── multimodal/         # Комбинированный анализ
├── automation/             # Автоматизация процессов
│   ├── batch-processing/   # Пакетная обработка
│   ├── workflow-automation/ # Автоматические workflow
│   ├── smart-templates/    # Интеллектуальные шаблоны
│   └── performance/        # Оптимизация производительности
├── integration/            # Интеграции и экспорт
│   ├── export-tools/       # Экспорт в различные форматы
│   ├── platform-integration/ # Соцсети и платформы
│   └── format-conversion/  # Конвертация форматов
├── base/                   # Базовые классы и утилиты
│   ├── base-ai-tool.ts     # Базовый класс инструментов
│   ├── tool-registry.ts    # Реестр инструментов
│   └── execution-engine.ts # Движок выполнения
└── types/                  # Типы для AI инструментов
    ├── tool-interfaces.ts
    ├── execution-context.ts
    └── result-types.ts
```

#### 2. `domains/content-intelligence` - Интеллектуальный анализ контента
```
domains/content-intelligence/
├── engines/                # Движки анализа
│   ├── scene-analysis/     # Анализ сцен
│   ├── script-generation/  # Генерация скриптов
│   ├── content-classification/ # Классификация контента
│   └── platform-adaptation/ # Адаптация под платформы
├── orchestrators/          # Оркестраторы процессов
│   ├── unified-pipeline/   # Единый пайплайн обработки
│   ├── content-orchestrator/ # Оркестратор контента
│   └── analysis-coordinator/ # Координатор анализа
├── factories/              # Фабрики для создания сервисов
│   ├── engine-factory.ts   # Фабрика движков
│   └── analysis-factory.ts # Фабрика анализаторов
├── machines/               # XState машины состояний
│   ├── content-intelligence-machine.ts
│   └── pipeline-machine.ts
├── providers/              # React провайдеры
│   ├── ai-intelligence-provider.tsx
│   └── content-pipeline-provider.tsx
└── types/                  # Типы для content intelligence
    ├── analysis-types.ts
    ├── pipeline-types.ts
    └── orchestration-types.ts
```

#### 3. `domains/montage-planning` - Планирование монтажа
```
domains/montage-planning/
├── services/               # Сервисы планирования
│   ├── content-analyzer.ts # Анализ контента для монтажа
│   ├── moment-detector.ts  # Детекция ключевых моментов
│   ├── plan-generator.ts   # Генерация планов монтажа
│   ├── rhythm-calculator.ts # Расчет ритма
│   └── timeline-integration.ts # Интеграция с таймлайном
├── ai-integration/         # AI интеграция
│   ├── montage-ai-service.ts # AI сервис для монтажа
│   └── quality-analyzer.ts # Анализ качества
├── machines/               # Машины состояний
│   └── montage-planner-machine.ts
├── utils/                  # Утилиты
│   └── media-converter.ts  # Конвертация медиа
└── types/                  # Типы для montage planning
    ├── montage-types.ts
    ├── analysis-types.ts
    └── planning-types.ts
```

#### 4. `domains/media-recognition` - Распознавание в медиа
```
domains/media-recognition/
├── person-identification/  # Идентификация людей
│   ├── face-detection.ts   # Детекция лиц
│   ├── face-tracking.ts    # Трекинг лиц
│   ├── person-database.ts  # База данных людей
│   └── identification-engine.ts # Движок идентификации
├── object-recognition/     # Распознавание объектов
│   ├── yolo-service.ts     # YOLO детекция
│   ├── scene-context.ts    # Контекст сцены
│   └── object-tracker.ts   # Трекинг объектов
├── transcription/          # Транскрипция речи
│   ├── whisper-service.ts  # Whisper сервис
│   ├── language-detection.ts # Детекция языка
│   └── subtitle-generator.ts # Генерация субтитров
├── machines/               # Машины состояний
│   ├── recognition-machine.ts
│   └── transcription-machine.ts
└── types/                  # Типы для recognition
    ├── person-types.ts
    ├── recognition-types.ts
    └── transcription-types.ts
```

## 🔄 План миграции (Phase 4: Domain Expansion)

### Этап 1: AI Tools Domain (2-3 недели)
1. **Создание базовой структуры**
   - Создать `domains/ai-tools/` с подпапками
   - Мигрировать `BaseAITool` и базовые классы
   - Создать реестр инструментов и execution engine

2. **Миграция Core Tools**
   - Перенести timeline, resources, browser, player инструменты
   - Обновить импорты в AI Chat
   - Создать типы и интерфейсы

3. **Миграция Analysis Tools**
   - Перенести video/audio analysis инструменты
   - Интегрировать с существующими AI сервисами
   - Создать унифицированные интерфейсы

4. **Миграция Automation & Integration Tools**
   - Перенести batch processing и workflow инструменты
   - Создать export и platform integration инструменты
   - Настроить автоматизацию

### Этап 2: Content Intelligence Domain (2 недели)
1. **Создание структуры домена**
   - Создать `domains/content-intelligence/`
   - Мигрировать engines из `ai-content-intelligence`
   - Создать orchestrators и factories

2. **Миграция компонентов**
   - Перенести unified pipeline
   - Мигрировать React провайдеры
   - Обновить хуки и компоненты

3. **Интеграция с AI Services**
   - Связать с `domains/ai-services`
   - Создать единые интерфейсы
   - Настроить DI контейнер

### Этап 3: Montage Planning Domain (1-2 недели)
1. **Создание домена**
   - Создать `domains/montage-planning/`
   - Мигрировать сервисы из `features/montage-planner`
   - Создать AI интеграцию

2. **Интеграция с другими доменами**
   - Связать с `domains/ai-services`
   - Интегрировать с `domains/content-intelligence`
   - Создать машины состояний

### Этап 4: Media Recognition Domain (1-2 недели)
1. **Создание домена**
   - Создать `domains/media-recognition/`
   - Мигрировать person identification
   - Мигрировать object recognition и transcription

2. **Консолидация функционала**
   - Объединить дублированные сервисы
   - Создать единые интерфейсы
   - Настроить машины состояний

## 🎯 Ожидаемые результаты

### Количественные показатели
- **Сокращение дублирования**: с ~40% до <5%
- **Консолидация сервисов**: 200+ компонентов → 4 домена
- **Унификация интерфейсов**: 50+ интерфейсов → 10-15 стандартных
- **Улучшение производительности**: lazy loading по доменам

### Качественные улучшения
- **Четкая архитектура**: каждый домен имеет свою ответственность
- **Масштабируемость**: легко добавлять новый функционал
- **Тестируемость**: изолированное тестирование доменов
- **Поддерживаемость**: понятная структура для разработчиков

## 🛠️ Технические детали

### DI Container расширение
```typescript
// domains/ai-tools/container.ts
export const aiToolsContainer = createContainer()
aiToolsContainer.register("ToolRegistry", ToolRegistry)
aiToolsContainer.register("ExecutionEngine", ExecutionEngine)

// domains/content-intelligence/container.ts
export const contentIntelligenceContainer = createContainer()
contentIntelligenceContainer.register("UnifiedPipeline", UnifiedPipeline)
contentIntelligenceContainer.register("ContentOrchestrator", ContentOrchestrator)
```

### Межсоменное взаимодействие
```typescript
// Единая точка входа для всех AI доменов
export class AIDomainsOrchestrator {
  constructor(
    private aiServices: AIServicesContainer,
    private aiTools: AIToolsContainer,
    private contentIntelligence: ContentIntelligenceContainer,
    private montagePlanning: MontagePlanningContainer,
    private mediaRecognition: MediaRecognitionContainer
  ) {}
  
  async executeWorkflow(workflow: AIWorkflow): Promise<WorkflowResult> {
    // Координация между доменами
  }
}
```

## 📋 Следующие шаги

1. **Создать задачи** для каждого этапа миграции
2. **Начать с AI Tools Domain** как наиболее критичного
3. **Постепенно мигрировать** остальные домены
4. **Обновить документацию** по мере миграции
5. **Создать тесты** для новых доменов
6. **Провести performance тестирование** после каждого этапа

## 📋 Детальный анализ модулей

### AI Chat Tools - Подробная структура

#### Core Domain Tools (18 инструментов)
```typescript
// Timeline Tools (6 инструментов)
- CreateProjectTool: создание новых проектов
- ManageTimelineTool: управление структурой таймлайна
- AddClipTool: добавление клипов на таймлайн
- EditClipTool: редактирование свойств клипов
- DeleteClipTool: удаление клипов
- TimelineNavigationTool: навигация по таймлайну

// Resources Tools (4 инструмента)
- EffectsManagerTool: управление эффектами
- FiltersManagerTool: управление фильтрами
- TransitionsManagerTool: управление переходами
- ResourceBrowserTool: браузер ресурсов

// Browser Tools (4 инструмента)
- MediaBrowserTool: навигация по медиафайлам
- ProjectBrowserTool: браузер проектов
- TemplateBrowserTool: браузер шаблонов
- AssetBrowserTool: браузер ассетов

// Player Tools (4 инструмента)
- PlaybackControlTool: управление воспроизведением
- PlayerNavigationTool: навигация в плеере
- PreviewControlTool: управление превью
- PlayerSettingsTool: настройки плеера
```

#### Analysis Domain Tools (15 инструментов)
```typescript
// Video Analysis (5 инструментов)
- VideoQualityAnalysisTool: анализ качества видео
- SceneDetectionTool: детекция сцен
- MotionAnalysisTool: анализ движения
- ColorAnalysisTool: анализ цвета
- CompositionAnalysisTool: анализ композиции

// Audio Analysis (4 инструмента)
- AudioQualityAnalysisTool: анализ качества аудио
- SilenceDetectionTool: детекция тишины
- RhythmAnalysisTool: анализ ритма
- VolumeAnalysisTool: анализ громкости

// Content Intelligence (3 инструмента)
- ContentClassificationTool: классификация контента
- PlatformAdaptationTool: адаптация под платформы
- ScriptGenerationTool: генерация скриптов

// Whisper Tools (2 инструмента)
- TranscriptionTool: транскрипция речи
- LanguageDetectionTool: детекция языка

// Multimodal Analysis (1 инструмент)
- MultimodalAnalysisTool: комбинированный анализ
```

#### Automation Domain Tools (10 инструментов)
```typescript
// Batch Processing (4 инструмента)
- BatchVideoAnalysisTool: пакетный анализ видео
- BatchTranscriptionTool: пакетная транскрипция
- BatchSubtitleGenerationTool: пакетная генерация субтитров
- BatchQualityAnalysisTool: пакетный анализ качества

// Workflow Automation (3 инструмента)
- WorkflowExecutorTool: выполнение workflow
- AutomationSchedulerTool: планировщик автоматизации
- TaskQueueManagerTool: управление очередью задач

// Smart Templates (2 инструмента)
- SmartTemplateGeneratorTool: генерация умных шаблонов
- TemplateAdaptationTool: адаптация шаблонов

// Performance (1 инструмент)
- PerformanceOptimizerTool: оптимизация производительности
```

#### Integration Domain Tools (5 инструментов)
```typescript
// Export Tools (3 инструмента)
- VideoExportTool: экспорт видео
- AudioExportTool: экспорт аудио
- ProjectExportTool: экспорт проекта

// Platform Integration (2 инструмента)
- SocialMediaIntegrationTool: интеграция с соцсетями
- CloudStorageIntegrationTool: интеграция с облачными хранилищами
```

### AI Content Intelligence - Детальная структура

#### Компоненты (8 компонентов)
```typescript
// Dashboard Components
- UnifiedDashboard: главный дашборд
- AnalysisViewer: просмотр результатов анализа
- GenerationWizard: мастер генерации контента
- PreviewGrid: сетка превью

// Analysis Components
- ContentAnalysisPanel: панель анализа контента
- ScriptGenerationPanel: панель генерации скриптов
- PlatformAdaptationPanel: панель адаптации платформ
- ProgressIndicator: индикатор прогресса
```

#### Сервисы (7 сервисов)
```typescript
// Core Services
- AIIntelligenceOrchestrator: главный оркестратор
- UnifiedContentPipeline: единый пайплайн обработки
- EngineFactory: фабрика движков

// Analysis Services
- SceneAnalysisEngine: движок анализа сцен
- ScriptGenerationEngine: движок генерации скриптов
- ContentClassificationEngine: движок классификации
- PlatformAdaptationEngine: движок адаптации платформ
```

#### Хуки (5 хуков)
```typescript
- useAIIntelligence: главный хук для AI Intelligence
- useAIOrchestrator: хук для работы с оркестратором
- useAIIntelligenceOrchestrator: хук для оркестратора
- useContentPipeline: хук для пайплайна контента
- useEngineFactory: хук для фабрики движков
```

#### Типы (5 файлов типов)
```typescript
- unified-analysis.ts: типы для унифицированного анализа
- script-generation.ts: типы для генерации скриптов
- platform-adaptation.ts: типы для адаптации платформ
- pipeline-types.ts: типы для пайплайна
- orchestration-types.ts: типы для оркестрации
```

### Montage Planner - Детальная структура

#### Сервисы (8 сервисов)
```typescript
// Core Services
- MontagePlannerAIIntegration: AI интеграция
- ContentAnalyzer: анализатор контента
- PlanGenerator: генератор планов
- TimelineIntegrationService: интеграция с таймлайном

// Analysis Services
- MomentDetector: детектор ключевых моментов
- RhythmCalculator: калькулятор ритма
- QualityAnalyzer: анализатор качества
- MediaFileConverter: конвертер медиафайлов
```

#### Хуки (6 хуков)
```typescript
- useMontageePlanner: главный хук планировщика
- useContentAnalysis: хук для анализа контента
- useIntegratedAnalysis: хук для интегрированного анализа
- useMontageBackend: хук для бэкенда
- usePlanGenerator: хук для генератора планов
- useTimelineIntegration: хук для интеграции с таймлайном
```

#### Компоненты (5 компонентов)
```typescript
- MontagePlanner: главный компонент планировщика
- PlannerDashboard: дашборд планировщика
- AnalysisPanel: панель анализа
- EditorPanel: панель редактора
- ProgressViewer: просмотр прогресса
```

### Person Identification - Детальная структура

#### Сервисы (3 сервиса)
```typescript
- PersonDatabaseService: сервис базы данных людей
- AdvancedFaceDetectionService: продвинутая детекция лиц
- AdvancedTrackingService: продвинутый трекинг
```

#### Компоненты (6 компонентов)
```typescript
- PersonManager: менеджер людей
- PersonList: список людей
- PersonDetail: детали человека
- PersonForm: форма человека
- PersonFormModal: модальная форма
- RealtimeMonitor: монитор реального времени
```

#### Хуки (2 хука)
```typescript
- usePersonIdentification: основной хук идентификации
- useAdvancedPersonIdentification: продвинутый хук
```

### Recognition - Детальная структура

#### Сервисы (2 сервиса)
```typescript
- YoloDataService: сервис YOLO данных
- SceneContextService: сервис контекста сцены
```

#### Компоненты (4 компонента)
```typescript
- YoloDataVisualization: визуализация YOLO данных
- YoloDataOverlay: оверлей YOLO данных
- YoloGraphOverlay: графический оверлей
- YoloTrackOverlay: оверлей трекинга
```

#### Хуки (2 хука)
```typescript
- useYoloData: хук для YOLO данных
- useRecognitionPreview: хук для превью распознавания
```

### Transcription - Детальная структура

#### Компоненты (6 компонентов)
```typescript
- TranscriptionPanel: панель транскрипции
- EnhancedTranscriptionPanel: улучшенная панель
- TranscriptionEditor: редактор транскрипции
- LanguageSelector: селектор языка
- ModelSelector: селектор модели
- ModelSizeSelector: селектор размера модели
```

#### Хуки (2 хука)
```typescript
- useTranscription: основной хук транскрипции
- useEnhancedSubtitleAutomation: хук для автоматизации субтитров
```

## 🔍 Анализ дублирования и пересечений

### Критические дублирования
1. **PersonDatabaseService**: идентичные реализации в `features/person-identification/` и `domains/ai-services/`
2. **SceneAnalysisEngine**: дублирование между `features/ai-content-intelligence/` и `domains/ai-services/`
3. **WhisperService**: пересечения между `features/transcription/` и `domains/ai-services/`
4. **YoloDataService**: дублирование в `features/recognition/` и AI tools

### Интерфейсные пересечения
1. **UnifiedContentAnalysis**: 8+ определений в разных модулях
2. **VideoAnalysisResult**: 6+ вариантов интерфейса
3. **AudioAnalysisResult**: 4+ определения
4. **PipelineProgress**: множественные реализации

### Архитектурные проблемы
1. **Циклические зависимости**: features импортируют друг друга
2. **Нарушение SRP**: смешение UI и бизнес-логики
3. **Отсутствие единой точки входа**: каждый модуль имеет свои сервисы
4. **Дублированная конфигурация**: настройки AI в каждом модуле

## 🎯 Приоритеты миграции

### Высокий приоритет (критично)
1. **AI Tools Domain**: 48 инструментов требуют немедленной систематизации
2. **PersonDatabaseService**: устранение дублирования
3. **Content Intelligence**: консолидация 25+ компонентов

### Средний приоритет (важно)
1. **Montage Planning**: интеграция с AI сервисами
2. **Recognition Services**: объединение YOLO и scene context
3. **Transcription**: консолидация с Whisper сервисами

### Низкий приоритет (желательно)
1. **UI компоненты**: рефакторинг после миграции сервисов
2. **Тестирование**: создание тестов для новых доменов
3. **Документация**: обновление после завершения миграции

---

**Статус**: 📋 **ПЛАН ГОТОВ** - Готов к реализации Phase 4: Domain Expansion

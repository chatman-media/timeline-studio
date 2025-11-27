# Задача: Реализация 3 отдельных списков задач (Анализ, Рендеринг, Экспорт)

**Статус:** 🟡 Active
**Приоритет:** High
**Создано:** 2025-11-27
**Обновлено:** 2025-11-27
**Назначено:** Development Team

## 📋 Описание

Создать 3 отдельных списка задач в топбаре Timeline Studio:
1. **Analysis Tasks** - AI анализ видео (распознавание, моменты, монтажные планы)
2. **Render Tasks** - рендеринг видео (уже существует, требует доработки)
3. **Export Tasks** - экспорт в форматы (новый функционал)

Все списки должны работать через backend orchestrators с единообразным UI/UX.

## 🎯 Цели

- ✅ Единообразный UX для всех 3 списков задач
- ✅ Интеграция с существующими orchestrators (ai-services, video-editing, media-management)
- ✅ Real-time обновления статусов через polling (5 сек)
- ✅ Поддержка отмены задач
- ✅ i18n для всех текстов
- ✅ Консистентность с существующим кодом

## 📊 Текущее состояние

### Уже есть:
- ✅ **Publication Tasks** - публикация на платформы (YouTube, TikTok, etc.)
  - Компонент: `publication-tasks-dropdown.tsx`
  - Хук: `use-publication-tasks.ts`
  - Backend: YouTube Plugin через system-integration

- ✅ **Render Tasks** - рендеринг видео
  - Компонент: `render-jobs-dropdown.tsx`
  - Хук: `use-render-jobs.ts`
  - Backend: `videoCompilerRenderService`

### Требуется создать:
- ❌ **Analysis Tasks** - AI анализ (полностью новое)
- ❌ **Export Tasks** - экспорт в форматы (полностью новое)

## 🏗️ Архитектура

### Паттерн для всех списков

```
Feature Module (src/features/[feature-name]/)
├── components/
│   ├── [feature]-tasks-dropdown.tsx    # UI dropdown
│   ├── [feature]-task-item.tsx         # Карточка задачи
│   └── index.ts
├── hooks/
│   ├── use-[feature]-tasks.ts          # React hook с логикой
│   └── index.ts
├── types/
│   ├── [feature].ts                    # TypeScript типы
│   └── index.ts
├── __tests__/                          # Unit тесты
└── README.md
```

### Типы данных

**Analysis Task:**
```typescript
interface AnalysisTask {
  id: string
  video_path: string
  video_name: string
  status: AnalysisTaskStatus
  created_at: string
  completed_at?: string
  progress: AnalysisProgress
  current_stage: 'video' | 'audio' | 'moments' | 'plan'
  analysis_results?: {
    videoAnalysis?: ComprehensiveAnalysisResult
    momentScores?: MomentScore[]
    montagePlan?: MontagePlan
  }
  error_message?: string
}

enum AnalysisTaskStatus {
  Pending = "pending"
  AnalyzingVideo = "analyzing_video"
  AnalyzingAudio = "analyzing_audio"
  DetectingMoments = "detecting_moments"
  GeneratingPlan = "generating_plan"
  Completed = "completed"
  Failed = "failed"
  Cancelled = "cancelled"
}
```

**Export Task:**
```typescript
interface ExportTask {
  id: string
  project_name: string
  video_name: string
  status: ExportTaskStatus
  created_at: string
  completed_at?: string
  export_settings: ExportSettings
  output_format: OutputFormat
  target_platform?: 'youtube' | 'tiktok' | 'instagram' | 'local' | 'cloud'
  progress: ExportProgress
  output_path?: string
  file_size?: number
  error_message?: string
}

enum ExportTaskStatus {
  Queued = "queued"
  Preparing = "preparing"
  Encoding = "encoding"
  PostProcessing = "post_processing"
  Uploading = "uploading"
  Completed = "completed"
  Failed = "failed"
  Cancelled = "cancelled"
}
```

### Backend интеграция

**Analysis Tasks → AI Services Domain:**
```
use-analysis-tasks hook
  ↓
UnifiedOrchestrator.getActiveWorkflows()
  ↓
Subscribe to DOMAIN_EVENTS.CONTENT_ANALYSIS_*
  ↓
Map workflow status → AnalysisTask
```

**Export Tasks → Video Editing Domain:**
```
use-export-tasks hook
  ↓
videoCompilerRenderService (расширить)
  ↓
invoke("get_export_jobs")
  ↓
Tauri/Rust backend
```

## 📝 План реализации

### Этап 1: Типы и структуры (1-2 дня)

**Создать файлы:**
- [ ] `/src/features/analysis-tasks/types/analysis.ts`
  - AnalysisTask, AnalysisTaskStatus, AnalysisProgress
  - StageProgress для aiDirector и montagePlanner

- [ ] `/src/features/export/types/export-task.ts`
  - ExportTask, ExportTaskStatus, ExportProgress
  - ExportSettings, OutputFormat

**Задачи:**
- [ ] Определить все enum статусов
- [ ] Убедиться в совместимости с существующими типами
- [ ] Документировать каждое поле

---

### Этап 2: Backend интеграция (2-3 дня)

**Для Analysis Tasks:**
- [ ] Модифицировать `/src/domains/ai-services/services/unified-orchestrator.ts`
  - Экспортировать `getActiveWorkflows()` метод
  - Добавить `getWorkflowStatus(workflowId: string)`
  - Экспортировать interface для внешнего использования

- [ ] Создать `/src/domains/ai-services/services/analysis-task-bridge.ts`
  - Преобразование AnalysisWorkflow → AnalysisTask
  - Подписка на события CONTENT_ANALYSIS_*
  - Кэширование результатов

**Для Export Tasks:**
- [ ] Расширить `/src/domains/video-editing/services/video-compiler-render-service.ts`
  - Добавить `getExportJobs()` метод
  - Добавить `startExport()` метод
  - Добавить `cancelExport()` метод

- [ ] Создать `/src/features/export/services/export-task-service.ts`
  - Управление очередью экспорта
  - Отслеживание прогресса
  - Обработка ошибок

**Задачи:**
- [ ] Протестировать backend методы с mock данными
- [ ] Добавить логирование для debugging
- [ ] Обработать edge cases (отмена, ошибки)

---

### Этап 3: React hooks (2-3 дня)

**Создать:**
- [ ] `/src/features/analysis-tasks/hooks/use-analysis-tasks.ts`
  ```typescript
  function useAnalysisTasks(): {
    tasks: AnalysisTask[]
    isLoading: boolean
    error: string | null
    refreshTasks: () => Promise<void>
    getTask: (taskId: string) => Promise<AnalysisTask | null>
    cancelTask: (taskId: string) => Promise<boolean>
    startAnalysis: (videoPath: string, options?: AnalysisOptions) => Promise<string>
  }
  ```

- [ ] `/src/features/export/hooks/use-export-tasks.ts`
  ```typescript
  function useExportTasks(): {
    tasks: ExportTask[]
    isLoading: boolean
    error: string | null
    refreshTasks: () => Promise<void>
    getTask: (taskId: string) => Promise<ExportTask | null>
    cancelTask: (taskId: string) => Promise<boolean>
  }
  ```

**Паттерн реализации:**
- useState для tasks, isLoading, error
- useRef для предотвращения concurrent запросов
- useEffect с 5-сек polling
- useCallback для всех handlers
- Мемоизация через useMemo где необходимо

**Задачи:**
- [ ] Реализовать polling логику
- [ ] Добавить retry механизм
- [ ] Протестировать с mock backend

---

### Этап 4: UI компоненты (3-4 дня)

**Analysis Tasks:**
- [ ] `/src/features/analysis-tasks/components/analysis-tasks-dropdown.tsx`
  - DropdownMenu с иконкой Brain
  - Badge с количеством активных задач
  - ScrollArea для списка задач
  - Skeleton loaders

- [ ] `/src/features/analysis-tasks/components/analysis-task-item.tsx`
  - Название видео
  - Текущий stage (video/audio/moments/plan)
  - Progress bar с процентами
  - Кнопка отмены
  - Детальная информация stages

- [ ] `/src/features/analysis-tasks/components/analysis-progress-detail.tsx`
  - Детали по каждому stage
  - AI Director progress
  - Montage Planner progress

**Export Tasks:**
- [ ] `/src/features/export/components/export-tasks-dropdown.tsx`
  - DropdownMenu с иконкой HardDrive
  - Badge с количеством активных
  - ScrollArea для списка

- [ ] `/src/features/export/components/export-task-item.tsx`
  - Формат экспорта
  - Target platform (если есть)
  - Progress bar
  - ETA и скорость

- [ ] `/src/features/export/components/export-settings-summary.tsx`
  - Краткое отображение настроек экспорта
  - Разрешение, fps, codec

**Общие компоненты:**
- Использовать существующие: Badge, Progress, ScrollArea
- Консистентный дизайн со всеми dropdown'ами
- Пульсирующий индикатор для активных задач

**Задачи:**
- [ ] Дизайн mockups для всех компонентов
- [ ] Реализовать responsive layout
- [ ] Добавить анимации (fade-in, pulse)
- [ ] Протестировать на разных разрешениях

---

### Этап 5: Интеграция в Top Bar (1 день)

**Модифицировать:**
- [ ] `/src/features/media-studio/components/top-bar/top-bar.tsx`

**Изменения:**
```tsx
{/* Группа 5: Задачи и экспорт */}
<div className="flex items-center justify-end">
  <AnalysisTasksDropdown />      {/* НОВОЕ */}
  <PublicationTasksDropdown />
  <RenderJobsDropdown />
  <ExportTasksDropdown />         {/* НОВОЕ */}

  <Button /* AI Director */ />
  <Button /* Export modal */ />
</div>
```

**Иконки:**
- Analysis: Brain (уже используется для AI Director, разделить контексты)
- Publication: Send
- Render: ListTodo
- Export: HardDrive

**Задачи:**
- [ ] Добавить импорты новых компонентов
- [ ] Переорганизовать layout группы 5
- [ ] Протестировать responsive behavior
- [ ] Убедиться в правильном z-index для dropdown'ов

---

### Этап 6: i18n (1 день)

**Добавить в `/src/i18n/locales/[lang].json`:**

```json
{
  "analysis": {
    "taskTitle": "AI Analysis Tasks",
    "noTasks": "No analysis tasks",
    "activeTasks": "Active: {{count}}",
    "status": {
      "pending": "Pending",
      "analyzing_video": "Analyzing Video",
      "analyzing_audio": "Analyzing Audio",
      "detecting_moments": "Detecting Moments",
      "generating_plan": "Generating Plan",
      "completed": "Completed",
      "failed": "Failed",
      "cancelled": "Cancelled"
    },
    "stages": {
      "video": "Video Analysis",
      "audio": "Audio Analysis",
      "moments": "Moment Detection",
      "plan": "Montage Planning"
    }
  },
  "export": {
    "taskTitle": "Export Tasks",
    "noTasks": "No export tasks",
    "activeTasks": "Exporting: {{count}}",
    "status": {
      "queued": "Queued",
      "preparing": "Preparing",
      "encoding": "Encoding",
      "post_processing": "Post-Processing",
      "uploading": "Uploading",
      "completed": "Completed",
      "failed": "Failed",
      "cancelled": "Cancelled"
    }
  }
}
```

**Языки для перевода:**
- [ ] en - English
- [ ] ru - Русский
- [ ] es - Español
- [ ] fr - Français
- [ ] de - Deutsch
- [ ] pt - Português
- [ ] zh - 中文
- [ ] ja - 日本語
- [ ] ko - 한국어
- [ ] tr - Türkçe
- [ ] it - Italiano
- [ ] th - ไทย
- [ ] hi - हिन्दी
- [ ] ar - العربية
- [ ] fa - فارسی

---

### Этап 7: Тестирование (2-3 дня)

**Unit тесты:**
- [ ] `/src/features/analysis-tasks/__tests__/hooks/use-analysis-tasks.test.ts`
  - Тест polling логики
  - Тест cancel task
  - Тест error handling

- [ ] `/src/features/analysis-tasks/__tests__/components/analysis-tasks-dropdown.test.tsx`
  - Рендер с tasks
  - Рендер пустого состояния
  - Тест interactions

- [ ] `/src/features/export/__tests__/hooks/use-export-tasks.test.ts`
- [ ] `/src/features/export/__tests__/components/export-tasks-dropdown.test.tsx`

**Mocks:**
- [ ] `/src/features/analysis-tasks/__mocks__/analysis-tasks.ts`
  - Mock AnalysisTask данные
  - Mock responses

- [ ] `/src/features/export/__mocks__/export-tasks.ts`

**E2E тесты:**
- [ ] Тест создания и отслеживания Analysis Task
- [ ] Тест создания и отслеживания Export Task
- [ ] Тест отмены задачи
- [ ] Тест обработки ошибок

**Integration тесты:**
- [ ] Проверить работу с UnifiedOrchestrator
- [ ] Проверить работу с videoCompilerRenderService
- [ ] Проверить событийную интеграцию

---

### Этап 8: Документация (1 день)

**Создать:**
- [ ] `/src/features/analysis-tasks/README.md`
  - Описание функционала
  - API хука
  - Примеры использования
  - Архитектура

- [ ] `/src/features/export/README.md`

**Обновить:**
- [ ] `/src/features/README.md` - добавить новые модули
- [ ] `/docs/03_architecture/state-management.md` - описать task lists
- [ ] `/docs/05_development/ru/testing-strategy.md` - добавить тесты

---

## 📋 Чеклист выполнения

### Prerequisite
- [ ] Изучить текущую архитектуру Publication и Render Tasks
- [ ] Согласовать дизайн UI с командой
- [ ] Определить приоритеты (Analysis или Export первым)

### Analysis Tasks Module
- [ ] Типы и интерфейсы
- [ ] Backend интеграция (UnifiedOrchestrator)
- [ ] React hook (use-analysis-tasks)
- [ ] UI компоненты (dropdown, item, progress)
- [ ] Unit тесты
- [ ] i18n переводы

### Export Tasks Module
- [ ] Типы и интерфейсы
- [ ] Backend интеграция (export-task-service)
- [ ] React hook (use-export-tasks)
- [ ] UI компоненты (dropdown, item, settings)
- [ ] Unit тесты
- [ ] i18n переводы

### Integration
- [ ] Интеграция в top-bar.tsx
- [ ] E2E тесты
- [ ] Performance тестирование
- [ ] Документация

### Final
- [ ] Code review
- [ ] QA тестирование
- [ ] Deploy на staging
- [ ] User acceptance testing

---

## 🎨 UI Mockup

```
┌─────────────────────────────────────────────────┐
│ Top Bar                                         │
│ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌────────┐│
│ │ 🧠 1 │ │ 📤 2 │ │ 📋 3 │ │ 💾 1 │ │ Export ││
│ └──────┘ └──────┘ └──────┘ └──────┘ └────────┘│
│ Analysis Publication Render Export   Button    │
└─────────────────────────────────────────────────┘

Analysis Tasks Dropdown:
┌────────────────────────────────────────┐
│ 🧠 AI Analysis Tasks       [Spinner]  │
├────────────────────────────────────────┤
│ ┌────────────────────────────────────┐ │
│ │ video_001.mp4                      │ │
│ │ ━━━━━━━━━━░░░░░░░░░░░░ 65%        │ │
│ │ Stage: Detecting Moments           │ │
│ │ [×] Cancel                         │ │
│ └────────────────────────────────────┘ │
│                                        │
│ Active: 1 | Completed: 5              │
└────────────────────────────────────────┘
```

---

## ⚠️ Риски и проблемы

### Технические риски:
1. **Performance**: Polling 4 dropdown'ов каждые 5 сек
   - Решение: Оптимизация запросов, dedupe logic

2. **Memory leaks**: Multiple useEffect intervals
   - Решение: Proper cleanup в return функциях

3. **Backend load**: Множество параллельных запросов
   - Решение: Batch requests, кэширование

### Архитектурные вопросы:
1. **UnifiedOrchestrator access**: Нужна публичная API
   - Решение: Экспортировать необходимые методы

2. **Export vs Render разделение**: Где граница?
   - Решение: Export = финальная обработка + загрузка

3. **Event subscriptions**: Как обрабатывать в React?
   - Решение: Custom hook с cleanup

---

## 📊 Метрики успеха

- [ ] Все 3 списка работают с 5-сек обновлением
- [ ] < 100ms задержка UI при взаимодействии
- [ ] 100% покрытие unit тестами
- [ ] E2E тесты проходят
- [ ] i18n для всех 15 языков
- [ ] 0 TypeScript ошибок
- [ ] Документация завершена

---

## 🔗 Связанные задачи

- Зависит от: Нет
- Блокирует: Улучшение UX мониторинга задач
- Связано с: AI Director, Video Compiler, Export modal

---

## 📝 Примечания

- Следовать существующим паттернам из publication и render tasks
- Использовать shadcn/ui компоненты
- Консистентный дизайн со всем топ баром
- Мемоизация для производительности

---

**Автор:** Claude Code
**Дата создания:** 2025-11-27

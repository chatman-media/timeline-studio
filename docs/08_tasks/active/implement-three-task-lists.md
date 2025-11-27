# Задача: Реализация 3 отдельных списков задач (Анализ, Рендеринг, Публикация)

**Статус:** 🟡 Active
**Приоритет:** High
**Создано:** 2025-11-27
**Обновлено:** 2025-11-27
**Назначено:** Development Team

## 📋 Описание

Организовать 3 списка задач в топбаре Timeline Studio:
1. **Analysis Tasks** - AI анализ видео (распознавание, моменты, монтажные планы) - **НОВЫЙ**
2. **Render Tasks** - рендеринг видео - **УЖЕ ЕСТЬ**
3. **Publication Tasks** - экспорт и публикация на платформы - **УЖЕ ЕСТЬ**

Все списки должны работать через backend orchestrators с единообразным UI/UX.

**Важно:** Export и Publication - это одно и то же. Publication Tasks уже включает экспорт видео.

## 🎯 Цели

- ✅ Единообразный UX для всех 3 списков задач
- ✅ Интеграция с существующими orchestrators (ai-services, video-editing, media-management)
- ✅ Real-time обновления статусов через polling (5 сек)
- ✅ Поддержка отмены задач
- ✅ i18n для всех текстов
- ✅ Консистентность с существующим кодом

## 📊 Текущее состояние

### Уже есть:
- ✅ **Publication Tasks** - экспорт и публикация видео
  - Компонент: `publication-tasks-dropdown.tsx`
  - Хук: `use-publication-tasks.ts`
  - Backend: YouTube Plugin через system-integration
  - **Включает:** экспорт в форматы + загрузка на платформы

- ✅ **Render Tasks** - рендеринг видео
  - Компонент: `render-jobs-dropdown.tsx`
  - Хук: `use-render-jobs.ts`
  - Backend: `videoCompilerRenderService`

### Требуется создать:
- ❌ **Analysis Tasks** - AI анализ (полностью новое)

### Требуется доработать:
- 🔧 **Publication Tasks** - расширить для экспорта в локальные форматы (если нужно)
- 🔧 **Render Tasks** - проверить консистентность UI

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

**Publication Task (уже существует):**
```typescript
interface PublicationTask {
  id: string
  platform: PublicationPlatform // YouTube, TikTok, VK, Instagram, Facebook, Twitter, Local
  project_name: string
  video_path: string
  title: string
  status: PublicationStatus
  progress?: PublicationProgress
  created_at: string
  completed_at?: string
  error_message?: string
  video_url?: string // для онлайн платформ
  output_path?: string // для локального экспорта
}

enum PublicationStatus {
  Preparing = "preparing"
  Uploading = "uploading"
  Processing = "processing"
  Completed = "completed"
  Failed = "failed"
  Cancelled = "cancelled"
}

// Примечание: Publication включает как экспорт, так и загрузку
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

**Publication Tasks → System Integration Domain (уже реализовано):**
```
use-publication-tasks hook
  ↓
sendPluginCommand()
  ↓
YouTube/Platform Plugins
  ↓
Tauri Plugin API
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

### Этап 2: Backend интеграция (2 дня)

**Для Analysis Tasks (единственная новая интеграция):**
- [ ] Модифицировать `/src/domains/ai-services/services/unified-orchestrator.ts`
  - Экспортировать `getActiveWorkflows()` метод
  - Добавить `getWorkflowStatus(workflowId: string)`
  - Экспортировать interface для внешнего использования

- [ ] Создать `/src/domains/ai-services/services/analysis-task-bridge.ts`
  - Преобразование AnalysisWorkflow → AnalysisTask
  - Подписка на события CONTENT_ANALYSIS_*
  - Кэширование результатов

**Проверить Publication Tasks (уже реализовано):**
- [ ] Убедиться, что Publication Tasks поддерживает локальный экспорт
- [ ] Проверить работу с YouTube Plugin
- [ ] Добавить поддержку других платформ при необходимости

**Задачи:**
- [ ] Протестировать Analysis backend с mock данными
- [ ] Добавить логирование для debugging
- [ ] Обработать edge cases (отмена, ошибки)

---

### Этап 3: React hooks (1-2 дня)

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

**Проверить существующие:**
- [ ] `use-publication-tasks.ts` - убедиться в консистентности
- [ ] `use-render-jobs.ts` - убедиться в консистентности

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

### Этап 4: UI компоненты (2-3 дня)

**Analysis Tasks (новое):**
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

**Проверить существующие UI:**
- [ ] `publication-tasks-dropdown.tsx` - консистентность дизайна
- [ ] `render-jobs-dropdown.tsx` - консистентность дизайна

**Общие требования:**
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
  <AnalysisTasksDropdown />      {/* НОВОЕ - AI анализ */}
  <PublicationTasksDropdown />   {/* УЖЕ ЕСТЬ - экспорт/публикация */}
  <RenderJobsDropdown />         {/* УЖЕ ЕСТЬ - рендеринг */}

  <Button /* AI Director */ />
  <Button /* Export modal */ />
</div>
```

**Иконки:**
- Analysis: Brain или Sparkles (AI анализ)
- Publication: Send или Upload (экспорт/публикация)
- Render: ListTodo или Clapperboard (рендеринг)

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
    "activeTasks": "Analyzing: {{count}}",
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
  }
}
```

**Проверить существующие переводы:**
- [ ] `publication.*` - убедиться что все статусы переведены
- [ ] `render.*` - убедиться что все статусы переведены

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

### Этап 7: Тестирование (1-2 дня)

**Unit тесты (только для Analysis Tasks):**
- [ ] `/src/features/analysis-tasks/__tests__/hooks/use-analysis-tasks.test.ts`
  - Тест polling логики
  - Тест cancel task
  - Тест error handling

- [ ] `/src/features/analysis-tasks/__tests__/components/analysis-tasks-dropdown.test.tsx`
  - Рендер с tasks
  - Рендер пустого состояния
  - Тест interactions

**Mocks:**
- [ ] `/src/features/analysis-tasks/__mocks__/analysis-tasks.ts`
  - Mock AnalysisTask данные
  - Mock UnifiedOrchestrator responses

**E2E тесты:**
- [ ] Тест создания и отслеживания Analysis Task
- [ ] Тест отмены Analysis Task
- [ ] Тест обработки ошибок
- [ ] Интеграция всех 3 списков в top bar

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
  - Интеграция с UnifiedOrchestrator

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

### Analysis Tasks Module (НОВОЕ)
- [ ] Типы и интерфейсы
- [ ] Backend интеграция (UnifiedOrchestrator)
- [ ] React hook (use-analysis-tasks)
- [ ] UI компоненты (dropdown, item, progress)
- [ ] Unit тесты
- [ ] i18n переводы

### Существующие модули
- [ ] Проверить Publication Tasks (экспорт уже включён)
- [ ] Проверить Render Tasks (консистентность UI)

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
│ ┌──────┐ ┌──────┐ ┌──────┐ ┌────────┐         │
│ │ 🧠 1 │ │ 📤 2 │ │ 📋 3 │ │ Export │         │
│ └──────┘ └──────┘ └──────┘ └────────┘         │
│ Analysis Publication Render    Button           │
└─────────────────────────────────────────────────┘
Примечание: Publication = Export + Upload

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

2. **Publication Tasks scope**: Включает ли локальный экспорт?
   - Решение: Да, Publication = Export + Upload (опционально)

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

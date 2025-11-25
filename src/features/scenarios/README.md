# Scenarios

## Overview / Обзор

**EN:** Editing scenarios system for Timeline Studio. Provides predefined automated workflows for common video editing tasks. Includes step-by-step wizards for automation, structure creation, effects application, and workflow optimization. Supports AI-assisted and manual scenarios.

**RU:** Система сценариев монтажа для Timeline Studio. Предоставляет предопределённые автоматизированные рабочие процессы для распространённых задач видеомонтажа. Включает пошаговые мастера для автоматизации, создания структуры, применения эффектов и оптимизации рабочего процесса. Поддерживает AI-ассистированные и ручные сценарии.

## API (Backend Commands)

No direct Tauri backend commands. All scenario execution is client-side with optional AI integration.

## Behavior (from tests) / Поведение (из тестов)

### use-scenario.test.tsx
- ✓ should initialize with default values
- ✓ should select scenario by id
- ✓ should clear selection
- ✓ should get scenario by id
- ✓ should filter scenarios by category
- ✓ should filter scenarios by difficulty
- ✓ should filter scenarios by ai-assisted
- ✓ should filter scenarios by estimated time
- ✓ should reset filters
- ✓ should search scenarios by query
- ✓ should search in both languages
- ✓ should return empty array for non-matching query
- ✓ should sort scenarios by name ascending
- ✓ should sort scenarios by name descending
- ✓ should sort scenarios by difficulty
- ✓ should sort scenarios by time
- ✓ should check if can execute
- ✓ should check if can pause
- ✓ should check if can resume
- ✓ should check if can cancel
- ✓ should throw error if no scenario selected
- ✓ should execute scenario successfully
- ✓ should handle execution errors
- ✓ should call onProgress callback during execution

### scenario-executor.test.ts
- ✓ should register a step handler
- ✓ should execute a simple scenario successfully
- ✓ should track progress during execution
- ✓ should call onStepComplete for each step
- ✓ should handle optional steps
- ✓ should stop on error when stopOnError is true
- ✓ should continue on error when stopOnError is false
- ✓ should have default handlers registered
- ✓ should export a singleton instance

## Structure / Структура

```
scenarios/
├── components/         # UI компоненты
│   ├── scenario-browser.tsx
│   ├── scenario-preview.tsx
│   └── scenario-wizard.tsx
├── hooks/              # React хуки
│   ├── use-scenario.ts
│   └── use-scenario-wizard.ts
├── lib/                # Библиотеки сценариев
│   ├── automation-scenarios.ts
│   ├── scenarios.ts
│   └── structure-scenarios.ts
├── services/           # Бизнес-логика
│   ├── scenario-executor.ts
│   └── scenario-machine.ts
├── types/              # TypeScript типы
│   └── scenario.ts
└── __tests__/          # Тесты (30+ тестов)
```

## Features / Функции

### Scenario Categories
- **Automation**: Automated editing workflows (beat sync, auto cuts)
- **Structure**: Project structure creation (chapters, sections)
- **Effects**: Apply effects and transitions automatically
- **Workflow**: Optimize editing workflow

### Difficulty Levels
- **Beginner**: Simple, guided scenarios (5-10 min)
- **Intermediate**: More complex workflows (10-20 min)
- **Advanced**: Professional scenarios with AI (20+ min)

### Scenario Steps
- **select-clips**: Select video clips
- **add-template**: Add project template
- **add-intro/outro**: Add intro/outro graphics
- **add-cuts**: Add video cuts (manual/auto/beat-sync)
- **add-music**: Add background music
- **analyze-audio/video**: Analyze content
- **apply-transitions**: Apply transitions between clips
- **apply-effects**: Apply video effects
- **sync-beats**: Synchronize cuts with music beats
- **auto-montage**: Automatic video editing
- **add-chapters**: Add timeline chapters
- **preview**: Preview result

### Scenario Execution
- Step-by-step wizard
- Progress tracking
- Optional steps support
- Error handling (stop or continue)
- AI-assisted automation
- Undo support
- Save progress
- Preview at any step

### Filtering & Search
- Filter by category, difficulty, AI-assisted, duration
- Search by name and description (RU/EN)
- Sort by name, difficulty, category, time
- Combined filters support

## Hook Usage / Использование хука

```typescript
import { useScenario } from '@/features/scenarios'

function ScenarioPanel() {
  const {
    scenarios,
    selectedScenario,
    currentStep,
    totalSteps,
    progress,
    isExecuting,

    selectScenario,
    clearSelection,
    startExecution,
    pauseExecution,
    resumeExecution,
    cancelExecution,

    filterScenarios,
    searchScenarios,
    sortScenarios,
    resetFilters,
  } = useScenario()

  const handleExecute = async () => {
    if (selectedScenario) {
      await startExecution(project, {
        onProgress: (stepId, percentage) => {
          console.log(`Step ${stepId}: ${percentage}%`)
        },
        onStepComplete: (stepId, result) => {
          console.log(`Completed: ${stepId}`, result)
        }
      })
    }
  }

  return (
    <div>
      <select onChange={(e) => selectScenario(e.target.value)}>
        {scenarios.map(s => (
          <option key={s.id} value={s.id}>
            {s.name.ru} ({s.difficulty})
          </option>
        ))}
      </select>

      <button onClick={handleExecute} disabled={!selectedScenario}>
        Execute Scenario
      </button>

      {isExecuting && (
        <progress value={progress} max={100} />
      )}
    </div>
  )
}
```

## Scenario Executor / Исполнитель сценариев

```typescript
import { scenarioExecutor } from '@/features/scenarios'

// Register custom step handler
scenarioExecutor.registerStepHandler('custom-step', async (step, project) => {
  // Your custom logic here
  return {
    success: true,
    output: { /* result data */ }
  }
})

// Execute scenario
const result = await scenarioExecutor.executeScenario(
  scenario,
  project,
  {
    onProgress: (stepId, percentage) => {},
    onStepComplete: (stepId, result) => {},
    stopOnError: true,
    allowSkip: false,
  }
)

console.log(result.status) // success | partial | failed | cancelled
console.log(result.completedSteps)
console.log(result.errors)
```

## Dependencies / Зависимости

- Depends on:
  - `@/features/project-settings` - для типов проекта
  - `@/lib/tauri-logger` - для логирования
- Used by:
  - Media Studio - для автоматизации монтажа
  - AI Director - для AI-ассистированных сценариев
  - Timeline - для применения результатов

## E2E Tests / E2E Тесты

**Расположение:** `e2e/tauri/features/scenarios/`

### Чеклист тестов

| Тест | Статус | Файл | Приоритет |
|------|--------|------|-----------|
| Загрузка списка сценариев | ⏳ Planned | - | 🔴 High |
| Фильтрация по категории (automation, structure, effects) | ⏳ Planned | - | 🔴 High |
| Фильтрация по сложности (beginner, intermediate, advanced) | ⏳ Planned | - | 🟡 Medium |
| Поиск сценариев по названию (RU/EN) | ⏳ Planned | - | 🟡 Medium |
| Выбор сценария и отображение деталей | ⏳ Planned | - | 🔴 High |
| Запуск выполнения сценария | ⏳ Planned | - | 🔴 High |
| Отображение прогресса выполнения (percentage) | ⏳ Planned | - | 🔴 High |
| Паузирование выполнения сценария | ⏳ Planned | - | 🟡 Medium |
| Возобновление выполнения сценария | ⏳ Planned | - | 🟡 Medium |
| Отмена выполнения сценария | ⏳ Planned | - | 🟡 Medium |
| Обработка ошибок шагов (stop on error) | ⏳ Planned | - | 🔴 High |
| Пропуск optional шагов | ⏳ Planned | - | 🟢 Low |
| Callback onStepComplete | ⏳ Planned | - | 🟢 Low |
| Callback onProgress | ⏳ Planned | - | 🟢 Low |
| Wizard пошаговый интерфейс | ⏳ Planned | - | 🟡 Medium |
| Применение результатов к timeline | ⏳ Planned | - | 🔴 High |

### Приоритеты
- 🔴 High - критичный функционал (загрузка, выбор, выполнение, прогресс, ошибки)
- 🟡 Medium - важный функционал (фильтры, паузирование, wizard)
- 🟢 Low - дополнительный функционал (callbacks, optional steps)

### Описание
Scenarios - client-side модуль без прямых Tauri команд, но с возможностью AI интеграции. Сценарии выполняются через ScenarioExecutor с step handlers. Тестирование должно проверить корректность выполнения различных типов сценариев (automation, structure, effects) и обработку ошибок. Важно протестировать UI wizard для пошагового выполнения.

# Scenarios / Сценарии

[English](./README.md) | **Русский**

## Обзор

Система сценариев монтажа для Timeline Studio. Предоставляет предопределённые автоматизированные рабочие процессы для распространённых задач видеомонтажа, включая пошаговые мастера для автоматизации, создания структуры, применения эффектов и оптимизации рабочего процесса.

## Статус

- ✅ **Компоненты**: 3 UI компонента для браузера, превью и мастера сценариев
- ✅ **Хуки**: 2 хука для управления сценариями и контроля мастера
- ✅ **Сервисы**: Исполнитель сценариев с обработчиками шагов и машиной состояний
- ✅ **Тесты**: 30+ тестов проходят

## Структура

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

## Функции

### ✅ Реализовано

- [x] **Категории сценариев**: Автоматизация, Структура, Эффекты, Рабочий процесс
- [x] **Уровни сложности**: Начинающий (5-10 мин), Средний (10-20 мин), Продвинутый (20+ мин)
- [x] **Шаги сценариев**: Выбор клипов, добавление шаблонов, нарезка, синхронизация, применение эффектов
- [x] **Система выполнения**: Пошаговый мастер с отслеживанием прогресса
- [x] **AI интеграция**: AI-ассистированные сценарии автоматизации
- [x] **Фильтрация и поиск**: По категории, сложности, AI-помощи, длительности
- [x] **Обработка ошибок**: Режимы остановки или продолжения при ошибке
- [x] **Поддержка отмены**: Откат шагов сценария

### ❌ Не реализовано

- [ ] Визуальный редактор сценариев
- [ ] Пользовательские сценарии
- [ ] Маркетплейс шаблонов сценариев

## Использование

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
    startExecution,
    pauseExecution,
    resumeExecution,
    cancelExecution,
  } = useScenario()

  const handleExecute = async () => {
    if (selectedScenario) {
      await startExecution(project, {
        onProgress: (stepId, percentage) => {
          console.log(`Шаг ${stepId}: ${percentage}%`)
        },
        onStepComplete: (stepId, result) => {
          console.log(`Завершено: ${stepId}`, result)
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
        Выполнить сценарий
      </button>
      {isExecuting && <progress value={progress} max={100} />}
    </div>
  )
}
```

## Интеграция

- **Зависит от**: @/features/project-settings, @/lib/tauri-logger
- **Используется в**: Media Studio, AI Director, Timeline

## Тестирование

- **Всего тестов**: 30+ тестов
- **Файлы тестов**: `__tests__/hooks/use-scenario.test.tsx`, `__tests__/services/scenario-executor.test.ts`
- **Покрытие**: Выполнение сценариев, фильтрация, поиск, обработка ошибок

```bash
# Запустить все тесты сценариев
bun run test src/features/scenarios

# Запустить конкретный файл теста
bun run test src/features/scenarios/__tests__/hooks/use-scenario.test.tsx
```

## TODO / Дорожная карта

- [ ] Добавить визуальный редактор сценариев для создания пользовательских рабочих процессов
- [ ] Реализовать обмен сценариями и маркетплейс
- [ ] Добавить больше AI-ассистированных сценариев
- [ ] Улучшить механизмы восстановления после ошибок
- [ ] Добавить предпросмотр сценария перед выполнением

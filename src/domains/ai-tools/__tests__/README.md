# Тесты для AI Tools Domain

Комплексный набор тестов для домена AI Tools в Timeline Studio.

## Структура тестов

```
src/domains/ai-tools/
├── __mocks__/                      # Моки для тестирования
│   ├── test-tools.ts              # Тестовые инструменты
│   └── index.ts                   # Экспорт моков
├── __tests__/                     # Интеграционные тесты
│   └── container.test.ts          # Тесты AIToolsContainer
└── base/__tests__/                # Тесты базовых компонентов
    ├── base-ai-tool.test.ts       # Тесты BaseAITool
    ├── tool-registry.test.ts      # Тесты ToolRegistry
    └── execution-engine.test.ts   # Тесты ExecutionEngine
```

## Статистика тестов

- **Всего тестов**: 126
- **Файлов тестов**: 4
- **Покрытие**: Все основные компоненты домена

### Разбивка по компонентам

1. **BaseAITool** (26 тестов)
   - Базовая функциональность
   - Обработка ошибок и retry механизм
   - Таймауты
   - Логирование
   - Валидация входных данных
   - Метаданные результата
   - Утилитарные методы
   - Логгеры (ConsoleAIToolLogger, NoOpAIToolLogger)

2. **ToolRegistry** (42 теста)
   - Singleton паттерн
   - Регистрация и отмена регистрации инструментов
   - Получение инструментов (по имени, домену, категории)
   - Поиск инструментов
   - Статистика
   - Очистка реестра

3. **ExecutionEngine** (29 тестов)
   - Singleton паттерн
   - Выполнение инструментов
   - Параллельное выполнение
   - Управление выполнением (отмена, статус)
   - Ограничение одновременных выполнений
   - Метрики
   - События
   - Сброс состояния

4. **AIToolsContainer** (29 тестов)
   - Singleton паттерн
   - Инициализация сервисов
   - Конфигурация
   - Жизненный цикл
   - Регистрация произвольных сервисов
   - Статистика контейнера
   - Сброс состояния
   - Утилиты (setupForDevelopment, setupForProduction, setupForTesting)

## Тестовые инструменты

### SimpleTestTool
Простой инструмент для базового тестирования:
- Домен: `core`
- Категория: `timeline`
- Валидация: требует поле `value`
- Возвращает: `{ message: "Processed: <value>" }`

### ErrorTestTool
Инструмент, который всегда возвращает ошибку:
- Домен: `core`
- Категория: `timeline`
- Используется для тестирования обработки ошибок и retry логики

### DelayedTestTool
Инструмент с настраиваемой задержкой:
- Домен: `analysis`
- Категория: `video-analysis`
- Принимает: `{ delay: number }` в миллисекундах
- Используется для тестирования таймаутов и параллельного выполнения

### InvalidInputTestTool
Инструмент со строгой валидацией:
- Домен: `automation`
- Категория: `batch-processing`
- Требует: `{ requiredField: string }` (не пустое)
- Используется для тестирования валидации входных данных

## Утилиты для тестирования

### createMockLogger()
Создает моковый логгер с функциями `info`, `warn`, `error`.

### createMockToolResult(success, data, errors)
Создает моковый результат выполнения инструмента.

### createMockToolMetadata(overrides)
Создает моковые метаданные инструмента с возможностью переопределения полей.

## Запуск тестов

```bash
# Все тесты домена ai-tools
bun run test src/domains/ai-tools/

# Конкретный файл тестов
bun run test src/domains/ai-tools/base/__tests__/base-ai-tool.test.ts

# С покрытием кода
bun run test:coverage src/domains/ai-tools/

# В watch режиме
bun run test:watch src/domains/ai-tools/
```

## Покрытые сценарии

### Успешные сценарии
- ✅ Регистрация и выполнение инструментов
- ✅ Параллельное выполнение нескольких задач
- ✅ Поиск инструментов по различным критериям
- ✅ Сбор метрик и статистики
- ✅ Управление жизненным циклом контейнера
- ✅ Настройка конфигурации для разных окружений

### Edge cases
- ✅ Обработка невалидных входных данных
- ✅ Таймауты при длительном выполнении
- ✅ Retry механизм при ошибках
- ✅ Ограничение количества одновременных выполнений
- ✅ Дублирующаяся регистрация инструментов
- ✅ Отмена выполнения инструментов
- ✅ Ошибки в обработчиках событий

### Интеграционные тесты
- ✅ Взаимодействие ToolRegistry и ExecutionEngine
- ✅ Работа логгеров с различными настройками
- ✅ Подписка на события при инициализации контейнера
- ✅ Очистка всех сервисов при shutdown
- ✅ Настройка для разных окружений (dev, prod, test)

## Паттерны тестирования

### Использование fake timers
Все тесты используют `vi.useFakeTimers()` для контроля над асинхронными операциями:

```typescript
beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

// В тестах
const promise = tool.execute(input)
await vi.runAllTimersAsync()
const result = await promise
```

### Очистка состояния Singleton
Между тестами важно очищать состояние singleton сервисов:

```typescript
beforeEach(() => {
  registry = ToolRegistry.getInstance()
  registry.clear()

  engine = ExecutionEngine.getInstance()
  engine.reset()

  container = AIToolsContainer.getInstance()
  container.reset()
})
```

### Тестирование событий
Использование spy функций для проверки событий:

```typescript
const listener = vi.fn()
engine.addEventListener("execution:started", listener)

// ... выполнение инструмента

expect(listener).toHaveBeenCalledWith(
  expect.objectContaining({
    toolName: "SimpleTestTool",
    executionId: expect.any(String),
  })
)
```

## Зависимости моков

Тесты не зависят от внешних сервисов благодаря использованию:
- Vitest для мокирования
- Fake timers для контроля времени
- Тестовых инструментов вместо реальных
- Моковых логгеров

## Будущие улучшения

Возможные направления для расширения тестового покрытия:

1. **Тесты для конкретных инструментов**
   - Timeline инструменты
   - Browser инструменты
   - Resources инструменты
   - Player инструменты

2. **Тесты производительности**
   - Нагрузочное тестирование ExecutionEngine
   - Тестирование с большим количеством инструментов
   - Оптимизация поиска в ToolRegistry

3. **Интеграционные тесты**
   - Интеграция с AI сервисами
   - Взаимодействие с Tauri backend
   - E2E тесты для полных workflow

4. **Тесты безопасности**
   - Валидация входных данных
   - Защита от инъекций
   - Ограничения ресурсов

## Дополнительная информация

Для получения дополнительной информации см.:
- `/docs/05_development/ru/testing.md` - Общее руководство по тестированию
- `/src/domains/ai-tools/README.md` - Документация по AI Tools Domain
- `/src/test/README.md` - Общая информация о тестовом окружении

# AI Services Domain - Test Coverage Report

## Обзор

Данный отчет описывает покрытие тестами домена `ai-services`, который отвечает за интеграцию AI сервисов (AI Director, Montage Planner, Chat) в приложение Timeline Studio.

## Структура тестов

```
src/domains/ai-services/
├── __mocks__/                          # Моки для тестирования
│   ├── ai-director-service.ts         # Mock AI Director Service
│   ├── unified-orchestrator.ts        # Mock Unified Orchestrator
│   ├── test-utils.tsx                 # Вспомогательные функции для тестов
│   └── index.ts                       # Централизованный экспорт моков
├── machines/__tests__/                 # Тесты для state machines
│   ├── ai-intelligence-machine.test.ts
│   └── chat-machine.test.ts
├── services/__tests__/                 # Тесты для сервисов
│   └── unified-orchestrator.test.ts
└── hooks/__tests__/                    # Тесты для хуков
    └── use-unified-analysis.test.tsx
```

## Покрытие компонентов

### 1. State Machines (XState v5)

#### AI Intelligence Machine (`ai-intelligence-machine.test.ts`)
✅ **Полное покрытие** - 15 тестов

**Покрытые области:**
- ✅ Начальное состояние и контекст
- ✅ Обновление конфигурации (AI Director Config, Montage Options)
- ✅ Анализ одиночного видео (single video analysis)
  - Переход в состояние `analyzingVideo`
  - Сохранение результатов анализа
  - Обработка ошибок
  - Отмена анализа
- ✅ Batch анализ (множественные видео)
  - Переход в состояние `analyzingBatch`
  - Сохранение результатов batch анализа
- ✅ Генерация montage плана
  - Переход в состояние `generatingPlan`
  - Сохранение сгенерированного плана
- ✅ Проверка системного статуса
- ✅ Health check
- ✅ Управление состоянием (очистка результатов, ошибок, reset)
- ✅ Отслеживание прогресса анализа

**Edge cases:**
- ✅ Ошибки во время анализа
- ✅ Отмена активного анализа
- ✅ Прогресс обновления во время длительного анализа

#### Chat Machine (`chat-machine.test.ts`)
✅ **Полное покрытие** - 25+ тестов

**Покрытые области:**
- ✅ Начальное состояние
- ✅ Выбор AI агента (Claude, GPT-4, etc.)
- ✅ Отправка сообщений пользователем
  - Генерация уникальных ID
  - Добавление timestamp
  - Переход в состояние `processing`
- ✅ Получение ответов от AI
  - Возврат в состояние `idle`
  - Сохранение ответов
- ✅ Обработка ошибок
  - Ошибки API подключения
  - Сохранение сообщений при ошибках
- ✅ Управление сообщениями
  - Очистка всех сообщений
  - Удаление конкретного сообщения
- ✅ Управление сессиями
  - Создание новой сессии
  - Переключение между сессиями
  - Загрузка сообщений сессии
  - Удаление сессий
- ✅ Timeline AI операции
  - Создание timeline из промпта
  - Анализ ресурсов
  - Выполнение AI команд
  - Обработка успешных операций
  - Обработка ошибок операций

**Edge cases:**
- ✅ Множественные сообщения в одной сессии
- ✅ Удаление активной сессии
- ✅ Изменение агента во время processing

### 2. Services

#### Unified Orchestrator (`unified-orchestrator.test.ts`)
✅ **Полное покрытие** - 25+ тестов

**Покрытые области:**
- ✅ Singleton паттерн
  - Один экземпляр на приложение
  - Reset инстанса для тестирования
- ✅ Comprehensive Analysis
  - Полный анализ видео через AI Director + Montage Planner
  - Пропуск montage analysis (опционально)
  - Передача конфигурации AI Director
  - Создание workflow для отслеживания
  - Обработка ошибок AI Director
  - Продолжение работы при ошибке Montage Planner
- ✅ Batch Analysis
  - Анализ множественных видео
  - Отслеживание прогресса batch
  - Обработка частичных ошибок
- ✅ Montage Plan Operations
  - Генерация плана монтажа
  - Оптимизация существующего плана
  - Валидация плана
  - Расчет статистики плана
- ✅ Workflow Management
  - Получение информации о workflow
  - Список активных workflows и batches
  - Отмена workflow
  - Очистка завершенных workflows
- ✅ System Status
  - Проверка системного статуса
  - Health check всех сервисов
- ✅ Event Publishing
  - События начала анализа
  - События завершения анализа
- ✅ Cleanup и освобождение ресурсов

**Edge cases:**
- ✅ Частичные ошибки в batch анализе
- ✅ Отмена завершенного workflow (должна вернуть false)
- ✅ Ошибки AI Director с продолжением работы

### 3. Hooks

#### useUnifiedAnalysis Hook (`use-unified-analysis.test.tsx`)
✅ **Полное покрытие** - 25+ тестов

**Покрытые области:**
- ✅ Начальное состояние хука
- ✅ Comprehensive Analysis
  - Выполнение анализа
  - Обновление состояния во время анализа
  - Сохранение результатов
  - Обработка ошибок
  - Передача конфигурации
- ✅ Batch Analysis
  - Анализ множественных видео
  - Обновление состояния
  - Сохранение результатов batch
- ✅ Montage Plan Operations
  - Генерация плана
  - Обновление состояния
  - Оптимизация плана
  - Валидация плана
  - Расчет статистики
- ✅ Workflow Management
  - Получение workflow
  - Получение batch
  - Отмена workflow
  - Очистка завершенных workflows
- ✅ System Status
  - Получение системного статуса
  - Health check
- ✅ State Management
  - Очистка ошибок
  - Очистка результатов
  - Полный reset

**Edge cases:**
- ✅ Ошибки во время анализа с последующей очисткой
- ✅ Множественные операции одновременно
- ✅ Обновление счетчиков активных workflows

### 4. Mocks and Test Utilities

#### Mock Infrastructure
✅ **Полное покрытие**

**Созданные моки:**
- ✅ `ai-director-service.ts` - Mock AI Director Service
  - Comprehensive analysis результаты
  - Health status
  - System status
  - AI Director config
- ✅ `unified-orchestrator.ts` - Mock Unified Orchestrator
  - Unified content analysis
  - Montage analysis results
  - Montage plans
  - Workflow и Batch структуры
- ✅ `test-utils.tsx` - Вспомогательные функции
  - `renderWithAIServices` - кастомный render с провайдером
  - `createMockTauriEvent` - создание Tauri событий
  - `simulateAnalysisProgress` - симуляция прогресса
  - `mockBackendSync` - мок для backend sync
  - Mock данные для тестов

## Не покрытые компоненты

### Требуют добавления тестов:

1. **Provider Component** (`ai-services-domain-provider.tsx`)
   - ⚠️ Базовые интеграционные тесты
   - ⚠️ Backend sync интеграция
   - ⚠️ AI Event Bridge инициализация
   - ⚠️ Множественные hooks в одном компоненте

2. **Montage Planner Machine** (`montage-planner-machine.ts`)
   - ⚠️ Полный набор тестов для state machine
   - ⚠️ Переходы между состояниями
   - ⚠️ Обработка ошибок

3. **Mappers** (`mappers/ai-director-mapper.ts`)
   - ⚠️ Маппинг ComprehensiveAnalysisResult → UnifiedContentAnalysis
   - ⚠️ Маппинг MontageAnalysisResult → UnifiedContentAnalysis
   - ⚠️ Edge cases с неполными данными

4. **Other Hooks**
   - ⚠️ `use-analysis-storage.ts` - локальное хранилище анализов
   - ⚠️ `use-ai-director-events.ts` - обработка событий AI Director

5. **Services**
   - ⚠️ `ai-event-bridge.ts` - синхронизация Tauri ↔ TypeScript events
   - ⚠️ `analysis-storage-service.ts` - персистентность результатов
   - ⚠️ Various engine services в `/services/engines/`

## Метрики покрытия

### Текущее покрытие по категориям:

| Категория | Компонентов | Протестировано | Покрытие |
|-----------|-------------|----------------|----------|
| State Machines | 3 | 2 | 67% |
| Services | 20+ | 1 | ~5% |
| Hooks | 4 | 1 | 25% |
| Providers | 1 | 0 | 0% |
| Mappers | 1 | 0 | 0% |
| **ИТОГО** | ~30 | 4 | **~13%** |

### Критичные компоненты покрыты:

✅ **AI Intelligence Machine** - основная state machine для AI анализа
✅ **Chat Machine** - управление AI чатом
✅ **Unified Orchestrator** - координация AI сервисов
✅ **useUnifiedAnalysis** - основной hook для работы с анализом

## Рекомендации по дальнейшему тестированию

### Приоритет 1 (Критично):
1. **Montage Planner Machine** - важная state machine
2. **AI Services Provider** - интеграция всех сервисов
3. **AI Director Mapper** - критичные трансформации данных

### Приоритет 2 (Важно):
4. **use-analysis-storage** - персистентность данных
5. **use-ai-director-events** - событийная модель
6. **ai-event-bridge** - синхронизация между слоями

### Приоритет 3 (Желательно):
7. Engine services (scene-analysis, vision, audio)
8. Utility services
9. Edge cases для существующих тестов

## Типы тестов

### Используемые паттерны:

1. **Unit Tests** - изолированное тестирование функций и классов
2. **Integration Tests** - тестирование взаимодействия компонентов
3. **State Machine Tests** - тестирование переходов и логики XState
4. **Hook Tests** - тестирование React hooks с renderHook
5. **Mock-based Tests** - использование моков для изоляции

### Технологии:

- **Vitest** - тестовый фреймворк
- **Testing Library** - React компонентов и хуков
- **XState** - тестирование state machines
- **Vi (Vitest Mocks)** - моки и шпионы

## Запуск тестов

```bash
# Все тесты домена
bun run test src/domains/ai-services

# Конкретные тесты
bun run test src/domains/ai-services/machines/__tests__/ai-intelligence-machine.test.ts
bun run test src/domains/ai-services/machines/__tests__/chat-machine.test.ts
bun run test src/domains/ai-services/services/__tests__/unified-orchestrator.test.ts
bun run test src/domains/ai-services/hooks/__tests__/use-unified-analysis.test.tsx

# С покрытием
bun run test:coverage src/domains/ai-services
```

## Заключение

Домен `ai-services` имеет **хорошее покрытие критичных компонентов** (state machines, основной orchestrator, главный hook), что обеспечивает стабильность core функциональности.

Однако требуется **расширение тестов** для:
- Provider компонента
- Montage Planner Machine
- Mappers и трансформаций данных
- Storage и persistence слоя
- Event Bridge и событийной модели

**Общая оценка:** 🟡 Хорошее покрытие критичных компонентов, требуется расширение для полного покрытия домена.

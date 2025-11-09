# Timeline Integration Tests

## Обзор

Комплексные интеграционные тесты для Timeline с полным покрытием основных функциональных сценариев.

## Файлы

### `timeline-integration.test.tsx`

Главный файл интеграционных тестов с покрытием:

**Статистика:**
- **48 тестов**
- **170+ assertions**
- Время выполнения: ~88ms

**Покрытие функциональности:**

1. **Clip Management (6 тестов)**
   - Добавление клипов на timeline
   - Перемещение клипов по timeline
   - Удаление клипов
   - Множественное добавление/удаление

2. **Multi-Track Operations (4 теста)**
   - Создание нескольких треков
   - Выбор множественных треков
   - Одновременная работа с треками
   - Batch операции на треках

3. **Undo/Redo System (5 тестов)**
   - Отмена операций
   - Повтор операций
   - Множественная отмена
   - История операций
   - Очистка истории

4. **Drag & Drop (4 теста)**
   - Начало drag операции для клипов
   - Завершение drag операции
   - Перетаскивание треков
   - Перетаскивание ресурсов (эффекты, transitions)

5. **Clip Trimming and Resizing (5 тестов)**
   - Обрезка начала клипа
   - Обрезка конца клипа
   - Обрезка с обеих сторон
   - Разделение клипа
   - Изменение длительности

6. **Timeline-Player Synchronization (5 тестов)**
   - Синхронизация времени
   - Управление воспроизведением
   - Пауза
   - Скорость воспроизведения
   - Громкость

7. **Effects and Transitions (3 теста)**
   - Управление transitions
   - Инфраструктура эффектов
   - Применение фильтров через updateClip

8. **Project State Persistence (5 тестов)**
   - Создание проекта
   - Сохранение проекта
   - Загрузка проекта
   - Отслеживание несохраненных изменений
   - Восстановление состояния

9. **Additional Integration Scenarios (10 тестов)**
   - Операции с буфером обмена (copy/paste/cut)
   - Очистка выбора
   - Переключение UI функций
   - Изменение UI состояния
   - Комплексные рабочие процессы
   - Консистентность состояния
   - Параллельные операции

10. **Test Coverage Statistics (1 тест)**
    - Общая верификация покрытия

## Запуск тестов

```bash
# Запуск всех интеграционных тестов timeline
bun run test src/features/timeline/__tests__/integration/

# Запуск конкретного файла
bun run test src/features/timeline/__tests__/integration/timeline-integration.test.tsx

# Watch mode
bun run test:watch src/features/timeline/__tests__/integration/
```

## Архитектура тестов

### Mock Setup

Тесты используют комплексную систему моков:

- **Backend Sync** - мокированный backend для выполнения команд
- **Orchestrator** - центральный оркестратор для управления timeline и player
- **Timeline Actor** - XState actor для timeline
- **Player Actor** - XState actor для video player
- **Undo/Redo Service** - сервис для отмены/повтора операций

### Test Data

- `mockVideoFile1` - тестовый видеофайл (120 сек)
- `mockVideoFile2` - тестовый видеофайл (90 сек)
- `mockAudioFile1` - тестовый аудиофайл (180 сек)
- `mockImageFile1` - тестовое изображение (5 сек)

### Wrapper Component

Все тесты используют `TimelineProviders` wrapper, который предоставляет:
- Theme context
- I18n context
- App state
- Modal management
- Resources
- User settings
- Project settings
- Player provider
- Timeline provider
- Chat provider

## Лучшие практики

1. **Isolation** - Каждый тест независим и не зависит от других
2. **Cleanup** - `beforeEach` очищает все моки перед каждым тестом
3. **Async handling** - Все асинхронные операции правильно обрабатываются через `act()`
4. **Comprehensive assertions** - Каждый тест имеет множественные assertions для полного покрытия
5. **Real-world scenarios** - Тесты имитируют реальные пользовательские сценарии

## Расширение тестов

При добавлении новой функциональности в Timeline:

1. Добавьте новый describe блок для категории функциональности
2. Создайте специфичные тесты для каждого сценария использования
3. Обновите mock setup если требуются новые моки
4. Убедитесь что все assertions пронумерованы и задокументированы
5. Запустите тесты локально перед коммитом

## Проблемы и решения

### Player Hook Issues
Если возникают ошибки с `usePlayer`, убедитесь что:
- Mock для `usePlayer` включает все необходимые свойства
- `appliedEffects` и `appliedFilters` инициализированы как массивы

### Undo/Redo Service
Убедитесь что `undoMultiple` и `redoMultiple` возвращают массивы результатов.

### Orchestrator Commands
Все команды должны быть промисами и правильно обрабатываться через `executeCommand`.

## Связанные файлы

- `/src/domains/video-editing/hooks/use-timeline.ts` - Основной timeline hook
- `/src/domains/video-editing/hooks/use-undo-redo.ts` - Undo/Redo hook
- `/src/domains/video-editing/hooks/use-player.ts` - Player hook
- `/src/domains/video-editing/services/video-editing-orchestrator.ts` - Orchestrator
- `/src/test/test-utils.tsx` - Test utilities и providers

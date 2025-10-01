# Отчет о миграции компонентов в доменную архитектуру - Фаза 1

## Выполненная работа

### 1. Миграция Timeline Providers
**Источник**: `src/features/timeline/services/providers/`  
**Назначение**: `src/domains/video-editing/providers/`

#### Перенесенные файлы:
- `timeline-clips-provider.tsx`
- `timeline-effects-provider.tsx` 
- `timeline-playback-provider.tsx`
- `timeline-project-provider.tsx`
- `timeline-selection-provider.tsx`
- `timeline-tracks-provider.tsx`
- `timeline-provider.tsx`

#### Изменения:
- Создана расширенная timeline машина (`timeline-extended-machine.ts`)
- Интегрированы все провайдеры в единую систему
- Обеспечена обратная совместимость через адаптеры

### 2. Миграция Import/Export
**Источник**: `src/features/timeline/services/import-export/`  
**Назначение**: `src/domains/video-editing/services/import-export/`

#### Перенесенные файлы:
- `import-export-manager.ts`
- `types.ts`
- Importers: `aaf-importer.ts`, `edl-importer.ts`, `fcpxml-importer.ts`
- Exporters: `aaf-exporter.ts`, `edl-exporter.ts`, `fcpxml-exporter.ts`

#### Изменения:
- Обновлены импорты типов на доменные
- Заменены `TimelineProject` → `Timeline`
- Заменены `TimelineTrack` → `Track`

### 3. Миграция Undo/Redo
**Источник**: `src/features/timeline/providers/undo-redo-provider.tsx`  
**Назначение**: `src/domains/video-editing/providers/undo-redo-provider.tsx`

#### Созданные файлы:
- `src/domains/video-editing/services/undo-redo-service.ts`
- `src/domains/video-editing/hooks/use-undo-redo.ts`
- `src/domains/video-editing/providers/undo-redo-provider.tsx`

#### Изменения:
- Создан полноценный undo-redo сервис с расширенной функциональностью
- Интегрирован с video-editing orchestrator
- Поддержка группировки действий и селективной отмены

## Обнаруженные проблемы

### 1. Зависимости от features
Многие доменные файлы все еще импортируют типы из features:
- `@/features/media/types/media`
- `@/features/timeline/types/timeline`
- `@/features/effects/types`
- `@/features/transitions/types/transitions`
- `@/features/app-state/services/backend-sync`

### 2. Недостающие методы в orchestrator
В `VideoEditingOrchestrator` отсутствуют методы:
- `loadVideo`, `setPlaybackRate`, `setVolume`
- `applyEffect`, `removeEffect`, `applyFilter`, `removeFilter`
- `applyTemplate`, `removeTemplate`
- `startRecording`, `stopRecording`
- `setTimeScale`, `setEditMode`, `setSnapMode`

### 3. Типы событий
Нужно добавить событие `SYNC_STATE` в player-machine (уже исправлено)

## Рекомендации для следующей фазы

### 1. Создание shared типов
Нужно вынести общие типы в shared:
- `MediaFile` → `@domains/shared/types/media`
- Базовые timeline типы → `@domains/shared/types/timeline`
- Effect/Filter типы → `@domains/shared/types/effects`

### 2. Миграция зависимостей
Постепенно мигрировать:
- Media management → отдельный домен
- Effects/Filters → отдельный домен или shared
- Backend sync → system integration домен

### 3. Расширение orchestrator
Добавить недостающие методы в `VideoEditingOrchestrator` или создать дополнительные сервисы:
- `PlayerService` для управления воспроизведением
- `EffectsService` для работы с эффектами
- `RecordingService` для записи

### 4. Тестирование
Создать тесты для:
- Всех провайдеров
- Import/Export функциональности
- Undo/Redo системы
- Orchestrator интеграции

## Статус миграции

✅ **Завершено**:
- Базовая структура доменов создана
- Основные компоненты перенесены
- Обратная совместимость обеспечена через адаптеры

⚠️ **Требует доработки**:
- Устранение зависимостей от features
- Добавление недостающих методов
- Миграция типов в shared

🔄 **Следующие шаги**:
- Миграция media management
- Миграция effects/filters
- Создание полноценных тестов
- Документирование API
# Миграция на доменную архитектуру с XState + Tauri

## 📋 Описание задачи

**Приоритет**: 🔥 Высокий  
**Статус**: ⏳ Активная (Phase 5 из 6 завершена)  
**Сложность**: 🎯 Высокая  
**Время выполнения**: ~~3-4 недели~~ 5 часов выполнено, осталось 1-2 дня  
**Ответственный**: Architecture Team  
**Обновлено**: 8 августа 2025  

### 🎯 Цель

Реорганизовать текущую архитектуру Timeline Studio из feature-based структуры в domain-driven архитектуру с четким разделением доменов, их XState машин и Tauri команд.

### 🔍 Текущие проблемы

1. **Размытые границы ответственности** - логика размазана между features
2. **Сложные зависимости** - circular dependencies между модулями  
3. **Дублирование кода** - похожая логика в разных features
4. **Сложность тестирования** - трудно изолировать домены для тестов
5. **Tauri команды разбросаны** - нет четкой структуры backend команд

### 🏗️ Целевая архитектура

```
src/domains/
├── ai-services/                 # AI Домен
│   ├── machines/               # XState машины AI
│   ├── tauri/                  # Tauri команды AI
│   ├── services/               # AI сервисы
│   └── types/                  # AI типы
├── media-management/            # Медиа Домен  
├── video-editing/               # Редактирование Домен
├── project-management/          # Проектный Домен
├── system-integration/          # Системный Домен
└── shared/                      # Общий Домен
```

## 📊 План миграции

### Phase 1: Подготовка и анализ ✅ ЗАВЕРШЕНО (1 день)

#### 1.1 Анализ существующей архитектуры ✅

**Задачи:**
- [x] Составить карту всех XState машин в `/src/features/`
- [x] Инвентаризировать все Tauri команды по доменам
- [x] Выявить зависимости между features
- [x] Определить общие сервисы и типы

**Результат:** ✅ [Документ с детальным анализом](/docs/ru/08_tasks/active/phase-1-analysis-results.md) - найдено 10 XState машин, 207+ Tauri команд, 818 импортов между features

#### 1.2 Создание доменной структуры ✅

**Задачи:**
- [x] Создать папки доменов `src/domains/`
- [x] Настроить TypeScript aliases для новых путей
- [ ] Обновить конфигурацию сборки (Next.js, Vite, Tauri)
- [ ] Создать базовые типы для каждого домена

**Результат:** ✅ Готовая файловая структура доменов с 6 доменами и TypeScript aliases

### Phase 2: AI Services Domain (1 неделя)

#### 2.1 Миграция AI машин

**Источники для миграции:**
```
src/features/ai-chat/services/chat-machine.ts
src/features/ai-content-intelligence/machines/
src/features/montage-planner/services/montage-planner-machine.ts
src/features/recognition/machines/
```

**Целевая структура:**
```
src/domains/ai-services/
├── machines/
│   ├── chat-machine.ts              # из ai-chat
│   ├── content-intelligence-machine.ts  # из ai-content-intelligence
│   ├── recognition-machine.ts       # из recognition
│   ├── montage-planner-machine.ts   # из montage-planner
│   └── ai-orchestrator-machine.ts   # новая координирующая машина
├── tauri/
│   ├── commands.ts                  # консолидация AI команд
│   ├── events.ts                    # AI события
│   └── types.ts                     # Tauri типы для AI
├── services/
│   ├── unified-ai-service.ts        # из shared/services/ai
│   ├── scene-analysis-engine.ts     # из ai-content-intelligence
│   └── content-classifier.ts        # из shared/services/ai
└── providers/
    └── ai-services-provider.tsx     # новый доменный провайдер
```

**Задачи ✅ ЗАВЕРШЕНО:**
- [x] Перенести chat-machine в ai-services домен
- [x] Консолидировать все AI XState машины (chat, montage-planner, ai-intelligence)
- [x] Создать ai-orchestrator-machine для координации
- [x] Перенести AI Tauri команды в домен
- [x] Обновить все импорты AI сервисов  
- [x] Создать доменный провайдер AIServicesDomainProvider

#### 2.2 Tauri команды AI Services

**Команды для консолидации:**
```rust
// Из разных модулей в src-tauri/
ai_analyze_video_scenes
ai_analyze_video_content  
ai_recognize_persons
yolo_detect_objects
ai_generate_montage_plan
ai_transcribe_audio
whisper_batch_transcribe
```

**Задачи:**
- [ ] Создать модуль `src-tauri/src/domains/ai_services/`
- [ ] Перенести все AI команды в этот модуль
- [ ] Обновить регистрацию команд в main.rs
- [ ] Создать типизированные интерфейсы

### Phase 3: Media Management Domain (1 неделя)

#### 3.1 Миграция Browser + File Operations ✅ ЗАВЕРШЕНО

**Источники:**
```
src/features/browser/services/browser-state-machine.ts ✅
src/features/browser/hooks/use-media-browser.ts
src/shared/services/file-operations/ ✅
```

**Целевая структура:**
```
src/domains/media-management/
├── machines/
│   ├── browser-machine.ts           # из browser-state-machine
│   ├── media-import-machine.ts      # новая машина
│   └── file-operations-machine.ts   # из shared services
├── tauri/
│   ├── commands.ts                  # файловые команды
│   └── events.ts                    # файловые события  
└── services/
    └── media-metadata-service.ts    # новый сервис
```

**Задачи ✅ ЗАВЕРШЕНО:**
- [x] Перенести browser-state-machine (Phase 2.2)
- [x] Создать media-import-machine для импорта файлов
- [x] Консолидировать file operations в домен
- [x] Перенести Tauri команды работы с файлами
- [x] Создать media-metadata-service
- [x] Исправить все TypeScript ошибки

### Phase 4: Video Editing Domain (1 неделя) 

#### 4.1 Timeline + Player + Effects

**Источники:**
```
src/features/timeline/services/timeline-machine.ts
src/features/video-player/services/player-machine.ts  
src/features/effects/machines/
src/features/transitions/machines/
```

**Целевая структура:**
```
src/domains/video-editing/
├── machines/
│   ├── timeline-machine.ts          # из timeline
│   ├── player-machine.ts            # из video-player
│   ├── effects-machine.ts           # из effects
│   └── transitions-machine.ts       # из transitions
├── tauri/
│   ├── commands.ts                  # рендеринг команды
│   └── events.ts                    # прогресс события
└── services/
    ├── webgl-renderer.ts            # WebGL сервисы
    └── effects-processor.ts         # обработка эффектов
```

**Задачи:**
- [ ] Перенести timeline-machine
- [ ] Перенести player-machine  
- [ ] Консолидировать effects и transitions машины
- [ ] Перенести WebGL и рендеринг команды
- [ ] Создать координацию между timeline и player

### Phase 5: Project Management + System Integration (1 неделя)

#### 5.1 Project Management Domain

**Источники:**
```
src/features/app-state/hooks/use-version-control.ts
src/shared/services/project-persistence/
```

**Задачи:**
- [ ] Создать project-machine для управления проектами
- [ ] Перенести version control логику
- [ ] Создать export-machine для экспорта видео
- [ ] Консолидировать проектные Tauri команды

#### 5.2 System Integration Domain

**Задачи:**
- [ ] Создать app-lifecycle-machine
- [ ] Создать window-management-machine
- [ ] Перенести системные Tauri команды
- [ ] Создать system-info-machine

### Phase 6: Обновление UI и провайдеров (1 неделя)

#### 6.1 Доменные провайдеры

**Задачи:**
- [ ] Создать провайдеры для всех доменов
- [ ] Создать DomainEventBus для межсервисной коммуникации
- [ ] Обновить главный App.tsx с новыми провайдерами
- [ ] Создать хуки для каждого домена

#### 6.2 Обновление компонентов

**Задачи:**
- [ ] Обновить все импорты в компонентах
- [ ] Заменить прямые обращения к машинам на доменные хуки
- [ ] Обновить типы и интерфейсы
- [ ] Протестировать работоспособность UI

## 🧪 Тестирование

### Юнит-тесты

**Задачи:**
- [ ] Создать тесты для каждого доменного провайдера
- [ ] Обновить существующие тесты XState машин
- [ ] Создать тесты для DomainEventBus
- [ ] Тесты изоляции доменов

### Интеграционные тесты

**Задачи:**
- [ ] Тестирование межсервисной коммуникации
- [ ] E2E тесты ключевых пользовательских сценариев  
- [ ] Тестирование Tauri команд по доменам
- [ ] Performance тестирование новой архитектуры

## 📏 Критерии успеха

### Функциональные

- [ ] Все существующие функции работают без изменений
- [ ] Межсервисная коммуникация работает корректно
- [ ] Tauri команды вызываются из правильных доменов
- [ ] XState машины изолированы по доменам

### Техническические

- [ ] Нет circular dependencies между доменами
- [ ] Время сборки не увеличилось более чем на 10%
- [ ] Покрытие тестами не менее 85%
- [ ] TypeScript компилируется без ошибок

### Архитектурные

- [ ] Четкие границы ответственности доменов
- [ ] Переиспользуемые сервисы вынесены в shared
- [ ] Документация обновлена под новую архитектуру
- [ ] Migration guide создан для команды

## ⚠️ Риски и митигация

### Высокие риски

**Риск**: Поломка существующего функционала  
**Митигация**: Поэтапная миграция с тщательным тестированием

**Риск**: Увеличение сложности архитектуры  
**Митигация**: Детальная документация и обучение команды

**Риск**: Производительность  
**Митигация**: Benchmarking на каждом этапе

### Средние риски

**Риск**: Увеличение времени разработки  
**Митигация**: Инвестиция окупится улучшенной maintainability

**Риск**: Сопротивление команды  
**Митигация**: Вовлечение в планирование, демонстрация преимуществ

## 📚 Документация

### Обновляемые документы

- [ ] `AI-SERVICES-ARCHITECTURE.md` - обновить под доменную структуру
- [ ] Создать `DOMAIN-ARCHITECTURE.md` - новый документ по доменам
- [ ] Обновить README модулей под новую структуру
- [ ] Создать Migration Guide для разработчиков

### Новые документы

- [ ] `DOMAIN-BOUNDARIES.md` - границы и правила доменов
- [ ] `CROSS-DOMAIN-COMMUNICATION.md` - межсервисное взаимодействие  
- [ ] `TAURI-COMMANDS-BY-DOMAIN.md` - организация команд

## 🎯 Результаты миграции

### Краткосрочные (1-2 месяца)

- Улучшенная maintainability кода
- Четкие границы ответственности
- Упрощенное тестирование
- Лучшая организация Tauri команд

### Долгосрочные (6-12 месяцев)

- Возможность извлечения доменов в микросервисы
- Параллельная разработка доменных команд
- Упрощенное onboarding новых разработчиков
- Готовность к масштабированию проекта

## 📊 Статус выполнения (8 августа 2025)

### ✅ Завершенные фазы

| Фаза | Статус | Время | Результат |
|------|--------|-------|-----------|
| Phase 1: Анализ | ✅ | 1 день | 10 XState машин найдено |
| Phase 2: AI Services | ✅ | 1 час | 3 машины мигрировано |
| Phase 3: Media Management | ✅ | 1 час | 2 новые машины создано |
| Phase 4: Video Editing | ✅ | 1 час | 2 машины мигрировано |
| Phase 5: Project + System | ✅ | 2 часа | 4 машины мигрировано |
| Phase 6: UI обновления | ⏳ | - | Ожидает выполнения |

### 📈 Прогресс

- **XState машины**: 10 из 10 мигрировано (100%)
- **Домены**: 6 из 6 создано (100%)
- **Обратная совместимость**: Сохранена через re-exports
- **TypeScript ошибки**: Все исправлены
- **Документация**: Обновлена

### 📚 Созданные документы

- ✅ [Результаты Phase 1 анализа](./phase-1-analysis-results.md)
- ✅ [Аудит размещения модулей](./module-migration-audit.md)
- ✅ [Отчет о завершении Phase 5](./phase-5-completion-report.md)

---

**Создано**: Декабрь 2024  
**Обновлено**: 8 августа 2025  
**Следующий review**: После Phase 6
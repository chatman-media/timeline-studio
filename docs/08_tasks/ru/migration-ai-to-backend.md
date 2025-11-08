# Миграция AI инструментов на бэкенд

**Дата создания:** 2025-11-08
**Статус:** Активная
**Приоритет:** Высокий
**Длительность:** 8-13 недель

## Описание задачи

Мигрировать AI инструменты с фронтенда на бэкенд (Rust/Tauri) для улучшения производительности, устранения дублирования кода и централизации AI логики.

## Текущая ситуация

### Фронтенд (TypeScript/React)

**AI Chat Module** (`/src/features/ai-chat/`)
- 1.7 МБ кода
- 48+ специализированных AI инструментов (34,503 строк кода)
- 4 AI провайдера: Claude 4, GPT-4, DeepSeek, Ollama
- Структура:
  - `tools/core/` - 32 основных инструмента (timeline, resources, browser, player)
  - `tools/analysis/` - 10 инструментов анализа (video, audio, multimodal, whisper, person-identification)
  - `tools/automation/` - 6 инструментов автоматизации (subtitle, batch, workflow)
  - `tools/integration/` - инструменты интеграции

**AI Content Intelligence Module** (`/src/features/ai-content-intelligence/`)
- 228 КБ кода
- Самый полный AI модуль с 3 движками:
  1. **Scene Analysis Engine** - анализ сцен, композиции, объектов
  2. **Script Generation Engine** - генерация диалогов и закадрового текста
  3. **Multi-Platform Adaptation Engine** - адаптация для YouTube, TikTok, Instagram, Telegram, Twitter/X

**Другие AI модули:**
- `ai-director/` - координация всех AI анализов
- `recognition/` - YOLO визуализация (164 КБ)
- `person-identification/` - UI для распознавания лиц
- `montage-planner/` - планирование монтажа
- `transcription/` - интеграция Faster Whisper

**Итого:** ~2.1 МБ AI кода на фронтенде

### Бэкенд (Rust/Tauri)

**Recognition Module** (`/src-tauri/src/recognition/`)
- 25 структур и сервисов
- 89 Tauri команд
- Компоненты:
  - YOLO процессор (ONNX Runtime)
  - RetinaFace, FaceNet, MediaPipe
  - Face и Person clustering
  - Person database (SQLite)
  - Privacy processor

**Analysis Module** (`/src-tauri/src/analysis/`)
- 20 структур и сервисов
- 62 Tauri команды
- 3 движка:
  - Scene Engine - детекция и анализ сцен
  - Content Engine - классификация контента
  - Moment Engine - детекция ключевых моментов
- AI Director - координатор всех анализов
- Unified Audio Analyzer

**Montage Planner Backend** (`/src-tauri/src/montage_planner/`)
- 9 сервисов
- Анализ моментов, эмоций, качества, композиции, активности

**AI API Proxy** (`/src-tauri/src/video_compiler/commands/ai_api_proxy/`)
- Прокси для Claude API
- Команды: send_message, streaming_message, validate_key, get_models

**Итого:** ~151 Tauri команда для AI

## Проблемы

### 1. Дублирование функциональности

| Функция | Фронтенд | Бэкенд | Статус |
|---------|----------|---------|--------|
| Audio Analysis | AI Chat audio-analysis-tools | unified_audio_analyzer.rs | Дублируется |
| Scene Detection | Scene Analysis Engine | SceneEngine + scene_detector.rs | Дублируется |
| Moment Detection | Montage Planner | MomentEngine + moment_detector.rs | Дублируется |
| Content Classification | Content Engine | ContentEngine + content_classification_engine.rs | Дублируется |
| YOLO Recognition | Recognition (визуализация) | Recognition (ONNX) | Разделены |
| Face Recognition | Person Identification (UI) | RetinaFace, FaceNet | Разделены |

### 2. Функции только на фронтенде

- **Script Generation Engine** - генерация скриптов с AI
- **Multi-Platform Adaptation Engine** - адаптация контента под платформы
- **AI Orchestration** - координация всех AI процессов
- **48+ AI инструментов** в ai-chat (большинство)

### 3. Архитектурные проблемы

- Нет единого DI контейнера между фронтендом и бэкендом
- Разные паттерны error handling
- Дублирование типов данных (TypeScript vs Rust)
- Разные подходы к state management (XState vs Rust сервисы)

### 4. Производительность

- Тяжелые AI операции выполняются на фронтенде
- Нет централизованного кэширования результатов
- Сетевые вызовы AI API из браузера
- ONNX Runtime в браузере ограничен по производительности

## План миграции

### Phase 1: Инфраструктура (1-2 недели)

**Цель:** Подготовить архитектурный фундамент

**Задачи:**
- [ ] Создать модуль `src-tauri/src/ai_intelligence/`
  - [ ] `mod.rs` - экспорты модуля
  - [ ] `types.rs` - унифицированные типы
  - [ ] `orchestrator/` - координация AI процессов
  - [ ] `engines/` - AI движки
  - [ ] `providers/` - AI провайдеры
  - [ ] `services/` - сервисы
  - [ ] `commands/` - Tauri команды

- [ ] Унифицировать типы между TypeScript и Rust
  - [ ] Настроить Specta для автогенерации TypeScript типов
  - [ ] Создать `UnifiedAIAnalysis`, `GeneratedScript`, `PlatformAdaptation` типы
  - [ ] Добавить serde serialization/deserialization
  - [ ] Integration тесты для проверки совместимости типов

- [ ] Расширить DI container на бэкенде
  - [ ] Создать `AIServiceContainer` в `service_container/`
  - [ ] Добавить dependency injection для всех AI сервисов
  - [ ] Настроить lifecycle management

- [ ] Multi-provider support
  - [ ] Расширить `ai_api_proxy` для поддержки Claude, OpenAI, DeepSeek, Ollama
  - [ ] Создать `AIProviderManager` с fallback логикой
  - [ ] Добавить provider health checks

**Результат:** Готовая инфраструктура для AI модулей

---

### Phase 2: Script Generation (2-3 недели)

**Цель:** Перенести Script Generation Engine на бэкенд

**Задачи:**
- [ ] Создать `engines/script_generator.rs`
  - [ ] Перенести логику генерации скриптов из фронтенда
  - [ ] Интеграция с AI провайдерами через `ai_api_proxy`
  - [ ] Генерация диалогов, закадрового текста, структуры сцен
  - [ ] Адаптация под жанр контента (vlog, tutorial, documentary и т.д.)

- [ ] Добавить fallback механизмы
  - [ ] Claude 4 → GPT-4 → DeepSeek → Ollama
  - [ ] Retry логика при ошибках
  - [ ] Rate limiting

- [ ] Создать Tauri команды
  - [ ] `generate_script` - генерация полного скрипта
  - [ ] `generate_dialogue` - генерация диалогов
  - [ ] `generate_voiceover` - генерация закадрового текста
  - [ ] `validate_script` - валидация скрипта
  - [ ] `optimize_script` - оптимизация скрипта

- [ ] Unit тесты
  - [ ] Тесты для каждого AI провайдера
  - [ ] Тесты fallback логики
  - [ ] Интеграционные тесты с analysis модулем

**Результат:** Работающий Script Generator на бэкенде

---

### Phase 3: Platform Adaptation (1-2 недели)

**Цель:** Перенести Multi-Platform Adaptation Engine на бэкенд

**Задачи:**
- [ ] Создать `engines/platform_adapter.rs`
  - [ ] YouTube - длинные видео, SEO оптимизация
  - [ ] TikTok - вертикальные короткие видео
  - [ ] Instagram - Reels, Stories
  - [ ] Telegram - адаптация для мессенджера
  - [ ] Twitter/X - короткие клипы

- [ ] Создать `engines/content_optimizer.rs`
  - [ ] Оптимизация длительности для платформы
  - [ ] Адаптация соотношения сторон
  - [ ] Оптимизация для алгоритмов рекомендаций
  - [ ] Генерация метаданных (title, description, tags)

- [ ] Интеграция с workflow системой
  - [ ] Автоматическая генерация вариантов для разных платформ
  - [ ] Batch processing для нескольких платформ

- [ ] Создать Tauri команды
  - [ ] `adapt_for_platform` - адаптация контента
  - [ ] `optimize_for_platform` - оптимизация
  - [ ] `generate_metadata` - генерация метаданных
  - [ ] `get_platform_recommendations` - рекомендации

**Результат:** Platform Adaptation Engine на бэкенде

---

### Phase 4: Orchestration (2-3 недели)

**Цель:** Создать единый AI оркестратор для координации всех движков

**Задачи:**
- [ ] Расширить AI Director
  - [ ] Создать `orchestrator/pipeline_coordinator.rs`
  - [ ] Unified pipeline для всех AI анализов
  - [ ] Координация Scene, Content, Moment, Script, Platform движков
  - [ ] Dependency management между движками

- [ ] Создать `orchestrator/task_scheduler.rs`
  - [ ] Планирование AI задач
  - [ ] Приоритизация задач
  - [ ] Параллельное выполнение независимых задач
  - [ ] Progress tracking

- [ ] Создать `services/cache_service.rs`
  - [ ] LRU cache для результатов анализа
  - [ ] Персистентный кэш в SQLite
  - [ ] Cache invalidation стратегии
  - [ ] Распределенный кэш для больших файлов

- [ ] Создать `services/unified_analysis_service.rs`
  - [ ] Единый интерфейс для всех AI анализов
  - [ ] Comprehensive analysis (все движки сразу)
  - [ ] Selective analysis (выбор конкретных движков)
  - [ ] Real-time analysis с событиями

- [ ] Создать Tauri команды
  - [ ] `start_comprehensive_analysis` - полный анализ
  - [ ] `start_selective_analysis` - выборочный анализ
  - [ ] `get_analysis_progress` - прогресс
  - [ ] `cancel_analysis` - отмена
  - [ ] `get_cached_results` - получение из кэша

**Результат:** Единый AI оркестратор с кэшированием

---

### Phase 5: Устранение дублирования (1-2 недели)

**Цель:** Рефакторинг фронтенда, удаление дублирующегося кода

**Задачи:**
- [ ] Рефакторинг AI Chat Module
  - [ ] Заменить локальные AI инструменты на вызовы бэкенда
  - [ ] Оставить только UI компоненты
  - [ ] Обновить `unified-ai-service.ts` для использования Tauri команд
  - [ ] Удалить дублирующиеся анализаторы (audio, video, scene)

- [ ] Рефакторинг AI Content Intelligence
  - [ ] Обновить Scene Analysis Engine для использования backend API
  - [ ] Удалить Script Generation Engine с фронта (теперь на бэке)
  - [ ] Удалить Multi-Platform Engine с фронта (теперь на бэке)
  - [ ] Оставить только UI компоненты (generation-wizard, preview-grid, analysis-viewer)

- [ ] Рефакторинг AI Director
  - [ ] Обновить `ai-director-service.ts` для вызова backend orchestrator
  - [ ] Упростить XState машину (координация теперь на бэке)
  - [ ] Добавить event streaming для real-time updates

- [ ] Рефакторинг других модулей
  - [ ] Recognition - только визуализация YOLO данных
  - [ ] Person Identification - только UI компоненты
  - [ ] Montage Planner - только UI и взаимодействие с backend

- [ ] Обновить тесты
  - [ ] Обновить integration тесты для новых API
  - [ ] Обновить mock данные
  - [ ] E2E тесты для проверки фронтенд-бэкенд взаимодействия

**Результат:** Чистый фронтенд без дублирования, AI логика на бэкенде

---

### Phase 6: Testing & Optimization (1 неделя)

**Цель:** Полное тестирование и оптимизация производительности

**Задачи:**
- [ ] Unit тесты
  - [ ] Тесты для всех новых Rust модулей
  - [ ] Тесты для Script Generator
  - [ ] Тесты для Platform Adapter
  - [ ] Тесты для Orchestrator

- [ ] Integration тесты
  - [ ] Тесты взаимодействия движков
  - [ ] Тесты AI провайдеров с fallback
  - [ ] Тесты кэширования
  - [ ] Тесты Tauri команд

- [ ] Performance benchmarks
  - [ ] Бенчмарки времени анализа
  - [ ] Бенчмарки использования памяти
  - [ ] Бенчмарки сетевых вызовов
  - [ ] Сравнение с предыдущей версией (фронтенд)

- [ ] E2E тесты
  - [ ] Полный flow: загрузка файла → анализ → генерация скрипта → адаптация
  - [ ] Тесты для каждой платформы (YouTube, TikTok, Instagram)
  - [ ] Тесты с разными AI провайдерами
  - [ ] Стресс-тесты с большими файлами

- [ ] Документация
  - [ ] Обновить API reference
  - [ ] Создать migration guide для разработчиков
  - [ ] Обновить architecture документацию
  - [ ] Примеры использования новых API

**Результат:** Полностью протестированная и документированная система

---

## Архитектурная структура после миграции

```
src-tauri/src/ai_intelligence/
├── mod.rs                          # Экспорты модуля
├── types.rs                        # Унифицированные типы
│   ├── UnifiedAIAnalysis
│   ├── GeneratedScript
│   ├── PlatformAdaptation
│   └── AIProviderConfig
├── orchestrator/                   # Координация AI процессов
│   ├── pipeline_coordinator.rs    # Координатор pipeline
│   ├── task_scheduler.rs          # Планировщик задач
│   └── result_aggregator.rs       # Агрегация результатов
├── engines/                        # AI движки
│   ├── script_generator.rs        # NEW: Генерация скриптов
│   ├── platform_adapter.rs        # NEW: Адаптация под платформы
│   └── content_optimizer.rs       # NEW: Оптимизация контента
├── providers/                      # AI провайдеры
│   ├── ai_provider_manager.rs     # Менеджер провайдеров
│   ├── claude_provider.rs         # Claude интеграция
│   ├── openai_provider.rs         # OpenAI интеграция
│   ├── deepseek_provider.rs       # DeepSeek интеграция
│   └── ollama_provider.rs         # Ollama интеграция
├── services/                       # Сервисы
│   ├── unified_analysis_service.rs # Единый сервис анализа
│   ├── cache_service.rs           # Кэширование результатов
│   └── workflow_service.rs        # Автоматизация workflow
└── commands/                       # Tauri команды
    ├── script_generation_commands.rs
    ├── platform_adaptation_commands.rs
    └── orchestration_commands.rs
```

## Интеграция с существующими модулями

**Используем:**
- `analysis/` - Scene, Content, Moment engines
- `recognition/` - YOLO, Face recognition (ONNX Runtime)
- `montage_planner/` - Quality, Emotion, Composition analysis
- `video_compiler/commands/ai_api_proxy/` - AI провайдеры
- `video_compiler/commands/workflow/` - Workflow automation

**Расширяем:**
- AI Director → добавляем orchestration
- ai_api_proxy → multi-provider support (Claude, OpenAI, DeepSeek, Ollama)
- workflow → AI-driven automation
- database → caching layer для AI результатов

## Риски и митигация

### Высокие риски

**1. Производительность сетевых вызовов**
- *Риск:* Фронтенд → Tauri → Backend может быть медленнее
- *Митигация:*
  - Агрессивное кэширование результатов
  - Batch processing для множественных запросов
  - Event streaming для real-time updates
  - WebSocket для длинных операций

**2. Совместимость типов TypeScript ↔ Rust**
- *Риск:* Несовместимость типов при сериализации
- *Митигация:*
  - Specta для автогенерации TypeScript типов
  - Integration тесты для всех типов
  - Versioning схемы данных
  - Graceful degradation при ошибках

**3. Сложность AI провайдеров**
- *Риск:* Разные API, лимиты, форматы ответов
- *Митигация:*
  - Унифицированный интерфейс AIProvider
  - Fallback логика между провайдерами
  - Retry механизмы с exponential backoff
  - Health checks и мониторинг

### Средние риски

**4. Дублирование кода во время миграции**
- *Риск:* Оба кода работают параллельно, увеличение bundle size
- *Митигация:*
  - Feature flags для постепенного переключения
  - Поэтапная миграция (по 1 модулю)
  - Регулярная очистка неиспользуемого кода
  - Code splitting для фронтенда

**5. Регрессии в поведении**
- *Риск:* Изменение логики может сломать существующие функции
- *Митигация:*
  - Comprehensive E2E тесты до и после миграции
  - Snapshot тесты для проверки идентичности результатов
  - Canary deployments для постепенного раската
  - Мониторинг ошибок в production

**6. Зависимости ONNX Runtime**
- *Риск:* Сложная настройка ONNX на разных платформах
- *Митигация:*
  - Использование существующей настройки (уже работает)
  - Документация для каждой платформы
  - CI/CD тесты на всех платформах
  - Fallback на cloud API при проблемах с ONNX

## Метрики успеха

### Производительность

**До миграции (фронтенд):**
- Bundle size: ~2.4 МБ (после рефакторинга)
- Build time: 36 секунд
- Время анализа видео 5 минут: ~20-30 секунд (в браузере)
- Использование памяти: ~200-300 МБ

**После миграции (бэкенд):**
- Целевой bundle size: ~1.5 МБ (-37%)
- Целевой build time: 25-30 секунд (-20%)
- Целевое время анализа: ~10-15 секунд (-50%)
- Целевое использование памяти: ~150-200 МБ

### Качество кода

- Устранение дублирования: с 40-50% до <5%
- Test coverage: >80% для новых модулей
- Zero critical bugs в production
- API response time: <100ms для кэшированных результатов

### User Experience

- Уменьшение времени ожидания AI анализа
- Real-time progress updates
- Graceful degradation при ошибках
- Offline capabilities с кэшированием

## Зависимости и требования

### Технические зависимости

**Rust:**
- ffmpeg-next = "8"
- onnxruntime (нативный)
- tokio - async runtime
- serde - сериализация
- specta - генерация TypeScript типов

**Frontend:**
- @tauri-apps/api - обновить для новых команд
- Удалить: onnxruntime-web, некоторые AI библиотеки
- Оставить: XState (для UI state), React hooks

### Системные требования

- **ONNX Runtime**: macOS: `brew install onnxruntime`
- **FFmpeg**: уже настроен в проекте
- **Environment variables**: автоматическая загрузка из `.env.local`

### CI/CD обновления

- Обновить GitHub Actions workflows
- Добавить тесты для новых модулей
- Увеличить timeout для AI тестов (могут быть медленными)

## Timeline

**Общая длительность:** 8-13 недель

| Phase | Длительность | Дедлайн |
|-------|-------------|---------|
| Phase 1: Инфраструктура | 1-2 недели | TBD |
| Phase 2: Script Generation | 2-3 недели | TBD |
| Phase 3: Platform Adaptation | 1-2 недели | TBD |
| Phase 4: Orchestration | 2-3 недели | TBD |
| Phase 5: Устранение дублирования | 1-2 недели | TBD |
| Phase 6: Testing & Optimization | 1 неделя | TBD |

**Критический путь:**
1. Инфраструктура (блокирует все остальное)
2. AI Provider Manager (блокирует Script Generation)
3. Script Generation → Platform Adaptation → Orchestration (последовательно)
4. Устранение дублирования (после всех движков)
5. Testing (финальная фаза)

## Следующие шаги

1. **Создать feature branch:** `feature/ai-backend-migration`
2. **Начать Phase 1:** Инфраструктура
3. **Настроить project tracking:** GitHub Projects или Linear
4. **Создать technical design doc** для каждой фазы
5. **Провести code review** после каждой фазы

## Связанные документы

- `/docs/03_architecture/ru/ai-architecture.md` - AI архитектура (создать)
- `/docs/05_development/ru/ai-development.md` - AI разработка (создать)
- `/docs/08_tasks/ru/ai-refactoring-phase2.md` - Результаты рефакторинга Phase 2
- `/src/features/ai-chat/README.md` - AI Chat документация
- `/src/features/ai-content-intelligence/README.md` - AI Content Intelligence документация

## Контакты

**Владелец задачи:** TBD
**Tech Lead:** TBD
**Reviewers:** TBD

---

*Последнее обновление: 2025-11-08*

# Регистрация недостающих Tauri команд

## Метаданные

- **Дата создания:** 2025-11-29
- **Статус:** Запланировано
- **Приоритет:** 🔴 КРИТИЧЕСКИЙ
- **Категория:** Backend / Infrastructure
- **Связанные документы:**
  - `docs/03_architecture/command-usage-analysis.md`
  - `docs/03_architecture/frontend-backend-commands-coverage.md`
  - `docs/08_tasks/completed/backend-frontend-mapping.md`

## Проблема

По результатам анализа `scripts/analyze-command-usage.ts` выявлено **109 команд**, которые вызываются на фронтенде через `invoke()`, но **не зарегистрированы** в `src-tauri/src/app_builder.rs`.

Это вызывает ошибки выполнения при попытке использования этих функций.

**Текущее покрытие:** 33.4% (112 из 335 команд используются)

## Цели задачи

1. ✅ Зарегистрировать все 109 недостающих команд в `app_builder.rs`
2. ✅ Убедиться, что все команды имеют соответствующие реализации в Rust
3. ✅ Обновить документацию покрытия команд
4. ✅ Добавить тесты для критичных команд
5. ✅ Проверить работоспособность всех зарегистрированных команд

## План выполнения

### Фаза 1: Критичные команды (Приоритет: ВЫСОКИЙ) 🔴

#### 1.1. State Manager API (7 команд)
**Модуль:** `src-tauri/src/state/commands_api.rs`

- [ ] `execute_batch_commands` - Пакетное выполнение команд
- [ ] `get_app_directories` - Получение путей приложения
- [ ] `create_app_directories` - Создание директорий приложения
- [ ] `get_directory_sizes` - Получение размеров директорий
- [ ] `clear_app_cache` - Очистка кэша приложения
- [ ] `save_workspace_state` - Сохранение состояния workspace
- [ ] `load_workspace_state` - Загрузка состояния workspace

**Действия:**
1. Проверить существование реализаций в `commands_api.rs`
2. Добавить отсутствующие реализации
3. Зарегистрировать в `app_builder.rs`
4. Добавить в секцию State Manager

**Файлы для изменения:**
- `src-tauri/src/state/commands_api.rs` - реализации
- `src-tauri/src/app_builder.rs` - регистрация
- `src-tauri/src/state/mod.rs` - экспорты если нужно

#### 1.2. Unified Audio API (8 команд)
**Модуль:** `src-tauri/src/analysis/commands/audio.rs` или новый модуль

- [ ] `unified_audio_analyze_comprehensive` - Полный анализ аудио
- [ ] `unified_audio_analyze_quick` - Быстрый анализ аудио
- [ ] `unified_audio_analyze_batch` - Пакетный анализ аудио
- [ ] `unified_audio_get_capabilities` - Получение возможностей аудио системы
- [ ] `analyze_audio_peaks` - Анализ пиков аудио
- [ ] `detect_speech_onsets` - Детекция начала речи
- [ ] `correlate_audio_files` - Корреляция аудио файлов
- [ ] `prepare_audio_for_whisper` - Подготовка аудио для Whisper

**Действия:**
1. Определить модуль для unified audio API
2. Реализовать отсутствующие функции
3. Интегрировать с существующим FFmpeg
4. Зарегистрировать все 8 команд

**Файлы для изменения:**
- `src-tauri/src/analysis/commands/audio.rs` (или создать новый)
- `src-tauri/src/app_builder.rs`

### Фаза 2: AI Services (Приоритет: ВЫСОКИЙ) 🟠

#### 2.1. AI Services API (14 команд)
**Модуль:** `src-tauri/src/ai_api_proxy/` или расширить существующий

- [ ] `ai_send_secure_request` - Безопасный AI запрос
- [ ] `ai_send_unified_request` - Унифицированный запрос
- [ ] `ai_send_secure_streaming_request` - Безопасный streaming
- [ ] `ai_send_streaming_request` - Streaming запрос
- [ ] `ai_send_request_with_tools` - Запрос с инструментами
- [ ] `ai_send_secure_request_with_tools` - Безопасный запрос с tools
- [ ] `ai_get_cache_stats` - Статистика кэша
- [ ] `ai_clear_cache` - Очистка кэша
- [ ] `ai_cleanup_expired_cache` - Очистка истекшего кэша
- [ ] `ai_validate_provider` - Валидация провайдера
- [ ] `ai_get_supported_providers` - Список поддерживаемых провайдеров
- [ ] `ai_get_provider_models` - Модели провайдера
- [ ] `ai_check_providers_health` - Проверка здоровья провайдеров
- [ ] `ai_send_request_with_fallback` - Запрос с fallback

**Действия:**
1. Проверить существующий модуль `ai_api_proxy`
2. Реализовать недостающие функции
3. Добавить кэширование и валидацию
4. Зарегистрировать все команды

**Файлы для изменения:**
- `src-tauri/src/ai_api_proxy/mod.rs`
- `src-tauri/src/app_builder.rs`

#### 2.2. Person Identification & Tracking (27 команд)
**Модуль:** `src-tauri/src/recognition/` - расширить существующий

**Database Commands:**
- [ ] `init_person_database` - Инициализация БД людей
- [ ] `create_person` - Создание персоны
- [ ] `get_person` - Получение персоны
- [ ] `delete_person` - Удаление персоны
- [ ] `search_similar_persons` - Поиск похожих персон
- [ ] `add_face_embedding` - Добавление embedding лица
- [ ] `add_person_appearance` - Добавление появления персоны
- [ ] `get_person_database_stats` - Статистика БД
- [ ] `set_similarity_threshold` - Установка порога схожести
- [ ] `add_person_thumbnail` - Добавление миниатюры

**Face Detection Commands:**
- [ ] `detect_faces_advanced` - Продвинутая детекция лиц
- [ ] `analyze_face_quality` - Анализ качества лица
- [ ] `blur_faces_in_image` - Размытие лиц на изображении
- [ ] `start_realtime_face_detection` - Запуск realtime детекции
- [ ] `stop_realtime_face_detection` - Остановка realtime детекции
- [ ] `update_face_detection_config` - Обновление конфига детекции
- [ ] `cleanup_face_detection` - Очистка ресурсов детекции

**Advanced Tracking Commands:**
- [ ] `init_advanced_tracking` - Инициализация продвинутого трекинга
- [ ] `start_person_tracking` - Запуск трекинга персон
- [ ] `process_tracking_frame` - Обработка кадра трекинга
- [ ] `predict_track_positions` - Предсказание позиций треков
- [ ] `assign_person_to_track` - Назначение персоны на трек
- [ ] `merge_tracks` - Объединение треков
- [ ] `interpolate_track_positions` - Интерполяция позиций
- [ ] `stop_person_tracking` - Остановка трекинга
- [ ] `update_tracking_config` - Обновление конфига трекинга
- [ ] `cleanup_tracking` - Очистка ресурсов трекинга

**YOLO Commands:**
- [ ] `load_yolo_data` - Загрузка YOLO данных
- [ ] `save_yolo_data` - Сохранение YOLO данных
- [ ] `analyze_video_with_yolo` - Анализ видео через YOLO

**Действия:**
1. Создать модуль `person_database` для БД персон
2. Расширить существующий recognition модуль
3. Реализовать advanced tracking систему
4. Интегрировать с YOLO и FaceNet
5. Зарегистрировать все 27 команд

**Файлы для изменения:**
- `src-tauri/src/recognition/person_database.rs` (создать новый)
- `src-tauri/src/recognition/tracking.rs` (создать новый)
- `src-tauri/src/recognition/commands.rs` (расширить)
- `src-tauri/src/app_builder.rs`

### Фаза 3: Montage & Whisper (Приоритет: СРЕДНИЙ) 🟡

#### 3.1. Montage Planner (7 команд)
**Модуль:** `src-tauri/src/analysis/montage_planner/`

- [ ] `analyze_montage_videos` - Анализ видео для монтажа
- [ ] `apply_montage_plan` - Применение плана монтажа
- [ ] `export_montage_plan` - Экспорт плана
- [ ] `optimize_montage_plan` - Оптимизация плана
- [ ] `validate_montage_plan` - Валидация плана
- [ ] `calculate_plan_statistics` - Расчёт статистики плана
- [ ] `analyze_video_quality` - Анализ качества видео
- [ ] `analyze_frame_quality` - Анализ качества кадра
- [ ] `analyze_audio_content` - Анализ аудио контента

**Действия:**
1. Проверить существующий модуль montage_planner
2. Реализовать недостающие функции
3. Интегрировать с AI Director v2
4. Зарегистрировать команды

**Файлы для изменения:**
- `src-tauri/src/analysis/montage_planner/mod.rs`
- `src-tauri/src/app_builder.rs`

#### 3.2. Whisper & Transcription (7 команд)
**Модуль:** `src-tauri/src/analysis/commands/transcription.rs`

- [ ] `init_whisper_python` - Инициализация Whisper Python
- [ ] `transcribe_with_faster_whisper` - Транскрипция через Faster Whisper
- [ ] `get_whisper_models` - Список Whisper моделей
- [ ] `download_whisper_model` - Скачивание модели Whisper
- [ ] `generate_subtitles_from_transcription` - Генерация субтитров
- [ ] `update_timeline_subtitles` - Обновление субтитров на таймлайне

**Действия:**
1. Проверить существующий transcription модуль
2. Добавить поддержку Faster Whisper
3. Реализовать Python интеграцию
4. Зарегистрировать команды

**Файлы для изменения:**
- `src-tauri/src/analysis/commands/transcription.rs`
- `src-tauri/src/subtitles/commands.rs`
- `src-tauri/src/app_builder.rs`

### Фаза 4: Recognition Models (Приоритет: СРЕДНИЙ) 🟡

#### 4.1. YOLO & Recognition Models (28 команд)

**YOLO Commands:**
- [ ] `detect_objects_in_image` - Детекция объектов
- [ ] `get_yolo_class_names_advanced` - Расширенные имена классов
- [ ] `update_yolo_confidence_threshold` - Обновление порога уверенности
- [ ] `get_available_yolo_models` - Доступные YOLO модели

**Face Recognition:**
- [ ] `init_retinaface_processor` - Инициализация RetinaFace
- [ ] `detect_faces_with_landmarks` - Детекция с ориентирами
- [ ] `generate_face_embedding` - Генерация embedding лица
- [ ] `calculate_cosine_similarity` - Расчёт косинусной схожести

**MediaPipe:**
- [ ] `init_mediapipe_processor` - Инициализация MediaPipe
- [ ] `detect_faces_blazeface` - Детекция через BlazeFace
- [ ] `extract_face_mesh_landmarks` - Извлечение mesh ориентиров
- [ ] `analyze_facial_expressions` - Анализ выражений лица

**Privacy & Clustering:**
- [ ] `init_privacy_processor` - Инициализация privacy процессора
- [ ] `blur_faces_in_video_frames` - Размытие лиц в видео
- [ ] `init_clustering_engine` - Инициализация кластеризации
- [ ] `cluster_faces` - Кластеризация лиц
- [ ] `auto_cluster_video_faces` - Автоматическая кластеризация видео

**Действия:**
1. Расширить recognition модуль
2. Добавить поддержку MediaPipe
3. Реализовать clustering engine
4. Зарегистрировать все команды

**Файлы для изменения:**
- `src-tauri/src/recognition/yolo.rs`
- `src-tauri/src/recognition/mediapipe.rs` (создать)
- `src-tauri/src/recognition/clustering.rs` (создать)
- `src-tauri/src/app_builder.rs`

### Фаза 5: Media & Compiler (Приоритет: НИЗКИЙ) 🟢

#### 5.1. Media Management (5 команд)
**Модуль:** `src-tauri/src/media/commands.rs`

- [ ] `cancel_media_processing` - Отмена обработки медиа
- [ ] `eject_device` - Извлечение устройства
- [ ] `scan_media_folder_with_thumbnails` - Сканирование с превью
- [ ] `detect_camera_devices` - Детекция камер
- [ ] `list_camera_files` - Список файлов камеры

#### 5.2. Video Compiler (6 команд)
**Модуль:** `src-tauri/src/video_compiler/commands/`

- [ ] `set_hardware_acceleration` - Настройка аппаратного ускорения
- [ ] `get_render_job` - Получение задачи рендера
- [ ] `save_file` - Сохранение файла
- [ ] `load_file` - Загрузка файла
- [ ] `generate_preview` - Генерация превью
- [ ] `get_cache_size` - Получение размера кэша

#### 5.3. Platform Optimization (2 команды)
**Модуль:** `src-tauri/src/media/` или `analysis/`

- [ ] `ffmpeg_generate_thumbnail` - Генерация превью через FFmpeg
- [ ] `ffmpeg_extract_frame` - Извлечение кадра через FFmpeg

#### 5.4. Utilities (2 команды)
- [ ] `log_ai_performance_metric` - Логирование метрик AI
- [ ] `analyze_video_comprehensive` - Полный анализ видео

**Действия:**
1. Реализовать недостающие медиа команды
2. Добавить команды компилятора
3. Расширить FFmpeg утилиты
4. Зарегистрировать команды

## Критерии готовности

### Обязательные требования:

- [ ] Все 109 команд зарегистрированы в `app_builder.rs`
- [ ] Все команды имеют реализации в соответствующих модулях
- [ ] Все команды компилируются без ошибок
- [ ] Обновлена документация `frontend-backend-commands-coverage.md`
- [ ] Запущен `scripts/analyze-command-usage.ts` - покрытие > 80%
- [ ] Добавлены unit тесты для критичных команд (Фаза 1-2)

### Желательные требования:

- [ ] Integration тесты для State Manager API
- [ ] E2E тесты для Person Identification
- [ ] Документация API для новых команд
- [ ] Примеры использования для сложных команд

## Тестирование

### Unit тесты (Rust)

**Критичные модули для тестирования:**
1. `state/commands_api.rs` - State Manager
2. `recognition/person_database.rs` - Person Database
3. `ai_api_proxy/` - AI Services

**Команды для запуска:**
```bash
# Все Rust тесты
cargo test

# Конкретный модуль
cargo test --package timeline-studio --lib state::commands_api
cargo test --package timeline-studio --lib recognition::person_database
```

### Integration тесты (TypeScript)

**Тестирование invoke вызовов:**
```typescript
// Пример теста для State Manager
describe('State Manager Commands', () => {
  it('should execute batch commands', async () => {
    const result = await invoke('execute_batch_commands', {
      commands: [...]
    })
    expect(result).toBeDefined()
  })
})
```

### Проверка покрытия

```bash
# Запустить анализ команд
bun run scripts/analyze-command-usage.ts

# Проверить, что coverage > 80%
# Проверить, что unregistered commands = 0
```

## Риски и зависимости

### Риски:

1. **Большой объём работы** - 109 команд, некоторые требуют сложной реализации
2. **Зависимости между командами** - некоторые команды используют другие
3. **Производительность** - новые команды могут влиять на производительность
4. **Breaking changes** - изменения могут сломать существующий функционал

### Зависимости:

- FFmpeg должен быть настроен на всех платформах
- ONNX Runtime для recognition команд
- Python для Whisper интеграции (опционально)
- GPU для hardware acceleration команд

### Смягчение рисков:

1. **Поэтапное выполнение** - начать с критичных команд (Фаза 1)
2. **Тестирование после каждой фазы** - убедиться что ничего не сломалось
3. **Feature flags** - использовать для новых экспериментальных команд
4. **Rollback plan** - иметь возможность откатить изменения

## Оценка времени

### По фазам:

- **Фаза 1 (Критичные):** 3-5 дней
  - State Manager API: 1 день
  - Unified Audio API: 2-3 дня
  - Тестирование: 1 день

- **Фаза 2 (AI Services):** 5-7 дней
  - AI Services API: 2-3 дня
  - Person Identification: 3-4 дня
  - Тестирование: 1 день

- **Фаза 3 (Montage & Whisper):** 3-4 дня
  - Montage Planner: 2 дня
  - Whisper: 1-2 дня

- **Фаза 4 (Recognition):** 4-5 дней
  - YOLO расширения: 2 дня
  - MediaPipe интеграция: 2-3 дня

- **Фаза 5 (Media & Compiler):** 2-3 дня

**Общая оценка:** 17-24 дня (3-5 недель)

**Рекомендуемый подход:** Разделить между несколькими разработчиками для параллельного выполнения фаз.

## Связанные задачи

### Следующие задачи после завершения:

1. Очистка неиспользуемых команд (223 команды)
2. Улучшение покрытия тестами
3. Оптимизация производительности новых команд
4. Документирование API для пользователей

### Блокирует:

- Полноценную работу AI функций
- Person Identification систему
- Advanced Tracking
- State Manager функционал
- Whisper транскрипцию

## Дополнительные ресурсы

### Документация:

- [Tauri Command System](https://tauri.app/v1/guides/features/command/)
- [Rust async/await](https://rust-lang.github.io/async-book/)
- [FFmpeg Rust bindings](https://docs.rs/ffmpeg-next/)

### Примеры реализации:

См. существующие команды в:
- `src-tauri/src/media/commands.rs`
- `src-tauri/src/recognition/commands.rs`
- `src-tauri/src/video_compiler/commands/`

### Инструменты:

```bash
# Анализ команд
bun run scripts/analyze-command-usage.ts

# Rust форматирование
cargo fmt

# Rust линтинг
cargo clippy

# Тесты
cargo test
bun test
```

## Примечания

- Эта задача критична для стабильности приложения
- Некоторые команды могут уже иметь частичную реализацию
- Приоритизировать команды, которые блокируют пользовательские функции
- Документировать все новые команды в процессе разработки

---

**Автор:** Claude Code (Analyzer)
**Дата последнего обновления:** 2025-11-29
**Версия:** 1.0

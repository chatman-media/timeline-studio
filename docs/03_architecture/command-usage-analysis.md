# Анализ использования Tauri команд

**Дата анализа:** 2025-11-29
**Инструмент:** `scripts/analyze-command-usage.ts`

## Итоговая статистика

**Последнее обновление:** 2025-11-29 (после Фазы 1)

| Метрика | Начальное значение | Текущее значение | Изменение |
|---------|-------------------|------------------|-----------|
| Зарегистрировано команд | 335 | 340 | +5 |
| Используется на фронтенде | 112 (33.4%) | 116 (34.1%) | +4 команды, +0.7% |
| Не используется | 223 (66.6%) | 224 (65.9%) | +1 |
| Вызывается, но не зарегистрировано | 109 | 105 | -4 |

### Прогресс регистрации команд

**Фаза 1 (ЗАВЕРШЕНО):**
- ✅ State Manager API: 3 команды зарегистрированы
- ✅ Unified Audio API: 4 alias команды зарегистрированы
- ✅ Покрытие улучшено с 33.4% до 34.1%
- ✅ Осталось незарегистрированных: 105 команд

## ⚠️ Критические проблемы

### 1. Команды вызываются, но не зарегистрированы (105 команд)

Эти команды вызываются на фронтенде через `invoke()`, но не зарегистрированы в `app_builder.rs`. Это вызовет ошибки при выполнении.

#### ~~Аудио анализ (unified audio API)~~ ✅ ИСПРАВЛЕНО
```
- unified_audio_analyze_comprehensive  ✅
- unified_audio_analyze_quick          ✅
- unified_audio_analyze_batch          ✅
- unified_audio_get_capabilities       ✅
- analyze_audio_peaks                  (уже зарегистрирована)
- detect_speech_onsets                 (уже зарегистрирована)
- correlate_audio_files                (уже зарегистрирована)
```

#### ~~State Manager API~~ ✅ ИСПРАВЛЕНО (частично)
```
- execute_batch_commands               ✅
- get_app_directories                  (уже зарегистрирована)
- create_app_directories               (уже зарегистрирована)
- get_directory_sizes                  (уже зарегистрирована)
- clear_app_cache                      (уже зарегистрирована)
- save_workspace_state                 ✅
- load_workspace_state                 ✅
```

#### AI Services
```
- ai_send_secure_request
- ai_send_unified_request
- ai_send_secure_streaming_request
- ai_send_streaming_request
- ai_send_request_with_tools
- ai_send_secure_request_with_tools
- ai_get_cache_stats
- ai_clear_cache
- ai_cleanup_expired_cache
- ai_validate_provider
- ai_get_supported_providers
- ai_get_provider_models
- ai_check_providers_health
- ai_send_request_with_fallback
```

#### Recognition & Person Identification
```
- init_person_database
- create_person, get_person, delete_person
- search_similar_persons
- add_face_embedding, add_person_appearance
- get_person_database_stats
- set_similarity_threshold
- add_person_thumbnail
- detect_faces_advanced
- analyze_face_quality
- blur_faces_in_image
- start_realtime_face_detection
- stop_realtime_face_detection
- update_face_detection_config
- cleanup_face_detection
```

#### Advanced Tracking
```
- init_advanced_tracking
- start_person_tracking
- process_tracking_frame
- predict_track_positions
- assign_person_to_track
- merge_tracks
- interpolate_track_positions
- stop_person_tracking
- update_tracking_config
- cleanup_tracking
```

#### Montage Planner
```
- analyze_montage_videos
- apply_montage_plan
- export_montage_plan
- optimize_montage_plan
- validate_montage_plan
- calculate_plan_statistics
- analyze_video_quality
- analyze_frame_quality
- analyze_audio_content
```

#### Media Management
```
- cancel_media_processing
- eject_device
- scan_media_folder_with_thumbnails
- detect_camera_devices
- list_camera_files
```

#### Video Compiler
```
- set_hardware_acceleration
- get_render_job
- save_file, load_file
- generate_preview
- get_cache_size
```

#### Whisper & Transcription
```
- init_whisper_python
- transcribe_with_faster_whisper
- get_whisper_models
- download_whisper_model
- prepare_audio_for_whisper
- generate_subtitles_from_transcription
- update_timeline_subtitles
```

#### YOLO & Recognition Models
```
- load_yolo_data, save_yolo_data
- analyze_video_with_yolo
- detect_objects_in_image
- get_yolo_class_names_advanced
- update_yolo_confidence_threshold
- get_available_yolo_models
- init_retinaface_processor
- detect_faces_with_landmarks
- generate_face_embedding
- calculate_cosine_similarity
- init_mediapipe_processor
- detect_faces_blazeface
- extract_face_mesh_landmarks
- analyze_facial_expressions
- init_privacy_processor
- blur_faces_in_video_frames
- init_clustering_engine
- cluster_faces
- auto_cluster_video_faces
```

#### Platform Optimization
```
- ffmpeg_generate_thumbnail
- ffmpeg_extract_frame
```

#### Utilities
```
- log_ai_performance_metric
- analyze_video_comprehensive
```

## Покрытие по доменам

### ai-services
- **Backend модули:** analysis, ai_director_v2, recognition
- **Всего команд:** 82
- **Используется:** 8 (9.8%)
- **Проблема:** Очень низкое покрытие, большинство AI команд не используется

### media-management
- **Backend модули:** media
- **Всего команд:** 23
- **Используется:** 15 (65.2%)
- **Статус:** Хорошее покрытие

### video-editing
- **Backend модули:** video_compiler, compiler
- **Всего команд:** 173
- **Используется:** 53 (30.6%)
- **Проблема:** Много неиспользуемых команд компилятора

### subtitles
- **Backend модули:** subtitles
- **Всего команд:** 5
- **Используется:** 2 (40.0%)
- **Статус:** Приемлемо

### system-integration
- **Backend модули:** language, update_checker, plugin_system
- **Всего команд:** 0
- **Используется:** 0 (0%)
- **Проблема:** Модули не сопоставлены с командами

### project-management
- **Backend модули:** state
- **Всего команд:** 1
- **Используется:** 0 (0%)
- **Проблема:** State Manager команды не зарегистрированы

### ai-director
- **Backend модули:** ai_director_v2
- **Всего команд:** 0
- **Используется:** 0 (0%)
- **Проблема:** Модули не сопоставлены

### ai-tools
- **Backend модули:** analysis, ai_api_proxy
- **Всего команд:** 0
- **Используется:** 0 (0%)
- **Проблема:** Модули не сопоставлены

## Неиспользуемые команды по модулям

### video_compiler (120 команд не используется)
Модуль с наибольшим количеством неиспользуемых команд:
- recognition_advanced_commands
- GPU команды (auto_select_gpu, benchmark_gpu, check_hardware_acceleration)
- Cache команды (clean_old_cache, cleanup_cache, clear_cache, etc.)
- Prerender команды (check_prerender_status, etc.)
- И ещё ~110 других команд

### analysis (58 команд не используется)
AI анализ с большим количеством неиспользуемых команд:
- create_analysis_project
- get_analysis_project
- get_analysis_project_progress
- update_analysis_progress
- get_analysis_project_media_files
- get_project_scenes
- get_project_key_moments
- get_project_statistics
- search_project_data
- create_analysis_scene
- И ещё ~48 других команд

### recognition (16 команд не используется)
- export_recognition_results
- get_recognition_results
- get_yolo_class_names
- load_yolo_model
- process_video_batch
- process_yolo_batch
- set_yolo_target_classes
- yolo_commands
- facenet_commands
- retinaface_commands
- И ещё ~6 других команд

### media (8 команд не используется)
- import_media_files
- scan_media_directory
- index_media_files
- search_media_library
- generate_timeline_previews
- process_media_files
- process_media_files_with_thumbnails
- analyze_media

### security (5 команд не используется)
- get_api_key_info
- has_api_key
- get_oauth_user_info
- parse_oauth_callback_url
- additional_commands

### subtitles (3 команды не используется)
- validate_subtitle_format
- convert_subtitle_format
- get_subtitle_info

### filesystem (2 команды не используется)
- operations
- app_dirs

### Другие модули
- **language_tauri:** load_translation_tauri
- **proxy_generator:** generate_proxy_command
- **core:** plugins
- **commands:** audio_analysis, audio_correlation, transcription
- **state:** commands_api
- **mcp:** mcp_update_config, mcp_get_tools, mcp_chat

## Рекомендации

### 1. Критично: Зарегистрировать недостающие команды

Необходимо добавить в `app_builder.rs` все команды, которые вызываются на фронтенде:
- Unified Audio API (7 команд)
- State Manager API (7 команд)
- AI Services API (14 команд)
- Person Identification API (17 команд)
- Advanced Tracking API (10 команд)
- Montage Planner API (7 команд)
- И остальные 47 команд

**Приоритет:** ВЫСОКИЙ
**Влияние:** Без этого многие функции будут падать с ошибками

### 2. Высокий приоритет: Очистить неиспользуемые команды

223 команды зарегистрированы, но не используются. Это:
- Увеличивает размер приложения
- Усложняет поддержку кода
- Может содержать уязвимости

**Рекомендация:** Провести аудит и удалить или задокументировать неиспользуемые команды.

### 3. Улучшить покрытие в критичных доменах

#### ai-services (9.8% покрытие)
- Определить какие AI команды должны использоваться
- Зарегистрировать unified AI API
- Удалить неиспользуемые команды из analysis модуля

#### video-editing (30.6% покрытие)
- Провести аудит 120 неиспользуемых команд video_compiler
- Определить какие команды нужны для будущих функций
- Удалить остальные

### 4. Исправить маппинг доменов к модулям

Некоторые домены показывают 0 команд, хотя используют backend:
- system-integration → должен использовать language, update_checker, plugin_system
- ai-director → должен использовать ai_director_v2
- ai-tools → должен использовать analysis, ai_api_proxy

**Причина:** Скрипт анализа не находит правильный маппинг.
**Решение:** Обновить скрипт или проверить организацию модулей.

### 5. Создать тесты для критичных команд

Команды с высоким использованием должны иметь:
- Unit тесты на Rust стороне
- Integration тесты на TypeScript стороне
- E2E тесты для критичных путей

## План действий

1. **Неделя 1: Регистрация недостающих команд**
   - [ ] Зарегистрировать Unified Audio API
   - [ ] Зарегистрировать State Manager API
   - [ ] Зарегистрировать AI Services API
   - [ ] Зарегистрировать Person Identification API
   - [ ] Зарегистрировать остальные критичные команды

2. **Неделя 2: Аудит неиспользуемых команд**
   - [ ] Проанализировать 120 команд video_compiler
   - [ ] Проанализировать 58 команд analysis
   - [ ] Проанализировать 16 команд recognition
   - [ ] Принять решение: удалить или оставить для будущего

3. **Неделя 3: Улучшение маппинга**
   - [ ] Исправить маппинг доменов к модулям
   - [ ] Обновить документацию
   - [ ] Создать автоматический мониторинг покрытия

4. **Неделя 4: Тестирование**
   - [ ] Добавить тесты для критичных команд
   - [ ] Проверить все пути выполнения
   - [ ] Обновить CI/CD для проверки покрытия

## Автоматизация

Скрипт `scripts/analyze-command-usage.ts` теперь доступен для регулярного анализа.

**Использование:**
```bash
bun run scripts/analyze-command-usage.ts
```

**Рекомендация:** Добавить в CI/CD для автоматической проверки:
```yaml
- name: Analyze command usage
  run: |
    bun run scripts/analyze-command-usage.ts
    # Fail if coverage drops below threshold
    # Fail if unregistered commands detected
```

## Заключение

Текущее состояние показывает значительный разрыв между зарегистрированными и используемыми командами:
- **33.4% покрытие** - слишком низко
- **109 незарегистрированных команд** - критическая проблема
- **223 неиспользуемых команды** - технический долг

Требуется системная работа по приведению backend и frontend в соответствие.

---

**Следующий анализ:** После регистрации недостающих команд
**Ответственный:** Команда разработки
**Статус:** 🔴 Требует немедленного внимания

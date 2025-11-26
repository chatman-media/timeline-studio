# Рефакторинг: Перенос бизнес-логики из Features в Domains

**Создано:** 2024-11-26
**Завершено:** 2025-11-26
**Статус:** ✅ Завершено
**Приоритет:** Высокий

## Цель

Перенести всю бизнес-логику (Tauri команды, сервисы) из `src/features/` в `src/domains/`.
Features должны содержать только:
- UI компоненты
- React хуки (которые используют сервисы из доменов)
- Типы специфичные для UI

## Текущее состояние

### Features с бизнес-логикой (invoke команды)

| Feature | Файлы с invoke | Целевой домен | Приоритет |
|---------|----------------|---------------|-----------|
| **video-compiler** | 5 файлов | video-editing (новый модуль) | 🔴 High |
| **person-identification** | 3 файла | ai-services ⚠️ дубликат! | 🔴 High |
| **recognition** | 2 файла | ai-services ⚠️ дубликат! | 🔴 High |
| **media** | 4 файла | media-management | 🔴 High |
| **user-settings** | 1 файл | project-management | 🟡 Medium |
| **effects** | 2 файла | video-editing | 🟡 Medium |
| **subtitles** | 2 файла | video-editing | 🟡 Medium |
| **ai-director** | 1 файл | ai-services | 🟡 Medium |
| **workspace** | 1 файл | system-integration | 🟡 Medium |
| **updates** | 1 файл | system-integration | 🟢 Low |
| **app-state** | 2 файла | project-management | 🟢 Low |
| **analysis-dashboard** | 1 файл | system-integration | 🟢 Low |

**Всего:** 12 features, ~25 файлов требуют рефакторинга

---

## Детальный план по каждой feature

### 1. 🔴 video-compiler → video-editing domain

**Файлы для переноса:**
- `services/video-compiler-service.ts` → `domains/video-editing/services/compiler/`
- `services/metadata-cache-service.ts` → `domains/video-editing/services/cache/`
- `services/cache-service.ts` → `domains/video-editing/services/cache/`
- `hooks/use-gpu-capabilities.ts` → оставить хук, перенести логику
- `hooks/use-cache-stats.ts` → оставить хук, перенести логику

**Команды Tauri (18):**
- `compile_video`, `cancel_render`, `get_render_progress`
- `get_gpu_capabilities_full`, `check_gpu_encoder_availability`
- `extract_timeline_frames`, `extract_recognition_frames`
- `get_cache_stats`, `clear_preview_cache`, `clear_all_cache`
- и другие

**Задачи:**
- [ ] Создать `domains/video-editing/services/compiler/` модуль
- [ ] Перенести video-compiler-service.ts
- [ ] Создать `domains/video-editing/tauri/compiler-commands.ts`
- [ ] Обновить импорты в features/video-compiler
- [ ] Обновить тесты

---

### 2. 🔴 person-identification → ai-services domain

**Проблема:** Дубликат кода! Сервисы уже существуют в обоих местах:
- `features/person-identification/services/`
- `domains/ai-services/services/person-identification/`

**Файлы для переноса/удаления:**
- `services/person-database-service.ts` → удалить, использовать домен
- `services/advanced-tracking-service.ts` → удалить, использовать домен
- `services/advanced-face-detection-service.ts` → удалить, использовать домен

**Команды Tauri (24):**
- Person Database: `init_person_database`, `create_person`, `delete_person`...
- Advanced Tracking: `init_advanced_tracking`, `start_person_tracking`...
- Face Detection: `init_yolo_processor`, `init_facenet_processor`...
- Clustering: `init_clustering_engine`, `cluster_faces`...

**Задачи:**
- [ ] Сравнить версии сервисов в features и domains
- [ ] Выбрать более полную версию как основную
- [ ] Удалить дубликаты из features
- [ ] Обновить импорты в компонентах
- [ ] Проверить, что все команды есть в `domains/ai-services/tauri/`

---

### 3. 🔴 recognition → ai-services domain

**Проблема:** Дубликат кода!
- `features/recognition/services/yolo-data-service.ts`
- `domains/ai-services/services/recognition/yolo-data-service.ts`

**Файлы для переноса/удаления:**
- `services/yolo-data-service.ts` → удалить, использовать домен
- `hooks/use-recognition-preview.ts` → оставить хук, использовать сервис из домена

**Команды Tauri (3):**
- `init_yolo_processor`
- `save_yolo_data`
- `clear_recognition_results`

**Задачи:**
- [ ] Сравнить версии yolo-data-service
- [ ] Удалить дубликат из features
- [ ] Обновить use-recognition-preview.ts для использования домена
- [ ] Убедиться что команды в `domains/ai-services/tauri/recognition-commands.ts`

---

### 4. 🔴 media → media-management domain

**Файлы для переноса:**
- `services/media-api.ts` → `domains/media-management/services/`
- `hooks/use-media-processor.ts` → логику в домен
- `hooks/use-media-preview.ts` → логику в домен
- `hooks/use-frame-preview.ts` → логику в домен

**Команды Tauri:**
- `get_media_metadata`
- `cancel_media_processing`
- `generate_media_thumbnail`
- и другие

**Задачи:**
- [ ] Перенести media-api.ts в domains/media-management/services/
- [ ] Создать domains/media-management/tauri/media-commands.ts
- [ ] Обновить хуки для использования сервисов из домена
- [ ] Обновить тесты

---

### 5. 🟡 user-settings → project-management domain

**Файлы для переноса:**
- `hooks/use-api-keys.ts` → логику в домен

**Команды Tauri (12):**
- `list_api_keys`, `save_simple_api_key`, `validate_api_key`
- `save_oauth_credentials`, `generate_oauth_url`, `exchange_oauth_code`
- `delete_api_key`, `import_from_env`, `export_to_env_format`
- и другие

**Задачи:**
- [ ] Создать `domains/project-management/services/api-keys-service.ts`
- [ ] Создать `domains/project-management/tauri/api-keys-commands.ts`
- [ ] Обновить use-api-keys.ts для использования сервиса

---

### 6. 🟡 effects → video-editing domain

**Файлы для переноса:**
- `utils/user-effects.ts` → `domains/video-editing/services/effects/`
- `services/user-presets-service.ts` → `domains/video-editing/services/effects/`

**Команды Tauri:**
- `save_file` - сохранение пресетов
- `delete_user_effect` - удаление эффектов

**Задачи:**
- [ ] Создать `domains/video-editing/services/effects/` модуль
- [ ] Перенести user-presets-service.ts
- [ ] Обновить импорты в features/effects

---

### 7. 🟡 subtitles → video-editing domain

**Файлы для переноса:**
- `hooks/use-subtitles-export.ts` → логику в домен
- `hooks/use-subtitle-import.ts` → логику в домен

**Команды Tauri (2):**
- `save_subtitle_file`
- `update_timeline_subtitles`

**Задачи:**
- [ ] Создать `domains/video-editing/services/subtitles/`
- [ ] Перенести логику экспорта/импорта
- [ ] Обновить хуки

---

### 8. 🟡 ai-director → ai-services domain

**Файлы для переноса:**
- `services/ai-director-service.ts` → `domains/ai-services/services/director/`

**Примечание:** Большая часть AI Director логики уже может быть в ai-services. Проверить.

**Задачи:**
- [ ] Проверить существующую структуру в ai-services
- [ ] Перенести недостающую логику
- [ ] Обновить импорты

---

### 9. 🟡 workspace → system-integration domain

**Файлы для переноса:**
- `services/workspace-persistence.ts` → `domains/system-integration/services/`

**Команды Tauri (2):**
- `save_workspace_state`
- `load_workspace_state`

**Задачи:**
- [ ] Создать `domains/system-integration/services/workspace/`
- [ ] Перенести workspace-persistence.ts
- [ ] Обновить импорты

---

### 10. 🟢 updates → system-integration domain

**Файлы для переноса:**
- `services/update-service.ts` → `domains/system-integration/services/`

**Команды Tauri (1):**
- `download_and_install_update`

**Задачи:**
- [ ] Создать `domains/system-integration/services/updates/`
- [ ] Перенести update-service.ts

---

### 11. 🟢 app-state → project-management domain

**Файлы для переноса:**
- `services/batch-commands.ts` → `domains/project-management/services/`
- `services/app-directories-service.ts` → `domains/system-integration/services/`

**Команды Tauri:**
- `execute_batch_commands`
- `clear_app_cache`

**Задачи:**
- [ ] Перенести batch-commands.ts в project-management
- [ ] Перенести app-directories-service.ts в system-integration

---

### 12. 🟢 analysis-dashboard → system-integration domain

**Файлы для переноса:**
- `hooks/use-performance-monitoring.ts` → логику в домен

**Команды Tauri:**
- `get_system_info` (планируемая)

**Задачи:**
- [ ] Создать `domains/system-integration/services/performance/`
- [ ] Перенести логику мониторинга

---

## Порядок выполнения

### Фаза 1: Устранение дубликатов (Критично) ✅ ЗАВЕРШЕНО
1. [x] person-identification - удалить дубликаты, использовать ai-services (2024-11-26)
2. [x] recognition - удалить дубликаты, использовать ai-services (2024-11-26)

### Фаза 2: Критичная бизнес-логика ✅ ЗАВЕРШЕНО
3. [x] video-compiler → video-editing (2024-11-26)
4. [x] media → media-management (2024-11-26)

### Фаза 3: Пользовательские настройки ✅ ЗАВЕРШЕНО
5. [x] user-settings → project-management (2024-11-26)
6. [x] effects → video-editing (2024-11-26)
7. [x] subtitles → video-editing (2024-11-26)

### Фаза 4: Системная интеграция ✅ ЗАВЕРШЕНО
8. [x] ai-director → ai-services (2024-11-26)
9. [x] workspace → system-integration (2024-11-26)
10. [x] updates → system-integration (2024-11-26)
11. [x] app-state → project-management (2024-11-26)
12. [x] analysis-dashboard → frontend-only, документация обновлена (2024-11-26)

---

## Критерии завершения

- [x] Все invoke() вызовы находятся только в `src/domains/`
- [x] Features содержат только UI компоненты и хуки-обёртки
- [x] Нет дубликатов сервисов между features и domains
- [x] Все тесты проходят
- [x] Документация обновлена (42 README стандартизированы)

---

## Риски и митигация

| Риск | Митигация |
|------|-----------|
| Сломается функциональность | Постепенный перенос с тестами |
| Циклические зависимости | Использовать Domain Event Bus |
| Большой объём изменений | Разбить на мелкие PR по фазам |

---

## Связанные документы

- [Domains README](../../../src/domains/README.md)
- [Architecture Overview](../../03_architecture/overview.md)

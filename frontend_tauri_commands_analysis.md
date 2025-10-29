# Анализ вызовов Tauri команд в Frontend коде

## Команды, которые frontend пытается вызвать, но которых НЕТ в app_builder.rs

### Модуль AI Services / Recognition
- `log_ai_performance_metric` - логирование метрик производительности ИИ

### Модуль Person Identification / Advanced Tracking  
- `init_advanced_tracking` - инициализация продвинутого трекинга
- `start_person_tracking` - запуск трекинга персон
- `assign_person_to_track` - назначение персоны на трек
- `merge_tracks` - слияние треков
- `stop_person_tracking` - остановка трекинга персон
- `update_tracking_config` - обновление конфигурации трекинга
- `cleanup_tracking` - очистка данных трекинга

### Модуль Person Identification / Advanced Face Detection
- `start_realtime_face_detection` - запуск детекции лиц в реальном времени
- `stop_realtime_face_detection` - остановка детекции лиц в реальном времени  
- `update_face_detection_config` - обновление конфигурации детекции лиц
- `cleanup_face_detection` - очистка данных детекции лиц

### Модуль Person Identification / Database
- `init_person_database` - инициализация базы данных персон

### Модуль Media Processing
- `cancel_media_processing` - отмена обработки медиа
- `update_timeline_subtitles` - обновление субтитров на временной линии

### Модуль Montage Planner
- `analyze_montage_videos` - анализ видео для монтажа (отличается от analyze_video_composition)

### Модуль Video Compiler
- `get_render_job` - получение задачи рендера
- `set_hardware_acceleration` - установка аппаратного ускорения

### Модуль Batch Commands
- `execute_batch_commands` - выполнение пакетных команд

### Модуль Platform Optimization
- `ffmpeg_generate_thumbnail` - генерация миниатюр через FFmpeg (не путать с ffmpeg_generate_platform_thumbnail)

## Команды, которые ЕСТЬ в app_builder.rs, но используются с другими именами

### Recognition команды
Frontend использует:
- `get_yolo_class_names_advanced` 
Backend имеет:
- `get_yolo_class_names` (без _advanced)

## Группировка недостающих команд по модулям

### Advanced Person Identification (8 команд)
```rust
// Отсутствующие команды для продвинутой идентификации персон
init_advanced_tracking,
start_person_tracking,
assign_person_to_track,
merge_tracks,
stop_person_tracking,
update_tracking_config,
cleanup_tracking,
init_person_database,
```

### Real-time Face Detection (4 команды)
```rust
// Отсутствующие команды для детекции лиц в реальном времени
start_realtime_face_detection,
stop_realtime_face_detection,
update_face_detection_config,
cleanup_face_detection,
```

### Media Processing & Timeline (3 команды)
```rust
// Отсутствующие команды для обработки медиа
cancel_media_processing,
update_timeline_subtitles,
ffmpeg_generate_thumbnail,
```

### System & Performance (4 команды)
```rust
// Отсутствующие системные команды
log_ai_performance_metric,
execute_batch_commands,
get_render_job,
set_hardware_acceleration,
```

### Montage Planner (1 команда)
```rust
// Отсутствующая команда планировщика монтажа
analyze_montage_videos,
```

## Статистика

- **Всего команд используется в frontend**: 107
- **Команд отсутствует в backend**: 20 (18.7%)
- **Команд зарегистрировано в backend**: ~429
- **Неиспользуемых команд в backend**: ~342 (79.7%)

## Рекомендации

1. **Критические для реализации** (блокируют функциональность):
   - `init_person_database` - необходима для работы системы идентификации
   - `cancel_media_processing` - важна для UX
   - `get_render_job` - критична для video-compiler

2. **Важные для улучшения UX**:
   - Все команды real-time face detection
   - Команды advanced tracking
   - `update_timeline_subtitles`

3. **Менее критические**:
   - `log_ai_performance_metric` - можно заменить на клиентское логирование
   - `execute_batch_commands` - возможно, не используется активно

4. **Возможные альтернативы**:
   - `ffmpeg_generate_thumbnail` vs `ffmpeg_generate_platform_thumbnail` - проверить совместимость
   - `get_yolo_class_names_advanced` vs `get_yolo_class_names` - возможно, одна команда

## Файлы, которые нужно обновить

### Frontend (удалить неиспользуемые вызовы или заменить):
- `src/domains/ai-services/services/person-identification/advanced-tracking-service.ts`
- `src/domains/ai-services/services/person-identification/advanced-face-detection-service.ts`
- `src/domains/ai-services/services/person-identification/person-database-service.ts`
- `src/features/media/hooks/use-media-processor.ts`
- `src/features/video-compiler/services/video-compiler-service.ts`

### Backend (добавить недостающие команды):
- `src-tauri/src/app_builder.rs` - зарегистрировать команды
- Создать соответствующие модули команд в Rust
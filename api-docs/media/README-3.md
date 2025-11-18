# Video Compiler Module

Модуль для компиляции видео проектов Timeline Studio с использованием FFmpeg.

## Архитектура

```
video_compiler/
├── mod.rs                # Главный модуль, инициализация
├── commands/             # Tauri команды API (модульная структура)
│   ├── mod.rs           # Реэкспорт всех команд
│   ├── rendering.rs     # Команды рендеринга
│   ├── cache.rs         # Команды управления кэшем
│   ├── gpu.rs           # Команды GPU
│   ├── info.rs          # Информационные команды
│   ├── preview.rs       # Команды генерации превью
│   ├── project.rs       # Команды управления проектами
│   ├── settings.rs      # Команды настроек
│   ├── metrics.rs       # Команды метрик и мониторинга
│   ├── misc.rs          # Вспомогательные команды
│   ├── ffmpeg_advanced.rs # Продвинутые FFmpeg команды
│   ├── advanced_metrics.rs # Расширенные метрики
│   ├── state.rs         # Управление состоянием
│   ├── schema_commands.rs # Команды работы со схемой
│   ├── prerender_commands.rs # Команды предрендеринга
│   ├── frame_extraction_commands.rs # Извлечение кадров
│   ├── test_helper_commands.rs # Тестовые утилиты
│   ├── service_commands.rs # Управление сервисами
│   ├── batch_commands.rs # Пакетная обработка
│   ├── multimodal_commands.rs # Мультимодальный анализ
│   ├── whisper_commands.rs # Интеграция с Whisper
│   ├── video_analysis.rs # Анализ видео
│   ├── platform_optimization_commands.rs # Оптимизация для платформ
│   ├── workflow_commands.rs # Управление рабочими процессами
│   ├── compiler_settings_commands.rs # Настройки компилятора
│   ├── service_container_commands.rs # Контейнер сервисов
│   ├── ffmpeg_builder_commands.rs # Команды FFmpeg builder
│   ├── ffmpeg_executor_commands.rs # Команды FFmpeg executor
│   ├── monitoring_commands.rs # Мониторинг и метрики
│   ├── pipeline_commands.rs # Управление конвейерами
│   ├── yolo_commands.rs # YOLO процессор
│   ├── preview_advanced_commands.rs # Расширенные превью
│   ├── frame_extraction_advanced_commands.rs # Расширенное извлечение кадров
│   ├── timeline_schema_commands.rs # Схема таймлайна
│   ├── remaining_utilities_commands.rs # Оставшиеся утилиты
│   ├── ffmpeg_utilities_commands.rs # FFmpeg утилиты
│   ├── pipeline_advanced_commands.rs # Продвинутые команды pipeline
│   ├── recognition_advanced_commands.rs # Продвинутые команды распознавания
│   ├── security_advanced_commands.rs # Команды безопасности
│   ├── ffmpeg_builder_extra_commands.rs # Дополнительные команды FFmpeg
│   ├── progress_tracker_commands.rs # Отслеживание прогресса
│   ├── frame_manager_commands.rs # Управление кадрами
│   └── tests/           # Тесты команд
├── core/                 # Основные компоненты
│   ├── mod.rs           # Реэкспорт основных модулей
│   ├── cache.rs         # Система кэширования
│   ├── error.rs         # Обработка ошибок
│   ├── frame_extraction.rs # Извлечение кадров
│   ├── gpu.rs           # GPU ускорение
│   ├── pipeline.rs      # Конвейер рендеринга
│   ├── pipeline_refactored.rs # Новая архитектура pipeline
│   ├── preview.rs       # Генерация превью
│   ├── progress.rs      # Отслеживание прогресса
│   ├── renderer.rs      # Основной рендерер
│   └── stages/          # Этапы конвейера
│       ├── mod.rs       # Интерфейсы и общие типы
│       ├── validation.rs # Этап валидации
│       ├── preprocessing.rs # Этап предобработки
│       ├── composition.rs # Этап композиции
│       ├── encoding.rs  # Этап кодирования
│       └── finalization.rs # Этап финализации
├── ffmpeg_builder/       # Построитель FFmpeg команд (модульная структура)
│   ├── mod.rs           # Основной модуль
│   ├── builder.rs       # Основной построитель
│   ├── filters.rs       # Построение фильтров
│   ├── inputs.rs        # Обработка входных данных
│   ├── outputs.rs       # Конфигурация вывода
│   ├── effects.rs       # Обработка эффектов
│   ├── subtitles.rs     # Обработка субтитров
│   ├── templates.rs     # Обработка шаблонов
│   └── tests.rs         # Тесты построителя
├── ffmpeg_executor.rs    # Исполнитель FFmpeg команд
├── schema/               # Структуры данных проекта (модульная структура)
│   ├── mod.rs           # Реэкспорт типов
│   ├── project.rs       # Основная схема проекта
│   ├── timeline.rs      # Timeline, треки и клипы
│   ├── effects.rs       # Эффекты, фильтры и переходы
│   ├── templates.rs     # Шаблоны раскладок
│   ├── subtitles.rs     # Субтитры
│   ├── export.rs        # Настройки экспорта
│   ├── common.rs        # Общие типы
│   └── tests.rs         # Тесты схемы
├── services/             # Сервисы
│   ├── mod.rs           # Service Container
│   ├── cache_service.rs # Сервис кэширования
│   ├── cache_service_with_metrics.rs # Кэш с метриками
│   ├── ffmpeg_service.rs # FFmpeg сервис
│   ├── gpu_service.rs   # GPU сервис
│   ├── preview_service.rs # Сервис превью
│   ├── project_service.rs # Сервис проектов
│   ├── render_service.rs # Сервис рендеринга
│   └── monitoring.rs    # Мониторинг и метрики
└── tests/               # Интеграционные тесты
    ├── mod.rs           # Главный модуль тестов
    ├── fixtures.rs      # Тестовые данные
    ├── integration.rs   # Интеграционные тесты
    ├── mocks.rs         # Моки для тестов
    └── utils.rs         # Утилиты для тестов
```

## Основные компоненты

### VideoCompilerState
Центральное состояние модуля, управляемое Tauri:

```rust
pub struct VideoCompilerState {
    pub active_jobs: Arc<RwLock<HashMap<String, ActiveRenderJob>>>,
    pub cache_manager: Arc<RwLock<RenderCache>>,
    pub ffmpeg_path: String,
    pub settings: Arc<RwLock<CompilerSettings>>,
}
```

### Основные структуры данных

#### ProjectSchema
```rust
pub struct ProjectSchema {
    pub version: String,
    pub metadata: ProjectMetadata,
    pub timeline: Timeline,        // Настройки timeline
    pub tracks: Vec<Track>,        // Треки на верхнем уровне
    pub effects: Vec<Effect>,      // Глобальные эффекты
    pub transitions: Vec<Transition>,
    pub filters: Vec<Filter>,
    pub templates: Vec<Template>,
    pub style_templates: Vec<StyleTemplate>,
    pub subtitles: Vec<Subtitle>,  // Субтитры на верхнем уровне
    pub settings: ProjectSettings,
}
```

#### Timeline
```rust
pub struct Timeline {
    pub duration: f64,           // Общая продолжительность в секундах
    pub fps: u32,                // Кадров в секунду
    pub resolution: (u32, u32),  // Ширина x Высота
    pub sample_rate: u32,        // Частота дискретизации аудио
    pub aspect_ratio: AspectRatio,
}
```

#### Track
```rust
pub struct Track {
    pub id: String,
    pub track_type: TrackType,   // Video, Audio, Subtitle
    pub name: String,
    pub clips: Vec<Clip>,
    pub enabled: bool,
    pub locked: bool,
    pub volume: f32,
    pub effects: Vec<String>,     // ID эффектов
    pub filters: Vec<String>,     // ID фильтров
}
```

#### Clip
```rust
pub struct Clip {
    pub id: String,
    pub source_path: PathBuf,    // Путь к исходному файлу
    pub start_time: f64,         // Время начала на timeline
    pub end_time: f64,           // Время окончания на timeline
    pub source_start: f64,       // Начало в исходном файле
    pub source_end: f64,         // Окончание в исходном файле
    pub speed: f64,              // Скорость воспроизведения
    pub opacity: f32,            // Прозрачность
    pub effects: Vec<String>,    // ID эффектов
    pub filters: Vec<String>,    // ID фильтров
    pub properties: ClipProperties,
    pub real_path: Option<PathBuf>, // Реальный путь к файлу (для восстановления)
}
```

## API Команды (400+ команд)

### Рендеринг (rendering.rs)
- `compile_video` - Запуск компиляции видео
- `cancel_render` - Отмена рендеринга
- `get_active_render_jobs` - Получить активные задачи
- `get_render_job` - Получить информацию о задаче
- `pause_render` - Приостановить рендеринг
- `resume_render` - Возобновить рендеринг
- `export_with_preset` - Экспорт с предустановками

### Кэш (cache.rs)
- `clear_render_cache` - Очистить весь кэш
- `clear_project_cache` - Очистить кэш проекта
- `get_cache_size` - Получить размер кэша
- `get_cache_stats` - Получить статистику кэша
- `clean_old_cache` - Очистить старые записи
- `get_cached_projects` - Список закэшированных проектов
- `has_project_cache` - Проверить наличие кэша
- `get_cached_media_metadata` - Метаданные медиафайлов
- `clear_media_metadata_cache` - Очистить метаданные
- `optimize_cache` - Оптимизировать кэш
- `export_cache_stats` - Экспорт статистики
- `set_cache_size_limit` - Установить лимит размера
- `get_cache_size_limit` - Получить лимит размера
- `preload_media_to_cache` - Предзагрузка медиа

### GPU (gpu.rs)
- `detect_gpus` - Обнаружить GPU
- `get_gpu_capabilities` - Возможности GPU
- `check_hardware_acceleration_support` - Проверка поддержки
- `get_recommended_gpu` - Рекомендуемый GPU
- `set_preferred_gpu` - Установить предпочитаемый GPU
- `set_hardware_acceleration` - Включить/выключить ускорение
- `get_gpu_usage_status` - Статус использования GPU
- `benchmark_gpu` - Тест производительности
- `get_gpu_supported_codecs` - Поддерживаемые кодеки
- `auto_select_gpu` - Автовыбор GPU

### Информация (info.rs)
- `get_ffmpeg_version` - Версия FFmpeg
- `check_ffmpeg_available` - Проверка доступности FFmpeg
- `get_supported_formats` - Поддерживаемые форматы
- `get_supported_video_codecs` - Видео кодеки
- `get_supported_audio_codecs` - Аудио кодеки
- `get_system_info` - Информация о системе
- `get_disk_space` - Дисковое пространство
- `get_compiler_config` - Конфигурация компилятора
- `get_performance_stats` - Статистика производительности
- `get_available_filters` - Доступные фильтры

### Превью (preview.rs)
- `generate_frame_preview` - Превью кадра
- `generate_video_thumbnails` - Миниатюры видео
- `generate_project_preview` - Превью проекта
- `generate_effect_preview` - Превью эффекта
- `generate_transition_preview` - Превью перехода
- `generate_storyboard` - Раскадровка
- `generate_animated_preview` - Анимированное превью
- `generate_waveform_preview` - Визуализация звуковой волны
- `get_cached_preview_info` - Информация о превью
- `clear_project_previews` - Очистить превью проекта
- `generate_custom_preview` - Настраиваемое превью

### Проекты (project.rs)
- `validate_project_schema` - Валидация схемы
- `optimize_project_schema` - Оптимизация схемы
- `analyze_project` - Анализ проекта
- `get_project_media_files` - Список медиафайлов
- `check_project_media_availability` - Проверка доступности медиа
- `update_project_media_paths` - Обновление путей
- `add_subtitles_to_project` - Добавить субтитры
- `extract_project_subtitles` - Извлечь субтитры
- `backup_project` - Резервное копирование
- `merge_projects` - Объединение проектов
- `split_project` - Разделение проекта

### Настройки (settings.rs)
- `get_compiler_settings` - Получить настройки
- `update_compiler_settings` - Обновить настройки
- `set_ffmpeg_path` - Установить путь к FFmpeg
- `set_parallel_jobs` - Параллельные задачи
- `set_memory_limit` - Лимит памяти
- `set_temp_directory` - Временная директория
- `set_log_level` - Уровень логирования
- `reset_compiler_settings` - Сброс настроек
- `get_recommended_settings` - Рекомендуемые настройки
- `export_settings` - Экспорт настроек
- `import_settings` - Импорт настроек
- `get_quality_presets` - Предустановки качества
- `apply_quality_preset` - Применить предустановку

### FFmpeg продвинутые команды (ffmpeg_advanced.rs)
- `generate_video_preview` - Генерация превью видео
- `generate_gif_preview` - Создание GIF из видео
- `concat_videos` - Объединение видео файлов
- `apply_video_filter` - Применение фильтра к видео
- `probe_media_file` - Анализ медиафайла
- `test_hardware_acceleration` - Тест аппаратного ускорения
- `generate_subtitle_preview` - Превью с субтитрами
- `check_ffmpeg_installation` - Проверка установки FFmpeg
- `get_ffmpeg_codecs` - Список поддерживаемых кодеков
- `get_ffmpeg_formats` - Список поддерживаемых форматов
- `execute_ffmpeg_with_progress` - Выполнение FFmpeg с прогрессом
- `execute_ffmpeg_simple` - Простое выполнение FFmpeg
- `get_ffmpeg_execution_info` - Полная информация о выполнении

### Метрики и мониторинг (metrics.rs)
- `get_all_metrics` - Все метрики системы
- `get_service_metrics` - Метрики сервисов
- `export_metrics_prometheus` - Экспорт в формате Prometheus
- `reset_service_metrics` - Сброс метрик
- `get_active_operations_count` - Количество активных операций
- `get_error_statistics` - Статистика ошибок
- `get_slow_operations` - Медленные операции

### Расширенные метрики (advanced_metrics.rs)
- `get_cache_performance_metrics` - Производительность кэша
- `set_cache_alert_thresholds` - Пороги оповещений
- `get_cache_alerts` - Активные оповещения
- `get_gpu_utilization_metrics` - Использование GPU
- `get_memory_usage_metrics` - Использование памяти
- `create_custom_alert` - Создание пользовательского оповещения
- `get_metrics_history` - История метрик

## Процесс рендеринга

1. **Валидация проекта** - проверка структуры и путей к файлам
2. **Построение FFmpeg команды** - создание сложной команды с фильтрами
3. **Запуск процесса** - выполнение FFmpeg с отслеживанием прогресса
4. **Мониторинг** - обновление статуса через каналы
5. **Завершение** - очистка ресурсов и уведомление

## FFmpeg Executor

Новый компонент для выполнения FFmpeg команд с расширенными возможностями:

```rust
pub struct FFmpegExecutor {
    progress_sender: Option<mpsc::Sender<ProgressUpdate>>,
}

pub struct FFmpegExecutionResult {
    pub exit_code: i32,
    pub stdout: String,
    pub stderr: String,
    pub final_progress: Option<RenderProgress>,
}

pub struct FFmpegExecutionContext {
    pub command_args: Vec<String>,
    pub project_id: Option<String>,
    pub operation_type: FFmpegOperationType,
    pub timeout: Option<Duration>,
    pub env_vars: HashMap<String, String>,
    pub working_dir: Option<PathBuf>,
}

pub enum FFmpegOperationType {
    VideoCompilation,
    FrameExtraction,
    ThumbnailGeneration,
    MediaAnalysis,
    GifCreation,
    VideoConcat,
    FilterApplication,
    SubtitleRendering,
    AudioProcessing,
    StreamCopy,
    Custom(String),
}
```

### Возможности:
- Выполнение команд с отслеживанием прогресса в реальном времени
- Парсинг вывода FFmpeg для извлечения информации о прогрессе
- Поддержка отмены операций
- Простое выполнение для быстрых операций
- Проверка доступности FFmpeg и его возможностей
- Получение списка поддерживаемых кодеков и форматов
- Контекстное выполнение с FFmpegExecutionContext
- Типизированные операции через FFmpegOperationType
- Настройка окружения и рабочей директории
- Гибкие таймауты для разных операций

## GPU Ускорение

Поддерживаемые кодировщики:
- **NVIDIA**: NVENC (h264_nvenc, hevc_nvenc)
- **Intel**: QuickSync (h264_qsv, hevc_qsv)
- **AMD**: AMF (h264_amf, hevc_amf)
- **macOS**: VideoToolbox (h264_videotoolbox, hevc_videotoolbox)
- **Linux**: VA-API (h264_vaapi, hevc_vaapi)

## Кэширование

LRU кэш для:
- Превью кадров
- Метаданных файлов
- Промежуточных результатов

```rust
pub struct CacheMemoryUsage {
    pub total_size: u64,
    pub entry_count: usize,
    pub preview_cache_size: u64,
    pub preview_cache_count: usize,
    pub metadata_cache_size: u64,
    pub metadata_cache_count: usize,
}
```

## Обработка ошибок

```rust
pub enum VideoCompilerError {
    ValidationError(String),
    FFmpegError { exit_code: Option<i32>, stderr: String, command: String },
    DependencyMissing(String),
    IoError(String),
    SerializationError(String),
    MediaFileError { path: String, reason: String },
    UnsupportedFormat { format: String, file_path: String },
    RenderError { job_id: String, stage: String, message: String },
    PreviewError { timestamp: f64, reason: String },
    CacheError(String),
    ConfigError(String),
    ResourceError { resource_type: String, available: String, required: String },
    TimeoutError { operation: String, timeout_seconds: u64 },
    CancelledError(String),
    GpuError(String),
    GpuUnavailable(String),
    InternalError(String),
    Unknown(String),
    TemplateNotFound(String),
    InvalidParameter(String),
}
```

## Использование из фронтенда

```typescript
// Компиляция видео
const jobId = await invoke('compile_video', {
    projectSchema: project,
    outputPath: '/path/to/output.mp4'
});

// Отслеживание прогресса
const job = await invoke('get_render_job', { jobId });

// Генерация превью
const previewPath = await invoke('generate_frame_preview', {
    projectSchema: project,
    timestamp: 10.5,
    outputPath: '/tmp/preview.jpg'
});

// Проверка GPU
const gpus = await invoke('detect_gpus');
const capabilities = await invoke('get_gpu_capabilities', { gpuIndex: 0 });

// Новые FFmpeg команды
// Генерация GIF превью
await invoke('generate_gif_preview', {
    inputPath: '/path/to/video.mp4',
    outputPath: '/path/to/preview.gif',
    startTime: 5.0,
    duration: 3.0,
    fps: 10,
    resolution: [320, 240]
});

// Объединение видео
await invoke('concat_videos', {
    inputPaths: ['/video1.mp4', '/video2.mp4'],
    outputPath: '/output.mp4'
});

// Выполнение FFmpeg с отслеживанием прогресса
await invoke('execute_ffmpeg_with_progress', {
    commandArgs: ['-i', 'input.mp4', '-c:v', 'libx264', 'output.mp4']
});

// Слушатель событий прогресса
await listen('ffmpeg-progress', (event) => {
    console.log('Progress:', event.payload);
});

// Получение информации о медиафайле
const fileInfo = await invoke('probe_media_file', {
    inputPath: '/path/to/media.mp4'
});
```

## Конфигурация

```rust
pub struct CompilerSettings {
    pub max_concurrent_jobs: u32,
    pub cache_size_mb: u64,
    pub temp_directory: PathBuf,
    pub ffmpeg_path: String,
    pub hardware_acceleration: bool,
    pub preview_quality: u8,
}
```

## Восстановление медиафайлов

Модуль поддерживает восстановление ссылок на перемещенные медиафайлы:

```rust
pub struct MediaRestorationService {
    pub async fn restore_missing_files(
        &self,
        project_schema: &mut ProjectSchema
    ) -> Result<Vec<RestorationResult>>
    
    pub async fn find_file_by_signature(
        &self,
        original_path: &Path,
        search_dirs: Vec<PathBuf>
    ) -> Option<PathBuf>
}
```

### Алгоритм восстановления:
1. Проверка существования файлов по оригинальным путям
2. Поиск по имени файла в указанных директориях
3. Сравнение метаданных (размер, длительность для видео)
4. Обновление путей в схеме проекта
5. Сохранение real_path для будущих восстановлений

## Рефакторинг (2025)

Модуль был значительно реорганизован для улучшения поддерживаемости:

1. **commands.rs** разделен на 30+ функциональных модулей
2. **ffmpeg_builder.rs** разделен на 7 специализированных модулей  
3. **schema.rs** разделен на 7 доменных модулей
4. **pipeline.rs** разделен на этапы в **core/stages/** 
5. Добавлена модульная структура **core/** для основных компонентов
6. Создана архитектура **services/** для управления сервисами
7. Добавлен **ffmpeg_executor.rs** для выполнения FFmpeg команд
8. Расширена система метрик и мониторинга
9. Добавлены продвинутые FFmpeg команды для всех операций
10. Добавлены команды AI интеграции (Whisper, multimodal анализ)
11. Полное покрытие тестами новых компонентов
12. **Добавлено 150+ новых Tauri команд** для доступа ко всей функциональности

### Ключевые улучшения:

1. **Модульность** - каждый компонент теперь в отдельном модуле
2. **Сервис-ориентированная архитектура** - все основные функции представлены как сервисы
3. **Расширенный мониторинг** - детальные метрики для всех операций
4. **FFmpeg интеграция** - полная поддержка всех возможностей FFmpeg
5. **AI интеграция** - Whisper для транскрипции, multimodal анализ видео
6. **Тестируемость** - моки, фикстуры и утилиты для тестирования
7. **Минимальные предупреждения компиляции** - 94.5% dead code warnings устранено (с ~200 до 11)
8. **Поэтапный pipeline** - ясная архитектура с отдельными этапами обработки
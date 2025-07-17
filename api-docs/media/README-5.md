# Media Module

Модуль для работы с медиафайлами в Timeline Studio.

## Архитектура

```
media/
├── mod.rs                    # Главный модуль
├── commands.rs               # Tauri команды
├── additional_commands.rs    # Дополнительные команды
├── ffmpeg.rs                 # Интеграция с FFmpeg
├── file_scanner.rs           # Сканирование директорий
├── files.rs                  # Работа с файлами
├── media_analyzer.rs         # Анализ медиафайлов
├── metadata.rs               # Извлечение метаданных через FFprobe
├── metadata_extractor.rs     # Расширенный экстрактор метаданных
├── preview_data.rs           # Структуры данных превью
├── preview_manager.rs        # Менеджер генерации превью
├── processor.rs              # Основной процессор медиа
├── processor_refactored.rs   # Новая архитектура процессора
├── registry.rs               # Регистрация команд
├── thumbnail.rs              # Генерация миниатюр
├── thumbnail_generator.rs    # Улучшенный генератор миниатюр
├── types.rs                  # Типы данных
├── PROCESSOR_README.md       # Документация процессора
└── tests/                    # Тесты модуля
```

## Основные компоненты

### MediaMetadata
Метаданные медиафайла:

```rust
pub struct MediaMetadata {
    pub path: PathBuf,
    pub file_type: FileType,
    pub size: u64,
    pub created: SystemTime,
    pub modified: SystemTime,
    pub duration: Option<f64>,
    pub dimensions: Option<(u32, u32)>,
    pub fps: Option<f32>,
    pub bitrate: Option<u64>,
    pub codec: Option<String>,
    pub has_audio: bool,
    pub audio_channels: Option<u32>,
    pub audio_sample_rate: Option<u32>,
}
```

### FileType
```rust
pub enum FileType {
    Video,
    Audio,
    Image,
    Unknown,
}
```

## API Команды

### Основные команды (commands.rs)

```rust
// Получение метаданных файла
#[tauri::command]
pub async fn get_media_metadata(
    file_path: String
) -> Result<MediaMetadata, String>

// Сканирование директории
#[tauri::command]
pub async fn get_media_files(
    directory_path: String
) -> Result<Vec<MediaFile>, String>

// Сканирование с превью
#[tauri::command]
pub async fn scan_media_folder_with_thumbnails(
    folder_path: String,
    width: u32,
    height: u32,
    app_handle: AppHandle,
) -> Result<Vec<MediaFile>, String>

// Очистка кэша метаданных
#[tauri::command]
pub async fn clear_media_cache() -> Result<(), String>
```

### Дополнительные команды (additional_commands.rs)

```rust
// Проверка формата файла
#[tauri::command]
pub async fn check_media_format_support(
    file_path: String
) -> Result<MediaFormatSupport, String>

// Оптимизация медиафайла для редактирования
#[tauri::command]
pub async fn optimize_media_for_editing(
    input_path: String,
    output_dir: String,
    options: OptimizationOptions,
) -> Result<OptimizedMediaInfo, String>

// Извлечение аудио из видео
#[tauri::command]
pub async fn extract_audio_from_video(
    video_path: String,
    output_path: String,
    format: AudioFormat,
) -> Result<ExtractedAudioInfo, String>

// Конвертация медиа
#[tauri::command]
pub async fn convert_media(
    input_path: String,
    output_path: String,
    target_format: MediaFormat,
    options: ConversionOptions,
) -> Result<ConversionResult, String>
```

## Основные компоненты

### MediaProcessor
Асинхронный процессор для обработки медиафайлов:

```rust
pub struct MediaProcessor {
    app_handle: AppHandle,
    thumbnail_dir: PathBuf,
    semaphore: Arc<Semaphore>,
}

impl MediaProcessor {
    pub async fn scan_and_process(
        &self,
        folder_path: &Path,
        thumbnail_options: Option<ThumbnailOptions>
    ) -> Result<Vec<MediaFile>>
    
    pub async fn process_file(
        &self,
        file_path: &Path,
        thumbnail_options: Option<&ThumbnailOptions>
    ) -> Result<MediaFile>
}
```

### MetadataExtractor
Расширенный экстрактор метаданных с кэшированием:

```rust
pub struct MetadataExtractor {
    cache: Arc<Mutex<HashMap<PathBuf, (SystemTime, ExtendedMetadata)>>>,
}

impl MetadataExtractor {
    pub async fn extract(&self, path: &Path) -> Result<ExtendedMetadata>
    pub async fn extract_with_ffprobe(&self, path: &Path) -> Result<ExtendedMetadata>
    pub fn clear_cache(&self)
}
```

### PreviewManager
Менеджер для генерации превью:

```rust
pub struct PreviewManager {
    thumbnail_dir: PathBuf,
}

impl PreviewManager {
    pub async fn generate_preview(
        &self,
        media_path: &Path,
        media_type: MediaType,
        options: &ThumbnailOptions
    ) -> Result<(PathBuf, Option<String>)>
    
    pub async fn generate_video_thumbnail(
        &self,
        video_path: &Path,
        options: &ThumbnailOptions
    ) -> Result<DynamicImage>
    
    pub async fn generate_image_thumbnail(
        &self,
        image_path: &Path,
        options: &ThumbnailOptions
    ) -> Result<DynamicImage>
}
```

### MediaAnalyzer
Анализатор медиафайлов:

```rust
pub struct MediaAnalyzer;

impl MediaAnalyzer {
    pub async fn analyze_video(
        &self,
        path: &Path
    ) -> Result<VideoAnalysisResult>
    
    pub async fn detect_scenes(
        &self,
        video_path: &Path,
        threshold: f32
    ) -> Result<Vec<SceneInfo>>
    
    pub async fn analyze_audio_levels(
        &self,
        media_path: &Path
    ) -> Result<AudioLevelsInfo>
}
```

## Поддерживаемые форматы

### Видео
- MP4, MOV, AVI, MKV
- WEBM, MPG, MPEG
- M4V, WMV, FLV

### Аудио  
- MP3, WAV, AAC, M4A
- OGG, FLAC, WMA
- AIFF, APE

### Изображения
- JPG, JPEG, PNG
- GIF, BMP, WEBP
- TIFF, SVG

## Работа с FFprobe

Модуль использует FFprobe для извлечения метаданных:

```rust
let output = Command::new("ffprobe")
    .args([
        "-v", "quiet",
        "-print_format", "json",
        "-show_format",
        "-show_streams",
        path.to_str().unwrap()
    ])
    .output()
    .await?;
```

## Кэширование

Метаданные кэшируются для улучшения производительности:
- Кэш хранится в памяти
- Инвалидация по времени модификации файла
- Автоматическая очистка устаревших записей

## Обработка ошибок

```rust
pub enum MediaError {
    IoError(String),
    FfprobeError(String),
    InvalidPath(String),
    UnsupportedFormat(String),
}
```

## Использование из фронтенда

```typescript
// Получить метаданные файла
const metadata = await invoke('get_media_metadata', {
    filePath: '/path/to/video.mp4'
});

// Сканировать директорию
const files = await invoke('get_media_files', {
    directoryPath: '/path/to/media/folder'
});
```

## Новые возможности (после рефакторинга 2025)

### Параллельная обработка
- Одновременная обработка до 4 файлов (настраивается)
- Асинхронное сканирование директорий
- События прогресса через Tauri

### Расширенный анализ
- Определение сцен в видео
- Анализ уровней аудио
- Проверка поддержки форматов

### Оптимизация для редактирования
- Конвертация в proxy-форматы
- Создание оптимизированных копий
- Извлечение аудио дорожек

### Кэширование
- Кэш метаданных с TTL
- Кэш миниатюр с LRU стратегией
- Очистка кэша по команде

## Интеграция с другими модулями

- **video_compiler** - использует метаданные для валидации проекта
- **preview** - генерация миниатюр для медиафайлов
- **timeline** - отображение информации о клипах
- **recognition** - использует данные для анализа содержимого
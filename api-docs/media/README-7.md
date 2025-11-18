# Subtitles Module

Модуль для работы с субтитрами в Timeline Studio.

## Обзор

Модуль subtitles предоставляет функциональность для:
- Загрузки и парсинга субтитров различных форматов
- Генерации субтитров с использованием AI
- Синхронизации субтитров с видео
- Экспорта в различные форматы

## Структура модуля

```
subtitles/
├── mod.rs          # Основной модуль
├── commands.rs     # Tauri команды
└── tests.rs        # Тесты модуля
```

## Поддерживаемые форматы

### Импорт:
- **SRT** (SubRip Subtitle)
- **VTT** (WebVTT)
- **ASS/SSA** (Advanced SubStation Alpha)
- **TTML** (Timed Text Markup Language)

### Экспорт:
- **SRT** - наиболее популярный формат
- **VTT** - для веб-плейеров
- **JSON** - для внутреннего использования

## Основные возможности

### 📥 Импорт субтитров
```rust
// Загрузка субтитров из файла
let subtitles = load_subtitles("path/to/subtitles.srt").await?;

// Парсинг из строки
let subtitles = parse_srt_content(&srt_content)?;
```

### 🤖 AI генерация
```rust
// Генерация субтитров с помощью Whisper
let subtitles = generate_subtitles_whisper(
    "path/to/audio.wav",
    "ru"  // язык
).await?;

// Генерация с помощью облачных сервисов
let subtitles = generate_subtitles_cloud(
    audio_data,
    CloudProvider::OpenAI
).await?;
```

### ⏱️ Синхронизация
```rust
// Автоматическая синхронизация с аудио
let synced = sync_subtitles_with_audio(
    &subtitles,
    "path/to/audio.wav"
).await?;

// Ручная корректировка временных меток
let adjusted = adjust_subtitle_timing(
    &subtitles,
    offset_ms: 1500  // сдвиг на 1.5 секунды
)?;
```

### 📤 Экспорт
```rust
// Экспорт в SRT
let srt_content = export_to_srt(&subtitles)?;

// Экспорт в VTT
let vtt_content = export_to_vtt(&subtitles)?;

// Сохранение в файл
save_subtitles("output.srt", &subtitles).await?;
```

## Tauri команды

### load_subtitles
Загружает субтитры из файла.

```typescript
const subtitles = await invoke('load_subtitles', {
  filePath: '/path/to/subtitles.srt'
});
```

### generate_subtitles
Генерирует субтитры для аудио/видео файла.

```typescript
const subtitles = await invoke('generate_subtitles', {
  mediaPath: '/path/to/video.mp4',
  language: 'ru',
  provider: 'whisper'
});
```

### sync_subtitles
Синхронизирует субтитры с медиафайлом.

```typescript
const syncedSubtitles = await invoke('sync_subtitles', {
  subtitles: originalSubtitles,
  mediaPath: '/path/to/video.mp4'
});
```

### export_subtitles
Экспортирует субтитры в указанный формат.

```typescript
const content = await invoke('export_subtitles', {
  subtitles: subtitlesData,
  format: 'srt'  // или 'vtt'
});
```

## Структуры данных

### Subtitle
```rust
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Subtitle {
    pub index: u32,
    pub start_time: f64,    // в секундах
    pub end_time: f64,      // в секундах
    pub text: String,
    pub style: Option<SubtitleStyle>,
}
```

### SubtitleStyle
```rust
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SubtitleStyle {
    pub font_family: Option<String>,
    pub font_size: Option<u32>,
    pub color: Option<String>,
    pub background_color: Option<String>,
    pub bold: bool,
    pub italic: bool,
    pub underline: bool,
}
```

### SubtitleTrack
```rust
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SubtitleTrack {
    pub id: String,
    pub language: String,
    pub title: Option<String>,
    pub subtitles: Vec<Subtitle>,
    pub metadata: SubtitleMetadata,
}
```

## AI интеграция

### Whisper
Локальная генерация субтитров с помощью OpenAI Whisper:
- Высокая точность
- Поддержка множества языков
- Работает без интернета
- Требует GPU для быстрой работы

### Облачные сервисы
- **OpenAI API** - высокое качество
- **Google Speech-to-Text** - быстрая обработка
- **Azure Speech Services** - хорошая поддержка языков
- **Amazon Transcribe** - интеграция с AWS

## Конфигурация

### Настройки Whisper:
```toml
[subtitles.whisper]
model_size = "medium"  # tiny, base, small, medium, large
device = "cuda"        # cpu, cuda
language = "auto"      # автоопределение или код языка
```

### Настройки синхронизации:
```toml
[subtitles.sync]
max_offset_ms = 5000   # максимальный сдвиг
confidence_threshold = 0.8
auto_adjust = true
```

## Примеры использования

### Полный workflow обработки субтитров:

```rust
use crate::subtitles::*;

async fn process_video_subtitles(video_path: &str) -> Result<()> {
    // 1. Генерируем субтитры
    let subtitles = generate_subtitles_whisper(
        video_path,
        "ru"
    ).await?;
    
    // 2. Синхронизируем с аудио
    let synced = sync_subtitles_with_audio(
        &subtitles,
        video_path
    ).await?;
    
    // 3. Применяем стилизацию
    let styled = apply_subtitle_styles(
        &synced,
        &SubtitleStyle::default()
    )?;
    
    // 4. Экспортируем в разные форматы
    save_subtitles("output.srt", &styled).await?;
    save_subtitles("output.vtt", &styled).await?;
    
    Ok(())
}
```

## Тестирование

```bash
# Запуск тестов модуля
cargo test --package timeline-studio subtitles

# Тестирование с реальными файлами
cargo test --package timeline-studio subtitles::tests::real_file_tests
```

## Производительность

### Оптимизации:
- Streaming парсинг больших файлов
- Parallel обработка субтитров
- Кэширование результатов AI
- Memory-efficient хранение

### Benchmarks:
- Парсинг SRT: ~1000 субтитров/сек
- Whisper генерация: зависит от модели и GPU
- Синхронизация: <100ms для часового видео

## См. также

- [Main README](../../../README.md) - Общая документация
- [Media](../media/README.md) - Работа с медиафайлами
- [Recognition](../recognition/README.md) - AI распознавание
- [Video Compiler](../video_compiler/README.md) - Компиляция видео
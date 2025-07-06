# Интеграция с FFmpeg

## Обзор

FFmpeg является основным инструментом для обработки видео в Timeline Studio. Этот документ описывает интеграцию, построение команд и лучшие практики.

## Построение команд

### Паттерн Builder

Используйте паттерн builder для команд FFmpeg:

```rust
let command = FfmpegCommandBuilder::new()
    .input(video_path)
    .video_codec("libx264")
    .audio_codec("aac")
    .output(output_path)
    .build();
```

### Структура команды

```rust
pub struct FfmpegCommand {
    inputs: Vec<Input>,
    outputs: Vec<Output>,
    global_options: Vec<String>,
    filters: Option<FilterGraph>,
}
```

## Аппаратное ускорение

### Определение доступных кодировщиков

```rust
pub async fn detect_hardware_encoders() -> Vec<HardwareEncoder> {
    let mut encoders = vec![];
    
    // NVIDIA NVENC
    if check_encoder_available("h264_nvenc").await {
        encoders.push(HardwareEncoder::Nvenc);
    }
    
    // Intel Quick Sync
    if check_encoder_available("h264_qsv").await {
        encoders.push(HardwareEncoder::QuickSync);
    }
    
    // AMD AMF
    if check_encoder_available("h264_amf").await {
        encoders.push(HardwareEncoder::Amf);
    }
    
    // Apple VideoToolbox
    if check_encoder_available("h264_videotoolbox").await {
        encoders.push(HardwareEncoder::VideoToolbox);
    }
    
    encoders
}
```

### Стратегия выбора кодировщика

1. Предпочитать аппаратное кодирование когда доступно
2. Автоматический откат на программное кодирование
3. Настройки качества в зависимости от кодировщика

## Обработка видео

### Извлечение кадров

```rust
pub async fn extract_frame(
    video_path: &Path,
    timestamp: f64,
    output_format: ImageFormat,
) -> Result<Vec<u8>> {
    let mut cmd = Command::new("ffmpeg");
    
    cmd.args(&[
        "-ss", &timestamp.to_string(),
        "-i", video_path.to_str().unwrap(),
        "-frames:v", "1",
        "-f", "image2pipe",
        "-vcodec", output_format.to_codec(),
        "-",
    ]);
    
    let output = cmd.output().await?;
    
    if !output.status.success() {
        return Err(VideoCompilerError::FFmpegError {
            exit_code: output.status.code(),
            stderr: String::from_utf8_lossy(&output.stderr).to_string(),
            command: format!("{:?}", cmd),
        });
    }
    
    Ok(output.stdout)
}
```

### Генерация превью

```rust
pub async fn generate_preview(
    video_path: &Path,
    output_path: &Path,
    duration: f64,
    scale: Option<(u32, u32)>,
) -> Result<()> {
    let mut builder = FfmpegCommandBuilder::new()
        .input(video_path)
        .duration(duration);
    
    if let Some((width, height)) = scale {
        builder = builder.video_filter(&format!("scale={}:{}", width, height));
    }
    
    builder
        .video_codec("libx264")
        .preset("ultrafast")
        .output(output_path)
        .execute()
        .await
}
```

### Рендеринг проекта

```rust
pub async fn render_project(
    project: &ProjectSchema,
    output_path: &Path,
    progress_callback: impl Fn(f32),
) -> Result<()> {
    let pipeline = RenderPipeline::new(project);
    
    // Этап 1: Подготовка медиафайлов
    pipeline.prepare_media().await?;
    progress_callback(0.2);
    
    // Этап 2: Применение эффектов
    pipeline.apply_effects().await?;
    progress_callback(0.4);
    
    // Этап 3: Композитинг
    pipeline.composite_layers().await?;
    progress_callback(0.6);
    
    // Этап 4: Финальное кодирование
    pipeline.encode_output(output_path).await?;
    progress_callback(1.0);
    
    Ok(())
}
```

## Фильтры и эффекты

### Построение графа фильтров

```rust
pub struct FilterGraph {
    nodes: Vec<FilterNode>,
    connections: Vec<Connection>,
}

impl FilterGraph {
    pub fn to_string(&self) -> String {
        // Генерация строки фильтра для FFmpeg
        let mut parts = vec![];
        
        for node in &self.nodes {
            parts.push(node.to_string());
        }
        
        parts.join(",")
    }
}
```

### Примеры фильтров

```rust
// Изменение размера
filter_graph.add_filter("scale", &["640:480"]);

// Цветокоррекция
filter_graph.add_filter("eq", &["brightness=0.1:contrast=1.2"]);

// Наложение текста
filter_graph.add_filter("drawtext", &[
    "text='Timeline Studio'",
    "fontsize=24",
    "fontcolor=white",
    "x=(w-text_w)/2",
    "y=h-50"
]);

// Переходы
filter_graph.add_filter("xfade", &[
    "transition=fade",
    "duration=1",
    "offset=5"
]);
```

## Обработка ошибок

### Типы ошибок FFmpeg

```rust
pub enum FFmpegError {
    NotFound,
    InvalidInput(String),
    CodecNotSupported(String),
    OutOfMemory,
    InvalidParameters(String),
    Unknown(String),
}
```

### Парсинг вывода FFmpeg

```rust
pub fn parse_ffmpeg_error(stderr: &str) -> FFmpegError {
    if stderr.contains("No such file") {
        FFmpegError::InvalidInput("Файл не найден".to_string())
    } else if stderr.contains("Unknown encoder") {
        FFmpegError::CodecNotSupported("Кодек не поддерживается".to_string())
    } else if stderr.contains("out of memory") {
        FFmpegError::OutOfMemory
    } else {
        FFmpegError::Unknown(stderr.to_string())
    }
}
```

## Оптимизация производительности

### Многопоточность

```rust
// Использование всех доступных ядер
builder.add_option("-threads", "0");

// Или конкретное количество
let cpu_count = num_cpus::get();
builder.add_option("-threads", &cpu_count.to_string());
```

### Предустановки кодирования

```rust
pub enum EncodingPreset {
    UltraFast,  // Быстрый рендеринг, больший размер
    Fast,       // Баланс скорости и качества
    Medium,     // По умолчанию
    Slow,       // Лучшее качество, медленнее
    VerySlow,   // Максимальное качество
}

impl EncodingPreset {
    pub fn to_ffmpeg_preset(&self) -> &'static str {
        match self {
            Self::UltraFast => "ultrafast",
            Self::Fast => "fast",
            Self::Medium => "medium",
            Self::Slow => "slow",
            Self::VerySlow => "veryslow",
        }
    }
}
```

### Оптимизация для стриминга

```rust
// Для веб-стриминга
builder
    .add_option("-movflags", "+faststart")
    .add_option("-pix_fmt", "yuv420p")
    .video_codec("libx264")
    .add_option("-profile:v", "baseline")
    .add_option("-level", "3.0");
```

## Мониторинг прогресса

### Парсинг прогресса

```rust
pub fn parse_progress(line: &str) -> Option<Progress> {
    // frame=  123 fps=45.6 q=28.0 size=    1024kB time=00:00:05.12 bitrate=1638.4kbits/s
    
    let time_regex = Regex::new(r"time=(\d{2}):(\d{2}):(\d{2})\.(\d{2})").unwrap();
    
    if let Some(captures) = time_regex.captures(line) {
        let hours: f64 = captures[1].parse().unwrap_or(0.0);
        let minutes: f64 = captures[2].parse().unwrap_or(0.0);
        let seconds: f64 = captures[3].parse().unwrap_or(0.0);
        let centiseconds: f64 = captures[4].parse().unwrap_or(0.0);
        
        let current_time = hours * 3600.0 + minutes * 60.0 + seconds + centiseconds / 100.0;
        
        return Some(Progress {
            current_time,
            percent: current_time / total_duration,
        });
    }
    
    None
}
```

## Переменные окружения

- `FFMPEG_PATH=/custom/path` - Переопределить расположение FFmpeg
- `FFMPEG_THREADS=8` - Количество потоков
- `FFMPEG_LOGLEVEL=debug` - Уровень логирования

## Лучшие практики

1. **Валидация входных данных** - Проверяйте файлы перед обработкой
2. **Управление ресурсами** - Ограничивайте параллельные операции
3. **Временные файлы** - Используйте уникальные имена и очищайте после использования
4. **Логирование** - Логируйте команды FFmpeg для отладки
5. **Тестирование** - Мокируйте FFmpeg в модульных тестах
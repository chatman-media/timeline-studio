# Video Compiler Commands

Модульная система Tauri команд для Video Compiler - ядра системы рендеринга Timeline Studio.

## Обзор

Video Compiler Commands организованы в 27 специализированных модулей, каждый из которых отвечает за свою область функциональности. Все модули следуют консистентной архитектуре с разделением на команды, бизнес-логику, типы и тесты.

## Архитектура модулей

Каждый модуль следует единой структуре:

```
module_name/
├── commands.rs         # Tauri команды (тонкий слой)
├── business_logic.rs   # Бизнес-логика и валидация
├── types.rs            # Типы данных для команд
├── tests.rs            # Unit тесты
└── mod.rs              # Экспорты модуля
```

**Принципы:**
- **Thin Commands**: Команды минимальны, делегируют работу business_logic
- **Separation of Concerns**: Четкое разделение ответственности
- **Testability**: Бизнес-логика независима от Tauri
- **Type Safety**: Полная типизация через Rust + Specta

## Модули команд

### 🎬 Core Rendering / Основной рендеринг

#### `rendering/` - Команды рендеринга
Основные команды компиляции и рендеринга видео.

**Ключевые команды:**
```rust
compile_video(project_schema: ProjectSchema, output_path: String) -> Result<String>
cancel_render(job_id: String) -> Result<bool>
get_active_render_jobs() -> Result<Vec<String>>
get_render_job(job_id: String) -> Result<Option<RenderJob>>
```

**Frontend пример:**
```typescript
import { invoke } from "@tauri-apps/api/core"

// Запуск рендеринга
const jobId = await invoke("compile_video", {
  projectSchema: project,
  outputPath: "/path/to/output.mp4"
})

// Отслеживание прогресса
listen("video-compiler", (event) => {
  if (event.payload.type === "RenderProgress") {
    console.log(`Progress: ${event.payload.progress}%`)
  }
})

// Отмена рендеринга
await invoke("cancel_render", { jobId })
```

#### `pipeline/` - Конвейер рендеринга
Управление многостадийным конвейером обработки видео.

**Ключевые команды:**
```rust
create_and_execute_pipeline(project: ProjectSchema, output_path: String) -> Result<String>
get_pipeline_info(job_id: String) -> Result<PipelineInfo>
cancel_pipeline(job_id: String) -> Result<bool>
```

**Стадии конвейера:**
1. **Preparation** - Подготовка ресурсов
2. **Scene Processing** - Обработка сцен
3. **Effects Application** - Применение эффектов
4. **Audio Mixing** - Микширование аудио
5. **Final Encoding** - Финальное кодирование

#### `workflow/` - Workflow управление
Создание и выполнение сложных рабочих процессов.

**Функции:**
- Определение custom workflow
- Параллельное выполнение задач
- Управление зависимостями между задачами

### 👁️ Preview / Превью

#### `preview/` - Генерация превью
Быстрая генерация превью кадров и видео.

**Ключевые команды:**
```rust
generate_frame_preview(project_schema: ProjectSchema, timestamp: f64, output_path: String) -> Result<String>
generate_video_thumbnails(video_path: String, output_dir: String, count: u32, width: u32, height: u32) -> Result<Vec<String>>
generate_project_preview(project_schema: ProjectSchema, output_path: String, duration: f64, width: u32, height: u32) -> Result<String>
```

**Frontend пример:**
```typescript
// Генерация превью на таймлайне
const previewPath = await invoke("generate_frame_preview", {
  projectSchema: project,
  timestamp: 5.5, // 5.5 секунд
  outputPath: "/tmp/preview_5.5s.jpg"
})

// Миниатюры для скроллинга
const thumbnails = await invoke("generate_video_thumbnails", {
  videoPath: "/path/to/video.mp4",
  outputDir: "/tmp/thumbnails",
  count: 20,
  width: 160,
  height: 90
})
```

#### `preview_advanced/` - Продвинутые превью
Расширенные возможности генерации превью.

**Функции:**
- Превью с эффектами
- Превью определенных слоев
- Caching превью

### 💾 Cache & Optimization / Кэш и оптимизация

#### `cache/` - Управление кэшем
Система кэширования промежуточных результатов.

**Ключевые команды:**
```rust
get_cache_stats() -> Result<CacheStats>
clear_cache() -> Result<()>
get_cached_item(key: String) -> Result<Option<Vec<u8>>>
set_cached_item(key: String, data: Vec<u8>) -> Result<()>
```

**Типы кэша:**
- **Render Cache** - Промежуточные рендеры
- **Preview Cache** - Превью кадры
- **Effects Cache** - Обработанные эффекты
- **Metadata Cache** - Метаданные файлов

#### `prerender/` - Предрендеринг
Предварительный рендеринг сложных элементов.

**Функции:**
- Предрендеринг эффектов
- Предрендеринг переходов
- Caching предрендеров

### ⚙️ GPU & Hardware / GPU и аппаратное ускорение

#### `gpu/` - GPU ускорение
Управление GPU ускорением рендеринга.

**Ключевые команды:**
```rust
get_gpu_info() -> Result<GpuInfo>
enable_gpu_acceleration(enabled: bool) -> Result<()>
get_gpu_capabilities() -> Result<GpuCapabilities>
```

**Поддерживаемые технологии:**
- NVIDIA CUDA
- AMD ROCm
- Intel Quick Sync
- Apple Metal

#### `platform_optimization/` - Платформенная оптимизация
Оптимизации специфичные для платформы.

**Функции:**
- Автоопределение оптимальных настроек
- Платформенные кодеки
- Оптимизация под CPU/GPU

### 🎨 Media Processing / Обработка медиа

#### `frame_extraction/` - Извлечение кадров
Извлечение кадров из видео для обработки.

**Ключевые команды:**
```rust
extract_frames(video_path: String, timestamps: Vec<f64>, output_dir: String) -> Result<Vec<String>>
extract_frame_sequence(video_path: String, start: f64, end: f64, fps: u32) -> Result<Vec<String>>
```

#### `video_analysis/` - Анализ видео
Анализ видео контента для оптимизации рендеринга.

**Функции:**
- Детекция сцен
- Анализ движения
- Определение сложности кадров

#### `schema/` - Работа с схемой проекта
Создание и модификация элементов ProjectSchema.

**Функции:**
- Создание клипов, эффектов, фильтров
- Валидация схемы
- Конвертация между версиями схемы

### 🤖 AI Integration / Интеграция AI

#### `ai_api_proxy/` - AI API прокси
Проксирование запросов к AI сервисам (Claude, OpenAI, и др.).

**Ключевые команды:**
```rust
proxy_ai_request(provider: String, request: AiRequest) -> Result<AiResponse>
stream_ai_response(provider: String, request: AiRequest) -> Result<StreamHandle>
get_ai_cache(key: String) -> Result<Option<AiResponse>>
```

**Поддерживаемые провайдеры:**
- Anthropic Claude
- OpenAI GPT
- Google Gemini
- Local LLMs (Ollama)

**Функции:**
- Кэширование AI ответов
- Streaming ответов в реальном времени
- Rate limiting
- Error recovery

#### `multimodal_commands/` - Мультимодальные команды
Работа с мультимодальными AI моделями.

**Функции:**
- Анализ изображений через AI
- Генерация описаний видео
- Автоматическое тегирование

#### `whisper_commands/` - Whisper транскрипция
Автоматическая транскрипция аудио.

**Ключевые команды:**
```rust
transcribe_audio(audio_path: String) -> Result<Transcription>
transcribe_with_timestamps(audio_path: String) -> Result<Vec<TimestampedSegment>>
```

#### `ollama_proxy/` - Ollama интеграция
Работа с локальными LLM через Ollama.

### 🔧 System & Configuration / Система и конфигурация

#### `info/` - Системная информация
Получение информации о системе и ресурсах.

**Ключевые команды:**
```rust
get_system_info() -> Result<SystemInfo>
get_ffmpeg_version() -> Result<String>
get_available_codecs() -> Result<Vec<CodecInfo>>
get_resource_usage() -> Result<ResourceUsage>
```

#### `compiler_settings_commands/` - Настройки компилятора
Управление настройками Video Compiler.

**Настройки:**
- Кодек и качество
- Битрейт аудио/видео
- Разрешение и FPS
- GPU ускорение
- Многопоточность

#### `monitoring/` - Мониторинг
Мониторинг производительности и ресурсов.

**Метрики:**
- CPU/GPU usage
- Memory usage
- Disk I/O
- Render speed

#### `metrics/` - Метрики рендеринга
Сбор детальной статистики рендеринга.

**Функции:**
- Время рендеринга по стадиям
- Использование кэша
- Статистика ошибок

### 🛠️ Utilities / Утилиты

#### `batch/` - Batch обработка
Пакетная обработка множества проектов.

**Ключевые команды:**
```rust
batch_compile(projects: Vec<ProjectSchema>, output_dir: String) -> Result<Vec<String>>
get_batch_progress(batch_id: String) -> Result<BatchProgress>
```

#### `ffmpeg_advanced/` - Продвинутый FFmpeg
Низкоуровневая работа с FFmpeg.

**Функции:**
- Custom FFmpeg команды
- Прямой доступ к FFmpeg параметрам
- Сложные фильтры

#### `ffmpeg_builder/` - FFmpeg builder
Построитель FFmpeg команд.

**Функции:**
- Fluent API для создания команд
- Валидация параметров
- Оптимизация команд

#### `project/` - Управление проектами
Загрузка, сохранение, валидация проектов.

#### `service/` - Сервисы
Управление внутренними сервисами Video Compiler.

#### `service_container/` - Service Container
DI контейнер для управления сервисами.

#### `recognition_advanced_commands/` - Расширенное распознавание
Интеграция с системой распознавания объектов.

#### `misc/` - Разное
Вспомогательные команды общего назначения.

## State Management / Управление состоянием

### VideoCompilerState

Центральное состояние Video Compiler:

```rust
pub struct VideoCompilerState {
    pub settings: Arc<RwLock<CompilerSettings>>,
    pub ffmpeg_path: Arc<RwLock<String>>,
    pub active_jobs: Arc<RwLock<HashMap<String, RenderJob>>>,
    pub active_pipelines: Arc<RwLock<HashMap<String, Arc<RwLock<RenderPipeline>>>>>,
    pub cache_manager: Arc<RwLock<RenderCache>>,
    pub services: ServiceContainer,
}
```

**Основные сервисы:**
- `RenderService` - Управление рендерингом
- `PreviewService` - Генерация превью
- `CacheService` - Управление кэшем
- `MetricsService` - Сбор метрик
- `GpuService` - GPU ускорение

## Event System / Система событий

Video Compiler использует Tauri event system для коммуникации с фронтендом:

```rust
pub enum VideoCompilerEvent {
    RenderStarted { job_id: String },
    RenderProgress { job_id: String, progress: f32, message: String },
    RenderCompleted { job_id: String, output_path: String },
    RenderFailed { job_id: String, error: String },
    CacheUpdated { stats: CacheStats },
    GpuStatusChanged { available: bool },
}
```

**Frontend подписка:**
```typescript
import { listen } from "@tauri-apps/api/event"

listen("video-compiler", (event) => {
  const payload = event.payload as VideoCompilerEvent

  switch (payload.type) {
    case "RenderProgress":
      updateProgressBar(payload.progress)
      break
    case "RenderCompleted":
      showNotification("Render completed!")
      break
    case "RenderFailed":
      showError(payload.error)
      break
  }
})
```

## Error Handling / Обработка ошибок

Все команды возвращают `Result<T, VideoCompilerError>`:

```rust
pub enum VideoCompilerError {
    Validation(String),
    Rendering(String),
    Io(String),
    FFmpeg(String),
    Gpu(String),
    Cache(String),
    Service(String),
}
```

**Frontend обработка:**
```typescript
try {
  const jobId = await invoke("compile_video", { projectSchema, outputPath })
} catch (error) {
  if (error.includes("Validation")) {
    // Валидационная ошибка
  } else if (error.includes("FFmpeg")) {
    // Ошибка FFmpeg
  } else {
    // Общая ошибка
  }
}
```

## Performance / Производительность

### Кэширование

Video Compiler агрессивно кэширует:
- Промежуточные рендеры
- Превью кадры
- Обработанные эффекты
- Метаданные медиа

**Очистка кэша:**
```typescript
// Получение статистики кэша
const stats = await invoke("get_cache_stats")
console.log(`Cache size: ${stats.totalSize / 1024 / 1024} MB`)

// Очистка кэша
if (stats.totalSize > 1024 * 1024 * 1024) { // > 1GB
  await invoke("clear_cache")
}
```

### GPU Ускорение

Автоматическое использование GPU когда доступно:

```typescript
// Проверка GPU
const gpuInfo = await invoke("get_gpu_info")
if (gpuInfo.available) {
  console.log(`GPU: ${gpuInfo.name}`)
  await invoke("enable_gpu_acceleration", { enabled: true })
}
```

### Многопоточность

Video Compiler использует все доступные ядра:

```typescript
const systemInfo = await invoke("get_system_info")
console.log(`CPU cores: ${systemInfo.cpuCores}`)

// Автоматически используется оптимальное количество потоков
```

## Testing / Тестирование

### Unit Tests

Каждый модуль имеет тесты:

```bash
# Все тесты video_compiler
cd src-tauri
cargo test video_compiler::commands::

# Тесты конкретного модуля
cargo test video_compiler::commands::rendering::tests
cargo test video_compiler::commands::pipeline::tests
```

### Integration Tests

E2E тесты через Playwright:

**Расположение:** `e2e/tauri/video-compiler.spec.ts`

```typescript
test("video compilation workflow", async () => {
  // Загрузка проекта
  const project = await loadTestProject()

  // Запуск рендеринга
  const jobId = await invoke("compile_video", {
    projectSchema: project,
    outputPath: "/tmp/test-output.mp4"
  })

  // Ожидание завершения
  await waitForRenderCompletion(jobId)

  // Проверка результата
  const exists = await invoke("file_exists", {
    path: "/tmp/test-output.mp4"
  })
  expect(exists).toBe(true)
})
```

## Best Practices / Лучшие практики

### 1. Всегда проверяйте GPU перед использованием

```typescript
const gpuInfo = await invoke("get_gpu_info")
if (gpuInfo.available && gpuInfo.capabilities.h264Encoding) {
  // Используем GPU кодирование
} else {
  // Fallback на CPU
}
```

### 2. Используйте кэш для превью

```typescript
// Проверка наличия в кэше
const cacheKey = `preview_${projectId}_${timestamp}`
const cached = await invoke("get_cached_item", { key: cacheKey })

if (!cached) {
  // Генерация превью
  const preview = await invoke("generate_frame_preview", { ... })

  // Сохранение в кэш
  await invoke("set_cached_item", { key: cacheKey, data: preview })
}
```

### 3. Обрабатывайте отмену рендеринга

```typescript
let currentJobId: string | null = null

async function startRender() {
  currentJobId = await invoke("compile_video", { ... })
}

function cancelRender() {
  if (currentJobId) {
    invoke("cancel_render", { jobId: currentJobId })
    currentJobId = null
  }
}

// Cleanup on unmount
onUnmount(() => {
  cancelRender()
})
```

### 4. Мониторьте ресурсы

```typescript
// Периодический мониторинг
setInterval(async () => {
  const usage = await invoke("get_resource_usage")

  if (usage.memoryPercent > 90) {
    console.warn("High memory usage, clearing cache")
    await invoke("clear_cache")
  }
}, 5000)
```

### 5. Используйте batch для множественных проектов

```typescript
// Вместо:
for (const project of projects) {
  await invoke("compile_video", { projectSchema: project, ... })
}

// Используйте:
await invoke("batch_compile", {
  projects: projects,
  outputDir: "/output"
})
```

## Related Modules / Связанные модули

- **Frontend:**
  - `src/features/video-compiler/` - Video Compiler UI
  - `src/features/timeline/` - Timeline editor

- **Backend:**
  - `src-tauri/src/video_compiler/core/` - Ядро компилятора
  - `src-tauri/src/video_compiler/schema.rs` - ProjectSchema
  - `src-tauri/src/video_compiler/progress.rs` - Progress tracking

## Changelog / История изменений

### v3.16.0 (2024-11-26)
- ✅ Создана comprehensive документация
- ✅ Описаны все 27 модулей команд
- ✅ Добавлены примеры использования
- ✅ Best practices и performance советы

### v3.15.0 (2024-11-24)
- ✅ Добавлены AI integration команды
- ✅ Whisper транскрипция
- ✅ Ollama proxy

### v3.0.0 (2024-11-18)
- ✅ Модульная архитектура команд
- ✅ Service Container для DI
- ✅ GPU ускорение
- ✅ Advanced pipeline system

## License / Лицензия

Часть Timeline Studio. См. корневую лицензию проекта.

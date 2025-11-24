# Backend архитектура

[← Назад к разделу](README.md) | [← К оглавлению](../README.md)

## 📋 Содержание

- [Обзор технологий](#обзор-технологий)
- [Модульная структура](#модульная-структура)
- [Tauri интеграция](#tauri-интеграция)
- [FFmpeg обработка](#ffmpeg-обработка)
- [ML/AI возможности](#mlai-возможности)
- [Управление данными](#управление-данными)
- [Производительность](#производительность)

## 🦀 Обзор технологий

### Основной стек
- **Rust** - системный язык программирования
- **Tauri v2** - фреймворк для desktop приложений
- **Tokio** - асинхронный runtime
- **FFmpeg** - обработка видео/аудио

### Ключевые библиотеки
```toml
[dependencies]
tauri = "2.0"
tokio = { version = "1", features = ["full"] }
serde = { version = "1", features = ["derive"] }
ffmpeg-next = "7.0"
ort = "2.0"  # ONNX Runtime
sqlx = { version = "0.7", features = ["sqlite"] }
rayon = "1.8"  # Параллельные вычисления
```

## 📦 Модульная структура

```
src-tauri/src/
├── main.rs              # Точка входа
├── lib.rs              # Корневой модуль с регистрацией команд
│
├── core/               # 🆕 Core инфраструктура
│   ├── mod.rs         # Основной модуль
│   ├── di.rs          # Dependency Injection контейнер
│   ├── events.rs      # Event system
│   ├── test_utils.rs  # Тестовая инфраструктура
│   │
│   ├── plugins/       # Plugin система
│   │   ├── mod.rs
│   │   ├── plugin.rs      # Базовые структуры плагинов
│   │   ├── manager.rs     # Менеджер жизненного цикла
│   │   ├── permissions.rs # Система разрешений
│   │   ├── sandbox.rs     # WASM sandbox
│   │   ├── loader.rs      # Загрузчик WASM
│   │   ├── api.rs        # Plugin API
│   │   └── context.rs    # Контекст выполнения
│   │
│   ├── telemetry/     # Telemetry система
│   │   ├── mod.rs
│   │   ├── metrics.rs     # OpenTelemetry метрики
│   │   ├── health.rs      # Health checks
│   │   ├── tracer.rs      # Distributed tracing
│   │   ├── middleware.rs  # HTTP middleware
│   │   └── config.rs      # Конфигурация
│   │
│   └── performance/   # Performance оптимизация
│       ├── mod.rs
│       ├── runtime.rs     # Worker pools
│       ├── cache.rs       # Кэширование
│       ├── memory.rs      # Memory pools
│       └── zerocopy.rs    # Zero-copy операции
│
├── app_dirs/           # Управление директориями приложения
│   ├── mod.rs
│   └── commands.rs    # Команды для работы с директориями
│
├── filesystem/         # Файловая система
│   └── mod.rs         # Команды работы с файлами
│
├── language_tauri/     # Мультиязычность
│   └── mod.rs         # Управление языками приложения
│
├── media/             # Медиа обработка
│   ├── mod.rs
│   ├── commands.rs    # Медиа команды
│   ├── types.rs       # Типы данных
│   ├── processor.rs   # Обработка медиафайлов
│   ├── scanner.rs     # Сканирование директорий
│   ├── metadata.rs    # Извлечение метаданных
│   ├── thumbnail.rs   # Генерация превью
│   ├── preview_data.rs # Данные превью
│   └── preview_manager.rs # Менеджер превью
│
├── recognition/       # ML распознавание
│   ├── mod.rs
│   ├── commands.rs    # Команды распознавания
│   ├── yolo.rs        # YOLO интеграция
│   ├── recognizer.rs  # Процесс распознавания
│   └── models/        # ONNX модели
│
└── video_compiler/    # Видео компиляция
    ├── mod.rs
    ├── commands/      # Модульные команды
    │   ├── mod.rs     # Экспорт всех команд
    │   ├── rendering.rs    # Рендеринг видео
    │   ├── cache.rs        # Управление кэшем
    │   ├── gpu.rs          # GPU операции
    │   ├── project.rs      # Управление проектами
    │   ├── preview.rs      # Генерация превью
    │   ├── settings.rs     # Настройки компилятора
    │   ├── info.rs         # Системная информация
    │   ├── metrics.rs      # Метрики производительности
    │   ├── ffmpeg_advanced.rs # Продвинутые FFmpeg команды
    │   └── state.rs        # Управление состоянием
    │
    ├── core/          # Основные компоненты
    │   ├── mod.rs
    │   ├── cache.rs        # Система кэширования
    │   ├── error.rs        # Обработка ошибок
    │   ├── gpu.rs          # GPU ускорение
    │   ├── pipeline.rs     # Пайплайн рендеринга
    │   ├── preview.rs      # Генератор превью
    │   ├── progress.rs     # Отслеживание прогресса
    │   └── renderer.rs     # Основной рендерер
    │
    ├── ffmpeg_builder/     # Построитель FFmpeg команд
    │   ├── mod.rs
    │   ├── builder.rs      # Основной построитель
    │   ├── effects.rs      # Применение эффектов
    │   ├── filters.rs      # Видео фильтры
    │   ├── inputs.rs       # Обработка входов
    │   ├── outputs.rs      # Настройка выходов
    │   ├── subtitles.rs    # Работа с субтитрами
    │   └── templates.rs    # Шаблоны мультикамеры
    │
    ├── ffmpeg_executor.rs  # Исполнитель FFmpeg команд
    ├── schema/         # Схемы данных
    │   ├── mod.rs
    │   ├── project.rs      # Схема проекта
    │   ├── timeline.rs     # Схема таймлайна
    │   ├── effects.rs      # Схема эффектов
    │   └── export.rs       # Схема экспорта
    │
    ├── services/       # Сервисы
    │   ├── mod.rs
    │   ├── cache_service.rs    # Сервис кэширования
    │   ├── ffmpeg_service.rs   # FFmpeg сервис
    │   ├── gpu_service.rs      # GPU сервис
    │   ├── preview_service.rs  # Сервис превью
    │   ├── project_service.rs  # Сервис проектов
    │   ├── render_service.rs   # Сервис рендеринга и экспорта
    │   └── monitoring.rs       # Мониторинг и метрики
    │
    └── tests/         # Тесты
        ├── mod.rs
        ├── fixtures.rs     # Тестовые данные
        ├── mocks.rs        # Моки для тестов
        └── integration.rs  # Интеграционные тесты
```

## 🎯 Core инфраструктура

### Dependency Injection

```rust
// core/di.rs
use std::any::{Any, TypeId};
use std::sync::Arc;
use tokio::sync::RwLock;

pub struct ServiceContainer {
    services: Arc<RwLock<HashMap<TypeId, ServiceEntry>>>,
}

impl ServiceContainer {
    pub async fn register<T>(&self, service: T) -> Result<()>
    where
        T: Service + Any + Send + Sync + 'static,
    {
        let entry = ServiceEntry {
            service: Arc::new(service),
            metadata: ServiceMetadata {
                name: T::NAME,
                initialized: false,
            },
        };
        
        self.services.write().await
            .insert(TypeId::of::<T>(), entry);
        Ok(())
    }
    
    pub async fn resolve<T>(&self) -> Result<Arc<T>>
    where
        T: Service + Any + Send + Sync + 'static,
    {
        self.services.read().await
            .get(&TypeId::of::<T>())
            .and_then(|entry| entry.service.clone().downcast::<T>().ok())
            .ok_or_else(|| VideoCompilerError::ServiceNotFound(
                std::any::type_name::<T>().to_string()
            ))
    }
}
```

### Event System

```rust
// core/events.rs
pub struct EventBus {
    subscribers: Arc<RwLock<HashMap<TypeId, Vec<EventSubscription>>>>,
}

impl EventBus {
    pub async fn subscribe<E>(&self, handler: impl EventHandler<E>) 
    where
        E: Event + 'static,
    {
        let subscription = EventSubscription {
            handler: Box::new(handler),
            priority: Priority::Normal,
        };
        
        self.subscribers.write().await
            .entry(TypeId::of::<E>())
            .or_default()
            .push(subscription);
    }
    
    pub async fn publish<E>(&self, event: E) -> Result<()>
    where
        E: Event + Clone + 'static,
    {
        if let Some(subscriptions) = self.subscribers.read().await.get(&TypeId::of::<E>()) {
            for subscription in subscriptions {
                subscription.handler.handle(event.clone()).await?;
            }
        }
        Ok(())
    }
}
```

### Plugin System

```rust
// core/plugins/manager.rs
pub struct PluginManager {
    plugins: HashMap<PluginId, Plugin>,
    sandbox: WasmSandbox,
    permissions: PermissionManager,
}

impl PluginManager {
    pub async fn load_plugin(&mut self, path: &str) -> Result<PluginId> {
        // Загрузка WASM модуля
        let wasm_module = self.sandbox.load_module(path).await?;
        
        // Получение метаданных плагина
        let metadata = wasm_module.get_metadata()?;
        
        // Проверка разрешений
        self.permissions.validate(&metadata.required_permissions)?;
        
        // Создание плагина
        let plugin = Plugin {
            id: PluginId::new(&metadata.name),
            metadata,
            wasm_module: Some(wasm_module),
            state: PluginState::Loaded,
        };
        
        let id = plugin.id.clone();
        self.plugins.insert(id.clone(), plugin);
        
        Ok(id)
    }
    
    pub async fn execute_command(
        &self,
        plugin_id: &PluginId,
        command: &str,
        args: serde_json::Value,
    ) -> Result<serde_json::Value> {
        let plugin = self.plugins.get(plugin_id)
            .ok_or(PluginError::NotFound)?;
        
        // Проверка состояния плагина
        if plugin.state != PluginState::Running {
            return Err(PluginError::NotRunning);
        }
        
        // Выполнение в sandbox
        self.sandbox.execute_command(
            &plugin.wasm_module,
            command,
            args,
            &plugin.metadata.permissions,
        ).await
    }
}
```

### Telemetry System

```rust
// core/telemetry/metrics.rs
pub struct Metrics {
    meter: Meter,
    counters: Arc<RwLock<HashMap<String, Counter<u64>>>>,
    gauges: Arc<RwLock<HashMap<String, ObservableGauge<f64>>>>,
    histograms: Arc<RwLock<HashMap<String, Histogram<f64>>>>,
}

impl Metrics {
    pub async fn increment_counter(&self, name: &str, value: u64) -> Result<()> {
        let counter = self.get_or_create_counter(name).await?;
        counter.add(value, &[]);
        Ok(())
    }
    
    pub async fn record_histogram(&self, name: &str, value: f64) -> Result<()> {
        let histogram = self.get_or_create_histogram(name).await?;
        histogram.record(value, &[]);
        Ok(())
    }
    
    pub async fn collect_system_metrics(&self) -> Result<()> {
        let cpu_usage = get_cpu_usage();
        let memory_usage = get_memory_usage();
        
        self.set_gauge("system_cpu_usage_percent", cpu_usage).await?;
        self.set_gauge("system_memory_usage_bytes", memory_usage as f64).await?;
        
        Ok(())
    }
}
```

### Performance Optimization

```rust
// core/performance/runtime.rs
pub struct WorkerPool {
    pool_id: String,
    executor: Arc<ThreadPoolExecutor>,
    config: TaskPoolConfig,
    metrics: Arc<PoolMetrics>,
}

impl WorkerPool {
    pub async fn execute<F, T>(&self, task: F) -> Result<T>
    where
        F: Future<Output = T> + Send + 'static,
        T: Send + 'static,
    {
        // Проверка загрузки пула
        if self.is_overloaded() {
            self.metrics.rejected_tasks.fetch_add(1, Ordering::Relaxed);
            return Err(PerformanceError::PoolOverloaded);
        }
        
        // Выполнение задачи
        let start = Instant::now();
        let result = self.executor.spawn(task).await?;
        
        // Обновление метрик
        let duration = start.elapsed();
        self.metrics.tasks_executed.fetch_add(1, Ordering::Relaxed);
        self.metrics.total_execution_time.fetch_add(
            duration.as_millis() as u64,
            Ordering::Relaxed
        );
        
        Ok(result)
    }
}
```

📖 **[Подробная документация Core модулей](../../src-tauri/src/core/README.md)**

## 🔧 Tauri интеграция

### Команды (Commands)

```rust
// video_compiler/commands/rendering.rs
#[tauri::command]
pub async fn compile_video(
    project_id: String,
    output_path: String,
    state: tauri::State<'_, VideoCompilerState>,
) -> Result<String, String> {
    let render_service = state.services.render_service();
    
    // Создание задачи рендеринга
    let job_id = render_service
        .start_render(project_id, output_path)
        .await
        .map_err(|e| e.to_string())?;
    
    Ok(job_id)
}

// video_compiler/commands/cache.rs
#[tauri::command]
pub async fn get_cache_stats_detailed(
    state: tauri::State<'_, VideoCompilerState>,
) -> Result<serde_json::Value, String> {
    let cache = state.cache_manager.read().await;
    let stats = cache.get_stats();
    let memory_usage = cache.get_memory_usage();
    
    Ok(serde_json::json!({
        "preview_hit_ratio": stats.preview_hit_ratio(),
        "memory_usage_mb": memory_usage.total_mb(),
        "preview_hits": stats.preview_hits,
        "preview_misses": stats.preview_misses,
        "render_hits": stats.render_hits,
        "render_misses": stats.render_misses,
        "total_memory_bytes": memory_usage.total_bytes,
    }))
}

// video_compiler/commands/ffmpeg_advanced.rs
#[tauri::command]
pub async fn execute_ffmpeg_with_progress(
    command_args: Vec<String>,
    app_handle: tauri::AppHandle,
) -> Result<String, String> {
    let (tx, mut rx) = mpsc::channel(100);
    let executor = FFmpegExecutor::with_progress(tx);
    
    let mut cmd = tokio::process::Command::new("ffmpeg");
    cmd.args(&command_args);
    
    // Запуск с отслеживанием прогресса
    let handle = tokio::spawn(async move { 
        executor.execute(cmd).await 
    });
    
    // Отправка событий прогресса во фронтенд
    tokio::spawn(async move {
        while let Some(update) = rx.recv().await {
            let _ = app_handle.emit("ffmpeg-progress", update);
        }
    });
    
    let result = handle.await
        .map_err(|e| format!("Ошибка выполнения: {}", e))?;
    
    result.map(|r| r.stdout)
        .map_err(|e| e.to_string())
}
```

### События (Events)

```rust
// Отправка событий прогресса
pub fn emit_progress(window: &Window, progress: f32, message: &str) {
    window.emit("export-progress", ExportProgress {
        progress,
        message: message.to_string(),
        timestamp: SystemTime::now(),
    }).unwrap();
}

// Использование в экспорте
async fn export_video_internal(
    window: Window,
    settings: ExportSettings,
) -> Result<String> {
    let encoder = VideoEncoder::new(settings);
    
    // Подписка на прогресс
    encoder.on_progress(move |progress| {
        emit_progress(&window, progress, "Encoding video...");
    });
    
    let output_path = encoder.encode().await?;
    Ok(output_path)
}
```

## 🎥 FFmpeg обработка

### Архитектура Video Compiler

```rust
// video_compiler/ffmpeg_builder/builder.rs
pub struct FFmpegBuilder {
    project: ProjectSchema,
    settings: FFmpegBuilderSettings,
}

impl FFmpegBuilder {
    pub fn new(project: ProjectSchema) -> Self {
        Self {
            project,
            settings: FFmpegBuilderSettings::default(),
        }
    }
    
    pub async fn build_render_command(
        &self,
        output_path: &Path,
    ) -> Result<Command> {
        let mut cmd = Command::new(&self.settings.ffmpeg_path);
        
        // Глобальные опции
        cmd.args(&self.settings.global_options);
        
        // Входные файлы
        self.prepare_inputs(&mut cmd).await?;
        
        // Фильтры и эффекты
        let filter_complex = self.build_filter_complex().await?;
        if !filter_complex.is_empty() {
            cmd.args(&["-filter_complex", &filter_complex]);
        }
        
        // Настройки вывода
        self.apply_output_settings(&mut cmd, output_path)?;
        
        Ok(cmd)
    }
}

// video_compiler/ffmpeg_executor.rs
pub struct FFmpegExecutor {
    progress_sender: Option<mpsc::Sender<ProgressUpdate>>,
}

impl FFmpegExecutor {
    pub async fn execute(&self, mut command: Command) -> Result<FFmpegExecutionResult> {
        command.stdout(Stdio::piped())
               .stderr(Stdio::piped());
        
        let mut child = command.spawn()?;
        let stderr = child.stderr.take().unwrap();
        
        // Обработка прогресса через stderr
        if let Some(sender) = &self.progress_sender {
            self.process_progress_stream(stderr, sender.clone()).await;
        }
        
        let output = child.wait_with_output().await?;
        
        Ok(FFmpegExecutionResult {
            exit_code: output.status.code().unwrap_or(-1),
            stdout: String::from_utf8_lossy(&output.stdout).to_string(),
            stderr: String::from_utf8_lossy(&output.stderr).to_string(),
            final_progress: self.extract_final_progress(&output.stderr),
        })
    }
}
```

### Применение эффектов и фильтров

```rust
// video_compiler/ffmpeg_builder/effects.rs
impl FFmpegBuilder {
    pub fn build_effect_filter(&self, effect: &Effect) -> Result<String> {
        match &effect.effect_type {
            EffectType::Brightness => {
                Ok(format!("eq=brightness={}", 
                    effect.parameters.get("value").unwrap_or(&0.0)))
            }
            EffectType::Contrast => {
                Ok(format!("eq=contrast={}", 
                    effect.parameters.get("value").unwrap_or(&1.0)))
            }
            EffectType::Blur => {
                let radius = effect.parameters.get("radius").unwrap_or(&5.0);
                Ok(format!("boxblur=luma_radius={}:chroma_radius={}", 
                    radius, radius))
            }
            EffectType::ChromaKey => {
                let color = effect.parameters.get("color")
                    .map(|v| v.to_string())
                    .unwrap_or_else(|| "0x00FF00".to_string());
                let similarity = effect.parameters.get("similarity")
                    .unwrap_or(&0.3);
                Ok(format!("chromakey={}:{}:0.01", color, similarity))
            }
            _ => Err(VideoCompilerError::UnsupportedEffect(
                format!("{:?}", effect.effect_type)
            ))
        }
    }
}

// video_compiler/ffmpeg_builder/filters.rs
impl FFmpegBuilder {
    pub fn build_filter_complex(&self) -> Result<String> {
        let mut filter_chains = Vec::new();
        
        // Применение эффектов к клипам
        for (track_idx, track) in self.project.timeline.tracks.iter().enumerate() {
            for (clip_idx, clip) in track.clips.iter().enumerate() {
                let input_label = format!("[{}:v]", 
                    self.get_clip_input_index(clip)?);
                
                // Цепочка фильтров для клипа
                let mut filters = Vec::new();
                
                // Масштабирование и позиционирование
                if let Some(transform) = &clip.transform {
                    filters.push(self.build_transform_filter(transform)?);
                }
                
                // Эффекты клипа
                for effect_id in &clip.effects {
                    if let Some(effect) = self.find_effect(effect_id) {
                        filters.push(self.build_effect_filter(effect)?);
                    }
                }
                
                if !filters.is_empty() {
                    let output_label = format!("[t{}c{}]", track_idx, clip_idx);
                    filter_chains.push(format!("{}{}{}", 
                        input_label,
                        filters.join(","),
                        output_label
                    ));
                }
            }
        }
        
        Ok(filter_chains.join(";"))
    }
}
```

## 🤖 ML/AI возможности

### YOLO интеграция

```rust
// recognition/yolo.rs
use ort::{Environment, Session, Value};

pub struct YoloDetector {
    session: Session,
    input_size: (u32, u32),
}

impl YoloDetector {
    pub fn new(model_path: &str) -> Result<Self> {
        let environment = Environment::builder()
            .with_name("yolo")
            .build()?;
            
        let session = Session::builder(&environment)?
            .with_model_from_file(model_path)?;
            
        Ok(Self {
            session,
            input_size: (640, 640),
        })
    }
    
    pub async fn detect(&self, frame: &VideoFrame) -> Result<Vec<Detection>> {
        // Предобработка кадра
        let input = self.preprocess_frame(frame)?;
        
        // Запуск инференса
        let outputs = self.session.run(vec![input])?;
        
        // Постобработка результатов
        let detections = self.postprocess_outputs(outputs)?;
        
        Ok(detections)
    }
    
    fn preprocess_frame(&self, frame: &VideoFrame) -> Result<Value> {
        // Изменение размера до 640x640
        let resized = frame.resize(self.input_size.0, self.input_size.1)?;
        
        // Нормализация значений
        let normalized = resized.normalize(0.0, 1.0);
        
        // Конвертация в тензор
        Ok(Value::from_array(normalized)?)
    }
}
```

### Трекинг объектов

```rust
// recognition/tracker.rs
pub struct ObjectTracker {
    tracks: HashMap<u32, Track>,
    next_id: u32,
}

impl ObjectTracker {
    pub fn update(&mut self, detections: Vec<Detection>) -> Vec<TrackedObject> {
        let mut tracked = Vec::new();
        
        // Сопоставление с существующими треками
        for detection in detections {
            if let Some(track_id) = self.match_detection(&detection) {
                self.tracks.get_mut(&track_id).unwrap().update(detection);
                tracked.push(TrackedObject {
                    id: track_id,
                    detection,
                    history: self.tracks[&track_id].history.clone(),
                });
            } else {
                // Создание нового трека
                let id = self.next_id;
                self.next_id += 1;
                
                self.tracks.insert(id, Track::new(detection.clone()));
                tracked.push(TrackedObject {
                    id,
                    detection,
                    history: vec![],
                });
            }
        }
        
        tracked
    }
}
```

## 💾 Управление данными

### Система кэширования

```rust
// video_compiler/core/cache.rs
pub struct RenderCache {
    metadata_cache: Arc<RwLock<HashMap<String, MediaMetadata>>>,
    preview_cache: Arc<RwLock<HashMap<PreviewKey, Vec<u8>>>>,
    render_cache: Arc<RwLock<HashMap<String, PathBuf>>>,
    settings: CacheSettings,
    stats: Arc<RwLock<CacheStats>>,
}

impl RenderCache {
    pub async fn get_or_generate_preview(
        &self,
        key: PreviewKey,
        generator: impl Future<Output = Result<Vec<u8>>>,
    ) -> Result<Vec<u8>> {
        // Проверка кэша
        if let Some(data) = self.preview_cache.read().await.get(&key) {
            self.stats.write().await.preview_hits += 1;
            return Ok(data.clone());
        }
        
        self.stats.write().await.preview_misses += 1;
        
        // Генерация превью
        let data = generator.await?;
        
        // Сохранение в кэш
        self.store_preview(key, data.clone()).await?;
        
        Ok(data)
    }
    
    pub fn get_memory_usage(&self) -> MemoryUsage {
        let metadata_size = self.metadata_cache.read().unwrap()
            .values()
            .map(|m| std::mem::size_of_val(m))
            .sum::<usize>();
        
        let preview_size = self.preview_cache.read().unwrap()
            .values()
            .map(|v| v.len())
            .sum::<usize>();
        
        MemoryUsage {
            metadata_bytes: metadata_size,
            preview_bytes: preview_size,
            render_bytes: 0,
            total_bytes: metadata_size + preview_size,
        }
    }
}

// video_compiler/services/cache_service.rs
pub struct CacheService {
    cache: Arc<RwLock<RenderCache>>,
    metrics: Arc<ServiceMetrics>,
}

impl Service for CacheService {
    async fn start(&self) -> Result<()> {
        // Загрузка сохраненного кэша
        if let Ok(cached_data) = self.load_from_disk().await {
            let mut cache = self.cache.write().await;
            cache.restore_from(cached_data);
        }
        
        // Запуск фонового процесса очистки
        self.spawn_cleanup_task();
        
        Ok(())
    }
    
    async fn health_check(&self) -> ServiceHealth {
        let cache = self.cache.read().await;
        let usage = cache.get_memory_usage();
        
        ServiceHealth {
            status: if usage.total_mb() < 1000.0 {
                HealthStatus::Healthy
            } else {
                HealthStatus::Warning
            },
            message: format!("Cache size: {:.1} MB", usage.total_mb()),
        }
    }
}
```

### Управление проектами

```rust
// video_compiler/services/project_service.rs
pub struct ProjectService {
    projects_dir: PathBuf,
    current_project: Arc<RwLock<Option<ProjectSchema>>>,
    project_cache: Arc<RwLock<HashMap<String, ProjectSchema>>>,
}

impl ProjectService {
    pub async fn save_project(&self, project: &ProjectSchema) -> Result<String> {
        let project_dir = self.projects_dir
            .join(&project.metadata.id);
        
        // Создание директории проекта
        tokio::fs::create_dir_all(&project_dir).await?;
        
        // Сохранение файла проекта
        let project_file = project_dir.join("project.tlp");
        let json = serde_json::to_string_pretty(project)?;
        
        // Атомарная запись
        let temp_file = project_file.with_extension("tmp");
        tokio::fs::write(&temp_file, json).await?;
        tokio::fs::rename(temp_file, &project_file).await?;
        
        // Обновление кэша
        self.project_cache.write().await
            .insert(project.metadata.id.clone(), project.clone());
        
        // Сохранение ресурсов проекта
        self.save_project_resources(project).await?;
        
        Ok(project_file.to_string_lossy().to_string())
    }
    
    pub async fn load_project(&self, project_id: &str) -> Result<ProjectSchema> {
        // Проверка кэша
        if let Some(project) = self.project_cache.read().await.get(project_id) {
            return Ok(project.clone());
        }
        
        // Загрузка с диска
        let project_file = self.projects_dir
            .join(project_id)
            .join("project.tlp");
        
        let json = tokio::fs::read_to_string(&project_file).await?;
        let project: ProjectSchema = serde_json::from_str(&json)?;
        
        // Валидация медиафайлов
        self.validate_media_paths(&project).await?;
        
        // Сохранение в кэш
        self.project_cache.write().await
            .insert(project_id.to_string(), project.clone());
        
        Ok(project)
    }
}
```

## ⚡ Производительность

### Параллельная обработка

```rust
use rayon::prelude::*;

// Параллельная генерация превью
pub async fn generate_thumbnails(files: Vec<MediaFile>) -> Vec<Thumbnail> {
    files
        .par_iter()
        .map(|file| {
            generate_single_thumbnail(file).unwrap_or_default()
        })
        .collect()
}

// Параллельное применение эффектов
pub fn apply_effects_parallel(
    frames: Vec<VideoFrame>,
    effects: Vec<Effect>
) -> Vec<VideoFrame> {
    frames
        .par_chunks(100)
        .flat_map(|chunk| {
            chunk.iter().map(|frame| {
                let mut processed = frame.clone();
                for effect in &effects {
                    processed = effect.apply(processed);
                }
                processed
            }).collect::<Vec<_>>()
        })
        .collect()
}
```

### GPU ускорение

```rust
// video_compiler/gpu.rs
pub enum GpuAcceleration {
    Nvidia,    // NVENC
    Intel,     // QuickSync
    Amd,       // AMF
    Apple,     // VideoToolbox
}

pub fn detect_gpu_acceleration() -> Option<GpuAcceleration> {
    #[cfg(target_os = "windows")]
    {
        if check_nvenc_available() {
            return Some(GpuAcceleration::Nvidia);
        }
        if check_quicksync_available() {
            return Some(GpuAcceleration::Intel);
        }
    }
    
    #[cfg(target_os = "macos")]
    {
        return Some(GpuAcceleration::Apple);
    }
    
    None
}
```

## 🏗️ Архитектура сервисов

### Service Container

```rust
// video_compiler/services/mod.rs
pub struct ServiceContainer {
    cache_service: Arc<CacheService>,
    ffmpeg_service: Arc<FFmpegService>,
    gpu_service: Arc<GpuService>,
    preview_service: Arc<PreviewService>,
    project_service: Arc<ProjectService>,
    render_service: Arc<RenderService>,
}

impl ServiceContainer {
    pub async fn new(config: ServiceConfig) -> Result<Self> {
        // Инициализация сервисов
        let cache_service = Arc::new(
            CacheService::new(config.cache_config).await?
        );
        
        let ffmpeg_service = Arc::new(
            FFmpegService::new(config.ffmpeg_path.clone())?
        );
        
        let gpu_service = Arc::new(
            GpuService::new().await?
        );
        
        // Сервисы с зависимостями
        let preview_service = Arc::new(
            PreviewService::new(
                cache_service.clone(),
                ffmpeg_service.clone(),
            )
        );
        
        let render_service = Arc::new(
            RenderService::new(
                ffmpeg_service.clone(),
                gpu_service.clone(),
                cache_service.clone(),
            )
        );
        
        Ok(Self {
            cache_service,
            ffmpeg_service,
            gpu_service,
            preview_service,
            project_service: Arc::new(ProjectService::new(config.projects_dir)),
            render_service,
        })
    }
    
    pub async fn start_all(&self) -> Result<()> {
        futures::try_join!(
            self.cache_service.start(),
            self.gpu_service.start(),
            self.preview_service.start(),
            self.render_service.start(),
        )?;
        
        Ok(())
    }
}
```

### Мониторинг и метрики

```rust
// video_compiler/services/monitoring.rs
pub struct ServiceMetrics {
    operation_counter: IntCounterVec,
    operation_duration: HistogramVec,
    error_counter: IntCounterVec,
    active_operations: IntGauge,
}

impl ServiceMetrics {
    pub fn record_operation<F, R>(&self, op_type: &str, f: F) -> Result<R>
    where
        F: FnOnce() -> Result<R>,
    {
        let start = Instant::now();
        self.active_operations.inc();
        
        let result = f();
        
        self.active_operations.dec();
        let duration = start.elapsed();
        
        self.operation_counter
            .with_label_values(&[op_type])
            .inc();
            
        self.operation_duration
            .with_label_values(&[op_type])
            .observe(duration.as_secs_f64());
        
        if result.is_err() {
            self.error_counter
                .with_label_values(&[op_type])
                .inc();
        }
        
        result
    }
}

// Использование в сервисах
impl RenderService {
    pub async fn render(&self, job: RenderJob) -> Result<String> {
        self.metrics.record_operation("render", || {
            self.render_internal(job).await
        })
    }
}
```

## 🔐 Безопасность

### Изоляция процессов

```rust
// video_compiler/ffmpeg_executor.rs
impl FFmpegExecutor {
    fn create_sandboxed_command(&self, args: &[String]) -> Command {
        let mut cmd = Command::new(&self.ffmpeg_path);
        
        // Ограничение ресурсов
        #[cfg(unix)]
        {
            use std::os::unix::process::CommandExt;
            cmd.uid(1000)  // Непривилегированный пользователь
               .env_clear()  // Очистка окружения
               .env("PATH", "/usr/local/bin:/usr/bin:/bin");
        }
        
        // Таймаут выполнения
        cmd.arg("-timelimit").arg("3600");  // 1 час максимум
        
        // Валидация аргументов
        for arg in args {
            if self.is_safe_argument(arg) {
                cmd.arg(arg);
            } else {
                log::warn!("Небезопасный аргумент отклонен: {}", arg);
            }
        }
        
        cmd
    }
    
    fn is_safe_argument(&self, arg: &str) -> bool {
        // Проверка на опасные паттерны
        !arg.contains("..") && 
        !arg.starts_with("/etc") &&
        !arg.starts_with("/sys") &&
        !arg.contains(";") &&
        !arg.contains("|") &&
        !arg.contains("&")
    }
}
```

### Валидация данных

```rust
// video_compiler/schema/project.rs
impl ProjectSchema {
    pub fn validate(&self) -> Result<()> {
        // Валидация метаданных
        if self.metadata.name.is_empty() {
            return Err(VideoCompilerError::ValidationError(
                "Имя проекта не может быть пустым".to_string()
            ));
        }
        
        // Валидация таймлайна
        for track in &self.timeline.tracks {
            for clip in &track.clips {
                // Проверка путей файлов
                let path = Path::new(&clip.source_file);
                if !path.is_absolute() || !path.exists() {
                    return Err(VideoCompilerError::ValidationError(
                        format!("Недопустимый путь файла: {}", clip.source_file)
                    ));
                }
                
                // Проверка временных меток
                if clip.start_time < 0.0 || clip.duration <= 0.0 {
                    return Err(VideoCompilerError::ValidationError(
                        "Недопустимые временные метки клипа".to_string()
                    ));
                }
            }
        }
        
        Ok(())
    }
}
```

---

[← Frontend архитектура](frontend.md) | [Далее: Взаимодействие компонентов →](communication.md)
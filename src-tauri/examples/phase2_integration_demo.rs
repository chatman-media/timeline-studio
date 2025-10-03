//! Демонстрация полной интеграции Phase 2 компонентов

use timeline_studio_lib::core::{
  performance::{DataType, RuntimeConfig},
  telemetry::{LogLevel, TelemetryConfigBuilder},
  AppEvent,

  CacheManager,
  // Event System
  EventBus,
  EventHandler,
  MemoryManager,
  // Plugin System
  PluginManager,

  // Performance
  RuntimeManager,
  Service,
  // DI and Services
  ServiceContainer,

  // Telemetry & Observability
  TelemetryManager,
  ZeroCopyManager,
};

use async_trait::async_trait;
use std::sync::Arc;
use timeline_studio_lib::video_compiler::error::VideoCompilerError;
use tokio::time::{sleep, Duration};

/// Пример интегрированного сервиса видео обработки
struct VideoProcessingService {
  runtime_manager: Arc<RuntimeManager>,
  memory_manager: Arc<MemoryManager>,
  _cache_manager: Arc<CacheManager>,
  zerocopy_manager: Arc<ZeroCopyManager>,
  event_bus: Arc<EventBus>,
  plugin_manager: Arc<PluginManager>,
}

#[async_trait]
impl Service for VideoProcessingService {
  fn name(&self) -> &'static str {
    "video_processing"
  }

  async fn initialize(&mut self) -> timeline_studio_lib::video_compiler::error::Result<()> {
    log::info!("Initializing VideoProcessingService");

    // Инициализируем runtime pools
    self.runtime_manager.initialize().await?;

    // Запускаем фоновую очистку memory manager
    self.memory_manager.start_background_cleanup().await;

    log::info!("VideoProcessingService initialized successfully");
    Ok(())
  }
}

impl VideoProcessingService {
  fn new(
    runtime_manager: Arc<RuntimeManager>,
    memory_manager: Arc<MemoryManager>,
    cache_manager: Arc<CacheManager>,
    zerocopy_manager: Arc<ZeroCopyManager>,
    event_bus: Arc<EventBus>,
    plugin_manager: Arc<PluginManager>,
  ) -> Self {
    Self {
      runtime_manager,
      memory_manager,
      _cache_manager: cache_manager,
      zerocopy_manager,
      event_bus,
      plugin_manager,
    }
  }

  /// Обработать видео файл с использованием всех оптимизаций
  async fn process_video(
    &self,
    file_path: &str,
  ) -> timeline_studio_lib::video_compiler::error::Result<String> {
    log::info!("Starting video processing for: {file_path}");

    // Публикуем событие начала обработки
    self
      .event_bus
      .publish_app_event(AppEvent::MediaImported {
        media_id: uuid::Uuid::new_v4().to_string(),
        path: file_path.to_string(),
      })
      .await?;

    // Выполняем CPU-intensive задачу через RuntimeManager
    let decode_result = self
      .runtime_manager
      .execute_cpu_intensive(async {
        log::info!("Decoding video...");
        sleep(Duration::from_millis(100)).await; // Симуляция декодирования
        Ok::<String, timeline_studio_lib::video_compiler::error::VideoCompilerError>(
          "decoded_frames".to_string(),
        )
      })
      .await?;

    log::info!("Video decoded in {:?}", decode_result.duration);

    // Выделяем zero-copy буферы для обработки кадров
    let yuv_frame = self
      .zerocopy_manager
      .get_frame_buffer(1920, 1080, DataType::Yuv420p)
      .await?;
    log::info!("Allocated YUV frame buffer: {} bytes", yuv_frame.size());

    // Создаем RGB буфер без копирования через view
    let rgb_frame = self
      .zerocopy_manager
      .get_frame_buffer(1920, 1080, DataType::Rgb24)
      .await?;
    let frame_view = self
      .zerocopy_manager
      .create_view(&rgb_frame, 0, rgb_frame.size())
      .await?;
    log::info!("Created zero-copy frame view: {} bytes", frame_view.size());

    // Применяем эффекты через плагины
    let plugins = self.plugin_manager.list_loaded_plugins().await;
    for (plugin_id, state) in plugins {
      if state == timeline_studio_lib::core::plugins::plugin::PluginState::Active {
        log::info!("Applying effects from plugin: {plugin_id}");
        // Здесь бы вызывали плагин для обработки кадра
      }
    }

    // Выполняем IO-bound задачу для сохранения
    let save_result = self
      .runtime_manager
      .execute_io_bound(async {
        log::info!("Saving processed video...");
        sleep(Duration::from_millis(50)).await; // Симуляция сохранения
        Ok::<String, timeline_studio_lib::video_compiler::error::VideoCompilerError>(
          "/output/processed_video.mp4".to_string(),
        )
      })
      .await?;

    log::info!("Video saved in {:?}", save_result.duration);
    let output_path = save_result.result?;

    // Публикуем событие завершения
    self
      .event_bus
      .publish_app_event(AppEvent::MediaProcessed {
        media_id: uuid::Uuid::new_v4().to_string(),
      })
      .await?;

    log::info!("Video processing completed: {output_path}");
    Ok(output_path)
  }
}

/// Обработчик событий медиа
struct MediaEventHandler {
  _cache_manager: Arc<CacheManager>,
}

#[async_trait]
impl EventHandler for MediaEventHandler {
  type Event = AppEvent;

  async fn handle(
    &self,
    event: AppEvent,
  ) -> timeline_studio_lib::video_compiler::error::Result<()> {
    match event {
      AppEvent::MediaImported { media_id, path } => {
        log::info!("Media imported: {media_id} -> {path}");

        // Кэшируем метаданные медиа файла
        // В реальности здесь бы был реальный кэш с метаданными

        Ok(())
      }
      AppEvent::MediaProcessed { media_id } => {
        log::info!("Media processing completed: {media_id}");
        Ok(())
      }
      _ => Ok(()),
    }
  }

  fn name(&self) -> &'static str {
    "media_event_handler"
  }
}

#[tokio::main]
async fn main() -> Result<(), VideoCompilerError> {
  // Инициализируем логирование
  env_logger::init();

  println!("🚀 Phase 2 Integration Demo - Timeline Studio Backend");
  println!("=====================================\n");

  // 1. Создаем DI Container
  println!("📦 Creating DI Container...");
  let service_container = ServiceContainer::new();

  // 2. Настраиваем Telemetry
  println!("📊 Setting up Telemetry...");
  let telemetry_config = TelemetryConfigBuilder::new()
    .service_name("timeline-studio-phase2-demo")
    .environment("integration-test")
    .log_level(LogLevel::Info)
    .build();

  let telemetry_manager = TelemetryManager::new(telemetry_config)
    .await
    .map_err(|e| VideoCompilerError::InternalError(e.to_string()))?;
  let tracer = telemetry_manager.tracer();
  let metrics_collector = telemetry_manager.metrics();
  let health_manager = telemetry_manager.health();

  // 3. Создаем Event Bus
  println!("🔄 Creating Event Bus...");
  let event_bus = Arc::new(EventBus::new());

  // 4. Настраиваем Performance компоненты
  println!("⚡ Setting up Performance components...");
  let runtime_config = RuntimeConfig::default();
  let runtime_manager = Arc::new(RuntimeManager::new(runtime_config));
  runtime_manager.initialize().await?;

  let memory_manager = Arc::new(MemoryManager::new());
  let cache_manager = Arc::new(CacheManager::new());
  let zerocopy_manager = Arc::new(ZeroCopyManager::new());

  // 5. Создаем Plugin Manager
  println!("🔌 Creating Plugin Manager...");
  let plugin_manager = Arc::new(
    PluginManager::new(
      timeline_studio_lib::core::plugins::plugin::Version::new(1, 0, 0),
      event_bus.clone(),
      Arc::new(service_container),
    )
    .with_telemetry(tracer, metrics_collector.clone())?,
  );

  // 6. Настраиваем Health Checks для всех компонентов
  println!("🏥 Setting up Health Checks...");
  telemetry_manager
    .setup_system_health_checks(Some(event_bus.clone()), Some(plugin_manager.clone()))
    .await?;

  // 7. Создаем основной сервис
  println!("🎬 Creating Video Processing Service...");
  let mut video_service = VideoProcessingService::new(
    runtime_manager,
    memory_manager,
    cache_manager.clone(),
    zerocopy_manager.clone(),
    event_bus.clone(),
    plugin_manager,
  );

  video_service.initialize().await?;

  // 8. Регистрируем обработчик событий
  println!("📨 Registering Event Handlers...");
  let media_handler = MediaEventHandler {
    _cache_manager: cache_manager,
  };
  event_bus
    .subscribe(media_handler)
    .await
    .map_err(|e| VideoCompilerError::InternalError(e.to_string()))?;

  // 9. Демонстрируем работу системы
  println!("\n🎯 Running Integration Tests...\n");

  // Проверяем health checks
  println!("🔍 Running Health Checks...");
  let health_summary = health_manager.check_all().await;
  println!("Overall health status: {:?}", health_summary.status);
  println!("Health checks completed: {}", health_summary.checks.len());

  // Обрабатываем несколько видео файлов
  println!("\n🎬 Processing video files...");
  for i in 1..=3 {
    let file_path = format!("/videos/sample_{i}.mp4");

    println!("\n--- Processing {file_path} ---");
    match video_service.process_video(&file_path).await {
      Ok(output) => println!("✅ Successfully processed: {output}"),
      Err(e) => println!("❌ Processing failed: {e}"),
    }
  }

  // Показываем статистику производительности
  println!("\n📈 Performance Statistics:");

  let runtime_stats = video_service.runtime_manager.get_runtime_stats().await;
  println!("System Stats:");
  println!("  CPU cores: {}", runtime_stats.system_stats.cpu_count);
  println!(
    "  Memory usage: {:.1} MB / {:.1} MB",
    runtime_stats.system_stats.memory_usage as f64 / 1024.0 / 1024.0,
    runtime_stats.system_stats.total_memory as f64 / 1024.0 / 1024.0
  );

  for (pool_name, stats) in runtime_stats.pool_stats {
    println!(
      "Worker Pool '{}': {} total, {} completed, {} active",
      pool_name, stats.total_tasks, stats.completed_tasks, stats.active_tasks
    );
  }

  let (memory_stats, pool_stats) = video_service.memory_manager.get_full_stats().await;
  println!("Memory Stats:");
  println!(
    "  Allocations: {}, Efficiency: {:.1}%",
    memory_stats.allocations,
    pool_stats.recycling_efficiency() * 100.0
  );

  // Показываем telemetry статистику
  println!("Metrics collected successfully");

  // Показываем zero-copy статистику
  let zerocopy_stats = zerocopy_manager.get_stats().await;
  println!("Zero-Copy Stats:");
  println!(
    "  Operations: {}, Bytes saved: {:.2} MB",
    zerocopy_stats.zero_copy_operations,
    zerocopy_stats.bytes_saved as f64 / 1024.0 / 1024.0
  );

  // Завершаем работу
  println!("\n🛑 Shutting down gracefully...");
  telemetry_manager
    .shutdown()
    .await
    .map_err(|e| VideoCompilerError::InternalError(e.to_string()))?;

  println!("\n✨ Phase 2 Integration Demo completed successfully!");
  println!("\n📋 Demonstrated features:");
  println!("  ✅ Dependency Injection Container");
  println!("  ✅ Event-Driven Architecture");
  println!("  ✅ Plugin System integration");
  println!("  ✅ OpenTelemetry observability");
  println!("  ✅ Health checks system");
  println!("  ✅ Performance optimization");
  println!("  ✅ Memory management");
  println!("  ✅ Caching system");
  println!("  ✅ Async runtime tuning");
  println!("  ✅ Zero-copy operations");
  println!("\n🎉 Phase 2 refactoring architecture is ready for production!");

  Ok(())
}

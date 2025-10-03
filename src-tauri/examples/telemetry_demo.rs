//! Демонстрация работы с OpenTelemetry

use std::sync::Arc;
use std::time::Duration;
use timeline_studio_lib::core::{
  telemetry::{LogLevel, TelemetryConfigBuilder},
  AppEvent, EventBus, MetricsCollector, TelemetryManager, Tracer,
};
use timeline_studio_lib::video_compiler::error::VideoCompilerError;
use tokio::time::sleep;

/// Пример сервиса с телеметрией
struct MediaProcessorService {
  tracer: Arc<Tracer>,
}

impl MediaProcessorService {
  fn new(tracer: Arc<Tracer>, _collector: Arc<MetricsCollector>) -> Self {
    Self { tracer }
  }

  async fn process_media(&self, file_path: &str) -> Result<(), VideoCompilerError> {
    // Трассируем операцию
    let tracer = self.tracer.clone();
    let file_path_owned = file_path.to_string();

    self
      .tracer
      .trace("media.process", async move {
        log::info!("Processing media file: {file_path_owned}");

        // Симулируем обработку
        sleep(Duration::from_millis(100)).await;

        // Обработка отдельных этапов
        tracer
          .trace("media.decode", async {
            sleep(Duration::from_millis(30)).await;
            Ok::<_, VideoCompilerError>(())
          })
          .await?;

        tracer
          .trace("media.analyze", async {
            sleep(Duration::from_millis(50)).await;
            Ok::<_, VideoCompilerError>(())
          })
          .await?;

        tracer
          .trace("media.thumbnail", async {
            sleep(Duration::from_millis(20)).await;
            Ok::<_, VideoCompilerError>(())
          })
          .await?;

        log::info!("Media processing completed");
        Ok(())
      })
      .await?;

    // Note: In a real application, metrics would be created once during initialization
    // and reused across multiple operations. For this demo, we'll just log the metrics
    // instead of creating them multiple times.
    log::info!("Metric: media.files.imported type=video count=1");
    log::info!("Metric: media.processing.duration type=video value=100.0ms");

    Ok(())
  }
}

/// Пример рендеринг сервиса
struct RenderService {
  tracer: Arc<Tracer>,
  event_bus: Arc<EventBus>,
}

impl RenderService {
  fn new(tracer: Arc<Tracer>, _collector: Arc<MetricsCollector>, event_bus: Arc<EventBus>) -> Self {
    Self { tracer, event_bus }
  }

  async fn render_project(&self, project_id: &str) -> Result<(), VideoCompilerError> {
    let job_id = uuid::Uuid::new_v4().to_string();
    let project_id_owned = project_id.to_string();

    // Note: In a real application, metrics would be created once during initialization
    log::info!("Metric: render.jobs.total project={project_id} count=1");
    log::info!("Metric: render.jobs.active value=+1");

    // Публикуем событие начала
    self
      .event_bus
      .publish_app_event(AppEvent::RenderStarted {
        job_id: job_id.clone(),
        project_id: project_id.to_string(),
      })
      .await?;

    // Начинаем трассировку рендеринга
    let event_bus = self.event_bus.clone();
    let job_id_for_span = job_id.clone();
    let job_id_for_async = job_id.clone();

    let result = self
      .tracer
      .span("render.job")
      .with_attribute("project.id", project_id_owned.clone())
      .with_attribute("job.id", job_id_for_span)
      .run(async move {
        // Симулируем рендеринг с прогрессом
        for i in 0..10 {
          sleep(Duration::from_millis(100)).await;

          // Публикуем прогресс
          event_bus
            .publish_app_event(AppEvent::RenderProgress {
              job_id: job_id_for_async.clone(),
              progress: (i + 1) as f32 * 10.0,
            })
            .await?;
        }

        // Публикуем завершение
        event_bus
          .publish_app_event(AppEvent::RenderCompleted {
            job_id: job_id_for_async.clone(),
            output_path: "/path/to/output.mp4".to_string(),
          })
          .await?;

        Ok::<_, VideoCompilerError>(())
      })
      .await;

    // Логируем метрики
    log::info!("Metric: render.jobs.active value=-1");
    log::info!("Metric: render.duration project={project_id} value=1000.0ms");
    log::info!("Metric: render.frames.processed project={project_id} count=100");

    // Обрабатываем ошибки
    if let Err(e) = &result {
      log::info!("Metric: render.errors.total project={project_id} error_type=unknown count=1");

      self
        .event_bus
        .publish_app_event(AppEvent::RenderFailed {
          job_id,
          error: e.to_string(),
        })
        .await?;
    }

    result
  }
}

#[tokio::main]
async fn main() -> Result<(), VideoCompilerError> {
  // Инициализируем логирование
  env_logger::init();

  // Создаем конфигурацию телеметрии
  let telemetry_config = TelemetryConfigBuilder::new()
    .service_name("timeline-studio-demo")
    .environment("development")
    .log_level(LogLevel::Debug)
    .sample_rate(1.0) // 100% семплирование для демо
    .build();

  // Создаем менеджер телеметрии
  let telemetry_manager = TelemetryManager::new(telemetry_config)
    .await
    .map_err(|e| VideoCompilerError::InternalError(e.to_string()))?;
  let tracer = telemetry_manager.tracer();
  let metrics_collector = telemetry_manager.metrics();

  // Создаем инфраструктуру
  let event_bus = Arc::new(EventBus::new());

  // Создаем сервисы
  let media_processor = MediaProcessorService::new(tracer.clone(), metrics_collector.clone());

  let render_service =
    RenderService::new(tracer.clone(), metrics_collector.clone(), event_bus.clone());

  // Демонстрация работы
  println!("🚀 Starting telemetry demo...\n");

  // Обрабатываем медиа файлы
  println!("📹 Processing media files...");
  for i in 1..=3 {
    let file_path = format!("/videos/clip_{i}.mp4");
    media_processor.process_media(&file_path).await?;
  }

  println!("\n🎬 Rendering project...");
  render_service.render_project("demo-project-123").await?;

  // Собираем системные метрики
  println!("\n📊 Collecting system metrics...");
  metrics_collector
    .collect_system_metrics()
    .await
    .map_err(|e| VideoCompilerError::InternalError(e.to_string()))?;

  // Создаем вложенные spans
  println!("\n🔍 Demonstrating nested spans...");
  {
    let tracer_clone = tracer.clone();
    tracer
      .trace("complex_operation", async move {
        log::info!("Starting complex operation");

        // Первый этап
        tracer_clone
          .trace("stage_1", async {
            log::info!("Executing stage 1");
            sleep(Duration::from_millis(50)).await;
            Ok::<_, VideoCompilerError>(())
          })
          .await?;

        // Параллельные операции
        let tracer_for_task1 = tracer_clone.clone();
        let tracer_for_task2 = tracer_clone.clone();

        let (result1, result2) = tokio::join!(
          tracer_for_task1.trace("parallel_task_1", async {
            log::info!("Parallel task 1");
            sleep(Duration::from_millis(100)).await;
            Ok::<i32, VideoCompilerError>(42)
          }),
          tracer_for_task2.trace("parallel_task_2", async {
            log::info!("Parallel task 2");
            sleep(Duration::from_millis(80)).await;
            Ok::<i32, VideoCompilerError>(24)
          })
        );

        let sum = result1? + result2?;
        log::info!("Complex operation completed with result: {sum}");

        Ok::<_, VideoCompilerError>(())
      })
      .await?;
  }

  // Демонстрация обработки ошибок
  println!("\n❌ Demonstrating error handling...");
  let error_result = tracer
    .trace("failing_operation", async {
      log::info!("Starting operation that will fail");
      sleep(Duration::from_millis(50)).await;
      Err::<(), VideoCompilerError>(VideoCompilerError::InternalError(
        "Simulated error".to_string(),
      ))
    })
    .await;

  if let Err(e) = error_result {
    log::error!("Operation failed as expected: {e}");
  }

  // Даем время на экспорт данных
  println!("\n⏳ Waiting for telemetry export...");
  sleep(Duration::from_secs(2)).await;

  // Завершаем работу
  println!("\n✅ Shutting down telemetry...");
  telemetry_manager.shutdown().await?;

  println!("\n🎉 Demo completed!");
  println!("\nNote: In production, telemetry data would be sent to:");
  println!("  - Jaeger/Tempo for distributed tracing");
  println!("  - Prometheus/Grafana for metrics");
  println!("  - Elasticsearch/Loki for logs");

  Ok(())
}

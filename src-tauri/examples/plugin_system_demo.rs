//! Демонстрация Plugin System

mod plugins {
  pub mod blur_effect_plugin;
  pub mod youtube_uploader_plugin;
}

use plugins::{
  blur_effect_plugin::BlurEffectPlugin, youtube_uploader_plugin::YouTubeUploaderPlugin,
};
use std::sync::Arc;
use timeline_studio_lib::core::{
  plugins::{loader::PluginRegistration, PluginManager, SecurityLevel, Version},
  AppEvent, EventBus, Plugin, ServiceContainer,
};
use timeline_studio_lib::video_compiler::error::Result;

#[tokio::main]
async fn main() -> Result<()> {
  // Инициализация логирования
  env_logger::Builder::from_default_env()
    .filter_level(log::LevelFilter::Info)
    .init();

  println!("🚀 Plugin System Demo\n");

  // Создаем основные компоненты системы
  let event_bus = Arc::new(EventBus::new());
  let service_container = Arc::new(ServiceContainer::new());
  let app_version = Version::new(1, 0, 0);

  // Запускаем обработчик событий
  event_bus.start_app_event_processor().await;

  // Создаем менеджер плагинов
  let plugin_manager = Arc::new(PluginManager::new(
    app_version.clone(),
    event_bus.clone(),
    service_container.clone(),
  ));

  // Регистрируем плагины в загрузчике
  let loader = plugin_manager.loader();
  let registry = loader.registry();

  // Регистрируем Blur Effect Plugin
  {
    let plugin = BlurEffectPlugin::new();
    let metadata = plugin.metadata().clone();
    let factory = Box::new(|| Box::new(BlurEffectPlugin::new()) as Box<dyn Plugin>);

    registry
      .register(PluginRegistration { metadata, factory })
      .await?;

    println!("✅ Registered Blur Effect Plugin");
  }

  // Регистрируем YouTube Uploader Plugin
  {
    let plugin = YouTubeUploaderPlugin::new();
    let metadata = plugin.metadata().clone();
    let factory = Box::new(|| Box::new(YouTubeUploaderPlugin::new()) as Box<dyn Plugin>);

    registry
      .register(PluginRegistration { metadata, factory })
      .await?;

    println!("✅ Registered YouTube Uploader Plugin");
  }

  // Список доступных плагинов
  println!("\n📋 Available Plugins:");
  for metadata in registry.list_plugins().await {
    println!(
      "  - {} v{} ({})",
      metadata.name, metadata.version, metadata.plugin_type as u8
    );
  }

  // Загружаем плагины с разными уровнями разрешений
  println!("\n🔌 Loading Plugins:");

  // Blur Effect - минимальные разрешения (только чтение)
  let blur_permissions = SecurityLevel::Minimal.permissions();
  let blur_instance = plugin_manager
    .load_plugin("blur-effect", blur_permissions)
    .await?;
  println!("  ✅ Loaded Blur Effect Plugin (instance: {blur_instance})");

  // YouTube Uploader - расширенные разрешения (сеть + файлы)
  let mut youtube_permissions = SecurityLevel::Extended.permissions();
  youtube_permissions
    .network
    .allowed_hosts
    .push("youtube.com".to_string());
  youtube_permissions
    .network
    .allowed_hosts
    .push("*.googleapis.com".to_string());

  let youtube_instance = plugin_manager
    .load_plugin("youtube-uploader", youtube_permissions)
    .await?;
  println!("  ✅ Loaded YouTube Uploader Plugin (instance: {youtube_instance})");

  // Проверяем загруженные плагины
  println!("\n📊 Loaded Plugins Status:");
  for (plugin_id, state) in plugin_manager.list_loaded_plugins().await {
    println!("  - {plugin_id}: {state:?}");
  }

  // Отправляем команды плагинам
  println!("\n📨 Sending Commands:");

  // Команда Blur Effect
  let blur_command = timeline_studio_lib::core::plugins::PluginCommand {
    id: uuid::Uuid::new_v4(),
    command: "apply_blur".to_string(),
    params: serde_json::json!({
        "media_id": "demo-video-001",
        "radius": 5.0
    }),
  };

  let blur_response = plugin_manager
    .send_command("blur-effect", blur_command)
    .await?;
  println!("  Blur Effect Response: {:?}", blur_response.data);

  // Команда YouTube Uploader
  let youtube_command = timeline_studio_lib::core::plugins::PluginCommand {
    id: uuid::Uuid::new_v4(),
    command: "get_channel_info".to_string(),
    params: serde_json::json!({}),
  };

  let youtube_response = plugin_manager
    .send_command("youtube-uploader", youtube_command)
    .await?;
  println!("  YouTube Response: {:?}", youtube_response.data);

  // Тестируем систему событий
  println!("\n📡 Testing Event System:");

  // Публикуем событие импорта медиа
  event_bus
    .publish_app_event(AppEvent::MediaImported {
      media_id: "test-media-001".to_string(),
      path: "/path/to/video.mp4".to_string(),
    })
    .await?;

  // Даем время на обработку
  tokio::time::sleep(tokio::time::Duration::from_millis(100)).await;

  // Публикуем событие завершения рендеринга
  event_bus
    .publish_app_event(AppEvent::RenderCompleted {
      job_id: "render-001".to_string(),
      output_path: "/path/to/output.mp4".to_string(),
    })
    .await?;

  // Даем время на обработку
  tokio::time::sleep(tokio::time::Duration::from_millis(100)).await;

  // Получаем информацию о плагинах
  println!("\n📋 Plugin Information:");

  let blur_info = plugin_manager.get_plugin_info("blur-effect").await?;
  println!(
    "  Blur Effect: {}",
    serde_json::to_string_pretty(&blur_info).unwrap()
  );

  // Тестируем приостановку и возобновление
  println!("\n⏸️ Testing Suspend/Resume:");

  plugin_manager.suspend_plugin("blur-effect").await?;
  println!("  Suspended Blur Effect Plugin");

  // Проверяем статус
  for (plugin_id, state) in plugin_manager.list_loaded_plugins().await {
    println!("  - {plugin_id}: {state:?}");
  }

  plugin_manager.resume_plugin("blur-effect").await?;
  println!("  Resumed Blur Effect Plugin");

  // Тестируем загрузку видео на YouTube
  println!("\n📤 Testing YouTube Upload:");

  let upload_command = timeline_studio_lib::core::plugins::PluginCommand {
    id: uuid::Uuid::new_v4(),
    command: "upload_video".to_string(),
    params: serde_json::json!({
        "video_path": "/path/to/rendered-video.mp4",
        "title": "Demo Video from Timeline Studio",
        "description": "This video was uploaded using the YouTube Uploader Plugin"
    }),
  };

  let upload_response = plugin_manager
    .send_command("youtube-uploader", upload_command)
    .await?;
  if upload_response.success {
    let task_id = upload_response
      .data
      .as_ref()
      .and_then(|d| d.get("task_id"))
      .and_then(|v| v.as_str())
      .unwrap_or("");

    println!("  Upload task created: {task_id}");

    // Проверяем статус загрузки
    tokio::time::sleep(tokio::time::Duration::from_secs(1)).await;

    let status_command = timeline_studio_lib::core::plugins::PluginCommand {
      id: uuid::Uuid::new_v4(),
      command: "get_upload_status".to_string(),
      params: serde_json::json!({ "task_id": task_id }),
    };

    let status_response = plugin_manager
      .send_command("youtube-uploader", status_command)
      .await?;
    if let Some(data) = status_response.data {
      println!(
        "  Upload status: {}",
        serde_json::to_string_pretty(&data).unwrap()
      );
    }
  }

  // Корректное завершение
  println!("\n🛑 Shutting Down:");

  // Выгружаем плагины
  plugin_manager.unload_plugin("blur-effect").await?;
  println!("  ✅ Unloaded Blur Effect Plugin");

  plugin_manager.unload_plugin("youtube-uploader").await?;
  println!("  ✅ Unloaded YouTube Uploader Plugin");

  // Проверяем финальный статус
  let loaded = plugin_manager.list_loaded_plugins().await;
  println!("\n📊 Final Status: {} plugins loaded", loaded.len());

  println!("\n✨ Plugin System Demo Completed Successfully!");

  Ok(())
}

/// Демонстрация создания кастомного плагина
mod custom_plugin_example {
  use async_trait::async_trait;
  use timeline_studio_lib::core::plugins::*;
  use timeline_studio_lib::core::AppEvent;
  use timeline_studio_lib::video_compiler::error::Result;

  /// Простой плагин-счетчик событий
  pub struct EventCounterPlugin {
    metadata: PluginMetadata,
    event_count: std::sync::atomic::AtomicU32,
  }

  impl EventCounterPlugin {
    pub fn _new() -> Self {
      Self {
        metadata: PluginMetadata {
          id: "event-counter".to_string(),
          name: "Event Counter".to_string(),
          version: Version::new(1, 0, 0),
          author: "Demo".to_string(),
          description: "Counts all events in the system".to_string(),
          plugin_type: PluginType::Analyzer,
          homepage: None,
          license: None,
          dependencies: vec![],
          min_app_version: None,
        },
        event_count: std::sync::atomic::AtomicU32::new(0),
      }
    }
  }

  #[async_trait]
  impl Plugin for EventCounterPlugin {
    fn metadata(&self) -> &PluginMetadata {
      &self.metadata
    }

    async fn initialize(&mut self, _context: PluginContext) -> Result<()> {
      log::info!("Event Counter Plugin initialized");
      Ok(())
    }

    async fn shutdown(&mut self) -> Result<()> {
      let count = self.event_count.load(std::sync::atomic::Ordering::Relaxed);
      log::info!(
        "Event Counter Plugin shutting down. Total events: {}",
        count
      );
      Ok(())
    }

    async fn handle_command(&self, command: PluginCommand) -> Result<PluginResponse> {
      match command.command.as_str() {
        "get_count" => {
          let count = self.event_count.load(std::sync::atomic::Ordering::Relaxed);
          Ok(PluginResponse {
            command_id: command.id,
            success: true,
            data: Some(serde_json::json!({ "count": count })),
            error: None,
          })
        }
        "reset_count" => {
          self
            .event_count
            .store(0, std::sync::atomic::Ordering::Relaxed);
          Ok(PluginResponse {
            command_id: command.id,
            success: true,
            data: None,
            error: None,
          })
        }
        _ => Ok(PluginResponse {
          command_id: command.id,
          success: false,
          data: None,
          error: Some("Unknown command".to_string()),
        }),
      }
    }

    fn subscribed_events(&self) -> Vec<AppEventType> {
      vec![AppEventType::All] // Подписываемся на все события
    }

    async fn handle_event(&self, _event: &AppEvent) -> Result<()> {
      self
        .event_count
        .fetch_add(1, std::sync::atomic::Ordering::Relaxed);
      Ok(())
    }
  }
}

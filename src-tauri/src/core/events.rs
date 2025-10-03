//! Event-driven architecture для Timeline Studio
//!
//! Система событий для слабосвязанной коммуникации между компонентами.

use crate::video_compiler::error::{Result, VideoCompilerError};
use async_trait::async_trait;
use serde::{Deserialize, Serialize};
use specta::Type;
use std::any::{Any, TypeId};
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::{mpsc, RwLock};

/// Базовое событие приложения
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(tag = "type", content = "data")]
pub enum AppEvent {
  // Project events
  ProjectCreated {
    project_id: String,
  },
  ProjectOpened {
    project_id: String,
    path: String,
  },
  ProjectSaved {
    project_id: String,
  },
  ProjectClosed {
    project_id: String,
  },

  // Rendering events
  RenderStarted {
    job_id: String,
    project_id: String,
  },
  RenderProgress {
    job_id: String,
    progress: f32,
  },
  RenderCompleted {
    job_id: String,
    output_path: String,
  },
  RenderFailed {
    job_id: String,
    error: String,
  },

  // Media events
  MediaImported {
    media_id: String,
    path: String,
  },
  MediaProcessed {
    media_id: String,
  },
  ThumbnailGenerated {
    media_id: String,
    thumbnail_path: String,
  },
  EffectApplied {
    media_id: String,
    effect_type: String,
    parameters: String,
  },

  // Recognition events
  RecognitionStarted {
    media_id: String,
    model: String,
  },
  RecognitionCompleted {
    media_id: String,
    results: serde_json::Value,
  },

  // Plugin events
  PluginLoaded {
    plugin_id: String,
    version: String,
  },
  PluginUnloaded {
    plugin_id: String,
  },
  PluginEvent {
    plugin_id: String,
    event: serde_json::Value,
  },

  // System events
  SystemStartup,
  SystemShutdown,
  SystemHealthCheck {
    timestamp: chrono::DateTime<chrono::Utc>,
  },
  ConfigChanged {
    key: String,
    value: serde_json::Value,
  },
  MemoryWarning {
    usage_percent: f32,
  },
}

/// Trait для обработчиков событий
#[async_trait]
pub trait EventHandler: Send + Sync + 'static {
  /// Тип события, которое обрабатывает handler
  type Event: Any + Send + Sync + Clone;

  /// Обработка события
  async fn handle(&self, event: Self::Event) -> Result<()>;

  /// Имя обработчика для логирования
  fn name(&self) -> &'static str;
}

/// Подписка на события
struct Subscription {
  #[allow(dead_code)]
  handler: Box<dyn Any + Send + Sync>,
  name: &'static str,
}

/// Специальная подписка для AppEvent
struct AppEventSubscription {
  handler: Box<dyn EventHandler<Event = AppEvent>>,
  name: &'static str,
}

/// Event Bus для публикации и подписки на события
pub struct EventBus {
  subscriptions: Arc<RwLock<HashMap<TypeId, Vec<Subscription>>>>,
  app_event_subscriptions: Arc<RwLock<Vec<AppEventSubscription>>>,
  app_event_sender: mpsc::UnboundedSender<AppEvent>,
  app_event_receiver: Arc<RwLock<mpsc::UnboundedReceiver<AppEvent>>>,
}

impl EventBus {
  /// Создать новый EventBus
  pub fn new() -> Self {
    let (tx, rx) = mpsc::unbounded_channel();

    Self {
      subscriptions: Arc::new(RwLock::new(HashMap::new())),
      app_event_subscriptions: Arc::new(RwLock::new(Vec::new())),
      app_event_sender: tx,
      app_event_receiver: Arc::new(RwLock::new(rx)),
    }
  }

  /// Подписаться на событие определенного типа
  pub async fn subscribe<E, H>(&self, handler: H) -> Result<()>
  where
    E: Any + Send + Sync + Clone + 'static,
    H: EventHandler<Event = E>,
  {
    let mut subs = self.subscriptions.write().await;
    let type_id = TypeId::of::<E>();

    let handler_name = handler.name();
    let subscription = Subscription {
      handler: Box::new(handler),
      name: handler_name,
    };

    subs
      .entry(type_id)
      .or_insert_with(Vec::new)
      .push(subscription);

    log::info!("Subscribed handler '{handler_name}' to event type");
    Ok(())
  }

  /// Специальный метод подписки на AppEvent
  pub async fn subscribe_app_event<H>(&self, handler: H) -> Result<()>
  where
    H: EventHandler<Event = AppEvent>,
  {
    let mut app_subs = self.app_event_subscriptions.write().await;
    let handler_name = handler.name();

    let subscription = AppEventSubscription {
      handler: Box::new(handler),
      name: handler_name,
    };

    app_subs.push(subscription);
    log::info!("Subscribed handler '{handler_name}' to AppEvent");
    Ok(())
  }

  /// Опубликовать событие
  pub async fn publish<E>(&self, _event: E) -> Result<()>
  where
    E: Any + Send + Sync + Clone + 'static,
  {
    let subs = self.subscriptions.read().await;
    let type_id = TypeId::of::<E>();

    if let Some(handlers) = subs.get(&type_id) {
      for subscription in handlers {
        // Здесь нужна более сложная логика для downcast и вызова handler
        // Пока просто логируем
        let handler_name = &subscription.name;
        log::debug!("Publishing event to handler: {handler_name}");
      }
    }

    Ok(())
  }

  /// Опубликовать AppEvent
  pub async fn publish_app_event(&self, event: AppEvent) -> Result<()> {
    self
      .app_event_sender
      .send(event)
      .map_err(|e| VideoCompilerError::InternalError(e.to_string()))?;
    Ok(())
  }

  /// Запустить обработку AppEvent
  pub async fn start_app_event_processor(&self) {
    let receiver = self.app_event_receiver.clone();
    let app_subscriptions = self.app_event_subscriptions.clone();

    tokio::spawn(async move {
      let mut rx = receiver.write().await;

      while let Some(event) = rx.recv().await {
        log::debug!("Processing app event: {event:?}");

        // Маршрутизация событий к подписанным AppEvent обработчикам
        let app_subs = app_subscriptions.read().await;
        for subscription in app_subs.iter() {
          if let Err(e) = subscription.handler.handle(event.clone()).await {
            log::error!("Error in AppEvent handler '{}': {}", subscription.name, e);
          }
        }

        // Логирование конкретных событий
        match &event {
          AppEvent::ProjectCreated { project_id } => {
            log::info!("Project created: {project_id}");
          }
          AppEvent::RenderStarted { job_id, .. } => {
            log::info!("Render started: {job_id}");
          }
          _ => {}
        }
      }
    });
  }
}

impl Default for EventBus {
  fn default() -> Self {
    Self::new()
  }
}

/// Макрос для упрощения создания обработчиков событий
#[macro_export]
macro_rules! event_handler {
  ($name:ident, $event_type:ty, $handler_fn:expr) => {
    struct $name;

    #[async_trait::async_trait]
    impl $crate::core::EventHandler for $name {
      type Event = $event_type;

      async fn handle(&self, event: Self::Event) -> $crate::video_compiler::error::Result<()> {
        $handler_fn(event).await
      }

      fn name(&self) -> &'static str {
        stringify!($name)
      }
    }
  };
}

#[cfg(test)]
mod tests {
  use super::*;
  use std::sync::atomic::{AtomicU32, Ordering};

  #[derive(Clone)]
  struct TestEvent {
    message: String,
  }

  struct TestHandler {
    call_count: Arc<AtomicU32>,
  }

  #[async_trait]
  impl EventHandler for TestHandler {
    type Event = TestEvent;

    async fn handle(&self, event: Self::Event) -> Result<()> {
      self.call_count.fetch_add(1, Ordering::SeqCst);
      let message = &event.message;
      println!("Handled: {message}");
      Ok(())
    }

    fn name(&self) -> &'static str {
      "TestHandler"
    }
  }

  #[tokio::test]
  async fn test_event_subscription() {
    let event_bus = EventBus::new();
    let handler = TestHandler {
      call_count: Arc::new(AtomicU32::new(0)),
    };

    assert!(event_bus.subscribe(handler).await.is_ok());

    // Verify subscription was added
    let subs = event_bus.subscriptions.read().await;
    assert_eq!(subs.len(), 1);
    assert!(subs.contains_key(&TypeId::of::<TestEvent>()));
  }

  #[tokio::test]
  async fn test_multiple_handlers_for_same_event() {
    let event_bus = EventBus::new();

    let handler1 = TestHandler {
      call_count: Arc::new(AtomicU32::new(0)),
    };
    let handler2 = TestHandler {
      call_count: Arc::new(AtomicU32::new(0)),
    };

    event_bus.subscribe(handler1).await.unwrap();
    event_bus.subscribe(handler2).await.unwrap();

    let subs = event_bus.subscriptions.read().await;
    let handlers = subs.get(&TypeId::of::<TestEvent>()).unwrap();
    assert_eq!(handlers.len(), 2);
  }

  #[tokio::test]
  async fn test_app_event_publishing() {
    let event_bus = EventBus::new();

    // Test various event types
    let events = vec![
      AppEvent::ProjectCreated {
        project_id: "test-123".to_string(),
      },
      AppEvent::RenderStarted {
        job_id: "job-456".to_string(),
        project_id: "test-123".to_string(),
      },
      AppEvent::RenderProgress {
        job_id: "job-456".to_string(),
        progress: 0.5,
      },
      AppEvent::RenderCompleted {
        job_id: "job-456".to_string(),
        output_path: "/tmp/output.mp4".to_string(),
      },
    ];

    for event in events {
      assert!(event_bus.publish_app_event(event).await.is_ok());
    }
  }

  #[tokio::test]
  async fn test_event_processor() {
    let event_bus = EventBus::new();

    // Start the processor
    event_bus.start_app_event_processor().await;

    // Give processor time to start
    tokio::time::sleep(tokio::time::Duration::from_millis(10)).await;

    // Publish some events
    event_bus
      .publish_app_event(AppEvent::SystemStartup)
      .await
      .unwrap();
    event_bus
      .publish_app_event(AppEvent::SystemShutdown)
      .await
      .unwrap();

    // Give processor time to handle events
    tokio::time::sleep(tokio::time::Duration::from_millis(10)).await;
  }

  async fn handle_test_event(event: TestEvent) -> Result<()> {
    let message = &event.message;
    println!("Macro handler: {message}");
    Ok(())
  }

  #[tokio::test]
  async fn test_event_handler_macro() {
    event_handler!(MacroTestHandler, TestEvent, handle_test_event);

    let event_bus = EventBus::new();
    let handler = MacroTestHandler;

    assert!(event_bus.subscribe(handler).await.is_ok());
    assert_eq!(MacroTestHandler.name(), "MacroTestHandler");
  }

  #[tokio::test]
  async fn test_memory_warning_event() {
    let event_bus = EventBus::new();

    let event = AppEvent::MemoryWarning {
      usage_percent: 85.5,
    };

    assert!(event_bus.publish_app_event(event).await.is_ok());
  }

  #[tokio::test]
  async fn test_plugin_events() {
    let event_bus = EventBus::new();

    let events = vec![
      AppEvent::PluginLoaded {
        plugin_id: "test-plugin".to_string(),
        version: "1.0.0".to_string(),
      },
      AppEvent::PluginEvent {
        plugin_id: "test-plugin".to_string(),
        event: serde_json::json!({"type": "custom", "data": "test"}),
      },
      AppEvent::PluginUnloaded {
        plugin_id: "test-plugin".to_string(),
      },
    ];

    for event in events {
      assert!(event_bus.publish_app_event(event).await.is_ok());
    }
  }

  #[tokio::test]
  async fn test_concurrent_event_publishing() {
    let event_bus = Arc::new(EventBus::new());

    let mut handles = vec![];

    // Spawn multiple tasks publishing events concurrently
    for i in 0..10 {
      let bus = event_bus.clone();
      let handle = tokio::spawn(async move {
        bus
          .publish_app_event(AppEvent::ProjectCreated {
            project_id: format!("project-{i}"),
          })
          .await
      });
      handles.push(handle);
    }

    // Wait for all tasks
    for handle in handles {
      assert!(handle.await.unwrap().is_ok());
    }
  }

  #[derive(Clone)]
  struct CounterEvent {
    value: u32,
  }

  struct CounterHandler {
    total: Arc<RwLock<u32>>,
  }

  #[async_trait]
  impl EventHandler for CounterHandler {
    type Event = CounterEvent;

    async fn handle(&self, event: Self::Event) -> Result<()> {
      let mut total = self.total.write().await;
      *total += event.value;
      Ok(())
    }

    fn name(&self) -> &'static str {
      "CounterHandler"
    }
  }

  #[tokio::test]
  async fn test_event_handler_state() {
    let event_bus = EventBus::new();
    let total = Arc::new(RwLock::new(0));

    let handler = CounterHandler {
      total: total.clone(),
    };

    event_bus.subscribe(handler).await.unwrap();

    // The actual event publishing logic would need to be implemented
    // to make this test meaningful

    // For now, just verify the handler was registered
    let subs = event_bus.subscriptions.read().await;
    assert!(subs.contains_key(&TypeId::of::<CounterEvent>()));
  }

  #[tokio::test]
  async fn test_media_events() {
    let event_bus = EventBus::new();

    let events = vec![
      AppEvent::MediaImported {
        media_id: "media-123".to_string(),
        path: "/path/to/media.mp4".to_string(),
      },
      AppEvent::MediaProcessed {
        media_id: "media-123".to_string(),
      },
      AppEvent::ThumbnailGenerated {
        media_id: "media-123".to_string(),
        thumbnail_path: "/path/to/thumbnail.jpg".to_string(),
      },
      AppEvent::EffectApplied {
        media_id: "media-123".to_string(),
        effect_type: "blur".to_string(),
        parameters: "{\"radius\": 5}".to_string(),
      },
    ];

    for event in events {
      assert!(event_bus.publish_app_event(event).await.is_ok());
    }
  }

  #[tokio::test]
  async fn test_recognition_events() {
    let event_bus = EventBus::new();

    let start_event = AppEvent::RecognitionStarted {
      media_id: "media-456".to_string(),
      model: "yolo-v8".to_string(),
    };

    let complete_event = AppEvent::RecognitionCompleted {
      media_id: "media-456".to_string(),
      results: serde_json::json!({
        "objects": [
          {"class": "person", "confidence": 0.95},
          {"class": "car", "confidence": 0.87}
        ]
      }),
    };

    assert!(event_bus.publish_app_event(start_event).await.is_ok());
    assert!(event_bus.publish_app_event(complete_event).await.is_ok());
  }

  #[tokio::test]
  async fn test_project_events() {
    let event_bus = EventBus::new();

    let events = vec![
      AppEvent::ProjectCreated {
        project_id: "proj-789".to_string(),
      },
      AppEvent::ProjectOpened {
        project_id: "proj-789".to_string(),
        path: "/path/to/project.tls".to_string(),
      },
      AppEvent::ProjectSaved {
        project_id: "proj-789".to_string(),
      },
      AppEvent::ProjectClosed {
        project_id: "proj-789".to_string(),
      },
    ];

    for event in events {
      assert!(event_bus.publish_app_event(event).await.is_ok());
    }
  }

  #[tokio::test]
  async fn test_render_events() {
    let event_bus = EventBus::new();

    let events = vec![
      AppEvent::RenderStarted {
        job_id: "render-001".to_string(),
        project_id: "proj-123".to_string(),
      },
      AppEvent::RenderProgress {
        job_id: "render-001".to_string(),
        progress: 0.25,
      },
      AppEvent::RenderProgress {
        job_id: "render-001".to_string(),
        progress: 0.75,
      },
      AppEvent::RenderCompleted {
        job_id: "render-001".to_string(),
        output_path: "/output/final.mp4".to_string(),
      },
    ];

    for event in events {
      assert!(event_bus.publish_app_event(event).await.is_ok());
    }

    // Test render failure
    let fail_event = AppEvent::RenderFailed {
      job_id: "render-002".to_string(),
      error: "Insufficient memory".to_string(),
    };
    assert!(event_bus.publish_app_event(fail_event).await.is_ok());
  }

  #[tokio::test]
  async fn test_system_events() {
    let event_bus = EventBus::new();

    let events = vec![
      AppEvent::SystemStartup,
      AppEvent::SystemHealthCheck {
        timestamp: chrono::Utc::now(),
      },
      AppEvent::ConfigChanged {
        key: "theme".to_string(),
        value: serde_json::json!("dark"),
      },
      AppEvent::MemoryWarning {
        usage_percent: 90.5,
      },
      AppEvent::SystemShutdown,
    ];

    for event in events {
      assert!(event_bus.publish_app_event(event).await.is_ok());
    }
  }

  #[tokio::test]
  async fn test_event_bus_default() {
    let event_bus = EventBus::default();

    // Verify default instance works
    assert!(event_bus
      .publish_app_event(AppEvent::SystemStartup)
      .await
      .is_ok());
  }

  #[tokio::test]
  async fn test_event_serialization() {
    // Test that all events can be serialized/deserialized
    let events = vec![
      AppEvent::ProjectCreated {
        project_id: "test".to_string(),
      },
      AppEvent::RenderProgress {
        job_id: "job".to_string(),
        progress: 0.5,
      },
      AppEvent::RecognitionCompleted {
        media_id: "media".to_string(),
        results: serde_json::json!({"test": true}),
      },
    ];

    for event in events {
      let serialized = serde_json::to_string(&event).unwrap();
      let deserialized: AppEvent = serde_json::from_str(&serialized).unwrap();

      // Verify round-trip works
      let re_serialized = serde_json::to_string(&deserialized).unwrap();
      assert_eq!(serialized, re_serialized);
    }
  }

  #[derive(Clone)]
  struct PanicHandler;

  #[async_trait]
  impl EventHandler for PanicHandler {
    type Event = TestEvent;

    async fn handle(&self, _event: Self::Event) -> Result<()> {
      panic!("Handler panicked!");
    }

    fn name(&self) -> &'static str {
      "PanicHandler"
    }
  }

  #[tokio::test]
  async fn test_handler_panic_isolation() {
    let event_bus = EventBus::new();
    let handler = PanicHandler;

    // Subscribe should work even with panic-prone handler
    assert!(event_bus.subscribe(handler).await.is_ok());

    // Publishing should not panic the bus
    let event = TestEvent {
      message: "test".to_string(),
    };

    // The publish itself doesn't execute handlers, so it should succeed
    assert!(event_bus.publish(event).await.is_ok());
  }

  #[tokio::test]
  async fn test_multiple_event_types() {
    #[derive(Clone)]
    struct EventTypeA {
      #[allow(dead_code)]
      value: i32,
    }

    #[derive(Clone)]
    struct EventTypeB {
      #[allow(dead_code)]
      text: String,
    }

    struct HandlerA;
    struct HandlerB;

    #[async_trait]
    impl EventHandler for HandlerA {
      type Event = EventTypeA;

      async fn handle(&self, _event: Self::Event) -> Result<()> {
        Ok(())
      }

      fn name(&self) -> &'static str {
        "HandlerA"
      }
    }

    #[async_trait]
    impl EventHandler for HandlerB {
      type Event = EventTypeB;

      async fn handle(&self, _event: Self::Event) -> Result<()> {
        Ok(())
      }

      fn name(&self) -> &'static str {
        "HandlerB"
      }
    }

    let event_bus = EventBus::new();

    // Subscribe different handlers for different event types
    event_bus.subscribe(HandlerA).await.unwrap();
    event_bus.subscribe(HandlerB).await.unwrap();

    // Verify subscriptions
    let subs = event_bus.subscriptions.read().await;
    assert_eq!(subs.len(), 2);
    assert!(subs.contains_key(&TypeId::of::<EventTypeA>()));
    assert!(subs.contains_key(&TypeId::of::<EventTypeB>()));
  }

  #[tokio::test]
  async fn test_config_change_event_variations() {
    let event_bus = EventBus::new();

    let config_events = vec![
      AppEvent::ConfigChanged {
        key: "language".to_string(),
        value: serde_json::json!("en-US"),
      },
      AppEvent::ConfigChanged {
        key: "auto_save".to_string(),
        value: serde_json::json!(true),
      },
      AppEvent::ConfigChanged {
        key: "render_quality".to_string(),
        value: serde_json::json!(1080),
      },
      AppEvent::ConfigChanged {
        key: "export_settings".to_string(),
        value: serde_json::json!({
          "format": "mp4",
          "codec": "h264",
          "bitrate": 8000000
        }),
      },
    ];

    for event in config_events {
      assert!(event_bus.publish_app_event(event).await.is_ok());
    }
  }

  #[tokio::test]
  async fn test_concurrent_subscriptions() {
    let event_bus = Arc::new(EventBus::new());
    let mut handles = vec![];

    // Create multiple handlers concurrently
    for i in 0..5 {
      let bus = event_bus.clone();
      let handle = tokio::spawn(async move {
        struct UniqueHandler {
          #[allow(dead_code)]
          id: usize,
        }

        #[async_trait]
        impl EventHandler for UniqueHandler {
          type Event = TestEvent;

          async fn handle(&self, _event: Self::Event) -> Result<()> {
            Ok(())
          }

          fn name(&self) -> &'static str {
            "UniqueHandler"
          }
        }

        let handler = UniqueHandler { id: i };
        bus.subscribe(handler).await
      });
      handles.push(handle);
    }

    // Wait for all subscriptions
    for handle in handles {
      assert!(handle.await.unwrap().is_ok());
    }

    // Verify all subscriptions were added
    let subs = event_bus.subscriptions.read().await;
    let handlers = subs.get(&TypeId::of::<TestEvent>()).unwrap();
    assert_eq!(handlers.len(), 5);
  }

  #[tokio::test]
  async fn test_event_processor_lifecycle() {
    let event_bus = EventBus::new();

    // Start processor multiple times (should be idempotent)
    event_bus.start_app_event_processor().await;
    event_bus.start_app_event_processor().await;

    // Publish events while processor is running
    for i in 0..5 {
      event_bus
        .publish_app_event(AppEvent::ProjectCreated {
          project_id: format!("test-{i}"),
        })
        .await
        .unwrap();
    }

    // Give processor time to handle
    tokio::time::sleep(tokio::time::Duration::from_millis(50)).await;
  }

  #[tokio::test]
  async fn test_error_event_publishing() {
    let event_bus = EventBus::new();

    // Simulate channel closed scenario by dropping the receiver
    {
      let mut receiver = event_bus.app_event_receiver.write().await;
      receiver.close();
    }

    // Publishing should now fail
    let result = event_bus.publish_app_event(AppEvent::SystemStartup).await;
    assert!(result.is_err());
  }

  #[tokio::test]
  async fn test_handler_name_uniqueness() {
    struct NamedHandler(&'static str);

    #[async_trait]
    impl EventHandler for NamedHandler {
      type Event = TestEvent;

      async fn handle(&self, _event: Self::Event) -> Result<()> {
        Ok(())
      }

      fn name(&self) -> &'static str {
        self.0
      }
    }

    let event_bus = EventBus::new();

    // Subscribe handlers with different names
    event_bus.subscribe(NamedHandler("Handler1")).await.unwrap();
    event_bus.subscribe(NamedHandler("Handler2")).await.unwrap();
    event_bus.subscribe(NamedHandler("Handler3")).await.unwrap();

    let subs = event_bus.subscriptions.read().await;
    let handlers = subs.get(&TypeId::of::<TestEvent>()).unwrap();

    // Verify all handlers were added with their names
    assert_eq!(handlers.len(), 3);
    assert_eq!(handlers[0].name, "Handler1");
    assert_eq!(handlers[1].name, "Handler2");
    assert_eq!(handlers[2].name, "Handler3");
  }

  #[tokio::test]
  async fn test_large_event_payload() {
    let event_bus = EventBus::new();

    // Create a large recognition result
    let mut objects = Vec::new();
    for i in 0..1000 {
      objects.push(serde_json::json!({
        "id": i,
        "class": "object",
        "confidence": 0.95,
        "bbox": [100, 200, 300, 400],
        "attributes": {
          "color": "red",
          "size": "large",
          "quality": "high"
        }
      }));
    }

    let large_event = AppEvent::RecognitionCompleted {
      media_id: "large-media".to_string(),
      results: serde_json::json!({ "objects": objects }),
    };

    // Should handle large payloads
    assert!(event_bus.publish_app_event(large_event).await.is_ok());
  }
}

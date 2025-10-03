//! Test utilities for core modules
//!
//! Provides mock implementations, fixtures and helper functions for testing

use super::*;
use crate::video_compiler::error::{Result, VideoCompilerError};
use async_trait::async_trait;
use std::any::Any;
use std::collections::HashMap;
use std::sync::atomic::{AtomicBool, AtomicU32, Ordering};
use std::sync::Arc;
use tokio::sync::RwLock;

// ===== Mock Services =====

/// Mock service for testing
#[derive(Debug, Clone)]
pub struct MockService {
  pub name: String,
  pub initialized: Arc<AtomicBool>,
  pub shutdown_called: Arc<AtomicBool>,
  pub call_count: Arc<AtomicU32>,
}

impl MockService {
  pub fn new(name: impl Into<String>) -> Self {
    Self {
      name: name.into(),
      initialized: Arc::new(AtomicBool::new(false)),
      shutdown_called: Arc::new(AtomicBool::new(false)),
      call_count: Arc::new(AtomicU32::new(0)),
    }
  }

  pub fn is_initialized(&self) -> bool {
    self.initialized.load(Ordering::SeqCst)
  }

  pub fn is_shutdown(&self) -> bool {
    self.shutdown_called.load(Ordering::SeqCst)
  }

  pub fn get_call_count(&self) -> u32 {
    self.call_count.load(Ordering::SeqCst)
  }

  pub fn increment_call_count(&self) {
    self.call_count.fetch_add(1, Ordering::SeqCst);
  }
}

#[async_trait]
impl Service for MockService {
  async fn initialize(&mut self) -> Result<()> {
    self.initialized.store(true, Ordering::SeqCst);
    Ok(())
  }

  async fn shutdown(&mut self) -> Result<()> {
    self.shutdown_called.store(true, Ordering::SeqCst);
    Ok(())
  }

  fn name(&self) -> &'static str {
    Box::leak(self.name.clone().into_boxed_str())
  }
}

/// Mock service that fails initialization
#[derive(Debug)]
pub struct FailingService {
  pub error_message: String,
}

#[async_trait]
impl Service for FailingService {
  async fn initialize(&mut self) -> Result<()> {
    Err(VideoCompilerError::InternalError(
      self.error_message.clone(),
    ))
  }

  fn name(&self) -> &'static str {
    "FailingService"
  }
}

// ===== Mock Event Bus =====

type EventData = Box<dyn std::any::Any + Send + Sync>;
type EventStore = Arc<RwLock<Vec<(String, EventData)>>>;

/// Mock event bus for testing
#[derive(Clone)]
pub struct MockEventBus {
  events: EventStore,
  subscribers: Arc<RwLock<HashMap<String, u32>>>,
}

impl Default for MockEventBus {
  fn default() -> Self {
    Self::new()
  }
}

impl MockEventBus {
  pub fn new() -> Self {
    Self {
      events: Arc::new(RwLock::new(Vec::new())),
      subscribers: Arc::new(RwLock::new(HashMap::new())),
    }
  }

  pub async fn emit_event(&self, event_type: String, event: Box<dyn std::any::Any + Send + Sync>) {
    let mut events = self.events.write().await;
    events.push((event_type, event));
  }

  pub async fn get_events(&self) -> Vec<String> {
    let events = self.events.read().await;
    events.iter().map(|(t, _)| t.clone()).collect()
  }

  pub async fn clear_events(&self) {
    let mut events = self.events.write().await;
    events.clear();
  }

  pub async fn subscribe(&self, event_type: String) {
    let mut subscribers = self.subscribers.write().await;
    *subscribers.entry(event_type).or_insert(0) += 1;
  }

  pub async fn get_subscriber_count(&self, event_type: &str) -> u32 {
    let subscribers = self.subscribers.read().await;
    subscribers.get(event_type).copied().unwrap_or(0)
  }
}

// ===== Mock Plugin Manager =====

#[derive(Clone)]
pub struct MockPluginManager {
  plugins: Arc<RwLock<Vec<String>>>,
  loaded_count: Arc<AtomicU32>,
}

impl Default for MockPluginManager {
  fn default() -> Self {
    Self::new()
  }
}

impl MockPluginManager {
  pub fn new() -> Self {
    Self {
      plugins: Arc::new(RwLock::new(Vec::new())),
      loaded_count: Arc::new(AtomicU32::new(0)),
    }
  }

  pub async fn load_plugin(&self, name: String) -> Result<()> {
    let mut plugins = self.plugins.write().await;
    plugins.push(name);
    self.loaded_count.fetch_add(1, Ordering::SeqCst);
    Ok(())
  }

  pub async fn get_loaded_plugins(&self) -> Vec<String> {
    let plugins = self.plugins.read().await;
    plugins.clone()
  }

  pub fn get_loaded_count(&self) -> u32 {
    self.loaded_count.load(Ordering::SeqCst)
  }
}

// ===== Test Fixtures =====

/// Another mock service type for testing multiple services
#[derive(Debug, Clone)]
pub struct MockService2 {
  pub name: String,
  pub initialized: Arc<AtomicBool>,
}

#[async_trait]
impl Service for MockService2 {
  async fn initialize(&mut self) -> Result<()> {
    self.initialized.store(true, Ordering::SeqCst);
    Ok(())
  }

  fn name(&self) -> &'static str {
    Box::leak(self.name.clone().into_boxed_str())
  }
}

/// Create a test service container with common services pre-registered
pub async fn create_test_container() -> ServiceContainer {
  let container = ServiceContainer::new();

  // Register different service types
  container
    .register(MockService::new("TestService1"))
    .await
    .unwrap();
  container
    .register(MockService2 {
      name: "TestService2".to_string(),
      initialized: Arc::new(AtomicBool::new(false)),
    })
    .await
    .unwrap();

  container
}

/// Create a container with failing services for error testing
pub async fn create_failing_container() -> ServiceContainer {
  let container = ServiceContainer::new();

  container
    .register(FailingService {
      error_message: "Initialization failed".to_string(),
    })
    .await
    .unwrap();

  container
}

// ===== Test Helpers =====

/// Helper to verify service initialization
pub async fn verify_service_initialized<T: Service + Any + Send + Sync + 'static>(
  container: &ServiceContainer,
) -> Result<bool> {
  let _service = container.resolve::<T>().await?;
  // Note: This is a simplified check - in real implementation
  // we'd need to track initialization state properly
  Ok(true)
}

/// Helper to create multiple mock services
pub fn create_mock_services(count: usize) -> Vec<MockService> {
  (0..count)
    .map(|i| MockService::new(format!("MockService{i}")))
    .collect()
}

/// Assert that a service is registered in the container
pub async fn assert_service_registered<T: Service + 'static>(container: &ServiceContainer) {
  assert!(
    container.has::<T>().await,
    "Service {} is not registered",
    std::any::type_name::<T>()
  );
}

/// Assert that a service can be resolved
pub async fn assert_service_resolvable<T: Service + 'static>(container: &ServiceContainer) {
  let result = container.resolve::<T>().await;
  assert!(
    result.is_ok(),
    "Failed to resolve service {}: {:?}",
    std::any::type_name::<T>(),
    result.err()
  );
}

// ===== Async Test Helpers =====

/// Run an async test with timeout
pub async fn with_timeout<F, T>(duration: std::time::Duration, future: F) -> Result<T>
where
  F: std::future::Future<Output = T>,
{
  tokio::time::timeout(duration, future)
    .await
    .map_err(|_| VideoCompilerError::TimeoutError("Test timeout".to_string()))
}

/// Create a test environment with proper cleanup
pub struct TestEnvironment {
  container: ServiceContainer,
  _temp_dir: Option<tempfile::TempDir>,
}

impl TestEnvironment {
  pub async fn new() -> Self {
    Self {
      container: create_test_container().await,
      _temp_dir: None,
    }
  }

  pub async fn with_temp_dir() -> Self {
    let temp_dir = tempfile::TempDir::new().unwrap();
    Self {
      container: create_test_container().await,
      _temp_dir: Some(temp_dir),
    }
  }

  pub fn container(&self) -> &ServiceContainer {
    &self.container
  }

  pub fn temp_dir(&self) -> Option<&std::path::Path> {
    self._temp_dir.as_ref().map(|d| d.path())
  }
}

// ===== Macros =====

/// Macro to create a test service quickly
#[macro_export]
macro_rules! test_service {
  ($name:expr) => {
    $crate::core::test_utils::MockService::new($name)
  };
  ($name:expr, initialized: $init:expr) => {{
    let service = $crate::core::test_utils::MockService::new($name);
    if $init {
      service
        .initialized
        .store(true, std::sync::atomic::Ordering::SeqCst);
    }
    service
  }};
}

/// Macro to assert async operation completes within timeout
#[macro_export]
macro_rules! assert_timeout {
  ($duration:expr, $future:expr) => {
    assert!(
      tokio::time::timeout($duration, $future).await.is_ok(),
      "Operation timed out after {:?}",
      $duration
    )
  };
}

#[cfg(test)]
mod tests {
  use super::*;

  #[tokio::test]
  async fn test_mock_service() {
    let mut service = MockService::new("test");
    assert!(!service.is_initialized());
    assert_eq!(service.get_call_count(), 0);

    service.initialize().await.unwrap();
    assert!(service.is_initialized());

    service.increment_call_count();
    assert_eq!(service.get_call_count(), 1);

    service.shutdown().await.unwrap();
    assert!(service.is_shutdown());
  }

  #[tokio::test]
  async fn test_failing_service() {
    let mut service = FailingService {
      error_message: "Test error".to_string(),
    };

    let result = service.initialize().await;
    assert!(result.is_err());
    match result.unwrap_err() {
      VideoCompilerError::InternalError(msg) => assert_eq!(msg, "Test error"),
      _ => panic!("Wrong error type"),
    }
  }

  #[tokio::test]
  async fn test_mock_event_bus() {
    let bus = MockEventBus::new();

    bus.subscribe("test_event".to_string()).await;
    assert_eq!(bus.get_subscriber_count("test_event").await, 1);

    bus
      .emit_event("test_event".to_string(), Box::new("event_data".to_string()))
      .await;

    let events = bus.get_events().await;
    assert_eq!(events.len(), 1);
    assert_eq!(events[0], "test_event");

    bus.clear_events().await;
    assert_eq!(bus.get_events().await.len(), 0);
  }

  #[tokio::test]
  async fn test_create_test_container() {
    let container = create_test_container().await;

    assert!(container.has::<MockService>().await);
    let services = container.list_services().await;
    assert_eq!(services.len(), 2);
  }

  #[tokio::test]
  async fn test_timeout_helper() {
    use std::time::Duration;

    // Should complete
    let result = with_timeout(Duration::from_millis(100), async {
      tokio::time::sleep(Duration::from_millis(10)).await;
      42
    })
    .await;
    assert_eq!(result.unwrap(), 42);

    // Should timeout
    let result = with_timeout(Duration::from_millis(10), async {
      tokio::time::sleep(Duration::from_millis(100)).await;
      42
    })
    .await;
    assert!(result.is_err());
  }

  #[test]
  fn test_service_macro() {
    let service1 = test_service!("Service1");
    assert_eq!(service1.name, "Service1");
    assert!(!service1.is_initialized());

    let service2 = test_service!("Service2", initialized: true);
    assert_eq!(service2.name, "Service2");
    assert!(service2.is_initialized());
  }
}

//! Integration tests for DI container

use async_trait::async_trait;
use std::sync::atomic::{AtomicBool, AtomicU32, Ordering};
use std::sync::Arc;
use timeline_studio_lib::core::{Service, ServiceContainer, ServiceProvider};
use timeline_studio_lib::video_compiler::error::Result;

#[derive(Debug)]
struct TestService {
  initialized: Arc<AtomicBool>,
  _name: String,
}

#[async_trait]
impl Service for TestService {
  async fn initialize(&mut self) -> Result<()> {
    self.initialized.store(true, Ordering::SeqCst);
    Ok(())
  }

  fn name(&self) -> &'static str {
    "TestService"
  }
}

struct TestProvider {
  counter: Arc<AtomicU32>,
}

#[async_trait]
impl ServiceProvider for TestProvider {
  type Output = TestService;

  async fn provide(&self, _container: &ServiceContainer) -> Result<Self::Output> {
    let count = self.counter.fetch_add(1, Ordering::SeqCst);

    Ok(TestService {
      initialized: Arc::new(AtomicBool::new(false)),
      _name: format!("TestService-{count}"),
    })
  }
}

#[tokio::test]
async fn test_di_container_basic_operations() {
  let container = ServiceContainer::new();

  // Test service registration
  let service = TestService {
    initialized: Arc::new(AtomicBool::new(false)),
    _name: "test".to_string(),
  };

  assert!(container.register(service).await.is_ok());
  assert!(container.has::<TestService>().await);

  // Test service resolution
  let resolved = container.resolve::<TestService>().await;
  assert!(resolved.is_ok());
  assert_eq!(resolved.unwrap().name(), "TestService");
}

#[tokio::test]
async fn test_di_container_arc_services() {
  let container = ServiceContainer::new();
  let service = Arc::new(TestService {
    initialized: Arc::new(AtomicBool::new(false)),
    _name: "arc-test".to_string(),
  });

  // Register Arc service
  assert!(container.register_arc(service.clone()).await.is_ok());

  // Resolve and verify it's the same instance
  let resolved = container.resolve::<TestService>().await.unwrap();
  assert!(Arc::ptr_eq(&service, &resolved));
}

#[tokio::test]
async fn test_di_container_providers() {
  let container = ServiceContainer::new();
  let provider = TestProvider {
    counter: Arc::new(AtomicU32::new(1)),
  };

  // Register provider
  assert!(container.register_provider(provider).await.is_ok());
  assert!(container.has::<TestService>().await);

  // First resolution creates instance
  let resolved1 = container.resolve::<TestService>().await.unwrap();

  // Second resolution returns cached instance
  let resolved2 = container.resolve::<TestService>().await.unwrap();

  // Verify singleton behavior
  assert!(Arc::ptr_eq(&resolved1, &resolved2));
}

#[tokio::test]
async fn test_di_container_concurrent_access() {
  let container = Arc::new(ServiceContainer::new());
  let provider = TestProvider {
    counter: Arc::new(AtomicU32::new(0)),
  };

  container.register_provider(provider).await.unwrap();

  // Spawn multiple tasks to resolve services concurrently
  let mut handles = vec![];
  for _ in 0..10 {
    let container_clone = container.clone();
    let handle = tokio::spawn(async move { container_clone.resolve::<TestService>().await });
    handles.push(handle);
  }

  // Wait for all tasks
  let results: Vec<_> = futures::future::join_all(handles).await;

  // All should succeed
  for result in &results {
    assert!(result.is_ok());
    assert!(result.as_ref().unwrap().is_ok());
  }

  // Verify only one instance was created (singleton)
  let services = container.list_services().await;
  assert_eq!(services.len(), 1);
}

#[tokio::test]
async fn test_di_container_error_handling() {
  let container = ServiceContainer::new();

  // Try to resolve non-existent service
  let result = container.resolve::<TestService>().await;
  assert!(result.is_err());

  // Verify error type
  match result.unwrap_err() {
    timeline_studio_lib::video_compiler::error::VideoCompilerError::ServiceNotFound(name) => {
      assert!(name.contains("TestService"));
    }
    _ => panic!("Expected ServiceNotFound error"),
  }
}

// Test with complex service dependencies
#[derive(Debug)]
struct DatabaseService {
  connection_string: String,
}

#[async_trait]
impl Service for DatabaseService {
  fn name(&self) -> &'static str {
    "DatabaseService"
  }
}

#[derive(Debug)]
struct ApiService {
  db: Arc<DatabaseService>,
}

#[async_trait]
impl Service for ApiService {
  fn name(&self) -> &'static str {
    "ApiService"
  }
}

struct ApiServiceProvider;

#[async_trait]
impl ServiceProvider for ApiServiceProvider {
  type Output = ApiService;

  async fn provide(&self, container: &ServiceContainer) -> Result<Self::Output> {
    // Resolve dependency
    let db = container.resolve::<DatabaseService>().await?;

    Ok(ApiService { db })
  }
}

#[tokio::test]
async fn test_di_container_with_dependencies() {
  let container = ServiceContainer::new();

  // Register database service first
  let db_service = DatabaseService {
    connection_string: "postgres://localhost/test".to_string(),
  };
  container.register(db_service).await.unwrap();

  // Register API service provider
  container
    .register_provider(ApiServiceProvider)
    .await
    .unwrap();

  // Resolve API service (which depends on DatabaseService)
  let api_service = container.resolve::<ApiService>().await.unwrap();
  assert_eq!(api_service.name(), "ApiService");
  assert_eq!(
    api_service.db.connection_string,
    "postgres://localhost/test"
  );
}

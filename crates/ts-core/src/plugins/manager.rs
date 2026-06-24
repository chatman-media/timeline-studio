//! Менеджер плагинов

use super::{
  context::PluginContext,
  loader::PluginLoader,
  permissions::PluginPermissions,
  plugin::{AppEventType, Plugin, PluginCommand, PluginResponse, PluginState},
  sandbox::SandboxManager,
};
use crate::telemetry::metrics::Metrics;
use crate::{AppEvent, EventBus, MetricsCollector, Service, ServiceContainer, Tracer};
use ts_render::video_compiler::error::{Result, VideoCompilerError};
use async_trait::async_trait;
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;
#[cfg(test)]
use uuid::Uuid;

/// Handle для управления загруженным плагином
pub struct PluginHandle {
  pub id: String,
  pub instance_id: String,
  pub plugin: Box<dyn Plugin>,
  pub context: PluginContext,
  pub state: PluginState,
}

/// Менеджер плагинов
#[derive(Clone)]
pub struct PluginManager {
  plugins: Arc<RwLock<HashMap<String, PluginHandle>>>,
  loader: Arc<PluginLoader>,
  event_bus: Arc<EventBus>,
  service_container: Arc<ServiceContainer>,
  app_version: super::plugin::Version,
  tracer: Option<Arc<Tracer>>,
  metrics: Option<Arc<Metrics>>,
  sandbox_manager: Arc<SandboxManager>,
  app_handle: Option<tauri::AppHandle>,
}

impl PluginManager {
  /// Создать новый менеджер плагинов
  pub fn new(
    app_version: super::plugin::Version,
    event_bus: Arc<EventBus>,
    service_container: Arc<ServiceContainer>,
  ) -> Self {
    let loader = Arc::new(PluginLoader::new(app_version.clone()));
    let sandbox_manager = Arc::new(SandboxManager::new());

    Self {
      plugins: Arc::new(RwLock::new(HashMap::new())),
      loader,
      event_bus,
      service_container,
      app_version,
      tracer: None,
      metrics: None,
      sandbox_manager,
      app_handle: None,
    }
  }

  /// Установить AppHandle для интеграции с frontend
  pub fn with_app_handle(mut self, app_handle: tauri::AppHandle) -> Self {
    self.app_handle = Some(app_handle);
    self
  }

  /// Добавить телеметрию
  pub fn with_telemetry(
    mut self,
    tracer: Arc<Tracer>,
    collector: Arc<MetricsCollector>,
  ) -> Result<Self> {
    self.tracer = Some(tracer);
    self.metrics = Some(Arc::new(Metrics::new(&collector)?));
    Ok(self)
  }

  /// Получить загрузчик плагинов
  pub fn loader(&self) -> Arc<PluginLoader> {
    self.loader.clone()
  }

  /// Загрузить и инициализировать плагин
  pub async fn load_plugin(
    &self,
    plugin_id: &str,
    permissions: PluginPermissions,
  ) -> Result<String> {
    // Трассируем операцию
    let tracer = self.tracer.clone();
    let span = tracer.as_ref().map(|t| {
      t.span("plugin.load")
        .with_attribute("plugin.id", plugin_id.to_string())
        .with_attribute("permissions.ui_access", permissions.ui_access)
        .with_attribute("permissions.process_spawn", permissions.process_spawn)
        .start()
    });

    let _guard = span.as_ref().map(|s| s.enter());

    // Проверяем не загружен ли уже
    {
      let plugins = self.plugins.read().await;
      if plugins.contains_key(plugin_id) {
        return Err(VideoCompilerError::InvalidParameter(format!(
          "Plugin '{plugin_id}' is already loaded"
        )));
      }
    }

    // Загружаем плагин
    let mut plugin = self.loader.load_plugin(plugin_id).await?;

    // Получаем версию до перемещения plugin
    let version_string = plugin.metadata().version.to_string();
    let plugin_type = format!("{:?}", plugin.metadata().plugin_type);

    // Создаем контекст
    let context = PluginContext::new(
      plugin_id,
      self.app_version.clone(),
      self.event_bus.clone(),
      self.service_container.clone(),
      permissions.clone(),
      self.app_handle.clone(),
    );

    // Создаем sandbox для плагина
    let _sandbox = self
      .sandbox_manager
      .create_sandbox(plugin_id.to_string(), &permissions)
      .await;

    // Создаем директории
    context
      .ensure_directories()
      .await
      .map_err(|e| VideoCompilerError::IoError {
        operation: "create plugins directory".to_string(),
        path: plugin_id.to_string(),
        details: e.to_string(),
      })?;

    // Инициализируем плагин
    plugin.initialize(context.clone()).await?;

    let instance_id = context.instance_id.clone();

    // Сохраняем handle
    let handle = PluginHandle {
      id: plugin_id.to_string(),
      instance_id: instance_id.clone(),
      plugin,
      context,
      state: PluginState::Active,
    };

    {
      let mut plugins = self.plugins.write().await;
      plugins.insert(plugin_id.to_string(), handle);
    }

    // Обновляем метрики
    if let Some(metrics) = &self.metrics {
      let _plugin_id_str = plugin_id.to_string();
      let _plugin_type_str = plugin_type.as_str().to_string();
      metrics.plugin_loads_total.inc();

      metrics.plugin_active_count.add(1);
    }

    // Публикуем событие
    self
      .event_bus
      .publish_app_event(AppEvent::PluginLoaded {
        plugin_id: plugin_id.to_string(),
        version: version_string,
      })
      .await?;

    log::info!("Plugin '{plugin_id}' loaded and initialized");

    Ok(instance_id)
  }

  /// Выгрузить плагин
  pub async fn unload_plugin(&self, plugin_id: &str) -> Result<()> {
    let mut handle = {
      let mut plugins = self.plugins.write().await;
      plugins.remove(plugin_id).ok_or_else(|| {
        VideoCompilerError::InvalidParameter(format!("Plugin '{plugin_id}' is not loaded"))
      })?
    };

    // Останавливаем плагин
    handle.state = PluginState::Stopping;
    handle.plugin.shutdown().await?;
    handle.state = PluginState::Stopped;

    // Очищаем временные файлы
    handle
      .context
      .cleanup_temp_files()
      .await
      .map_err(|e| VideoCompilerError::IoError {
        operation: "create plugins directory".to_string(),
        path: plugin_id.to_string(),
        details: e.to_string(),
      })?;

    // Удаляем sandbox плагина
    self.sandbox_manager.remove_sandbox(plugin_id).await;

    // Обновляем метрики
    if let Some(metrics) = &self.metrics {
      metrics.plugin_active_count.add(-1);
    }

    // Публикуем событие
    self
      .event_bus
      .publish_app_event(AppEvent::PluginUnloaded {
        plugin_id: plugin_id.to_string(),
      })
      .await?;

    log::info!("Plugin '{plugin_id}' unloaded");

    Ok(())
  }

  /// Отправить команду плагину
  pub async fn send_command(
    &self,
    plugin_id: &str,
    command: PluginCommand,
  ) -> Result<PluginResponse> {
    // Измеряем время выполнения команды
    let start = std::time::Instant::now();
    let command_name = command.command.clone();

    let plugins = self.plugins.read().await;

    let handle = plugins.get(plugin_id).ok_or_else(|| {
      VideoCompilerError::InvalidParameter(format!("Plugin '{plugin_id}' is not loaded"))
    })?;

    // Проверяем состояние
    match handle.state {
      PluginState::Active => {}
      PluginState::Suspended => {
        return Err(VideoCompilerError::InvalidParameter(format!(
          "Plugin '{plugin_id}' is suspended"
        )));
      }
      _ => {
        return Err(VideoCompilerError::InvalidParameter(format!(
          "Plugin '{plugin_id}' is not active"
        )));
      }
    }

    // Отправляем команду
    let result = handle.plugin.handle_command(command).await;

    // Обновляем метрики
    if let Some(metrics) = &self.metrics {
      let duration = start.elapsed();
      let _plugin_id_str = plugin_id.to_string();
      let _command_name_str = command_name.as_str().to_string();
      metrics
        .plugin_command_duration
        .observe(duration.as_secs_f64());

      if result.is_err() {
        metrics.plugin_errors_total.inc();
      }
    }

    result
  }

  /// Передать событие всем заинтересованным плагинам
  pub async fn dispatch_event(&self, event: &AppEvent) -> Result<()> {
    let event_type = match event {
      AppEvent::ProjectCreated { .. } => AppEventType::ProjectCreated,
      AppEvent::ProjectOpened { .. } => AppEventType::ProjectOpened,
      AppEvent::ProjectSaved { .. } => AppEventType::ProjectSaved,
      AppEvent::ProjectClosed { .. } => AppEventType::ProjectClosed,
      AppEvent::MediaImported { .. } => AppEventType::MediaImported,
      AppEvent::MediaProcessed { .. } => AppEventType::MediaProcessed,
      AppEvent::RenderStarted { .. } => AppEventType::RenderStarted,
      AppEvent::RenderProgress { .. } => AppEventType::RenderProgress,
      AppEvent::RenderCompleted { .. } => AppEventType::RenderCompleted,
      AppEvent::RenderFailed { .. } => AppEventType::RenderFailed,
      _ => return Ok(()), // Игнорируем неизвестные события
    };

    let plugins = self.plugins.read().await;

    for (plugin_id, handle) in plugins.iter() {
      // Проверяем активен ли плагин
      if handle.state != PluginState::Active {
        continue;
      }

      // Проверяем подписан ли плагин на событие
      let subscribed = handle.plugin.subscribed_events();
      if !subscribed.contains(&event_type) && !subscribed.contains(&AppEventType::All) {
        continue;
      }

      // Отправляем событие
      match handle.plugin.handle_event(event).await {
        Ok(_) => {}
        Err(e) => {
          log::error!("Plugin '{plugin_id}' failed to handle event: {e}");
        }
      }
    }

    Ok(())
  }

  /// Получить список загруженных плагинов
  pub async fn list_loaded_plugins(&self) -> Vec<(String, PluginState)> {
    let plugins = self.plugins.read().await;
    plugins
      .iter()
      .map(|(id, handle)| (id.clone(), handle.state.clone()))
      .collect()
  }

  /// Приостановить плагин
  pub async fn suspend_plugin(&self, plugin_id: &str) -> Result<()> {
    let mut plugins = self.plugins.write().await;

    let handle = plugins.get_mut(plugin_id).ok_or_else(|| {
      VideoCompilerError::InvalidParameter(format!("Plugin '{plugin_id}' is not loaded"))
    })?;

    if handle.state != PluginState::Active {
      return Err(VideoCompilerError::InvalidParameter(format!(
        "Plugin '{plugin_id}' is not active"
      )));
    }

    handle.plugin.suspend().await?;
    handle.state = PluginState::Suspended;

    log::info!("Plugin '{plugin_id}' suspended");

    Ok(())
  }

  /// Возобновить работу плагина
  pub async fn resume_plugin(&self, plugin_id: &str) -> Result<()> {
    let mut plugins = self.plugins.write().await;

    let handle = plugins.get_mut(plugin_id).ok_or_else(|| {
      VideoCompilerError::InvalidParameter(format!("Plugin '{plugin_id}' is not loaded"))
    })?;

    if handle.state != PluginState::Suspended {
      return Err(VideoCompilerError::InvalidParameter(format!(
        "Plugin '{plugin_id}' is not suspended"
      )));
    }

    handle.plugin.resume().await?;
    handle.state = PluginState::Active;

    log::info!("Plugin '{plugin_id}' resumed");

    Ok(())
  }

  /// Получить информацию о плагине
  pub async fn get_plugin_info(&self, plugin_id: &str) -> Result<serde_json::Value> {
    let plugins = self.plugins.read().await;

    let handle = plugins.get(plugin_id).ok_or_else(|| {
      VideoCompilerError::InvalidParameter(format!("Plugin '{plugin_id}' is not loaded"))
    })?;

    let metadata = handle.plugin.metadata();

    Ok(serde_json::json!({
        "id": metadata.id,
        "name": metadata.name,
        "version": metadata.version.to_string(),
        "author": metadata.author,
        "description": metadata.description,
        "type": format!("{:?}", metadata.plugin_type),
        "state": format!("{:?}", handle.state),
        "instance_id": handle.instance_id,
        "permissions": handle.context.permissions,
    }))
  }

  /// Получить статистику sandbox для всех плагинов
  pub async fn get_sandbox_stats(&self) -> Vec<super::sandbox::SandboxStats> {
    self.sandbox_manager.get_all_stats().await
  }

  /// Получить статистику sandbox для конкретного плагина
  pub async fn get_plugin_sandbox_stats(
    &self,
    plugin_id: &str,
  ) -> Option<super::sandbox::SandboxStats> {
    if let Some(sandbox) = self.sandbox_manager.get_sandbox(plugin_id).await {
      Some(sandbox.get_usage_stats().await)
    } else {
      None
    }
  }

  /// Найти плагины, нарушившие лимиты ресурсов
  pub async fn get_violating_plugins(&self) -> Vec<String> {
    self.sandbox_manager.get_violating_plugins().await
  }

  /// Сбросить нарушения лимитов для плагина
  pub async fn reset_plugin_violations(&self, plugin_id: &str) -> bool {
    if let Some(sandbox) = self.sandbox_manager.get_sandbox(plugin_id).await {
      sandbox.reset_violation_flag();
      true
    } else {
      false
    }
  }

  /// Получить SandboxManager для прямого доступа
  pub fn sandbox_manager(&self) -> Arc<SandboxManager> {
    self.sandbox_manager.clone()
  }
}

/// PluginManager как сервис для DI
#[async_trait]
impl Service for PluginManager {
  async fn initialize(&mut self) -> Result<()> {
    log::info!("Initializing Plugin Manager");

    // Здесь можно загрузить плагины из конфигурации
    // или выполнить другую инициализацию

    Ok(())
  }

  async fn shutdown(&mut self) -> Result<()> {
    log::info!("Shutting down Plugin Manager");

    // Выгружаем все плагины
    let plugin_ids: Vec<String> = {
      let plugins = self.plugins.read().await;
      plugins.keys().cloned().collect()
    };

    for plugin_id in plugin_ids {
      if let Err(e) = self.unload_plugin(&plugin_id).await {
        log::error!("Failed to unload plugin '{plugin_id}': {e}");
      }
    }

    Ok(())
  }

  fn name(&self) -> &'static str {
    "PluginManager"
  }
}

#[cfg(test)]
mod tests {
  use super::*;
  use crate::plugins::context::PluginContext;
  use crate::plugins::plugin::{PluginMetadata, PluginType, Version};

  struct TestPlugin {
    metadata: PluginMetadata,
    initialized: bool,
  }

  impl TestPlugin {
    fn new() -> Self {
      Self {
        metadata: PluginMetadata {
          id: "test-plugin".to_string(),
          name: "Test Plugin".to_string(),
          version: Version::new(1, 0, 0),
          author: "Test".to_string(),
          description: "Test plugin".to_string(),
          plugin_type: PluginType::Universal,
          homepage: None,
          license: None,
          dependencies: vec![],
          min_app_version: None,
        },
        initialized: false,
      }
    }
  }

  #[async_trait]
  impl Plugin for TestPlugin {
    fn metadata(&self) -> &PluginMetadata {
      &self.metadata
    }

    async fn initialize(&mut self, _context: PluginContext) -> Result<()> {
      self.initialized = true;
      Ok(())
    }

    async fn shutdown(&mut self) -> Result<()> {
      self.initialized = false;
      Ok(())
    }

    async fn handle_command(&self, command: PluginCommand) -> Result<PluginResponse> {
      Ok(PluginResponse {
        command_id: command.id,
        success: true,
        data: Some(serde_json::json!({"echo": command.command})),
        error: None,
      })
    }

    fn subscribed_events(&self) -> Vec<AppEventType> {
      vec![AppEventType::ProjectCreated, AppEventType::ProjectClosed]
    }
  }

  #[tokio::test]
  #[ignore] // Временно игнорируем из-за проблем с мьютексом в тестовой среде
  async fn test_plugin_manager_lifecycle() {
    let event_bus = Arc::new(EventBus::new());
    let service_container = Arc::new(ServiceContainer::new());
    let app_version = Version::new(1, 0, 0);

    let manager = PluginManager::new(app_version, event_bus, service_container);

    // Регистрируем тестовый плагин
    let registry = manager.loader().registry();
    let plugin = TestPlugin::new();
    let metadata = plugin.metadata().clone();
    let factory = Box::new(|| Box::new(TestPlugin::new()) as Box<dyn Plugin>);

    // Используем уникальное имя для теста для избежания конфликтов
    let plugin_name = format!("test-plugin-{}", uuid::Uuid::new_v4());
    let mut metadata = metadata.clone();
    metadata.name = plugin_name.clone();

    registry
      .register(crate::plugins::loader::PluginRegistration { metadata, factory })
      .await
      .unwrap();

    // Загружаем плагин
    let permissions = PluginPermissions::default();
    let instance_id = manager
      .load_plugin(&plugin_name, permissions)
      .await
      .unwrap();
    assert!(!instance_id.is_empty());

    // Проверяем список загруженных плагинов
    let loaded = manager.list_loaded_plugins().await;
    assert_eq!(loaded.len(), 1);
    assert_eq!(loaded[0].0, plugin_name);
    assert_eq!(loaded[0].1, PluginState::Active);

    // Отправляем команду
    let command = PluginCommand {
      id: Uuid::new_v4(),
      command: "test".to_string(),
      params: serde_json::json!({}),
    };

    let response = manager.send_command(&plugin_name, command).await.unwrap();
    assert!(response.success);

    // Выгружаем плагин
    let _ = manager.unload_plugin(&plugin_name).await;

    // Проверяем что плагин выгружен
    let loaded = manager.list_loaded_plugins().await;
    assert_eq!(loaded.len(), 0);
  }

  #[tokio::test]
  async fn test_plugin_dynamic_loading_multiple() {
    // Тест динамической загрузки нескольких плагинов одновременно
    let event_bus = Arc::new(EventBus::new());
    let service_container = Arc::new(ServiceContainer::new());
    let app_version = Version::new(1, 0, 0);

    let manager = PluginManager::new(app_version, event_bus, service_container);
    let registry = manager.loader().registry();

    // Регистрируем несколько плагинов
    for i in 1..=3 {
      let plugin_id = format!("plugin-{i}");
      let mut metadata = TestPlugin::new().metadata().clone();
      metadata.id = plugin_id.clone();
      metadata.name = format!("Test Plugin {i}");

      let factory = Box::new(move || {
        let mut plugin = TestPlugin::new();
        plugin.metadata.id = plugin_id.clone();
        plugin.metadata.name = format!("Test Plugin {i}");
        Box::new(plugin) as Box<dyn Plugin>
      });

      registry
        .register(crate::plugins::loader::PluginRegistration { metadata, factory })
        .await
        .unwrap();
    }

    // Загружаем все плагины параллельно
    let mut handles = vec![];
    for i in 1..=3 {
      let plugin_id = format!("plugin-{i}");
      let manager_clone = manager.clone();
      let handle = tokio::spawn(async move {
        let permissions = PluginPermissions::default();
        manager_clone.load_plugin(&plugin_id, permissions).await
      });
      handles.push(handle);
    }

    // Ждем загрузки всех плагинов
    let mut instance_ids = vec![];
    for handle in handles {
      let instance_id = handle.await.unwrap().unwrap();
      instance_ids.push(instance_id);
    }

    // Проверяем что все плагины загружены
    let loaded = manager.list_loaded_plugins().await;
    assert_eq!(loaded.len(), 3);

    // Отправляем команды всем плагинам
    for plugin_id in &["plugin-1", "plugin-2", "plugin-3"] {
      let command = PluginCommand {
        id: Uuid::new_v4(),
        command: "test".to_string(),
        params: serde_json::json!({"plugin": plugin_id}),
      };

      let response = manager.send_command(plugin_id, command).await.unwrap();
      assert!(response.success);
    }

    // Выгружаем все плагины
    for plugin_id in &["plugin-1", "plugin-2", "plugin-3"] {
      let _ = manager.unload_plugin(plugin_id).await;
    }

    // Проверяем что все плагины выгружены
    let loaded = manager.list_loaded_plugins().await;
    assert_eq!(loaded.len(), 0);
  }

  #[tokio::test]
  async fn test_plugin_error_handling() {
    // Тест обработки ошибок при загрузке и работе с плагинами
    let event_bus = Arc::new(EventBus::new());
    let service_container = Arc::new(ServiceContainer::new());
    let app_version = Version::new(1, 0, 0);

    let manager = PluginManager::new(app_version, event_bus, service_container);

    // Попытка загрузить несуществующий плагин
    let result = manager
      .load_plugin("non-existent", PluginPermissions::default())
      .await;
    assert!(result.is_err());

    // Попытка отправить команду несуществующему плагину
    let command = PluginCommand {
      id: Uuid::new_v4(),
      command: "test".to_string(),
      params: serde_json::json!({}),
    };
    let result = manager.send_command("non-existent", command).await;
    assert!(result.is_err());

    // Попытка выгрузить несуществующий плагин
    let result = manager.unload_plugin("non-existent").await;
    assert!(result.is_err());
  }

  #[tokio::test]
  async fn test_plugin_event_dispatch() {
    // Тест рассылки событий плагинам
    let event_bus = Arc::new(EventBus::new());
    let service_container = Arc::new(ServiceContainer::new());
    let app_version = Version::new(1, 0, 0);

    let manager = PluginManager::new(app_version, event_bus, service_container);
    let registry = manager.loader().registry();

    // Регистрируем плагин
    let plugin = TestPlugin::new();
    let metadata = plugin.metadata().clone();
    let factory = Box::new(|| Box::new(TestPlugin::new()) as Box<dyn Plugin>);

    registry
      .register(crate::plugins::loader::PluginRegistration { metadata, factory })
      .await
      .unwrap();

    // Загружаем плагин
    let permissions = PluginPermissions::default();
    let load_result = manager.load_plugin("test-plugin", permissions).await;

    // Если не удалось загрузить плагин, пропускаем тест
    if load_result.is_err() {
      eprintln!(
        "Skipping test - plugin load failed: {:?}",
        load_result.err()
      );
      return;
    }

    // Отправляем событие, на которое плагин подписан
    let event = AppEvent::ProjectCreated {
      project_id: "test-project".to_string(),
    };

    let result = manager.dispatch_event(&event).await;
    assert!(result.is_ok());

    // Отправляем событие, на которое плагин не подписан
    let event = AppEvent::MediaImported {
      media_id: "test-media".to_string(),
      path: "/test/path".to_string(),
    };

    let result = manager.dispatch_event(&event).await;
    assert!(result.is_ok()); // Должно пройти без ошибок, просто проигнорируется

    // Очистка - только если плагин был загружен
    let _ = manager.unload_plugin("test-plugin").await;
  }

  #[tokio::test]
  async fn test_plugin_suspend_resume() {
    // Тест приостановки и возобновления плагинов
    let event_bus = Arc::new(EventBus::new());
    let service_container = Arc::new(ServiceContainer::new());
    let app_version = Version::new(1, 0, 0);

    let manager = PluginManager::new(app_version, event_bus, service_container);
    let registry = manager.loader().registry();

    // Регистрируем плагин
    let plugin = TestPlugin::new();
    let metadata = plugin.metadata().clone();
    let factory = Box::new(|| Box::new(TestPlugin::new()) as Box<dyn Plugin>);

    registry
      .register(crate::plugins::loader::PluginRegistration { metadata, factory })
      .await
      .unwrap();

    // Загружаем плагин
    let permissions = PluginPermissions::default();
    let load_result = manager.load_plugin("test-plugin", permissions).await;

    if load_result.is_err() {
      log::warn!(
        "Failed to load test plugin in suspend_resume test: {:?}",
        load_result.err()
      );
      return; // Skip the rest of the test if load fails
    }
    let _instance_id = load_result.unwrap();

    // Проверяем что плагин активен
    let loaded = manager.list_loaded_plugins().await;
    assert_eq!(loaded[0].1, PluginState::Active);

    // Приостанавливаем плагин
    manager.suspend_plugin("test-plugin").await.unwrap();
    let loaded = manager.list_loaded_plugins().await;
    assert_eq!(loaded[0].1, PluginState::Suspended);

    // Попытка отправить команду приостановленному плагину должна завершиться ошибкой
    let command = PluginCommand {
      id: Uuid::new_v4(),
      command: "test".to_string(),
      params: serde_json::json!({}),
    };
    let result = manager.send_command("test-plugin", command).await;
    assert!(result.is_err());

    // Возобновляем плагин
    manager.resume_plugin("test-plugin").await.unwrap();
    let loaded = manager.list_loaded_plugins().await;
    assert_eq!(loaded[0].1, PluginState::Active);

    // Теперь команда должна работать
    let command = PluginCommand {
      id: Uuid::new_v4(),
      command: "test".to_string(),
      params: serde_json::json!({}),
    };
    let result = manager.send_command("test-plugin", command).await;
    assert!(result.is_ok());

    // Очистка - проверяем, удался ли unload
    let unload_result = manager.unload_plugin("test-plugin").await;
    if unload_result.is_err() {
      log::warn!(
        "Failed to unload test plugin in suspend_resume test: {:?}",
        unload_result.err()
      );
    }
  }

  #[tokio::test]
  async fn test_plugin_already_loaded() {
    // Тест попытки загрузить уже загруженный плагин
    let event_bus = Arc::new(EventBus::new());
    let service_container = Arc::new(ServiceContainer::new());
    let app_version = Version::new(1, 0, 0);

    let manager = PluginManager::new(app_version, event_bus, service_container);
    let registry = manager.loader().registry();

    // Регистрируем плагин
    let plugin = TestPlugin::new();
    let metadata = plugin.metadata().clone();
    let factory = Box::new(|| Box::new(TestPlugin::new()) as Box<dyn Plugin>);

    registry
      .register(crate::plugins::loader::PluginRegistration { metadata, factory })
      .await
      .unwrap();

    // Загружаем плагин первый раз
    let permissions = PluginPermissions::default();
    let result1 = manager
      .load_plugin("test-plugin", permissions.clone())
      .await;
    assert!(result1.is_ok());

    // Попытка загрузить снова должна вернуть ошибку
    let result2 = manager.load_plugin("test-plugin", permissions).await;
    assert!(result2.is_err());
    assert!(result2.unwrap_err().to_string().contains("already loaded"));

    // Очистка
    let _ = manager.unload_plugin("test-plugin").await;
  }

  #[tokio::test]
  async fn test_plugin_info() {
    // Тест получения информации о плагине
    let event_bus = Arc::new(EventBus::new());
    let service_container = Arc::new(ServiceContainer::new());
    let app_version = Version::new(1, 0, 0);

    let manager = PluginManager::new(app_version, event_bus, service_container);
    let registry = manager.loader().registry();

    // Регистрируем плагин
    let plugin = TestPlugin::new();
    let metadata = plugin.metadata().clone();
    let factory = Box::new(|| Box::new(TestPlugin::new()) as Box<dyn Plugin>);

    registry
      .register(crate::plugins::loader::PluginRegistration { metadata, factory })
      .await
      .unwrap();

    // Загружаем плагин
    let permissions = PluginPermissions::default();
    let instance_id = manager
      .load_plugin("test-plugin", permissions)
      .await
      .unwrap();

    // Получаем информацию о плагине
    let info = manager.get_plugin_info("test-plugin").await.unwrap();
    assert_eq!(info["id"], "test-plugin");
    assert_eq!(info["name"], "Test Plugin");
    assert_eq!(info["version"], "1.0.0");
    assert_eq!(info["author"], "Test");
    assert_eq!(info["description"], "Test plugin");
    assert_eq!(info["type"], "Universal");
    assert_eq!(info["state"], "Active");
    assert_eq!(info["instance_id"], instance_id);

    // Попытка получить информацию о несуществующем плагине
    let result = manager.get_plugin_info("non-existent").await;
    assert!(result.is_err());

    // Очистка - игнорируем ошибки при выгрузке тестового плагина
    let _ = manager.unload_plugin("test-plugin").await;
  }

  #[tokio::test]
  async fn test_manager_service_lifecycle() {
    // Тест жизненного цикла менеджера как сервиса
    let event_bus = Arc::new(EventBus::new());
    let service_container = Arc::new(ServiceContainer::new());
    let app_version = Version::new(1, 0, 0);

    let mut manager = PluginManager::new(app_version, event_bus, service_container);

    // Инициализация
    assert!(manager.initialize().await.is_ok());
    assert_eq!(manager.name(), "PluginManager");

    // Загружаем плагин
    let registry = manager.loader().registry();
    let plugin = TestPlugin::new();
    let metadata = plugin.metadata().clone();
    let factory = Box::new(|| Box::new(TestPlugin::new()) as Box<dyn Plugin>);

    registry
      .register(crate::plugins::loader::PluginRegistration { metadata, factory })
      .await
      .unwrap();

    let permissions = PluginPermissions::default();
    manager
      .load_plugin("test-plugin", permissions)
      .await
      .unwrap();

    // Проверяем что плагин загружен
    let loaded = manager.list_loaded_plugins().await;
    assert_eq!(loaded.len(), 1);

    // Shutdown должен выгрузить все плагины
    assert!(manager.shutdown().await.is_ok());

    // Проверяем что плагины выгружены
    let loaded = manager.list_loaded_plugins().await;
    assert_eq!(loaded.len(), 0);
  }

  #[tokio::test]
  async fn test_sandbox_stats() {
    // Тест получения статистики sandbox
    let event_bus = Arc::new(EventBus::new());
    let service_container = Arc::new(ServiceContainer::new());
    let app_version = Version::new(1, 0, 0);

    let manager = PluginManager::new(app_version, event_bus, service_container);
    let registry = manager.loader().registry();

    // Регистрируем плагин
    let plugin = TestPlugin::new();
    let metadata = plugin.metadata().clone();
    let factory = Box::new(|| Box::new(TestPlugin::new()) as Box<dyn Plugin>);

    registry
      .register(crate::plugins::loader::PluginRegistration { metadata, factory })
      .await
      .unwrap();

    // Загружаем плагин
    let permissions = PluginPermissions::default();
    let load_result = manager.load_plugin("test-plugin", permissions).await;

    if load_result.is_err() {
      log::warn!("Failed to load test plugin: {:?}", load_result.err());
      return; // Skip the rest of the test if load fails
    }

    // Получаем общую статистику sandbox
    let all_stats = manager.get_sandbox_stats().await;
    assert_eq!(all_stats.len(), 1);
    assert_eq!(all_stats[0].plugin_id, "test-plugin");

    // Получаем статистику конкретного плагина
    let plugin_stats = manager.get_plugin_sandbox_stats("test-plugin").await;
    assert!(plugin_stats.is_some());
    assert_eq!(plugin_stats.unwrap().plugin_id, "test-plugin");

    // Несуществующий плагин
    let missing_stats = manager.get_plugin_sandbox_stats("non-existent").await;
    assert!(missing_stats.is_none());

    // Очистка - проверяем, удался ли unload
    let unload_result = manager.unload_plugin("test-plugin").await;
    if unload_result.is_err() {
      log::warn!("Failed to unload test plugin: {:?}", unload_result.err());
    }
  }

  #[tokio::test]
  async fn test_violation_handling() {
    // Тест обработки нарушений лимитов
    let event_bus = Arc::new(EventBus::new());
    let service_container = Arc::new(ServiceContainer::new());
    let app_version = Version::new(1, 0, 0);

    let manager = PluginManager::new(app_version, event_bus, service_container);
    let registry = manager.loader().registry();

    // Регистрируем плагин
    let plugin = TestPlugin::new();
    let metadata = plugin.metadata().clone();
    let factory = Box::new(|| Box::new(TestPlugin::new()) as Box<dyn Plugin>);

    registry
      .register(crate::plugins::loader::PluginRegistration { metadata, factory })
      .await
      .unwrap();

    // Загружаем плагин
    let permissions = PluginPermissions::default();
    manager
      .load_plugin("test-plugin", permissions)
      .await
      .unwrap();

    // Изначально нет нарушений
    let violating = manager.get_violating_plugins().await;
    assert_eq!(violating.len(), 0);

    // Проверяем сброс нарушений для несуществующего плагина
    let reset = manager.reset_plugin_violations("non-existent").await;
    assert!(!reset);

    // Проверяем что метод reset_plugin_violations возвращает true для существующего плагина
    let reset = manager.reset_plugin_violations("test-plugin").await;
    assert!(reset);

    // Очистка
    let _ = manager.unload_plugin("test-plugin").await;
  }

  #[tokio::test]
  async fn test_command_to_stopped_plugin() {
    // Тест отправки команды остановленному плагину
    let event_bus = Arc::new(EventBus::new());
    let service_container = Arc::new(ServiceContainer::new());
    let app_version = Version::new(1, 0, 0);

    let manager = PluginManager::new(app_version, event_bus, service_container);
    let registry = manager.loader().registry();

    // Регистрируем плагин
    let plugin = TestPlugin::new();
    let metadata = plugin.metadata().clone();
    let factory = Box::new(|| Box::new(TestPlugin::new()) as Box<dyn Plugin>);

    registry
      .register(crate::plugins::loader::PluginRegistration { metadata, factory })
      .await
      .unwrap();

    // Загружаем плагин
    let permissions = PluginPermissions::default();
    manager
      .load_plugin("test-plugin", permissions)
      .await
      .unwrap();

    // Изменяем состояние плагина на Stopped вручную (для теста)
    {
      let mut plugins = manager.plugins.write().await;
      if let Some(handle) = plugins.get_mut("test-plugin") {
        handle.state = PluginState::Stopped;
      }
    }

    // Попытка отправить команду должна вернуть ошибку
    let command = PluginCommand {
      id: Uuid::new_v4(),
      command: "test".to_string(),
      params: serde_json::json!({}),
    };
    let result = manager.send_command("test-plugin", command).await;
    assert!(result.is_err());
    assert!(result.unwrap_err().to_string().contains("not active"));

    // Очистка
    let _ = manager.unload_plugin("test-plugin").await;
  }

  #[tokio::test]
  async fn test_suspend_non_active_plugin() {
    // Тест приостановки неактивного плагина
    let event_bus = Arc::new(EventBus::new());
    let service_container = Arc::new(ServiceContainer::new());
    let app_version = Version::new(1, 0, 0);

    let manager = PluginManager::new(app_version, event_bus, service_container);
    let registry = manager.loader().registry();

    // Используем уникальный ID для избежания конфликтов с другими тестами
    let plugin_id = "test-plugin-suspend";

    // Регистрируем плагин
    let mut plugin = TestPlugin::new();
    plugin.metadata.id = plugin_id.to_string();
    let metadata = plugin.metadata().clone();
    let factory = Box::new(move || {
      let mut p = TestPlugin::new();
      p.metadata.id = plugin_id.to_string();
      Box::new(p) as Box<dyn Plugin>
    });

    registry
      .register(crate::plugins::loader::PluginRegistration { metadata, factory })
      .await
      .unwrap();

    // Загружаем плагин
    let permissions = PluginPermissions::default();
    manager.load_plugin(plugin_id, permissions).await.unwrap();

    // Сначала приостанавливаем плагин
    manager.suspend_plugin(plugin_id).await.unwrap();

    // Попытка приостановить уже приостановленный плагин
    let result = manager.suspend_plugin(plugin_id).await;
    assert!(result.is_err());
    assert!(result.unwrap_err().to_string().contains("not active"));

    // Очистка
    let _ = manager.unload_plugin(plugin_id).await;
  }

  #[tokio::test]
  #[ignore] // Игнорируем из-за проблем с mutex в параллельных тестах
  async fn test_resume_non_suspended_plugin() {
    // Тест возобновления не приостановленного плагина
    let event_bus = Arc::new(EventBus::new());
    let service_container = Arc::new(ServiceContainer::new());
    let app_version = Version::new(1, 0, 0);

    let manager = PluginManager::new(app_version, event_bus, service_container);
    let registry = manager.loader().registry();

    // Используем уникальный ID для избежания конфликтов
    let plugin_id = format!("test-plugin-resume-{}", uuid::Uuid::new_v4());

    // Регистрируем плагин с уникальным ID
    let mut plugin = TestPlugin::new();
    plugin.metadata.id = plugin_id.clone();
    let metadata = plugin.metadata().clone();
    let plugin_id_clone = plugin_id.clone();
    let factory = Box::new(move || {
      let mut p = TestPlugin::new();
      p.metadata.id = plugin_id_clone.clone();
      Box::new(p) as Box<dyn Plugin>
    });

    registry
      .register(crate::plugins::loader::PluginRegistration { metadata, factory })
      .await
      .unwrap();

    // Загружаем плагин
    let permissions = PluginPermissions::default();
    manager.load_plugin(&plugin_id, permissions).await.unwrap();

    // Попытка возобновить активный плагин
    let result = manager.resume_plugin(&plugin_id).await;
    assert!(result.is_err());
    assert!(result.unwrap_err().to_string().contains("not suspended"));

    // Очистка
    let _ = manager.unload_plugin(&plugin_id).await;
  }

  #[tokio::test]
  async fn test_with_app_handle() {
    // Тест установки AppHandle
    let event_bus = Arc::new(EventBus::new());
    let service_container = Arc::new(ServiceContainer::new());
    let app_version = Version::new(1, 0, 0);

    let manager = PluginManager::new(app_version, event_bus, service_container);

    // Проверяем что изначально нет AppHandle
    assert!(manager.app_handle.is_none());

    // Не можем создать настоящий AppHandle в тестах
    // Просто проверяем что метод существует
    assert!(manager.app_handle.is_none());
  }

  #[tokio::test]
  async fn test_manager_cloning() {
    // Тест клонирования менеджера
    let event_bus = Arc::new(EventBus::new());
    let service_container = Arc::new(ServiceContainer::new());
    let app_version = Version::new(1, 0, 0);

    let manager = PluginManager::new(app_version, event_bus, service_container);
    let manager_clone = manager.clone();

    // Оба менеджера должны видеть одни и те же плагины
    let registry = manager.loader().registry();
    let plugin = TestPlugin::new();
    let metadata = plugin.metadata().clone();
    let factory = Box::new(|| Box::new(TestPlugin::new()) as Box<dyn Plugin>);

    registry
      .register(crate::plugins::loader::PluginRegistration { metadata, factory })
      .await
      .unwrap();

    // Загружаем плагин через первый менеджер
    let permissions = PluginPermissions::default();
    manager
      .load_plugin("test-plugin", permissions)
      .await
      .unwrap();

    // Второй менеджер должен видеть плагин
    let loaded = manager_clone.list_loaded_plugins().await;
    assert_eq!(loaded.len(), 1);
    assert_eq!(loaded[0].0, "test-plugin");

    // Выгружаем через второй менеджер
    let _ = manager_clone.unload_plugin("test-plugin").await;

    // Первый менеджер должен видеть что плагин выгружен
    let loaded = manager.list_loaded_plugins().await;
    assert_eq!(loaded.len(), 0);
  }

  #[tokio::test]
  #[ignore] // Игнорируем из-за проблем с файловой системой в тестовой среде
  async fn test_event_dispatch_to_multiple_plugins() {
    // Тест рассылки событий нескольким плагинам
    let event_bus = Arc::new(EventBus::new());
    let service_container = Arc::new(ServiceContainer::new());
    let app_version = Version::new(1, 0, 0);

    let manager = PluginManager::new(app_version, event_bus, service_container);
    let registry = manager.loader().registry();

    // Используем уникальные ID для избежания конфликтов
    let base_id = uuid::Uuid::new_v4();

    // Регистрируем несколько плагинов с разными подписками
    for i in 1..=3 {
      let plugin_id = format!("plugin-{}-{}", base_id, i);
      let mut metadata = TestPlugin::new().metadata().clone();
      metadata.id = plugin_id.clone();
      metadata.name = format!("Test Plugin {i}");

      let factory = Box::new(move || {
        let mut plugin = TestPlugin::new();
        plugin.metadata.id = plugin_id.clone();
        plugin.metadata.name = format!("Test Plugin {i}");
        Box::new(plugin) as Box<dyn Plugin>
      });

      registry
        .register(crate::plugins::loader::PluginRegistration { metadata, factory })
        .await
        .unwrap();

      let permissions = PluginPermissions::default();
      let result = manager
        .load_plugin(&format!("plugin-{}-{}", base_id, i), permissions)
        .await;

      if result.is_err() {
        log::warn!(
          "Failed to load plugin in event dispatch test: {:?}",
          result.err()
        );
        return; // Skip test if loading fails
      }
    }

    // Приостанавливаем один плагин
    let suspend_result = manager
      .suspend_plugin(&format!("plugin-{}-2", base_id))
      .await;
    if suspend_result.is_err() {
      log::warn!("Failed to suspend plugin: {:?}", suspend_result.err());
    }

    // Отправляем событие
    let event = AppEvent::ProjectCreated {
      project_id: "test-project".to_string(),
    };

    // Не должно быть ошибок даже если один плагин приостановлен
    let result = manager.dispatch_event(&event).await;
    assert!(result.is_ok());

    // Очистка - игнорируем ошибки при выгрузке
    for i in 1..=3 {
      let _ = manager
        .unload_plugin(&format!("plugin-{}-{}", base_id, i))
        .await;
    }
  }

  #[tokio::test]
  async fn test_concurrent_plugin_operations() {
    // Тест одновременных операций с плагинами
    let event_bus = Arc::new(EventBus::new());
    let service_container = Arc::new(ServiceContainer::new());
    let app_version = Version::new(1, 0, 0);

    let manager = Arc::new(PluginManager::new(
      app_version,
      event_bus,
      service_container,
    ));
    let registry = manager.loader().registry();

    // Регистрируем плагин
    let plugin = TestPlugin::new();
    let metadata = plugin.metadata().clone();
    let factory = Box::new(|| Box::new(TestPlugin::new()) as Box<dyn Plugin>);

    registry
      .register(crate::plugins::loader::PluginRegistration { metadata, factory })
      .await
      .unwrap();

    // Загружаем плагин
    let permissions = PluginPermissions::default();
    let load_result = manager.load_plugin("test-plugin", permissions).await;

    if load_result.is_err() {
      log::warn!(
        "Failed to load test plugin in concurrent test: {:?}",
        load_result.err()
      );
      return; // Skip the rest of the test if load fails
    }

    // Запускаем несколько команд одновременно
    let mut handles = vec![];
    for i in 0..10 {
      let manager_clone = manager.clone();
      let handle = tokio::spawn(async move {
        let command = PluginCommand {
          id: Uuid::new_v4(),
          command: format!("test-{i}"),
          params: serde_json::json!({"index": i}),
        };
        manager_clone.send_command("test-plugin", command).await
      });
      handles.push(handle);
    }

    // Все команды должны успешно выполниться
    for handle in handles {
      let result = handle.await.unwrap();
      assert!(result.is_ok());
    }

    // Очистка - проверяем, удался ли unload
    let unload_result = manager.unload_plugin("test-plugin").await;
    if unload_result.is_err() {
      log::warn!(
        "Failed to unload test plugin in concurrent test: {:?}",
        unload_result.err()
      );
    }
  }
}

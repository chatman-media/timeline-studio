//! Контекст выполнения плагина

use super::permissions::PluginPermissions;
use super::plugin::Version;
use crate::core::{EventBus, ServiceContainer};
use std::path::{Path, PathBuf};
use std::sync::Arc;

/// Контекст в котором выполняется плагин
#[derive(Clone)]
pub struct PluginContext {
  /// Версия Timeline Studio
  pub app_version: Version,

  /// Директория плагина для хранения файлов
  pub plugin_dir: PathBuf,

  /// Директория для конфигурации плагина
  pub config_dir: PathBuf,

  /// Директория для временных файлов
  pub temp_dir: PathBuf,

  /// Event bus для публикации событий
  pub event_bus: Arc<EventBus>,

  /// Service container для доступа к сервисам
  pub service_container: Arc<ServiceContainer>,

  /// Разрешения плагина
  pub permissions: PluginPermissions,

  /// ID экземпляра плагина
  pub instance_id: String,

  /// Tauri AppHandle для интеграции с frontend
  pub app_handle: Option<tauri::AppHandle>,
}

impl PluginContext {
  /// Создать новый контекст для плагина
  pub fn new(
    plugin_id: &str,
    app_version: Version,
    event_bus: Arc<EventBus>,
    service_container: Arc<ServiceContainer>,
    permissions: PluginPermissions,
    app_handle: Option<tauri::AppHandle>,
  ) -> Self {
    let base_dir = dirs::data_dir()
      .unwrap_or_else(|| PathBuf::from("."))
      .join("timeline-studio")
      .join("plugins");

    let plugin_dir = base_dir.join(plugin_id);
    let config_dir = plugin_dir.join("config");
    let temp_dir = std::env::temp_dir()
      .join("timeline-studio")
      .join("plugins")
      .join(plugin_id);

    let instance_id = format!("{}_{}", plugin_id, uuid::Uuid::new_v4());

    Self {
      app_version,
      plugin_dir,
      config_dir,
      temp_dir,
      event_bus,
      service_container,
      permissions,
      instance_id,
      app_handle,
    }
  }

  /// Проверить имеет ли плагин разрешение на чтение пути
  pub fn can_read_path(&self, path: &Path) -> bool {
    // Плагин всегда может читать свои директории
    if path.starts_with(&self.plugin_dir)
      || path.starts_with(&self.config_dir)
      || path.starts_with(&self.temp_dir)
    {
      return true;
    }

    // Проверяем разрешения
    self.permissions.file_system.can_read(path)
  }

  /// Проверить имеет ли плагин разрешение на запись в путь
  pub fn can_write_path(&self, path: &Path) -> bool {
    // Плагин всегда может писать в свои директории
    if path.starts_with(&self.plugin_dir)
      || path.starts_with(&self.config_dir)
      || path.starts_with(&self.temp_dir)
    {
      return true;
    }

    // Проверяем разрешения
    self.permissions.file_system.can_write(path)
  }

  /// Проверить может ли плагин подключаться к хосту
  pub fn can_connect_to(&self, host: &str, port: u16) -> bool {
    self.permissions.network.can_connect(host, port)
  }

  /// Создать директории плагина если они не существуют
  pub async fn ensure_directories(&self) -> Result<(), std::io::Error> {
    tokio::fs::create_dir_all(&self.plugin_dir).await?;
    tokio::fs::create_dir_all(&self.config_dir).await?;
    tokio::fs::create_dir_all(&self.temp_dir).await?;
    Ok(())
  }

  /// Очистить временные файлы плагина
  pub async fn cleanup_temp_files(&self) -> Result<(), std::io::Error> {
    if self.temp_dir.exists() {
      tokio::fs::remove_dir_all(&self.temp_dir).await?;
    }
    Ok(())
  }

  /// Создать API для плагина
  pub fn create_plugin_api(&self, plugin_id: String) -> super::api::PluginApiImpl {
    super::api::PluginApiImpl::new(
      plugin_id,
      std::sync::Arc::new(self.permissions.clone()),
      self.service_container.clone(),
      self.app_handle.clone(),
      self.plugin_dir.clone(),
      self.event_bus.clone(),
    )
  }
}

#[cfg(test)]
mod tests {
  use super::*;
  use crate::core::plugins::permissions::{FileSystemPermissions, NetworkPermissions};

  #[test]
  fn test_plugin_context_paths() {
    let permissions = PluginPermissions {
      file_system: FileSystemPermissions::default(),
      network: NetworkPermissions::default(),
      ui_access: false,
      system_info: false,
      process_spawn: false,
    };

    let context = PluginContext::new(
      "test-plugin",
      Version::new(1, 0, 0),
      Arc::new(EventBus::new()),
      Arc::new(ServiceContainer::new()),
      permissions,
      None, // AppHandle not available in tests
    );

    assert!(context
      .plugin_dir
      .ends_with("timeline-studio/plugins/test-plugin"));
    assert!(context
      .config_dir
      .ends_with("timeline-studio/plugins/test-plugin/config"));
    assert!(context.temp_dir.to_string_lossy().contains("test-plugin"));
  }

  #[test]
  fn test_path_permissions() {
    let mut permissions = PluginPermissions::default();
    permissions
      .file_system
      .read_paths
      .push(PathBuf::from("/allowed/read"));
    permissions
      .file_system
      .write_paths
      .push(PathBuf::from("/allowed/write"));

    let context = PluginContext::new(
      "test-plugin",
      Version::new(1, 0, 0),
      Arc::new(EventBus::new()),
      Arc::new(ServiceContainer::new()),
      permissions,
      None, // AppHandle not available in tests
    );

    // Плагин может читать/писать в свои директории
    assert!(context.can_read_path(&context.plugin_dir));
    assert!(context.can_write_path(&context.config_dir));

    // Проверка разрешенных путей
    assert!(context.can_read_path(&PathBuf::from("/allowed/read/file.txt")));
    assert!(context.can_write_path(&PathBuf::from("/allowed/write/file.txt")));

    // Проверка запрещенных путей
    assert!(!context.can_read_path(&PathBuf::from("/forbidden/file.txt")));
    assert!(!context.can_write_path(&PathBuf::from("/forbidden/file.txt")));
  }
}

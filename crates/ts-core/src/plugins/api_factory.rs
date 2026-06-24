//! Фабрика для создания Plugin API с правильными зависимостями

use super::{
  api::{PluginApi, PluginApiImpl},
  context::PluginContext,
  permissions::PluginPermissions,
};
use crate::ServiceContainer;
use ts_render::video_compiler::error::Result;
use std::sync::Arc;

/// Фабрика для создания PluginApi
pub struct PluginApiFactory {
  service_container: Arc<ServiceContainer>,
  app_handle: Option<tauri::AppHandle>,
}

impl PluginApiFactory {
  /// Создать новую фабрику
  pub fn new(service_container: Arc<ServiceContainer>) -> Self {
    Self {
      service_container,
      app_handle: None,
    }
  }

  /// Установить AppHandle (вызывается после инициализации Tauri)
  pub fn set_app_handle(&mut self, app_handle: tauri::AppHandle) {
    self.app_handle = Some(app_handle);
  }

  /// Создать PluginApi для плагина
  pub fn create_api(
    &self,
    plugin_id: &str,
    permissions: Arc<PluginPermissions>,
    storage_path: std::path::PathBuf,
    event_bus: Arc<crate::EventBus>,
  ) -> Result<Arc<dyn PluginApi>> {
    let api = PluginApiImpl::new(
      plugin_id.to_string(),
      permissions,
      self.service_container.clone(),
      self.app_handle.clone(),
      storage_path,
      event_bus,
    );

    Ok(Arc::new(api))
  }

  /// Обновить PluginContext с API
  pub fn enhance_context(
    &self,
    context: PluginContext,
    permissions: Arc<PluginPermissions>,
  ) -> Result<PluginContext> {
    if self.app_handle.is_some() {
      // Создаем API для этого контекста
      let _api = self.create_api(
        &context.instance_id,
        permissions,
        context.plugin_dir.clone(),
        context.event_bus.clone(),
      )?;

      // В будущем здесь можно добавить API в контекст
      // context.set_api(api);
    }

    Ok(context)
  }
}

impl Default for PluginApiFactory {
  fn default() -> Self {
    Self::new(Arc::new(ServiceContainer::new()))
  }
}

#[cfg(test)]
mod tests {
  use super::*;
  use crate::plugins::permissions::SecurityLevel;

  #[test]
  fn test_factory_creation() {
    let service_container = Arc::new(ServiceContainer::new());
    let factory = PluginApiFactory::new(service_container);

    // Проверяем что фабрика создается без AppHandle
    assert!(factory.app_handle.is_none());
  }

  #[test]
  fn test_create_api_without_app_handle() {
    let factory = PluginApiFactory::default();
    let permissions = Arc::new(SecurityLevel::Minimal.permissions());
    let storage_path = std::path::PathBuf::from("/tmp");

    // Теперь API может работать без AppHandle (с None)
    let event_bus = Arc::new(crate::EventBus::new());
    let result = factory.create_api("test-plugin", permissions, storage_path, event_bus);
    assert!(result.is_ok());
  }
}

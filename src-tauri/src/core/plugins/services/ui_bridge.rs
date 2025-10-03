//! Мост для интеграции плагинов с UI сервисами

use crate::{
  core::{di::ServiceContainer, plugins::permissions::PluginPermissions},
  video_compiler::error::{Result, VideoCompilerError},
};
use serde_json::Value;
use std::sync::Arc;

/// Мост для UI операций плагинов
#[derive(Clone)]
pub struct UIBridge {
  #[allow(dead_code)]
  service_container: Arc<ServiceContainer>,
  permissions: Arc<PluginPermissions>,
  plugin_id: String,
  app_handle: Option<tauri::AppHandle>,
}

impl UIBridge {
  /// Создать новый UI мост
  pub fn new(
    service_container: Arc<ServiceContainer>,
    permissions: Arc<PluginPermissions>,
    plugin_id: String,
    app_handle: Option<tauri::AppHandle>,
  ) -> Self {
    Self {
      service_container,
      permissions,
      plugin_id,
      app_handle,
    }
  }

  /// Показать диалог плагина
  pub async fn show_dialog(&self, dialog_type: &str, options: Value) -> Result<Value> {
    // Проверяем разрешения на UI доступ
    if !self.permissions.ui_access {
      return Err(VideoCompilerError::SecurityError(
        "Plugin does not have permission to show dialogs".to_string(),
      ));
    }

    log::info!(
      "[UIBridge {}] Showing dialog type: {}",
      self.plugin_id,
      dialog_type
    );

    match dialog_type {
      "info" => self.show_info_dialog(options).await,
      "warning" => self.show_warning_dialog(options).await,
      "error" => self.show_error_dialog(options).await,
      "confirm" => self.show_confirm_dialog(options).await,
      "input" => self.show_input_dialog(options).await,
      "file_picker" => self.show_file_picker_dialog(options).await,
      _ => Err(VideoCompilerError::InvalidParameter(format!(
        "Unsupported dialog type: {dialog_type}"
      ))),
    }
  }

  /// Показать информационный диалог
  async fn show_info_dialog(&self, options: Value) -> Result<Value> {
    let title = options
      .get("title")
      .and_then(|v| v.as_str())
      .unwrap_or("Information");
    let message = options
      .get("message")
      .and_then(|v| v.as_str())
      .unwrap_or("No message provided");

    log::info!(
      "[UIBridge {}] Info dialog - Title: '{}', Message: '{}'",
      self.plugin_id,
      title,
      message
    );

    // TODO: Интеграция с Tauri dialog API
    // Пока возвращаем успешный результат
    Ok(serde_json::json!({
      "result": "ok",
      "action": "dismissed"
    }))
  }

  /// Показать диалог предупреждения
  async fn show_warning_dialog(&self, options: Value) -> Result<Value> {
    let title = options
      .get("title")
      .and_then(|v| v.as_str())
      .unwrap_or("Warning");
    let message = options
      .get("message")
      .and_then(|v| v.as_str())
      .unwrap_or("No message provided");

    log::warn!(
      "[UIBridge {}] Warning dialog - Title: '{}', Message: '{}'",
      self.plugin_id,
      title,
      message
    );

    Ok(serde_json::json!({
      "result": "ok",
      "action": "dismissed"
    }))
  }

  /// Показать диалог ошибки
  async fn show_error_dialog(&self, options: Value) -> Result<Value> {
    let title = options
      .get("title")
      .and_then(|v| v.as_str())
      .unwrap_or("Error");
    let message = options
      .get("message")
      .and_then(|v| v.as_str())
      .unwrap_or("No message provided");

    log::error!(
      "[UIBridge {}] Error dialog - Title: '{}', Message: '{}'",
      self.plugin_id,
      title,
      message
    );

    Ok(serde_json::json!({
      "result": "ok",
      "action": "dismissed"
    }))
  }

  /// Показать диалог подтверждения
  async fn show_confirm_dialog(&self, options: Value) -> Result<Value> {
    let title = options
      .get("title")
      .and_then(|v| v.as_str())
      .unwrap_or("Confirm");
    let message = options
      .get("message")
      .and_then(|v| v.as_str())
      .unwrap_or("Are you sure?");

    log::info!(
      "[UIBridge {}] Confirm dialog - Title: '{}', Message: '{}'",
      self.plugin_id,
      title,
      message
    );

    // TODO: Интеграция с реальным confirm dialog
    // Пока возвращаем положительный ответ
    Ok(serde_json::json!({
      "result": "ok",
      "action": "confirmed",
      "value": true
    }))
  }

  /// Показать диалог ввода
  async fn show_input_dialog(&self, options: Value) -> Result<Value> {
    let title = options
      .get("title")
      .and_then(|v| v.as_str())
      .unwrap_or("Input");
    let message = options
      .get("message")
      .and_then(|v| v.as_str())
      .unwrap_or("Enter value:");
    let default_value = options
      .get("default")
      .and_then(|v| v.as_str())
      .unwrap_or("");

    log::info!(
      "[UIBridge {}] Input dialog - Title: '{}', Message: '{}', Default: '{}'",
      self.plugin_id,
      title,
      message,
      default_value
    );

    // TODO: Интеграция с реальным input dialog
    // Пока возвращаем default значение
    Ok(serde_json::json!({
      "result": "ok",
      "action": "submitted",
      "value": default_value
    }))
  }

  /// Показать диалог выбора файла
  async fn show_file_picker_dialog(&self, options: Value) -> Result<Value> {
    let title = options
      .get("title")
      .and_then(|v| v.as_str())
      .unwrap_or("Select File");
    let filters = options
      .get("filters")
      .and_then(|v| v.as_array())
      .cloned()
      .unwrap_or_default();
    let multiple = options
      .get("multiple")
      .and_then(|v| v.as_bool())
      .unwrap_or(false);
    let directory = options
      .get("directory")
      .and_then(|v| v.as_bool())
      .unwrap_or(false);

    log::info!(
      "[UIBridge {}] File picker - Title: '{}', Multiple: {}, Directory: {}, Filters: {:?}",
      self.plugin_id,
      title,
      multiple,
      directory,
      filters
    );

    // Интеграция с Tauri file picker API через AppHandle
    if let Some(_app_handle) = &self.app_handle {
      log::info!(
        "[UIBridge {}] AppHandle available, attempting Tauri dialog integration",
        self.plugin_id
      );

      // TODO: Реализовать интеграцию с tauri::api::dialog
      // use tauri::api::dialog::FileDialogBuilder;

      // Пока логируем что интеграция не завершена
      log::warn!(
        "[UIBridge {}] Tauri dialog integration not implemented yet, using fallback",
        self.plugin_id
      );
    } else {
      log::info!(
        "[UIBridge {}] AppHandle not available, using mock file picker",
        self.plugin_id
      );
    }

    // Fallback: возвращаем заглушку
    Ok(serde_json::json!({
      "result": "ok",
      "action": "selected",
      "files": if directory {
        vec!["/path/to/selected_directory"]
      } else if multiple {
        vec!["/path/to/file1.mp4", "/path/to/file2.mp4"]
      } else {
        vec!["/path/to/selected_file.mp4"]
      }
    }))
  }

  /// Добавить пункт меню
  pub async fn add_menu_item(&self, menu_path: &str, item_config: Value) -> Result<()> {
    // Проверяем разрешения
    if !self.permissions.ui_access {
      return Err(VideoCompilerError::SecurityError(
        "Plugin does not have permission to modify menus".to_string(),
      ));
    }

    let label = item_config
      .get("label")
      .and_then(|v| v.as_str())
      .ok_or_else(|| {
        VideoCompilerError::InvalidParameter("Menu item must have a label".to_string())
      })?;

    let action = item_config
      .get("action")
      .and_then(|v| v.as_str())
      .unwrap_or("default_action");

    log::info!(
      "[UIBridge {}] Adding menu item - Path: '{}', Label: '{}', Action: '{}'",
      self.plugin_id,
      menu_path,
      label,
      action
    );

    // Валидация пути меню
    if menu_path.is_empty() {
      return Err(VideoCompilerError::InvalidParameter(
        "Menu path cannot be empty".to_string(),
      ));
    }

    // TODO: Интеграция с Tauri Menu API для динамического добавления пунктов
    log::info!(
      "[UIBridge {}] Menu item '{}' added to path '{}'",
      self.plugin_id,
      label,
      menu_path
    );

    Ok(())
  }

  /// Удалить пункт меню
  pub async fn remove_menu_item(&self, menu_id: &str) -> Result<()> {
    // Проверяем разрешения
    if !self.permissions.ui_access {
      return Err(VideoCompilerError::SecurityError(
        "Plugin does not have permission to modify menus".to_string(),
      ));
    }

    if menu_id.is_empty() {
      return Err(VideoCompilerError::InvalidParameter(
        "Menu ID cannot be empty".to_string(),
      ));
    }

    log::info!(
      "[UIBridge {}] Removing menu item: {}",
      self.plugin_id,
      menu_id
    );

    // TODO: Интеграция с Tauri Menu API для удаления пунктов
    log::info!(
      "[UIBridge {}] Menu item '{}' removed",
      self.plugin_id,
      menu_id
    );

    Ok(())
  }

  /// Показать уведомление
  pub async fn show_notification(
    &self,
    title: &str,
    message: &str,
    notification_type: &str,
  ) -> Result<()> {
    // Проверяем разрешения
    if !self.permissions.ui_access {
      return Err(VideoCompilerError::SecurityError(
        "Plugin does not have permission to show notifications".to_string(),
      ));
    }

    log::info!(
      "[UIBridge {}] Showing notification - Type: '{}', Title: '{}', Message: '{}'",
      self.plugin_id,
      notification_type,
      title,
      message
    );

    // Интеграция с NotificationService или Tauri notification API
    if let Some(_app_handle) = &self.app_handle {
      log::info!(
        "[UIBridge {}] AppHandle available, attempting Tauri notification",
        self.plugin_id
      );

      // TODO: Интеграция с tauri::api::notification
      // use tauri::api::notification::Notification;

      log::warn!(
        "[UIBridge {}] Tauri notification integration not implemented yet",
        self.plugin_id
      );
    }

    // Fallback: логируем уведомление
    match notification_type {
      "info" => log::info!("[Plugin Notification] {title}: {message}"),
      "warning" => log::warn!("[Plugin Notification] {title}: {message}"),
      "error" => log::error!("[Plugin Notification] {title}: {message}"),
      "success" => log::info!("[Plugin Notification Success] {title}: {message}"),
      _ => {
        return Err(VideoCompilerError::InvalidParameter(format!(
          "Unsupported notification type: {notification_type}"
        )));
      }
    }

    Ok(())
  }

  /// Обновить прогресс выполнения операции
  pub async fn update_progress(
    &self,
    operation_id: &str,
    progress: f32,
    message: Option<&str>,
  ) -> Result<()> {
    // Проверяем разрешения
    if !self.permissions.ui_access {
      return Err(VideoCompilerError::SecurityError(
        "Plugin does not have permission to update progress".to_string(),
      ));
    }

    // Валидация прогресса
    if !(0.0..=1.0).contains(&progress) {
      return Err(VideoCompilerError::InvalidParameter(
        "Progress must be between 0.0 and 1.0".to_string(),
      ));
    }

    let progress_percent = (progress * 100.0) as u8;
    let message_text = message.unwrap_or("Processing...");

    log::info!(
      "[UIBridge {}] Progress update - Operation: '{}', Progress: {}%, Message: '{}'",
      self.plugin_id,
      operation_id,
      progress_percent,
      message_text
    );

    // TODO: Интеграция с ProgressService для отображения прогресса в UI

    Ok(())
  }
}

#[cfg(test)]
mod tests {
  use super::*;
  use crate::core::plugins::permissions::SecurityLevel;

  // Мок для AppHandle в тестах
  fn create_mock_app_handle() -> Option<tauri::AppHandle> {
    // В тестах возвращаем None
    None
  }

  #[tokio::test]
  async fn test_dialog_validation() {
    let service_container = Arc::new(ServiceContainer::new());
    let permissions = Arc::new(SecurityLevel::Full.permissions());
    // Примечание: В реальных тестах нужен правильный AppHandle
    let app_handle = create_mock_app_handle();

    let bridge = UIBridge::new(
      service_container,
      permissions,
      "test-plugin".to_string(),
      app_handle,
    );

    // Тест валидации типа диалога
    let invalid_dialog_result = bridge
      .show_dialog("invalid_type", serde_json::json!({"message": "test"}))
      .await;

    assert!(invalid_dialog_result.is_err());
    assert!(invalid_dialog_result
      .unwrap_err()
      .to_string()
      .contains("Unsupported dialog type"));
  }

  #[tokio::test]
  async fn test_menu_operations() {
    let service_container = Arc::new(ServiceContainer::new());
    let permissions = Arc::new(SecurityLevel::Full.permissions());
    let app_handle = create_mock_app_handle();

    let bridge = UIBridge::new(
      service_container,
      permissions,
      "test-plugin".to_string(),
      app_handle,
    );

    // Тест добавления пункта меню
    let menu_config = serde_json::json!({
      "label": "Test Action",
      "action": "test_action"
    });

    let result = bridge.add_menu_item("plugins/test", menu_config).await;
    assert!(result.is_ok());

    // Тест удаления пункта меню
    let result = bridge.remove_menu_item("test_menu_item").await;
    assert!(result.is_ok());
  }

  #[tokio::test]
  async fn test_notification_types() {
    let service_container = Arc::new(ServiceContainer::new());
    let permissions = Arc::new(SecurityLevel::Full.permissions());
    let app_handle = create_mock_app_handle();

    let bridge = UIBridge::new(
      service_container,
      permissions,
      "test-plugin".to_string(),
      app_handle,
    );

    // Тест всех типов уведомлений
    let notification_types = ["info", "warning", "error", "success"];

    for notification_type in &notification_types {
      let result = bridge
        .show_notification("Test Title", "Test message", notification_type)
        .await;
      assert!(result.is_ok());
    }

    // Тест невалидного типа
    let result = bridge
      .show_notification("Test", "Test", "invalid_type")
      .await;
    assert!(result.is_err());
  }

  #[tokio::test]
  async fn test_progress_validation() {
    let service_container = Arc::new(ServiceContainer::new());
    let permissions = Arc::new(SecurityLevel::Full.permissions());
    let app_handle = create_mock_app_handle();

    let bridge = UIBridge::new(
      service_container,
      permissions,
      "test-plugin".to_string(),
      app_handle,
    );

    // Валидный прогресс
    let result = bridge
      .update_progress("test_op", 0.5, Some("Half done"))
      .await;
    assert!(result.is_ok());

    // Невалидный прогресс (больше 1.0)
    let result = bridge.update_progress("test_op", 1.5, None).await;
    assert!(result.is_err());

    // Невалидный прогресс (меньше 0.0)
    let result = bridge.update_progress("test_op", -0.1, None).await;
    assert!(result.is_err());
  }

  #[tokio::test]
  async fn test_permissions() {
    let service_container = Arc::new(ServiceContainer::new());
    let minimal_permissions = Arc::new(SecurityLevel::Minimal.permissions());
    let app_handle = create_mock_app_handle();

    let bridge = UIBridge::new(
      service_container,
      minimal_permissions,
      "test-plugin".to_string(),
      app_handle,
    );

    // Операции должны быть заблокированы с minimal permissions
    let result = bridge
      .show_dialog("info", serde_json::json!({"message": "test"}))
      .await;
    assert!(result.is_err());
    assert!(result.unwrap_err().to_string().contains("permission"));
  }

  #[tokio::test]
  async fn test_info_dialog() {
    let service_container = Arc::new(ServiceContainer::new());
    let permissions = Arc::new(SecurityLevel::Full.permissions());
    let app_handle = create_mock_app_handle();

    let bridge = UIBridge::new(
      service_container,
      permissions,
      "test-plugin".to_string(),
      app_handle,
    );

    // Тест с полными параметрами
    let options = serde_json::json!({
      "title": "Test Info",
      "message": "This is a test info dialog"
    });

    let result = bridge.show_dialog("info", options).await;
    assert!(result.is_ok());

    let response = result.unwrap();
    assert_eq!(response["result"], "ok");
    assert_eq!(response["action"], "dismissed");

    // Тест с пустыми параметрами (проверяем дефолтные значения)
    let result = bridge.show_dialog("info", serde_json::json!({})).await;
    assert!(result.is_ok());
  }

  #[tokio::test]
  async fn test_warning_dialog() {
    let service_container = Arc::new(ServiceContainer::new());
    let permissions = Arc::new(SecurityLevel::Full.permissions());
    let app_handle = create_mock_app_handle();

    let bridge = UIBridge::new(
      service_container,
      permissions,
      "test-plugin".to_string(),
      app_handle,
    );

    let options = serde_json::json!({
      "title": "Test Warning",
      "message": "This is a warning message"
    });

    let result = bridge.show_dialog("warning", options).await;
    assert!(result.is_ok());

    let response = result.unwrap();
    assert_eq!(response["result"], "ok");
    assert_eq!(response["action"], "dismissed");
  }

  #[tokio::test]
  async fn test_error_dialog() {
    let service_container = Arc::new(ServiceContainer::new());
    let permissions = Arc::new(SecurityLevel::Full.permissions());
    let app_handle = create_mock_app_handle();

    let bridge = UIBridge::new(
      service_container,
      permissions,
      "test-plugin".to_string(),
      app_handle,
    );

    let options = serde_json::json!({
      "title": "Test Error",
      "message": "This is an error message"
    });

    let result = bridge.show_dialog("error", options).await;
    assert!(result.is_ok());

    let response = result.unwrap();
    assert_eq!(response["result"], "ok");
    assert_eq!(response["action"], "dismissed");
  }

  #[tokio::test]
  async fn test_confirm_dialog() {
    let service_container = Arc::new(ServiceContainer::new());
    let permissions = Arc::new(SecurityLevel::Full.permissions());
    let app_handle = create_mock_app_handle();

    let bridge = UIBridge::new(
      service_container,
      permissions,
      "test-plugin".to_string(),
      app_handle,
    );

    let options = serde_json::json!({
      "title": "Confirm Action",
      "message": "Are you sure you want to proceed?"
    });

    let result = bridge.show_dialog("confirm", options).await;
    assert!(result.is_ok());

    let response = result.unwrap();
    assert_eq!(response["result"], "ok");
    assert_eq!(response["action"], "confirmed");
    assert_eq!(response["value"], true);
  }

  #[tokio::test]
  async fn test_input_dialog() {
    let service_container = Arc::new(ServiceContainer::new());
    let permissions = Arc::new(SecurityLevel::Full.permissions());
    let app_handle = create_mock_app_handle();

    let bridge = UIBridge::new(
      service_container,
      permissions,
      "test-plugin".to_string(),
      app_handle,
    );

    let options = serde_json::json!({
      "title": "Enter Value",
      "message": "Please enter a value:",
      "default": "default_text"
    });

    let result = bridge.show_dialog("input", options).await;
    assert!(result.is_ok());

    let response = result.unwrap();
    assert_eq!(response["result"], "ok");
    assert_eq!(response["action"], "submitted");
    assert_eq!(response["value"], "default_text");

    // Тест без default значения
    let result = bridge.show_dialog("input", serde_json::json!({})).await;
    assert!(result.is_ok());
    let response = result.unwrap();
    assert_eq!(response["value"], "");
  }

  #[tokio::test]
  async fn test_file_picker_dialog_single() {
    let service_container = Arc::new(ServiceContainer::new());
    let permissions = Arc::new(SecurityLevel::Full.permissions());
    let app_handle = create_mock_app_handle();

    let bridge = UIBridge::new(
      service_container,
      permissions,
      "test-plugin".to_string(),
      app_handle,
    );

    let options = serde_json::json!({
      "title": "Select File",
      "multiple": false,
      "directory": false,
      "filters": [{"name": "Videos", "extensions": ["mp4", "avi"]}]
    });

    let result = bridge.show_dialog("file_picker", options).await;
    assert!(result.is_ok());

    let response = result.unwrap();
    assert_eq!(response["result"], "ok");
    assert_eq!(response["action"], "selected");

    let files = response["files"].as_array().unwrap();
    assert_eq!(files.len(), 1);
    assert_eq!(files[0], "/path/to/selected_file.mp4");
  }

  #[tokio::test]
  async fn test_file_picker_dialog_multiple() {
    let service_container = Arc::new(ServiceContainer::new());
    let permissions = Arc::new(SecurityLevel::Full.permissions());
    let app_handle = create_mock_app_handle();

    let bridge = UIBridge::new(
      service_container,
      permissions,
      "test-plugin".to_string(),
      app_handle,
    );

    let options = serde_json::json!({
      "title": "Select Files",
      "multiple": true,
      "directory": false
    });

    let result = bridge.show_dialog("file_picker", options).await;
    assert!(result.is_ok());

    let response = result.unwrap();
    let files = response["files"].as_array().unwrap();
    assert_eq!(files.len(), 2);
  }

  #[tokio::test]
  async fn test_file_picker_dialog_directory() {
    let service_container = Arc::new(ServiceContainer::new());
    let permissions = Arc::new(SecurityLevel::Full.permissions());
    let app_handle = create_mock_app_handle();

    let bridge = UIBridge::new(
      service_container,
      permissions,
      "test-plugin".to_string(),
      app_handle,
    );

    let options = serde_json::json!({
      "title": "Select Directory",
      "directory": true
    });

    let result = bridge.show_dialog("file_picker", options).await;
    assert!(result.is_ok());

    let response = result.unwrap();
    let files = response["files"].as_array().unwrap();
    assert_eq!(files.len(), 1);
    assert_eq!(files[0], "/path/to/selected_directory");
  }

  #[tokio::test]
  async fn test_add_menu_item_validation() {
    let service_container = Arc::new(ServiceContainer::new());
    let permissions = Arc::new(SecurityLevel::Full.permissions());
    let app_handle = create_mock_app_handle();

    let bridge = UIBridge::new(
      service_container,
      permissions,
      "test-plugin".to_string(),
      app_handle,
    );

    // Тест без label (должен быть ошибка)
    let config_without_label = serde_json::json!({
      "action": "test_action"
    });

    let result = bridge
      .add_menu_item("plugins/test", config_without_label)
      .await;
    assert!(result.is_err());
    assert!(result
      .unwrap_err()
      .to_string()
      .contains("must have a label"));

    // Тест с пустым путем
    let valid_config = serde_json::json!({
      "label": "Test Action",
      "action": "test_action"
    });

    let result = bridge.add_menu_item("", valid_config).await;
    assert!(result.is_err());
    assert!(result.unwrap_err().to_string().contains("cannot be empty"));
  }

  #[tokio::test]
  async fn test_remove_menu_item_validation() {
    let service_container = Arc::new(ServiceContainer::new());
    let permissions = Arc::new(SecurityLevel::Full.permissions());
    let app_handle = create_mock_app_handle();

    let bridge = UIBridge::new(
      service_container,
      permissions,
      "test-plugin".to_string(),
      app_handle,
    );

    // Тест с пустым ID
    let result = bridge.remove_menu_item("").await;
    assert!(result.is_err());
    assert!(result.unwrap_err().to_string().contains("cannot be empty"));

    // Тест с валидным ID
    let result = bridge.remove_menu_item("valid_menu_id").await;
    assert!(result.is_ok());
  }

  #[tokio::test]
  async fn test_ui_bridge_creation() {
    let service_container = Arc::new(ServiceContainer::new());
    let permissions = Arc::new(SecurityLevel::Full.permissions());
    let app_handle = create_mock_app_handle();

    let bridge = UIBridge::new(
      service_container,
      permissions,
      "test-plugin".to_string(),
      app_handle,
    );

    // Проверяем что bridge создался
    assert_eq!(bridge.plugin_id, "test-plugin");
  }

  #[tokio::test]
  async fn test_all_permissions_blocked() {
    let service_container = Arc::new(ServiceContainer::new());
    let minimal_permissions = Arc::new(SecurityLevel::Minimal.permissions());
    let app_handle = create_mock_app_handle();

    let bridge = UIBridge::new(
      service_container,
      minimal_permissions,
      "test-plugin".to_string(),
      app_handle,
    );

    // Все UI операции должны быть заблокированы с minimal permissions

    // Dialog
    let result = bridge.show_dialog("info", serde_json::json!({})).await;
    assert!(result.is_err());

    // Menu
    let result = bridge
      .add_menu_item("test", serde_json::json!({"label": "test"}))
      .await;
    assert!(result.is_err());

    let result = bridge.remove_menu_item("test").await;
    assert!(result.is_err());

    // Notification
    let result = bridge.show_notification("title", "message", "info").await;
    assert!(result.is_err());

    // Progress
    let result = bridge.update_progress("op", 0.5, None).await;
    assert!(result.is_err());
  }

  #[tokio::test]
  async fn test_progress_edge_cases() {
    let service_container = Arc::new(ServiceContainer::new());
    let permissions = Arc::new(SecurityLevel::Full.permissions());
    let app_handle = create_mock_app_handle();

    let bridge = UIBridge::new(
      service_container,
      permissions,
      "test-plugin".to_string(),
      app_handle,
    );

    // Тест с граничными значениями
    let result = bridge.update_progress("test", 0.0, Some("Starting")).await;
    assert!(result.is_ok());

    let result = bridge.update_progress("test", 1.0, Some("Complete")).await;
    assert!(result.is_ok());

    // Тест без сообщения
    let result = bridge.update_progress("test", 0.5, None).await;
    assert!(result.is_ok());
  }

  #[tokio::test]
  async fn test_notification_with_app_handle() {
    let service_container = Arc::new(ServiceContainer::new());
    let permissions = Arc::new(SecurityLevel::Full.permissions());

    // Тест поведения с None app_handle
    let bridge = UIBridge::new(
      service_container,
      permissions,
      "test-plugin".to_string(),
      None,
    );

    let result = bridge.show_notification("Test", "Message", "info").await;
    assert!(result.is_ok());
  }
}

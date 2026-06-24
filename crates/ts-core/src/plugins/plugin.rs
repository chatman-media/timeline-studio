//! Основные типы и trait для системы плагинов

use super::context::PluginContext;
use crate::AppEvent;
use ts_render::video_compiler::error::Result;
use async_trait::async_trait;
use serde::{Deserialize, Serialize};
use specta::Type;
use uuid::Uuid;

/// Типы плагинов
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize, Type)]
pub enum PluginType {
  /// Видео эффекты и фильтры
  Effect,
  /// Переходы между клипами
  Transition,
  /// Генераторы контента (титры, фоны)
  Generator,
  /// Анализаторы медиа
  Analyzer,
  /// Экспортеры в различные форматы
  Exporter,
  /// Интеграции с внешними сервисами
  Service,
  /// Инструменты UI
  Tool,
  /// Универсальный тип
  Universal,
}

/// Версия плагина
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize, Type)]
pub struct Version {
  pub major: u32,
  pub minor: u32,
  pub patch: u32,
  pub pre_release: Option<String>,
}

impl Version {
  pub fn new(major: u32, minor: u32, patch: u32) -> Self {
    Self {
      major,
      minor,
      patch,
      pre_release: None,
    }
  }
}

impl std::fmt::Display for Version {
  fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
    write!(f, "{}.{}.{}", self.major, self.minor, self.patch)?;
    if let Some(pre) = &self.pre_release {
      write!(f, "-{pre}")?;
    }
    Ok(())
  }
}

/// Зависимость плагина
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct PluginDependency {
  pub plugin_id: String,
  pub min_version: Option<Version>,
  pub max_version: Option<Version>,
}

/// Метаданные плагина
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct PluginMetadata {
  /// Уникальный идентификатор плагина
  pub id: String,
  /// Человекочитаемое имя
  pub name: String,
  /// Версия плагина
  pub version: Version,
  /// Автор плагина
  pub author: String,
  /// Описание
  pub description: String,
  /// Тип плагина
  pub plugin_type: PluginType,
  /// URL домашней страницы
  pub homepage: Option<String>,
  /// Лицензия
  pub license: Option<String>,
  /// Зависимости
  pub dependencies: Vec<PluginDependency>,
  /// Минимальная версия Timeline Studio
  pub min_app_version: Option<Version>,
}

/// Команда для плагина
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct PluginCommand {
  pub id: Uuid,
  pub command: String,
  pub params: serde_json::Value,
}

/// Ответ от плагина
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct PluginResponse {
  pub command_id: Uuid,
  pub success: bool,
  pub data: Option<serde_json::Value>,
  pub error: Option<String>,
}

/// Типы событий на которые может подписаться плагин
#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize, Type)]
pub enum AppEventType {
  ProjectCreated,
  ProjectOpened,
  ProjectSaved,
  ProjectClosed,
  MediaImported,
  MediaProcessed,
  RenderStarted,
  RenderProgress,
  RenderCompleted,
  RenderFailed,
  TimelineChanged,
  SettingsChanged,
  All, // Подписка на все события
}

/// Состояние плагина
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize, Type)]
pub enum PluginState {
  /// Плагин загружен но не инициализирован
  Loaded,
  /// Плагин инициализируется
  Initializing,
  /// Плагин активен и работает
  Active,
  /// Плагин приостановлен
  Suspended,
  /// Плагин останавливается
  Stopping,
  /// Плагин остановлен
  Stopped,
  /// Произошла ошибка
  Error(String),
}

/// Основной trait для плагинов
#[async_trait]
pub trait Plugin: Send + Sync + 'static {
  /// Получить метаданные плагина
  fn metadata(&self) -> &PluginMetadata;

  /// Инициализация плагина
  async fn initialize(&mut self, context: PluginContext) -> Result<()>;

  /// Остановка плагина
  async fn shutdown(&mut self) -> Result<()>;

  /// Обработка команды
  async fn handle_command(&self, command: PluginCommand) -> Result<PluginResponse>;

  /// Типы событий на которые подписан плагин
  fn subscribed_events(&self) -> Vec<AppEventType> {
    vec![]
  }

  /// Обработка события
  async fn handle_event(&self, event: &AppEvent) -> Result<()> {
    // По умолчанию игнорируем события
    let _ = event;
    Ok(())
  }

  /// Получить текущее состояние плагина
  fn state(&self) -> PluginState {
    PluginState::Active
  }

  /// Приостановить работу плагина
  async fn suspend(&mut self) -> Result<()> {
    Ok(())
  }

  /// Возобновить работу плагина
  async fn resume(&mut self) -> Result<()> {
    Ok(())
  }
}

/// Результат валидации плагина
#[derive(Debug)]
pub struct PluginValidationResult {
  pub is_valid: bool,
  pub errors: Vec<String>,
  pub warnings: Vec<String>,
}

impl PluginValidationResult {
  pub fn valid() -> Self {
    Self {
      is_valid: true,
      errors: vec![],
      warnings: vec![],
    }
  }

  pub fn invalid(error: String) -> Self {
    Self {
      is_valid: false,
      errors: vec![error],
      warnings: vec![],
    }
  }

  pub fn add_error(&mut self, error: String) {
    self.errors.push(error);
    self.is_valid = false;
  }

  pub fn add_warning(&mut self, warning: String) {
    self.warnings.push(warning);
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn test_version_creation() {
    let version = Version::new(1, 2, 3);
    assert_eq!(version.major, 1);
    assert_eq!(version.minor, 2);
    assert_eq!(version.patch, 3);
    assert!(version.pre_release.is_none());
  }

  #[test]
  fn test_version_display() {
    let version = Version::new(1, 2, 3);
    assert_eq!(version.to_string(), "1.2.3");

    let version_pre = Version {
      major: 2,
      minor: 0,
      patch: 0,
      pre_release: Some("beta.1".to_string()),
    };
    assert_eq!(version_pre.to_string(), "2.0.0-beta.1");
  }

  #[test]
  fn test_version_equality() {
    let v1 = Version::new(1, 0, 0);
    let v2 = Version::new(1, 0, 0);
    let v3 = Version::new(1, 0, 1);

    assert_eq!(v1, v2);
    assert_ne!(v1, v3);
  }

  #[test]
  fn test_plugin_type_serialization() {
    let plugin_type = PluginType::Effect;
    let serialized = serde_json::to_string(&plugin_type).unwrap();
    assert_eq!(serialized, "\"Effect\"");

    let deserialized: PluginType = serde_json::from_str(&serialized).unwrap();
    assert_eq!(deserialized, PluginType::Effect);
  }

  #[test]
  fn test_plugin_state_transitions() {
    let state = PluginState::Loaded;
    assert_eq!(state, PluginState::Loaded);

    let error_state = PluginState::Error("Test error".to_string());
    match error_state {
      PluginState::Error(msg) => assert_eq!(msg, "Test error"),
      _ => panic!("Expected error state"),
    }
  }

  #[test]
  fn test_app_event_type() {
    let event_type = AppEventType::ProjectCreated;
    assert_eq!(event_type, AppEventType::ProjectCreated);
    assert_ne!(event_type, AppEventType::ProjectOpened);

    // Test All event type
    let all_events = AppEventType::All;
    assert_eq!(all_events, AppEventType::All);
  }

  #[test]
  fn test_plugin_metadata() {
    let metadata = PluginMetadata {
      id: "test-plugin".to_string(),
      name: "Test Plugin".to_string(),
      version: Version::new(1, 0, 0),
      description: "A test plugin".to_string(),
      author: "Test Author".to_string(),
      plugin_type: PluginType::Effect,
      homepage: Some("https://example.com".to_string()),
      license: Some("MIT".to_string()),
      dependencies: vec![],
      min_app_version: Some(Version::new(0, 1, 0)),
    };

    assert_eq!(metadata.id, "test-plugin");
    assert_eq!(metadata.name, "Test Plugin");
    assert_eq!(metadata.plugin_type, PluginType::Effect);
    assert_eq!(metadata.homepage, Some("https://example.com".to_string()));
    assert_eq!(metadata.license, Some("MIT".to_string()));
  }

  #[test]
  fn test_plugin_command() {
    let command_id = Uuid::new_v4();
    let command = PluginCommand {
      id: command_id,
      command: "test_action".to_string(),
      params: serde_json::json!({"param": "value"}),
    };

    assert_eq!(command.id, command_id);
    assert_eq!(command.command, "test_action");
    assert_eq!(command.params, serde_json::json!({"param": "value"}));
  }

  #[test]
  fn test_plugin_response() {
    let command_id = Uuid::new_v4();
    let success_response = PluginResponse {
      command_id,
      success: true,
      data: Some(serde_json::json!({"result": "success"})),
      error: None,
    };

    assert_eq!(success_response.command_id, command_id);
    assert!(success_response.success);
    assert!(success_response.data.is_some());
    assert!(success_response.error.is_none());

    let error_response = PluginResponse {
      command_id,
      success: false,
      data: None,
      error: Some("Something went wrong".to_string()),
    };

    assert!(!error_response.success);
    assert!(error_response.data.is_none());
    assert_eq!(error_response.error.unwrap(), "Something went wrong");
  }

  #[test]
  fn test_plugin_validation_result() {
    let mut result = PluginValidationResult::valid();
    assert!(result.is_valid);
    assert!(result.errors.is_empty());
    assert!(result.warnings.is_empty());

    result.add_warning("This is a warning".to_string());
    assert!(result.is_valid);
    assert_eq!(result.warnings.len(), 1);

    result.add_error("This is an error".to_string());
    assert!(!result.is_valid);
    assert_eq!(result.errors.len(), 1);
  }

  #[test]
  fn test_plugin_validation_result_invalid() {
    let result = PluginValidationResult::invalid("Critical error".to_string());
    assert!(!result.is_valid);
    assert_eq!(result.errors.len(), 1);
    assert_eq!(result.errors[0], "Critical error");
  }

  #[test]
  fn test_plugin_serialization() {
    let metadata = PluginMetadata {
      id: "test".to_string(),
      name: "Test".to_string(),
      version: Version::new(1, 0, 0),
      description: "Test".to_string(),
      author: "Test".to_string(),
      plugin_type: PluginType::Effect,
      homepage: None,
      license: None,
      dependencies: vec![],
      min_app_version: Some(Version::new(0, 1, 0)),
    };

    let serialized = serde_json::to_string(&metadata).unwrap();
    let deserialized: PluginMetadata = serde_json::from_str(&serialized).unwrap();

    assert_eq!(metadata.id, deserialized.id);
    assert_eq!(metadata.version, deserialized.version);
    assert_eq!(metadata.plugin_type, deserialized.plugin_type);
  }
}

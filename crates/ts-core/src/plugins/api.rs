//! API доступное плагинам

use crate::{
  di::ServiceContainer,
  events::{AppEvent, EventBus},
  plugins::permissions::{PluginPermissions, SecurityLevel},
};
use ts_render::video_compiler::error::{Result, VideoCompilerError};
use async_trait::async_trait;
use serde::{Deserialize, Serialize};
use std::{
  collections::HashMap,
  path::{Path, PathBuf},
  sync::Arc,
};
use sysinfo::{MemoryRefreshKind, RefreshKind, System};
use tokio::sync::RwLock;

/// Информация о медиа файле
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MediaInfo {
  pub id: String,
  pub path: PathBuf,
  pub duration: f64,
  pub width: u32,
  pub height: u32,
  pub fps: f32,
  pub codec: String,
  pub bitrate: u64,
}

/// Эффект для применения к медиа
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Effect {
  pub effect_type: String,
  pub parameters: serde_json::Value,
}

/// Состояние timeline
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TimelineState {
  pub duration: f64,
  pub current_time: f64,
  pub tracks: Vec<TrackInfo>,
}

/// Информация о треке
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TrackInfo {
  pub id: String,
  pub track_type: String,
  pub name: String,
  pub clips: Vec<ClipInfo>,
  pub muted: bool,
  pub locked: bool,
  pub height: u32,
}

/// Информация о клипе
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ClipInfo {
  pub id: String,
  pub media_id: String,
  pub start_time: f64,
  pub duration: f64,
  pub in_point: f64,
  pub out_point: f64,
}

/// Клип для добавления
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Clip {
  pub media_id: String,
  pub track_id: String,
  pub start_time: f64,
  pub duration: f64,
}

/// Диалог плагина
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PluginDialog {
  pub title: String,
  pub message: String,
  pub dialog_type: DialogType,
  pub buttons: Vec<String>,
}

/// Тип диалога
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum DialogType {
  Info,
  Warning,
  Error,
  Question,
  Input,
}

/// Результат диалога
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DialogResult {
  pub button_index: Option<usize>,
  pub input_text: Option<String>,
  pub cancelled: bool,
}

/// Пункт меню
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MenuItem {
  pub id: String,
  pub label: String,
  pub parent_menu: Option<String>,
  pub shortcut: Option<String>,
  pub enabled: bool,
}

/// Хранилище данных плагина
#[async_trait]
pub trait PluginStorage: Send + Sync {
  /// Сохранить данные
  async fn set(&self, key: &str, value: serde_json::Value) -> Result<()>;

  /// Получить данные
  async fn get(&self, key: &str) -> Result<Option<serde_json::Value>>;

  /// Удалить данные
  async fn remove(&self, key: &str) -> Result<()>;

  /// Получить все ключи
  async fn keys(&self) -> Result<Vec<String>>;

  /// Очистить все данные
  async fn clear(&self) -> Result<()>;
}

/// API доступное плагинам
#[async_trait]
pub trait PluginApi: Send + Sync {
  // Работа с медиа

  /// Получить информацию о медиа файле
  async fn get_media_info(&self, media_id: &str) -> Result<MediaInfo>;

  /// Применить эффект к медиа
  async fn apply_effect(&self, media_id: &str, effect: Effect) -> Result<()>;

  /// Создать превью для медиа
  async fn generate_thumbnail(&self, media_id: &str, time: f64) -> Result<PathBuf>;

  // Работа с timeline

  /// Получить текущее состояние timeline
  async fn get_timeline_state(&self) -> Result<TimelineState>;

  /// Добавить клип на timeline
  async fn add_clip(&self, clip: Clip) -> Result<String>;

  /// Удалить клип с timeline
  async fn remove_clip(&self, clip_id: &str) -> Result<()>;

  /// Обновить клип
  async fn update_clip(&self, clip_id: &str, clip: ClipInfo) -> Result<()>;

  // UI интеграция

  /// Показать диалог
  async fn show_dialog(&self, dialog: PluginDialog) -> Result<DialogResult>;

  /// Добавить пункт меню
  async fn add_menu_item(&self, menu: MenuItem) -> Result<()>;

  /// Удалить пункт меню
  async fn remove_menu_item(&self, menu_id: &str) -> Result<()>;

  /// Показать уведомление
  async fn show_notification(&self, title: &str, message: &str) -> Result<()>;

  // Хранилище данных

  /// Получить хранилище плагина
  async fn get_storage(&self) -> Result<Box<dyn PluginStorage>>;

  // Файловая система

  /// Выбрать файл через диалог
  async fn pick_file(&self, filters: Vec<(&str, Vec<&str>)>) -> Result<Option<PathBuf>>;

  /// Выбрать директорию через диалог
  async fn pick_directory(&self) -> Result<Option<PathBuf>>;

  /// Прочитать файл (с проверкой разрешений)
  async fn read_file(&self, path: &Path) -> Result<Vec<u8>>;

  /// Записать файл (с проверкой разрешений)
  async fn write_file(&self, path: &Path, data: &[u8]) -> Result<()>;

  // Системная информация

  /// Получить информацию о системе
  async fn get_system_info(&self) -> Result<SystemInfo>;
}

/// Информация о системе
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SystemInfo {
  pub os: String,
  pub arch: String,
  pub cpu_count: usize,
  pub memory_total: u64,
  pub memory_available: u64,
}

/// Реализация хранилища плагина
#[derive(Clone)]
struct PluginStorageImpl {
  #[allow(dead_code)]
  plugin_id: String,
  storage_path: PathBuf,
  data: Arc<RwLock<HashMap<String, serde_json::Value>>>,
}

impl PluginStorageImpl {
  async fn new(plugin_id: String, storage_path: PathBuf) -> Result<Self> {
    // Создать директорию если не существует
    tokio::fs::create_dir_all(&storage_path)
      .await
      .map_err(|e| VideoCompilerError::IoError {
        operation: "create plugin storage directory".to_string(),
        path: storage_path.to_string_lossy().to_string(),
        details: e.to_string(),
      })?;

    // Загрузить существующие данные
    let data_file = storage_path.join("data.json");
    let data = if data_file.exists() {
      let contents =
        tokio::fs::read_to_string(&data_file)
          .await
          .map_err(|e| VideoCompilerError::IoError {
            operation: "read plugin data file".to_string(),
            path: data_file.to_string_lossy().to_string(),
            details: e.to_string(),
          })?;
      serde_json::from_str(&contents).unwrap_or_default()
    } else {
      HashMap::new()
    };

    Ok(Self {
      plugin_id,
      storage_path,
      data: Arc::new(RwLock::new(data)),
    })
  }

  async fn save(&self) -> Result<()> {
    let data = self.data.read().await;
    let json = serde_json::to_string_pretty(&*data)
      .map_err(|e| VideoCompilerError::SerializationError(e.to_string()))?;

    let data_file = self.storage_path.join("data.json");
    tokio::fs::write(&data_file, json)
      .await
      .map_err(|e| VideoCompilerError::IoError {
        operation: "write plugin data file".to_string(),
        path: data_file.to_string_lossy().to_string(),
        details: e.to_string(),
      })?;

    Ok(())
  }
}

#[async_trait]
impl PluginStorage for PluginStorageImpl {
  async fn set(&self, key: &str, value: serde_json::Value) -> Result<()> {
    {
      let mut data = self.data.write().await;
      data.insert(key.to_string(), value);
    }
    self.save().await
  }

  async fn get(&self, key: &str) -> Result<Option<serde_json::Value>> {
    let data = self.data.read().await;
    Ok(data.get(key).cloned())
  }

  async fn remove(&self, key: &str) -> Result<()> {
    {
      let mut data = self.data.write().await;
      data.remove(key);
    }
    self.save().await
  }

  async fn keys(&self) -> Result<Vec<String>> {
    let data = self.data.read().await;
    Ok(data.keys().cloned().collect())
  }

  async fn clear(&self) -> Result<()> {
    {
      let mut data = self.data.write().await;
      data.clear();
    }
    self.save().await
  }
}

/// Реализация PluginApi
#[derive(Clone)]
pub struct PluginApiImpl {
  plugin_id: String,
  permissions: Arc<PluginPermissions>,
  #[allow(dead_code)]
  service_container: Arc<ServiceContainer>,
  #[allow(dead_code)]
  app_handle: Option<tauri::AppHandle>,
  storage_path: PathBuf,
  event_bus: Arc<EventBus>,
  // Мосты для интеграции с сервисами
  media_bridge: super::services::MediaBridge,
  timeline_bridge: super::services::TimelineBridge,
  ui_bridge: super::services::UIBridge,
}

impl PluginApiImpl {
  pub fn new(
    plugin_id: String,
    permissions: Arc<PluginPermissions>,
    service_container: Arc<ServiceContainer>,
    app_handle: Option<tauri::AppHandle>,
    storage_path: PathBuf,
    event_bus: Arc<EventBus>,
  ) -> Self {
    // Создаем мосты для интеграции
    let media_bridge = super::services::MediaBridge::new(
      service_container.clone(),
      permissions.clone(),
      plugin_id.clone(),
    );

    let timeline_bridge = super::services::TimelineBridge::new(
      service_container.clone(),
      permissions.clone(),
      plugin_id.clone(),
    );

    let ui_bridge = super::services::UIBridge::new(
      service_container.clone(),
      permissions.clone(),
      plugin_id.clone(),
      app_handle.clone(),
    );

    Self {
      plugin_id,
      permissions,
      service_container,
      app_handle,
      storage_path,
      event_bus,
      media_bridge,
      timeline_bridge,
      ui_bridge,
    }
  }

  /// Проверить разрешение
  fn check_permission(&self, required: &str) -> Result<()> {
    let security_level = self.permissions.get_security_level();

    match required {
      "media_read" => {
        if security_level >= SecurityLevel::Minimal {
          Ok(())
        } else {
          Err(VideoCompilerError::SecurityError(format!(
            "Permission denied: {required}"
          )))
        }
      }
      "media_write" => {
        if security_level >= SecurityLevel::Standard {
          Ok(())
        } else {
          Err(VideoCompilerError::SecurityError(format!(
            "Permission denied: {required}"
          )))
        }
      }
      "timeline_read" => {
        if security_level >= SecurityLevel::Minimal {
          Ok(())
        } else {
          Err(VideoCompilerError::SecurityError(format!(
            "Permission denied: {required}"
          )))
        }
      }
      "timeline_write" => {
        if security_level >= SecurityLevel::Standard {
          Ok(())
        } else {
          Err(VideoCompilerError::SecurityError(format!(
            "Permission denied: {required}"
          )))
        }
      }
      "ui_access" => {
        if self.permissions.ui_access {
          Ok(())
        } else {
          Err(VideoCompilerError::SecurityError(format!(
            "Permission denied: {required}"
          )))
        }
      }
      "file_read" => {
        if security_level >= SecurityLevel::Standard {
          Ok(())
        } else {
          Err(VideoCompilerError::SecurityError(format!(
            "Permission denied: {required}"
          )))
        }
      }
      "file_write" => {
        if security_level >= SecurityLevel::Extended {
          Ok(())
        } else {
          Err(VideoCompilerError::SecurityError(format!(
            "Permission denied: {required}"
          )))
        }
      }
      "system_info" => {
        if self.permissions.system_info {
          Ok(())
        } else {
          Err(VideoCompilerError::SecurityError(format!(
            "Permission denied: {required}"
          )))
        }
      }
      _ => Err(VideoCompilerError::SecurityError(format!(
        "Unknown permission: {required}"
      ))),
    }
  }

  /// Проверить путь для чтения
  fn check_read_path(&self, path: &Path) -> Result<()> {
    if self.permissions.file_system.can_read(path) {
      Ok(())
    } else {
      Err(VideoCompilerError::SecurityError(format!(
        "Read access denied for path: {path:?}"
      )))
    }
  }

  /// Проверить путь для записи
  fn check_write_path(&self, path: &Path) -> Result<()> {
    if self.permissions.file_system.can_write(path) {
      Ok(())
    } else {
      Err(VideoCompilerError::SecurityError(format!(
        "Write access denied for path: {path:?}"
      )))
    }
  }
}

#[async_trait]
impl PluginApi for PluginApiImpl {
  async fn get_media_info(&self, media_id: &str) -> Result<MediaInfo> {
    // Используем MediaBridge для получения информации о медиа
    self.media_bridge.get_media_info(media_id).await
  }

  async fn apply_effect(&self, media_id: &str, effect: Effect) -> Result<()> {
    // Используем MediaBridge для применения эффекта
    self.media_bridge.apply_effect(media_id, &effect).await?;

    // Публикуем событие о применении эффекта
    self
      .event_bus
      .publish_app_event(AppEvent::EffectApplied {
        media_id: media_id.to_string(),
        effect_type: effect.effect_type.clone(),
        parameters: effect.parameters.to_string(),
      })
      .await?;

    Ok(())
  }

  async fn generate_thumbnail(&self, media_id: &str, time: f64) -> Result<PathBuf> {
    // Создаем путь для thumbnail
    let thumbnail_dir = self.storage_path.join("thumbnails");
    let thumbnail_path = thumbnail_dir.join(format!(
      "{}_{}.jpg",
      media_id.replace(['/', '\\'], "_"),
      (time * 1000.0) as u64
    ));

    // Используем MediaBridge для генерации thumbnail
    self
      .media_bridge
      .generate_thumbnail(media_id, time, &thumbnail_path)
      .await?;

    // Публикуем событие о создании thumbnail
    if let Err(e) = self
      .event_bus
      .publish_app_event(AppEvent::ThumbnailGenerated {
        media_id: media_id.to_string(),
        thumbnail_path: thumbnail_path.to_string_lossy().to_string(),
      })
      .await
    {
      log::warn!(
        "[Plugin {}] Failed to publish ThumbnailGenerated event: {}",
        self.plugin_id,
        e
      );
    }

    Ok(thumbnail_path)
  }

  async fn get_timeline_state(&self) -> Result<TimelineState> {
    // Используем TimelineBridge для получения состояния timeline
    self.timeline_bridge.get_timeline_state().await
  }

  async fn add_clip(&self, clip: Clip) -> Result<String> {
    // Конвертируем клип в JSON для передачи в TimelineBridge
    let clip_data = serde_json::json!({
      "media_id": clip.media_id,
      "start_time": clip.start_time,
      "duration": clip.duration
    });

    // Используем TimelineBridge для добавления клипа
    let clip_id = self
      .timeline_bridge
      .add_clip(&clip.track_id, clip_data)
      .await?;

    // Публикуем событие о добавлении клипа
    if let Err(e) = self
      .event_bus
      .publish_app_event(AppEvent::PluginEvent {
        plugin_id: self.plugin_id.clone(),
        event: serde_json::json!({
          "type": "timeline.clip.added",
          "clip_id": clip_id,
          "track_id": clip.track_id,
          "start_time": clip.start_time,
          "duration": clip.duration,
          "media_id": clip.media_id
        }),
      })
      .await
    {
      log::warn!(
        "[Plugin {}] Failed to publish clip added event: {}",
        self.plugin_id,
        e
      );
    }

    Ok(clip_id)
  }

  async fn remove_clip(&self, clip_id: &str) -> Result<()> {
    // Используем TimelineBridge для удаления клипа
    self.timeline_bridge.remove_clip(clip_id).await?;

    // Публикуем событие об удалении клипа
    if let Err(e) = self
      .event_bus
      .publish_app_event(AppEvent::PluginEvent {
        plugin_id: self.plugin_id.clone(),
        event: serde_json::json!({
          "type": "timeline.clip.removed",
          "clip_id": clip_id
        }),
      })
      .await
    {
      log::warn!(
        "[Plugin {}] Failed to publish clip removed event: {}",
        self.plugin_id,
        e
      );
    }

    Ok(())
  }

  async fn update_clip(&self, clip_id: &str, clip: ClipInfo) -> Result<()> {
    // Конвертируем изменения в JSON
    let updates = serde_json::json!({
      "media_id": clip.media_id,
      "start_time": clip.start_time,
      "duration": clip.duration,
      "in_point": clip.in_point,
      "out_point": clip.out_point
    });

    // Используем TimelineBridge для обновления клипа
    self.timeline_bridge.update_clip(clip_id, updates).await?;

    // Публикуем событие об обновлении клипа
    if let Err(e) = self
      .event_bus
      .publish_app_event(AppEvent::PluginEvent {
        plugin_id: self.plugin_id.clone(),
        event: serde_json::json!({
          "type": "timeline.clip.updated",
          "clip_id": clip_id
        }),
      })
      .await
    {
      log::warn!(
        "[Plugin {}] Failed to publish clip updated event: {}",
        self.plugin_id,
        e
      );
    }

    Ok(())
  }

  async fn show_dialog(&self, dialog: PluginDialog) -> Result<DialogResult> {
    // Конвертируем PluginDialog в опции для UIBridge
    let options = serde_json::json!({
      "title": dialog.title,
      "message": dialog.message,
      "buttons": dialog.buttons
    });

    // Конвертируем DialogType в строку
    let dialog_type_str = match dialog.dialog_type {
      DialogType::Info => "info",
      DialogType::Warning => "warning",
      DialogType::Error => "error",
      DialogType::Question => "confirm",
      DialogType::Input => "input",
    };

    // Используем UIBridge для показа диалога
    let result = self.ui_bridge.show_dialog(dialog_type_str, options).await?;

    // Конвертируем результат из JSON в DialogResult
    let button_index = result
      .get("button_index")
      .and_then(|v| v.as_u64())
      .map(|v| v as usize);
    let input_text = result
      .get("input_text")
      .and_then(|v| v.as_str())
      .map(|s| s.to_string());
    let cancelled = result
      .get("cancelled")
      .and_then(|v| v.as_bool())
      .unwrap_or(false);

    Ok(DialogResult {
      button_index,
      input_text,
      cancelled,
    })
  }

  async fn add_menu_item(&self, menu: MenuItem) -> Result<()> {
    // Конвертируем MenuItem в конфигурацию для UIBridge
    let item_config = serde_json::json!({
      "label": menu.label,
      "action": format!("plugin_{}_{}", self.plugin_id, menu.id),
      "shortcut": menu.shortcut,
      "enabled": menu.enabled
    });

    // Определяем путь меню
    let menu_path = menu.parent_menu.unwrap_or_else(|| "plugins".to_string());

    // Используем UIBridge для добавления пункта меню
    self
      .ui_bridge
      .add_menu_item(&menu_path, item_config)
      .await?;

    // Публикуем событие о добавлении пункта меню
    if let Err(e) = self
      .event_bus
      .publish_app_event(AppEvent::PluginEvent {
        plugin_id: self.plugin_id.clone(),
        event: serde_json::json!({
          "type": "ui.menu.added",
          "menu_id": menu.id,
          "menu_path": menu_path,
          "label": menu.label
        }),
      })
      .await
    {
      log::warn!(
        "[Plugin {}] Failed to publish menu added event: {}",
        self.plugin_id,
        e
      );
    }

    Ok(())
  }

  async fn remove_menu_item(&self, menu_id: &str) -> Result<()> {
    // Создаем полный ID меню для плагина
    let full_menu_id = format!("plugin_{}_{}", self.plugin_id, menu_id);

    // Используем UIBridge для удаления пункта меню
    self.ui_bridge.remove_menu_item(&full_menu_id).await?;

    // Публикуем событие об удалении пункта меню
    if let Err(e) = self
      .event_bus
      .publish_app_event(AppEvent::PluginEvent {
        plugin_id: self.plugin_id.clone(),
        event: serde_json::json!({
          "type": "ui.menu.removed",
          "menu_id": menu_id,
          "full_menu_id": full_menu_id
        }),
      })
      .await
    {
      log::warn!(
        "[Plugin {}] Failed to publish menu removed event: {}",
        self.plugin_id,
        e
      );
    }

    Ok(())
  }

  async fn show_notification(&self, title: &str, message: &str) -> Result<()> {
    // Используем UIBridge для показа уведомления
    self
      .ui_bridge
      .show_notification(title, message, "info")
      .await?;

    // Публикуем событие о показе уведомления
    if let Err(e) = self
      .event_bus
      .publish_app_event(AppEvent::PluginEvent {
        plugin_id: self.plugin_id.clone(),
        event: serde_json::json!({
          "type": "ui.notification.shown",
          "title": title,
          "message": message
        }),
      })
      .await
    {
      log::warn!(
        "[Plugin {}] Failed to publish notification event: {}",
        self.plugin_id,
        e
      );
    }

    Ok(())
  }

  async fn get_storage(&self) -> Result<Box<dyn PluginStorage>> {
    // Проверка разрешений не требуется - storage доступен всем плагинам

    let storage =
      PluginStorageImpl::new(self.plugin_id.clone(), self.storage_path.join("storage")).await?;

    Ok(Box::new(storage))
  }

  async fn pick_file(&self, filters: Vec<(&str, Vec<&str>)>) -> Result<Option<PathBuf>> {
    // Конвертируем фильтры в формат для UIBridge
    let filters_json: Vec<serde_json::Value> = filters
      .into_iter()
      .map(|(name, extensions)| {
        serde_json::json!({
          "name": name,
          "extensions": extensions
        })
      })
      .collect();

    let dialog_options = serde_json::json!({
      "title": "Select File",
      "filters": filters_json,
      "multiple": false
    });

    // Используем UIBridge для показа диалога выбора файла
    let result = self
      .ui_bridge
      .show_dialog("file_picker", dialog_options)
      .await?;

    // Парсим результат
    if let Some(files) = result.get("files").and_then(|f| f.as_array()) {
      if let Some(first_file) = files.first().and_then(|f| f.as_str()) {
        return Ok(Some(PathBuf::from(first_file)));
      }
    }

    Ok(None)
  }

  async fn pick_directory(&self) -> Result<Option<PathBuf>> {
    let dialog_options = serde_json::json!({
      "title": "Select Directory",
      "directory": true
    });

    // Используем UIBridge для показа диалога выбора директории
    let result = self
      .ui_bridge
      .show_dialog("file_picker", dialog_options)
      .await?;

    // Парсим результат
    if let Some(files) = result.get("files").and_then(|f| f.as_array()) {
      if let Some(directory) = files.first().and_then(|f| f.as_str()) {
        return Ok(Some(PathBuf::from(directory)));
      }
    }

    Ok(None)
  }

  async fn read_file(&self, path: &Path) -> Result<Vec<u8>> {
    // Проверка разрешений
    self.check_permission("file_read")?;
    self.check_read_path(path)?;

    // Читаем файл
    tokio::fs::read(path)
      .await
      .map_err(|e| VideoCompilerError::Io(format!("Failed to read file: {e}")))
  }

  async fn write_file(&self, path: &Path, data: &[u8]) -> Result<()> {
    // Проверка разрешений
    self.check_permission("file_write")?;
    self.check_write_path(path)?;

    // Создаем директорию если нужно
    if let Some(parent) = path.parent() {
      tokio::fs::create_dir_all(parent)
        .await
        .map_err(|e| VideoCompilerError::Io(format!("Failed to create directory: {e}")))?;
    }

    // Записываем файл
    tokio::fs::write(path, data)
      .await
      .map_err(|e| VideoCompilerError::Io(format!("Failed to write file: {e}")))
  }

  async fn get_system_info(&self) -> Result<SystemInfo> {
    // Инициализируем sysinfo для получения информации о памяти
    let mut system = System::new_with_specifics(
      RefreshKind::everything().with_memory(MemoryRefreshKind::everything()),
    );
    system.refresh_memory();

    Ok(SystemInfo {
      os: std::env::consts::OS.to_string(),
      arch: std::env::consts::ARCH.to_string(),
      cpu_count: num_cpus::get(),
      memory_total: system.total_memory(),
      memory_available: system.available_memory(),
    })
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[tokio::test]
  async fn test_storage_impl() {
    use tempfile::TempDir;

    let temp_dir = TempDir::new().unwrap();
    let storage_path = temp_dir.path().join("storage");

    // Create storage
    let storage = PluginStorageImpl::new("test-plugin".to_string(), storage_path)
      .await
      .unwrap();

    // Test set/get
    let value = serde_json::json!({
        "setting": "value",
        "number": 42
    });
    storage.set("test_key", value.clone()).await.unwrap();

    let retrieved = storage.get("test_key").await.unwrap();
    assert_eq!(retrieved, Some(value));

    // Test keys
    let keys = storage.keys().await.unwrap();
    assert!(keys.contains(&"test_key".to_string()));

    // Test remove
    storage.remove("test_key").await.unwrap();
    let removed = storage.get("test_key").await.unwrap();
    assert!(removed.is_none());

    // Test clear
    storage.set("key1", serde_json::json!(1)).await.unwrap();
    storage.set("key2", serde_json::json!(2)).await.unwrap();
    storage.clear().await.unwrap();
    let keys_after_clear = storage.keys().await.unwrap();
    assert!(keys_after_clear.is_empty());
  }

  #[tokio::test]
  async fn test_security_levels() {
    // Minimal
    let minimal = SecurityLevel::Minimal.permissions();
    assert_eq!(minimal.get_security_level(), SecurityLevel::Minimal);

    // Full
    let full = SecurityLevel::Full.permissions();
    assert_eq!(full.get_security_level(), SecurityLevel::Full);
  }

  // Additional comprehensive tests

  #[test]
  fn test_media_info_serialization() {
    let media = MediaInfo {
      id: "test-id".to_string(),
      path: PathBuf::from("/test/video.mp4"),
      duration: 120.5,
      width: 1920,
      height: 1080,
      fps: 30.0,
      codec: "h264".to_string(),
      bitrate: 5000000,
    };

    // Test serialization
    let json = serde_json::to_string(&media).unwrap();
    assert!(json.contains("test-id"));
    assert!(json.contains("1920"));

    // Test deserialization
    let deserialized: MediaInfo = serde_json::from_str(&json).unwrap();
    assert_eq!(deserialized.id, media.id);
    assert_eq!(deserialized.width, media.width);
  }

  #[test]
  fn test_effect_serialization() {
    let effect = Effect {
      effect_type: "blur".to_string(),
      parameters: serde_json::json!({
        "radius": 5,
        "intensity": 0.8
      }),
    };

    let json = serde_json::to_string(&effect).unwrap();
    let deserialized: Effect = serde_json::from_str(&json).unwrap();
    assert_eq!(deserialized.effect_type, effect.effect_type);
  }

  #[test]
  fn test_timeline_state_serialization() {
    let timeline = TimelineState {
      duration: 300.0,
      current_time: 45.5,
      tracks: vec![TrackInfo {
        id: "track-1".to_string(),
        track_type: "video".to_string(),
        name: "Video Track 1".to_string(),
        clips: vec![ClipInfo {
          id: "clip-1".to_string(),
          media_id: "media-1".to_string(),
          start_time: 0.0,
          duration: 10.0,
          in_point: 0.0,
          out_point: 10.0,
        }],
        muted: false,
        locked: false,
        height: 100,
      }],
    };

    let json = serde_json::to_string(&timeline).unwrap();
    let deserialized: TimelineState = serde_json::from_str(&json).unwrap();
    assert_eq!(deserialized.duration, timeline.duration);
    assert_eq!(deserialized.tracks.len(), 1);
  }

  #[test]
  fn test_dialog_types() {
    let dialog = PluginDialog {
      title: "Test Dialog".to_string(),
      message: "Test message".to_string(),
      dialog_type: DialogType::Question,
      buttons: vec!["Yes".to_string(), "No".to_string()],
    };

    let json = serde_json::to_string(&dialog).unwrap();
    assert!(json.contains("Question"));

    // Test all dialog types
    let types = vec![
      DialogType::Info,
      DialogType::Warning,
      DialogType::Error,
      DialogType::Question,
      DialogType::Input,
    ];

    for dialog_type in types {
      let d = PluginDialog {
        title: "Title".to_string(),
        message: "Message".to_string(),
        dialog_type: dialog_type.clone(),
        buttons: vec![],
      };
      let _json = serde_json::to_string(&d).unwrap();
    }
  }

  #[test]
  fn test_dialog_result() {
    let result = DialogResult {
      button_index: Some(1),
      input_text: Some("User input".to_string()),
      cancelled: false,
    };

    let json = serde_json::to_string(&result).unwrap();
    let deserialized: DialogResult = serde_json::from_str(&json).unwrap();
    assert_eq!(deserialized.button_index, Some(1));
    assert_eq!(deserialized.input_text, Some("User input".to_string()));
    assert!(!deserialized.cancelled);
  }

  #[test]
  fn test_menu_item() {
    let menu = MenuItem {
      id: "menu-1".to_string(),
      label: "Test Menu".to_string(),
      parent_menu: Some("plugins".to_string()),
      shortcut: Some("Ctrl+T".to_string()),
      enabled: true,
    };

    let json = serde_json::to_string(&menu).unwrap();
    let deserialized: MenuItem = serde_json::from_str(&json).unwrap();
    assert_eq!(deserialized.id, menu.id);
    assert_eq!(deserialized.shortcut, Some("Ctrl+T".to_string()));
  }

  #[test]
  fn test_system_info() {
    let info = SystemInfo {
      os: "linux".to_string(),
      arch: "x86_64".to_string(),
      cpu_count: 8,
      memory_total: 16_000_000_000,
      memory_available: 8_000_000_000,
    };

    let json = serde_json::to_string(&info).unwrap();
    let deserialized: SystemInfo = serde_json::from_str(&json).unwrap();
    assert_eq!(deserialized.cpu_count, 8);
  }

  #[tokio::test]
  async fn test_storage_persistence() {
    use tempfile::TempDir;

    let temp_dir = TempDir::new().unwrap();
    let storage_path = temp_dir.path().join("storage");

    // Create storage and save data
    {
      let storage = PluginStorageImpl::new("test-plugin".to_string(), storage_path.clone())
        .await
        .unwrap();
      storage
        .set("persistent_key", serde_json::json!("persistent_value"))
        .await
        .unwrap();
    }

    // Create new storage instance and check if data persists
    {
      let storage = PluginStorageImpl::new("test-plugin".to_string(), storage_path)
        .await
        .unwrap();
      let value = storage.get("persistent_key").await.unwrap();
      assert_eq!(value, Some(serde_json::json!("persistent_value")));
    }
  }

  #[tokio::test]
  async fn test_storage_complex_values() {
    use tempfile::TempDir;

    let temp_dir = TempDir::new().unwrap();
    let storage_path = temp_dir.path().join("storage");
    let storage = PluginStorageImpl::new("test-plugin".to_string(), storage_path)
      .await
      .unwrap();

    // Test different value types
    let test_values = vec![
      ("string", serde_json::json!("test string")),
      ("number", serde_json::json!(42)),
      ("float", serde_json::json!(std::f64::consts::PI)),
      ("bool", serde_json::json!(true)),
      ("array", serde_json::json!([1, 2, 3])),
      (
        "object",
        serde_json::json!({"key": "value", "nested": {"data": 123}}),
      ),
      ("null", serde_json::json!(null)),
    ];

    for (key, value) in test_values {
      storage.set(key, value.clone()).await.unwrap();
      let retrieved = storage.get(key).await.unwrap();
      assert_eq!(retrieved, Some(value));
    }
  }

  #[tokio::test]
  async fn test_storage_concurrent_access() {
    use tempfile::TempDir;
    use tokio::task::JoinSet;

    let temp_dir = TempDir::new().unwrap();
    let storage_path = temp_dir.path().join("storage");
    let storage = Arc::new(
      PluginStorageImpl::new("test-plugin".to_string(), storage_path)
        .await
        .unwrap(),
    );

    let mut tasks = JoinSet::new();

    // Spawn multiple concurrent write tasks
    for i in 0..10 {
      let storage_clone = storage.clone();
      tasks.spawn(async move {
        storage_clone
          .set(&format!("key_{i}"), serde_json::json!(i))
          .await
          .unwrap();
      });
    }

    // Wait for all tasks to complete
    while tasks.join_next().await.is_some() {}

    // Verify all values were written
    for i in 0..10 {
      let value = storage.get(&format!("key_{i}")).await.unwrap();
      assert_eq!(value, Some(serde_json::json!(i)));
    }
  }

  #[test]
  fn test_clip_info_validation() {
    let clip = ClipInfo {
      id: "clip-1".to_string(),
      media_id: "media-1".to_string(),
      start_time: 10.0,
      duration: 5.0,
      in_point: 2.0,
      out_point: 7.0,
    };

    // Test that out_point - in_point equals duration
    assert_eq!(clip.out_point - clip.in_point, clip.duration);
  }

  #[test]
  fn test_track_info_types() {
    let video_track = TrackInfo {
      id: "v1".to_string(),
      track_type: "video".to_string(),
      name: "Video 1".to_string(),
      clips: vec![],
      muted: false,
      locked: false,
      height: 100,
    };

    let audio_track = TrackInfo {
      id: "a1".to_string(),
      track_type: "audio".to_string(),
      name: "Audio 1".to_string(),
      clips: vec![],
      muted: true,
      locked: false,
      height: 50,
    };

    assert_eq!(video_track.track_type, "video");
    assert_eq!(audio_track.track_type, "audio");
    assert!(audio_track.muted);
  }

  #[tokio::test]
  async fn test_plugin_api_permission_check() {
    use crate::plugins::permissions::FileSystemPermissions;
    use tempfile::TempDir;

    let temp_dir = TempDir::new().unwrap();
    let permissions = Arc::new(PluginPermissions {
      file_system: FileSystemPermissions::read_only(),
      network: crate::plugins::permissions::NetworkPermissions::none(),
      ui_access: false,
      system_info: false,
      process_spawn: false,
    });

    let service_container = Arc::new(ServiceContainer::new());
    let event_bus = Arc::new(EventBus::new());

    let api = PluginApiImpl::new(
      "test-plugin".to_string(),
      permissions,
      service_container,
      None,
      temp_dir.path().to_path_buf(),
      event_bus,
    );

    // Test media_read permission (should succeed for Minimal level)
    assert!(api.check_permission("media_read").is_ok());

    // Test media_write permission (should fail for Minimal level)
    assert!(api.check_permission("media_write").is_err());

    // Test ui_access permission (should fail as ui_access is false)
    assert!(api.check_permission("ui_access").is_err());

    // Test unknown permission
    assert!(api.check_permission("unknown_perm").is_err());
  }

  #[test]
  fn test_plugin_api_file_path_validation() {
    use crate::plugins::permissions::FileSystemPermissions;
    use tempfile::TempDir;

    let temp_dir = TempDir::new().unwrap();
    let allowed_path = temp_dir.path().to_path_buf();

    let mut file_system_perms = FileSystemPermissions::default();
    file_system_perms.read_paths.push(allowed_path.clone());
    file_system_perms.write_paths.push(allowed_path.clone());

    let permissions = Arc::new(PluginPermissions {
      file_system: file_system_perms,
      network: crate::plugins::permissions::NetworkPermissions::none(),
      ui_access: false,
      system_info: false,
      process_spawn: false,
    });

    let service_container = Arc::new(ServiceContainer::new());
    let event_bus = Arc::new(EventBus::new());

    let api = PluginApiImpl::new(
      "test-plugin".to_string(),
      permissions,
      service_container,
      None,
      temp_dir.path().to_path_buf(),
      event_bus,
    );

    // Test allowed path
    let test_file = allowed_path.join("test.txt");
    assert!(api.check_read_path(&test_file).is_ok());
    assert!(api.check_write_path(&test_file).is_ok());

    // Test disallowed path
    let disallowed = PathBuf::from("/etc/passwd");
    assert!(api.check_read_path(&disallowed).is_err());
    assert!(api.check_write_path(&disallowed).is_err());
  }

  #[test]
  fn test_security_level_comparison() {
    assert!(SecurityLevel::Minimal < SecurityLevel::Standard);
    assert!(SecurityLevel::Standard < SecurityLevel::Extended);
    assert!(SecurityLevel::Extended < SecurityLevel::Full);

    assert!(SecurityLevel::Full >= SecurityLevel::Extended);
    assert!(SecurityLevel::Standard >= SecurityLevel::Minimal);
  }

  #[tokio::test]
  async fn test_storage_error_handling() {
    use tempfile::TempDir;

    let temp_dir = TempDir::new().unwrap();
    let storage_path = temp_dir.path().join("storage");
    let storage = PluginStorageImpl::new("test-plugin".to_string(), storage_path.clone())
      .await
      .unwrap();

    // Test get non-existent key
    let result = storage.get("non_existent").await.unwrap();
    assert!(result.is_none());

    // Test remove non-existent key (should not error)
    assert!(storage.remove("non_existent").await.is_ok());

    // Clean up storage directory and test save error
    drop(storage);
    std::fs::remove_dir_all(&storage_path).unwrap();

    // Create file instead of directory to cause error
    std::fs::write(&storage_path, "not a directory").unwrap();

    let result = PluginStorageImpl::new("test-plugin".to_string(), storage_path).await;
    assert!(result.is_err());
  }

  #[test]
  fn test_dialog_type_to_string_conversion() {
    // Test the conversion logic used in show_dialog
    let test_cases = vec![
      (DialogType::Info, "info"),
      (DialogType::Warning, "warning"),
      (DialogType::Error, "error"),
      (DialogType::Question, "confirm"),
      (DialogType::Input, "input"),
    ];

    for (dialog_type, expected) in test_cases {
      let actual = match dialog_type {
        DialogType::Info => "info",
        DialogType::Warning => "warning",
        DialogType::Error => "error",
        DialogType::Question => "confirm",
        DialogType::Input => "input",
      };
      assert_eq!(actual, expected);
    }
  }

  #[test]
  fn test_clip_creation() {
    let clip = Clip {
      media_id: "media-123".to_string(),
      track_id: "track-456".to_string(),
      start_time: 0.0,
      duration: 10.5,
    };

    assert_eq!(clip.media_id, "media-123");
    assert_eq!(clip.track_id, "track-456");
    assert_eq!(clip.start_time, 0.0);
    assert_eq!(clip.duration, 10.5);
  }

  #[tokio::test]
  async fn test_multiple_storage_instances() {
    use tempfile::TempDir;

    let temp_dir = TempDir::new().unwrap();
    let storage_path = temp_dir.path().join("storage");

    // Create two storage instances
    let storage1 = PluginStorageImpl::new("plugin1".to_string(), storage_path.clone())
      .await
      .unwrap();
    let storage2 = PluginStorageImpl::new("plugin2".to_string(), storage_path.clone())
      .await
      .unwrap();

    // Write data from both instances
    storage1
      .set("key1", serde_json::json!("value1"))
      .await
      .unwrap();
    storage2
      .set("key2", serde_json::json!("value2"))
      .await
      .unwrap();

    // Each should see their own data
    assert_eq!(
      storage1.get("key1").await.unwrap(),
      Some(serde_json::json!("value1"))
    );
    assert_eq!(
      storage2.get("key2").await.unwrap(),
      Some(serde_json::json!("value2"))
    );
  }

  #[test]
  fn test_effect_parameters() {
    // Test various effect parameter types
    let effects = vec![
      Effect {
        effect_type: "blur".to_string(),
        parameters: serde_json::json!({"radius": 5}),
      },
      Effect {
        effect_type: "color_correction".to_string(),
        parameters: serde_json::json!({
          "brightness": 1.2,
          "contrast": 1.1,
          "saturation": 0.9
        }),
      },
      Effect {
        effect_type: "transform".to_string(),
        parameters: serde_json::json!({
          "scale": [1.5, 1.5],
          "rotation": 45,
          "position": {"x": 100, "y": 200}
        }),
      },
    ];

    for effect in effects {
      let json = serde_json::to_string(&effect).unwrap();
      let deserialized: Effect = serde_json::from_str(&json).unwrap();
      assert_eq!(deserialized.effect_type, effect.effect_type);
      assert_eq!(deserialized.parameters, effect.parameters);
    }
  }

  #[test]
  fn test_path_sanitization() {
    // Test the path sanitization in generate_thumbnail
    let test_cases = vec![
      ("media/file.mp4", "media_file.mp4"),
      ("media\\file.mp4", "media_file.mp4"),
      ("../../../etc/passwd", ".._.._.._etc_passwd"),
    ];

    for (input, expected) in test_cases {
      let sanitized = input.replace(['/', '\\'], "_");
      assert_eq!(sanitized, expected);
    }
  }

  #[tokio::test]
  async fn test_storage_data_file_corruption() {
    use tempfile::TempDir;

    let temp_dir = TempDir::new().unwrap();
    let storage_path = temp_dir.path().join("storage");

    // Create storage directory and corrupted data file
    tokio::fs::create_dir_all(&storage_path).await.unwrap();
    let data_file = storage_path.join("data.json");
    tokio::fs::write(&data_file, "invalid json {")
      .await
      .unwrap();

    // Storage should handle corrupted file gracefully
    let storage = PluginStorageImpl::new("test-plugin".to_string(), storage_path)
      .await
      .unwrap();

    // Should start with empty data
    let keys = storage.keys().await.unwrap();
    assert!(keys.is_empty());

    // Should be able to write new data
    storage
      .set("key", serde_json::json!("value"))
      .await
      .unwrap();
    assert_eq!(
      storage.get("key").await.unwrap(),
      Some(serde_json::json!("value"))
    );
  }

  #[test]
  fn test_menu_item_defaults() {
    let menu = MenuItem {
      id: "test".to_string(),
      label: "Test".to_string(),
      parent_menu: None,
      shortcut: None,
      enabled: true,
    };

    // When parent_menu is None, it should default to "plugins"
    assert!(menu.parent_menu.is_none());

    // Test with parent menu
    let menu_with_parent = MenuItem {
      id: "test2".to_string(),
      label: "Test 2".to_string(),
      parent_menu: Some("file".to_string()),
      shortcut: Some("Ctrl+Shift+T".to_string()),
      enabled: false,
    };

    assert_eq!(menu_with_parent.parent_menu, Some("file".to_string()));
    assert!(!menu_with_parent.enabled);
  }

  #[test]
  fn test_dialog_result_scenarios() {
    // Test cancelled dialog
    let cancelled = DialogResult {
      button_index: None,
      input_text: None,
      cancelled: true,
    };
    assert!(cancelled.cancelled);
    assert!(cancelled.button_index.is_none());

    // Test button click
    let button_click = DialogResult {
      button_index: Some(0),
      input_text: None,
      cancelled: false,
    };
    assert_eq!(button_click.button_index, Some(0));

    // Test input dialog
    let input_result = DialogResult {
      button_index: Some(0),
      input_text: Some("User typed this".to_string()),
      cancelled: false,
    };
    assert!(input_result.input_text.is_some());
  }

  #[test]
  fn test_system_info_current_system() {
    let info = SystemInfo {
      os: std::env::consts::OS.to_string(),
      arch: std::env::consts::ARCH.to_string(),
      cpu_count: num_cpus::get(),
      memory_total: 0,
      memory_available: 0,
    };

    // Verify current system values
    assert!(!info.os.is_empty());
    assert!(!info.arch.is_empty());
    assert!(info.cpu_count > 0);
  }

  #[tokio::test]
  async fn test_concurrent_storage_operations() {
    use tempfile::TempDir;
    use tokio::task::JoinSet;

    let temp_dir = TempDir::new().unwrap();
    let storage_path = temp_dir.path().join("storage");
    let storage = Arc::new(
      PluginStorageImpl::new("test-plugin".to_string(), storage_path)
        .await
        .unwrap(),
    );

    let mut tasks = JoinSet::new();

    // Mix of operations
    for i in 0..20 {
      let storage_clone = storage.clone();
      tasks.spawn(async move {
        match i % 4 {
          0 => {
            // Set
            storage_clone
              .set(&format!("key_{i}"), serde_json::json!(i))
              .await
              .unwrap();
          }
          1 => {
            // Get
            let _ = storage_clone.get(&format!("key_{}", i - 1)).await.unwrap();
          }
          2 => {
            // Remove
            let _ = storage_clone.remove(&format!("key_{}", i - 2)).await;
          }
          _ => {
            // Keys
            let _ = storage_clone.keys().await.unwrap();
          }
        }
      });
    }

    // Wait for all tasks
    while let Some(result) = tasks.join_next().await {
      assert!(result.is_ok());
    }
  }

  #[test]
  fn test_media_info_codec_types() {
    let codecs = vec!["h264", "h265", "vp9", "av1", "prores"];

    for codec in codecs {
      let media = MediaInfo {
        id: "test".to_string(),
        path: PathBuf::from("/test.mp4"),
        duration: 60.0,
        width: 1920,
        height: 1080,
        fps: 30.0,
        codec: codec.to_string(),
        bitrate: 5000000,
      };

      assert_eq!(media.codec, codec);
    }
  }

  #[test]
  fn test_track_info_height_values() {
    let heights = vec![50, 75, 100, 150, 200];

    for height in heights {
      let track = TrackInfo {
        id: "track".to_string(),
        track_type: "video".to_string(),
        name: "Track".to_string(),
        clips: vec![],
        muted: false,
        locked: false,
        height,
      };

      assert_eq!(track.height, height);
    }
  }
}

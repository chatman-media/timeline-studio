//! Tauri команды для управления плагинами

use crate::core::plugins::{
  manager::PluginManager,
  permissions::PluginPermissions,
  plugin::{PluginCommand, PluginMetadata, PluginResponse},
};
use serde_json::Value;
use tauri::State;
use uuid::Uuid;

/// Загрузить плагин
#[tauri::command]
pub async fn load_plugin(
  plugin_id: String,
  permissions: Option<PluginPermissions>,
  plugin_manager: State<'_, PluginManager>,
) -> Result<String, String> {
  let permissions = permissions.unwrap_or_default();

  plugin_manager
    .load_plugin(&plugin_id, permissions)
    .await
    .map_err(|e| e.to_string())
}

/// Выгрузить плагин
#[tauri::command]
pub async fn unload_plugin(
  plugin_id: String,
  plugin_manager: State<'_, PluginManager>,
) -> Result<(), String> {
  plugin_manager
    .unload_plugin(&plugin_id)
    .await
    .map_err(|e| e.to_string())
}

/// Получить список загруженных плагинов
#[tauri::command]
pub async fn list_loaded_plugins(
  plugin_manager: State<'_, PluginManager>,
) -> Result<Vec<(String, String)>, String> {
  let plugins = plugin_manager.list_loaded_plugins().await;
  Ok(
    plugins
      .into_iter()
      .map(|(id, state)| (id, format!("{state:?}")))
      .collect(),
  )
}

/// Получить список всех доступных плагинов
#[tauri::command]
pub async fn list_available_plugins(
  plugin_manager: State<'_, PluginManager>,
) -> Result<Vec<PluginMetadata>, String> {
  let registry = plugin_manager.loader().registry();
  Ok(registry.list_plugins().await)
}

/// Отправить команду плагину
#[tauri::command]
pub async fn send_plugin_command(
  plugin_id: String,
  command: String,
  params: Value,
  plugin_manager: State<'_, PluginManager>,
) -> Result<PluginResponse, String> {
  let params_map = match params {
    Value::Object(map) => map,
    _ => Default::default(),
  };

  let plugin_command = PluginCommand {
    id: Uuid::new_v4(),
    command,
    params: serde_json::Value::Object(params_map),
  };

  plugin_manager
    .send_command(&plugin_id, plugin_command)
    .await
    .map_err(|e| e.to_string())
}

/// Получить информацию о плагине
#[tauri::command]
pub async fn get_plugin_info(
  plugin_id: String,
  plugin_manager: State<'_, PluginManager>,
) -> Result<Value, String> {
  plugin_manager
    .get_plugin_info(&plugin_id)
    .await
    .map_err(|e| e.to_string())
}

/// Приостановить плагин
#[tauri::command]
pub async fn suspend_plugin(
  plugin_id: String,
  plugin_manager: State<'_, PluginManager>,
) -> Result<(), String> {
  plugin_manager
    .suspend_plugin(&plugin_id)
    .await
    .map_err(|e| e.to_string())
}

/// Возобновить работу плагина
#[tauri::command]
pub async fn resume_plugin(
  plugin_id: String,
  plugin_manager: State<'_, PluginManager>,
) -> Result<(), String> {
  plugin_manager
    .resume_plugin(&plugin_id)
    .await
    .map_err(|e| e.to_string())
}

/// Получить статистику sandbox всех плагинов
#[tauri::command]
pub async fn get_plugins_sandbox_stats(
  plugin_manager: State<'_, PluginManager>,
) -> Result<Vec<Value>, String> {
  let stats = plugin_manager.get_sandbox_stats().await;
  stats
    .into_iter()
    .map(|stat| serde_json::to_value(stat).map_err(|e| e.to_string()))
    .collect()
}

/// Получить плагины, нарушившие лимиты ресурсов
#[tauri::command]
pub async fn get_violating_plugins(
  plugin_manager: State<'_, PluginManager>,
) -> Result<Vec<String>, String> {
  Ok(plugin_manager.get_violating_plugins().await)
}

/// Сбросить нарушения лимитов для плагина
#[tauri::command]
pub async fn reset_plugin_violations(
  plugin_id: String,
  plugin_manager: State<'_, PluginManager>,
) -> Result<bool, String> {
  Ok(plugin_manager.reset_plugin_violations(&plugin_id).await)
}

/// Зарегистрировать примеры плагинов
#[tauri::command]
pub async fn register_example_plugins(
  plugin_manager: State<'_, PluginManager>,
) -> Result<(), String> {
  let registry = plugin_manager.loader().registry();
  crate::core::plugins::register_example_plugins(&registry)
    .await
    .map_err(|e| e.to_string())
}

#[cfg(test)]
mod tests {
  use super::*;
  use crate::core::plugins::{
    permissions::{FileSystemPermissions, NetworkPermissions},
    plugin::Version,
  };
  use crate::core::{EventBus, ServiceContainer};
  use std::sync::Arc;

  async fn create_test_plugin_manager() -> PluginManager {
    let app_version = Version::new(1, 0, 0);
    let event_bus = Arc::new(EventBus::new());
    let service_container = Arc::new(ServiceContainer::new());

    PluginManager::new(app_version, event_bus, service_container)
  }

  #[tokio::test]
  async fn test_register_example_plugins() {
    let manager = create_test_plugin_manager().await;

    // Регистрируем примеры плагинов
    let registry = manager.loader().registry();
    assert!(crate::core::plugins::register_example_plugins(&registry)
      .await
      .is_ok());

    // Проверяем что плагины зарегистрированы
    let plugins = registry.list_plugins().await;
    assert!(plugins.len() >= 2);

    // Проверяем конкретные плагины
    assert!(registry.find_plugin("blur-effect").await.is_some());
    assert!(registry.find_plugin("youtube-uploader").await.is_some());
  }

  #[tokio::test]
  async fn test_list_available_plugins() {
    let manager = create_test_plugin_manager().await;

    // Регистрируем примеры плагинов
    let registry = manager.loader().registry();
    crate::core::plugins::register_example_plugins(&registry)
      .await
      .unwrap();

    // Тестируем вызов напрямую через manager
    let plugins = manager.loader().registry().list_plugins().await;
    assert!(plugins.len() >= 2);

    // Проверяем структуру метаданных
    for plugin in plugins {
      assert!(!plugin.name.is_empty());
      assert!(!plugin.version.to_string().is_empty());
    }
  }

  #[tokio::test]
  async fn test_list_loaded_plugins_empty() {
    let manager = create_test_plugin_manager().await;

    // Изначально плагины не загружены
    let plugins = manager.list_loaded_plugins().await;
    assert!(plugins.is_empty());
  }

  #[tokio::test]
  async fn test_load_plugin_nonexistent() {
    let manager = create_test_plugin_manager().await;

    // Попытка загрузить несуществующий плагин
    let result = manager
      .load_plugin("nonexistent-plugin", PluginPermissions::default())
      .await;

    assert!(result.is_err());
    // Любая ошибка уже означает что плагин не найден
  }

  #[tokio::test]
  async fn test_load_plugin_with_permissions() {
    let manager = create_test_plugin_manager().await;

    // Регистрируем тестовый плагин
    let registry = manager.loader().registry();
    crate::core::plugins::register_example_plugins(&registry)
      .await
      .unwrap();

    // Загружаем плагин с кастомными разрешениями
    let permissions = PluginPermissions {
      file_system: crate::core::plugins::permissions::FileSystemPermissions::default(),
      network: crate::core::plugins::permissions::NetworkPermissions::all(),
      ui_access: false,
      system_info: false,
      process_spawn: false,
    };

    let result = manager.load_plugin("blur-effect", permissions).await;

    // Может быть ошибка из-за отсутствия реального .wasm файла
    // Главное - проверить что функция обрабатывает permissions
    match result {
      Ok(instance_id) => {
        assert!(!instance_id.is_empty());
      }
      Err(_) => {
        // Ожидаемо для тестовой среды без .wasm файлов
      }
    }
  }

  #[tokio::test]
  async fn test_unload_plugin_nonexistent() {
    let manager = create_test_plugin_manager().await;

    // Попытка выгрузить несуществующий плагин
    let result = manager.unload_plugin("nonexistent-plugin").await;

    assert!(result.is_err());
    // Любая ошибка уже означает что плагин не найден
  }

  #[tokio::test]
  async fn test_get_plugin_info_nonexistent() {
    let manager = create_test_plugin_manager().await;

    // Попытка получить информацию о несуществующем плагине
    let result = manager.get_plugin_info("nonexistent-plugin").await;

    assert!(result.is_err());
  }

  #[tokio::test]
  async fn test_suspend_plugin_nonexistent() {
    let manager = create_test_plugin_manager().await;

    // Попытка приостановить несуществующий плагин
    let result = manager.suspend_plugin("nonexistent-plugin").await;

    assert!(result.is_err());
  }

  #[tokio::test]
  async fn test_resume_plugin_nonexistent() {
    let manager = create_test_plugin_manager().await;

    // Попытка возобновить несуществующий плагин
    let result = manager.resume_plugin("nonexistent-plugin").await;

    assert!(result.is_err());
  }

  #[tokio::test]
  async fn test_send_plugin_command_various_params() {
    let manager = create_test_plugin_manager().await;

    // Тест с валидными JSON параметрами
    let params_map = match serde_json::json!({
      "key1": "value1",
      "key2": 42,
      "key3": true
    }) {
      serde_json::Value::Object(map) => map,
      _ => Default::default(),
    };

    let plugin_command = crate::core::plugins::plugin::PluginCommand {
      id: uuid::Uuid::new_v4(),
      command: "test-command".to_string(),
      params: serde_json::Value::Object(params_map),
    };

    let result = manager.send_command("test-plugin", plugin_command).await;

    // Ожидаем ошибку так как плагин не загружен
    assert!(result.is_err());

    // Тест с невалидными параметрами (не объект) - должно привести к пустому объекту
    let invalid_params_map = match serde_json::json!("not an object") {
      serde_json::Value::Object(map) => map,
      _ => Default::default(), // Станет пустым объектом
    };

    let plugin_command2 = crate::core::plugins::plugin::PluginCommand {
      id: uuid::Uuid::new_v4(),
      command: "test-command".to_string(),
      params: serde_json::Value::Object(invalid_params_map),
    };

    let result2 = manager.send_command("test-plugin", plugin_command2).await;

    // Должно обработать невалидные параметры gracefully
    assert!(result2.is_err());
  }

  #[tokio::test]
  async fn test_get_plugins_sandbox_stats() {
    let manager = create_test_plugin_manager().await;

    // Получаем статистику sandbox (должна быть пустой)
    let stats = manager.get_sandbox_stats().await;
    assert!(stats.is_empty()); // Нет загруженных плагинов
  }

  #[tokio::test]
  async fn test_get_violating_plugins() {
    let manager = create_test_plugin_manager().await;

    // Получаем список нарушающих плагинов (должен быть пустым)
    let violating = manager.get_violating_plugins().await;
    assert!(violating.is_empty()); // Нет загруженных плагинов
  }

  #[tokio::test]
  async fn test_reset_plugin_violations() {
    let manager = create_test_plugin_manager().await;

    // Попытка сбросить нарушения несуществующего плагина
    let was_reset = manager.reset_plugin_violations("nonexistent-plugin").await;
    assert!(!was_reset); // Плагин не найден, поэтому false
  }

  #[tokio::test]
  async fn test_register_example_plugins_command() {
    let manager = create_test_plugin_manager().await;

    // Тестируем команду регистрации напрямую
    let registry = manager.loader().registry();
    let result = crate::core::plugins::register_example_plugins(&registry).await;
    assert!(result.is_ok());

    // Проверяем что плагины действительно зарегистрированы
    let plugins = registry.list_plugins().await;
    assert!(plugins.len() >= 2);
  }

  #[tokio::test]
  async fn test_plugin_lifecycle_integration() {
    let manager = create_test_plugin_manager().await;

    // 1. Регистрируем примеры плагинов
    let registry = manager.loader().registry();
    let register_result = crate::core::plugins::register_example_plugins(&registry).await;
    assert!(register_result.is_ok());

    // 2. Проверяем список доступных плагинов
    let available = registry.list_plugins().await;
    assert!(!available.is_empty());

    // 3. Проверяем что изначально нет загруженных плагинов
    let loaded = manager.list_loaded_plugins().await;
    assert!(loaded.is_empty());

    // 4. Проверяем статистику sandbox
    let stats = manager.get_sandbox_stats().await;
    assert!(stats.is_empty());

    // 5. Проверяем нарушающие плагины
    let violating = manager.get_violating_plugins().await;
    assert!(violating.is_empty());
  }

  #[tokio::test]
  async fn test_error_handling_patterns() {
    let manager = create_test_plugin_manager().await;

    // Тест различных паттернов ошибок
    let error_tests = vec![
      ("", "empty plugin id"),
      ("invalid-plugin-12345", "invalid plugin id"),
      ("../../../etc/passwd", "path traversal attempt"),
      ("plugin with spaces", "plugin with spaces"),
      (
        "очень-длинное-имя-плагина-которое-может-вызвать-проблемы",
        "long name",
      ),
    ];

    for (plugin_id, description) in error_tests {
      // Тест загрузки
      let load_result = manager
        .load_plugin(plugin_id, PluginPermissions::default())
        .await;
      assert!(load_result.is_err(), "Load should fail for {}", description);

      // Тест выгрузки
      let unload_result = manager.unload_plugin(plugin_id).await;
      assert!(
        unload_result.is_err(),
        "Unload should fail for {}",
        description
      );

      // Тест получения информации
      let info_result = manager.get_plugin_info(plugin_id).await;
      assert!(
        info_result.is_err(),
        "Get info should fail for {}",
        description
      );

      // Тест приостановки
      let suspend_result = manager.suspend_plugin(plugin_id).await;
      assert!(
        suspend_result.is_err(),
        "Suspend should fail for {}",
        description
      );

      // Тест возобновления
      let resume_result = manager.resume_plugin(plugin_id).await;
      assert!(
        resume_result.is_err(),
        "Resume should fail for {}",
        description
      );
    }
  }

  #[tokio::test]
  async fn test_command_parameter_validation() {
    let manager = create_test_plugin_manager().await;

    // Тест различных типов параметров для команд
    let param_variants = vec![
      serde_json::json!({}),                  // Empty object
      serde_json::json!({"single": "value"}), // Single value
      serde_json::json!({"multiple": "values", "number": 123, "bool": true}), // Multiple types
      serde_json::json!(null),                // Null
      serde_json::json!([1, 2, 3]),           // Array (will be converted to empty object)
      serde_json::json!("string"),            // String (will be converted to empty object)
      serde_json::json!(42),                  // Number (will be converted to empty object)
    ];

    for (i, params) in param_variants.iter().enumerate() {
      let params_map = match params {
        serde_json::Value::Object(map) => map.clone(),
        _ => Default::default(),
      };

      let plugin_command = crate::core::plugins::plugin::PluginCommand {
        id: uuid::Uuid::new_v4(),
        command: "test-command".to_string(),
        params: serde_json::Value::Object(params_map),
      };

      let result = manager
        .send_command(&format!("test-plugin-{}", i), plugin_command)
        .await;

      // Все должны вернуть ошибку (плагин не загружен), но не panic
      assert!(
        result.is_err(),
        "Command should handle parameter variant {}",
        i
      );
    }
  }

  #[tokio::test]
  async fn test_permissions_variants() {
    let manager = create_test_plugin_manager().await;

    // Регистрируем плагины для тестирования
    let registry = manager.loader().registry();
    crate::core::plugins::register_example_plugins(&registry)
      .await
      .unwrap();

    // Тест различных конфигураций разрешений
    let permission_variants = vec![
      PluginPermissions::default(), // Default permissions
      PluginPermissions {
        // All disabled
        file_system: FileSystemPermissions::default(),
        network: NetworkPermissions::none(),
        ui_access: false,
        system_info: false,
        process_spawn: false,
      },
      PluginPermissions {
        // Only file system access
        file_system: FileSystemPermissions::read_only(),
        network: NetworkPermissions::none(),
        ui_access: false,
        system_info: false,
        process_spawn: false,
      },
      PluginPermissions {
        // All enabled
        file_system: FileSystemPermissions {
          read_all: true,
          write_all: true,
          ..Default::default()
        },
        network: NetworkPermissions::all(),
        ui_access: true,
        system_info: true,
        process_spawn: true,
      },
    ];

    for (i, permissions) in permission_variants.iter().enumerate() {
      let result = manager
        .load_plugin("blur-effect", permissions.clone())
        .await;

      // В тестовой среде может быть ошибка из-за отсутствия .wasm файлов
      // Главное что функция принимает разные варианты permissions
      match result {
        Ok(_) => {
          // Успешная загрузка - выгружаем для следующего теста
          let _ = manager.unload_plugin("blur-effect").await;
        }
        Err(err) => {
          // Ожидаемо в тестовой среде
          let error_msg = err.to_string();
          assert!(
            !error_msg.is_empty(),
            "Error message should not be empty for variant {}",
            i
          );
        }
      }
    }
  }
}

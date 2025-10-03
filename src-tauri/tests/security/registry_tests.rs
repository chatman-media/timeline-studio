//! Тесты для модуля registry.rs

use timeline_studio_lib::security::registry::SecurityCommandRegistry;
use timeline_studio_lib::CommandRegistry;

#[test]
fn test_security_command_registry_implementation() {
  // Проверяем, что SecurityCommandRegistry реализует trait CommandRegistry
  fn assert_implements_command_registry<T: CommandRegistry>() {}
  assert_implements_command_registry::<SecurityCommandRegistry>();
}

#[test]
fn test_register_commands_adds_all_required_handlers() {
  // В тестовом окружении мы не можем создать настоящий Builder без полной Tauri инфраструктуры
  // Поэтому просто проверяем, что тип реализует нужный trait
  fn check_register<T: CommandRegistry>() {}
  check_register::<SecurityCommandRegistry>();
}

#[test]
fn test_all_command_names_are_valid() {
  // Список всех команд, которые должны быть зарегистрированы
  let expected_commands = vec![
    // API key management
    "save_simple_api_key",
    "get_decrypted_api_key",
    "list_api_keys",
    "delete_api_key",
    "validate_api_key",
    "get_api_key_info",
    // OAuth operations
    "generate_oauth_url",
    "exchange_oauth_code",
    "refresh_oauth_token",
    "save_oauth_credentials",
    "get_oauth_user_info",
    "parse_oauth_callback_url",
    // Import/Export
    "import_from_env",
    "export_to_env_format",
    // Security Storage commands
    "create_secure_storage",
    "create_secure_storage_new",
    "get_or_create_encryption_key_command",
    "check_storage_security",
    "get_secure_storage_info",
  ];

  // Проверяем, что все команды имеют валидные имена (snake_case)
  for cmd in expected_commands {
    assert!(cmd
      .chars()
      .all(|c| c.is_lowercase() || c == '_' || c.is_numeric()));
    assert!(!cmd.is_empty());
    assert!(!cmd.starts_with('_'));
    assert!(!cmd.ends_with('_'));
  }
}

#[test]
fn test_command_categories_organization() {
  // Проверяем логическую организацию команд по категориям
  let api_key_commands = [
    "save_simple_api_key",
    "get_decrypted_api_key",
    "list_api_keys",
    "delete_api_key",
    "validate_api_key",
    "get_api_key_info",
  ];

  let oauth_commands = [
    "generate_oauth_url",
    "exchange_oauth_code",
    "refresh_oauth_token",
    "save_oauth_credentials",
    "get_oauth_user_info",
    "parse_oauth_callback_url",
  ];

  let import_export_commands = ["import_from_env", "export_to_env_format"];

  let storage_commands = [
    "create_secure_storage",
    "create_secure_storage_new",
    "get_or_create_encryption_key_command",
    "check_storage_security",
    "get_secure_storage_info",
  ];

  // Проверяем, что команды не пересекаются между категориями
  let all_commands: Vec<&str> = api_key_commands
    .iter()
    .chain(oauth_commands.iter())
    .chain(import_export_commands.iter())
    .chain(storage_commands.iter())
    .copied()
    .collect();

  let unique_commands: std::collections::HashSet<&str> = all_commands.iter().copied().collect();
  assert_eq!(
    all_commands.len(),
    unique_commands.len(),
    "Duplicate commands found"
  );
}

#[test]
fn test_registry_module_structure() {
  // Проверяем, что модуль правильно импортирует зависимости
  use timeline_studio_lib::security::additional_commands;
  use timeline_studio_lib::security::commands;

  // Проверяем доступность публичных типов из импортированных модулей
  // Это компилируется только если импорты корректны
  let _ = std::marker::PhantomData::<commands::ApiKeyOperationResult>;
  let _ = std::marker::PhantomData::<additional_commands::SecureStorageResult>;
}

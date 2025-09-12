use super::additional_commands::*;
use super::commands::*;
use crate::command_registry::CommandRegistry;
use tauri::{Builder, Runtime};

/// Security module command registry
pub struct SecurityCommandRegistry;

impl CommandRegistry for SecurityCommandRegistry {
  fn register_commands<R: Runtime>(builder: Builder<R>) -> Builder<R> {
    builder.invoke_handler(tauri::generate_handler![
      // API key management
      save_simple_api_key,
      get_decrypted_api_key,
      list_api_keys,
      delete_api_key,
      has_api_key,
      validate_api_key,
      get_api_key_info,
      // OAuth operations
      generate_oauth_url,
      exchange_oauth_code,
      refresh_oauth_token,
      save_oauth_credentials,
      get_oauth_user_info,
      parse_oauth_callback_url,
      // Import/Export
      import_from_env,
      export_to_env_format,
      // Security Storage commands (from additional_commands)
      create_secure_storage,
      create_secure_storage_new,
      get_or_create_encryption_key_command,
      check_storage_security,
      get_secure_storage_info,
    ])
  }
}

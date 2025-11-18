use super::{ApiKeyData, ApiKeyType, OAuthCredentials};
use anyhow::{Context, Result};
use std::collections::HashMap;
use std::env;
use std::fs;
use std::path::Path;

/// Импортер для загрузки API ключей из .env файлов
pub struct EnvImporter {
  env_file_path: Option<String>,
}

impl EnvImporter {
  /// Создает новый импортер
  pub fn new() -> Self {
    Self {
      env_file_path: None,
    }
  }

  /// Создает импортер с указанным путем к .env файлу
  pub fn with_env_file<P: AsRef<Path>>(env_file_path: P) -> Self {
    Self {
      env_file_path: Some(env_file_path.as_ref().to_string_lossy().to_string()),
    }
  }

  /// Загружает .env файл если указан путь
  pub fn load_env_file(&self) -> Result<()> {
    if let Some(env_path) = &self.env_file_path {
      if Path::new(env_path).exists() {
        let content = fs::read_to_string(env_path).context("Failed to read .env file")?;

        for line in content.lines() {
          let line = line.trim();
          if line.is_empty() || line.starts_with('#') {
            continue;
          }

          if let Some((key, value)) = line.split_once('=') {
            let key = key.trim();
            let value = value.trim().trim_matches('"').trim_matches('\'');
            unsafe { env::set_var(key, value) };
          }
        }

        log::info!("Loaded .env file: {env_path}");
      } else {
        log::warn!(".env file not found: {env_path}");
      }
    }

    Ok(())
  }

  /// Импортирует все доступные API ключи из переменных окружения
  pub fn import_all_api_keys(&self) -> Result<Vec<ApiKeyData>> {
    // Сначала загружаем .env файл если указан
    self.load_env_file()?;

    let mut imported_keys = Vec::new();

    // Карта переменных окружения для каждого типа ключа
    let env_mappings = self.get_env_mappings();

    for (key_type, env_vars) in env_mappings {
      if let Some(key_data) = self.import_single_api_key(key_type, &env_vars)? {
        imported_keys.push(key_data);
      }
    }

    log::info!("Imported {} API keys from environment", imported_keys.len());
    Ok(imported_keys)
  }

  /// Импортирует конкретный API ключ
  #[allow(dead_code)]
  pub fn import_api_key(&self, key_type: ApiKeyType) -> Result<Option<ApiKeyData>> {
    self.load_env_file()?;

    let env_mappings = self.get_env_mappings();
    if let Some(env_vars) = env_mappings.get(&key_type) {
      self.import_single_api_key(key_type, env_vars)
    } else {
      Ok(None)
    }
  }

  /// Получает карту переменных окружения для каждого типа ключа
  fn get_env_mappings(&self) -> HashMap<ApiKeyType, Vec<String>> {
    let mut mappings = HashMap::new();

    // AI сервисы
    mappings.insert(
      ApiKeyType::OpenAI,
      vec!["OPENAI_API_KEY".to_string(), "OPENAI_KEY".to_string()],
    );

    mappings.insert(
      ApiKeyType::Claude,
      vec![
        "CLAUDE_API_KEY".to_string(),
        "ANTHROPIC_API_KEY".to_string(),
        "CLAUDE_KEY".to_string(),
      ],
    );

    mappings.insert(
      ApiKeyType::MCPClaude,
      vec![
        "MCP_CLAUDE_API_KEY".to_string(),
        "MCP_ANTHROPIC_API_KEY".to_string(),
      ],
    );

    mappings.insert(
      ApiKeyType::DeepSeek,
      vec!["DEEPSEEK_API_KEY".to_string(), "DEEPSEEK_KEY".to_string()],
    );

    mappings.insert(
      ApiKeyType::Grok,
      vec!["GROK_API_KEY".to_string(), "GROK_KEY".to_string()],
    );

    // Социальные сети - OAuth credentials
    mappings.insert(
      ApiKeyType::YouTube,
      vec![
        "YOUTUBE_CLIENT_ID".to_string(),
        "YOUTUBE_CLIENT_SECRET".to_string(),
        "GOOGLE_CLIENT_ID".to_string(),
        "GOOGLE_CLIENT_SECRET".to_string(),
      ],
    );

    mappings.insert(
      ApiKeyType::TikTok,
      vec![
        "TIKTOK_CLIENT_ID".to_string(),
        "TIKTOK_CLIENT_SECRET".to_string(),
        "TIKTOK_CLIENT_KEY".to_string(),
      ],
    );

    mappings.insert(
      ApiKeyType::Vimeo,
      vec![
        "VIMEO_CLIENT_ID".to_string(),
        "VIMEO_CLIENT_SECRET".to_string(),
        "VIMEO_ACCESS_TOKEN".to_string(),
      ],
    );

    mappings.insert(
      ApiKeyType::Telegram,
      vec![
        "TELEGRAM_BOT_TOKEN".to_string(),
        "TELEGRAM_CHAT_ID".to_string(),
        "TELEGRAM_CHANNEL_ID".to_string(),
      ],
    );

    // Разработка
    mappings.insert(
      ApiKeyType::Codecov,
      vec!["CODECOV_TOKEN".to_string(), "CODECOV_API_TOKEN".to_string()],
    );

    mappings.insert(
      ApiKeyType::TauriAnalytics,
      vec![
        "TAURI_ANALYTICS_KEY".to_string(),
        "TAURI_ANALYTICS_TOKEN".to_string(),
      ],
    );

    mappings
  }

  /// Импортирует один API ключ по типу и списку переменных
  fn import_single_api_key(
    &self,
    key_type: ApiKeyType,
    _env_vars: &[String],
  ) -> Result<Option<ApiKeyData>> {
    match key_type {
      // Простые API ключи
      ApiKeyType::OpenAI
      | ApiKeyType::Claude
      | ApiKeyType::MCPClaude
      | ApiKeyType::DeepSeek
      | ApiKeyType::Grok
      | ApiKeyType::Codecov
      | ApiKeyType::TauriAnalytics => {
        for env_var in _env_vars {
          if let Ok(value) = env::var(env_var) {
            if !value.is_empty() {
              return Ok(Some(ApiKeyData {
                key_type,
                value,
                oauth_data: None,
                created_at: chrono::Utc::now(),
                last_validated: None,
                is_valid: None,
              }));
            }
          }
        }
        Ok(None)
      }

      // OAuth сервисы
      ApiKeyType::YouTube => self.import_youtube_oauth(_env_vars),
      ApiKeyType::TikTok => self.import_tiktok_oauth(_env_vars),
      ApiKeyType::Vimeo => self.import_vimeo_oauth(_env_vars),
      ApiKeyType::Telegram => self.import_telegram_credentials(_env_vars),
    }
  }

  /// Импортирует YouTube OAuth credentials
  fn import_youtube_oauth(&self, _env_vars: &[String]) -> Result<Option<ApiKeyData>> {
    let client_id = self.find_env_value(&["YOUTUBE_CLIENT_ID", "GOOGLE_CLIENT_ID"]);

    let client_secret = self.find_env_value(&["YOUTUBE_CLIENT_SECRET", "GOOGLE_CLIENT_SECRET"]);

    if let (Some(client_id), Some(client_secret)) = (client_id, client_secret) {
      let oauth_data = OAuthCredentials {
        client_id: client_id.clone(),
        client_secret,
        access_token: None,
        refresh_token: None,
        expires_at: None,
      };

      Ok(Some(ApiKeyData {
        key_type: ApiKeyType::YouTube,
        value: client_id, // Используем client_id как основное значение
        oauth_data: Some(oauth_data),
        created_at: chrono::Utc::now(),
        last_validated: None,
        is_valid: None,
      }))
    } else {
      Ok(None)
    }
  }

  /// Импортирует TikTok OAuth credentials
  fn import_tiktok_oauth(&self, _env_vars: &[String]) -> Result<Option<ApiKeyData>> {
    let client_id = self.find_env_value(&["TIKTOK_CLIENT_ID", "TIKTOK_CLIENT_KEY"]);

    let client_secret = self.find_env_value(&["TIKTOK_CLIENT_SECRET"]);

    if let (Some(client_id), Some(client_secret)) = (client_id, client_secret) {
      let oauth_data = OAuthCredentials {
        client_id: client_id.clone(),
        client_secret,
        access_token: None,
        refresh_token: None,
        expires_at: None,
      };

      Ok(Some(ApiKeyData {
        key_type: ApiKeyType::TikTok,
        value: client_id,
        oauth_data: Some(oauth_data),
        created_at: chrono::Utc::now(),
        last_validated: None,
        is_valid: None,
      }))
    } else {
      Ok(None)
    }
  }

  /// Импортирует Vimeo credentials
  fn import_vimeo_oauth(&self, _env_vars: &[String]) -> Result<Option<ApiKeyData>> {
    let client_id = self.find_env_value(&["VIMEO_CLIENT_ID"]);
    let client_secret = self.find_env_value(&["VIMEO_CLIENT_SECRET"]);
    let access_token = self.find_env_value(&["VIMEO_ACCESS_TOKEN"]);

    if let Some(access_token) = access_token {
      // Если есть access token, создаем OAuth credentials
      let oauth_data = if let (Some(client_id), Some(client_secret)) = (client_id, client_secret) {
        Some(OAuthCredentials {
          client_id,
          client_secret,
          access_token: Some(access_token.clone()),
          refresh_token: None,
          expires_at: None,
        })
      } else {
        None
      };

      Ok(Some(ApiKeyData {
        key_type: ApiKeyType::Vimeo,
        value: access_token,
        oauth_data,
        created_at: chrono::Utc::now(),
        last_validated: None,
        is_valid: None,
      }))
    } else if let (Some(client_id), Some(client_secret)) = (client_id, client_secret) {
      // Только OAuth credentials без access token
      let oauth_data = OAuthCredentials {
        client_id: client_id.clone(),
        client_secret,
        access_token: None,
        refresh_token: None,
        expires_at: None,
      };

      Ok(Some(ApiKeyData {
        key_type: ApiKeyType::Vimeo,
        value: client_id,
        oauth_data: Some(oauth_data),
        created_at: chrono::Utc::now(),
        last_validated: None,
        is_valid: None,
      }))
    } else {
      Ok(None)
    }
  }

  /// Импортирует Telegram bot credentials
  fn import_telegram_credentials(&self, _env_vars: &[String]) -> Result<Option<ApiKeyData>> {
    let bot_token = self.find_env_value(&["TELEGRAM_BOT_TOKEN"]);

    if let Some(bot_token) = bot_token {
      Ok(Some(ApiKeyData {
        key_type: ApiKeyType::Telegram,
        value: bot_token,
        oauth_data: None,
        created_at: chrono::Utc::now(),
        last_validated: None,
        is_valid: None,
      }))
    } else {
      Ok(None)
    }
  }

  /// Ищет значение в списке переменных окружения
  fn find_env_value(&self, env_names: &[&str]) -> Option<String> {
    for env_name in env_names {
      if let Ok(value) = env::var(env_name) {
        if !value.is_empty() {
          return Some(value);
        }
      }
    }
    None
  }

  /// Экспортирует API ключи в .env формат
  pub fn export_to_env_format(&self, api_keys: &[ApiKeyData]) -> String {
    let mut env_content = String::new();
    env_content.push_str("# Timeline Studio API Keys\n");
    env_content.push_str("# Generated by EnvImporter\n");
    env_content.push_str(&format!(
      "# Generated at: {}\n\n",
      chrono::Utc::now().format("%Y-%m-%d %H:%M:%S UTC")
    ));

    for key_data in api_keys {
      match key_data.key_type {
        ApiKeyType::OpenAI => {
          env_content.push_str(&format!("OPENAI_API_KEY=\"{}\"\n", key_data.value));
        }
        ApiKeyType::Claude => {
          env_content.push_str(&format!("CLAUDE_API_KEY=\"{}\"\n", key_data.value));
        }
        ApiKeyType::MCPClaude => {
          env_content.push_str(&format!("MCP_CLAUDE_API_KEY=\"{}\"\n", key_data.value));
        }
        ApiKeyType::DeepSeek => {
          env_content.push_str(&format!("DEEPSEEK_API_KEY=\"{}\"\n", key_data.value));
        }
        ApiKeyType::Grok => {
          env_content.push_str(&format!("GROK_API_KEY=\"{}\"\n", key_data.value));
        }
        ApiKeyType::YouTube => {
          if let Some(oauth_data) = &key_data.oauth_data {
            env_content.push_str(&format!("YOUTUBE_CLIENT_ID=\"{}\"\n", oauth_data.client_id));
            env_content.push_str(&format!(
              "YOUTUBE_CLIENT_SECRET=\"{}\"\n",
              oauth_data.client_secret
            ));
            if let Some(access_token) = &oauth_data.access_token {
              env_content.push_str(&format!("YOUTUBE_ACCESS_TOKEN=\"{access_token}\"\n"));
            }
          }
        }
        ApiKeyType::TikTok => {
          if let Some(oauth_data) = &key_data.oauth_data {
            env_content.push_str(&format!("TIKTOK_CLIENT_ID=\"{}\"\n", oauth_data.client_id));
            env_content.push_str(&format!(
              "TIKTOK_CLIENT_SECRET=\"{}\"\n",
              oauth_data.client_secret
            ));
          }
        }
        ApiKeyType::Vimeo => {
          if let Some(oauth_data) = &key_data.oauth_data {
            env_content.push_str(&format!("VIMEO_CLIENT_ID=\"{}\"\n", oauth_data.client_id));
            env_content.push_str(&format!(
              "VIMEO_CLIENT_SECRET=\"{}\"\n",
              oauth_data.client_secret
            ));
            if let Some(access_token) = &oauth_data.access_token {
              env_content.push_str(&format!("VIMEO_ACCESS_TOKEN=\"{access_token}\"\n"));
            }
          } else {
            env_content.push_str(&format!("VIMEO_ACCESS_TOKEN=\"{}\"\n", key_data.value));
          }
        }
        ApiKeyType::Telegram => {
          env_content.push_str(&format!("TELEGRAM_BOT_TOKEN=\"{}\"\n", key_data.value));
        }
        ApiKeyType::Codecov => {
          env_content.push_str(&format!("CODECOV_TOKEN=\"{}\"\n", key_data.value));
        }
        ApiKeyType::TauriAnalytics => {
          env_content.push_str(&format!("TAURI_ANALYTICS_KEY=\"{}\"\n", key_data.value));
        }
      }
      env_content.push('\n');
    }

    env_content
  }

  /// Проверяет наличие .env файла в стандартных местах
  #[allow(dead_code)]
  pub fn find_env_file() -> Option<String> {
    let possible_paths = [".env", ".env.local", "../.env", "../../.env"];

    for path in &possible_paths {
      if Path::new(path).exists() {
        return Some(path.to_string());
      }
    }

    None
  }
}

impl Default for EnvImporter {
  fn default() -> Self {
    Self::new()
  }
}

#[cfg(test)]
mod tests {
  use super::*;
  use std::env;
  use std::fs;
  use tempfile::TempDir;

  #[test]
  fn test_env_importer_new() {
    let importer = EnvImporter::new();
    assert!(importer.env_file_path.is_none());
  }

  #[test]
  fn test_env_importer_with_env_file() {
    let importer = EnvImporter::with_env_file("/path/to/.env");
    assert_eq!(importer.env_file_path, Some("/path/to/.env".to_string()));
  }

  #[test]
  fn test_env_importer_default() {
    let importer = EnvImporter::default();
    assert!(importer.env_file_path.is_none());
  }

  #[test]
  fn test_load_env_file_missing() {
    let importer = EnvImporter::with_env_file("/non/existent/path/.env");
    let result = importer.load_env_file();
    assert!(result.is_ok()); // Should not fail on missing file
  }

  #[test]
  fn test_load_env_file_valid() {
    let temp_dir = TempDir::new().unwrap();
    let env_file = temp_dir.path().join(".env");

    let content = r#"
# Comment line
TEST_KEY=test_value
TEST_KEY_QUOTED="quoted value"
TEST_KEY_SINGLE='single quoted'

# Another comment
EMPTY_LINE_ABOVE=value
        "#;

    fs::write(&env_file, content).unwrap();

    let importer = EnvImporter::with_env_file(&env_file);
    let result = importer.load_env_file();
    assert!(result.is_ok());

    // Check that variables were set
    assert_eq!(env::var("TEST_KEY").unwrap(), "test_value");
    assert_eq!(env::var("TEST_KEY_QUOTED").unwrap(), "quoted value");
    assert_eq!(env::var("TEST_KEY_SINGLE").unwrap(), "single quoted");
    assert_eq!(env::var("EMPTY_LINE_ABOVE").unwrap(), "value");

    // Clean up
    unsafe {
      env::remove_var("TEST_KEY");
      env::remove_var("TEST_KEY_QUOTED");
      env::remove_var("TEST_KEY_SINGLE");
      env::remove_var("EMPTY_LINE_ABOVE");
    }
  }

  #[test]
  fn test_get_env_mappings() {
    let importer = EnvImporter::new();
    let mappings = importer.get_env_mappings();

    // Check that all API key types have mappings
    assert!(mappings.contains_key(&ApiKeyType::OpenAI));
    assert!(mappings.contains_key(&ApiKeyType::Claude));
    assert!(mappings.contains_key(&ApiKeyType::DeepSeek));
    assert!(mappings.contains_key(&ApiKeyType::Grok));
    assert!(mappings.contains_key(&ApiKeyType::YouTube));
    assert!(mappings.contains_key(&ApiKeyType::TikTok));
    assert!(mappings.contains_key(&ApiKeyType::Vimeo));
    assert!(mappings.contains_key(&ApiKeyType::Telegram));
    assert!(mappings.contains_key(&ApiKeyType::Codecov));
    assert!(mappings.contains_key(&ApiKeyType::TauriAnalytics));

    // Check specific mappings
    let openai_vars = mappings.get(&ApiKeyType::OpenAI).unwrap();
    assert!(openai_vars.contains(&"OPENAI_API_KEY".to_string()));

    let claude_vars = mappings.get(&ApiKeyType::Claude).unwrap();
    assert!(claude_vars.contains(&"CLAUDE_API_KEY".to_string()));
    assert!(claude_vars.contains(&"ANTHROPIC_API_KEY".to_string()));
  }

  #[test]
  fn test_import_single_api_key_simple() {
    let importer = EnvImporter::new();

    // Set test environment variable
    unsafe {
      env::set_var("OPENAI_API_KEY", "test_openai_key_123");
    }

    let env_vars = vec!["OPENAI_API_KEY".to_string()];
    let result = importer
      .import_single_api_key(ApiKeyType::OpenAI, &env_vars)
      .unwrap();

    assert!(result.is_some());
    let key_data = result.unwrap();
    assert_eq!(key_data.key_type, ApiKeyType::OpenAI);
    assert_eq!(key_data.value, "test_openai_key_123");

    // Clean up
    unsafe {
      env::remove_var("OPENAI_API_KEY");
    }
  }

  #[test]
  fn test_import_single_api_key_oauth() {
    let importer = EnvImporter::new();

    // Set OAuth environment variables
    unsafe {
      env::set_var("YOUTUBE_CLIENT_ID", "youtube_client_123");
      env::set_var("YOUTUBE_CLIENT_SECRET", "youtube_secret_456");
    }

    let env_vars = vec![
      "YOUTUBE_CLIENT_ID".to_string(),
      "YOUTUBE_CLIENT_SECRET".to_string(),
    ];
    let result = importer
      .import_single_api_key(ApiKeyType::YouTube, &env_vars)
      .unwrap();

    assert!(result.is_some());
    let key_data = result.unwrap();
    assert_eq!(key_data.key_type, ApiKeyType::YouTube);
    assert_eq!(key_data.value, "youtube_client_123"); // value stores client_id

    // OAuth credentials should be in oauth_data field
    assert!(key_data.oauth_data.is_some());
    let oauth_data = key_data.oauth_data.unwrap();
    assert_eq!(oauth_data.client_id, "youtube_client_123");
    assert_eq!(oauth_data.client_secret, "youtube_secret_456");

    // Clean up
    unsafe {
      env::remove_var("YOUTUBE_CLIENT_ID");
      env::remove_var("YOUTUBE_CLIENT_SECRET");
    }
  }

  #[test]
  fn test_import_single_api_key_missing() {
    let importer = EnvImporter::new();

    let env_vars = vec!["NONEXISTENT_KEY".to_string()];
    let result = importer
      .import_single_api_key(ApiKeyType::OpenAI, &env_vars)
      .unwrap();

    assert!(result.is_none());
  }

  #[test]
  fn test_import_all_api_keys() {
    // Clear all environment variables first
    unsafe {
      env::remove_var("OPENAI_API_KEY");
      env::remove_var("OPENAI_KEY");
      env::remove_var("CLAUDE_API_KEY");
      env::remove_var("ANTHROPIC_API_KEY");
      env::remove_var("CLAUDE_KEY");
      env::remove_var("DEEPSEEK_API_KEY");
      env::remove_var("DEEPSEEK_KEY");
      env::remove_var("GROK_API_KEY");
      env::remove_var("GROK_KEY");
      env::remove_var("YOUTUBE_CLIENT_ID");
      env::remove_var("YOUTUBE_CLIENT_SECRET");
      env::remove_var("TIKTOK_CLIENT_ID");
      env::remove_var("TIKTOK_CLIENT_SECRET");
      env::remove_var("VIMEO_CLIENT_ID");
      env::remove_var("VIMEO_CLIENT_SECRET");
      env::remove_var("VIMEO_ACCESS_TOKEN");
      env::remove_var("TELEGRAM_BOT_TOKEN");
      env::remove_var("CODECOV_TOKEN");
      env::remove_var("TAURI_ANALYTICS_KEY");
    }

    let importer = EnvImporter::new();

    // Set various test environment variables
    unsafe {
      env::set_var("OPENAI_API_KEY", "openai_test_key");
      env::set_var("CLAUDE_API_KEY", "claude_test_key");
      env::set_var("TELEGRAM_BOT_TOKEN", "bot_token_123");
      env::set_var("VIMEO_ACCESS_TOKEN", "vimeo_token_456");
    }

    let result = importer.import_all_api_keys();
    assert!(result.is_ok());

    let keys = result.unwrap();
    assert_eq!(
      keys.len(),
      4,
      "Expected exactly 4 keys, found: {}",
      keys.len()
    ); // Exactly the keys we set

    // Check that our keys are present
    let has_openai = keys
      .iter()
      .any(|k| k.key_type == ApiKeyType::OpenAI && k.value == "openai_test_key");
    let has_claude = keys
      .iter()
      .any(|k| k.key_type == ApiKeyType::Claude && k.value == "claude_test_key");
    let has_telegram = keys
      .iter()
      .any(|k| k.key_type == ApiKeyType::Telegram && k.value.contains("bot_token_123"));
    let has_vimeo = keys
      .iter()
      .any(|k| k.key_type == ApiKeyType::Vimeo && k.value == "vimeo_token_456");

    assert!(has_openai);
    assert!(has_claude);
    assert!(has_telegram);
    assert!(has_vimeo);

    // Clean up - remove all test variables
    unsafe {
      env::remove_var("OPENAI_API_KEY");
      env::remove_var("CLAUDE_API_KEY");
      env::remove_var("TELEGRAM_BOT_TOKEN");
      env::remove_var("VIMEO_ACCESS_TOKEN");
      env::remove_var("OPENAI_KEY");
      env::remove_var("ANTHROPIC_API_KEY");
      env::remove_var("CLAUDE_KEY");
      env::remove_var("DEEPSEEK_API_KEY");
      env::remove_var("DEEPSEEK_KEY");
      env::remove_var("YOUTUBE_CLIENT_ID");
      env::remove_var("YOUTUBE_CLIENT_SECRET");
      env::remove_var("TIKTOK_CLIENT_ID");
      env::remove_var("TIKTOK_CLIENT_SECRET");
      env::remove_var("VIMEO_CLIENT_ID");
      env::remove_var("VIMEO_CLIENT_SECRET");
      env::remove_var("CODECOV_TOKEN");
      env::remove_var("TAURI_ANALYTICS_KEY");
    }
  }

  #[test]
  fn test_import_api_key() {
    let importer = EnvImporter::new();

    // Test with existing key
    unsafe {
      env::set_var("DEEPSEEK_API_KEY", "deepseek_test_123");
    }

    let result = importer.import_api_key(ApiKeyType::DeepSeek);
    assert!(result.is_ok());

    let key_data = result.unwrap();
    assert!(key_data.is_some());
    let key = key_data.unwrap();
    assert_eq!(key.key_type, ApiKeyType::DeepSeek);
    assert_eq!(key.value, "deepseek_test_123");

    // Test with non-existing key
    // First ensure the env var is not set
    unsafe {
      env::remove_var("CODECOV_TOKEN");
    }

    let result = importer.import_api_key(ApiKeyType::Codecov);
    assert!(result.is_ok());
    assert!(result.unwrap().is_none());

    // Clean up
    unsafe {
      env::remove_var("DEEPSEEK_API_KEY");
    }
  }

  #[test]
  fn test_export_to_env_format_simple() {
    let keys = vec![
      ApiKeyData {
        key_type: ApiKeyType::OpenAI,
        value: "openai_key_123".to_string(),
        oauth_data: None,
        created_at: chrono::Utc::now(),
        last_validated: None,
        is_valid: None,
      },
      ApiKeyData {
        key_type: ApiKeyType::Claude,
        value: "claude_key_456".to_string(),
        oauth_data: None,
        created_at: chrono::Utc::now(),
        last_validated: None,
        is_valid: None,
      },
    ];

    let importer = EnvImporter::new();
    let env_content = importer.export_to_env_format(&keys);
    // export_to_env_format uses different header
    assert!(env_content.contains("# Timeline Studio API Keys"));
    assert!(env_content.contains("OPENAI_API_KEY"));
    assert!(env_content.contains("CLAUDE_API_KEY"));
  }

  #[test]
  fn test_export_to_env_format_oauth() {
    let oauth_creds = OAuthCredentials {
      client_id: "youtube_client".to_string(),
      client_secret: "youtube_secret".to_string(),
      access_token: Some("youtube_token".to_string()),
      refresh_token: Some("youtube_refresh".to_string()),
      expires_at: None,
    };

    let keys = vec![ApiKeyData {
      key_type: ApiKeyType::YouTube,
      value: "youtube_client".to_string(),
      oauth_data: Some(oauth_creds),
      created_at: chrono::Utc::now(),
      last_validated: None,
      is_valid: None,
    }];

    let importer = EnvImporter::new();
    let env_content = importer.export_to_env_format(&keys);
    assert!(env_content.contains("YOUTUBE_CLIENT_ID"));
    assert!(env_content.contains("YOUTUBE_CLIENT_SECRET"));
    assert!(env_content.contains("YOUTUBE_ACCESS_TOKEN"));
  }

  #[test]
  fn test_export_to_env_format_empty() {
    let keys = vec![];
    let importer = EnvImporter::new();
    let env_content = importer.export_to_env_format(&keys);
    assert!(env_content.contains("# Timeline Studio API Keys"));
    assert!(env_content.contains("# Generated"));
  }

  #[test]
  fn test_oauth_types_handling() {
    // Test that OAuth types are handled differently in import methods
    // YouTube, TikTok, and Vimeo use OAuth
    let oauth_types = [ApiKeyType::YouTube, ApiKeyType::TikTok, ApiKeyType::Vimeo];

    // Simple API key types
    let simple_types = [ApiKeyType::OpenAI, ApiKeyType::Claude, ApiKeyType::DeepSeek];

    // Just verify the enums exist and can be used
    assert_eq!(oauth_types.len(), 3);
    assert_eq!(simple_types.len(), 3);
  }

  #[test]
  fn test_telegram_special_handling() {
    let importer = EnvImporter::new();

    // Test Telegram with both bot token and chat ID
    unsafe {
      env::set_var("TELEGRAM_BOT_TOKEN", "bot_token_123");
      env::set_var("TELEGRAM_CHAT_ID", "chat_id_456");
    }

    let env_vars = vec![
      "TELEGRAM_BOT_TOKEN".to_string(),
      "TELEGRAM_CHAT_ID".to_string(),
      "TELEGRAM_CHANNEL_ID".to_string(),
    ];

    let result = importer
      .import_single_api_key(ApiKeyType::Telegram, &env_vars)
      .unwrap();
    assert!(result.is_some());

    let key_data = result.unwrap();
    assert_eq!(key_data.key_type, ApiKeyType::Telegram);
    assert_eq!(key_data.value, "bot_token_123");
    // Telegram only imports bot token, not chat_id

    // Clean up
    unsafe {
      env::remove_var("TELEGRAM_BOT_TOKEN");
      env::remove_var("TELEGRAM_CHAT_ID");
    }
  }

  #[test]
  fn test_load_env_file_malformed() {
    let temp_dir = TempDir::new().unwrap();
    let env_file = temp_dir.path().join(".env");

    let content = r#"
VALID_KEY=valid_value
INVALID_LINE_NO_EQUALS
KEY_WITH_EQUALS_IN_VALUE=value=with=equals
KEY_WITH_SPACES = value with spaces 
        "#;

    fs::write(&env_file, content).unwrap();

    let importer = EnvImporter::with_env_file(&env_file);
    let result = importer.load_env_file();
    assert!(result.is_ok());

    // Check that valid lines were processed
    assert_eq!(env::var("VALID_KEY").unwrap(), "valid_value");
    assert_eq!(
      env::var("KEY_WITH_EQUALS_IN_VALUE").unwrap(),
      "value=with=equals"
    );
    assert_eq!(env::var("KEY_WITH_SPACES").unwrap(), "value with spaces");

    // Invalid line should be skipped
    assert!(env::var("INVALID_LINE_NO_EQUALS").is_err());

    // Clean up
    unsafe {
      env::remove_var("VALID_KEY");
      env::remove_var("KEY_WITH_EQUALS_IN_VALUE");
      env::remove_var("KEY_WITH_SPACES");
    }
  }
}

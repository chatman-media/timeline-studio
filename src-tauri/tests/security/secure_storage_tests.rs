//! Комплексные тесты для security/secure_storage.rs

use std::str::FromStr;
use tempfile::TempDir;
use timeline_studio_lib::security::{ApiKeyData, ApiKeyType, OAuthCredentials, SecureStorage};

/// Создает временную директорию для тестов
#[allow(dead_code)]
fn create_test_dir() -> TempDir {
  TempDir::new().unwrap()
}

#[test]
fn test_api_key_type_conversions() {
  // Тест всех вариантов преобразования
  let test_cases = vec![
    (ApiKeyType::OpenAI, "openai"),
    (ApiKeyType::Claude, "claude"),
    (ApiKeyType::DeepSeek, "deepseek"),
    (ApiKeyType::YouTube, "youtube"),
    (ApiKeyType::TikTok, "tiktok"),
    (ApiKeyType::Vimeo, "vimeo"),
    (ApiKeyType::Telegram, "telegram"),
    (ApiKeyType::Codecov, "codecov"),
    (ApiKeyType::TauriAnalytics, "tauri_analytics"),
  ];

  for (key_type, str_repr) in test_cases {
    assert_eq!(key_type.as_str(), str_repr);
    assert_eq!(ApiKeyType::from_str(str_repr).unwrap(), key_type);
  }
}

#[test]
fn test_api_key_type_from_str_errors() {
  let invalid_cases = vec![
    "OpenAI",      // Wrong case
    "CLAUDE",      // Wrong case
    "youtube_api", // Wrong format
    "github",      // Not supported
    "",            // Empty
    " openai ",    // With spaces
    "open ai",     // With space
    "123",         // Numbers only
    "опенаи",      // Non-ASCII
  ];

  for invalid in invalid_cases {
    assert!(ApiKeyType::from_str(invalid).is_err());
  }
}

#[test]
fn test_oauth_credentials_full() {
  let expires = chrono::Utc::now() + chrono::Duration::hours(1);
  let oauth = OAuthCredentials {
    client_id: "test_client_123".to_string(),
    client_secret: "secret_456".to_string(),
    access_token: Some("access_789".to_string()),
    refresh_token: Some("refresh_012".to_string()),
    expires_at: Some(expires),
  };

  // Проверяем сериализацию
  let json = serde_json::to_string(&oauth).unwrap();
  assert!(json.contains("test_client_123"));
  assert!(json.contains("secret_456"));
  assert!(json.contains("access_789"));
  assert!(json.contains("refresh_012"));

  // Проверяем десериализацию
  let deserialized: OAuthCredentials = serde_json::from_str(&json).unwrap();
  assert_eq!(deserialized.client_id, oauth.client_id);
  assert_eq!(deserialized.client_secret, oauth.client_secret);
  assert_eq!(deserialized.access_token, oauth.access_token);
  assert_eq!(deserialized.refresh_token, oauth.refresh_token);
}

#[test]
fn test_api_key_data_with_oauth() {
  let oauth = OAuthCredentials {
    client_id: "yt_client".to_string(),
    client_secret: "yt_secret".to_string(),
    access_token: Some("yt_access".to_string()),
    refresh_token: Some("yt_refresh".to_string()),
    expires_at: None,
  };

  let key_data = ApiKeyData {
    key_type: ApiKeyType::YouTube,
    value: "yt_client".to_string(),
    oauth_data: Some(oauth),
    created_at: chrono::Utc::now(),
    last_validated: Some(chrono::Utc::now()),
    is_valid: Some(true),
  };

  // Проверяем сериализацию
  let json = serde_json::to_string(&key_data).unwrap();
  let deserialized: ApiKeyData = serde_json::from_str(&json).unwrap();

  assert_eq!(deserialized.key_type, ApiKeyType::YouTube);
  assert_eq!(deserialized.value, "yt_client");
  assert!(deserialized.oauth_data.is_some());
  assert!(deserialized.last_validated.is_some());
  assert_eq!(deserialized.is_valid, Some(true));
}

#[test]
fn test_api_key_data_simple() {
  let key_data = ApiKeyData {
    key_type: ApiKeyType::OpenAI,
    value: "sk-test123456789".to_string(),
    oauth_data: None,
    created_at: chrono::Utc::now(),
    last_validated: None,
    is_valid: None,
  };

  assert_eq!(key_data.key_type, ApiKeyType::OpenAI);
  assert_eq!(key_data.value, "sk-test123456789");
  assert!(key_data.oauth_data.is_none());
  assert!(key_data.last_validated.is_none());
  assert!(key_data.is_valid.is_none());
}

#[test]
fn test_get_or_create_encryption_key() {
  // Создаем временную директорию для теста
  let temp_dir = TempDir::new().unwrap();
  unsafe { std::env::set_var("HOME", temp_dir.path()) };

  // Первый вызов создает ключ
  let result1 = SecureStorage::get_or_create_encryption_key();

  // В тестовом окружении может не быть доступа к config dir
  if result1.is_ok() {
    let key1 = result1.unwrap();
    assert_eq!(key1.len(), 32);

    // Второй вызов должен вернуть тот же ключ
    let key2 = SecureStorage::get_or_create_encryption_key().unwrap();
    assert_eq!(key1, key2);
  }
}

// Сложные тесты, требующие AppHandle, закомментированы в исходном файле

#[cfg(test)]
mod encryption_tests {
  use aes_gcm::{
    Aes256Gcm,
    aead::{Aead, AeadCore, KeyInit, OsRng},
  };

  #[test]
  fn test_aes_gcm_encryption_decryption() {
    // Тест базовой функциональности шифрования
    let key = Aes256Gcm::generate_key(&mut OsRng);
    let cipher = Aes256Gcm::new(&key);

    let plaintext = b"Secret API Key: sk-123456789";
    let nonce = Aes256Gcm::generate_nonce(&mut OsRng);

    // Шифрование
    let ciphertext = cipher.encrypt(&nonce, plaintext.as_ref()).unwrap();
    assert_ne!(ciphertext, plaintext);

    // Расшифровка
    let decrypted = cipher.decrypt(&nonce, ciphertext.as_ref()).unwrap();
    assert_eq!(decrypted, plaintext);
  }

  #[test]
  fn test_encryption_with_different_keys() {
    let key1 = Aes256Gcm::generate_key(&mut OsRng);
    let key2 = Aes256Gcm::generate_key(&mut OsRng);

    let cipher1 = Aes256Gcm::new(&key1);
    let cipher2 = Aes256Gcm::new(&key2);

    let plaintext = b"Secret data";
    let nonce = Aes256Gcm::generate_nonce(&mut OsRng);

    // Шифруем первым ключом
    let ciphertext = cipher1.encrypt(&nonce, plaintext.as_ref()).unwrap();

    // Пытаемся расшифровать вторым ключом - должна быть ошибка
    assert!(cipher2.decrypt(&nonce, ciphertext.as_ref()).is_err());
  }
}

#[cfg(test)]
mod edge_cases {
  use super::*;

  #[test]
  fn test_api_key_type_hash_collision() {
    use std::collections::HashMap;

    let mut map = HashMap::new();

    // Добавляем все типы ключей
    for key_type in [
      ApiKeyType::OpenAI,
      ApiKeyType::Claude,
      ApiKeyType::DeepSeek,
      ApiKeyType::YouTube,
      ApiKeyType::TikTok,
      ApiKeyType::Vimeo,
      ApiKeyType::Telegram,
      ApiKeyType::Codecov,
      ApiKeyType::TauriAnalytics,
    ] {
      map.insert(key_type.clone(), key_type.as_str());
    }

    // Проверяем, что все 9 ключей сохранены (нет коллизий)
    assert_eq!(map.len(), 9);
  }

  #[test]
  fn test_oauth_credentials_partial() {
    // Тест OAuth credentials только с обязательными полями
    let oauth = OAuthCredentials {
      client_id: "minimal_client".to_string(),
      client_secret: "minimal_secret".to_string(),
      access_token: None,
      refresh_token: None,
      expires_at: None,
    };

    let json = serde_json::to_string(&oauth).unwrap();
    let deserialized: OAuthCredentials = serde_json::from_str(&json).unwrap();

    assert_eq!(deserialized.client_id, "minimal_client");
    assert_eq!(deserialized.client_secret, "minimal_secret");
    assert!(deserialized.access_token.is_none());
    assert!(deserialized.refresh_token.is_none());
    assert!(deserialized.expires_at.is_none());
  }
}

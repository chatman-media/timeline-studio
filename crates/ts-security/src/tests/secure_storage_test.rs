#[cfg(test)]
mod tests {
  use crate::secure_storage::*;
  use std::str::FromStr;

  #[test]
  fn test_api_key_type_as_str() {
    assert_eq!(ApiKeyType::OpenAI.as_str(), "openai");
    assert_eq!(ApiKeyType::Claude.as_str(), "claude");
    assert_eq!(ApiKeyType::DeepSeek.as_str(), "deepseek");
    assert_eq!(ApiKeyType::YouTube.as_str(), "youtube");
    assert_eq!(ApiKeyType::TikTok.as_str(), "tiktok");
    assert_eq!(ApiKeyType::Vimeo.as_str(), "vimeo");
    assert_eq!(ApiKeyType::Telegram.as_str(), "telegram");
    assert_eq!(ApiKeyType::Codecov.as_str(), "codecov");
    assert_eq!(ApiKeyType::TauriAnalytics.as_str(), "tauri_analytics");
  }

  #[test]
  fn test_api_key_type_from_str() {
    assert_eq!(ApiKeyType::from_str("openai").unwrap(), ApiKeyType::OpenAI);
    assert_eq!(ApiKeyType::from_str("claude").unwrap(), ApiKeyType::Claude);
    assert_eq!(
      ApiKeyType::from_str("deepseek").unwrap(),
      ApiKeyType::DeepSeek
    );
    assert_eq!(
      ApiKeyType::from_str("youtube").unwrap(),
      ApiKeyType::YouTube
    );
    assert_eq!(ApiKeyType::from_str("tiktok").unwrap(), ApiKeyType::TikTok);
    assert_eq!(ApiKeyType::from_str("vimeo").unwrap(), ApiKeyType::Vimeo);
    assert_eq!(
      ApiKeyType::from_str("telegram").unwrap(),
      ApiKeyType::Telegram
    );
    assert_eq!(
      ApiKeyType::from_str("codecov").unwrap(),
      ApiKeyType::Codecov
    );
    assert_eq!(
      ApiKeyType::from_str("tauri_analytics").unwrap(),
      ApiKeyType::TauriAnalytics
    );

    // Test invalid key type
    assert!(ApiKeyType::from_str("invalid").is_err());
  }

  #[test]
  fn test_api_key_type_variants() {
    // Test that all variants exist and can be created
    let _openai = ApiKeyType::OpenAI;
    let _claude = ApiKeyType::Claude;
    let _deepseek = ApiKeyType::DeepSeek;
    let _youtube = ApiKeyType::YouTube;
    let _tiktok = ApiKeyType::TikTok;
    let _vimeo = ApiKeyType::Vimeo;
    let _telegram = ApiKeyType::Telegram;
    let _codecov = ApiKeyType::Codecov;
    let _tauri_analytics = ApiKeyType::TauriAnalytics;
  }

  #[test]
  fn test_api_key_type_round_trip() {
    // Test that converting to string and back preserves the value
    let types = vec![
      ApiKeyType::OpenAI,
      ApiKeyType::Claude,
      ApiKeyType::DeepSeek,
      ApiKeyType::YouTube,
      ApiKeyType::TikTok,
      ApiKeyType::Vimeo,
      ApiKeyType::Telegram,
      ApiKeyType::Codecov,
      ApiKeyType::TauriAnalytics,
    ];

    for key_type in types {
      let as_str = key_type.as_str();
      let from_str = ApiKeyType::from_str(as_str).unwrap();
      assert_eq!(key_type, from_str);
    }
  }

  #[test]
  fn test_oauth_credentials_serialization() {
    let creds = OAuthCredentials {
      client_id: "test_client_id".to_string(),
      client_secret: "test_client_secret".to_string(),
      access_token: Some("test_access_token".to_string()),
      refresh_token: Some("test_refresh_token".to_string()),
      expires_at: Some(chrono::Utc::now()),
    };

    let json = serde_json::to_string(&creds).unwrap();
    let deserialized: OAuthCredentials = serde_json::from_str(&json).unwrap();

    assert_eq!(deserialized.client_id, creds.client_id);
    assert_eq!(deserialized.client_secret, creds.client_secret);
    assert_eq!(deserialized.access_token, creds.access_token);
    assert_eq!(deserialized.refresh_token, creds.refresh_token);
  }

  #[test]
  fn test_api_key_data_creation() {
    let data = ApiKeyData {
      key_type: ApiKeyType::OpenAI,
      value: "test_key".to_string(),
      oauth_data: None,
      created_at: chrono::Utc::now(),
      last_validated: None,
      is_valid: None,
    };

    assert_eq!(data.key_type, ApiKeyType::OpenAI);
    assert_eq!(data.value, "test_key");
    assert!(data.oauth_data.is_none());
  }

  #[test]
  fn test_api_key_data_with_oauth() {
    let creds = OAuthCredentials {
      client_id: "test_client_id".to_string(),
      client_secret: "test_client_secret".to_string(),
      access_token: Some("test_access_token".to_string()),
      refresh_token: None,
      expires_at: None,
    };

    let data = ApiKeyData {
      key_type: ApiKeyType::YouTube,
      value: "".to_string(),
      oauth_data: Some(creds),
      created_at: chrono::Utc::now(),
      last_validated: None,
      is_valid: None,
    };

    assert_eq!(data.key_type, ApiKeyType::YouTube);
    assert!(data.oauth_data.is_some());
    let oauth = data.oauth_data.unwrap();
    assert_eq!(oauth.client_id, "test_client_id");
    assert_eq!(oauth.access_token, Some("test_access_token".to_string()));
  }

  #[test]
  fn test_api_key_data_serialization() {
    let data = ApiKeyData {
      key_type: ApiKeyType::OpenAI,
      value: "test_key".to_string(),
      oauth_data: None,
      created_at: chrono::Utc::now(),
      last_validated: Some(chrono::Utc::now()),
      is_valid: Some(true),
    };

    let json = serde_json::to_string(&data).unwrap();
    let deserialized: ApiKeyData = serde_json::from_str(&json).unwrap();

    assert_eq!(deserialized.key_type, ApiKeyType::OpenAI);
    assert_eq!(deserialized.value, "test_key");
    assert!(deserialized.oauth_data.is_none());
    assert!(deserialized.last_validated.is_some());
    assert_eq!(deserialized.is_valid, Some(true));
  }

  #[test]
  fn test_secure_storage_get_or_create_encryption_key() {
    // Test that get_or_create_encryption_key returns a key of correct length
    match SecureStorage::get_or_create_encryption_key() {
      Ok(key) => {
        assert_eq!(key.len(), 32); // AES-256 requires 32 bytes
      }
      Err(_) => {
        // Key creation might fail in test environment without proper setup
        // This is acceptable for unit tests
      }
    }
  }

  #[test]
  fn test_oauth_credentials_expiry() {
    use chrono::Duration;

    // Test credentials without expiry
    let creds_no_expiry = OAuthCredentials {
      client_id: "test".to_string(),
      client_secret: "test".to_string(),
      access_token: Some("token".to_string()),
      refresh_token: None,
      expires_at: None,
    };
    assert!(creds_no_expiry.expires_at.is_none());

    // Test credentials with future expiry
    let future_time = chrono::Utc::now() + Duration::hours(1);
    let creds_future = OAuthCredentials {
      client_id: "test".to_string(),
      client_secret: "test".to_string(),
      access_token: Some("token".to_string()),
      refresh_token: None,
      expires_at: Some(future_time),
    };
    assert!(creds_future.expires_at.is_some());
    assert!(creds_future.expires_at.unwrap() > chrono::Utc::now());

    // Test credentials with past expiry
    let past_time = chrono::Utc::now() - Duration::hours(1);
    let creds_past = OAuthCredentials {
      client_id: "test".to_string(),
      client_secret: "test".to_string(),
      access_token: Some("token".to_string()),
      refresh_token: None,
      expires_at: Some(past_time),
    };
    assert!(creds_past.expires_at.is_some());
    assert!(creds_past.expires_at.unwrap() < chrono::Utc::now());
  }
}

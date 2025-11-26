#[cfg(test)]
mod tests {
  use crate::security::commands::*;
  use serde_json::json;

  #[test]
  fn test_api_key_operation_result_serialization() {
    let result = ApiKeyOperationResult {
      success: true,
      message: "Operation successful".to_string(),
      data: Some(json!({"key": "value"})),
    };

    let json = serde_json::to_string(&result).unwrap();
    let deserialized: ApiKeyOperationResult = serde_json::from_str(&json).unwrap();

    assert_eq!(deserialized.success, result.success);
    assert_eq!(deserialized.message, result.message);
    assert!(deserialized.data.is_some());
  }

  #[test]
  fn test_api_key_operation_result_without_data() {
    let result = ApiKeyOperationResult {
      success: false,
      message: "Operation failed".to_string(),
      data: None,
    };

    let json = serde_json::to_string(&result).unwrap();
    let deserialized: ApiKeyOperationResult = serde_json::from_str(&json).unwrap();

    assert!(!deserialized.success);
    assert_eq!(deserialized.message, "Operation failed");
    assert!(deserialized.data.is_none());
  }

  #[test]
  fn test_api_key_info_serialization() {
    let info = ApiKeyInfo {
      key_type: "openai".to_string(),
      has_value: true,
      is_oauth: false,
      has_access_token: false,
      created_at: Some("2025-01-01T00:00:00Z".to_string()),
      last_validated: Some("2025-01-02T00:00:00Z".to_string()),
      is_valid: Some(true),
    };

    let json = serde_json::to_string(&info).unwrap();
    let deserialized: ApiKeyInfo = serde_json::from_str(&json).unwrap();

    assert_eq!(deserialized.key_type, "openai");
    assert!(deserialized.has_value);
    assert!(!deserialized.is_oauth);
    assert!(!deserialized.has_access_token);
    assert!(deserialized.created_at.is_some());
    assert!(deserialized.last_validated.is_some());
    assert_eq!(deserialized.is_valid, Some(true));
  }

  #[test]
  fn test_api_key_info_minimal() {
    let info = ApiKeyInfo {
      key_type: "claude".to_string(),
      has_value: false,
      is_oauth: false,
      has_access_token: false,
      created_at: None,
      last_validated: None,
      is_valid: None,
    };

    let json = serde_json::to_string(&info).unwrap();
    assert!(json.contains("\"claude\""));
    assert!(json.contains("\"has_value\":false"));
  }

  #[test]
  fn test_save_simple_api_key_params_deserialization() {
    let json = json!({
        "key_type": "openai",
        "value": "sk-1234567890"
    });

    let params: SaveSimpleApiKeyParams = serde_json::from_value(json).unwrap();
    assert_eq!(params.key_type, "openai");
    assert_eq!(params.value, "sk-1234567890");
  }

  #[test]
  fn test_save_oauth_credentials_params_deserialization() {
    let json = json!({
        "key_type": "youtube",
        "client_id": "client123",
        "client_secret": "secret456",
        "access_token": "access789",
        "refresh_token": "refresh012"
    });

    let params: SaveOAuthCredentialsParams = serde_json::from_value(json).unwrap();
    assert_eq!(params.key_type, "youtube");
    assert_eq!(params.client_id, "client123");
    assert_eq!(params.client_secret, "secret456");
    assert_eq!(params.access_token, Some("access789".to_string()));
    assert_eq!(params.refresh_token, Some("refresh012".to_string()));
  }

  #[test]
  fn test_save_oauth_credentials_params_minimal() {
    let json = json!({
        "key_type": "tiktok",
        "client_id": "client_minimal",
        "client_secret": "secret_minimal"
    });

    let params: SaveOAuthCredentialsParams = serde_json::from_value(json).unwrap();
    assert_eq!(params.key_type, "tiktok");
    assert_eq!(params.client_id, "client_minimal");
    assert_eq!(params.client_secret, "secret_minimal");
    assert!(params.access_token.is_none());
    assert!(params.refresh_token.is_none());
  }

  #[test]
  fn test_oauth_user_info_deserialization() {
    let json = json!({
        "id": "user123",
        "name": "Test User",
        "email": "test@example.com"
    });

    // Проверяем что JSON может быть десериализован в Value
    let value: serde_json::Value = serde_json::from_value(json).unwrap();
    assert_eq!(value["id"], "user123");
    assert_eq!(value["name"], "Test User");
    assert_eq!(value["email"], "test@example.com");
  }

  #[test]
  fn test_api_key_info_oauth_fields() {
    // Test OAuth key info
    let oauth_info = ApiKeyInfo {
      key_type: "youtube".to_string(),
      has_value: true,
      is_oauth: true,
      has_access_token: true,
      created_at: Some("2025-01-01T00:00:00Z".to_string()),
      last_validated: None,
      is_valid: Some(true),
    };

    assert!(oauth_info.is_oauth);
    assert!(oauth_info.has_access_token);

    // Test non-OAuth key info
    let simple_info = ApiKeyInfo {
      key_type: "openai".to_string(),
      has_value: true,
      is_oauth: false,
      has_access_token: false,
      created_at: Some("2025-01-01T00:00:00Z".to_string()),
      last_validated: None,
      is_valid: Some(true),
    };

    assert!(!simple_info.is_oauth);
    assert!(!simple_info.has_access_token);
  }
}

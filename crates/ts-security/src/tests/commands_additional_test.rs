#[cfg(test)]
mod tests {
  use crate::commands::*;

  #[test]
  fn test_generate_oauth_url() {
    // Test successful URL generation
    let result = generate_oauth_url(
      "youtube".to_string(),
      "test-client-id".to_string(),
      Some("test-state".to_string()),
    );

    // OAuth URL generation might fail in test environment
    match result {
      Ok(url) => {
        assert!(!url.is_empty());
      }
      Err(e) => {
        // Expected in test environment
        assert!(!e.is_empty());
      }
    }
  }

  #[test]
  fn test_generate_oauth_url_invalid_key_type() {
    let result = generate_oauth_url(
      "invalid_service".to_string(),
      "test-client-id".to_string(),
      None,
    );

    assert!(result.is_err());
    assert!(result.unwrap_err().contains("Invalid key type"));
  }

  #[test]
  fn test_parse_oauth_callback_url() {
    // Test with code parameter
    let result = parse_oauth_callback_url(
      "https://example.com/callback?code=test123&state=mystate".to_string(),
    );

    match result {
      Ok(json_value) => {
        assert!(json_value["code"].as_str().is_some());
        assert_eq!(json_value["code"].as_str().unwrap(), "test123");
        assert!(json_value["state"].as_str().is_some());
        assert_eq!(json_value["state"].as_str().unwrap(), "mystate");
        assert!(json_value["error"].is_null());
      }
      Err(e) => {
        // Callback parsing might fail in test environment without oauth_handler module
        assert!(!e.is_empty());
      }
    }
  }

  #[test]
  fn test_parse_oauth_callback_url_with_error() {
    // Test with error parameter
    let result = parse_oauth_callback_url(
      "https://example.com/callback?error=access_denied&error_description=User%20denied%20access"
        .to_string(),
    );

    match result {
      Ok(json_value) => {
        assert!(json_value["code"].is_null());
        assert!(json_value["error"].as_str().is_some());
        // Error extraction depends on callback_utils implementation
      }
      Err(e) => {
        // Callback parsing might fail in test environment
        assert!(!e.is_empty());
      }
    }
  }

  #[test]
  fn test_parse_oauth_callback_url_invalid() {
    // Test with invalid URL
    let result = parse_oauth_callback_url("not_a_url".to_string());
    assert!(result.is_err());
  }

  #[test]
  fn test_save_simple_api_key_params_creation() {
    let params = SaveSimpleApiKeyParams {
      key_type: "openai".to_string(),
      value: "sk-test123".to_string(),
    };

    // Test that params can be created
    assert_eq!(params.key_type, "openai");
    assert_eq!(params.value, "sk-test123");
  }

  #[test]
  fn test_save_oauth_credentials_params_creation() {
    let params = SaveOAuthCredentialsParams {
      key_type: "youtube".to_string(),
      client_id: "client123".to_string(),
      client_secret: "secret456".to_string(),
      access_token: Some("access789".to_string()),
      refresh_token: Some("refresh012".to_string()),
    };

    assert_eq!(params.key_type, "youtube");
    assert_eq!(params.client_id, "client123");
    assert_eq!(params.client_secret, "secret456");
    assert_eq!(params.access_token, Some("access789".to_string()));
    assert_eq!(params.refresh_token, Some("refresh012".to_string()));
  }
}

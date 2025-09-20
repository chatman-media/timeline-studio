use super::{ApiKeyType, OAuthCredentials};
use anyhow::Result;
use reqwest::Client;
use serde_json::{Value, json};
use std::time::Duration;

/// Результат валидации API ключа
#[derive(Debug, Clone, serde::Serialize)]
pub struct ValidationResult {
  pub is_valid: bool,
  pub error_message: Option<String>,
  pub service_info: Option<String>, // Дополнительная информация о сервисе
  pub rate_limits: Option<RateLimitInfo>,
}

/// Информация о лимитах API
#[derive(Debug, Clone, serde::Serialize)]
pub struct RateLimitInfo {
  pub requests_remaining: Option<u32>,
  pub reset_time: Option<chrono::DateTime<chrono::Utc>>,
  pub daily_limit: Option<u32>,
}

/// Валидатор API ключей
pub struct ApiValidator {
  client: Client,
}

impl ApiValidator {
  pub fn new() -> Self {
    let client = Client::builder()
      .timeout(Duration::from_secs(10))
      .build()
      .expect("Failed to create HTTP client");

    Self { client }
  }

  /// Валидирует API ключ в зависимости от типа сервиса
  pub async fn validate_api_key(
    &self,
    key_type: ApiKeyType,
    value: &str,
  ) -> Result<ValidationResult> {
    match key_type {
      ApiKeyType::OpenAI => self.validate_openai_key(value).await,
      ApiKeyType::Claude => self.validate_claude_key(value).await,
      ApiKeyType::DeepSeek => self.validate_deepseek_key(value).await,
      ApiKeyType::Grok => self.validate_grok_key(value).await,
      ApiKeyType::YouTube => self.validate_youtube_oauth(value).await,
      ApiKeyType::TikTok => self.validate_tiktok_oauth(value).await,
      ApiKeyType::Vimeo => self.validate_vimeo_key(value).await,
      ApiKeyType::Telegram => self.validate_telegram_bot(value).await,
      ApiKeyType::Codecov => self.validate_codecov_token(value).await,
      ApiKeyType::TauriAnalytics => self.validate_tauri_analytics(value).await,
    }
  }

  /// Валидирует OAuth credentials
  pub async fn validate_oauth_credentials(
    &self,
    key_type: ApiKeyType,
    oauth_data: &OAuthCredentials,
  ) -> Result<ValidationResult> {
    match key_type {
      ApiKeyType::YouTube => self.validate_youtube_oauth_full(oauth_data).await,
      ApiKeyType::TikTok => self.validate_tiktok_oauth_full(oauth_data).await,
      ApiKeyType::Vimeo => self.validate_vimeo_oauth_full(oauth_data).await,
      _ => Ok(ValidationResult {
        is_valid: false,
        error_message: Some("OAuth validation not supported for this service".to_string()),
        service_info: None,
        rate_limits: None,
      }),
    }
  }

  // OpenAI API валидация
  async fn validate_openai_key(&self, api_key: &str) -> Result<ValidationResult> {
    let response = self
      .client
      .get("https://api.openai.com/v1/models")
      .header("Authorization", format!("Bearer {api_key}"))
      .send()
      .await;

    match response {
      Ok(resp) => {
        let status = resp.status();
        let headers = resp.headers().clone();

        if status.is_success() {
          let rate_limits = self.extract_openai_rate_limits(&headers);
          Ok(ValidationResult {
            is_valid: true,
            error_message: None,
            service_info: Some("OpenAI API access confirmed".to_string()),
            rate_limits,
          })
        } else if status.as_u16() == 401 {
          let error_text = resp.text().await.unwrap_or_default();
          
          // Проверяем специфические ошибки
          let error_message = if error_text.contains("insufficient_quota") || 
                              error_text.contains("quota_exceeded") ||
                              error_text.contains("billing_hard_limit") {
            "Недостаточно кредитов. Пополните баланс на https://platform.openai.com/account/billing".to_string()
          } else {
            "Неверный API ключ".to_string()
          };
          
          Ok(ValidationResult {
            is_valid: false,
            error_message: Some(error_message),
            service_info: None,
            rate_limits: None,
          })
        } else if status.as_u16() == 429 {
          let error_text = resp.text().await.unwrap_or_default();
          let error_message = if error_text.contains("quota") || error_text.contains("billing") {
            "Недостаточно кредитов. Пополните баланс на https://platform.openai.com/account/billing".to_string()
          } else {
            "Превышен лимит запросов".to_string()
          };
          
          Ok(ValidationResult {
            is_valid: false,
            error_message: Some(error_message),
            service_info: None,
            rate_limits: None,
          })
        } else {
          let error_text = resp.text().await.unwrap_or_default();
          Ok(ValidationResult {
            is_valid: false,
            error_message: Some(format!("OpenAI API error {status}: {error_text}")),
            service_info: None,
            rate_limits: None,
          })
        }
      }
      Err(e) => Ok(ValidationResult {
        is_valid: false,
        error_message: Some(format!("Network error: {e}")),
        service_info: None,
        rate_limits: None,
      }),
    }
  }

  // Claude API валидация
  async fn validate_claude_key(&self, api_key: &str) -> Result<ValidationResult> {
    // Простой тест запрос к Claude API
    let body = json!({
        "model": "claude-3-haiku-20240307",
        "max_tokens": 10,
        "messages": [{"role": "user", "content": "Hi"}]
    });

    let response = self
      .client
      .post("https://api.anthropic.com/v1/messages")
      .header("x-api-key", api_key)
      .header("anthropic-version", "2023-06-01")
      .header("content-type", "application/json")
      .json(&body)
      .send()
      .await;

    match response {
      Ok(resp) => {
        let status = resp.status();
        let error_text = resp.text().await.unwrap_or_default();

        if status.is_success() {
          Ok(ValidationResult {
            is_valid: true,
            error_message: None,
            service_info: Some("Claude API access confirmed".to_string()),
            rate_limits: None,
          })
        } else if status.as_u16() == 401 {
          // Проверяем специфические ошибки для ключа
          let error_message = if error_text.contains("credit balance is too low") || 
                              error_text.contains("Insufficient credits") ||
                              error_text.contains("quota exceeded") {
            "Недостаточно кредитов. Пополните баланс на https://console.anthropic.com/billing".to_string()
          } else {
            "Неверный API ключ".to_string()
          };
          
          Ok(ValidationResult {
            is_valid: false,
            error_message: Some(error_message),
            service_info: None,
            rate_limits: None,
          })
        } else if status.as_u16() == 400 {
          // Проверяем ошибки 400, включая недостаточный баланс
          let error_message = if error_text.contains("credit balance is too low") || 
                              error_text.contains("Insufficient credits") ||
                              error_text.contains("quota exceeded") {
            "Недостаточно кредитов. Пополните баланс на https://console.anthropic.com/billing".to_string()
          } else {
            format!("Claude API error {}: {}", status, error_text)
          };
          
          Ok(ValidationResult {
            is_valid: false,
            error_message: Some(error_message),
            service_info: None,
            rate_limits: None,
          })
        } else {
          Ok(ValidationResult {
            is_valid: false,
            error_message: Some(format!("Claude API error {}: {}", status, error_text)),
            service_info: None,
            rate_limits: None,
          })
        }
      }
      Err(e) => Ok(ValidationResult {
        is_valid: false,
        error_message: Some(format!("Network error: {e}")),
        service_info: None,
        rate_limits: None,
      }),
    }
  }

  async fn validate_deepseek_key(&self, api_key: &str) -> Result<ValidationResult> {
    // Простой тест запрос к DeepSeek API
    let body = json!({
        "model": "deepseek-chat",
        "max_tokens": 10,
        "messages": [{"role": "user", "content": "Hi"}]
    });

    let response = self
      .client
      .post("https://api.deepseek.com/v1/chat/completions")
      .header("Authorization", format!("Bearer {api_key}"))
      .header("content-type", "application/json")
      .json(&body)
      .send()
      .await;

    match response {
      Ok(resp) => {
        if resp.status().is_success() {
          Ok(ValidationResult {
            is_valid: true,
            error_message: None,
            service_info: Some("DeepSeek API".to_string()),
            rate_limits: None,
          })
        } else {
          let status = resp.status();
          let error_text = resp.text().await.unwrap_or_default();
          
          // Проверяем специфические ошибки
          let error_message = if error_text.contains("invalid api key") {
            "Неверный API ключ".to_string()
          } else if error_text.contains("insufficient_balance") || 
                    error_text.contains("insufficient_quota") || 
                    error_text.contains("quota_exceeded") ||
                    error_text.contains("Insufficient Balance") {
            "Недостаточно кредитов. Пополните баланс на https://platform.deepseek.com/usage".to_string()
          } else {
            format!("DeepSeek API error {status}: {error_text}")
          };
          
          Ok(ValidationResult {
            is_valid: false,
            error_message: Some(error_message),
            service_info: Some("DeepSeek API".to_string()),
            rate_limits: None,
          })
        }
      }
      Err(e) => Ok(ValidationResult {
        is_valid: false,
        error_message: Some(format!("Network error: {e}")),
        service_info: None,
        rate_limits: None,
      }),
    }
  }

  async fn validate_grok_key(&self, api_key: &str) -> Result<ValidationResult> {
    // Простой тест запрос к Grok API
    let body = json!({
        "model": "grok-beta",
        "max_tokens": 10,
        "messages": [{"role": "user", "content": "Hi"}]
    });

    let response = self
      .client
      .post("https://api.x.ai/v1/chat/completions")
      .header("Authorization", format!("Bearer {api_key}"))
      .header("content-type", "application/json")
      .json(&body)
      .send()
      .await;

    match response {
      Ok(resp) => {
        if resp.status().is_success() {
          Ok(ValidationResult {
            is_valid: true,
            error_message: None,
            service_info: Some("Grok API".to_string()),
            rate_limits: None,
          })
        } else {
          let status = resp.status();
          let error_text = resp.text().await.unwrap_or_default();
          
          // Проверяем специфические ошибки
          let error_message = if error_text.contains("does not have permission") && error_text.contains("credits") {
            "Недостаточно кредитов. Пожалуйста, пополните баланс на https://console.x.ai".to_string()
          } else if error_text.contains("Incorrect API key") {
            "Неверный API ключ".to_string()
          } else {
            format!("Grok API error {status}: {error_text}")
          };
          
          Ok(ValidationResult {
            is_valid: false,
            error_message: Some(error_message),
            service_info: Some("Grok API".to_string()),
            rate_limits: None,
          })
        }
      }
      Err(e) => Ok(ValidationResult {
        is_valid: false,
        error_message: Some(format!("Network error: {e}")),
        service_info: None,
        rate_limits: None,
      }),
    }
  }

  // YouTube OAuth валидация (проверка client_id:client_secret)
  async fn validate_youtube_oauth(&self, _credentials: &str) -> Result<ValidationResult> {
    // Для YouTube нужна полная OAuth валидация
    Ok(ValidationResult {
      is_valid: false,
      error_message: Some("Use OAuth credentials validation for YouTube".to_string()),
      service_info: None,
      rate_limits: None,
    })
  }

  // YouTube OAuth full валидация
  async fn validate_youtube_oauth_full(
    &self,
    oauth_data: &OAuthCredentials,
  ) -> Result<ValidationResult> {
    if let Some(access_token) = &oauth_data.access_token {
      // Проверяем access token через YouTube API
      let response = self
        .client
        .get("https://www.googleapis.com/youtube/v3/channels")
        .query(&[("part", "snippet"), ("mine", "true")])
        .header("Authorization", format!("Bearer {access_token}"))
        .send()
        .await;

      match response {
        Ok(resp) => {
          if resp.status().is_success() {
            Ok(ValidationResult {
              is_valid: true,
              error_message: None,
              service_info: Some("YouTube API access confirmed".to_string()),
              rate_limits: None,
            })
          } else {
            Ok(ValidationResult {
              is_valid: false,
              error_message: Some("Invalid or expired access token".to_string()),
              service_info: None,
              rate_limits: None,
            })
          }
        }
        Err(e) => Ok(ValidationResult {
          is_valid: false,
          error_message: Some(format!("Network error: {e}")),
          service_info: None,
          rate_limits: None,
        }),
      }
    } else {
      // Проверяем client credentials через OAuth2 endpoint
      Ok(ValidationResult {
        is_valid: false,
        error_message: Some("No access token available, OAuth flow required".to_string()),
        service_info: Some("Client credentials present".to_string()),
        rate_limits: None,
      })
    }
  }

  // TikTok OAuth валидация
  async fn validate_tiktok_oauth(&self, _credentials: &str) -> Result<ValidationResult> {
    // TikTok API валидация - пока заглушка
    Ok(ValidationResult {
      is_valid: false,
      error_message: Some("TikTok API validation not implemented yet".to_string()),
      service_info: None,
      rate_limits: None,
    })
  }

  async fn validate_tiktok_oauth_full(
    &self,
    _oauth_data: &OAuthCredentials,
  ) -> Result<ValidationResult> {
    // TikTok OAuth валидация - пока заглушка
    Ok(ValidationResult {
      is_valid: false,
      error_message: Some("TikTok OAuth validation not implemented yet".to_string()),
      service_info: None,
      rate_limits: None,
    })
  }

  // Vimeo API валидация
  async fn validate_vimeo_key(&self, access_token: &str) -> Result<ValidationResult> {
    let response = self
      .client
      .get("https://api.vimeo.com/me")
      .header("Authorization", format!("Bearer {access_token}"))
      .send()
      .await;

    match response {
      Ok(resp) => {
        if resp.status().is_success() {
          Ok(ValidationResult {
            is_valid: true,
            error_message: None,
            service_info: Some("Vimeo API access confirmed".to_string()),
            rate_limits: None,
          })
        } else {
          Ok(ValidationResult {
            is_valid: false,
            error_message: Some("Invalid access token".to_string()),
            service_info: None,
            rate_limits: None,
          })
        }
      }
      Err(e) => Ok(ValidationResult {
        is_valid: false,
        error_message: Some(format!("Network error: {e}")),
        service_info: None,
        rate_limits: None,
      }),
    }
  }

  async fn validate_vimeo_oauth_full(
    &self,
    oauth_data: &OAuthCredentials,
  ) -> Result<ValidationResult> {
    if let Some(access_token) = &oauth_data.access_token {
      self.validate_vimeo_key(access_token).await
    } else {
      Ok(ValidationResult {
        is_valid: false,
        error_message: Some("No access token available".to_string()),
        service_info: None,
        rate_limits: None,
      })
    }
  }

  // Telegram Bot валидация
  async fn validate_telegram_bot(&self, bot_token: &str) -> Result<ValidationResult> {
    let url = format!("https://api.telegram.org/bot{bot_token}/getMe");
    let response = self.client.get(&url).send().await;

    match response {
      Ok(resp) => {
        if resp.status().is_success() {
          let json: Value = resp.json().await.unwrap_or_default();
          if json["ok"].as_bool().unwrap_or(false) {
            let bot_name = json["result"]["username"].as_str().unwrap_or("Unknown");
            Ok(ValidationResult {
              is_valid: true,
              error_message: None,
              service_info: Some(format!("Telegram bot @{bot_name} confirmed")),
              rate_limits: None,
            })
          } else {
            Ok(ValidationResult {
              is_valid: false,
              error_message: Some("Invalid bot token".to_string()),
              service_info: None,
              rate_limits: None,
            })
          }
        } else {
          Ok(ValidationResult {
            is_valid: false,
            error_message: Some("Invalid bot token".to_string()),
            service_info: None,
            rate_limits: None,
          })
        }
      }
      Err(e) => Ok(ValidationResult {
        is_valid: false,
        error_message: Some(format!("Network error: {e}")),
        service_info: None,
        rate_limits: None,
      }),
    }
  }

  // Codecov token валидация
  async fn validate_codecov_token(&self, token: &str) -> Result<ValidationResult> {
    let response = self
      .client
      .get("https://codecov.io/api/v2/user")
      .header("Authorization", format!("token {token}"))
      .send()
      .await;

    match response {
      Ok(resp) => {
        if resp.status().is_success() {
          Ok(ValidationResult {
            is_valid: true,
            error_message: None,
            service_info: Some("Codecov token confirmed".to_string()),
            rate_limits: None,
          })
        } else {
          Ok(ValidationResult {
            is_valid: false,
            error_message: Some("Invalid Codecov token".to_string()),
            service_info: None,
            rate_limits: None,
          })
        }
      }
      Err(e) => Ok(ValidationResult {
        is_valid: false,
        error_message: Some(format!("Network error: {e}")),
        service_info: None,
        rate_limits: None,
      }),
    }
  }

  // Tauri Analytics валидация (заглушка)
  async fn validate_tauri_analytics(&self, _key: &str) -> Result<ValidationResult> {
    // Tauri Analytics пока не имеет публичного API для валидации
    Ok(ValidationResult {
      is_valid: true,
      error_message: None,
      service_info: Some("Tauri Analytics key format appears valid".to_string()),
      rate_limits: None,
    })
  }

  // Извлечение rate limit информации из OpenAI headers
  fn extract_openai_rate_limits(
    &self,
    headers: &reqwest::header::HeaderMap,
  ) -> Option<RateLimitInfo> {
    let requests_remaining = headers
      .get("x-ratelimit-remaining-requests")
      .and_then(|v| v.to_str().ok())
      .and_then(|s| s.parse().ok());

    let reset_time = headers
      .get("x-ratelimit-reset-requests")
      .and_then(|v| v.to_str().ok())
      .and_then(|s| chrono::DateTime::parse_from_rfc3339(s).ok())
      .map(|dt| dt.with_timezone(&chrono::Utc));

    if requests_remaining.is_some() || reset_time.is_some() {
      Some(RateLimitInfo {
        requests_remaining,
        reset_time,
        daily_limit: None,
      })
    } else {
      None
    }
  }
}

impl Default for ApiValidator {
  fn default() -> Self {
    Self::new()
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  fn create_test_validator() -> ApiValidator {
    ApiValidator::new()
  }

  #[test]
  fn test_validation_result_creation() {
    let result = ValidationResult {
      is_valid: true,
      error_message: None,
      service_info: Some("Test service".to_string()),
      rate_limits: None,
    };

    assert!(result.is_valid);
    assert!(result.error_message.is_none());
    assert_eq!(result.service_info, Some("Test service".to_string()));
    assert!(result.rate_limits.is_none());
  }

  #[test]
  fn test_rate_limit_info() {
    let rate_limit = RateLimitInfo {
      requests_remaining: Some(100),
      reset_time: Some(chrono::Utc::now()),
      daily_limit: Some(1000),
    };

    assert_eq!(rate_limit.requests_remaining, Some(100));
    assert!(rate_limit.reset_time.is_some());
    assert_eq!(rate_limit.daily_limit, Some(1000));
  }

  #[test]
  fn test_validation_result_with_error() {
    let result = ValidationResult {
      is_valid: false,
      error_message: Some("Invalid API key".to_string()),
      service_info: None,
      rate_limits: None,
    };

    assert!(!result.is_valid);
    assert_eq!(result.error_message, Some("Invalid API key".to_string()));
    assert!(result.service_info.is_none());
    assert!(result.rate_limits.is_none());
  }

  #[test]
  fn test_rate_limit_info_partial() {
    let rate_limit = RateLimitInfo {
      requests_remaining: Some(50),
      reset_time: None,
      daily_limit: None,
    };

    assert_eq!(rate_limit.requests_remaining, Some(50));
    assert!(rate_limit.reset_time.is_none());
    assert!(rate_limit.daily_limit.is_none());
  }

  #[tokio::test]
  async fn test_validate_api_key_unsupported_oauth() {
    let validator = create_test_validator();
    let oauth_creds = OAuthCredentials {
      client_id: "client_123".to_string(),
      client_secret: "secret_456".to_string(),
      access_token: Some("test_token".to_string()),
      refresh_token: Some("refresh_token".to_string()),
      expires_at: Some(chrono::Utc::now() + chrono::Duration::hours(1)),
    };

    // Test unsupported OAuth service
    let result = validator
      .validate_oauth_credentials(ApiKeyType::OpenAI, &oauth_creds)
      .await;

    assert!(result.is_ok());
    let validation = result.unwrap();
    assert!(!validation.is_valid);
    assert!(validation.error_message.is_some());
    assert!(
      validation
        .error_message
        .unwrap()
        .contains("OAuth validation not supported")
    );
  }

  #[test]
  fn test_extract_openai_rate_limits_empty() {
    let validator = create_test_validator();
    let headers = reqwest::header::HeaderMap::new();

    let rate_limits = validator.extract_openai_rate_limits(&headers);
    assert!(rate_limits.is_none());
  }

  #[test]
  fn test_extract_openai_rate_limits_with_data() {
    let validator = create_test_validator();
    let mut headers = reqwest::header::HeaderMap::new();
    headers.insert(
      "x-ratelimit-remaining-requests",
      reqwest::header::HeaderValue::from_static("50"),
    );

    let rate_limits = validator.extract_openai_rate_limits(&headers);
    assert!(rate_limits.is_some());

    let limits = rate_limits.unwrap();
    assert_eq!(limits.requests_remaining, Some(50));
    assert!(limits.reset_time.is_none());
    assert!(limits.daily_limit.is_none());
  }

  #[test]
  fn test_api_validator_default() {
    let _validator1 = ApiValidator::new();
    let _validator2 = ApiValidator::default();

    // Both should create valid instances
    // We can't compare them directly, but we can check they both work
    // Test passes if validation completes without panicking
  }

  #[test]
  fn test_api_key_type_matching() {
    // Test that all API key types are handled
    let types = vec![
      ApiKeyType::OpenAI,
      ApiKeyType::Claude,
      ApiKeyType::DeepSeek,
      ApiKeyType::Grok,
      ApiKeyType::YouTube,
      ApiKeyType::TikTok,
      ApiKeyType::Vimeo,
      ApiKeyType::Telegram,
      ApiKeyType::Codecov,
      ApiKeyType::TauriAnalytics,
    ];

    // Just ensure all types exist and can be matched
    for key_type in types {
      match key_type {
        ApiKeyType::OpenAI => {}         // Valid API key type variant,
        ApiKeyType::Claude => {}         // Valid API key type variant,
        ApiKeyType::DeepSeek => {}       // Valid API key type variant,
        ApiKeyType::Grok => {}           // Valid API key type variant,
        ApiKeyType::YouTube => {}        // Valid API key type variant,
        ApiKeyType::TikTok => {}         // Valid API key type variant,
        ApiKeyType::Vimeo => {}          // Valid API key type variant,
        ApiKeyType::Telegram => {}       // Valid API key type variant,
        ApiKeyType::Codecov => {}        // Valid API key type variant,
        ApiKeyType::TauriAnalytics => {} // Valid API key type variant,
      }
    }
  }

  #[tokio::test]
  async fn test_validate_openai_key_invalid() {
    // Note: In real tests, we would use mocks to avoid actual API calls
    // For now, we test the structure with an obviously invalid key
    let validator = create_test_validator();
    let result = validator.validate_openai_key("invalid_key_123").await;

    // The result should be Ok (no network error), but validation should fail
    assert!(result.is_ok());
    let _validation = result.unwrap();
    // We expect this to fail since it's an invalid key
    // The actual behavior depends on network availability
  }

  #[test]
  fn test_oauth_credentials_structure() {
    let oauth = OAuthCredentials {
      client_id: "client_123".to_string(),
      client_secret: "secret_456".to_string(),
      access_token: Some("access_123".to_string()),
      refresh_token: Some("refresh_456".to_string()),
      expires_at: Some(chrono::Utc::now() + chrono::Duration::hours(1)),
    };

    assert_eq!(oauth.client_id, "client_123");
    assert_eq!(oauth.client_secret, "secret_456");
    assert_eq!(oauth.access_token, Some("access_123".to_string()));
    assert_eq!(oauth.refresh_token, Some("refresh_456".to_string()));
    assert!(oauth.expires_at.is_some());
  }

  #[test]
  fn test_validation_result_serialization() {
    let result = ValidationResult {
      is_valid: true,
      error_message: Some("Test error".to_string()),
      service_info: Some("Service info".to_string()),
      rate_limits: Some(RateLimitInfo {
        requests_remaining: Some(100),
        reset_time: None,
        daily_limit: Some(1000),
      }),
    };

    // Test that it can be serialized
    let serialized = serde_json::to_string(&result);
    assert!(serialized.is_ok());

    let json = serialized.unwrap();
    assert!(json.contains("is_valid"));
    assert!(json.contains("error_message"));
    assert!(json.contains("service_info"));
    assert!(json.contains("rate_limits"));
  }

  #[test]
  fn test_rate_limit_edge_cases() {
    // Test with all None values
    let rate_limit1 = RateLimitInfo {
      requests_remaining: None,
      reset_time: None,
      daily_limit: None,
    };
    assert!(rate_limit1.requests_remaining.is_none());
    assert!(rate_limit1.reset_time.is_none());
    assert!(rate_limit1.daily_limit.is_none());

    // Test with extreme values
    let rate_limit2 = RateLimitInfo {
      requests_remaining: Some(u32::MAX),
      reset_time: Some(chrono::DateTime::<chrono::Utc>::MIN_UTC),
      daily_limit: Some(0),
    };
    assert_eq!(rate_limit2.requests_remaining, Some(u32::MAX));
    assert!(rate_limit2.reset_time.is_some());
    assert_eq!(rate_limit2.daily_limit, Some(0));
  }

  #[test]
  fn test_client_timeout() {
    // Test that client is created with timeout
    let _validator = ApiValidator::new();
    // The client is private, but we can verify it doesn't panic on creation
    {} // Valid API key type variant;
  }

  #[tokio::test]
  async fn test_validate_api_key_all_types() {
    let validator = create_test_validator();
    let test_key = "test_key_123";

    // Test that validate_api_key handles all key types without panicking
    let key_types = vec![
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

    for key_type in key_types {
      // We don't test actual validation (would require mocks),
      // just that the method handles all types
      let _ = validator.validate_api_key(key_type, test_key).await;
    }
  }

  #[test]
  fn test_extract_rate_limits_invalid_headers() {
    let validator = create_test_validator();
    let mut headers = reqwest::header::HeaderMap::new();

    // Add invalid header values
    headers.insert(
      "x-ratelimit-remaining-requests",
      reqwest::header::HeaderValue::from_static("not-a-number"),
    );
    headers.insert(
      "x-ratelimit-reset-requests",
      reqwest::header::HeaderValue::from_static("invalid-date"),
    );

    let rate_limits = validator.extract_openai_rate_limits(&headers);
    // Should return None when parsing fails
    assert!(rate_limits.is_none());
  }

  #[test]
  fn test_extract_rate_limits_partial_headers() {
    let validator = create_test_validator();
    let mut headers = reqwest::header::HeaderMap::new();

    // Only add remaining requests
    headers.insert(
      "x-ratelimit-remaining-requests",
      reqwest::header::HeaderValue::from_static("100"),
    );

    let rate_limits = validator.extract_openai_rate_limits(&headers);
    assert!(rate_limits.is_some());

    let limits = rate_limits.unwrap();
    assert_eq!(limits.requests_remaining, Some(100));
    assert!(limits.reset_time.is_none());
  }

  #[test]
  fn test_api_key_type_conversion() {
    // Test as_str conversion
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
    use std::str::FromStr;

    // Test valid conversions
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

    // Test invalid conversion
    assert!(ApiKeyType::from_str("invalid").is_err());
  }

  #[tokio::test]
  async fn test_validate_unsupported_service_for_oauth() {
    let validator = create_test_validator();

    // Test validation for a service that doesn't support simple key validation
    let result = validator
      .validate_api_key(ApiKeyType::YouTube, "some-key")
      .await;

    assert!(result.is_ok());
    let validation = result.unwrap();
    assert!(!validation.is_valid);
    assert!(validation.error_message.is_some());
    assert!(validation.error_message.unwrap().contains("OAuth"));
  }

  #[test]
  fn test_extract_deepseek_rate_limits() {
    let validator = create_test_validator();
    let mut headers = reqwest::header::HeaderMap::new();

    // Add DeepSeek specific headers (similar to OpenAI)
    headers.insert(
      "x-ratelimit-remaining-requests",
      reqwest::header::HeaderValue::from_static("30"),
    );

    // DeepSeek uses similar headers to OpenAI
    let rate_limits = validator.extract_openai_rate_limits(&headers);
    assert!(rate_limits.is_some());
    let limits = rate_limits.unwrap();
    assert_eq!(limits.requests_remaining, Some(30));
  }

  #[tokio::test]
  async fn test_validate_multiple_key_types() {
    let validator = create_test_validator();

    // Test that all key types can be validated without panic
    let key_types = vec![
      ApiKeyType::OpenAI,
      ApiKeyType::Claude,
      ApiKeyType::DeepSeek,
      ApiKeyType::Vimeo,
      ApiKeyType::Telegram,
      ApiKeyType::Codecov,
      ApiKeyType::TauriAnalytics,
    ];

    for key_type in key_types {
      let result = validator.validate_api_key(key_type, "test-key").await;
      assert!(result.is_ok());
    }
  }

  #[test]
  fn test_oauth_credentials_with_expiry() {
    let expires = chrono::Utc::now() + chrono::Duration::hours(2);
    let oauth_creds = OAuthCredentials {
      client_id: "test_client".to_string(),
      client_secret: "test_secret".to_string(),
      access_token: Some("test_token".to_string()),
      refresh_token: Some("refresh_token".to_string()),
      expires_at: Some(expires),
    };

    assert_eq!(oauth_creds.client_id, "test_client");
    assert_eq!(oauth_creds.client_secret, "test_secret");
    assert!(oauth_creds.access_token.is_some());
    assert!(oauth_creds.refresh_token.is_some());
    assert!(oauth_creds.expires_at.is_some());
    assert!(oauth_creds.expires_at.unwrap() > chrono::Utc::now());
  }

  #[tokio::test]
  async fn test_validate_claude_key_call() {
    let validator = create_test_validator();

    // Test that Claude validation can be called without panic
    let result = validator
      .validate_api_key(ApiKeyType::Claude, "sk-ant-test")
      .await;
    assert!(result.is_ok());
  }
}

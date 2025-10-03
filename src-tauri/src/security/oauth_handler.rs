use super::{ApiKeyType, OAuthCredentials};
use anyhow::{Context, Result};
use reqwest::Client;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use url::Url;

/// Конфигурация OAuth для каждого сервиса
#[derive(Debug, Clone)]
pub struct OAuthConfig {
  pub auth_url: String,
  pub token_url: String,
  pub scopes: Vec<String>,
  pub redirect_uri: String,
}

/// Результат OAuth авторизации
#[derive(Debug, Serialize, Deserialize)]
pub struct OAuthResult {
  pub access_token: String,
  pub refresh_token: Option<String>,
  pub expires_in: Option<u64>,
  pub token_type: String,
  pub scope: Option<String>,
}

/// OAuth handler для различных сервисов
pub struct OAuthHandler {
  client: Client,
  redirect_uri: String,
}

impl OAuthHandler {
  pub fn new() -> Self {
    Self {
      client: Client::new(),
      redirect_uri: "http://localhost:3000/oauth/callback".to_string(),
    }
  }

  #[allow(dead_code)]
  pub fn with_redirect_uri(redirect_uri: String) -> Self {
    Self {
      client: Client::new(),
      redirect_uri,
    }
  }

  /// Получает конфигурацию OAuth для указанного сервиса
  pub fn get_oauth_config(&self, service: &ApiKeyType) -> Option<OAuthConfig> {
    match service {
      ApiKeyType::YouTube => Some(OAuthConfig {
        auth_url: "https://accounts.google.com/o/oauth2/v2/auth".to_string(),
        token_url: "https://oauth2.googleapis.com/token".to_string(),
        scopes: vec![
          "https://www.googleapis.com/auth/youtube.upload".to_string(),
          "https://www.googleapis.com/auth/youtube".to_string(),
        ],
        redirect_uri: self.redirect_uri.clone(),
      }),

      ApiKeyType::TikTok => Some(OAuthConfig {
        auth_url: "https://www.tiktok.com/auth/authorize/".to_string(),
        token_url: "https://open-api.tiktok.com/oauth/access_token/".to_string(),
        scopes: vec!["user.info.basic".to_string(), "video.upload".to_string()],
        redirect_uri: self.redirect_uri.clone(),
      }),

      ApiKeyType::Vimeo => Some(OAuthConfig {
        auth_url: "https://api.vimeo.com/oauth/authorize".to_string(),
        token_url: "https://api.vimeo.com/oauth/access_token".to_string(),
        scopes: vec![
          "public".to_string(),
          "private".to_string(),
          "upload".to_string(),
        ],
        redirect_uri: self.redirect_uri.clone(),
      }),

      _ => None,
    }
  }

  /// Генерирует URL для OAuth авторизации
  pub fn generate_auth_url(
    &self,
    service: ApiKeyType,
    client_id: &str,
    state: Option<&str>,
  ) -> Result<String> {
    let config = self
      .get_oauth_config(&service)
      .context("OAuth not supported for this service")?;

    let mut url = Url::parse(&config.auth_url).context("Invalid auth URL")?;

    let scopes_joined = config.scopes.join(" ");
    let mut query_params = vec![
      ("client_id", client_id),
      ("redirect_uri", &config.redirect_uri),
      ("response_type", "code"),
      ("scope", &scopes_joined),
    ];

    if let Some(state_value) = state {
      query_params.push(("state", state_value));
    }

    // Добавляем специфичные для сервиса параметры
    match &service {
      ApiKeyType::YouTube => {
        query_params.push(("access_type", "offline"));
        query_params.push(("prompt", "consent"));
      }
      ApiKeyType::TikTok => {
        query_params.push(("response_type", "code"));
      }
      _ => {}
    }

    url.query_pairs_mut().extend_pairs(query_params);

    Ok(url.to_string())
  }

  /// Обменивает authorization code на access token
  pub async fn exchange_code_for_token(
    &self,
    service: ApiKeyType,
    client_id: &str,
    client_secret: &str,
    code: &str,
  ) -> Result<OAuthResult> {
    let config = self
      .get_oauth_config(&service)
      .context("OAuth not supported for this service")?;

    let mut params = HashMap::new();
    params.insert("grant_type", "authorization_code");
    params.insert("code", code);
    params.insert("redirect_uri", &config.redirect_uri);
    params.insert("client_id", client_id);
    params.insert("client_secret", client_secret);

    let response = self
      .client
      .post(&config.token_url)
      .form(&params)
      .send()
      .await
      .context("Failed to exchange code for token")?;

    if !response.status().is_success() {
      let error_text = response.text().await.unwrap_or_default();
      return Err(anyhow::anyhow!("Token exchange failed: {}", error_text));
    }

    let token_response: OAuthResult = response
      .json()
      .await
      .context("Failed to parse token response")?;

    Ok(token_response)
  }

  /// Обновляет access token используя refresh token
  pub async fn refresh_access_token(
    &self,
    service: ApiKeyType,
    client_id: &str,
    client_secret: &str,
    refresh_token: &str,
  ) -> Result<OAuthResult> {
    let config = self
      .get_oauth_config(&service)
      .context("OAuth not supported for this service")?;

    let mut params = HashMap::new();
    params.insert("grant_type", "refresh_token");
    params.insert("refresh_token", refresh_token);
    params.insert("client_id", client_id);
    params.insert("client_secret", client_secret);

    let response = self
      .client
      .post(&config.token_url)
      .form(&params)
      .send()
      .await
      .context("Failed to refresh token")?;

    if !response.status().is_success() {
      let error_text = response.text().await.unwrap_or_default();
      return Err(anyhow::anyhow!("Token refresh failed: {}", error_text));
    }

    let token_response: OAuthResult = response
      .json()
      .await
      .context("Failed to parse refresh response")?;

    Ok(token_response)
  }

  /// Создает OAuthCredentials из результата обмена
  pub fn create_oauth_credentials(
    &self,
    client_id: String,
    client_secret: String,
    oauth_result: OAuthResult,
  ) -> OAuthCredentials {
    let expires_at = oauth_result
      .expires_in
      .map(|expires_in| chrono::Utc::now() + chrono::Duration::seconds(expires_in as i64));

    OAuthCredentials {
      client_id,
      client_secret,
      access_token: Some(oauth_result.access_token),
      refresh_token: oauth_result.refresh_token,
      expires_at,
    }
  }

  /// Проверяет, нужно ли обновить access token
  pub fn needs_refresh(&self, oauth_data: &OAuthCredentials) -> bool {
    if let Some(expires_at) = oauth_data.expires_at {
      // Обновляем за 5 минут до истечения
      let refresh_threshold = chrono::Utc::now() + chrono::Duration::minutes(5);
      expires_at <= refresh_threshold
    } else {
      false
    }
  }

  /// Автоматически обновляет токен если нужно
  pub async fn auto_refresh_if_needed(
    &self,
    service: ApiKeyType,
    oauth_data: &mut OAuthCredentials,
  ) -> Result<bool> {
    if !self.needs_refresh(oauth_data) {
      return Ok(false);
    }

    if let Some(refresh_token) = &oauth_data.refresh_token {
      match self
        .refresh_access_token(
          service.clone(),
          &oauth_data.client_id,
          &oauth_data.client_secret,
          refresh_token,
        )
        .await
      {
        Ok(new_token) => {
          oauth_data.access_token = Some(new_token.access_token);
          if let Some(new_refresh) = new_token.refresh_token {
            oauth_data.refresh_token = Some(new_refresh);
          }
          oauth_data.expires_at = new_token
            .expires_in
            .map(|expires_in| chrono::Utc::now() + chrono::Duration::seconds(expires_in as i64));
          Ok(true)
        }
        Err(e) => {
          log::warn!("Failed to auto-refresh token for {service:?}: {e}");
          Err(e)
        }
      }
    } else {
      Ok(false)
    }
  }

  /// Получает информацию о пользователе через OAuth API
  pub async fn get_user_info(
    &self,
    service: ApiKeyType,
    access_token: &str,
  ) -> Result<serde_json::Value> {
    let endpoint = match service {
      ApiKeyType::YouTube => "https://www.googleapis.com/oauth2/v2/userinfo",
      ApiKeyType::Vimeo => "https://api.vimeo.com/me",
      ApiKeyType::TikTok => "https://open-api.tiktok.com/oauth/userinfo/",
      _ => return Err(anyhow::anyhow!("User info not supported for this service")),
    };

    let response = self
      .client
      .get(endpoint)
      .header("Authorization", format!("Bearer {access_token}"))
      .send()
      .await
      .context("Failed to get user info")?;

    if !response.status().is_success() {
      return Err(anyhow::anyhow!(
        "Failed to get user info: {}",
        response.status()
      ));
    }

    let user_info: serde_json::Value =
      response.json().await.context("Failed to parse user info")?;

    Ok(user_info)
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  fn create_test_handler() -> OAuthHandler {
    OAuthHandler::new()
  }

  #[test]
  fn test_oauth_handler_new() {
    let handler = OAuthHandler::new();
    assert_eq!(handler.redirect_uri, "http://localhost:3000/oauth/callback");
  }

  #[test]
  fn test_oauth_handler_with_redirect_uri() {
    let custom_uri = "https://myapp.com/oauth/callback".to_string();
    let handler = OAuthHandler::with_redirect_uri(custom_uri.clone());
    assert_eq!(handler.redirect_uri, custom_uri);
  }

  #[test]
  fn test_oauth_handler_default() {
    let handler1 = OAuthHandler::new();
    let handler2 = OAuthHandler::default();
    assert_eq!(handler1.redirect_uri, handler2.redirect_uri);
  }

  #[test]
  fn test_get_oauth_config_youtube() {
    let handler = create_test_handler();
    let config = handler.get_oauth_config(&ApiKeyType::YouTube);

    assert!(config.is_some());
    let cfg = config.unwrap();
    assert_eq!(cfg.auth_url, "https://accounts.google.com/o/oauth2/v2/auth");
    assert_eq!(cfg.token_url, "https://oauth2.googleapis.com/token");
    assert_eq!(cfg.scopes.len(), 2);
    assert!(cfg
      .scopes
      .contains(&"https://www.googleapis.com/auth/youtube.upload".to_string()));
    assert!(cfg
      .scopes
      .contains(&"https://www.googleapis.com/auth/youtube".to_string()));
    assert_eq!(cfg.redirect_uri, "http://localhost:3000/oauth/callback");
  }

  #[test]
  fn test_get_oauth_config_tiktok() {
    let handler = create_test_handler();
    let config = handler.get_oauth_config(&ApiKeyType::TikTok);

    assert!(config.is_some());
    let cfg = config.unwrap();
    assert_eq!(cfg.auth_url, "https://www.tiktok.com/auth/authorize/");
    assert_eq!(
      cfg.token_url,
      "https://open-api.tiktok.com/oauth/access_token/"
    );
    assert_eq!(cfg.scopes.len(), 2);
    assert!(cfg.scopes.contains(&"user.info.basic".to_string()));
    assert!(cfg.scopes.contains(&"video.upload".to_string()));
  }

  #[test]
  fn test_get_oauth_config_vimeo() {
    let handler = create_test_handler();
    let config = handler.get_oauth_config(&ApiKeyType::Vimeo);

    assert!(config.is_some());
    let cfg = config.unwrap();
    assert_eq!(cfg.auth_url, "https://api.vimeo.com/oauth/authorize");
    assert_eq!(cfg.token_url, "https://api.vimeo.com/oauth/access_token");
    assert_eq!(cfg.scopes.len(), 3);
    assert!(cfg.scopes.contains(&"public".to_string()));
    assert!(cfg.scopes.contains(&"private".to_string()));
    assert!(cfg.scopes.contains(&"upload".to_string()));
  }

  #[test]
  fn test_get_oauth_config_unsupported() {
    let handler = create_test_handler();
    let config = handler.get_oauth_config(&ApiKeyType::OpenAI);
    assert!(config.is_none());

    let config = handler.get_oauth_config(&ApiKeyType::Claude);
    assert!(config.is_none());

    let config = handler.get_oauth_config(&ApiKeyType::Telegram);
    assert!(config.is_none());
  }

  #[test]
  fn test_generate_auth_url_basic() {
    let handler = create_test_handler();
    let url = handler.generate_auth_url(ApiKeyType::YouTube, "test_client_id", None);

    assert!(url.is_ok());
    let auth_url = url.unwrap();
    assert!(auth_url.contains("https://accounts.google.com/o/oauth2/v2/auth"));
    assert!(auth_url.contains("client_id=test_client_id"));
    assert!(auth_url.contains("response_type=code"));
    assert!(auth_url.contains("redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Foauth%2Fcallback"));
    assert!(auth_url.contains("scope="));
  }

  #[test]
  fn test_generate_auth_url_with_state() {
    let handler = create_test_handler();
    let url = handler.generate_auth_url(
      ApiKeyType::YouTube,
      "test_client_id",
      Some("test_state_123"),
    );

    assert!(url.is_ok());
    let auth_url = url.unwrap();
    assert!(auth_url.contains("state=test_state_123"));
  }

  #[test]
  fn test_generate_auth_url_youtube_specific() {
    let handler = create_test_handler();
    let url = handler.generate_auth_url(ApiKeyType::YouTube, "test_client_id", None);

    assert!(url.is_ok());
    let auth_url = url.unwrap();
    assert!(auth_url.contains("access_type=offline"));
    assert!(auth_url.contains("prompt=consent"));
  }

  #[test]
  fn test_generate_auth_url_tiktok_specific() {
    let handler = create_test_handler();
    let url = handler.generate_auth_url(ApiKeyType::TikTok, "test_client_id", None);

    assert!(url.is_ok());
    let auth_url = url.unwrap();
    // TikTok has response_type added twice (once in default, once in specific)
    assert!(auth_url.contains("response_type=code"));
  }

  #[test]
  fn test_generate_auth_url_unsupported_service() {
    let handler = create_test_handler();
    let url = handler.generate_auth_url(ApiKeyType::OpenAI, "test_client_id", None);

    assert!(url.is_err());
    assert!(url.unwrap_err().to_string().contains("OAuth not supported"));
  }

  #[test]
  fn test_create_oauth_credentials() {
    let handler = create_test_handler();
    let oauth_result = OAuthResult {
      access_token: "access_123".to_string(),
      refresh_token: Some("refresh_456".to_string()),
      expires_in: Some(3600),
      token_type: "Bearer".to_string(),
      scope: Some("read write".to_string()),
    };

    let creds = handler.create_oauth_credentials(
      "client_id_123".to_string(),
      "client_secret_456".to_string(),
      oauth_result,
    );

    assert_eq!(creds.client_id, "client_id_123");
    assert_eq!(creds.client_secret, "client_secret_456");
    assert_eq!(creds.access_token, Some("access_123".to_string()));
    assert_eq!(creds.refresh_token, Some("refresh_456".to_string()));
    assert!(creds.expires_at.is_some());

    // Check that expiration is approximately 1 hour from now
    let expires_at = creds.expires_at.unwrap();
    let now = chrono::Utc::now();
    let duration = expires_at - now;
    assert!(duration.num_seconds() > 3500 && duration.num_seconds() <= 3600);
  }

  #[test]
  fn test_create_oauth_credentials_no_expiry() {
    let handler = create_test_handler();
    let oauth_result = OAuthResult {
      access_token: "access_123".to_string(),
      refresh_token: None,
      expires_in: None,
      token_type: "Bearer".to_string(),
      scope: None,
    };

    let creds = handler.create_oauth_credentials(
      "client_id".to_string(),
      "client_secret".to_string(),
      oauth_result,
    );

    assert!(creds.expires_at.is_none());
    assert!(creds.refresh_token.is_none());
  }

  #[test]
  fn test_needs_refresh() {
    let handler = create_test_handler();

    // Test with no expiration
    let mut creds = OAuthCredentials {
      client_id: "test".to_string(),
      client_secret: "test".to_string(),
      access_token: Some("token".to_string()),
      refresh_token: None,
      expires_at: None,
    };
    assert!(!handler.needs_refresh(&creds));

    // Test with future expiration (more than 5 minutes)
    creds.expires_at = Some(chrono::Utc::now() + chrono::Duration::hours(1));
    assert!(!handler.needs_refresh(&creds));

    // Test with expiration within 5 minutes
    creds.expires_at = Some(chrono::Utc::now() + chrono::Duration::minutes(3));
    assert!(handler.needs_refresh(&creds));

    // Test with already expired
    creds.expires_at = Some(chrono::Utc::now() - chrono::Duration::minutes(1));
    assert!(handler.needs_refresh(&creds));
  }

  #[tokio::test]
  async fn test_auto_refresh_if_needed_no_refresh_needed() {
    let handler = create_test_handler();
    let mut creds = OAuthCredentials {
      client_id: "test".to_string(),
      client_secret: "test".to_string(),
      access_token: Some("token".to_string()),
      refresh_token: Some("refresh".to_string()),
      expires_at: Some(chrono::Utc::now() + chrono::Duration::hours(1)),
    };

    let result = handler
      .auto_refresh_if_needed(ApiKeyType::YouTube, &mut creds)
      .await;
    assert!(result.is_ok());
    assert!(!result.unwrap()); // No refresh was needed
  }

  #[tokio::test]
  async fn test_auto_refresh_if_needed_no_refresh_token() {
    let handler = create_test_handler();
    let mut creds = OAuthCredentials {
      client_id: "test".to_string(),
      client_secret: "test".to_string(),
      access_token: Some("token".to_string()),
      refresh_token: None,
      expires_at: Some(chrono::Utc::now() + chrono::Duration::minutes(1)),
    };

    let result = handler
      .auto_refresh_if_needed(ApiKeyType::YouTube, &mut creds)
      .await;
    assert!(result.is_ok());
    assert!(!result.unwrap()); // Can't refresh without refresh token
  }

  // Callback utils tests
  #[test]
  fn test_parse_callback_url_valid() {
    let url = "http://localhost:3000/oauth/callback?code=auth_code_123&state=state_456";
    let params = callback_utils::parse_callback_url(url);

    assert!(params.is_ok());
    let map = params.unwrap();
    assert_eq!(map.get("code"), Some(&"auth_code_123".to_string()));
    assert_eq!(map.get("state"), Some(&"state_456".to_string()));
  }

  #[test]
  fn test_parse_callback_url_with_error() {
    let url = "http://localhost:3000/oauth/callback?error=access_denied&error_description=User%20denied%20access";
    let params = callback_utils::parse_callback_url(url);

    assert!(params.is_ok());
    let map = params.unwrap();
    assert_eq!(map.get("error"), Some(&"access_denied".to_string()));
    assert_eq!(
      map.get("error_description"),
      Some(&"User denied access".to_string())
    );
  }

  #[test]
  fn test_parse_callback_url_invalid() {
    let url = "not a valid url";
    let params = callback_utils::parse_callback_url(url);
    assert!(params.is_err());
  }

  #[test]
  fn test_extract_auth_code() {
    let mut params = HashMap::new();
    params.insert("code".to_string(), "auth_123".to_string());
    params.insert("state".to_string(), "state_456".to_string());

    let code = callback_utils::extract_auth_code(&params);
    assert!(code.is_ok());
    assert_eq!(code.unwrap(), "auth_123");
  }

  #[test]
  fn test_extract_auth_code_missing() {
    let params = HashMap::new();
    let code = callback_utils::extract_auth_code(&params);
    assert!(code.is_err());
    assert!(code
      .unwrap_err()
      .to_string()
      .contains("No authorization code"));
  }

  #[test]
  fn test_extract_state() {
    let mut params = HashMap::new();
    params.insert("state".to_string(), "state_123".to_string());

    let state = callback_utils::extract_state(&params);
    assert_eq!(state, Some("state_123".to_string()));

    let empty_params = HashMap::new();
    let no_state = callback_utils::extract_state(&empty_params);
    assert!(no_state.is_none());
  }

  #[test]
  fn test_extract_error() {
    let mut params = HashMap::new();
    params.insert("error".to_string(), "access_denied".to_string());

    let error = callback_utils::extract_error(&params);
    assert_eq!(error, Some("access_denied".to_string()));

    let empty_params = HashMap::new();
    let no_error = callback_utils::extract_error(&empty_params);
    assert!(no_error.is_none());
  }

  #[test]
  fn test_oauth_result_structure() {
    let result = OAuthResult {
      access_token: "token".to_string(),
      refresh_token: Some("refresh".to_string()),
      expires_in: Some(7200),
      token_type: "Bearer".to_string(),
      scope: Some("read write upload".to_string()),
    };

    assert_eq!(result.access_token, "token");
    assert_eq!(result.refresh_token, Some("refresh".to_string()));
    assert_eq!(result.expires_in, Some(7200));
    assert_eq!(result.token_type, "Bearer");
    assert_eq!(result.scope, Some("read write upload".to_string()));
  }

  #[test]
  fn test_oauth_config_clone() {
    let config = OAuthConfig {
      auth_url: "https://auth.example.com".to_string(),
      token_url: "https://token.example.com".to_string(),
      scopes: vec!["scope1".to_string(), "scope2".to_string()],
      redirect_uri: "http://localhost:3000/callback".to_string(),
    };

    let cloned = config.clone();
    assert_eq!(cloned.auth_url, config.auth_url);
    assert_eq!(cloned.token_url, config.token_url);
    assert_eq!(cloned.scopes, config.scopes);
    assert_eq!(cloned.redirect_uri, config.redirect_uri);
  }
}

impl Default for OAuthHandler {
  fn default() -> Self {
    Self::new()
  }
}

/// Утилиты для работы с OAuth callback URL
pub mod callback_utils {
  use super::*;
  use std::collections::HashMap;

  /// Парсит параметры из OAuth callback URL
  pub fn parse_callback_url(url: &str) -> Result<HashMap<String, String>> {
    let parsed_url = Url::parse(url).context("Invalid callback URL")?;

    let mut params = HashMap::new();

    for (key, value) in parsed_url.query_pairs() {
      params.insert(key.to_string(), value.to_string());
    }

    Ok(params)
  }

  /// Извлекает authorization code из callback параметров
  pub fn extract_auth_code(params: &HashMap<String, String>) -> Result<String> {
    params
      .get("code")
      .cloned()
      .context("No authorization code in callback")
  }

  /// Извлекает state параметр из callback
  pub fn extract_state(params: &HashMap<String, String>) -> Option<String> {
    params.get("state").cloned()
  }

  /// Проверяет наличие ошибки в callback
  pub fn extract_error(params: &HashMap<String, String>) -> Option<String> {
    params.get("error").cloned()
  }
}

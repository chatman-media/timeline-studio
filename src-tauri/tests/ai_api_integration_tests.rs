// Integration tests for AI API with mock JSON responses
//
// These tests use mockito to mock HTTP responses from AI providers
// and JSON fixtures to simulate realistic API responses.

use mockito::{Mock, Server, ServerGuard};
use serde_json::Value;
use std::fs;
use std::path::PathBuf;
use timeline_studio_lib::video_compiler::commands::ai_api_proxy::provider_manager::AIProviderManager;
use timeline_studio_lib::video_compiler::commands::ai_api_proxy::types::*;

/// Load JSON mock response from fixtures
fn load_mock_response(filename: &str) -> Value {
  let mut path = PathBuf::from(env!("CARGO_MANIFEST_DIR"));
  path.push("tests/fixtures/ai_api");
  path.push(filename);

  let content = fs::read_to_string(&path)
    .unwrap_or_else(|e| panic!("Failed to read mock file {:?}: {}", path, e));

  serde_json::from_str(&content)
    .unwrap_or_else(|e| panic!("Failed to parse JSON from {:?}: {}", path, e))
}

/// Setup mock server with Claude response
fn setup_claude_mock(server: &mut ServerGuard) -> Mock {
  let mock_response = load_mock_response("claude_vision_response.json");

  server
    .mock("POST", "/v1/messages")
    .match_header("x-api-key", mockito::Matcher::Any)
    .match_header("anthropic-version", "2023-06-01")
    .match_header("content-type", "application/json")
    .with_status(200)
    .with_header("content-type", "application/json")
    .with_body(mock_response.to_string())
    .create()
}

/// Setup mock server with OpenAI response
fn setup_openai_mock(server: &mut ServerGuard) -> Mock {
  let mock_response = load_mock_response("openai_vision_response.json");

  server
    .mock("POST", "/v1/chat/completions")
    .match_header(
      "authorization",
      mockito::Matcher::Regex("Bearer .+".to_string()),
    )
    .match_header("content-type", "application/json")
    .with_status(200)
    .with_header("content-type", "application/json")
    .with_body(mock_response.to_string())
    .create()
}

/// Setup mock server with DeepSeek response
fn setup_deepseek_mock(server: &mut ServerGuard) -> Mock {
  let mock_response = load_mock_response("deepseek_vision_response.json");

  server
    .mock("POST", "/chat/completions")
    .match_header(
      "authorization",
      mockito::Matcher::Regex("Bearer .+".to_string()),
    )
    .match_header("content-type", "application/json")
    .with_status(200)
    .with_header("content-type", "application/json")
    .with_body(mock_response.to_string())
    .create()
}

/// Setup mock server with Ollama response
fn setup_ollama_mock(server: &mut ServerGuard) -> Mock {
  let mock_response = load_mock_response("ollama_vision_response.json");

  server
    .mock("POST", "/api/chat")
    .match_header("content-type", "application/json")
    .with_status(200)
    .with_header("content-type", "application/json")
    .with_body(mock_response.to_string())
    .create()
}

/// Create a sample vision analysis request
fn create_vision_request(provider: AIProvider, model: String) -> UnifiedAIRequest {
  UnifiedAIRequest {
    provider,
    model,
    messages: vec![AIMessage {
      role: "user".to_string(),
      content: AIMessageContent::Multimodal(vec![
        AIContentPart::Text {
          text: "Analyze this video frame in detail. Provide information about composition, quality, colors, and scene type.".to_string(),
        },
        AIContentPart::Image {
          source: AIImageSource::Base64 {
            media_type: "image/jpeg".to_string(),
            data: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==".to_string(), // 1x1 red pixel
          },
        },
      ]),
    }],
    temperature: Some(0.7),
    max_tokens: Some(1024),
    stream: Some(false),
    system: None,
    tools: None,
    tool_choice: None,
  }
}

#[tokio::test]
async fn test_claude_vision_integration() {
  let mut server = Server::new_async().await;
  let _mock = setup_claude_mock(&mut server);

  let manager = AIProviderManager::new();
  let request = create_vision_request(AIProvider::Claude, "claude-3-5-sonnet-20241022".to_string());

  let result = manager.send_request("test-api-key", request).await;

  assert!(result.is_ok(), "Request should succeed with mock response");
  let response = result.unwrap();
  assert!(
    !response.content.is_empty(),
    "Response should contain content"
  );
  assert!(
    response.content.contains("interview")
      || response.content.contains("composition")
      || response.content.contains("quality"),
    "Response should contain vision analysis keywords"
  );
}

#[tokio::test]
async fn test_openai_vision_integration() {
  let mut server = Server::new_async().await;
  let _mock = setup_openai_mock(&mut server);

  let manager = AIProviderManager::new();
  let request = create_vision_request(
    AIProvider::OpenAI,
    "gpt-4o".to_string(),
    format!("{}/v1/chat/completions", server.url()),
  );

  let result = manager.send_request("test-api-key", request).await;

  assert!(result.is_ok(), "Request should succeed with mock response");
  let response = result.unwrap();
  assert!(!response.content.is_empty(), "Response should contain text");
  assert!(
    response.content.contains("action")
      || response.content.contains("composition")
      || response.content.contains("dynamic"),
    "Response should contain vision analysis keywords"
  );
}

#[tokio::test]
async fn test_deepseek_vision_integration() {
  let mut server = Server::new_async().await;
  let _mock = setup_deepseek_mock(&mut server);

  let manager = AIProviderManager::new();
  let request = create_vision_request(
    AIProvider::DeepSeek,
    "deepseek-vl".to_string(),
    format!("{}/chat/completions", server.url()),
  );

  let result = manager.send_request("test-api-key", request).await;

  assert!(result.is_ok(), "Request should succeed with mock response");
  let response = result.unwrap();
  assert!(!response.content.is_empty(), "Response should contain text");
  assert!(
    response.content.contains("landscape")
      || response.content.contains("outdoor")
      || response.content.contains("nature"),
    "Response should contain vision analysis keywords"
  );
}

#[tokio::test]
async fn test_ollama_vision_integration() {
  let mut server = Server::new_async().await;
  let _mock = setup_ollama_mock(&mut server);

  let manager = AIProviderManager::new();
  let request = create_vision_request(
    AIProvider::Ollama,
    "moondream2".to_string(),
    format!("{}/api/chat", server.url()),
  );

  let result = manager.send_request("", request).await; // Ollama doesn't need API key

  assert!(result.is_ok(), "Request should succeed with mock response");
  let response = result.unwrap();
  assert!(!response.content.is_empty(), "Response should contain text");
  assert!(
    response.content.contains("indoor")
      || response.content.contains("desk")
      || response.content.contains("office"),
    "Response should contain vision analysis keywords"
  );
}

#[tokio::test]
async fn test_retry_on_rate_limit() {
  let mut server = Server::new_async().await;

  // First request: 429 Rate Limit
  let _mock_429 = server
    .mock("POST", "/v1/messages")
    .with_status(429)
    .with_header("content-type", "application/json")
    .with_body(r#"{"error": {"type": "rate_limit_error", "message": "Rate limit exceeded"}}"#)
    .expect(1)
    .create();

  // Second request: Success
  let mock_response = load_mock_response("claude_vision_response.json");
  let _mock_success = server
    .mock("POST", "/v1/messages")
    .with_status(200)
    .with_header("content-type", "application/json")
    .with_body(mock_response.to_string())
    .expect_at_least(1)
    .create();

  let manager = AIProviderManager::new();
  let request = create_vision_request(
    AIProvider::Claude,
    "claude-3-5-sonnet-20241022".to_string(),
    format!("{}/v1/messages", server.url()),
  );

  let result = manager.send_request("test-api-key", request).await;

  assert!(
    result.is_ok(),
    "Request should succeed after retry on rate limit"
  );
}

#[tokio::test]
async fn test_retry_on_server_error() {
  let mut server = Server::new_async().await;

  // First request: 503 Service Unavailable
  let _mock_503 = server
    .mock("POST", "/v1/chat/completions")
    .with_status(503)
    .with_header("content-type", "application/json")
    .with_body(r#"{"error": "Service temporarily unavailable"}"#)
    .expect(1)
    .create();

  // Second request: Success
  let mock_response = load_mock_response("openai_vision_response.json");
  let _mock_success = server
    .mock("POST", "/v1/chat/completions")
    .with_status(200)
    .with_header("content-type", "application/json")
    .with_body(mock_response.to_string())
    .expect_at_least(1)
    .create();

  let manager = AIProviderManager::new();
  let request = create_vision_request(
    AIProvider::OpenAI,
    "gpt-4o".to_string(),
    format!("{}/v1/chat/completions", server.url()),
  );

  let result = manager.send_request("test-api-key", request).await;

  assert!(
    result.is_ok(),
    "Request should succeed after retry on server error"
  );
}

#[tokio::test]
async fn test_non_retryable_error() {
  let mut server = Server::new_async().await;

  // 401 Unauthorized - should NOT retry
  let _mock_401 = server
    .mock("POST", "/v1/messages")
    .with_status(401)
    .with_header("content-type", "application/json")
    .with_body(r#"{"error": {"type": "authentication_error", "message": "Invalid API key"}}"#)
    .expect(1)
    .create();

  let manager = AIProviderManager::new();
  let request = create_vision_request(
    AIProvider::Claude,
    "claude-3-5-sonnet-20241022".to_string(),
    format!("{}/v1/messages", server.url()),
  );

  let result = manager.send_request("invalid-key", request).await;

  assert!(
    result.is_err(),
    "Request should fail on authentication error"
  );
}

#[tokio::test]
async fn test_multimodal_content_parsing() {
  let mut server = Server::new_async().await;
  let _mock = setup_claude_mock(&mut server);

  let manager = AIProviderManager::new();
  let mut request = create_vision_request(
    AIProvider::Claude,
    "claude-3-5-sonnet-20241022".to_string(),
    format!("{}/v1/messages", server.url()),
  );

  // Add multiple images
  request.messages[0].content.push(ContentPart::Image {
    source: ImageSource::Base64 {
      media_type: "image/jpeg".to_string(),
      data: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==".to_string(),
    },
  });

  let result = manager.send_request("test-api-key", request).await;

  assert!(
    result.is_ok(),
    "Request with multiple images should succeed"
  );
}

#[tokio::test]
async fn test_response_metadata() {
  let mut server = Server::new_async().await;
  let _mock = setup_claude_mock(&mut server);

  let manager = AIProviderManager::new();
  let request = create_vision_request(
    AIProvider::Claude,
    "claude-3-5-sonnet-20241022".to_string(),
    format!("{}/v1/messages", server.url()),
  );

  let result = manager.send_request("test-api-key", request).await;

  assert!(result.is_ok());
  let response = result.unwrap();

  // Check that metadata is present
  assert!(
    response.metadata.is_some(),
    "Response should contain metadata"
  );

  if let Some(metadata) = response.metadata {
    assert!(
      metadata.get("model").is_some(),
      "Metadata should contain model name"
    );
  }
}

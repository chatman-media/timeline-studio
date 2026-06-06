//! LLM-планировщик монтажа (BYOK) — M4 #123.
//!
//! Принимает цель на естественном языке + анализы медиафайлов,
//! формирует промпт и вызывает OpenAI-совместимый API (BYOK),
//! возвращает `ProjectSchema`-совместимый JSON.
//!
//! Поддерживает любой OpenAI-compatible endpoint:
//! - OpenAI (`https://api.openai.com/v1`)
//! - Anthropic через совместимый адаптер
//! - Local LLM: Ollama, LM Studio, vLLM
//!
//! ```no_run
//! use ts_agent::llm_planner::{LlmPlanner, LlmPlanParams};
//! # async fn run() -> anyhow::Result<()> {
//! let result = LlmPlanner::new()
//!   .plan(LlmPlanParams {
//!     goal: "Create a 30-second travel TikTok".to_string(),
//!     analyses: vec![],
//!     source_files: vec![],
//!     platform: "tiktok".to_string(),
//!     api_key: "sk-...".to_string(),
//!     api_url: None,
//!     model: None,
//!     temperature: None,
//!   })
//!   .await?;
//! println!("{}", serde_json::to_string_pretty(&result.project_schema)?);
//! # Ok(()) }
//! ```

use anyhow::{Context, Result};
use serde::{Deserialize, Serialize};

/// Параметры LLM-планирования монтажа.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LlmPlanParams {
  /// Цель монтажа на естественном языке (на любом языке)
  pub goal: String,
  /// Предварительно выполненные анализы (JSON из `timeline analyze`)
  pub analyses: Vec<serde_json::Value>,
  /// Пути к исходным файлам (соответствуют порядку analyses)
  pub source_files: Vec<String>,
  /// Целевая платформа: youtube | tiktok | reels | shorts | instagram | square
  pub platform: String,
  /// API ключ (BYOK)
  pub api_key: String,
  /// Base URL API (дефолт: https://api.openai.com/v1)
  pub api_url: Option<String>,
  /// Модель (дефолт: gpt-4o-mini)
  pub model: Option<String>,
  /// Temperature (дефолт: 0.3 — детерминированный JSON)
  pub temperature: Option<f64>,
}

/// Результат LLM-планирования.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LlmPlanResult {
  /// ProjectSchema JSON (готов к `timeline render`)
  pub project_schema: serde_json::Value,
  /// Мотивация/объяснение от LLM
  pub reasoning: String,
  /// Модель, использованная для генерации
  pub model_used: String,
  /// Входных токенов
  pub tokens_input: u32,
  /// Выходных токенов
  pub tokens_output: u32,
  /// Время обработки (сек)
  pub elapsed_secs: f64,
}

/// LLM-планировщик монтажа (BYOK).
pub struct LlmPlanner;

impl LlmPlanner {
  pub fn new() -> Self {
    Self
  }

  /// Сформировать план монтажа через LLM.
  pub async fn plan(&self, params: LlmPlanParams) -> Result<LlmPlanResult> {
    let t0 = std::time::Instant::now();

    let api_url = params
      .api_url
      .as_deref()
      .unwrap_or("https://api.openai.com/v1");
    let model = params.model.as_deref().unwrap_or("gpt-4o-mini");
    let temperature = params.temperature.unwrap_or(0.3);

    // Собираем контекст о медиафайлах
    let media_context = build_media_context(&params.analyses, &params.source_files);
    let (width, height) = platform_resolution(&params.platform);

    // Системный промпт — инструкция LLM
    let system_prompt = format!(
      "You are a professional video editor AI. Your task is to generate a montage plan \
       as a valid JSON object compatible with ProjectSchema format.\n\n\
       The JSON must have this structure:\n\
       {{\n\
         \"id\": \"<uuid>\",\n\
         \"name\": \"<montage name>\",\n\
         \"timeline\": {{ \"fps\": 30, \"resolution\": [{width}, {height}], \"duration\": <seconds> }},\n\
         \"tracks\": [\n\
           {{\n\
             \"id\": \"video-0\",\n\
             \"type\": \"video\",\n\
             \"name\": \"Video\",\n\
             \"clips\": [\n\
               {{ \"id\": \"clip-N\", \"source\": \"<filepath>\", \"startTime\": <secs>, \
                  \"endTime\": <secs>, \"trackStart\": <secs>, \"duration\": <secs> }},\n\
               ...\n\
             ]\n\
           }}\n\
         ],\n\
         \"settings\": {{ \"export\": {{ \"format\": \"mp4\", \"hardwareAcceleration\": false }} }}\n\
       }}\n\n\
       Rules:\n\
       - Select the BEST moments from the provided media analysis\n\
       - Total duration must match the requested target\n\
       - Use only file paths from the provided source files\n\
       - startTime/endTime must be within the source file duration\n\
       - Your response must be ONLY the JSON object, no markdown, no explanation\n\
       - After the JSON, on a new line starting with '// reasoning:', add a brief explanation"
    );

    // Пользовательский промпт
    let user_prompt = format!(
      "Goal: {goal}\n\
       Platform: {platform}\n\
       Target duration: {duration} seconds\n\n\
       Media files available:\n{media_context}\n\n\
       Generate a ProjectSchema JSON montage plan.",
      goal = params.goal,
      platform = params.platform,
      duration = estimate_duration(&params.platform),
      media_context = media_context
    );

    log::info!("LLM plan: calling {api_url} model={model}");

    // Вызов API
    let client = reqwest::Client::new();
    let body = serde_json::json!({
      "model": model,
      "temperature": temperature,
      "max_tokens": 4096,
      "messages": [
        { "role": "system", "content": system_prompt },
        { "role": "user", "content": user_prompt }
      ]
    });

    let resp = client
      .post(format!("{api_url}/chat/completions"))
      .header("Authorization", format!("Bearer {}", params.api_key))
      .header("Content-Type", "application/json")
      .json(&body)
      .send()
      .await
      .context("LLM API request failed")?;

    let status = resp.status();
    if !status.is_success() {
      let err_body = resp.text().await.unwrap_or_default();
      anyhow::bail!("LLM API returned {status}: {err_body}");
    }

    let resp_json: serde_json::Value = resp.json().await.context("parse LLM response")?;

    // Извлекаем контент из OpenAI-формата
    let content = resp_json["choices"][0]["message"]["content"]
      .as_str()
      .context("no content in LLM response")?;

    let tokens_input = resp_json["usage"]["prompt_tokens"]
      .as_u64()
      .unwrap_or(0) as u32;
    let tokens_output = resp_json["usage"]["completion_tokens"]
      .as_u64()
      .unwrap_or(0) as u32;

    // Парсим JSON из ответа (LLM может добавить reasoning после JSON)
    let (project_schema, reasoning) = parse_llm_response(content)?;

    let elapsed_secs = t0.elapsed().as_secs_f64();

    Ok(LlmPlanResult {
      project_schema,
      reasoning,
      model_used: model.to_string(),
      tokens_input,
      tokens_output,
      elapsed_secs,
    })
  }
}

impl Default for LlmPlanner {
  fn default() -> Self {
    Self::new()
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────────────

fn build_media_context(analyses: &[serde_json::Value], source_files: &[String]) -> String {
  let mut out = String::new();
  for (i, (analysis, path)) in analyses.iter().zip(source_files.iter()).enumerate() {
    let duration = analysis["video"]["duration_secs"].as_f64().unwrap_or(0.0);
    let width = analysis["video"]["width"].as_u64().unwrap_or(0);
    let height = analysis["video"]["height"].as_u64().unwrap_or(0);
    let fps = analysis["video"]["fps"].as_f64().unwrap_or(0.0);
    let quality = analysis["content"]["quality_overall"].as_f64().unwrap_or(0.5);
    let category = analysis["content"]["primary_category"]
      .as_str()
      .unwrap_or("unknown");

    out.push_str(&format!(
      "\n[File {i}] {path}\n  Duration: {duration:.1}s, Resolution: {width}x{height}, FPS: {fps:.1}\n  Quality: {quality:.2}, Category: {category}\n  Scenes:\n"
    ));

    if let Some(scenes) = analysis["scenes"].as_array() {
      for scene in scenes {
        let start = scene["start_secs"].as_f64().unwrap_or(0.0);
        let end = scene["end_secs"].as_f64().unwrap_or(0.0);
        let brightness = scene["brightness"].as_f64().unwrap_or(0.5);
        let contrast = scene["contrast"].as_f64().unwrap_or(0.5);
        out.push_str(&format!(
          "    {start:.1}s-{end:.1}s (brightness={brightness:.2}, contrast={contrast:.2})\n"
        ));
      }
    }
  }
  out
}

fn platform_resolution(platform: &str) -> (u32, u32) {
  match platform {
    "tiktok" | "reels" | "shorts" => (1080, 1920),
    "instagram" | "square" => (1080, 1080),
    _ => (1920, 1080),
  }
}

fn estimate_duration(platform: &str) -> f64 {
  match platform {
    "tiktok" | "reels" | "shorts" => 30.0,
    "instagram" => 60.0,
    _ => 120.0,
  }
}

/// Парсинг ответа LLM: извлечь JSON и reasoning.
fn parse_llm_response(content: &str) -> Result<(serde_json::Value, String)> {
  // Ищем JSON-блок — может быть обёрнут в ```json ... ``` или идти сразу
  let json_str = if let Some(start) = content.find("```json") {
    let after = &content[start + 7..];
    if let Some(end) = after.find("```") {
      after[..end].trim()
    } else {
      after.trim()
    }
  } else if let Some(start) = content.find("```") {
    let after = &content[start + 3..];
    if let Some(end) = after.find("```") {
      after[..end].trim()
    } else {
      after.trim()
    }
  } else if content.trim_start().starts_with('{') {
    // Чистый JSON — берём до строки с reasoning
    if let Some(reasoning_pos) = content.find("\n// reasoning:") {
      content[..reasoning_pos].trim()
    } else {
      content.trim()
    }
  } else {
    content.trim()
  };

  // Извлекаем reasoning (если есть)
  let reasoning = if let Some(pos) = content.find("// reasoning:") {
    content[pos + 13..].trim().to_string()
  } else {
    String::new()
  };

  let schema = serde_json::from_str(json_str)
    .with_context(|| format!("failed to parse LLM JSON response: {json_str}"))?;

  Ok((schema, reasoning))
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn platform_resolution_tiktok() {
    assert_eq!(platform_resolution("tiktok"), (1080, 1920));
    assert_eq!(platform_resolution("youtube"), (1920, 1080));
    assert_eq!(platform_resolution("square"), (1080, 1080));
  }

  #[test]
  fn parse_clean_json() {
    let json = r#"{"id": "test", "name": "Plan", "timeline": {"fps": 30}}"#;
    let (schema, reasoning) = parse_llm_response(json).unwrap();
    assert_eq!(schema["id"], "test");
    assert_eq!(reasoning, "");
  }

  #[test]
  fn parse_json_with_reasoning() {
    let content = r#"{"id": "abc", "name": "X"}
// reasoning: This plan selects the best moments"#;
    let (schema, reasoning) = parse_llm_response(content).unwrap();
    assert_eq!(schema["id"], "abc");
    assert_eq!(reasoning, "This plan selects the best moments");
  }

  #[test]
  fn parse_json_in_code_block() {
    let content = "```json\n{\"id\": \"xyz\", \"timeline\": {}}\n```\n\nSome extra text";
    let (schema, _) = parse_llm_response(content).unwrap();
    assert_eq!(schema["id"], "xyz");
  }

  #[test]
  fn build_media_context_empty() {
    let ctx = build_media_context(&[], &[]);
    assert_eq!(ctx, "");
  }

  #[test]
  fn build_media_context_with_analysis() {
    let analysis = serde_json::json!({
      "video": { "duration_secs": 15.0, "width": 1920, "height": 1080, "fps": 30.0 },
      "content": { "quality_overall": 0.75, "primary_category": "travel" },
      "scenes": [
        { "start_secs": 0.0, "end_secs": 5.0, "brightness": 0.7, "contrast": 0.6 }
      ]
    });
    let ctx = build_media_context(&[analysis], &["/data/clip.mp4".to_string()]);
    assert!(ctx.contains("[File 0] /data/clip.mp4"));
    assert!(ctx.contains("Duration: 15.0s"));
    assert!(ctx.contains("0.0s-5.0s"));
  }

  #[test]
  fn planner_can_be_created() {
    let _p = LlmPlanner::new();
  }
}

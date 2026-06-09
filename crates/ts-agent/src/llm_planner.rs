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
//!     target_duration: Some(30.0),
//!     api_key: "sk-...".to_string(),
//!     api_url: None,
//!     model: None,
//!     temperature: None,
//!   })
//!   .await?;
//! println!("{}", serde_json::to_string_pretty(&result.project_schema)?);
//! # Ok(()) }
//! ```

use anyhow::{anyhow, Context, Result};
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};

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
  /// Целевая длительность монтажа (секунды). None → платформенный дефолт.
  pub target_duration: Option<f64>,
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
      "You are a professional video editor AI. Return one valid Timeline Studio \
       ProjectSchema JSON object. Do not use markdown and do not add commentary.\n\n\
       Required top-level fields:\n\
       - version: \"1.0.0\"\n\
       - metadata: {{ \"name\", \"description\", \"created_at\", \"modified_at\", \"author\" }}\n\
       - timeline: {{ \"duration\", \"fps\", \"resolution\", \"sample_rate\", \"aspect_ratio\" }}\n\
       - tracks: array of tracks\n\
       - effects, transitions, filters, templates, style_templates, subtitles: arrays\n\
       - settings: export/preview/custom/output/resolution/frame_rate/aspect_ratio\n\n\
       Use these exact field names and enum values:\n\
       - timeline.resolution must be [{width}, {height}]\n\
       - track.track_type must be \"Video\"\n\
       - clip.source must be {{ \"File\": \"<filepath>\" }} using only provided source files\n\
       - clip timing fields must be snake_case: start_time, end_time, source_start, source_end\n\
       - aspect_ratio values must be \"Ratio16x9\", \"Ratio9x16\", or \"Ratio1x1\"\n\
       - settings.preview.resolution must be an array tuple, for example [1280, 720]\n\
       - settings.export.format and settings.output.format must be \"Mp4\"\n\
       - settings.export.hardware_acceleration must be false\n\n\
       Each clip must include id, source, start_time, end_time, source_start, \
       source_end, speed, opacity, effects, filters, template_id, template_position, \
       color_correction, crop, transform, audio_track_index, properties. Clips in \
       the same track must not overlap. Put any explanation into \
       settings.custom.llm_plan.reasoning instead of text outside JSON."
    );

    // Целевая длительность: явная от пользователя или платформенный дефолт
    let duration = params.target_duration.unwrap_or_else(|| default_duration(&params.platform));

    // Пользовательский промпт
    let user_prompt = format!(
      "Goal: {goal}\n\
       Platform: {platform}\n\
       Target duration: {duration} seconds\n\n\
       Media files available:\n{media_context}\n\n\
       Generate a ProjectSchema JSON montage plan.",
      goal = params.goal,
      platform = params.platform,
      duration = duration,
      media_context = media_context
    );

    log::info!("LLM plan: calling {api_url} model={model}");

    // Вызов API (клиент с таймаутами)
    let client = reqwest::Client::builder()
      .timeout(std::time::Duration::from_secs(120))
      .connect_timeout(std::time::Duration::from_secs(30))
      .build()?;
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
      // Обрезаем тело ошибки — в нём может быть echo запроса с токеном
      let truncated = if err_body.len() > 500 {
        format!("{}… (truncated)", &err_body[..500])
      } else {
        err_body
      };
      anyhow::bail!("LLM API returned {status}: {truncated}");
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

fn default_duration(platform: &str) -> f64 {
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
  let schema = canonicalize_project_schema(schema)?;

  Ok((schema, reasoning))
}

fn canonicalize_project_schema(schema: Value) -> Result<Value> {
  let timeline = schema.get("timeline").unwrap_or(&Value::Null);
  let (width, height) = resolution_from_timeline(timeline);
  let fps = u64_field(timeline, "fps").unwrap_or(30);
  let duration = f64_field(timeline, "duration")
    .or_else(|| infer_duration_from_tracks(schema.get("tracks")))
    .unwrap_or(30.0)
    .max(0.1);
  let aspect_ratio = aspect_ratio_value(width, height);
  let name = nested_string_field(&schema, &["metadata", "name"])
    .or_else(|| string_field(&schema, "name"))
    .unwrap_or_else(|| "LLM Montage".to_string());
  let description = nested_string_field(&schema, &["metadata", "description"])
    .or_else(|| string_field(&schema, "description"))
    .unwrap_or_else(|| "Generated by timeline llm-plan".to_string());
  let timestamp = "2026-01-01T00:00:00Z";
  let tracks = canonicalize_tracks(schema.get("tracks"));

  let project = json!({
    "version": string_field(&schema, "version").unwrap_or_else(|| "1.0.0".to_string()),
    "metadata": {
      "name": name,
      "description": description,
      "created_at": nested_string_field(&schema, &["metadata", "created_at"]).unwrap_or_else(|| timestamp.to_string()),
      "modified_at": nested_string_field(&schema, &["metadata", "modified_at"]).unwrap_or_else(|| timestamp.to_string()),
      "author": nested_string_field(&schema, &["metadata", "author"]).unwrap_or_else(|| "timeline-llm-plan".to_string()),
    },
    "timeline": {
      "duration": duration,
      "fps": fps,
      "resolution": [width, height],
      "sample_rate": u64_field(timeline, "sample_rate").unwrap_or(48000),
      "aspect_ratio": aspect_ratio,
    },
    "tracks": tracks,
    "effects": [],
    "transitions": [],
    "filters": [],
    "templates": [],
    "style_templates": [],
    "subtitles": [],
    "settings": {
      "export": {
        "format": "Mp4",
        "quality": 85,
        "video_bitrate": 8000,
        "audio_bitrate": 192,
        "hardware_acceleration": false,
        "preferred_gpu_encoder": null,
        "ffmpeg_args": [],
        "encoding_profile": "main",
        "rate_control_mode": "vbr",
        "keyframe_interval": 60,
        "b_frames": 2,
        "multi_pass": 1,
        "preset": "medium",
        "max_bitrate": null,
        "min_bitrate": null,
        "crf": null,
        "optimize_for_speed": false,
        "optimize_for_network": false,
        "normalize_audio": false,
        "audio_target": -23.0,
        "audio_peak": -1.0
      },
      "preview": {
        "resolution": preview_resolution(width, height),
        "quality": 75,
        "fps": fps,
        "format": "Jpeg"
      },
      "custom": {
        "llm_plan": {
          "normalized": true,
          "source_schema_version": string_field(&schema, "version"),
          "reasoning": nested_string_field(&schema, &["settings", "custom", "llm_plan", "reasoning"])
        }
      },
      "output": {
        "format": "Mp4",
        "quality": 85,
        "video_bitrate": 8000,
        "audio_bitrate": 192,
        "duration": duration
      },
      "resolution": {
        "width": width,
        "height": height
      },
      "frame_rate": fps,
      "aspect_ratio": aspect_ratio_value(width, height)
    }
  });

  let typed: ts_schema::ProjectSchema = serde_json::from_value(project.clone())
    .context("canonicalized LLM response is not a ProjectSchema")?;
  typed
    .validate()
    .map_err(|error| anyhow!("canonicalized LLM ProjectSchema failed validation: {error}"))?;

  Ok(project)
}

fn canonicalize_tracks(tracks: Option<&Value>) -> Vec<Value> {
  tracks
    .and_then(Value::as_array)
    .map(|items| {
      items
        .iter()
        .enumerate()
        .map(|(index, track)| canonicalize_track(track, index))
        .collect()
    })
    .unwrap_or_default()
}

fn canonicalize_track(track: &Value, index: usize) -> Value {
  let clips = canonicalize_clips(track.get("clips"));
  json!({
    "id": string_field(track, "id").unwrap_or_else(|| format!("video-track-{index}")),
    "track_type": normalize_track_type(
      string_field(track, "track_type").or_else(|| string_field(track, "type")).as_deref(),
    ),
    "name": string_field(track, "name").unwrap_or_else(|| "Video".to_string()),
    "enabled": bool_field(track, "enabled").unwrap_or(true),
    "volume": f64_field(track, "volume").unwrap_or(1.0),
    "locked": bool_field(track, "locked").unwrap_or(false),
    "clips": clips,
    "effects": [],
    "filters": [],
  })
}

fn canonicalize_clips(clips: Option<&Value>) -> Vec<Value> {
  let mut cursor = 0.0_f64;

  clips
    .and_then(Value::as_array)
    .map(|items| {
      items
        .iter()
        .enumerate()
        .map(|(index, clip)| {
          let source_start = f64_field(clip, "source_start")
            .or_else(|| f64_field(clip, "startTime"))
            .unwrap_or(0.0)
            .max(0.0);
          let source_end = f64_field(clip, "source_end")
            .or_else(|| f64_field(clip, "endTime"))
            .unwrap_or(source_start + 5.0);
          let source_duration = (source_end - source_start).max(0.1);
          let explicit_duration = f64_field(clip, "duration").filter(|duration| *duration > 0.0);
          let timeline_duration = f64_field(clip, "end_time")
            .zip(f64_field(clip, "start_time"))
            .map(|(end, start)| end - start)
            .filter(|duration| *duration > 0.0)
            .or(explicit_duration)
            .unwrap_or(source_duration)
            .max(0.1);
          let requested_start = f64_field(clip, "start_time")
            .or_else(|| f64_field(clip, "trackStart"))
            .unwrap_or(cursor);
          let start_time = requested_start.max(cursor).max(0.0);
          let end_time = start_time + timeline_duration;
          cursor = end_time;

          json!({
            "id": string_field(clip, "id").unwrap_or_else(|| format!("clip-{index}")),
            "source": canonicalize_clip_source(clip.get("source")),
            "start_time": start_time,
            "end_time": end_time,
            "source_start": source_start,
            "source_end": source_end.max(source_start + 0.1),
            "speed": f64_field(clip, "speed").filter(|speed| *speed > 0.0).unwrap_or(1.0),
            "opacity": f64_field(clip, "opacity").unwrap_or(1.0).clamp(0.0, 1.0),
            "effects": [],
            "filters": [],
            "template_id": clip.get("template_id").cloned().unwrap_or(Value::Null),
            "template_position": clip.get("template_position").cloned().unwrap_or(Value::Null),
            "color_correction": clip.get("color_correction").cloned().unwrap_or(Value::Null),
            "crop": clip.get("crop").cloned().unwrap_or(Value::Null),
            "transform": clip.get("transform").cloned().unwrap_or(Value::Null),
            "audio_track_index": clip.get("audio_track_index").cloned().unwrap_or(Value::Null),
            "properties": {
              "notes": string_field(clip, "notes")
                .or_else(|| nested_string_field(clip, &["properties", "notes"])),
              "tags": string_array_field(clip, "tags")
                .or_else(|| clip.get("properties").and_then(|props| string_array_field(props, "tags")))
                .unwrap_or_default(),
              "custom_metadata": {
                "normalized_from_llm": true
              }
            }
          })
        })
        .collect()
    })
    .unwrap_or_default()
}

fn canonicalize_clip_source(source: Option<&Value>) -> Value {
  match source {
    Some(Value::Object(map)) if map.contains_key("File") || map.contains_key("Stream") => {
      Value::Object(map.clone())
    }
    Some(Value::String(value)) if is_url(value) => json!({ "Stream": value }),
    Some(Value::String(value)) => json!({ "File": value }),
    _ => json!({ "File": "unknown.mp4" }),
  }
}

fn infer_duration_from_tracks(tracks: Option<&Value>) -> Option<f64> {
  tracks
    .and_then(Value::as_array)
    .map(|items| {
      items
        .iter()
        .filter_map(|track| track.get("clips").and_then(Value::as_array))
        .flatten()
        .filter_map(|clip| {
          f64_field(clip, "end_time")
            .or_else(|| f64_field(clip, "trackStart").zip(f64_field(clip, "duration")).map(|(start, duration)| start + duration))
            .or_else(|| f64_field(clip, "duration"))
        })
        .fold(0.0_f64, f64::max)
    })
    .filter(|duration| *duration > 0.0)
}

fn resolution_from_timeline(timeline: &Value) -> (u32, u32) {
  if let Some(items) = timeline.get("resolution").and_then(Value::as_array) {
    let width = items.first().and_then(Value::as_u64).unwrap_or(1920) as u32;
    let height = items.get(1).and_then(Value::as_u64).unwrap_or(1080) as u32;
    return (width.max(1), height.max(1));
  }

  let width = u64_field(timeline, "width").unwrap_or(1920) as u32;
  let height = u64_field(timeline, "height").unwrap_or(1080) as u32;
  (width.max(1), height.max(1))
}

fn preview_resolution(width: u32, height: u32) -> Value {
  if height > width {
    json!([720, 1280])
  } else if width == height {
    json!([720, 720])
  } else {
    json!([1280, 720])
  }
}

fn aspect_ratio_value(width: u32, height: u32) -> &'static str {
  match (width, height) {
    (1080, 1920) => "Ratio9x16",
    (1080, 1080) => "Ratio1x1",
    (1920, 1080) => "Ratio16x9",
    _ if height > width => "Ratio9x16",
    _ if width == height => "Ratio1x1",
    _ => "Ratio16x9",
  }
}

fn normalize_track_type(value: Option<&str>) -> &'static str {
  match value.unwrap_or("video").to_ascii_lowercase().as_str() {
    "audio" => "Audio",
    "subtitle" | "subtitles" | "caption" | "captions" => "Subtitle",
    "effect" | "effects" => "Effect",
    _ => "Video",
  }
}

fn nested_string_field(value: &Value, path: &[&str]) -> Option<String> {
  let mut current = value;
  for key in path {
    current = current.get(*key)?;
  }
  current.as_str().map(ToString::to_string)
}

fn string_field(value: &Value, key: &str) -> Option<String> {
  value.get(key).and_then(Value::as_str).map(ToString::to_string)
}

fn string_array_field(value: &Value, key: &str) -> Option<Vec<String>> {
  value
    .get(key)
    .and_then(Value::as_array)
    .map(|items| items.iter().filter_map(Value::as_str).map(ToString::to_string).collect())
}

fn f64_field(value: &Value, key: &str) -> Option<f64> {
  value.get(key).and_then(Value::as_f64)
}

fn u64_field(value: &Value, key: &str) -> Option<u64> {
  value.get(key).and_then(Value::as_u64)
}

fn bool_field(value: &Value, key: &str) -> Option<bool> {
  value.get(key).and_then(Value::as_bool)
}

fn is_url(value: &str) -> bool {
  value.starts_with("http://") || value.starts_with("https://")
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
    assert_eq!(schema["version"], "1.0.0");
    assert_eq!(schema["metadata"]["name"], "Plan");
    assert_eq!(schema["timeline"]["sample_rate"], 48000);
    assert_eq!(reasoning, "");
  }

  #[test]
  fn parse_json_with_reasoning() {
    let content = r#"{"id": "abc", "name": "X"}
// reasoning: This plan selects the best moments"#;
    let (schema, reasoning) = parse_llm_response(content).unwrap();
    let typed: ts_schema::ProjectSchema = serde_json::from_value(schema.clone()).unwrap();
    typed.validate().unwrap();
    assert_eq!(schema["metadata"]["name"], "X");
    assert_eq!(reasoning, "This plan selects the best moments");
  }

  #[test]
  fn parse_json_in_code_block() {
    let content = "```json\n{\"id\": \"xyz\", \"timeline\": {}}\n```\n\nSome extra text";
    let (schema, reasoning) = parse_llm_response(content).unwrap();
    let typed: ts_schema::ProjectSchema = serde_json::from_value(schema).unwrap();
    typed.validate().unwrap();
    assert_eq!(reasoning, "");
  }

  #[test]
  fn parse_legacy_llm_clip_shape_returns_valid_project_schema() {
    let content = r#"{
      "id": "legacy",
      "name": "Legacy Plan",
      "timeline": { "fps": 30, "resolution": [1080, 1920], "duration": 6 },
      "tracks": [{
        "id": "video-0",
        "type": "video",
        "name": "Video",
        "clips": [
          { "id": "clip-a", "source": "/tmp/a.mp4", "startTime": 2, "endTime": 5, "trackStart": 0, "duration": 3 },
          { "id": "clip-b", "source": "/tmp/b.mp4", "startTime": 10, "endTime": 13, "trackStart": 1, "duration": 3 }
        ]
      }]
    }"#;

    let (schema, _) = parse_llm_response(content).unwrap();
    let typed: ts_schema::ProjectSchema = serde_json::from_value(schema.clone()).unwrap();
    typed.validate().unwrap();
    assert_eq!(schema["metadata"]["name"], "Legacy Plan");
    assert_eq!(schema["tracks"][0]["track_type"], "Video");
    assert_eq!(schema["tracks"][0]["clips"][0]["source"]["File"], "/tmp/a.mp4");
    assert_eq!(schema["tracks"][0]["clips"][0]["source_start"], 2.0);
    assert_eq!(schema["tracks"][0]["clips"][1]["start_time"], 3.0);
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
  fn parse_invalid_json_returns_error() {
    let result = parse_llm_response("this is not json at all");
    assert!(result.is_err(), "should fail on invalid JSON");
    let msg = format!("{}", result.unwrap_err());
    assert!(msg.contains("failed to parse LLM JSON response"));
  }

  #[test]
  fn parse_truncated_json_returns_error() {
    let result = parse_llm_response(r#"{"id": "abc", "name": "#);
    assert!(result.is_err());
  }

  #[test]
  fn planner_can_be_created() {
    let _p = LlmPlanner::new();
  }

  #[test]
  fn default_duration_values() {
    assert_eq!(default_duration("tiktok"), 30.0);
    assert_eq!(default_duration("reels"), 30.0);
    assert_eq!(default_duration("youtube"), 120.0);
  }

  #[test]
  fn error_body_truncation_logic() {
    // Verify truncation works: strings > 500 chars should be truncated
    let long = "x".repeat(1000);
    let truncated = if long.len() > 500 {
      format!("{}… (truncated)", &long[..500])
    } else {
      long.clone()
    };
    assert!(truncated.contains("… (truncated)"));
    assert!(truncated.len() < long.len());
  }
}

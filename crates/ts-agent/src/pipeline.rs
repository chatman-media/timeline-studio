//! Сквозной агентный пайплайн: analyze → optimize → publish.

use anyhow::Result;
use serde::{Deserialize, Serialize};

use crate::steps;

// ─── параметры ───────────────────────────────────────────────────────────────

/// Параметры запуска пайплайна.
#[derive(Debug, Clone)]
pub struct PipelineParams {
  /// Входной медиафайл
  pub input: String,
  /// Целевая платформа: youtube | tiktok | reels | shorts | instagram | square
  pub platform: String,
  /// Путь для оптимизированного файла
  pub output: String,
  /// Публикация (если None — только optimize без публикации)
  pub publish: Option<PublishTarget>,
  /// Сколько сцен сэмплировать при анализе (по умолчанию 8)
  pub scene_count: usize,
}

/// Куда публиковать.
#[derive(Debug, Clone)]
pub enum PublishTarget {
  Telegram {
    bot_token: String,
    chat_id: String,
    caption: Option<String>,
  },
}

// ─── результат ───────────────────────────────────────────────────────────────

/// Результат полного пайплайна.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PipelineResult {
  pub input: String,
  pub optimized: String,
  pub platform: String,
  pub duration_secs: Option<f64>,
  pub quality_overall: Option<f64>,
  pub output_size_bytes: u64,
  pub output_bitrate_kbps: f64,
  /// message_id в Telegram (если публиковали)
  pub message_id: Option<i64>,
  pub elapsed_secs: f64,
}

// ─── pipeline ────────────────────────────────────────────────────────────────

/// Агентный оркестратор: analyze → optimize → publish.
pub struct Pipeline;

impl Pipeline {
  pub fn new() -> Self {
    Self
  }

  /// Выполнить полный пайплайн.
  pub async fn run(&self, params: PipelineParams) -> Result<PipelineResult> {
    let t0 = std::time::Instant::now();

    // ── 1. анализ (опционально, для метаданных) ──────────────────────────────
    let analysis = steps::step_analyze(&params.input, params.scene_count).await;
    let (duration_secs, quality) = analysis
      .as_ref()
      .map(|a| {
        (
          a.video.as_ref().map(|v| v.duration_secs),
          Some(a.content.quality_overall),
        )
      })
      .unwrap_or((None, None));

    // ── 2. оптимизация ───────────────────────────────────────────────────────
    let opt_result = steps::step_optimize(&params.input, &params.output, &params.platform).await?;

    // ── 3. публикация ────────────────────────────────────────────────────────
    let message_id = if let Some(target) = &params.publish {
      let msg = match target {
        PublishTarget::Telegram {
          bot_token,
          chat_id,
          caption,
        } => steps::step_publish_telegram(&params.output, bot_token, chat_id, caption.clone()).await?,
      };
      Some(msg.message_id)
    } else {
      None
    };

    Ok(PipelineResult {
      input: params.input.clone(),
      optimized: params.output.clone(),
      platform: params.platform.clone(),
      duration_secs,
      quality_overall: quality,
      output_size_bytes: opt_result.file_size,
      output_bitrate_kbps: opt_result.bitrate as f64,
      message_id,
      elapsed_secs: t0.elapsed().as_secs_f64(),
    })
  }
}

impl Default for Pipeline {
  fn default() -> Self {
    Self::new()
  }
}

// ─── тесты ───────────────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn pipeline_can_be_created() {
    let _p = Pipeline::new();
    let _p2 = Pipeline::default();
  }

  #[test]
  fn pipeline_result_serializes() {
    let r = PipelineResult {
      input: "in.mp4".into(),
      optimized: "out.mp4".into(),
      platform: "tiktok".into(),
      duration_secs: Some(10.0),
      quality_overall: Some(0.75),
      output_size_bytes: 1024,
      output_bitrate_kbps: 6000.0,
      message_id: Some(42),
      elapsed_secs: 2.5,
    };
    let json = serde_json::to_string(&r).unwrap();
    assert!(json.contains("tiktok"));
    assert!(json.contains("6000"));
  }

  #[test]
  fn platform_preset_variants() {
    assert_eq!(steps::platform_preset("tiktok"), (1080, 1920, 6000, 30));
    assert_eq!(steps::platform_preset("instagram"), (1080, 1080, 5000, 30));
    assert_eq!(steps::platform_preset("youtube"), (1920, 1080, 8000, 30));
    assert_eq!(steps::platform_preset("unknown"), (1920, 1080, 8000, 30));
  }
}

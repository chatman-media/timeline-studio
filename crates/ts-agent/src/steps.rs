//! Шаги пайплайна — тонкие обёртки над крейтами.

use anyhow::Result;
use log::info;

use ts_analysis::headless::{AnalyzeParams, HeadlessAnalyzer, MediaAnalysis};
use ts_platform::business_logic::optimize_for_platform_logic;
use ts_platform::types::PlatformOptimizationParams;
use ts_publish::telegram::{TelegramPublishParams, TelegramPublisher};
use ts_publish::types::PublishResult;

// ─── пресеты платформ ─────────────────────────────────────────────────────────

/// `(width, height, bitrate_kbps, fps)` для платформы.
pub fn platform_preset(p: &str) -> (u32, u32, u32, u32) {
  match p {
    "tiktok" | "reels" | "shorts" => (1080, 1920, 6000, 30),
    "instagram" | "square" => (1080, 1080, 5000, 30),
    _ => (1920, 1080, 8000, 30), // youtube / default
  }
}

// ─── шаг 1: анализ ───────────────────────────────────────────────────────────

pub async fn step_analyze(input: &str, scene_count: usize) -> Result<MediaAnalysis> {
  info!("[analyze] {input}");
  HeadlessAnalyzer::new()
    .analyze(AnalyzeParams {
      input_path: input.to_string(),
      scene_count,
    })
    .await
}

// ─── шаг 2: оптимизация ──────────────────────────────────────────────────────

pub async fn step_optimize(
  input: &str,
  output: &str,
  platform: &str,
) -> Result<ts_platform::types::PlatformOptimizationResult> {
  let (w, h, br, fps) = platform_preset(platform);
  info!("[optimize] {input} → {output} ({platform} {w}×{h})");
  optimize_for_platform_logic(&PlatformOptimizationParams {
    input_path: input.to_string(),
    output_path: output.to_string(),
    target_width: w,
    target_height: h,
    target_bitrate: br,
    target_framerate: fps,
    video_codec: "libx264".to_string(),
    audio_codec: "aac".to_string(),
    crop_to_fit: false,
  })
  .await
  .map_err(|e| anyhow::anyhow!(e))
}

// ─── шаг 3: публикация ───────────────────────────────────────────────────────

pub async fn step_publish_telegram(
  video_path: &str,
  bot_token: &str,
  chat_id: &str,
  caption: Option<String>,
) -> Result<PublishResult> {
  info!("[publish] telegram → {chat_id}");
  TelegramPublisher::new()
    .send_video(TelegramPublishParams {
      bot_token: bot_token.to_string(),
      chat_id: chat_id.to_string(),
      video_path: video_path.to_string(),
      caption,
      supports_streaming: true,
    })
    .await
    .map_err(|e| anyhow::anyhow!(e))
}

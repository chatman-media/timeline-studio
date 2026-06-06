//! HeadlessAnalyzer — анализ медиафайла без Tauri/AppHandle (M3 #122).
//!
//! Шаги:
//! 1. `ffprobe` через ts-media → метаданные (длительность, fps, кодек…)
//! 2. `ffmpeg` → N равномерных кадров (raw RGB 128×72) → цвет/яркость
//! 3. Строим SceneAnalysis из кадровой статистики
//! 4. ContentEngine → классификация / качество
//! 5. Возвращаем `MediaAnalysis` (удобный плоский JSON для агента)

use std::path::Path;
use std::process::Command;
use std::time::Instant;

use anyhow::{anyhow, Context, Result};
use chrono::Utc;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::analysis::engines::ContentEngine;
use crate::analysis::types::unified_types::{
  AudioCharacteristics, SceneAnalysis, SceneType, VisualCharacteristics,
};
use ts_media::media::metadata::get_media_metadata;

// ─── выходные типы ────────────────────────────────────────────────────────────

/// Результат анализа медиафайла (агент-friendly JSON).
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MediaAnalysis {
  /// Уникальный ID этого анализа
  pub id: String,
  /// Метаданные файла
  pub file: FileInfo,
  /// Видео-поток
  pub video: Option<VideoInfo>,
  /// Аудио-поток
  pub audio: Option<AudioInfo>,
  /// Сцены (сэмплированные)
  pub scenes: Vec<SceneInfo>,
  /// Классификация контента (ContentEngine)
  pub content: ContentInfo,
  /// Время анализа, сек
  pub processing_secs: f64,
  /// Timestamp анализа (ISO 8601)
  pub analyzed_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FileInfo {
  pub path: String,
  pub filename: String,
  pub size_bytes: u64,
  pub media_type: String, // "video" | "audio" | "image"
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VideoInfo {
  pub duration_secs: f64,
  pub fps: f64,
  pub width: u32,
  pub height: u32,
  pub codec: String,
  pub bitrate_kbps: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AudioInfo {
  pub codec: String,
  pub sample_rate_hz: u32,
  pub channels: u8,
  pub bitrate_kbps: f64,
}

/// Краткая сводка по сцене.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SceneInfo {
  pub index: usize,
  pub start_secs: f64,
  pub end_secs: f64,
  pub brightness: f64,
  pub contrast: f64,
  pub saturation: f64,
  pub dominant_color: String,
}

/// Результат ContentEngine.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ContentInfo {
  pub primary_category: String,
  pub categories: Vec<String>,
  pub genre: String,
  pub themes: Vec<String>,
  pub tags: Vec<String>,
  pub confidence: f64,
  pub quality_overall: f64,
  pub quality_visual: f64,
  pub quality_audio: f64,
  pub quality_composition: f64,
}

// ─── параметры ───────────────────────────────────────────────────────────────

/// Параметры анализа для CLI.
#[derive(Debug, Clone)]
pub struct AnalyzeParams {
  /// Путь к медиафайлу
  pub input_path: String,
  /// Число сцен для сэмплирования (по умолчанию 8)
  pub scene_count: usize,
}

impl Default for AnalyzeParams {
  fn default() -> Self {
    Self {
      input_path: String::new(),
      scene_count: 8,
    }
  }
}

// ─── analyzer ────────────────────────────────────────────────────────────────

/// Headless-анализатор медиафайла.
pub struct HeadlessAnalyzer;

impl HeadlessAnalyzer {
  pub fn new() -> Self {
    Self
  }

  /// Проанализировать медиафайл. Возвращает `MediaAnalysis`.
  pub async fn analyze(&self, params: AnalyzeParams) -> Result<MediaAnalysis> {
    let t0 = Instant::now();
    let path = &params.input_path;

    if !Path::new(path).exists() {
      return Err(anyhow!("файл не найден: {path}"));
    }

    // ── 1. метаданные через ts-media / ffprobe ────────────────────────────
    let media_file = get_media_metadata(path.clone())
      .map_err(|e| anyhow!("ffprobe failed: {e}"))?;

    // Извлекаем видео/аудио из streams
    let video_stream = media_file
      .probe_data
      .streams
      .iter()
      .find(|s| s.codec_type == "video");
    let audio_stream = media_file
      .probe_data
      .streams
      .iter()
      .find(|s| s.codec_type == "audio");

    let duration = media_file
      .duration
      .or(media_file.probe_data.format.duration)
      .unwrap_or(0.0);

    let video_info = video_stream.map(|s| {
      let fps = parse_frame_rate(s.r_frame_rate.as_deref()).unwrap_or(25.0);
      let bitrate = media_file
        .probe_data
        .format
        .bit_rate
        .as_deref()
        .and_then(|b| b.parse::<f64>().ok())
        .map(|b| b / 1000.0)
        .unwrap_or(0.0);
      VideoInfo {
        duration_secs: duration,
        fps,
        width: s.width.unwrap_or(0),
        height: s.height.unwrap_or(0),
        codec: s.codec_name.clone().unwrap_or_else(|| "unknown".to_string()),
        bitrate_kbps: bitrate,
      }
    });

    let audio_info = audio_stream.map(|s| AudioInfo {
      codec: s.codec_name.clone().unwrap_or_else(|| "unknown".to_string()),
      sample_rate_hz: s
        .sample_rate
        .as_deref()
        .and_then(|r| r.parse().ok())
        .unwrap_or(44100),
      channels: s.channels.unwrap_or(2),
      bitrate_kbps: 0.0,
    });

    let has_audio = audio_stream.is_some();

    // ── 2. сэмплируем кадры ───────────────────────────────────────────────
    let scene_count = params.scene_count.max(1);
    let (scene_infos, scenes_for_engine) =
      sample_scenes(path, duration, scene_count, has_audio).await;

    // ── 3. ContentEngine ──────────────────────────────────────────────────
    let engine = ContentEngine::new();
    let classification = engine
      .classify_content(&scenes_for_engine)
      .await
      .unwrap_or_default();
    let quality = engine
      .calculate_quality(&scenes_for_engine)
      .await
      .unwrap_or_default();

    let content = ContentInfo {
      primary_category: classification.primary_category,
      categories: classification.categories,
      genre: classification.genre,
      themes: classification.themes,
      tags: classification.tags,
      confidence: classification.confidence,
      quality_overall: quality.overall,
      quality_visual: quality.visual,
      quality_audio: quality.audio,
      quality_composition: quality.composition,
    };

    // ── 4. сборка ─────────────────────────────────────────────────────────
    let media_type = if media_file.is_video {
      "video"
    } else if media_file.is_audio {
      "audio"
    } else {
      "image"
    };

    let file_name = Path::new(path)
      .file_name()
      .and_then(|n| n.to_str())
      .unwrap_or("unknown")
      .to_string();

    Ok(MediaAnalysis {
      id: Uuid::new_v4().to_string(),
      file: FileInfo {
        path: path.clone(),
        filename: file_name,
        size_bytes: media_file.size,
        media_type: media_type.to_string(),
      },
      video: video_info,
      audio: audio_info,
      scenes: scene_infos,
      content,
      processing_secs: t0.elapsed().as_secs_f64(),
      analyzed_at: Utc::now().to_rfc3339(),
    })
  }
}

impl Default for HeadlessAnalyzer {
  fn default() -> Self {
    Self::new()
  }
}

// ─── вспомогательные функции ─────────────────────────────────────────────────

/// Сэмплировать N сцен: ffmpeg кадр → RGB → статистика.
async fn sample_scenes(
  path: &str,
  duration: f64,
  count: usize,
  has_audio: bool,
) -> (Vec<SceneInfo>, Vec<SceneAnalysis>) {
  if duration <= 0.0 {
    return (vec![], vec![]);
  }
  let scene_dur = duration / count as f64;
  let file_id = Uuid::new_v4().to_string();
  let mut scene_infos = Vec::with_capacity(count);
  let mut scenes = Vec::with_capacity(count);

  for i in 0..count {
    let t = scene_dur * i as f64 + scene_dur * 0.5;
    let visual = extract_frame_visual(path, t).unwrap_or_else(|_| default_visual());

    scene_infos.push(SceneInfo {
      index: i,
      start_secs: scene_dur * i as f64,
      end_secs: scene_dur * (i + 1) as f64,
      brightness: visual.brightness,
      contrast: visual.contrast,
      saturation: visual.saturation,
      dominant_color: visual
        .dominant_colors
        .first()
        .cloned()
        .unwrap_or_else(|| "#808080".to_string()),
    });

    let audio = if has_audio {
      Some(AudioCharacteristics {
        has_speech: false,
        has_music: false,
        volume_level: 0.5,
        clarity: 0.7,
        dominant_frequencies: vec![],
      })
    } else {
      None
    };

    scenes.push(SceneAnalysis {
      id: Uuid::new_v4().to_string(),
      file_id: file_id.clone(),
      start_time: scene_dur * i as f64,
      end_time: scene_dur * (i + 1) as f64,
      duration: scene_dur,
      scene_type: SceneType::Unknown,
      confidence: 0.6,
      key_frames: vec![t],
      description: None,
      visual: Some(visual),
      audio,
      objects: vec![],
      persons: vec![],
      transition: None,
    });
  }
  (scene_infos, scenes)
}

/// Распарсить `r_frame_rate` вида "30000/1001" или "25/1".
fn parse_frame_rate(s: Option<&str>) -> Option<f64> {
  let s = s?;
  if let Some((num, den)) = s.split_once('/') {
    let n: f64 = num.parse().ok()?;
    let d: f64 = den.parse().ok()?;
    if d != 0.0 {
      return Some(n / d);
    }
  }
  s.parse().ok()
}

/// Извлечь 1 кадр ffmpeg → raw RGB 128×72 → базовая статистика.
fn extract_frame_visual(path: &str, timestamp: f64) -> Result<VisualCharacteristics> {
  let output = Command::new("ffmpeg")
    .args([
      "-ss",
      &timestamp.to_string(),
      "-i",
      path,
      "-vf",
      "scale=128:72",
      "-frames:v",
      "1",
      "-f",
      "rawvideo",
      "-pix_fmt",
      "rgb24",
      "pipe:1",
    ])
    .stderr(std::process::Stdio::null())
    .output()
    .context("ffmpeg не найден")?;

  if !output.status.success() || output.stdout.len() < 3 {
    return Err(anyhow!("ffmpeg frame extract failed"));
  }

  let pixels = &output.stdout;
  let n = pixels.len() / 3;
  if n == 0 {
    return Err(anyhow!("empty frame"));
  }

  let (mut sum_r, mut sum_g, mut sum_b) = (0u64, 0u64, 0u64);
  let (mut max_r, mut max_g, mut max_b) = (0u8, 0u8, 0u8);
  let (mut min_r, mut min_g, mut min_b) = (255u8, 255u8, 255u8);

  for chunk in pixels.chunks_exact(3) {
    let (r, g, b) = (chunk[0], chunk[1], chunk[2]);
    sum_r += r as u64;
    sum_g += g as u64;
    sum_b += b as u64;
    max_r = max_r.max(r);
    max_g = max_g.max(g);
    max_b = max_b.max(b);
    min_r = min_r.min(r);
    min_g = min_g.min(g);
    min_b = min_b.min(b);
  }

  let mean_r = (sum_r / n as u64) as u8;
  let mean_g = (sum_g / n as u64) as u8;
  let mean_b = (sum_b / n as u64) as u8;

  let brightness = (mean_r as f64 + mean_g as f64 + mean_b as f64) / (3.0 * 255.0);
  let contrast = ((max_r - min_r) as f64 + (max_g - min_g) as f64 + (max_b - min_b) as f64)
    / (3.0 * 255.0);
  let max_ch = mean_r.max(mean_g).max(mean_b) as f64;
  let min_ch = mean_r.min(mean_g).min(mean_b) as f64;
  let saturation = if max_ch > 0.0 {
    (max_ch - min_ch) / max_ch
  } else {
    0.0
  };

  Ok(VisualCharacteristics {
    dominant_colors: vec![format!("#{mean_r:02X}{mean_g:02X}{mean_b:02X}")],
    brightness,
    contrast,
    saturation,
    motion_level: 0.0,
    composition_score: 0.5,
    sharpness: 0.7,
    noise_level: 0.1,
  })
}

fn default_visual() -> VisualCharacteristics {
  VisualCharacteristics {
    dominant_colors: vec!["#808080".to_string()],
    brightness: 0.5,
    contrast: 0.5,
    saturation: 0.3,
    motion_level: 0.0,
    composition_score: 0.5,
    sharpness: 0.7,
    noise_level: 0.1,
  }
}

// ─── тесты ───────────────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn analyzer_can_be_created() {
    let _a = HeadlessAnalyzer::new();
    let _b = HeadlessAnalyzer::default();
  }

  #[test]
  fn default_visual_sane() {
    let v = default_visual();
    assert!(v.brightness >= 0.0 && v.brightness <= 1.0);
    assert!(!v.dominant_colors.is_empty());
  }

  #[test]
  fn parse_frame_rate_fractional() {
    let fps = parse_frame_rate(Some("30000/1001")).unwrap();
    assert!((fps - 29.97).abs() < 0.01);
  }

  #[test]
  fn parse_frame_rate_integer() {
    let fps = parse_frame_rate(Some("25/1")).unwrap();
    assert!((fps - 25.0).abs() < 0.01);
  }

  #[test]
  fn missing_file_error() {
    let rt = tokio::runtime::Runtime::new().unwrap();
    let a = HeadlessAnalyzer::new();
    let err = rt.block_on(a.analyze(AnalyzeParams {
      input_path: "/nonexistent/video.mp4".into(),
      ..Default::default()
    }));
    assert!(err.is_err());
    assert!(err.unwrap_err().to_string().contains("не найден"));
  }
}

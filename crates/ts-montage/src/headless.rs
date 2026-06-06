//! Headless montage planner для агента (M3 #122).
//!
//! Принимает список медиафайлов + параметры, запускает ts-analysis для каждого,
//! строит `MontagePlan` через `PlanGenerator` и конвертирует в `ProjectSchema`.
//!
//! ```no_run
//! use ts_montage::headless::{HeadlessMontagePlanner, MontagePlanParams};
//! # async fn run() -> anyhow::Result<()> {
//! let plan = HeadlessMontagePlanner::new()
//!   .plan(MontagePlanParams {
//!     inputs: vec!["/data/clip1.mp4".to_string(), "/data/clip2.mp4".to_string()],
//!     platform: "tiktok".to_string(),
//!     duration_secs: 30.0,
//!     style: "social-media".to_string(),
//!     scene_count: 8,
//!   })
//!   .await?;
//! println!("{}", serde_json::to_string_pretty(&plan.project_schema)?);
//! # Ok(()) }
//! ```

use anyhow::Result;
use serde::{Deserialize, Serialize};

use crate::montage_planner::{
  types::{
    DetectedMoment, MomentCategory, MomentScores, MontageConfig, MontagePlan, MontageStyle,
    TransitionType,
  },
  services::PlanGenerator,
};

/// Входные параметры для `timeline montage-plan`.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MontagePlanParams {
  /// Список входных медиафайлов
  pub inputs: Vec<String>,
  /// Целевая платформа: youtube | tiktok | reels | shorts | instagram | square
  pub platform: String,
  /// Целевая длительность монтажа (секунды)
  pub duration_secs: f64,
  /// Стиль монтажа: social-media | documentary | cinematic | music-video | corporate | travel | wedding
  pub style: String,
  /// Число сцен для анализа каждого файла
  pub scene_count: usize,
}

/// Результат монтажного планирования.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MontagePlanResult {
  /// Сгенерированный план монтажа
  pub plan: MontagePlan,
  /// ProjectSchema JSON — готов к передаче в `timeline render`
  pub project_schema: serde_json::Value,
  /// Сколько исходных файлов проанализировано
  pub files_analyzed: usize,
  /// Суммарная длина найденных моментов (сек)
  pub total_moments_secs: f64,
  /// Время обработки (сек)
  pub elapsed_secs: f64,
}

/// Headless планировщик монтажа (без Tauri/ONNX, только ffprobe+ffmpeg).
pub struct HeadlessMontagePlanner;

impl HeadlessMontagePlanner {
  pub fn new() -> Self {
    Self
  }

}

impl Default for HeadlessMontagePlanner {
  fn default() -> Self {
    Self::new()
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────────────

/// Основная точка входа для ts-cli: принимает уже готовые JSON-анализы.
impl HeadlessMontagePlanner {
  /// Планирование на основе предварительно выполненных анализов (агент-friendly).
  pub async fn plan_from_analyses(
    &self,
    analyses: Vec<serde_json::Value>,
    source_files: Vec<String>,
    params: MontagePlanParams,
  ) -> Result<MontagePlanResult> {
    let t0 = std::time::Instant::now();

    let mut all_moments: Vec<DetectedMoment> = Vec::new();

    for (idx, analysis) in analyses.iter().enumerate() {
      let input = source_files.get(idx).map(|s| s.as_str()).unwrap_or("unknown");
      let duration = analysis["video"]["duration_secs"].as_f64().unwrap_or(0.0);

      if let Some(scenes) = analysis["scenes"].as_array() {
        for scene in scenes {
          let start = scene["start_secs"].as_f64().unwrap_or(0.0);
          let end = scene["end_secs"].as_f64().unwrap_or(start + 2.0);
          let brightness = scene["brightness"].as_f64().unwrap_or(0.5) as f32;
          let contrast = scene["contrast"].as_f64().unwrap_or(0.5) as f32;
          let saturation = scene["saturation"].as_f64().unwrap_or(0.5) as f32;
          let visual_score = (brightness * 0.3 + contrast * 0.4 + saturation * 0.3) * 100.0;
          let moment_duration = (end - start).max(0.5);

          let category = if visual_score > 70.0 {
            MomentCategory::Highlight
          } else if start < duration * 0.1 {
            MomentCategory::Opening
          } else if end > duration * 0.9 {
            MomentCategory::Closing
          } else {
            MomentCategory::BRoll
          };

          all_moments.push(DetectedMoment {
            timestamp: start,
            duration: moment_duration,
            category,
            scores: MomentScores {
              visual: visual_score.clamp(0.0, 100.0),
              technical: contrast * 100.0,
              emotional: saturation * 100.0,
              narrative: 50.0,
              action: brightness * 100.0,
              composition: visual_score.clamp(0.0, 100.0),
            },
            total_score: visual_score.clamp(0.0, 100.0),
            description: format!(
              "[{}] scene {:.1}s-{:.1}s",
              std::path::Path::new(input)
                .file_name()
                .and_then(|n| n.to_str())
                .unwrap_or(input),
              start,
              end
            ),
            tags: scene_tags(brightness, contrast, saturation),
          });
        }
      }
    }

    let total_moments_secs = all_moments.iter().map(|m| m.duration).sum();
    let files_analyzed = source_files.len();

    if all_moments.is_empty() {
      anyhow::bail!("montage-plan: нет сцен для планирования (все файлы пустые?)");
    }

    let config = MontageConfig {
      style: parse_style(&params.style),
      target_duration: params.duration_secs,
      quality_threshold: 0.3,
      diversity_weight: 0.4,
      rhythm_sync: false,
      max_cuts_per_minute: Some(platform_max_cuts(&params.platform)),
    };

    let mut generator = PlanGenerator::new();
    let plan = generator
      .generate_plan(&all_moments, &config, &source_files)
      .map_err(|e| anyhow::anyhow!("plan generation failed: {e}"))?;

    let project_schema = plan_to_project_schema(&plan, &params.platform);
    let elapsed_secs = t0.elapsed().as_secs_f64();

    Ok(MontagePlanResult {
      plan,
      project_schema,
      files_analyzed,
      total_moments_secs,
      elapsed_secs,
    })
  }
}

fn scene_tags(brightness: f32, contrast: f32, saturation: f32) -> Vec<String> {
  let mut tags = Vec::new();
  if brightness > 0.7 { tags.push("bright".to_string()); }
  if brightness < 0.3 { tags.push("dark".to_string()); }
  if contrast > 0.7 { tags.push("high-contrast".to_string()); }
  if saturation > 0.7 { tags.push("vivid".to_string()); }
  tags
}

fn parse_style(s: &str) -> MontageStyle {
  match s {
    "social-media" | "social" => MontageStyle::SocialMedia,
    "documentary" | "doc" => MontageStyle::Documentary,
    "cinematic" | "cinema" => MontageStyle::CinematicDrama,
    "music-video" | "music" => MontageStyle::MusicVideo,
    "corporate" => MontageStyle::Corporate,
    "travel" => MontageStyle::Travel,
    "wedding" => MontageStyle::Wedding,
    _ => MontageStyle::DynamicAction,
  }
}

fn platform_max_cuts(platform: &str) -> u32 {
  match platform {
    "tiktok" | "reels" | "shorts" => 40,
    "instagram" | "square" => 20,
    _ => 15,
  }
}

/// Конвертировать `MontagePlan` → `ProjectSchema` JSON.
///
/// ProjectSchema имеет сложную структуру — создаём упрощённый JSON-объект
/// совместимый с `ts-schema::ProjectSchema`.
fn plan_to_project_schema(plan: &MontagePlan, platform: &str) -> serde_json::Value {
  use serde_json::{json, Value};

  let (width, height, fps) = match platform {
    "tiktok" | "reels" | "shorts" => (1080u32, 1920u32, 30u32),
    "instagram" | "square" => (1080, 1080, 30),
    _ => (1920, 1080, 30),
  };

  // Clips → Video track items.
  // trackStart = сумма длительностей предыдущих клипов (без overlap переходов).
  let mut track_cursor = 0.0_f64;
  let clips: Vec<Value> = plan
    .clips
    .iter()
    .enumerate()
    .map(|(i, clip)| {
      let track_start = track_cursor;
      track_cursor += clip.duration;
      json!({
        "id": format!("clip-{i}"),
        "source": clip.source_file,
        "startTime": clip.start_time,
        "endTime": clip.end_time,
        "trackStart": track_start,
        "duration": clip.duration,
        "order": clip.order,
      })
    })
    .collect();

  // Transitions → transition markers
  let transitions: Vec<Value> = plan
    .transitions
    .iter()
    .enumerate()
    .map(|(i, t)| {
      json!({
        "id": format!("transition-{i}"),
        "type": transition_name(&t.transition_type),
        "duration": t.duration,
        "fromClip": t.from_clip,
        "toClip": t.to_clip,
      })
    })
    .collect();

  let tracks = vec![
    json!({
      "id": "video-track-0",
      "type": "video",
      "name": "Video",
      "clips": clips,
    }),
  ];

  json!({
    "id": plan.id,
    "name": plan.name,
    "timeline": {
      "fps": fps,
      "resolution": [width, height],
      "duration": plan.total_duration,
    },
    "tracks": tracks,
    "transitions": transitions,
    "settings": {
      "export": {
        "format": "mp4",
        "hardwareAcceleration": false,
      },
    },
    "meta": {
      "montage_plan_id": plan.id,
      "quality_score": plan.quality_score,
      "engagement_score": plan.engagement_score,
      "style": format!("{:?}", plan.style),
      "created_at": plan.created_at,
    },
  })
}

fn transition_name(t: &TransitionType) -> &'static str {
  match t {
    TransitionType::Cut => "cut",
    TransitionType::Fade => "fade",
    TransitionType::Dissolve => "dissolve",
    TransitionType::Wipe => "wipe",
    TransitionType::Zoom => "zoom",
    TransitionType::Slide => "slide",
    TransitionType::Spin => "spin",
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn parse_style_known() {
    assert_eq!(parse_style("social-media"), MontageStyle::SocialMedia);
    assert_eq!(parse_style("documentary"), MontageStyle::Documentary);
    assert_eq!(parse_style("cinematic"), MontageStyle::CinematicDrama);
    assert_eq!(parse_style("unknown"), MontageStyle::DynamicAction);
  }

  #[test]
  fn platform_max_cuts_values() {
    assert_eq!(platform_max_cuts("tiktok"), 40);
    assert_eq!(platform_max_cuts("youtube"), 15);
    assert_eq!(platform_max_cuts("instagram"), 20);
  }

  #[test]
  fn scene_tags_bright() {
    let tags = scene_tags(0.8, 0.5, 0.8);
    assert!(tags.contains(&"bright".to_string()));
    assert!(tags.contains(&"vivid".to_string()));
  }

  #[test]
  fn plan_to_project_schema_structure() {
    let plan = MontagePlan {
      id: "test-plan".to_string(),
      name: "Test Montage".to_string(),
      style: MontageStyle::SocialMedia,
      total_duration: 30.0,
      clips: vec![],
      transitions: vec![],
      quality_score: 0.8,
      engagement_score: 0.7,
      created_at: "2026-06-07T00:00:00Z".to_string(),
    };
    let schema = plan_to_project_schema(&plan, "tiktok");
    assert_eq!(schema["timeline"]["fps"], 30);
    assert_eq!(schema["timeline"]["resolution"][0], 1080);
    assert_eq!(schema["timeline"]["resolution"][1], 1920);
    let qs = schema["meta"]["quality_score"].as_f64().unwrap();
    assert!((qs - 0.8_f64).abs() < 0.001, "quality_score={qs}");
  }

  #[tokio::test]
  async fn plan_from_analyses_empty_scenes() {
    let planner = HeadlessMontagePlanner::new();
    let analysis = serde_json::json!({
      "video": { "duration_secs": 10.0 },
      "scenes": [],
      "content": { "quality_overall": 0.7 }
    });
    let result = planner
      .plan_from_analyses(
        vec![analysis],
        vec!["test.mp4".to_string()],
        MontagePlanParams {
          inputs: vec!["test.mp4".to_string()],
          platform: "youtube".to_string(),
          duration_secs: 10.0,
          style: "documentary".to_string(),
          scene_count: 4,
        },
      )
      .await;
    // Нет сцен → ошибка InsufficientContent или наша ошибка
    assert!(result.is_err());
  }

  #[tokio::test]
  async fn plan_from_analyses_with_scenes() {
    let planner = HeadlessMontagePlanner::new();
    let analysis = serde_json::json!({
      "video": { "duration_secs": 30.0 },
      "scenes": [
        { "index": 0, "start_secs": 0.0, "end_secs": 5.0, "brightness": 0.6, "contrast": 0.7, "saturation": 0.5 },
        { "index": 1, "start_secs": 5.0, "end_secs": 10.0, "brightness": 0.8, "contrast": 0.6, "saturation": 0.8 },
        { "index": 2, "start_secs": 10.0, "end_secs": 15.0, "brightness": 0.5, "contrast": 0.5, "saturation": 0.5 },
        { "index": 3, "start_secs": 15.0, "end_secs": 20.0, "brightness": 0.7, "contrast": 0.8, "saturation": 0.6 },
      ],
      "content": { "quality_overall": 0.75 }
    });
    let result = planner
      .plan_from_analyses(
        vec![analysis],
        vec!["/data/clip.mp4".to_string()],
        MontagePlanParams {
          inputs: vec!["/data/clip.mp4".to_string()],
          platform: "tiktok".to_string(),
          duration_secs: 15.0,
          style: "social-media".to_string(),
          scene_count: 4,
        },
      )
      .await;
    assert!(result.is_ok(), "plan_from_analyses failed: {:?}", result.err());
    let r = result.unwrap();
    assert_eq!(r.files_analyzed, 1);
    assert!(r.elapsed_secs >= 0.0);
    // ProjectSchema должна содержать tracks и timeline
    assert!(r.project_schema["tracks"].is_array());
    assert_eq!(r.project_schema["timeline"]["fps"], 30);
  }

  #[tokio::test]
  async fn plan_from_analyses_multiple_files() {
    let planner = HeadlessMontagePlanner::new();
    let mk = |duration: f64| serde_json::json!({
      "video": { "duration_secs": duration },
      "scenes": [
        { "start_secs": 0.0, "end_secs": duration / 2.0, "brightness": 0.6, "contrast": 0.7, "saturation": 0.5 },
        { "start_secs": duration / 2.0, "end_secs": duration, "brightness": 0.8, "contrast": 0.6, "saturation": 0.8 },
      ],
      "content": { "quality_overall": 0.75 }
    });
    let result = planner
      .plan_from_analyses(
        vec![mk(20.0), mk(30.0)],
        vec!["/data/a.mp4".to_string(), "/data/b.mp4".to_string()],
        MontagePlanParams {
          inputs: vec!["/data/a.mp4".to_string(), "/data/b.mp4".to_string()],
          platform: "youtube".to_string(),
          duration_secs: 20.0,
          style: "documentary".to_string(),
          scene_count: 4,
        },
      )
      .await;
    assert!(result.is_ok(), "multi-file plan failed: {:?}", result.err());
    let r = result.unwrap();
    assert_eq!(r.files_analyzed, 2);
  }

  #[test]
  fn track_start_accumulates_correctly() {
    use crate::montage_planner::types::{
      ClipAdjustments, DetectedMoment, MomentCategory, MomentScores, MontageClip, MontageStyle,
    };
    let mk_clip = |order: u32, start: f64, end: f64| MontageClip {
      id: format!("c{order}"),
      source_file: "file.mp4".to_string(),
      start_time: start,
      end_time: end,
      duration: end - start,
      moment: DetectedMoment {
        timestamp: start,
        duration: end - start,
        category: MomentCategory::BRoll,
        scores: MomentScores { visual: 50.0, technical: 50.0, emotional: 50.0, narrative: 50.0, action: 50.0, composition: 50.0 },
        total_score: 50.0,
        description: String::new(),
        tags: vec![],
      },
      adjustments: ClipAdjustments { speed_multiplier: None, color_correction: None, stabilization: false, crop: None, fade_in: None, fade_out: None },
      order,
    };
    let plan = MontagePlan {
      id: "t".to_string(),
      name: "T".to_string(),
      style: MontageStyle::Documentary,
      total_duration: 15.0,
      clips: vec![mk_clip(0, 0.0, 5.0), mk_clip(1, 10.0, 13.0), mk_clip(2, 2.0, 6.0)],
      transitions: vec![],
      quality_score: 0.5,
      engagement_score: 0.5,
      created_at: "2026-06-07T00:00:00Z".to_string(),
    };
    let schema = plan_to_project_schema(&plan, "youtube");
    let clips = schema["tracks"][0]["clips"].as_array().unwrap();
    // trackStart[0] = 0, trackStart[1] = 5, trackStart[2] = 5+3 = 8
    let ts0 = clips[0]["trackStart"].as_f64().unwrap();
    let ts1 = clips[1]["trackStart"].as_f64().unwrap();
    let ts2 = clips[2]["trackStart"].as_f64().unwrap();
    assert!((ts0 - 0.0).abs() < 0.001, "ts0={ts0}");
    assert!((ts1 - 5.0).abs() < 0.001, "ts1={ts1}");
    assert!((ts2 - 8.0).abs() < 0.001, "ts2={ts2}");
  }
}

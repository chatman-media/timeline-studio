// Removed unused imports
use crate::person_database::{PersonProfile, SimilaritySearchResult};
use crate::types::FaceEmbedding;
use ts_state_tauri::project_state::{ProjectState, SubtitleResource};
use ts_state_tauri::ProjectEvent;
use chrono::Utc;
use serde::{Deserialize, Serialize};
use serde_json::{json, Map, Value};
use tauri::State;

#[tauri::command]
pub async fn get_all_persons(
  _state: State<'_, crate::commands::RecognitionState>,
) -> Result<Vec<PersonProfile>, String> {
  // TODO: Implement get_all_persons functionality
  Ok(vec![])
}

#[tauri::command]
pub async fn get_person(
  _person_id: String,
  _state: State<'_, crate::commands::RecognitionState>,
) -> Result<Option<PersonProfile>, String> {
  // TODO: Implement get_person functionality
  Ok(None)
}

#[tauri::command]
pub async fn update_person(
  _person_id: String,
  profile: PersonProfile,
  _state: State<'_, crate::commands::RecognitionState>,
) -> Result<PersonProfile, String> {
  // TODO: Implement update_person functionality
  Ok(profile)
}

#[tauri::command]
pub async fn delete_person(
  _person_id: String,
  _state: State<'_, crate::commands::RecognitionState>,
) -> Result<(), String> {
  // TODO: Implement delete_person functionality
  Ok(())
}

#[tauri::command]
pub async fn get_video_persons(
  _clip_id: String,
  _state: State<'_, crate::commands::RecognitionState>,
) -> Result<Vec<PersonProfile>, String> {
  // TODO: Implement get_video_persons functionality
  Ok(vec![])
}

#[tauri::command]
pub async fn search_similar_persons(
  _embedding: Vec<f32>,
  _limit: usize,
  _state: State<'_, crate::commands::RecognitionState>,
) -> Result<Vec<SimilaritySearchResult>, String> {
  // TODO: Implement search_similar_persons functionality
  Ok(vec![])
}

#[tauri::command]
pub async fn initialize_recognition_services(
  _state: State<'_, crate::commands::RecognitionState>,
) -> Result<(), String> {
  // TODO: Implement initialize_recognition_services functionality
  Ok(())
}

#[tauri::command]
pub async fn create_person(
  profile: PersonProfile,
  _state: State<'_, crate::commands::RecognitionState>,
) -> Result<PersonProfile, String> {
  // TODO: Implement create_person functionality
  Ok(profile)
}

#[tauri::command]
pub async fn add_face_embedding(
  _person_id: String,
  _embedding: FaceEmbedding,
  _state: State<'_, crate::commands::RecognitionState>,
) -> Result<(), String> {
  // TODO: Implement add_face_embedding functionality
  Ok(())
}

#[tauri::command]
pub async fn add_person_appearance(
  _person_id: String,
  _appearance_data: String,
  _state: State<'_, crate::commands::RecognitionState>,
) -> Result<(), String> {
  // TODO: Implement add_person_appearance functionality
  Ok(())
}

#[tauri::command]
pub async fn add_person_thumbnail(
  _person_id: String,
  _thumbnail_path: String,
  _state: State<'_, crate::commands::RecognitionState>,
) -> Result<(), String> {
  // TODO: Implement add_person_thumbnail functionality
  Ok(())
}

#[tauri::command]
pub async fn get_person_database_stats(
  _state: State<'_, crate::commands::RecognitionState>,
) -> Result<String, String> {
  // TODO: Implement get_person_database_stats functionality
  Ok("{\"total_persons\": 0, \"total_embeddings\": 0}".to_string())
}

#[tauri::command]
pub async fn set_similarity_threshold(
  _threshold: f32,
  _state: State<'_, crate::commands::RecognitionState>,
) -> Result<(), String> {
  // TODO: Implement set_similarity_threshold functionality
  Ok(())
}

/// Initialize person database - критическая команда
#[tauri::command]
pub async fn init_person_database(
  database_path: Option<String>,
  _state: State<'_, crate::commands::RecognitionState>,
) -> Result<String, String> {
  let db_path = match database_path {
    Some(path) => path,
    None => {
      // Use default app data directory
      let app_data_dir = dirs::data_dir()
        .ok_or("Failed to get app data directory")?
        .join("timeline-studio");

      std::fs::create_dir_all(&app_data_dir)
        .map_err(|e| format!("Failed to create app data directory: {}", e))?;

      app_data_dir
        .join("persons.db")
        .to_string_lossy()
        .to_string()
    }
  };

  // Initialize database file if it doesn't exist
  if !std::path::Path::new(&db_path).exists() {
    std::fs::File::create(&db_path)
      .map_err(|e| format!("Failed to create database file: {}", e))?;
  }

  log::info!("Person database initialized at: {}", db_path);
  Ok(db_path)
}

/// Cancel media processing - важная для UX
#[tauri::command]
pub async fn cancel_media_processing(job_id: String) -> Result<bool, String> {
  log::info!("Cancelling media processing job: {}", job_id);

  // TODO: Implement actual cancellation logic
  // For now, just return success
  Ok(true)
}

// get_render_job и set_hardware_acceleration уже существуют в video_compiler модуле

/// Log AI performance metric
#[tauri::command]
pub async fn log_ai_performance_metric(
  metric_name: String,
  value: f64,
  tags: Option<std::collections::HashMap<String, String>>,
) -> Result<(), String> {
  let tags_str = tags
    .map(|t| format!("{:?}", t))
    .unwrap_or_else(|| "{}".to_string());
  log::info!(
    "AI Performance Metric - {}: {} (tags: {})",
    metric_name,
    value,
    tags_str
  );

  // TODO: Implement actual metrics logging (e.g., to telemetry system)
  Ok(())
}

// execute_batch_commands уже существует в state модуле

/// Generate thumbnail using FFmpeg
#[tauri::command]
pub async fn ffmpeg_generate_thumbnail(
  video_path: String,
  output_path: String,
  timestamp: f64,
  width: Option<u32>,
  height: Option<u32>,
) -> Result<String, String> {
  let w = width.unwrap_or(320);
  let h = height.unwrap_or(240);

  log::info!(
    "Generating thumbnail: {} -> {} at {}s ({}x{})",
    video_path,
    output_path,
    timestamp,
    w,
    h
  );

  // TODO: Implement actual FFmpeg thumbnail generation
  // For now, return the output path
  Ok(output_path)
}

/// Update timeline subtitles
#[tauri::command]
pub async fn update_timeline_subtitles(
  state_manager: State<'_, ts_state_tauri::StateManager>,
  track_id: String,
  subtitles: Vec<SubtitleEntry>,
) -> Result<SubtitleUpdateSummary, String> {
  log::info!(
    "Updating subtitles for track {} with {} entries",
    track_id,
    subtitles.len()
  );

  let summary = {
    let mut state = state_manager.project_state().write().await;
    apply_timeline_subtitles_to_state(&mut state, track_id.clone(), subtitles)?
  };

  state_manager
    .event_bus()
    .publish(
      ProjectEvent::SubtitleTrackUpdated {
        track_id: summary.track_id.clone(),
        resource_id: summary.resource_id.clone(),
        subtitle_count: summary.subtitle_count,
      },
      "subtitle_command".to_string(),
      summary.version,
    )
    .await
    .ok();

  Ok(summary)
}

// Helper structures for new commands

// RenderJobInfo, BatchCommand и связанные структуры перенесены в соответствующие модули

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SubtitleEntry {
  #[serde(default)]
  pub id: Option<String>,
  #[serde(alias = "startTime")]
  pub start_time: f64,
  #[serde(alias = "endTime")]
  pub end_time: f64,
  pub text: String,
  #[serde(default)]
  pub style: Option<Value>,
  #[serde(default)]
  pub speaker: Option<String>,
  #[serde(default)]
  pub confidence: Option<f64>,
  #[serde(default)]
  pub language: Option<String>,
  #[serde(flatten)]
  pub metadata: Map<String, Value>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SubtitleUpdateSummary {
  pub track_id: String,
  pub resource_id: String,
  pub subtitle_count: u32,
  pub version: u32,
}

fn apply_timeline_subtitles_to_state(
  state: &mut ProjectState,
  track_id: String,
  subtitles: Vec<SubtitleEntry>,
) -> Result<SubtitleUpdateSummary, String> {
  let trimmed_track_id = track_id.trim();
  if trimmed_track_id.is_empty() {
    return Err("track_id is required for updating timeline subtitles".to_string());
  }

  let normalized_subtitles = normalize_subtitle_entries(subtitles)?;
  let subtitle_count = normalized_subtitles.len() as u32;
  let project = state
    .project
    .as_mut()
    .ok_or_else(|| "No project open for subtitle update".to_string())?;
  let resource_id = format!("timeline-subtitles:{}", trimmed_track_id);
  let updated_at = Utc::now();

  let resource = SubtitleResource {
    id: resource_id.clone(),
    name: format!("Timeline subtitles ({})", trimmed_track_id),
    style_id: trimmed_track_id.to_string(),
    data: json!({
      "kind": "timeline_subtitle_segments",
      "track_id": trimmed_track_id,
      "subtitles": normalized_subtitles,
      "updated_at": updated_at.to_rfc3339(),
    }),
    added_at: updated_at.timestamp() as f64,
  };

  project.subtitles_pool.insert(resource_id.clone(), resource);
  state.mark_dirty();

  Ok(SubtitleUpdateSummary {
    track_id: trimmed_track_id.to_string(),
    resource_id,
    subtitle_count,
    version: state.version,
  })
}

fn normalize_subtitle_entries(subtitles: Vec<SubtitleEntry>) -> Result<Vec<Value>, String> {
  subtitles
    .into_iter()
    .enumerate()
    .map(|(index, subtitle)| normalize_subtitle_entry(index, subtitle))
    .collect()
}

fn normalize_subtitle_entry(index: usize, subtitle: SubtitleEntry) -> Result<Value, String> {
  if !subtitle.start_time.is_finite() {
    return Err(format!("subtitles[{}].start_time must be finite", index));
  }
  if !subtitle.end_time.is_finite() {
    return Err(format!("subtitles[{}].end_time must be finite", index));
  }
  if subtitle.end_time <= subtitle.start_time {
    return Err(format!(
      "subtitles[{}].end_time must be greater than start_time",
      index
    ));
  }

  let text = subtitle.text.trim();
  if text.is_empty() {
    return Err(format!("subtitles[{}].text cannot be empty", index));
  }

  let mut entry = Map::new();
  entry.insert(
    "id".to_string(),
    Value::String(
      subtitle
        .id
        .filter(|id| !id.trim().is_empty())
        .unwrap_or_else(|| format!("subtitle-{}", index + 1)),
    ),
  );
  entry.insert("start_time".to_string(), json!(subtitle.start_time));
  entry.insert("end_time".to_string(), json!(subtitle.end_time));
  entry.insert("text".to_string(), Value::String(text.to_string()));

  if let Some(style) = subtitle.style {
    entry.insert("style".to_string(), style);
  }
  if let Some(speaker) = subtitle
    .speaker
    .filter(|speaker| !speaker.trim().is_empty())
  {
    entry.insert("speaker".to_string(), Value::String(speaker));
  }
  if let Some(confidence) = subtitle.confidence {
    entry.insert("confidence".to_string(), json!(confidence));
  }
  if let Some(language) = subtitle
    .language
    .filter(|language| !language.trim().is_empty())
  {
    entry.insert("language".to_string(), Value::String(language));
  }

  for (key, value) in subtitle.metadata {
    entry.entry(key).or_insert(value);
  }

  Ok(Value::Object(entry))
}

// Helper functions перенесены в соответствующие модули

#[cfg(test)]
mod tests {
  use super::*;
  use ts_state_tauri::project_state::{ProjectSettings, Resolution};

  fn project_state_with_project() -> ProjectState {
    let mut state = ProjectState::default();
    state.create_project(
      "Subtitle test".to_string(),
      ProjectSettings {
        resolution: Resolution {
          width: 1920,
          height: 1080,
        },
        frame_rate: 30.0,
        audio_sample_rate: 48_000,
        audio_channels: 2,
      },
    );
    state
  }

  #[test]
  fn update_timeline_subtitles_persists_segments_in_project_state() {
    let mut state = project_state_with_project();

    let summary = apply_timeline_subtitles_to_state(
      &mut state,
      "subtitle-track".to_string(),
      vec![SubtitleEntry {
        id: Some("caption-1".to_string()),
        start_time: 0.5,
        end_time: 2.5,
        text: "Hello from Whisper".to_string(),
        style: None,
        speaker: Some("Speaker 1".to_string()),
        confidence: Some(0.91),
        language: Some("en".to_string()),
        metadata: Map::new(),
      }],
    )
    .expect("subtitle update should persist");

    assert_eq!(summary.track_id, "subtitle-track");
    assert_eq!(summary.subtitle_count, 1);

    let project = state.project.as_ref().expect("project exists");
    let resource = project
      .subtitles_pool
      .get("timeline-subtitles:subtitle-track")
      .expect("subtitle resource exists");

    assert_eq!(resource.style_id, "subtitle-track");
    assert_eq!(resource.data["kind"], "timeline_subtitle_segments");
    assert_eq!(resource.data["subtitles"][0]["text"], "Hello from Whisper");
    assert!(project.metadata.is_dirty);
  }

  #[test]
  fn update_timeline_subtitles_rejects_invalid_timing() {
    let mut state = project_state_with_project();

    let result = apply_timeline_subtitles_to_state(
      &mut state,
      "subtitle-track".to_string(),
      vec![SubtitleEntry {
        id: None,
        start_time: 3.0,
        end_time: 1.0,
        text: "Invalid".to_string(),
        style: None,
        speaker: None,
        confidence: None,
        language: None,
        metadata: Map::new(),
      }],
    );

    assert!(result.is_err());
    assert!(result.unwrap_err().contains("end_time"));
  }
}

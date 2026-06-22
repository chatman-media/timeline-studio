//! Типы для команд управления проектами

use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// Результат валидации проекта
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProjectValidationResult {
  pub is_valid: bool,
  pub errors: Vec<String>,
  pub warnings: Vec<String>,
  pub info: Vec<String>,
}

/// Статистика анализа проекта
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProjectAnalysisStats {
  pub duration: f64,
  pub tracks: usize,
  pub clips: usize,
  pub unique_media_files: usize,
  pub effects: usize,
  pub transitions: usize,
  pub subtitles: usize,
  pub resolution: ProjectResolution,
  pub frame_rate: u32,
  pub export_format: String,
}

/// Разрешение проекта для анализа
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProjectResolution {
  pub width: u32,
  pub height: u32,
}

/// Информация о доступности медиафайлов
pub type MediaAvailabilityMap = HashMap<String, bool>;

/// Маппинг путей медиафайлов для обновления
pub type MediaPathMapping = HashMap<String, String>;

/// Параметры для разделения проекта
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProjectSplitParams {
  pub split_points: Vec<f64>,
}

/// Параметры для объединения проектов
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProjectMergeParams {
  pub time_offset: f64,
}

/// Формат экспорта субтитров
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum SubtitleFormat {
  Srt,
  Vtt,
}

impl SubtitleFormat {
  pub fn from_string(format: &str) -> Option<Self> {
    match format.to_lowercase().as_str() {
      "srt" => Some(Self::Srt),
      "vtt" => Some(Self::Vtt),
      _ => None,
    }
  }

  pub fn to_string(&self) -> &'static str {
    match self {
      Self::Srt => "srt",
      Self::Vtt => "vtt",
    }
  }
}

/// Информация о треке для операций
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TrackOperationInfo {
  pub operation: String,
  pub params: serde_json::Value,
}

/// Тип информации о клипе
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ClipInfoType {
  TimelineDuration,
  ContainsTime,
}

impl ClipInfoType {
  pub fn from_string(info_type: &str) -> Option<Self> {
    match info_type {
      "timeline_duration" => Some(Self::TimelineDuration),
      "contains_time" => Some(Self::ContainsTime),
      _ => None,
    }
  }
}

/// Результат валидации субтитров
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SubtitleValidationResult {
  pub valid: bool,
  pub duration: f64,
  pub error: Option<String>,
}

/// Информация о резервной копии проекта
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProjectBackupInfo {
  pub backup_path: String,
  pub created_at: chrono::DateTime<chrono::Utc>,
  pub project_name: String,
  pub file_size: u64,
}

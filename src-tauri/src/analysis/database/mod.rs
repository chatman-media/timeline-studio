// Analysis database - расширение существующей person database

use anyhow::{Context, Result};
use chrono::{DateTime, Utc};
use rusqlite::{Connection, OptionalExtension};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::Mutex;
use uuid::Uuid;

use crate::analysis::models::*;
use crate::recognition::person_database::PersonDatabase;

pub mod migrations;
pub mod queries;

/// Расширенная база данных анализа - интегрируется с PersonDatabase
pub struct AnalysisDatabase {
  conn: Arc<Mutex<Connection>>,
  person_db: Arc<PersonDatabase>, // Используем существующую person database
}

impl AnalysisDatabase {
  /// Создание новой базы данных с интеграцией person database
  pub async fn new(db_path: &str, person_db: Arc<PersonDatabase>) -> Result<Self> {
    let conn = Connection::open(db_path).context("Failed to open analysis database")?;

    let db = Self {
      conn: Arc::new(Mutex::new(conn)),
      person_db,
    };

    // Выполняем миграции
    db.run_migrations().await?;

    Ok(db)
  }

  /// Выполнение миграций
  async fn run_migrations(&self) -> Result<()> {
    let conn = self.conn.lock().await;
    migrations::run_all_migrations(&*conn)?;
    Ok(())
  }

  /// Создание нового проекта анализа
  pub async fn create_project(&self, mut project: AnalysisProject) -> Result<AnalysisProject> {
    let conn = self.conn.lock().await;

    project.id = Uuid::new_v4();
    project.created_at = Utc::now();
    project.updated_at = project.created_at;

    conn
      .execute(
        "INSERT INTO analysis_projects (
                id, name, description, created_at, updated_at, status, progress,
                error_message, config, total_files, total_duration, processed_files,
                total_scenes, total_persons, total_key_moments, average_quality,
                tags, location, recording_date, metadata
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        rusqlite::params![
          project.id.to_string(),
          project.name,
          project.description,
          project.created_at.to_rfc3339(),
          project.updated_at.to_rfc3339(),
          serde_json::to_string(&project.status)?,
          project.progress,
          project.error_message,
          serde_json::to_string(&project.config)?,
          project.total_files,
          project.total_duration,
          project.processed_files,
          project.total_scenes,
          project.total_persons,
          project.total_key_moments,
          project.average_quality,
          serde_json::to_string(&project.tags)?,
          project.location,
          project.recording_date.map(|d| d.to_rfc3339()),
          serde_json::to_string(&project.metadata)?,
        ],
      )
      .context("Failed to insert analysis project")?;

    Ok(project)
  }

  /// Получение проекта по ID
  pub async fn get_project(&self, project_id: &Uuid) -> Result<Option<AnalysisProject>> {
    let conn = self.conn.lock().await;

    let project = conn
      .query_row(
        "SELECT id, name, description, created_at, updated_at, status, progress,
                    error_message, config, total_files, total_duration, processed_files,
                    total_scenes, total_persons, total_key_moments, average_quality,
                    tags, location, recording_date, metadata
             FROM analysis_projects WHERE id = ?",
        rusqlite::params![project_id.to_string()],
        |row| {
          Ok(AnalysisProject {
            id: Uuid::parse_str(&row.get::<_, String>(0)?)?,
            name: row.get(1)?,
            description: row.get(2)?,
            created_at: DateTime::parse_from_rfc3339(&row.get::<_, String>(3)?)?
              .with_timezone(&Utc),
            updated_at: DateTime::parse_from_rfc3339(&row.get::<_, String>(4)?)?
              .with_timezone(&Utc),
            status: serde_json::from_str(&row.get::<_, String>(5)?)?,
            progress: row.get(6)?,
            error_message: row.get(7)?,
            config: serde_json::from_str(&row.get::<_, String>(8)?)?,
            total_files: row.get(9)?,
            total_duration: row.get(10)?,
            processed_files: row.get(11)?,
            total_scenes: row.get(12)?,
            total_persons: row.get(13)?,
            total_key_moments: row.get(14)?,
            average_quality: row.get(15)?,
            tags: serde_json::from_str(&row.get::<_, String>(16)?)?,
            location: row.get(17)?,
            recording_date: row
              .get::<_, Option<String>>(18)?
              .map(|s| DateTime::parse_from_rfc3339(&s))
              .transpose()?
              .map(|dt| dt.with_timezone(&Utc)),
            metadata: serde_json::from_str(&row.get::<_, String>(19)?)?,
          })
        },
      )
      .optional()
      .context("Failed to query analysis project")?;

    Ok(project)
  }

  /// Обновление прогресса проекта
  pub async fn update_project_progress(
    &self,
    project_id: &Uuid,
    progress: f32,
    status: AnalysisStatus,
  ) -> Result<()> {
    let conn = self.conn.lock().await;

    conn
      .execute(
        "UPDATE analysis_projects SET progress = ?, status = ?, updated_at = ? WHERE id = ?",
        rusqlite::params![
          progress,
          serde_json::to_string(&status)?,
          Utc::now().to_rfc3339(),
          project_id.to_string()
        ],
      )
      .context("Failed to update project progress")?;

    Ok(())
  }

  /// Добавление медиафайла в проект
  pub async fn add_media_file(&self, mut file: AnalysisMediaFile) -> Result<AnalysisMediaFile> {
    let conn = self.conn.lock().await;

    file.id = Uuid::new_v4();
    file.created_at = Utc::now();

    conn
      .execute(
        "INSERT INTO analysis_media_files (
                id, project_id, file_path, file_name, file_size, media_type,
                duration, resolution_width, resolution_height, fps, codec, format,
                processing_status, processing_progress, processed_at,
                scenes_count, persons_count, key_moments_count, overall_quality,
                average_motion, average_brightness, audio_clarity, has_speech, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        rusqlite::params![
          file.id.to_string(),
          file.project_id.to_string(),
          file.file_path,
          file.file_name,
          file.file_size,
          serde_json::to_string(&file.media_type)?,
          file.duration,
          file.resolution.as_ref().map(|r| r.width),
          file.resolution.as_ref().map(|r| r.height),
          file.fps,
          file.codec,
          file.format,
          serde_json::to_string(&file.processing_status)?,
          file.processing_progress,
          file.processed_at.map(|d| d.to_rfc3339()),
          file.scenes_count,
          file.persons_count,
          file.key_moments_count,
          file.overall_quality,
          file.average_motion,
          file.average_brightness,
          file.audio_clarity,
          file.has_speech,
          file.created_at.to_rfc3339(),
        ],
      )
      .context("Failed to insert media file")?;

    Ok(file)
  }

  /// Получение файлов проекта
  pub async fn get_project_files(&self, project_id: &Uuid) -> Result<Vec<AnalysisMediaFile>> {
    let conn = self.conn.lock().await;

    let mut stmt = conn.prepare(
      "SELECT id, project_id, file_path, file_name, file_size, media_type,
                    duration, resolution_width, resolution_height, fps, codec, format,
                    processing_status, processing_progress, processed_at,
                    scenes_count, persons_count, key_moments_count, overall_quality,
                    average_motion, average_brightness, audio_clarity, has_speech, created_at
             FROM analysis_media_files WHERE project_id = ? ORDER BY created_at",
    )?;

    let files = stmt
      .query_map(rusqlite::params![project_id.to_string()], |row| {
        let resolution = match (row.get::<_, Option<u32>>(7)?, row.get::<_, Option<u32>>(8)?) {
          (Some(width), Some(height)) => Some(Resolution { width, height }),
          _ => None,
        };

        Ok(AnalysisMediaFile {
          id: Uuid::parse_str(&row.get::<_, String>(0)?)?,
          project_id: Uuid::parse_str(&row.get::<_, String>(1)?)?,
          file_path: row.get(2)?,
          file_name: row.get(3)?,
          file_size: row.get(4)?,
          media_type: serde_json::from_str(&row.get::<_, String>(5)?)?,
          duration: row.get(6)?,
          resolution,
          fps: row.get(9)?,
          codec: row.get(10)?,
          format: row.get(11)?,
          processing_status: serde_json::from_str(&row.get::<_, String>(12)?)?,
          processing_progress: row.get(13)?,
          processed_at: row
            .get::<_, Option<String>>(14)?
            .map(|s| DateTime::parse_from_rfc3339(&s))
            .transpose()?
            .map(|dt| dt.with_timezone(&Utc)),
          scenes_count: row.get(15)?,
          persons_count: row.get(16)?,
          key_moments_count: row.get(17)?,
          overall_quality: row.get(18)?,
          average_motion: row.get(19)?,
          average_brightness: row.get(20)?,
          audio_clarity: row.get(21)?,
          has_speech: row.get(22)?,
          created_at: DateTime::parse_from_rfc3339(&row.get::<_, String>(23)?)?.with_timezone(&Utc),
        })
      })?
      .collect::<Result<Vec<_>, _>>()?;

    Ok(files)
  }

  /// Создание сцены
  pub async fn create_scene(&self, mut scene: AnalysisScene) -> Result<AnalysisScene> {
    let conn = self.conn.lock().await;

    scene.id = Uuid::new_v4();
    scene.created_at = Utc::now();

    conn.execute(
            "INSERT INTO analysis_scenes (
                id, project_id, file_id, start_time, end_time, duration,
                scene_type, sub_type, confidence, dominant_colors, brightness,
                contrast, saturation, motion_level, composition_score,
                rule_of_thirds_compliance, visual_balance, quality_score,
                sharpness, noise_level, stability, persons_present,
                objects_detected, has_text, has_faces, emotional_tone,
                energy_level, auto_description, user_description, tags,
                user_rating, representative_frame, keyframes, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            rusqlite::params![
                scene.id.to_string(),
                scene.project_id.to_string(),
                scene.file_id.to_string(),
                scene.start_time,
                scene.end_time,
                scene.duration,
                serde_json::to_string(&scene.scene_type)?,
                scene.sub_type,
                scene.confidence, // ConfidenceLevel теперь f32
                serde_json::to_string(&scene.dominant_colors)?,
                scene.brightness,
                scene.contrast,
                scene.saturation,
                scene.motion_level,
                scene.composition_score,
                scene.rule_of_thirds_compliance,
                scene.visual_balance,
                scene.quality_score, // QualityScore теперь f32
                scene.sharpness,
                scene.noise_level,
                scene.stability,
                serde_json::to_string(&scene.persons_present)?,
                serde_json::to_string(&scene.objects_detected)?,
                scene.has_text,
                scene.has_faces,
                scene.emotional_tone.as_ref().map(|e| serde_json::to_string(e)).transpose()?,
                scene.energy_level,
                scene.auto_description,
                scene.user_description,
                serde_json::to_string(&scene.tags)?,
                scene.user_rating,
                scene.representative_frame,
                serde_json::to_string(&scene.keyframes)?,
                scene.created_at.to_rfc3339(),
            ]
        ).context("Failed to insert scene")?;

    Ok(scene)
  }

  /// Получение сцен проекта
  pub async fn get_project_scenes(&self, project_id: &Uuid) -> Result<Vec<AnalysisScene>> {
    let conn = self.conn.lock().await;
    queries::get_project_scenes(&*conn, project_id)
  }

  /// Создание ключевого момента
  pub async fn create_key_moment(&self, mut moment: KeyMoment) -> Result<KeyMoment> {
    let conn = self.conn.lock().await;

    moment.id = Uuid::new_v4();
    moment.created_at = Utc::now();
    moment.updated_at = moment.created_at;

    conn.execute(
            "INSERT INTO key_moments (
                id, project_id, file_id, scene_id, timestamp, duration,
                moment_type, sub_type, importance_score, scoring_factors,
                description, auto_description, user_notes, involved_persons,
                involved_objects, associated_emotions, content_tags, mood_tags,
                technical_tags, user_rating, is_bookmarked, is_hidden,
                thumbnail_frame, preview_start, preview_end, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            rusqlite::params![
                moment.id.to_string(),
                moment.project_id.to_string(),
                moment.file_id.to_string(),
                moment.scene_id.map(|id| id.to_string()),
                moment.timestamp,
                moment.duration,
                serde_json::to_string(&moment.moment_type)?,
                moment.sub_type,
                moment.importance_score,
                serde_json::to_string(&moment.scoring_factors)?,
                moment.description,
                moment.auto_description,
                moment.user_notes,
                serde_json::to_string(&moment.involved_persons)?,
                serde_json::to_string(&moment.involved_objects)?,
                serde_json::to_string(&moment.associated_emotions)?,
                serde_json::to_string(&moment.content_tags)?,
                serde_json::to_string(&moment.mood_tags)?,
                serde_json::to_string(&moment.technical_tags)?,
                moment.user_rating,
                moment.is_bookmarked,
                moment.is_hidden,
                moment.thumbnail_frame,
                moment.preview_start,
                moment.preview_end,
                moment.created_at.to_rfc3339(),
                moment.updated_at.to_rfc3339(),
            ]
        ).context("Failed to insert key moment")?;

    Ok(moment)
  }

  /// Получение ключевых моментов проекта
  pub async fn get_project_key_moments(&self, project_id: &Uuid) -> Result<Vec<KeyMoment>> {
    let conn = self.conn.lock().await;
    queries::get_project_key_moments(&*conn, project_id)
  }

  /// Связывание персоны с проектом
  pub async fn create_project_person_association(
    &self,
    association: ProjectPersonAssociation,
  ) -> Result<()> {
    let conn = self.conn.lock().await;

    conn
      .execute(
        "INSERT OR REPLACE INTO project_person_associations (
                project_id, person_id, total_screen_time, total_appearances,
                scenes_present, key_moments_involved, importance, character_role,
                first_appearance, last_appearance, most_prominent_scene,
                dominant_emotions, emotional_range, emotional_stability,
                average_quality, best_quality_frame, lighting_consistency,
                user_notes, user_tags, is_main_character, custom_role,
                created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        rusqlite::params![
          association.project_id.to_string(),
          association.person_id.to_string(),
          association.total_screen_time,
          association.total_appearances,
          association.scenes_present,
          association.key_moments_involved,
          serde_json::to_string(&association.importance)?,
          association.character_role,
          association.first_appearance,
          association.last_appearance,
          association.most_prominent_scene.map(|id| id.to_string()),
          serde_json::to_string(&association.dominant_emotions)?,
          association.emotional_range,
          association.emotional_stability,
          association.average_quality,
          association.best_quality_frame,
          association.lighting_consistency,
          association.user_notes,
          serde_json::to_string(&association.user_tags)?,
          association.is_main_character,
          association.custom_role,
          association.created_at.to_rfc3339(),
          association.updated_at.to_rfc3339(),
        ],
      )
      .context("Failed to insert project person association")?;

    Ok(())
  }

  /// Получение персон проекта с дополнительной информацией
  pub async fn get_project_persons_with_stats(
    &self,
    project_id: &Uuid,
  ) -> Result<
    Vec<(
      crate::recognition::types_professional::PersonProfile,
      ProjectPersonAssociation,
    )>,
  > {
    // Интегрируемся с существующей person database
    let conn = self.conn.lock().await;
    queries::get_project_persons_with_stats(&*conn, &self.person_db, project_id).await
  }

  /// Создание плана монтажа
  pub async fn create_montage_plan(&self, mut plan: MontagePlan) -> Result<MontagePlan> {
    let conn = self.conn.lock().await;

    plan.id = Uuid::new_v4();
    plan.created_at = Utc::now();
    plan.updated_at = plan.created_at;

    conn
      .execute(
        "INSERT INTO montage_plans (
                id, project_id, name, description, total_duration, target_duration,
                style, tempo, mood, created_by, ai_confidence, ai_reasoning,
                alternative_count, version, parent_plan_id, is_active,
                user_modifications, user_approval_status, user_feedback,
                export_settings, preview_url, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        rusqlite::params![
          plan.id.to_string(),
          plan.project_id.to_string(),
          plan.name,
          plan.description,
          plan.total_duration,
          plan.target_duration,
          serde_json::to_string(&plan.style)?,
          serde_json::to_string(&plan.tempo)?,
          plan.mood,
          serde_json::to_string(&plan.created_by)?,
          plan.ai_confidence,
          plan.ai_reasoning,
          plan.alternative_count,
          plan.version,
          plan.parent_plan_id.map(|id| id.to_string()),
          plan.is_active,
          plan.user_modifications,
          serde_json::to_string(&plan.user_approval_status)?,
          plan.user_feedback,
          plan
            .export_settings
            .as_ref()
            .map(|s| serde_json::to_string(s))
            .transpose()?,
          plan.preview_url,
          plan.created_at.to_rfc3339(),
          plan.updated_at.to_rfc3339(),
        ],
      )
      .context("Failed to insert montage plan")?;

    // Сохраняем сегменты
    for segment in &plan.segments {
      self
        .create_montage_segment_internal(&*conn, &plan.id, segment.clone())
        .await?;
    }

    Ok(plan)
  }

  /// Внутренний метод создания сегмента монтажа
  async fn create_montage_segment_internal(
    &self,
    conn: &Connection,
    plan_id: &Uuid,
    mut segment: MontageSegment,
  ) -> Result<()> {
    segment.id = Uuid::new_v4();
    segment.plan_id = *plan_id;
    segment.created_at = Utc::now();
    segment.updated_at = segment.created_at;

    conn.execute(
            "INSERT INTO montage_segments (
                id, plan_id, source_file_id, source_scene_id, source_moment_id,
                source_start_time, source_end_time, source_duration,
                sequence_position, timeline_start, timeline_duration, track_number,
                speed_multiplier, fade_in_duration, fade_out_duration,
                color_correction, audio_adjustments, visual_effects,
                ai_reason, ai_confidence, selection_factors, is_user_modified,
                user_locked, user_notes, transition_in, transition_out,
                related_segments, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            rusqlite::params![
                segment.id.to_string(),
                segment.plan_id.to_string(),
                segment.source_file_id.to_string(),
                segment.source_scene_id.map(|id| id.to_string()),
                segment.source_moment_id.map(|id| id.to_string()),
                segment.source_start_time,
                segment.source_end_time,
                segment.source_duration,
                segment.sequence_position,
                segment.timeline_start,
                segment.timeline_duration,
                segment.track_number,
                segment.speed_multiplier,
                segment.fade_in_duration,
                segment.fade_out_duration,
                segment.color_correction.as_ref().map(|cc| serde_json::to_string(cc)).transpose()?,
                segment.audio_adjustments.as_ref().map(|aa| serde_json::to_string(aa)).transpose()?,
                serde_json::to_string(&segment.visual_effects)?,
                segment.ai_reason,
                segment.ai_confidence,
                serde_json::to_string(&segment.selection_factors)?,
                segment.is_user_modified,
                segment.user_locked,
                segment.user_notes,
                segment.transition_in.as_ref().map(|t| serde_json::to_string(t)).transpose()?,
                segment.transition_out.as_ref().map(|t| serde_json::to_string(t)).transpose()?,
                serde_json::to_string(&segment.related_segments)?,
                segment.created_at.to_rfc3339(),
                segment.updated_at.to_rfc3339(),
            ]
        ).context("Failed to insert montage segment")?;

    Ok(())
  }

  /// Поиск по данным анализа
  pub async fn search_analysis_data(
    &self,
    project_id: &Uuid,
    query: &str,
    result_types: Option<Vec<SearchResultType>>,
  ) -> Result<Vec<AnalysisSearchResult>> {
    let conn = self.conn.lock().await;
    queries::search_analysis_data(&*conn, project_id, query, result_types)
  }

  /// Получение статистики проекта
  pub async fn get_project_statistics(&self, project_id: &Uuid) -> Result<ProjectStatistics> {
    let conn = self.conn.lock().await;
    queries::get_project_statistics(&*conn, project_id)
  }
}

/// Статистика проекта
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProjectStatistics {
  pub project_id: Uuid,
  pub total_files: u32,
  pub total_duration: f32,
  pub total_scenes: u32,
  pub total_persons: u32,
  pub total_key_moments: u32,
  pub average_quality: f32,
  pub scenes_by_type: HashMap<SceneType, u32>,
  pub moments_by_type: HashMap<MomentType, u32>,
  pub persons_by_importance: HashMap<PersonImportance, u32>,
  pub quality_distribution: QualityDistribution,
  pub temporal_distribution: TemporalDistribution,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct QualityDistribution {
  pub excellent: u32, // 0.9-1.0
  pub good: u32,      // 0.7-0.9
  pub fair: u32,      // 0.5-0.7
  pub poor: u32,      // 0.0-0.5
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TemporalDistribution {
  pub by_hour: HashMap<u8, f32>,    // 0-23 hours -> duration
  pub by_day: HashMap<String, f32>, // day name -> duration
  pub peak_activity_period: Option<String>,
}

// Complex database queries - сложные запросы для системы анализа

use anyhow::Result;
use chrono::{DateTime, Utc};
use rusqlite::Connection;
use std::collections::HashMap;
use std::sync::Arc;
use uuid::Uuid;

use crate::analysis::models::*;

// Additional types for statistics
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct SceneTypeStat {
  pub scene_type: String,
  pub count: u32,
  pub percentage: f32,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct MomentTypeStat {
  pub moment_type: String,
  pub count: u32,
  pub average_score: f32,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct PersonImportanceStat {
  pub person_id: String,
  pub name: String,
  pub appearances: u32,
  pub importance_score: f32,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct ProjectStatistics {
  pub project_id: Uuid,
  pub total_files: u32,
  pub total_duration: f32,
  pub processed_files: u32,
  pub total_scenes: u32,
  pub total_persons: u32,
  pub total_key_moments: u32,
  pub average_quality: f32,
  pub scenes_by_type: Vec<SceneTypeStat>,
  pub moments_by_type: Vec<MomentTypeStat>,
  pub persons_by_importance: Vec<PersonImportanceStat>,
  pub quality_distribution: QualityDistribution,
  pub temporal_distribution: TemporalDistribution,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct QualityDistribution {
  pub excellent: u32,
  pub good: u32,
  pub fair: u32,
  pub poor: u32,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct TemporalDistribution {
  pub by_hour: std::collections::HashMap<u8, f32>,
  pub by_day: std::collections::HashMap<String, f32>,
  pub peak_activity_period: Option<String>,
}
use crate::recognition::person_database::PersonDatabase;
use crate::recognition::types::PersonProfile as RecognitionPersonProfile;

// Helper function to convert between PersonProfile types
fn convert_person_profile(
  db_profile: crate::recognition::person_database::PersonProfile,
) -> RecognitionPersonProfile {
  RecognitionPersonProfile {
    id: db_profile.id.to_string(),
    name: db_profile.primary_name,
    description: db_profile.description,
    tags: db_profile.categories,
    is_verified: db_profile.is_verified,
    created_at: chrono::Utc::now().to_rfc3339(), // Use current time as fallback
    updated_at: chrono::Utc::now().to_rfc3339(),
  }
}

/// Получение сцен проекта с сортировкой и фильтрацией
pub fn get_project_scenes(conn: &Connection, project_id: &Uuid) -> Result<Vec<AnalysisScene>> {
  let mut stmt = conn.prepare(
    "SELECT id, project_id, file_id, start_time, end_time, duration,
                scene_type, sub_type, confidence, dominant_colors, brightness,
                contrast, saturation, motion_level, composition_score,
                rule_of_thirds_compliance, visual_balance, quality_score,
                sharpness, noise_level, stability, persons_present,
                objects_detected, has_text, has_faces, emotional_tone,
                energy_level, auto_description, user_description, tags,
                user_rating, representative_frame, keyframes, created_at
         FROM analysis_scenes 
         WHERE project_id = ? 
         ORDER BY start_time ASC",
  )?;

  let scenes = stmt
    .query_map([project_id.to_string()], |row| {
      Ok(AnalysisScene {
        id: Uuid::parse_str(&row.get::<_, String>(0)?).unwrap(),
        project_id: Uuid::parse_str(&row.get::<_, String>(1)?).unwrap(),
        file_id: Uuid::parse_str(&row.get::<_, String>(2)?).unwrap(),
        start_time: row.get(3)?,
        end_time: row.get(4)?,
        duration: row.get(5)?,
        scene_type: serde_json::from_str(&row.get::<_, String>(6)?).unwrap(),
        sub_type: row.get(7)?,
        confidence: row.get(8)?,
        dominant_colors: serde_json::from_str(&row.get::<_, String>(9)?).unwrap_or_default(),
        brightness: row.get(10)?,
        contrast: row.get(11)?,
        saturation: row.get(12)?,
        motion_level: row.get(13)?,
        composition_score: row.get(14)?,
        rule_of_thirds_compliance: row.get(15)?,
        visual_balance: row.get(16)?,
        quality_score: row.get(17)?,
        sharpness: row.get(18)?,
        noise_level: row.get(19)?,
        stability: row.get(20)?,
        persons_present: serde_json::from_str(&row.get::<_, String>(21)?).unwrap_or_default(),
        objects_detected: serde_json::from_str(&row.get::<_, String>(22)?).unwrap_or_default(),
        has_text: row.get(23)?,
        has_faces: row.get(24)?,
        emotional_tone: row
          .get::<_, Option<String>>(25)?
          .map(|s| serde_json::from_str(&s))
          .transpose()
          .unwrap_or(None),
        energy_level: row.get(26)?,
        auto_description: row.get(27)?,
        user_description: row.get(28)?,
        tags: serde_json::from_str(&row.get::<_, String>(29)?).unwrap_or_default(),
        user_rating: row.get(30)?,
        representative_frame: row.get(31)?,
        keyframes: serde_json::from_str(&row.get::<_, String>(32)?).unwrap_or_default(),
        created_at: DateTime::parse_from_rfc3339(&row.get::<_, String>(33)?)
          .map_err(|e| {
            rusqlite::Error::SqliteFailure(
              rusqlite::ffi::Error::new(rusqlite::ffi::SQLITE_MISUSE),
              Some(e.to_string()),
            )
          })?
          .with_timezone(&Utc),
      })
    })?
    .collect::<Result<Vec<_>, _>>()?;

  Ok(scenes)
}

/// Получение ключевых моментов проекта с сортировкой по важности
pub fn get_project_key_moments(conn: &Connection, project_id: &Uuid) -> Result<Vec<KeyMoment>> {
  let mut stmt = conn.prepare(
    "SELECT id, project_id, file_id, scene_id, timestamp, duration,
                moment_type, sub_type, importance_score, scoring_factors,
                description, auto_description, user_notes, involved_persons,
                involved_objects, associated_emotions, content_tags, mood_tags,
                technical_tags, user_rating, is_bookmarked, is_hidden,
                thumbnail_frame, preview_start, preview_end, created_at, updated_at
         FROM key_moments 
         WHERE project_id = ? 
         ORDER BY importance_score DESC, timestamp ASC",
  )?;

  let moments = stmt
    .query_map([project_id.to_string()], |row| {
      Ok(KeyMoment {
        id: Uuid::parse_str(&row.get::<_, String>(0)?).unwrap(),
        project_id: Uuid::parse_str(&row.get::<_, String>(1)?).unwrap(),
        file_id: Uuid::parse_str(&row.get::<_, String>(2)?).unwrap(),
        scene_id: row
          .get::<_, Option<String>>(3)?
          .map(|s| Uuid::parse_str(&s))
          .transpose()
          .unwrap_or(None),
        timestamp: row.get(4)?,
        duration: row.get(5)?,
        moment_type: serde_json::from_str(&row.get::<_, String>(6)?).unwrap(),
        sub_type: row.get(7)?,
        importance_score: row.get(8)?,
        scoring_factors: serde_json::from_str(&row.get::<_, String>(9)?).unwrap(),
        description: row.get(10)?,
        auto_description: row.get(11)?,
        user_notes: row.get(12)?,
        involved_persons: serde_json::from_str(&row.get::<_, String>(13)?).unwrap_or_default(),
        involved_objects: serde_json::from_str(&row.get::<_, String>(14)?).unwrap_or_default(),
        associated_emotions: serde_json::from_str(&row.get::<_, String>(15)?).unwrap_or_default(),
        content_tags: serde_json::from_str(&row.get::<_, String>(16)?).unwrap_or_default(),
        mood_tags: serde_json::from_str(&row.get::<_, String>(17)?).unwrap_or_default(),
        technical_tags: serde_json::from_str(&row.get::<_, String>(18)?).unwrap_or_default(),
        user_rating: row.get(19)?,
        is_bookmarked: row.get(20)?,
        is_hidden: row.get(21)?,
        thumbnail_frame: row.get(22)?,
        preview_start: row.get(23)?,
        preview_end: row.get(24)?,
        created_at: DateTime::parse_from_rfc3339(&row.get::<_, String>(25)?)
          .map_err(|e| {
            rusqlite::Error::SqliteFailure(
              rusqlite::ffi::Error::new(rusqlite::ffi::SQLITE_MISUSE),
              Some(e.to_string()),
            )
          })?
          .with_timezone(&Utc),
        updated_at: DateTime::parse_from_rfc3339(&row.get::<_, String>(26)?)
          .map_err(|e| {
            rusqlite::Error::SqliteFailure(
              rusqlite::ffi::Error::new(rusqlite::ffi::SQLITE_MISUSE),
              Some(e.to_string()),
            )
          })?
          .with_timezone(&Utc),
      })
    })?
    .collect::<Result<Vec<_>, _>>()?;

  Ok(moments)
}

/// Получение персон проекта с полной статистикой
pub async fn get_project_persons_with_stats(
  conn: &Connection,
  person_db: &Arc<PersonDatabase>,
  project_id: &Uuid,
) -> Result<Vec<(RecognitionPersonProfile, ProjectPersonAssociation)>> {
  let mut stmt = conn.prepare(
    "SELECT project_id, person_id, total_screen_time, total_appearances,
                scenes_present, key_moments_involved, importance, character_role,
                first_appearance, last_appearance, most_prominent_scene,
                dominant_emotions, emotional_range, emotional_stability,
                average_quality, best_quality_frame, lighting_consistency,
                user_notes, user_tags, is_main_character, custom_role,
                created_at, updated_at
         FROM project_person_associations 
         WHERE project_id = ? 
         ORDER BY total_screen_time DESC",
  )?;

  let associations = stmt
    .query_map([project_id.to_string()], |row| {
      Ok(ProjectPersonAssociation {
        project_id: Uuid::parse_str(&row.get::<_, String>(0)?).unwrap(),
        person_id: Uuid::parse_str(&row.get::<_, String>(1)?).unwrap(),
        total_screen_time: row.get(2)?,
        total_appearances: row.get(3)?,
        scenes_present: row.get(4)?,
        key_moments_involved: row.get(5)?,
        importance: serde_json::from_str(&row.get::<_, String>(6)?).unwrap(),
        character_role: row.get(7)?,
        first_appearance: row.get(8)?,
        last_appearance: row.get(9)?,
        most_prominent_scene: row
          .get::<_, Option<String>>(10)?
          .map(|s| Uuid::parse_str(&s))
          .transpose()
          .unwrap_or(None),
        dominant_emotions: serde_json::from_str(&row.get::<_, String>(11)?).unwrap_or_default(),
        emotional_range: row.get(12)?,
        emotional_stability: row.get(13)?,
        average_quality: row.get(14)?,
        best_quality_frame: row.get(15)?,
        lighting_consistency: row.get(16)?,
        user_notes: row.get(17)?,
        user_tags: serde_json::from_str(&row.get::<_, String>(18)?).unwrap_or_default(),
        is_main_character: row.get(19)?,
        custom_role: row.get(20)?,
        created_at: DateTime::parse_from_rfc3339(&row.get::<_, String>(21)?)
          .map_err(|e| rusqlite::Error::ToSqlConversionFailure(Box::new(e)))?
          .with_timezone(&Utc),
        updated_at: DateTime::parse_from_rfc3339(&row.get::<_, String>(22)?)
          .map_err(|e| rusqlite::Error::ToSqlConversionFailure(Box::new(e)))?
          .with_timezone(&Utc),
      })
    })?
    .collect::<Result<Vec<_>, _>>()?;

  // Получаем профили персон из person database
  let mut results = Vec::new();
  for association in associations {
    if let Ok(Some(person_profile)) = person_db.get_person(association.person_id).await {
      results.push((convert_person_profile(person_profile), association));
    }
  }

  Ok(results)
}

/// Поиск по данным анализа с полнотекстовым поиском
pub fn search_analysis_data(
  conn: &Connection,
  project_id: &Uuid,
  query: &str,
  result_types: Option<Vec<SearchResultType>>,
) -> Result<Vec<AnalysisSearchResult>> {
  let mut results = Vec::new();
  let search_query = format!("%{}%", query.to_lowercase());

  // Поиск в сценах
  if result_types.is_none()
    || result_types
      .as_ref()
      .unwrap()
      .contains(&SearchResultType::Scene)
  {
    let scene_results = search_in_scenes(conn, project_id, &search_query)?;
    results.extend(scene_results);
  }

  // Поиск в ключевых моментах
  if result_types.is_none()
    || result_types
      .as_ref()
      .unwrap()
      .contains(&SearchResultType::KeyMoment)
  {
    let moment_results = search_in_key_moments(conn, project_id, &search_query)?;
    results.extend(moment_results);
  }

  // Поиск в файлах
  if result_types.is_none()
    || result_types
      .as_ref()
      .unwrap()
      .contains(&SearchResultType::File)
  {
    let file_results = search_in_files(conn, project_id, &search_query)?;
    results.extend(file_results);
  }

  // Поиск в планах монтажа
  if result_types.is_none()
    || result_types
      .as_ref()
      .unwrap()
      .contains(&SearchResultType::MontagePlan)
  {
    let plan_results = search_in_montage_plans(conn, project_id, &search_query)?;
    results.extend(plan_results);
  }

  // Сортируем по релевантности
  results.sort_by(|a, b| b.relevance_score.partial_cmp(&a.relevance_score).unwrap());

  Ok(results)
}

/// Поиск в сценах
fn search_in_scenes(
  conn: &Connection,
  project_id: &Uuid,
  search_query: &str,
) -> Result<Vec<AnalysisSearchResult>> {
  let mut stmt = conn.prepare(
    "SELECT id, scene_type, auto_description, user_description, tags, start_time, end_time
         FROM analysis_scenes 
         WHERE project_id = ? 
         AND (LOWER(auto_description) LIKE ? 
              OR LOWER(user_description) LIKE ? 
              OR LOWER(tags) LIKE ?
              OR LOWER(scene_type) LIKE ?)",
  )?;

  let rows = stmt.query_map(
    rusqlite::params![
      project_id.to_string(),
      search_query,
      search_query,
      search_query,
      search_query
    ],
    |row| {
      let scene_id: String = row.get(0)?;
      let scene_type: String = row.get(1)?;
      let auto_desc: Option<String> = row.get(2)?;
      let user_desc: Option<String> = row.get(3)?;
      let start_time: f32 = row.get(5)?;
      let end_time: f32 = row.get(6)?;

      // Вычисляем релевантность
      let mut relevance_score = 0.0;
      let query_lower = search_query.trim_matches('%').to_lowercase();

      if let Some(desc) = &auto_desc {
        if desc.to_lowercase().contains(&query_lower) {
          relevance_score += 0.8;
        }
      }

      if let Some(desc) = &user_desc {
        if desc.to_lowercase().contains(&query_lower) {
          relevance_score += 1.0; // Пользовательское описание важнее
        }
      }

      if scene_type.to_lowercase().contains(&query_lower) {
        relevance_score += 0.6;
      }

      let combined_desc = auto_desc
        .as_ref()
        .or(user_desc.as_ref())
        .unwrap_or(&String::new())
        .clone();

      let highlight = format!(
        "Сцена {:.1}-{:.1}с: {} {}",
        start_time, end_time, scene_type, combined_desc
      );

      let data = serde_json::json!({
          "id": scene_id,
          "scene_type": scene_type,
          "start_time": start_time,
          "end_time": end_time,
          "auto_description": auto_desc,
          "user_description": user_desc
      });

      Ok(AnalysisSearchResult {
        result_type: SearchResultType::Scene,
        relevance_score,
        highlight,
        data,
      })
    },
  )?;

  let mut results = Vec::new();
  for row in rows {
    results.push(row?);
  }

  Ok(results)
}

/// Поиск в ключевых моментах
fn search_in_key_moments(
  conn: &Connection,
  project_id: &Uuid,
  search_query: &str,
) -> Result<Vec<AnalysisSearchResult>> {
  let mut stmt = conn.prepare(
    "SELECT id, moment_type, description, auto_description, user_notes, 
                content_tags, mood_tags, timestamp, importance_score
         FROM key_moments 
         WHERE project_id = ? 
         AND (LOWER(description) LIKE ? 
              OR LOWER(auto_description) LIKE ? 
              OR LOWER(user_notes) LIKE ?
              OR LOWER(content_tags) LIKE ?
              OR LOWER(mood_tags) LIKE ?
              OR LOWER(moment_type) LIKE ?)",
  )?;

  let rows = stmt.query_map(
    rusqlite::params![
      project_id.to_string(),
      search_query,
      search_query,
      search_query,
      search_query,
      search_query,
      search_query
    ],
    |row| {
      let moment_id: String = row.get(0)?;
      let moment_type: String = row.get(1)?;
      let description: String = row.get(2)?;
      let auto_desc: Option<String> = row.get(3)?;
      let user_notes: Option<String> = row.get(4)?;
      let timestamp: f32 = row.get(7)?;
      let importance_score: f32 = row.get(8)?;

      // Релевантность учитывает важность момента
      let mut relevance_score = importance_score * 0.5; // Базовая релевантность от важности
      let query_lower = search_query.trim_matches('%').to_lowercase();

      if description.to_lowercase().contains(&query_lower) {
        relevance_score += 1.0;
      }

      if let Some(notes) = &user_notes {
        if notes.to_lowercase().contains(&query_lower) {
          relevance_score += 0.9;
        }
      }

      if moment_type.to_lowercase().contains(&query_lower) {
        relevance_score += 0.7;
      }

      let highlight = format!(
        "Момент {:.1}с: {} (важность: {:.0}%)",
        timestamp,
        description,
        importance_score * 100.0
      );

      let data = serde_json::json!({
          "id": moment_id,
          "moment_type": moment_type,
          "description": description,
          "timestamp": timestamp,
          "importance_score": importance_score,
          "auto_description": auto_desc,
          "user_notes": user_notes
      });

      Ok(AnalysisSearchResult {
        result_type: SearchResultType::KeyMoment,
        relevance_score,
        highlight,
        data,
      })
    },
  )?;

  let mut results = Vec::new();
  for row in rows {
    results.push(row?);
  }

  Ok(results)
}

/// Поиск в медиафайлах
fn search_in_files(
  conn: &Connection,
  project_id: &Uuid,
  search_query: &str,
) -> Result<Vec<AnalysisSearchResult>> {
  let mut stmt = conn.prepare(
    "SELECT id, file_name, file_path, media_type, duration, overall_quality
         FROM analysis_media_files 
         WHERE project_id = ? 
         AND (LOWER(file_name) LIKE ? OR LOWER(file_path) LIKE ?)",
  )?;

  let rows = stmt.query_map(
    rusqlite::params![project_id.to_string(), search_query, search_query],
    |row| {
      let file_id: String = row.get(0)?;
      let file_name: String = row.get(1)?;
      let file_path: String = row.get(2)?;
      let media_type: String = row.get(3)?;
      let duration: Option<f32> = row.get(4)?;
      let quality: f32 = row.get(5)?;

      let mut relevance_score = 0.5;
      let query_lower = search_query.trim_matches('%').to_lowercase();

      if file_name.to_lowercase().contains(&query_lower) {
        relevance_score += 1.0;
      }

      let highlight = format!(
        "Файл: {} ({}, {:.1}с, качество: {:.0}%)",
        file_name,
        media_type,
        duration.unwrap_or(0.0),
        quality * 100.0
      );

      let data = serde_json::json!({
          "id": file_id,
          "file_name": file_name,
          "file_path": file_path,
          "media_type": media_type,
          "duration": duration,
          "quality": quality
      });

      Ok(AnalysisSearchResult {
        result_type: SearchResultType::File,
        relevance_score,
        highlight,
        data,
      })
    },
  )?;

  let mut results = Vec::new();
  for row in rows {
    results.push(row?);
  }

  Ok(results)
}

/// Поиск в планах монтажа
fn search_in_montage_plans(
  conn: &Connection,
  project_id: &Uuid,
  search_query: &str,
) -> Result<Vec<AnalysisSearchResult>> {
  let mut stmt = conn.prepare(
    "SELECT id, name, description, style, ai_reasoning, created_by, ai_confidence
         FROM montage_plans 
         WHERE project_id = ? 
         AND (LOWER(name) LIKE ? 
              OR LOWER(description) LIKE ? 
              OR LOWER(ai_reasoning) LIKE ?
              OR LOWER(style) LIKE ?)",
  )?;

  let rows = stmt.query_map(
    rusqlite::params![
      project_id.to_string(),
      search_query,
      search_query,
      search_query,
      search_query
    ],
    |row| {
      let plan_id: String = row.get(0)?;
      let name: String = row.get(1)?;
      let description: Option<String> = row.get(2)?;
      let style: String = row.get(3)?;
      let ai_reasoning: String = row.get(4)?;
      let created_by: String = row.get(5)?;
      let ai_confidence: f32 = row.get(6)?;

      let mut relevance_score = 0.7;
      let query_lower = search_query.trim_matches('%').to_lowercase();

      if name.to_lowercase().contains(&query_lower) {
        relevance_score += 1.0;
      }

      if let Some(desc) = &description {
        if desc.to_lowercase().contains(&query_lower) {
          relevance_score += 0.8;
        }
      }

      if ai_reasoning.to_lowercase().contains(&query_lower) {
        relevance_score += 0.6;
      }

      let highlight = format!(
        "План монтажа: {} (стиль: {}, уверенность ИИ: {:.0}%)",
        name,
        style,
        ai_confidence * 100.0
      );

      let data = serde_json::json!({
          "id": plan_id,
          "name": name,
          "description": description,
          "style": style,
          "ai_reasoning": ai_reasoning,
          "created_by": created_by,
          "ai_confidence": ai_confidence
      });

      Ok(AnalysisSearchResult {
        result_type: SearchResultType::MontagePlan,
        relevance_score,
        highlight,
        data,
      })
    },
  )?;

  let mut results = Vec::new();
  for row in rows {
    results.push(row?);
  }

  Ok(results)
}

/// Получение статистики проекта
pub fn get_project_statistics(conn: &Connection, project_id: &Uuid) -> Result<ProjectStatistics> {
  // Базовая статистика проекта
  let project_stats = conn.query_row(
    "SELECT total_files, total_duration, total_scenes, total_persons, 
                total_key_moments, average_quality
         FROM analysis_projects WHERE id = ?",
    [project_id.to_string()],
    |row| {
      Ok((
        row.get::<_, u32>(0)?,
        row.get::<_, f32>(1)?,
        row.get::<_, u32>(2)?,
        row.get::<_, u32>(3)?,
        row.get::<_, u32>(4)?,
        row.get::<_, f32>(5)?,
      ))
    },
  )?;

  // Статистика по типам сцен
  let mut scenes_by_type = HashMap::new();
  let mut stmt = conn.prepare(
    "SELECT scene_type, COUNT(*) FROM analysis_scenes 
         WHERE project_id = ? GROUP BY scene_type",
  )?;

  let scene_rows = stmt.query_map([project_id.to_string()], |row| {
    Ok((
      serde_json::from_str::<SceneType>(&row.get::<_, String>(0)?).unwrap(),
      row.get::<_, u32>(1)?,
    ))
  })?;

  for row in scene_rows {
    let (scene_type, count) = row?;
    scenes_by_type.insert(scene_type, count);
  }

  // Статистика по типам моментов
  let mut moments_by_type = HashMap::new();
  let mut stmt = conn.prepare(
    "SELECT moment_type, COUNT(*) FROM key_moments 
         WHERE project_id = ? GROUP BY moment_type",
  )?;

  let moment_rows = stmt.query_map([project_id.to_string()], |row| {
    Ok((
      serde_json::from_str::<MomentType>(&row.get::<_, String>(0)?).unwrap(),
      row.get::<_, u32>(1)?,
    ))
  })?;

  for row in moment_rows {
    let (moment_type, count) = row?;
    moments_by_type.insert(moment_type, count);
  }

  // Статистика по важности персон
  let mut persons_by_importance = HashMap::new();
  let mut stmt = conn.prepare(
    "SELECT importance, COUNT(*) FROM project_person_associations 
         WHERE project_id = ? GROUP BY importance",
  )?;

  let person_rows = stmt.query_map([project_id.to_string()], |row| {
    Ok((
      serde_json::from_str::<PersonImportance>(&row.get::<_, String>(0)?).unwrap(),
      row.get::<_, u32>(1)?,
    ))
  })?;

  for row in person_rows {
    let (importance, count) = row?;
    persons_by_importance.insert(importance, count);
  }

  // Распределение качества
  let quality_distribution = get_quality_distribution(conn, project_id)?;

  // Временное распределение
  let temporal_distribution = get_temporal_distribution(conn, project_id)?;

  Ok(ProjectStatistics {
    project_id: *project_id,
    total_files: project_stats.0,
    total_duration: project_stats.1,
    processed_files: project_stats.0, // All files are processed in current context
    total_scenes: project_stats.2,
    total_persons: project_stats.3,
    total_key_moments: project_stats.4,
    average_quality: project_stats.5,
    scenes_by_type: scenes_by_type
      .into_iter()
      .map(|(scene_type, count)| SceneTypeStat {
        scene_type: format!("{:?}", scene_type),
        count,
        percentage: count as f32 / project_stats.2 as f32 * 100.0,
      })
      .collect(),
    moments_by_type: moments_by_type
      .into_iter()
      .map(|(moment_type, count)| MomentTypeStat {
        moment_type: format!("{:?}", moment_type),
        count,
        average_score: 80.0, // Default value, should be calculated from actual data
      })
      .collect(),
    persons_by_importance: persons_by_importance
      .into_iter()
      .map(|(importance, count)| PersonImportanceStat {
        person_id: format!("{:?}", importance),
        name: format!("{:?}", importance),
        appearances: count,
        importance_score: count as f32,
      })
      .collect(),
    quality_distribution,
    temporal_distribution,
  })
}

/// Получение распределения качества
fn get_quality_distribution(conn: &Connection, project_id: &Uuid) -> Result<QualityDistribution> {
  let mut stmt = conn.prepare(
    "SELECT 
            SUM(CASE WHEN quality_score >= 0.9 THEN 1 ELSE 0 END) as excellent,
            SUM(CASE WHEN quality_score >= 0.7 AND quality_score < 0.9 THEN 1 ELSE 0 END) as good,
            SUM(CASE WHEN quality_score >= 0.5 AND quality_score < 0.7 THEN 1 ELSE 0 END) as fair,
            SUM(CASE WHEN quality_score < 0.5 THEN 1 ELSE 0 END) as poor
         FROM analysis_scenes WHERE project_id = ?",
  )?;

  let (excellent, good, fair, poor) = stmt.query_row([project_id.to_string()], |row| {
    Ok((
      row.get::<_, u32>(0)?,
      row.get::<_, u32>(1)?,
      row.get::<_, u32>(2)?,
      row.get::<_, u32>(3)?,
    ))
  })?;

  Ok(QualityDistribution {
    excellent,
    good,
    fair,
    poor,
  })
}

/// Получение временного распределения
fn get_temporal_distribution(conn: &Connection, project_id: &Uuid) -> Result<TemporalDistribution> {
  // Для простоты создаем базовое распределение
  // В реальной реализации здесь будет анализ временных меток файлов
  let by_hour = HashMap::new();
  let by_day = HashMap::new();

  Ok(TemporalDistribution {
    by_hour,
    by_day,
    peak_activity_period: None,
  })
}

/// Получение топ ключевых моментов проекта
pub fn get_top_key_moments(
  conn: &Connection,
  project_id: &Uuid,
  limit: usize,
) -> Result<Vec<KeyMoment>> {
  let mut stmt = conn.prepare(
    "SELECT id, project_id, file_id, scene_id, timestamp, duration,
                moment_type, sub_type, importance_score, scoring_factors,
                description, auto_description, user_notes, involved_persons,
                involved_objects, associated_emotions, content_tags, mood_tags,
                technical_tags, user_rating, is_bookmarked, is_hidden,
                thumbnail_frame, preview_start, preview_end, created_at, updated_at
         FROM key_moments 
         WHERE project_id = ? AND is_hidden = FALSE
         ORDER BY importance_score DESC 
         LIMIT ?",
  )?;

  let moments = stmt
    .query_map(
      rusqlite::params![project_id.to_string(), limit as i32],
      |row| {
        Ok(KeyMoment {
          id: Uuid::parse_str(&row.get::<_, String>(0)?).unwrap(),
          project_id: Uuid::parse_str(&row.get::<_, String>(1)?).unwrap(),
          file_id: Uuid::parse_str(&row.get::<_, String>(2)?).unwrap(),
          scene_id: row
            .get::<_, Option<String>>(3)?
            .map(|s| Uuid::parse_str(&s))
            .transpose()
            .unwrap_or(None),
          timestamp: row.get(4)?,
          duration: row.get(5)?,
          moment_type: serde_json::from_str(&row.get::<_, String>(6)?).unwrap(),
          sub_type: row.get(7)?,
          importance_score: row.get(8)?,
          scoring_factors: serde_json::from_str(&row.get::<_, String>(9)?).unwrap(),
          description: row.get(10)?,
          auto_description: row.get(11)?,
          user_notes: row.get(12)?,
          involved_persons: serde_json::from_str(&row.get::<_, String>(13)?).unwrap_or_default(),
          involved_objects: serde_json::from_str(&row.get::<_, String>(14)?).unwrap_or_default(),
          associated_emotions: serde_json::from_str(&row.get::<_, String>(15)?).unwrap_or_default(),
          content_tags: serde_json::from_str(&row.get::<_, String>(16)?).unwrap_or_default(),
          mood_tags: serde_json::from_str(&row.get::<_, String>(17)?).unwrap_or_default(),
          technical_tags: serde_json::from_str(&row.get::<_, String>(18)?).unwrap_or_default(),
          user_rating: row.get(19)?,
          is_bookmarked: row.get(20)?,
          is_hidden: row.get(21)?,
          thumbnail_frame: row.get(22)?,
          preview_start: row.get(23)?,
          preview_end: row.get(24)?,
          created_at: DateTime::parse_from_rfc3339(&row.get::<_, String>(25)?)
            .unwrap()
            .with_timezone(&Utc),
          updated_at: DateTime::parse_from_rfc3339(&row.get::<_, String>(26)?)
            .unwrap()
            .with_timezone(&Utc),
        })
      },
    )?
    .collect::<Result<Vec<_>, _>>()?;

  Ok(moments)
}

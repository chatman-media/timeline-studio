use anyhow::{Context, Result};
use chrono::{DateTime, Utc};
use rusqlite::OptionalExtension;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::Arc;
use tokio::sync::Mutex;
use uuid::Uuid;

use super::types_professional::*;

/// Расширенный результат поиска похожих персон
#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SimilaritySearchResult {
  pub person_id: Uuid,
  pub name: String,
  pub confidence: ConfidenceLevel,
  pub embedding: FaceEmbeddingVector,
  pub thumbnail_url: Option<String>,
  pub appearance_count: u64,
}

/// Расширенный профиль персоны для профессионального использования
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PersonProfile {
  pub id: Uuid,
  pub primary_name: String,
  pub alternative_names: Vec<String>,
  pub description: Option<String>,
  pub categories: Vec<String>,
  pub role: Option<String>,
  pub contact_info: Option<ContactInfo>,
  pub social_links: HashMap<String, String>,
  pub editor_notes: Option<String>,
  pub is_verified: bool,
  pub created_at: DateTime<Utc>,
  pub updated_at: DateTime<Utc>,
  pub metadata: HashMap<String, serde_json::Value>,
}

/// Расширенный эмбеддинг лица
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FaceEmbedding {
  pub id: Uuid,
  pub person_id: Uuid,
  pub embedding: FaceEmbeddingVector,
  pub quality_score: QualityScore,
  pub head_pose: HeadPose,
  pub emotion: Option<EmotionData>,
  pub demographics: Option<Demographics>,
  pub lighting_conditions: LightingConditions,
  pub source_clip_id: Uuid,
  pub frame_number: u64,
  pub timestamp: Timestamp,
  pub bounding_box: BoundingBox,
  pub created_at: DateTime<Utc>,
}

/// Появление персоны в клипе
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PersonAppearance {
  pub id: Uuid,
  pub person_id: Uuid,
  pub clip_id: Uuid,
  pub start_time: Timestamp,
  pub end_time: Timestamp,
  pub confidence: ConfidenceLevel,
  pub frame_count: u64,
  pub scene_description: Option<String>,
  pub key_frame_number: u64,
  pub created_at: DateTime<Utc>,
}

/// Профессиональная миниатюра
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PersonThumbnail {
  pub id: Uuid,
  pub person_id: Uuid,
  pub image_data: Vec<u8>,
  pub dimensions: Resolution,
  pub is_primary: bool,
  pub quality_score: QualityScore,
  pub source_frame: FrameReference,
  pub created_at: DateTime<Utc>,
}

/// Статистика базы данных
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DatabaseStats {
  pub total_persons: u64,
  pub total_embeddings: u64,
  pub total_appearances: u64,
  pub total_thumbnails: u64,
  pub average_embeddings_per_person: f64,
  pub average_quality_score: QualityScore,
  pub storage_size_bytes: u64,
  pub last_updated: DateTime<Utc>,
  pub quality_distribution: HashMap<String, u64>,
}

/// Профессиональная база данных персон
pub struct PersonDatabase {
  conn: Arc<Mutex<rusqlite::Connection>>,
  similarity_threshold: QualityScore,
  quality_threshold: QualityScore,
}

impl PersonDatabase {
  /// Создание новой базы данных с профессиональной схемой
  pub async fn new(db_path: PathBuf) -> Result<Self> {
    let conn = rusqlite::Connection::open(&db_path).context("Failed to open person database")?;

    // Execute PRAGMA statements with proper error handling
    conn
      .execute("PRAGMA foreign_keys = ON", [])
      .context("Failed to set PRAGMA foreign_keys")?;

    // Handle journal_mode which might return results in some SQLite versions
    // Use query_row for PRAGMA that might return results
    let _ = conn
      .query_row("PRAGMA journal_mode = WAL", [], |row| {
        let mode: String = row.get(0)?;
        Ok(mode)
      })
      .unwrap_or_else(|_| "wal".to_string());

    conn
      .execute("PRAGMA synchronous = NORMAL", [])
      .context("Failed to set PRAGMA synchronous")?;

    let db = Self {
      conn: Arc::new(Mutex::new(conn)),
      similarity_threshold: 0.75,
      quality_threshold: 0.7,
    };

    // Only create tables if they don't exist
    if let Err(e) = db.create_tables().await {
      log::warn!("Tables might already exist, continuing: {}", e);
    }

    Ok(db)
  }

  /// Создание профессиональных таблиц
  async fn create_tables(&self) -> Result<()> {
    let conn = self.conn.lock().await;

    log::debug!("Creating person database tables...");

    // Таблица персон с расширенными полями
    conn
      .execute(
        "CREATE TABLE IF NOT EXISTS persons (
                id TEXT PRIMARY KEY,
                primary_name TEXT NOT NULL,
                alternative_names TEXT NOT NULL DEFAULT '[]',
                description TEXT,
                categories TEXT NOT NULL DEFAULT '[]',
                role TEXT,
                contact_info TEXT,
                social_links TEXT NOT NULL DEFAULT '{}',
                editor_notes TEXT,
                is_verified BOOLEAN DEFAULT FALSE,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                metadata TEXT NOT NULL DEFAULT '{}'
            )",
        [],
      )
      .context("Failed to create persons table")?;

    // Таблица эмбеддингов с расширенными данными
    conn
      .execute(
        "CREATE TABLE IF NOT EXISTS face_embeddings (
                id TEXT PRIMARY KEY,
                person_id TEXT NOT NULL,
                embedding BLOB NOT NULL,
                quality_score REAL NOT NULL,
                head_pose TEXT NOT NULL,
                emotion TEXT,
                demographics TEXT,
                lighting_conditions TEXT NOT NULL,
                source_clip_id TEXT NOT NULL,
                frame_number INTEGER NOT NULL,
                timestamp REAL NOT NULL,
                bounding_box TEXT NOT NULL,
                created_at TEXT NOT NULL,
                FOREIGN KEY (person_id) REFERENCES persons(id) ON DELETE CASCADE
            )",
        [],
      )
      .context("Failed to create face_embeddings table")?;

    // Таблица появлений
    conn
      .execute(
        "CREATE TABLE IF NOT EXISTS person_appearances (
                id TEXT PRIMARY KEY,
                person_id TEXT NOT NULL,
                clip_id TEXT NOT NULL,
                start_time REAL NOT NULL,
                end_time REAL NOT NULL,
                confidence REAL NOT NULL,
                frame_count INTEGER NOT NULL,
                scene_description TEXT,
                key_frame_number INTEGER NOT NULL,
                created_at TEXT NOT NULL,
                FOREIGN KEY (person_id) REFERENCES persons(id) ON DELETE CASCADE
            )",
        [],
      )
      .context("Failed to create person_appearances table")?;

    // Таблица миниатюр
    conn
      .execute(
        "CREATE TABLE IF NOT EXISTS person_thumbnails (
                id TEXT PRIMARY KEY,
                person_id TEXT NOT NULL,
                image_data BLOB NOT NULL,
                width INTEGER NOT NULL,
                height INTEGER NOT NULL,
                is_primary BOOLEAN DEFAULT FALSE,
                quality_score REAL NOT NULL,
                source_frame TEXT NOT NULL,
                created_at TEXT NOT NULL,
                FOREIGN KEY (person_id) REFERENCES persons(id) ON DELETE CASCADE
            )",
        [],
      )
      .context("Failed to create person_thumbnails table")?;

    // Индексы для производительности
    conn
      .execute(
        "CREATE INDEX IF NOT EXISTS idx_face_embeddings_person_id ON face_embeddings(person_id)",
        [],
      )
      .context("Failed to create idx_face_embeddings_person_id index")?;

    conn
      .execute(
        "CREATE INDEX IF NOT EXISTS idx_face_embeddings_clip_id ON face_embeddings(source_clip_id)",
        [],
      )
      .context("Failed to create idx_face_embeddings_clip_id index")?;

    conn
      .execute(
        "CREATE INDEX IF NOT EXISTS idx_face_embeddings_quality ON face_embeddings(quality_score)",
        [],
      )
      .context("Failed to create idx_face_embeddings_quality index")?;

    conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_person_appearances_person_id ON person_appearances(person_id)",
            [],
        ).context("Failed to create idx_person_appearances_person_id index")?;

    conn
      .execute(
        "CREATE INDEX IF NOT EXISTS idx_person_appearances_clip_id ON person_appearances(clip_id)",
        [],
      )
      .context("Failed to create idx_person_appearances_clip_id index")?;

    conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_person_thumbnails_person_id ON person_thumbnails(person_id)",
            [],
        ).context("Failed to create idx_person_thumbnails_person_id index")?;

    Ok(())
  }

  /// Создание новой персоны с профессиональными данными
  pub async fn create_person(&self, profile: PersonProfile) -> Result<PersonProfile> {
    let now = Utc::now();
    let conn = self.conn.lock().await;

    conn.execute(
            "INSERT INTO persons (
                id, primary_name, alternative_names, description, categories, role,
                contact_info, social_links, editor_notes, is_verified, created_at, updated_at, metadata
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            rusqlite::params![
                profile.id.to_string(),
                profile.primary_name,
                serde_json::to_string(&profile.alternative_names)?,
                profile.description,
                serde_json::to_string(&profile.categories)?,
                profile.role,
                serde_json::to_string(&profile.contact_info)?,
                serde_json::to_string(&profile.social_links)?,
                profile.editor_notes,
                profile.is_verified,
                now.to_rfc3339(),
                now.to_rfc3339(),
                serde_json::to_string(&profile.metadata)?
            ],
        )?;

    Ok(profile)
  }

  /// Получение персоны по ID
  pub async fn get_person(&self, person_id: Uuid) -> Result<Option<PersonProfile>> {
    let conn = self.conn.lock().await;
    let mut stmt = conn.prepare(
            "SELECT id, primary_name, alternative_names, description, categories, role,
                    contact_info, social_links, editor_notes, is_verified, created_at, updated_at, metadata
             FROM persons WHERE id = ?"
        )?;

    let person = stmt
      .query_row([person_id.to_string()], |row| {
        Ok(PersonProfile {
          id: Uuid::parse_str(&row.get::<_, String>(0)?).unwrap(),
          primary_name: row.get(1)?,
          alternative_names: serde_json::from_str(&row.get::<_, String>(2)?).unwrap_or_default(),
          description: row.get(3)?,
          categories: serde_json::from_str(&row.get::<_, String>(4)?).unwrap_or_default(),
          role: row.get(5)?,
          contact_info: serde_json::from_str(&row.get::<_, String>(6)?).unwrap_or_default(),
          social_links: serde_json::from_str(&row.get::<_, String>(7)?).unwrap_or_default(),
          editor_notes: row.get(8)?,
          is_verified: row.get(9)?,
          created_at: DateTime::parse_from_rfc3339(&row.get::<_, String>(10)?)
            .unwrap()
            .with_timezone(&Utc),
          updated_at: DateTime::parse_from_rfc3339(&row.get::<_, String>(11)?)
            .unwrap()
            .with_timezone(&Utc),
          metadata: serde_json::from_str(&row.get::<_, String>(12)?).unwrap_or_default(),
        })
      })
      .optional()?;

    Ok(person)
  }

  /// Получение всех персон
  pub async fn get_all_persons(&self) -> Result<Vec<PersonProfile>> {
    let conn = self.conn.lock().await;
    let mut stmt = conn.prepare(
            "SELECT id, primary_name, alternative_names, description, categories, role,
                    contact_info, social_links, editor_notes, is_verified, created_at, updated_at, metadata
             FROM persons ORDER BY created_at DESC"
        )?;

    let persons = stmt.query_map([], |row| {
      Ok(PersonProfile {
        id: Uuid::parse_str(&row.get::<_, String>(0)?).unwrap(),
        primary_name: row.get(1)?,
        alternative_names: serde_json::from_str(&row.get::<_, String>(2)?).unwrap_or_default(),
        description: row.get(3)?,
        categories: serde_json::from_str(&row.get::<_, String>(4)?).unwrap_or_default(),
        role: row.get(5)?,
        contact_info: serde_json::from_str(&row.get::<_, String>(6)?).unwrap_or_default(),
        social_links: serde_json::from_str(&row.get::<_, String>(7)?).unwrap_or_default(),
        editor_notes: row.get(8)?,
        is_verified: row.get(9)?,
        created_at: DateTime::parse_from_rfc3339(&row.get::<_, String>(10)?)
          .unwrap()
          .with_timezone(&Utc),
        updated_at: DateTime::parse_from_rfc3339(&row.get::<_, String>(11)?)
          .unwrap()
          .with_timezone(&Utc),
        metadata: serde_json::from_str(&row.get::<_, String>(12)?).unwrap_or_default(),
      })
    })?;

    persons.collect::<Result<Vec<_>, _>>().map_err(Into::into)
  }

  /// Добавление эмбеддинга с профессиональными данными
  pub async fn add_face_embedding(&self, embedding: FaceEmbedding) -> Result<()> {
    let conn = self.conn.lock().await;

    conn.execute(
      "INSERT INTO face_embeddings (
                id, person_id, embedding, quality_score, head_pose, emotion,
                demographics, lighting_conditions, source_clip_id, frame_number,
                timestamp, bounding_box, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      rusqlite::params![
        embedding.id.to_string(),
        embedding.person_id.to_string(),
        self.serialize_embedding(&embedding.embedding)?,
        embedding.quality_score,
        serde_json::to_string(&embedding.head_pose)?,
        serde_json::to_string(&embedding.emotion)?,
        serde_json::to_string(&embedding.demographics)?,
        serde_json::to_string(&embedding.lighting_conditions)?,
        embedding.source_clip_id.to_string(),
        embedding.frame_number,
        embedding.timestamp,
        serde_json::to_string(&embedding.bounding_box)?,
        embedding.created_at.to_rfc3339()
      ],
    )?;

    Ok(())
  }

  /// Поиск похожих персон с профессиональными результатами
  pub async fn find_similar_persons(
    &self,
    target_embedding: &FaceEmbeddingVector,
    limit: usize,
  ) -> Result<Vec<SimilaritySearchResult>> {
    let conn = self.conn.lock().await;
    let mut stmt = conn.prepare(
            "SELECT p.id, p.primary_name, fe.embedding, fe.quality_score, 
                    (SELECT COUNT(*) FROM face_embeddings WHERE person_id = p.id) as appearance_count
             FROM persons p
             JOIN face_embeddings fe ON p.id = fe.person_id
             WHERE fe.quality_score >= ?
             ORDER BY fe.created_at DESC"
        )?;

    let rows = stmt.query_map(rusqlite::params![self.quality_threshold], |row| {
      let person_id = Uuid::parse_str(&row.get::<_, String>(0)?).unwrap();
      let name = row.get(1)?;
      let embedding_bytes: Vec<u8> = row.get(2)?;
      let quality: f32 = row.get(3)?;
      let appearance_count: i64 = row.get(4)?;

      let embedding = self.deserialize_embedding(&embedding_bytes).map_err(|_| {
        rusqlite::Error::InvalidColumnType(3, "embedding".to_string(), rusqlite::types::Type::Blob)
      })?;
      let similarity = cosine_similarity(target_embedding, &embedding);

      Ok((
        person_id,
        name,
        embedding,
        quality,
        appearance_count as u64,
        similarity,
      ))
    })?;

    let mut results = Vec::new();
    let mut seen = std::collections::HashSet::new();

    for row in rows {
      let (person_id, name, embedding, _quality, appearance_count, similarity) = row?;

      if similarity >= self.similarity_threshold && seen.insert(person_id) {
        results.push(SimilaritySearchResult {
          person_id,
          name,
          confidence: (similarity * 100.0).min(100.0),
          embedding,
          thumbnail_url: None, // TODO: добавить генерацию URL
          appearance_count,
        });
      }
    }

    results.sort_by(|a, b| b.confidence.partial_cmp(&a.confidence).unwrap());
    results.truncate(limit);

    Ok(results)
  }

  /// Получение статистики базы данных
  pub async fn get_stats(&self) -> Result<DatabaseStats> {
    let conn = self.conn.lock().await;

    let total_persons: u64 =
      conn.query_row("SELECT COUNT(*) FROM persons", [], |row| row.get(0))?;
    let total_embeddings: u64 =
      conn.query_row("SELECT COUNT(*) FROM face_embeddings", [], |row| row.get(0))?;
    let total_appearances: u64 =
      conn.query_row("SELECT COUNT(*) FROM person_appearances", [], |row| {
        row.get(0)
      })?;
    let total_thumbnails: u64 =
      conn.query_row("SELECT COUNT(*) FROM person_thumbnails", [], |row| {
        row.get(0)
      })?;

    let average_embeddings_per_person = if total_persons > 0 {
      total_embeddings as f64 / total_persons as f64
    } else {
      0.0
    };

    let average_quality_score: f32 = conn
      .query_row(
        "SELECT AVG(quality_score) FROM face_embeddings",
        [],
        |row| row.get(0),
      )
      .unwrap_or(0.0);

    // Распределение по качеству
    let mut quality_distribution = HashMap::new();
    let mut stmt = conn.prepare(
      "SELECT CASE 
                WHEN quality_score >= 0.9 THEN 'excellent'
                WHEN quality_score >= 0.7 THEN 'good'
                WHEN quality_score >= 0.5 THEN 'acceptable'
                ELSE 'poor'
            END as quality_category, COUNT(*) as count
            FROM face_embeddings
            GROUP BY quality_category",
    )?;

    let rows = stmt.query_map([], |row| {
      Ok((row.get::<_, String>(0)?, row.get::<_, u64>(1)?))
    })?;

    for row in rows {
      let (category, count) = row?;
      quality_distribution.insert(category, count);
    }

    Ok(DatabaseStats {
      total_persons,
      total_embeddings,
      total_appearances,
      total_thumbnails,
      average_embeddings_per_person,
      average_quality_score,
      storage_size_bytes: 0, // TODO: реализовать подсчет размера
      last_updated: Utc::now(),
      quality_distribution,
    })
  }

  /// Удаление персоны и всех связанных данных
  pub async fn delete_person(&self, person_id: Uuid) -> Result<()> {
    let conn = self.conn.lock().await;
    conn.execute("DELETE FROM persons WHERE id = ?", [person_id.to_string()])?;
    Ok(())
  }

  /// Обновление профиля персоны
  pub async fn update_person(&self, profile: PersonProfile) -> Result<()> {
    let conn = self.conn.lock().await;
    let now = Utc::now();

    conn.execute(
      "UPDATE persons SET 
                primary_name = ?, alternative_names = ?, description = ?, 
                categories = ?, role = ?, contact_info = ?, social_links = ?, 
                editor_notes = ?, is_verified = ?, updated_at = ?, metadata = ?
            WHERE id = ?",
      rusqlite::params![
        profile.primary_name,
        serde_json::to_string(&profile.alternative_names)?,
        profile.description,
        serde_json::to_string(&profile.categories)?,
        profile.role,
        serde_json::to_string(&profile.contact_info)?,
        serde_json::to_string(&profile.social_links)?,
        profile.editor_notes,
        profile.is_verified,
        now.to_rfc3339(),
        serde_json::to_string(&profile.metadata)?,
        profile.id.to_string()
      ],
    )?;

    Ok(())
  }

  /// Получение всех эмбеддингов для конкретной персоны
  pub async fn get_face_embeddings_for_person(
    &self,
    person_id: &Uuid,
  ) -> Result<Vec<FaceEmbedding>> {
    let conn = self.conn.lock().await;
    let mut stmt = conn.prepare(
      "SELECT id, person_id, embedding, quality_score, head_pose, emotion,
                    demographics, lighting_conditions, source_clip_id, frame_number,
                    timestamp, bounding_box, created_at
             FROM face_embeddings
             WHERE person_id = ?
             ORDER BY quality_score DESC, created_at DESC",
    )?;

    let embeddings = stmt.query_map([person_id.to_string()], |row| {
      let embedding_bytes: Vec<u8> = row.get(2)?;
      let head_pose_str: String = row.get(4)?;
      let emotion_str: String = row.get(5)?;
      let demographics_str: String = row.get(6)?;
      let lighting_conditions_str: String = row.get(7)?;
      let bounding_box_str: String = row.get(11)?;

      Ok(FaceEmbedding {
        id: Uuid::parse_str(&row.get::<_, String>(0)?).unwrap(),
        person_id: Uuid::parse_str(&row.get::<_, String>(1)?).unwrap(),
        embedding: self.deserialize_embedding(&embedding_bytes).map_err(|_e| {
          rusqlite::Error::InvalidColumnType(
            0,
            "embedding".to_string(),
            rusqlite::types::Type::Blob,
          )
        })?,
        quality_score: row.get(3)?,
        head_pose: serde_json::from_str(&head_pose_str).map_err(|_| {
          rusqlite::Error::InvalidColumnType(
            3,
            "head_pose".to_string(),
            rusqlite::types::Type::Text,
          )
        })?,
        emotion: if emotion_str.is_empty() {
          None
        } else {
          Some(serde_json::from_str(&emotion_str).map_err(|_| {
            rusqlite::Error::InvalidColumnType(
              4,
              "emotion".to_string(),
              rusqlite::types::Type::Text,
            )
          })?)
        },
        demographics: if demographics_str.is_empty() {
          None
        } else {
          Some(serde_json::from_str(&demographics_str).map_err(|_| {
            rusqlite::Error::InvalidColumnType(
              5,
              "demographics".to_string(),
              rusqlite::types::Type::Text,
            )
          })?)
        },
        lighting_conditions: serde_json::from_str(&lighting_conditions_str).map_err(|_| {
          rusqlite::Error::InvalidColumnType(
            6,
            "lighting_conditions".to_string(),
            rusqlite::types::Type::Text,
          )
        })?,
        source_clip_id: Uuid::parse_str(&row.get::<_, String>(8)?).unwrap(),
        frame_number: row.get(9)?,
        timestamp: row.get(10)?,
        bounding_box: serde_json::from_str(&bounding_box_str).map_err(|_| {
          rusqlite::Error::InvalidColumnType(
            11,
            "bounding_box".to_string(),
            rusqlite::types::Type::Text,
          )
        })?,
        created_at: DateTime::parse_from_rfc3339(&row.get::<_, String>(12)?)
          .unwrap()
          .with_timezone(&Utc),
      })
    })?;

    let mut result = Vec::new();
    for embedding in embeddings {
      result.push(embedding?);
    }
    Ok(result)
  }

  /// Получение количества появлений персоны
  pub async fn get_person_appearance_count(&self, person_id: &Uuid) -> Result<u64> {
    let conn = self.conn.lock().await;
    let count: u64 = conn.query_row(
      "SELECT COUNT(*) FROM face_embeddings WHERE person_id = ?",
      [person_id.to_string()],
      |row| row.get(0),
    )?;
    Ok(count)
  }

  /// Получение среднего качества эмбеддингов персоны
  pub async fn get_person_average_confidence(&self, person_id: &Uuid) -> Result<f32> {
    let conn = self.conn.lock().await;
    let avg: f32 = conn
      .query_row(
        "SELECT AVG(quality_score) FROM face_embeddings WHERE person_id = ?",
        [person_id.to_string()],
        |row| row.get(0),
      )
      .unwrap_or(0.0);
    Ok(avg)
  }

  /// Сериализация эмбеддинга
  fn serialize_embedding(&self, embedding: &FaceEmbeddingVector) -> Result<Vec<u8>> {
    let mut buffer = Vec::new();
    for &value in embedding {
      buffer.extend_from_slice(&value.to_le_bytes());
    }
    Ok(buffer)
  }

  /// Десериализация эмбеддинга
  fn deserialize_embedding(&self, bytes: &[u8]) -> Result<FaceEmbeddingVector> {
    let mut embedding = Vec::new();
    let mut offset = 0;

    while offset + 4 <= bytes.len() {
      let value = f32::from_le_bytes([
        bytes[offset],
        bytes[offset + 1],
        bytes[offset + 2],
        bytes[offset + 3],
      ]);
      embedding.push(value);
      offset += 4;
    }

    Ok(embedding)
  }
}

/// Утилитные функции для работы с векторами
pub fn cosine_similarity(a: &[f32], b: &[f32]) -> f32 {
  if a.len() != b.len() || a.is_empty() {
    return 0.0;
  }

  let dot_product: f32 = a.iter().zip(b.iter()).map(|(x, y)| x * y).sum();
  let norm_a: f32 = a.iter().map(|x| x * x).sum::<f32>().sqrt();
  let norm_b: f32 = b.iter().map(|x| x * x).sum::<f32>().sqrt();

  if norm_a == 0.0 || norm_b == 0.0 {
    return 0.0;
  }

  (dot_product / (norm_a * norm_b)).clamp(0.0, 1.0)
}

pub fn euclidean_distance(a: &[f32], b: &[f32]) -> f32 {
  if a.len() != b.len() {
    return f32::MAX;
  }

  let sum: f32 = a.iter().zip(b.iter()).map(|(x, y)| (x - y).powi(2)).sum();

  sum.sqrt()
}

pub fn euclidean_to_similarity(distance: f32) -> f32 {
  1.0 / (1.0 + distance)
}

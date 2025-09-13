use anyhow::{Context, Result};
use chrono::Utc;
use rusqlite::{Connection, OptionalExtension, params};
use std::path::PathBuf;
use std::sync::Arc;
use tokio::sync::Mutex;
use uuid::Uuid;

use super::similarity::{cosine_similarity, euclidean_distance, euclidean_to_similarity};
use super::types::*;

pub struct PersonDatabase {
  conn: Arc<Mutex<Connection>>,
  similarity_threshold: f32,
}

impl PersonDatabase {
  /// Создание новой базы данных
  pub async fn new(db_path: PathBuf) -> Result<Self> {
    let conn = Connection::open(&db_path)
      .with_context(|| format!("Failed to open database at {:?}", db_path))?;

    // Включаем поддержку внешних ключей
    conn.execute("PRAGMA foreign_keys = ON", [])?;

    // Создаем таблицы
    Self::create_tables(&conn)?;

    Ok(Self {
      conn: Arc::new(Mutex::new(conn)),
      similarity_threshold: 0.7,
    })
  }

  /// Создание таблиц базы данных
  fn create_tables(conn: &Connection) -> Result<()> {
    // Таблица персон
    conn.execute(
      "CREATE TABLE IF NOT EXISTS persons (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                description TEXT,
                tags TEXT NOT NULL DEFAULT '[]',
                is_verified INTEGER NOT NULL DEFAULT 0,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )",
      [],
    )?;

    // Таблица эмбеддингов лиц
    conn.execute(
      "CREATE TABLE IF NOT EXISTS face_embeddings (
                id TEXT PRIMARY KEY,
                person_id TEXT NOT NULL,
                embedding BLOB NOT NULL,
                embedding_dimension INTEGER NOT NULL,
                quality REAL NOT NULL,
                source_clip_id TEXT NOT NULL,
                frame_number INTEGER NOT NULL,
                timestamp REAL NOT NULL,
                created_at TEXT NOT NULL,
                FOREIGN KEY (person_id) REFERENCES persons(id) ON DELETE CASCADE
            )",
      [],
    )?;

    // Индексы для эмбеддингов
    conn.execute(
      "CREATE INDEX IF NOT EXISTS idx_embeddings_person_id 
             ON face_embeddings(person_id)",
      [],
    )?;

    conn.execute(
      "CREATE INDEX IF NOT EXISTS idx_embeddings_quality 
             ON face_embeddings(quality)",
      [],
    )?;

    // Таблица появлений персон
    conn.execute(
      "CREATE TABLE IF NOT EXISTS person_appearances (
                id TEXT PRIMARY KEY,
                person_id TEXT NOT NULL,
                clip_id TEXT NOT NULL,
                start_time REAL NOT NULL,
                end_time REAL NOT NULL,
                confidence REAL NOT NULL,
                frame_count INTEGER NOT NULL,
                created_at TEXT NOT NULL,
                FOREIGN KEY (person_id) REFERENCES persons(id) ON DELETE CASCADE
            )",
      [],
    )?;

    // Индексы для появлений
    conn.execute(
      "CREATE INDEX IF NOT EXISTS idx_appearances_person_id 
             ON person_appearances(person_id)",
      [],
    )?;

    conn.execute(
      "CREATE INDEX IF NOT EXISTS idx_appearances_clip_id 
             ON person_appearances(clip_id)",
      [],
    )?;

    // Таблица миниатюр
    conn.execute(
      "CREATE TABLE IF NOT EXISTS person_thumbnails (
                id TEXT PRIMARY KEY,
                person_id TEXT NOT NULL,
                image_data BLOB NOT NULL,
                width INTEGER NOT NULL,
                height INTEGER NOT NULL,
                is_primary INTEGER NOT NULL DEFAULT 0,
                quality REAL NOT NULL,
                created_at TEXT NOT NULL,
                FOREIGN KEY (person_id) REFERENCES persons(id) ON DELETE CASCADE
            )",
      [],
    )?;

    // Индекс для миниатюр
    conn.execute(
      "CREATE INDEX IF NOT EXISTS idx_thumbnails_person_id 
             ON person_thumbnails(person_id)",
      [],
    )?;

    Ok(())
  }

  /// Создание новой персоны
  pub async fn create_person(
    &self,
    name: String,
    description: Option<String>,
  ) -> Result<PersonProfile> {
    let id = format!("person_{}", Uuid::new_v4());
    let now = Utc::now().to_rfc3339();
    let tags = serde_json::to_string(&Vec::<String>::new())?;

    let conn = self.conn.lock().await;
    conn.execute(
      "INSERT INTO persons (id, name, description, tags, is_verified, created_at, updated_at) 
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
      params![&id, &name, &description, &tags, false, &now, &now],
    )?;

    Ok(PersonProfile {
      id,
      name,
      description,
      tags: vec![],
      is_verified: false,
      created_at: now.clone(),
      updated_at: now,
    })
  }

  /// Получение персоны по ID
  pub async fn get_person(&self, person_id: &str) -> Result<Option<PersonProfile>> {
    let conn = self.conn.lock().await;
    let result = conn
      .query_row(
        "SELECT id, name, description, tags, is_verified, created_at, updated_at 
             FROM persons WHERE id = ?1",
        params![person_id],
        |row| {
          let tags_json: String = row.get(3)?;
          let tags: Vec<String> = serde_json::from_str(&tags_json).unwrap_or_default();

          Ok(PersonProfile {
            id: row.get(0)?,
            name: row.get(1)?,
            description: row.get(2)?,
            tags,
            is_verified: row.get(4)?,
            created_at: row.get(5)?,
            updated_at: row.get(6)?,
          })
        },
      )
      .optional()?;

    Ok(result)
  }

  /// Добавление эмбеддинга лица для персоны
  pub async fn add_face_embedding(
    &self,
    person_id: &str,
    embedding: Vec<f32>,
    quality: f32,
    source_clip_id: &str,
    frame_number: i32,
    timestamp: f64,
  ) -> Result<FaceEmbedding> {
    let id = format!("embed_{}", Uuid::new_v4());
    let now = Utc::now().to_rfc3339();
    let embedding_bytes = self.embedding_to_bytes(&embedding);
    let dimension = embedding.len() as i32;

    let conn = self.conn.lock().await;
    conn.execute(
            "INSERT INTO face_embeddings 
             (id, person_id, embedding, embedding_dimension, quality, source_clip_id, frame_number, timestamp, created_at) 
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)",
            params![
                &id,
                person_id,
                &embedding_bytes,
                dimension,
                quality,
                source_clip_id,
                frame_number,
                timestamp,
                &now
            ],
        )?;

    // Обновляем время изменения персоны
    conn.execute(
      "UPDATE persons SET updated_at = ?1 WHERE id = ?2",
      params![&now, person_id],
    )?;

    Ok(FaceEmbedding {
      id,
      person_id: person_id.to_string(),
      embedding,
      quality,
      source_clip_id: source_clip_id.to_string(),
      frame_number,
      timestamp,
      created_at: now,
    })
  }

  /// Поиск похожих персон по эмбеддингу
  pub async fn search_similar_persons(
    &self,
    query_embedding: &[f32],
    top_k: usize,
    use_cosine: bool,
  ) -> Result<Vec<SimilaritySearchResult>> {
    let conn = self.conn.lock().await;

    // Получаем все эмбеддинги с их персонами
    let mut stmt = conn.prepare(
      "SELECT e.id, e.person_id, e.embedding, e.embedding_dimension, e.quality 
             FROM face_embeddings e 
             JOIN persons p ON e.person_id = p.id 
             ORDER BY e.quality DESC",
    )?;

    let embeddings = stmt.query_map([], |row| {
      let id: String = row.get(0)?;
      let person_id: String = row.get(1)?;
      let embedding_bytes: Vec<u8> = row.get(2)?;
      let dimension: i32 = row.get(3)?;
      let quality: f32 = row.get(4)?;

      Ok((id, person_id, embedding_bytes, dimension, quality))
    })?;

    let mut results = Vec::new();

    for embedding_result in embeddings {
      let (embedding_id, person_id, embedding_bytes, dimension, quality) = embedding_result?;

      // Проверяем размерность
      if dimension as usize != query_embedding.len() {
        continue;
      }

      // Конвертируем байты обратно в вектор
      let embedding = self.bytes_to_embedding(&embedding_bytes, dimension as usize)?;

      // Вычисляем сходство
      let similarity = if use_cosine {
        cosine_similarity(query_embedding, &embedding)
      } else {
        let distance = euclidean_distance(query_embedding, &embedding);
        euclidean_to_similarity(distance)
      };

      if similarity >= self.similarity_threshold {
        results.push(SimilaritySearchResult {
          person_id,
          similarity,
          embedding_id,
          confidence: similarity * quality,
        });
      }
    }

    // Сортируем по убыванию сходства
    results.sort_by(|a, b| b.similarity.partial_cmp(&a.similarity).unwrap());

    // Берем топ-K результатов
    results.truncate(top_k);

    Ok(results)
  }

  /// Добавление появления персоны
  pub async fn add_appearance(
    &self,
    person_id: &str,
    clip_id: &str,
    start_time: f64,
    end_time: f64,
    confidence: f32,
    frame_count: i32,
  ) -> Result<PersonAppearance> {
    let id = format!("appear_{}", Uuid::new_v4());
    let now = Utc::now().to_rfc3339();

    let conn = self.conn.lock().await;
    conn.execute(
      "INSERT INTO person_appearances 
             (id, person_id, clip_id, start_time, end_time, confidence, frame_count, created_at) 
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
      params![
        &id,
        person_id,
        clip_id,
        start_time,
        end_time,
        confidence,
        frame_count,
        &now
      ],
    )?;

    Ok(PersonAppearance {
      id,
      person_id: person_id.to_string(),
      clip_id: clip_id.to_string(),
      start_time,
      end_time,
      confidence,
      frame_count,
    })
  }

  /// Добавление миниатюры персоны
  pub async fn add_thumbnail(
    &self,
    person_id: &str,
    image_data: Vec<u8>,
    width: i32,
    height: i32,
    is_primary: bool,
    quality: f32,
  ) -> Result<PersonThumbnail> {
    let id = format!("thumb_{}", Uuid::new_v4());
    let now = Utc::now().to_rfc3339();

    let conn = self.conn.lock().await;

    // Если это основная миниатюра, убираем флаг у других
    if is_primary {
      conn.execute(
        "UPDATE person_thumbnails SET is_primary = 0 WHERE person_id = ?1",
        params![person_id],
      )?;
    }

    conn.execute(
      "INSERT INTO person_thumbnails 
             (id, person_id, image_data, width, height, is_primary, quality, created_at) 
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
      params![
        &id,
        person_id,
        &image_data,
        width,
        height,
        is_primary,
        quality,
        &now
      ],
    )?;

    Ok(PersonThumbnail {
      id,
      person_id: person_id.to_string(),
      image_data,
      width,
      height,
      is_primary,
      quality,
    })
  }

  /// Получение статистики базы данных
  pub async fn get_stats(&self) -> Result<DatabaseStats> {
    let conn = self.conn.lock().await;

    let total_persons: i64 =
      conn.query_row("SELECT COUNT(*) FROM persons", [], |row| row.get(0))?;
    let total_embeddings: i64 =
      conn.query_row("SELECT COUNT(*) FROM face_embeddings", [], |row| row.get(0))?;
    let total_appearances: i64 =
      conn.query_row("SELECT COUNT(*) FROM person_appearances", [], |row| {
        row.get(0)
      })?;

    let average_embeddings_per_person = if total_persons > 0 {
      total_embeddings as f64 / total_persons as f64
    } else {
      0.0
    };

    // Размер базы данных
    let storage_size_bytes: i64 = conn.query_row(
      "SELECT page_count * page_size FROM pragma_page_count(), pragma_page_size()",
      [],
      |row| row.get(0),
    )?;

    Ok(DatabaseStats {
      total_persons,
      total_embeddings,
      total_appearances,
      average_embeddings_per_person,
      storage_size_bytes,
      last_updated: Utc::now().to_rfc3339(),
    })
  }

  /// Удаление персоны и всех связанных данных
  pub async fn delete_person(&self, person_id: &str) -> Result<()> {
    let conn = self.conn.lock().await;
    conn.execute("DELETE FROM persons WHERE id = ?1", params![person_id])?;
    Ok(())
  }

  /// Конвертация эмбеддинга в байты для хранения
  pub(crate) fn embedding_to_bytes(&self, embedding: &[f32]) -> Vec<u8> {
    let mut bytes = Vec::with_capacity(embedding.len() * 4);
    for value in embedding {
      bytes.extend_from_slice(&value.to_le_bytes());
    }
    bytes
  }

  /// Конвертация байтов обратно в эмбеддинг
  pub(crate) fn bytes_to_embedding(&self, bytes: &[u8], dimension: usize) -> Result<Vec<f32>> {
    if bytes.len() != dimension * 4 {
      anyhow::bail!("Invalid embedding byte length");
    }

    let mut embedding = Vec::with_capacity(dimension);
    for i in 0..dimension {
      let start = i * 4;
      let value = f32::from_le_bytes([
        bytes[start],
        bytes[start + 1],
        bytes[start + 2],
        bytes[start + 3],
      ]);
      embedding.push(value);
    }

    Ok(embedding)
  }

  /// Обновление порога сходства
  pub fn set_similarity_threshold(&mut self, threshold: f32) {
    self.similarity_threshold = threshold.clamp(0.0, 1.0);
  }
}

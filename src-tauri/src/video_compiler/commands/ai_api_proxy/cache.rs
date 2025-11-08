//! AI Response Cache
//!
//! Кэширование ответов AI для ускорения повторяющихся запросов
//! и снижения затрат на API.

use super::types::*;
use anyhow::{Context, Result};
use rusqlite::{params, Connection, OptionalExtension};
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::path::Path;
use std::sync::{Arc, Mutex};

/// Настройки кэша
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CacheConfig {
  /// Время жизни кэша в секундах (по умолчанию 24 часа)
  pub ttl_seconds: i64,
  /// Максимальный размер кэша (количество записей)
  pub max_entries: u32,
  /// Включен ли кэш
  pub enabled: bool,
}

impl Default for CacheConfig {
  fn default() -> Self {
    Self {
      ttl_seconds: 86400, // 24 часа
      max_entries: 1000,
      enabled: true,
    }
  }
}

/// Запись кэша
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CacheEntry {
  pub id: i64,
  pub request_hash: String,
  pub provider: String,
  pub model: String,
  pub request_data: String,
  pub response_data: String,
  pub created_at: i64,
  pub expires_at: i64,
  pub access_count: i64,
}

/// AI Cache Manager
pub struct AICacheManager {
  conn: Arc<Mutex<Connection>>,
  config: CacheConfig,
}

impl AICacheManager {
  /// Создать новый кэш-менеджер
  pub fn new(db_path: &Path, config: CacheConfig) -> Result<Self> {
    let conn = Connection::open(db_path)
      .context("Failed to open cache database")?;

    // Создаем таблицу если не существует
    conn.execute(
      "CREATE TABLE IF NOT EXISTS ai_cache (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        request_hash TEXT NOT NULL UNIQUE,
        provider TEXT NOT NULL,
        model TEXT NOT NULL,
        request_data TEXT NOT NULL,
        response_data TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        expires_at INTEGER NOT NULL,
        access_count INTEGER DEFAULT 0
      )",
      [],
    )?;

    // Индексы для быстрого поиска
    conn.execute(
      "CREATE INDEX IF NOT EXISTS idx_request_hash ON ai_cache(request_hash)",
      [],
    )?;

    conn.execute(
      "CREATE INDEX IF NOT EXISTS idx_expires_at ON ai_cache(expires_at)",
      [],
    )?;

    Ok(Self {
      conn: Arc::new(Mutex::new(conn)),
      config,
    })
  }

  /// Генерировать хэш запроса
  pub fn generate_hash(
    provider: &AIProvider,
    model: &str,
    messages: &[AIMessage],
  ) -> String {
    let mut hasher = Sha256::new();

    // Добавляем провайдер
    hasher.update(format!("{:?}", provider).as_bytes());

    // Добавляем модель
    hasher.update(model.as_bytes());

    // Добавляем сообщения (сортируем для консистентности)
    let messages_json = serde_json::to_string(messages).unwrap_or_default();
    hasher.update(messages_json.as_bytes());

    format!("{:x}", hasher.finalize())
  }

  /// Получить из кэша
  pub fn get(&self, request_hash: &str) -> Result<Option<UnifiedAIResponse>> {
    if !self.config.enabled {
      return Ok(None);
    }

    let conn = self.conn.lock().unwrap();
    let now = chrono::Utc::now().timestamp();

    // Ищем запись и проверяем срок действия
    let result: Option<String> = conn
      .query_row(
        "SELECT response_data FROM ai_cache
         WHERE request_hash = ? AND expires_at > ?",
        params![request_hash, now],
        |row| row.get(0),
      )
      .optional()?;

    if let Some(response_json) = result {
      // Увеличиваем счетчик обращений
      conn.execute(
        "UPDATE ai_cache SET access_count = access_count + 1
         WHERE request_hash = ?",
        params![request_hash],
      )?;

      let response: UnifiedAIResponse = serde_json::from_str(&response_json)
        .context("Failed to deserialize cached response")?;

      log::info!("Cache HIT for hash: {}", request_hash);
      Ok(Some(response))
    } else {
      log::debug!("Cache MISS for hash: {}", request_hash);
      Ok(None)
    }
  }

  /// Сохранить в кэш
  pub fn set(
    &self,
    request: &UnifiedAIRequest,
    response: &UnifiedAIResponse,
  ) -> Result<()> {
    if !self.config.enabled {
      return Ok(());
    }

    let conn = self.conn.lock().unwrap();
    let now = chrono::Utc::now().timestamp();
    let expires_at = now + self.config.ttl_seconds;

    let request_hash = Self::generate_hash(
      &request.provider,
      &request.model,
      &request.messages,
    );

    let request_json = serde_json::to_string(request)
      .context("Failed to serialize request")?;
    let response_json = serde_json::to_string(response)
      .context("Failed to serialize response")?;

    // Вставляем или обновляем
    conn.execute(
      "INSERT OR REPLACE INTO ai_cache
       (request_hash, provider, model, request_data, response_data, created_at, expires_at, access_count)
       VALUES (?, ?, ?, ?, ?, ?, ?, COALESCE((SELECT access_count FROM ai_cache WHERE request_hash = ?), 0))",
      params![
        request_hash,
        format!("{:?}", request.provider),
        request.model,
        request_json,
        response_json,
        now,
        expires_at,
        request_hash,
      ],
    )?;

    log::info!("Cached response for hash: {}", request_hash);

    // Проверяем лимит записей
    self.cleanup_if_needed(&conn)?;

    Ok(())
  }

  /// Очистить устаревшие записи
  pub fn cleanup_expired(&self) -> Result<usize> {
    let conn = self.conn.lock().unwrap();
    let now = chrono::Utc::now().timestamp();

    let deleted = conn.execute(
      "DELETE FROM ai_cache WHERE expires_at <= ?",
      params![now],
    )?;

    if deleted > 0 {
      log::info!("Cleaned up {} expired cache entries", deleted);
    }

    Ok(deleted)
  }

  /// Очистить если превышен лимит
  fn cleanup_if_needed(&self, conn: &Connection) -> Result<()> {
    let count: i64 = conn.query_row(
      "SELECT COUNT(*) FROM ai_cache",
      [],
      |row| row.get(0),
    )?;

    if count as u32 > self.config.max_entries {
      // Удаляем самые старые и редко используемые записи
      let to_delete = count as u32 - self.config.max_entries;
      conn.execute(
        "DELETE FROM ai_cache WHERE id IN (
          SELECT id FROM ai_cache
          ORDER BY access_count ASC, created_at ASC
          LIMIT ?
        )",
        params![to_delete],
      )?;

      log::info!("Cleaned up {} old cache entries (limit reached)", to_delete);
    }

    Ok(())
  }

  /// Очистить весь кэш
  pub fn clear_all(&self) -> Result<usize> {
    let conn = self.conn.lock().unwrap();
    let deleted = conn.execute("DELETE FROM ai_cache", [])?;

    log::info!("Cleared all cache entries: {}", deleted);
    Ok(deleted)
  }

  /// Получить статистику кэша
  pub fn get_stats(&self) -> Result<CacheStats> {
    let conn = self.conn.lock().unwrap();

    let total_entries: i64 = conn.query_row(
      "SELECT COUNT(*) FROM ai_cache",
      [],
      |row| row.get(0),
    )?;

    let total_hits: i64 = conn.query_row(
      "SELECT COALESCE(SUM(access_count), 0) FROM ai_cache",
      [],
      |row| row.get(0),
    )?;

    let now = chrono::Utc::now().timestamp();
    let expired_entries: i64 = conn.query_row(
      "SELECT COUNT(*) FROM ai_cache WHERE expires_at <= ?",
      params![now],
      |row| row.get(0),
    )?;

    Ok(CacheStats {
      total_entries: total_entries as u32,
      total_hits: total_hits as u32,
      expired_entries: expired_entries as u32,
      max_entries: self.config.max_entries as u32,
      enabled: self.config.enabled,
    })
  }
}

/// Статистика кэша
#[derive(Debug, Clone, Serialize, Deserialize, specta::Type)]
pub struct CacheStats {
  pub total_entries: u32,
  pub total_hits: u32,
  pub expired_entries: u32,
  pub max_entries: u32,
  pub enabled: bool,
}

#[cfg(test)]
mod tests {
  use super::*;
  use tempfile::tempdir;

  #[test]
  fn test_cache_basic() {
    let dir = tempdir().unwrap();
    let db_path = dir.path().join("test_cache.db");
    let cache = AICacheManager::new(&db_path, CacheConfig::default()).unwrap();

    let request = UnifiedAIRequest {
      provider: AIProvider::Claude,
      model: "claude-3-5-sonnet-20241022".to_string(),
      messages: vec![AIMessage {
        role: "user".to_string(),
        content: "Hello".to_string(),
      }],
      max_tokens: Some(100),
      temperature: Some(0.7),
      stream: Some(false),
      system: None,
      tools: None,
      tool_choice: None,
    };

    let response = UnifiedAIResponse {
      id: "test-response-id".to_string(),
      provider: AIProvider::Claude,
      model: "claude-3-5-sonnet-20241022".to_string(),
      content: "Hi there!".to_string(),
      usage: Some(TokenUsage {
        input_tokens: 10,
        output_tokens: 5,
        total_tokens: 15,
      }),
      finish_reason: Some("stop".to_string()),
      tool_calls: None,
    };

    // Первый запрос - кэш пуст
    let hash = AICacheManager::generate_hash(
      &request.provider,
      &request.model,
      &request.messages,
    );
    assert!(cache.get(&hash).unwrap().is_none());

    // Сохраняем в кэш
    cache.set(&request, &response).unwrap();

    // Второй запрос - должен быть в кэше
    let cached = cache.get(&hash).unwrap();
    assert!(cached.is_some());
    assert_eq!(cached.unwrap().content, "Hi there!");

    // Проверяем статистику
    let stats = cache.get_stats().unwrap();
    assert_eq!(stats.total_entries, 1);
    assert_eq!(stats.total_hits, 1);
  }
}

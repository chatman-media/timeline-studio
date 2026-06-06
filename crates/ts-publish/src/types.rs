//! Общие типы результатов публикации.

use serde::{Deserialize, Serialize};

/// Универсальный результат публикации видео.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PublishResult {
  /// Платформа-приёмник (например, "telegram")
  pub platform: String,
  /// ID сообщения / поста на платформе
  pub message_id: i64,
  /// Публичная ссылка (если платформа выдаёт)
  pub url: Option<String>,
  /// Размер файла, байт
  pub file_size: u64,
  /// Время публикации, сек
  pub elapsed_secs: f64,
}

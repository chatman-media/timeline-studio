//! Ошибки публикации.

use thiserror::Error;

#[derive(Debug, Error)]
pub enum PublishError {
  #[error("файл не найден: {path}")]
  FileNotFound { path: String },

  #[error("HTTP-ошибка: {0}")]
  Http(#[from] reqwest::Error),

  #[error("Telegram API вернул ошибку {code}: {description}")]
  TelegramApi { code: i32, description: String },

  #[error("YouTube API вернул ошибку {code}: {description}")]
  YouTubeApi { code: i32, description: String },

  #[error("некорректный ответ API: {0}")]
  BadResponse(String),

  #[error("io-ошибка: {0}")]
  Io(#[from] std::io::Error),
}

pub type Result<T> = std::result::Result<T, PublishError>;

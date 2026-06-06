//! Реальная публикация в Telegram через Bot API.
//!
//! Использует `sendVideo` (multipart/form-data).
//! Документация: https://core.telegram.org/bots/api#sendvideo

use std::time::Instant;

use reqwest::multipart;
use serde::Deserialize;

use crate::error::{PublishError, Result};
use crate::types::PublishResult;

const TG_API_BASE: &str = "https://api.telegram.org/bot";

// ─── параметры ───────────────────────────────────────────────────────────────

/// Параметры публикации видео в Telegram.
#[derive(Debug, Clone)]
pub struct TelegramPublishParams {
  /// Токен бота (из @BotFather)
  pub bot_token: String,
  /// chat_id: числовой ID, @username канала или «me» для Saved Messages
  pub chat_id: String,
  /// Путь к локальному видеофайлу
  pub video_path: String,
  /// Подпись под видео (Markdown/HTML)
  pub caption: Option<String>,
  /// Hint для Telegram-клиентов включить стриминг
  pub supports_streaming: bool,
}

// ─── ответ Bot API ────────────────────────────────────────────────────────────

/// Сырой ответ Bot API `{"ok":true,"result":{…}}` / `{"ok":false,"error_code":…,"description":…}`
#[derive(Debug, Deserialize)]
struct TgResponse<T> {
  ok: bool,
  result: Option<T>,
  error_code: Option<i32>,
  description: Option<String>,
}

/// Минимальный `Message` (нам нужен только message_id)
#[derive(Debug, Deserialize)]
struct TgMessage {
  message_id: i64,
}

// ─── publisher ───────────────────────────────────────────────────────────────

/// Telegram-публикатор. Стейта нет — всё в параметрах вызова.
pub struct TelegramPublisher {
  client: reqwest::Client,
}

impl Default for TelegramPublisher {
  fn default() -> Self {
    Self::new()
  }
}

impl TelegramPublisher {
  /// Создать publisher с дефолтным HTTP-клиентом.
  pub fn new() -> Self {
    Self {
      client: reqwest::Client::new(),
    }
  }

  /// Отправить видео в Telegram.
  ///
  /// Загружает файл как `multipart/form-data` через `sendVideo`.
  /// Возвращает [`PublishResult`] с `message_id` и elapsed_secs.
  pub async fn send_video(&self, params: TelegramPublishParams) -> Result<PublishResult> {
    let t0 = Instant::now();

    // ── читаем файл ─────────────────────────────────────────────────────────
    let path = std::path::Path::new(&params.video_path);
    if !path.exists() {
      return Err(PublishError::FileNotFound {
        path: params.video_path.clone(),
      });
    }
    let file_size = std::fs::metadata(path)?.len();
    let file_bytes = tokio::fs::read(path).await?;
    let file_name = path
      .file_name()
      .and_then(|n| n.to_str())
      .unwrap_or("video.mp4")
      .to_string();

    // ── строим multipart ─────────────────────────────────────────────────────
    let video_part = multipart::Part::bytes(file_bytes)
      .file_name(file_name)
      .mime_str("video/mp4")
      .map_err(|e| PublishError::BadResponse(e.to_string()))?;

    let mut form = multipart::Form::new()
      .text("chat_id", params.chat_id.clone())
      .text(
        "supports_streaming",
        params.supports_streaming.to_string(),
      )
      .part("video", video_part);

    if let Some(caption) = &params.caption {
      form = form.text("caption", caption.clone());
    }

    // ── POST ─────────────────────────────────────────────────────────────────
    let url = format!("{}{}/sendVideo", TG_API_BASE, params.bot_token);
    let resp = self
      .client
      .post(&url)
      .multipart(form)
      .send()
      .await?
      .json::<TgResponse<TgMessage>>()
      .await?;

    if !resp.ok {
      return Err(PublishError::TelegramApi {
        code: resp.error_code.unwrap_or(0),
        description: resp
          .description
          .unwrap_or_else(|| "unknown error".to_string()),
      });
    }

    let msg = resp
      .result
      .ok_or_else(|| PublishError::BadResponse("empty result".to_string()))?;

    Ok(PublishResult {
      platform: "telegram".to_string(),
      message_id: msg.message_id,
      url: None, // Bot API не возвращает прямой URL; ссылка: t.me/<channel>/<id>
      file_size,
      elapsed_secs: t0.elapsed().as_secs_f64(),
    })
  }

  /// Проверить токен бота через `getMe` (возвращает username бота).
  pub async fn validate_token(&self, bot_token: &str) -> Result<String> {
    let url = format!("{}{}/getMe", TG_API_BASE, bot_token);

    #[derive(Deserialize)]
    struct BotUser {
      username: Option<String>,
      first_name: String,
    }

    let resp = self
      .client
      .get(&url)
      .send()
      .await?
      .json::<TgResponse<BotUser>>()
      .await?;

    if !resp.ok {
      return Err(PublishError::TelegramApi {
        code: resp.error_code.unwrap_or(401),
        description: resp
          .description
          .unwrap_or_else(|| "invalid token".to_string()),
      });
    }

    let bot = resp
      .result
      .ok_or_else(|| PublishError::BadResponse("empty result".to_string()))?;

    Ok(
      bot
        .username
        .map(|u| format!("@{u}"))
        .unwrap_or(bot.first_name),
    )
  }
}

// ─── тесты ───────────────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn publisher_can_be_created() {
    let _p = TelegramPublisher::new();
    let _p2 = TelegramPublisher::default();
  }

  #[test]
  fn missing_file_error() {
    // Синхронный smoke-тест: файл не существует → FileNotFound
    let rt = tokio::runtime::Runtime::new().unwrap();
    let p = TelegramPublisher::new();
    let err = rt.block_on(p.send_video(TelegramPublishParams {
      bot_token: "fake".into(),
      chat_id: "123".into(),
      video_path: "/nonexistent/path/video.mp4".into(),
      caption: None,
      supports_streaming: true,
    }));
    assert!(matches!(err, Err(PublishError::FileNotFound { .. })));
  }

  #[test]
  fn bad_token_error_shape() {
    // Ошибка содержит код и описание
    let err = PublishError::TelegramApi {
      code: 401,
      description: "Unauthorized".into(),
    };
    assert!(err.to_string().contains("401"));
    assert!(err.to_string().contains("Unauthorized"));
  }

  #[test]
  fn publish_result_fields() {
    let r = PublishResult {
      platform: "telegram".into(),
      message_id: 42,
      url: None,
      file_size: 1024,
      elapsed_secs: 1.5,
    };
    assert_eq!(r.platform, "telegram");
    assert_eq!(r.message_id, 42);
    assert_eq!(r.file_size, 1024);
  }
}

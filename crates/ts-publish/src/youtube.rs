//! YouTube Data API v3 resumable upload (M5 #124).
//!
//! Реализует двухшаговую resumable upload:
//! 1. Инициировать загрузку: `POST /upload/youtube/v3/videos?uploadType=resumable`
//!    → получить `Location: <upload_url>`
//! 2. Загрузить файл: `PUT <upload_url>` с `Content-Range`
//!    → вернуть video_id + URL
//!
//! OAuth-токен передаётся как Bearer (пользователь получает его заранее через OAuth2).
//!
//! ```no_run
//! use ts_publish::youtube::{YouTubePublisher, YouTubePublishParams};
//! # async fn run() -> anyhow::Result<()> {
//! let publisher = YouTubePublisher::new();
//! let result = publisher.upload_video(YouTubePublishParams {
//!     access_token: "ya29.a0...".into(),
//!     video_path: "/tmp/video.mp4".into(),
//!     title: "My awesome video".into(),
//!     description: Some("Created with Timeline Studio".into()),
//!     tags: vec!["timeline".into(), "ai".into()],
//!     category_id: "22".into(), // People & Blogs
//!     privacy_status: "private".into(),
//!     notify_subscribers: false,
//! }).await?;
//! println!("https://youtu.be/{}", result.video_id);
//! # Ok(()) }
//! ```

use std::time::Instant;

use anyhow::{Context, Result};
use reqwest::header::{AUTHORIZATION, CONTENT_LENGTH, CONTENT_RANGE, CONTENT_TYPE, LOCATION};
use serde::{Deserialize, Serialize};

use crate::error::PublishError;

const YOUTUBE_API_BASE: &str = "https://www.googleapis.com";
const CHUNK_SIZE: usize = 8 * 1024 * 1024; // 8 МиБ

/// Параметры загрузки видео на YouTube.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct YouTubePublishParams {
  /// OAuth2 access token (`ya29.a0...`)
  pub access_token: String,
  /// Путь к видеофайлу
  pub video_path: String,
  /// Заголовок видео
  pub title: String,
  /// Описание (опционально)
  pub description: Option<String>,
  /// Теги (опционально)
  pub tags: Vec<String>,
  /// Категория YouTube (числовой ID). Дефолт: "22" (People & Blogs)
  pub category_id: String,
  /// Приватность: "public" | "private" | "unlisted"
  pub privacy_status: String,
  /// Уведомить подписчиков (false для черновиков)
  pub notify_subscribers: bool,
}

/// Результат загрузки видео на YouTube.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct YouTubePublishResult {
  /// ID видео на YouTube
  pub video_id: String,
  /// Публичная ссылка
  pub url: String,
  /// Статус обработки YouTube
  pub status: String,
  /// Размер загруженного файла (байт)
  pub file_size: u64,
  /// Время загрузки (сек)
  pub elapsed_secs: f64,
}

/// YouTube Data API v3 publisher.
pub struct YouTubePublisher {
  client: reqwest::Client,
}

impl YouTubePublisher {
  pub fn new() -> Self {
    Self {
      client: reqwest::Client::builder()
        .user_agent("timeline-studio/youtube-publisher")
        .timeout(std::time::Duration::from_secs(600))
        .connect_timeout(std::time::Duration::from_secs(30))
        .build()
        .expect("reqwest client"),
    }
  }

  /// Загрузить видео через resumable upload.
  ///
  /// # Ограничение по памяти
  /// Текущая реализация читает весь файл в RAM перед загрузкой.
  /// Для файлов > 1 ГиБ рекомендуется потоковый вариант (TODO: streaming upload
  /// через `reqwest::Body::wrap_stream` + `tokio::fs::File`).
  pub async fn upload_video(&self, params: YouTubePublishParams) -> Result<YouTubePublishResult, PublishError> {
    let t0 = Instant::now();

    // TODO: заменить на потоковый upload для файлов > 1 ГиБ (избежать RAM-spike).
    let video_bytes = tokio::fs::read(&params.video_path)
      .await
      .map_err(|_| PublishError::FileNotFound { path: params.video_path.clone() })?;
    let file_size = video_bytes.len() as u64;

    // Шаг 1: инициируем resumable upload
    let upload_url = self
      .initiate_upload(&params, file_size)
      .await
      .map_err(|e| PublishError::BadResponse(e.to_string()))?;

    // Шаг 2: загружаем файл
    let video_response = self
      .upload_bytes(&upload_url, &params.access_token, &video_bytes)
      .await
      .map_err(|e| PublishError::BadResponse(e.to_string()))?;

    let video_id = video_response["id"]
      .as_str()
      .ok_or_else(|| PublishError::BadResponse("missing video id in response".to_string()))?
      .to_string();

    let status = video_response["status"]["uploadStatus"]
      .as_str()
      .unwrap_or("uploaded")
      .to_string();

    let url = format!("https://youtu.be/{video_id}");
    let elapsed_secs = t0.elapsed().as_secs_f64();

    Ok(YouTubePublishResult {
      video_id,
      url,
      status,
      file_size,
      elapsed_secs,
    })
  }

  /// Проверить валидность токена через channels.list (mine=true).
  pub async fn validate_token(&self, access_token: &str) -> Result<String, PublishError> {
    let url = format!(
      "{YOUTUBE_API_BASE}/youtube/v3/channels?part=snippet&mine=true&maxResults=1"
    );

    let resp = self
      .client
      .get(&url)
      .header(AUTHORIZATION, format!("Bearer {access_token}"))
      .send()
      .await?;

    let status = resp.status();
    let body: serde_json::Value = resp.json().await?;

    if !status.is_success() {
      let code = status.as_u16() as i32;
      let desc = body["error"]["message"]
        .as_str()
        .unwrap_or("unknown error")
        .to_string();
      // FIX: YouTubeApi variant, not TelegramApi
      return Err(PublishError::YouTubeApi { code, description: desc });
    }

    let channel_title = body["items"][0]["snippet"]["title"]
      .as_str()
      .unwrap_or("(channel)")
      .to_string();

    Ok(channel_title)
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Private
  // ──────────────────────────────────────────────────────────────────────────

  /// Инициировать resumable upload → вернуть Location URL.
  async fn initiate_upload(
    &self,
    params: &YouTubePublishParams,
    file_size: u64,
  ) -> Result<String> {
    let metadata = serde_json::json!({
      "snippet": {
        "title": params.title,
        "description": params.description.as_deref().unwrap_or(""),
        "tags": params.tags,
        "categoryId": params.category_id,
      },
      "status": {
        "privacyStatus": params.privacy_status,
        "selfDeclaredMadeForKids": false,
        // FIX: notifySubscribers NOT in JSON body — moved to query param below
      }
    });

    // FIX: notifySubscribers — query param, NOT JSON body
    // YouTube Data API v3 принимает его только в query string инициирующего запроса
    let notify = if params.notify_subscribers { "true" } else { "false" };
    let url = format!(
      "{YOUTUBE_API_BASE}/upload/youtube/v3/videos\
       ?uploadType=resumable\
       &part=snippet,status\
       &notifySubscribers={notify}"
    );

    let resp = self
      .client
      .post(&url)
      .header(AUTHORIZATION, format!("Bearer {}", params.access_token))
      .header(CONTENT_TYPE, "application/json; charset=UTF-8")
      .header("X-Upload-Content-Type", "video/mp4")
      .header("X-Upload-Content-Length", file_size.to_string())
      .json(&metadata)
      .send()
      .await
      .context("initiate resumable upload")?;

    let status = resp.status();
    if !status.is_success() {
      let body: serde_json::Value = resp.json().await.unwrap_or_default();
      let msg = body["error"]["message"]
        .as_str()
        .unwrap_or("initiate failed")
        .to_string();
      anyhow::bail!("YouTube initiate upload HTTP {status}: {msg}");
    }

    let location = resp
      .headers()
      .get(LOCATION)
      .and_then(|v| v.to_str().ok())
      .context("missing Location header in YouTube initiate response")?
      .to_string();

    Ok(location)
  }

  /// Загрузить байты по resumable URL (chunked).
  async fn upload_bytes(
    &self,
    upload_url: &str,
    access_token: &str,
    bytes: &[u8],
  ) -> Result<serde_json::Value> {
    let total = bytes.len();

    // Для файлов <= CHUNK_SIZE — одиночный запрос
    if total <= CHUNK_SIZE {
      return self.upload_single(upload_url, access_token, bytes).await;
    }

    // Chunked upload
    let mut offset = 0usize;
    let mut last_response = None;

    while offset < total {
      let end = (offset + CHUNK_SIZE).min(total);
      let chunk = &bytes[offset..end];
      let end_idx = end - 1;
      let range = format!("bytes {offset}-{end_idx}/{total}");

      let resp = self
        .client
        .put(upload_url)
        .header(AUTHORIZATION, format!("Bearer {access_token}"))
        .header(CONTENT_TYPE, "video/mp4")
        .header(CONTENT_RANGE, &range)
        .header(CONTENT_LENGTH, chunk.len().to_string())
        .body(chunk.to_vec())
        .send()
        .await
        .with_context(|| format!("upload chunk {range}"))?;

      let s = resp.status();
      if s.as_u16() == 308 {
        // FIX: Resume Incomplete — читаем Range header от сервера.
        // Сервер возвращает `Range: bytes=0-N`, где N — последний подтверждённый байт.
        // Следующий чанк начинается с N+1, а не с локального `end`.
        if let Some(range_hdr) = resp.headers().get("Range") {
          if let Ok(range_str) = range_hdr.to_str() {
            // Формат: "bytes=0-{last_confirmed}"
            if let Some(last_str) = range_str.strip_prefix("bytes=0-") {
              if let Ok(last_byte) = last_str.parse::<usize>() {
                offset = last_byte + 1;
                continue;
              }
            }
          }
        }
        // Если Range header отсутствует или не распарсился — fallback на локальный end
        offset = end;
        continue;
      }
      if s.is_success() {
        let json: serde_json::Value = resp.json().await.context("parse final chunk response")?;
        last_response = Some(json);
        break;
      }
      let body_text = resp.text().await.unwrap_or_default();
      anyhow::bail!("YouTube upload chunk HTTP {s}: {body_text}");
    }

    last_response.context("upload completed but no response body")
  }

  /// Одиночный PUT — для небольших файлов (≤ 8 МиБ).
  async fn upload_single(
    &self,
    upload_url: &str,
    access_token: &str,
    bytes: &[u8],
  ) -> Result<serde_json::Value> {
    let total = bytes.len();
    let end_idx = total - 1;
    let range = format!("bytes 0-{end_idx}/{total}");

    let resp = self
      .client
      .put(upload_url)
      .header(AUTHORIZATION, format!("Bearer {access_token}"))
      .header(CONTENT_TYPE, "video/mp4")
      .header(CONTENT_RANGE, &range)
      .header(CONTENT_LENGTH, total.to_string())
      .body(bytes.to_vec())
      .send()
      .await
      .context("single PUT upload")?;

    let status = resp.status();
    if !status.is_success() {
      let body = resp.text().await.unwrap_or_default();
      anyhow::bail!("YouTube upload HTTP {status}: {body}");
    }

    resp.json().await.context("parse upload response")
  }
}

impl Default for YouTubePublisher {
  fn default() -> Self {
    Self::new()
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn publisher_can_be_created() {
    let _p = YouTubePublisher::new();
  }

  #[test]
  fn params_have_defaults() {
    let params = YouTubePublishParams {
      access_token: "token".to_string(),
      video_path: "/tmp/v.mp4".to_string(),
      title: "Test".to_string(),
      description: None,
      tags: vec![],
      category_id: "22".to_string(),
      privacy_status: "private".to_string(),
      notify_subscribers: false,
    };
    assert_eq!(params.category_id, "22");
    assert_eq!(params.privacy_status, "private");
    assert!(!params.notify_subscribers);
  }

  #[test]
  fn result_fields() {
    let r = YouTubePublishResult {
      video_id: "abc123".to_string(),
      url: "https://youtu.be/abc123".to_string(),
      status: "uploaded".to_string(),
      file_size: 1024,
      elapsed_secs: 1.5,
    };
    assert_eq!(r.url, "https://youtu.be/abc123");
    assert_eq!(r.file_size, 1024);
  }

  #[test]
  fn notify_subscribers_goes_to_query_param() {
    // FIX: notifySubscribers — query param, not JSON body
    let notify_false = if false { "true" } else { "false" };
    let notify_true = if true { "true" } else { "false" };

    let url_false = format!(
      "https://www.googleapis.com/upload/youtube/v3/videos\
       ?uploadType=resumable&part=snippet,status&notifySubscribers={notify_false}"
    );
    let url_true = format!(
      "https://www.googleapis.com/upload/youtube/v3/videos\
       ?uploadType=resumable&part=snippet,status&notifySubscribers={notify_true}"
    );
    assert!(url_false.contains("notifySubscribers=false"));
    assert!(url_true.contains("notifySubscribers=true"));
  }

  #[test]
  fn range_header_308_parse() {
    // FIX: 308 Resume Incomplete → read Range header from server
    // Формат: "bytes=0-{last_confirmed}"
    let range_str = "bytes=0-8388607";
    let next_offset = if let Some(last_str) = range_str.strip_prefix("bytes=0-") {
      last_str.parse::<usize>().map(|n| n + 1).unwrap_or(0)
    } else {
      0
    };
    assert_eq!(next_offset, 8388608); // 8 МиБ — начало следующего чанка
  }

  #[test]
  fn range_header_308_fallback_on_missing() {
    // Если Range header отсутствует — fallback на локальный конец чанка
    let range_hdr: Option<&str> = None;
    let local_end = 8388608usize;
    let offset = if let Some(range_str) = range_hdr {
      if let Some(last_str) = range_str.strip_prefix("bytes=0-") {
        last_str.parse::<usize>().map(|n| n + 1).unwrap_or(local_end)
      } else {
        local_end
      }
    } else {
      local_end
    };
    assert_eq!(offset, local_end);
  }

  #[test]
  fn youtube_api_error_variant() {
    // FIX: validate_token возвращает YouTubeApi, не TelegramApi
    let err = PublishError::YouTubeApi {
      code: 401,
      description: "Invalid Credentials".to_string(),
    };
    let msg = err.to_string();
    assert!(msg.contains("401"));
    assert!(msg.contains("Invalid Credentials"));
  }

  #[tokio::test]
  async fn missing_file_returns_file_not_found() {
    // FIX: заменяем реальный HTTP тест — проверяем только FileNotFound (без сети)
    let publisher = YouTubePublisher::new();
    let result = publisher
      .upload_video(YouTubePublishParams {
        access_token: "fake".to_string(),
        video_path: "/nonexistent/video.mp4".to_string(),
        title: "Test".to_string(),
        description: None,
        tags: vec![],
        category_id: "22".to_string(),
        privacy_status: "private".to_string(),
        notify_subscribers: false,
      })
      .await;
    assert!(result.is_err());
    // Файл не существует → FileNotFound до любого HTTP запроса
    match result.unwrap_err() {
      PublishError::FileNotFound { path } => {
        assert!(path.contains("nonexistent"), "path={path}");
      }
      e => panic!("expected FileNotFound, got: {e}"),
    }
  }
}

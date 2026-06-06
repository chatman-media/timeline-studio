//! `ts-publish` — публикация готового видео на платформы (M5 #124).
//!
//! Поддерживаемые платформы:
//! - **Telegram** — реальный Bot API `sendVideo` (multipart/form-data)
//!
//! Пример:
//! ```no_run
//! use ts_publish::telegram::{TelegramPublisher, TelegramPublishParams};
//!
//! # tokio_test::block_on(async {
//! let publisher = TelegramPublisher::new();
//! let result = publisher.send_video(TelegramPublishParams {
//!     bot_token: "123:ABC".into(),
//!     chat_id: "@mychannel".into(),
//!     video_path: "/tmp/out.mp4".into(),
//!     caption: Some("Моё видео".into()),
//!     supports_streaming: true,
//! }).await.unwrap();
//! println!("message_id={}", result.message_id);
//! # });
//! ```

pub mod error;
pub mod telegram;
pub mod types;

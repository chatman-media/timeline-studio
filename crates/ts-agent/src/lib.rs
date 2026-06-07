//! `ts-agent` — агентный оркестратор Timeline Studio (M4 #123).
//!
//! Связывает крейты в единый сквозной пайплайн без Tauri / AppHandle:
//! analyze(media) --&gt; optimize(platform) --&gt; publish(telegram)
//!
//!
//! Пример:
//! ```no_run
//! use ts_agent::pipeline::{Pipeline, PipelineParams, PublishTarget};
//!
//! # tokio_test::block_on(async {
//! let result = Pipeline::new().run(PipelineParams {
//!     input: "/tmp/raw.mp4".into(),
//!     platform: "tiktok".into(),
//!     output: "/tmp/optimized.mp4".into(),
//!     publish: Some(PublishTarget::Telegram {
//!         bot_token: "TOKEN".into(),
//!         chat_id: "@channel".into(),
//!         caption: Some("Контент".into()),
//!     }),
//!     scene_count: 4,
//! }).await.unwrap();
//! println!("message_id={:?}", result.message_id);
//! # });
//! ```

pub mod llm_planner;
pub mod mcp;
pub mod pipeline;
pub mod steps;

//! `ts-core-types` — фундаментальные типы Timeline Studio (#94).
//!
//! Общие типы без тяжёлых зависимостей (no Tauri, no ORT, no specta):
//! - [`RenderProgress`] / [`ProgressUpdate`] / [`RenderStatus`] — прогресс рендеринга
//! - [`CoreError`] — общий error-тип для движков
//! - [`EventBus`] — headless mpsc-шина событий
//!
//! Все движки (`ts-render`, `ts-agent`, `ts-analysis`, …) могут импортировать
//! эти типы без зависимости друг от друга.

pub mod error;
pub mod events;
pub mod progress;

pub use error::CoreError;
pub use events::{AppEvent, EventBus};
pub use progress::{ProgressUpdate, RenderProgress, RenderStatus};

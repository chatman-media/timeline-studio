//! `ts-state` — ProjectState + EventBus рантайм без Tauri (#100).
//!
//! ## Архитектура
//!
//! ```text
//! ┌─────────────────────────────────────────────────┐
//! │                  ts-state                        │
//! │                                                  │
//! │  ProjectState ─── чистые данные (serde)          │
//! │  ProjectEvent ─── события изменений               │
//! │  EventSink    ─── трейт отправки (Tauri / log)    │
//! │  StateManager ─── headless координатор            │
//! └────────────────────┬────────────────────────────┘
//!                      │  Arc<dyn EventSink>
//!              ┌───────┴───────────┐
//!              │  TauriEventSink   │  NoopEventSink / LogEventSink
//!              │  (в src-tauri)    │  (headless / CLI / tests)
//!              └───────────────────┘
//! ```
//!
//! ## Фича `specta`
//!
//! Все публичные типы получают `#[derive(specta::Type)]` при включении фичи `specta`.
//! В `crates/ts-state` эта фича отключена; в `src-tauri/Cargo.toml` её можно включить:
//! ```toml
//! ts-state = { path = "../crates/ts-state", features = ["specta"] }
//! ```

pub mod events;
pub mod manager;
pub mod sink;
pub mod state;
pub mod types;

pub use events::{EventEnvelope, ProjectEvent};
pub use manager::StateManager;
pub use sink::{EventSink, LogEventSink, NoopEventSink, log_sink, noop_sink};
pub use state::{ProjectSnapshot, ProjectState};
pub use types::{
    BrowserState, BrowserTab, ChatMessage, ChatSession, MessageRole,
    PlaybackState, PlayerSource, Project, ProjectSettings, Resolution,
    Timeline, Track, TrackType, UiState, VersionInfo,
};

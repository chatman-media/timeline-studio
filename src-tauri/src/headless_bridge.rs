//! Thin glue between the headless `ts-state` crate and the Tauri host.
//!
//! `TauriEventSink` implements `ts_state::EventSink` by forwarding
//! `ProjectEvent`s to the Tauri window via `app_handle.emit()`.
//!
//! This is the only Tauri-specific code needed to make the headless
//! state machinery work inside the Tauri app.  All other state logic
//! lives in the `ts-state` crate and is fully testable without Tauri.

use std::sync::Arc;

use tauri::{AppHandle, Emitter};
use ts_state::sink::{EventSink, SinkFuture};
use ts_state::ProjectEvent;

/// Tauri implementation of [`EventSink`].
///
/// Serialises the event to JSON and emits it on the `"ts://project-event"`
/// channel so the front-end can subscribe with `listen("ts://project-event", ...)`.
pub struct TauriEventSink {
    app: AppHandle,
}

impl TauriEventSink {
    pub fn new(app: AppHandle) -> Self {
        Self { app }
    }
}

impl EventSink for TauriEventSink {
    fn send(
        &self,
        event: ProjectEvent,
        source: String,
        version: u32,
    ) -> SinkFuture {
        let app = self.app.clone();
        Box::pin(async move {
            let payload = serde_json::json!({
                "event": event,
                "source": source,
                "version": version,
            });
            // Best-effort: ignore errors (e.g. window closed during shutdown)
            let _ = app.emit("ts://project-event", payload);
        })
    }
}

/// Build a `ts_state::StateManager` wired to the Tauri window.
///
/// Called once during app setup (`setup` hook in `lib.rs`).
/// The returned manager is registered as managed state so every Tauri
/// command can access it via `State<'_, HeadlessState>`.
pub fn build_headless_state(app: AppHandle) -> HeadlessState {
    let sink = Arc::new(TauriEventSink::new(app));
    let manager = ts_state::StateManager::new(sink);
    HeadlessState { manager }
}

/// Tauri managed state wrapper for the headless state manager.
#[derive(Clone)]
pub struct HeadlessState {
    pub manager: ts_state::StateManager,
}

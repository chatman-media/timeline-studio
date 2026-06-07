//! [`EventSink`] трейт + реализации для Tauri-хоста и headless-окружений.
//!
//! Главная идея: `StateManager` не зависит от `tauri::AppHandle` — он принимает
//! `Arc<dyn EventSink>`. В Tauri-хосте передаётся `TauriEventSink` (из `src-tauri`),
//! в headless-режиме — `LogEventSink` или `NoopEventSink`.

use crate::events::ProjectEvent;
use std::future::Future;
use std::pin::Pin;
use std::sync::Arc;

/// Тип `BoxFuture<'static, ()>` — чтобы трейт был объектно-безопасным.
pub type SinkFuture = Pin<Box<dyn Future<Output = ()> + Send + 'static>>;

/// Абстракция для отправки событий проекта во внешний мир.
///
/// В Tauri-хосте это `emit` на `AppHandle`, в headless — лог или no-op.
pub trait EventSink: Send + Sync + 'static {
    /// Отправить событие. Возвращает Future, который разрешается после отправки.
    fn send(&self, event: ProjectEvent, source: String, version: u32) -> SinkFuture;
}

// ─── NoopEventSink ───────────────────────────────────────────────────────────

/// Sink, который молча игнорирует все события. Для тестов и minimal-headless.
pub struct NoopEventSink;

impl EventSink for NoopEventSink {
    fn send(&self, _event: ProjectEvent, _source: String, _version: u32) -> SinkFuture {
        Box::pin(async {})
    }
}

// ─── LogEventSink ────────────────────────────────────────────────────────────

/// Sink, который логирует события через `log::debug!`. Для CLI / агента.
pub struct LogEventSink;

impl EventSink for LogEventSink {
    fn send(&self, event: ProjectEvent, source: String, version: u32) -> SinkFuture {
        let label = event.kind().to_string();
        Box::pin(async move {
            log::debug!("[event] kind={label} source={source} version={version}");
        })
    }
}

// ─── Arc<dyn EventSink> helper ───────────────────────────────────────────────

/// Создаёт `Arc<dyn EventSink>` с `NoopEventSink` — удобно в тестах.
pub fn noop_sink() -> Arc<dyn EventSink> {
    Arc::new(NoopEventSink)
}

/// Создаёт `Arc<dyn EventSink>` с `LogEventSink` — удобно в CLI.
pub fn log_sink() -> Arc<dyn EventSink> {
    Arc::new(LogEventSink)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::events::ProjectEvent;

    #[tokio::test]
    async fn noop_sink_does_not_panic() {
        let sink = noop_sink();
        let event = ProjectEvent::ProjectClosed { project_id: "p1".into() };
        sink.send(event, "test".into(), 1).await;
    }

    #[tokio::test]
    async fn log_sink_does_not_panic() {
        let sink = log_sink();
        let event = ProjectEvent::ProjectClosed { project_id: "p2".into() };
        sink.send(event, "test".into(), 2).await;
    }
}

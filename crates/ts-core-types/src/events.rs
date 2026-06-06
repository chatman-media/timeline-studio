//! Headless [`EventBus`] — mpsc-шина событий без Tauri/specta.
//!
//! В production-Tauri-приложении `src-tauri/src/core/events.rs` содержит
//! более богатую реализацию с `specta::Type` и Tauri-emit. Этот модуль —
//! облегчённый вариант только с tokio, пригодный в CLI / тестах / headless-рендере.

use crate::progress::ProgressUpdate;
use std::sync::Arc;
use tokio::sync::broadcast;

/// Ёмкость кольцевого буфера broadcast-канала по умолчанию.
const DEFAULT_CAPACITY: usize = 256;

/// Высокоуровневое событие приложения Timeline Studio.
///
/// Новые варианты добавляются без breaking change — получатели
/// игнорируют незнакомые (через `_ => {}`).
#[derive(Debug, Clone)]
pub enum AppEvent {
    /// Обновление прогресса рендеринга.
    Progress(ProgressUpdate),
    /// Информационное сообщение (для логов / UI-нотификаций).
    Info(String),
    /// Некритичное предупреждение.
    Warning(String),
    /// Критичная ошибка, требующая внимания пользователя.
    Error(String),
    /// Приложение завершает работу — слушатели должны остановиться.
    Shutdown,
}

impl AppEvent {
    /// Возвращает короткое имя варианта для логирования.
    pub fn kind(&self) -> &'static str {
        match self {
            AppEvent::Progress(_) => "Progress",
            AppEvent::Info(_) => "Info",
            AppEvent::Warning(_) => "Warning",
            AppEvent::Error(_) => "Error",
            AppEvent::Shutdown => "Shutdown",
        }
    }
}

/// Headless шина событий на базе `tokio::sync::broadcast`.
///
/// Клонирование `EventBus` — бесплатно (внутри `Arc`).
///
/// # Пример
/// ```rust
/// use ts_core_types::events::{AppEvent, EventBus};
///
/// # tokio_test::block_on(async {
/// let bus = EventBus::new();
/// let mut rx = bus.subscribe();
///
/// bus.emit(AppEvent::Info("hello".into())).await;
///
/// let event = rx.recv().await.unwrap();
/// assert!(matches!(event, AppEvent::Info(_)));
/// # });
/// ```
#[derive(Clone)]
pub struct EventBus {
    inner: Arc<EventBusInner>,
}

struct EventBusInner {
    tx: broadcast::Sender<AppEvent>,
}

impl std::fmt::Debug for EventBus {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("EventBus")
            .field("receiver_count", &self.inner.tx.receiver_count())
            .finish()
    }
}

impl EventBus {
    /// Создаёт новый `EventBus` с ёмкостью [`DEFAULT_CAPACITY`].
    pub fn new() -> Self {
        Self::with_capacity(DEFAULT_CAPACITY)
    }

    /// Создаёт `EventBus` с указанной ёмкостью кольцевого буфера.
    pub fn with_capacity(capacity: usize) -> Self {
        let (tx, _) = broadcast::channel(capacity);
        EventBus {
            inner: Arc::new(EventBusInner { tx }),
        }
    }

    /// Отправляет событие всем активным подписчикам.
    ///
    /// Не блокирует — если буфер переполнен, старые события вытесняются.
    /// Возвращает количество получателей, которым доставлено событие.
    pub async fn emit(&self, event: AppEvent) -> usize {
        match self.inner.tx.send(event) {
            Ok(n) => n,
            Err(_) => 0, // нет подписчиков — норма
        }
    }

    /// Синхронная версия [`emit`](Self::emit) — удобна вне async-контекста.
    pub fn emit_sync(&self, event: AppEvent) -> usize {
        match self.inner.tx.send(event) {
            Ok(n) => n,
            Err(_) => 0,
        }
    }

    /// Создаёт нового подписчика. Получает все события, отправленные после
    /// момента вызова.
    pub fn subscribe(&self) -> broadcast::Receiver<AppEvent> {
        self.inner.tx.subscribe()
    }

    /// Количество активных подписчиков.
    pub fn receiver_count(&self) -> usize {
        self.inner.tx.receiver_count()
    }

    /// Рассылает [`AppEvent::Shutdown`] всем подписчикам.
    pub async fn shutdown(&self) {
        self.emit(AppEvent::Shutdown).await;
    }
}

impl Default for EventBus {
    fn default() -> Self {
        Self::new()
    }
}

// ─── Тесты ──────────────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;
    use crate::progress::ProgressUpdate;

    #[tokio::test]
    async fn emit_and_receive() {
        let bus = EventBus::new();
        let mut rx = bus.subscribe();

        bus.emit(AppEvent::Info("test".into())).await;

        let ev = rx.recv().await.unwrap();
        assert!(matches!(ev, AppEvent::Info(msg) if msg == "test"));
    }

    #[tokio::test]
    async fn emit_progress_update() {
        let bus = EventBus::new();
        let mut rx = bus.subscribe();

        let upd = ProgressUpdate::JobCancelled {
            job_id: "j99".into(),
        };
        bus.emit(AppEvent::Progress(upd)).await;

        let ev = rx.recv().await.unwrap();
        assert!(matches!(ev, AppEvent::Progress(_)));
    }

    #[tokio::test]
    async fn multiple_subscribers() {
        let bus = EventBus::new();
        let mut rx1 = bus.subscribe();
        let mut rx2 = bus.subscribe();

        bus.emit(AppEvent::Warning("warn".into())).await;

        assert!(matches!(rx1.recv().await.unwrap(), AppEvent::Warning(_)));
        assert!(matches!(rx2.recv().await.unwrap(), AppEvent::Warning(_)));
    }

    #[tokio::test]
    async fn shutdown_event() {
        let bus = EventBus::new();
        let mut rx = bus.subscribe();

        bus.shutdown().await;

        let ev = rx.recv().await.unwrap();
        assert!(matches!(ev, AppEvent::Shutdown));
    }

    #[tokio::test]
    async fn no_subscribers_does_not_panic() {
        let bus = EventBus::new();
        // нет подписчиков — emit должен вернуть 0, не паниковать
        let n = bus.emit(AppEvent::Info("hi".into())).await;
        assert_eq!(n, 0);
    }

    #[test]
    fn event_kind_labels() {
        use crate::progress::{RenderProgress, RenderStatus};
        let p = RenderProgress::new("j").with_status(RenderStatus::Queued);
        let upd = ProgressUpdate::ProgressChanged(p);
        assert_eq!(AppEvent::Progress(upd).kind(), "Progress");
        assert_eq!(AppEvent::Shutdown.kind(), "Shutdown");
        assert_eq!(AppEvent::Error("e".into()).kind(), "Error");
    }

    #[test]
    fn emit_sync_no_panic() {
        let bus = EventBus::new();
        let _rx = bus.subscribe();
        let n = bus.emit_sync(AppEvent::Info("sync".into()));
        assert_eq!(n, 1);
    }

    #[test]
    fn clone_shares_channel() {
        let bus1 = EventBus::new();
        let bus2 = bus1.clone();
        let mut rx = bus1.subscribe();
        bus2.emit_sync(AppEvent::Shutdown);
        let ev = rx.try_recv().unwrap();
        assert!(matches!(ev, AppEvent::Shutdown));
    }
}

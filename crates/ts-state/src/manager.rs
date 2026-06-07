//! Headless [`StateManager`] — координатор без `tauri::AppHandle`.
//!
//! В Tauri-хосте можно обернуть `StateManager` в `tauri::State<Mutex<...>>` и
//! добавить `TauriEventSink` (реализующий [`EventSink`]) вместо `LogEventSink`.

use crate::events::{EventEnvelope, ProjectEvent};
use crate::sink::{log_sink, EventSink};
use crate::state::ProjectState;
use crate::types::project::ProjectSettings;
use std::sync::Arc;
use tokio::sync::{broadcast, RwLock};

/// Ёмкость broadcast-канала конвертов событий.
const BUS_CAPACITY: usize = 512;

/// Headless координатор состояния.
///
/// Потокобезопасен (внутри `Arc`). Клонирование — бесплатно.
///
/// # Пример
/// ```rust
/// use ts_state::manager::StateManager;
/// use ts_state::sink::log_sink;
/// use ts_state::types::project::ProjectSettings;
///
/// # tokio_test::block_on(async {
/// let manager = StateManager::new(log_sink());
/// let id = manager.create_project("My Project", ProjectSettings::default()).await;
/// assert!(!id.is_empty());
/// # });
/// ```
#[derive(Clone)]
pub struct StateManager {
    inner: Arc<StateManagerInner>,
}

struct StateManagerInner {
    state: RwLock<ProjectState>,
    sink: Arc<dyn EventSink>,
    bus_tx: broadcast::Sender<EventEnvelope>,
}

impl StateManager {
    /// Создаёт новый `StateManager` с указанным `EventSink`.
    pub fn new(sink: Arc<dyn EventSink>) -> Self {
        let (bus_tx, _) = broadcast::channel(BUS_CAPACITY);
        Self {
            inner: Arc::new(StateManagerInner {
                state: RwLock::new(ProjectState::default()),
                sink,
                bus_tx,
            }),
        }
    }

    /// Создаёт `StateManager` с `LogEventSink` — удобно для CLI / агента.
    pub fn with_log_sink() -> Self {
        Self::new(log_sink())
    }

    // ── Публичный API ────────────────────────────────────────────────────

    /// Читает текущее состояние (shared read lock).
    pub async fn get_state(&self) -> tokio::sync::RwLockReadGuard<'_, ProjectState> {
        self.inner.state.read().await
    }

    /// Создаёт новый проект; возвращает `project_id`.
    pub async fn create_project(
        &self,
        name: impl Into<String>,
        settings: ProjectSettings,
    ) -> String {
        let name = name.into();
        let project_name = name.clone();
        let mut state = self.inner.state.write().await;
        let id = state.create_project(name, settings);
        let version = state.version;
        drop(state);
        self.emit(
            ProjectEvent::ProjectCreated { project_id: id.clone(), name: project_name },
            "state_manager",
            version,
        )
        .await;
        id
    }

    /// Помечает проект как изменённый.
    pub async fn mark_dirty(&self) {
        let mut state = self.inner.state.write().await;
        state.mark_dirty();
        let version = state.version;
        drop(state);
        self.emit(
            ProjectEvent::AutoSaveTriggered { snapshot_id: "dirty".into() },
            "state_manager",
            version,
        )
        .await;
    }

    /// Подписывается на broadcast-шину событий.
    pub fn subscribe(&self) -> broadcast::Receiver<EventEnvelope> {
        self.inner.bus_tx.subscribe()
    }

    // ── Внутреннее ───────────────────────────────────────────────────────

    async fn emit(&self, event: ProjectEvent, source: &str, version: u32) {
        let envelope = EventEnvelope::new(event.clone(), source, version);
        // Отправляем через sink (Tauri emit / log / noop)
        self.inner.sink.send(event, source.to_string(), version).await;
        // Также в broadcast-канал (подписчики внутри процесса)
        let _ = self.inner.bus_tx.send(envelope);
    }
}

impl std::fmt::Debug for StateManager {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("StateManager").finish_non_exhaustive()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn create_project_returns_id() {
        let mgr = StateManager::with_log_sink();
        let id = mgr.create_project("Hello", ProjectSettings::default()).await;
        assert!(!id.is_empty());
        let state = mgr.get_state().await;
        assert_eq!(state.project.as_ref().unwrap().metadata.name, "Hello");
    }

    #[tokio::test]
    async fn events_broadcast_to_subscribers() {
        let mgr = StateManager::with_log_sink();
        let mut rx = mgr.subscribe();

        mgr.create_project("Evented", ProjectSettings::default()).await;

        let env = rx.recv().await.unwrap();
        assert!(matches!(env.event, ProjectEvent::ProjectCreated { .. }));
    }

    #[tokio::test]
    async fn clone_shares_state() {
        let mgr1 = StateManager::with_log_sink();
        let mgr2 = mgr1.clone();

        mgr1.create_project("Shared", ProjectSettings::default()).await;
        let state = mgr2.get_state().await;
        assert!(state.project.is_some());
    }

    #[tokio::test]
    async fn mark_dirty_increments_version() {
        let mgr = StateManager::with_log_sink();
        mgr.create_project("DirtyTest", ProjectSettings::default()).await;
        let v1 = mgr.get_state().await.version;
        mgr.mark_dirty().await;
        let v2 = mgr.get_state().await.version;
        assert!(v2 > v1);
    }
}

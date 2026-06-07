//! [`ProjectState`] — единственный источник истины о проекте.

use crate::types::browser::BrowserState;
use crate::types::chat::ChatSession;
use crate::types::project::{
    ClipboardData, PlaybackState, Project, ProjectSettings, UiState, VersionInfo,
};
use chrono::Utc;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[cfg(feature = "specta")]
use specta::Type;

/// Полное состояние проекта — единственный источник истины.
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[cfg_attr(feature = "specta", derive(Type))]
pub struct ProjectState {
    pub project: Option<Project>,
    pub ui_state: UiState,
    pub playback_state: PlaybackState,
    pub version: u32,
    pub version_info: VersionInfo,
    pub chat_sessions: Vec<ChatSession>,
    pub browser_state: BrowserState,
    pub clipboard: Option<ClipboardData>,
}

impl ProjectState {
    /// Создаёт новый проект с заданными настройками; возвращает `project_id`.
    pub fn create_project(&mut self, name: impl Into<String>, settings: ProjectSettings) -> String {
        let project = Project::new(name, settings);
        let id = project.id.clone();

        // Очищаем selected_files во всех табах браузера
        for tab in BrowserState::all_tabs() {
            self.browser_state.selected_files.insert(tab, Vec::new());
        }

        self.project = Some(project);
        self.chat_sessions.clear();
        self.clipboard = None;
        self.playback_state = PlaybackState::default();
        self.version += 1;
        self.version_info.has_uncommitted_changes = true;

        id
    }

    /// Помечает проект как изменённый.
    pub fn mark_dirty(&mut self) {
        if let Some(ref mut p) = self.project {
            p.metadata.is_dirty = true;
            p.metadata.modified_at = Utc::now();
        }
        self.version += 1;
        self.version_info.has_uncommitted_changes = true;
    }

    /// Обновляет состояние воспроизведения (не помечает проект грязным).
    pub fn update_playback(&mut self, is_playing: bool, current_time: f64) {
        self.playback_state.is_playing = is_playing;
        self.playback_state.current_time = current_time;
        self.version += 1;
    }

    /// Создаёт снапшот состояния (для version control).
    pub fn create_snapshot(
        &self,
        author: impl Into<String>,
        message: Option<String>,
        parent_id: Option<String>,
    ) -> ProjectSnapshot {
        ProjectSnapshot {
            id: Uuid::new_v4().to_string(),
            timestamp: Utc::now(),
            author: author.into(),
            message,
            branch_name: self.version_info.branch_name.clone(),
            project_state: self.clone(),
            parent_id,
        }
    }

    /// Обновляет метаданные после создания снапшота.
    pub fn mark_snapshot_created(&mut self, version_id: impl Into<String>) {
        self.version_info.current_version_id = version_id.into();
        self.version_info.has_uncommitted_changes = false;
        self.version_info.last_snapshot_time = Utc::now();
    }

    /// Переключается на другую ветку.
    pub fn switch_branch(&mut self, branch_name: impl Into<String>) {
        self.version_info.branch_name = branch_name.into();
        self.version_info.has_uncommitted_changes = true;
        self.version += 1;
    }

    /// Настраивает автосохранение.
    pub fn configure_auto_save(&mut self, enabled: bool, interval_seconds: u32) {
        self.version_info.auto_save_enabled = enabled;
        self.version_info.auto_save_interval_seconds = interval_seconds;
    }
}

/// Снапшот состояния для version control.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[cfg_attr(feature = "specta", derive(Type))]
pub struct ProjectSnapshot {
    pub id: String,
    pub timestamp: chrono::DateTime<Utc>,
    pub author: String,
    pub message: Option<String>,
    pub branch_name: String,
    pub project_state: ProjectState,
    pub parent_id: Option<String>,
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::types::project::ProjectSettings;

    #[test]
    fn create_project() {
        let mut state = ProjectState::default();
        let id = state.create_project("Test", ProjectSettings::default());
        assert!(!id.is_empty());
        assert!(state.project.is_some());
        assert_eq!(state.project.as_ref().unwrap().metadata.name, "Test");
        assert_eq!(state.version, 1);
    }

    #[test]
    fn mark_dirty_increments_version() {
        let mut state = ProjectState::default();
        state.create_project("P", ProjectSettings::default());
        let v = state.version;
        state.mark_dirty();
        assert_eq!(state.version, v + 1);
        assert!(state.version_info.has_uncommitted_changes);
    }

    #[test]
    fn snapshot_roundtrip() {
        let mut state = ProjectState::default();
        state.create_project("Snap", ProjectSettings::default());
        let snap = state.create_snapshot("test-author", Some("msg".into()), None);
        assert_eq!(snap.author, "test-author");
        assert_eq!(snap.project_state.project.unwrap().metadata.name, "Snap");
    }
}

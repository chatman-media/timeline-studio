//! [`ProjectEvent`] — события изменений состояния проекта.

use crate::types::project::{MediaItem, PlaybackState, ProjectSettings, Track};
use serde::{Deserialize, Serialize};

#[cfg(feature = "specta")]
use specta::Type;

/// Событие об изменении состояния проекта.
///
/// Рассылается через `EventBus` / `EventSink` всем заинтересованным сторонам
/// (UI, агент, persistence, CLI).
#[derive(Debug, Clone, Serialize, Deserialize)]
#[cfg_attr(feature = "specta", derive(Type))]
#[serde(tag = "type", content = "payload", rename_all = "camelCase")]
pub enum ProjectEvent {
    // ── Жизненный цикл проекта ────────────────────────────────────────────
    ProjectCreated { project_id: String, name: String },
    ProjectOpened { project_id: String, path: String },
    ProjectSaved { project_id: String, path: String },
    ProjectClosed { project_id: String },
    ProjectSettingsUpdated { settings: ProjectSettings },

    // ── Треки ─────────────────────────────────────────────────────────────
    TrackAdded { track: Track },
    TrackDeleted { track_id: String },
    TrackUpdated { track_id: String, name: Option<String>, enabled: Option<bool> },
    TrackVolumeChanged { track_id: String, volume: f32 },

    // ── Клипы ─────────────────────────────────────────────────────────────
    ClipAdded { track_id: String, clip_id: String },
    ClipMoved { clip_id: String, new_track_id: String, new_time: f64 },
    ClipTrimmed { clip_id: String, new_in: f64, new_out: f64 },
    ClipDeleted { clip_id: String, track_id: String },
    ClipSplit { original_clip_id: String, left_clip_id: String, right_clip_id: String },

    // ── Медиа-пул ─────────────────────────────────────────────────────────
    MediaAdded { media: Box<MediaItem> },
    MediaRemoved { media_id: String },

    // ── Воспроизведение ───────────────────────────────────────────────────
    PlaybackUpdated { playback: PlaybackState },

    // ── Автосохранение ────────────────────────────────────────────────────
    AutoSaveTriggered { snapshot_id: String },

    // ── Прочее ────────────────────────────────────────────────────────────
    Error { message: String },
}

impl ProjectEvent {
    /// Возвращает короткое имя варианта для логирования / метрик.
    pub fn kind(&self) -> &'static str {
        match self {
            ProjectEvent::ProjectCreated { .. } => "ProjectCreated",
            ProjectEvent::ProjectOpened { .. } => "ProjectOpened",
            ProjectEvent::ProjectSaved { .. } => "ProjectSaved",
            ProjectEvent::ProjectClosed { .. } => "ProjectClosed",
            ProjectEvent::ProjectSettingsUpdated { .. } => "ProjectSettingsUpdated",
            ProjectEvent::TrackAdded { .. } => "TrackAdded",
            ProjectEvent::TrackDeleted { .. } => "TrackDeleted",
            ProjectEvent::TrackUpdated { .. } => "TrackUpdated",
            ProjectEvent::TrackVolumeChanged { .. } => "TrackVolumeChanged",
            ProjectEvent::ClipAdded { .. } => "ClipAdded",
            ProjectEvent::ClipMoved { .. } => "ClipMoved",
            ProjectEvent::ClipTrimmed { .. } => "ClipTrimmed",
            ProjectEvent::ClipDeleted { .. } => "ClipDeleted",
            ProjectEvent::ClipSplit { .. } => "ClipSplit",
            ProjectEvent::MediaAdded { .. } => "MediaAdded",
            ProjectEvent::MediaRemoved { .. } => "MediaRemoved",
            ProjectEvent::PlaybackUpdated { .. } => "PlaybackUpdated",
            ProjectEvent::AutoSaveTriggered { .. } => "AutoSaveTriggered",
            ProjectEvent::Error { .. } => "Error",
        }
    }
}

/// Обёртка события с метаданными источника и версии.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EventEnvelope {
    pub event: ProjectEvent,
    pub source: String,
    pub version: u32,
    pub timestamp: chrono::DateTime<chrono::Utc>,
}

impl EventEnvelope {
    pub fn new(event: ProjectEvent, source: impl Into<String>, version: u32) -> Self {
        Self {
            event,
            source: source.into(),
            version,
            timestamp: chrono::Utc::now(),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn kind_labels() {
        assert_eq!(
            ProjectEvent::ProjectClosed { project_id: "x".into() }.kind(),
            "ProjectClosed"
        );
        assert_eq!(
            ProjectEvent::AutoSaveTriggered { snapshot_id: "s".into() }.kind(),
            "AutoSaveTriggered"
        );
    }

    #[test]
    fn serde_roundtrip() {
        let ev = ProjectEvent::MediaRemoved { media_id: "m1".into() };
        let json = serde_json::to_string(&ev).unwrap();
        let back: ProjectEvent = serde_json::from_str(&json).unwrap();
        assert_eq!(back.kind(), "MediaRemoved");
    }
}

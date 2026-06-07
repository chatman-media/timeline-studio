//! Timeline-операции через `ts-state::StateManager`.
//!
//! Headless-аналог `src-tauri/src/state/commands/timeline.rs`.

use serde_json::{json, Value};
use ts_state::StateManager;
use ts_state::types::project::Clip;
use uuid::Uuid;

/// Результат timeline-команды (аналог CommandResult из монолита).
#[derive(Debug)]
pub struct TimelineResult {
    pub success: bool,
    pub data: Option<Value>,
    pub error: Option<String>,
}

impl TimelineResult {
    pub fn ok(data: Value) -> Self {
        Self { success: true, data: Some(data), error: None }
    }
    pub fn err(msg: impl Into<String>) -> Self {
        Self { success: false, data: None, error: Some(msg.into()) }
    }
}

/// Timeline-команды через headless `StateManager`.
pub struct TimelineOps {
    manager: StateManager,
}

impl TimelineOps {
    pub fn new(manager: StateManager) -> Self {
        Self { manager }
    }

    /// Добавить клип на трек.
    pub async fn add_clip(
        &self,
        track_id: String,
        media_id: String,
        time: f64,
    ) -> TimelineResult {
        self.manager
            .mutate(|state| {
                let project = match state.project.as_mut() {
                    Some(p) => p,
                    None => return TimelineResult::err("No project open"),
                };

                let (media_name, media_duration) =
                    match project.media_pool.items.get(&media_id) {
                        Some(m) => (m.name.clone(), m.duration.unwrap_or(5.0)),
                        None => return TimelineResult::err("Media not found in pool"),
                    };

                let track = match project
                    .timeline
                    .tracks
                    .iter_mut()
                    .find(|t| t.id == track_id)
                {
                    Some(t) => t,
                    None => return TimelineResult::err("Track not found"),
                };

                let clip_id = Uuid::new_v4().to_string();
                track.clips.push(Clip {
                    id: clip_id.clone(),
                    media_id: media_id.clone(),
                    name: media_name,
                    timeline_in: time,
                    timeline_out: time + media_duration,
                    source_in: 0.0,
                    source_out: media_duration,
                    playback_rate: 1.0,
                    enabled: true,
                    effects: Vec::new(),
                    transitions: Vec::new(),
                    keyframes: Vec::new(),
                });
                track.clips.sort_by(|a, b| {
                    a.timeline_in.partial_cmp(&b.timeline_in).unwrap()
                });
                state.mark_dirty();

                TimelineResult::ok(json!({
                    "clip_id": clip_id,
                    "track_id": track_id,
                    "media_id": media_id,
                    "timeline_in": time,
                    "timeline_out": time + media_duration,
                }))
            })
            .await
    }

    /// Удалить клип.
    pub async fn delete_clip(&self, clip_id: String) -> TimelineResult {
        self.manager
            .mutate(|state| {
                let project = match state.project.as_mut() {
                    Some(p) => p,
                    None => return TimelineResult::err("No project open"),
                };
                for track in &mut project.timeline.tracks {
                    if let Some(pos) = track.clips.iter().position(|c| c.id == clip_id) {
                        track.clips.remove(pos);
                        state.mark_dirty();
                        return TimelineResult::ok(json!({ "clip_id": clip_id, "deleted": true }));
                    }
                }
                TimelineResult::err(format!("Clip not found: {clip_id}"))
            })
            .await
    }

    /// Переместить клип на новый трек / новое время.
    pub async fn move_clip(
        &self,
        clip_id: String,
        new_track_id: String,
        new_time: f64,
    ) -> TimelineResult {
        self.manager
            .mutate(|state| {
                let project = match state.project.as_mut() {
                    Some(p) => p,
                    None => return TimelineResult::err("No project open"),
                };

                // Забираем клип из старого трека
                let mut clip_opt: Option<Clip> = None;
                for track in &mut project.timeline.tracks {
                    if let Some(pos) = track.clips.iter().position(|c| c.id == clip_id) {
                        clip_opt = Some(track.clips.remove(pos));
                        break;
                    }
                }
                let mut clip = match clip_opt {
                    Some(c) => c,
                    None => return TimelineResult::err(format!("Clip not found: {clip_id}")),
                };

                let duration = clip.timeline_out - clip.timeline_in;
                clip.timeline_in = new_time;
                clip.timeline_out = new_time + duration;

                match project.timeline.tracks.iter_mut().find(|t| t.id == new_track_id) {
                    Some(target) => {
                        target.clips.push(clip);
                        target.clips.sort_by(|a, b| {
                            a.timeline_in.partial_cmp(&b.timeline_in).unwrap()
                        });
                    }
                    None => {
                        return TimelineResult::err(format!(
                            "Target track not found: {new_track_id}"
                        ))
                    }
                }

                state.mark_dirty();
                TimelineResult::ok(json!({
                    "clip_id": clip_id,
                    "new_track_id": new_track_id,
                    "new_time": new_time,
                }))
            })
            .await
    }

    /// Разбить клип на две части.
    pub async fn split_clip(&self, clip_id: String, split_time: f64) -> TimelineResult {
        self.manager
            .mutate(|state| {
                let project = match state.project.as_mut() {
                    Some(p) => p,
                    None => return TimelineResult::err("No project open"),
                };

                for track in &mut project.timeline.tracks {
                    if let Some(pos) = track.clips.iter().position(|c| c.id == clip_id) {
                        let orig = &track.clips[pos];

                        if split_time <= orig.timeline_in || split_time >= orig.timeline_out {
                            return TimelineResult::err(
                                "Split time is outside clip boundaries",
                            );
                        }

                        let offset = split_time - orig.timeline_in;
                        let left = Clip {
                            id: Uuid::new_v4().to_string(),
                            timeline_in: orig.timeline_in,
                            timeline_out: split_time,
                            source_in: orig.source_in,
                            source_out: orig.source_in + offset,
                            ..orig.clone()
                        };
                        let right = Clip {
                            id: Uuid::new_v4().to_string(),
                            timeline_in: split_time,
                            timeline_out: orig.timeline_out,
                            source_in: orig.source_in + offset,
                            source_out: orig.source_out,
                            ..orig.clone()
                        };
                        let (left_id, right_id) = (left.id.clone(), right.id.clone());

                        track.clips.remove(pos);
                        track.clips.push(left);
                        track.clips.push(right);
                        track.clips.sort_by(|a, b| {
                            a.timeline_in.partial_cmp(&b.timeline_in).unwrap()
                        });

                        state.mark_dirty();
                        return TimelineResult::ok(json!({
                            "original_clip_id": clip_id,
                            "left_clip_id": left_id,
                            "right_clip_id": right_id,
                            "split_time": split_time,
                        }));
                    }
                }
                TimelineResult::err(format!("Clip not found: {clip_id}"))
            })
            .await
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use ts_state::types::project::{
        MediaItem, MediaMetadata, ProjectSettings, Track, TrackType,
    };
    use ts_schema::MediaType;
    use ts_state::StateManager;

    async fn setup_manager_with_track() -> (StateManager, String, String) {
        let mgr = StateManager::with_log_sink();
        let _proj_id = mgr.create_project("Test", ProjectSettings::default()).await;

        // Добавляем трек и медиа напрямую через mutate
        let (track_id, media_id) = mgr
            .mutate(|state| {
                let project = state.project.as_mut().unwrap();
                let track_id = Uuid::new_v4().to_string();
                project.timeline.tracks.push(Track {
                    id: track_id.clone(),
                    name: "Video 1".into(),
                    track_type: TrackType::Video,
                    enabled: true,
                    locked: false,
                    height: 80,
                    clips: Vec::new(),
                    effects: Vec::new(),
                    volume: 1.0,
                    pan: 0.0,
                });

                let media_id = Uuid::new_v4().to_string();
                project.media_pool.items.insert(
                    media_id.clone(),
                    MediaItem {
                        id: media_id.clone(),
                        path: "/tmp/test.mp4".into(),
                        name: "test.mp4".into(),
                        media_type: MediaType::Video,
                        duration: Some(10.0),
                        metadata: MediaMetadata {
                            format: "mp4".into(),
                            codec: None,
                            resolution: None,
                            frame_rate: None,
                            bitrate: None,
                            audio_channels: None,
                            sample_rate: None,
                            creation_time: None,
                        },
                        thumbnail: None,
                        usage_count: 0,
                        in_timeline: false,
                        is_resource: false,
                        bin: None,
                        added_at: 0.0,
                        proxy_path: None,
                    },
                );
                (track_id, media_id)
            })
            .await;

        (mgr, track_id, media_id)
    }

    #[tokio::test]
    async fn add_and_delete_clip() {
        let (mgr, track_id, media_id) = setup_manager_with_track().await;
        let ops = TimelineOps::new(mgr.clone());

        let add = ops.add_clip(track_id.clone(), media_id.clone(), 0.0).await;
        assert!(add.success, "{:?}", add.error);
        let clip_id = add.data.unwrap()["clip_id"].as_str().unwrap().to_string();

        // Verify clip exists
        let state = mgr.get_state().await;
        let track = state
            .project
            .as_ref()
            .unwrap()
            .timeline
            .tracks
            .iter()
            .find(|t| t.id == track_id)
            .unwrap();
        assert_eq!(track.clips.len(), 1);
        drop(state);

        // Delete
        let del = ops.delete_clip(clip_id).await;
        assert!(del.success, "{:?}", del.error);
        let state = mgr.get_state().await;
        let track = state
            .project
            .as_ref()
            .unwrap()
            .timeline
            .tracks
            .iter()
            .find(|t| t.id == track_id)
            .unwrap();
        assert_eq!(track.clips.len(), 0);
    }

    #[tokio::test]
    async fn split_clip_works() {
        let (mgr, track_id, media_id) = setup_manager_with_track().await;
        let ops = TimelineOps::new(mgr.clone());

        let add = ops.add_clip(track_id.clone(), media_id.clone(), 0.0).await;
        let clip_id = add.data.unwrap()["clip_id"].as_str().unwrap().to_string();

        let split = ops.split_clip(clip_id, 5.0).await;
        assert!(split.success, "{:?}", split.error);
        let data = split.data.unwrap();
        assert!(data["left_clip_id"].is_string());
        assert!(data["right_clip_id"].is_string());

        let state = mgr.get_state().await;
        let track = state
            .project
            .as_ref()
            .unwrap()
            .timeline
            .tracks
            .iter()
            .find(|t| t.id == track_id)
            .unwrap();
        assert_eq!(track.clips.len(), 2);
        assert_eq!(track.clips[0].timeline_out, 5.0);
        assert_eq!(track.clips[1].timeline_in, 5.0);
    }
}

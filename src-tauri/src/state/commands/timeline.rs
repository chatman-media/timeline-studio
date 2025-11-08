use super::types::CommandResult;
use crate::state::project_state::*;
use crate::state::{EventBus, ProjectEvent, ProjectState};
use crate::types_export::ClipUpdates;
use std::sync::Arc;
use tokio::sync::RwLock;

/// Timeline commands implementation
pub struct TimelineCommands {
  state: Arc<RwLock<ProjectState>>,
  event_bus: Arc<EventBus>,
}

impl TimelineCommands {
  pub fn new(state: Arc<RwLock<ProjectState>>, event_bus: Arc<EventBus>) -> Self {
    Self { state, event_bus }
  }

  async fn add_clip(&self, track_id: String, media_id: String, time: f64) -> CommandResult {
    let mut state = self.state.write().await;

    let project = match state.project.as_mut() {
      Some(p) => p,
      None => return CommandResult::error("No project open".to_string()),
    };

    // Find the track
    let track = match project
      .timeline
      .tracks
      .iter_mut()
      .find(|t| t.id == track_id)
    {
      Some(t) => t,
      None => return CommandResult::error("Track not found".to_string()),
    };

    // Verify media exists
    if !project.media_pool.items.contains_key(&media_id) {
      return CommandResult::error("Media not found in pool".to_string());
    }

    // Create clip
    let clip_id = uuid::Uuid::new_v4().to_string();
    let media = &project.media_pool.items[&media_id];
    let duration = media.duration.unwrap_or(5.0); // Default 5 seconds for images

    let clip = Clip {
      id: clip_id.clone(),
      media_id: media_id.clone(),
      name: media.name.clone(),
      timeline_in: time,
      timeline_out: time + duration,
      source_in: 0.0,
      source_out: duration,
      playback_rate: 1.0,
      enabled: true,
      effects: Vec::new(),
      transitions: Vec::new(),
    };

    // Add clip to track
    track.clips.push(clip.clone());
    track
      .clips
      .sort_by(|a, b| a.timeline_in.partial_cmp(&b.timeline_in).unwrap());

    state.mark_dirty();
    let version = state.version;

    // Publish event
    self
      .event_bus
      .publish(
        ProjectEvent::ClipAdded {
          track_id,
          clip: crate::state::events::ClipData {
            id: clip_id.clone(),
            media_id,
            name: clip.name,
            timeline_in: clip.timeline_in,
            timeline_out: clip.timeline_out,
            source_in: clip.source_in,
            source_out: clip.source_out,
          },
        },
        "command_handler".to_string(),
        version,
      )
      .await
      .ok();

    CommandResult::success(Some(serde_json::json!({ "clip_id": clip_id })))
  }

  async fn move_clip(&self, clip_id: String, new_track_id: String, new_time: f64) -> CommandResult {
    let mut state = self.state.write().await;

    let project = match state.project.as_mut() {
      Some(p) => p,
      None => return CommandResult::error("No project open".to_string()),
    };

    // Find and remove clip from current track
    let mut clip = None;

    for track in &mut project.timeline.tracks {
      if let Some(pos) = track.clips.iter().position(|c| c.id == clip_id) {
        clip = Some(track.clips.remove(pos));
        break;
      }
    }

    let mut clip = match clip {
      Some(c) => c,
      None => return CommandResult::error("Clip not found".to_string()),
    };

    // Find new track
    let new_track = match project
      .timeline
      .tracks
      .iter_mut()
      .find(|t| t.id == new_track_id)
    {
      Some(t) => t,
      None => return CommandResult::error("Target track not found".to_string()),
    };

    // Update clip position
    let duration = clip.timeline_out - clip.timeline_in;
    clip.timeline_in = new_time;
    clip.timeline_out = new_time + duration;

    // Add to new track
    new_track.clips.push(clip);
    new_track
      .clips
      .sort_by(|a, b| a.timeline_in.partial_cmp(&b.timeline_in).unwrap());

    state.mark_dirty();
    let version = state.version;

    // Publish event
    self
      .event_bus
      .publish(
        ProjectEvent::ClipMoved {
          clip_id,
          new_track_id,
          new_time,
        },
        "command_handler".to_string(),
        version,
      )
      .await
      .ok();

    CommandResult::success(None)
  }

  async fn delete_clip(&self, clip_id: String) -> CommandResult {
    log::info!("Deleting clip: {}", clip_id);

    let mut state = self.state.write().await;

    let project = match state.project.as_mut() {
      Some(p) => p,
      None => return CommandResult::error("No project open".to_string()),
    };

    // Find and remove the clip from any track
    let mut clip_found = false;
    for track in &mut project.timeline.tracks {
      if let Some(index) = track.clips.iter().position(|c| c.id == clip_id) {
        track.clips.remove(index);
        clip_found = true;
        break;
      }
    }

    if clip_found {
      state.mark_dirty();

      self
        .event_bus
        .publish(
          ProjectEvent::ClipDeleted {
            clip_id: clip_id.clone(),
            track_id: "unknown".to_string(), // We don't track which track it was from
          },
          "command_handler".to_string(),
          state.version,
        )
        .await
        .ok();

      CommandResult::success(Some(serde_json::json!({ "deleted_clip_id": clip_id })))
    } else {
      CommandResult::error(format!("Clip not found: {}", clip_id))
    }
  }

  async fn split_clip(&self, clip_id: String, time: f64) -> CommandResult {
    log::info!("Splitting clip: id={}, time={}", clip_id, time);

    let mut state = self.state.write().await;

    let project = match state.project.as_mut() {
      Some(p) => p,
      None => return CommandResult::error("No project open".to_string()),
    };

    // Find the clip and its track
    let mut found_clip: Option<Clip> = None;
    let mut track_id_found: Option<String> = None;
    let mut clip_index: Option<usize> = None;

    for track in &mut project.timeline.tracks {
      if let Some((idx, clip)) = track
        .clips
        .iter()
        .enumerate()
        .find(|(_, c)| c.id == clip_id)
      {
        found_clip = Some(clip.clone());
        track_id_found = Some(track.id.clone());
        clip_index = Some(idx);
        break;
      }
    }

    let original_clip = match found_clip {
      Some(c) => c,
      None => return CommandResult::error("Clip not found".to_string()),
    };

    let track_id = track_id_found.unwrap();
    let clip_idx = clip_index.unwrap();

    // Validate split time is within clip bounds
    if time <= original_clip.timeline_in || time >= original_clip.timeline_out {
      return CommandResult::error("Split time must be within clip bounds".to_string());
    }

    // Calculate split parameters
    let split_offset = time - original_clip.timeline_in;
    let left_duration = split_offset;
    let right_duration = (original_clip.timeline_out - original_clip.timeline_in) - split_offset;
    let right_source_in = original_clip.source_in + split_offset;

    // Create left clip (keeps original ID)
    let left_clip = Clip {
      id: original_clip.id.clone(),
      media_id: original_clip.media_id.clone(),
      name: original_clip.name.clone(),
      timeline_in: original_clip.timeline_in,
      timeline_out: time,
      source_in: original_clip.source_in,
      source_out: original_clip.source_in + left_duration,
      playback_rate: original_clip.playback_rate,
      enabled: original_clip.enabled,
      effects: original_clip.effects.clone(),
      transitions: original_clip.transitions.clone(),
    };

    // Create right clip (new ID)
    let right_clip_id = uuid::Uuid::new_v4().to_string();
    let right_clip = Clip {
      id: right_clip_id.clone(),
      media_id: original_clip.media_id.clone(),
      name: format!("{} (split)", original_clip.name),
      timeline_in: time,
      timeline_out: time + right_duration,
      source_in: right_source_in,
      source_out: original_clip.source_out,
      playback_rate: original_clip.playback_rate,
      enabled: original_clip.enabled,
      effects: original_clip.effects.clone(),
      transitions: original_clip.transitions.clone(),
    };

    // Replace original clip with left and right clips
    let track = project
      .timeline
      .tracks
      .iter_mut()
      .find(|t| t.id == track_id)
      .unwrap();

    track.clips.remove(clip_idx);
    track.clips.push(left_clip.clone());
    track.clips.push(right_clip.clone());

    // Sort clips by timeline position
    track
      .clips
      .sort_by(|a, b| a.timeline_in.partial_cmp(&b.timeline_in).unwrap());

    state.mark_dirty();
    let version = state.version;

    // Publish event
    self
      .event_bus
      .publish(
        ProjectEvent::ClipSplit {
          original_clip_id: clip_id.clone(),
          left_clip: crate::state::events::ClipData {
            id: left_clip.id.clone(),
            media_id: left_clip.media_id.clone(),
            name: left_clip.name.clone(),
            timeline_in: left_clip.timeline_in,
            timeline_out: left_clip.timeline_out,
            source_in: left_clip.source_in,
            source_out: left_clip.source_out,
          },
          right_clip: crate::state::events::ClipData {
            id: right_clip.id.clone(),
            media_id: right_clip.media_id.clone(),
            name: right_clip.name.clone(),
            timeline_in: right_clip.timeline_in,
            timeline_out: right_clip.timeline_out,
            source_in: right_clip.source_in,
            source_out: right_clip.source_out,
          },
          track_id: track_id.clone(),
        },
        "command_handler".to_string(),
        version,
      )
      .await
      .ok();

    CommandResult::success(Some(serde_json::json!({
      "original_clip_id": clip_id,
      "left_clip_id": left_clip.id,
      "right_clip_id": right_clip_id,
      "track_id": track_id
    })))
  }

  async fn trim_clip(&self, clip_id: String, start: f64, end: f64) -> CommandResult {
    log::info!("Trimming clip: {} from {} to {}", clip_id, start, end);

    let mut state = self.state.write().await;

    let project = match state.project.as_mut() {
      Some(p) => p,
      None => return CommandResult::error("No project open".to_string()),
    };

    // Find the clip and track
    let mut found_clip: Option<Clip> = None;
    let mut track_id_found: Option<String> = None;

    for track in &mut project.timeline.tracks {
      if let Some(clip) = track.clips.iter().find(|c| c.id == clip_id) {
        found_clip = Some(clip.clone());
        track_id_found = Some(track.id.clone());
        break;
      }
    }

    let original_clip = match found_clip {
      Some(c) => c,
      None => return CommandResult::error("Clip not found".to_string()),
    };

    let track_id = track_id_found.unwrap();

    // Validate new bounds
    if start >= end {
      return CommandResult::error("Start must be before end".to_string());
    }

    let new_duration = end - start;
    if new_duration < 0.01 {
      // Minimum 0.01 seconds (10ms)
      return CommandResult::error("Clip duration too short".to_string());
    }

    // Calculate source adjustments
    let start_delta = start - original_clip.timeline_in;
    let end_delta = original_clip.timeline_out - end;

    // Update source in/out based on timeline trim
    let new_source_in = original_clip.source_in + start_delta;
    let new_source_out = original_clip.source_out - end_delta;

    // Validate source bounds (can't trim beyond source media)
    if new_source_in < 0.0 {
      return CommandResult::error("Cannot trim before source media start".to_string());
    }
    if new_source_out > original_clip.source_out {
      return CommandResult::error("Cannot trim beyond source media end".to_string());
    }

    // Apply trim
    for track in &mut project.timeline.tracks {
      if track.id == track_id {
        if let Some(clip) = track.clips.iter_mut().find(|c| c.id == clip_id) {
          clip.timeline_in = start;
          clip.timeline_out = end;
          clip.source_in = new_source_in;
          clip.source_out = new_source_out;
          break;
        }
      }
    }

    state.mark_dirty();
    let version = state.version;

    self
      .event_bus
      .publish(
        ProjectEvent::ClipTrimmed {
          clip_id: clip_id.clone(),
          new_in: start,
          new_out: end,
        },
        "command_handler".to_string(),
        version,
      )
      .await
      .ok();

    CommandResult::success(Some(serde_json::json!({
      "trimmed_clip_id": clip_id,
      "timeline_in": start,
      "timeline_out": end,
      "source_in": new_source_in,
      "source_out": new_source_out,
      "track_id": track_id
    })))
  }

  async fn copy_clips(&self, clip_ids: Vec<String>) -> CommandResult {
    log::info!("Copying {} clips", clip_ids.len());

    let mut state = self.state.write().await;

    let project = match state.project.as_ref() {
      Some(p) => p,
      None => return CommandResult::error("No project open".to_string()),
    };

    // Find all clips with given IDs
    let mut clips_to_copy: Vec<Clip> = Vec::new();
    let mut track_ids: Vec<String> = Vec::new();

    for track in &project.timeline.tracks {
      for clip in &track.clips {
        if clip_ids.contains(&clip.id) {
          clips_to_copy.push(clip.clone());
          if !track_ids.contains(&track.id) {
            track_ids.push(track.id.clone());
          }
        }
      }
    }

    if clips_to_copy.is_empty() {
      return CommandResult::error("No clips found to copy".to_string());
    }

    // Store in clipboard
    state.clipboard = Some(crate::state::project_state::ClipboardData {
      clips: clips_to_copy.clone(),
      copied_at: chrono::Utc::now(),
      original_track_ids: track_ids.clone(),
    });

    CommandResult::success(Some(serde_json::json!({
      "copied": true,
      "count": clips_to_copy.len(),
      "clip_ids": clip_ids,
      "track_ids": track_ids
    })))
  }

  async fn paste_clips(&self, track_id: String, time: f64) -> CommandResult {
    log::info!("Pasting clips to track {} at time {}", track_id, time);

    let mut state = self.state.write().await;

    // Get clipboard data first (before mutable borrow)
    let clipboard_data = match &state.clipboard {
      Some(data) => data.clone(),
      None => return CommandResult::error("Clipboard is empty".to_string()),
    };

    let project = match state.project.as_mut() {
      Some(p) => p,
      None => return CommandResult::error("No project open".to_string()),
    };

    // Find target track
    let track = match project
      .timeline
      .tracks
      .iter_mut()
      .find(|t| t.id == track_id)
    {
      Some(t) => t,
      None => return CommandResult::error("Track not found".to_string()),
    };

    // Calculate time offset (from first clip's original position to paste position)
    let min_original_time = clipboard_data
      .clips
      .iter()
      .map(|c| c.timeline_in)
      .min_by(|a, b| a.partial_cmp(b).unwrap())
      .unwrap_or(0.0);
    let time_offset = time - min_original_time;

    // Create new clips with updated IDs and positions
    let mut new_clip_ids = Vec::new();
    for clip in &clipboard_data.clips {
      let new_clip_id = uuid::Uuid::new_v4().to_string();
      let new_clip = Clip {
        id: new_clip_id.clone(),
        media_id: clip.media_id.clone(),
        name: format!("{} (copy)", clip.name),
        timeline_in: clip.timeline_in + time_offset,
        timeline_out: clip.timeline_out + time_offset,
        source_in: clip.source_in,
        source_out: clip.source_out,
        playback_rate: clip.playback_rate,
        enabled: clip.enabled,
        effects: clip.effects.clone(),
        transitions: clip.transitions.clone(),
      };

      track.clips.push(new_clip);
      new_clip_ids.push(new_clip_id);
    }

    // Sort clips by timeline position
    track
      .clips
      .sort_by(|a, b| a.timeline_in.partial_cmp(&b.timeline_in).unwrap());

    state.mark_dirty();
    let version = state.version;

    // Publish events for each pasted clip
    for clip_id in &new_clip_ids {
      self
        .event_bus
        .publish(
          ProjectEvent::ClipAdded {
            track_id: track_id.clone(),
            clip: crate::state::events::ClipData {
              id: clip_id.clone(),
              media_id: String::new(), // Will be filled from actual clip
              name: String::new(),
              timeline_in: time,
              timeline_out: time,
              source_in: 0.0,
              source_out: 0.0,
            },
          },
          "command_handler".to_string(),
          version,
        )
        .await
        .ok();
    }

    CommandResult::success(Some(serde_json::json!({
      "pasted": true,
      "track_id": track_id,
      "time": time,
      "count": new_clip_ids.len(),
      "new_clip_ids": new_clip_ids
    })))
  }

  async fn update_clip(&self, clip_id: String, updates: ClipUpdates) -> CommandResult {
    log::info!("Updating clip: {} with updates: {:?}", clip_id, updates);

    let mut state = self.state.write().await;

    let project = match state.project.as_mut() {
      Some(p) => p,
      None => return CommandResult::error("No project open".to_string()),
    };

    // Find the clip across all tracks
    let mut clip_found = false;
    let clip_name_change = updates.name.clone();

    for track in &mut project.timeline.tracks {
      if let Some(clip) = track.clips.iter_mut().find(|c| c.id == clip_id) {
        if let Some(name) = updates.name {
          clip.name = name;
        }
        if let Some(playback_rate) = updates.playback_rate {
          clip.playback_rate = playback_rate;
        }
        if let Some(enabled) = updates.enabled {
          clip.enabled = enabled;
        }
        clip_found = true;
        break;
      }
    }

    if clip_found {
      state.mark_dirty();

      self
        .event_bus
        .publish(
          ProjectEvent::ClipUpdated {
            clip_id: clip_id.clone(),
            changes: crate::state::events::ClipChanges {
              name: clip_name_change,
              playback_rate: updates.playback_rate,
              volume: None,  // Not in updates
              effects: None, // Not in updates
            },
          },
          "command_handler".to_string(),
          state.version,
        )
        .await
        .ok();

      CommandResult::success(Some(serde_json::json!({ "updated_clip_id": clip_id })))
    } else {
      CommandResult::error(format!("Clip not found: {}", clip_id))
    }
  }
}

use super::types::CommandResult;
use crate::state::{EventBus, ProjectEvent, ProjectState};
use std::sync::Arc;
use tokio::sync::RwLock;

/// Advanced editing commands implementation (Ripple, Roll, Slip, Slide)
pub struct AdvancedEditsCommands {
  state: Arc<RwLock<ProjectState>>,
  event_bus: Arc<EventBus>,
}

impl AdvancedEditsCommands {
  pub fn new(state: Arc<RwLock<ProjectState>>, event_bus: Arc<EventBus>) -> Self {
    Self { state, event_bus }
  }

  // Advanced Edit Commands
  async fn ripple_edit(&self, clip_id: String, delta: f64) -> CommandResult {
    log::info!("Ripple edit: clip_id={}, delta={}", clip_id, delta);

    let mut state = self.state.write().await;
    let project = match state.project.as_mut() {
      Some(p) => p,
      None => return CommandResult::error("No project open".to_string()),
    };

    // Find the clip and its track
    let mut target_track_id: Option<String> = None;
    let mut target_clip_timeline_out: Option<f64> = None;

    for track in &mut project.timeline.tracks {
      for clip in &mut track.clips {
        if clip.id == clip_id {
          // Apply delta to target clip
          clip.timeline_in += delta;
          clip.timeline_out += delta;

          // Validate clip doesn't go negative
          if clip.timeline_in < 0.0 {
            return CommandResult::error(format!(
              "Ripple edit would move clip before timeline start (new in: {})",
              clip.timeline_in
            ));
          }

          target_track_id = Some(track.id.clone());
          target_clip_timeline_out = Some(clip.timeline_out - delta); // Original end position
          break;
        }
      }
      if target_track_id.is_some() {
        break;
      }
    }

    let target_track_id = match target_track_id {
      Some(id) => id,
      None => return CommandResult::error(format!("Clip not found: {}", clip_id)),
    };

    let original_end = target_clip_timeline_out.unwrap();

    // Find and move all subsequent clips on the same track
    let mut moved_clip_ids = vec![clip_id.clone()];

    for track in &mut project.timeline.tracks {
      if track.id == target_track_id {
        for clip in &mut track.clips {
          // Skip the original clip
          if clip.id == clip_id {
            continue;
          }

          // Move clips that start at or after the original clip's end
          if clip.timeline_in >= original_end {
            clip.timeline_in += delta;
            clip.timeline_out += delta;

            // Validate
            if clip.timeline_in < 0.0 {
              return CommandResult::error(format!(
                "Ripple edit would move clip {} before timeline start",
                clip.id
              ));
            }

            moved_clip_ids.push(clip.id.clone());
          }
        }
        break;
      }
    }

    state.mark_dirty();

    // Publish event for each moved clip
    for moved_id in &moved_clip_ids {
      self
        .event_bus
        .publish(
          ProjectEvent::ClipMoved {
            clip_id: moved_id.clone(),
            new_track_id: target_track_id.clone(),
            new_time: 0.0, // Frontend will get actual position from state
          },
          "command_handler".to_string(),
          state.version,
        )
        .await
        .ok();
    }

    CommandResult::success(Some(serde_json::json!({
      "clip_id": clip_id,
      "delta": delta,
      "moved_clips": moved_clip_ids.len(),
      "type": "ripple"
    })))
  }

  async fn roll_edit(
    &self,
    clip_id: String,
    adjacent_clip_id: String,
    delta: f64,
  ) -> CommandResult {
    log::info!(
      "Roll edit: clip_id={}, adjacent_clip_id={}, delta={}",
      clip_id,
      adjacent_clip_id,
      delta
    );

    let mut state = self.state.write().await;
    let project = match state.project.as_mut() {
      Some(p) => p,
      None => return CommandResult::error("No project open".to_string()),
    };

    // Find both clips and validate they're on the same track
    let mut first_clip_info: Option<(String, f64, f64, f64, f64)> = None; // (track_id, timeline_out, source_out, media_id, duration)
    let mut second_clip_info: Option<(f64, f64, f64, f64)> = None; // (timeline_in, source_in, source_out, duration)

    for track in &project.timeline.tracks {
      let mut first_found = false;
      let mut second_found = false;

      for clip in &track.clips {
        if clip.id == clip_id {
          first_clip_info = Some((
            track.id.clone(),
            clip.timeline_out,
            clip.source_out,
            clip.timeline_out - clip.timeline_in,
            clip.source_out - clip.source_in,
          ));
          first_found = true;
        }
        if clip.id == adjacent_clip_id {
          second_clip_info = Some((
            clip.timeline_in,
            clip.source_in,
            clip.source_out,
            clip.timeline_out - clip.timeline_in,
          ));
          second_found = true;
        }
      }

      if first_found && second_found {
        break;
      }

      // Reset if not both on same track
      if first_found || second_found {
        first_clip_info = None;
        second_clip_info = None;
      }
    }

    if first_clip_info.is_none() || second_clip_info.is_none() {
      return CommandResult::error("Both clips must exist on the same track".to_string());
    }

    let (track_id, first_timeline_out, _first_source_out, first_duration, _first_source_duration) =
      first_clip_info.unwrap();
    let (second_timeline_in, _second_source_in, second_source_out, second_duration) =
      second_clip_info.unwrap();

    // Validate clips are adjacent
    let gap = (second_timeline_in - first_timeline_out).abs();
    if gap > 0.01 {
      return CommandResult::error(format!("Clips are not adjacent (gap: {})", gap));
    }

    // Calculate new durations
    let new_first_duration = first_duration + delta;
    let new_second_duration = second_duration - delta;

    // Validate minimum clip durations
    const MIN_CLIP_DURATION: f64 = 0.033; // ~1 frame at 30fps
    if new_first_duration < MIN_CLIP_DURATION {
      return CommandResult::error(format!(
        "Roll edit would make first clip too short ({} < {})",
        new_first_duration, MIN_CLIP_DURATION
      ));
    }
    if new_second_duration < MIN_CLIP_DURATION {
      return CommandResult::error(format!(
        "Roll edit would make second clip too short ({} < {})",
        new_second_duration, MIN_CLIP_DURATION
      ));
    }

    // Apply changes
    for track in &mut project.timeline.tracks {
      if track.id != track_id {
        continue;
      }

      for clip in &mut track.clips {
        if clip.id == clip_id {
          // Extend/shrink first clip's end
          clip.timeline_out += delta;
          clip.source_out += delta;

          // Validate source bounds
          let source_duration = clip.source_out - clip.source_in;
          if clip.source_out > source_duration || clip.source_in < 0.0 {
            return CommandResult::error(
              "Roll edit would exceed source media bounds for first clip".to_string(),
            );
          }
        } else if clip.id == adjacent_clip_id {
          // Shrink/extend second clip's start
          clip.timeline_in += delta;
          clip.source_in += delta;

          // Validate source bounds
          if clip.source_in < 0.0 || clip.source_in > second_source_out {
            return CommandResult::error(
              "Roll edit would exceed source media bounds for second clip".to_string(),
            );
          }
        }
      }
      break;
    }

    state.mark_dirty();

    // Publish events
    self
      .event_bus
      .publish(
        ProjectEvent::ClipUpdated {
          clip_id: clip_id.clone(),
          changes: crate::state::events::ClipChanges {
            name: None,
            playback_rate: None,
            volume: None,
            effects: None,
          },
        },
        "command_handler".to_string(),
        state.version,
      )
      .await
      .ok();

    self
      .event_bus
      .publish(
        ProjectEvent::ClipUpdated {
          clip_id: adjacent_clip_id.clone(),
          changes: crate::state::events::ClipChanges {
            name: None,
            playback_rate: None,
            volume: None,
            effects: None,
          },
        },
        "command_handler".to_string(),
        state.version,
      )
      .await
      .ok();

    CommandResult::success(Some(serde_json::json!({
      "clip_id": clip_id,
      "adjacent_clip_id": adjacent_clip_id,
      "delta": delta,
      "type": "roll"
    })))
  }

  async fn slip_edit(&self, clip_id: String, delta: f64) -> CommandResult {
    log::info!("Slip edit: clip_id={}, delta={}", clip_id, delta);

    let mut state = self.state.write().await;
    let project = match state.project.as_mut() {
      Some(p) => p,
      None => return CommandResult::error("No project open".to_string()),
    };

    // Find the clip and get media duration
    let mut clip_found = false;
    let mut media_id: Option<String> = None;

    for track in &mut project.timeline.tracks {
      for clip in &mut track.clips {
        if clip.id == clip_id {
          media_id = Some(clip.media_id.clone());

          // Calculate new source in/out
          let new_source_in = clip.source_in + delta;
          let new_source_out = clip.source_out + delta;

          // Get media duration from media pool
          let media_duration = if let Some(media) = project.media_pool.items.get(&clip.media_id) {
            media.duration.unwrap_or(0.0)
          } else {
            return CommandResult::error(format!("Media not found: {}", clip.media_id));
          };

          // Validate source bounds
          if new_source_in < 0.0 {
            return CommandResult::error(format!(
              "Slip edit would move source start before media start (new source_in: {})",
              new_source_in
            ));
          }

          if new_source_out > media_duration {
            return CommandResult::error(format!(
              "Slip edit would move source end beyond media duration (new source_out: {} > {})",
              new_source_out, media_duration
            ));
          }

          // Apply slip - only source points change, timeline position stays same
          clip.source_in = new_source_in;
          clip.source_out = new_source_out;

          clip_found = true;
          break;
        }
      }
      if clip_found {
        break;
      }
    }

    if !clip_found {
      return CommandResult::error(format!("Clip not found: {}", clip_id));
    }

    state.mark_dirty();

    // Publish event
    self
      .event_bus
      .publish(
        ProjectEvent::ClipUpdated {
          clip_id: clip_id.clone(),
          changes: crate::state::events::ClipChanges {
            name: None,
            playback_rate: None,
            volume: None,
            effects: None,
          },
        },
        "command_handler".to_string(),
        state.version,
      )
      .await
      .ok();

    CommandResult::success(Some(serde_json::json!({
      "clip_id": clip_id,
      "delta": delta,
      "media_id": media_id,
      "type": "slip"
    })))
  }

  async fn slide_edit(&self, clip_id: String, delta: f64) -> CommandResult {
    log::info!("Slide edit: clip_id={}, delta={}", clip_id, delta);

    let mut state = self.state.write().await;
    let project = match state.project.as_mut() {
      Some(p) => p,
      None => return CommandResult::error("No project open".to_string()),
    };

    // First pass: find the clip and collect info about adjacent clips
    let mut target_track_id: Option<String> = None;
    let mut target_clip_in: Option<f64> = None;
    let mut target_clip_out: Option<f64> = None;
    let mut prev_clip_id: Option<String> = None;
    let mut next_clip_id: Option<String> = None;

    for track in &project.timeline.tracks {
      let mut found_target = false;
      let mut target_in = 0.0;
      let mut target_out = 0.0;

      // Find the target clip
      for clip in &track.clips {
        if clip.id == clip_id {
          target_in = clip.timeline_in;
          target_out = clip.timeline_out;
          found_target = true;
          break;
        }
      }

      if !found_target {
        continue;
      }

      target_track_id = Some(track.id.clone());
      target_clip_in = Some(target_in);
      target_clip_out = Some(target_out);

      // Find adjacent clips on the same track
      for clip in &track.clips {
        if clip.id == clip_id {
          continue;
        }

        // Previous clip (ends where target starts)
        if (clip.timeline_out - target_in).abs() < 0.01 {
          prev_clip_id = Some(clip.id.clone());
        }

        // Next clip (starts where target ends)
        if (clip.timeline_in - target_out).abs() < 0.01 {
          next_clip_id = Some(clip.id.clone());
        }
      }

      break;
    }

    if target_track_id.is_none() {
      return CommandResult::error(format!("Clip not found: {}", clip_id));
    }

    let track_id = target_track_id.unwrap();
    let clip_in = target_clip_in.unwrap();
    let clip_out = target_clip_out.unwrap();

    // Calculate new positions
    let new_clip_in = clip_in + delta;
    let new_clip_out = clip_out + delta;

    // Validate new position doesn't go negative
    if new_clip_in < 0.0 {
      return CommandResult::error(format!(
        "Slide edit would move clip before timeline start (new in: {})",
        new_clip_in
      ));
    }

    const MIN_CLIP_DURATION: f64 = 0.033; // ~1 frame at 30fps

    // Second pass: apply changes
    let mut updated_clips = vec![clip_id.clone()];

    for track in &mut project.timeline.tracks {
      if track.id != track_id {
        continue;
      }

      for clip in &mut track.clips {
        if clip.id == clip_id {
          // Move the target clip
          clip.timeline_in = new_clip_in;
          clip.timeline_out = new_clip_out;
        } else if let Some(ref prev_id) = prev_clip_id {
          if clip.id == *prev_id {
            // Extend/shrink previous clip to meet new target position
            let new_prev_out = new_clip_in;
            let new_duration = new_prev_out - clip.timeline_in;

            if new_duration < MIN_CLIP_DURATION {
              return CommandResult::error(format!(
                "Slide edit would make previous clip too short ({} < {})",
                new_duration, MIN_CLIP_DURATION
              ));
            }

            clip.timeline_out = new_prev_out;
            // Adjust source_out proportionally
            let duration_delta = new_prev_out - clip_out;
            clip.source_out += duration_delta;

            // Validate source bounds
            if clip.source_out < clip.source_in {
              return CommandResult::error(
                "Slide edit would exceed source bounds for previous clip".to_string(),
              );
            }

            updated_clips.push(clip.id.clone());
          }
        } else if let Some(ref next_id) = next_clip_id {
          if clip.id == *next_id {
            // Extend/shrink next clip to meet new target position
            let new_next_in = new_clip_out;
            let new_duration = clip.timeline_out - new_next_in;

            if new_duration < MIN_CLIP_DURATION {
              return CommandResult::error(format!(
                "Slide edit would make next clip too short ({} < {})",
                new_duration, MIN_CLIP_DURATION
              ));
            }

            clip.timeline_in = new_next_in;
            // Adjust source_in proportionally
            let duration_delta = new_next_in - clip_in;
            clip.source_in += duration_delta;

            // Validate source bounds
            if clip.source_in > clip.source_out || clip.source_in < 0.0 {
              return CommandResult::error(
                "Slide edit would exceed source bounds for next clip".to_string(),
              );
            }

            updated_clips.push(clip.id.clone());
          }
        }
      }

      break;
    }

    state.mark_dirty();

    // Publish events for all updated clips
    for updated_id in &updated_clips {
      if *updated_id == clip_id {
        self
          .event_bus
          .publish(
            ProjectEvent::ClipMoved {
              clip_id: updated_id.clone(),
              new_track_id: track_id.clone(),
              new_time: new_clip_in,
            },
            "command_handler".to_string(),
            state.version,
          )
          .await
          .ok();
      } else {
        self
          .event_bus
          .publish(
            ProjectEvent::ClipUpdated {
              clip_id: updated_id.clone(),
              changes: crate::state::events::ClipChanges {
                name: None,
                playback_rate: None,
                volume: None,
                effects: None,
              },
            },
            "command_handler".to_string(),
            state.version,
          )
          .await
          .ok();
      }
    }

    CommandResult::success(Some(serde_json::json!({
      "clip_id": clip_id,
      "delta": delta,
      "updated_clips": updated_clips.len(),
      "type": "slide"
    })))
  }
}

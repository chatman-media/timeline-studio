//! Video Processor Service
//!
//! Handles video processing for montage analysis including frame extraction and YOLO integration.

use crate::montage_planner::types::*;
use ts_recognition_tauri::commands::yolo_commands::YoloProcessorState;
use ts_recognition::recognition::frame_processor::Detection as YoloDetection;
use anyhow::Result;
use std::path::Path;
use std::sync::Arc;
use tokio::sync::RwLock;

/// Service for processing video files for montage analysis
pub struct VideoProcessor {
  /// Reference to YOLO processor state
  yolo_state: Arc<RwLock<YoloProcessorState>>,
}

/// Video metadata extracted for analysis
#[derive(Debug, Clone)]
pub struct VideoMetadata {
  pub duration: f64,
  pub width: u32,
  pub height: u32,
  pub fps: f32,
  pub total_frames: u64,
}

/// Frame extracted from video with timestamp
#[derive(Debug, Clone)]
pub struct ExtractedFrame {
  pub timestamp: f64,
  pub frame_number: u64,
  pub image_path: String,
  pub width: u32,
  pub height: u32,
}

impl VideoProcessor {
  /// Create new video processor
  pub fn new(yolo_state: Arc<RwLock<YoloProcessorState>>) -> Self {
    Self { yolo_state }
  }

  /// Extract video metadata using FFmpeg
  pub async fn extract_metadata<P: AsRef<Path>>(&self, video_path: P) -> Result<VideoMetadata> {
    let path = video_path.as_ref();

    // Check if file exists first
    if !path.exists() {
      return Err(anyhow::anyhow!("Video file not found: {}", path.display()));
    }

    // TODO: Implement actual FFmpeg metadata extraction
    // For now, return mock data for existing files
    Ok(VideoMetadata {
      duration: 120.0, // 2 minutes
      width: 1920,
      height: 1080,
      fps: 30.0,
      total_frames: 3600,
    })
  }

  /// Extract frames from video at specified intervals
  pub async fn extract_frames<P: AsRef<Path>>(
    &self,
    video_path: P,
    sample_rate: f32,
    start_time: Option<f64>,
    end_time: Option<f64>,
  ) -> Result<Vec<ExtractedFrame>> {
    let path = video_path.as_ref();
    let metadata = self.extract_metadata(path).await?;

    let start = start_time.unwrap_or(0.0);
    let end = end_time.unwrap_or(metadata.duration);

    let interval = 1.0 / sample_rate as f64;
    let mut frames = Vec::new();
    let mut current_time = start;
    let mut frame_number = (start * metadata.fps as f64) as u64;

    while current_time < end {
      // TODO: Implement actual frame extraction using FFmpeg
      // For now, create mock extracted frame
      let frame = ExtractedFrame {
        timestamp: current_time,
        frame_number,
        image_path: format!("/tmp/frame_{current_time:.3}.jpg"),
        width: metadata.width,
        height: metadata.height,
      };

      frames.push(frame);
      current_time += interval;
      frame_number += (interval * metadata.fps as f64) as u64;
    }

    Ok(frames)
  }

  /// Process extracted frames with YOLO and return detections
  pub async fn process_frames_with_yolo(
    &self,
    frames: &[ExtractedFrame],
    enable_objects: bool,
    enable_faces: bool,
  ) -> Result<Vec<(f64, Vec<YoloDetection>)>> {
    let mut results = Vec::new();
    let yolo_state = self.yolo_state.read().await;
    let processors = yolo_state.processors.read().await;

    // Find an appropriate processor for the detection type needed
    let processor_id = if enable_objects && enable_faces {
      // Try to find a detection processor first
      processors.keys().find(|id| id.contains("detection"))
    } else if enable_objects {
      processors.keys().find(|id| id.contains("detection"))
    } else if enable_faces {
      processors.keys().find(|id| id.contains("face"))
    } else {
      None
    };

    for frame in frames {
      if !Path::new(&frame.image_path).exists() {
        // Skip non-existent frames (in real implementation, we'd extract them first)
        log::warn!("Frame not found: {}", frame.image_path);
        continue;
      }

      let mut detections = Vec::new();

      // If we have a processor available, use it
      if let Some(proc_id) = processor_id {
        if let Some(processor_arc) = processors.get(proc_id) {
          let processor = processor_arc.read().await;

          // Try to load and process the frame image
          match image::open(&frame.image_path) {
            Ok(img) => match processor.process_image(&img).await {
              Ok(yolo_detections) => {
                detections = yolo_detections;
                log::debug!(
                  "Processed frame {} with {} detections",
                  frame.timestamp,
                  detections.len()
                );
              }
              Err(e) => {
                log::warn!(
                  "YOLO processing failed for frame {}: {}",
                  frame.timestamp,
                  e
                );
              }
            },
            Err(e) => {
              log::warn!("Failed to load frame image {}: {}", frame.image_path, e);
            }
          }
        }
      } else {
        log::debug!("No suitable YOLO processor found, returning empty detections");
      }

      results.push((frame.timestamp, detections));
    }

    Ok(results)
  }

  /// Full video analysis pipeline
  pub async fn analyze_video<P: AsRef<Path>>(
    &self,
    video_path: P,
    options: &AnalysisOptions,
  ) -> Result<Vec<(f64, Vec<YoloDetection>)>> {
    let path = video_path.as_ref();

    // Step 1: Extract metadata
    let metadata = self.extract_metadata(path).await?;
    log::info!(
      "Video metadata: {}x{}, {:.2}s, {:.1}fps",
      metadata.width,
      metadata.height,
      metadata.duration,
      metadata.fps
    );

    // Step 2: Extract frames based on sample rate
    let frames = self
      .extract_frames(path, options.frame_sample_rate, None, None)
      .await?;

    log::info!("Extracted {} frames for analysis", frames.len());

    // Step 3: Process frames with YOLO
    let detections = self
      .process_frames_with_yolo(
        &frames,
        options.enable_object_detection,
        options.enable_face_detection,
      )
      .await?;

    Ok(detections)
  }

  /// Get frame at specific timestamp
  pub async fn extract_frame_at_timestamp<P: AsRef<Path>>(
    &self,
    video_path: P,
    timestamp: f64,
  ) -> Result<ExtractedFrame> {
    let path = video_path.as_ref();
    let metadata = self.extract_metadata(path).await?;

    let frame_number = (timestamp * metadata.fps as f64) as u64;

    // TODO: Implement actual frame extraction at specific timestamp
    Ok(ExtractedFrame {
      timestamp,
      frame_number,
      image_path: format!("/tmp/frame_{timestamp:.3}.jpg"),
      width: metadata.width,
      height: metadata.height,
    })
  }

  /// Cleanup temporary frame files
  pub async fn cleanup_frames(&self, frames: &[ExtractedFrame]) -> Result<()> {
    for frame in frames {
      if Path::new(&frame.image_path).exists() {
        if let Err(e) = std::fs::remove_file(&frame.image_path) {
          log::warn!("Failed to cleanup frame {}: {}", frame.image_path, e);
        }
      }
    }

    Ok(())
  }
}

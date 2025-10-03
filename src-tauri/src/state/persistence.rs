use super::{project_state::ProjectSnapshot, ProjectState};
use chrono::{DateTime, Utc};
use serde_json;
use std::path::PathBuf;
use tauri::{AppHandle, Manager};
use tokio::fs;

/// Service for persisting project state
pub struct PersistenceService {
  app_handle: AppHandle,
  autosave_dir: PathBuf,
  versions_dir: PathBuf,
}

impl PersistenceService {
  pub fn new(app_handle: AppHandle) -> Result<Self, String> {
    // Get app data directory for autosaves
    let app_dir = app_handle
      .path()
      .app_data_dir()
      .map_err(|e| format!("Failed to get app data dir: {}", e))?;

    let autosave_dir = app_dir.join("autosave");
    let versions_dir = app_dir.join("versions");

    // Create directories if they don't exist
    std::fs::create_dir_all(&autosave_dir)
      .map_err(|e| format!("Failed to create autosave dir: {}", e))?;
    std::fs::create_dir_all(&versions_dir)
      .map_err(|e| format!("Failed to create versions dir: {}", e))?;

    Ok(Self {
      app_handle,
      autosave_dir,
      versions_dir,
    })
  }

  /// Save project to file
  pub async fn save_project(&self, state: &ProjectState, path: &str) -> Result<(), String> {
    let content = serde_json::to_string_pretty(state)
      .map_err(|e| format!("Failed to serialize project: {}", e))?;

    fs::write(path, content)
      .await
      .map_err(|e| format!("Failed to write project file: {}", e))?;

    log::info!("Project saved to: {}", path);
    Ok(())
  }

  /// Load project from file
  pub async fn load_project(&self, path: &str) -> Result<ProjectState, String> {
    let content = fs::read_to_string(path)
      .await
      .map_err(|e| format!("Failed to read project file: {}", e))?;

    let state = serde_json::from_str(&content)
      .map_err(|e| format!("Failed to deserialize project: {}", e))?;

    log::info!("Project loaded from: {}", path);
    Ok(state)
  }

  /// Save autosave checkpoint
  pub async fn save_checkpoint(&self, state: &ProjectState) -> Result<(), String> {
    let timestamp = chrono::Utc::now().timestamp();
    let filename = format!("checkpoint_{}.tlsp", timestamp);
    let path = self.autosave_dir.join(filename);

    self.save_project(state, path.to_str().unwrap()).await?;

    // Clean up old checkpoints (keep last 10)
    self.cleanup_old_checkpoints().await?;

    Ok(())
  }

  /// Load the latest checkpoint
  pub async fn load_latest(&self) -> Result<ProjectState, String> {
    let mut entries = fs::read_dir(&self.autosave_dir)
      .await
      .map_err(|e| format!("Failed to read autosave dir: {}", e))?;

    let mut checkpoints = Vec::new();

    while let Some(entry) = entries.next_entry().await.map_err(|e| e.to_string())? {
      let path = entry.path();
      if path.extension().and_then(|s| s.to_str()) == Some("tlsp") {
        if let Some(name) = path.file_stem().and_then(|s| s.to_str()) {
          if name.starts_with("checkpoint_") {
            checkpoints.push(path);
          }
        }
      }
    }

    // Sort by timestamp (newest first)
    checkpoints.sort_by(|a, b| b.file_name().cmp(&a.file_name()));

    if let Some(latest) = checkpoints.first() {
      self.load_project(latest.to_str().unwrap()).await
    } else {
      Err("No checkpoints found".to_string())
    }
  }

  /// Clean up old checkpoint files
  async fn cleanup_old_checkpoints(&self) -> Result<(), String> {
    let mut entries = fs::read_dir(&self.autosave_dir)
      .await
      .map_err(|e| format!("Failed to read autosave dir: {}", e))?;

    let mut checkpoints = Vec::new();

    while let Some(entry) = entries.next_entry().await.map_err(|e| e.to_string())? {
      let path = entry.path();
      if path.extension().and_then(|s| s.to_str()) == Some("tlsp") {
        if let Some(name) = path.file_stem().and_then(|s| s.to_str()) {
          if name.starts_with("checkpoint_") {
            checkpoints.push(path);
          }
        }
      }
    }

    // Sort by timestamp (newest first)
    checkpoints.sort_by(|a, b| b.file_name().cmp(&a.file_name()));

    // Remove all but the last 10
    for path in checkpoints.iter().skip(10) {
      fs::remove_file(path)
        .await
        .map_err(|e| format!("Failed to remove old checkpoint: {}", e))?;
    }

    Ok(())
  }

  /// Get default project directory
  pub fn get_default_project_dir(&self) -> Result<PathBuf, String> {
    self
      .app_handle
      .path()
      .document_dir()
      .map(|p| p.join("Timeline Studio Projects"))
      .map_err(|e| format!("Failed to get documents dir: {}", e))
  }

  /// Export project in different formats
  pub async fn export_project(
    &self,
    state: &ProjectState,
    path: &str,
    format: ExportFormat,
  ) -> Result<(), String> {
    match format {
      ExportFormat::TimelineStudio => self.save_project(state, path).await,
      ExportFormat::FinalCutXML => {
        // TODO: Implement FCPXML export
        Err("FCPXML export not implemented yet".to_string())
      }
      ExportFormat::AAF => {
        // TODO: Implement AAF export
        Err("AAF export not implemented yet".to_string())
      }
      ExportFormat::EDL => {
        // TODO: Implement EDL export
        Err("EDL export not implemented yet".to_string())
      }
    }
  }

  /// Save a version snapshot to disk
  pub async fn save_snapshot(&self, snapshot: &ProjectSnapshot) -> Result<(), String> {
    let filename = format!("snapshot_{}.tlsv", snapshot.id);
    let path = self.versions_dir.join(filename);

    let content = serde_json::to_string_pretty(snapshot)
      .map_err(|e| format!("Failed to serialize snapshot: {}", e))?;

    fs::write(path, content)
      .await
      .map_err(|e| format!("Failed to write snapshot file: {}", e))?;

    log::info!("Snapshot saved: {}", snapshot.id);
    Ok(())
  }

  /// Load a version snapshot from disk
  pub async fn load_snapshot(&self, version_id: &str) -> Result<ProjectSnapshot, String> {
    let filename = format!("snapshot_{}.tlsv", version_id);
    let path = self.versions_dir.join(filename);

    if !path.exists() {
      return Err(format!("Snapshot not found: {}", version_id));
    }

    let content = fs::read_to_string(path)
      .await
      .map_err(|e| format!("Failed to read snapshot file: {}", e))?;

    let snapshot = serde_json::from_str(&content)
      .map_err(|e| format!("Failed to deserialize snapshot: {}", e))?;

    log::info!("Snapshot loaded: {}", version_id);
    Ok(snapshot)
  }

  /// Get version history (list of available snapshots)
  pub async fn get_version_history(&self, limit: Option<u32>) -> Result<Vec<VersionInfo>, String> {
    let mut entries = fs::read_dir(&self.versions_dir)
      .await
      .map_err(|e| format!("Failed to read versions dir: {}", e))?;

    let mut snapshots = Vec::new();

    while let Some(entry) = entries.next_entry().await.map_err(|e| e.to_string())? {
      let path = entry.path();
      if path.extension().and_then(|s| s.to_str()) == Some("tlsv") {
        if let Some(name) = path.file_stem().and_then(|s| s.to_str()) {
          if name.starts_with("snapshot_") {
            // Extract version ID from filename
            let version_id = name.strip_prefix("snapshot_").unwrap_or(name);

            // Try to load snapshot metadata only (not full content for performance)
            if let Ok(snapshot) = self.load_snapshot_metadata(&path).await {
              snapshots.push(VersionInfo {
                id: version_id.to_string(),
                timestamp: snapshot.timestamp,
                author: snapshot.author,
                message: snapshot.message,
                branch_name: snapshot.branch_name,
              });
            }
          }
        }
      }
    }

    // Sort by timestamp (newest first)
    snapshots.sort_by(|a, b| b.timestamp.cmp(&a.timestamp));

    // Apply limit if specified
    if let Some(limit) = limit {
      snapshots.truncate(limit as usize);
    }

    Ok(snapshots)
  }

  /// Load only snapshot metadata (for performance in listing)
  async fn load_snapshot_metadata(&self, path: &PathBuf) -> Result<SnapshotMetadata, String> {
    let content = fs::read_to_string(path)
      .await
      .map_err(|e| format!("Failed to read snapshot file: {}", e))?;

    // Parse only the metadata fields we need
    let value: serde_json::Value = serde_json::from_str(&content)
      .map_err(|e| format!("Failed to parse snapshot JSON: {}", e))?;

    Ok(SnapshotMetadata {
      timestamp: DateTime::parse_from_rfc3339(
        value["timestamp"].as_str().ok_or("Missing timestamp")?,
      )
      .map_err(|e| format!("Invalid timestamp format: {}", e))?
      .with_timezone(&Utc),
      author: value["author"].as_str().unwrap_or("Unknown").to_string(),
      message: value["message"].as_str().map(|s| s.to_string()),
      branch_name: value["branch_name"].as_str().unwrap_or("main").to_string(),
    })
  }
}

/// Supported export formats
#[derive(Debug, Clone, Copy)]
pub enum ExportFormat {
  TimelineStudio,
  FinalCutXML,
  AAF,
  EDL,
}

/// Version information for history listing
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct VersionInfo {
  pub id: String,
  pub timestamp: DateTime<Utc>,
  pub author: String,
  pub message: Option<String>,
  pub branch_name: String,
}

/// Snapshot metadata (for performance optimization)
#[derive(Debug, Clone)]
struct SnapshotMetadata {
  pub timestamp: DateTime<Utc>,
  pub author: String,
  pub message: Option<String>,
  pub branch_name: String,
}

#[cfg(test)]
mod tests {
  #[tokio::test]
  async fn test_checkpoint_naming() {
    let timestamp = chrono::Utc::now().timestamp();
    let filename = format!("checkpoint_{}.tlsp", timestamp);
    assert!(filename.starts_with("checkpoint_"));
    assert!(filename.ends_with(".tlsp"));
  }
}

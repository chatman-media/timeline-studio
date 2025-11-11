// Модульная структура команд Timeline Studio

// Core types and enums
pub mod types;

// Feature modules
pub mod advanced_edits;
pub mod effects;
pub mod imported_media;
pub mod keyframes;
pub mod markers;
pub mod media;
pub mod project;
pub mod resources;
pub mod timeline;
pub mod tracks;
pub mod transitions;

// Main handler (contains remaining commands and CommandHandler)
pub mod handler;

// Re-exports for backward compatibility
pub use crate::types_export::{ClipBatchUpdate, ClipUpdates, MediaUpdates, TrackUpdates};
pub use handler::CommandHandler;
pub use types::{CommandResult, PlayerSource, ProjectCommand};

// Public interfaces for each module
pub use advanced_edits::AdvancedEditsCommands;
pub use effects::EffectsCommands;
pub use imported_media::ImportedMediaCommands;
pub use keyframes::KeyframeCommands;
pub use markers::MarkerCommands;
pub use media::MediaCommands;
pub use project::ProjectCommands;
pub use resources::ResourceCommands;
pub use timeline::TimelineCommands;
pub use tracks::TracksCommands;
pub use transitions::TransitionsCommands;

// Модульная структура команд Timeline Studio

// Core types and enums
pub mod types;

// Feature modules
pub mod timeline;
pub mod advanced_edits;
pub mod effects;
pub mod transitions;
pub mod markers;
pub mod project;
pub mod media;
pub mod tracks;

// Main handler (contains remaining commands and CommandHandler)
pub mod handler;

// Re-exports for backward compatibility
pub use types::*;
pub use handler::{CommandHandler, TrackUpdates, ClipUpdates, MediaUpdates, ClipBatchUpdate};

// Public interfaces for each module
pub use timeline::TimelineCommands;
pub use advanced_edits::AdvancedEditsCommands;
pub use effects::EffectsCommands;
pub use transitions::TransitionsCommands;
pub use markers::MarkerCommands;
pub use project::ProjectCommands;
pub use media::MediaCommands;
pub use tracks::TracksCommands;

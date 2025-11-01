// Analysis commands module

pub mod real_analysis_commands;
pub mod frame_integration_commands;

// Re-export всех команд
pub use real_analysis_commands::*;
pub use frame_integration_commands::*;
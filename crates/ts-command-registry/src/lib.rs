use tauri::{Builder, Runtime};

/// Trait for modular command registration
///
/// Each module that exposes Tauri commands should implement this trait
/// to register its commands with the Tauri application builder.
pub trait CommandRegistry {
  /// Register all commands from this module with the Tauri application
  ///
  /// # Arguments
  /// * `builder` - The Tauri application builder
  ///
  /// # Returns
  /// The builder with registered commands
  fn register_commands<R: Runtime>(builder: Builder<R>) -> Builder<R>;
}

/// Helper macro to simplify command registration
///
/// # Example
/// ```ignore
/// register_commands!(builder, [
///     command1,
///     command2,
///     command3
/// ])
/// ```
#[macro_export]
macro_rules! register_commands {
    ($builder:expr, [$($cmd:ident),* $(,)?]) => {
        $builder$(.invoke_handler(tauri::generate_handler![$($cmd),*]))?
    };
}

#[cfg(test)]
#[path = "command_registry_tests.rs"]
mod tests;

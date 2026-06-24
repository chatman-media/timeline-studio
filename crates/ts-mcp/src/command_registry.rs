//! Command registry implementation for MCP module

use ts_command_registry::CommandRegistry;
use tauri::{Builder, Runtime};

/// Implementation of CommandRegistry for MCP commands
pub struct MCPCommandRegistry;

impl CommandRegistry for MCPCommandRegistry {
  fn register_commands<R: Runtime>(builder: Builder<R>) -> Builder<R> {
    builder.invoke_handler(tauri::generate_handler![
      super::commands::mcp_initialize,
      super::commands::mcp_update_config,
      super::commands::mcp_get_tools,
      super::commands::mcp_chat,
      super::commands::mcp_execute_tool,
      super::commands::mcp_check_api,
    ])
  }
}

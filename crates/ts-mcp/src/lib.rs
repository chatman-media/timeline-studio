//! MCP (Model Context Protocol) интеграция для Timeline Studio
//!
//! Предоставляет Claude доступ к инструментам видеомонтажа через MCP

pub mod command_registry;
pub mod commands;
pub mod server;
pub mod tools;
pub mod types;

pub use command_registry::MCPCommandRegistry;
pub use commands::MCPServerState;
pub use server::MCPServer;
pub use tools::VideoTools;
pub use types::*;

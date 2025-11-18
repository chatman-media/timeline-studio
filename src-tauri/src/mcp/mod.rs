//! MCP (Model Context Protocol) интеграция для Timeline Studio
//!
//! Предоставляет Claude доступ к инструментам видеомонтажа через MCP

pub mod commands;
pub mod server;
pub mod tools;
pub mod types;

pub use commands::MCPServerState;
pub use server::MCPServer;
pub use tools::VideoTools;
pub use types::*;

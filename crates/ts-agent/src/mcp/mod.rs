//! MCP VideoTools — headless-каталог инструментов для агента (#101).
//!
//! Перенесено из `src-tauri/src/mcp/` — работает без `tauri::AppHandle`.

pub mod analysis;
pub mod timeline;
pub mod tools;
pub mod types;

pub use analysis::{AnalysisService, StubAnalysisService};
pub use timeline::TimelineOps;
pub use tools::VideoTools;
pub use types::{MCPConfig, MCPContext, MCPTool, MCPToolRequest, MCPToolResult};

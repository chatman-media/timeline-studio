//! MCP-сервер вынесен в крейт `ts-mcp` (#354/#362).
//! Ре-экспорт-шим: `crate::mcp::{commands,server,tools,...}` резолвятся у потребителей
//! (app_builder) без правок.
pub use ts_mcp::*;

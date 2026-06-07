//! [`VideoTools`] — каталог MCP-инструментов для работы с видео.
//!
//! Headless-вариант `src-tauri/src/mcp/tools.rs`.
//! Работает без `tauri::AppHandle` — только `StateManager` + `AnalysisService`.

use super::analysis::{AnalysisService, StubAnalysisService};
use super::timeline::TimelineOps;
use super::types::{MCPTool, MCPToolResult};
use serde_json::{json, Value};
use std::path::Path;
use std::sync::Arc;
use ts_state::StateManager;

/// Набор MCP-инструментов для работы с видео и timeline.
///
/// # Пример
/// ```rust,ignore
/// use ts_agent::mcp::tools::VideoTools;
/// use ts_state::StateManager;
///
/// let tools = VideoTools::new(StateManager::with_log_sink());
/// let list = tools.get_available_tools();
/// assert!(!list.is_empty());
/// ```
pub struct VideoTools {
    manager: StateManager,
    analysis: Arc<dyn AnalysisService>,
}

impl VideoTools {
    /// Создаёт `VideoTools` с `StubAnalysisService`.
    pub fn new(manager: StateManager) -> Self {
        Self { manager, analysis: Arc::new(StubAnalysisService) }
    }

    /// Создаёт `VideoTools` с пользовательским `AnalysisService`.
    pub fn with_analysis(manager: StateManager, analysis: Arc<dyn AnalysisService>) -> Self {
        Self { manager, analysis }
    }

    // ── Каталог инструментов ─────────────────────────────────────────────

    pub fn get_available_tools(&self) -> Vec<MCPTool> {
        vec![
            // Анализ видео
            tool("analyze_video", "Анализировать видео: качество, метаданные, контент", json!({
                "type": "object",
                "properties": {
                    "video_path": { "type": "string", "description": "Путь к видео файлу" },
                    "analysis_type": { "type": "string", "enum": ["quick","balanced","quality"] }
                },
                "required": ["video_path"]
            })),
            tool("detect_scenes", "Обнаружить сцены в видео", json!({
                "type": "object",
                "properties": {
                    "video_path": { "type": "string" },
                    "min_scene_duration": { "type": "number" }
                },
                "required": ["video_path"]
            })),
            tool("detect_moments", "Найти ключевые моменты в видео", json!({
                "type": "object",
                "properties": {
                    "video_path": { "type": "string" },
                    "max_moments": { "type": "number" }
                },
                "required": ["video_path"]
            })),
            tool("analyze_audio", "Анализировать аудио-дорожку", json!({
                "type": "object",
                "properties": {
                    "video_path": { "type": "string" }
                },
                "required": ["video_path"]
            })),
            // Timeline
            tool("create_timeline", "Получить информацию о текущем timeline", json!({
                "type": "object", "properties": {}
            })),
            tool("add_clip", "Добавить клип на timeline", json!({
                "type": "object",
                "properties": {
                    "track_id": { "type": "string" },
                    "media_id": { "type": "string" },
                    "time": { "type": "number" }
                },
                "required": ["track_id", "media_id", "time"]
            })),
            tool("remove_clip", "Удалить клип", json!({
                "type": "object",
                "properties": { "clip_id": { "type": "string" } },
                "required": ["clip_id"]
            })),
            tool("move_clip", "Переместить клип", json!({
                "type": "object",
                "properties": {
                    "clip_id": { "type": "string" },
                    "new_track_id": { "type": "string" },
                    "new_time": { "type": "number" }
                },
                "required": ["clip_id", "new_track_id", "new_time"]
            })),
            tool("split_clip", "Разделить клип на две части", json!({
                "type": "object",
                "properties": {
                    "clip_id": { "type": "string" },
                    "split_time": { "type": "number" }
                },
                "required": ["clip_id", "split_time"]
            })),
            // Эффекты (заглушки)
            tool("apply_filter", "Применить фильтр к клипу", json!({
                "type": "object",
                "properties": { "clip_id": { "type": "string" }, "filter_id": { "type": "string" } },
                "required": ["clip_id", "filter_id"]
            })),
            tool("add_transition", "Добавить переход", json!({
                "type": "object",
                "properties": { "clip_id": { "type": "string" }, "transition_type": { "type": "string" } },
                "required": ["clip_id"]
            })),
            tool("apply_color_grading", "Применить цветокоррекцию", json!({
                "type": "object",
                "properties": { "clip_id": { "type": "string" }, "preset": { "type": "string" } },
                "required": ["clip_id"]
            })),
            tool("add_text_overlay", "Добавить текстовый оверлей", json!({
                "type": "object",
                "properties": { "text": { "type": "string" }, "time": { "type": "number" } },
                "required": ["text"]
            })),
            // Экспорт (заглушки)
            tool("export_video", "Экспортировать видео", json!({
                "type": "object",
                "properties": { "output_path": { "type": "string" } },
                "required": ["output_path"]
            })),
            tool("create_preview", "Создать предпросмотр", json!({
                "type": "object", "properties": {}
            })),
            // Проект
            tool("get_project_info", "Получить информацию о проекте", json!({
                "type": "object", "properties": {}
            })),
            tool("save_project", "Сохранить проект", json!({
                "type": "object",
                "properties": { "project_path": { "type": "string" } }
            })),
            tool("list_media_files", "Список медиафайлов в пуле", json!({
                "type": "object",
                "properties": { "filter_type": { "type": "string" } }
            })),
        ]
    }

    // ── Dispatch ─────────────────────────────────────────────────────────

    pub async fn execute_tool(&self, tool_name: &str, arguments: Value) -> MCPToolResult {
        match tool_name {
            "analyze_video" => self.exec_analyze_video(arguments).await,
            "detect_scenes" => self.exec_detect_scenes(arguments).await,
            "detect_moments" => self.exec_detect_moments(arguments).await,
            "analyze_audio" => self.exec_analyze_audio(arguments).await,
            "create_timeline" => self.exec_create_timeline().await,
            "add_clip" => self.exec_add_clip(arguments).await,
            "remove_clip" => self.exec_remove_clip(arguments).await,
            "move_clip" => self.exec_move_clip(arguments).await,
            "split_clip" => self.exec_split_clip(arguments).await,
            "apply_filter" => MCPToolResult::not_implemented("apply_filter"),
            "add_transition" => MCPToolResult::not_implemented("add_transition"),
            "apply_color_grading" => MCPToolResult::not_implemented("apply_color_grading"),
            "add_text_overlay" => MCPToolResult::not_implemented("add_text_overlay"),
            "export_video" => MCPToolResult::not_implemented("export_video"),
            "create_preview" => MCPToolResult::not_implemented("create_preview"),
            "get_project_info" => self.exec_get_project_info().await,
            "save_project" => self.exec_save_project(arguments).await,
            "list_media_files" => self.exec_list_media_files(arguments).await,
            _ => MCPToolResult::err(format!("Unknown tool: {tool_name}")),
        }
    }

    // ── Реализации ───────────────────────────────────────────────────────

    async fn exec_analyze_video(&self, args: Value) -> MCPToolResult {
        let path = require_str_param!(args, "video_path");
        if !Path::new(path).exists() {
            return MCPToolResult::err(format!("Video file not found: {path}"));
        }
        let analysis_type = args.get("analysis_type").and_then(|v| v.as_str());
        match self.analysis.analyze_video(Path::new(path), analysis_type).await {
            Ok(r) => MCPToolResult::ok(r.data),
            Err(e) => MCPToolResult::err(e),
        }
    }

    async fn exec_detect_scenes(&self, args: Value) -> MCPToolResult {
        let path = require_str_param!(args, "video_path");
        if !Path::new(path).exists() {
            return MCPToolResult::err(format!("Video file not found: {path}"));
        }
        let min_dur = args.get("min_scene_duration").and_then(|v| v.as_f64());
        match self.analysis.detect_scenes(Path::new(path), min_dur).await {
            Ok(r) => MCPToolResult::ok(r.data),
            Err(e) => MCPToolResult::err(e),
        }
    }

    async fn exec_detect_moments(&self, args: Value) -> MCPToolResult {
        let path = require_str_param!(args, "video_path");
        if !Path::new(path).exists() {
            return MCPToolResult::err(format!("Video file not found: {path}"));
        }
        let max = args.get("max_moments").and_then(|v| v.as_u64()).map(|n| n as usize);
        match self.analysis.detect_moments(Path::new(path), max).await {
            Ok(r) => MCPToolResult::ok(r.data),
            Err(e) => MCPToolResult::err(e),
        }
    }

    async fn exec_analyze_audio(&self, args: Value) -> MCPToolResult {
        let path = require_str_param!(args, "video_path");
        if !Path::new(path).exists() {
            return MCPToolResult::err(format!("Video file not found: {path}"));
        }
        match self.analysis.analyze_audio(Path::new(path)).await {
            Ok(r) => MCPToolResult::ok(r.data),
            Err(e) => MCPToolResult::err(e),
        }
    }

    async fn exec_create_timeline(&self) -> MCPToolResult {
        let state = self.manager.get_state().await;
        match &state.project {
            Some(p) => MCPToolResult::ok(json!({
                "tracks_count": p.timeline.tracks.len(),
                "total_clips": p.timeline.tracks.iter().map(|t| t.clips.len()).sum::<usize>(),
            })),
            None => MCPToolResult::err("No project open"),
        }
    }

    async fn exec_add_clip(&self, args: Value) -> MCPToolResult {
        let track_id = get_str_param!(args, "track_id");
        let media_id = get_str_param!(args, "media_id");
        let time = args.get("time").and_then(|v| v.as_f64()).unwrap_or(0.0);
        let ops = TimelineOps::new(self.manager.clone());
        let r = ops.add_clip(track_id, media_id, time).await;
        if r.success {
            MCPToolResult::ok(r.data.unwrap_or(Value::Null))
        } else {
            MCPToolResult::err(r.error.unwrap_or_default())
        }
    }

    async fn exec_remove_clip(&self, args: Value) -> MCPToolResult {
        let clip_id = get_str_param!(args, "clip_id");
        let ops = TimelineOps::new(self.manager.clone());
        let r = ops.delete_clip(clip_id).await;
        if r.success { MCPToolResult::ok(r.data.unwrap_or(Value::Null)) }
        else { MCPToolResult::err(r.error.unwrap_or_default()) }
    }

    async fn exec_move_clip(&self, args: Value) -> MCPToolResult {
        let clip_id = get_str_param!(args, "clip_id");
        let new_track_id = get_str_param!(args, "new_track_id");
        let new_time = match args.get("new_time").and_then(|v| v.as_f64()) {
            Some(t) => t,
            None => return MCPToolResult::err("Missing required parameter: new_time"),
        };
        let ops = TimelineOps::new(self.manager.clone());
        let r = ops.move_clip(clip_id, new_track_id, new_time).await;
        if r.success { MCPToolResult::ok(r.data.unwrap_or(Value::Null)) }
        else { MCPToolResult::err(r.error.unwrap_or_default()) }
    }

    async fn exec_split_clip(&self, args: Value) -> MCPToolResult {
        let clip_id = get_str_param!(args, "clip_id");
        let split_time = match args.get("split_time").and_then(|v| v.as_f64()) {
            Some(t) => t,
            None => return MCPToolResult::err("Missing required parameter: split_time"),
        };
        let ops = TimelineOps::new(self.manager.clone());
        let r = ops.split_clip(clip_id, split_time).await;
        if r.success { MCPToolResult::ok(r.data.unwrap_or(Value::Null)) }
        else { MCPToolResult::err(r.error.unwrap_or_default()) }
    }

    async fn exec_get_project_info(&self) -> MCPToolResult {
        let state = self.manager.get_state().await;
        match &state.project {
            Some(p) => MCPToolResult::ok(json!({
                "project_name": p.metadata.name,
                "created_at": p.metadata.created_at,
                "modified_at": p.metadata.modified_at,
                "settings": {
                    "resolution": { "width": p.settings.resolution.width, "height": p.settings.resolution.height },
                    "frame_rate": p.settings.frame_rate,
                    "audio_sample_rate": p.settings.audio_sample_rate,
                    "audio_channels": p.settings.audio_channels,
                },
                "timeline": {
                    "tracks_count": p.timeline.tracks.len(),
                    "total_clips": p.timeline.tracks.iter().map(|t| t.clips.len()).sum::<usize>(),
                },
                "media_pool": { "items_count": p.media_pool.items.len() },
            })),
            None => MCPToolResult::err("No project open"),
        }
    }

    async fn exec_save_project(&self, args: Value) -> MCPToolResult {
        let path = args.get("project_path").and_then(|v| v.as_str());
        MCPToolResult::ok(json!({
            "message": "Project save request received",
            "path": path,
            "note": "Actual saving delegated to PersistenceService"
        }))
    }

    async fn exec_list_media_files(&self, args: Value) -> MCPToolResult {
        let filter_type = args.get("filter_type").and_then(|v| v.as_str());
        let state = self.manager.get_state().await;
        match &state.project {
            Some(p) => {
                let items: Vec<Value> = p
                    .media_pool
                    .items
                    .values()
                    .filter(|m| {
                        if let Some(ft) = filter_type {
                            format!("{:?}", m.media_type).to_lowercase().contains(ft)
                        } else {
                            true
                        }
                    })
                    .map(|m| json!({
                        "id": m.id,
                        "name": m.name,
                        "path": m.path,
                        "media_type": format!("{:?}", m.media_type),
                        "duration": m.duration,
                    }))
                    .collect();
                MCPToolResult::ok(json!({ "files": items, "count": items.len() }))
            }
            None => MCPToolResult::err("No project open"),
        }
    }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

fn tool(name: &str, description: &str, schema: Value) -> MCPTool {
    MCPTool {
        name: name.to_string(),
        description: description.to_string(),
        input_schema: schema,
    }
}

macro_rules! require_str_param {
    ($args:expr, $key:expr) => {
        match $args.get($key).and_then(|v| v.as_str()) {
            Some(s) => s,
            None => {
                return MCPToolResult::err(format!("Missing required parameter: {}", $key))
            }
        }
    };
}

macro_rules! get_str_param {
    ($args:expr, $key:expr) => {
        match $args.get($key).and_then(|v| v.as_str()) {
            Some(s) => s.to_string(),
            None => {
                return MCPToolResult::err(format!("Missing required parameter: {}", $key))
            }
        }
    };
}

use {get_str_param, require_str_param};

// ─── Тесты ───────────────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;
    use ts_state::types::project::ProjectSettings;

    #[tokio::test]
    async fn tool_catalog_non_empty() {
        let mgr = StateManager::with_log_sink();
        let vt = VideoTools::new(mgr);
        let tools = vt.get_available_tools();
        assert!(!tools.is_empty());
        // все инструменты имеют непустые имена
        for t in &tools {
            assert!(!t.name.is_empty());
        }
    }

    #[tokio::test]
    async fn unknown_tool_returns_error() {
        let mgr = StateManager::with_log_sink();
        let vt = VideoTools::new(mgr);
        let r = vt.execute_tool("nonexistent_tool", json!({})).await;
        assert!(!r.success);
        assert!(r.error.as_deref().unwrap_or("").contains("Unknown tool"));
    }

    #[tokio::test]
    async fn get_project_info_no_project() {
        let mgr = StateManager::with_log_sink();
        let vt = VideoTools::new(mgr);
        let r = vt.execute_tool("get_project_info", json!({})).await;
        assert!(!r.success);
    }

    #[tokio::test]
    async fn get_project_info_with_project() {
        let mgr = StateManager::with_log_sink();
        mgr.create_project("Film", ProjectSettings::default()).await;
        let vt = VideoTools::new(mgr);
        let r = vt.execute_tool("get_project_info", json!({})).await;
        assert!(r.success);
        assert_eq!(r.data.unwrap()["project_name"], "Film");
    }

    #[tokio::test]
    async fn analyze_video_missing_file() {
        let mgr = StateManager::with_log_sink();
        let vt = VideoTools::new(mgr);
        let r = vt.execute_tool("analyze_video", json!({"video_path": "/nonexistent/x.mp4"})).await;
        assert!(!r.success);
        assert!(r.error.as_deref().unwrap_or("").contains("not found"));
    }

    #[tokio::test]
    async fn not_implemented_tools() {
        let mgr = StateManager::with_log_sink();
        let vt = VideoTools::new(mgr);
        for name in &["apply_filter", "add_transition", "export_video", "create_preview"] {
            let r = vt.execute_tool(name, json!({})).await;
            assert!(r.success, "{name} should succeed with not_implemented stub");
        }
    }
}

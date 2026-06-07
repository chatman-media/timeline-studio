//! Browser panel state types.

use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[cfg(feature = "specta")]
use specta::Type;

/// Browser tab types
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Hash, Default)]
#[cfg_attr(feature = "specta", derive(Type))]
#[serde(rename_all = "snake_case")]
pub enum BrowserTab {
    #[default]
    Media,
    Music,
    Subtitles,
    Transitions,
    Effects,
    Filters,
    Templates,
    StyleTemplates,
    Projects,
    Scenarios,
}

impl BrowserTab {
    pub fn all_tabs() -> Vec<BrowserTab> {
        vec![
            BrowserTab::Media,
            BrowserTab::Music,
            BrowserTab::Subtitles,
            BrowserTab::Transitions,
            BrowserTab::Effects,
            BrowserTab::Filters,
            BrowserTab::Templates,
            BrowserTab::StyleTemplates,
            BrowserTab::Projects,
            BrowserTab::Scenarios,
        ]
    }
}

/// View mode for browser display
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Default)]
#[cfg_attr(feature = "specta", derive(Type))]
#[serde(rename_all = "snake_case")]
pub enum ViewMode {
    List,
    #[default]
    Thumbnails,
}

/// Sort order for browser items
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Default)]
#[cfg_attr(feature = "specta", derive(Type))]
#[serde(rename_all = "snake_case")]
pub enum SortOrder {
    #[default]
    None,
    NameAsc,
    NameDesc,
    DateAsc,
    DateDesc,
    DurationAsc,
    DurationDesc,
    SizeAsc,
    SizeDesc,
}

/// Browser state for a single tab
#[derive(Debug, Clone, Serialize, Deserialize)]
#[cfg_attr(feature = "specta", derive(Type))]
pub struct BrowserTabState {
    pub view_mode: ViewMode,
    pub sort_order: SortOrder,
    pub search_query: Option<String>,
    pub selected_files: Vec<String>,
    pub current_folder: Option<String>,
}

impl Default for BrowserTabState {
    fn default() -> Self {
        Self {
            view_mode: ViewMode::Thumbnails,
            sort_order: SortOrder::None,
            search_query: None,
            selected_files: Vec::new(),
            current_folder: None,
        }
    }
}

/// Browser state across all tabs
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[cfg_attr(feature = "specta", derive(Type))]
pub struct BrowserState {
    pub active_tab: BrowserTab,
    pub tab_states: HashMap<String, BrowserTabState>,
    /// Selected files per tab (tab -> list of file paths)
    pub selected_files: HashMap<BrowserTab, Vec<String>>,
}

impl BrowserState {
    pub fn all_tabs() -> Vec<BrowserTab> {
        BrowserTab::all_tabs()
    }
}

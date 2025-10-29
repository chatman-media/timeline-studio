use serde::{Deserialize, Serialize};
use specta::Type;
use std::collections::HashMap;

/// Browser tab types
#[derive(Debug, Clone, Serialize, Deserialize, Type, PartialEq, Eq, Hash)]
#[serde(rename_all = "snake_case")]
#[derive(Default)]
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
}

/// View mode for browser display
#[derive(Debug, Clone, Serialize, Deserialize, Type, PartialEq)]
#[serde(rename_all = "snake_case")]
#[derive(Default)]
pub enum ViewMode {
  #[default]
  List,
  Grid,
  Thumbnails,
}

/// Settings for individual browser tabs
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct TabSettings {
  pub search_query: String,
  pub show_favorites_only: bool,
  pub sort_by: String,
  pub sort_order: SortOrder,
  pub group_by: String,
  pub filter_type: String,
  pub view_mode: ViewMode,
  pub preview_size_index: u32,
}

impl Default for TabSettings {
  fn default() -> Self {
    Self {
      search_query: String::new(),
      show_favorites_only: false,
      sort_by: "name".to_string(),
      sort_order: SortOrder::Asc,
      group_by: "none".to_string(),
      filter_type: "all".to_string(),
      view_mode: ViewMode::default(),
      preview_size_index: 0,
    }
  }
}

/// Sort order for browser items
#[derive(Debug, Clone, Serialize, Deserialize, Type, PartialEq)]
#[serde(rename_all = "snake_case")]
#[derive(Default)]
pub enum SortOrder {
  #[default]
  Asc,
  Desc,
}

/// Complete browser state
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct BrowserState {
  pub active_tab: BrowserTab,
  pub selected_files: HashMap<BrowserTab, Vec<String>>, // File IDs selected per tab
  pub tab_settings: HashMap<BrowserTab, TabSettings>,   // Settings per tab
}

impl Default for BrowserState {
  fn default() -> Self {
    let mut tab_settings = HashMap::new();
    let mut selected_files = HashMap::new();

    // Initialize all tabs with default settings
    for tab in Self::all_tabs() {
      tab_settings.insert(tab.clone(), TabSettings::default());
      selected_files.insert(tab, Vec::new());
    }

    Self {
      active_tab: BrowserTab::default(),
      selected_files,
      tab_settings,
    }
  }
}

impl BrowserState {
  /// Get all available browser tabs
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
    ]
  }

  /// Get settings for the active tab
  pub fn active_tab_settings(&self) -> TabSettings {
    self
      .tab_settings
      .get(&self.active_tab)
      .cloned()
      .unwrap_or_default()
  }

  /// Get mutable settings for the active tab
  pub fn active_tab_settings_mut(&mut self) -> &mut TabSettings {
    self
      .tab_settings
      .entry(self.active_tab.clone())
      .or_default()
  }

  /// Get selected files for the active tab
  pub fn active_tab_selected_files(&self) -> &[String] {
    self
      .selected_files
      .get(&self.active_tab)
      .map(|files| files.as_slice())
      .unwrap_or(&[])
  }

  /// Get mutable selected files for the active tab
  pub fn active_tab_selected_files_mut(&mut self) -> &mut Vec<String> {
    self
      .selected_files
      .entry(self.active_tab.clone())
      .or_default()
  }

  /// Switch to a different tab
  pub fn switch_tab(&mut self, tab: BrowserTab) {
    self.active_tab = tab;
  }

  /// Set search query for a tab (defaults to active tab)
  pub fn set_search_query(&mut self, query: String, tab: Option<BrowserTab>) {
    let target_tab = tab.unwrap_or_else(|| self.active_tab.clone());
    if let Some(settings) = self.tab_settings.get_mut(&target_tab) {
      settings.search_query = query;
    }
  }

  /// Toggle favorites filter for a tab (defaults to active tab)
  pub fn toggle_favorites(&mut self, tab: Option<BrowserTab>) {
    let target_tab = tab.unwrap_or_else(|| self.active_tab.clone());
    if let Some(settings) = self.tab_settings.get_mut(&target_tab) {
      settings.show_favorites_only = !settings.show_favorites_only;
    }
  }

  /// Set sort options for a tab (defaults to active tab)
  pub fn set_sort(&mut self, sort_by: String, sort_order: SortOrder, tab: Option<BrowserTab>) {
    let target_tab = tab.unwrap_or_else(|| self.active_tab.clone());
    if let Some(settings) = self.tab_settings.get_mut(&target_tab) {
      settings.sort_by = sort_by;
      settings.sort_order = sort_order;
    }
  }

  /// Set group by option for a tab (defaults to active tab)
  pub fn set_group_by(&mut self, group_by: String, tab: Option<BrowserTab>) {
    let target_tab = tab.unwrap_or_else(|| self.active_tab.clone());
    if let Some(settings) = self.tab_settings.get_mut(&target_tab) {
      settings.group_by = group_by;
    }
  }

  /// Set filter type for a tab (defaults to active tab)
  pub fn set_filter_type(&mut self, filter_type: String, tab: Option<BrowserTab>) {
    let target_tab = tab.unwrap_or_else(|| self.active_tab.clone());
    if let Some(settings) = self.tab_settings.get_mut(&target_tab) {
      settings.filter_type = filter_type;
    }
  }

  /// Set view mode for a tab (defaults to active tab)
  pub fn set_view_mode(&mut self, view_mode: ViewMode, tab: Option<BrowserTab>) {
    let target_tab = tab.unwrap_or_else(|| self.active_tab.clone());
    if let Some(settings) = self.tab_settings.get_mut(&target_tab) {
      settings.view_mode = view_mode;
    }
  }

  /// Set preview size for a tab (defaults to active tab)
  pub fn set_preview_size(&mut self, size_index: u32, tab: Option<BrowserTab>) {
    let target_tab = tab.unwrap_or_else(|| self.active_tab.clone());
    if let Some(settings) = self.tab_settings.get_mut(&target_tab) {
      settings.preview_size_index = size_index;
    }
  }

  /// Reset tab settings to defaults
  pub fn reset_tab_settings(&mut self, tab: BrowserTab) {
    if let Some(settings) = self.tab_settings.get_mut(&tab) {
      *settings = TabSettings::default();
    }
  }

  /// Select a file in a tab (defaults to active tab)
  pub fn select_file(&mut self, file_id: String, tab: Option<BrowserTab>) {
    let target_tab = tab.unwrap_or_else(|| self.active_tab.clone());
    if let Some(files) = self.selected_files.get_mut(&target_tab) {
      if !files.contains(&file_id) {
        files.push(file_id);
      }
    }
  }

  /// Deselect a file in a tab (defaults to active tab)
  pub fn deselect_file(&mut self, file_id: String, tab: Option<BrowserTab>) {
    let target_tab = tab.unwrap_or_else(|| self.active_tab.clone());
    if let Some(files) = self.selected_files.get_mut(&target_tab) {
      files.retain(|id| id != &file_id);
    }
  }

  /// Toggle file selection in a tab (defaults to active tab)
  pub fn toggle_file_selection(&mut self, file_id: String, tab: Option<BrowserTab>) {
    let target_tab = tab.unwrap_or_else(|| self.active_tab.clone());
    if let Some(files) = self.selected_files.get_mut(&target_tab) {
      if files.contains(&file_id) {
        files.retain(|id| id != &file_id);
      } else {
        files.push(file_id);
      }
    }
  }

  /// Select multiple files in a tab (defaults to active tab)
  pub fn select_all_files(&mut self, file_ids: Vec<String>, tab: Option<BrowserTab>) {
    let target_tab = tab.unwrap_or_else(|| self.active_tab.clone());
    if let Some(files) = self.selected_files.get_mut(&target_tab) {
      *files = file_ids;
    }
  }

  /// Deselect all files in a tab (defaults to active tab)
  pub fn deselect_all_files(&mut self, tab: Option<BrowserTab>) {
    let target_tab = tab.unwrap_or_else(|| self.active_tab.clone());
    if let Some(files) = self.selected_files.get_mut(&target_tab) {
      files.clear();
    }
  }

  /// Get the selected files for a specific tab
  pub fn get_selected_files(&self, tab: &BrowserTab) -> &[String] {
    self
      .selected_files
      .get(tab)
      .map(|files| files.as_slice())
      .unwrap_or(&[])
  }

  /// Clear all selected files across all tabs
  pub fn clear_all_selections(&mut self) {
    for files in self.selected_files.values_mut() {
      files.clear();
    }
  }

  /// Reset all tab settings to defaults
  pub fn reset_all_tabs(&mut self) {
    for (tab, settings) in self.tab_settings.iter_mut() {
      *settings = TabSettings::default();
    }
    // Reset to default tab
    self.active_tab = BrowserTab::default();
  }

  /// Get the settings for a specific tab
  pub fn get_tab_settings(&self, tab: &BrowserTab) -> TabSettings {
    self.tab_settings.get(tab).cloned().unwrap_or_default()
  }
}

/// Browser-specific events
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(tag = "event_type", content = "data")]
pub enum BrowserEvent {
  TabSwitched {
    tab: BrowserTab,
  },
  SearchQueryChanged {
    tab: BrowserTab,
    query: String,
  },
  FavoritesToggled {
    tab: BrowserTab,
    show_favorites: bool,
  },
  SortChanged {
    tab: BrowserTab,
    sort_by: String,
    sort_order: SortOrder,
  },
  GroupByChanged {
    tab: BrowserTab,
    group_by: String,
  },
  FilterChanged {
    tab: BrowserTab,
    filter_type: String,
  },
  ViewModeChanged {
    tab: BrowserTab,
    view_mode: ViewMode,
  },
  PreviewSizeChanged {
    tab: BrowserTab,
    size_index: u32,
  },
  TabSettingsReset {
    tab: BrowserTab,
  },
  FileSelected {
    tab: BrowserTab,
    file_id: String,
  },
  FileDeselected {
    tab: BrowserTab,
    file_id: String,
  },
  FileSelectionToggled {
    tab: BrowserTab,
    file_id: String,
    is_selected: bool,
  },
  AllFilesSelected {
    tab: BrowserTab,
    file_ids: Vec<String>,
  },
  AllFilesDeselected {
    tab: BrowserTab,
  },
}

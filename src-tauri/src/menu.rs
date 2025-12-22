use tauri::menu::{MenuBuilder, SubmenuBuilder};
use tauri::{App, Emitter, Manager, Runtime};

/// Создает нативное меню приложения
pub fn create_app_menu<R: Runtime>(app: &App<R>) -> tauri::Result<tauri::menu::Menu<R>> {
  // Меню File
  let file_menu = SubmenuBuilder::new(app, "File")
    .text("new-project", "New Project")
    .text("open-project", "Open Project...")
    .text("save-project", "Save Project")
    .text("save-project-as", "Save Project As...")
    .separator()
    .text("import-media", "Import Media...")
    .text("export-project", "Export Project...")
    .separator()
    .text("preferences", "Preferences...")
    .separator()
    .text("quit", "Quit")
    .build()?;

  // Меню Edit
  let edit_menu = SubmenuBuilder::new(app, "Edit")
    .text("undo", "Undo")
    .text("redo", "Redo")
    .separator()
    .text("cut", "Cut")
    .text("copy", "Copy")
    .text("paste", "Paste")
    .text("delete", "Delete")
    .separator()
    .text("select-all", "Select All")
    .build()?;

  // Меню View
  let view_menu = SubmenuBuilder::new(app, "View")
    .text("toggle-fullscreen", "Toggle Fullscreen")
    .separator()
    .text("zoom-in", "Zoom In")
    .text("zoom-out", "Zoom Out")
    .text("zoom-reset", "Actual Size")
    .build()?;

  // Меню Help
  let help_menu = SubmenuBuilder::new(app, "Help")
    .text("documentation", "Documentation")
    .text("shortcuts", "Keyboard Shortcuts")
    .separator()
    .text("about", "About Timeline Studio")
    .build()?;

  // Собираем главное меню
  let menu = MenuBuilder::new(app)
    .item(&file_menu)
    .item(&edit_menu)
    .item(&view_menu)
    .item(&help_menu)
    .build()?;

  Ok(menu)
}

/// Обработчик событий меню
pub fn handle_menu_event(app: &tauri::AppHandle, event: &str) {
  match event {
    "quit" => {
      app.exit(0);
    }
    "new-project" => {
      // TODO: Отправить событие в frontend для создания нового проекта
      let _ = app.emit("menu:new-project", ());
    }
    "open-project" => {
      let _ = app.emit("menu:open-project", ());
    }
    "save-project" => {
      let _ = app.emit("menu:save-project", ());
    }
    "save-project-as" => {
      let _ = app.emit("menu:save-project-as", ());
    }
    "import-media" => {
      let _ = app.emit("menu:import-media", ());
    }
    "export-project" => {
      let _ = app.emit("menu:export-project", ());
    }
    "preferences" => {
      let _ = app.emit("menu:preferences", ());
    }
    "undo" => {
      let _ = app.emit("menu:undo", ());
    }
    "redo" => {
      let _ = app.emit("menu:redo", ());
    }
    "cut" => {
      let _ = app.emit("menu:cut", ());
    }
    "copy" => {
      let _ = app.emit("menu:copy", ());
    }
    "paste" => {
      let _ = app.emit("menu:paste", ());
    }
    "delete" => {
      let _ = app.emit("menu:delete", ());
    }
    "select-all" => {
      let _ = app.emit("menu:select-all", ());
    }
    "toggle-fullscreen" => {
      if let Some(window) = app.get_webview_window("main") {
        let _ = window.is_fullscreen().map(|is_full| {
          let _ = window.set_fullscreen(!is_full);
        });
      }
    }
    "zoom-in" => {
      let _ = app.emit("menu:zoom-in", ());
    }
    "zoom-out" => {
      let _ = app.emit("menu:zoom-out", ());
    }
    "zoom-reset" => {
      let _ = app.emit("menu:zoom-reset", ());
    }
    "documentation" => {
      let _ = app.emit("menu:documentation", ());
    }
    "shortcuts" => {
      let _ = app.emit("menu:shortcuts", ());
    }
    "about" => {
      let _ = app.emit("menu:about", ());
    }
    _ => {
      eprintln!("Unknown menu event: {}", event);
    }
  }
}

# State Management Module

Централизованное управление состоянием проекта и событиями в Timeline Studio.

## Обзор

State module - это ядро event-driven архитектуры Timeline Studio. Все изменения состояния проекта происходят через команды, которые генерируют события для синхронизации с фронтендом.

## Архитектура

```
┌─────────────────────────────────────────┐
│ Frontend (React)                        │
│ - domains/browser                       │
│ - domains/project-management            │
│ - domains/system-integration            │
└─────────────┬───────────────────────────┘
              │ Tauri IPC
              ↓
┌─────────────────────────────────────────┐
│ StateManager (Rust)                     │
│ ┌─────────────────────────────────────┐ │
│ │ ProjectState                        │ │
│ │  - browser_state: BrowserState      │ │
│ │  - imported_media: Vec<MediaFile>   │ │
│ │  - settings: ProjectSettings        │ │
│ └─────────────────────────────────────┘ │
│ ┌─────────────────────────────────────┐ │
│ │ EventBus                            │ │
│ │  - Генерирует события при изменениях│ │
│ │  - Хранит историю событий           │ │
│ └─────────────────────────────────────┘ │
└─────────────┬───────────────────────────┘
              │ Events
              ↓
┌─────────────────────────────────────────┐
│ Frontend Event Listeners                │
│ - Автоматическое обновление UI          │
└─────────────────────────────────────────┘
```

## Структура файлов

```
state/
├── README.md                 # Этот файл
├── mod.rs                    # Главный модуль
├── commands_api.rs           # Tauri команды (browser, project)
├── commands_backup.rs        # Резервные копии команд
├── browser.rs                # BrowserState и события
├── project_state.rs          # ProjectState структура
├── event_bus.rs              # EventBus для событий
└── commands/
    └── types.rs              # ProjectCommand enum
```

## Core Types / Основные типы

### ProjectState

Главное состояние проекта:

```rust
pub struct ProjectState {
    pub browser_state: BrowserState,
    pub imported_media: Vec<MediaFile>,
    pub settings: ProjectSettings,
    pub version: u32,
    // ... другие поля
}
```

### BrowserState

Состояние браузера медиа:

```rust
pub struct BrowserState {
    pub active_tab: BrowserTab,
    pub tab_settings: HashMap<BrowserTab, TabSettings>,
    pub selected_files: HashMap<BrowserTab, Vec<String>>,
}

pub enum BrowserTab {
    Media,
    Effects,
    Filters,
    Transitions,
    Templates,
    StyleTemplates,
}

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
```

### ProjectCommand

Все команды для изменения состояния:

```rust
pub enum ProjectCommand {
    // Project Lifecycle
    CreateProject { settings: ProjectSettings },
    OpenProject { path: String },
    SaveProject,
    CloseProject,

    // Browser Commands
    BrowserSwitchTab { tab: BrowserTab },
    BrowserSetSearchQuery { query: String, tab: Option<BrowserTab> },
    BrowserSelectFile { file_id: String, tab: Option<BrowserTab> },
    // ... 14 browser команд

    // Settings
    UpdateUserSettings { settings: UserSettings },
    GetUserSettings,
}
```

## API Commands / Команды API

### State Management

**Файл:** `commands_api.rs`

```rust
// Получить текущее состояние проекта
get_project_state() -> Result<ProjectState, String>

// Получить историю событий
get_event_history(since_version: Option<u32>) -> Result<Vec<EventEnvelope>, String>

// Выполнить команду
execute_command(command: ProjectCommand) -> Result<CommandResult, String>

// Выполнить batch команд
execute_batch_commands(request: BatchCommandRequest) -> Result<BatchCommandResult, String>
```

### Browser Commands

**Файл:** `commands_api.rs`

#### Tab Management

```rust
// Переключение вкладок
browser_switch_tab(tab: BrowserTab) -> Result<CommandResult, String>

// Поиск
browser_set_search_query(query: String, tab: Option<BrowserTab>) -> Result<CommandResult, String>

// Избранное
browser_toggle_favorites(tab: Option<BrowserTab>) -> Result<CommandResult, String>

// Сортировка
browser_set_sort(sort_by: String, sort_order: SortOrder, tab: Option<BrowserTab>) -> Result<CommandResult, String>

// Группировка
browser_set_group_by(group_by: String, tab: Option<BrowserTab>) -> Result<CommandResult, String>

// Фильтрация
browser_set_filter(filter_type: String, tab: Option<BrowserTab>) -> Result<CommandResult, String>

// Режим отображения
browser_set_view_mode(view_mode: ViewMode, tab: Option<BrowserTab>) -> Result<CommandResult, String>

// Размер превью
browser_set_preview_size(size_index: u32, tab: Option<BrowserTab>) -> Result<CommandResult, String>

// Сброс настроек
browser_reset_tab_settings(tab: BrowserTab) -> Result<CommandResult, String>
```

#### File Selection

```rust
// Выбор файла
browser_select_file(file_id: String, tab: Option<BrowserTab>) -> Result<CommandResult, String>

// Снятие выбора
browser_deselect_file(file_id: String, tab: Option<BrowserTab>) -> Result<CommandResult, String>

// Переключение выбора
browser_toggle_file_selection(file_id: String, tab: Option<BrowserTab>) -> Result<CommandResult, String>

// Выбрать все
browser_select_all_files(file_ids: Vec<String>, tab: Option<BrowserTab>) -> Result<CommandResult, String>

// Снять все выборы
browser_deselect_all_files(tab: Option<BrowserTab>) -> Result<CommandResult, String>
```

## Events / События

### Browser Events

**Файл:** `browser.rs`

Генерируются автоматически после выполнения команд:

```rust
pub enum BrowserEvent {
    TabSwitched { tab: BrowserTab },
    SearchQueryChanged { tab: BrowserTab, query: String },
    FavoritesToggled { tab: BrowserTab, enabled: bool },
    SortChanged { tab: BrowserTab, sort_by: String, sort_order: SortOrder },
    GroupByChanged { tab: BrowserTab, group_by: String },
    FilterChanged { tab: BrowserTab, filter_type: String },
    ViewModeChanged { tab: BrowserTab, view_mode: ViewMode },
    PreviewSizeChanged { tab: BrowserTab, size_index: u32 },
    TabSettingsReset { tab: BrowserTab },
    FileSelected { tab: BrowserTab, file_id: String },
    FileDeselected { tab: BrowserTab, file_id: String },
    FileSelectionToggled { tab: BrowserTab, file_id: String },
    AllFilesSelected { tab: BrowserTab, file_ids: Vec<String> },
    AllFilesDeselected { tab: BrowserTab },
}
```

### Event Flow / Поток событий

1. **Frontend** вызывает Tauri команду (например, `browser_switch_tab`)
2. **StateManager** обрабатывает команду
3. **ProjectState** обновляется
4. **EventBus** генерирует событие (например, `BrowserTabSwitched`)
5. **Frontend** получает событие через Tauri event listener
6. **React state** обновляется автоматически

## StateManager

Центральный менеджер состояния:

```rust
pub struct StateManager {
    state: Arc<RwLock<ProjectState>>,
    event_bus: Arc<EventBus>,
}

impl StateManager {
    // Выполнить команду и сгенерировать события
    pub async fn execute_command(&self, command: ProjectCommand) -> CommandResult;

    // Получить текущее состояние
    pub async fn get_state(&self) -> ProjectState;

    // Получить event bus
    pub fn event_bus(&self) -> Arc<EventBus>;
}
```

## Frontend Integration / Интеграция с фронтендом

### Browser Domain

**Frontend:** `src/domains/browser/`

```typescript
// providers/browser-provider.tsx
import { invoke } from "@tauri-apps/api/core"
import { listen } from "@tauri-apps/api/event"

// Вызов команды
await invoke("browser_switch_tab", { tab: "effects" })

// Подписка на события
listen("project:event", (event) => {
  if (event.payload.event_type === "BrowserTabSwitched") {
    // Обновить локальное состояние
    setActiveTab(event.payload.data.tab)
  }
})
```

### Project Management Domain

**Frontend:** `src/domains/project-management/`

```typescript
// Получение состояния
const state = await invoke("get_project_state")

// Выполнение команды
const result = await invoke("execute_command", {
  command: {
    CreateProject: {
      settings: projectSettings
    }
  }
})
```

## Performance / Производительность

### Batch Commands

Для оптимизации множественных изменений используйте batch команды:

```rust
let batch_request = BatchCommandRequest {
    commands: vec![
        ProjectCommand::BrowserSelectFile {
            file_id: "file1".to_string(),
            tab: None
        },
        ProjectCommand::BrowserSelectFile {
            file_id: "file2".to_string(),
            tab: None
        },
    ],
    stop_on_error: true,
    transaction_name: Some("Select multiple files".to_string()),
};

let result = execute_batch_commands(batch_request).await?;
```

**Преимущества:**
- Одна операция вместо нескольких
- Атомарность (все или ничего с `stop_on_error`)
- Меньше событий (batch генерирует одно событие)

### Event History

EventBus хранит историю событий для синхронизации:

```rust
// Получить все события после версии 100
let events = get_event_history(Some(100)).await?;

// Применить события для синхронизации состояния
for event in events {
    apply_event(event);
}
```

## Testing / Тестирование

### Unit Tests

Тесты находятся в `src-tauri/src/state/tests/`:

```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_browser_switch_tab() {
        let state_manager = StateManager::new();

        let result = state_manager.execute_command(
            ProjectCommand::BrowserSwitchTab {
                tab: BrowserTab::Effects
            }
        ).await;

        assert!(result.success);

        let state = state_manager.get_state().await;
        assert_eq!(state.browser_state.active_tab, BrowserTab::Effects);
    }
}
```

### Integration Tests

E2E тесты на фронтенде:

**Расположение:** `e2e/tauri/browser.spec.ts`, `e2e/tauri/project-management.spec.ts`

## Best Practices / Лучшие практики

### 1. Всегда используйте команды для изменения состояния

❌ **НЕ делайте так:**
```rust
state.browser_state.active_tab = BrowserTab::Effects;
```

✅ **Делайте так:**
```rust
state_manager.execute_command(
    ProjectCommand::BrowserSwitchTab { tab: BrowserTab::Effects }
).await?;
```

### 2. Подписывайтесь на события вместо polling

❌ **НЕ делайте так:**
```typescript
setInterval(() => {
  const state = await invoke("get_project_state")
  updateUI(state)
}, 1000)
```

✅ **Делайте так:**
```typescript
listen("project:event", (event) => {
  updateUI(event.payload)
})
```

### 3. Используйте batch для множественных операций

❌ **НЕ делайте так:**
```rust
for file in files {
    execute_command(ProjectCommand::BrowserSelectFile {
        file_id: file.id,
        tab: None
    }).await?;
}
```

✅ **Делайте так:**
```rust
let commands = files.iter().map(|file| {
    ProjectCommand::BrowserSelectFile {
        file_id: file.id.clone(),
        tab: None
    }
}).collect();

execute_batch_commands(BatchCommandRequest {
    commands,
    stop_on_error: false,
    transaction_name: Some("Select files".to_string()),
}).await?;
```

## Related Modules / Связанные модули

- **Frontend Domains:**
  - `src/domains/browser/` - Browser UI и логика
  - `src/domains/project-management/` - Project управление
  - `src/domains/system-integration/` - Системная интеграция

- **Backend Modules:**
  - `src-tauri/src/media/` - Media обработка
  - `src-tauri/src/video_compiler/` - Компиляция видео
  - `src-tauri/src/analysis/` - AI анализ

## Changelog / История изменений

### v3.0.0 (2025-11-18)
- ✅ Полная миграция на event-driven архитектуру
- ✅ Добавлен BrowserState в ProjectState
- ✅ 14 browser команд через commands_api.rs
- ✅ EventBus для автоматической синхронизации
- ✅ Batch commands для производительности

### v3.15.0 (2025-11-24)
- ✅ Добавлена документация README.md
- ✅ Улучшена типобезопасность через Specta
- ✅ Оптимизация производительности EventBus

## License / Лицензия

Часть Timeline Studio. См. корневую лицензию проекта.

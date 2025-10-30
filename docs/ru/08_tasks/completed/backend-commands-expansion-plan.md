# План расширения Backend команд для BackendSync

**Дата создания:** 29 октября 2025  
**Дата завершения:** 29 октября 2025  
**Статус:** ✅ Завершено  
**Приоритет:** Высокий

## ✅ ОБНОВЛЕНИЕ: Задача завершена

Все недостающие backend команды успешно реализованы и интегрированы в провайдеры. Полный отчет доступен в [Backend Commands Integration Report](backend-commands-integration-report.md).

### 🎯 Выполненные цели:
- ✅ Реализованы все 35+ backend команд
- ✅ Устранены заглушки в EffectsProvider и ResourcesProvider
- ✅ Обновлена структура команд для корректной типизации
- ✅ Проведено тестирование и проверка качества кода  

## 📋 Обзор

После завершения миграции провайдеров на BackendSync архитектуру, необходимо реализовать недостающие backend команды. Многие провайдеры используют заглушки (`if (false)`) для команд, которые еще не реализованы в Rust backend.

## 🎯 Цель

Полная интеграция frontend провайдеров с backend командами для:
- Устранения заглушек в провайдерах
- Реализации полной синхронизации состояния
- Добавления аналитики и логирования
- Повышения производительности

## 📊 Анализ текущего состояния

### ✅ Реализованные команды (в `src-tauri/src/state/commands.rs`)

Основные категории команд уже реализованы:

```rust
pub enum ProjectCommand {
  // ✅ Project commands
  CreateProject, OpenProject, SaveProject, CloseProject,
  
  // ✅ Timeline commands  
  AddTrack, DeleteTrack, UpdateTrack,
  AddClip, MoveClip, TrimClip, DeleteClip, UpdateClip,
  
  // ✅ Media pool commands
  AddMedia, RemoveMedia, UpdateMedia,
  
  // ✅ Playback commands
  Play, Pause, Stop, Seek, SetPlaybackRate,
  
  // ✅ Browser commands
  BrowserSwitchTab, BrowserSetSearchQuery, BrowserToggleFavorites,
  BrowserSetSort, BrowserSetGroupBy, BrowserSetFilter,
  BrowserSetViewMode, BrowserSetPreviewSize, BrowserResetTabSettings,
  BrowserSelectFile, BrowserDeselectFile, BrowserToggleFileSelection,
  BrowserSelectAllFiles, BrowserDeselectAllFiles,
  
  // ✅ Chat commands
  ChatCreateSession, ChatSendMessage, ChatClearHistory, ChatDeleteSession,
}
```

### ❌ Недостающие команды

#### 1. **Resources API** (для EffectsProvider)

```typescript
// Текущие заглушки в EffectsProvider:
// if (this.isBackendConnected) {
//   await this.backendSync.executeCommand({
//     type: "Resources",
//     params: { type: "LoadResources", source }
//   })
// }
```

**Необходимые команды:**
- `LoadResources` - загрузка ресурсов (local, remote, imported)
- `SaveResource` - сохранение ресурса
- `DeleteResource` - удаление ресурса
- `PreloadCategory` - предзагрузка категории ресурсов
- `SyncResources` - синхронизация ресурсов с backend

#### 2. **Timeline Extended API** (для TimelineProviders)

```typescript
// Заглушки в TimelineProviders:
// await backendSync.executeCommand({
//   type: "SplitClip",
//   params: { clip_id, time }
// })
```

**Необходимые команды:**
- `SplitClip` - разделение клипа
- `BatchUpdateClips` - массовое обновление клипов
- `SelectClips` - выбор клипов
- `SelectTracks` - выбор треков
- `SelectSections` - выбор секций
- `ClearSelection` - очистка выбора
- `CopyClips` - копирование клипов
- `CutClips` - вырезание клипов
- `PasteClips` - вставка клипов
- `DeleteSelected` - удаление выбранных элементов
- `ApplyEffect` - применение эффекта
- `RemoveEffect` - удаление эффекта
- `ApplyFilter` - применение фильтра
- `RemoveFilter` - удаление фильтра
- `ApplyTransition` - применение перехода
- `RemoveTransition` - удаление перехода
- `ReorderTracks` - изменение порядка треков

#### 3. **Analytics API** (для логирования)

```typescript
// Заглушки аналитики:
// backendSync.executeCommand({
//   type: "Analytics",
//   params: {
//     type: "LogBrowserAction",
//     params: { action: "switch_tab", tab }
//   }
// })
```

**Необходимые команды:**
- `LogBrowserAction` - действия в браузере ресурсов
- `LogUserAction` - общие действия пользователя
- `LogPerformanceMetric` - метрики производительности
- `LogError` - логирование ошибок
- `GetAnalytics` - получение аналитических данных

#### 4. **UI State API** (для синхронизации UI)

```typescript
// Заглушки UI синхронизации:
// backendSync.executeCommand({
//   type: "UI",
//   params: {
//     type: "SyncBrowserState",
//     params: serializableState
//   }
// })
```

**Необходимые команды:**
- `SyncBrowserState` - синхронизация состояния браузера
- `SyncUIState` - синхронизация общего UI состояния
- `SaveUIPreferences` - сохранение UI предпочтений

#### 5. **Project Extended API** (для ProjectManagementProvider)

```typescript
// Заглушки проекта:
// backendSync.executeCommand({
//   type: "Project",
//   params: {
//     type: "SyncProjectState",
//     params: { projectId, state }
//   }
// })
```

**Необходимые команды:**
- `SyncProjectState` - синхронизация состояния проекта
- `NotifyProjectCreated` - уведомление о создании проекта
- `NotifyProjectOpened` - уведомление об открытии проекта

#### 6. **Settings API** (для UserSettingsProvider)

```typescript
// Заглушки настроек:
// backendSync.executeCommand({
//   type: "Settings",
//   params: {
//     type: "SyncUserSettings",
//     params: settings
//   }
// })
```

**Необходимые команды:**
- `SyncUserSettings` - синхронизация настроек пользователя
- `UpdateApiKey` - обновление API ключей
- `UpdateGpuAcceleration` - обновление настроек GPU

#### 7. **AI Services API** (для AI провайдеров)

**Необходимые команды:**
- `SyncAIState` - синхронизация состояния AI сервисов
- `LogAIOperation` - логирование AI операций
- `GetAIMetrics` - получение метрик AI

## 📅 План реализации

### Фаза 1: Основные команды (1-2 недели)

**Приоритет: Критический**

1. **Analytics API** - базовое логирование
2. **UI State API** - синхронизация UI состояния
3. **Project Extended API** - расширенная работа с проектами
4. **Settings API** - синхронизация настроек

### Фаза 2: Timeline расширения (2-3 недели)

**Приоритет: Высокий**

1. **Timeline Extended API** - все недостающие команды timeline
2. **Resources API** - управление ресурсами

### Фаза 3: AI интеграция (1-2 недели)

**Приоритет: Средний**

1. **AI Services API** - интеграция AI сервисов

## 🛠️ Техническая реализация

### 1. Структура команд

Расширить enum `ProjectCommand` в `src-tauri/src/state/commands.rs`:

```rust
pub enum ProjectCommand {
  // ... существующие команды ...
  
  // Resources commands
  LoadResources {
    resource_type: String,
    source: String,
  },
  SaveResource {
    resource_id: String,
    data: serde_json::Value,
  },
  DeleteResource {
    resource_id: String,
  },
  
  // Analytics commands
  LogBrowserAction {
    action: String,
    metadata: HashMap<String, serde_json::Value>,
  },
  LogUserAction {
    action: String,
    timestamp: DateTime<Utc>,
    metadata: HashMap<String, serde_json::Value>,
  },
  
  // UI State commands
  SyncBrowserState {
    state: serde_json::Value,
  },
  SyncUIState {
    state: serde_json::Value,
  },
  
  // Timeline Extended commands
  SplitClip {
    clip_id: String,
    time: f64,
  },
  BatchUpdateClips {
    clips: Vec<ClipUpdate>,
  },
  SelectClips {
    clip_ids: Vec<String>,
    add_to_selection: bool,
  },
  // ... остальные команды ...
}
```

### 2. Обработчики команд

Создать новые модули для обработки команд:

```
src-tauri/src/state/
├── commands/
│   ├── mod.rs
│   ├── analytics.rs      # Analytics API
│   ├── resources.rs      # Resources API  
│   ├── timeline_ext.rs   # Timeline Extended API
│   ├── ui_state.rs       # UI State API
│   ├── project_ext.rs    # Project Extended API
│   ├── settings.rs       # Settings API
│   └── ai_services.rs    # AI Services API
```

### 3. Регистрация в Specta

Обновить `src-tauri/src/specta_export.rs` для экспорта новых типов:

```rust
pub fn export_typescript_bindings() {
  let builder = tauri_specta::Builder::<tauri::Wry>::new()
    .commands(tauri_specta::collect_commands![
      // ... существующие команды ...
      
      // Analytics commands  
      crate::state::commands_api::log_browser_action,
      crate::state::commands_api::log_user_action,
      
      // Resources commands
      crate::state::commands_api::load_resources,
      crate::state::commands_api::save_resource,
      
      // Timeline Extended commands
      crate::state::commands_api::split_clip,
      crate::state::commands_api::batch_update_clips,
      
      // ... остальные команды ...
    ])
    // ...
}
```

## 🎯 Ожидаемые результаты

### Краткосрочные (1-2 месяца)
- ✅ Устранение всех заглушек в провайдерах
- ✅ Полная синхронизация состояния между frontend и backend
- ✅ Базовая аналитика пользовательских действий
- ✅ Улучшенная производительность через backend операции

### Долгосрочные (3-6 месяцев)
- ✅ Расширенная аналитика и мониторинг
- ✅ AI-powered оптимизация workflow
- ✅ Предиктивное кеширование ресурсов
- ✅ Автоматическое восстановление после сбоев

## 📊 Метрики успеха

1. **Код качество**: 0 заглушек (`if (false)`) в провайдерах
2. **Производительность**: < 100ms latency для синхронизации
3. **Надежность**: 99.9% успешность команд
4. **Аналитика**: 100% покрытие пользовательских действий

## 🔗 Связанные документы

- [BackendSync Architecture](../03_architecture/backend-sync-architecture.md)
- [Provider Migration Status](completed/provider-migration-status.md)
- [Communication Architecture](../03_architecture/communication.md)

---

**Автор:** AI Assistant  
**Последнее обновление:** 29 октября 2025
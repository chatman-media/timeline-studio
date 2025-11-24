# Project Version Control - Версионирование и восстановление проектов

## 📋 Обзор

Project Version Control - это система управления версиями проектов в Timeline Studio, интегрированная с существующей backend архитектурой состояния. Система расширяет текущий `ProjectState` и `PersistenceService`, добавляя версионирование, историю изменений, восстановление после сбоев и базовую совместную работу.

**⚠️ СТАТУС**: Активная разработка - адаптация под существующую backend архитектуру

## 🎯 Цели и задачи

### Основные цели:
1. **Безопасность данных** - никогда не терять работу
2. **История изменений** - возможность откатиться
3. **Совместная работа** - merge изменений от разных пользователей
4. **Эффективность** - минимальное использование диска

### Ключевые возможности:
- Автоматическое сохранение каждые 30 секунд
- Инкрементальные снимки состояния
- Визуальная timeline история
- Умное управление медиафайлами
- Восстановление после сбоев

## 🏗️ Техническая архитектура

### Frontend структура:
```
src/features/project-version-control/
├── components/
│   ├── version-timeline/      # Визуальная история
│   ├── version-browser/       # Браузер версий
│   ├── diff-viewer/          # Просмотр изменений
│   ├── merge-tool/           # Инструмент слияния
│   └── recovery-wizard/      # Мастер восстановления
├── hooks/
│   ├── use-version-control.ts # Основной хук
│   ├── use-auto-save.ts      # Автосохранение
│   └── use-history.ts        # История изменений
├── services/
│   ├── version-manager.ts    # Управление версиями
│   ├── diff-engine.ts        # Вычисление различий
│   ├── merge-engine.ts       # Слияние версий
│   └── storage-optimizer.ts  # Оптимизация хранения
└── types/
    └── version.ts            # Типы данных
```

### Backend интеграция (Rust):
```
# РАСШИРЕНИЕ СУЩЕСТВУЮЩИХ МОДУЛЕЙ:
src-tauri/src/state/
├── project_state.rs          # ✅ РАСШИРИТЬ: добавить VersionInfo
├── commands.rs               # ✅ РАСШИРИТЬ: добавить команды версионирования
├── persistence.rs            # ✅ РАСШИРИТЬ: методы версионирования
└── event_bus.rs              # ✅ РАСШИРИТЬ: события версионирования

# НОВЫЙ МОДУЛЬ ВЕРСИОНИРОВАНИЯ:
src-tauri/src/version_control/
├── mod.rs                    # Главный модуль
├── repository.rs             # Репозиторий версий
├── snapshot.rs               # Создание снимков ProjectState
├── diff.rs                   # Различия между ProjectState
├── merge.rs                  # Слияние версий ProjectState
├── storage/                  # Эффективное хранилище
│   ├── delta_store.rs        # Дельта-сжатие ProjectState
│   ├── media_dedup.rs        # Дедупликация медиа (интеграция с MediaPool)
│   └── compression.rs        # Сжатие данных
└── commands.rs               # Tauri команды версионирования
```

## 📐 Функциональные требования

### 1. Автосохранение

#### Параметры:
- **Интервал** - настраиваемый (30 сек по умолчанию)
- **Триггеры** - после важных действий
- **Фоновый режим** - без блокировки UI
- **Умное сохранение** - только при изменениях

#### Сохраняемые данные (интеграция с ProjectState):
```rust
// Расширение существующего ProjectState
pub struct ProjectState {
    pub project: Option<Project>,
    pub ui_state: UiState,
    pub playback_state: PlaybackState,
    pub version: u32,
    // ✅ НОВОЕ: информация о версионировании
    pub version_info: VersionInfo,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct VersionInfo {
    pub current_version_id: String,
    pub branch_name: String,
    pub has_uncommitted_changes: bool,
    pub last_snapshot_time: DateTime<Utc>,
    pub auto_save_enabled: bool,
}

// Снимок версии основан на полном ProjectState
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProjectSnapshot {
    pub id: String,
    pub timestamp: DateTime<Utc>,
    pub author: String,
    pub message: Option<String>,
    
    // Полное состояние проекта (используем существующий ProjectState)
    pub project_state: ProjectState,
    
    // Дельта от предыдущей версии (для экономии места)
    pub parent_id: Option<String>,
    pub delta: Option<ProjectStateDelta>,
}
```

### 2. История версий

#### Визуализация:
```
Timeline History
═══════════════════════════════════════════════════
    │
    ├─● v1.0 "Initial import" (2 hours ago)
    │
    ├─● v1.1 "Added intro" (1 hour ago)
    │ │
    │ ├─○ Auto-save
    │ ├─○ Auto-save
    │ │
    ├─● v1.2 "Color correction" (30 min ago)
    │ │
    │ └─◆ Current (unsaved changes)
    │
    └─● v1.3 "Final cut" (Just now)
```

#### Функции:
- **Просмотр** - preview любой версии
- **Сравнение** - diff между версиями
- **Откат** - восстановление версии
- **Ветвление** - создание альтернативных версий

### 3. Управление изменениями

#### Типы изменений (на основе ProjectEvent):
```rust
// Используем существующую систему событий, расширяя ProjectEvent
pub enum ProjectEvent {
    // ... существующие события ...
    
    // ✅ НОВЫЕ: события версионирования
    SnapshotCreated { 
        version_id: String, 
        message: Option<String>,
        parent_version: Option<String> 
    },
    VersionRestored { 
        version_id: String, 
        previous_version: String 
    },
    BranchCreated { 
        branch_name: String, 
        base_version: String 
    },
    AutoSaveTriggered { 
        snapshot_id: String 
    },
}

// Дельта изменений между ProjectState
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProjectStateDelta {
    pub timeline_changes: Vec<TimelineChange>,
    pub media_pool_changes: Vec<MediaPoolChange>,
    pub settings_changes: Vec<SettingsChange>,
    pub ui_state_changes: Vec<UiStateChange>,
    pub playback_changes: Vec<PlaybackChange>,
}
```

#### Дельта-сохранение:
- Только изменения, не весь проект
- Сжатие binary diff
- Умная группировка изменений
- Дедупликация данных

### 4. Медиафайлы

#### Стратегия хранения:
- **Референсы** - ссылки на оригиналы
- **Копии** - опциональное копирование
- **Прокси** - версии низкого разрешения
- **Дедупликация** - один файл для всех версий

#### Media pool:
```
project-media/
├── originals/          # Оригинальные файлы
│   └── hash-based/     # По хешу для дедупликации
├── proxies/           # Прокси версии
│   ├── 720p/
│   └── thumbnail/
└── cache/             # Временные файлы
```

### 5. Восстановление после сбоев

#### Автоматическое восстановление:
- Обнаружение незавершенной сессии
- Предложение восстановления
- Восстановление до последнего автосохранения
- Отчет о потерянных изменениях

#### Recovery файлы:
```
.timeline-studio/
├── recovery/
│   ├── session.lock      # Блокировка сессии
│   ├── current.snapshot  # Текущее состояние
│   └── undo.history      # История undo/redo
└── logs/
    └── crash.log         # Логи сбоев
```

### 6. Совместная работа

#### Модель:
- **Check out/in** - блокировка на редактирование
- **Merge** - слияние параллельных изменений
- **Конфликты** - визуальное разрешение
- **Комментарии** - к версиям

#### Merge tool:
```
┌─────────────────────────────────────────────────┐
│  Merge Conflict Resolution                      │
├─────────────────────────────────────────────────┤
│  Your Version    │ Base Version │ Their Version │
├──────────────────┼──────────────┼───────────────┤
│  ███████████     │ ███████      │ ████████████  │
│  Clip A (5s)     │ Clip A (3s)  │ Clip A (4s)   │
├──────────────────┴──────────────┴───────────────┤
│  Resolution: [Use Yours] [Use Theirs] [Manual]  │
└─────────────────────────────────────────────────┘
```

### 7. Архивирование проектов

#### Функции:
- **Полный архив** - проект + все медиа
- **Инкрементальный** - только изменения
- **Сжатие** - оптимизация размера
- **Экспорт** - для переноса

#### Форматы:
- `.tsproj` - проект без медиа
- `.tspkg` - проект с медиа
- `.tsarchive` - архив с историей

### 8. Настройки и политики

#### Параметры:
- Частота автосохранения
- Максимум версий
- Автоочистка старых версий
- Уровень сжатия
- Локация хранения

#### Политики хранения:
```typescript
interface RetentionPolicy {
    keepAllVersions: boolean;
    maxVersions?: number;
    maxAge?: Duration;
    keepMilestones: boolean;
    compressOldVersions: boolean;
}
```

## 🎨 UI/UX дизайн

### История версий UI:
```
┌─────────────────────────────────────────────────┐
│  Project History                    [Settings]  │
├─────────────────────────────────────────────────┤
│  Today                                          │
│  ├─● 14:30 "Added transitions" (You)           │
│  ├─○ 14:15 Auto-save                          │
│  ├─● 14:00 "Color grading complete" (You)     │
│  │                                             │
│  Yesterday                                      │
│  ├─● 18:45 "Final review changes" (John)      │
│  └─● 17:30 "Audio mixing" (Sarah)             │
├─────────────────────────────────────────────────┤
│ [Compare] [Restore] [Branch] [Export]          │
└─────────────────────────────────────────────────┘
```

### Индикатор статуса:
```
Status Bar:
[●] Saved | Last save: 2 min ago | Version: v2.5 | ↑ Cloud synced
```

## 🔧 Технические детали

### Эффективное хранение:

```rust
// Дельта-сжатие для timeline
pub struct TimelineDelta {
    version: u32,
    parent_version: u32,
    operations: Vec<Operation>,
}

pub enum Operation {
    AddClip { track: u32, position: f64, clip: Clip },
    RemoveClip { clip_id: String },
    MoveClip { clip_id: String, new_position: f64 },
    ModifyClip { clip_id: String, changes: ClipChanges },
}

// Применение дельты
impl Timeline {
    pub fn apply_delta(&mut self, delta: TimelineDelta) {
        for op in delta.operations {
            match op {
                Operation::AddClip { track, position, clip } => {
                    self.tracks[track].add_clip(position, clip);
                }
                // ... другие операции
            }
        }
    }
}
```

### Медиа дедупликация:

```rust
use blake3::Hasher;

pub struct MediaStore {
    storage_path: PathBuf,
}

impl MediaStore {
    pub fn store_media(&self, file_path: &Path) -> Result<MediaRef> {
        // Вычисляем хеш файла
        let hash = self.compute_hash(file_path)?;
        
        // Проверяем, есть ли уже такой файл
        let target_path = self.storage_path.join(&hash);
        if !target_path.exists() {
            // Копируем только если нет
            fs::copy(file_path, &target_path)?;
        }
        
        Ok(MediaRef {
            hash,
            original_path: file_path.to_owned(),
            size: fs::metadata(file_path)?.len(),
        })
    }
}
```

## 📊 План реализации (адаптирован под существующую архитектуру)

### Фаза 1: Интеграция с существующим State (1 неделя) ✅ ЗАВЕРШЕНО
- [x] Расширить `ProjectState` добавив `VersionInfo`
- [x] Добавить команды версионирования в `ProjectCommand` enum  
- [x] Расширить `ProjectEvent` событиями версионирования
- [x] Обновить `CommandHandler` для обработки новых команд
- [x] Базовые unit тесты интеграции

### Фаза 2: Расширение PersistenceService (1 неделя) ✅ ЗАВЕРШЕНО
- [x] Добавить методы версионирования в `PersistenceService`
- [x] Интеграция с существующим автосохранением (`save_checkpoint`)
- [x] Фоновое автосохранение с двумя уровнями (checkpoints + snapshots)
- [x] История версий через `get_version_history()` метод
- [x] Настраиваемые интервалы автосохранения через команды

### Фаза 3: Отдельный модуль version_control (2 недели)
- [ ] Создать модуль `src-tauri/src/version_control/`
- [ ] `VersionRepository` для управления снимками `ProjectState`
- [ ] Дельта-сжатие между состояниями проекта
- [ ] Интеграция с `MediaPool` для дедупликации медиа
- [ ] Advanced функции: merge, diff, branches
- [ ] Оптимизация производительности

### Фаза 4: Frontend интеграция (2 недели) ✅ ЗАВЕРШЕНО
- [x] Расширить `BackendSync` методами версионирования
- [x] Создать хуки: `useVersionControl`, `useProjectHistory`
- [x] UI компоненты: история версий, панель управления версиями
- [x] Интеграция с существующими провайдерами состояния
- [x] Базовые unit тесты интеграции
- [ ] Recovery механизм через существующий error handling (TODO)
- [ ] Тестирование E2E с существующими workflow (TODO)

## 🎯 Метрики успеха

### Производительность:
- Автосохранение <500ms
- Загрузка версии <2s
- Размер дельты <1MB

### Надежность:
- 0% потери данных
- Восстановление 99.9%
- Успешный merge 95%

### Удобство:
- Прозрачное автосохранение
- Интуитивная история
- Быстрый откат

## 🔗 Интеграция

### С существующими модулями:
- **StateManager** - координация версионирования с общим состоянием
- **PersistenceService** - расширение автосохранения для версионирования  
- **EventBus** - публикация событий версионирования
- **CommandHandler** - обработка команд версионирования
- **MediaPool** - дедупликация медиафайлов между версиями
- **Timeline Provider** - уведомления о восстановлении версий
- **BackendSync** - синхронизация версионирования с frontend

### API интеграция с BackendSync:
```typescript
// ✅ РАСШИРИТЬ существующий BackendSync
export class BackendSync {
    // ... существующие методы ...
    
    // ✅ НОВЫЕ: методы версионирования
    async createSnapshot(message?: string): Promise<string> {
        return this.executeCommand({
            type: "CreateSnapshot",
            params: { message }
        })
    }
    
    async restoreVersion(versionId: string): Promise<void> {
        return this.executeCommand({
            type: "RestoreVersion", 
            params: { version_id: versionId }
        })
    }
    
    async getVersionHistory(limit?: number): Promise<VersionInfo[]> {
        return this.executeCommand({
            type: "GetVersionHistory",
            params: { limit }
        })
    }
    
    // События версионирования (расширение существующих)
    onVersionCreated(handler: (version: VersionInfo) => void): () => void
    onVersionRestored(handler: (version: VersionInfo) => void): () => void
}

// ✅ НОВЫЕ команды в ProjectCommand enum
pub enum ProjectCommand {
    // ... существующие команды ...
    
    CreateSnapshot { message: Option<String> },
    RestoreVersion { version_id: String },
    GetVersionHistory { limit: Option<u32> },
    CompareVersions { version_a: String, version_b: String },
}
```

## 📚 Справочные материалы

- [Git Internals](https://git-scm.com/book/en/v2/Git-Internals-Plumbing-and-Porcelain)
- [Apple Final Cut Pro X Libraries](https://support.apple.com/guide/final-cut-pro/)
- [Adobe Premiere Auto-Save](https://helpx.adobe.com/premiere-pro/using/auto-save.html)
- [DaVinci Resolve Project Management](https://documents.blackmagicdesign.com/)

---

## ✅ Реализованная функциональность

### Интеграция с backend архитектурой (Фазы 1-2):

#### 1. Расширенная структура ProjectState:
```rust
pub struct ProjectState {
    pub project: Option<Project>,
    pub ui_state: UiState,
    pub playback_state: PlaybackState,
    pub version: u32,
    pub version_info: VersionInfo,  // ✅ ДОБАВЛЕНО
}

pub struct VersionInfo {
    pub current_version_id: String,
    pub branch_name: String,
    pub has_uncommitted_changes: bool,
    pub last_snapshot_time: DateTime<Utc>,
    pub auto_save_enabled: bool,
    pub auto_save_interval_seconds: u32,
}
```

#### 2. Команды версионирования:
```rust
pub enum ProjectCommand {
    // ... существующие команды ...
    
    // ✅ РЕАЛИЗОВАННЫЕ команды версионирования:
    CreateSnapshot { message: Option<String> },
    RestoreVersion { version_id: String },
    GetVersionHistory { limit: Option<u32> },
    CompareVersions { version_a: String, version_b: String },
    CreateBranch { branch_name: String, from_version: Option<String> },
    MergeBranch { source_branch: String, target_branch: String },
    SwitchBranch { branch_name: String },
    SetAutoSaveInterval { seconds: u32 },
    EnableAutoSave { enabled: bool },
}
```

#### 3. События версионирования:
```rust
pub enum ProjectEvent {
    // ... существующие события ...
    
    // ✅ РЕАЛИЗОВАННЫЕ события версионирования:
    SnapshotCreated { version_id: String, message: Option<String>, parent_version: Option<String> },
    VersionRestored { version_id: String, previous_version: String },
    BranchCreated { branch_name: String, base_version: String },
    BranchSwitched { from_branch: String, to_branch: String },
    AutoSaveTriggered { snapshot_id: String },
    MergeCompleted { source_branch: String, target_branch: String, result_version: String },
    AutoSaveConfigChanged { enabled: bool, interval_seconds: u32 },
}
```

#### 4. Фоновое автосохранение в StateManager:
- **Checkpoint автосохранение** - каждые 30 секунд (настраивается)
  - Быстрое сохранение для восстановления после сбоев
  - Сохраняется в `.tlsp` файлы в директории `autosave/`
  
- **Snapshot автосохранение** - каждые 5 минут
  - Полные снимки для версионного контроля  
  - Сохраняется в `.tlsv` файлы в директории `versions/`
  - Генерирует события `AutoSaveTriggered`

#### 5. Методы PersistenceService:
```rust
impl PersistenceService {
    // ✅ РЕАЛИЗОВАННЫЕ методы версионирования:
    pub async fn save_snapshot(&self, snapshot: &ProjectSnapshot) -> Result<(), String>
    pub async fn load_snapshot(&self, version_id: &str) -> Result<ProjectSnapshot, String>  
    pub async fn get_version_history(&self, limit: Option<u32>) -> Result<Vec<VersionInfo>, String>
}
```

#### 6. Файловая структура:
```
{app_data}/
├── autosave/                    # Checkpoints для восстановления
│   ├── checkpoint_1722178800.tlsp
│   ├── checkpoint_1722178830.tlsp
│   └── ... (последние 10)
└── versions/                    # Snapshots для версионирования
    ├── snapshot_uuid1.tlsv
    ├── snapshot_uuid2.tlsv
    └── ...
```

#### 7. Настраиваемость автосохранения:
- Команды `SetAutoSaveInterval` и `EnableAutoSave` 
- Динамическое изменение интервалов без перезапуска
- События `AutoSaveConfigChanged` для синхронизации UI

## 🔄 Статус интеграции

**Текущий статус**: Фазы 1-2 завершены ✅, Фаза 4 в процессе 🔄  
**Приоритет**: Средний  
**Зависимости**: 
- ✅ Backend архитектура полностью интегрирована
- ✅ Автосохранение работает в фоновом режиме
- 🔄 Frontend интеграция через BackendSync в процессе

**Достигнутые результаты**:
- ✅ Безопасность данных - автоматическое двухуровневое сохранение
- ✅ История изменений - полные снимки состояния проекта
- ✅ Восстановление после сбоев - checkpoint'ы каждые 30 сек
- ✅ Настраиваемость - динамические интервалы автосохранения
- ✅ Обратная совместимость - существующие проекты работают

### 8. Frontend интеграция (Фаза 4):

#### BackendSync расширение:
```typescript
// ✅ РЕАЛИЗОВАННЫЕ методы версионирования в BackendSync:
export class BackendSync {
    // Основные методы версионирования
    async createSnapshot(message?: string): Promise<CommandResult>
    async restoreVersion(versionId: string): Promise<CommandResult>
    async getVersionHistory(limit?: number): Promise<CommandResult>
    async compareVersions(versionA: string, versionB: string): Promise<CommandResult>
    
    // Управление ветками
    async createBranch(branchName: string, fromVersion?: string): Promise<CommandResult>
    async mergeBranch(sourceBranch: string, targetBranch: string): Promise<CommandResult>
    async switchBranch(branchName: string): Promise<CommandResult>
    
    // Настройки автосохранения
    async setAutoSaveInterval(seconds: number): Promise<CommandResult>
    async enableAutoSave(enabled: boolean): Promise<CommandResult>
}
```

#### Хук useVersionControl:
```typescript
// ✅ РЕАЛИЗОВАННЫЙ хук версионного контроля:
export interface VersionControlState {
    currentVersionId: string
    branchName: string
    hasUncommittedChanges: boolean
    lastSnapshotTime: Date | null
    autoSaveEnabled: boolean
    autoSaveIntervalSeconds: number
    isLoading: boolean
    error: string | null
}

export interface VersionControlActions {
    createSnapshot: (message?: string) => Promise<boolean>
    restoreVersion: (versionId: string) => Promise<boolean>
    getVersionHistory: (limit?: number) => Promise<VersionInfo[] | null>
    // ... остальные методы
}
```

#### UI компоненты:
- ✅ `VersionHistoryPanel` - панель истории версий с автосохранением
- ✅ `VersionControlManager` - основной менеджер версионирования
- ✅ Настройки автосохранения (интервалы, включение/выключение)
- ✅ Создание и восстановление снимков
- ✅ Управление ветками (базовая функциональность)

#### Тестирование:
- ✅ Unit тесты для `useVersionControl` хука
- ✅ Интеграционные тесты BackendSync с версионированием
- ✅ Тесты состояний загрузки и обработки ошибок

**Завершенные результаты**:
- ✅ Полная интеграция frontend-backend для версионирования
- ✅ Пользовательский интерфейс для управления версиями
- ✅ Автоматическое обновление UI при событиях версионирования
- ✅ Toast уведомления для всех операций
- ✅ Обработка ошибок и состояний загрузки

**Следующие шаги (опционально)**:
1. Recovery механизм через существующий error handling
2. E2E тестирование с существующими workflow
3. Продвинутые функции: merge conflicts UI, diff viewer
4. Дополнительная модуль version_control (Фаза 3)

---

*Обновлено: 28 июля 2025 - завершены Фазы 1-2 и 4, система версионирования полностью функциональна*  
*Статус: Основная функциональность готова к использованию*
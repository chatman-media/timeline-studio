# Filesystem Module

Unified модуль для работы с файловой системой и управления директориями Timeline Studio.

## Обзор

Filesystem module объединяет две группы функциональности:
- **File Operations** - Generic операции с файлами и путями
- **App Directories** - Управление структурой директорий приложения

## Структура файлов

```
filesystem/
├── README.md           # Этот файл
├── mod.rs             # Re-exports
├── operations.rs      # Generic file operations
└── app_dirs.rs        # App directories management
```

## File Operations / Операции с файлами

**Файл:** `operations.rs`

### Команды

#### file_exists / Проверка существования файла

```rust
#[tauri::command]
pub fn file_exists(path: String) -> Result<bool, String>
```

**Frontend пример:**
```typescript
import { invoke } from "@tauri-apps/api/core"

const exists = await invoke("file_exists", {
  path: "/path/to/file.mp4"
})

if (exists) {
  console.log("File found!")
}
```

#### get_file_stats / Получение статистики файла

```rust
#[tauri::command]
pub fn get_file_stats(path: String) -> Result<FileStats, String>

pub struct FileStats {
  pub size: u64,
  pub last_modified: u64,  // Unix timestamp в миллисекундах
}
```

**Frontend пример:**
```typescript
const stats = await invoke("get_file_stats", {
  path: "/path/to/video.mp4"
})

console.log(`Size: ${stats.size} bytes`)
console.log(`Modified: ${new Date(stats.lastModified)}`)
```

#### get_platform / Получение платформы ОС

```rust
#[tauri::command]
pub fn get_platform() -> Result<String, String>
```

Возвращает: `"windows"`, `"macos"`, `"linux"`, `"ios"`, или `"android"`

**Frontend пример:**
```typescript
const platform = await invoke("get_platform")

if (platform === "macos") {
  // macOS-specific logic
}
```

#### search_files_by_name / Рекурсивный поиск файлов

```rust
#[tauri::command]
pub fn search_files_by_name(
  directory: String,
  filename: String,
  max_depth: Option<u32>  // По умолчанию 5
) -> Result<Vec<String>, String>
```

**Frontend пример:**
```typescript
const foundFiles = await invoke("search_files_by_name", {
  directory: "/Users/me/Videos",
  filename: "intro.mp4",
  maxDepth: 3
})

console.log(`Found ${foundFiles.length} files:`)
foundFiles.forEach(path => console.log(path))
```

#### get_absolute_path / Получение абсолютного пути

```rust
#[tauri::command]
pub fn get_absolute_path(path: String) -> Result<String, String>
```

**Frontend пример:**
```typescript
const absolutePath = await invoke("get_absolute_path", {
  path: "./relative/path/video.mp4"
})

console.log(absolutePath) // "/full/path/to/relative/path/video.mp4"
```

## App Directories / Директории приложения

**Файл:** `app_dirs.rs`

### Структура директорий

Timeline Studio создаёт следующую структуру директорий:

```
Timeline Studio/           # Base directory
├── Media/                # Медиафайлы
│   ├── Videos/
│   ├── Images/
│   ├── Music/
│   ├── Effects/
│   ├── Transitions/
│   ├── Filters/
│   ├── StyleTemplates/
│   └── Subtitles/
├── Projects/             # Проекты пользователя
├── Output/               # Экспортированные видео
├── Render/               # Промежуточные рендеры
├── Caches/               # Кэши
│   ├── Previews/         # Превью кэш
│   ├── Renders/          # Рендер кэш
│   ├── Frames/           # Кэш фреймов
│   └── Temp/             # Временные файлы
├── Snapshot/             # Снимки экрана
├── Cinematic/            # Кинематографические эффекты
├── Recognition/          # Результаты распознавания
├── Backup/               # Резервные копии
├── MediaProxy/           # Прокси медиа
├── Recorded/             # Записанные файлы
├── Audio/                # Аудио файлы
├── Cloud Project/        # Облачные проекты
└── Upload/               # Загрузки
```

### Base Directory Locations / Расположение базовой директории

| Platform | Location |
|----------|----------|
| **macOS** | `~/Movies/Timeline Studio` |
| **Windows** | `~/Videos/Timeline Studio` |
| **Linux** | `~/Videos/Timeline Studio` |

### Core Types / Основные типы

```rust
pub struct AppDirectories {
  pub base_dir: PathBuf,
  pub media_dir: PathBuf,
  pub projects_dir: PathBuf,
  pub snapshot_dir: PathBuf,
  pub cinematic_dir: PathBuf,
  pub output_dir: PathBuf,
  pub render_dir: PathBuf,
  pub recognition_dir: PathBuf,
  pub backup_dir: PathBuf,
  pub media_proxy_dir: PathBuf,
  pub caches_dir: PathBuf,
  pub recorded_dir: PathBuf,
  pub audio_dir: PathBuf,
  pub cloud_project_dir: PathBuf,
  pub upload_dir: PathBuf,
}

pub struct MediaSubdirectories {
  pub videos: PathBuf,
  pub effects: PathBuf,
  pub transitions: PathBuf,
  pub images: PathBuf,
  pub music: PathBuf,
  pub style_templates: PathBuf,
  pub subtitles: PathBuf,
  pub filters: PathBuf,
}

pub struct DirectorySizes {
  pub media: u64,
  pub projects: u64,
  pub output: u64,
  pub render: u64,
  pub caches: u64,
  pub backup: u64,
  pub total: u64,
}
```

### Команды

#### get_app_directories / Получить директории приложения

```rust
#[tauri::command]
pub async fn get_app_directories() -> Result<AppDirectories, String>
```

**Frontend пример:**
```typescript
const dirs = await invoke("get_app_directories")

console.log("Base:", dirs.baseDir)
console.log("Media:", dirs.mediaDir)
console.log("Projects:", dirs.projectsDir)
```

#### create_app_directories / Создать директории приложения

```rust
#[tauri::command]
pub async fn create_app_directories() -> Result<AppDirectories, String>
```

Создаёт всю структуру директорий если её нет. Безопасно для повторного вызова.

**Frontend пример:**
```typescript
try {
  const dirs = await invoke("create_app_directories")
  console.log("Directories created successfully")
} catch (error) {
  console.error("Failed to create directories:", error)
}
```

#### get_directory_sizes / Получить размеры директорий

```rust
#[tauri::command]
pub async fn get_directory_sizes() -> Result<DirectorySizes, String>
```

**Frontend пример:**
```typescript
const sizes = await invoke("get_directory_sizes")

function formatBytes(bytes) {
  return (bytes / 1024 / 1024).toFixed(2) + " MB"
}

console.log("Media:", formatBytes(sizes.media))
console.log("Projects:", formatBytes(sizes.projects))
console.log("Caches:", formatBytes(sizes.caches))
console.log("Total:", formatBytes(sizes.total))
```

#### clear_app_cache / Очистить кэш приложения

```rust
#[tauri::command]
pub async fn clear_app_cache() -> Result<(), String>
```

Очищает всё содержимое директории `Caches/`, но пересоздаёт поддиректории (`Previews/`, `Renders/`, `Frames/`, `Temp/`).

**Frontend пример:**
```typescript
try {
  await invoke("clear_app_cache")
  console.log("Cache cleared successfully")

  // Refresh directory sizes
  const sizes = await invoke("get_directory_sizes")
  console.log("Cache size after clear:", sizes.caches) // Should be ~0
} catch (error) {
  console.error("Failed to clear cache:", error)
}
```

## Frontend Integration / Интеграция с фронтендом

### System Integration Domain

**Frontend:** `src/domains/system-integration/`

Этот домен использует filesystem команды для работы с файлами и директориями.

### Использование File Operations

```typescript
// Check file before processing
const fileExists = await invoke("file_exists", { path: videoPath })
if (!fileExists) {
  throw new Error("Video file not found")
}

// Get file metadata
const stats = await invoke("get_file_stats", { path: videoPath })
console.log(`Processing ${stats.size} byte file`)

// Search for missing files
const results = await invoke("search_files_by_name", {
  directory: "/Users/me/Videos",
  filename: "missing-video.mp4",
  maxDepth: 5
})

if (results.length > 0) {
  console.log("Found missing file at:", results[0])
}
```

### Использование App Directories

```typescript
// Initialize app directories on startup
async function initializeApp() {
  try {
    const dirs = await invoke("create_app_directories")

    // Store paths for later use
    localStorage.setItem("mediaDir", dirs.mediaDir)
    localStorage.setItem("projectsDir", dirs.projectsDir)

    return dirs
  } catch (error) {
    console.error("Failed to initialize directories:", error)
    throw error
  }
}

// Get directory sizes for storage management UI
async function showStorageInfo() {
  const sizes = await invoke("get_directory_sizes")

  return {
    media: formatSize(sizes.media),
    projects: formatSize(sizes.projects),
    caches: formatSize(sizes.caches),
    total: formatSize(sizes.total),
  }
}

// Clear cache when running low on space
async function freeUpSpace() {
  await invoke("clear_app_cache")
  console.log("Cache cleared to free up space")
}
```

### Platform-Specific Logic

```typescript
const platform = await invoke("get_platform")

const shortcuts = {
  windows: {
    save: "Ctrl+S",
    export: "Ctrl+E"
  },
  macos: {
    save: "Cmd+S",
    export: "Cmd+E"
  },
  linux: {
    save: "Ctrl+S",
    export: "Ctrl+E"
  }
}

const appShortcuts = shortcuts[platform]
```

## Best Practices / Лучшие практики

### 1. Всегда проверяйте существование файлов

❌ **НЕ делайте так:**
```typescript
// Предполагаем что файл существует
const stats = await invoke("get_file_stats", { path })
```

✅ **Делайте так:**
```typescript
const exists = await invoke("file_exists", { path })
if (exists) {
  const stats = await invoke("get_file_stats", { path })
} else {
  console.error("File not found")
}
```

### 2. Используйте app directories вместо hardcoded путей

❌ **НЕ делайте так:**
```typescript
const projectPath = "/Users/me/Movies/Timeline Studio/Projects/my-project.json"
```

✅ **Делайте так:**
```typescript
const dirs = await invoke("get_app_directories")
const projectPath = `${dirs.projectsDir}/my-project.json`
```

### 3. Обрабатывайте ошибки файловых операций

❌ **НЕ делайте так:**
```typescript
const files = await invoke("search_files_by_name", {
  directory: userInput,
  filename: "video.mp4"
})
```

✅ **Делайте так:**
```typescript
try {
  const files = await invoke("search_files_by_name", {
    directory: userInput,
    filename: "video.mp4",
    maxDepth: 3
  })

  if (files.length === 0) {
    console.warn("No files found")
  }
} catch (error) {
  console.error("Search failed:", error)
  // Directory doesn't exist or permission denied
}
```

### 4. Очищайте кэш периодически

```typescript
// Clear cache when it exceeds threshold
async function manageCacheSize() {
  const sizes = await invoke("get_directory_sizes")
  const MAX_CACHE_SIZE = 1024 * 1024 * 1024 // 1 GB

  if (sizes.caches > MAX_CACHE_SIZE) {
    console.log("Cache exceeds 1GB, clearing...")
    await invoke("clear_app_cache")
  }
}
```

### 5. Используйте абсолютные пути для безопасности

❌ **НЕ делайте так:**
```typescript
// Относительные пути могут быть небезопасными
const path = "../../../etc/passwd"
```

✅ **Делайте так:**
```typescript
// Конвертируйте в абсолютный путь
const absolutePath = await invoke("get_absolute_path", { path: relativePath })
```

## Testing / Тестирование

### Unit Tests

Тесты находятся в каждом файле:

**operations.rs:**
```rust
#[cfg(test)]
mod tests {
    #[test]
    fn test_file_exists() { /* ... */ }

    #[test]
    fn test_get_file_stats() { /* ... */ }

    #[test]
    fn test_search_files_by_name() { /* ... */ }

    #[test]
    fn test_get_absolute_path() { /* ... */ }
}
```

**app_dirs.rs:**
```rust
#[cfg(test)]
mod tests {
    #[test]
    fn test_app_directories_creation() { /* ... */ }

    #[test]
    fn test_create_all_directories() { /* ... */ }

    #[test]
    fn test_clear_cache_directory() { /* ... */ }

    #[test]
    fn test_get_directory_sizes() { /* ... */ }
}
```

### Running Tests

```bash
# Run all filesystem tests
cd src-tauri
cargo test filesystem::

# Run operations tests
cargo test filesystem::operations::tests

# Run app_dirs tests
cargo test filesystem::app_dirs::tests
```

## Performance / Производительность

### File Search Optimization

```typescript
// Limit depth for large directory trees
const files = await invoke("search_files_by_name", {
  directory: "/very/large/directory",
  filename: "video.mp4",
  maxDepth: 2  // ⚠️ Important for performance
})
```

### Directory Sizes Caching

```typescript
// Cache directory sizes (они не меняются часто)
let cachedSizes = null
let lastFetch = 0

async function getDirectorySizes() {
  const now = Date.now()
  const CACHE_DURATION = 60 * 1000 // 1 minute

  if (cachedSizes && (now - lastFetch) < CACHE_DURATION) {
    return cachedSizes
  }

  cachedSizes = await invoke("get_directory_sizes")
  lastFetch = now

  return cachedSizes
}
```

## Related Modules / Связанные модули

- **Frontend Domains:**
  - `src/domains/system-integration/` - System integration
  - `src/domains/project-management/` - Project file management

- **Backend Modules:**
  - `src-tauri/src/media/` - Media file processing
  - `src-tauri/src/video_compiler/` - Video compilation

## Changelog / История изменений

### v3.16.0 (2025-11-26)
- ✅ Объединены `filesystem.rs` и `app_dirs.rs` в единый модуль
- ✅ Создана структура `filesystem/` с `operations.rs` и `app_dirs.rs`
- ✅ Добавлен `mod.rs` с re-exports для удобства использования
- ✅ Comprehensive README документация

### v3.0.0 (2025-11-18)
- ✅ Исходные модули `filesystem.rs` и `app_dirs.rs`
- ✅ Tauri commands для файловых операций
- ✅ App directories management

## License / Лицензия

Часть Timeline Studio. См. корневую лицензию проекта.

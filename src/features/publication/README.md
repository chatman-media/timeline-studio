# Publication

## Overview / Обзор

**EN:** Publication tasks management system for Timeline Studio. Provides integration with video hosting platforms (YouTube, TikTok, VK) through plugin system. Monitors upload progress, manages publication metadata, and tracks task status.

**RU:** Система управления задачами публикации для Timeline Studio. Обеспечивает интеграцию с видеохостингами (YouTube, TikTok, VK) через систему плагинов. Отслеживает прогресс загрузки, управляет метаданными публикации и отслеживает статус задач.

## API (Backend Commands)

| Command | Parameters | Description |
|---------|------------|-------------|
| `send_plugin_command` | `{ pluginId: "youtube-uploader", command: "list_uploads", params: {} }` | Get list of active uploads |
| `send_plugin_command` | `{ pluginId: "youtube-uploader", command: "get_status", params: { upload_id: string } }` | Get upload status by ID |

**Note**: Uses plugin system for communication with backend. Plugin commands are routed through `send_plugin_command`.

## Behavior (from tests) / Поведение (из тестов)

No tests found in the module. Tests should be added for:
- Publication task creation
- Progress tracking
- Status updates
- Error handling
- Plugin communication

## Structure / Структура

```
publication/
├── components/               # UI компоненты
│   └── publication-tasks-dropdown.tsx
├── hooks/                    # React хуки
│   └── use-publication-tasks.ts
└── types/                    # TypeScript типы
    └── publication.ts
```

## Features / Функции

### Supported Platforms
- **YouTube**: Full upload support
- **TikTok**: Planned
- **VK**: Planned
- **Instagram**: Planned
- **Facebook**: Planned
- **Twitter**: Planned

### Publication Status
- **Preparing**: Initial stage, preparing files
- **Uploading**: Actively uploading to platform
- **Processing**: Platform processing video
- **Completed**: Successfully published
- **Failed**: Upload failed with error
- **Cancelled**: User cancelled upload

### Progress Tracking
- Upload percentage (0-100%)
- Current stage description
- Bytes uploaded / total bytes
- Progress messages
- Estimated time remaining

### Task Management
- List all active publication tasks
- Get task details by ID
- Cancel ongoing uploads
- Auto-refresh every 5 seconds
- Plugin availability detection

## Hook Usage / Использование хука

```typescript
import { usePublicationTasks } from '@/features/publication'

function PublicationPanel() {
  const {
    tasks,           // Array of publication tasks
    isLoading,       // Loading state
    error,           // Error message if any
    refreshTasks,    // Manual refresh
    getTask,         // Get task by ID
    cancelTask,      // Cancel upload
  } = usePublicationTasks()

  return (
    <div>
      {tasks.map(task => (
        <div key={task.id}>
          <h3>{task.title}</h3>
          <p>Status: {task.status}</p>
          {task.progress && (
            <progress value={task.progress.percentage} max={100} />
          )}
        </div>
      ))}
    </div>
  )
}
```

## Utility Functions / Утилиты

```typescript
// Get localized status label
getPublicationStatusLabel(status: PublicationStatus, t: Function): string

// Get status color class
getPublicationStatusColor(status: PublicationStatus): string

// Format publication duration
formatPublicationDuration(startTime: string, endTime?: string, t?: Function): string
```

## Dependencies / Зависимости

- Depends on:
  - `@tauri-apps/api/core` - для invoke команд
  - `@/lib/duration-formatter` - для форматирования времени
  - `@/lib/tauri-logger` - для логирования
  - Plugin system: `youtube-uploader` плагин
- Used by:
  - Media Studio - для экспорта и публикации
  - Project export workflow

## E2E Tests / E2E Тесты

**Расположение:** `e2e/tauri/features/publication/`

### Чеклист тестов

| Тест | Статус | Файл | Приоритет |
|------|--------|------|-----------|
| Загрузка списка активных публикаций | ⏳ Planned | - | 🔴 High |
| Tauri команда `send_plugin_command` (list_uploads) | ⏳ Planned | - | 🔴 High |
| Tauri команда `send_plugin_command` (get_status) | ⏳ Planned | - | 🔴 High |
| Отображение статуса публикации (preparing, uploading, processing) | ⏳ Planned | - | 🔴 High |
| Обновление прогресса загрузки (0-100%) | ⏳ Planned | - | 🔴 High |
| Автоматическое обновление каждые 5 секунд | ⏳ Planned | - | 🟡 Medium |
| Отмена загрузки (cancel task) | ⏳ Planned | - | 🟡 Medium |
| Обработка ошибок загрузки (failed status) | ⏳ Planned | - | 🔴 High |
| Отображение Dropdown с задачами публикации | ⏳ Planned | - | 🟡 Medium |
| Проверка доступности YouTube uploader plugin | ⏳ Planned | - | 🔴 High |
| Обработка отсутствия plugin | ⏳ Planned | - | 🟡 Medium |
| Форматирование длительности публикации | ⏳ Planned | - | 🟢 Low |
| Локализованные статусы (EN/RU) | ⏳ Planned | - | 🟢 Low |
| Цветовая индикация статусов | ⏳ Planned | - | 🟢 Low |

### Приоритеты
- 🔴 High - критичный функционал (plugin commands, статусы, прогресс, ошибки)
- 🟡 Medium - важный функционал (автообновление, отмена, UI, проверка plugin)
- 🟢 Low - дополнительный функционал (форматирование, локализация, цвета)

### Описание
Publication модуль интегрируется с YouTube Uploader plugin через Tauri команду `send_plugin_command`. Критически важно протестировать взаимодействие с plugin системой, обработку различных статусов публикации и корректность отображения прогресса. Необходимо проверить работу автоматического обновления статусов и корректную обработку ошибок при недоступности plugin.

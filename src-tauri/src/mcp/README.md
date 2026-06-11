# MCP (Model Context Protocol) Integration

Интеграция Claude через MCP для Timeline Studio - позволяет использовать Claude API с инструментами видеомонтажа.

## Архитектура

```
┌─────────────────┐
│   Frontend UI   │
│   (React)       │
└────────┬────────┘
         │ invoke()
         ▼
┌─────────────────────────────┐
│  Tauri Commands             │
│  - mcp_chat                 │
│  - mcp_execute_tool         │
│  - mcp_initialize           │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│  MCP Server                 │
│  - Управляет Claude API     │
│  - Обрабатывает tool calls  │
└────────┬────────────────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌────────┐  ┌──────────────┐
│ Claude │  │ VideoTools   │
│  API   │  │ - 18 tools   │
└────────┘  └──────────────┘
```

## Доступные инструменты (18 штук)

## Production readiness

MCP tool schemas are visible to Claude/AI Chat, but only implemented tools may return `success: true`. Planned tools must return `success: false` with a clear `not implemented` error until they mutate project state or execute the export/preview service.

| Tool | Status | Canonical input |
| --- | --- | --- |
| `add_clip` | Production timeline edit | `track_id`, `media_id`, `time` |
| `move_clip` | Production timeline edit | `clip_id`, `new_track_id`, `new_time` |
| `split_clip` | Production timeline edit | `clip_id`, `time` |
| `list_media_files` | Production project query | optional `filter_type=all/video/audio/image` |
| `apply_filter` | Planned | returns failure until implemented |
| `add_transition` | Planned | returns failure until implemented |
| `apply_color_grading` | Planned | returns failure until implemented |
| `add_text_overlay` | Planned | returns failure until implemented |
| `export_video` | Planned | returns failure until implemented |
| `create_preview` | Planned | returns failure until implemented |

### Анализ видео
1. **analyze_video** - Полный анализ видео (качество, метаданные, контент)
2. **detect_scenes** - Обнаружение сцен с анализом качества
3. **detect_moments** - Поиск ключевых моментов
4. **analyze_audio** - Анализ аудио (громкость, речь, музыка)

### Timeline операции
5. **create_timeline** - Создать новый timeline проект
6. **add_clip** - Добавить клип на timeline
7. **remove_clip** - Удалить клип
8. **move_clip** - Переместить клип
9. **split_clip** - Разделить клип

### Эффекты
10. **apply_filter** - Применить фильтр (blur, grayscale, sharpen...)
11. **add_transition** - Добавить переход (fade, dissolve, wipe...)
12. **apply_color_grading** - Цветокоррекция
13. **add_text_overlay** - Текстовый оверлей

### Экспорт
14. **export_video** - Экспорт в видео файл
15. **create_preview** - Создать превью изображение

### Проект
16. **get_project_info** - Информация о проекте
17. **save_project** - Сохранить проект
18. **list_media_files** - Список медиафайлов

## Использование

### Backend (Rust)

```rust
use crate::mcp::{MCPServer, MCPConfig, MCPServerState};
use std::sync::Arc;
use tokio::sync::RwLock;

// Инициализация MCP сервера
let config = MCPConfig {
    enabled: true,
    claude_api_key: Some("sk-ant-...".to_string()),
    model: "claude-3-5-sonnet-20241022".to_string(),
    max_tokens: 4096,
    temperature: 0.7,
};

let mcp_state = MCPServerState(Arc::new(RwLock::new(None)));

// В Tauri builder
.manage(mcp_state)
.invoke_handler(tauri::generate_handler![
    mcp_initialize,
    mcp_chat,
    mcp_execute_tool,
    mcp_get_tools,
    mcp_check_api,
])
```

### Frontend (TypeScript)

```typescript
import { invoke } from '@tauri-apps/api/core'

// Инициализация
await invoke('mcp_initialize', {
  config: {
    enabled: true,
    claude_api_key: 'sk-ant-...',
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 4096,
    temperature: 0.7
  }
})

// Чат с Claude
const response = await invoke('mcp_chat', {
  message: 'Проанализируй это видео и найди лучшие моменты',
  history: [
    { role: 'user', content: 'Привет' },
    { role: 'assistant', content: 'Здравствуйте!' }
  ]
})

// Прямой вызов инструмента
const result = await invoke('mcp_execute_tool', {
  request: {
    tool_name: 'detect_scenes',
    arguments: {
      video_path: '/path/to/video.mp4',
      min_scene_duration: 2.0
    }
  }
})

// Получить список инструментов
const tools = await invoke('mcp_get_tools')
// => ['analyze_video', 'detect_scenes', ...]
```

## Примеры использования

### 1. Анализ видео через чат

```typescript
const response = await invoke('mcp_chat', {
  message: 'Проанализируй видео /Users/me/video.mp4 и скажи что там интересного',
  history: []
})

// Claude использует analyze_video tool автоматически:
// "Я проанализировал видео. Обнаружено 15 сцен, 8 ключевых моментов..."
```

### 2. Создание монтажа

```typescript
const response = await invoke('mcp_chat', {
  message: 'Создай монтаж из лучших моментов этого видео, добавь переходы',
  history: []
})

// Claude автоматически:
// 1. Вызовет detect_moments для поиска лучших моментов
// 2. Создаст timeline через create_timeline
// 3. Добавит клипы через add_clip
// 4. Добавит переходы через add_transition
```

### 3. Прямой вызов инструмента

```typescript
const scenes = await invoke('mcp_execute_tool', {
  request: {
    tool_name: 'detect_scenes',
    arguments: {
      video_path: '/Users/me/video.mp4',
      min_scene_duration: 3.0
    }
  }
})
```

## Конфигурация

### MCPConfig

```rust
pub struct MCPConfig {
    pub enabled: bool,                  // Включить MCP
    pub claude_api_key: Option<String>, // API ключ Claude
    pub model: String,                  // Модель (claude-3-5-sonnet-20241022)
    pub max_tokens: u32,                // Максимум токенов (4096)
    pub temperature: f32,               // Температура (0.0-1.0)
}
```

### Рекомендуемые модели

- **claude-3-5-sonnet-20241022** - Лучший баланс качества/скорости
- **claude-3-opus-20240229** - Максимальное качество (медленнее)
- **claude-3-haiku-20240307** - Быстрый (но менее точный)

## Безопасность

1. **API ключи** хранятся в зашифрованном виде через `keyring`
2. **Валидация входных данных** перед выполнением инструментов
3. **Rate limiting** для Claude API запросов
4. **Логирование** всех tool calls для аудита

## Текущий статус

- ✅ Архитектура MCP создана
- ✅ 18 инструментов определены
- ✅ Claude API интеграция
- ✅ Tauri команды
- 🔧 Реализация инструментов (TODO)
- 🔧 Frontend UI для чата (TODO)
- 🔧 Тесты (TODO)

## Следующие шаги

1. Реализовать execute методы для каждого инструмента
2. Создать React компонент для чата с Claude
3. Добавить историю разговоров
4. Интегрировать с существующим AI Chat UI
5. Добавить поддержку стриминга ответов
6. Создать preset для быстрых команд

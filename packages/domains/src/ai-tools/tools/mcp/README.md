# MCP Tools - Model Context Protocol Integration

Адаптеры IAITool для 18 MCP (Model Context Protocol) инструментов из Rust backend.

## Архитектура

```
┌─────────────────────┐
│   AI Chat UI        │
│   (React)           │
└────────┬────────────┘
         │ uses allAITools
         ▼
┌─────────────────────┐
│   MCP Tool Adapters │  ← ✨ Этот слой
│   (18 IAITool)      │
└────────┬────────────┘
         │ invoke("mcp_execute_tool")
         ▼
┌─────────────────────┐
│   MCP Server        │
│   (Rust)            │
└────────┬────────────┘
         │
         ▼
┌─────────────────────┐
│   18 Video Tools    │
│   (Rust)            │
└─────────────────────┘
```

## Преимущества подхода

### ✅ Единый интерфейс
MCP tools автоматически доступны в AI Chat через существующий механизм `allAITools` - не нужен отдельный UI!

### ✅ Совместимость
Все MCP tools реализуют интерфейс `IAITool`, поэтому работают со всеми существующими фичами:
- Автоматический execution engine
- Валидация входов/выходов
- Retry логика
- Логирование
- Метрики производительности

### ✅ Простота использования
```typescript
// В AI Chat просто используется allAITools:
import { allAITools } from "@/domains/ai-tools"

// 66 инструментов (48 обычных + 18 MCP)
allAITools.forEach(tool => {
  console.log(tool.metadata.name)
})
```

## Список MCP Tools (18)

## Production Readiness

AI Chat must treat MCP `success: true` as a real project mutation/result only for implemented tools. Planned tools stay visible in the schema list, but Rust returns `success: false` until they are wired to project state or render/export services.

| MCP adapter | Rust tool | Status | Canonical input |
| --- | --- | --- | --- |
| `mcp-add-clip` | `add_clip` | Production timeline edit | `track_id`, `media_id`, `time` |
| `mcp-move-clip` | `move_clip` | Production timeline edit | `clip_id`, `new_track_id`, `new_time` |
| `mcp-split-clip` | `split_clip` | Production timeline edit | `clip_id`, `time` |
| `mcp-list-media-files` | `list_media_files` | Production project query | optional `filter_type=all/video/audio/image` |
| `mcp-apply-filter` | `apply_filter` | Planned | returns failure until implemented |
| `mcp-add-transition` | `add_transition` | Planned | returns failure until implemented |
| `mcp-apply-color-grading` | `apply_color_grading` | Planned | returns failure until implemented |
| `mcp-add-text-overlay` | `add_text_overlay` | Planned | returns failure until implemented |
| `mcp-export-video` | `export_video` | Planned | returns failure until implemented |
| `mcp-create-preview` | `create_preview` | Planned | returns failure until implemented |

### Analysis (4)
1. **mcp-analyze-video** - Полный анализ видео (качество, метаданные, контент)
2. **mcp-detect-scenes** - Обнаружение сцен с анализом качества
3. **mcp-detect-moments** - Поиск ключевых моментов
4. **mcp-analyze-audio** - Анализ аудио (громкость, речь, музыка)

### Timeline Operations (5)
5. **mcp-create-timeline** - Создать новый timeline проект
6. **mcp-add-clip** - Добавить клип на timeline
7. **mcp-remove-clip** - Удалить клип
8. **mcp-move-clip** - Переместить клип
9. **mcp-split-clip** - Разделить клип

### Effects (4)
10. **mcp-apply-filter** - Применить фильтр (blur, grayscale, sharpen...)
11. **mcp-add-transition** - Добавить переход (fade, dissolve, wipe...)
12. **mcp-apply-color-grading** - Цветокоррекция
13. **mcp-add-text-overlay** - Текстовый оверлей

### Export (2)
14. **mcp-export-video** - Экспорт в видео файл
15. **mcp-create-preview** - Создать превью изображение

### Project (3)
16. **mcp-get-project-info** - Информация о проекте
17. **mcp-save-project** - Сохранить проект
18. **mcp-list-media-files** - Список медиафайлов

## Пример использования

### В AI Chat
```typescript
// AI Chat автоматически видит все MCP tools через allAITools
const message = "Проанализируй видео /path/to/video.mp4 и найди лучшие моменты"

// Claude автоматически использует:
// 1. mcp-analyze-video для анализа
// 2. mcp-detect-moments для поиска моментов
```

### Прямой вызов
```typescript
import { MCPDetectMomentsTool } from "@/domains/ai-tools/tools/mcp"

const tool = new MCPDetectMomentsTool()

const result = await tool.execute({
  video_path: "/path/to/video.mp4",
  max_moments: 5
})

console.log(result.data.moments)
```

## Как это работает

### 1. BaseMCPTool
Базовый класс для всех MCP адаптеров:
```typescript
abstract class BaseMCPTool extends BaseAITool {
  protected abstract mcpToolName: string

  async execute(input: any): Promise<AIToolResult> {
    // Вызов Rust MCP через Tauri
    const result = await invoke("mcp_execute_tool", {
      request: {
        tool_name: this.mcpToolName,
        arguments: input
      }
    })

    return {
      success: result.success,
      data: result.data,
      executionId: "...",
    }
  }
}
```

### 2. Конкретный tool
```typescript
export class MCPAnalyzeVideoTool extends BaseMCPTool {
  protected mcpToolName = "analyze_video"

  metadata: AIToolMetadata = {
    name: "mcp-analyze-video",
    displayName: "MCP: Анализ видео",
    domain: "analysis",
    category: "video-analysis",
    tags: ["mcp", "video", "analysis"],
    version: "1.0.0",
  }

  getSchema() {
    return {
      input: {
        type: "object",
        required: ["video_path"],
        properties: {
          video_path: { type: "string" },
          analysis_type: {
            type: "string",
            enum: ["quick", "balanced", "quality"]
          }
        }
      },
      output: { /* ... */ }
    }
  }
}
```

### 3. Экспорт всех tools
```typescript
export const allMCPTools = [
  new MCPAnalyzeVideoTool(),
  new MCPDetectScenesTool(),
  // ... остальные 16 tools
]
```

## Настройка MCP

### 1. API ключ
Пользователь вводит Claude API ключ в User Settings → AI Services → MCP Claude API Key

### 2. Автоинициализация
MCPProvider автоматически инициализирует MCP сервер при старте приложения, если API ключ присутствует:

```typescript
// src/features/ai-chat/services/mcp-provider.tsx
export function MCPProvider({ children }) {
  useEffect(() => {
    const mcpClaudeInfo = getApiKeyInfo("mcp_claude")

    if (mcpClaudeInfo?.has_value) {
      // Автоматическая инициализация MCP
      await invoke("mcp_initialize", { config })
    }
  }, [])

  return <>{children}</>
}
```

### 3. Готово!
MCP tools сразу доступны в AI Chat без дополнительной настройки.

## Статистика

- **Всего AI Tools**: 66 (48 обычных + 18 MCP)
- **MCP Analysis**: 4 инструмента
- **MCP Timeline**: 5 инструментов
- **MCP Effects**: 4 инструмента
- **MCP Export**: 2 инструмента
- **MCP Project**: 3 инструмента

## Backend реализация

MCP tools в Rust находятся в `src-tauri/src/mcp/tools.rs`:
- Полная реализация для Analysis (4)
- Полная реализация для Timeline (5)
- Полная реализация для Project (3)
- Заглушки для Effects (4) - TODO
- Заглушки для Export (2) - TODO

## Следующие шаги

1. ✅ Создать 18 MCP Tool адаптеров
2. ✅ Добавить в allAITools
3. ✅ Экспортировать из домена
4. 🔧 Реализовать недостающие tools в Rust (Effects + Export)
5. 🔧 Добавить тесты для MCP tools
6. 🔧 Добавить примеры использования в документацию

## Отличие от обычного AI Chat

| Функция | Обычный AI Chat | MCP Tools |
|---------|-----------------|-----------|
| Провайдеры | Claude, OpenAI, DeepSeek, Ollama | Только Claude (через MCP) |
| Инструменты | 48 общих AI tools | 18 видео-специфичных MCP tools |
| API ключ | Любой провайдер | Только Claude (пользовательский) |
| Использование | Прямой вызов AI API | Через MCP Server (Rust) |
| UI | Тот же AI Chat компонент | Тот же AI Chat компонент |

Ключевая идея: **MCP tools - это просто еще один источник инструментов для AI Chat!**

# AI Tools Domain

## 🎯 Назначение

Домен AI Tools предоставляет унифицированную систему AI инструментов для Timeline Studio. Содержит 48 инструментов, организованных по функциональным доменам для обеспечения масштабируемости и простоты использования.

## 🏗️ Архитектура

### Структура домена
```
src/domains/ai-tools/
├── base/                    # Базовые классы и утилиты
│   ├── base-ai-tool.ts     # Базовый класс для всех инструментов
│   ├── tool-registry.ts    # Реестр инструментов
│   ├── execution-engine.ts # Движок выполнения
│   └── index.ts
├── core/                   # Основные инструменты (18)
│   ├── timeline/          # Timeline инструменты (6)
│   ├── resources/         # Resources инструменты (4)
│   ├── browser/           # Browser инструменты (4)
│   ├── player/            # Player инструменты (4)
│   └── index.ts
├── analysis/              # Инструменты анализа (15)
│   ├── video-analysis/    # Video Analysis (5)
│   ├── audio-analysis/    # Audio Analysis (4)
│   ├── content-intelligence/ # Content Intelligence (3)
│   ├── whisper-tools/     # Whisper Tools (2)
│   ├── multimodal/        # Multimodal Analysis (1)
│   └── index.ts
├── automation/            # Автоматизация (10)
│   ├── batch-processing/  # Batch Processing (4)
│   ├── workflow-automation/ # Workflow Automation (3)
│   ├── smart-templates/   # Smart Templates (2)
│   ├── performance/       # Performance (1)
│   └── index.ts
├── integration/           # Интеграции (5)
│   ├── export-tools/      # Export Tools (3)
│   ├── platform-integration/ # Platform Integration (2)
│   └── index.ts
├── types/                 # Типы для AI инструментов
│   ├── tool-interfaces.ts
│   ├── execution-context.ts
│   ├── result-types.ts
│   └── index.ts
├── container.ts           # DI контейнер
└── index.ts              # Главная точка входа
```

## 🛠️ Основные компоненты

### BaseAITool
Базовый абстрактный класс для всех AI инструментов:
- Унифицированная обработка ошибок
- Retry механизм
- Логирование операций
- Таймауты выполнения
- Метрики производительности

### ToolRegistry
Реестр всех доступных инструментов:
- Регистрация инструментов по доменам
- Поиск инструментов по имени/категории
- Lazy loading инструментов
- Валидация инструментов

### ExecutionEngine
Движок выполнения инструментов:
- Управление жизненным циклом
- Параллельное выполнение
- Управление ресурсами
- Мониторинг производительности

## 📊 Статистика инструментов

- **Всего инструментов**: 48
- **Core домен**: 18 инструментов
- **Analysis домен**: 15 инструментов
- **Automation домен**: 10 инструментов
- **Integration домен**: 5 инструментов

## 🚀 Использование

### Импорт всех инструментов
```typescript
import { allAITools } from '@/domains/ai-tools'

// Использование в AI сервисе
const tools = allAITools
```

### Импорт по доменам
```typescript
import { coreTools } from '@/domains/ai-tools/core'
import { analysisTools } from '@/domains/ai-tools/analysis'
import { automationTools } from '@/domains/ai-tools/automation'
import { integrationTools } from '@/domains/ai-tools/integration'
```

### Использование ToolRegistry
```typescript
import { ToolRegistry } from '@/domains/ai-tools/base'

const registry = ToolRegistry.getInstance()
const timelineTools = registry.getToolsByDomain('core.timeline')
const videoAnalysisTools = registry.getToolsByDomain('analysis.video')
```

### Выполнение инструментов
```typescript
import { ExecutionEngine } from '@/domains/ai-tools/base'

const engine = ExecutionEngine.getInstance()
const result = await engine.execute('CreateProjectTool', {
  projectSettings: { name: 'New Project', fps: 30 }
})
```

## 🔧 Интеграция с другими доменами

### AI Services
```typescript
// Интеграция с domains/ai-services
import { getAIContainer } from '@/domains/ai-core'
import { WhisperService } from '@/domains/ai-services'
```

### Content Intelligence
```typescript
// Интеграция с domains/content-intelligence (будущее)
import { ContentAnalysisEngine } from '@/domains/content-intelligence'
```

## 📋 Миграция из features/ai-chat/tools

### Этапы миграции
1. **Базовая структура** - создание домена и базовых классов
2. **Core Tools** - миграция основных инструментов
3. **Analysis Tools** - миграция инструментов анализа
4. **Automation & Integration** - миграция остальных инструментов

### Обновление импортов
```typescript
// До миграции
import { CreateProjectTool } from '@/features/ai-chat/tools/core/timeline'

// После миграции
import { CreateProjectTool } from '@/domains/ai-tools/core/timeline'
```

## 🎯 Преимущества

### ✅ Организация
- Логическая группировка по функциональности
- Четкое разделение ответственности
- Интуитивная навигация

### ⚡ Производительность
- Lazy loading по доменам
- Меньший размер bundle
- Быстрая загрузка нужных инструментов

### 🛠️ Разработка
- Простое добавление новых инструментов
- Изолированное тестирование доменов
- Упрощенный рефакторинг

### 📦 Масштабируемость
- Независимое развитие каждого домена
- Возможность вынесения доменов в отдельные пакеты
- Гибкая архитектура для будущих расширений

## API (Backend Commands)

### MCP (Model Context Protocol) Commands

| Command | Parameters | Description |
|---------|------------|-------------|
| `mcp_initialize` | `{ config: MCPConfig }` | Инициализация MCP сервера |
| `mcp_execute_tool` | `{ toolName: string, parameters: any }` | Выполнение MCP инструмента |

**Note**: AI Tools домен в основном работает с фронтенд логикой и не использует прямые Tauri команды. Вместо этого инструменты вызывают команды из других доменов (`@/domains/ai-services`, `@/domains/media-management`, и т.д.).

## Behavior (from tests) / Поведение (из тестов)

### container.test.ts
- ✓ AIToolsContainer возвращает единственный экземпляр (Singleton)
- ✓ Предоставляет ToolRegistry для управления инструментами
- ✓ Предоставляет ExecutionEngine для выполнения инструментов
- ✓ Поддерживает конфигурацию (enableLogging, maxConcurrentExecutions)
- ✓ Управление жизненным циклом (initialize, shutdown)
- ✓ Позволяет регистрировать произвольные сервисы
- ✓ Отслеживает статистику выполнения
- ✓ Предоставляет утилиты для Development/Production/Testing режимов

### base-ai-tool.test.ts
- ✓ Базовый класс для всех AI инструментов
- ✓ Валидация входных параметров
- ✓ Обработка ошибок с retry механизмом
- ✓ Таймауты выполнения
- ✓ Логирование операций
- ✓ Метрики производительности

### tool-registry.test.ts
- ✓ Регистрация инструментов по доменам
- ✓ Поиск инструментов по имени/категории
- ✓ Lazy loading инструментов
- ✓ Валидация зарегистрированных инструментов
- ✓ Получение списка всех инструментов
- ✓ Проверка существования инструментов

### execution-engine.test.ts
- ✓ Управление жизненным циклом инструментов
- ✓ Параллельное выполнение с ограничением concurrency
- ✓ Управление ресурсами и очередью задач
- ✓ Мониторинг производительности
- ✓ Обработка ошибок и retry логика
- ✓ Отмена выполнения задач

### search-files.test.ts (Browser Tools)
- ✓ Поиск медиа файлов по имени
- ✓ Фильтрация по типу файла (video, audio, image)
- ✓ Поддержка regex поиска
- ✓ Возврат результатов в структурированном формате

### apply-plan-to-timeline.test.ts (Montage Planning)
- ✓ Применение плана монтажа к таймлайну
- ✓ Создание клипов из фрагментов
- ✓ Применение переходов и эффектов
- ✓ Валидация плана перед применением

## Dependencies / Зависимости

### Depends on:
- `@/domains/ai-services` - AI сервисы для анализа и обработки
- `@/domains/media-management` - Управление медиафайлами
- `@/lib/tauri-logger` - Логирование операций

### Used by:
- `@/features/ai-chat` - AI чат использует инструменты для выполнения команд
- `@/features/ai-director` - AI режиссер использует инструменты для автомонтажа
- LLM Integration - Предоставляет инструменты для Claude/GPT моделей

---

**Статус**: 🚧 **В РАЗРАБОТКЕ** - Phase 4.1: AI Tools Domain Migration

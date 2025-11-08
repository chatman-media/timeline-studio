# Миграция AI инструментов на бэкенд

## Обзор

Документ описывает завершенную миграцию AI инструментов с фронтенда на бэкенд (Tauri/Rust) для создания унифицированной архитектуры работы с множественными AI провайдерами.

**Статус:** ✅ **Phase 1-2 ЗАВЕРШЕНЫ** (Multi-provider + Tools support реализованы)

**Дата начала:** 2025-11-08
**Последнее обновление:** 2025-11-08

---

## Выполненная работа

### ✅ Phase 1: Multi-Provider Infrastructure (ЗАВЕРШЕНО)

#### 1. AI Provider Manager

**Местоположение:** `src-tauri/src/video_compiler/commands/ai_api_proxy/`

**Реализованные компоненты:**

**types.rs** - Унифицированные типы (399 строк)
- `AIProvider` enum - Claude, OpenAI, DeepSeek, Ollama
- `UnifiedAIRequest` - единый формат запроса
- `UnifiedAIResponse` - единый формат ответа
- `AITool`, `AIToolCall`, `ToolChoice` - 🆕 Tools support
- `ProviderConfig`, `ProviderStatus` - конфигурация
- `ValidateApiKeyRequest/Response` - валидация
- Конверсии между форматами (Claude ↔ OpenAI ↔ AIMessage)

**provider_manager.rs** - Основной менеджер (687 строк)
- `AIProviderManager` struct с HTTP client
- `send_request()` - отправка к любому провайдеру
- `send_request_with_fallback()` - автоматический fallback
- `validate_provider()` - проверка API ключей
- 🆕 **Tools/Function Calling** для Claude, OpenAI, DeepSeek:
  - Claude: Tool Use API (lines 122-230)
  - OpenAI: Function Calling API (lines 284-407)
  - DeepSeek: OpenAI-compatible (lines 461-584)
  - Ollama: базовая поддержка без tools (lines 612-676)

**unified_commands.rs** - Tauri команды (171 строк)
- `ai_send_unified_request` - базовый запрос
- `ai_send_request_with_fallback` - с fallback
- `ai_send_request_with_tools` - 🆕 запрос с инструментами
- `ai_validate_provider` - валидация
- `ai_get_provider_models` - список моделей
- `ai_get_supported_providers` - доступные провайдеры
- `ai_check_providers_health` - health check

#### 2. AI Director Integration

**Местоположение:** `src-tauri/src/analysis/services/ai_director.rs`

**Изменения:**
- Добавлено поле `ai_manager: Arc<AIProviderManager>`
- Новый метод `get_ai_manager()` для доступа к менеджеру
- Расширен `AIDirectorConfig` с AI полями:
  ```rust
  pub ai_provider: Option<AIProvider>
  pub ai_model: Option<String>
  pub enable_ai_enhanced_analysis: bool
  pub enable_ai_descriptions: bool
  pub enable_ai_mood_analysis: bool
  ```

#### 3. Script Generator

**Местоположение:** `src-tauri/src/analysis/services/script_generator.rs`

**Реализовано:**
- `ScriptGenerator` struct (530+ строк)
- Генерация полных сценариев из анализа видео
- Поддержка жанров (documentary, tutorial, vlog, promotional)
- Поддержка стилей (professional, casual, engaging, minimal)
- Генерация диалогов и закадрового текста
- Временные метки для сцен

**Tauri команды** (`script_generation_commands.rs`):
- `generate_video_script` - полный сценарий
- `generate_script_dialogue` - только диалоги
- `generate_script_voiceover` - только закадровый текст
- `get_default_script_config` - конфигурация по умолчанию

#### 4. AI Metadata Generator

**Местоположение:** `src-tauri/src/video_compiler/commands/platform_optimization/`

**ai_metadata_types.rs** (265+ строк):
- `PlatformMetadata` - метаданные для платформ
- `MetadataGenerationConfig` - конфигурация
- `ContentTone` enum - тон контента
- `PlatformConstraints` - ограничения платформ
  - YouTube: max_title=100, max_description=5000, supports_seo=true
  - Instagram: max_hashtags=30, no separate title
  - TikTok: max_description=2200, trending hashtags
  - Facebook: max_description=63206
  - Twitter: max_description=280

**ai_metadata_generator.rs** (618+ строк):
- `AIMetadataGenerator` struct
- Генерация SEO-оптимизированных метаданных
- Учет ограничений платформ
- Адаптация стиля и тона под платформу

**Tauri команды** (`ai_metadata_commands.rs`):
- `generate_platform_metadata` - для одной платформы
- `generate_multi_platform_metadata` - для нескольких
- `validate_platform_metadata` - валидация
- `get_platform_constraints` - получить ограничения
- `get_default_metadata_config` - конфигурация

#### 5. Specta Export

**Обновлено:** `src-tauri/src/specta_export.rs`

**Экспортированные типы:**
- `AIProvider`, `AIMessage`, `AITool`, `AIToolCall`, `ToolChoice`
- `UnifiedAIRequest`, `UnifiedAIResponse`
- `ProviderConfig`, `ProviderStatus`, `TokenUsage`

**Экспортированные команды:**
- 7 unified AI команд
- 4 script generation команды
- 5 metadata generation команд

---

## Архитектура

### Компоненты

```
┌─────────────────────────────────────────────────────────────┐
│                      ФРОНТЕНД (TypeScript)                   │
├─────────────────────────────────────────────────────────────┤
│  AI Tools (src/domains/ai-tools/tools/core/)                │
│  ├── Browser Tools (analyze-browser, file-operations...)    │
│  ├── Player Tools (analyze-media, playback-control...)      │
│  ├── Timeline Tools (create-project, manage-clips...)       │
│  └── Resources Tools (analyze-resources, suggest...)        │
│                                                             │
│  TypeScript типы автогенерированы через Specta ✅            │
└─────────────────────────────────────────────────────────────┘
                              ▼
                   ═══════════════════════
                   ║   Tauri IPC Bridge  ║
                   ═══════════════════════
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      БЭКЕНД (Rust) ✅                       │
├─────────────────────────────────────────────────────────────┤
│  1. ✅ AI Provider Manager                                  │
│     ├── Claude Integration (Tool Use API)                  │
│     ├── OpenAI Integration (Function Calling)              │
│     ├── DeepSeek Integration (OpenAI-compatible)           │
│     ├── Ollama Integration (basic)                         │
│     └── Automatic fallback logic                           │
│                                                             │
│  2. ✅ Tools/Function Calling Support                       │
│     ├── AITool definition (name, description, schema)      │
│     ├── AIToolCall parsing from responses                  │
│     ├── ToolChoice strategy (Auto, Required, Tool, None)   │
│     └── Cross-provider tool format conversion              │
│                                                             │
│  3. ✅ AI Director (with AI integration)                    │
│     ├── AIProviderManager integration                       │
│     ├── Scene Engine                                        │
│     ├── Moment Engine                                       │
│     └── Content Engine                                      │
│                                                             │
│  4. ✅ Script Generator                                     │
│     ├── Full script generation                              │
│     ├── Dialogue generation                                 │
│     └── Voiceover generation                                │
│                                                             │
│  5. ✅ AI Metadata Generator                                │
│     ├── YouTube optimization (SEO, tags)                    │
│     ├── Instagram/TikTok optimization (hashtags)            │
│     └── Multi-platform batch generation                     │
└─────────────────────────────────────────────────────────────┘
```

---

## API Reference

### Основные типы

```typescript
// AI провайдеры
type AIProvider = 'claude' | 'openai' | 'deepseek' | 'ollama'

// Сообщение
interface AIMessage {
  role: string
  content: string
}

// Определение инструмента
interface AITool {
  name: string
  description: string
  inputSchema: object // JSON Schema
}

// Вызов инструмента AI
interface AIToolCall {
  id: string
  name: string
  input: object // Параметры вызова
}

// Стратегия выбора инструментов
type ToolChoice =
  | { auto: null }           // AI решает сам
  | { required: null }       // Обязательно использовать
  | { tool: { name: string } } // Конкретный инструмент
  | { none: null }           // Не использовать

// Унифицированный запрос
interface UnifiedAIRequest {
  provider: AIProvider
  model: string
  messages: AIMessage[]
  maxTokens?: number
  temperature?: number
  stream?: boolean
  system?: string
  tools?: AITool[]         // 🆕 Инструменты
  toolChoice?: ToolChoice  // 🆕 Стратегия выбора
}

// Унифицированный ответ
interface UnifiedAIResponse {
  id: string
  provider: AIProvider
  model: string
  content: string
  usage?: {
    inputTokens: number
    outputTokens: number
    totalTokens: number
  }
  finishReason?: string
  toolCalls?: AIToolCall[]  // 🆕 Вызовы инструментов
}
```

### Tauri команды

#### 1. Базовые команды

```typescript
// Отправить запрос к провайдеру
invoke('ai_send_unified_request', {
  apiKey: string,
  request: UnifiedAIRequest
}): Promise<UnifiedAIResponse>

// С автоматическим fallback
invoke('ai_send_request_with_fallback', {
  providersWithKeys: [AIProvider, string][],
  request: UnifiedAIRequest
}): Promise<UnifiedAIResponse>

// С инструментами (упрощенный API)
invoke('ai_send_request_with_tools', {
  apiKey: string,
  provider: AIProvider,
  model: string,
  messages: AIMessage[],
  tools: AITool[],
  toolChoice?: ToolChoice,
  system?: string,
  maxTokens?: number,
  temperature?: number
}): Promise<UnifiedAIResponse>
```

#### 2. Управление провайдерами

```typescript
// Валидация API ключа
invoke('ai_validate_provider', {
  provider: AIProvider,
  apiKey: string
}): Promise<ProviderStatus>

// Получить модели провайдера
invoke('ai_get_provider_models', {
  provider: AIProvider
}): Promise<string[]>

// Получить список провайдеров
invoke('ai_get_supported_providers'): Promise<AIProvider[]>

// Проверка здоровья провайдеров
invoke('ai_check_providers_health', {
  providersWithKeys: [AIProvider, string | null][]
}): Promise<ProviderStatus[]>
```

#### 3. Script Generation

```typescript
// Генерация полного сценария
invoke('generate_video_script', {
  apiKey: string,
  analysisPath: string,
  config: ScriptGenerationConfig
}): Promise<GeneratedScript>

// Генерация диалогов
invoke('generate_script_dialogue', {
  apiKey: string,
  analysisPath: string,
  config: ScriptGenerationConfig
}): Promise<GeneratedScript>

// Генерация закадрового текста
invoke('generate_script_voiceover', {
  apiKey: string,
  analysisPath: string,
  config: ScriptGenerationConfig
}): Promise<GeneratedScript>

// Конфигурация по умолчанию
invoke('get_default_script_config'): Promise<ScriptGenerationConfig>
```

#### 4. Metadata Generation

```typescript
// Генерация для одной платформы
invoke('generate_platform_metadata', {
  apiKey: string,
  provider: AIProvider,
  model: string,
  analysisPath: string,
  config: MetadataGenerationConfig
}): Promise<PlatformMetadata>

// Для нескольких платформ
invoke('generate_multi_platform_metadata', {
  apiKey: string,
  provider: AIProvider,
  model: string,
  analysisPath: string,
  platforms: PlatformType[],
  baseConfig: MetadataGenerationConfig
}): Promise<MultiPlatformMetadata>

// Валидация метаданных
invoke('validate_platform_metadata', {
  metadata: PlatformMetadata
}): Promise<MetadataValidationResult>

// Получить ограничения платформы
invoke('get_platform_constraints', {
  platform: PlatformType
}): Promise<PlatformConstraints>
```

---

## Примеры использования

### 1. Простой AI запрос

```typescript
import { invoke } from '@tauri-apps/api/core'

const response = await invoke('ai_send_unified_request', {
  apiKey: process.env.CLAUDE_API_KEY,
  request: {
    provider: 'claude',
    model: 'claude-3-5-sonnet-20241022',
    messages: [
      { role: 'user', content: 'Проанализируй этот таймлайн' }
    ],
    maxTokens: 1024,
    temperature: 0.7,
    system: 'Ты эксперт по видеомонтажу',
  }
})

console.log(response.content)
console.log(`Tokens: ${response.usage?.totalTokens}`)
```

### 2. Запрос с Tools (Function Calling)

```typescript
const tools: AITool[] = [
  {
    name: 'create_timeline_project',
    description: 'Create a new timeline project',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Project name' },
        trackCount: { type: 'number', description: 'Number of tracks' },
        duration: { type: 'number', description: 'Duration in seconds' },
      },
      required: ['name', 'trackCount'],
    }
  }
]

const response = await invoke('ai_send_request_with_tools', {
  apiKey: process.env.OPENAI_API_KEY,
  provider: 'openai',
  model: 'gpt-4-turbo-preview',
  messages: [
    { role: 'user', content: 'Создай новый проект с 3 треками' }
  ],
  tools,
  toolChoice: { auto: null },
  system: 'Ты помощник для видеомонтажа',
})

// Проверка вызовов инструментов
if (response.toolCalls) {
  for (const call of response.toolCalls) {
    console.log(`Tool: ${call.name}`)
    console.log(`Input:`, call.input)

    // Выполнить инструмент локально
    const result = await executeToolLocally(call.name, call.input)
  }
}
```

### 3. Fallback между провайдерами

```typescript
const response = await invoke('ai_send_request_with_fallback', {
  providersWithKeys: [
    ['claude', process.env.CLAUDE_API_KEY],
    ['openai', process.env.OPENAI_API_KEY],
    ['deepseek', process.env.DEEPSEEK_API_KEY],
  ],
  request: {
    provider: 'claude', // будет переопределен
    model: '', // автоматически выбрана модель
    messages: [{ role: 'user', content: 'Привет!' }],
  }
})

console.log(`Used provider: ${response.provider}`)
```

### 4. Генерация сценария

```typescript
const config = await invoke('get_default_script_config')

const script = await invoke('generate_video_script', {
  apiKey: process.env.CLAUDE_API_KEY,
  analysisPath: '/path/to/unified_analysis.json',
  config: {
    ...config,
    provider: 'claude',
    model: 'claude-3-5-sonnet-20241022',
    genre: 'documentary',
    style: 'engaging',
    targetLength: 300,
    language: 'ru',
  }
})

console.log(`Title: ${script.title}`)
for (const scene of script.scenes) {
  console.log(`Scene ${scene.sceneNumber}: ${scene.title}`)
  console.log(`Narration: ${scene.narration}`)
}
```

### 5. Генерация метаданных для платформ

```typescript
const metadata = await invoke('generate_platform_metadata', {
  apiKey: process.env.OPENAI_API_KEY,
  provider: 'openai',
  model: 'gpt-4-turbo-preview',
  analysisPath: '/path/to/analysis.json',
  config: {
    platform: 'YouTube',
    language: 'ru',
    tone: 'professional',
    topics: ['монтаж', 'обучение'],
    targetAudience: 'начинающие монтажеры',
    includeCta: true,
  }
})

console.log(`Title: ${metadata.title}`)
console.log(`Tags: ${metadata.tags.join(', ')}`)
console.log(`Hashtags: ${metadata.hashtags.join(' ')}`)
```

### 6. Мультиплатформенная генерация

```typescript
const multiPlatform = await invoke('generate_multi_platform_metadata', {
  apiKey: process.env.OPENAI_API_KEY,
  provider: 'openai',
  model: 'gpt-4-turbo-preview',
  analysisPath: '/path/to/analysis.json',
  platforms: ['YouTube', 'Instagram', 'TikTok'],
  baseConfig: {
    language: 'ru',
    tone: 'casual',
    topics: ['travel', 'vlog'],
  }
})

for (const metadata of multiPlatform.platforms) {
  console.log(`\n=== ${metadata.platform} ===`)
  console.log(`Title: ${metadata.title}`)
  console.log(`Hashtags: ${metadata.hashtags.join(' ')}`)
}
```

---

## Tools/Function Calling - Детали реализации

### Claude Tool Use API

**Формат запроса:**
```json
{
  "tools": [
    {
      "name": "analyze_timeline",
      "description": "Analyze video timeline structure",
      "input_schema": { /* JSON Schema */ }
    }
  ],
  "tool_choice": { "type": "auto" }
}
```

**Формат ответа:**
```json
{
  "content": [
    { "type": "text", "text": "..." },
    {
      "type": "tool_use",
      "id": "toolu_123",
      "name": "analyze_timeline",
      "input": { /* parameters */ }
    }
  ]
}
```

### OpenAI Function Calling

**Формат запроса:**
```json
{
  "tools": [
    {
      "type": "function",
      "function": {
        "name": "analyze_timeline",
        "description": "Analyze video timeline",
        "parameters": { /* JSON Schema */ }
      }
    }
  ],
  "tool_choice": "auto"
}
```

**Формат ответа:**
```json
{
  "choices": [{
    "message": {
      "tool_calls": [{
        "id": "call_123",
        "function": {
          "name": "analyze_timeline",
          "arguments": "{...}"
        }
      }]
    }
  }]
}
```

### Конверсия форматов

AIProviderManager автоматически конвертирует форматы:

```rust
// Ваш код использует унифицированный AITool
let tool = AITool {
  name: "analyze_timeline".to_string(),
  description: "Analyze video timeline".to_string(),
  input_schema: json!({ /* schema */ }),
};

// Для Claude → конвертируется в Tool Use формат
// Для OpenAI → конвертируется в Function формат
// Ответы парсятся обратно в AIToolCall
```

---

## Производительность и ограничения

### Поддержка провайдеров

| Провайдер | Tools | Fallback | Streaming | Примечания |
|-----------|-------|----------|-----------|------------|
| Claude    | ✅    | ✅       | ⏳        | Tool Use API, полная поддержка |
| OpenAI    | ✅    | ✅       | ⏳        | Function Calling, полная поддержка |
| DeepSeek  | ✅    | ✅       | ⏳        | OpenAI-compatible API |
| Ollama    | ❌    | ✅       | ⏳        | Локальный, пока без tools |

### Ограничения
- **Tools**: Ollama пока не поддерживает инструменты
- **Streaming**: Реализация запланирована в следующей итерации
- **Батчинг**: Пока только последовательные запросы
- **Timeout**: 120 секунд по умолчанию

---

## Следующие шаги

### Краткосрочные (1-2 недели)
- [ ] Streaming поддержка для всех провайдеров
- [ ] Миграция AI Chat на использование бэкенда
- [ ] Кэширование AI ответов в SQLite
- [ ] Rate limiting и retry с exponential backoff

### Среднесрочные (1-2 месяца)
- [ ] Батчинг запросов для оптимизации
- [ ] Ollama tools support (когда появится в upstream)
- [ ] Мониторинг и аналитика использования AI
- [ ] Cost tracking для каждого провайдера

### Долгосрочные (3+ месяца)
- [ ] Локальные модели через ONNX Runtime
- [ ] Fine-tuning моделей для специфичных задач
- [ ] Multi-modal support (изображения, аудио в запросах)
- [ ] AI agents с multi-step reasoning

---

## Migration Path для фронтенда

### Этап 1: ✅ Подготовка (ЗАВЕРШЕНО)
- ✅ Бэкенд готов к использованию
- ✅ TypeScript типы сгенерированы через Specta
- ✅ Tauri команды экспортированы
- ⏳ Фронтенд инструменты пока в `/src/domains/ai-tools/tools/core/`

### Этап 2: Интеграция (в процессе)

**Конвертация инструментов:**
```typescript
import type { BaseAITool } from '@/domains/ai-tools/tools/core/base-ai-tool'
import type { AITool } from '@/bindings' // сгенерировано Specta

function convertToAITool(tool: BaseAITool): AITool {
  const schema = tool.getSchema()
  return {
    name: tool.metadata.name,
    description: tool.metadata.description,
    inputSchema: schema.input,
  }
}

const tools = [
  convertToAITool(new AnalyzeTimelineTool()),
  convertToAITool(new ManageClipsTool()),
]
```

**Обработка вызовов:**
```typescript
async function handleAIChat(userMessage: string) {
  const messages = [{ role: 'user', content: userMessage }]

  while (true) {
    const response = await invoke('ai_send_request_with_tools', {
      apiKey: getApiKey('claude'),
      provider: 'claude',
      model: 'claude-3-5-sonnet-20241022',
      messages,
      tools: getAvailableTools(),
    })

    if (!response.toolCalls) {
      return response.content // финальный ответ
    }

    // Выполнить инструменты локально
    const results = await Promise.all(
      response.toolCalls.map(call =>
        executeToolLocally(call.name, call.input)
      )
    )

    // Добавить результаты в контекст
    messages.push(...formatToolResults(results))
  }
}
```

---

## Тестирование

### Юнит-тесты (Rust)
```bash
# AI Provider Manager
cargo test provider_manager

# Script Generator
cargo test script_generator

# Metadata Generator
cargo test ai_metadata
```

### Интеграционные тесты
```bash
# Требуют API ключи
export CLAUDE_API_KEY=...
export OPENAI_API_KEY=...
cargo test --features integration-tests
```

---

## Заключение

**Основные достижения:**

✅ **Multi-Provider Support** - 4 AI провайдера с единым интерфейсом

✅ **Tools/Function Calling** - Полная поддержка для Claude, OpenAI, DeepSeek

✅ **Automatic Fallback** - Переключение между провайдерами при ошибках

✅ **Script Generator** - AI-генерация сценариев из видео анализа

✅ **Metadata Generator** - SEO-оптимизация для 5+ платформ

✅ **Type-Safe API** - TypeScript типы через Specta

✅ **AI Director Integration** - Использование AI в анализе видео

**Следующий фокус:**
1. Интеграция AI Chat с новым бэкендом
2. Реализация streaming для real-time ответов
3. Кэширование результатов в SQLite

---

*Документ обновлен: 2025-11-08*
*Авторы: Claude Code*

# Миграция AI инструментов на бэкенд

## Обзор

Документ описывает завершенную миграцию AI инструментов с фронтенда на бэкенд (Tauri/Rust) для создания унифицированной архитектуры работы с множественными AI провайдерами.

**Статус:** ✅ **Phase 1-2 ЗАВЕРШЕНЫ** (Multi-provider + Tools support реализованы)

**Дата начала:** 2025-11-08
**Последнее обновление:** 2025-11-17

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

#### 6. AI Chat Integration

**Местоположение:** `src-tauri/src/state/commands/handler.rs`

**Реализовано:**
- ✅ Интеграция AIProviderManager в CommandHandler (lines 28-47)
- ✅ Интеграция SecureStorage для безопасного хранения API ключей
- ✅ Метод `get_api_key_for_provider()` для получения ключей из user settings
- ✅ Переписан `send_chat_message()` на использование AIProviderManager вместо старого API
- ✅ Поддержка всех провайдеров: Claude, OpenAI, DeepSeek, Ollama
- ✅ Использование `UnifiedAIRequest/UnifiedAIResponse` для всех запросов

**Изменения:**

1. **CommandHandler struct** - добавлены поля:
   ```rust
   ai_manager: Arc<AIProviderManager>,
   secure_storage: Arc<tokio::sync::Mutex<SecureStorage>>,
   ```

2. **StateManager::new()** - инициализация AI сервисов:
   ```rust
   let ai_manager = Arc::new(AIProviderManager::new());
   let secure_storage = Arc::new(tokio::sync::Mutex::new(
     SecureStorage::new(app_handle.clone())?
   ));
   ```

3. **get_api_key_for_provider()** - получение API ключей:
   ```rust
   async fn get_api_key_for_provider(&self, provider: &str) -> Result<String, String>
   ```
   - Конвертирует название провайдера в `ApiKeyType`
   - Получает ключ из `SecureStorage` (AES-256-GCM шифрование)
   - Возвращает понятные ошибки при отсутствии ключа

4. **send_chat_message()** - полностью переписан:
   ```rust
   async fn send_chat_message(
     &self,
     session_id: String,
     message: String,
     model: String,
     provider: String,
     project_context: Option<serde_json::Value>,
   ) -> CommandResult
   ```
   - Получает API ключ из user settings через `get_api_key_for_provider()`
   - Парсит provider enum (case-insensitive)
   - Создает `UnifiedAIRequest` с сообщениями и контекстом
   - Отправляет запрос через `AIProviderManager::send_request()`
   - Возвращает унифицированный ответ с usage metrics

**Статус:** ✅ AI Chat полностью мигрирован на backend (2025-11-17)

5. **send_streaming_chat_message()** - добавлена поддержка streaming:
   ```rust
   async fn send_streaming_chat_message(
     &self,
     session_id: String,
     message: String,
     model: String,
     provider: String,
     project_context: Option<serde_json::Value>,
   ) -> CommandResult
   ```
   - Получает API ключ из SecureStorage
   - Создает `UnifiedAIRequest` с `stream: Some(true)`
   - Генерирует уникальный `request_id` через uuid
   - Отправляет запрос через `AIProviderManager::send_request_stream()`
   - События автоматически публикуются через Tauri Event System:
     - `ai-stream-started` - начало streaming
     - `ai-stream-chunk` - каждый chunk текста
     - `ai-stream-completed` - завершение с полным текстом
     - `ai-stream-error` - ошибка при streaming

**Streaming Architecture:**
- Backend использует `futures::StreamExt` для обработки HTTP stream
- Каждый chunk парсится (SSE format для Claude/OpenAI)
- События отправляются в frontend через Tauri Event System
- Frontend подписывается на события через `listen()`

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

### 7. Streaming AI Chat (Real-time)

```typescript
import { listen } from '@tauri-apps/api/event'

// Подписка на streaming события
const unlistenStarted = await listen('ai-stream-started', (event) => {
  console.log('Stream started:', event.payload)
})

const unlistenChunk = await listen('ai-stream-chunk', (event) => {
  const { request_id, chunk, accumulated_text } = event.payload
  // Обновить UI с новым chunk текста
  updateChatMessage(request_id, accumulated_text)
})

const unlistenCompleted = await listen('ai-stream-completed', (event) => {
  const { request_id, full_text, usage } = event.payload
  console.log('Stream completed:', full_text)
  console.log('Token usage:', usage)
  // Финализировать сообщение
  finalizeChatMessage(request_id, full_text)
})

const unlistenError = await listen('ai-stream-error', (event) => {
  const { request_id, error } = event.payload
  console.error('Stream error:', error)
  showErrorMessage(error)
})

// Запустить streaming запрос
try {
  const response = await invoke('send_streaming_chat_message', {
    sessionId: 'session-123',
    message: 'Объясни мне что такое timeline в видеомонтаже',
    model: 'claude-3-5-sonnet-20241022',
    provider: 'claude',
    projectContext: null,
  })

  console.log('Streaming started:', response)
  // response содержит request_id для отслеживания событий
} catch (error) {
  console.error('Failed to start streaming:', error)
}

// Не забудьте отписаться когда компонент размонтируется
onCleanup(() => {
  unlistenStarted()
  unlistenChunk()
  unlistenCompleted()
  unlistenError()
})
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
| Claude    | ✅    | ✅       | ✅        | Tool Use API, полная поддержка streaming |
| OpenAI    | ✅    | ✅       | ✅        | Function Calling, полная поддержка streaming |
| DeepSeek  | ✅    | ✅       | ✅        | OpenAI-compatible API, streaming поддержан |
| Ollama    | ✅    | ✅       | ✅        | Локальный, function calling с v0.1.26+, полная поддержка |

### Ограничения
- **Батчинг**: Пока только последовательные запросы
- **Timeout**: 120 секунд по умолчанию для обычных запросов, streaming без timeout
- **Ollama Token Usage**: Ollama не предоставляет детальную статистику использования токенов

---

## Рекомендуемые локальные модели с Function Calling

### 🔥 Llama 3.x (Meta)
**Модели:** `llama3.1:8b`, `llama3.1:70b`, `llama3.2:3b`, `llama3.3:70b`
- Официальная поддержка function calling от Meta
- Отличное качество для всех размеров
- Llama 3.3:70b - лучшая производительность
- Рекомендуется для production

**Установка:**
```bash
ollama pull llama3.3:70b
```

### 🎯 Специализированные модели

**Firefunction V2** - `firefunction-v2:70b`
- Специально обучена для function calling
- Самая точная в выборе инструментов
- Отличная для complex multi-tool scenarios

**Hermes 2 Pro** - `hermes-2-pro:7b`, `hermes-2-pro:13b`
- Основана на Llama, улучшенная для function calling
- Хороший баланс скорости и качества
- Поддержка сложных инструкций

**Functionary 3** - `functionary:7b`, `functionary:13b`
- Одна из первых специализированных моделей
- Надежная для стандартных сценариев
- Быстрая работа

### 🌪️ Mistral
**Модели:** `mistral:7b-instruct-v0.3`, `mistral-nemo:12b`
- Встроенная поддержка function calling
- Хорошее качество на русском языке
- Быстрая работа

### Сравнение производительности

| Модель | Размер | Function Calling | Скорость | Качество | RAM |
|--------|--------|------------------|----------|----------|-----|
| Llama 3.3:70b | 70B | ✅ Отлично | Медленная | ⭐⭐⭐⭐⭐ | ~64GB |
| Llama 3.1:8b | 8B | ✅ Хорошо | Быстрая | ⭐⭐⭐⭐ | ~8GB |
| Llama 3.2:3b | 3B | ✅ Средне | Очень быстрая | ⭐⭐⭐ | ~4GB |
| Firefunction V2 | 70B | ✅ Отлично | Медленная | ⭐⭐⭐⭐⭐ | ~64GB |
| Hermes 2 Pro | 7B | ✅ Хорошо | Быстрая | ⭐⭐⭐⭐ | ~8GB |
| Mistral | 7B | ✅ Хорошо | Быстрая | ⭐⭐⭐⭐ | ~8GB |

### Docker Setup для Llama 3.3:70b

```bash
# Запуск Ollama в Docker
docker run -d --gpus=all \
  -v ollama:/root/.ollama \
  -p 11434:11434 \
  --name ollama \
  ollama/ollama

# Загрузка модели
docker exec -it ollama ollama pull llama3.3:70b

# Проверка
curl http://localhost:11434/api/tags
```

### Пример использования с Function Calling

```typescript
import { invoke } from '@tauri-apps/api/core'

const tools = [
  {
    name: 'analyze_video',
    description: 'Analyze video content and extract metadata',
    inputSchema: {
      type: 'object',
      properties: {
        video_path: { type: 'string', description: 'Path to video file' },
        analyze_audio: { type: 'boolean', description: 'Include audio analysis' },
      },
      required: ['video_path'],
    }
  }
]

const response = await invoke('ai_send_request_with_tools', {
  apiKey: 'local', // Для Ollama не нужен реальный ключ
  provider: 'ollama',
  model: 'llama3.3:70b',
  messages: [
    { role: 'user', content: 'Проанализируй видео project.mp4 со звуком' }
  ],
  tools,
  toolChoice: { auto: null },
})

// Обработка tool_calls
if (response.toolCalls) {
  for (const call of response.toolCalls) {
    console.log(`Вызов: ${call.name}`)
    console.log(`Параметры:`, call.input)
    // { video_path: "project.mp4", analyze_audio: true }
  }
}
```

---

## Следующие шаги

### Краткосрочные (1-2 недели)
- [x] **✅ Streaming поддержка для всех провайдеров** (завершено 2025-11-17)
  - Реализован send_streaming_chat_message() через AIProviderManager
  - Поддержка Claude, OpenAI, DeepSeek, Ollama
  - Tauri Event System для real-time событий
- [x] **✅ Миграция AI Chat на использование бэкенда** (завершено 2025-11-17)
  - Интегрирован AIProviderManager в CommandHandler
  - Добавлено получение API ключей из SecureStorage
  - Переписан send_chat_message() с поддержкой всех провайдеров
  - Переписан send_streaming_chat_message() с поддержкой streaming
- [ ] Кэширование AI ответов в SQLite
- [ ] Rate limiting и retry с exponential backoff

### Среднесрочные (1-2 месяца)
- [ ] Батчинг запросов для оптимизации
- [x] **✅ Ollama tools support** (добавлено 2025-11-17)
  - Поддержка function calling для Ollama 0.1.26+
  - Работает с Llama 3.1, 3.2, 3.3, Mistral, Hermes, Firefunction
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

## 7. Vision Language Models - Multimodal AI Support 🎨

### Поддержка изображений в AI запросах

**Статус:** ✅ Полностью реализовано

Timeline Studio теперь поддерживает vision language models (VLM) для анализа видеофреймов с помощью AI.

### Архитектура

**1. Multimodal AIMessage**

Добавлена поддержка изображений в `AIMessage`:

```rust
// types.rs
pub enum AIMessageContent {
  Text(String),
  Multimodal(Vec<AIContentPart>),
}

pub enum AIContentPart {
  Text { text: String },
  Image { source: AIImageSource },
}

pub enum AIImageSource {
  Base64 { media_type: String, data: String },
  Url { url: String },
}
```

**2. Helper методы:**

```rust
// Простой текст
AIMessage::text("user", "Describe this scene")

// Текст + изображение
AIMessage::with_image_base64(
  "user",
  "What do you see in this frame?",
  base64_image_data,
  "image/jpeg"
)

// Текст + URL изображения
AIMessage::with_image_url(
  "user",
  "Analyze this image",
  "https://example.com/image.jpg"
)
```

**3. Автоматическая конвертация для Ollama:**

```rust
// From<AIMessage> for OllamaMessage
// Автоматически извлекает images из multimodal content
impl From<AIMessage> for OllamaMessage {
  fn from(msg: AIMessage) -> Self {
    match msg.content {
      AIMessageContent::Text(text) => OllamaMessage {
        role: msg.role,
        content: text,
        images: None,
      },
      AIMessageContent::Multimodal(parts) => {
        let mut text_parts = Vec::new();
        let mut image_data = Vec::new();

        for part in parts {
          match part {
            AIContentPart::Text { text } => text_parts.push(text),
            AIContentPart::Image { source } => {
              if let AIImageSource::Base64 { data, .. } = source {
                image_data.push(data);
              }
            }
          }
        }

        OllamaMessage {
          role: msg.role,
          content: text_parts.join("\n"),
          images: if image_data.is_empty() { None } else { Some(image_data) },
        }
      }
    }
  }
}
```

### VisionAnalyzer Service

**Возможности:**
- Извлечение ключевых фреймов из видео
- Анализ каждого фрейма с помощью vision model
- Генерация описаний сцен
- Определение объектов, настроения, типа сцены
- Автоматическая генерация общего summary
- Извлечение тем и паттернов

**Использование через Rust:**

```rust
use crate::analysis::services::vision_analyzer::{
  VisionAnalyzer, VisionAnalysisConfig
};

let config = VisionAnalysisConfig {
  provider: AIProvider::Ollama,
  model: "moondream2".to_string(),
  num_frames: 5,
  temperature: 0.7,
  max_tokens: 1024,
};

let analyzer = VisionAnalyzer::new(ai_manager);
let result = analyzer
  .analyze_video(&video_path, &api_key, config)
  .await?;

// Результат содержит:
// - result.frames: Vec<FrameAnalysis>
// - result.overall_summary: String
// - result.themes: Vec<String>
// - result.processing_time_ms: u64
```

### Tauri Commands

**1. analyze_video_with_vision_model**

Анализ видео с явным указанием API ключа:

```typescript
const result = await invoke('analyze_video_with_vision_model', {
  videoPath: '/path/to/video.mp4',
  provider: 'ollama',
  model: 'moondream2',
  apiKey: 'your-api-key', // или пустая строка для Ollama
  numFrames: 5,           // опционально, по умолчанию 5
  temperature: 0.7,       // опционально, по умолчанию 0.7
  maxTokens: 1024,        // опционально, по умолчанию 1024
})

// Результат:
interface VisionAnalysisResult {
  frames: FrameAnalysis[]
  overallSummary: string
  themes: string[]
  processingTimeMs: number
}

interface FrameAnalysis {
  timestamp: number
  description: string
  detectedObjects: string[]
  sceneType?: string
  mood?: string
}
```

**2. analyze_video_with_vision_model_secure**

Анализ с автоматическим получением API ключа из SecureStorage:

```typescript
const result = await invoke('analyze_video_with_vision_model_secure', {
  videoPath: '/path/to/video.mp4',
  provider: 'ollama',
  model: 'moondream2',
  numFrames: 5,
  temperature: 0.7,
  maxTokens: 1024,
})
// API ключ загружается автоматически из безопасного хранилища
```

### Поддерживаемые Vision Models

#### Ollama (локальные модели)

| Модель | Размер | Особенности |
|--------|--------|-------------|
| **moondream2** | 1.7B | Быстрый, компактный, хорош для базового анализа |
| **llama3.2-vision:11b** | 11B | Высокая точность, медленнее |
| **llama3.2-vision:90b** | 90B | Максимальная точность, требует много ресурсов |
| **llava** | 7B/13B | Хорошо для общих задач |

**Установка моделей:**

```bash
# Легкая модель для быстрого анализа
ollama pull moondream2

# Средняя модель с хорошим балансом
ollama pull llama3.2-vision:11b

# Большая модель для максимальной точности
ollama pull llama3.2-vision:90b
```

#### Claude, OpenAI, DeepSeek

Vision поддержка также работает с облачными провайдерами (требуется соответствующий API ключ).

### Примеры использования

**1. Анализ сцен в видеоролике**

```typescript
const analysis = await invoke('analyze_video_with_vision_model_secure', {
  videoPath: selectedClip.path,
  provider: 'ollama',
  model: 'moondream2',
  numFrames: 8,
})

console.log('Overall:', analysis.overallSummary)
console.log('Themes:', analysis.themes)

analysis.frames.forEach(frame => {
  console.log(`[${frame.timestamp}s]: ${frame.description}`)
  console.log('  Objects:', frame.detectedObjects)
  console.log('  Mood:', frame.mood)
})
```

**2. Автоматическая генерация описаний для видео**

```typescript
const description = await generateVideoDescription(videoPath)

async function generateVideoDescription(path: string) {
  const result = await invoke('analyze_video_with_vision_model_secure', {
    videoPath: path,
    provider: 'ollama',
    model: 'moondream2',
    numFrames: 5,
  })

  return result.overallSummary
}
```

**3. Поиск ключевых моментов**

```typescript
const analysis = await invoke('analyze_video_with_vision_model_secure', {
  videoPath: videoFile.path,
  provider: 'ollama',
  model: 'llama3.2-vision:11b',
  numFrames: 10,
})

// Найти моменты с действием
const actionFrames = analysis.frames.filter(f =>
  f.mood === 'energetic' || f.detectedObjects.includes('person')
)

// Экспортировать метаданные
const metadata = {
  title: analysis.overallSummary,
  tags: analysis.themes,
  keyMoments: actionFrames.map(f => f.timestamp),
}
```

### Производительность

**Типичное время обработки (5 фреймов):**

- **moondream2** (Ollama): ~10-15 секунд
- **llama3.2-vision:11b** (Ollama): ~30-45 секунд
- **llama3.2-vision:90b** (Ollama): ~2-3 минуты
- **Claude/GPT-4V** (API): ~5-10 секунд (зависит от сети)

**Оптимизация:**
- Используйте меньше фреймов (`numFrames: 3-5`) для быстрого анализа
- Для детального анализа используйте `numFrames: 10-15`
- Ollama модели работают полностью локально (приватность + скорость)

---

**Основные достижения:**

✅ **Multi-Provider Support** - 4 AI провайдера с единым интерфейсом

✅ **Tools/Function Calling** - Полная поддержка для Claude, OpenAI, DeepSeek, Ollama

✅ **Automatic Fallback** - Переключение между провайдерами при ошибках

✅ **Script Generator** - AI-генерация сценариев из видео анализа

✅ **Metadata Generator** - SEO-оптимизация для 5+ платформ

✅ **Type-Safe API** - TypeScript типы через Specta

✅ **AI Director Integration** - Использование AI в анализе видео

✅ **Vision Language Models** - Анализ видеофреймов с Moondream2, LLaVA, Claude, GPT-4V

✅ **Multimodal Support** - Поддержка текста + изображений в AI запросах

**Следующий фокус:**
1. ~~Интеграция AI Chat с новым бэкендом~~ ✅ Завершено
2. ~~Реализация streaming для real-time ответов~~ ✅ Завершено
3. ~~Vision Language Models для анализа фреймов~~ ✅ Завершено
4. Кэширование результатов в SQLite
5. Rate limiting и retry логика
6. Обновление фронтенда для использования streaming событий

---

*Документ обновлен: 2025-11-17*
*Авторы: Claude Code*

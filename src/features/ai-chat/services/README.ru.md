# AI Chat Services

**Русский** | [English](./README.md)

Основные сервисы для функциональности AI чата в Timeline Studio.

## Архитектура

Слой сервисов минимален в модуле AI Chat. Большая часть AI функциональности мигрирована в доменные сервисы:

- **AI Tools** → `/src/domains/ai-tools/tools/`
- **AI Services** → `/src/domains/ai-services/services/`
- **Shared Services** → `/src/shared/services/ai/`

## Доступные Сервисы

### `chat-provider.tsx`
React Context Provider для функциональности чата.

**Возможности:**
- Предоставляет контекст state machine чата
- Управляет чат-сессиями
- Обрабатывает отправку сообщений и потоковую передачу
- Обработка ошибок и восстановление

**Использование:**
```typescript
import { ChatProvider, useChat } from '@/features/ai-chat/services'

function App() {
  return (
    <ChatProvider>
      <ChatComponent />
    </ChatProvider>
  )
}

function ChatComponent() {
  const { messages, sendMessage } = useChat()
  // ... использовать функциональность чата
}
```

### `chat-storage-service.ts`
Сервис сохранения истории чата.

**Возможности:**
- Сохранение и загрузка чат-сессий
- Управление сессиями (создание, удаление, переименование)
- Сохранение истории сообщений
- Интеграция с локальным хранилищем

**API:**
```typescript
interface ChatStorageService {
  saveSession(session: ChatSession): Promise<void>
  loadSession(sessionId: string): Promise<ChatSession | null>
  loadAllSessions(): Promise<ChatSession[]>
  deleteSession(sessionId: string): Promise<void>
  clearAllSessions(): Promise<void>
}
```

**Использование:**
```typescript
import { ChatStorageService } from '@/features/ai-chat/services'

const storageService = new ChatStorageService()

// Сохранить сессию
await storageService.saveSession(session)

// Загрузить все сессии
const sessions = await storageService.loadAllSessions()

// Удалить сессию
await storageService.deleteSession(sessionId)
```

### `mcp-provider.tsx`
Провайдер интеграции Model Context Protocol (MCP).

**Возможности:**
- Управление подключением к MCP серверу
- Обнаружение и регистрация инструментов
- Контекстные подсказки инструментов
- Конвертация формата инструментов

**Использование:**
```typescript
import { MCPProvider, useMCP } from '@/features/ai-chat/services'

function App() {
  return (
    <MCPProvider>
      <ChatProvider>
        <AIChat />
      </ChatProvider>
    </MCPProvider>
  )
}

function ToolsPanel() {
  const { availableTools, callTool } = useMCP()
  // ... использовать MCP функциональность
}
```

### `index.ts`
Реэкспорт chat machine из доменных сервисов.

**Примечание:** Chat machine была мигрирована в `/src/domains/ai-services/machines/chat-machine.ts` для лучшей модульности.

**Экспорты:**
```typescript
export type {
  ChatListItem,
  ChatMachine,
  ChatMachineContext,
  ChatMachineEvent,
  ChatMessage,
} from "../../../domains/ai-services/machines/chat-machine"

export { chatMachine } from "../../../domains/ai-services/machines/chat-machine"
```

## Интеграция с Доменными Сервисами

### AI Services (`/src/domains/ai-services/services/`)

Для функциональности AI провайдеров используйте доменные сервисы:

```typescript
// Unified AI Service для AI операций
import { UnifiedAIService } from '@/domains/ai-services/services/unified-ai-service'

const aiService = UnifiedAIService.getInstance()
const response = await aiService.sendRequest(model, messages)
```

```typescript
// Whisper Service для транскрипции
import { WhisperService } from '@/domains/ai-services/services/whisper-service'

const whisperService = WhisperService.getInstance()
const transcription = await whisperService.transcribe(audioPath)
```

```typescript
// FFmpeg Analysis Service для анализа видео/аудио
import { FFmpegAnalysisService } from '@/domains/ai-services/services/media-analysis/ffmpeg-analysis-service'

const ffmpegService = FFmpegAnalysisService.getInstance()
const analysis = await ffmpegService.analyzeVideo(videoFile)
```

### AI Tools (`/src/domains/ai-tools/tools/`)

Для функциональности AI инструментов импортируйте из доменов:

```typescript
// Timeline инструменты
import { CreateProjectTool, DetectScenesTool } from '@/domains/ai-tools/tools/core/timeline'

// Инструменты анализа
import { VideoAnalysisTool, AudioAnalysisTool } from '@/domains/ai-tools/tools/analysis'

// Инструменты автоматизации
import { EnhancedSubtitleAutomationTool } from '@/domains/ai-tools/tools/automation'
```

### Shared Services (`/src/shared/services/ai/`)

Для общей AI инфраструктуры:

```typescript
// Контейнер dependency injection
import { getAIContainer } from '@/shared/services/ai/di-container'

const container = getAIContainer()
const service = await container.resolve('UnifiedAIService')
```

```typescript
// React интеграционные хуки
import { useAIService } from '@/shared/services/ai/react-integration'

function MyComponent() {
  const aiService = useAIService()
  // ... использовать AI сервис
}
```

## Лучшие Практики

### Управление Состоянием Чата
- Всегда оборачивайте компоненты чата в `ChatProvider`
- Используйте хук `useChat()` для доступа к функциональности чата
- Обрабатывайте ошибки блоками try-catch
- Реализуйте состояния загрузки для лучшего UX

### Управление Сессиями
- Сохраняйте сессии регулярно для предотвращения потери данных
- Реализуйте автосохранение при важных изменениях
- Валидируйте данные сессии перед загрузкой
- Обрабатывайте миграцию для изменений схемы сессий

### MCP Интеграция
- Инициализируйте MCP провайдер перед chat провайдером
- Регистрируйте инструменты при монтировании провайдера
- Корректно обрабатывайте ошибки обнаружения инструментов
- Реализуйте проверки доступности инструментов

## Тестирование

### Тесты Сервисов
```bash
# Запустить все тесты сервисов
bun run test src/features/ai-chat/services/

# Конкретные тесты
bun run test src/features/ai-chat/services/__tests__/chat-storage-service.test.ts
```

### Доступные Тесты
- `chat-storage-service.test.ts` - Тесты сервиса хранения чата

## Связанная Документация

- [Документация Chat Machine](../../../domains/ai-services/machines/README.md)
- [Документация AI Services](../../../domains/ai-services/README.md)
- [Документация AI Tools](../../../domains/ai-tools/README.md)
- [Документация Shared Services](../../../shared/services/ai/README.md)

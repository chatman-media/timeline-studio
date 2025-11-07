# AI Chat Hooks

**Русский** | [English](./README.md)

React хуки для функциональности AI Chat - актуальная документация на основе реальной реализации.

## Доступные хуки

### `useChat()`
Основной хук для доступа к полной функциональности чата.

**Возвращаемые значения:**
```typescript
import { createLogger } from '@/lib/tauri-logger'

const logger = createLogger('Example')
interface ChatContextType {
  // Текущая сессия и сообщения
  currentSession: ChatSession | null
  chatMessages: ChatMessage[]
  sessions: any[]
  
  // Состояние
  isLoading: boolean
  isProcessing: boolean
  isStreaming: boolean
  isOpen: boolean
  isCreatingNewChat: boolean
  error: string | null
  inputText: string
  
  // Управление сессиями
  createSession: (name?: string) => Promise<ChatSession>
  switchToSession: (sessionId: string) => Promise<void>
  deleteSession: (sessionId: string) => Promise<void>
  
  // Управление сообщениями
  sendMessage: (content: string) => Promise<void>
  sendChatMessage: (content: string) => Promise<void>
  receiveChatMessage: (content: string) => void
  clearMessages: () => Promise<void>
  removeMessage: (messageId: string) => void
  
  // UI управление
  setIsOpen: (isOpen: boolean) => void
  setInputText: (text: string) => void
  setIsStreaming: (isStreaming: boolean) => void
  setProcessing: (processing: boolean) => void
  setError: (error: string | null) => void
  
  // Управление агентами (обратная совместимость)
  selectedAgentId: string | null
  selectAgent: (agentId: string) => void
  currentSessionId: string | null
}
```

**Пример использования:**
```typescript
import { useChat } from '@/features/ai-chat/hooks'

function ChatInterface() {
  const {
    currentSession,
    chatMessages,
    isProcessing,
    sendChatMessage,
    createSession,
    setIsOpen
  } = useChat()

  return (
    <div>
      <button onClick={() => setIsOpen(true)}>
        Открыть чат
      </button>
      
      {currentSession && (
        <div>
          <h3>{currentSession.name}</h3>
          <div className="messages">
            {chatMessages.map(message => (
              <div key={message.id}>
                <strong>{message.role}:</strong> {message.content}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
```

### `useChatState()`
Хук для доступа только к состоянию чата (без методов).

**Возвращаемые значения:**
```typescript
{
  chatMessages: ChatMessage[]
  selectedAgentId: string | null
  isProcessing: boolean
  error: string | null
  currentSessionId: string | null
  sessions: any[]
  isCreatingNewChat: boolean
}
```

**Пример использования:**
```typescript
import { useChatState } from '@/features/ai-chat/hooks'

function ChatStatus() {
  const { 
    chatMessages, 
    isProcessing, 
    error,
    currentSessionId 
  } = useChatState()

  return (
    <div className="chat-status">
      <div>Сессия: {currentSessionId || 'Не выбрана'}</div>
      <div>Сообщений: {chatMessages.length}</div>
      <div>Статус: {isProcessing ? 'Обрабатывается...' : 'Готов'}</div>
      {error && <div className="error">Ошибка: {error}</div>}
    </div>
  )
}
```

### `useChatActions()`
Хук для получения только действий чата (без состояния).

**Возвращаемые значения:**
```typescript
{
  sendChatMessage: (content: string) => Promise<void>
  receiveChatMessage: (content: string) => void
  selectAgent: (agentId: string) => void
  setProcessing: (processing: boolean) => void
  setError: (error: string | null) => void
  clearMessages: () => Promise<void>
  removeMessage: (messageId: string) => void
}
```

**Пример использования:**
```typescript
import { useChatActions } from '@/features/ai-chat/hooks'

function SendMessageButton() {
  const { sendChatMessage, setError } = useChatActions()

  const handleSendMessage = async () => {
    try {
      await sendChatMessage("Привет, создай видео из моих файлов")
    } catch (error) {
      setError(`Ошибка отправки: ${error.message}`)
    }
  }

  return (
    <button onClick={handleSendMessage}>
      Отправить сообщение
    </button>
  )
}
```

### `useTimelineAI()`
Хук для Timeline-специфичных AI операций.

**Возвращаемые значения:**
```typescript
{
  createTimelineFromPrompt: (prompt: string) => Promise<TimelineAIResult>
  analyzeAndSuggestResources: (query: string) => Promise<TimelineAIResult>
  executeCommand: (command: string, params?: any) => Promise<TimelineAIResult>
  initializeApiKey: () => Promise<boolean>
  setApiKey: (apiKey: string) => void
}
```

**Типы результатов:**
```typescript
interface TimelineAIResult {
  success: boolean
  message: string
  data?: {
    createdProject?: TimelineProject
    addedResources?: string[]
    placedClips?: string[]
    appliedEnhancements?: string[]
    analysis?: ContentStoryAnalysis
    suggestions?: string[]
  }
  errors?: string[]
  warnings?: string[]
  executionTime: number
  nextActions?: string[]
}
```

**Пример использования:**
```typescript
import { useTimelineAI } from '@/features/ai-chat/hooks'

function TimelineCreator() {
  const { 
    createTimelineFromPrompt, 
    analyzeAndSuggestResources,
    executeCommand 
  } = useTimelineAI()

  const createWeddingVideo = async () => {
    const result = await createTimelineFromPrompt(`
      Создай свадебное видео из всех файлов:
      - Длительность: 5-7 минут
      - Романтичная музыка
      - Плавные переходы
      - Теплая цветокоррекция
    `)
    
    if (result.success) {
      logger.debugSync('Проект создан:', result.data?.createdProject)
      
      // Выполняем дополнительную обработку
      await executeCommand("add-romantic-effects", {
        intensity: "medium",
        style: "soft"
      })
    } else {
      logger.errorSync('Ошибки:', result.errors)
    }
  }

  const analyzeMedia = async () => {
    const result = await analyzeAndSuggestResources(
      "Проанализируй качество всех видео и предложи улучшения"
    )
    
    logger.debugSync('Предложения:', result.data?.suggestions)
  }

  return (
    <div>
      <button onClick={createWeddingVideo}>
        Создать свадебное видео
      </button>
      <button onClick={analyzeMedia}>
        Анализировать медиа
      </button>
    </div>
  )
}
```

### `useSafeTimeline()`
Безопасный доступ к состоянию timeline для AI операций.

**Возвращает:** 
- `TimelineContextType | null` - контекст timeline или `null` если недоступен

**Пример использования:**
```typescript
import { useSafeTimeline } from '@/features/ai-chat/hooks'

function SafeTimelineAccess() {
  const timeline = useSafeTimeline()
  
  const processCurrentProject = () => {
    if (!timeline) {
      logger.warnSync('Timeline не доступен')
      return
    }
    
    // Безопасное использование timeline
    const project = timeline.currentProject
    if (project) {
      logger.debugSync('Текущий проект:', project.name)
      logger.debugSync('Длительность:', project.duration, 'секунд')
    } else {
      logger.debugSync('Проект не загружен')
    }
  }

  return (
    <div>
      <div>
        Timeline статус: {timeline ? '✅ Доступен' : '❌ Недоступен'}
      </div>
      <button 
        onClick={processCurrentProject}
        disabled={!timeline}
      >
        Обработать текущий проект
      </button>
    </div>
  )
}
```

### `useResourcesAIIntegration()`
Хук для AI интеграции с управлением ресурсами.

**Возвращаемые значения:**
```typescript
{
  isIntegrated: boolean
  resourceStats: AIResourceStats
}

interface AIResourceStats {
  totalMedia: number
  totalEffects: number
  totalFilters: number
  totalSize: number
  totalDuration: number
  totalMusic: number
}
```

**Пример использования:**
```typescript
import { useResourcesAIIntegration } from '@/features/ai-chat/hooks'

function ResourcesStatus() {
  const { resourceStats, isIntegrated } = useResourcesAIIntegration()
  
  if (!isIntegrated) {
    return <div>Интеграция с ресурсами недоступна</div>
  }

  return (
    <div className="resources-stats">
      <h3>Статистика ресурсов</h3>
      <div>Медиафайлов: {resourceStats.totalMedia}</div>
      <div>Эффектов: {resourceStats.totalEffects}</div>
      <div>Фильтров: {resourceStats.totalFilters}</div>
      <div>Музыки: {resourceStats.totalMusic}</div>
      <div>
        Общий размер: {(resourceStats.totalSize / 1024 / 1024).toFixed(1)} MB
      </div>
      <div>
        Общая длительность: {Math.round(resourceStats.totalDuration / 60)} мин
      </div>
    </div>
  )
}
```

### `usePlayerAIIntegration()`
Хук для AI интеграции с видеоплеером.

**Возвращаемые значения:**
```typescript
{
  isReady: boolean
  hasMedia: boolean
  isPlaying: boolean
  effectsCount: number
  filtersCount: number
}
```

**Пример использования:**
```typescript
import { usePlayerAIIntegration } from '@/features/ai-chat/hooks'

function PlayerStatus() {
  const { 
    isReady, 
    hasMedia, 
    isPlaying, 
    effectsCount, 
    filtersCount 
  } = usePlayerAIIntegration()

  return (
    <div className="player-status">
      <div>Плеер готов: {isReady ? '✅' : '❌'}</div>
      <div>Медиа загружено: {hasMedia ? '✅' : '❌'}</div>
      <div>Воспроизведение: {isPlaying ? '▶️' : '⏸️'}</div>
      <div>Эффектов: {effectsCount}</div>
      <div>Фильтров: {filtersCount}</div>
    </div>
  )
}
```

### `useTimelineAIIntegration()`
Хук для AI интеграции с timeline.

**Возвращаемые значения:**
```typescript
{
  isReady: boolean
  hasProject: boolean
  clipsCount: number
  tracksCount: number
  projectDuration: number
}
```

**Пример использования:**
```typescript
import { useTimelineAIIntegration } from '@/features/ai-chat/hooks'

function TimelineStatus() {
  const { 
    isReady, 
    hasProject, 
    clipsCount, 
    tracksCount, 
    projectDuration 
  } = useTimelineAIIntegration()

  return (
    <div className="timeline-status">
      <div>Timeline готов: {isReady ? '✅' : '❌'}</div>
      <div>Проект загружен: {hasProject ? '✅' : '❌'}</div>
      {hasProject && (
        <>
          <div>Клипов: {clipsCount}</div>
          <div>Треков: {tracksCount}</div>
          <div>Длительность: {Math.round(projectDuration)} сек</div>
        </>
      )}
    </div>
  )
}
```

## Комбинированные примеры

### Полная интеграция AI Chat
```typescript
import { 
  useChat, 
  useTimelineAI, 
  useSafeTimeline,
  useResourcesAIIntegration 
} from '@/features/ai-chat/hooks'

function FullAIIntegration() {
  const { sendChatMessage, chatMessages, isProcessing } = useChat()
  const { createTimelineFromPrompt, executeCommand } = useTimelineAI()
  const timeline = useSafeTimeline()
  const { resourceStats, isIntegrated } = useResourcesAIIntegration()

  const handleSmartCommand = async (userInput: string) => {
    // Отправляем сообщение в чат
    await sendChatMessage(userInput)
    
    // Определяем тип команды и выполняем соответствующие действия
    const lowerInput = userInput.toLowerCase()
    
    if (lowerInput.includes('создай') || lowerInput.includes('сделай')) {
      // Timeline команды
      const result = await createTimelineFromPrompt(userInput)
      
      if (result.success) {
        await sendChatMessage(`✅ ${result.message}`)
        
        // Отправляем статистику в чат
        if (result.data?.placedClips) {
          await sendChatMessage(`📊 Размещено клипов: ${result.data.placedClips.length}`)
        }
      } else {
        await sendChatMessage(`❌ Ошибка: ${result.errors?.join(', ')}`)
      }
      
    } else if (lowerInput.includes('анализ') || lowerInput.includes('статистика')) {
      // Команды анализа
      let analysisMessage = '📊 Текущая статистика:\n'
      
      if (timeline?.currentProject) {
        analysisMessage += `• Проект: ${timeline.currentProject.name}\n`
        analysisMessage += `• Длительность: ${timeline.currentProject.duration}с\n`
      }
      
      if (isIntegrated) {
        analysisMessage += `• Ресурсов: ${resourceStats.totalMedia} медиа, ${resourceStats.totalEffects} эффектов\n`
        analysisMessage += `• Размер: ${(resourceStats.totalSize / 1024 / 1024).toFixed(1)} MB`
      }
      
      await sendChatMessage(analysisMessage)
    }
  }

  return (
    <div className="full-ai-integration">
      <div className="status-panel">
        <div>Timeline: {timeline ? '✅' : '❌'}</div>
        <div>Ресурсы: {isIntegrated ? '✅' : '❌'}</div>
        <div>Статус: {isProcessing ? 'Обрабатывается...' : 'Готов'}</div>
      </div>
      
      <div className="chat-messages">
        {chatMessages.map(message => (
          <div key={message.id} className={message.role}>
            {message.content}
          </div>
        ))}
      </div>
      
      <div className="quick-actions">
        <button 
          onClick={() => handleSmartCommand("Создай видео из всех файлов")}
          disabled={isProcessing}
        >
          Создать видео
        </button>
        
        <button 
          onClick={() => handleSmartCommand("Показать статистику проекта")}
          disabled={isProcessing}
        >
          Статистика
        </button>
        
        <button 
          onClick={() => handleSmartCommand("Оптимизируй текущий проект")}
          disabled={isProcessing || !timeline}
        >
          Оптимизировать
        </button>
      </div>
    </div>
  )
}
```

## Лучшие практики

### 1. Обработка ошибок
```typescript
const { createTimelineFromPrompt, setApiKey } = useTimelineAI()
const { setError } = useChatActions()

const safeExecuteAICommand = async (prompt: string) => {
  try {
    const result = await createTimelineFromPrompt(prompt)
    
    if (!result.success) {
      setError(result.errors?.join(', ') || 'Неизвестная ошибка')
      return null
    }
    
    return result
  } catch (error) {
    setError(`Ошибка выполнения: ${error.message}`)
    return null
  }
}
```

### 2. Проверка готовности системы
```typescript
const timeline = useSafeTimeline()
const { isIntegrated } = useResourcesAIIntegration()
const { isReady } = usePlayerAIIntegration()

const isSystemReady = timeline && isIntegrated && isReady

if (!isSystemReady) {
  return <div>Система не готова для AI операций</div>
}
```

### 3. Мемоизация колбэков
```typescript
const { sendChatMessage } = useChatActions()

const handleSendMessage = useCallback(async (message: string) => {
  await sendChatMessage(message)
}, [sendChatMessage])

// Использование в useEffect
useEffect(() => {
  // Безопасно использовать в зависимостях
}, [handleSendMessage])
```

### 4. Правильная очистка
```typescript
const { clearMessages, removeMessage } = useChatActions()

const cleanupChat = useCallback(async () => {
  try {
    await clearMessages()
    logger.debugSync('Чат очищен')
  } catch (error) {
    logger.errorSync('Ошибка очистки чата:', error)
  }
}, [clearMessages])

// Очистка при размонтировании компонента
useEffect(() => {
  return () => {
    // Очистка ресурсов при необходимости
  }
}, [])
```
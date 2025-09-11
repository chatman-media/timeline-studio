# AI Chat API

## Обзор

AI Chat API предоставляет интеграцию с AI ассистентами (Claude, OpenAI GPT) и включает 257 специализированный инструмент для автоматизации видеопроизводства.

## Основные компоненты

### useChatMachine Hook

Основной хук для управления AI чатом.

```typescript
const {
  state,           // Текущее состояние машины
  send,            // Отправка событий
  messages,        // История сообщений
  isLoading,       // Флаг загрузки
  error,           // Ошибка
  settings,        // Настройки чата
  activeModel,     // Активная модель
  suggestions,     // Предложения
} = useChatMachine()
```

### ChatProvider

Провайдер контекста для AI чата.

```typescript
<ChatProvider>
  <ChatWindow />
  <ChatSidebar />
</ChatProvider>
```

## AI инструменты (257 tool)

### Категории инструментов

#### 1. Export Management Tools (12 инструментов)
```typescript
// Примеры инструментов
analyzeExportSettings(settings: ExportSettings): ExportAnalysis
suggestOptimalExportSettings(content: VideoContent): ExportSettings
validateExportConfiguration(config: ExportConfig): ValidationResult
estimateExportTime(project: Project, settings: ExportSettings): TimeEstimate
```

#### 2. Effects & Filters Tools (10 инструментов)
```typescript
// Примеры инструментов
suggestEffects(clip: Clip, mood: string): Effect[]
optimizeEffectParameters(effect: Effect, content: VideoContent): EffectParams
createEffectPreset(name: string, params: EffectParams): EffectPreset
analyzeVisualStyle(video: VideoFile): StyleAnalysis
```

#### 3. Audio Processing Tools (12 инструментов)
```typescript
// Примеры инструментов
analyzeAudioQuality(audio: AudioTrack): QualityMetrics
suggestAudioEnhancements(audio: AudioTrack): Enhancement[]
detectAudioIssues(audio: AudioTrack): AudioIssue[]
optimizeAudioLevels(tracks: AudioTrack[]): LevelAdjustment[]
```

#### 4. Render & Performance Tools (8 инструментов)
```typescript
// Примеры инструментов
optimizeRenderSettings(hardware: HardwareInfo): RenderSettings
predictRenderPerformance(project: Project): PerformanceMetrics
suggestGPUAcceleration(gpu: GPUInfo): AccelerationSettings
analyzeBottlenecks(project: Project): Bottleneck[]
```

#### 5. Template & Layout Tools (10 инструментов)
```typescript
// Примеры инструментов
suggestLayoutTemplate(content: MediaFile[]): LayoutTemplate
createMulticamLayout(cameras: Camera[]): MulticamTemplate
optimizeComposition(clips: Clip[]): CompositionSuggestion
generateTitleTemplate(style: string): TitleTemplate
```

#### 6. Settings & Configuration Tools (8 инструментов)
```typescript
// Примеры инструментов
optimizeProjectSettings(project: Project): ProjectSettings
validateConfiguration(config: AppConfig): ValidationResult
suggestWorkspaceLayout(usage: UsagePattern): WorkspaceLayout
analyzeUserPreferences(history: UserHistory): Preferences
```

#### 7. Color & Style Tools (6 инструментов)
```typescript
// Примеры инструментов
analyzeColorPalette(video: VideoFile): ColorPalette
suggestColorGrading(style: string): ColorGradingPreset
matchColorBetweenClips(clips: Clip[]): ColorMatchResult
createLUTFromReference(reference: ImageFile): LUTFile
```

#### 8. Media Processing Tools (6 инструментов)
```typescript
// Примеры инструментов
analyzeMediaContent(file: MediaFile): ContentAnalysis
detectScenes(video: VideoFile): Scene[]
extractKeyframes(video: VideoFile): Keyframe[]
suggestTrimPoints(clip: Clip): TrimSuggestion[]
```

### Дополнительные специализированные инструменты (79)

Включают инструменты для:
- Распознавания объектов и лиц
- Генерации субтитров
- Анализа движения
- Создания переходов
- Оптимизации таймлайна
- И многое другое

## Использование AI инструментов

### Базовый запрос

```typescript
const chat = useChatMachine()

// Отправка сообщения
chat.send({
  type: 'SEND_MESSAGE',
  message: 'Помоги оптимизировать настройки экспорта для YouTube'
})

// Получение ответа с использованием инструментов
const response = await chat.processWithTools(message)
```

### Вызов конкретного инструмента

```typescript
// Прямой вызов инструмента
const result = await chat.callTool('analyzeExportSettings', {
  settings: currentExportSettings
})

// Батч-обработка
const results = await chat.callTools([
  { tool: 'analyzeMediaContent', params: { file: mediaFile } },
  { tool: 'suggestEffects', params: { clip, mood: 'dramatic' } },
  { tool: 'optimizeAudioLevels', params: { tracks: audioTracks } }
])
```

## Интеграция с модулями

### Timeline Integration

```typescript
// Автоматические предложения для таймлайна
const suggestions = await chat.getTimelineSuggestions({
  clips: timeline.clips,
  style: 'dynamic',
  duration: 60
})

// Применение предложений
await timeline.applySuggestions(suggestions)
```

### Export Integration

```typescript
// Оптимизация экспорта
const optimalSettings = await chat.optimizeExport({
  project: currentProject,
  platform: 'youtube',
  quality: 'high'
})

// Применение настроек
await exportModule.applySettings(optimalSettings)
```

## Модели AI

### Поддерживаемые модели

```typescript
type AIModel = 
  | 'claude-3-opus'
  | 'claude-3-sonnet' 
  | 'gpt-4'
  | 'gpt-3.5-turbo'

// Переключение модели
chat.send({
  type: 'SWITCH_MODEL',
  model: 'claude-3-opus'
})
```

### Настройки моделей

```typescript
interface ModelSettings {
  temperature: number      // 0.0 - 1.0
  maxTokens: number       // Максимум токенов
  streaming: boolean      // Потоковый ответ
  tools: string[]        // Активные инструменты
}

// Обновление настроек
chat.send({
  type: 'UPDATE_SETTINGS',
  settings: {
    temperature: 0.7,
    maxTokens: 2000,
    streaming: true
  }
})
```

## События и состояния

### Состояния чата

```typescript
type ChatState = 
  | 'idle'
  | 'loading'
  | 'streaming'
  | 'processing'
  | 'error'

// Подписка на изменения состояния
useEffect(() => {
  if (chat.state === 'streaming') {
    // Обработка потокового ответа
  }
}, [chat.state])
```

### События

```typescript
// Обработка событий
chat.on('toolExecuted', (tool, result) => {
  console.log(`Tool ${tool} executed:`, result)
})

chat.on('suggestionAccepted', (suggestion) => {
  // Применение принятого предложения
})
```

## Примеры использования

### Комплексная автоматизация

```typescript
async function automateVideoProduction() {
  const chat = useChatMachine()
  
  // 1. Анализ контента
  const analysis = await chat.callTool('analyzeMediaContent', {
    files: mediaFiles
  })
  
  // 2. Генерация монтажного плана
  const montagePlan = await chat.callTool('generateMontagePlan', {
    analysis,
    style: 'documentary',
    duration: 300
  })
  
  // 3. Создание таймлайна
  const timeline = await chat.callTool('createTimelineFromPlan', {
    plan: montagePlan,
    transitions: 'smooth'
  })
  
  // 4. Оптимизация
  const optimized = await chat.callTool('optimizeTimeline', {
    timeline,
    targetPlatform: 'youtube'
  })
  
  return optimized
}
```

### Интерактивный ассистент

```typescript
function ChatAssistant() {
  const chat = useChatMachine()
  const [input, setInput] = useState('')
  
  const handleSend = async () => {
    // Отправка с контекстом проекта
    await chat.sendWithContext(input, {
      currentTime: timeline.playhead,
      selectedClips: timeline.selection,
      activeEffects: effects.active
    })
  }
  
  return (
    <div>
      <MessageList messages={chat.messages} />
      <SuggestionBar suggestions={chat.suggestions} />
      <ChatInput 
        value={input}
        onChange={setInput}
        onSend={handleSend}
        isLoading={chat.isLoading}
      />
    </div>
  )
}
```

## API ключи и безопасность

### Настройка API ключей

```typescript
// В UserSettings
const settings = {
  claudeApiKey: 'sk-...',
  openaiApiKey: 'sk-...',
  preferredModel: 'claude-3-opus'
}

// Безопасное хранение через Tauri
await invoke('store_api_keys', { keys: encryptedKeys })
```

### Ограничения и квоты

```typescript
interface UsageQuota {
  dailyLimit: number
  monthlyLimit: number
  currentUsage: number
  resetDate: Date
}

// Проверка квоты
const quota = await chat.checkQuota()
if (quota.currentUsage >= quota.dailyLimit) {
  // Показать предупреждение
}
```

## Производительность

### Кэширование ответов

```typescript
// Включение кэширования
chat.enableCache({
  ttl: 3600, // 1 час
  maxSize: 100 // 100 записей
})

// Очистка кэша
chat.clearCache()
```

### Оптимизация запросов

```typescript
// Батч-запросы для экономии
const batchResult = await chat.batchProcess([
  { type: 'analyze', data: clips },
  { type: 'suggest', data: style },
  { type: 'optimize', data: settings }
])
```

## Обработка ошибок

```typescript
try {
  const result = await chat.callTool('complexOperation', params)
} catch (error) {
  if (error.code === 'RATE_LIMIT') {
    // Обработка лимита запросов
  } else if (error.code === 'INVALID_API_KEY') {
    // Запрос нового ключа
  } else {
    // Общая обработка ошибок
  }
}
```

---

*Последнее обновление: 31 июля 2025*
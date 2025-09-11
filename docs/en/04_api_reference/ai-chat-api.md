# AI Chat API

## Overview

The AI Chat API provides integration with AI assistants (Claude, OpenAI GPT) and includes 257 specialized tools for video production automation.

## Core Components

### useChatMachine Hook

Main hook for managing AI chat.

```typescript
const {
  state,           // Current machine state
  send,            // Send events
  messages,        // Message history
  isLoading,       // Loading flag
  error,           // Error state
  settings,        // Chat settings
  activeModel,     // Active model
  suggestions,     // Suggestions
} = useChatMachine()
```

### ChatProvider

Context provider for AI chat.

```typescript
<ChatProvider>
  <ChatWindow />
  <ChatSidebar />
</ChatProvider>
```

## AI Tools (257 tools)

### Tool Categories

#### 1. Export Management Tools (12 tools)
```typescript
// Example tools
analyzeExportSettings(settings: ExportSettings): ExportAnalysis
suggestOptimalExportSettings(content: VideoContent): ExportSettings
validateExportConfiguration(config: ExportConfig): ValidationResult
estimateExportTime(project: Project, settings: ExportSettings): TimeEstimate
```

#### 2. Effects & Filters Tools (10 tools)
```typescript
// Example tools
suggestEffects(clip: Clip, mood: string): Effect[]
optimizeEffectParameters(effect: Effect, content: VideoContent): EffectParams
createEffectPreset(name: string, params: EffectParams): EffectPreset
analyzeVisualStyle(video: VideoFile): StyleAnalysis
```

#### 3. Audio Processing Tools (12 tools)
```typescript
// Example tools
analyzeAudioQuality(audio: AudioTrack): QualityMetrics
suggestAudioEnhancements(audio: AudioTrack): Enhancement[]
detectAudioIssues(audio: AudioTrack): AudioIssue[]
optimizeAudioLevels(tracks: AudioTrack[]): LevelAdjustment[]
```

#### 4. Render & Performance Tools (8 tools)
```typescript
// Example tools
optimizeRenderSettings(hardware: HardwareInfo): RenderSettings
predictRenderPerformance(project: Project): PerformanceMetrics
suggestGPUAcceleration(gpu: GPUInfo): AccelerationSettings
analyzeBottlenecks(project: Project): Bottleneck[]
```

#### 5. Template & Layout Tools (10 tools)
```typescript
// Example tools
suggestLayoutTemplate(content: MediaFile[]): LayoutTemplate
createMulticamLayout(cameras: Camera[]): MulticamTemplate
optimizeComposition(clips: Clip[]): CompositionSuggestion
generateTitleTemplate(style: string): TitleTemplate
```

#### 6. Settings & Configuration Tools (8 tools)
```typescript
// Example tools
optimizeProjectSettings(project: Project): ProjectSettings
validateConfiguration(config: AppConfig): ValidationResult
suggestWorkspaceLayout(usage: UsagePattern): WorkspaceLayout
analyzeUserPreferences(history: UserHistory): Preferences
```

#### 7. Color & Style Tools (6 tools)
```typescript
// Example tools
analyzeColorPalette(video: VideoFile): ColorPalette
suggestColorGrading(style: string): ColorGradingPreset
matchColorBetweenClips(clips: Clip[]): ColorMatchResult
createLUTFromReference(reference: ImageFile): LUTFile
```

#### 8. Media Processing Tools (6 tools)
```typescript
// Example tools
analyzeMediaContent(file: MediaFile): ContentAnalysis
detectScenes(video: VideoFile): Scene[]
extractKeyframes(video: VideoFile): Keyframe[]
suggestTrimPoints(clip: Clip): TrimSuggestion[]
```

### Additional Specialized Tools (79)

Include tools for:
- Object and face recognition
- Subtitle generation
- Motion analysis
- Transition creation
- Timeline optimization
- And much more

## Using AI Tools

### Basic Request

```typescript
const chat = useChatMachine()

// Send message
chat.send({
  type: 'SEND_MESSAGE',
  message: 'Help me optimize export settings for YouTube'
})

// Get response using tools
const response = await chat.processWithTools(message)
```

### Calling Specific Tool

```typescript
// Direct tool call
const result = await chat.callTool('analyzeExportSettings', {
  settings: currentExportSettings
})

// Batch processing
const results = await chat.callTools([
  { tool: 'analyzeMediaContent', params: { file: mediaFile } },
  { tool: 'suggestEffects', params: { clip, mood: 'dramatic' } },
  { tool: 'optimizeAudioLevels', params: { tracks: audioTracks } }
])
```

## Module Integration

### Timeline Integration

```typescript
// Automatic timeline suggestions
const suggestions = await chat.getTimelineSuggestions({
  clips: timeline.clips,
  style: 'dynamic',
  duration: 60
})

// Apply suggestions
await timeline.applySuggestions(suggestions)
```

### Export Integration

```typescript
// Export optimization
const optimalSettings = await chat.optimizeExport({
  project: currentProject,
  platform: 'youtube',
  quality: 'high'
})

// Apply settings
await exportModule.applySettings(optimalSettings)
```

## AI Models

### Supported Models

```typescript
type AIModel = 
  | 'claude-3-opus'
  | 'claude-3-sonnet' 
  | 'gpt-4'
  | 'gpt-3.5-turbo'

// Switch model
chat.send({
  type: 'SWITCH_MODEL',
  model: 'claude-3-opus'
})
```

### Model Settings

```typescript
interface ModelSettings {
  temperature: number      // 0.0 - 1.0
  maxTokens: number       // Maximum tokens
  streaming: boolean      // Streaming response
  tools: string[]        // Active tools
}

// Update settings
chat.send({
  type: 'UPDATE_SETTINGS',
  settings: {
    temperature: 0.7,
    maxTokens: 2000,
    streaming: true
  }
})
```

## Events and States

### Chat States

```typescript
type ChatState = 
  | 'idle'
  | 'loading'
  | 'streaming'
  | 'processing'
  | 'error'

// Subscribe to state changes
useEffect(() => {
  if (chat.state === 'streaming') {
    // Handle streaming response
  }
}, [chat.state])
```

### Events

```typescript
// Handle events
chat.on('toolExecuted', (tool, result) => {
  console.log(`Tool ${tool} executed:`, result)
})

chat.on('suggestionAccepted', (suggestion) => {
  // Apply accepted suggestion
})
```

## Usage Examples

### Comprehensive Automation

```typescript
async function automateVideoProduction() {
  const chat = useChatMachine()
  
  // 1. Analyze content
  const analysis = await chat.callTool('analyzeMediaContent', {
    files: mediaFiles
  })
  
  // 2. Generate montage plan
  const montagePlan = await chat.callTool('generateMontagePlan', {
    analysis,
    style: 'documentary',
    duration: 300
  })
  
  // 3. Create timeline
  const timeline = await chat.callTool('createTimelineFromPlan', {
    plan: montagePlan,
    transitions: 'smooth'
  })
  
  // 4. Optimize
  const optimized = await chat.callTool('optimizeTimeline', {
    timeline,
    targetPlatform: 'youtube'
  })
  
  return optimized
}
```

### Interactive Assistant

```typescript
function ChatAssistant() {
  const chat = useChatMachine()
  const [input, setInput] = useState('')
  
  const handleSend = async () => {
    // Send with project context
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

## API Keys and Security

### Setting API Keys

```typescript
// In UserSettings
const settings = {
  claudeApiKey: 'sk-...',
  openaiApiKey: 'sk-...',
  preferredModel: 'claude-3-opus'
}

// Secure storage via Tauri
await invoke('store_api_keys', { keys: encryptedKeys })
```

### Limits and Quotas

```typescript
interface UsageQuota {
  dailyLimit: number
  monthlyLimit: number
  currentUsage: number
  resetDate: Date
}

// Check quota
const quota = await chat.checkQuota()
if (quota.currentUsage >= quota.dailyLimit) {
  // Show warning
}
```

## Performance

### Response Caching

```typescript
// Enable caching
chat.enableCache({
  ttl: 3600, // 1 hour
  maxSize: 100 // 100 entries
})

// Clear cache
chat.clearCache()
```

### Query Optimization

```typescript
// Batch requests for efficiency
const batchResult = await chat.batchProcess([
  { type: 'analyze', data: clips },
  { type: 'suggest', data: style },
  { type: 'optimize', data: settings }
])
```

## Error Handling

```typescript
try {
  const result = await chat.callTool('complexOperation', params)
} catch (error) {
  if (error.code === 'RATE_LIMIT') {
    // Handle rate limit
  } else if (error.code === 'INVALID_API_KEY') {
    // Request new key
  } else {
    // General error handling
  }
}
```

---

*Last updated: July 31, 2025*
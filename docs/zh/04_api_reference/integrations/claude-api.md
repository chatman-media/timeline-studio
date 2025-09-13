# Claude API Integration

## Overview

Claude API (Anthropic) integration provides access to advanced artificial intelligence capabilities for video analysis, description generation, subtitle creation, smart editing, and interactive assistant in Timeline Studio.

## Setup

### Getting API Key

1. Register at [console.anthropic.com](https://console.anthropic.com)
2. Create a new API key in the API Keys section
3. Store the key securely
4. Configure usage limits (optional)

### In-app Configuration

```typescript
// Initialize Claude client
const claude = await initializeClaude({
  apiKey: process.env.ANTHROPIC_API_KEY,
  // Optional settings
  maxRetries: 3,
  timeout: 30000, // 30 seconds
  baseURL: 'https://api.anthropic.com', // Or proxy
  defaultModel: 'claude-3-opus-20240229'
})

// Check connection
const test = await claude.messages.create({
  model: 'claude-3-opus-20240229',
  max_tokens: 100,
  messages: [{ role: 'user', content: 'Hello!' }]
})
```

## Claude Models

### Available Models

```typescript
// Claude 3 family
const models = {
  // Most powerful model
  opus: 'claude-3-opus-20240229',
  
  // Balance of performance and cost
  sonnet: 'claude-3-sonnet-20240229',
  
  // Fastest and most economical
  haiku: 'claude-3-haiku-20240307',
  
  // Previous versions
  claude2: 'claude-2.1',
  instant: 'claude-instant-1.2'
}

// Select model by task
const selectModel = (task: TaskType) => {
  switch (task) {
    case 'complex_analysis':
      return models.opus
    case 'general_assistance':
      return models.sonnet
    case 'quick_response':
      return models.haiku
    default:
      return models.sonnet
  }
}
```

## Video Analysis

### Video Content Description

```typescript
// Generate video description
const analyzeVideo = async (videoPath: string) => {
  // Extract key frames
  const frames = await extractKeyFrames(videoPath, {
    count: 10,
    format: 'base64'
  })
  
  // Analyze through Claude Vision
  const analysis = await claude.messages.create({
    model: 'claude-3-opus-20240229',
    max_tokens: 2000,
    messages: [{
      role: 'user',
      content: [
        {
          type: 'text',
          text: 'Analyze this video and provide a detailed description. Describe scenes, actions, objects, mood, and overall theme.'
        },
        ...frames.map(frame => ({
          type: 'image',
          source: {
            type: 'base64',
            media_type: 'image/jpeg',
            data: frame.data
          }
        }))
      ]
    }]
  })
  
  return analysis.content[0].text
}

// Identify key moments
const findKeyMoments = async (videoPath: string) => {
  const frames = await extractFramesWithTimestamps(videoPath)
  
  const response = await claude.messages.create({
    model: 'claude-3-sonnet-20240229',
    max_tokens: 1500,
    messages: [{
      role: 'user',
      content: [
        {
          type: 'text',
          text: 'Identify key moments in this video. For each moment, provide timestamp and description. Response format: JSON array with timestamp and description fields.'
        },
        ...frames.map(f => ({
          type: 'image',
          source: {
            type: 'base64',
            media_type: 'image/jpeg',
            data: f.data
          }
        }))
      ]
    }]
  })
  
  return JSON.parse(response.content[0].text)
}
```

### Metadata Generation

```typescript
// Auto-generate tags and descriptions
const generateMetadata = async (videoAnalysis: string) => {
  const response = await claude.messages.create({
    model: 'claude-3-haiku-20240307',
    max_tokens: 500,
    messages: [{
      role: 'user',
      content: `Based on video analysis: "${videoAnalysis}"
      
      Generate:
      1. Title (up to 100 characters)
      2. YouTube description (up to 5000 characters)
      3. Tags (20-30 relevant tags)
      4. YouTube category
      5. Social media hashtags
      
      Response format: JSON`
    }]
  })
  
  return JSON.parse(response.content[0].text)
}

// SEO optimization
const optimizeForSEO = async (metadata: VideoMetadata) => {
  const response = await claude.messages.create({
    model: 'claude-3-sonnet-20240229',
    max_tokens: 800,
    messages: [{
      role: 'user',
      content: `Optimize video metadata for SEO:
      
      Current data:
      ${JSON.stringify(metadata, null, 2)}
      
      Improve title, description, and tags for maximum search visibility.
      Consider trends and keywords.`
    }]
  })
  
  return JSON.parse(response.content[0].text)
}
```

## Subtitles and Transcription

### Subtitle Generation

```typescript
// Create subtitles from audio
const generateSubtitles = async (audioPath: string, language: string = 'en') => {
  // Transcription via Whisper or other service
  const transcription = await transcribeAudio(audioPath)
  
  // Enhancement and formatting via Claude
  const response = await claude.messages.create({
    model: 'claude-3-sonnet-20240229',
    max_tokens: 4000,
    messages: [{
      role: 'user',
      content: `Convert transcription to professional subtitles:
      
      Transcription:
      ${transcription.text}
      
      Timestamps:
      ${JSON.stringify(transcription.timestamps)}
      
      Requirements:
      1. Fix grammatical errors
      2. Add punctuation
      3. Break into readable phrases (max 42 characters)
      4. Sync with timestamps
      5. Add [sound effects] where needed
      
      Format: SRT`
    }]
  })
  
  return response.content[0].text
}

// Translate subtitles
const translateSubtitles = async (
  subtitles: string, 
  fromLang: string, 
  toLang: string
) => {
  const response = await claude.messages.create({
    model: 'claude-3-opus-20240229',
    max_tokens: 4000,
    messages: [{
      role: 'user',
      content: `Translate subtitles from ${fromLang} to ${toLang}:
      
      ${subtitles}
      
      Requirements:
      1. Preserve timestamps
      2. Adapt line length for target language
      3. Maintain context and meaning
      4. Localize cultural references
      5. Keep SRT format`
    }]
  })
  
  return response.content[0].text
}
```

## Smart Editing

### Scene Analysis for Editing

```typescript
// Editing recommendations
const suggestEdits = async (videoAnalysis: VideoAnalysis) => {
  const response = await claude.messages.create({
    model: 'claude-3-opus-20240229',
    max_tokens: 2000,
    messages: [{
      role: 'user',
      content: `Analyze video and provide editing recommendations:
      
      Video analysis:
      ${JSON.stringify(videoAnalysis)}
      
      Suggest:
      1. Which scenes to cut
      2. Optimal scene order
      3. Where to add transitions
      4. Pacing recommendations
      5. Color correction moments
      6. Music suggestions
      
      Format: JSON with detailed recommendations`
    }]
  })
  
  return JSON.parse(response.content[0].text)
}

// Automatic highlight generation
const generateHighlights = async (
  videoPath: string, 
  targetDuration: number = 60
) => {
  const analysis = await analyzeVideo(videoPath)
  
  const response = await claude.messages.create({
    model: 'claude-3-sonnet-20240229',
    max_tokens: 1000,
    messages: [{
      role: 'user',
      content: `Based on video analysis, create a plan for ${targetDuration}-second highlight video.
      
      Analysis: ${analysis}
      
      Select most interesting moments and specify:
      - start_time
      - end_time
      - importance (1-10)
      - transition_type
      
      Format: JSON array`
    }]
  })
  
  return JSON.parse(response.content[0].text)
}
```

## Interactive Assistant

### Chat Integration

```typescript
// Create contextual assistant
class TimelineAssistant {
  private conversation: Message[] = []
  private projectContext: ProjectContext
  
  async initialize(project: Project) {
    this.projectContext = await this.buildContext(project)
    
    // System prompt
    this.conversation.push({
      role: 'system',
      content: `You are Timeline Studio assistant. You help with video editing.
      
      Project context:
      - Name: ${project.name}
      - Duration: ${project.duration}
      - Tracks: ${project.tracks.length}
      - Effects: ${project.effects.length}
      
      Your capabilities:
      - Timeline analysis
      - Editing recommendations
      - Effects assistance
      - Workflow optimization
      - Feature tutorials`
    })
  }
  
  async sendMessage(message: string): Promise<string> {
    // Add user message
    this.conversation.push({
      role: 'user',
      content: message
    })
    
    // Get response
    const response = await claude.messages.create({
      model: 'claude-3-sonnet-20240229',
      max_tokens: 1000,
      messages: this.conversation,
      // Add tools
      tools: [
        {
          name: 'analyze_timeline',
          description: 'Analyzes current timeline',
          input_schema: {
            type: 'object',
            properties: {
              aspect: {
                type: 'string',
                enum: ['rhythm', 'transitions', 'effects', 'audio']
              }
            }
          }
        },
        {
          name: 'suggest_effect',
          description: 'Suggests effect for selected clip',
          input_schema: {
            type: 'object',
            properties: {
              clipId: { type: 'string' },
              mood: { type: 'string' }
            }
          }
        }
      ]
    })
    
    // Handle tools
    if (response.stop_reason === 'tool_use') {
      const toolUse = response.content.find(c => c.type === 'tool_use')
      const result = await this.executeTool(toolUse)
      
      // Add tool result
      this.conversation.push({
        role: 'assistant',
        content: response.content
      })
      
      this.conversation.push({
        role: 'user',
        content: [{
          type: 'tool_result',
          tool_use_id: toolUse.id,
          content: JSON.stringify(result)
        }]
      })
      
      // Get final response
      const finalResponse = await claude.messages.create({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 1000,
        messages: this.conversation
      })
      
      return finalResponse.content[0].text
    }
    
    // Add response to history
    this.conversation.push({
      role: 'assistant',
      content: response.content
    })
    
    return response.content[0].text
  }
}
```

### Contextual Tips

```typescript
// Generate action-based tips
const generateContextualTips = async (
  userAction: UserAction,
  projectState: ProjectState
) => {
  const response = await claude.messages.create({
    model: 'claude-3-haiku-20240307',
    max_tokens: 300,
    messages: [{
      role: 'user',
      content: `User performed action: ${userAction.type}
      
      Project state:
      ${JSON.stringify(projectState, null, 2)}
      
      Provide a brief helpful tip or advice.`
    }]
  })
  
  return response.content[0].text
}

// Learning materials
const generateTutorial = async (feature: string) => {
  const response = await claude.messages.create({
    model: 'claude-3-sonnet-20240229',
    max_tokens: 1500,
    messages: [{
      role: 'user',
      content: `Create a step-by-step guide for "${feature}" feature in Timeline Studio.
      
      Include:
      1. What the feature does
      2. When to use it
      3. Step-by-step instructions
      4. Tips and tricks
      5. Common mistakes
      
      Format: Markdown`
    }]
  })
  
  return response.content[0].text
}
```

## Streaming Responses

### Streaming API

```typescript
// Stream responses for real-time interaction
const streamResponse = async (
  message: string,
  onChunk: (chunk: string) => void
) => {
  const stream = await claude.messages.create({
    model: 'claude-3-sonnet-20240229',
    max_tokens: 2000,
    messages: [{ role: 'user', content: message }],
    stream: true
  })
  
  let fullResponse = ''
  
  for await (const chunk of stream) {
    if (chunk.type === 'content_block_delta') {
      const text = chunk.delta.text
      fullResponse += text
      onChunk(text)
    }
  }
  
  return fullResponse
}

// UI usage
const assistantResponse = await streamResponse(
  userMessage,
  (chunk) => {
    // Update UI in real-time
    updateChatBubble(chunk)
  }
)
```

## Context Management

### Token Optimization

```typescript
// Count and optimize tokens
const optimizeContext = async (messages: Message[]) => {
  // Token counting (approximate)
  const countTokens = (text: string) => {
    return Math.ceil(text.length / 4)
  }
  
  const totalTokens = messages.reduce((sum, msg) => {
    const content = typeof msg.content === 'string' 
      ? msg.content 
      : JSON.stringify(msg.content)
    return sum + countTokens(content)
  }, 0)
  
  // If exceeding limit, summarize old messages
  if (totalTokens > 50000) {
    const oldMessages = messages.slice(0, -10)
    const recentMessages = messages.slice(-10)
    
    const summary = await claude.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 500,
      messages: [{
        role: 'user',
        content: `Summarize this conversation, preserving key context:
        ${JSON.stringify(oldMessages)}`
      }]
    })
    
    return [
      {
        role: 'system',
        content: `Previous context: ${summary.content[0].text}`
      },
      ...recentMessages
    ]
  }
  
  return messages
}

// Save history
const saveConversation = async (
  projectId: string,
  conversation: Message[]
) => {
  await database.conversations.save({
    projectId,
    messages: conversation,
    timestamp: Date.now(),
    summary: await generateSummary(conversation)
  })
}
```

## Error Handling

```typescript
// API error handling
const makeClaudeRequest = async (requestFn: () => Promise<any>) => {
  try {
    return await requestFn()
  } catch (error) {
    if (error.status === 429) {
      // Rate limit
      console.error('Rate limit exceeded')
      const retryAfter = error.headers?.['retry-after'] || 60
      await delay(retryAfter * 1000)
      return await requestFn() // Retry
    } else if (error.status === 401) {
      console.error('Invalid API key')
      throw new Error('Check your Anthropic API key')
    } else if (error.status === 400) {
      console.error('Bad request:', error.message)
      // Log for debugging
      logError('claude_api_error', error)
    } else if (error.status === 500) {
      console.error('Anthropic server error')
      // Fallback to another model
      return await fallbackRequest(requestFn)
    }
    
    throw error
  }
}

// Fallback strategy
const fallbackRequest = async (originalRequest: () => Promise<any>) => {
  // Try with different model
  const modifiedRequest = () => {
    const req = originalRequest.toString()
    return eval(req.replace('claude-3-opus', 'claude-3-sonnet'))
  }
  
  return await modifiedRequest()
}
```

## Limits and Recommendations

### API Limits

| Parameter | Opus | Sonnet | Haiku |
|-----------|------|--------|-------|
| Context | 200K tokens | 200K tokens | 200K tokens |
| Max output | 4096 tokens | 4096 tokens | 4096 tokens |
| Requests/min | 5 | 20 | 50 |
| Images | 20 | 20 | 20 |
| Image size | 5MB | 5MB | 5MB |

### Pricing

- **Opus**: $15 / 1M input tokens, $75 / 1M output
- **Sonnet**: $3 / 1M input tokens, $15 / 1M output  
- **Haiku**: $0.25 / 1M input tokens, $1.25 / 1M output

### Recommendations

1. **Use the right model** for the task
2. **Cache responses** for identical requests
3. **Optimize prompts** to save tokens
4. **Use streaming** for better UX
5. **Maintain context** between sessions
6. **Monitor usage** via API

---

*Last updated: July 31, 2025*
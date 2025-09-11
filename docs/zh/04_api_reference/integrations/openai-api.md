# OpenAI API Integration

## Overview

OpenAI API integration provides access to the GPT-4 model family, DALL-E for image generation, Whisper for audio transcription, and other advanced AI tools to enhance Timeline Studio capabilities.

## Setup

### Getting API Key

1. Register at [platform.openai.com](https://platform.openai.com)
2. Go to API Keys section
3. Create a new secret key
4. Configure usage limits and billing
5. Store the key securely

### In-app Configuration

```typescript
// Initialize OpenAI client
const openai = await initializeOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  organization: process.env.OPENAI_ORG_ID, // Optional
  // Additional settings
  maxRetries: 3,
  timeout: 60000, // 60 seconds
  dangerouslyAllowBrowser: false // Only for backend
})

// Check connection
const models = await openai.models.list()
console.log('Available models:', models.data.map(m => m.id))
```

## GPT Models

### Available Models

```typescript
// GPT-4 family
const models = {
  // Most powerful model with vision
  'gpt-4-turbo': {
    name: 'gpt-4-turbo-preview',
    context: 128000,
    vision: true,
    maxOutput: 4096
  },
  
  // Standard GPT-4
  'gpt-4': {
    name: 'gpt-4',
    context: 8192,
    vision: false,
    maxOutput: 4096
  },
  
  // Fast and economical
  'gpt-3.5-turbo': {
    name: 'gpt-3.5-turbo',
    context: 16385,
    vision: false,
    maxOutput: 4096
  }
}

// Select model by task
const selectGPTModel = (task: TaskType, needsVision: boolean = false) => {
  if (needsVision) {
    return 'gpt-4-turbo-preview'
  }
  
  switch (task) {
    case 'complex_reasoning':
      return 'gpt-4-turbo-preview'
    case 'general_chat':
      return 'gpt-3.5-turbo'
    case 'code_generation':
      return 'gpt-4'
    default:
      return 'gpt-3.5-turbo'
  }
}
```

### Chat Completions

```typescript
// Basic request
const response = await openai.chat.completions.create({
  model: 'gpt-4-turbo-preview',
  messages: [
    {
      role: 'system',
      content: 'You are a video editing expert in Timeline Studio.'
    },
    {
      role: 'user',
      content: 'How do I create a slow motion effect?'
    }
  ],
  temperature: 0.7,
  max_tokens: 1000
})

console.log(response.choices[0].message.content)

// With images (Vision)
const visionResponse = await openai.chat.completions.create({
  model: 'gpt-4-turbo-preview',
  messages: [
    {
      role: 'user',
      content: [
        {
          type: 'text',
          text: 'Analyze the composition of this frame'
        },
        {
          type: 'image_url',
          image_url: {
            url: 'data:image/jpeg;base64,/9j/4AAQ...',
            detail: 'high' // 'low' | 'high' | 'auto'
          }
        }
      ]
    }
  ],
  max_tokens: 500
})
```

### Function Calling

```typescript
// Define functions for GPT
const tools = [
  {
    type: 'function',
    function: {
      name: 'apply_video_effect',
      description: 'Applies a video effect to a clip',
      parameters: {
        type: 'object',
        properties: {
          clipId: {
            type: 'string',
            description: 'ID of the clip on timeline'
          },
          effectType: {
            type: 'string',
            enum: ['blur', 'sharpen', 'colorGrade', 'slowMotion'],
            description: 'Type of effect'
          },
          intensity: {
            type: 'number',
            description: 'Effect intensity (0-1)'
          }
        },
        required: ['clipId', 'effectType']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'analyze_timeline',
      description: 'Analyzes current timeline',
      parameters: {
        type: 'object',
        properties: {
          aspect: {
            type: 'string',
            enum: ['pacing', 'transitions', 'colorConsistency'],
            description: 'Analysis aspect'
          }
        }
      }
    }
  }
]

// Use with functions
const response = await openai.chat.completions.create({
  model: 'gpt-4-turbo-preview',
  messages: [
    {
      role: 'user',
      content: 'Add blur to the first clip'
    }
  ],
  tools: tools,
  tool_choice: 'auto'
})

// Handle function call
if (response.choices[0].message.tool_calls) {
  for (const toolCall of response.choices[0].message.tool_calls) {
    const functionName = toolCall.function.name
    const args = JSON.parse(toolCall.function.arguments)
    
    // Execute function
    const result = await executeFunction(functionName, args)
    
    // Send result back
    const followUp = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        ...previousMessages,
        response.choices[0].message,
        {
          role: 'tool',
          tool_call_id: toolCall.id,
          content: JSON.stringify(result)
        }
      ]
    })
  }
}
```

## Audio Transcription (Whisper)

### Basic Transcription

```typescript
// Transcribe audio file
const transcription = await openai.audio.transcriptions.create({
  file: fs.createReadStream('/path/to/audio.mp3'),
  model: 'whisper-1',
  language: 'en', // Optional
  response_format: 'json', // 'json' | 'text' | 'srt' | 'vtt'
  prompt: 'Video about editing in Timeline Studio' // Context
})

console.log(transcription.text)

// With timestamps
const verboseTranscription = await openai.audio.transcriptions.create({
  file: audioFile,
  model: 'whisper-1',
  response_format: 'verbose_json',
  timestamp_granularities: ['word', 'segment']
})

// Process segments
verboseTranscription.segments.forEach(segment => {
  console.log(`[${segment.start} - ${segment.end}] ${segment.text}`)
})
```

### Audio Translation

```typescript
// Translate to English
const translation = await openai.audio.translations.create({
  file: fs.createReadStream('/path/to/foreign-audio.mp3'),
  model: 'whisper-1',
  response_format: 'json'
})

console.log('Translated text:', translation.text)

// Create multilingual subtitles
const createMultilingualSubtitles = async (audioPath: string) => {
  // Original transcription
  const original = await openai.audio.transcriptions.create({
    file: fs.createReadStream(audioPath),
    model: 'whisper-1',
    response_format: 'srt',
    language: 'en'
  })
  
  // Translate to other languages via GPT
  const languages = ['es', 'fr', 'de', 'ja', 'ru']
  const translations = {}
  
  for (const lang of languages) {
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{
        role: 'user',
        content: `Translate these subtitles to ${lang}, keep SRT format:\n\n${original}`
      }],
      temperature: 0.3
    })
    
    translations[lang] = response.choices[0].message.content
  }
  
  return { original, ...translations }
}
```

## Image Generation (DALL-E)

### Creating Images

```typescript
// Generate image
const imageResponse = await openai.images.generate({
  model: 'dall-e-3',
  prompt: 'Futuristic video editing studio with holographic screens, cinematic style, 4K',
  n: 1,
  size: '1024x1024', // '1024x1024' | '1792x1024' | '1024x1792'
  quality: 'hd', // 'standard' | 'hd'
  style: 'vivid' // 'vivid' | 'natural'
})

const imageUrl = imageResponse.data[0].url

// Save image
const saveImage = async (url: string, path: string) => {
  const response = await fetch(url)
  const buffer = await response.arrayBuffer()
  await fs.writeFile(path, Buffer.from(buffer))
}

// Generate video thumbnail
const generateVideoThumbnail = async (videoDescription: string) => {
  const prompt = `Create an attractive thumbnail for video: "${videoDescription}". 
  Style: bright, eye-catching, professional.
  Include title text if appropriate.`
  
  const response = await openai.images.generate({
    model: 'dall-e-3',
    prompt: prompt,
    size: '1792x1024', // 16:9 for YouTube
    quality: 'hd'
  })
  
  return response.data[0].url
}
```

### Image Editing

```typescript
// Edit with mask (DALL-E 2)
const editResponse = await openai.images.edit({
  model: 'dall-e-2',
  image: fs.createReadStream('/path/to/image.png'),
  mask: fs.createReadStream('/path/to/mask.png'),
  prompt: 'Add professional lighting and color correction',
  n: 1,
  size: '1024x1024'
})

// Image variations
const variations = await openai.images.createVariation({
  model: 'dall-e-2',
  image: fs.createReadStream('/path/to/original.png'),
  n: 4,
  size: '1024x1024'
})
```

## Assistants API

### Creating Assistant

```typescript
// Create specialized assistant
const assistant = await openai.beta.assistants.create({
  name: 'Timeline Studio Expert',
  instructions: `You are a video editing expert in Timeline Studio. 
  You help users with:
  - Editing techniques
  - Effect selection
  - Workflow optimization
  - Technical problem solving`,
  model: 'gpt-4-turbo-preview',
  tools: [
    { type: 'code_interpreter' },
    { type: 'retrieval' },
    {
      type: 'function',
      function: {
        name: 'get_timeline_state',
        description: 'Gets current timeline state',
        parameters: {
          type: 'object',
          properties: {}
        }
      }
    }
  ]
})

// Upload documentation
const file = await openai.files.create({
  file: fs.createReadStream('/docs/timeline-studio-manual.pdf'),
  purpose: 'assistants'
})

await openai.beta.assistants.files.create(assistant.id, {
  file_id: file.id
})
```

### Using Assistant

```typescript
// Create thread
const thread = await openai.beta.threads.create()

// Add message
await openai.beta.threads.messages.create(thread.id, {
  role: 'user',
  content: 'How do I create a glitch effect?'
})

// Run assistant
const run = await openai.beta.threads.runs.create(thread.id, {
  assistant_id: assistant.id
})

// Wait for completion
while (true) {
  const runStatus = await openai.beta.threads.runs.retrieve(
    thread.id, 
    run.id
  )
  
  if (runStatus.status === 'completed') {
    break
  } else if (runStatus.status === 'requires_action') {
    // Handle function calls
    const toolCalls = runStatus.required_action.submit_tool_outputs.tool_calls
    const toolOutputs = []
    
    for (const toolCall of toolCalls) {
      const result = await executeFunction(
        toolCall.function.name,
        JSON.parse(toolCall.function.arguments)
      )
      
      toolOutputs.push({
        tool_call_id: toolCall.id,
        output: JSON.stringify(result)
      })
    }
    
    await openai.beta.threads.runs.submitToolOutputs(
      thread.id,
      run.id,
      { tool_outputs: toolOutputs }
    )
  }
  
  await delay(1000)
}

// Get response
const messages = await openai.beta.threads.messages.list(thread.id)
const lastMessage = messages.data[0]
console.log(lastMessage.content[0].text.value)
```

## Embeddings

### Semantic Search

```typescript
// Create embeddings for search
const createEmbeddings = async (texts: string[]) => {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: texts,
    encoding_format: 'float'
  })
  
  return response.data.map(item => item.embedding)
}

// Find similar videos
const findSimilarVideos = async (
  queryDescription: string,
  videoDatabase: VideoMetadata[]
) => {
  // Query embedding
  const queryEmbedding = await createEmbeddings([queryDescription])
  
  // Video embeddings (better to pre-compute)
  const videoDescriptions = videoDatabase.map(v => v.description)
  const videoEmbeddings = await createEmbeddings(videoDescriptions)
  
  // Calculate cosine similarity
  const similarities = videoEmbeddings.map((embedding, index) => ({
    video: videoDatabase[index],
    similarity: cosineSimilarity(queryEmbedding[0], embedding)
  }))
  
  // Sort by similarity
  return similarities
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, 10)
}

// Cosine similarity function
const cosineSimilarity = (a: number[], b: number[]) => {
  const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0)
  const normA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0))
  const normB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0))
  return dotProduct / (normA * normB)
}
```

## Fine-tuning

### Data Preparation

```typescript
// Prepare training data
const prepareTrainingData = async (examples: TrainingExample[]) => {
  const jsonlData = examples.map(example => 
    JSON.stringify({
      messages: [
        {
          role: 'system',
          content: 'You are a Timeline Studio expert'
        },
        {
          role: 'user',
          content: example.prompt
        },
        {
          role: 'assistant',
          content: example.completion
        }
      ]
    })
  ).join('\n')
  
  // Save to file
  await fs.writeFile('training_data.jsonl', jsonlData)
  
  // Upload file
  const file = await openai.files.create({
    file: fs.createReadStream('training_data.jsonl'),
    purpose: 'fine-tune'
  })
  
  return file.id
}

// Create fine-tuning job
const createFineTuningJob = async (fileId: string) => {
  const job = await openai.fineTuning.jobs.create({
    training_file: fileId,
    model: 'gpt-3.5-turbo',
    hyperparameters: {
      n_epochs: 3,
      batch_size: 4,
      learning_rate_multiplier: 0.1
    }
  })
  
  // Monitor progress
  while (true) {
    const status = await openai.fineTuning.jobs.retrieve(job.id)
    console.log(`Status: ${status.status}`)
    
    if (status.status === 'succeeded') {
      console.log(`Model ready: ${status.fine_tuned_model}`)
      break
    } else if (status.status === 'failed') {
      console.error('Fine-tuning failed:', status.error)
      break
    }
    
    await delay(60000) // Check every minute
  }
  
  return job
}
```

## Streaming

### Streaming Responses

```typescript
// Streaming chat completion
const streamChat = async (
  messages: ChatMessage[],
  onToken: (token: string) => void
) => {
  const stream = await openai.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: messages,
    stream: true,
    temperature: 0.7
  })
  
  let fullResponse = ''
  
  for await (const chunk of stream) {
    const token = chunk.choices[0]?.delta?.content || ''
    fullResponse += token
    onToken(token)
  }
  
  return fullResponse
}

// UI usage
const response = await streamChat(
  conversation,
  (token) => {
    // Update UI in real-time
    appendToChat(token)
  }
)
```

## Error Handling

```typescript
// Handle OpenAI API errors
const makeOpenAIRequest = async <T>(
  requestFn: () => Promise<T>
): Promise<T> => {
  try {
    return await requestFn()
  } catch (error) {
    if (error.status === 429) {
      // Rate limit
      const retryAfter = error.headers?.['retry-after'] || 60
      console.log(`Rate limited. Retry in ${retryAfter}s`)
      await delay(retryAfter * 1000)
      return await requestFn()
    } else if (error.status === 401) {
      throw new Error('Invalid OpenAI API key')
    } else if (error.status === 503) {
      // Service unavailable
      console.log('OpenAI temporarily unavailable, retrying...')
      await delay(5000)
      return await requestFn()
    } else if (error.code === 'context_length_exceeded') {
      // Context limit exceeded
      throw new Error('Message too long. Reduce context.')
    }
    
    throw error
  }
}

// Fallback strategies
const withFallback = async (primaryModel: string, messages: any[]) => {
  const fallbackModels = {
    'gpt-4-turbo-preview': 'gpt-4',
    'gpt-4': 'gpt-3.5-turbo',
    'gpt-3.5-turbo': 'gpt-3.5-turbo-16k'
  }
  
  try {
    return await openai.chat.completions.create({
      model: primaryModel,
      messages
    })
  } catch (error) {
    if (error.code === 'model_not_found' || error.code === 'context_length_exceeded') {
      const fallback = fallbackModels[primaryModel]
      if (fallback) {
        console.log(`Switching to ${fallback}`)
        return await openai.chat.completions.create({
          model: fallback,
          messages
        })
      }
    }
    throw error
  }
}
```

## Limits and Recommendations

### Model Limits

| Model | Context | Max Tokens | RPM | TPM |
|-------|---------|------------|-----|-----|
| GPT-4 Turbo | 128K | 4096 | 10000 | 2M |
| GPT-4 | 8K | 4096 | 10000 | 300K |
| GPT-3.5 Turbo | 16K | 4096 | 10000 | 2M |
| DALL-E 3 | - | - | 5 | - |
| Whisper | 25MB file | - | 50 | - |

### Pricing

- **GPT-4 Turbo**: $0.01 / 1K input, $0.03 / 1K output tokens
- **GPT-4**: $0.03 / 1K input, $0.06 / 1K output tokens
- **GPT-3.5 Turbo**: $0.0005 / 1K input, $0.0015 / 1K output tokens
- **DALL-E 3**: $0.04-0.08 per image
- **Whisper**: $0.006 / minute

### Recommendations

1. **Use streaming** for better UX
2. **Cache responses** to save costs
3. **Optimize prompts** - be concise and clear
4. **Use function calling** for integrations
5. **Monitor usage** through dashboard
6. **Set up retry logic** for reliability
7. **Use embeddings** for semantic search

---

*Last updated: July 31, 2025*
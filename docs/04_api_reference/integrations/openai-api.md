# OpenAI API Integration

## Обзор

Интеграция с OpenAI API предоставляет доступ к семейству моделей GPT-4, DALL-E для генерации изображений, Whisper для транскрипции аудио и другим передовым AI инструментам для улучшения возможностей Timeline Studio.

## Настройка

### Получение API ключа

1. Зарегистрируйтесь на [platform.openai.com](https://platform.openai.com)
2. Перейдите в раздел API Keys
3. Создайте новый секретный ключ
4. Настройте лимиты использования и биллинг
5. Сохраните ключ в безопасном месте

### Конфигурация в приложении

```typescript
import { createLogger } from '@/lib/tauri-logger'
const logger = createLogger('OpenaiApi')

// Инициализация OpenAI клиента
const openai = await initializeOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  organization: process.env.OPENAI_ORG_ID, // Опционально
  // Дополнительные настройки
  maxRetries: 3,
  timeout: 60000, // 60 секунд
  dangerouslyAllowBrowser: false // Только для backend
})

// Проверка подключения
const models = await openai.models.list()
logger.infoSync('Доступные модели:', models.data.map(m => m.id))
```

## Модели GPT

### Доступные модели

```typescript
// GPT-4 семейство
const models = {
  // Самая мощная модель с vision
  'gpt-4-turbo': {
    name: 'gpt-4-turbo-preview',
    context: 128000,
    vision: true,
    maxOutput: 4096
  },
  
  // Стандартная GPT-4
  'gpt-4': {
    name: 'gpt-4',
    context: 8192,
    vision: false,
    maxOutput: 4096
  },
  
  // Быстрая и экономичная
  'gpt-3.5-turbo': {
    name: 'gpt-3.5-turbo',
    context: 16385,
    vision: false,
    maxOutput: 4096
  }
}

// Выбор модели по задаче
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
import { createLogger } from '@/lib/tauri-logger'
const logger = createLogger('OpenaiApi')

// Базовый запрос
const response = await openai.chat.completions.create({
  model: 'gpt-4-turbo-preview',
  messages: [
    {
      role: 'system',
      content: 'Ты - эксперт по видеомонтажу в Timeline Studio.'
    },
    {
      role: 'user',
      content: 'Как создать эффект slow motion?'
    }
  ],
  temperature: 0.7,
  max_tokens: 1000
})

logger.infoSync(response.choices[0].message.content)

// С изображениями (Vision)
const visionResponse = await openai.chat.completions.create({
  model: 'gpt-4-turbo-preview',
  messages: [
    {
      role: 'user',
      content: [
        {
          type: 'text',
          text: 'Проанализируй композицию этого кадра'
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
// Определение функций для GPT
const tools = [
  {
    type: 'function',
    function: {
      name: 'apply_video_effect',
      description: 'Применяет видеоэффект к клипу',
      parameters: {
        type: 'object',
        properties: {
          clipId: {
            type: 'string',
            description: 'ID клипа на таймлайне'
          },
          effectType: {
            type: 'string',
            enum: ['blur', 'sharpen', 'colorGrade', 'slowMotion'],
            description: 'Тип эффекта'
          },
          intensity: {
            type: 'number',
            description: 'Интенсивность эффекта (0-1)'
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
      description: 'Анализирует текущий таймлайн',
      parameters: {
        type: 'object',
        properties: {
          aspect: {
            type: 'string',
            enum: ['pacing', 'transitions', 'colorConsistency'],
            description: 'Аспект анализа'
          }
        }
      }
    }
  }
]

// Использование с функциями
const response = await openai.chat.completions.create({
  model: 'gpt-4-turbo-preview',
  messages: [
    {
      role: 'user',
      content: 'Добавь размытие к первому клипу'
    }
  ],
  tools: tools,
  tool_choice: 'auto'
})

// Обработка вызова функции
if (response.choices[0].message.tool_calls) {
  for (const toolCall of response.choices[0].message.tool_calls) {
    const functionName = toolCall.function.name
    const args = JSON.parse(toolCall.function.arguments)
    
    // Выполнение функции
    const result = await executeFunction(functionName, args)
    
    // Отправка результата обратно
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

## Транскрипция аудио (Whisper)

### Базовая транскрипция

```typescript
import { createLogger } from '@/lib/tauri-logger'
const logger = createLogger('OpenaiApi')

// Транскрипция аудио файла
const transcription = await openai.audio.transcriptions.create({
  file: fs.createReadStream('/path/to/audio.mp3'),
  model: 'whisper-1',
  language: 'ru', // Опционально
  response_format: 'json', // 'json' | 'text' | 'srt' | 'vtt'
  prompt: 'Видео о монтаже в Timeline Studio' // Контекст
})

logger.infoSync(transcription.text)

// С временными метками
const verboseTranscription = await openai.audio.transcriptions.create({
  file: audioFile,
  model: 'whisper-1',
  response_format: 'verbose_json',
  timestamp_granularities: ['word', 'segment']
})

// Обработка сегментов
verboseTranscription.segments.forEach(segment => {
  logger.infoSync(`[${segment.start} - ${segment.end}] ${segment.text}`)
})
```

### Перевод аудио

```typescript
import { createLogger } from '@/lib/tauri-logger'
const logger = createLogger('OpenaiApi')

// Перевод на английский
const translation = await openai.audio.translations.create({
  file: fs.createReadStream('/path/to/russian-audio.mp3'),
  model: 'whisper-1',
  response_format: 'json'
})

logger.infoSync('Переведенный текст:', translation.text)

// Создание многоязычных субтитров
const createMultilingualSubtitles = async (audioPath: string) => {
  // Оригинальная транскрипция
  const original = await openai.audio.transcriptions.create({
    file: fs.createReadStream(audioPath),
    model: 'whisper-1',
    response_format: 'srt',
    language: 'ru'
  })
  
  // Перевод на английский
  const englishTranslation = await openai.audio.translations.create({
    file: fs.createReadStream(audioPath),
    model: 'whisper-1',
    response_format: 'srt'
  })
  
  // Перевод на другие языки через GPT
  const languages = ['es', 'fr', 'de', 'ja']
  const translations = {}
  
  for (const lang of languages) {
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{
        role: 'user',
        content: `Переведи эти субтитры на ${lang}, сохрани формат SRT:\n\n${original}`
      }],
      temperature: 0.3
    })
    
    translations[lang] = response.choices[0].message.content
  }
  
  return { original, english: englishTranslation, ...translations }
}
```

## Генерация изображений (DALL-E)

### Создание изображений

```typescript
// Генерация изображения
const imageResponse = await openai.images.generate({
  model: 'dall-e-3',
  prompt: 'Футуристическая студия видеомонтажа с голографическими экранами, кинематографичный стиль, 4K',
  n: 1,
  size: '1024x1024', // '1024x1024' | '1792x1024' | '1024x1792'
  quality: 'hd', // 'standard' | 'hd'
  style: 'vivid' // 'vivid' | 'natural'
})

const imageUrl = imageResponse.data[0].url

// Сохранение изображения
const saveImage = async (url: string, path: string) => {
  const response = await fetch(url)
  const buffer = await response.arrayBuffer()
  await fs.writeFile(path, Buffer.from(buffer))
}

// Генерация превью для видео
const generateVideoThumbnail = async (videoDescription: string) => {
  const prompt = `Создай привлекательную миниатюру для видео: "${videoDescription}". 
  Стиль: яркий, привлекающий внимание, профессиональный.
  Включи текст заголовка если уместно.`
  
  const response = await openai.images.generate({
    model: 'dall-e-3',
    prompt: prompt,
    size: '1792x1024', // 16:9 для YouTube
    quality: 'hd'
  })
  
  return response.data[0].url
}
```

### Редактирование изображений

```typescript
// Редактирование с маской (DALL-E 2)
const editResponse = await openai.images.edit({
  model: 'dall-e-2',
  image: fs.createReadStream('/path/to/image.png'),
  mask: fs.createReadStream('/path/to/mask.png'),
  prompt: 'Добавь профессиональное освещение и цветокоррекцию',
  n: 1,
  size: '1024x1024'
})

// Вариации изображения
const variations = await openai.images.createVariation({
  model: 'dall-e-2',
  image: fs.createReadStream('/path/to/original.png'),
  n: 4,
  size: '1024x1024'
})
```

## Assistants API

### Создание ассистента

```typescript
// Создание специализированного ассистента
const assistant = await openai.beta.assistants.create({
  name: 'Timeline Studio Expert',
  instructions: `Ты - эксперт по видеомонтажу в Timeline Studio. 
  Помогаешь пользователям с:
  - Техниками монтажа
  - Выбором эффектов
  - Оптимизацией workflow
  - Решением технических проблем`,
  model: 'gpt-4-turbo-preview',
  tools: [
    { type: 'code_interpreter' },
    { type: 'retrieval' },
    {
      type: 'function',
      function: {
        name: 'get_timeline_state',
        description: 'Получает текущее состояние таймлайна',
        parameters: {
          type: 'object',
          properties: {}
        }
      }
    }
  ]
})

// Загрузка документации
const file = await openai.files.create({
  file: fs.createReadStream('/docs/timeline-studio-manual.pdf'),
  purpose: 'assistants'
})

await openai.beta.assistants.files.create(assistant.id, {
  file_id: file.id
})
```

### Использование ассистента

```typescript
import { createLogger } from '@/lib/tauri-logger'
const logger = createLogger('OpenaiApi')

// Создание треда
const thread = await openai.beta.threads.create()

// Добавление сообщения
await openai.beta.threads.messages.create(thread.id, {
  role: 'user',
  content: 'Как создать эффект glitch?'
})

// Запуск ассистента
const run = await openai.beta.threads.runs.create(thread.id, {
  assistant_id: assistant.id
})

// Ожидание завершения
while (true) {
  const runStatus = await openai.beta.threads.runs.retrieve(
    thread.id, 
    run.id
  )
  
  if (runStatus.status === 'completed') {
    break
  } else if (runStatus.status === 'requires_action') {
    // Обработка вызовов функций
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

// Получение ответа
const messages = await openai.beta.threads.messages.list(thread.id)
const lastMessage = messages.data[0]
logger.infoSync(lastMessage.content[0].text.value)
```

## Embeddings

### Семантический поиск

```typescript
// Создание embeddings для поиска
const createEmbeddings = async (texts: string[]) => {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: texts,
    encoding_format: 'float'
  })
  
  return response.data.map(item => item.embedding)
}

// Поиск похожих видео
const findSimilarVideos = async (
  queryDescription: string,
  videoDatabase: VideoMetadata[]
) => {
  // Embedding запроса
  const queryEmbedding = await createEmbeddings([queryDescription])
  
  // Embeddings всех видео (лучше предварительно вычислить)
  const videoDescriptions = videoDatabase.map(v => v.description)
  const videoEmbeddings = await createEmbeddings(videoDescriptions)
  
  // Вычисление косинусного сходства
  const similarities = videoEmbeddings.map((embedding, index) => ({
    video: videoDatabase[index],
    similarity: cosineSimilarity(queryEmbedding[0], embedding)
  }))
  
  // Сортировка по сходству
  return similarities
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, 10)
}

// Функция косинусного сходства
const cosineSimilarity = (a: number[], b: number[]) => {
  const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0)
  const normA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0))
  const normB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0))
  return dotProduct / (normA * normB)
}
```

## Fine-tuning

### Подготовка данных

```typescript
import { createLogger } from '@/lib/tauri-logger'
const logger = createLogger('OpenaiApi')

// Подготовка данных для fine-tuning
const prepareTrainingData = async (examples: TrainingExample[]) => {
  const jsonlData = examples.map(example => 
    JSON.stringify({
      messages: [
        {
          role: 'system',
          content: 'Ты - эксперт Timeline Studio'
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
  
  // Сохранение в файл
  await fs.writeFile('training_data.jsonl', jsonlData)
  
  // Загрузка файла
  const file = await openai.files.create({
    file: fs.createReadStream('training_data.jsonl'),
    purpose: 'fine-tune'
  })
  
  return file.id
}

// Создание fine-tuning задачи
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
  
  // Мониторинг прогресса
  while (true) {
    const status = await openai.fineTuning.jobs.retrieve(job.id)
    logger.infoSync(`Статус: ${status.status}`)
    
    if (status.status === 'succeeded') {
      logger.infoSync(`Модель готова: ${status.fine_tuned_model}`)
      break
    } else if (status.status === 'failed') {
      logger.errorSync('Fine-tuning failed:', status.error)
      break
    }
    
    await delay(60000) // Проверка каждую минуту
  }
  
  return job
}
```

## Streaming

### Потоковые ответы

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

// Использование в UI
const response = await streamChat(
  conversation,
  (token) => {
    // Обновление UI в реальном времени
    appendToChat(token)
  }
)
```

## Обработка ошибок

```typescript
import { createLogger } from '@/lib/tauri-logger'
const logger = createLogger('OpenaiApi')

// Обработка ошибок OpenAI API
const makeOpenAIRequest = async <T>(
  requestFn: () => Promise<T>
): Promise<T> => {
  try {
    return await requestFn()
  } catch (error) {
    if (error.status === 429) {
      // Rate limit
      const retryAfter = error.headers?.['retry-after'] || 60
      logger.infoSync(`Rate limited. Повтор через ${retryAfter}s`)
      await delay(retryAfter * 1000)
      return await requestFn()
    } else if (error.status === 401) {
      throw new Error('Неверный API ключ OpenAI')
    } else if (error.status === 503) {
      // Service unavailable
      logger.infoSync('OpenAI временно недоступен, повтор...')
      await delay(5000)
      return await requestFn()
    } else if (error.code === 'context_length_exceeded') {
      // Превышен лимит контекста
      throw new Error('Сообщение слишком длинное. Сократите контекст.')
    }
    
    throw error
  }
}

// Резервные стратегии
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
        logger.infoSync(`Переключение на ${fallback}`)
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

## Лимиты и рекомендации

### Лимиты моделей

| Модель | Контекст | Макс. токенов | RPM | TPM |
|--------|----------|---------------|-----|-----|
| GPT-4 Turbo | 128K | 4096 | 10000 | 2M |
| GPT-4 | 8K | 4096 | 10000 | 300K |
| GPT-3.5 Turbo | 16K | 4096 | 10000 | 2M |
| DALL-E 3 | - | - | 5 | - |
| Whisper | 25MB файл | - | 50 | - |

### Стоимость

- **GPT-4 Turbo**: $0.01 / 1K входных, $0.03 / 1K выходных токенов
- **GPT-4**: $0.03 / 1K входных, $0.06 / 1K выходных токенов
- **GPT-3.5 Turbo**: $0.0005 / 1K входных, $0.0015 / 1K выходных токенов
- **DALL-E 3**: $0.04-0.08 за изображение
- **Whisper**: $0.006 / минута

### Рекомендации

1. **Используйте streaming** для лучшего UX
2. **Кэшируйте ответы** для экономии
3. **Оптимизируйте промпты** - краткость и ясность
4. **Используйте function calling** для интеграций
5. **Мониторьте использование** через dashboard
6. **Настройте retry логику** для надежности
7. **Используйте embeddings** для семантического поиска

---

*Последнее обновление: 31 июля 2025*
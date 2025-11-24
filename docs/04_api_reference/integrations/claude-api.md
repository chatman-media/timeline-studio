# Claude API Integration

## Обзор

Интеграция с Claude API (Anthropic) предоставляет доступ к передовым возможностям искусственного интеллекта для анализа видео, генерации описаний, создания субтитров, умного монтажа и интерактивного ассистента в Timeline Studio.

## Настройка

### Получение API ключа

1. Зарегистрируйтесь на [console.anthropic.com](https://console.anthropic.com)
2. Создайте новый API ключ в разделе API Keys
3. Сохраните ключ в безопасном месте
4. Настройте лимиты использования (опционально)

### Конфигурация в приложении

```typescript
// Инициализация Claude клиента
const claude = await initializeClaude({
  apiKey: process.env.ANTHROPIC_API_KEY,
  // Опциональные настройки
  maxRetries: 3,
  timeout: 30000, // 30 секунд
  baseURL: 'https://api.anthropic.com', // Или прокси
  defaultModel: 'claude-3-opus-20240229'
})

// Проверка подключения
const test = await claude.messages.create({
  model: 'claude-3-opus-20240229',
  max_tokens: 100,
  messages: [{ role: 'user', content: 'Hello!' }]
})
```

## Модели Claude

### Доступные модели

```typescript
// Claude 3 семейство
const models = {
  // Самая мощная модель
  opus: 'claude-3-opus-20240229',
  
  // Баланс производительности и стоимости
  sonnet: 'claude-3-sonnet-20240229',
  
  // Самая быстрая и экономичная
  haiku: 'claude-3-haiku-20240307',
  
  // Предыдущие версии
  claude2: 'claude-2.1',
  instant: 'claude-instant-1.2'
}

// Выбор модели по задаче
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

## Анализ видео

### Описание видео контента

```typescript
// Генерация описания видео
const analyzeVideo = async (videoPath: string) => {
  // Извлечение ключевых кадров
  const frames = await extractKeyFrames(videoPath, {
    count: 10,
    format: 'base64'
  })
  
  // Анализ через Claude Vision
  const analysis = await claude.messages.create({
    model: 'claude-3-opus-20240229',
    max_tokens: 2000,
    messages: [{
      role: 'user',
      content: [
        {
          type: 'text',
          text: 'Проанализируй это видео и предоставь детальное описание. Опиши сцены, действия, объекты, настроение и общую тематику.'
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

// Определение ключевых моментов
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
          text: 'Определи ключевые моменты в этом видео. Для каждого момента укажи временную метку и описание. Формат ответа: JSON массив с полями timestamp и description.'
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

### Генерация метаданных

```typescript
// Автоматическая генерация тегов и описаний
const generateMetadata = async (videoAnalysis: string) => {
  const response = await claude.messages.create({
    model: 'claude-3-haiku-20240307',
    max_tokens: 500,
    messages: [{
      role: 'user',
      content: `На основе анализа видео: "${videoAnalysis}"
      
      Сгенерируй:
      1. Заголовок (до 100 символов)
      2. Описание для YouTube (до 5000 символов)
      3. Теги (20-30 релевантных тегов)
      4. Категорию YouTube
      5. Хештеги для социальных сетей
      
      Формат ответа: JSON`
    }]
  })
  
  return JSON.parse(response.content[0].text)
}

// SEO оптимизация
const optimizeForSEO = async (metadata: VideoMetadata) => {
  const response = await claude.messages.create({
    model: 'claude-3-sonnet-20240229',
    max_tokens: 800,
    messages: [{
      role: 'user',
      content: `Оптимизируй метаданные видео для SEO:
      
      Текущие данные:
      ${JSON.stringify(metadata, null, 2)}
      
      Улучши заголовок, описание и теги для максимальной видимости в поиске.
      Учти тренды и ключевые слова.`
    }]
  })
  
  return JSON.parse(response.content[0].text)
}
```

## Субтитры и транскрипция

### Генерация субтитров

```typescript
// Создание субтитров из аудио
const generateSubtitles = async (audioPath: string, language: string = 'ru') => {
  // Транскрипция через Whisper или другой сервис
  const transcription = await transcribeAudio(audioPath)
  
  // Улучшение и форматирование через Claude
  const response = await claude.messages.create({
    model: 'claude-3-sonnet-20240229',
    max_tokens: 4000,
    messages: [{
      role: 'user',
      content: `Преобразуй транскрипцию в профессиональные субтитры:
      
      Транскрипция:
      ${transcription.text}
      
      Временные метки:
      ${JSON.stringify(transcription.timestamps)}
      
      Требования:
      1. Исправь грамматические ошибки
      2. Добавь пунктуацию
      3. Разбей на читаемые фразы (макс 42 символа)
      4. Синхронизируй с временными метками
      5. Добавь [звуковые эффекты] где нужно
      
      Формат: SRT`
    }]
  })
  
  return response.content[0].text
}

// Перевод субтитров
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
      content: `Переведи субтитры с ${fromLang} на ${toLang}:
      
      ${subtitles}
      
      Требования:
      1. Сохрани временные метки
      2. Адаптируй длину строк под целевой язык
      3. Сохрани контекст и смысл
      4. Локализуй культурные отсылки
      5. Сохрани формат SRT`
    }]
  })
  
  return response.content[0].text
}
```

## Умный монтаж

### Анализ сцен для монтажа

```typescript
// Рекомендации по монтажу
const suggestEdits = async (videoAnalysis: VideoAnalysis) => {
  const response = await claude.messages.create({
    model: 'claude-3-opus-20240229',
    max_tokens: 2000,
    messages: [{
      role: 'user',
      content: `Проанализируй видео и дай рекомендации по монтажу:
      
      Анализ видео:
      ${JSON.stringify(videoAnalysis)}
      
      Предложи:
      1. Какие сцены можно вырезать
      2. Оптимальный порядок сцен
      3. Где добавить переходы
      4. Рекомендации по темпу
      5. Моменты для цветокоррекции
      6. Предложения по музыке
      
      Формат: JSON с детальными рекомендациями`
    }]
  })
  
  return JSON.parse(response.content[0].text)
}

// Автоматическая нарезка хайлайтов
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
      content: `На основе анализа видео создай план для ${targetDuration}-секундного highlight видео.
      
      Анализ: ${analysis}
      
      Выбери самые интересные моменты и укажи:
      - start_time
      - end_time
      - importance (1-10)
      - transition_type
      
      Формат: JSON массив`
    }]
  })
  
  return JSON.parse(response.content[0].text)
}
```

## Интерактивный ассистент

### Чат интеграция

```typescript
// Создание контекстного ассистента
class TimelineAssistant {
  private conversation: Message[] = []
  private projectContext: ProjectContext
  
  async initialize(project: Project) {
    this.projectContext = await this.buildContext(project)
    
    // Системный промпт
    this.conversation.push({
      role: 'system',
      content: `Ты - ассистент Timeline Studio. Помогаешь с монтажом видео.
      
      Контекст проекта:
      - Название: ${project.name}
      - Длительность: ${project.duration}
      - Треков: ${project.tracks.length}
      - Эффектов: ${project.effects.length}
      
      Твои возможности:
      - Анализ таймлайна
      - Рекомендации по монтажу
      - Помощь с эффектами
      - Оптимизация workflow
      - Обучение функциям`
    })
  }
  
  async sendMessage(message: string): Promise<string> {
    // Добавляем сообщение пользователя
    this.conversation.push({
      role: 'user',
      content: message
    })
    
    // Получаем ответ
    const response = await claude.messages.create({
      model: 'claude-3-sonnet-20240229',
      max_tokens: 1000,
      messages: this.conversation,
      // Добавляем инструменты
      tools: [
        {
          name: 'analyze_timeline',
          description: 'Анализирует текущий таймлайн',
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
          description: 'Предлагает эффект для выбранного клипа',
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
    
    // Обработка инструментов
    if (response.stop_reason === 'tool_use') {
      const toolUse = response.content.find(c => c.type === 'tool_use')
      const result = await this.executeTool(toolUse)
      
      // Добавляем результат инструмента
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
      
      // Получаем финальный ответ
      const finalResponse = await claude.messages.create({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 1000,
        messages: this.conversation
      })
      
      return finalResponse.content[0].text
    }
    
    // Добавляем ответ в историю
    this.conversation.push({
      role: 'assistant',
      content: response.content
    })
    
    return response.content[0].text
  }
}
```

### Контекстные подсказки

```typescript
// Генерация подсказок на основе действий
const generateContextualTips = async (
  userAction: UserAction,
  projectState: ProjectState
) => {
  const response = await claude.messages.create({
    model: 'claude-3-haiku-20240307',
    max_tokens: 300,
    messages: [{
      role: 'user',
      content: `Пользователь выполнил действие: ${userAction.type}
      
      Состояние проекта:
      ${JSON.stringify(projectState, null, 2)}
      
      Дай краткую полезную подсказку или совет.`
    }]
  })
  
  return response.content[0].text
}

// Обучающие материалы
const generateTutorial = async (feature: string) => {
  const response = await claude.messages.create({
    model: 'claude-3-sonnet-20240229',
    max_tokens: 1500,
    messages: [{
      role: 'user',
      content: `Создай пошаговое руководство по функции "${feature}" в Timeline Studio.
      
      Включи:
      1. Что делает функция
      2. Когда её использовать
      3. Пошаговая инструкция
      4. Советы и трюки
      5. Частые ошибки
      
      Формат: Markdown`
    }]
  })
  
  return response.content[0].text
}
```

## Обработка потоковых ответов

### Streaming API

```typescript
// Потоковые ответы для real-time взаимодействия
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

// Использование в UI
const assistantResponse = await streamResponse(
  userMessage,
  (chunk) => {
    // Обновляем UI в реальном времени
    updateChatBubble(chunk)
  }
)
```

## Управление контекстом

### Оптимизация токенов

```typescript
// Подсчет и оптимизация токенов
const optimizeContext = async (messages: Message[]) => {
  // Подсчет токенов (приблизительный)
  const countTokens = (text: string) => {
    return Math.ceil(text.length / 4)
  }
  
  const totalTokens = messages.reduce((sum, msg) => {
    const content = typeof msg.content === 'string' 
      ? msg.content 
      : JSON.stringify(msg.content)
    return sum + countTokens(content)
  }, 0)
  
  // Если превышаем лимит, суммаризируем старые сообщения
  if (totalTokens > 50000) {
    const oldMessages = messages.slice(0, -10)
    const recentMessages = messages.slice(-10)
    
    const summary = await claude.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 500,
      messages: [{
        role: 'user',
        content: `Суммаризируй эту беседу, сохранив ключевой контекст:
        ${JSON.stringify(oldMessages)}`
      }]
    })
    
    return [
      {
        role: 'system',
        content: `Предыдущий контекст: ${summary.content[0].text}`
      },
      ...recentMessages
    ]
  }
  
  return messages
}

// Сохранение истории
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

## Обработка ошибок

```typescript
import { createLogger } from '@/lib/tauri-logger'
const logger = createLogger('ClaudeApi')

// Обработка ошибок API
const makeClaudeRequest = async (requestFn: () => Promise<any>) => {
  try {
    return await requestFn()
  } catch (error) {
    if (error.status === 429) {
      // Rate limit
      logger.errorSync('Превышен лимит запросов')
      const retryAfter = error.headers?.['retry-after'] || 60
      await delay(retryAfter * 1000)
      return await requestFn() // Повтор
    } else if (error.status === 401) {
      logger.errorSync('Неверный API ключ')
      throw new Error('Проверьте API ключ Anthropic')
    } else if (error.status === 400) {
      logger.errorSync('Неверный запрос:', error.message)
      // Логирование для отладки
      logError('claude_api_error', error)
    } else if (error.status === 500) {
      logger.errorSync('Ошибка сервера Anthropic')
      // Fallback на другую модель
      return await fallbackRequest(requestFn)
    }
    
    throw error
  }
}

// Fallback стратегия
const fallbackRequest = async (originalRequest: () => Promise<any>) => {
  // Пробуем с другой моделью
  const modifiedRequest = () => {
    const req = originalRequest.toString()
    return eval(req.replace('claude-3-opus', 'claude-3-sonnet'))
  }
  
  return await modifiedRequest()
}
```

## Лимиты и рекомендации

### Лимиты API

| Параметр | Opus | Sonnet | Haiku |
|----------|------|--------|-------|
| Контекст | 200K токенов | 200K токенов | 200K токенов |
| Макс. ответ | 4096 токенов | 4096 токенов | 4096 токенов |
| Запросов/мин | 5 | 20 | 50 |
| Изображений | 20 | 20 | 20 |
| Размер изображения | 5MB | 5MB | 5MB |

### Стоимость

- **Opus**: $15 / 1M входных токенов, $75 / 1M выходных
- **Sonnet**: $3 / 1M входных токенов, $15 / 1M выходных  
- **Haiku**: $0.25 / 1M входных токенов, $1.25 / 1M выходных

### Рекомендации

1. **Используйте правильную модель** для задачи
2. **Кэшируйте ответы** для одинаковых запросов
3. **Оптимизируйте промпты** для экономии токенов
4. **Используйте streaming** для лучшего UX
5. **Храните контекст** между сессиями
6. **Мониторьте использование** через API

---

*Последнее обновление: 31 июля 2025*
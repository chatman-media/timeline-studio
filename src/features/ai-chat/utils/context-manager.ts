/**
 * Утилиты для управления размером контекста AI чатов
 */

import { AiMessage } from "@/domains/ai-core"

// Примерные лимиты токенов для разных моделей
const MODEL_CONTEXT_LIMITS = {
  "claude-4-sonnet": 200000,
  "claude-4-opus": 200000,
  "gpt-4": 32000,
  "gpt-4o": 128000,
  "gpt-3.5-turbo": 16000,
  o3: 128000,
} as const

// Примерное соотношение символов к токенам (1 токен ≈ 4 символа)
const CHARS_PER_TOKEN = 4

/**
 * Оценить количество токенов в тексте
 */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / CHARS_PER_TOKEN)
}

/**
 * Получить лимит контекста для модели
 */
export function getModelContextLimit(model: string): number {
  // Нормализуем название модели для поиска
  const normalizedModel = model.toLowerCase() as keyof typeof MODEL_CONTEXT_LIMITS
  return MODEL_CONTEXT_LIMITS[normalizedModel] || 16000 // По умолчанию 16k токенов
}

/**
 * Подсчитать общее количество токенов в сообщениях
 */
export function calculateMessagesTokens(messages: AiMessage[]): number {
  return messages.reduce((total, message) => {
    return total + estimateTokens(message.content)
  }, 0)
}

/**
 * Обрезать историю сообщений, чтобы уместиться в лимит контекста
 */
export function trimMessagesForContext(
  messages: AiMessage[],
  model: string,
  systemPrompt?: string,
  maxTokensForResponse = 2000,
): AiMessage[] {
  const contextLimit = getModelContextLimit(model)
  const systemTokens = systemPrompt ? estimateTokens(systemPrompt) : 0
  const availableTokens = contextLimit - systemTokens - maxTokensForResponse

  if (messages.length === 0) {
    return messages
  }

  // Всегда сохраняем последнее сообщение пользователя
  const lastUserMessage = messages[messages.length - 1]
  const lastUserTokens = estimateTokens(lastUserMessage.content)

  if (lastUserTokens >= availableTokens) {
    // Если даже последнее сообщение слишком большое, обрезаем его
    const maxChars = availableTokens * CHARS_PER_TOKEN - 100 // Оставляем запас
    return [
      {
        ...lastUserMessage,
        content: `${lastUserMessage.content.substring(0, maxChars)}...`,
      },
    ]
  }

  // Собираем сообщения, начиная с конца
  const result: AiMessage[] = [lastUserMessage]
  let totalTokens = lastUserTokens

  for (let i = messages.length - 2; i >= 0; i--) {
    const message = messages[i]
    const messageTokens = estimateTokens(message.content)

    if (totalTokens + messageTokens <= availableTokens) {
      result.unshift(message)
      totalTokens += messageTokens
    } else {
      break
    }
  }

  return result
}

/**
 * Сжать контекст, удаляя промежуточные сообщения
 */
export function compressContext(
  messages: AiMessage[],
  model: string,
  systemPrompt?: string,
  maxTokensForResponse = 2000,
): AiMessage[] {
  const contextLimit = getModelContextLimit(model)
  const systemTokens = systemPrompt ? estimateTokens(systemPrompt) : 0
  const availableTokens = contextLimit - systemTokens - maxTokensForResponse

  const currentTokens = calculateMessagesTokens(messages)

  if (currentTokens <= availableTokens) {
    return messages
  }

  // Если сообщений мало, просто обрезаем по токенам
  if (messages.length <= 10) {
    return trimMessagesForContext(messages, model, systemPrompt, maxTokensForResponse)
  }

  // Сохраняем первые 2 и последние 5 сообщений, сжимаем середину
  const firstMessages = messages.slice(0, 2)
  const lastMessages = messages.slice(-5)
  const middleMessages = messages.slice(2, -5)

  // Создаем сводку средних сообщений
  const middleSummary = {
    id: "summary",
    content: `[Сводка ${middleMessages.length} сообщений: обсуждались ${extractKeyTopics(middleMessages).join(", ")}]`,
    role: "assistant" as const,
    timestamp: new Date(),
  }

  const compressedMessages = [...firstMessages, middleSummary, ...lastMessages]

  // Проверяем, помещается ли сжатый контекст
  if (calculateMessagesTokens(compressedMessages) <= availableTokens) {
    return compressedMessages
  }

  // Если даже сжатый контекст слишком большой, используем обычную обрезку
  return trimMessagesForContext(compressedMessages, model, systemPrompt, maxTokensForResponse)
}

/**
 * Извлечь ключевые темы из сообщений для создания сводки
 */
function extractKeyTopics(messages: AiMessage[]): string[] {
  const topics: string[] = []

  // Ищем ключевые слова и фразы в сообщениях
  const keywordPatterns = [
    /timeline|таймлайн/i,
    /video|видео/i,
    /edit|монтаж|редактир/i,
    /effect|эффект/i,
    /filter|фильтр/i,
    /export|экспорт/i,
    /AI|ИИ|искусственный интеллект/i,
    /project|проект/i,
  ]

  const contentText = messages
    .map((m) => m.content)
    .join(" ")
    .toLowerCase()

  keywordPatterns.forEach((pattern) => {
    if (pattern.test(contentText)) {
      const match = contentText.match(pattern)
      if (match) {
        topics.push(match[0])
      }
    }
  })

  return topics.length > 0 ? topics.slice(0, 3) : ["общие вопросы"]
}

/**
 * Проверить, превышает ли контекст лимиты модели
 */
export function isContextOverLimit(
  messages: AiMessage[],
  model: string,
  systemPrompt?: string,
  maxTokensForResponse = 2000,
): boolean {
  const contextLimit = getModelContextLimit(model)
  const systemTokens = systemPrompt ? estimateTokens(systemPrompt) : 0
  const messagesTokens = calculateMessagesTokens(messages)
  const totalTokens = systemTokens + messagesTokens + maxTokensForResponse

  return totalTokens > contextLimit
}

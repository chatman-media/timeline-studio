/**
 * Оптимальная стратегия распределения AI моделей по задачам
 * Настроена для минимизации расходов при максимальной эффективности
 *
 * Бюджет: $19/месяц
 * Средняя цена: ~$2.95/1M токенов
 * Поддержка: ~640 пользователей с лимитом 10,000 токенов/месяц
 */

import { CLAUDE_MODELS } from "../providers/claude/claude-provider"
import { OPENAI_MODELS } from "../providers/openai/openai-provider"

export type TaskType =
  | "chat" // Простые диалоговые запросы
  | "subtitles" // Генерация субтитров
  | "videoAnalysis" // Анализ видео и сцен
  | "sceneDetection" // Определение сцен
  | "montagePlanning" // Планирование монтажа
  | "scriptGeneration" // Генерация сценариев
  | "platformOptimization" // Оптимизация для платформ
  | "contentClassification" // Классификация контента
  | "characterAnalysis" // Анализ персонажей
  | "multimodalAnalysis" // Мультимодальный анализ (vision)

export interface ModelStrategyConfig {
  primary: string // Основная модель
  fallback: string // Резервная модель
  premium?: string // Премиум модель для платных пользователей
  estimatedTokens: number // Ожидаемое количество токенов на запрос
  description: string
}

/**
 * Оптимальное распределение моделей по задачам
 *
 * Приоритеты:
 * 1. Claude Haiku - основная дешевая модель с отличным tool calling
 * 2. GPT-4o-mini - самая дешевая для простых задач
 * 3. GPT-4o - для сложных сценариев
 * 4. Claude Sonnet 4.5 - премиум для платных пользователей
 */
export const MODEL_STRATEGY: Record<TaskType, ModelStrategyConfig> = {
  // Простые задачи - используем самую дешевую модель
  chat: {
    primary: OPENAI_MODELS.GPT_4O_MINI,
    fallback: CLAUDE_MODELS.CLAUDE_3_HAIKU,
    premium: CLAUDE_MODELS.CLAUDE_4_SONNET_LATEST,
    estimatedTokens: 150,
    description: "Простые диалоговые запросы и подсказки",
  },

  // Субтитры - быстрая обработка с хорошим качеством
  subtitles: {
    primary: OPENAI_MODELS.GPT_4O_MINI,
    fallback: CLAUDE_MODELS.CLAUDE_3_HAIKU,
    premium: OPENAI_MODELS.GPT_4O,
    estimatedTokens: 1500,
    description: "Генерация и синхронизация субтитров",
  },

  // Анализ видео - нужны tools, используем Claude Haiku
  videoAnalysis: {
    primary: CLAUDE_MODELS.CLAUDE_3_HAIKU,
    fallback: OPENAI_MODELS.GPT_4O,
    premium: CLAUDE_MODELS.CLAUDE_4_SONNET_LATEST,
    estimatedTokens: 5000,
    description: "Анализ композиции, качества и содержания видео",
  },

  // Определение сцен - требует понимания контекста
  sceneDetection: {
    primary: CLAUDE_MODELS.CLAUDE_3_HAIKU,
    fallback: OPENAI_MODELS.GPT_4O,
    premium: CLAUDE_MODELS.CLAUDE_3_5_SONNET,
    estimatedTokens: 3000,
    description: "Автоматическое определение сцен и ключевых моментов",
  },

  // Планирование монтажа - сложная задача, нужна GPT-4o
  montagePlanning: {
    primary: OPENAI_MODELS.GPT_4O,
    fallback: CLAUDE_MODELS.CLAUDE_3_HAIKU,
    premium: CLAUDE_MODELS.CLAUDE_4_SONNET_LATEST,
    estimatedTokens: 8000,
    description: "Создание плана монтажа на основе материала",
  },

  // Генерация сценариев - креативная задача
  scriptGeneration: {
    primary: OPENAI_MODELS.GPT_4O,
    fallback: CLAUDE_MODELS.CLAUDE_3_5_SONNET,
    premium: CLAUDE_MODELS.CLAUDE_4_SONNET_LATEST,
    estimatedTokens: 6000,
    description: "Генерация сценариев и повествования",
  },

  // Оптимизация для платформ - нужны tools
  platformOptimization: {
    primary: CLAUDE_MODELS.CLAUDE_3_HAIKU,
    fallback: OPENAI_MODELS.GPT_4O,
    premium: CLAUDE_MODELS.CLAUDE_4_SONNET_LATEST,
    estimatedTokens: 4000,
    description: "Адаптация контента под TikTok, YouTube, Instagram и т.д.",
  },

  // Классификация контента - простая задача
  contentClassification: {
    primary: OPENAI_MODELS.GPT_4O_MINI,
    fallback: CLAUDE_MODELS.CLAUDE_3_HAIKU,
    premium: OPENAI_MODELS.GPT_4O,
    estimatedTokens: 800,
    description: "Категоризация и тегирование контента",
  },

  // Анализ персонажей - средняя сложность
  characterAnalysis: {
    primary: CLAUDE_MODELS.CLAUDE_3_HAIKU,
    fallback: OPENAI_MODELS.GPT_4O_MINI,
    premium: CLAUDE_MODELS.CLAUDE_3_5_SONNET,
    estimatedTokens: 2500,
    description: "Определение и анализ персонажей в видео",
  },

  // Мультимодальный анализ - требуется vision
  multimodalAnalysis: {
    primary: OPENAI_MODELS.GPT_4O,
    fallback: CLAUDE_MODELS.CLAUDE_3_5_SONNET,
    premium: CLAUDE_MODELS.CLAUDE_4_SONNET_LATEST,
    estimatedTokens: 7000,
    description: "Анализ изображений и видео с vision models",
  },
}

/**
 * Получить оптимальную модель для задачи
 * @param task Тип задачи
 * @param isPremium Флаг premium пользователя
 * @returns ID модели для использования
 */
export function getOptimalModelForTask(task: TaskType, isPremium: boolean = false): string {
  const strategy = MODEL_STRATEGY[task]
  return isPremium && strategy.premium ? strategy.premium : strategy.primary
}

/**
 * Получить резервную модель для задачи
 * @param task Тип задачи
 * @returns ID fallback модели
 */
export function getFallbackModelForTask(task: TaskType): string {
  return MODEL_STRATEGY[task].fallback
}

/**
 * Расчет примерной стоимости на основе задач
 * @param usageStats Статистика использования по задачам
 * @returns Примерная стоимость в долларах
 */
export function estimateCost(usageStats: Partial<Record<TaskType, number>>): number {
  // Средние цены моделей (за 1M токенов)
  const modelCosts: Record<string, number> = {
    [OPENAI_MODELS.GPT_4O_MINI]: 0.375,
    [CLAUDE_MODELS.CLAUDE_3_HAIKU]: 0.75,
    [OPENAI_MODELS.GPT_4O]: 6.25,
    [CLAUDE_MODELS.CLAUDE_3_5_SONNET]: 9.0,
    [CLAUDE_MODELS.CLAUDE_4_SONNET_LATEST]: 9.0,
  }

  let totalCost = 0

  for (const [task, count] of Object.entries(usageStats)) {
    const strategy = MODEL_STRATEGY[task as TaskType]
    if (!strategy) continue

    const tokensUsed = strategy.estimatedTokens * count
    const modelCost = modelCosts[strategy.primary] || 5.0
    totalCost += (tokensUsed / 1_000_000) * modelCost
  }

  return totalCost
}

/**
 * Рассчитать максимальное количество пользователей на бюджет
 * @param monthlyBudget Месячный бюджет в долларах
 * @param tokensPerUser Токенов на пользователя в месяц
 * @returns Количество пользователей
 */
export function calculateMaxUsers(monthlyBudget: number, tokensPerUser: number = 10000): number {
  // Средняя цена с нашей стратегией: $2.95/1M токенов
  // (60% Claude Haiku + 40% GPT-4o)
  const averageCostPerMillionTokens = 2.95
  const totalTokens = (monthlyBudget / averageCostPerMillionTokens) * 1_000_000
  return Math.floor(totalTokens / tokensPerUser)
}

// Экспортируем для использования в UI
export const RECOMMENDED_MODELS_INFO = {
  budget: "$19/месяц",
  averageCost: "$2.95/1M токенов",
  maxUsers: calculateMaxUsers(19),
  tokensPerUser: 10000,
  primaryModels: [
    {
      name: "Claude Haiku",
      usage: "60% запросов",
      cost: "$0.75/1M",
      tasks: ["Анализ видео", "Определение сцен", "Оптимизация платформ"],
    },
    {
      name: "GPT-4o-mini",
      usage: "25% запросов",
      cost: "$0.375/1M",
      tasks: ["Чат", "Субтитры", "Классификация"],
    },
    {
      name: "GPT-4o",
      usage: "15% запросов",
      cost: "$6.25/1M",
      tasks: ["Планирование монтажа", "Генерация сценариев", "Vision"],
    },
  ],
}

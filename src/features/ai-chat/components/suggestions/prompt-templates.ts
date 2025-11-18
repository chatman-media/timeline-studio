/**
 * Шаблоны промтов для AI Suggestions Panel
 */

import type { SuggestedPrompt } from "./types"

/**
 * Универсальные промты - показываем всегда
 */
export const UNIVERSAL_PROMPTS: SuggestedPrompt[] = [
  {
    id: "tiktok-vertical",
    emoji: "📱",
    text: "Адаптируй для TikTok - вертикально, 60 секунд",
    category: "platform",
    priority: 10,
  },
  {
    id: "instagram-reels",
    emoji: "📱",
    text: "Создай Instagram Reels - квадрат, 30 сек",
    category: "platform",
    priority: 9,
  },
  {
    id: "youtube-short",
    emoji: "📺",
    text: "YouTube Short - вертикально, до 60 сек",
    category: "platform",
    priority: 8,
  },
  {
    id: "quick-teaser",
    emoji: "⚡",
    text: "Короткий тизер 30 сек из лучших моментов",
    category: "quick",
    priority: 7,
  },
  {
    id: "trailer",
    emoji: "🎬",
    text: "Создай трейлер на 45 секунд",
    category: "quick",
    priority: 6,
  },
  {
    id: "youtube-intro",
    emoji: "📺",
    text: "YouTube intro - 5-10 секунд",
    category: "quick",
    priority: 5,
  },
]

/**
 * Контекстные промты - показываем в зависимости от результатов анализа
 */
export const CONTEXTUAL_PROMPTS: SuggestedPrompt[] = [
  // Если есть музыка
  {
    id: "music-video-sync",
    emoji: "🎵",
    text: "Создай music video синхронно с ритмом",
    category: "style",
    priority: 15,
    requiredConditions: {
      hasMusic: true,
    },
  },
  {
    id: "music-cut-to-beat",
    emoji: "🎸",
    text: "Нарежь клип под бит музыки",
    category: "style",
    priority: 14,
    requiredConditions: {
      hasMusic: true,
    },
  },

  // Если много динамичных сцен
  {
    id: "dynamic-montage",
    emoji: "🎬",
    text: "Динамичный монтаж на 2 минуты",
    category: "style",
    priority: 13,
    requiredConditions: {
      minScenes: 10,
    },
  },
  {
    id: "fast-cuts",
    emoji: "⚡",
    text: "Энергичный ролик с быстрыми нарезками",
    category: "style",
    priority: 12,
    requiredConditions: {
      minScenes: 10,
    },
  },
  {
    id: "sport-style",
    emoji: "🏃",
    text: "Спортивный ролик с энергией",
    category: "style",
    priority: 11,
    requiredConditions: {
      minScenes: 8,
    },
  },

  // Если обнаружены лица
  {
    id: "focus-people",
    emoji: "👤",
    text: "Фокус на людях и эмоциях",
    category: "style",
    priority: 14,
    requiredConditions: {
      hasFaces: true,
    },
  },
  {
    id: "interview-style",
    emoji: "💬",
    text: "Интервью-стиль с говорящими",
    category: "style",
    priority: 13,
    requiredConditions: {
      hasFaces: true,
    },
  },

  // Если длинные красивые сцены
  {
    id: "cinematic",
    emoji: "🎞️",
    text: "Кинематографичный ролик с плавными переходами",
    category: "style",
    priority: 12,
    requiredConditions: {
      avgSceneDuration: 10, // секунд
    },
  },
  {
    id: "meditative",
    emoji: "🌅",
    text: "Медитативное видео с природой",
    category: "style",
    priority: 10,
    requiredConditions: {
      avgSceneDuration: 15,
    },
  },

  // Если низкое качество
  {
    id: "enhance-quality",
    emoji: "✨",
    text: "Улучши качество и создай монтаж",
    category: "quality",
    priority: 8,
    requiredConditions: {
      hasLowQuality: true,
    },
  },
  {
    id: "stabilize-color",
    emoji: "🎨",
    text: "Примени стабилизацию и цветокоррекцию",
    category: "quality",
    priority: 7,
    requiredConditions: {
      hasLowQuality: true,
    },
  },

  // Если есть речь
  {
    id: "vlog-style",
    emoji: "🎥",
    text: "Влог-стиль с разговорами",
    category: "style",
    priority: 11,
    requiredConditions: {
      hasSpeech: true,
    },
  },
  {
    id: "documentary",
    emoji: "📺",
    text: "Документальный стиль с нарративом",
    category: "style",
    priority: 10,
    requiredConditions: {
      hasSpeech: true,
      minScenes: 5,
    },
  },
]

/**
 * Промты для пустого состояния (нет медиа)
 */
export const EMPTY_STATE_PROMPTS: SuggestedPrompt[] = [
  {
    id: "help-import",
    emoji: "📥",
    text: "Как импортировать видео?",
    category: "universal",
    priority: 5,
  },
  {
    id: "help-start",
    emoji: "🎬",
    text: "С чего начать монтаж?",
    category: "universal",
    priority: 4,
  },
  {
    id: "help-features",
    emoji: "✨",
    text: "Что умеет Timeline Studio?",
    category: "universal",
    priority: 3,
  },
]

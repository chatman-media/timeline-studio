/**
 * Система распознавания намерений пользователя для AI чата
 * Анализирует сообщения и определяет тип запроса для правильной обработки
 */

// Типы намерений пользователя
export type UserIntent =
  // Основные операции с видео
  | "create_video"
  | "edit_video"
  | "analyze_video"

  // Работа с субтитрами
  | "generate_subtitles"
  | "translate_subtitles"
  | "edit_subtitles"

  // Автоматизация монтажа
  | "auto_cut"
  | "remove_pauses"
  | "color_correction"
  | "stabilization"
  | "apply_effects"

  // Работа с контентом
  | "generate_title"
  | "create_thumbnail"
  | "extract_metadata"
  | "platform_adaptation"

  // Помощь и навигация
  | "help_navigation"
  | "explain_feature"
  | "tutorial_request"

  // Обычное общение
  | "general_chat"

// Структура результата распознавания
export interface IntentResult {
  intent: UserIntent
  confidence: number
  entities: Record<string, any>
  suggestion?: string
}

// Правила для распознавания намерений
interface IntentRule {
  intent: UserIntent
  keywords: string[]
  patterns: RegExp[]
  weight: number
}

// База правил для распознавания намерений
const INTENT_RULES: IntentRule[] = [
  // Создание видео
  {
    intent: "create_video",
    keywords: ["создай", "сделай", "создать", "сгенерируй", "видео", "ролик", "клип"],
    patterns: [/создай\s+(.+)\s+видео/i, /сделай\s+(.+)\s+ролик/i, /создать\s+(.+)/i],
    weight: 1.0,
  },

  // Редактирование видео
  {
    intent: "edit_video",
    keywords: ["отредактируй", "измени", "обрежь", "склей", "добавь", "убери", "редактировать"],
    patterns: [/отредактируй\s+(.+)/i, /измени\s+(.+)/i, /обрежь\s+(.+)/i],
    weight: 1.0,
  },

  // Субтитры
  {
    intent: "generate_subtitles",
    keywords: ["субтитры", "титры", "добавь субтитры", "создай субтитры", "транскрипция"],
    patterns: [/добавь\s+субтитры/i, /создай\s+субтитры/i, /сгенерируй\s+субтитры/i],
    weight: 1.0,
  },

  {
    intent: "translate_subtitles",
    keywords: ["переведи", "перевод", "на английский", "на русский", "translate"],
    patterns: [/переведи\s+субтитры/i, /перевод\s+на\s+(\w+)/i],
    weight: 1.0,
  },

  // Автоматизация
  {
    intent: "auto_cut",
    keywords: ["нарежь", "разрежь", "разбей", "сегменты", "части", "сцены"],
    patterns: [/нарежь\s+(.+)/i, /разбей\s+на\s+(.+)/i, /разрежь\s+по\s+(.+)/i],
    weight: 1.0,
  },

  {
    intent: "remove_pauses",
    keywords: ["удали паузы", "убери паузы", "пауза", "тишина", "silence"],
    patterns: [/удали\s+паузы/i, /убери\s+(.+)\s+паузы/i, /удали\s+тишину/i],
    weight: 1.0,
  },

  {
    intent: "color_correction",
    keywords: ["цветокоррекция", "цвет", "яркость", "контраст", "насыщенность"],
    patterns: [/исправь\s+цвет/i, /цветокоррекция/i, /улучши\s+качество/i],
    weight: 1.0,
  },

  {
    intent: "apply_effects",
    keywords: ["эффект", "фильтр", "примени", "добавь эффект"],
    patterns: [/добавь\s+эффект\s+(.+)/i, /примени\s+(.+)/i, /добавь\s+фильтр\s+(.+)/i],
    weight: 1.0,
  },

  // Контент
  {
    intent: "generate_title",
    keywords: ["заголовок", "название", "title", "создай название"],
    patterns: [/создай\s+заголовок/i, /придумай\s+название/i, /сгенерируй\s+title/i],
    weight: 1.0,
  },

  {
    intent: "create_thumbnail",
    keywords: ["превью", "обложка", "thumbnail", "preview"],
    patterns: [/создай\s+превью/i, /сделай\s+обложку/i, /generate\s+thumbnail/i],
    weight: 1.0,
  },

  {
    intent: "platform_adaptation",
    keywords: ["youtube", "tiktok", "instagram", "адаптируй", "под платформу"],
    patterns: [/адаптируй\s+для\s+(\w+)/i, /под\s+(\w+)/i, /для\s+(youtube|tiktok|instagram)/i],
    weight: 1.0,
  },

  // Помощь
  {
    intent: "help_navigation",
    keywords: ["помощь", "как", "где", "найти", "help"],
    patterns: [/как\s+(.+)/i, /где\s+(.+)/i, /помоги\s+(.+)/i],
    weight: 0.8,
  },

  {
    intent: "explain_feature",
    keywords: ["что такое", "объясни", "расскажи", "explain"],
    patterns: [/что\s+такое\s+(.+)/i, /объясни\s+(.+)/i, /расскажи\s+о\s+(.+)/i],
    weight: 0.8,
  },

  // Общение (низкий приоритет)
  {
    intent: "general_chat",
    keywords: ["привет", "как дела", "спасибо", "пока"],
    patterns: [/^привет/i, /как\s+дела/i, /спасибо/i],
    weight: 0.5,
  },
]

/**
 * Сервис распознавания намерений
 */
export class IntentRecognitionService {
  private static instance: IntentRecognitionService

  private constructor() {}

  /**
   * Получить экземпляр сервиса (Singleton)
   */
  public static getInstance(): IntentRecognitionService {
    if (!IntentRecognitionService.instance) {
      IntentRecognitionService.instance = new IntentRecognitionService()
    }
    return IntentRecognitionService.instance
  }

  /**
   * Распознать намерение в тексте пользователя
   * @param text Текст сообщения пользователя
   * @returns Результат распознавания намерения
   */
  public recognizeIntent(text: string): IntentResult {
    const normalizedText = text.toLowerCase().trim()
    const scores = new Map<UserIntent, number>()
    const entities: Record<string, any> = {}

    // Проверяем каждое правило
    for (const rule of INTENT_RULES) {
      let score = 0

      // Проверка по ключевым словам
      for (const keyword of rule.keywords) {
        if (normalizedText.includes(keyword.toLowerCase())) {
          score += rule.weight * 0.3 // 30% веса за совпадение ключевого слова
        }
      }

      // Проверка по регулярным выражениям
      for (const pattern of rule.patterns) {
        const match = normalizedText.match(pattern)
        if (match) {
          score += rule.weight * 0.7 // 70% веса за совпадение паттерна

          // Извлекаем сущности из совпадений
          if (match.length > 1) {
            entities[rule.intent] = match.slice(1)
          }
        }
      }

      if (score > 0) {
        scores.set(rule.intent, (scores.get(rule.intent) || 0) + score)
      }
    }

    // Находим намерение с максимальным счетом
    let bestIntent: UserIntent = "general_chat"
    let maxScore = 0

    for (const [intent, score] of scores) {
      if (score > maxScore) {
        maxScore = score
        bestIntent = intent
      }
    }

    // Нормализуем уверенность (0-1)
    const confidence = Math.min(maxScore, 1.0)

    return {
      intent: bestIntent,
      confidence,
      entities,
      suggestion: this.generateSuggestion(bestIntent, entities),
    }
  }

  /**
   * Проверить, требует ли намерение специальной обработки
   * @param intent Намерение пользователя
   * @returns true, если намерение требует Timeline AI обработки
   */
  public requiresTimelineAI(intent: UserIntent): boolean {
    const timelineIntents: UserIntent[] = [
      "create_video",
      "edit_video",
      "analyze_video",
      "generate_subtitles",
      "translate_subtitles",
      "auto_cut",
      "remove_pauses",
      "color_correction",
      "stabilization",
      "apply_effects",
      "generate_title",
      "create_thumbnail",
      "platform_adaptation",
    ]

    return timelineIntents.includes(intent)
  }

  /**
   * Получить приоритет намерения для обработки
   * @param intent Намерение пользователя
   * @returns Приоритет (чем выше число, тем выше приоритет)
   */
  public getIntentPriority(intent: UserIntent): number {
    const priorities: Record<UserIntent, number> = {
      // Высокий приоритет - основные операции
      create_video: 10,
      edit_video: 10,
      analyze_video: 9,

      // Средне-высокий приоритет - автоматизация
      generate_subtitles: 8,
      auto_cut: 8,
      remove_pauses: 7,
      color_correction: 7,
      stabilization: 7,
      apply_effects: 7,

      // Средний приоритет - контент
      translate_subtitles: 6,
      edit_subtitles: 6,
      generate_title: 5,
      create_thumbnail: 5,
      extract_metadata: 5,
      platform_adaptation: 5,

      // Низкий приоритет - помощь
      help_navigation: 3,
      explain_feature: 3,
      tutorial_request: 3,

      // Минимальный приоритет - общение
      general_chat: 1,
    }

    return priorities[intent] || 1
  }

  /**
   * Сгенерировать предложение на основе намерения
   */
  private generateSuggestion(intent: UserIntent, _entities: Record<string, any>): string | undefined {
    const suggestions: Record<UserIntent, string | undefined> = {
      create_video: "Я могу помочь создать видео из ваших материалов. Опишите, какого типа видео вы хотите.",
      edit_video: "Расскажите, какие изменения нужно внести в видео, и я помогу с редактированием.",
      analyze_video: "Проанализирую ваше видео по качеству, сценам, движению или другим параметрам.",
      generate_subtitles: "Я создам субтитры для вашего видео. Укажите язык и нужные настройки.",
      translate_subtitles: "Переведу субтитры на нужный язык с сохранением тайминга.",
      edit_subtitles: "Отредактирую существующие субтитры по вашим требованиям.",
      auto_cut: "Я могу автоматически разрезать видео по сценам или паузам. Уточните критерии нарезки.",
      remove_pauses: "Удалю паузы длиннее указанного времени. Сколько секунд считать паузой?",
      color_correction: "Применю автоматическую цветокоррекцию или укажите конкретные настройки.",
      stabilization: "Применю стабилизацию для устранения дрожания камеры. Укажите уровень коррекции.",
      apply_effects: "Добавлю нужные эффекты к видео. Опишите желаемый результат.",
      generate_title: "Создам привлекательный заголовок для вашего видео на основе содержания.",
      create_thumbnail: "Сгенерирую привлекательную обложку для видео.",
      extract_metadata: "Извлеку метаданные из видеофайла (длительность, разрешение, кодеки и т.д.).",
      platform_adaptation: "Адаптирую видео под выбранную платформу с оптимальными параметрами.",
      help_navigation: "Расскажу, как пользоваться функциями видеоредактора. Что именно нужно найти?",
      explain_feature: "Объясню, как работает интересующая вас функция редактора.",
      tutorial_request: "Покажу пошаговое руководство по нужной функции.",
      general_chat: undefined, // Для обычного общения предложения не нужны
    }

    return suggestions[intent]
  }

  /**
   * Извлечь параметры из текста для конкретного намерения
   * @param text Исходный текст
   * @param intent Распознанное намерение
   * @returns Объект с извлеченными параметрами
   */
  public extractParameters(text: string, intent: UserIntent): Record<string, any> {
    const params: Record<string, any> = {}
    const normalizedText = text.toLowerCase()

    switch (intent) {
      case "remove_pauses": {
        // Ищем числа, которые могут означать длительность пауз
        const durationPattern = /(\d+)\s*(сек|секунд|с|seconds?)/i
        const durationMatch = durationPattern.exec(normalizedText)
        if (durationMatch) {
          params.pauseDuration = Number.parseInt(durationMatch[1])
        }
        break
      }

      case "platform_adaptation":
        // Определяем целевую платформу
        if (normalizedText.includes("youtube")) params.platform = "youtube"
        else if (normalizedText.includes("tiktok")) params.platform = "tiktok"
        else if (normalizedText.includes("instagram")) params.platform = "instagram"
        break

      case "generate_subtitles":
        // Определяем язык субтитров
        if (normalizedText.includes("английск")) params.language = "en"
        else if (normalizedText.includes("русск")) params.language = "ru"
        else if (normalizedText.includes("испанск")) params.language = "es"
        break

      case "create_video":
        // Определяем тип видео
        if (normalizedText.includes("свадеб")) params.videoType = "wedding"
        else if (normalizedText.includes("путешеств")) params.videoType = "travel"
        else if (normalizedText.includes("корпоратив")) params.videoType = "corporate"
        else if (normalizedText.includes("докумен")) params.videoType = "documentary"
        break

      default:
        // Для остальных намерений параметры не извлекаются
        break
    }

    return params
  }
}

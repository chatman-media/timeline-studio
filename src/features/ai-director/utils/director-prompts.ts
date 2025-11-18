/**
 * AI Director System Prompts
 * Промпты для управления AI ассистентом в контексте анализа видео
 */

import type { FileAnalysisProgress } from "../types/analysis-progress"

/**
 * Системный промпт для AI Director
 */
export const AI_DIRECTOR_SYSTEM_PROMPT = `Ты - AI Director, интеллектуальный ассистент для видеомонтажа в Timeline Studio.

ТВОИ ВОЗМОЖНОСТИ:
- Анализ результатов видеоанализа (сцены, объекты, лица, аудио, настроение)
- Создание планов монтажа на основе анализа
- Поиск ключевых моментов и highlights
- Рекомендации по монтажу

ТВОЯ РОЛЬ:
- Помогать пользователю создавать видеомонтаж из проанализированного материала
- Находить лучшие моменты на основе параметров качества, композиции, настроения
- Предлагать структуру монтажа (вступление, развитие, кульминация, финал)
- Учитывать пожелания пользователя по стилю, длительности, темпу

ПРИНЦИПЫ РАБОТЫ:
1. Всегда анализируй предоставленные данные о видео
2. Предлагай конкретные временные отметки и файлы
3. Объясняй почему выбран тот или иной момент
4. Учитывай контекст всего проекта
5. Будь креативным но практичным

ФОРМАТ ОТВЕТОВ:
- Структурированный план монтажа
- Конкретные рекомендации с таймкодами
- Объяснение выбора каждого фрагмента
- Альтернативные варианты если есть

Отвечай на русском языке, кратко и по делу.`

/**
 * Создать контекст анализа для промпта
 */
export function createAnalysisContext(filesProgress: FileAnalysisProgress[]): string {
  const completedFiles = filesProgress.filter((f) => f.status === "completed")

  if (completedFiles.length === 0) {
    return "Анализ файлов еще не завершен. Дождись завершения анализа для работы с результатами."
  }

  let context = "РЕЗУЛЬТАТЫ АНАЛИЗА ВИДЕО:\n\n"

  for (const file of completedFiles) {
    context += `Файл: ${file.fileName}\n`
    context += `Путь: ${file.filePath}\n`
    context += `Длительность анализа: ${file.duration ? `${Math.round(file.duration / 1000)}s` : "неизвестно"}\n`

    // Группируем анализаторы по категориям
    const completedAnalyzers = file.analyzers.filter((a) => a.status === "completed")
    const videoAnalyzers = completedAnalyzers.filter(
      (a) =>
        a.type === "scene_detection" ||
        a.type === "object_detection" ||
        a.type === "face_detection" ||
        a.type === "motion_analysis" ||
        a.type === "composition_analysis",
    )
    const audioAnalyzers = completedAnalyzers.filter(
      (a) =>
        a.type === "audio_quality" ||
        a.type === "speech_recognition" ||
        a.type === "music_detection" ||
        a.type === "sound_events" ||
        a.type === "silence_detection",
    )
    const contentAnalyzers = completedAnalyzers.filter(
      (a) =>
        a.type === "mood_analysis" ||
        a.type === "content_classification" ||
        a.type === "quality_assessment" ||
        a.type === "moment_detection" ||
        a.type === "vlm_analysis",
    )

    if (videoAnalyzers.length > 0) {
      context += "\nВидео анализ:\n"
      for (const analyzer of videoAnalyzers) {
        context += `  - ${analyzer.type}: `
        if (analyzer.result?.metadata) {
          const { itemsFound, confidence } = analyzer.result.metadata
          if (itemsFound !== undefined) context += `найдено ${itemsFound} элементов, `
          if (confidence !== undefined) context += `уверенность ${Math.round(confidence * 100)}%`
        } else {
          context += "завершен"
        }
        context += "\n"
      }
    }

    if (audioAnalyzers.length > 0) {
      context += "\nАудио анализ:\n"
      for (const analyzer of audioAnalyzers) {
        context += `  - ${analyzer.type}: `
        if (analyzer.result?.metadata) {
          const { itemsFound, confidence } = analyzer.result.metadata
          if (itemsFound !== undefined) context += `найдено ${itemsFound} элементов, `
          if (confidence !== undefined) context += `уверенность ${Math.round(confidence * 100)}%`
        } else {
          context += "завершен"
        }
        context += "\n"
      }
    }

    if (contentAnalyzers.length > 0) {
      context += "\nКонтент анализ:\n"
      for (const analyzer of contentAnalyzers) {
        context += `  - ${analyzer.type}: `
        if (analyzer.result?.metadata) {
          const { itemsFound, confidence } = analyzer.result.metadata
          if (itemsFound !== undefined) context += `найдено ${itemsFound} моментов, `
          if (confidence !== undefined) context += `уверенность ${Math.round(confidence * 100)}%`
        } else {
          context += "завершен"
        }
        context += "\n"
      }
    }

    context += "\n---\n\n"
  }

  context += `\nВсего проанализировано файлов: ${completedFiles.length}\n`
  context += `Файлов с ошибками: ${filesProgress.filter((f) => f.status === "error").length}\n`

  return context
}

/**
 * Примеры промптов для пользователя
 */
export const DIRECTOR_PROMPT_EXAMPLES = [
  {
    category: "Highlights",
    prompts: [
      "Создай 2-минутный highlight ролик с лучшими моментами",
      "Найди 10 самых динамичных сцен",
      "Покажи все моменты с высокой активностью",
      "Выбери лучшие моменты для Instagram Reels (30 секунд)",
    ],
  },
  {
    category: "Монтаж",
    prompts: [
      "Создай полноценный ролик на 5 минут с вступлением и финалом",
      "Сделай динамичный монтаж в стиле музыкального клипа",
      "Убери все паузы и тихие моменты, оставь только действие",
      "Создай спокойный vlog из этих кадров",
    ],
  },
  {
    category: "Анализ",
    prompts: [
      "Какие сцены самые качественные?",
      "Покажи статистику по всем файлам",
      "В каких моментах лучшая композиция?",
      "Есть ли проблемы с качеством аудио?",
    ],
  },
  {
    category: "Рекомендации",
    prompts: [
      "Как лучше смонтировать эти файлы?",
      "Предложи структуру ролика",
      "Какой порядок клипов будет логичным?",
      "Дай советы по улучшению монтажа",
    ],
  },
]

/**
 * Создать начальное сообщение для пользователя
 */
export function createWelcomeMessage(filesCount: number): string {
  return `Анализ завершен! Проанализировано ${filesCount} ${filesCount === 1 ? "файл" : filesCount < 5 ? "файла" : "файлов"}.

Я готов помочь тебе создать монтаж. Вот что я могу:

🎬 **Создать монтаж** - предложу план на основе анализа
🔍 **Найти моменты** - покажу лучшие фрагменты
📊 **Дать аналитику** - расскажу о качестве и содержании
💡 **Подсказать идеи** - предложу варианты монтажа

Напиши что хочешь сделать, например:
• "Создай динамичный ролик на 2 минуты"
• "Найди 5 лучших моментов"
• "Покажи статистику по файлам"

Чем могу помочь?`
}

/**
 * Извлечь намерение пользователя из запроса
 */
export function parseUserIntent(userMessage: string): {
  intent: "create_montage" | "find_moments" | "analyze" | "suggest" | "other"
  params: Record<string, any>
} {
  const msg = userMessage.toLowerCase()

  // Создать монтаж
  if (
    msg.includes("создай") ||
    msg.includes("сделай") ||
    msg.includes("смонтируй") ||
    msg.includes("монтаж") ||
    msg.includes("ролик")
  ) {
    // Попытка извлечь длительность
    const durationMatch = msg.match(/(\d+)\s*(минут|мин|секунд|сек|m|s)/i)
    const duration = durationMatch ? Number.parseInt(durationMatch[1], 10) : null

    return {
      intent: "create_montage",
      params: {
        duration,
        style: msg.includes("динамич") ? "dynamic" : msg.includes("спокой") ? "calm" : "balanced",
      },
    }
  }

  // Найти моменты
  if (msg.includes("найди") || msg.includes("покажи") || msg.includes("моменты") || msg.includes("highlights")) {
    const countMatch = msg.match(/(\d+)\s*(лучш|момент|сцен)/i)
    const count = countMatch ? Number.parseInt(countMatch[1], 10) : 10

    return {
      intent: "find_moments",
      params: { count },
    }
  }

  // Анализ
  if (
    msg.includes("статистик") ||
    msg.includes("анализ") ||
    msg.includes("качество") ||
    msg.includes("как") ||
    msg.includes("что")
  ) {
    return {
      intent: "analyze",
      params: {},
    }
  }

  // Рекомендации
  if (msg.includes("посоветуй") || msg.includes("предложи") || msg.includes("как лучше") || msg.includes("идеи")) {
    return {
      intent: "suggest",
      params: {},
    }
  }

  return {
    intent: "other",
    params: {},
  }
}

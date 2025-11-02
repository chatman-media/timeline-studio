// AI Chat hook with Analysis Context integration

import { useCallback, useEffect, useState } from "react"
import { useAnalysis } from "@/features/analysis-dashboard/hooks/use-analysis"
import { useTimelineAnalysis } from "@/features/timeline/hooks/use-timeline-analysis"

interface ChatMessage {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
  context?: AnalysisContext
  attachments?: ChatAttachment[]
}

interface AnalysisContext {
  projectId?: string
  sceneId?: string
  momentId?: string
  timeRange?: {
    start: number
    end: number
  }
  searchQuery?: string
}

interface ChatAttachment {
  type: "scene" | "moment" | "statistic" | "timeline_link"
  id: string
  title: string
  data: any
}

interface AnalysisContextChatState {
  messages: ChatMessage[]
  isLoading: boolean
  error: string | null
  currentContext: AnalysisContext | null
  suggestedQuestions: string[]
}

export function useAnalysisContextChat() {
  const analysis = useAnalysis()
  const timelineAnalysis = useTimelineAnalysis()

  const [state, setState] = useState<AnalysisContextChatState>({
    messages: [],
    isLoading: false,
    error: null,
    currentContext: null,
    suggestedQuestions: [],
  })

  // Generate context-aware system prompt
  const generateSystemPrompt = useCallback(
    (context: AnalysisContext | null): string => {
      let prompt = `Ты - AI-ассистент Timeline Studio, специализирующийся на анализе видеоконтента. 

Твоя роль:
- Помогать пользователю понимать результаты анализа видео
- Отвечать на вопросы о сценах, ключевых моментах, персонах и качестве
- Давать рекомендации по монтажу на основе анализа
- Объяснять AI-инсайты понятным языком

Отвечай кратко, по существу, используя данные анализа.`

      if (context?.projectId && analysis.dashboardData.activeProject) {
        const project = analysis.dashboardData.activeProject
        prompt += `

ТЕКУЩИЙ ПРОЕКТ АНАЛИЗА:
Название: ${project.name}
Файлов: ${project.files.length}
Статус: ${project.status}`

        if (analysis.dashboardData.statistics) {
          const stats = analysis.dashboardData.statistics
          prompt += `

СТАТИСТИКА ПРОЕКТА:
- Общая длительность: ${Math.round(stats.total_duration / 60)} мин
- Обнаружено сцен: ${stats.total_scenes}
- Ключевых моментов: ${stats.total_moments}
- Персон: ${stats.total_persons}
- Средний балл качества: ${Math.round(stats.average_quality * 100)}%`
        }

        if (analysis.dashboardData.recentScenes.length > 0) {
          prompt += `

НЕДАВНИЕ СЦЕНЫ:
${analysis.dashboardData.recentScenes
  .slice(0, 3)
  .map(
    (scene, i) =>
      `${i + 1}. ${scene.start_time.toFixed(1)}с - ${scene.end_time.toFixed(1)}с: ${scene.scene_type} (качество: ${Math.round(scene.quality_score * 100)}%)`,
  )
  .join("\n")}`
        }

        if (analysis.dashboardData.topMoments.length > 0) {
          prompt += `

ТОПОВЫЕ МОМЕНТЫ:
${analysis.dashboardData.topMoments
  .slice(0, 3)
  .map(
    (moment, i) =>
      `${i + 1}. ${moment.timestamp.toFixed(1)}с: ${moment.moment_type} (важность: ${Math.round(moment.importance_score * 100)}%)`,
  )
  .join("\n")}`
        }
      }

      if (context?.sceneId && analysis.dashboardData.recentScenes.length > 0) {
        const scene = analysis.dashboardData.recentScenes.find((s) => s.id === context.sceneId)
        if (scene) {
          prompt += `

ТЕКУЩАЯ СЦЕНА В ФОКУСЕ:
Время: ${scene.start_time.toFixed(1)}с - ${scene.end_time.toFixed(1)}с
Тип: ${scene.scene_type}
Длительность: ${scene.duration.toFixed(1)}с
Качество: ${Math.round(scene.quality_score * 100)}%
${scene.auto_description ? `Описание: ${scene.auto_description}` : ""}`
        }
      }

      if (context?.momentId && analysis.dashboardData.topMoments.length > 0) {
        const moment = analysis.dashboardData.topMoments.find((m) => m.id === context.momentId)
        if (moment) {
          prompt += `

ТЕКУЩИЙ МОМЕНТ В ФОКУСЕ:
Время: ${moment.timestamp.toFixed(1)}с
Тип: ${moment.moment_type}
Важность: ${Math.round(moment.importance_score * 100)}%
${moment.description ? `Описание: ${moment.description}` : ""}`
        }
      }

      if (context?.timeRange) {
        prompt += `

ВЫБРАННЫЙ ВРЕМЕННОЙ ДИАПАЗОН: ${context.timeRange.start.toFixed(1)}с - ${context.timeRange.end.toFixed(1)}с`
      }

      return prompt
    },
    [analysis.dashboardData],
  )

  // Send message with analysis context
  const sendMessage = useCallback(
    async (content: string, context?: AnalysisContext) => {
      const messageId = `msg-${Date.now()}`
      const userMessage: ChatMessage = {
        id: messageId,
        role: "user",
        content,
        timestamp: new Date(),
        context: context || state.currentContext || undefined,
      }

      setState((prev) => ({
        ...prev,
        messages: [...prev.messages, userMessage],
        isLoading: true,
        error: null,
      }))

      try {
        // Generate system prompt with current context
        const systemPrompt = generateSystemPrompt(userMessage.context || null)

        // Prepare context data for AI
        const contextData = {
          hasActiveProject: !!analysis.dashboardData.activeProject,
          projectStats: analysis.dashboardData.statistics,
          recentScenes: analysis.dashboardData.recentScenes.slice(0, 5),
          topMoments: analysis.dashboardData.topMoments.slice(0, 5),
          timelineMarkers: timelineAnalysis.markers.length,
          analysisProgress: analysis.dashboardData.progress,
        }

        // Simulate AI response (replace with actual AI service call)
        const aiResponse = await simulateAIResponse(content, systemPrompt, contextData)

        const assistantMessage: ChatMessage = {
          id: `msg-${Date.now()}-ai`,
          role: "assistant",
          content: aiResponse.content,
          timestamp: new Date(),
          context: userMessage.context,
          attachments: aiResponse.attachments,
        }

        setState((prev) => ({
          ...prev,
          messages: [...prev.messages, assistantMessage],
          isLoading: false,
          suggestedQuestions: aiResponse.suggestedQuestions || [],
        }))
      } catch (error) {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: error instanceof Error ? error.message : "Ошибка отправки сообщения",
        }))
      }
    },
    [state.currentContext, generateSystemPrompt, analysis.dashboardData, timelineAnalysis.markers],
  )

  // Set analysis context
  const setContext = useCallback(
    (context: AnalysisContext | null) => {
      setState((prev) => ({
        ...prev,
        currentContext: context,
        suggestedQuestions: generateContextQuestions(context, analysis.dashboardData),
      }))
    },
    [analysis.dashboardData],
  )

  // Clear chat
  const clearChat = useCallback(() => {
    setState((prev) => ({
      ...prev,
      messages: [],
      error: null,
      suggestedQuestions: generateContextQuestions(prev.currentContext, analysis.dashboardData),
    }))
  }, [analysis.dashboardData])

  // Auto-update suggested questions when analysis data changes
  useEffect(() => {
    setState((prev) => ({
      ...prev,
      suggestedQuestions: generateContextQuestions(prev.currentContext, analysis.dashboardData),
    }))
  }, [analysis.dashboardData])

  return {
    state,
    sendMessage,
    setContext,
    clearChat,
    // Quick actions
    askAboutScene: (sceneId: string) => {
      setContext({ sceneId })
      return sendMessage("Расскажи об этой сцене подробнее", { sceneId })
    },
    askAboutMoment: (momentId: string) => {
      setContext({ momentId })
      return sendMessage("Почему этот момент важен?", { momentId })
    },
    askAboutProject: () => {
      if (analysis.dashboardData.activeProject) {
        setContext({ projectId: analysis.dashboardData.activeProject.id })
        return sendMessage("Дай общий обзор анализа проекта")
      }
    },
    askForMontageAdvice: () => {
      return sendMessage("Дай рекомендации по монтажу на основе анализа")
    },
  }
}

// Simulate AI response (replace with actual AI service)
async function simulateAIResponse(
  userMessage: string,
  _systemPrompt: string,
  contextData: any,
): Promise<{
  content: string
  attachments?: ChatAttachment[]
  suggestedQuestions?: string[]
}> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 2000))

  const lowerMessage = userMessage.toLowerCase()

  // Context-aware responses
  if (lowerMessage.includes("сцен") || lowerMessage.includes("scene")) {
    return {
      content: `На основе анализа обнаружено ${contextData.recentScenes.length} сцен. ${
        contextData.recentScenes.length > 0
          ? `Преобладают ${getMostCommonSceneType(contextData.recentScenes)} сцены. ` +
            `Средняя длительность сцены: ${getAverageSceneDuration(contextData.recentScenes).toFixed(1)}с.`
          : "Анализ сцен ещё не завершен."
      }`,
      attachments: contextData.recentScenes.slice(0, 3).map((scene: any) => ({
        type: "scene",
        id: scene.id,
        title: `${scene.scene_type} сцена (${scene.start_time.toFixed(1)}с)`,
        data: scene,
      })),
      suggestedQuestions: [
        "Какие сцены самого высокого качества?",
        "Покажи самые длинные сцены",
        "Есть ли проблемные сцены?",
      ],
    }
  }

  if (lowerMessage.includes("момент") || lowerMessage.includes("важн")) {
    return {
      content: `Обнаружено ${contextData.topMoments.length} ключевых моментов. ${
        contextData.topMoments.length > 0
          ? `Самый важный момент: ${getMostImportantMoment(contextData.topMoments)}.`
          : "Анализ ключевых моментов ещё не завершен."
      }`,
      attachments: contextData.topMoments.slice(0, 3).map((moment: any) => ({
        type: "moment",
        id: moment.id,
        title: `${moment.moment_type} (${moment.timestamp.toFixed(1)}с)`,
        data: moment,
      })),
      suggestedQuestions: [
        "Покажи все эмоциональные моменты",
        "Где самые яркие визуальные моменты?",
        "Какие моменты лучше использовать для трейлера?",
      ],
    }
  }

  if (lowerMessage.includes("качеств") || lowerMessage.includes("quality")) {
    const avgQuality = contextData.projectStats?.average_quality || 0
    return {
      content: `Средний балл качества проекта: ${Math.round(avgQuality * 100)}%. ${
        avgQuality > 0.8
          ? "Отличное качество!"
          : avgQuality > 0.6
            ? "Хорошее качество, есть несколько моментов для улучшения."
            : "Качество требует внимания. Рекомендую цветокоррекцию и стабилизацию."
      }`,
      suggestedQuestions: [
        "Какие сцены самого низкого качества?",
        "Что можно улучшить в качестве?",
        "Нужна ли цветокоррекция?",
      ],
    }
  }

  if (lowerMessage.includes("монтаж") || lowerMessage.includes("рекоменд") || lowerMessage.includes("совет")) {
    return {
      content: `На основе анализа рекомендую:

🎬 **Структура монтажа:**
- Начать с лучших визуальных моментов для привлечения внимания
- Использовать ${contextData.topMoments.length} ключевых моментов как опорные точки
- Чередовать динамичные и спокойные сцены

⚡ **Ритм:**
- Средняя длина клипа: 3-5 секунд для динамичных частей
- До 8-10 секунд для эмоциональных моментов

🎵 **Аудио:**
- Синхронизировать нарезку с музыкальными акцентами
- Использовать аудио пики для переходов`,
      suggestedQuestions: [
        "Как лучше начать видео?",
        "Какую музыку подобрать?",
        "Сколько должно длиться финальное видео?",
      ],
    }
  }

  // Default response
  return {
    content: contextData.hasActiveProject
      ? `У вас есть активный проект анализа с ${contextData.projectStats?.total_files || 0} файлами. Анализ показал ${contextData.recentScenes.length} сцен и ${contextData.topMoments.length} ключевых моментов. Чем могу помочь с анализом контента?`
      : "Добро пожаловать в AI-ассистент Timeline Studio! Создайте проект анализа для получения детальных инсайтов о вашем видеоконтенте. Я помогу понять структуру, найти лучшие моменты и дать рекомендации по монтажу.",
    suggestedQuestions: contextData.hasActiveProject
      ? [
          "Расскажи о структуре проекта",
          "Покажи лучшие моменты",
          "Дай советы по монтажу",
          "Какие есть проблемы с качеством?",
        ]
      : ["Как создать проект анализа?", "Что умеет анализировать AI?", "Покажи пример анализа"],
  }
}

// Helper functions
function generateContextQuestions(context: AnalysisContext | null, dashboardData: any): string[] {
  if (!context || !dashboardData.activeProject) {
    return ["Создать проект анализа", "Что умеет AI анализ?", "Показать пример"]
  }

  const questions = ["Обзор проекта"]

  if (dashboardData.recentScenes.length > 0) {
    questions.push("Анализ сцен", "Лучшие сцены")
  }

  if (dashboardData.topMoments.length > 0) {
    questions.push("Ключевые моменты", "Рекомендации по монтажу")
  }

  if (dashboardData.statistics) {
    questions.push("Статистика качества")
  }

  if (context.sceneId) {
    questions.push("Подробнее об этой сцене", "Связанные моменты")
  }

  if (context.momentId) {
    questions.push("Почему этот момент важен?", "Как его использовать?")
  }

  return questions
}

function getMostCommonSceneType(scenes: any[]): string {
  const counts = scenes.reduce(
    (acc, scene) => {
      acc[scene.scene_type] = (acc[scene.scene_type] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  const most = Object.entries(counts).reduce((max, [type, count]) => (count > max.count ? { type, count } : max), {
    type: "",
    count: 0,
  })

  return most.type
}

function getAverageSceneDuration(scenes: any[]): number {
  return scenes.reduce((sum, scene) => sum + scene.duration, 0) / scenes.length
}

function getMostImportantMoment(moments: any[]): string {
  const top = moments.reduce((max, moment) => (moment.importance_score > max.importance_score ? moment : max))
  return `${top.moment_type} в ${top.timestamp.toFixed(1)}с (важность: ${Math.round(top.importance_score * 100)}%)`
}

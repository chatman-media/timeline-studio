import { Bot, ChevronDown, History, Plus, Send, Settings, StopCircle, User } from "lucide-react"
import { useCallback, useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ScrollArea } from "@/components/ui/scroll-area"
import { TooltipProvider } from "@/components/ui/tooltip"
import { UnifiedAIService } from "@/domains/ai-core/services"
import type { AiResponse } from "@/domains/ai-core/types/providers"
import type { Agent, AgentId, ChatMessage } from "@/domains/ai-services/types/chat"
import { useTimeline } from "@/domains/video-editing/hooks"
import { shortcutsRegistry } from "@/features/keyboard-shortcuts"
import { useMediaImport } from "@/features/media/hooks/use-media-import"
import { useModal } from "@/features/modals"
import { useApiKeys } from "@/features/user-settings/hooks/use-api-keys"
import { cn } from "@/lib/utils"
// Импорты констант моделей больше не нужны - будем получать через UnifiedAIService
import { useChat } from "../hooks/use-chat"
import { useResourcesAIIntegration } from "../hooks/use-resources-ai-integration"
import { chatStorageService } from "../services/chat-storage-service"
import { compressContext, isContextOverLimit } from "../utils/context-manager"
import { createTimelineContextPrompt } from "../utils/timeline-context"
import { ChatList } from "./chat-list"

// Модели теперь получаем динамически из UnifiedAIService

// Chat modes
type ChatMode = "chat" | "agent"

const CHAT_MODES: Array<{
  id: ChatMode
  name: string
  description: string
  canEdit: boolean
}> = [
  {
    id: "chat",
    name: "Chat",
    description: "Normal chat",
    canEdit: false,
  },
  {
    id: "agent",
    name: "Agent",
    description: "Edits files and uses tools",
    canEdit: true,
  },
]

export function AiChat() {
  const { t } = useTranslation()
  const {
    chatMessages,
    sendChatMessage,
    receiveChatMessage,
    selectedAgentId,
    selectAgent,
    isProcessing,
    setProcessing,
    currentSessionId,
    sessions,
    isCreatingNewChat,
    createNewChat,
    switchSession,
    deleteSession,
    updateSessions,
    clearMessages,
  } = useChat()
  const { getApiKeyInfo } = useApiKeys()
  const { openModal } = useModal()
  const { importFile } = useMediaImport()

  // Получаем контекст Timeline (если доступен)
  const timelineContext = useTimeline()

  // Интеграция с ResourcesProvider для AI инструментов
  const { isIntegrated, resourceStats } = useResourcesAIIntegration()

  const [message, setMessage] = useState("")
  const [chatMode, setChatMode] = useState<ChatMode>("agent")
  const [showHistory, setShowHistory] = useState(false)
  const [streamingContent, setStreamingContent] = useState("")
  const [isStreaming, setIsStreaming] = useState(false)
  const [availableModels, setAvailableModels] = useState<Agent[]>([])
  const [isLoadingModels, setIsLoadingModels] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  // Load chat history on mount
  useEffect(() => {
    void updateSessions()
  }, [])

  // Load available models on mount
  useEffect(() => {
    const loadModels = async () => {
      try {
        setIsLoadingModels(true)
        const unifiedService = UnifiedAIService.getInstance()
        const models = await unifiedService.getAvailableModels()

        // Преобразуем модели в формат Agent
        const agents: Agent[] = models.map((model) => ({
          id: model.model,
          name: model.displayName || model.model,
          useTools: model.supportTools || false,
          provider: model.provider,
        }))

        setAvailableModels(agents)
      } catch (error) {
        console.error("Failed to load available models:", error)
        // Используем минимальный набор моделей в случае ошибки
        const fallbackModels: Agent[] = [
          { id: "claude-4-opus", name: "Claude 4 Sonnet", useTools: true, provider: "claude" },
          { id: "gpt-5", name: "GPT-5", useTools: false, provider: "openai" },
          { id: "qwen-2-5", name: "Qwen 2.5", useTools: false, provider: "qwen" },
        ]
        setAvailableModels(fallbackModels)
      } finally {
        setIsLoadingModels(false)
      }
    }

    void loadModels()
  }, [])

  // Прокрутка к последнему сообщению
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [])

  // Функция для автоматического изменения высоты textarea
  const autoResizeTextarea = useCallback(() => {
    if (inputRef.current) {
      // Сбрасываем высоту до минимальной
      inputRef.current.style.height = "auto"
      // Устанавливаем высоту по содержимому (scrollHeight)
      const newHeight = Math.min(Math.max(40, inputRef.current.scrollHeight), 120) // Минимум 40px, максимум 120px
      inputRef.current.style.height = `${newHeight}px`
    }
  }, [])

  // Прокрутка при добавлении новых сообщений
  useEffect(() => {
    scrollToBottom()
  }, [chatMessages, scrollToBottom])

  // Инициализация автоматического изменения высоты textarea
  useEffect(() => {
    // Вызываем функцию при монтировании компонента
    autoResizeTextarea()
  }, [autoResizeTextarea])

  // Обработчик отправки сообщения
  const handleSendMessage = useCallback(() => {
    if (!message.trim() || isProcessing || isStreaming) return

    // Определяем провайдера по модели
    const getProviderByModel = (model: string) => {
      if (model.startsWith("claude")) return "claude"
      if (model.startsWith("gpt") || model.startsWith("o3")) return "openai"
      if (model.startsWith("deepseek")) return "deepseek"
      return "ollama" // По умолчанию для локальных моделей
    }

    const provider = getProviderByModel(selectedAgentId || "")

    // Проверяем API ключ только для облачных провайдеров
    if (provider !== "ollama") {
      const apiKeyInfo = getApiKeyInfo(provider)
      if (!apiKeyInfo || !apiKeyInfo.has_value || apiKeyInfo.is_valid !== true) {
        // Если API ключ не установлен или невалидный, показываем диалог настроек
        openModal("user-settings")
        return
      }
    }

    // Создаем сообщение пользователя
    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      content: message,
      role: "user",
      timestamp: new Date(),
    }

    // Отправляем сообщение пользователя
    void sendChatMessage(message)
    setMessage("")
    setProcessing(true)

    // Сохраняем сообщение пользователя в историю
    if (currentSessionId) {
      // Проверяем, существует ли сессия в storage (для новых чатов может не существовать)
      const performSave = async () => {
        try {
          const session = await chatStorageService.getSession(currentSessionId)
          if (!session) {
            // Если сессия не существует, создаем ее
            await chatStorageService.createSession("") // Заголовок будет создан автоматически при добавлении первого сообщения
          }
          // Добавляем сообщение
          await chatStorageService.addMessage(currentSessionId, userMessage)
        } catch (error) {
          console.error("Failed to save message:", error)
        }
      }
      void performSave()
    }

    // Сбрасываем высоту textarea после очистки
    setTimeout(autoResizeTextarea, 0)

    // Фокус на поле ввода
    inputRef.current?.focus()

    // Выполняем реальный API запрос с поддержкой потоковых ответов
    const performApiRequest = async () => {
      // Создаем контроллер для отмены запроса
      abortControllerRef.current = new AbortController()

      try {
        const currentModel = selectedAgentId || "claude-4-sonnet-latest"
        const provider = getProviderByModel(currentModel)

        // Подготавливаем все сообщения
        const allMessages = [
          ...chatMessages.map((msg) => ({
            role: msg.role as "user" | "assistant",
            content: msg.content,
          })),
          {
            role: "user" as const,
            content: message,
          },
        ]

        // Создаем системный промпт с контекстом Timeline
        // Временный обходной путь - преобразуем Timeline в TimelineProject-подобный объект
        const projectLikeObj = timelineContext?.project
          ? {
              ...timelineContext.project,
              description: "",
              settings: {
                ...timelineContext.project.settings,
                resolution: timelineContext.project.settings?.resolution || { width: 1920, height: 1080 },
                fps: timelineContext.project.settings?.fps || timelineContext.project.fps || 30,
                aspectRatio: timelineContext.project.settings?.aspectRatio || "16:9",
              },
              sections: timelineContext.project.sections.map((section, index) => ({
                ...section,
                index,
                duration: section.endTime - section.startTime,
              })),
            }
          : null

        let systemPrompt = createTimelineContextPrompt(
          projectLikeObj as any,
          (projectLikeObj?.sections?.[0] as any) || null,
          (timelineContext?.selectedClipIds
            ?.map((id: string) => {
              // Находим выбранные клипы в проекте
              for (const section of timelineContext.project?.sections || []) {
                for (const track of section.tracks) {
                  const clip = track.clips.find((c: any) => c.id === id)
                  if (clip) return clip
                }
              }
              return null
            })
            .filter(Boolean) as any[]) || [],
        )

        // Добавляем информацию о доступных ресурсах
        if (resourceStats && isIntegrated) {
          systemPrompt += "\n\nДоступные ресурсы в проекте:"
          if (resourceStats.totalMedia > 0) {
            systemPrompt += `\n- Медиафайлы: ${resourceStats.totalMedia} шт.`
          }
          if (resourceStats.totalMusic > 0) {
            systemPrompt += `\n- Музыкальные треки: ${resourceStats.totalMusic} шт.`
          }
          if (resourceStats.totalEffects > 0) {
            systemPrompt += `\n- Эффекты: ${resourceStats.totalEffects} шт.`
          }
          if (resourceStats.totalFilters > 0) {
            systemPrompt += `\n- Фильтры: ${resourceStats.totalFilters} шт.`
          }
          if (resourceStats.totalDuration > 0) {
            systemPrompt += `\n- Общая длительность медиа: ${Math.floor(resourceStats.totalDuration / 60)} мин ${Math.floor(resourceStats.totalDuration % 60)} сек`
          }
          if (resourceStats.totalSize > 0) {
            const sizeInMB = Math.round(resourceStats.totalSize / 1024 / 1024)
            systemPrompt += `\n- Общий размер: ${sizeInMB} МБ`
          }
        }

        // Управление размером контекста
        let messages: { role: "user" | "assistant"; content: string }[] = allMessages
        if (isContextOverLimit(allMessages, currentModel, systemPrompt)) {
          console.log("Контекст превышает лимиты модели, сжимаем...")
          const compressedMessages = compressContext(allMessages, currentModel, systemPrompt)
          // Фильтруем только user и assistant сообщения для API
          messages = compressedMessages.filter((msg) => msg.role === "user" || msg.role === "assistant") as {
            role: "user" | "assistant"
            content: string
          }[]
        }

        // Начинаем потоковый ответ
        setIsStreaming(true)
        setStreamingContent("")

        // Общий обработчик для завершения потокового ответа
        const handleStreamComplete = async (response: AiResponse) => {
          setIsStreaming(false)
          setStreamingContent("")

          const agentMessage: ChatMessage = {
            id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            content: response.content,
            role: "assistant",
            timestamp: new Date(),
            agent: (selectedAgentId as AgentId) ?? ("qwen-2-5" as AgentId),
          }

          receiveChatMessage(agentMessage.content)

          // Сохраняем сообщение в историю
          if (currentSessionId) {
            await chatStorageService.addMessage(currentSessionId, agentMessage)
          }
        }

        // Общий обработчик ошибок
        const handleStreamError = (error: Error) => {
          console.error("Error in streaming:", error)
          setIsStreaming(false)
          setStreamingContent("")
          throw error
        }

        // Используем UnifiedAIService для всех провайдеров
        const unifiedService = UnifiedAIService.getInstance()

        // Подготавливаем сообщения с системным промптом
        const messagesWithSystem =
          provider === "claude"
            ? messages // Claude обрабатывает system prompt отдельно
            : [{ role: "system" as const, content: systemPrompt }, ...messages]

        // Отправляем запрос через единый сервис
        await unifiedService.sendStreamingRequest(currentModel, messagesWithSystem, {
          maxTokens: 2000,
          temperature: provider === "ollama" ? 0.7 : undefined,
          signal: abortControllerRef.current.signal,
          onContent: (content) => setStreamingContent((prev) => prev + content),
          onComplete: handleStreamComplete,
          onError: handleStreamError,
          // Передаем system prompt для Claude
          ...(provider === "claude" && { system: systemPrompt }),
        })
      } catch (error) {
        console.error("Error sending message to AI:", error)
        setIsStreaming(false)
        setStreamingContent("")

        // Если это не ошибка отмены запроса, показываем сообщение об ошибке
        if ((error as Error).name !== "AbortError") {
          const errorContent = t(
            "timeline.chat.error",
            "Произошла ошибка при отправке сообщения. Пожалуйста, проверьте настройки API ключа.",
          )
          receiveChatMessage(errorContent)
        }
      } finally {
        setProcessing(false)
        abortControllerRef.current = null
      }
    }

    void performApiRequest()
  }, [
    message,
    sendChatMessage,
    receiveChatMessage,
    selectedAgentId,
    isProcessing,
    isStreaming,
    autoResizeTextarea,
    getApiKeyInfo,
    openModal,
    setProcessing,
    chatMessages,
    currentSessionId,
    t,
    timelineContext,
    resourceStats,
    isIntegrated,
  ])

  // Обработчик остановки обработки
  const handleStopProcessing = useCallback(() => {
    // Прерываем текущий запрос, если он активен
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
    setProcessing(false)
    setIsStreaming(false)
    setStreamingContent("")
  }, [setProcessing])

  // Регистрируем shortcut для отправки сообщения
  useEffect(() => {
    const handleSendShortcut = () => {
      // Проверяем, что фокус на textarea чата
      const activeElement = document.activeElement
      const chatInputs = document.querySelectorAll(
        '[data-testid="chat-input"], [data-testid="chat-input-with-messages"]',
      )

      const isInChatInput = Array.from(chatInputs).some((input) => input === activeElement)

      if (isInChatInput && !isProcessing && !isStreaming) {
        handleSendMessage()
      }
    }

    shortcutsRegistry.updateAction("send-chat-message", handleSendShortcut)

    return () => {
      shortcutsRegistry.updateAction("send-chat-message", undefined)
    }
  }, [handleSendMessage, isProcessing, isStreaming])

  // Обработчик нажатия Enter (для Shift+Enter)
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    // Shift+Enter добавляет новую строку
    if (e.key === "Enter" && e.shiftKey) {
      // Позволяем стандартное поведение для новой строки
      return
    }
    // Enter без Shift обрабатывается через shortcuts registry
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      // Обработка через shortcuts registry
    }
  }, [])

  // Форматирование времени
  const formatTime = (timestamp: Date) => {
    return timestamp.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <TooltipProvider>
      <div className="relative z-50 flex h-full flex-col bg-background text-foreground">
        {/* Header */}
        <div className="flex flex-col border-b border-border">
          <div className="flex items-center justify-between px-3 py-1 pb-[3px]">
            <h2 className="text-sm font-medium text-white">{t("timeline.chat.title", "Chat")}</h2>
            <div className="flex items-center gap-1">
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-muted-foreground hover:text-white"
                onClick={() => createNewChat()}
              >
                <Plus className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-muted-foreground hover:text-white"
                onClick={() => {
                  // Return to initial screen by clearing messages
                  void clearMessages()
                  setShowHistory(!showHistory)
                }}
              >
                <History className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-muted-foreground hover:text-white"
                onClick={() => openModal("user-settings")}
              >
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Resource stats */}
          {isIntegrated && resourceStats && (
            <div className="flex items-center justify-between px-3 pb-2">
              <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                {resourceStats.totalMedia > 0 && (
                  <span className="flex items-center gap-1">
                    <div className="h-1 w-1 rounded-full bg-blue-500" />
                    {t("timeline.chat.media", "Медиа")}: {resourceStats.totalMedia}
                  </span>
                )}
                {resourceStats.totalEffects > 0 && (
                  <span className="flex items-center gap-1">
                    <div className="h-1 w-1 rounded-full bg-purple-500" />
                    {t("timeline.chat.effects", "Эффекты")}: {resourceStats.totalEffects}
                  </span>
                )}
                {resourceStats.totalFilters > 0 && (
                  <span className="flex items-center gap-1">
                    <div className="h-1 w-1 rounded-full bg-green-500" />
                    {t("timeline.chat.filters", "Фильтры")}: {resourceStats.totalFilters}
                  </span>
                )}
                {resourceStats.totalDuration > 0 && (
                  <span className="flex items-center gap-1">
                    <div className="h-1 w-1 rounded-full bg-orange-500" />
                    {Math.floor(resourceStats.totalDuration / 60)} {t("timeline.chat.minutes", "мин")}
                  </span>
                )}
              </div>
              {isIntegrated && (
                <div className="flex items-center gap-1 text-[10px] text-green-500">
                  <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                  <span>{t("timeline.chat.ai_connected", "AI подключен")}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Main content area */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Input area - positioned at top when no messages */}
          {chatMessages.length === 0 && (
            <div className="p-4">
              {/* Подсказка для пустого проекта */}
              {resourceStats && resourceStats.totalMedia === 0 && (
                <div className="mb-3 rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">
                  <p className="mb-2">💡 {t("timeline.chat.empty_project_hint", "Проект пока пустой. Начните с:")}</p>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs"
                      onClick={async () => {
                        const result = await importFile()
                        if (result.success) {
                          console.log(`Импортировано ${result.files.length} файлов`)
                        }
                      }}
                    >
                      {t("timeline.chat.import_media", "Импортировать медиа")}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs"
                      onClick={() => setMessage("помоги импортировать видео для монтажа")}
                    >
                      {t("timeline.chat.ask_ai_import", "Спросить AI")}
                    </Button>
                  </div>
                </div>
              )}

              <div className="relative">
                <textarea
                  ref={inputRef}
                  value={message}
                  onChange={(e) => {
                    setMessage(e.target.value)
                    setTimeout(autoResizeTextarea, 0)
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder={
                    resourceStats && resourceStats.totalMedia === 0
                      ? "Начните с команды 'импортируй видео' или перетащите файлы в браузер"
                      : resourceStats && resourceStats.totalMedia > 0
                        ? `Доступно ${resourceStats.totalMedia} файлов. Попробуйте: 'создай монтаж', 'анализируй видео', 'адаптируй для TikTok'`
                        : "@ mention, ⌘L select. Команды: 'анализируй видео', 'создай сценарий', 'адаптируй для TikTok'..."
                  }
                  className="min-h-[100px] w-full resize-none rounded-lg border border-border bg-muted p-3 pr-12 text-sm text-white placeholder:text-muted-foreground/70 focus:border-teal focus:outline-none"
                  disabled={isProcessing || isStreaming}
                  rows={4}
                  data-testid="chat-input"
                />
                <Button
                  onClick={isProcessing || isStreaming ? handleStopProcessing : handleSendMessage}
                  disabled={!message.trim() && !isProcessing && !isStreaming}
                  size="icon"
                  className={cn(
                    "absolute bottom-3 right-3 h-8 w-8 rounded-md transition-colors",
                    isProcessing || isStreaming || message.trim()
                      ? "bg-teal text-white hover:bg-teal/80"
                      : "bg-muted text-muted-foreground hover:bg-muted/50",
                  )}
                  data-testid="send-button"
                >
                  {isProcessing || isStreaming ? (
                    <StopCircle className="h-4 w-4" />
                  ) : (
                    <Send className="h-4 w-4 rotate-45" />
                  )}
                </Button>
              </div>

              {/* Mode and model selectors */}
              <div className="mt-3 flex gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      className="h-9 justify-between border-border bg-muted text-sm text-white hover:bg-accent"
                      data-testid="chat-mode-selector"
                    >
                      {CHAT_MODES.find((m) => m.id === chatMode)?.name}
                      <ChevronDown className="ml-2 h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-[200px] border-border bg-muted">
                    {CHAT_MODES.map((mode) => (
                      <DropdownMenuItem
                        key={mode.id}
                        onClick={() => setChatMode(mode.id)}
                        className="flex items-center justify-between text-foreground hover:bg-accent hover:text-white"
                      >
                        <div>
                          <div className="font-medium">{mode.name}</div>
                          <div className="text-xs text-muted-foreground/70">{mode.description}</div>
                        </div>
                        {chatMode === mode.id && <div className="ml-2 h-2 w-2 rounded-full bg-teal" />}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      className="h-9 flex-1 justify-between border-border bg-muted text-sm text-white hover:bg-accent"
                      data-testid="agent-selector"
                    >
                      <span className="truncate">
                        {selectedAgentId
                          ? availableModels.find((a) => a.id === selectedAgentId)?.name
                          : "deepseek/deepseek-r1-zero:free"}
                      </span>
                      <ChevronDown className="ml-2 h-4 w-4 flex-shrink-0" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="start"
                    className="w-[250px] border-border bg-muted"
                    data-testid="agent-dropdown"
                  >
                    {isLoadingModels ? (
                      <DropdownMenuItem disabled className="text-muted-foreground">
                        Loading models...
                      </DropdownMenuItem>
                    ) : availableModels.length === 0 ? (
                      <DropdownMenuItem disabled className="text-muted-foreground">
                        No models available
                      </DropdownMenuItem>
                    ) : (
                      availableModels.map((agent) => (
                        <DropdownMenuItem
                          key={agent.id}
                          onClick={() => selectAgent(agent.id)}
                          className="text-foreground hover:bg-accent hover:text-white"
                          data-testid={`agent-option-${agent.id}`}
                        >
                          {agent.name}
                        </DropdownMenuItem>
                      ))
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          )}

          {/* Messages area */}
          {chatMessages.length > 0 && (
            <ScrollArea className="flex-1">
              <div className="p-4">
                <div className="flex flex-col gap-3" data-testid="messages-container">
                  {chatMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={cn(
                        "group flex max-w-[90%] flex-col rounded-lg p-3",
                        msg.role === "user" ? "ml-auto bg-teal text-white" : "bg-muted text-foreground",
                      )}
                      data-testid={`message-${msg.role}-${msg.id}`}
                    >
                      <div className="flex items-start gap-2">
                        <div className="mt-0.5 flex-shrink-0">
                          {msg.role === "user" ? <User className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
                        </div>
                        <div className="text-sm leading-relaxed">{msg.content}</div>
                      </div>
                      <div className="mt-1.5 text-right text-[10px] opacity-0 transition-opacity group-hover:opacity-100">
                        {formatTime(msg.timestamp)}
                      </div>
                    </div>
                  ))}
                  {(isProcessing || isStreaming) && (
                    <div
                      className="flex max-w-[90%] flex-col rounded-lg bg-muted p-3 text-gray-100"
                      data-testid="processing-message"
                    >
                      <div className="flex items-start gap-2">
                        <div className="mt-0.5 flex-shrink-0">
                          <Bot className="h-3.5 w-3.5" />
                        </div>
                        <div className="text-sm leading-relaxed">
                          {isStreaming && streamingContent ? (
                            <div>
                              {streamingContent}
                              <span className="inline-block w-2 h-4 bg-teal animate-pulse ml-1" />
                            </div>
                          ) : (
                            <span className="inline-block animate-pulse">
                              {t("timeline.chat.processing", "Обработка...")}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </div>
            </ScrollArea>
          )}

          {/* Input area when messages exist */}
          {chatMessages.length > 0 && (
            <div className="border-t border-border p-4">
              <div className="relative">
                <textarea
                  ref={inputRef}
                  value={message}
                  onChange={(e) => {
                    setMessage(e.target.value)
                    setTimeout(autoResizeTextarea, 0)
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder={
                    resourceStats && resourceStats.totalMedia === 0
                      ? "Начните с команды 'импортируй видео' или перетащите файлы в браузер"
                      : resourceStats && resourceStats.totalMedia > 0
                        ? `Доступно ${resourceStats.totalMedia} файлов. Попробуйте: 'создай монтаж', 'анализируй видео', 'адаптируй для TikTok'`
                        : "@ mention, ⌘L select. Команды: 'анализируй видео', 'создай сценарий', 'адаптируй для TikTok'..."
                  }
                  className="min-h-[40px] w-full resize-none rounded-lg border border-border bg-muted p-3 pr-12 text-sm text-white placeholder:text-muted-foreground/70 focus:border-teal focus:outline-none"
                  disabled={isProcessing || isStreaming}
                  rows={1}
                  data-testid="chat-input-with-messages"
                />
                <Button
                  onClick={isProcessing || isStreaming ? handleStopProcessing : handleSendMessage}
                  disabled={!message.trim() && !isProcessing && !isStreaming}
                  size="icon"
                  className={cn(
                    "absolute bottom-2 right-2 h-8 w-8 rounded-md transition-colors",
                    isProcessing || isStreaming || message.trim()
                      ? "bg-teal text-white hover:bg-teal/80"
                      : "bg-muted text-muted-foreground hover:bg-muted/50",
                  )}
                  data-testid="send-button-with-messages"
                >
                  {isProcessing || isStreaming ? (
                    <StopCircle className="h-4 w-4" />
                  ) : (
                    <Send className="h-4 w-4 rotate-45" />
                  )}
                </Button>
              </div>

              {/* Mode and model selectors */}
              <div className="mt-3 flex gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      className="h-9 justify-between border-border bg-muted text-sm text-white hover:bg-accent"
                    >
                      {CHAT_MODES.find((m) => m.id === chatMode)?.name}
                      <ChevronDown className="ml-2 h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-[200px] border-border bg-muted">
                    {CHAT_MODES.map((mode) => (
                      <DropdownMenuItem
                        key={mode.id}
                        onClick={() => setChatMode(mode.id)}
                        className="flex items-center justify-between text-foreground hover:bg-accent hover:text-white"
                      >
                        <div>
                          <div className="font-medium">{mode.name}</div>
                          <div className="text-xs text-muted-foreground/70">{mode.description}</div>
                        </div>
                        {chatMode === mode.id && <div className="ml-2 h-2 w-2 rounded-full bg-teal" />}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      className="h-9 flex-1 justify-between border-border bg-muted text-sm text-white hover:bg-accent"
                      data-testid="agent-selector"
                    >
                      <span className="truncate">
                        {selectedAgentId
                          ? availableModels.find((a) => a.id === selectedAgentId)?.name
                          : "deepseek/deepseek-r1-zero:free"}
                      </span>
                      <ChevronDown className="ml-2 h-4 w-4 flex-shrink-0" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="start"
                    className="w-[250px] border-border bg-muted"
                    data-testid="agent-dropdown"
                  >
                    {isLoadingModels ? (
                      <DropdownMenuItem disabled className="text-muted-foreground">
                        Loading models...
                      </DropdownMenuItem>
                    ) : availableModels.length === 0 ? (
                      <DropdownMenuItem disabled className="text-muted-foreground">
                        No models available
                      </DropdownMenuItem>
                    ) : (
                      availableModels.map((agent) => (
                        <DropdownMenuItem
                          key={agent.id}
                          onClick={() => selectAgent(agent.id)}
                          className="text-foreground hover:bg-accent hover:text-white"
                          data-testid={`agent-option-${agent.id}`}
                        >
                          {agent.name}
                        </DropdownMenuItem>
                      ))
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          )}

          {/* Previous threads section */}
          {chatMessages.length === 0 && (
            <div className="flex-1" data-testid="chat-list-container">
              <ChatList
                sessions={sessions}
                currentSessionId={currentSessionId}
                isCreatingNew={isCreatingNewChat}
                onSelectSession={(sessionId) => void switchSession(sessionId)}
                onDeleteSession={async (id) => {
                  await chatStorageService.deleteSession(id)
                  void deleteSession(id)
                  void updateSessions()
                }}
                onCopySession={async (id) => {
                  try {
                    const session = await chatStorageService.getSession(id)
                    if (session) {
                      // Создаем новую сессию с копией данных
                      const newSession = await chatStorageService.createSession(`${session.title} (${t("chat.copy")})`)

                      // Копируем все сообщения в новую сессию
                      for (const message of session.messages) {
                        await chatStorageService.addMessage(newSession.id, {
                          role: message.role,
                          content: message.content,
                          agent: message.agent,
                          error: message.error,
                          metadata: message.metadata,
                        })
                      }

                      // Обновляем список сессий
                      void updateSessions()

                      // Переключаемся на скопированную сессию
                      await switchSession(newSession.id)
                    }
                  } catch (error) {
                    console.error("Failed to copy session:", error)
                  }
                }}
              />
            </div>
          )}
        </div>
      </div>
    </TooltipProvider>
  )
}

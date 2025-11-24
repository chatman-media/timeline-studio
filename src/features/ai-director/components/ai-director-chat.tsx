"use client"

/**
 * AIDirectorChat - Чат компонент для взаимодействия с AI после анализа
 *
 * Использует результаты анализа видео для создания контекста
 * и помогает пользователю создать монтаж через естественный диалог
 */

import { Bot, Lightbulb, Send, Sparkles, X } from "lucide-react"
import { useCallback, useEffect, useRef, useState } from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

import { useAIDirectorChat } from "../hooks/use-ai-director-chat"
import { useMontageApplicator } from "../hooks/use-montage-applicator"
import type { FileAnalysisProgress } from "../types/analysis-progress"
import type { MontagePlan } from "../types/montage-plan"
import { createWelcomeMessage, DIRECTOR_PROMPT_EXAMPLES } from "../utils/director-prompts"
import { MontagePlanPreview } from "./montage-plan-preview"

interface AIDirectorChatProps {
  filesProgress: FileAnalysisProgress[]
  onCreateMontage?: (plan: MontagePlan) => void
  className?: string
}

interface ChatMessage {
  id: string
  role: "user" | "assistant" | "system"
  content: string
  timestamp: Date
}

export function AIDirectorChat({ filesProgress, onCreateMontage, className }: AIDirectorChatProps) {
  // Используем hook для AI Director чата
  const {
    messages: chatMessages,
    isProcessing,
    sendMessage,
    lastMontagePlan,
  } = useAIDirectorChat(filesProgress, {
    onMontagePlanCreated: onCreateMontage,
  })

  // Hook для применения плана монтажа к timeline
  const { applyToTimeline } = useMontageApplicator()

  const [input, setInput] = useState("")
  const [showExamples, setShowExamples] = useState(true)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [showPreview, setShowPreview] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Синхронизируем сообщения из hook с локальным состоянием
  useEffect(() => {
    setMessages(chatMessages)
  }, [chatMessages])

  // Показываем preview когда AI создал план
  useEffect(() => {
    if (lastMontagePlan && !showPreview) {
      setShowPreview(true)
    }
  }, [lastMontagePlan, showPreview])

  // Добавить приветственное сообщение один раз при инициализации
  useEffect(() => {
    const completedFiles = filesProgress.filter((f) => f.status === "completed")
    if (completedFiles.length > 0 && chatMessages.length === 0) {
      const welcomeMsg: ChatMessage = {
        id: `msg-${Date.now()}`,
        role: "assistant",
        content: createWelcomeMessage(completedFiles.length),
        timestamp: new Date(),
      }
      setMessages([welcomeMsg])
    }
  }, [filesProgress, chatMessages.length])

  // Auto scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  // Handle send message
  const handleSend = useCallback(
    async (messageText?: string) => {
      const text = messageText || input.trim()
      if (!text || isProcessing) return

      setInput("")
      setShowExamples(false)

      try {
        // Отправляем сообщение через hook
        await sendMessage(text)
      } finally {
        inputRef.current?.focus()
      }
    },
    [input, isProcessing, sendMessage],
  )

  // Handle example click
  const handleExampleClick = (example: string) => {
    setInput(example)
    handleSend(example)
  }

  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const completedFiles = filesProgress.filter((f) => f.status === "completed")
  const hasResults = completedFiles.length > 0

  if (!hasResults) {
    return (
      <Card className={className}>
        <CardContent className="py-16 text-center">
          <Bot className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <p className="text-lg font-medium mb-2">AI Director готов к работе</p>
          <p className="text-sm text-muted-foreground">
            Дождись завершения анализа, чтобы начать создавать монтаж с помощью AI
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card className={cn("flex flex-col h-[600px]", className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Director Chat
          </CardTitle>
          <CardDescription>Создавай монтаж через диалог с AI ассистентом</CardDescription>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
          {/* Messages */}
          <ScrollArea className="flex-1 px-6" ref={scrollRef}>
            <div className="space-y-4 py-4">
              {messages.map((msg) => (
                <MessageBubble key={msg.id} message={msg} />
              ))}

              {isProcessing && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Bot className="h-4 w-4 animate-pulse" />
                  <span className="text-sm">AI думает...</span>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Examples (показываем только вначале) */}
          {showExamples && messages.length <= 1 && (
            <div className="px-6 py-3 border-t bg-muted/30">
              <div className="flex items-center gap-2 mb-2">
                <Lightbulb className="h-4 w-4 text-primary" />
                <span className="text-xs font-medium">Примеры запросов:</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {DIRECTOR_PROMPT_EXAMPLES[0].prompts.slice(0, 2).map((example, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    className="text-xs h-7"
                    onClick={() => handleExampleClick(example)}
                  >
                    {example}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="p-6 border-t bg-background">
            <div className="flex gap-2">
              <Textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Напиши что хочешь создать..."
                className="min-h-[60px] resize-none"
                disabled={isProcessing}
              />
              <Button
                onClick={() => handleSend()}
                disabled={!input.trim() || isProcessing}
                size="icon"
                className="h-[60px]"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">Enter - отправить, Shift+Enter - новая строка</p>
          </div>
        </CardContent>
      </Card>

      {/* Preview плана монтажа */}
      {showPreview && lastMontagePlan && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setShowPreview(false)}
        >
          <div className="max-w-4xl w-full max-h-[90vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
            <div className="relative">
              <Button
                onClick={() => setShowPreview(false)}
                variant="ghost"
                size="icon"
                className="absolute -top-2 -right-2 z-10 rounded-full bg-background shadow-lg"
              >
                <X className="h-4 w-4" />
              </Button>
              <MontagePlanPreview
                plan={lastMontagePlan}
                onApply={async () => {
                  try {
                    // Применяем план к timeline
                    // План может быть отредактирован внутри preview компонента
                    await applyToTimeline(lastMontagePlan)
                    if (onCreateMontage) {
                      onCreateMontage(lastMontagePlan)
                    }
                    setShowPreview(false)
                  } catch (error) {
                    console.error("Failed to apply montage plan:", error)
                  }
                }}
                onCancel={() => setShowPreview(false)}
              />
            </div>
          </div>
        </div>
      )}
    </>
  )
}

/**
 * Message Bubble Component
 */
function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user"

  return (
    <div className={cn("flex gap-3", isUser && "flex-row-reverse")}>
      {/* Avatar */}
      <div
        className={cn(
          "h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0",
          isUser ? "bg-primary" : "bg-muted",
        )}
      >
        {isUser ? <span className="text-primary-foreground text-sm font-medium">U</span> : <Bot className="h-4 w-4" />}
      </div>

      {/* Content */}
      <div className={cn("flex-1 max-w-[80%]", isUser && "flex justify-end")}>
        <div className={cn("rounded-lg p-3", isUser ? "bg-primary text-primary-foreground" : "bg-muted")}>
          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
          <span className="text-xs opacity-70 mt-1 block">
            {message.timestamp.toLocaleTimeString("ru-RU", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>
      </div>
    </div>
  )
}

// AI Chat component with Analysis Context

import { AnimatePresence, motion } from "framer-motion"
import {
  BarChart3,
  Bot,
  Camera,
  Clock,
  Copy,
  ExternalLink,
  RefreshCw,
  Send,
  Sparkles,
  Star,
  Trash2,
  User,
} from "lucide-react"
import React, { useEffect, useRef, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useTimelineAnalysis } from "@/features/timeline/hooks/use-timeline-analysis"
import { cn } from "@/lib/utils"
import { useAnalysisContextChat } from "../hooks/use-analysis-context-chat"

interface AnalysisContextChatProps {
  className?: string
  onSceneClick?: (sceneId: string) => void
  onMomentClick?: (momentId: string) => void
}

export function AnalysisContextChat({ className, onSceneClick, onMomentClick }: AnalysisContextChatProps) {
  const chat = useAnalysisContextChat()
  const timelineAnalysis = useTimelineAnalysis()

  const [input, setInput] = useState("")
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
    }
  }, [chat.state.messages])

  const handleSend = async () => {
    if (!input.trim() || chat.state.isLoading) return

    const message = input.trim()
    setInput("")
    await chat.sendMessage(message)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleSuggestedQuestion = (question: string) => {
    setInput(question)
    inputRef.current?.focus()
  }

  const handleAttachmentClick = (attachment: any) => {
    switch (attachment.type) {
      case "scene":
        if (onSceneClick) {
          onSceneClick(attachment.id)
        } else {
          timelineAnalysis.jumpToScene(attachment.id)
        }
        break
      case "moment":
        if (onMomentClick) {
          onMomentClick(attachment.id)
        } else {
          timelineAnalysis.jumpToMoment(attachment.id)
        }
        break
      case "timeline_link":
        // Jump to specific time
        if (attachment.data?.timestamp) {
          // Send timeline seek event
          console.log("Jump to timestamp:", attachment.data.timestamp)
        }
        break
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
    } catch (err) {
      console.error("Failed to copy:", err)
    }
  }

  return (
    <TooltipProvider>
      <Card className={cn("flex flex-col h-full", className)}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Bot className="w-5 h-5 text-blue-500" />
              AI Ассистент
              {timelineAnalysis.state.activeProject && (
                <Badge variant="secondary" className="ml-2">
                  Анализ активен
                </Badge>
              )}
            </CardTitle>

            <div className="flex items-center gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={chat.clearChat}
                    disabled={chat.state.messages.length === 0}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Очистить чат</TooltipContent>
              </Tooltip>
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col p-0">
          {/* Messages */}
          <ScrollArea className="flex-1 px-4" ref={scrollAreaRef}>
            <div className="space-y-4 py-4">
              {/* Welcome message */}
              {chat.state.messages.length === 0 && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center py-8">
                  <Sparkles className="w-12 h-12 text-blue-500 mx-auto mb-4" />
                  <h3 className="font-medium mb-2">AI Ассистент готов помочь!</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {timelineAnalysis.state.activeProject
                      ? "Задавайте вопросы об анализе вашего проекта"
                      : "Создайте проект анализа для получения AI-инсайтов"}
                  </p>
                </motion.div>
              )}

              {/* Chat messages */}
              <AnimatePresence>
                {chat.state.messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className={cn("flex gap-3", message.role === "user" ? "justify-end" : "justify-start")}
                  >
                    {message.role === "assistant" && (
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <Bot className="w-4 h-4 text-white" />
                      </div>
                    )}

                    <div className={cn("max-w-[80%] space-y-2", message.role === "user" ? "items-end" : "items-start")}>
                      {/* Message bubble */}
                      <div
                        className={cn(
                          "rounded-lg px-3 py-2 text-sm relative group",
                          message.role === "user" ? "bg-blue-500 text-white" : "bg-muted",
                        )}
                      >
                        <p className="whitespace-pre-wrap">{message.content}</p>

                        {/* Copy button */}
                        <Button
                          variant="ghost"
                          size="sm"
                          className={cn(
                            "absolute -top-8 right-0 opacity-0 group-hover:opacity-100 transition-opacity",
                            message.role === "user" ? "text-white" : "",
                          )}
                          onClick={() => copyToClipboard(message.content)}
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                      </div>

                      {/* Attachments */}
                      {message.attachments && message.attachments.length > 0 && (
                        <div className="space-y-2 w-full">
                          {message.attachments.map((attachment) => (
                            <motion.div
                              key={attachment.id}
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className="bg-background border rounded-lg p-3 cursor-pointer hover:bg-muted/50 transition-colors"
                              onClick={() => handleAttachmentClick(attachment)}
                            >
                              <div className="flex items-center gap-2">
                                {attachment.type === "scene" && <Camera className="w-4 h-4 text-blue-500" />}
                                {attachment.type === "moment" && <Star className="w-4 h-4 text-orange-500" />}
                                {attachment.type === "statistic" && <BarChart3 className="w-4 h-4 text-green-500" />}
                                {attachment.type === "timeline_link" && <Clock className="w-4 h-4 text-purple-500" />}

                                <span className="font-medium text-sm">{attachment.title}</span>
                                <ExternalLink className="w-3 h-3 text-muted-foreground ml-auto" />
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      )}

                      {/* Timestamp */}
                      <div className="text-xs text-muted-foreground">{message.timestamp.toLocaleTimeString()}</div>
                    </div>

                    {message.role === "user" && (
                      <div className="w-8 h-8 bg-gray-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <User className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Loading indicator */}
              {chat.state.isLoading && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3 justify-start">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <div className="bg-muted rounded-lg px-3 py-2">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Error */}
              {chat.state.error && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700"
                >
                  {chat.state.error}
                </motion.div>
              )}
            </div>
          </ScrollArea>

          {/* Suggested questions */}
          {chat.state.suggestedQuestions.length > 0 && (
            <div className="p-4 border-t">
              <p className="text-xs text-muted-foreground mb-2">Предложения:</p>
              <div className="flex flex-wrap gap-2">
                {chat.state.suggestedQuestions.slice(0, 4).map((question, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => handleSuggestedQuestion(question)}
                    className="text-xs h-auto py-1 px-2"
                  >
                    {question}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="p-4 border-t">
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={
                  timelineAnalysis.state.activeProject ? "Спросите об анализе..." : "Как создать проект анализа?"
                }
                disabled={chat.state.isLoading}
                className="flex-1"
              />
              <Button onClick={handleSend} disabled={!input.trim() || chat.state.isLoading} size="icon">
                {chat.state.isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  )
}

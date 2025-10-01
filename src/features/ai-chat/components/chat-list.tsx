import { Copy, Loader2, Trash2 } from "lucide-react"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { ChatListItem } from "@/domains/ai-services/types/chat"
import { cn } from "@/lib/utils"

interface ChatListProps {
  sessions: ChatListItem[]
  currentSessionId: string | null
  isCreatingNew: boolean
  onSelectSession: (id: string) => void
  onDeleteSession: (id: string) => void
  onCopySession: (id: string) => void
}

export function ChatList({
  sessions,
  currentSessionId,
  isCreatingNew,
  onSelectSession,
  onDeleteSession,
  onCopySession,
}: ChatListProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [showAll, setShowAll] = useState(false)

  // Показываем только первые 3 чата, если не раскрыто
  const visibleSessions = showAll ? sessions : sessions.slice(0, 3)
  const hiddenCount = sessions.length - 3

  return (
    <div className="flex flex-col space-y-2">
      <h3 className="px-4 text-sm font-medium text-muted-foreground">Previous Threads</h3>

      <ScrollArea className="flex-1">
        <div className="space-y-1 px-2">
          {/* Временный элемент при создании нового чата */}
          {isCreatingNew && (
            <div className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="flex-1 truncate">составь план рефакторинга</span>
              <span className="text-xs">1 Today</span>
            </div>
          )}

          {/* Список существующих чатов */}
          {visibleSessions.map((session) => (
            <div
              key={session.id}
              className={cn(
                "group flex cursor-pointer items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors hover:bg-muted",
                currentSessionId === session.id && "bg-muted",
              )}
              onClick={() => onSelectSession(session.id)}
              onMouseEnter={() => setHoveredId(session.id)}
              onMouseLeave={() => setHoveredId(null)}
            >
              <span className="flex-1 truncate">{session.title}</span>

              {/* Показываем кнопки действий при наведении */}
              {hoveredId === session.id ? (
                <div className="flex items-center gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6"
                    onClick={(e) => {
                      e.stopPropagation()
                      onCopySession(session.id)
                    }}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6"
                    onClick={(e) => {
                      e.stopPropagation()
                      onDeleteSession(session.id)
                    }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{session.messageCount} messages</span>
                  <span>{session.lastMessageAt ? formatDate(session.lastMessageAt) : "No date"}</span>
                </div>
              )}
            </div>
          ))}

          {/* Кнопка "Show more" если есть скрытые чаты */}
          {!showAll && hiddenCount > 0 && (
            <button
              className="w-full px-3 py-2 text-left text-sm text-muted-foreground hover:text-foreground"
              onClick={() => setShowAll(true)}
            >
              Show {hiddenCount} more...
            </button>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}

// Функция форматирования даты
function formatDate(date: Date): string {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (days === 0) {
    return "Today"
  }
  if (days === 1) {
    return "Yesterday"
  }
  if (days < 7) {
    return `${days} days ago`
  }
  return date.toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "short",
  })
}

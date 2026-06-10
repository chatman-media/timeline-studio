import { Copy, Loader2, Trash2 } from "lucide-react"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { ChatListItem } from "@/core/types/ai-chat"
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
    <div className="flex flex-col space-y-2" data-oid="qq8i3r9">
      <h3 className="px-4 text-sm font-medium text-muted-foreground" data-oid="fes4owo">
        Previous Threads
      </h3>

      <ScrollArea className="flex-1" data-oid="ch:w_xn">
        <div className="space-y-1 px-2" data-oid="sm.1eu:">
          {/* Временный элемент при создании нового чата */}
          {isCreatingNew && (
            <div
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground"
              data-oid="mb2pk_."
            >
              <Loader2 className="h-4 w-4 animate-spin" data-oid="v74hcbv" />
              <span className="flex-1 truncate" data-oid="uro_n6m">
                составь план рефакторинга
              </span>
              <span className="text-xs" data-oid="z3_z0ga">
                1 Today
              </span>
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
              data-oid="xn7:jgw"
            >
              <span className="flex-1 truncate" data-oid="23ejw5w">
                {session.title}
              </span>

              {/* Показываем кнопки действий при наведении */}
              {hoveredId === session.id ? (
                <div className="flex items-center gap-1" data-oid="ddl4jdr">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6"
                    aria-label="Copy session"
                    onClick={(e) => {
                      e.stopPropagation()
                      onCopySession(session.id)
                    }}
                    data-oid="j5-qkp7"
                  >
                    <Copy className="h-3 w-3" data-oid="mbovc:x" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6"
                    aria-label="Delete session"
                    onClick={(e) => {
                      e.stopPropagation()
                      onDeleteSession(session.id)
                    }}
                    data-oid="j6ocu3e"
                  >
                    <Trash2 className="h-3 w-3" data-oid="36gh6y." />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-xs text-muted-foreground" data-oid="5u03wvp">
                  <span data-oid="2mgbliq">{session.messageCount} messages</span>
                  <span data-oid="vuke76g">
                    {session.lastMessageAt ? formatDate(session.lastMessageAt) : "No date"}
                  </span>
                </div>
              )}
            </div>
          ))}

          {/* Кнопка "Show more" если есть скрытые чаты */}
          {!showAll && hiddenCount > 0 && (
            <button
              className="w-full px-3 py-2 text-left text-sm text-muted-foreground hover:text-foreground"
              onClick={() => setShowAll(true)}
              data-oid="2tn-ogu"
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

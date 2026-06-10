/**
 * Fragment Library - библиотека фрагментов из AI анализа
 */

import { Badge } from "@timeline-studio/ui/components/badge"
import { Film, Users } from "lucide-react"
import type { ScriptFragment } from "@/features/timeline/types/script"

export interface FragmentLibraryProps {
  /** Фрагменты для отображения */
  fragments: ScriptFragment[]
  /** Callback при выборе фрагмента */
  onSelectFragment?: (fragment: ScriptFragment) => void
  /** Callback при начале drag */
  onDragStart?: (fragment: ScriptFragment) => void
}

export function FragmentLibrary({ fragments, onSelectFragment, onDragStart }: FragmentLibraryProps) {
  const handleDragStart = (e: React.DragEvent, fragment: ScriptFragment) => {
    e.dataTransfer.setData("application/json", JSON.stringify(fragment))
    e.dataTransfer.effectAllowed = "copy"
    onDragStart?.(fragment)
  }

  return (
    <div className="flex h-full flex-col" data-testid="fragment-library">
      <div className="border-b p-4">
        <h3 className="text-sm font-semibold">Фрагменты из анализа</h3>
        <p className="text-xs text-muted-foreground mt-1">Всего: {fragments.length}</p>
      </div>

      <div className="flex-1 overflow-auto p-2">
        {fragments.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            Нет фрагментов. Запустите анализ в AI Director.
          </div>
        ) : (
          <div className="space-y-2">
            {fragments.map((fragment) => (
              <div
                key={fragment.id}
                className="group cursor-grab rounded-lg border bg-card hover:bg-accent active:cursor-grabbing transition-colors"
                data-testid={`fragment-${fragment.id}`}
                onClick={() => onSelectFragment?.(fragment)}
                draggable
                onDragStart={(e) => handleDragStart(e, fragment)}
              >
                {/* Thumbnail */}
                <div className="relative aspect-video w-full overflow-hidden rounded-t-lg bg-muted">
                  {fragment.thumbnail ? (
                    <img
                      src={fragment.thumbnail}
                      alt={`Fragment ${fragment.startTime}s`}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <Film className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                  {/* Duration overlay */}
                  <div className="absolute bottom-1 right-1 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-medium text-white">
                    {fragment.duration.toFixed(1)}s
                  </div>
                </div>

                {/* Info */}
                <div className="p-2 space-y-1.5">
                  {/* Time range */}
                  <div className="text-xs font-medium">
                    {fragment.startTime.toFixed(1)}s - {fragment.endTime.toFixed(1)}s
                  </div>

                  {/* Quality indicator */}
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          fragment.qualityScore >= 80
                            ? "bg-green-500"
                            : fragment.qualityScore >= 60
                              ? "bg-yellow-500"
                              : "bg-red-500"
                        }`}
                        style={{ width: `${fragment.qualityScore}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-muted-foreground font-medium">{fragment.qualityScore}%</span>
                  </div>

                  {/* Tags: Emotions & Objects */}
                  <div className="flex flex-wrap gap-1">
                    {fragment.emotions?.slice(0, 2).map((emotion) => (
                      <Badge key={emotion} variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
                        {emotion}
                      </Badge>
                    ))}
                    {fragment.facesCount && fragment.facesCount > 0 && (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 flex items-center gap-0.5">
                        <Users className="h-2.5 w-2.5" />
                        {fragment.facesCount}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

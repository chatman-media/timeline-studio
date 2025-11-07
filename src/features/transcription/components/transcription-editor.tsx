import { Clock, Edit2, Plus, Save, X } from "lucide-react"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"
import type { TranscriptionResult, TranscriptionSegment, TranscriptionWord } from "../types"

interface TranscriptionEditorProps {
  result: TranscriptionResult
  onAddToTimeline?: (segments: TranscriptionSegment[]) => void
}

export function TranscriptionEditor({ result, onAddToTimeline }: TranscriptionEditorProps) {
  const { t } = useTranslation()
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editedSegments, setEditedSegments] = useState<Map<number, TranscriptionSegment>>(new Map())

  const getSegment = (id: number): TranscriptionSegment => {
    return editedSegments.get(id) || result.segments.find((s: TranscriptionSegment) => s.id === id)!
  }

  const handleEdit = (segment: TranscriptionSegment) => {
    setEditingId(segment.id)
  }

  const handleSave = (id: number, newText: string) => {
    const segment = getSegment(id)
    const updatedSegment = { ...segment, text: newText }
    setEditedSegments(new Map(editedSegments).set(id, updatedSegment))
    setEditingId(null)
  }

  const handleCancel = () => {
    setEditingId(null)
  }

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    const millis = Math.floor((seconds % 1) * 100)
    return `${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}.${millis.toString().padStart(2, "0")}`
  }

  const handleAddAllToTimeline = () => {
    const segments = result.segments.map((seg: TranscriptionSegment) => editedSegments.get(seg.id) || seg)
    onAddToTimeline?.(segments)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">{t("transcription.results", "Результаты транскрипции")}</h3>
        {onAddToTimeline && (
          <Button size="sm" onClick={handleAddAllToTimeline}>
            <Plus className="mr-2 h-4 w-4" />
            {t("transcription.addToTimeline", "Добавить на таймлайн")}
          </Button>
        )}
      </div>

      <ScrollArea className="h-[400px] rounded-lg border">
        <div className="p-4 space-y-3">
          {result.segments.map((segment: TranscriptionSegment) => {
            const currentSegment = getSegment(segment.id)
            const isEditing = editingId === segment.id
            const isEdited = editedSegments.has(segment.id)

            return (
              <div
                key={segment.id}
                className={`
                  rounded-lg border p-3 space-y-2 transition-colors
                  ${isEditing ? "border-primary" : ""}
                  ${isEdited ? "bg-muted/50" : ""}
                `}
              >
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>{formatTime(segment.start)}</span>
                    <span>→</span>
                    <span>{formatTime(segment.end)}</span>
                  </div>

                  {!isEditing && (
                    <Button size="sm" variant="ghost" onClick={() => handleEdit(segment)}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                {isEditing ? (
                  <div className="space-y-2">
                    <Textarea
                      defaultValue={currentSegment.text}
                      className="min-h-[60px]"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && e.ctrlKey) {
                          handleSave(segment.id, e.currentTarget.value)
                        }
                      }}
                      ref={(textarea) => {
                        if (textarea) {
                          textarea.focus()
                          textarea.setSelectionRange(textarea.value.length, textarea.value.length)
                        }
                      }}
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={(e) => {
                          const textarea = e.currentTarget.parentElement?.parentElement?.querySelector("textarea")
                          if (textarea) {
                            handleSave(segment.id, textarea.value)
                          }
                        }}
                      >
                        <Save className="mr-2 h-4 w-4" />
                        {t("common.save", "Сохранить")}
                      </Button>
                      <Button size="sm" variant="outline" onClick={handleCancel}>
                        <X className="mr-2 h-4 w-4" />
                        {t("common.cancel", "Отмена")}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm leading-relaxed">{currentSegment.text}</p>
                )}

                {/* Временные метки слов */}
                {segment.words && segment.words.length > 0 && (
                  <div className="pt-2 border-t">
                    <details className="text-xs text-muted-foreground">
                      <summary className="cursor-pointer hover:text-foreground">
                        {t("transcription.wordTimings", "Временные метки слов")}
                      </summary>
                      <div className="mt-2 space-y-1">
                        {segment.words.map((word: TranscriptionWord, idx: number) => (
                          <span key={idx} className="inline-block mr-2">
                            {word.word} ({formatTime(word.start)})
                          </span>
                        ))}
                      </div>
                    </details>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </ScrollArea>

      {/* Полный текст */}
      <details className="rounded-lg border p-4">
        <summary className="cursor-pointer font-medium text-sm">{t("transcription.fullText", "Полный текст")}</summary>
        <div className="mt-3">
          <Textarea value={result.text} readOnly className="min-h-[200px] font-mono text-sm" />
        </div>
      </details>
    </div>
  )
}

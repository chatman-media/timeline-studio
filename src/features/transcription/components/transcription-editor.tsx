import { Button } from "@timeline-studio/ui/components/button"
import { ScrollArea } from "@timeline-studio/ui/components/scroll-area"
import { Textarea } from "@timeline-studio/ui/components/textarea"
import { Clock, Edit2, Plus, Save, X } from "lucide-react"
import { useState } from "react"
import { useTranslation } from "react-i18next"
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
    <div className="space-y-4" data-oid="d7yaoj3">
      <div className="flex items-center justify-between" data-oid="i2-sj6z">
        <h3 className="text-sm font-medium" data-oid="wm5_gjf">
          {t("transcription.results", "Результаты транскрипции")}
        </h3>
        {onAddToTimeline && (
          <Button size="sm" onClick={handleAddAllToTimeline} data-oid="-mivr7e">
            <Plus className="mr-2 h-4 w-4" data-oid="1624td0" />
            {t("transcription.addToTimeline", "Добавить на таймлайн")}
          </Button>
        )}
      </div>

      <ScrollArea className="h-[400px] rounded-lg border" data-oid="4_6sqrh">
        <div className="p-4 space-y-3" data-oid="5quy_f5">
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
                data-oid="uifzk9r"
              >
                <div className="flex items-center justify-between text-sm" data-oid="mgd8uu7">
                  <div className="flex items-center gap-2 text-muted-foreground" data-oid="_8lpa1a">
                    <Clock className="h-4 w-4" data-oid="mk3w9i5" />
                    <span data-oid="lwit.c8">{formatTime(segment.start)}</span>
                    <span data-oid=":kbzh48">→</span>
                    <span data-oid="lq2ooyu">{formatTime(segment.end)}</span>
                  </div>

                  {!isEditing && (
                    <Button size="sm" variant="ghost" onClick={() => handleEdit(segment)} data-oid="6yod:ol">
                      <Edit2 className="h-4 w-4" data-oid="a-ko-la" />
                    </Button>
                  )}
                </div>

                {isEditing ? (
                  <div className="space-y-2" data-oid="eol6sjn">
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
                      data-oid="g5ux29e"
                    />

                    <div className="flex gap-2" data-oid="oskt6jh">
                      <Button
                        size="sm"
                        onClick={(e) => {
                          const textarea = e.currentTarget.parentElement?.parentElement?.querySelector("textarea")
                          if (textarea) {
                            handleSave(segment.id, textarea.value)
                          }
                        }}
                        data-oid="d6kp81r"
                      >
                        <Save className="mr-2 h-4 w-4" data-oid="xl2al4k" />
                        {t("common.save", "Сохранить")}
                      </Button>
                      <Button size="sm" variant="outline" onClick={handleCancel} data-oid="9y8gyxe">
                        <X className="mr-2 h-4 w-4" data-oid="t:1mhn4" />
                        {t("common.cancel", "Отмена")}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm leading-relaxed" data-oid="td_q1so">
                    {currentSegment.text}
                  </p>
                )}

                {/* Временные метки слов */}
                {segment.words && segment.words.length > 0 && (
                  <div className="pt-2 border-t" data-oid="azu9cd3">
                    <details className="text-xs text-muted-foreground" data-oid="l80tium">
                      <summary className="cursor-pointer hover:text-foreground" data-oid="7cx7mu7">
                        {t("transcription.wordTimings", "Временные метки слов")}
                      </summary>
                      <div className="mt-2 space-y-1" data-oid="azerpe4">
                        {segment.words.map((word: TranscriptionWord, idx: number) => (
                          <span key={idx} className="inline-block mr-2" data-oid="aik1tq6">
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
      <details className="rounded-lg border p-4" data-oid="z73mx9y">
        <summary className="cursor-pointer font-medium text-sm" data-oid="-nmg7u2">
          {t("transcription.fullText", "Полный текст")}
        </summary>
        <div className="mt-3" data-oid=":3v6n20">
          <Textarea value={result.text} readOnly className="min-h-[200px] font-mono text-sm" data-oid="e-5zks-" />
        </div>
      </details>
    </div>
  )
}

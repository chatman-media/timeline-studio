/**
 * Форма создания/редактирования персоны
 * Позволяет пользователю создавать новых персон или редактировать существующих
 */

import { Tag as TagIcon, Upload, User, X } from "lucide-react"
import { useRef, useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { createLogger } from "@/lib/tauri-logger"
import type { PersonProfile } from "../types/person"

const logger = createLogger({ module: "PersonForm" })

interface PersonFormProps {
  person?: PersonProfile
  isOpen: boolean
  onClose: () => void
  onSave: (personData: Partial<PersonProfile>) => Promise<void>
  isLoading?: boolean
}

export function PersonForm({ person, isOpen, onClose, onSave, isLoading = false }: PersonFormProps) {
  const [formData, setFormData] = useState({
    name: person?.name || "",
    notes: person?.notes || "",
    tags: person?.tags || [],
    thumbnails: person?.thumbnails || [],
  })

  const [newTag, setNewTag] = useState("")
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(
    person?.thumbnails?.find((t) => t.isPrimary)?.imageUrl || person?.thumbnails?.[0]?.imageUrl || null,
  )

  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()],
      }))
      setNewTag("")
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }))
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // В реальном приложении здесь был бы загрузка файла на сервер
      // Пока просто создаем URL для предварительного просмотра
      const fileUrl = URL.createObjectURL(file)
      setThumbnailPreview(fileUrl)
      // В реальном приложении здесь создавался бы объект PersonThumbnail
      // Пока просто обновляем preview
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      return
    }

    try {
      const personData: Partial<PersonProfile> = {
        name: formData.name.trim() || undefined,
        notes: formData.notes.trim() || undefined,
        tags: formData.tags.length > 0 ? formData.tags : [],
        thumbnails: formData.thumbnails,
      }

      await onSave(personData)
      onClose()
    } catch (error) {
      logger.error("Error saving person:", error)
      // Здесь можно добавить toast с ошибкой
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleAddTag()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{person ? "Редактировать персону" : "Добавить персону"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Аватар */}
          <div className="flex items-center space-x-4">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center overflow-hidden">
              {thumbnailPreview ? (
                <img src={thumbnailPreview} alt="Preview" className="h-16 w-16 object-cover" />
              ) : (
                <User className="h-8 w-8 text-muted-foreground" />
              )}
            </div>

            <div className="space-y-2">
              <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                <Upload className="h-4 w-4 mr-2" />
                Загрузить фото
              </Button>

              {thumbnailPreview && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setThumbnailPreview(null)
                    setFormData((prev) => ({ ...prev, thumbnails: [] }))
                  }}
                >
                  Удалить
                </Button>
              )}
            </div>

            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
          </div>

          {/* Имя */}
          <div className="space-y-2">
            <Label htmlFor="name">Имя *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              placeholder="Введите имя персоны"
              required
            />
          </div>

          {/* Примечания */}
          <div className="space-y-2">
            <Label htmlFor="notes">Примечания</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange("notes", e.target.value)}
              placeholder="Дополнительная информация о персоне"
              rows={3}
            />
          </div>

          {/* Теги */}
          <div className="space-y-2">
            <Label>Теги</Label>

            {/* Существующие теги */}
            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {formData.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                    {tag}
                    <button type="button" onClick={() => handleRemoveTag(tag)} className="ml-1 hover:text-destructive">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}

            {/* Поле для добавления тега */}
            <div className="flex space-x-2">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Добавить тег"
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddTag}
                disabled={!newTag.trim() || formData.tags.includes(newTag.trim())}
              >
                <TagIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Отмена
            </Button>
            <Button type="submit" disabled={!formData.name.trim() || isLoading}>
              {isLoading ? "Сохранение..." : "Сохранить"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

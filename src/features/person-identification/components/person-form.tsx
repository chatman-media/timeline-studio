/**
 * Форма создания/редактирования персоны
 * Позволяет пользователю создавать новых персон или редактировать существующих
 */

import { Tag as TagIcon, Upload, User, X } from "lucide-react"
import { useRef, useState } from "react"

import { Badge } from "@timeline-studio/ui/components/badge"
import { Button } from "@timeline-studio/ui/components/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@timeline-studio/ui/components/dialog"
import { Input } from "@timeline-studio/ui/components/input"
import { Label } from "@timeline-studio/ui/components/label"
import { Textarea } from "@timeline-studio/ui/components/textarea"
import { createLogger } from "@/lib/tauri-logger"
import type { PersonProfile } from "../types/person"

const logger = createLogger("PersonForm")

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
      logger.errorSync("Error saving person:", { error })
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
    <Dialog open={isOpen} onOpenChange={onClose} data-oid="haow186">
      <DialogContent className="sm:max-w-[500px]" data-oid="pxs.fph">
        <DialogHeader data-oid="j8u_b1i">
          <DialogTitle data-oid="szobzls">{person ? "Редактировать персону" : "Добавить персону"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4" data-oid="zsqh028">
          {/* Аватар */}
          <div className="flex items-center space-x-4" data-oid="33e5mgw">
            <div
              className="h-16 w-16 rounded-full bg-muted flex items-center justify-center overflow-hidden"
              data-oid="avftxpx"
            >
              {thumbnailPreview ? (
                <img src={thumbnailPreview} alt="Preview" className="h-16 w-16 object-cover" data-oid="_l47eri" />
              ) : (
                <User className="h-8 w-8 text-muted-foreground" data-oid="16xf6jv" />
              )}
            </div>

            <div className="space-y-2" data-oid="de_l0bm">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                data-oid="hy0m7y2"
              >
                <Upload className="h-4 w-4 mr-2" data-oid="y-t.5wo" />
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
                  data-oid="ezip7jr"
                >
                  Удалить
                </Button>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
              data-oid="f1j6jca"
            />
          </div>

          {/* Имя */}
          <div className="space-y-2" data-oid="y77s224">
            <Label htmlFor="name" data-oid="fblpljj">
              Имя *
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              placeholder="Введите имя персоны"
              required
              data-oid="-y1grvg"
            />
          </div>

          {/* Примечания */}
          <div className="space-y-2" data-oid="zzf900z">
            <Label htmlFor="notes" data-oid="i3.z3h_">
              Примечания
            </Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange("notes", e.target.value)}
              placeholder="Дополнительная информация о персоне"
              rows={3}
              data-oid="98g06f0"
            />
          </div>

          {/* Теги */}
          <div className="space-y-2" data-oid="g:lw03e">
            <Label data-oid="g2uw:::">Теги</Label>

            {/* Существующие теги */}
            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2" data-oid="jp_c43f">
                {formData.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="flex items-center gap-1" data-oid="ykqds.w">
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-1 hover:text-destructive"
                      data-oid="-:72umq"
                    >
                      <X className="h-3 w-3" data-oid="3v::lad" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}

            {/* Поле для добавления тега */}
            <div className="flex space-x-2" data-oid="g-_1ol5">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Добавить тег"
                className="flex-1"
                data-oid="pb4oku0"
              />

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddTag}
                disabled={!newTag.trim() || formData.tags.includes(newTag.trim())}
                data-oid="1y7-at-"
              >
                <TagIcon className="h-4 w-4" data-oid="k-qhngb" />
              </Button>
            </div>
          </div>

          <DialogFooter data-oid="zr88e:r">
            <Button type="button" variant="outline" onClick={onClose} data-oid=".7lx.qt">
              Отмена
            </Button>
            <Button type="submit" disabled={!formData.name.trim() || isLoading} data-oid="ndavpwr">
              {isLoading ? "Сохранение..." : "Сохранить"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

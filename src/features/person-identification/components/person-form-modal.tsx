/**
 * Форма создания/редактирования персоны для использования с ModalContainer
 * Позволяет пользователю создавать новых персон или редактировать существующих
 */

import { Tag as TagIcon, Upload, User, X } from "lucide-react"
import { useEffect, useRef, useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useModals } from "@timeline-studio/core/hooks"

import type { PersonProfile } from "../types/person"

export function PersonFormModal() {
  const { modalData, closeModal } = useModals()

  const person = modalData?.person as PersonProfile | undefined
  const onSave = modalData?.onSave as ((personData: Partial<PersonProfile>) => Promise<void>) | undefined
  const isLoading = modalData?.isLoading as boolean | undefined

  const [formData, setFormData] = useState({
    name: "",
    notes: "",
    tags: [] as string[],
    thumbnailUrl: "",
  })

  const [newTag, setNewTag] = useState("")
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  // Инициализация значений при открытии модального окна
  useEffect(() => {
    if (person) {
      setFormData({
        name: person.name || "",
        notes: person.notes || "",
        tags: person.tags || [],
        thumbnailUrl: person.thumbnails?.[0]?.imageUrl || "",
      })
      setThumbnailPreview(person.thumbnails?.[0]?.imageUrl || null)
    }
  }, [person])

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

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Используем URL.createObjectURL для предпросмотра без чтения в память
      // В Tauri это создаст blob: URL который браузерный движок может отобразить
      try {
        const objectUrl = URL.createObjectURL(file)
        setThumbnailPreview(objectUrl)

        // Для сохранения конвертируем в base64 используя современный API
        const arrayBuffer = await file.arrayBuffer()
        const bytes = new Uint8Array(arrayBuffer)
        const binary = bytes.reduce((data, byte) => data + String.fromCharCode(byte), "")
        const base64 = `data:${file.type};base64,${btoa(binary)}`

        setFormData((prev) => ({
          ...prev,
          thumbnailUrl: base64,
        }))
      } catch (error) {
        console.error("Failed to process file:", error)
      }
    }
  }

  const handleSave = async () => {
    if (!formData.name.trim()) {
      return
    }

    const personData: Partial<PersonProfile> = {
      id: person?.id,
      name: formData.name,
      notes: formData.notes,
      tags: formData.tags,
      // В реальном приложении здесь должна быть логика создания thumbnails
      thumbnails: formData.thumbnailUrl
        ? [
            {
              id: crypto.randomUUID(),
              imageUrl: formData.thumbnailUrl,
              width: 150,
              height: 150,
              sourceClipId: "",
              sourceTimestamp: { seconds: 0 },
              quality: 1,
              isPrimary: true,
              isGenerated: false,
            },
          ]
        : undefined,
    }

    await onSave?.(personData)
    closeModal()
  }

  return (
    <div className="space-y-6" data-oid="ag2m0ue">
      {/* Аватар */}
      <div className="flex justify-center" data-oid="pz5is8w">
        <div className="relative" data-oid="rb7gjk-">
          <div className="w-32 h-32 rounded-full overflow-hidden bg-muted" data-oid="zv:s_o6">
            {thumbnailPreview ? (
              <img src={thumbnailPreview} alt="Превью" className="w-full h-full object-cover" data-oid="64:ohfp" />
            ) : (
              <div className="w-full h-full flex items-center justify-center" data-oid="wcmdnud">
                <User className="w-16 h-16 text-muted-foreground" data-oid="0m9141s" />
              </div>
            )}
          </div>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            className="absolute bottom-0 right-0 rounded-full"
            onClick={() => fileInputRef.current?.click()}
            data-oid="jjvk1kx"
          >
            <Upload className="w-4 h-4" data-oid="0spkxbb" />
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
            data-oid="4jk4guu"
          />
        </div>
      </div>

      {/* Форма */}
      <div className="space-y-4" data-oid="ew_2qgk">
        <div data-oid=".o8z4xq">
          <Label htmlFor="name" data-oid="62y3sp-">
            Имя *
          </Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => handleInputChange("name", e.target.value)}
            placeholder="Введите имя персоны"
            required
            data-oid="fk02xl5"
          />
        </div>

        <div data-oid="1gql8cz">
          <Label htmlFor="notes" data-oid="r2sq8d1">
            Заметки
          </Label>
          <Textarea
            id="notes"
            value={formData.notes}
            onChange={(e) => handleInputChange("notes", e.target.value)}
            placeholder="Добавьте заметки о персоне (должность, роль и т.д.)"
            rows={3}
            data-oid="m580oe_"
          />
        </div>

        <div data-oid="2rxlrc.">
          <Label htmlFor="tags" data-oid="km:u:b.">
            Теги
          </Label>
          <div className="space-y-2" data-oid="macb3xx">
            <div className="flex gap-2" data-oid="tnjjgp9">
              <Input
                id="tags"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="Добавить тег"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    handleAddTag()
                  }
                }}
                data-oid="xq-3l9t"
              />

              <Button type="button" variant="secondary" onClick={handleAddTag} data-oid="8h-irdw">
                <TagIcon className="w-4 h-4" data-oid="jbthqux" />
              </Button>
            </div>
            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2" data-oid=".c4cc8.">
                {formData.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="gap-1" data-oid="_x-ayvx">
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-1 hover:text-destructive"
                      data-oid="lynyw17"
                    >
                      <X className="w-3 h-3" data-oid="k2_3zee" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2" data-oid="g.ij9rd">
        <Button variant="outline" onClick={closeModal} disabled={isLoading} data-oid="6t6mg13">
          Отмена
        </Button>
        <Button onClick={handleSave} disabled={!formData.name.trim() || isLoading} data-oid="1-dq656">
          {person ? "Сохранить" : "Создать"}
        </Button>
      </div>
    </div>
  )
}

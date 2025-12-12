import React, { useCallback, useEffect, useMemo, useState } from "react"

import { type MediaFile, MediaType } from "@/domains/media-management"
import type { TemplateResource, TimelineResource } from "@/domains/shared/types/resources"
import { useResources } from "@/domains/video-editing"
import { calculateDimensionsWithAspectRatio } from "@/features/media/utils/preview-sizes"
import { usePlayer, useVideoSelection } from "@/features/video-player"
import { createLogger } from "@/lib/tauri-logger"
import { AddMediaButton, ApplyButton, FavoriteButton } from "../../browser/components/layout"
import type { MediaTemplate } from "../lib/templates"

const logger = createLogger({ module: "TemplatePreview" })

/**
 * Интерфейс пропсов для компонента TemplatePreview
 * @interface TemplatePreviewProps
 * @property {MediaTemplate} template - Объект шаблона для предпросмотра
 * @property {Function} onClick - Функция обработки клика по превью
 * @property {number} size - Базовый размер превью в пикселях
 * @property {[number, number]} dimensions - Размеры шаблона [ширина, высота]
 */
interface TemplatePreviewProps {
  template: MediaTemplate
  onClick: () => void
  size: number
  dimensions: [number, number]
}

/**
 * Компонент для отображения превью шаблона
 * Показывает визуальное представление шаблона и позволяет добавить его в проект
 *
 * @param {TemplatePreviewProps} props - Пропсы компонента
 * @returns {JSX.Element} Компонент превью шаблона
 */
export function TemplatePreview({ template, onClick, size, dimensions }: TemplatePreviewProps) {
  const [width, height] = dimensions // Извлекаем ширину и высоту из размеров

  // Локальное состояние для отслеживания добавления шаблона
  // Используется для мгновенного обновления UI без ожидания обновления из хранилища
  const [localIsAdded, setLocalIsAdded] = useState(false)

  const { applyTemplate } = usePlayer() // Получаем метод для применения шаблона
  const { getVideosForPreview } = useVideoSelection() // Получаем видео для применения шаблона

  // Получаем вычисленные размеры превью с минимумом 150px для шаблонов
  const { height: previewHeight, width: previewWidth } = calculateDimensionsWithAspectRatio(
    size,
    { width, height },
    true, // isTemplate = true для применения минимума 150px
  )

  // Получаем методы для работы с ресурсами шаблонов
  const { addTemplate, isTemplateAdded, removeResource, templateResources } = useResources()

  // Рендерим шаблон используя его render функцию
  const renderedTemplate = template.render()

  // Проверяем, добавлен ли шаблон уже в хранилище ресурсов
  // Мемоизируем результат для оптимизации
  const isAddedFromStore = useMemo(() => {
    return isTemplateAdded(template)
  }, [isTemplateAdded, template])

  /**
   * Эффект для синхронизации локального состояния с состоянием из хранилища
   * При изменении состояния в хранилище, обновляем локальное состояние
   */
  useEffect(() => {
    setLocalIsAdded(isAddedFromStore)
  }, [isAddedFromStore])

  // Используем комбинированное состояние - либо из хранилища, либо локальное
  // Это позволяет мгновенно обновлять UI при добавлении/удалении шаблона
  const isAdded = isAddedFromStore || localIsAdded

  // Обработчик применения шаблона
  const handleApplyTemplate = useCallback(
    (_resource: TimelineResource, _type: string) => {
      logger.info("[TemplatePreview] Applying template:", { templateId: template.id })
      const videos = getVideosForPreview()
      applyTemplate(
        {
          id: template.id,
          name: template.id,
        },
        videos,
      )
    },
    [template, applyTemplate, getVideosForPreview],
  )

  /**
   * Обработчик добавления шаблона в проект
   *
   * @param {React.MouseEvent} e - Событие клика
   * @param {MediaFile} _file - Объект файла (не используется)
   */
  const handleAddTemplate = (e: React.MouseEvent, _file: MediaFile) => {
    e.stopPropagation() // Предотвращаем всплытие события

    // Немедленно обновляем локальное состояние для мгновенного отклика UI
    setLocalIsAdded(true)

    // Добавляем шаблон в хранилище ресурсов
    void addTemplate(template)

    // Принудительно обновляем состояние через небольшую задержку,
    // чтобы кнопка стала видимой сразу после добавления
    setTimeout(() => {
      // Это вызовет перерисовку компонента
      const isAdded = isTemplateAdded(template)
      logger.info("Шаблон добавлен", { templateId: template.id, isAdded })
    }, 10)
  }

  /**
   * Обработчик удаления шаблона из проекта
   *
   * @param {React.MouseEvent} e - Событие клика
   * @param {MediaFile} _file - Объект файла (не используется)
   */
  const handleRemoveTemplate = (e: React.MouseEvent, _file: MediaFile) => {
    e.stopPropagation() // Предотвращаем всплытие события

    // Немедленно обновляем локальное состояние для мгновенного отклика UI
    setLocalIsAdded(false)

    // Находим ресурс с этим шаблоном в списке ресурсов
    const resource = templateResources.find((res: TemplateResource) => res.resourceId === template.id)

    if (resource) {
      // Удаляем ресурс из хранилища
      void removeResource(resource.id)
    } else {
      logger.warn(`Не удалось найти ресурс шаблона с ID ${template.id} для удаления`)
    }
  }

  return (
    <div
      className="group relative cursor-pointer"
      style={{
        // Устанавливаем соотношение сторон и размеры превью
        aspectRatio: `${width} / ${height}`,
        height: `${previewHeight}px`,
        width: `${previewWidth}px`,
      }}
      onClick={onClick}
    >
      {/* Рендерим шаблон с добавлением ключа для React */}
      {React.cloneElement(renderedTemplate, {
        key: `template-preview-${template.id}`,
      })}

      {/* Кнопка добавления в избранное */}
      <FavoriteButton
        file={{ id: template.id, path: "", name: template.id, type: MediaType.Graphics }}
        size={size}
        type="template"
      />

      {/* Кнопка применения шаблона */}
      <ApplyButton
        resource={
          {
            id: template.id,
            type: "template",
            name: template.id,
          } as TemplateResource
        }
        size={size}
        type="template"
        onApply={handleApplyTemplate}
      />

      {/* Контейнер для кнопки добавления/удаления шаблона */}
      <div
        className={`transition-opacity duration-200 ${
          // Показываем кнопку всегда, если шаблон добавлен,
          // или только при наведении, если не добавлен
          isAdded ? "opacity-100" : "opacity-0 group-hover:opacity-100"
        }`}
        style={{ visibility: isAdded ? "visible" : "inherit" }}
      >
        {/* Кнопка добавления/удаления шаблона */}
        <AddMediaButton
          resource={{ id: template.id, type: "template", name: template.id } as TemplateResource}
          size={size}
          type="template"
        />
      </div>
    </div>
  )
}

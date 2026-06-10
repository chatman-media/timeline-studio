/**
 * NoFiles - Универсальный компонент для отображения пустого состояния
 *
 * Показывает сообщение когда нет файлов определенного типа,
 * с инструкциями по добавлению и поддерживаемыми форматами
 */

import { appDirectoriesService } from "@timeline-studio/core/services/app-directories-service"
import { Badge } from "@timeline-studio/ui/components/badge"
import { Button } from "@timeline-studio/ui/components/button"
import { Card, CardContent } from "@timeline-studio/ui/components/card"
import { FileText, Filter, FolderOpen, Music, Palette, Sparkles, Upload, Video } from "lucide-react"
import type React from "react"
import { useEffect, useState } from "react"
import { replaceHomeWithTilde } from "@/lib/path-utils"
import { createLogger } from "@/lib/tauri-logger"

const logger = createLogger("NoFiles")

export type MediaType =
  | "media"
  | "music"
  | "effects"
  | "filters"
  | "transitions"
  | "templates"
  | "style_templates"
  | "subtitles"

interface NoFilesProps {
  type: MediaType
  onImport?: () => void
  className?: string
}

interface MediaTypeConfig {
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  folders: string[]
  formats: string[]
  importText: string
  folderText: string
}

// Базовая конфигурация без путей (пути будут загружены динамически)
const BASE_MEDIA_CONFIGS: Record<MediaType, Omit<MediaTypeConfig, "folders">> = {
  media: {
    title: "Медиафайлы не найдены",
    description: "Добавьте видео, аудио или фото файлы для работы с проектом",
    icon: Video,
    formats: [
      "Видео: MP4, MOV, AVI, MKV, WEBM, INSV (360°)",
      "Аудио: MP3, WAV, AAC, ALAC, OGG, FLAC",
      "Фото: JPG, PNG, GIF, WEBP, TIFF, BMP",
    ],

    importText: "Импортировать медиафайлы",
    folderText: "Или поместите файлы в папку",
  },
  music: {
    title: "Музыкальные файлы не найдены",
    description: "Добавьте музыку и звуковые эффекты для озвучивания проекта",
    icon: Music,
    formats: ["MP3, WAV, AAC, ALAC, OGG, FLAC"],
    importText: "Импортировать музыку",
    folderText: "Или поместите музыку в папку",
  },
  effects: {
    title: "Эффекты не найдены",
    description: "Добавьте видеоэффекты для улучшения ваших клипов",
    icon: Sparkles,
    formats: ["JSON файлы с описанием эффектов"],
    importText: "Импортировать эффекты",
    folderText: "Или поместите эффекты в папку",
  },
  filters: {
    title: "Фильтры не найдены",
    description: "Добавьте цветовые фильтры и коррекцию для видео",
    icon: Filter,
    formats: ["JSON файлы с настройками фильтров"],
    importText: "Импортировать фильтры",
    folderText: "Или поместите фильтры в папку",
  },
  transitions: {
    title: "Переходы не найдены",
    description: "Добавьте переходы между клипами для плавного монтажа",
    icon: Palette,
    formats: ["JSON файлы с анимациями переходов"],
    importText: "Импортировать переходы",
    folderText: "Или поместите переходы в папку",
  },
  templates: {
    title: "Шаблоны не найдены",
    description: "Добавьте готовые шаблоны для быстрого создания проектов",
    icon: FileText,
    formats: ["JSON файлы с настройками шаблонов"],
    importText: "Импортировать шаблоны",
    folderText: "Или поместите шаблоны в папку",
  },
  style_templates: {
    title: "Стилестические шаблоны не найдены",
    description: "Добавьте стилизованные шаблоны с готовым дизайном",
    icon: Palette,
    formats: ["JSON файлы со стилями и настройками"],
    importText: "Импортировать стилестические шаблоны",
    folderText: "Или поместите шаблоны в папку",
  },
  subtitles: {
    title: "Субтитры не найдены",
    description: "Добавьте файлы субтитров или создайте новые",
    icon: FileText,
    formats: ["SRT, VTT, ASS, SSA файлы субтитров"],
    importText: "Импортировать субтитры",
    folderText: "Или поместите субтитры в папку",
  },
}

export function NoFiles({ type, onImport, className }: NoFilesProps) {
  const [folders, setFolders] = useState<string[]>([])
  const [isLoadingFolders, setIsLoadingFolders] = useState(true)

  const baseConfig = BASE_MEDIA_CONFIGS[type]
  const IconComponent = baseConfig.icon

  // Загружаем пути из AppDirectories при монтировании
  useEffect(() => {
    const loadFolders = async () => {
      try {
        const directories = await appDirectoriesService.getAppDirectories()

        // Маппинг типов медиа на поддиректории
        const folderMap: Record<MediaType, string> = {
          media: directories.media_dir,
          music: appDirectoriesService.getMediaSubdirectory("music"),
          effects: appDirectoriesService.getMediaSubdirectory("effects"),
          filters: appDirectoriesService.getMediaSubdirectory("filters"),
          transitions: appDirectoriesService.getMediaSubdirectory("transitions"),
          templates: directories.media_dir, // Шаблоны в корне Media
          style_templates: appDirectoriesService.getMediaSubdirectory("style_templates"),
          subtitles: appDirectoriesService.getMediaSubdirectory("subtitles"),
        }

        const folder = folderMap[type]
        // Заменяем домашнюю директорию на тильду для отображения
        setFolders(folder ? [replaceHomeWithTilde(folder)] : [])
      } catch (error) {
        logger.warn("Could not load app directories:", { error })
        // В случае ошибки показываем пустой массив (не показываем папки вообще)
        setFolders([])
      } finally {
        setIsLoadingFolders(false)
      }
    }

    void loadFolders()
  }, [type])

  return (
    <div
      className={`flex h-full items-center justify-center p-8 ${className || ""}`}
      data-testid="no-files"
      data-oid="723.:h1"
    >
      <Card className="w-full max-w-md" data-oid="53tewz0">
        <CardContent className="pt-6" data-oid="me0n3t9">
          <div className="text-center space-y-4" data-testid="no-files-message" data-oid="edehxtg">
            {/* Иконка */}
            <div className="flex justify-center" data-oid="::g2x4b">
              <div className="p-3 rounded-full bg-muted" data-oid="grcbe.m">
                <IconComponent className="h-8 w-8 text-muted-foreground" data-oid="ush8elt" />
              </div>
            </div>

            {/* Заголовок и описание */}
            <div className="space-y-2" data-oid="1hj7xwy">
              <h3 className="font-semibold text-foreground" data-oid="67_6:x5">
                {baseConfig.title}
              </h3>
              <p className="text-sm text-muted-foreground" data-oid="5vfg_fz">
                {baseConfig.description}
              </p>
            </div>

            {/* Кнопка импорта */}
            {onImport && (
              <Button onClick={onImport} className="w-full" data-oid="qrzx8_z">
                <Upload className="h-4 w-4 mr-2" data-oid="ope-7u-" />
                {baseConfig.importText}
              </Button>
            )}

            {/* Инструкции по папкам */}
            {!isLoadingFolders && folders.length > 0 && (
              <div className="space-y-3 pt-2" data-oid="zr:2dzg">
                <div
                  className="flex items-center justify-center gap-2 text-sm text-muted-foreground"
                  data-oid=".aiitzw"
                >
                  <span data-oid="xdenvsv">{baseConfig.folderText}</span>
                </div>

                {folders.map((folder, index) => (
                  <div key={index} className="flex items-center justify-center gap-2" data-oid="qmk:ul.">
                    <FolderOpen className="h-4 w-4 text-muted-foreground" data-oid="m-q7bju" />
                    <code className="text-xs bg-muted px-2 py-1 rounded font-mono" data-oid="z_7inmm">
                      {folder}
                    </code>
                  </div>
                ))}
              </div>
            )}

            {/* Поддерживаемые форматы */}
            <div className="space-y-2 pt-2" data-oid="bkse:0v">
              <p className="text-xs text-muted-foreground" data-oid="0:fjlpb">
                Поддерживаемые форматы:
              </p>
              <div className="flex flex-wrap gap-1 justify-center" data-oid=".7nl-ym">
                {baseConfig.formats.map((format, index) => (
                  <Badge key={index} variant="outline" className="text-xs" data-oid="9:9aeu5">
                    {format}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

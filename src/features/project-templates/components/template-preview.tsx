/**
 * Template Preview Component
 * Предпросмотр структуры шаблона проекта
 */

import { Clock, Film, Layers, PlayCircle } from "lucide-react"
import type React from "react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"

import type { ProjectTemplate } from "../types/project-template"

export interface TemplatePreviewProps {
  /** Шаблон для предпросмотра */
  template: ProjectTemplate

  /** Показывать детальную информацию */
  showDetails?: boolean

  /** Высота компонента */
  height?: string | number
}

export const TemplatePreview: React.FC<TemplatePreviewProps> = ({ template, showDetails = true, height = "100%" }) => {
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${String(secs).padStart(2, "0")}`
  }

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    const ms = Math.floor((seconds % 1) * 1000)
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}.${String(ms).padStart(3, "0")}`
  }

  return (
    <div className="flex h-full flex-col" style={{ height }}>
      {/* Header */}
      <div className="border-b p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-xl font-semibold">{template.name.ru || template.name.en}</h3>
            <p className="text-muted-foreground text-sm">
              {template.description?.ru || template.description?.en || ""}
            </p>
          </div>
          <Badge variant="outline">{template.category}</Badge>
        </div>

        {/* Quick stats */}
        <div className="mt-4 grid grid-cols-3 gap-4">
          <div className="flex items-center gap-2">
            <Clock className="text-muted-foreground h-4 w-4" />
            <div>
              <div className="text-sm font-medium">{formatDuration(template.estimatedDuration)}</div>
              <div className="text-muted-foreground text-xs">Длительность</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Layers className="text-muted-foreground h-4 w-4" />
            <div>
              <div className="text-sm font-medium">{template.structure.tracks.length}</div>
              <div className="text-muted-foreground text-xs">Треков</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Film className="text-muted-foreground h-4 w-4" />
            <div>
              <div className="text-sm font-medium">{template.structure.sections.length}</div>
              <div className="text-muted-foreground text-xs">Секций</div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="space-y-4 p-4">
          {/* Settings */}
          {showDetails && (
            <Card>
              <CardHeader>
                <CardTitle>Настройки проекта</CardTitle>
                <CardDescription>Параметры видео и аудио</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-muted-foreground">Разрешение</div>
                    <div className="font-medium">
                      {template.settings.resolution.width}x{template.settings.resolution.height}
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">FPS</div>
                    <div className="font-medium">{template.settings.frameRate}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Соотношение сторон</div>
                    <div className="font-medium">{template.settings.aspectRatio}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Аудио</div>
                    <div className="font-medium">
                      {template.settings.audioSampleRate || 48000} Hz, {template.settings.audioChannels || 2} ch
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Sections Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Секции</CardTitle>
              <CardDescription>Структура временной шкалы</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative">
                {/* Timeline bar */}
                <div className="bg-muted relative h-2 w-full overflow-hidden rounded">
                  {template.structure.sections.map((section, _index) => {
                    const left = (section.position / template.estimatedDuration) * 100
                    const width = (section.duration / template.estimatedDuration) * 100

                    // Color based on section type
                    const color =
                      section.type === "intro"
                        ? "bg-blue-500"
                        : section.type === "outro"
                          ? "bg-orange-500"
                          : section.type === "chapter"
                            ? "bg-red-500"
                            : section.type === "transition"
                              ? "bg-purple-500"
                              : "bg-green-500"

                    return (
                      <div
                        key={section.id}
                        className={`absolute top-0 h-full ${color}`}
                        style={{
                          left: `${left}%`,
                          width: `${width}%`,
                        }}
                      />
                    )
                  })}
                </div>

                {/* Sections list */}
                <div className="mt-4 space-y-2">
                  {template.structure.sections.map((section) => {
                    const typeLabel =
                      section.type === "intro"
                        ? "Intro"
                        : section.type === "outro"
                          ? "Outro"
                          : section.type === "chapter"
                            ? "Chapter"
                            : section.type === "transition"
                              ? "Transition"
                              : "Content"

                    return (
                      <div key={section.id} className="border-l-2 border-primary/50 bg-muted/50 rounded-r p-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{section.name.ru || section.name.en}</span>
                              <Badge variant="secondary" className="text-xs">
                                {typeLabel}
                              </Badge>
                            </div>
                            <div className="text-muted-foreground text-xs">
                              {formatTime(section.position)} → {formatTime(section.position + section.duration)}
                            </div>
                          </div>
                          <div className="text-muted-foreground text-sm">{formatDuration(section.duration)}</div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tracks */}
          <Card>
            <CardHeader>
              <CardTitle>Треки</CardTitle>
              <CardDescription>Структура дорожек</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {template.structure.tracks.map((track) => {
                  // Icon and color based on track type
                  const { icon, color } =
                    track.type === "video"
                      ? { icon: Film, color: "text-blue-500" }
                      : track.type === "audio"
                        ? { icon: PlayCircle, color: "text-green-500" }
                        : track.type === "graphics"
                          ? { icon: Layers, color: "text-purple-500" }
                          : { icon: Film, color: "text-gray-500" }

                  const Icon = icon

                  return (
                    <div key={track.id} className="bg-muted/50 flex items-center gap-3 rounded p-3">
                      <Icon className={`h-4 w-4 ${color}`} />
                      <div className="flex-1">
                        <div className="font-medium">{track.name}</div>
                        <div className="text-muted-foreground text-xs capitalize">{track.type}</div>
                      </div>
                      {track.locked && (
                        <Badge variant="secondary" className="text-xs">
                          Locked
                        </Badge>
                      )}
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Placeholders */}
          {template.placeholders &&
            showDetails &&
            (template.placeholders.intro || template.placeholders.outro || template.placeholders.mainContent) && (
              <Card>
                <CardHeader>
                  <CardTitle>Плейсхолдеры</CardTitle>
                  <CardDescription>Места для добавления контента</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {template.placeholders.intro && (
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Intro</span>
                          <Badge variant={template.placeholders.intro.required ? "default" : "outline"}>
                            {template.placeholders.intro.required ? "Обязательно" : "Опционально"}
                          </Badge>
                        </div>
                        <div className="text-muted-foreground text-xs">
                          Длительность: {formatDuration(template.placeholders.intro.duration)}
                        </div>
                      </div>
                    )}
                    {template.placeholders.outro && (
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Outro</span>
                          <Badge variant={template.placeholders.outro.required ? "default" : "outline"}>
                            {template.placeholders.outro.required ? "Обязательно" : "Опционально"}
                          </Badge>
                        </div>
                        <div className="text-muted-foreground text-xs">
                          Длительность: {formatDuration(template.placeholders.outro.duration)}
                        </div>
                      </div>
                    )}
                    {template.placeholders.mainContent && (
                      <div className="space-y-1">
                        <span className="text-sm font-medium">Основной контент</span>
                        <div className="text-muted-foreground text-xs">
                          {template.placeholders.mainContent.minDuration && (
                            <div>Минимум: {formatDuration(template.placeholders.mainContent.minDuration)}</div>
                          )}
                          {template.placeholders.mainContent.maxDuration && (
                            <div>Максимум: {formatDuration(template.placeholders.mainContent.maxDuration)}</div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
        </div>
      </ScrollArea>
    </div>
  )
}

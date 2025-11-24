/**
 * Компонент детального просмотра персоны
 * Показывает подробную информацию о персоне, включая все обнаруженные лица
 */

import { Calendar, Camera, Clock, Image, MapPin, Tag, User } from "lucide-react"
import { useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { formatDurationSeconds } from "@/lib/duration-formatter"

import type { PersonAppearance, PersonProfile, Timecode } from "../types/person"

interface PersonDetailProps {
  person: PersonProfile
  appearances?: PersonAppearance[]
  onEdit: () => void
  onClose: () => void
}

// Вспомогательная функция для форматирования Timecode
function formatTimecode(timecode: Timecode): string {
  return formatDurationSeconds(timecode.seconds)
}

export function PersonDetail({ person, appearances = [], onEdit, onClose }: PersonDetailProps) {
  const [selectedTab, setSelectedTab] = useState("overview")

  // Группируем появления по проектам/клипам
  const appearancesByClip = appearances.reduce<Record<string, PersonAppearance[]>>((acc, appearance) => {
    const clipId = appearance.clipId
    if (!acc[clipId]) {
      acc[clipId] = []
    }
    acc[clipId].push(appearance)
    return acc
  }, {})

  // Статистика
  const totalAppearances = appearances.length
  const totalDuration = appearances.reduce((sum, app) => sum + (app.duration || 0), 0)
  const averageConfidence =
    appearances.length > 0 ? appearances.reduce((sum, app) => sum + app.confidence, 0) / appearances.length : 0

  return (
    <div className="flex h-full flex-col">
      {/* Заголовок */}
      <div className="flex items-center justify-between border-b p-4">
        <div className="flex items-center space-x-3">
          <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
            {person.thumbnails && person.thumbnails.length > 0 && person.thumbnails[0].imageUrl ? (
              <img
                src={person.thumbnails[0].imageUrl}
                alt={person.name}
                className="h-12 w-12 rounded-full object-cover"
              />
            ) : (
              <User className="h-6 w-6 text-muted-foreground" />
            )}
          </div>
          <div>
            <h2 className="text-lg font-semibold">{person.name}</h2>
            {person.notes && <p className="text-sm text-muted-foreground">{person.notes}</p>}
          </div>
        </div>

        <div className="flex space-x-2">
          <Button variant="outline" onClick={onEdit}>
            Редактировать
          </Button>
          <Button variant="ghost" onClick={onClose}>
            Закрыть
          </Button>
        </div>
      </div>

      {/* Содержимое */}
      <div className="flex-1 p-4">
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Обзор</TabsTrigger>
            <TabsTrigger value="faces">Лица ({person.faceEmbeddings?.length || 0})</TabsTrigger>
            <TabsTrigger value="timeline">Появления ({totalAppearances})</TabsTrigger>
          </TabsList>

          {/* Вкладка "Обзор" */}
          <TabsContent value="overview" className="space-y-4">
            {/* Основная информация */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Первое появление: {formatTimecode(person.firstSeen)}</span>
                </div>

                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Последнее появление: {formatTimecode(person.lastSeen)}</span>
                </div>

                <div className="flex items-center space-x-2">
                  <Camera className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Лиц обнаружено: {person.faceEmbeddings?.length || 0}</span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Появлений: {totalAppearances}</span>
                </div>

                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Общее время: {Math.round(totalDuration)}с</span>
                </div>

                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className="text-xs">
                    Уверенность: {Math.round(averageConfidence * 100)}%
                  </Badge>
                </div>
              </div>
            </div>

            <Separator />

            {/* Теги */}
            {person.tags && person.tags.length > 0 && (
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <Tag className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Теги</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {person.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Заметки */}
            {person.notes && (
              <div>
                <h3 className="text-sm font-medium mb-2">Заметки</h3>
                <p className="text-sm text-muted-foreground">{person.notes}</p>
              </div>
            )}
          </TabsContent>

          {/* Вкладка "Лица" */}
          <TabsContent value="faces">
            <ScrollArea className="h-96">
              {person.thumbnails && person.thumbnails.length > 0 ? (
                <div className="grid grid-cols-3 gap-4">
                  {person.thumbnails.map((thumbnail, index) => (
                    <div key={thumbnail.id} className="space-y-2">
                      <div className="aspect-square bg-muted rounded-lg flex items-center justify-center">
                        {thumbnail.imageUrl ? (
                          <img
                            src={thumbnail.imageUrl}
                            alt={`Thumbnail ${Number(index) + 1}`}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        ) : (
                          <User className="h-8 w-8 text-muted-foreground" />
                        )}
                      </div>
                      <div className="text-xs text-center space-y-1">
                        <div>Качество: {Math.round(thumbnail.quality * 100)}%</div>
                        <div className="text-muted-foreground">
                          {thumbnail.width}×{thumbnail.height}px
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Image className="h-12 w-12 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">Лица еще не обнаружены</p>
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          {/* Вкладка "Появления" */}
          <TabsContent value="timeline">
            <ScrollArea className="h-96">
              {appearances.length > 0 ? (
                <div className="space-y-4">
                  {Object.entries(appearancesByClip).map(([clipId, clipAppearances]) => (
                    <div key={clipId} className="border rounded-lg p-3">
                      <h4 className="font-medium text-sm mb-2">Клип: {clipId}</h4>
                      <div className="space-y-2">
                        {clipAppearances.map((appearance, index) => (
                          <div key={index} className="flex items-center justify-between text-sm">
                            <div className="flex items-center space-x-2">
                              <Clock className="h-3 w-3 text-muted-foreground" />
                              <span>
                                {formatTimecode(appearance.startTime)} - {formatTimecode(appearance.endTime)}
                              </span>
                            </div>
                            <div className="flex space-x-2">
                              <Badge variant="outline" className="text-xs">
                                {Math.round(appearance.confidence * 100)}%
                              </Badge>
                              {appearance.duration && (
                                <span className="text-xs text-muted-foreground">
                                  {Math.round(appearance.duration)}с
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <MapPin className="h-12 w-12 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">Появления на Timeline пока не найдены</p>
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

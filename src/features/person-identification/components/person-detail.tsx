/**
 * Компонент детального просмотра персоны
 * Показывает подробную информацию о персоне, включая все обнаруженные лица
 */

import { Badge } from "@timeline-studio/ui/components/badge"
import { Button } from "@timeline-studio/ui/components/button"
import { ScrollArea } from "@timeline-studio/ui/components/scroll-area"
import { Separator } from "@timeline-studio/ui/components/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@timeline-studio/ui/components/tabs"
import { Calendar, Camera, Clock, Image, MapPin, Tag, User } from "lucide-react"
import { useState } from "react"
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
    <div className="flex h-full flex-col" data-oid="8jdzd7u">
      {/* Заголовок */}
      <div className="flex items-center justify-between border-b p-4" data-oid=".4qc1s7">
        <div className="flex items-center space-x-3" data-oid="2.1e0i-">
          <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center" data-oid="uguxx:4">
            {person.thumbnails && person.thumbnails.length > 0 && person.thumbnails[0].imageUrl ? (
              <img
                src={person.thumbnails[0].imageUrl}
                alt={person.name}
                className="h-12 w-12 rounded-full object-cover"
                data-oid="r6_llr8"
              />
            ) : (
              <User className="h-6 w-6 text-muted-foreground" data-oid=".1kuig1" />
            )}
          </div>
          <div data-oid="dx_d2hc">
            <h2 className="text-lg font-semibold" data-oid="stf35oa">
              {person.name}
            </h2>
            {person.notes && (
              <p className="text-sm text-muted-foreground" data-oid="aly5kfj">
                {person.notes}
              </p>
            )}
          </div>
        </div>

        <div className="flex space-x-2" data-oid="m0lw.y0">
          <Button variant="outline" onClick={onEdit} data-oid="aw8xb2r">
            Редактировать
          </Button>
          <Button variant="ghost" onClick={onClose} data-oid="kk5u5:r">
            Закрыть
          </Button>
        </div>
      </div>

      {/* Содержимое */}
      <div className="flex-1 p-4" data-oid="8pxy8yk">
        <Tabs value={selectedTab} onValueChange={setSelectedTab} data-oid="ceholmx">
          <TabsList className="grid w-full grid-cols-3" data-oid="697m3ap">
            <TabsTrigger value="overview" data-oid="la4dy3:">
              Обзор
            </TabsTrigger>
            <TabsTrigger value="faces" data-oid="2f4ew85">
              Лица ({person.faceEmbeddings?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="timeline" data-oid="jeoyvao">
              Появления ({totalAppearances})
            </TabsTrigger>
          </TabsList>

          {/* Вкладка "Обзор" */}
          <TabsContent value="overview" className="space-y-4" data-oid="kverakr">
            {/* Основная информация */}
            <div className="grid grid-cols-2 gap-4" data-oid="x_xxn4u">
              <div className="space-y-3" data-oid="o.4_9-v">
                <div className="flex items-center space-x-2" data-oid="p6-4g_l">
                  <Calendar className="h-4 w-4 text-muted-foreground" data-oid=":a3.10p" />
                  <span className="text-sm" data-oid="8fsfpju">
                    Первое появление: {formatTimecode(person.firstSeen)}
                  </span>
                </div>

                <div className="flex items-center space-x-2" data-oid="t:x.h0w">
                  <Clock className="h-4 w-4 text-muted-foreground" data-oid="b9_-4dq" />
                  <span className="text-sm" data-oid="dxmxoe5">
                    Последнее появление: {formatTimecode(person.lastSeen)}
                  </span>
                </div>

                <div className="flex items-center space-x-2" data-oid=".io.kom">
                  <Camera className="h-4 w-4 text-muted-foreground" data-oid="i9b2wdt" />
                  <span className="text-sm" data-oid="q-s1ne7">
                    Лиц обнаружено: {person.faceEmbeddings?.length || 0}
                  </span>
                </div>
              </div>

              <div className="space-y-3" data-oid="pj.r.yy">
                <div className="flex items-center space-x-2" data-oid="4evggfv">
                  <MapPin className="h-4 w-4 text-muted-foreground" data-oid="4icquah" />
                  <span className="text-sm" data-oid="h9a2qba">
                    Появлений: {totalAppearances}
                  </span>
                </div>

                <div className="flex items-center space-x-2" data-oid="i2jjzrw">
                  <Clock className="h-4 w-4 text-muted-foreground" data-oid="21an1xw" />
                  <span className="text-sm" data-oid="88m5mrd">
                    Общее время: {Math.round(totalDuration)}с
                  </span>
                </div>

                <div className="flex items-center space-x-2" data-oid="aqdxktx">
                  <Badge variant="outline" className="text-xs" data-oid="-pqrec3">
                    Уверенность: {Math.round(averageConfidence * 100)}%
                  </Badge>
                </div>
              </div>
            </div>

            <Separator data-oid="6su5r_5" />

            {/* Теги */}
            {person.tags && person.tags.length > 0 && (
              <div data-oid="7-e:biz">
                <div className="flex items-center space-x-2 mb-2" data-oid="biup1kr">
                  <Tag className="h-4 w-4 text-muted-foreground" data-oid="e:-wi6n" />
                  <span className="text-sm font-medium" data-oid="gxfhxqm">
                    Теги
                  </span>
                </div>
                <div className="flex flex-wrap gap-2" data-oid="7ul5hto">
                  {person.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" data-oid="xemtppr">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Заметки */}
            {person.notes && (
              <div data-oid=".n0qd:s">
                <h3 className="text-sm font-medium mb-2" data-oid="n7_vpaq">
                  Заметки
                </h3>
                <p className="text-sm text-muted-foreground" data-oid=":v875s_">
                  {person.notes}
                </p>
              </div>
            )}
          </TabsContent>

          {/* Вкладка "Лица" */}
          <TabsContent value="faces" data-oid="lcwzfef">
            <ScrollArea className="h-96" data-oid="4dhx0u0">
              {person.thumbnails && person.thumbnails.length > 0 ? (
                <div className="grid grid-cols-3 gap-4" data-oid="5_if0wl">
                  {person.thumbnails.map((thumbnail, index) => (
                    <div key={thumbnail.id} className="space-y-2" data-oid="x8nesiy">
                      <div
                        className="aspect-square bg-muted rounded-lg flex items-center justify-center"
                        data-oid="tnr50rw"
                      >
                        {thumbnail.imageUrl ? (
                          <img
                            src={thumbnail.imageUrl}
                            alt={`Thumbnail ${Number(index) + 1}`}
                            className="w-full h-full object-cover rounded-lg"
                            data-oid="12jkh-."
                          />
                        ) : (
                          <User className="h-8 w-8 text-muted-foreground" data-oid="p-axael" />
                        )}
                      </div>
                      <div className="text-xs text-center space-y-1" data-oid="g.mm6b-">
                        <div data-oid="u07c_oi">Качество: {Math.round(thumbnail.quality * 100)}%</div>
                        <div className="text-muted-foreground" data-oid="p3vip52">
                          {thumbnail.width}×{thumbnail.height}px
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center" data-oid="05ul7qf">
                  <Image className="h-12 w-12 text-muted-foreground mb-2" data-oid="qyuxw9s" />
                  <p className="text-sm text-muted-foreground" data-oid="1jmwsnt">
                    Лица еще не обнаружены
                  </p>
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          {/* Вкладка "Появления" */}
          <TabsContent value="timeline" data-oid="hmc0whs">
            <ScrollArea className="h-96" data-oid="3zv.p9t">
              {appearances.length > 0 ? (
                <div className="space-y-4" data-oid="f_fugv7">
                  {Object.entries(appearancesByClip).map(([clipId, clipAppearances]) => (
                    <div key={clipId} className="border rounded-lg p-3" data-oid="mh2oqrm">
                      <h4 className="font-medium text-sm mb-2" data-oid="iouw2_e">
                        Клип: {clipId}
                      </h4>
                      <div className="space-y-2" data-oid="sa34e:s">
                        {clipAppearances.map((appearance, index) => (
                          <div key={index} className="flex items-center justify-between text-sm" data-oid="8r4:gw9">
                            <div className="flex items-center space-x-2" data-oid="5aur23i">
                              <Clock className="h-3 w-3 text-muted-foreground" data-oid="b-0mm.z" />
                              <span data-oid=".-phcvd">
                                {formatTimecode(appearance.startTime)} - {formatTimecode(appearance.endTime)}
                              </span>
                            </div>
                            <div className="flex space-x-2" data-oid="kesv:.7">
                              <Badge variant="outline" className="text-xs" data-oid="ugy0y-s">
                                {Math.round(appearance.confidence * 100)}%
                              </Badge>
                              {appearance.duration && (
                                <span className="text-xs text-muted-foreground" data-oid="dac3wmq">
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
                <div className="flex flex-col items-center justify-center py-8 text-center" data-oid="-075_dn">
                  <MapPin className="h-12 w-12 text-muted-foreground mb-2" data-oid="9dxvm5t" />
                  <p className="text-sm text-muted-foreground" data-oid=".7_.j.:">
                    Появления на Timeline пока не найдены
                  </p>
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

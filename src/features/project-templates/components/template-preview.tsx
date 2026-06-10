/**
 * Template Preview Component
 * Предпросмотр структуры шаблона проекта
 */

import { Clock, Film, Layers, PlayCircle } from "lucide-react"
import type React from "react"

import { Badge } from "@timeline-studio/ui/components/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@timeline-studio/ui/components/card"
import { ScrollArea } from "@timeline-studio/ui/components/scroll-area"

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
    <div className="flex h-full flex-col" style={{ height }} data-oid="eexsn8m">
      {/* Header */}
      <div className="border-b p-4" data-oid="qdj2pep">
        <div className="flex items-start justify-between" data-oid="4yutyn.">
          <div className="flex-1" data-oid="mln:ajh">
            <h3 className="text-xl font-semibold" data-oid="-pz.-3r">
              {template.name.ru || template.name.en}
            </h3>
            <p className="text-muted-foreground text-sm" data-oid=".o-u4_1">
              {template.description?.ru || template.description?.en || ""}
            </p>
          </div>
          <Badge variant="outline" data-oid="t341umi">
            {template.category}
          </Badge>
        </div>

        {/* Quick stats */}
        <div className="mt-4 grid grid-cols-3 gap-4" data-oid="o:h0cxy">
          <div className="flex items-center gap-2" data-oid="tijw96b">
            <Clock className="text-muted-foreground h-4 w-4" data-oid="jyxcuqz" />
            <div data-oid="pr5qmar">
              <div className="text-sm font-medium" data-oid="j:u9-rn">
                {formatDuration(template.estimatedDuration)}
              </div>
              <div className="text-muted-foreground text-xs" data-oid="89aj-o.">
                Длительность
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2" data-oid="tky4u_j">
            <Layers className="text-muted-foreground h-4 w-4" data-oid=":u3d-48" />
            <div data-oid="bgnlb_5">
              <div className="text-sm font-medium" data-oid="ebo2j.b">
                {template.structure.tracks.length}
              </div>
              <div className="text-muted-foreground text-xs" data-oid="mhc.z-1">
                Треков
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2" data-oid="g3bpe6r">
            <Film className="text-muted-foreground h-4 w-4" data-oid="ll5-fx:" />
            <div data-oid="xnk.05c">
              <div className="text-sm font-medium" data-oid="pqkt.wp">
                {template.structure.sections.length}
              </div>
              <div className="text-muted-foreground text-xs" data-oid="4o98t6c">
                Секций
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1" data-oid="idak-lj">
        <div className="space-y-4 p-4" data-oid="nwb.2:i">
          {/* Settings */}
          {showDetails && (
            <Card data-oid="yiw5tz3">
              <CardHeader data-oid="psrm:x5">
                <CardTitle data-oid="i63d3jg">Настройки проекта</CardTitle>
                <CardDescription data-oid="5bs3tvm">Параметры видео и аудио</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm" data-oid="tu:4m4z">
                <div className="grid grid-cols-2 gap-4" data-oid="65k:61k">
                  <div data-oid="q:03nh3">
                    <div className="text-muted-foreground" data-oid="7:d.96a">
                      Разрешение
                    </div>
                    <div className="font-medium" data-oid="g_id6pf">
                      {template.settings.resolution}
                    </div>
                  </div>
                  <div data-oid="hwf-ge1">
                    <div className="text-muted-foreground" data-oid="n3zp2ac">
                      FPS
                    </div>
                    <div className="font-medium" data-oid="9838rjs">
                      {template.settings.frameRate}
                    </div>
                  </div>
                  <div data-oid="f.g3gxo">
                    <div className="text-muted-foreground" data-oid="g9ubh1g">
                      Соотношение сторон
                    </div>
                    <div className="font-medium" data-oid="hfmjsrj">
                      {template.settings.aspectRatio.label}
                    </div>
                  </div>
                  <div data-oid="b4r._73">
                    <div className="text-muted-foreground" data-oid="yko7ytv">
                      Цветовое пространство
                    </div>
                    <div className="font-medium" data-oid="tj:f70p">
                      {template.settings.colorSpace}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Sections Timeline */}
          <Card data-oid="kosld-w">
            <CardHeader data-oid="5x1zc7t">
              <CardTitle data-oid="fp..obq">Секции</CardTitle>
              <CardDescription data-oid="m6xlmtb">Структура временной шкалы</CardDescription>
            </CardHeader>
            <CardContent data-oid="jcbktpj">
              <div className="relative" data-oid="v4x.r2y">
                {/* Timeline bar */}
                <div className="bg-muted relative h-2 w-full overflow-hidden rounded" data-oid="rb03186">
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
                        data-oid="_y5zgm8"
                      />
                    )
                  })}
                </div>

                {/* Sections list */}
                <div className="mt-4 space-y-2" data-oid="39j7ok3">
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
                      <div
                        key={section.id}
                        className="border-l-2 border-primary/50 bg-muted/50 rounded-r p-2"
                        data-oid="4e8xl-2"
                      >
                        <div className="flex items-center justify-between" data-oid="b_oj5le">
                          <div data-oid="40cp47q">
                            <div className="flex items-center gap-2" data-oid="ls.ah21">
                              <span className="font-medium" data-oid="qk:b0dg">
                                {section.name.ru || section.name.en}
                              </span>
                              <Badge variant="secondary" className="text-xs" data-oid="x23nuqh">
                                {typeLabel}
                              </Badge>
                            </div>
                            <div className="text-muted-foreground text-xs" data-oid="7n.hs_o">
                              {formatTime(section.position)} → {formatTime(section.position + section.duration)}
                            </div>
                          </div>
                          <div className="text-muted-foreground text-sm" data-oid="h:074rg">
                            {formatDuration(section.duration)}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tracks */}
          <Card data-oid="3zufk68">
            <CardHeader data-oid="e71tcal">
              <CardTitle data-oid="s3sa7f6">Треки</CardTitle>
              <CardDescription data-oid="_ww1jmb">Структура дорожек</CardDescription>
            </CardHeader>
            <CardContent data-oid="h10cpgn">
              <div className="space-y-2" data-oid="4f.cywf">
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
                    <div key={track.id} className="bg-muted/50 flex items-center gap-3 rounded p-3" data-oid="0om5623">
                      <Icon className={`h-4 w-4 ${color}`} data-oid="sa6jqvq" />
                      <div className="flex-1" data-oid="ekeiird">
                        <div className="font-medium" data-oid="-getf-m">
                          {track.name}
                        </div>
                        <div className="text-muted-foreground text-xs capitalize" data-oid="s3yx-j9">
                          {track.type}
                        </div>
                      </div>
                      {track.locked && (
                        <Badge variant="secondary" className="text-xs" data-oid="g7jfcyg">
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
              <Card data-oid="3ts0zq6">
                <CardHeader data-oid="zapybso">
                  <CardTitle data-oid="isxuxi2">Плейсхолдеры</CardTitle>
                  <CardDescription data-oid="_kqb3c0">Места для добавления контента</CardDescription>
                </CardHeader>
                <CardContent data-oid="93_o7zb">
                  <div className="space-y-3" data-oid="3-eq5xi">
                    {template.placeholders.intro && (
                      <div className="space-y-1" data-oid="g9hm71o">
                        <div className="flex items-center justify-between" data-oid="4025ixv">
                          <span className="text-sm font-medium" data-oid="cpmgu1u">
                            Intro
                          </span>
                          <Badge
                            variant={template.placeholders.intro.required ? "default" : "outline"}
                            data-oid=".hc38ke"
                          >
                            {template.placeholders.intro.required ? "Обязательно" : "Опционально"}
                          </Badge>
                        </div>
                        <div className="text-muted-foreground text-xs" data-oid="5a:5oiz">
                          Длительность: {formatDuration(template.placeholders.intro.duration)}
                        </div>
                      </div>
                    )}
                    {template.placeholders.outro && (
                      <div className="space-y-1" data-oid="jcqngm_">
                        <div className="flex items-center justify-between" data-oid="-x7ar11">
                          <span className="text-sm font-medium" data-oid="l.x6cq1">
                            Outro
                          </span>
                          <Badge
                            variant={template.placeholders.outro.required ? "default" : "outline"}
                            data-oid="rc633l4"
                          >
                            {template.placeholders.outro.required ? "Обязательно" : "Опционально"}
                          </Badge>
                        </div>
                        <div className="text-muted-foreground text-xs" data-oid="7pc3yan">
                          Длительность: {formatDuration(template.placeholders.outro.duration)}
                        </div>
                      </div>
                    )}
                    {template.placeholders.mainContent && (
                      <div className="space-y-1" data-oid="dw-p5ju">
                        <span className="text-sm font-medium" data-oid="zev2pet">
                          Основной контент
                        </span>
                        <div className="text-muted-foreground text-xs" data-oid="mmu:hoi">
                          {template.placeholders.mainContent.minDuration && (
                            <div data-oid="ndjztb8">
                              Минимум: {formatDuration(template.placeholders.mainContent.minDuration)}
                            </div>
                          )}
                          {template.placeholders.mainContent.maxDuration && (
                            <div data-oid="0axs7e_">
                              Максимум: {formatDuration(template.placeholders.mainContent.maxDuration)}
                            </div>
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

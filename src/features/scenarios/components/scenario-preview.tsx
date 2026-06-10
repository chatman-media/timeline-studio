/**
 * Scenario Preview Component
 * Предпросмотр структуры и шагов сценария монтажа
 */

import { Badge } from "@timeline-studio/ui/components/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@timeline-studio/ui/components/card"
import { ScrollArea } from "@timeline-studio/ui/components/scroll-area"
import { AlertCircle, Check, Clock, Sparkles, Zap } from "lucide-react"
import type React from "react"

import type { Scenario } from "../types/scenario"

export interface ScenarioPreviewProps {
  /** Сценарий для предпросмотра */
  scenario: Scenario

  /** Показывать детальную информацию */
  showDetails?: boolean

  /** Высота компонента */
  height?: string | number
}

export const ScenarioPreview: React.FC<ScenarioPreviewProps> = ({ scenario, showDetails = true, height = "100%" }) => {
  /**
   * Форматирование времени
   */
  const formatTime = (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes} мин`
    }
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return mins > 0 ? `${hours} ч ${mins} мин` : `${hours} ч`
  }

  /**
   * Цвет сложности
   */
  const getDifficultyColor = (difficulty: Scenario["difficulty"]): string => {
    return {
      beginner: "bg-green-500/10 text-green-500",
      intermediate: "bg-yellow-500/10 text-yellow-500",
      advanced: "bg-red-500/10 text-red-500",
    }[difficulty]
  }

  /**
   * Название сложности
   */
  const getDifficultyLabel = (difficulty: Scenario["difficulty"]): string => {
    return {
      beginner: "Начальный",
      intermediate: "Средний",
      advanced: "Продвинутый",
    }[difficulty]
  }

  /**
   * Цвет типа шага
   */
  const getStepTypeColor = (type: string): string => {
    const colorMap: Record<string, string> = {
      "select-clips": "bg-blue-500/10 text-blue-500",
      "add-template": "bg-purple-500/10 text-purple-500",
      "add-intro": "bg-green-500/10 text-green-500",
      "add-outro": "bg-orange-500/10 text-orange-500",
      "add-cuts": "bg-red-500/10 text-red-500",
      "add-music": "bg-pink-500/10 text-pink-500",
      "analyze-audio": "bg-cyan-500/10 text-cyan-500",
      "analyze-video": "bg-indigo-500/10 text-indigo-500",
      "apply-transitions": "bg-violet-500/10 text-violet-500",
      "apply-effects": "bg-fuchsia-500/10 text-fuchsia-500",
      "sync-beats": "bg-rose-500/10 text-rose-500",
      "auto-montage": "bg-amber-500/10 text-amber-500",
      "add-chapters": "bg-lime-500/10 text-lime-500",
      preview: "bg-gray-500/10 text-gray-500",
    }
    return colorMap[type] || "bg-gray-500/10 text-gray-500"
  }

  return (
    <div className="flex h-full flex-col" style={{ height }} data-oid="zkoj2g5">
      {/* Header */}
      <div className="border-b p-4" data-oid="b320yms">
        <div className="flex items-start justify-between" data-oid="kanj8i-">
          <div className="flex-1" data-oid="dzmvlu3">
            <h3 className="text-xl font-semibold" data-oid="omlwjk:">
              {scenario.name.ru}
            </h3>
            <p className="text-muted-foreground mt-1 text-sm" data-oid="tnz_iyw">
              {scenario.description.ru}
            </p>
          </div>
          <div className="flex flex-col gap-2" data-oid="h::0r0d">
            <Badge variant="outline" data-oid="fl7v4w7">
              {scenario.category}
            </Badge>
            <Badge variant="outline" className={getDifficultyColor(scenario.difficulty)} data-oid="rl4b1k9">
              {getDifficultyLabel(scenario.difficulty)}
            </Badge>
          </div>
        </div>

        {/* Quick stats */}
        <div className="mt-4 flex items-center gap-6" data-oid="3sqv37o">
          <div className="flex items-center gap-2" data-oid="re1wi-8">
            <Clock className="text-muted-foreground h-4 w-4" data-oid="-kd_n55" />
            <div data-oid="0v:yaqt">
              <div className="text-sm font-medium" data-oid=":zkbf_s">
                {formatTime(scenario.estimatedTime)}
              </div>
              <div className="text-muted-foreground text-xs" data-oid="ad:q76l">
                Время выполнения
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2" data-oid="cyapqfw">
            <Zap className="text-muted-foreground h-4 w-4" data-oid="8gw7m.v" />
            <div data-oid="l1tf2kq">
              <div className="text-sm font-medium" data-oid="_1gmkkt">
                {scenario.steps.length}
              </div>
              <div className="text-muted-foreground text-xs" data-oid="ktspuh2">
                Шагов
              </div>
            </div>
          </div>
          {scenario.requirements.aiAssisted && (
            <div className="flex items-center gap-2" data-oid="2cwhtb_">
              <Sparkles className="text-muted-foreground h-4 w-4" data-oid="p.jpgqg" />
              <div data-oid="bn06cdm">
                <div className="text-sm font-medium" data-oid="6r1-q.k">
                  AI
                </div>
                <div className="text-muted-foreground text-xs" data-oid="8:v1vjf">
                  Автоматизация
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1" data-oid="3ue990d">
        <div className="space-y-4 p-4" data-oid="d1.j93g">
          {/* Requirements */}
          {showDetails && (
            <Card data-oid="q7j2gh9">
              <CardHeader data-oid="eggsk63">
                <CardTitle data-oid="eh8u1ex">Требования</CardTitle>
                <CardDescription data-oid="xbco0_5">Необходимые условия для выполнения сценария</CardDescription>
              </CardHeader>
              <CardContent data-oid="nqe9yrg">
                <div className="space-y-2 text-sm" data-oid="ywrnrz3">
                  {scenario.requirements.minClips && (
                    <div className="flex justify-between" data-oid="yndrx2u">
                      <span className="text-muted-foreground" data-oid="4a3-0ne">
                        Минимум клипов
                      </span>
                      <span className="font-medium" data-oid="av3v06i">
                        {scenario.requirements.minClips}
                      </span>
                    </div>
                  )}
                  {scenario.requirements.maxClips && (
                    <div className="flex justify-between" data-oid="rzcp2:b">
                      <span className="text-muted-foreground" data-oid="3fb4x4x">
                        Максимум клипов
                      </span>
                      <span className="font-medium" data-oid=":ciwk4_">
                        {scenario.requirements.maxClips}
                      </span>
                    </div>
                  )}
                  {scenario.requirements.requiresIntro && (
                    <div className="flex items-center gap-2" data-oid="d6ik8z-">
                      <Check className="h-4 w-4 text-green-500" data-oid="znh:.at" />
                      <span className="text-muted-foreground" data-oid="lp7jpm6">
                        Требуется интро
                      </span>
                    </div>
                  )}
                  {scenario.requirements.requiresOutro && (
                    <div className="flex items-center gap-2" data-oid="2.1za7x">
                      <Check className="h-4 w-4 text-green-500" data-oid="lamov:5" />
                      <span className="text-muted-foreground" data-oid="-13i_au">
                        Требуется аутро
                      </span>
                    </div>
                  )}
                  {scenario.requirements.requiresMusic && (
                    <div className="flex items-center gap-2" data-oid="xjus_k:">
                      <Check className="h-4 w-4 text-green-500" data-oid="48hqpb0" />
                      <span className="text-muted-foreground" data-oid="hp7yiaj">
                        Требуется музыка
                      </span>
                    </div>
                  )}
                  {scenario.requirements.requiresCuts && (
                    <div className="flex items-center gap-2" data-oid="nyw1njx">
                      <Check className="h-4 w-4 text-green-500" data-oid="dpmea_l" />
                      <span className="text-muted-foreground" data-oid="as8r_gw">
                        Требуются вырезки
                      </span>
                    </div>
                  )}
                  {scenario.requirements.requiresMultiCamera && (
                    <div className="flex items-center gap-2" data-oid="443ktv0">
                      <Check className="h-4 w-4 text-green-500" data-oid="j3kn0-b" />
                      <span className="text-muted-foreground" data-oid="xuuj.x4">
                        Мульти-камера
                      </span>
                    </div>
                  )}
                  {scenario.requirements.aiAssisted && (
                    <div className="flex items-center gap-2" data-oid="ue69xq4">
                      <Sparkles className="h-4 w-4 text-purple-500" data-oid="1362i8s" />
                      <span className="text-muted-foreground" data-oid="q6gm6_:">
                        ИИ-автоматизация
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Steps */}
          <Card data-oid="nae-0b2">
            <CardHeader data-oid="ju6ucag">
              <CardTitle data-oid="ab6nf_e">Шаги сценария</CardTitle>
              <CardDescription data-oid="ocvw9kc">Последовательность выполнения</CardDescription>
            </CardHeader>
            <CardContent data-oid="3-55633">
              <div className="space-y-3" data-oid="i-tvfju">
                {scenario.steps.map((step, index) => (
                  <div key={step.id} data-oid="hwl8nq.">
                    <div className="flex items-start gap-3 rounded-lg border bg-muted/30 p-3" data-oid="z3wkphg">
                      {/* Step number */}
                      <div
                        className="bg-primary/10 text-primary flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-medium"
                        data-oid="tn_a5.."
                      >
                        {index + 1}
                      </div>

                      {/* Step content */}
                      <div className="flex-1 space-y-2" data-oid="ayetd3j">
                        <div className="flex items-center justify-between gap-2" data-oid="i0kyfqm">
                          <h4 className="font-medium" data-oid="w93tmnv">
                            {step.name.ru}
                          </h4>
                          <div className="flex items-center gap-2" data-oid="uyp5g5t">
                            {step.optional && (
                              <Badge variant="outline" className="text-xs" data-oid="pw3pu1e">
                                Опционально
                              </Badge>
                            )}
                            {step.automation?.canAutomate && (
                              <Badge variant="outline" className="text-xs" data-oid="mvrdgx_">
                                <Zap className="mr-1 h-3 w-3" data-oid="gv49lgw" />
                                Авто
                              </Badge>
                            )}
                          </div>
                        </div>

                        {step.description && (
                          <p className="text-muted-foreground text-sm" data-oid="b69jn4z">
                            {step.description.ru}
                          </p>
                        )}

                        {/* Step type badge */}
                        <div className="flex items-center gap-2" data-oid="a-fzcqn">
                          <Badge
                            variant="secondary"
                            className={`text-xs ${getStepTypeColor(step.type)}`}
                            data-oid="05fpglm"
                          >
                            {step.type}
                          </Badge>
                          {step.validation?.required && (
                            <Badge variant="outline" className="text-xs" data-oid="ak060pi">
                              <AlertCircle className="mr-1 h-3 w-3" data-oid="ezyv.1e" />
                              Обязательно
                            </Badge>
                          )}
                        </div>

                        {/* Automation info */}
                        {step.automation?.aiAssisted && (
                          <div className="flex items-center gap-2 text-xs text-muted-foreground" data-oid="6y6y9py">
                            <Sparkles className="h-3 w-3" data-oid="0pgubsy" />
                            <span data-oid="n55s66a">ИИ-ассистент: {step.automation.engine}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Separator */}
                    {index < scenario.steps.length - 1 && (
                      <div className="ml-4 flex h-4 items-center" data-oid="07zvkw0">
                        <div
                          className="border-l-2 border-dashed border-muted-foreground/30"
                          style={{ height: "100%" }}
                          data-oid="1wc.sc1"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Settings */}
          {showDetails && (
            <Card data-oid="9xo1vog">
              <CardHeader data-oid="_n:tj29">
                <CardTitle data-oid="m7jnndw">Настройки</CardTitle>
                <CardDescription data-oid="045zgig">Дополнительные параметры сценария</CardDescription>
              </CardHeader>
              <CardContent data-oid="r-zf.62">
                <div className="space-y-2 text-sm" data-oid="4zj6sol">
                  <div className="flex items-center justify-between" data-oid="iqivk-.">
                    <span className="text-muted-foreground" data-oid="g5felcn">
                      Разрешить пропуск шагов
                    </span>
                    <span className="font-medium" data-oid="ntrk-qk">
                      {scenario.settings.allowSkipSteps ? "Да" : "Нет"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between" data-oid="8pdj9zv">
                    <span className="text-muted-foreground" data-oid="n2clq7c">
                      Показывать предпросмотр
                    </span>
                    <span className="font-medium" data-oid="s17wt7o">
                      {scenario.settings.showPreview ? "Да" : "Нет"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between" data-oid="8851qxc">
                    <span className="text-muted-foreground" data-oid="d-0gv:9">
                      Сохранять прогресс
                    </span>
                    <span className="font-medium" data-oid="yg1xgpu">
                      {scenario.settings.saveProgress ? "Да" : "Нет"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between" data-oid="cjlg3:d">
                    <span className="text-muted-foreground" data-oid="5ojywr-">
                      Поддержка отмены
                    </span>
                    <span className="font-medium" data-oid="u2ra4:o">
                      {scenario.settings.undoSupport ? "Да" : "Нет"}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}

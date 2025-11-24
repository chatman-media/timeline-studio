/**
 * Scenario Preview Component
 * Предпросмотр структуры и шагов сценария монтажа
 */

import { AlertCircle, Check, Clock, Sparkles, Zap } from "lucide-react"
import type React from "react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"

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
    <div className="flex h-full flex-col" style={{ height }}>
      {/* Header */}
      <div className="border-b p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-xl font-semibold">{scenario.name.ru}</h3>
            <p className="text-muted-foreground mt-1 text-sm">{scenario.description.ru}</p>
          </div>
          <div className="flex flex-col gap-2">
            <Badge variant="outline">{scenario.category}</Badge>
            <Badge variant="outline" className={getDifficultyColor(scenario.difficulty)}>
              {getDifficultyLabel(scenario.difficulty)}
            </Badge>
          </div>
        </div>

        {/* Quick stats */}
        <div className="mt-4 flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Clock className="text-muted-foreground h-4 w-4" />
            <div>
              <div className="text-sm font-medium">{formatTime(scenario.estimatedTime)}</div>
              <div className="text-muted-foreground text-xs">Время выполнения</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Zap className="text-muted-foreground h-4 w-4" />
            <div>
              <div className="text-sm font-medium">{scenario.steps.length}</div>
              <div className="text-muted-foreground text-xs">Шагов</div>
            </div>
          </div>
          {scenario.requirements.aiAssisted && (
            <div className="flex items-center gap-2">
              <Sparkles className="text-muted-foreground h-4 w-4" />
              <div>
                <div className="text-sm font-medium">AI</div>
                <div className="text-muted-foreground text-xs">Автоматизация</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="space-y-4 p-4">
          {/* Requirements */}
          {showDetails && (
            <Card>
              <CardHeader>
                <CardTitle>Требования</CardTitle>
                <CardDescription>Необходимые условия для выполнения сценария</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  {scenario.requirements.minClips && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Минимум клипов</span>
                      <span className="font-medium">{scenario.requirements.minClips}</span>
                    </div>
                  )}
                  {scenario.requirements.maxClips && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Максимум клипов</span>
                      <span className="font-medium">{scenario.requirements.maxClips}</span>
                    </div>
                  )}
                  {scenario.requirements.requiresIntro && (
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      <span className="text-muted-foreground">Требуется интро</span>
                    </div>
                  )}
                  {scenario.requirements.requiresOutro && (
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      <span className="text-muted-foreground">Требуется аутро</span>
                    </div>
                  )}
                  {scenario.requirements.requiresMusic && (
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      <span className="text-muted-foreground">Требуется музыка</span>
                    </div>
                  )}
                  {scenario.requirements.requiresCuts && (
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      <span className="text-muted-foreground">Требуются вырезки</span>
                    </div>
                  )}
                  {scenario.requirements.requiresMultiCamera && (
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      <span className="text-muted-foreground">Мульти-камера</span>
                    </div>
                  )}
                  {scenario.requirements.aiAssisted && (
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-purple-500" />
                      <span className="text-muted-foreground">ИИ-автоматизация</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Steps */}
          <Card>
            <CardHeader>
              <CardTitle>Шаги сценария</CardTitle>
              <CardDescription>Последовательность выполнения</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {scenario.steps.map((step, index) => (
                  <div key={step.id}>
                    <div className="flex items-start gap-3 rounded-lg border bg-muted/30 p-3">
                      {/* Step number */}
                      <div className="bg-primary/10 text-primary flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-medium">
                        {index + 1}
                      </div>

                      {/* Step content */}
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="font-medium">{step.name.ru}</h4>
                          <div className="flex items-center gap-2">
                            {step.optional && (
                              <Badge variant="outline" className="text-xs">
                                Опционально
                              </Badge>
                            )}
                            {step.automation?.canAutomate && (
                              <Badge variant="outline" className="text-xs">
                                <Zap className="mr-1 h-3 w-3" />
                                Авто
                              </Badge>
                            )}
                          </div>
                        </div>

                        {step.description && <p className="text-muted-foreground text-sm">{step.description.ru}</p>}

                        {/* Step type badge */}
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className={`text-xs ${getStepTypeColor(step.type)}`}>
                            {step.type}
                          </Badge>
                          {step.validation?.required && (
                            <Badge variant="outline" className="text-xs">
                              <AlertCircle className="mr-1 h-3 w-3" />
                              Обязательно
                            </Badge>
                          )}
                        </div>

                        {/* Automation info */}
                        {step.automation?.aiAssisted && (
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Sparkles className="h-3 w-3" />
                            <span>ИИ-ассистент: {step.automation.engine}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Separator */}
                    {index < scenario.steps.length - 1 && (
                      <div className="ml-4 flex h-4 items-center">
                        <div
                          className="border-l-2 border-dashed border-muted-foreground/30"
                          style={{ height: "100%" }}
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
            <Card>
              <CardHeader>
                <CardTitle>Настройки</CardTitle>
                <CardDescription>Дополнительные параметры сценария</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Разрешить пропуск шагов</span>
                    <span className="font-medium">{scenario.settings.allowSkipSteps ? "Да" : "Нет"}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Показывать предпросмотр</span>
                    <span className="font-medium">{scenario.settings.showPreview ? "Да" : "Нет"}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Сохранять прогресс</span>
                    <span className="font-medium">{scenario.settings.saveProgress ? "Да" : "Нет"}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Поддержка отмены</span>
                    <span className="font-medium">{scenario.settings.undoSupport ? "Да" : "Нет"}</span>
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

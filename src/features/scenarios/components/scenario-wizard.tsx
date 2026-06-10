/**
 * Scenario Wizard Component
 * Пошаговый мастер выполнения сценария монтажа
 */

import type { TimelineStudioProject } from "@timeline-studio/core/types/project"
import { Alert, AlertDescription } from "@timeline-studio/ui/components/alert"
import { Button } from "@timeline-studio/ui/components/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@timeline-studio/ui/components/dialog"
import { Progress } from "@timeline-studio/ui/components/progress"
import { ScrollArea } from "@timeline-studio/ui/components/scroll-area"
import { AlertCircle, ArrowLeft, ArrowRight, Check, SkipForward, X } from "lucide-react"
import type React from "react"
import { useCallback, useState } from "react"

import { useScenarioWizard, type WizardData } from "../hooks/use-scenario-wizard"
import type { Scenario } from "../types/scenario"

export interface ScenarioWizardProps {
  /** Открыт ли мастер */
  open: boolean

  /** Сценарий для выполнения */
  scenario: Scenario

  /** Текущий проект */
  project: TimelineStudioProject

  /** Callback при закрытии */
  onClose: () => void

  /** Callback при завершении */
  onComplete: (data: WizardData) => void | Promise<void>

  /** Callback при отмене */
  onCancel?: () => void

  /** Разрешить возврат к предыдущим шагам */
  allowBackNavigation?: boolean

  /** Разрешить пропуск опциональных шагов */
  allowSkipOptional?: boolean
}

export const ScenarioWizard: React.FC<ScenarioWizardProps> = ({
  open,
  scenario,
  project,
  onClose,
  onComplete,
  onCancel,
  allowBackNavigation = true,
  allowSkipOptional = true,
}) => {
  const {
    currentStepIndex,
    currentStep,
    allSteps,
    isFirstStep,
    isLastStep,
    canGoNext,
    canGoBack,
    canSkip,
    isCompleted,
    progress,
    completedCount,
    totalCount,
    wizardData,
    goNext,
    goBack,
    skipStep,
    complete,
    cancel,
  } = useScenarioWizard({
    scenario,
    project,
    onComplete,
    onCancel,
    allowBackNavigation,
    allowSkipOptional,
  })

  const [isProcessing, setIsProcessing] = useState(false)

  /**
   * Обработчик следующего шага
   */
  const handleNext = useCallback(async () => {
    setIsProcessing(true)
    try {
      // Здесь можно добавить логику обработки текущего шага
      // Например, выполнение автоматизации, валидация данных и т.д.

      goNext()
    } catch (error) {
      console.error("Failed to proceed to next step:", error)
    } finally {
      setIsProcessing(false)
    }
  }, [goNext])

  /**
   * Обработчик возврата назад
   */
  const handleBack = useCallback(() => {
    goBack()
  }, [goBack])

  /**
   * Обработчик пропуска шага
   */
  const handleSkip = useCallback(() => {
    skipStep()
  }, [skipStep])

  /**
   * Обработчик завершения
   */
  const handleComplete = useCallback(async () => {
    setIsProcessing(true)
    try {
      await complete()
      onClose()
    } catch (error) {
      console.error("Failed to complete wizard:", error)
    } finally {
      setIsProcessing(false)
    }
  }, [complete, onClose])

  /**
   * Обработчик закрытия/отмены
   */
  const handleClose = useCallback(() => {
    if (isProcessing) return
    cancel()
    onClose()
  }, [isProcessing, cancel, onClose])

  /**
   * Рендер иконки статуса шага
   */
  const renderStepIcon = (index: number, completed: boolean, skipped: boolean) => {
    if (completed && !skipped) {
      return <Check className="h-4 w-4 text-green-500" data-oid=".jx1m2u" />
    }
    if (skipped) {
      return <SkipForward className="h-4 w-4 text-gray-400" data-oid="nm4neg-" />
    }
    if (index === currentStepIndex) {
      return <div className="h-2 w-2 rounded-full bg-primary" data-oid="t2d8jeu" />
    }
    return <div className="h-2 w-2 rounded-full bg-muted" data-oid="_asc.85" />
  }

  return (
    <Dialog open={open} onOpenChange={handleClose} data-oid="wm3hdk1">
      <DialogContent className="max-w-[1000px] p-0" style={{ height: "80vh" }} data-oid="xbkbux5">
        {/* Header */}
        <DialogHeader className="border-b p-6" data-oid="qom0ou-">
          <DialogTitle data-oid="6c0a.p3">{scenario.name.ru}</DialogTitle>
          <DialogDescription data-oid="63wd_ii">{scenario.description.ru}</DialogDescription>

          {/* Progress */}
          <div className="space-y-2 pt-4" data-oid="jyvsrr_">
            <div className="flex items-center justify-between text-sm" data-oid="x.f9:gt">
              <span className="text-muted-foreground" data-oid="jdb13h9">
                Шаг {currentStepIndex + 1} из {totalCount}
              </span>
              <span className="font-medium" data-oid="8.tpgvf">
                {Math.round(progress)}%
              </span>
            </div>
            <Progress value={progress} className="h-2" data-oid="ibyztqs" />
          </div>
        </DialogHeader>

        {/* Content */}
        <div className="flex flex-1 overflow-hidden" data-oid="cop0a:1">
          {/* Steps sidebar */}
          <div className="w-64 border-r bg-muted/30" data-oid="fy5bwu4">
            <ScrollArea className="h-full" data-oid="7375n3h">
              <div className="space-y-1 p-4" data-oid="38_38d-">
                {allSteps.map((step, index) => {
                  const isCurrent = index === currentStepIndex
                  const isCompleted = step.completed
                  const isSkipped = step.skipped

                  return (
                    <div
                      key={step.step.id}
                      className={`flex items-start gap-3 rounded-lg p-3 transition-colors ${
                        isCurrent ? "bg-background shadow-sm" : isCompleted ? "opacity-70" : "opacity-50"
                      }`}
                      data-oid="5.p7a:0"
                    >
                      {/* Icon */}
                      <div className="mt-0.5" data-oid="qdj2049">
                        {renderStepIcon(index, isCompleted, isSkipped)}
                      </div>

                      {/* Content */}
                      <div className="flex-1 space-y-1" data-oid="re213fv">
                        <p
                          className={`text-sm font-medium ${isCurrent ? "" : "text-muted-foreground"}`}
                          data-oid="6l9urat"
                        >
                          {step.step.name.ru}
                        </p>
                        {step.step.description && (
                          <p className="text-xs text-muted-foreground line-clamp-2" data-oid="_l3k:m.">
                            {step.step.description.ru}
                          </p>
                        )}
                        {step.step.optional && (
                          <p className="text-xs text-muted-foreground italic" data-oid="r:7w.w-">
                            Опционально
                          </p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </ScrollArea>
          </div>

          {/* Main content */}
          <div className="flex flex-1 flex-col" data-oid="ingux1j">
            <ScrollArea className="flex-1" data-oid="x4-60og">
              <div className="p-6" data-oid="yx_l40:">
                {currentStep && (
                  <div className="space-y-6" data-oid="3pnoo60">
                    {/* Step header */}
                    <div data-oid="yjtun71">
                      <h3 className="text-lg font-semibold" data-oid="34wmia:">
                        {currentStep.step.name.ru}
                      </h3>
                      {currentStep.step.description && (
                        <p className="text-muted-foreground mt-1" data-oid="-:1d:ew">
                          {currentStep.step.description.ru}
                        </p>
                      )}
                    </div>

                    {/* Step content */}
                    <div className="rounded-lg border bg-muted/50 p-6" data-oid="cwzhyu2">
                      <div className="space-y-4" data-oid="gi.fa3t">
                        {/* Автоматизация */}
                        {currentStep.step.automation?.canAutomate && (
                          <Alert data-oid="mi1ircp">
                            <AlertCircle className="h-4 w-4" data-oid="dki3z2r" />
                            <AlertDescription data-oid="i872.xv">
                              Этот шаг поддерживает автоматизацию
                              {currentStep.step.automation.aiAssisted && " с помощью ИИ"}
                            </AlertDescription>
                          </Alert>
                        )}

                        {/* Конфигурация */}
                        <div data-oid="3:aspe4">
                          <h4 className="mb-3 font-medium" data-oid="fu5kfi2">
                            Параметры
                          </h4>
                          <div className="space-y-2 text-sm" data-oid="wo7b83f">
                            {Object.entries(currentStep.step.config).map(([key, value]) => (
                              <div key={key} className="flex justify-between" data-oid="4j8nzxc">
                                <span className="text-muted-foreground capitalize" data-oid="lq40cd3">
                                  {key.replace(/([A-Z])/g, " $1")}
                                </span>
                                <span className="font-medium" data-oid="tcqp1bk">
                                  {String(value)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Validation error */}
                        {currentStep.error && (
                          <Alert variant="destructive" data-oid="pedxe4i">
                            <AlertCircle className="h-4 w-4" data-oid="z5gsgql" />
                            <AlertDescription data-oid="xtmg9t3">{currentStep.error}</AlertDescription>
                          </Alert>
                        )}
                      </div>
                    </div>

                    {/* Requirements */}
                    {currentStep.step.validation?.required && (
                      <Alert data-oid="hgbs:1e">
                        <AlertCircle className="h-4 w-4" data-oid="qd4py-q" />
                        <AlertDescription data-oid="-btpo3k">Этот шаг обязателен для выполнения</AlertDescription>
                      </Alert>
                    )}
                  </div>
                )}

                {/* Completion message */}
                {isCompleted && (
                  <div className="flex h-full items-center justify-center" data-oid="6fa8bvc">
                    <div className="text-center" data-oid="5e:g9ts">
                      <div className="mb-4 flex justify-center" data-oid="jacz5-i">
                        <div
                          className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10"
                          data-oid="8-29bv5"
                        >
                          <Check className="h-8 w-8 text-green-500" data-oid="qu9fwt8" />
                        </div>
                      </div>
                      <h3 className="mb-2 text-xl font-semibold" data-oid="xug6lpw">
                        Сценарий завершен
                      </h3>
                      <p className="text-muted-foreground" data-oid="86j.-3.">
                        Выполнено {completedCount} из {totalCount} шагов
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Actions */}
            <div className="border-t p-6" data-oid="h0hf6ri">
              <div className="flex items-center justify-between" data-oid="fqrfif1">
                {/* Back button */}
                <div data-oid="45y.3o4">
                  {canGoBack && (
                    <Button variant="outline" onClick={handleBack} disabled={isProcessing} data-oid="33eziv7">
                      <ArrowLeft className="mr-2 h-4 w-4" data-oid=":1osgdw" />
                      Назад
                    </Button>
                  )}
                </div>

                {/* Right actions */}
                <div className="flex items-center gap-2" data-oid="br8j_.e">
                  {/* Skip button */}
                  {canSkip && !isLastStep && (
                    <Button variant="ghost" onClick={handleSkip} disabled={isProcessing} data-oid=":barprd">
                      Пропустить
                      <SkipForward className="ml-2 h-4 w-4" data-oid="9dh-8et" />
                    </Button>
                  )}

                  {/* Cancel button */}
                  <Button variant="outline" onClick={handleClose} disabled={isProcessing} data-oid="sh:87gg">
                    <X className="mr-2 h-4 w-4" data-oid="8d3a60l" />
                    Отмена
                  </Button>

                  {/* Next/Complete button */}
                  {!isCompleted &&
                    (isLastStep ? (
                      <Button onClick={handleComplete} disabled={!canGoNext || isProcessing} data-oid=".x7i63x">
                        <Check className="mr-2 h-4 w-4" data-oid="x1tp-m6" />
                        Завершить
                      </Button>
                    ) : (
                      <Button onClick={handleNext} disabled={!canGoNext || isProcessing} data-oid="9gkz8vx">
                        Далее
                        <ArrowRight className="ml-2 h-4 w-4" data-oid="ibw2m7d" />
                      </Button>
                    ))}

                  {/* Close after completion */}
                  {isCompleted && (
                    <Button onClick={handleClose} data-oid="._1h0m_">
                      <Check className="mr-2 h-4 w-4" data-oid="q7m:8i7" />
                      Готово
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

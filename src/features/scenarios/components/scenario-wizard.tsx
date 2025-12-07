/**
 * Scenario Wizard Component
 * Пошаговый мастер выполнения сценария монтажа
 */

import { AlertCircle, ArrowLeft, ArrowRight, Check, SkipForward, X } from "lucide-react"
import type React from "react"
import { useCallback, useState } from "react"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { TimelineStudioProject } from "@/domains/project-management/types"

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
      return <Check className="h-4 w-4 text-green-500" />
    }
    if (skipped) {
      return <SkipForward className="h-4 w-4 text-gray-400" />
    }
    if (index === currentStepIndex) {
      return <div className="h-2 w-2 rounded-full bg-primary" />
    }
    return <div className="h-2 w-2 rounded-full bg-muted" />
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-[1000px] p-0" style={{ height: "80vh" }}>
        {/* Header */}
        <DialogHeader className="border-b p-6">
          <DialogTitle>{scenario.name.ru}</DialogTitle>
          <DialogDescription>{scenario.description.ru}</DialogDescription>

          {/* Progress */}
          <div className="space-y-2 pt-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                Шаг {currentStepIndex + 1} из {totalCount}
              </span>
              <span className="font-medium">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </DialogHeader>

        {/* Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Steps sidebar */}
          <div className="w-64 border-r bg-muted/30">
            <ScrollArea className="h-full">
              <div className="space-y-1 p-4">
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
                    >
                      {/* Icon */}
                      <div className="mt-0.5">{renderStepIcon(index, isCompleted, isSkipped)}</div>

                      {/* Content */}
                      <div className="flex-1 space-y-1">
                        <p className={`text-sm font-medium ${isCurrent ? "" : "text-muted-foreground"}`}>
                          {step.step.name.ru}
                        </p>
                        {step.step.description && (
                          <p className="text-xs text-muted-foreground line-clamp-2">{step.step.description.ru}</p>
                        )}
                        {step.step.optional && <p className="text-xs text-muted-foreground italic">Опционально</p>}
                      </div>
                    </div>
                  )
                })}
              </div>
            </ScrollArea>
          </div>

          {/* Main content */}
          <div className="flex flex-1 flex-col">
            <ScrollArea className="flex-1">
              <div className="p-6">
                {currentStep && (
                  <div className="space-y-6">
                    {/* Step header */}
                    <div>
                      <h3 className="text-lg font-semibold">{currentStep.step.name.ru}</h3>
                      {currentStep.step.description && (
                        <p className="text-muted-foreground mt-1">{currentStep.step.description.ru}</p>
                      )}
                    </div>

                    {/* Step content */}
                    <div className="rounded-lg border bg-muted/50 p-6">
                      <div className="space-y-4">
                        {/* Автоматизация */}
                        {currentStep.step.automation?.canAutomate && (
                          <Alert>
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>
                              Этот шаг поддерживает автоматизацию
                              {currentStep.step.automation.aiAssisted && " с помощью ИИ"}
                            </AlertDescription>
                          </Alert>
                        )}

                        {/* Конфигурация */}
                        <div>
                          <h4 className="mb-3 font-medium">Параметры</h4>
                          <div className="space-y-2 text-sm">
                            {Object.entries(currentStep.step.config).map(([key, value]) => (
                              <div key={key} className="flex justify-between">
                                <span className="text-muted-foreground capitalize">
                                  {key.replace(/([A-Z])/g, " $1")}
                                </span>
                                <span className="font-medium">{String(value)}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Validation error */}
                        {currentStep.error && (
                          <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{currentStep.error}</AlertDescription>
                          </Alert>
                        )}
                      </div>
                    </div>

                    {/* Requirements */}
                    {currentStep.step.validation?.required && (
                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>Этот шаг обязателен для выполнения</AlertDescription>
                      </Alert>
                    )}
                  </div>
                )}

                {/* Completion message */}
                {isCompleted && (
                  <div className="flex h-full items-center justify-center">
                    <div className="text-center">
                      <div className="mb-4 flex justify-center">
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10">
                          <Check className="h-8 w-8 text-green-500" />
                        </div>
                      </div>
                      <h3 className="mb-2 text-xl font-semibold">Сценарий завершен</h3>
                      <p className="text-muted-foreground">
                        Выполнено {completedCount} из {totalCount} шагов
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Actions */}
            <div className="border-t p-6">
              <div className="flex items-center justify-between">
                {/* Back button */}
                <div>
                  {canGoBack && (
                    <Button variant="outline" onClick={handleBack} disabled={isProcessing}>
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Назад
                    </Button>
                  )}
                </div>

                {/* Right actions */}
                <div className="flex items-center gap-2">
                  {/* Skip button */}
                  {canSkip && !isLastStep && (
                    <Button variant="ghost" onClick={handleSkip} disabled={isProcessing}>
                      Пропустить
                      <SkipForward className="ml-2 h-4 w-4" />
                    </Button>
                  )}

                  {/* Cancel button */}
                  <Button variant="outline" onClick={handleClose} disabled={isProcessing}>
                    <X className="mr-2 h-4 w-4" />
                    Отмена
                  </Button>

                  {/* Next/Complete button */}
                  {!isCompleted &&
                    (isLastStep ? (
                      <Button onClick={handleComplete} disabled={!canGoNext || isProcessing}>
                        <Check className="mr-2 h-4 w-4" />
                        Завершить
                      </Button>
                    ) : (
                      <Button onClick={handleNext} disabled={!canGoNext || isProcessing}>
                        Далее
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    ))}

                  {/* Close after completion */}
                  {isCompleted && (
                    <Button onClick={handleClose}>
                      <Check className="mr-2 h-4 w-4" />
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

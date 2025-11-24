/**
 * Template Wizard Component
 * Пошаговый мастер выбора и применения шаблона проекта
 */

import { ArrowLeft, ArrowRight, Check } from "lucide-react"
import type React from "react"
import { useCallback, useState } from "react"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"

import type { ApplyTemplateOptions } from "../services"
import type { ProjectTemplate } from "../types/project-template"
import { TemplateCustomizer } from "./template-customizer"
import { TemplatePicker } from "./template-picker"
import { TemplatePreview } from "./template-preview"

export interface TemplateWizardProps {
  /** Открыт ли мастер */
  open: boolean

  /** Callback при закрытии */
  onClose: () => void

  /** Callback при применении шаблона */
  onApply: (template: ProjectTemplate, options: ApplyTemplateOptions) => void | Promise<void>

  /** Начальная категория (опционально) */
  initialCategory?: string
}

type WizardStep = "select" | "preview" | "customize"

export const TemplateWizard: React.FC<TemplateWizardProps> = ({ open, onClose, onApply, initialCategory }) => {
  const [currentStep, setCurrentStep] = useState<WizardStep>("select")
  const [selectedTemplate, setSelectedTemplate] = useState<ProjectTemplate | null>(null)
  const [applyOptions, setApplyOptions] = useState<ApplyTemplateOptions>({
    mode: "new",
    applyProjectSettings: true,
    createMarkers: true,
    createTracks: true,
  })
  const [isApplying, setIsApplying] = useState(false)

  /**
   * Шаги мастера
   */
  const steps: { id: WizardStep; label: string; description: string }[] = [
    {
      id: "select",
      label: "Выбор шаблона",
      description: "Выберите подходящий шаблон проекта",
    },
    {
      id: "preview",
      label: "Предпросмотр",
      description: "Просмотрите структуру шаблона",
    },
    {
      id: "customize",
      label: "Настройка",
      description: "Настройте параметры применения",
    },
  ]

  const currentStepIndex = steps.findIndex((s) => s.id === currentStep)
  const progress = ((currentStepIndex + 1) / steps.length) * 100

  /**
   * Выбор шаблона
   */
  const handleTemplateSelect = useCallback((template: ProjectTemplate) => {
    setSelectedTemplate(template)
    setCurrentStep("preview")
  }, [])

  /**
   * Переход к следующему шагу
   */
  const handleNext = useCallback(() => {
    if (currentStep === "select" && selectedTemplate) {
      setCurrentStep("preview")
    } else if (currentStep === "preview") {
      setCurrentStep("customize")
    }
  }, [currentStep, selectedTemplate])

  /**
   * Возврат к предыдущему шагу
   */
  const handleBack = useCallback(() => {
    if (currentStep === "preview") {
      setCurrentStep("select")
    } else if (currentStep === "customize") {
      setCurrentStep("preview")
    }
  }, [currentStep])

  /**
   * Применение шаблона
   */
  const handleApply = useCallback(
    async (options: ApplyTemplateOptions) => {
      if (!selectedTemplate) return

      setIsApplying(true)
      try {
        await onApply(selectedTemplate, options)
        // Reset state after successful application
        setSelectedTemplate(null)
        setCurrentStep("select")
        onClose()
      } catch (error) {
        console.error("Failed to apply template:", error)
      } finally {
        setIsApplying(false)
      }
    },
    [selectedTemplate, onApply, onClose],
  )

  /**
   * Закрытие мастера
   */
  const handleClose = useCallback(() => {
    if (!isApplying) {
      setSelectedTemplate(null)
      setCurrentStep("select")
      onClose()
    }
  }, [isApplying, onClose])

  /**
   * Можно ли перейти к следующему шагу
   */
  const canGoNext = (currentStep === "select" && selectedTemplate !== null) || currentStep === "preview"

  /**
   * Можно ли вернуться назад
   */
  const canGoBack = currentStep !== "select" && !isApplying

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-[1200px] p-0" style={{ height: "80vh" }}>
        {/* Header */}
        <DialogHeader className="border-b p-6">
          <DialogTitle>Создание проекта из шаблона</DialogTitle>
          <DialogDescription>
            Следуйте инструкциям для создания нового проекта на основе готового шаблона
          </DialogDescription>

          {/* Progress bar */}
          <div className="mt-4 space-y-2">
            <div className="flex justify-between text-sm">
              {steps.map((step, index) => (
                <div
                  key={step.id}
                  className={`flex items-center gap-2 ${index <= currentStepIndex ? "text-primary font-medium" : "text-muted-foreground"}`}
                >
                  {index < currentStepIndex ? (
                    <div className="bg-primary text-primary-foreground flex h-6 w-6 items-center justify-center rounded-full">
                      <Check className="h-4 w-4" />
                    </div>
                  ) : (
                    <div
                      className={`flex h-6 w-6 items-center justify-center rounded-full ${index === currentStepIndex ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
                    >
                      {index + 1}
                    </div>
                  )}
                  <span>{step.label}</span>
                </div>
              ))}
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </DialogHeader>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {currentStep === "select" && (
            <TemplatePicker
              mode="single"
              initialCategory={initialCategory}
              onSelect={handleTemplateSelect}
              showHeader={false}
              height="100%"
            />
          )}

          {currentStep === "preview" && selectedTemplate && (
            <TemplatePreview template={selectedTemplate} showDetails={true} height="100%" />
          )}

          {currentStep === "customize" && selectedTemplate && (
            <TemplateCustomizer
              template={selectedTemplate}
              initialOptions={applyOptions}
              onChange={setApplyOptions}
              onApply={handleApply}
              onCancel={handleBack}
              height="100%"
            />
          )}
        </div>

        {/* Footer - только для шагов select и preview */}
        {currentStep !== "customize" && (
          <div className="border-t p-4">
            <div className="flex justify-between">
              <Button variant="outline" onClick={canGoBack ? handleBack : handleClose} disabled={isApplying}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                {currentStep === "select" ? "Отмена" : "Назад"}
              </Button>
              <Button onClick={handleNext} disabled={!canGoNext || isApplying}>
                {currentStep === "preview" ? "Настроить" : "Далее"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

/**
 * Template Wizard Component
 * Пошаговый мастер выбора и применения шаблона проекта
 */

import { Button } from "@timeline-studio/ui/components/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@timeline-studio/ui/components/dialog"
import { Progress } from "@timeline-studio/ui/components/progress"
import { ArrowLeft, ArrowRight, Check } from "lucide-react"
import type React from "react"
import { useCallback, useState } from "react"

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
    <Dialog open={open} onOpenChange={handleClose} data-oid="d_gmsn-">
      <DialogContent className="max-w-[1200px] p-0" style={{ height: "80vh" }} data-oid=".y1yphd">
        {/* Header */}
        <DialogHeader className="border-b p-6" data-oid="oqx8g2i">
          <DialogTitle data-oid="2ftdkzc">Создание проекта из шаблона</DialogTitle>
          <DialogDescription data-oid="c4qjplw">
            Следуйте инструкциям для создания нового проекта на основе готового шаблона
          </DialogDescription>

          {/* Progress bar */}
          <div className="mt-4 space-y-2" data-oid="whkr_zn">
            <div className="flex justify-between text-sm" data-oid="pkd35sv">
              {steps.map((step, index) => (
                <div
                  key={step.id}
                  className={`flex items-center gap-2 ${index <= currentStepIndex ? "text-primary font-medium" : "text-muted-foreground"}`}
                  data-oid="viiep6e"
                >
                  {index < currentStepIndex ? (
                    <div
                      className="bg-primary text-primary-foreground flex h-6 w-6 items-center justify-center rounded-full"
                      data-oid="lzuxdz-"
                    >
                      <Check className="h-4 w-4" data-oid="qehhefh" />
                    </div>
                  ) : (
                    <div
                      className={`flex h-6 w-6 items-center justify-center rounded-full ${index === currentStepIndex ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
                      data-oid="79mb10x"
                    >
                      {index + 1}
                    </div>
                  )}
                  <span data-oid="w3f-who">{step.label}</span>
                </div>
              ))}
            </div>
            <Progress value={progress} className="h-2" data-oid="ucns29q" />
          </div>
        </DialogHeader>

        {/* Content */}
        <div className="flex-1 overflow-hidden" data-oid="07l-l_p">
          {currentStep === "select" && (
            <TemplatePicker
              mode="single"
              initialCategory={initialCategory}
              onSelect={handleTemplateSelect}
              showHeader={false}
              height="100%"
              data-oid="pde24_6"
            />
          )}

          {currentStep === "preview" && selectedTemplate && (
            <TemplatePreview template={selectedTemplate} showDetails={true} height="100%" data-oid="otbo_m5" />
          )}

          {currentStep === "customize" && selectedTemplate && (
            <TemplateCustomizer
              template={selectedTemplate}
              initialOptions={applyOptions}
              onChange={setApplyOptions}
              onApply={handleApply}
              onCancel={handleBack}
              height="100%"
              data-oid="lmiup_-"
            />
          )}
        </div>

        {/* Footer - только для шагов select и preview */}
        {currentStep !== "customize" && (
          <div className="border-t p-4" data-oid="7qaktk1">
            <div className="flex justify-between" data-oid="ilh_9s1">
              <Button
                variant="outline"
                onClick={canGoBack ? handleBack : handleClose}
                disabled={isApplying}
                data-oid="gdg32yx"
              >
                <ArrowLeft className="mr-2 h-4 w-4" data-oid="z-z4owg" />
                {currentStep === "select" ? "Отмена" : "Назад"}
              </Button>
              <Button onClick={handleNext} disabled={!canGoNext || isApplying} data-oid="4kter12">
                {currentStep === "preview" ? "Настроить" : "Далее"}
                <ArrowRight className="ml-2 h-4 w-4" data-oid="j-l46yq" />
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

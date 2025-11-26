"use client"

/**
 * MontageTemplateSelector - Компонент выбора шаблона монтажа
 */

import { CheckCircle2 } from "lucide-react"
import { useState } from "react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"

import type { MontageTemplate } from "../types/montage-templates"
import { BUILT_IN_TEMPLATES, getAllCategories } from "../types/montage-templates"

interface MontageTemplateSelectorProps {
  onSelect?: (template: MontageTemplate) => void
  selectedTemplateId?: string
  selected?: string
  className?: string
  showCategoryFilter?: boolean
  showSearch?: boolean
  showDetails?: boolean
  groupByCategory?: boolean
  showTags?: boolean
  showAspectRatio?: boolean
}

export function MontageTemplateSelector({ onSelect, selectedTemplateId, className }: MontageTemplateSelectorProps) {
  const [activeCategory, setActiveCategory] = useState<string>("all")

  const categories = ["all", ...getAllCategories()]

  const filteredTemplates =
    activeCategory === "all" ? BUILT_IN_TEMPLATES : BUILT_IN_TEMPLATES.filter((t) => t.category === activeCategory)

  const categoryLabels: Record<string, string> = {
    all: "Все",
    social: "Соцсети",
    promo: "Промо",
    cinematic: "Кинематограф",
    tutorial: "Обучение",
    highlights: "Хайлайты",
    vlog: "Влог",
    custom: "Свои",
  }

  return (
    <Card className={cn("flex flex-col", className)}>
      <CardHeader>
        <CardTitle>Выбери шаблон монтажа</CardTitle>
        <CardDescription>Готовые паттерны для быстрого создания монтажа</CardDescription>
      </CardHeader>

      <CardContent className="flex-1">
        <Tabs value={activeCategory} onValueChange={setActiveCategory} className="space-y-4">
          <TabsList className="grid w-full grid-cols-4 lg:grid-cols-7">
            {categories.map((cat) => (
              <TabsTrigger key={cat} value={cat} className="text-xs">
                {categoryLabels[cat]}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={activeCategory} className="space-y-4">
            <ScrollArea className="h-[400px]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pr-4">
                {filteredTemplates.map((template) => (
                  <TemplateCard
                    key={template.id}
                    template={template}
                    isSelected={template.id === selectedTemplateId}
                    onSelect={() => onSelect?.(template)}
                  />
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

/**
 * TemplateCard - Карточка шаблона
 */
interface TemplateCardProps {
  template: MontageTemplate
  isSelected: boolean
  onSelect: () => void
}

function TemplateCard({ template, isSelected, onSelect }: TemplateCardProps) {
  return (
    <Card
      className={cn("cursor-pointer transition-all hover:shadow-md", isSelected && "ring-2 ring-primary bg-primary/5")}
      onClick={onSelect}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{template.icon}</span>
            <div>
              <CardTitle className="text-base">{template.name}</CardTitle>
              <CardDescription className="text-xs mt-1">{template.description}</CardDescription>
            </div>
          </div>
          {isSelected && <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />}
        </div>
      </CardHeader>

      <CardContent className="pt-0 space-y-2">
        {/* Параметры */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <span className="text-muted-foreground">Длительность:</span>
            <span className="ml-1 font-medium">{template.parameters.targetDuration}s</span>
          </div>
          <div>
            <span className="text-muted-foreground">Клипов:</span>
            <span className="ml-1 font-medium">{template.parameters.clipCount.preferred}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Стиль:</span>
            <span className="ml-1 font-medium capitalize">{template.style}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Формат:</span>
            <span className="ml-1 font-medium">{template.parameters.aspectRatio || "16:9"}</span>
          </div>
        </div>

        {/* Теги */}
        <div className="flex flex-wrap gap-1">
          {template.tags.slice(0, 3).map((tag) => (
            <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-muted">
              {tag}
            </span>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

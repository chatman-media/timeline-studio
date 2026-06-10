/**
 * Resource Browser Component
 * Панель для выбора и перетаскивания эффектов, фильтров и переходов
 */

import { useDraggable } from "@dnd-kit/core"
import { ChevronDown, ChevronRight, Filter, Layers, Palette, Search, Shuffle, Sparkles } from "lucide-react"
import { memo, useState } from "react"

import { Input } from "@timeline-studio/ui/components/input"
import { ScrollArea } from "@timeline-studio/ui/components/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@timeline-studio/ui/components/tabs"
import type { BaseEffect, Transition, VideoFilter } from "@timeline-studio/core/types"
import { cn } from "@/lib/utils"

// Временные моковые данные - потом заменить на реальные из контекста
const mockEffects: BaseEffect[] = [
  {
    id: "blur",
    name: { en: "Blur", ru: "Размытие" },
    category: "blur_sharpen",
    scope: ["clip"],
    processingType: "realtime",
    version: "1.0.0",
    tags: ["blur", "sharpen"],
    complexity: "low",
    gpuAccelerated: true,
    parameters: [],
    presets: [],
    processors: {},
  },
  {
    id: "glow",
    name: { en: "Glow", ru: "Свечение" },
    category: "lighting",
    scope: ["clip"],
    processingType: "realtime",
    version: "1.0.0",
    tags: ["glow", "light"],
    complexity: "low",
    gpuAccelerated: true,
    parameters: [],
    presets: [],
    processors: {},
  },
  {
    id: "shake",
    name: { en: "Shake", ru: "Тряска" },
    category: "motion",
    scope: ["clip"],
    processingType: "realtime",
    version: "1.0.0",
    tags: ["motion", "shake"],
    complexity: "medium",
    gpuAccelerated: true,
    parameters: [],
    presets: [],
    processors: {},
  },
  {
    id: "zoom",
    name: { en: "Zoom", ru: "Зум" },
    category: "motion",
    scope: ["clip"],
    processingType: "realtime",
    version: "1.0.0",
    tags: ["motion", "zoom"],
    complexity: "low",
    gpuAccelerated: true,
    parameters: [],
    presets: [],
    processors: {},
  },
  {
    id: "glitch",
    name: { en: "Glitch", ru: "Глитч" },
    category: "distort",
    scope: ["clip"],
    processingType: "realtime",
    version: "1.0.0",
    tags: ["glitch", "distort"],
    complexity: "medium",
    gpuAccelerated: true,
    parameters: [],
    presets: [],
    processors: {},
  },
]

const mockFilters: VideoFilter[] = [
  {
    id: "brightness",
    name: "Brightness",
    category: "color-correction",
    complexity: "basic",
    tags: ["standard"],
    description: { en: "Brightness adjustment", ru: "Регулировка яркости" },
    labels: { en: "Brightness", ru: "Яркость" },
    params: { brightness: 0 },
  },
  {
    id: "contrast",
    name: "Contrast",
    category: "color-correction",
    complexity: "basic",
    tags: ["standard"],
    description: { en: "Contrast adjustment", ru: "Регулировка контраста" },
    labels: { en: "Contrast", ru: "Контраст" },
    params: { contrast: 0 },
  },
  {
    id: "saturation",
    name: "Saturation",
    category: "color-correction",
    complexity: "basic",
    tags: ["standard"],
    description: {
      en: "Saturation adjustment",
      ru: "Регулировка насыщенности",
    },
    labels: { en: "Saturation", ru: "Насыщенность" },
    params: { saturation: 0 },
  },
  {
    id: "sepia",
    name: "Sepia",
    category: "vintage",
    complexity: "basic",
    tags: ["vintage", "warm"],
    description: { en: "Sepia tone effect", ru: "Эффект сепии" },
    labels: { en: "Sepia", ru: "Сепия" },
    params: {},
  },
  {
    id: "grayscale",
    name: "Grayscale",
    category: "artistic",
    complexity: "basic",
    tags: ["fallback"],
    description: {
      en: "Convert to grayscale",
      ru: "Преобразование в черно-белое",
    },
    labels: { en: "Grayscale", ru: "Черно-белое" },
    params: {},
  },
]

const mockTransitions: Transition[] = [
  {
    id: "fade",
    type: "fade",
    labels: { ru: "Затухание", en: "Fade" },
    description: { ru: "Плавное затухание", en: "Smooth fade" },
    category: "basic",
    complexity: "basic",
    tags: ["fade", "opacity", "classic"],
    duration: { min: 0.1, max: 5.0, default: 1.0 },
    ffmpegCommand: () => "fade",
  },
  {
    id: "dissolve",
    type: "dissolve",
    labels: { ru: "Растворение", en: "Dissolve" },
    description: { ru: "Эффект растворения", en: "Dissolve effect" },
    category: "basic",
    complexity: "basic",
    tags: ["dissolve", "fade"],
    duration: { min: 0.1, max: 5.0, default: 1.0 },
    ffmpegCommand: () => "dissolve",
  },
  {
    id: "wipe",
    type: "wipe",
    labels: { ru: "Вытеснение", en: "Wipe" },
    description: { ru: "Эффект вытеснения", en: "Wipe effect" },
    category: "basic",
    complexity: "basic",
    tags: ["wipe", "direction"],
    duration: { min: 0.1, max: 5.0, default: 1.0 },
    ffmpegCommand: () => "wipe",
  },
  {
    id: "slide",
    type: "slide",
    labels: { ru: "Скольжение", en: "Slide" },
    description: { ru: "Эффект скольжения", en: "Slide effect" },
    category: "motion",
    complexity: "basic",
    tags: ["slide", "movement"],
    duration: { min: 0.1, max: 5.0, default: 1.0 },
    ffmpegCommand: () => "slide",
  },
  {
    id: "zoom",
    type: "zoom",
    labels: { ru: "Зум", en: "Zoom" },
    description: { ru: "Эффект масштабирования", en: "Zoom effect" },
    category: "3d",
    complexity: "intermediate",
    tags: ["zoom", "scale"],
    duration: { min: 0.1, max: 5.0, default: 1.0 },
    ffmpegCommand: () => "zoom",
  },
]

interface ResourceItemProps {
  resource: BaseEffect | VideoFilter | Transition
  type: "effect" | "filter" | "transition"
  icon: React.ReactNode
}

const ResourceItem = memo(function ResourceItem({ resource, type, icon }: ResourceItemProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `${type}-${resource.id}`,
    data: {
      type: `drag-${type}`,
      resource,
    },
  })

  // Получаем имя ресурса в зависимости от типа
  const getResourceName = () => {
    if ("name" in resource && resource.name) {
      return typeof resource.name === "string" ? resource.name : resource.name.ru || resource.name.en
    }
    if ("labels" in resource && resource.labels) {
      return resource.labels.ru || resource.labels.en
    }
    return resource.id
  }

  return (
    <div
      ref={setNodeRef}
      {...(listeners && typeof listeners === "object" ? listeners : {})}
      {...(attributes && typeof attributes === "object" ? attributes : {})}
      className={cn(
        "flex items-center gap-2 p-2 rounded cursor-move",
        "hover:bg-accent transition-colors",
        "border border-transparent hover:border-border",
        isDragging && "opacity-50",
      )}
      data-oid="vjjk3bt"
    >
      <div className="text-muted-foreground" data-oid=":oco6mq">
        {icon}
      </div>
      <span className="text-sm" data-oid="5upu4km">
        {getResourceName()}
      </span>
    </div>
  )
})

interface CategorySectionProps {
  title: string
  items: Array<BaseEffect | VideoFilter | Transition>
  type: "effect" | "filter" | "transition"
  icon: React.ReactNode
}

const CategorySection = memo(function CategorySection({ title, items, type, icon }: CategorySectionProps) {
  const [isExpanded, setIsExpanded] = useState(true)

  return (
    <div className="mb-4" data-oid="vjde3cj">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 w-full p-2 hover:bg-accent rounded transition-colors"
        data-oid="ok-1r_v"
      >
        {isExpanded ? (
          <ChevronDown className="w-4 h-4" data-oid="pzhwoax" />
        ) : (
          <ChevronRight className="w-4 h-4" data-oid="yyw5qom" />
        )}
        <span className="font-medium text-sm" data-oid="fa8s.r1">
          {title}
        </span>
        <span className="ml-auto text-xs text-muted-foreground" data-oid="ouk_461">
          {items.length}
        </span>
      </button>

      {isExpanded && (
        <div className="mt-1 ml-6" data-oid="ijb_f_6">
          {items.map((item) => (
            <ResourceItem key={item.id} resource={item} type={type} icon={icon} data-oid="-ysozcw" />
          ))}
        </div>
      )}
    </div>
  )
})

export const ResourceBrowser = memo(function ResourceBrowser() {
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("effects")

  // Группируем ресурсы по категориям
  const groupByCategory = <T extends { category: string }>(items: T[]) => {
    return items.reduce(
      (acc, item) => {
        const category = item.category
        if (!acc[category]) acc[category] = []
        acc[category].push(item)
        return acc
      },
      {} as Record<string, T[]>,
    )
  }

  // Фильтрация по поисковому запросу
  const filterBySearch = <
    T extends {
      name?: string | { en: string; ru: string; [key: string]: string }
      labels?: { ru?: string; en: string }
    },
  >(
    items: T[],
  ) => {
    if (!searchQuery) return items
    const query = searchQuery.toLowerCase()
    return items.filter((item) => {
      const name =
        typeof item.name === "string"
          ? item.name
          : typeof item.name === "object"
            ? item.name.en || item.name.ru
            : item.labels?.ru || item.labels?.en || ""
      return name.toLowerCase().includes(query)
    })
  }

  const filteredEffects = filterBySearch<BaseEffect>(mockEffects)
  const filteredFilters = filterBySearch<VideoFilter>(mockFilters)
  const filteredTransitions = filterBySearch<Transition>(mockTransitions)

  const groupedEffects = groupByCategory<BaseEffect>(filteredEffects)
  const groupedFilters = groupByCategory<VideoFilter>(filteredFilters)
  const groupedTransitions = groupByCategory<Transition>(filteredTransitions)

  return (
    <div className="h-full flex flex-col bg-background border-l" data-oid="0.u-gjt">
      <div className="p-4 border-b" data-oid="6wwpv-x">
        <h2 className="text-lg font-semibold mb-3" data-oid="3rmr4.l">
          Resources
        </h2>
        <div className="relative" data-oid="jt0zzcm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" data-oid="-evdapt" />
          <Input
            placeholder="Search resources..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
            data-oid=".96mk6i"
          />
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col" data-oid="suat3c3">
        <TabsList className="w-full justify-start px-4" data-oid="pkyo9kk">
          <TabsTrigger value="effects" className="flex items-center gap-2" data-oid="m0a8sqz">
            <Sparkles className="w-4 h-4" data-oid="wy.x42j" />
            Effects
          </TabsTrigger>
          <TabsTrigger value="filters" className="flex items-center gap-2" data-oid="_o6x4go">
            <Filter className="w-4 h-4" data-oid="h79oduw" />
            Filters
          </TabsTrigger>
          <TabsTrigger value="transitions" className="flex items-center gap-2" data-oid="cyk6y7_">
            <Shuffle className="w-4 h-4" data-oid="0vyd_3c" />
            Transitions
          </TabsTrigger>
        </TabsList>

        <ScrollArea className="flex-1" data-oid="xz:tghm">
          <TabsContent value="effects" className="px-4" data-oid="i046jvp">
            {Object.entries(groupedEffects).map(([category, effects]) => (
              <CategorySection
                key={category}
                title={category.charAt(0).toUpperCase() + category.slice(1)}
                items={effects}
                type="effect"
                icon={<Sparkles className="w-4 h-4" data-oid="aij3_os" />}
                data-oid="lyf5u6b"
              />
            ))}
            {filteredEffects.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8" data-oid="m5.j:n3">
                No effects found
              </p>
            )}
          </TabsContent>

          <TabsContent value="filters" className="px-4" data-oid="uesrsad">
            {Object.entries(groupedFilters).map(([category, filters]) => (
              <CategorySection
                key={category}
                title={category.charAt(0).toUpperCase() + category.slice(1)}
                items={filters}
                type="filter"
                icon={<Palette className="w-4 h-4" data-oid="z4m4k4b" />}
                data-oid="5a7wity"
              />
            ))}
            {filteredFilters.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8" data-oid="fl_cvax">
                No filters found
              </p>
            )}
          </TabsContent>

          <TabsContent value="transitions" className="px-4" data-oid="q6p.tjh">
            {Object.entries(groupedTransitions).map(([category, transitions]) => (
              <CategorySection
                key={category}
                title={category.charAt(0).toUpperCase() + category.slice(1)}
                items={transitions}
                type="transition"
                icon={<Layers className="w-4 h-4" data-oid="34s9:w0" />}
                data-oid="m91zfvb"
              />
            ))}
            {filteredTransitions.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8" data-oid="y2g7loe">
                No transitions found
              </p>
            )}
          </TabsContent>
        </ScrollArea>
      </Tabs>

      {/* Информация о drag & drop */}
      <div className="p-4 border-t bg-muted/50" data-oid="5615xd5">
        <p className="text-xs text-muted-foreground" data-oid="sby_jfn">
          Drag resources onto clips or between clips to apply them
        </p>
      </div>
    </div>
  )
})

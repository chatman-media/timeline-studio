/**
 * Resource Browser Component
 * Панель для выбора и перетаскивания эффектов, фильтров и переходов
 */

import { useDraggable } from "@dnd-kit/core"
import { ChevronDown, ChevronRight, Filter, Layers, Palette, Search, Shuffle, Sparkles } from "lucide-react"
import { memo, useState } from "react"

import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { VideoEffect } from "@/features/effects/types/effects"
import type { VideoFilter } from "@/features/filters/types/filters"
import type { Transition } from "@/features/transitions/types/transitions"
import { cn } from "@/lib/utils"

// Временные моковые данные - потом заменить на реальные из контекста
const mockEffects: VideoEffect[] = [
  { id: "blur", name: "Blur", category: "distortion", enabled: true },
  { id: "glow", name: "Glow", category: "stylize", enabled: true },
  { id: "shake", name: "Shake", category: "motion", enabled: true },
  { id: "zoom", name: "Zoom", category: "motion", enabled: true },
  { id: "glitch", name: "Glitch", category: "distortion", enabled: true },
]

const mockFilters: VideoFilter[] = [
  { id: "brightness", name: "Brightness", category: "color", enabled: true },
  { id: "contrast", name: "Contrast", category: "color", enabled: true },
  { id: "saturation", name: "Saturation", category: "color", enabled: true },
  { id: "sepia", name: "Sepia", category: "style", enabled: true },
  { id: "grayscale", name: "Grayscale", category: "style", enabled: true },
]

const mockTransitions: Transition[] = [
  { id: "fade", name: "Fade", category: "basic", duration: 1.0, enabled: true },
  { id: "dissolve", name: "Dissolve", category: "basic", duration: 1.0, enabled: true },
  { id: "wipe", name: "Wipe", category: "motion", duration: 1.0, enabled: true },
  { id: "slide", name: "Slide", category: "motion", duration: 1.0, enabled: true },
  { id: "zoom", name: "Zoom", category: "3d", duration: 1.0, enabled: true },
]

interface ResourceItemProps {
  resource: VideoEffect | VideoFilter | Transition
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

  return (
    <div
      ref={setNodeRef}
      {...(listeners && typeof listeners === 'object' ? listeners : {})}
      {...(attributes && typeof attributes === 'object' ? attributes : {})}
      className={cn(
        "flex items-center gap-2 p-2 rounded cursor-move",
        "hover:bg-accent transition-colors",
        "border border-transparent hover:border-border",
        isDragging && "opacity-50",
      )}
    >
      <div className="text-muted-foreground">{icon}</div>
      <span className="text-sm">{resource.name}</span>
    </div>
  )
})

interface CategorySectionProps {
  title: string
  items: Array<VideoEffect | VideoFilter | Transition>
  type: "effect" | "filter" | "transition"
  icon: React.ReactNode
}

const CategorySection = memo(function CategorySection({ title, items, type, icon }: CategorySectionProps) {
  const [isExpanded, setIsExpanded] = useState(true)

  return (
    <div className="mb-4">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 w-full p-2 hover:bg-accent rounded transition-colors"
      >
        {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        <span className="font-medium text-sm">{title}</span>
        <span className="ml-auto text-xs text-muted-foreground">{items.length}</span>
      </button>

      {isExpanded && (
        <div className="mt-1 ml-6">
          {items.map((item) => (
            <ResourceItem key={item.id} resource={item} type={type} icon={icon} />
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
  const filterBySearch = <T extends { name: string }>(items: T[]) => {
    if (!searchQuery) return items
    const query = searchQuery.toLowerCase()
    return items.filter((item) => item.name.toLowerCase().includes(query))
  }

  const filteredEffects = filterBySearch(mockEffects)
  const filteredFilters = filterBySearch(mockFilters)
  const filteredTransitions = filterBySearch(mockTransitions)

  const groupedEffects = groupByCategory(filteredEffects)
  const groupedFilters = groupByCategory(filteredFilters)
  const groupedTransitions = groupByCategory(filteredTransitions)

  return (
    <div className="h-full flex flex-col bg-background border-l">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold mb-3">Resources</h2>
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search resources..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="w-full justify-start px-4">
          <TabsTrigger value="effects" className="flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            Effects
          </TabsTrigger>
          <TabsTrigger value="filters" className="flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Filters
          </TabsTrigger>
          <TabsTrigger value="transitions" className="flex items-center gap-2">
            <Shuffle className="w-4 h-4" />
            Transitions
          </TabsTrigger>
        </TabsList>

        <ScrollArea className="flex-1">
          <TabsContent value="effects" className="px-4">
            {Object.entries(groupedEffects).map(([category, effects]) => (
              <CategorySection
                key={category}
                title={category.charAt(0).toUpperCase() + category.slice(1)}
                items={effects}
                type="effect"
                icon={<Sparkles className="w-4 h-4" />}
              />
            ))}
            {filteredEffects.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">No effects found</p>
            )}
          </TabsContent>

          <TabsContent value="filters" className="px-4">
            {Object.entries(groupedFilters).map(([category, filters]) => (
              <CategorySection
                key={category}
                title={category.charAt(0).toUpperCase() + category.slice(1)}
                items={filters}
                type="filter"
                icon={<Palette className="w-4 h-4" />}
              />
            ))}
            {filteredFilters.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">No filters found</p>
            )}
          </TabsContent>

          <TabsContent value="transitions" className="px-4">
            {Object.entries(groupedTransitions).map(([category, transitions]) => (
              <CategorySection
                key={category}
                title={category.charAt(0).toUpperCase() + category.slice(1)}
                items={transitions}
                type="transition"
                icon={<Layers className="w-4 h-4" />}
              />
            ))}
            {filteredTransitions.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">No transitions found</p>
            )}
          </TabsContent>
        </ScrollArea>
      </Tabs>

      {/* Информация о drag & drop */}
      <div className="p-4 border-t bg-muted/50">
        <p className="text-xs text-muted-foreground">Drag resources onto clips or between clips to apply them</p>
      </div>
    </div>
  )
})

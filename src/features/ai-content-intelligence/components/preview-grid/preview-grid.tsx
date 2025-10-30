import { Clock, Download, Grid3X3, Heart, List, Play, Search, Share2, Star } from "lucide-react"
import { type FC, useMemo, useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"

import type { 
  UnifiedContentAnalysis,
  KeyMoment, 
  SceneAnalysis
} from "@/domains/shared/types/ai-tools/content-analysis"

interface PreviewItem {
  id: string
  type: "scene" | "moment" | "highlight"
  title: string
  description?: string
  thumbnailUrl: string
  timestamp: number
  duration: number
  score?: number
  tags: string[]
  isSelected?: boolean
  isStarred?: boolean
}

interface PreviewGridProps {
  analysis: UnifiedContentAnalysis | null
  className?: string
  viewMode?: "grid" | "list"
  itemsPerPage?: number
  enableSelection?: boolean
  enableFiltering?: boolean
  onItemSelect?: (item: PreviewItem) => void
  onItemPlay?: (item: PreviewItem) => void
  onItemDownload?: (item: PreviewItem) => void
  onItemStar?: (item: PreviewItem) => void
  onItemShare?: (item: PreviewItem) => void
  onSelectionChange?: (selectedItems: PreviewItem[]) => void
}

export const PreviewGrid: FC<PreviewGridProps> = ({
  analysis,
  className,
  viewMode = "grid",
  itemsPerPage = 12,
  enableSelection = false,
  enableFiltering = true,
  onItemSelect,
  onItemPlay,
  onItemDownload,
  onItemStar,
  onItemShare,
  onSelectionChange,
}) => {
  const [currentViewMode, setCurrentViewMode] = useState(viewMode)
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState("")
  const [filterType, setFilterType] = useState<"all" | "scene" | "moment" | "highlight">("all")
  const [sortBy, setSortBy] = useState<"timestamp" | "score" | "duration">("timestamp")
  const [currentPage, setCurrentPage] = useState(1)

  // Convert analysis data to preview items
  const previewItems = useMemo(() => {
    if (!analysis) return []

    const items: PreviewItem[] = []

    // Add scenes
    analysis.scenes.forEach((scene: SceneAnalysis) => {
      items.push({
        id: `scene-${scene.id}`,
        type: "scene",
        title: `Сцена ${scene.type}`,
        description: `${scene.duration.toFixed(1)}с • ${scene.content.objects.length} объектов`,
        thumbnailUrl: scene.keyFrames[0]?.thumbnailPath || `/api/thumbnail?t=${scene.startTime}`,
        timestamp: scene.startTime,
        duration: scene.duration,
        score: scene.quality.overall,
        tags: [scene.type, `качество ${scene.quality.overall}%`],
      })
    })

    // Add key moments
    analysis.keyMoments.forEach((moment: KeyMoment) => {
      items.push({
        id: `moment-${moment.id}`,
        type: "moment",
        title: moment.type.replace(/_/g, " "),
        description: moment.description,
        thumbnailUrl: `/api/thumbnail?t=${moment.timestamp}`,
        timestamp: moment.timestamp,
        duration: moment.duration,
        score: moment.score,
        tags: [moment.type, `оценка ${moment.score}`],
      })
    })

    // Add highlights from insights (if available)
    const highlights = (analysis.insights as any).highlights || []
    highlights.forEach((highlight: string, index: number) => {
      items.push({
        id: `highlight-${index}`,
        type: "highlight",
        title: "Основной момент",
        description: highlight,
        thumbnailUrl: `/api/thumbnail?t=${index * 30}`, // Distribute highlights
        timestamp: index * 30,
        duration: 5,
        score: 85 + Math.random() * 15, // Random high score for highlights
        tags: ["highlight", "важное"],
      })
    })

    return items
  }, [analysis])

  // Filter and sort items
  const filteredItems = useMemo(() => {
    let filtered = previewItems

    // Apply type filter
    if (filterType !== "all") {
      filtered = filtered.filter((item) => item.type === filterType)
    }

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (item) =>
          item.title.toLowerCase().includes(query) ||
          item.description?.toLowerCase().includes(query) ||
          item.tags.some((tag) => tag.toLowerCase().includes(query)),
      )
    }

    // Sort items
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "score":
          return (b.score || 0) - (a.score || 0)
        case "duration":
          return b.duration - a.duration
        default:
          return a.timestamp - b.timestamp
      }
    })

    return filtered
  }, [previewItems, filterType, searchQuery, sortBy])

  // Paginate items
  const paginatedItems = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return filteredItems.slice(startIndex, startIndex + itemsPerPage)
  }, [filteredItems, currentPage, itemsPerPage])

  const totalPages = Math.ceil(filteredItems.length / itemsPerPage)

  const handleItemClick = (item: PreviewItem) => {
    if (enableSelection) {
      const newSelected = new Set(selectedItems)
      if (newSelected.has(item.id)) {
        newSelected.delete(item.id)
      } else {
        newSelected.add(item.id)
      }
      setSelectedItems(newSelected)

      const selectedPreviewItems = filteredItems.filter((i) => newSelected.has(i.id))
      onSelectionChange?.(selectedPreviewItems)
    } else {
      onItemSelect?.(item)
    }
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = new Set(filteredItems.map((item) => item.id))
      setSelectedItems(allIds)
      onSelectionChange?.(filteredItems)
    } else {
      setSelectedItems(new Set())
      onSelectionChange?.([])
    }
  }

  if (!analysis) {
    return (
      <Card className={cn("w-full", className)}>
        <CardContent className="flex items-center justify-center h-96">
          <div className="text-center text-muted-foreground">
            <Grid3X3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Нет контента для отображения</p>
            <p className="text-sm mt-2">Загрузите и проанализируйте видео</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={cn("preview-grid space-y-4", className)}>
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Поиск по контенту..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-64"
            />
          </div>

          {enableFiltering && (
            <Tabs value={filterType} onValueChange={(value: any) => setFilterType(value)}>
              <TabsList>
                <TabsTrigger value="all">Все</TabsTrigger>
                <TabsTrigger value="scene">Сцены</TabsTrigger>
                <TabsTrigger value="moment">Моменты</TabsTrigger>
                <TabsTrigger value="highlight">Основное</TabsTrigger>
              </TabsList>
            </Tabs>
          )}
        </div>

        <div className="flex items-center gap-2">
          {enableSelection && filteredItems.length > 0 && (
            <div className="flex items-center gap-2">
              <Checkbox
                checked={selectedItems.size === filteredItems.length && filteredItems.length > 0}
                onCheckedChange={handleSelectAll}
              />
              <span className="text-sm text-muted-foreground">
                {selectedItems.size} из {filteredItems.length}
              </span>
            </div>
          )}

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-background border border-input rounded px-3 py-1 text-sm"
          >
            <option value="timestamp">По времени</option>
            <option value="score">По оценке</option>
            <option value="duration">По длительности</option>
          </select>

          <div className="flex items-center border rounded">
            <Button
              variant={currentViewMode === "grid" ? "default" : "ghost"}
              size="sm"
              onClick={() => setCurrentViewMode("grid")}
            >
              <Grid3X3 className="w-4 h-4" />
            </Button>
            <Button
              variant={currentViewMode === "list" ? "default" : "ghost"}
              size="sm"
              onClick={() => setCurrentViewMode("list")}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Content Grid/List */}
      {currentViewMode === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {paginatedItems.map((item) => (
            <PreviewCard
              key={item.id}
              item={item}
              isSelected={selectedItems.has(item.id)}
              enableSelection={enableSelection}
              onClick={() => handleItemClick(item)}
              onPlay={() => onItemPlay?.(item)}
              onDownload={() => onItemDownload?.(item)}
              onStar={() => onItemStar?.(item)}
              onShare={() => onItemShare?.(item)}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {paginatedItems.map((item) => (
            <PreviewListItem
              key={item.id}
              item={item}
              isSelected={selectedItems.has(item.id)}
              enableSelection={enableSelection}
              onClick={() => handleItemClick(item)}
              onPlay={() => onItemPlay?.(item)}
              onDownload={() => onItemDownload?.(item)}
              onStar={() => onItemStar?.(item)}
              onShare={() => onItemShare?.(item)}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(currentPage - 1)}
          >
            Назад
          </Button>

          <span className="text-sm text-muted-foreground">
            Страница {currentPage} из {totalPages}
          </span>

          <Button
            variant="outline"
            size="sm"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(currentPage + 1)}
          >
            Вперед
          </Button>
        </div>
      )}

      {/* Results Summary */}
      <div className="text-center text-sm text-muted-foreground">
        Показано {paginatedItems.length} из {filteredItems.length} элементов
        {searchQuery && ` по запросу "${searchQuery}"`}
      </div>
    </div>
  )
}

// Preview Card Component for Grid View
interface PreviewCardProps {
  item: PreviewItem
  isSelected: boolean
  enableSelection: boolean
  onClick: () => void
  onPlay: () => void
  onDownload: () => void
  onStar: () => void
  onShare: () => void
}

const PreviewCard: FC<PreviewCardProps> = ({
  item,
  isSelected,
  enableSelection,
  onClick,
  onPlay,
  onDownload,
  onStar,
  onShare,
}) => {
  return (
    <Card
      className={cn("cursor-pointer transition-all hover:shadow-md", isSelected && "ring-2 ring-primary", "group")}
      onClick={onClick}
    >
      <CardContent className="p-0">
        {/* Thumbnail */}
        <div className="relative aspect-video bg-muted rounded-t-lg overflow-hidden">
          <img
            src={item.thumbnailUrl}
            alt={item.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              // Fallback to placeholder
              ;(e.target as HTMLImageElement).src = `data:image/svg+xml,${encodeURIComponent(
                '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="112" viewBox="0 0 200 112"><rect width="200" height="112" fill="#f3f4f6"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#6b7280">Превью</text></svg>',
              )}`
            }}
          />

          {/* Overlay Controls */}
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <Button
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                onPlay()
              }}
            >
              <Play className="w-4 h-4" />
            </Button>
          </div>

          {/* Selection Checkbox */}
          {enableSelection && (
            <div className="absolute top-2 left-2">
              <Checkbox checked={isSelected} onClick={(e) => e.stopPropagation()} />
            </div>
          )}

          {/* Duration Badge */}
          <Badge className="absolute bottom-2 right-2 bg-black/70 text-white">
            <Clock className="w-3 h-3 mr-1" />
            {formatDuration(item.duration)}
          </Badge>

          {/* Score Badge */}
          {item.score && (
            <Badge className="absolute top-2 right-2 bg-primary/80">
              <Star className="w-3 h-3 mr-1" />
              {Math.round(item.score)}
            </Badge>
          )}
        </div>

        {/* Content */}
        <div className="p-3">
          <h3 className="font-semibold text-sm truncate mb-1">{item.title}</h3>
          {item.description && <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{item.description}</p>}

          {/* Tags */}
          <div className="flex flex-wrap gap-1 mb-2">
            {item.tags.slice(0, 2).map((tag, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{formatTime(item.timestamp)}</span>

            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation()
                  onStar()
                }}
              >
                <Heart className={cn("w-3 h-3", item.isStarred && "fill-red-500 text-red-500")} />
              </Button>

              <Button
                size="sm"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation()
                  onShare()
                }}
              >
                <Share2 className="w-3 h-3" />
              </Button>

              <Button
                size="sm"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation()
                  onDownload()
                }}
              >
                <Download className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Preview List Item Component for List View
const PreviewListItem: FC<PreviewCardProps> = ({
  item,
  isSelected,
  enableSelection,
  onClick,
  onPlay,
  onDownload,
  onStar,
  onShare,
}) => {
  return (
    <Card
      className={cn("cursor-pointer transition-all hover:bg-muted/50", isSelected && "ring-2 ring-primary")}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          {/* Selection Checkbox */}
          {enableSelection && <Checkbox checked={isSelected} onClick={(e) => e.stopPropagation()} />}

          {/* Thumbnail */}
          <div className="relative w-24 h-14 bg-muted rounded overflow-hidden flex-shrink-0">
            <img
              src={item.thumbnailUrl}
              alt={item.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                ;(e.target as HTMLImageElement).src = `data:image/svg+xml,${encodeURIComponent(
                  '<svg xmlns="http://www.w3.org/2000/svg" width="96" height="56" viewBox="0 0 96 56"><rect width="96" height="56" fill="#f3f4f6"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#6b7280" font-size="10">Превью</text></svg>',
                )}`
              }}
            />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm truncate">{item.title}</h3>
                {item.description && (
                  <p className="text-sm text-muted-foreground line-clamp-1 mt-1">{item.description}</p>
                )}

                <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatTime(item.timestamp)}
                  </span>
                  <span>Длительность: {formatDuration(item.duration)}</span>
                  {item.score && (
                    <span className="flex items-center gap-1">
                      <Star className="w-3 h-3" />
                      {Math.round(item.score)}
                    </span>
                  )}
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-1 mt-2">
                  {item.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1 ml-4">
                <Button
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    onPlay()
                  }}
                >
                  <Play className="w-4 h-4" />
                </Button>

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation()
                    onStar()
                  }}
                >
                  <Heart className={cn("w-4 h-4", item.isStarred && "fill-red-500 text-red-500")} />
                </Button>

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation()
                    onShare()
                  }}
                >
                  <Share2 className="w-4 h-4" />
                </Button>

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation()
                    onDownload()
                  }}
                >
                  <Download className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Utility functions
function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${minutes}:${secs.toString().padStart(2, "0")}`
}

function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${minutes}:${secs.toString().padStart(2, "0")}`
}

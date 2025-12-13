import {
  Bookmark,
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  Download,
  Filter,
  Folder,
  PlayCircle,
  Plus,
  RefreshCw,
  Search,
  StickyNote,
  X,
} from "lucide-react"
import type React from "react"
import { useMemo, useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useTimelineMarkers } from "../../hooks/markers/use-timeline-markers"
import { useTimeline } from "../../hooks/state/use-timeline"
import type { MarkerFilter, MarkerType } from "../../types/markers"
import { MarkerColors } from "../../types/markers"

const markerTypeOptions: { value: MarkerType; label: string; icon: React.ReactNode }[] = [
  { value: "chapter", label: "Chapter", icon: <Bookmark className="h-4 w-4" /> },
  { value: "section", label: "Section", icon: <Folder className="h-4 w-4" /> },
  { value: "note", label: "Note", icon: <StickyNote className="h-4 w-4" /> },
  { value: "export", label: "Export", icon: <Download className="h-4 w-4" /> },
  { value: "todo", label: "Todo", icon: <CheckSquare className="h-4 w-4" /> },
  { value: "sync", label: "Sync", icon: <RefreshCw className="h-4 w-4" /> },
  { value: "cue", label: "Cue", icon: <PlayCircle className="h-4 w-4" /> },
]

export function MarkerControls() {
  const { currentTime, seek } = useTimeline()
  const { markers, addMarker } = useTimelineMarkers()

  // State variables
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedTypes, setSelectedTypes] = useState<MarkerType[]>([])
  const [newMarkerName, setNewMarkerName] = useState("")
  const [newMarkerType, setNewMarkerType] = useState<MarkerType>("note")

  // Локальная логика для фильтрации и навигации
  const filteredMarkers = useMemo(() => {
    let filtered = markers

    if (searchQuery) {
      filtered = filtered.filter((marker) => marker.name.toLowerCase().includes(searchQuery.toLowerCase()))
    }

    if (selectedTypes.length > 0) {
      filtered = filtered.filter((marker) => selectedTypes.includes(marker.type!))
    }

    return filtered
  }, [markers, searchQuery, selectedTypes])

  const goToNextMarker = () => {
    const sortedMarkers = [...markers].sort((a, b) => a.time - b.time)
    const nextMarker = sortedMarkers.find((marker) => marker.time > currentTime)
    if (nextMarker) {
      void seek(nextMarker.time)
    }
  }

  const goToPreviousMarker = () => {
    const sortedMarkers = [...markers].sort((a, b) => b.time - a.time)
    const prevMarker = sortedMarkers.find((marker) => marker.time < currentTime)
    if (prevMarker) {
      void seek(prevMarker.time)
    }
  }

  const setFilter = (filter: { query?: string; types?: MarkerType[] }) => {
    if (filter.query !== undefined) setSearchQuery(filter.query)
    if (filter.types !== undefined) setSelectedTypes(filter.types)
  }

  const clearFilter = () => {
    setSearchQuery("")
    setSelectedTypes([])
  }

  const handleAddMarker = () => {
    if (!newMarkerName.trim()) return

    addMarker({
      time: currentTime,
      name: newMarkerName,
      type: newMarkerType,
      color: MarkerColors[newMarkerType],
    })
    setNewMarkerName("")
  }

  const handleTypeToggle = (type: MarkerType) => {
    const newTypes = selectedTypes.includes(type) ? selectedTypes.filter((t) => t !== type) : [...selectedTypes, type]

    setSelectedTypes(newTypes)
    updateFilter({ types: newTypes.length > 0 ? newTypes : undefined })
  }

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    updateFilter({ search: query || undefined })
  }

  const updateFilter = (updates: Partial<MarkerFilter>) => {
    const filter: MarkerFilter = {}

    if (selectedTypes.length > 0) {
      filter.types = selectedTypes
    }

    if (searchQuery) {
      filter.search = searchQuery
    }

    setFilter({ ...filter, ...updates })
  }

  const handleClearFilter = () => {
    setSelectedTypes([])
    setSearchQuery("")
    clearFilter()
    setIsFilterOpen(false)
  }

  const activeFilterCount = selectedTypes.length + (searchQuery ? 1 : 0)

  return (
    <div className="flex items-center gap-2 p-2 border-b bg-background">
      {/* Add marker */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm">
            <Plus className="h-4 w-4 mr-1" />
            Add Marker
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80" align="start">
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Add Marker</h4>
              <p className="text-sm text-muted-foreground">Create a marker at current time</p>
            </div>

            <div className="space-y-2">
              <Input
                value={newMarkerName}
                onChange={(e) => setNewMarkerName(e.target.value)}
                placeholder="Marker name"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleAddMarker()
                  }
                }}
              />

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="w-full justify-between">
                    <span className="flex items-center gap-2">
                      {markerTypeOptions.find((t) => t.value === newMarkerType)?.icon}
                      {markerTypeOptions.find((t) => t.value === newMarkerType)?.label}
                    </span>
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: MarkerColors[newMarkerType] }} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {markerTypeOptions.map((type) => (
                    <DropdownMenuItem key={type.value} onClick={() => setNewMarkerType(type.value)}>
                      <span className="flex items-center gap-2 flex-1">
                        {type.icon}
                        {type.label}
                      </span>
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: MarkerColors[type.value] }} />
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <Button size="sm" className="w-full" onClick={handleAddMarker} disabled={!newMarkerName.trim()}>
              Add Marker
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      {/* Navigation */}
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="sm" onClick={goToPreviousMarker} disabled={filteredMarkers.length === 0}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm text-muted-foreground px-2">
          {filteredMarkers.length} / {markers.length}
        </span>
        <Button variant="ghost" size="sm" onClick={goToNextMarker} disabled={filteredMarkers.length === 0}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Filter */}
      <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-1" />
            Filter
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="ml-2 h-5 px-1">
                {activeFilterCount}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80" align="start">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Filter Markers</h4>
              {activeFilterCount > 0 && (
                <Button variant="ghost" size="sm" onClick={handleClearFilter}>
                  Clear all
                </Button>
              )}
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Search markers..."
                className="pl-8"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1 h-7 w-7 p-0"
                  onClick={() => handleSearch("")}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>

            <DropdownMenuSeparator />

            {/* Type filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Marker Types</label>
              <div className="space-y-1">
                {markerTypeOptions.map((type) => (
                  <label key={type.value} className="flex items-center gap-2 p-2 rounded hover:bg-muted cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedTypes.includes(type.value)}
                      onChange={() => handleTypeToggle(type.value)}
                      className="rounded"
                    />
                    <span className="flex items-center gap-2 flex-1">
                      {type.icon}
                      {type.label}
                    </span>
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: MarkerColors[type.value] }} />
                  </label>
                ))}
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}

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

import { Badge } from "@timeline-studio/ui/components/badge"
import { Button } from "@timeline-studio/ui/components/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@timeline-studio/ui/components/dropdown-menu"
import { Input } from "@timeline-studio/ui/components/input"
import { Popover, PopoverContent, PopoverTrigger } from "@timeline-studio/ui/components/popover"
import { useTimelineMarkers } from "../../hooks/markers/use-timeline-markers"
import { useTimeline } from "../../hooks/state/use-timeline"
import type { MarkerFilter, MarkerType } from "../../types/markers"
import { MarkerColors } from "../../types/markers"

const markerTypeOptions: {
  value: MarkerType
  label: string
  icon: React.ReactNode
}[] = [
  {
    value: "chapter",
    label: "Chapter",
    icon: <Bookmark className="h-4 w-4" data-oid="ekpootb" />,
  },
  {
    value: "section",
    label: "Section",
    icon: <Folder className="h-4 w-4" data-oid="ibe8uo9" />,
  },
  {
    value: "note",
    label: "Note",
    icon: <StickyNote className="h-4 w-4" data-oid="1ub2m68" />,
  },
  {
    value: "export",
    label: "Export",
    icon: <Download className="h-4 w-4" data-oid="nmcw0qq" />,
  },
  {
    value: "todo",
    label: "Todo",
    icon: <CheckSquare className="h-4 w-4" data-oid="qaiswmz" />,
  },
  {
    value: "sync",
    label: "Sync",
    icon: <RefreshCw className="h-4 w-4" data-oid="_vj6r02" />,
  },
  {
    value: "cue",
    label: "Cue",
    icon: <PlayCircle className="h-4 w-4" data-oid="4o8_lil" />,
  },
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
    <div className="flex items-center gap-2 p-2 border-b bg-background" data-oid="xxylubu">
      {/* Add marker */}
      <Popover data-oid="oqjhrgr">
        <PopoverTrigger asChild data-oid="dqgs:0k">
          <Button variant="outline" size="sm" data-oid="qq:lms-">
            <Plus className="h-4 w-4 mr-1" data-oid="ipqocct" />
            Add Marker
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80" align="start" data-oid="c0aneff">
          <div className="space-y-4" data-oid="lisuh7c">
            <div data-oid="4fn90.e">
              <h4 className="font-medium mb-2" data-oid="ebifmek">
                Add Marker
              </h4>
              <p className="text-sm text-muted-foreground" data-oid="2m-4nb5">
                Create a marker at current time
              </p>
            </div>

            <div className="space-y-2" data-oid="98yxd1w">
              <Input
                value={newMarkerName}
                onChange={(e) => setNewMarkerName(e.target.value)}
                placeholder="Marker name"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleAddMarker()
                  }
                }}
                data-oid=":tv:.m0"
              />

              <DropdownMenu data-oid="twp7puf">
                <DropdownMenuTrigger asChild data-oid="q_369nx">
                  <Button variant="outline" size="sm" className="w-full justify-between" data-oid="ufyqp4.">
                    <span className="flex items-center gap-2" data-oid="zv5vsq_">
                      {markerTypeOptions.find((t) => t.value === newMarkerType)?.icon}
                      {markerTypeOptions.find((t) => t.value === newMarkerType)?.label}
                    </span>
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: MarkerColors[newMarkerType] }}
                      data-oid="fx:2pdj"
                    />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent data-oid=":vh64xa">
                  {markerTypeOptions.map((type) => (
                    <DropdownMenuItem key={type.value} onClick={() => setNewMarkerType(type.value)} data-oid="ocbzq58">
                      <span className="flex items-center gap-2 flex-1" data-oid="ljtgyb7">
                        {type.icon}
                        {type.label}
                      </span>
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: MarkerColors[type.value] }}
                        data-oid="_2fi8kj"
                      />
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <Button
              size="sm"
              className="w-full"
              onClick={handleAddMarker}
              disabled={!newMarkerName.trim()}
              data-oid=":h43_it"
            >
              Add Marker
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      {/* Navigation */}
      <div className="flex items-center gap-1" data-oid="dtlgmdi">
        <Button
          variant="ghost"
          size="sm"
          onClick={goToPreviousMarker}
          disabled={filteredMarkers.length === 0}
          data-oid="qtuqnh8"
        >
          <ChevronLeft className="h-4 w-4" data-oid="u0ccga1" />
        </Button>
        <span className="text-sm text-muted-foreground px-2" data-oid="c:8j_5i">
          {filteredMarkers.length} / {markers.length}
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={goToNextMarker}
          disabled={filteredMarkers.length === 0}
          data-oid="krg30jk"
        >
          <ChevronRight className="h-4 w-4" data-oid="5gj.vjb" />
        </Button>
      </div>

      {/* Filter */}
      <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen} data-oid="8v.-.ur">
        <PopoverTrigger asChild data-oid=":g_jass">
          <Button variant="outline" size="sm" data-oid="3fyoh:c">
            <Filter className="h-4 w-4 mr-1" data-oid="dsydhz_" />
            Filter
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="ml-2 h-5 px-1" data-oid="n6tzj1:">
                {activeFilterCount}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80" align="start" data-oid="avh_7jg">
          <div className="space-y-4" data-oid="jsnep_1">
            <div className="flex items-center justify-between" data-oid="n48kkfa">
              <h4 className="font-medium" data-oid="oacl:zv">
                Filter Markers
              </h4>
              {activeFilterCount > 0 && (
                <Button variant="ghost" size="sm" onClick={handleClearFilter} data-oid="w5o78p8">
                  Clear all
                </Button>
              )}
            </div>

            {/* Search */}
            <div className="relative" data-oid="y0orq1j">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" data-oid="swes861" />
              <Input
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Search markers..."
                className="pl-8"
                data-oid="18yjsch"
              />

              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1 h-7 w-7 p-0"
                  onClick={() => handleSearch("")}
                  data-oid="22tsc_s"
                >
                  <X className="h-3 w-3" data-oid="pjuy:sn" />
                </Button>
              )}
            </div>

            <DropdownMenuSeparator data-oid="wgg_2sy" />

            {/* Type filter */}
            <div className="space-y-2" data-oid="53le0cl">
              <label className="text-sm font-medium" data-oid="13y3so:">
                Marker Types
              </label>
              <div className="space-y-1" data-oid="xnno1_n">
                {markerTypeOptions.map((type) => (
                  <label
                    key={type.value}
                    className="flex items-center gap-2 p-2 rounded hover:bg-muted cursor-pointer"
                    data-oid="zkd:-v4"
                  >
                    <input
                      type="checkbox"
                      checked={selectedTypes.includes(type.value)}
                      onChange={() => handleTypeToggle(type.value)}
                      className="rounded"
                      data-oid="-at-z8w"
                    />

                    <span className="flex items-center gap-2 flex-1" data-oid="77he4qm">
                      {type.icon}
                      {type.label}
                    </span>
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: MarkerColors[type.value] }}
                      data-oid="zzzvkzb"
                    />
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

import { Input } from "@timeline-studio/ui/components/input"
import { ScrollArea } from "@timeline-studio/ui/components/scroll-area"
import { useMemo, useState } from "react"
import { cn } from "@/lib/utils"

import { nodeLibrary } from "../../services/node-library"

import type { NodeCategory, NodeLibraryItem } from "../../types/node-compositing"

interface NodeLibraryPanelProps {
  onNodeAdd: (nodeType: string) => void
  className?: string
}

const categoryIcons: Record<NodeCategory, string> = {
  source: "📥",
  filter: "🎨",
  transform: "🔄",
  composite: "🔀",
  color: "🎨",
  time: "⏱️",
  mask: "🎭",
  utility: "🔧",
  output: "📤",
}

const categoryNames: Record<NodeCategory, string> = {
  source: "Sources",
  filter: "Filters",
  transform: "Transform",
  composite: "Composite",
  color: "Color",
  time: "Time",
  mask: "Masks",
  utility: "Utility",
  output: "Output",
}

export function NodeLibraryPanel({ onNodeAdd, className }: NodeLibraryPanelProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<NodeCategory | "all">("all")
  const [expandedCategories, setExpandedCategories] = useState<Set<NodeCategory>>(
    new Set(["source", "filter", "composite"]),
  )

  // Group nodes by category
  const nodesByCategory = useMemo(() => {
    const groups: Record<NodeCategory, NodeLibraryItem[]> = {
      source: [],
      filter: [],
      transform: [],
      composite: [],
      color: [],
      time: [],
      mask: [],
      utility: [],
      output: [],
    }

    nodeLibrary.forEach((node) => {
      groups[node.category].push(node)
    })

    return groups
  }, [])

  // Filter nodes based on search
  const filteredNodes = useMemo(() => {
    const query = searchQuery.toLowerCase()

    if (!query && selectedCategory === "all") {
      return nodesByCategory
    }

    const filtered: Record<NodeCategory, NodeLibraryItem[]> = {
      source: [],
      filter: [],
      transform: [],
      composite: [],
      color: [],
      time: [],
      mask: [],
      utility: [],
      output: [],
    }

    Object.entries(nodesByCategory).forEach(([category, nodes]) => {
      if (selectedCategory !== "all" && category !== selectedCategory) {
        return
      }

      filtered[category as NodeCategory] = nodes.filter(
        (node) =>
          !query ||
          node.name.toLowerCase().includes(query) ||
          node.description.toLowerCase().includes(query) ||
          node.tags?.some((tag) => tag.toLowerCase().includes(query)),
      )
    })

    return filtered
  }, [searchQuery, selectedCategory, nodesByCategory])

  // Count total filtered nodes
  const totalFilteredNodes = useMemo(() => {
    return Object.values(filteredNodes).reduce((sum, nodes) => sum + nodes.length, 0)
  }, [filteredNodes])

  const handleCategoryToggle = (category: NodeCategory) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev)
      if (next.has(category)) {
        next.delete(category)
      } else {
        next.add(category)
      }
      return next
    })
  }

  const handleNodeClick = (nodeType: string) => {
    onNodeAdd(nodeType)
  }

  return (
    <div className={cn("flex flex-col h-full bg-gray-900 border-r border-gray-800", className)} data-oid="bqw6fk5">
      {/* Header */}
      <div className="p-4 border-b border-gray-800" data-oid="-3xamr.">
        <h3 className="text-sm font-medium text-white mb-3" data-oid="z7d9y_m">
          Node Library
        </h3>

        {/* Search */}
        <Input
          type="text"
          placeholder="Search nodes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="mb-3 bg-gray-800 border-gray-700 text-white placeholder-gray-500"
          data-oid="yj6mqv-"
        />

        {/* Category filter */}
        <div className="flex flex-wrap gap-1" data-oid="iy19_j8">
          <button
            onClick={() => setSelectedCategory("all")}
            className={cn(
              "px-2 py-1 text-xs rounded transition-colors",
              selectedCategory === "all" ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-400 hover:bg-gray-700",
            )}
            data-oid="dock3ee"
          >
            All ({totalFilteredNodes})
          </button>
          {Object.entries(categoryNames).map(([key, name]) => {
            const category = key as NodeCategory
            const count = filteredNodes[category]?.length || 0

            return (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={cn(
                  "px-2 py-1 text-xs rounded transition-colors",
                  selectedCategory === category
                    ? "bg-blue-600 text-white"
                    : "bg-gray-800 text-gray-400 hover:bg-gray-700",
                )}
                data-oid="xds_f7o"
              >
                {categoryIcons[category]} {name} ({count})
              </button>
            )
          })}
        </div>
      </div>

      {/* Node list */}
      <ScrollArea className="flex-1" data-oid="0wlc3lp">
        <div className="p-4" data-oid="244t-8n">
          {Object.entries(filteredNodes).map(([category, nodes]) => {
            if (nodes.length === 0) return null

            const isExpanded = expandedCategories.has(category as NodeCategory)

            return (
              <div key={category} className="mb-4" data-oid="2s6p60:">
                <button
                  onClick={() => handleCategoryToggle(category as NodeCategory)}
                  className="flex items-center gap-2 w-full text-left mb-2 text-sm font-medium text-gray-300 hover:text-white transition-colors"
                  data-oid="m-qhf_u"
                >
                  <span className={cn("transition-transform", isExpanded ? "rotate-90" : "")} data-oid="d4o76qv">
                    ▶
                  </span>
                  <span data-oid=".g:751n">{categoryIcons[category as NodeCategory]}</span>
                  <span data-oid="kdqjeld">{categoryNames[category as NodeCategory]}</span>
                  <span className="text-xs text-gray-500 ml-auto" data-oid="g5wwsbt">
                    {nodes.length}
                  </span>
                </button>

                {isExpanded && (
                  <div className="ml-6 space-y-1" data-oid="1exxl38">
                    {nodes.map((node) => (
                      <button
                        key={node.type}
                        onClick={() => handleNodeClick(node.type)}
                        className={cn(
                          "w-full p-2 text-left rounded transition-all",
                          "bg-gray-800 hover:bg-gray-700",
                          "border border-gray-700 hover:border-gray-600",
                          "group",
                        )}
                        data-oid="k1j9ktp"
                      >
                        <div className="flex items-start gap-2" data-oid="no123v3">
                          <div
                            className="text-lg opacity-50 group-hover:opacity-100 transition-opacity"
                            data-oid="5gjy3jb"
                          >
                            {node.icon || "📦"}
                          </div>
                          <div className="flex-1 min-w-0" data-oid="4w-vb6j">
                            <div className="text-sm font-medium text-white" data-oid="gcw1cx0">
                              {node.name}
                            </div>
                            <div className="text-xs text-gray-400 truncate" data-oid="lihiu18">
                              {node.description}
                            </div>
                            {node.tags && node.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1" data-oid="0swg4nn">
                                {node.tags.slice(0, 3).map((tag) => (
                                  <span
                                    key={tag}
                                    className="inline-block px-1 py-0.5 text-xs bg-gray-700 text-gray-300 rounded"
                                    data-oid="xmlsty-"
                                  >
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )
          })}

          {totalFilteredNodes === 0 && (
            <div className="text-center text-gray-500 text-sm py-8" data-oid="gh..kxo">
              No nodes found
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="block mx-auto mt-2 text-blue-400 hover:text-blue-300"
                  data-oid="-axajnc"
                >
                  Clear search
                </button>
              )}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Footer stats */}
      <div className="p-4 border-t border-gray-800 text-xs text-gray-500" data-oid="8lig5px">
        <div data-oid="rqq9fvz">Total nodes: {nodeLibrary.length}</div>
        <div data-oid="ue799bj">Categories: {Object.keys(categoryNames).length}</div>
      </div>
    </div>
  )
}

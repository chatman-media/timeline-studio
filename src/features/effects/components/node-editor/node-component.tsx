import React, { useCallback, useRef, useState } from "react"

import { cn } from "@/lib/utils"
import type { CompositeNode, NodePort } from "../../types/node-compositing"
import { NodeParameterControl } from "./node-parameter-control"

interface NodeComponentProps {
  node: CompositeNode
  selected: boolean
  onMove: (x: number, y: number) => void
  onPortClick: (portId: string, isOutput: boolean, position: { x: number; y: number }) => void
  onParameterChange: (parameterId: string, value: any) => void
  onSelect: () => void
}

export function NodeComponent({
  node,
  selected,
  onMove,
  onPortClick,
  onParameterChange,
  onSelect,
}: NodeComponentProps) {
  const nodeRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isExpanded, setIsExpanded] = useState(true)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })

  // Handle node dragging
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === nodeRef.current || (e.target as HTMLElement).classList.contains("node-header")) {
        e.preventDefault()
        e.stopPropagation()

        setIsDragging(true)
        setDragStart({
          x: e.clientX - node.position.x,
          y: e.clientY - node.position.y,
        })

        onSelect()
      }
    },
    [node.position, onSelect],
  )

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (isDragging) {
        const newX = e.clientX - dragStart.x
        const newY = e.clientY - dragStart.y
        onMove(newX, newY)
      }
    },
    [isDragging, dragStart, onMove],
  )

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  // Setup global mouse listeners for dragging
  React.useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove)
      window.addEventListener("mouseup", handleMouseUp)

      return () => {
        window.removeEventListener("mousemove", handleMouseMove)
        window.removeEventListener("mouseup", handleMouseUp)
      }
    }
  }, [isDragging, handleMouseMove, handleMouseUp])

  // Handle port clicks
  const handlePortClick = (port: NodePort, isOutput: boolean) => (e: React.MouseEvent) => {
    e.stopPropagation()

    const portElement = e.currentTarget as HTMLElement
    const rect = portElement.getBoundingClientRect()
    const nodeRect = nodeRef.current!.getBoundingClientRect()

    onPortClick(port.id, isOutput, {
      x: rect.left + rect.width / 2 - nodeRect.left + node.position.x,
      y: rect.top + rect.height / 2 - nodeRect.top + node.position.y,
    })
  }

  // Get node color based on category
  const getCategoryColor = () => {
    switch (node.category) {
      case "source":
        return "from-green-600 to-green-700"
      case "filter":
        return "from-blue-600 to-blue-700"
      case "transform":
        return "from-purple-600 to-purple-700"
      case "composite":
        return "from-orange-600 to-orange-700"
      case "color":
        return "from-pink-600 to-pink-700"
      case "output":
        return "from-red-600 to-red-700"
      default:
        return "from-gray-600 to-gray-700"
    }
  }

  return (
    <div
      ref={nodeRef}
      className={cn(
        "node-component absolute bg-gray-800 rounded-lg shadow-lg",
        "border-2 transition-colors cursor-move select-none",
        selected ? "border-blue-500" : "border-gray-700",
        node.error && "border-red-500",
        isDragging && "opacity-90",
      )}
      style={{
        left: node.position.x,
        top: node.position.y,
        width: node.size?.width || 200,
        minHeight: node.size?.height || 100,
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Header */}
      <div
        className={cn(
          "node-header px-3 py-2 rounded-t-lg bg-linear-to-r text-white text-sm font-medium",
          "flex items-center justify-between",
          getCategoryColor(),
        )}
      >
        <span className="truncate">{node.name}</span>
        <button
          onClick={(e) => {
            e.stopPropagation()
            setIsExpanded(!isExpanded)
          }}
          className="ml-2 text-xs opacity-70 hover:opacity-100"
        >
          {isExpanded ? "−" : "+"}
        </button>
      </div>

      {/* Content */}
      <div className={cn("p-2", !isExpanded && "hidden")}>
        {/* Input ports */}
        <div className="space-y-1 mb-2">
          {node.inputs.map((port) => (
            <div key={port.id} className="flex items-center">
              <div
                className={cn(
                  "port-input w-3 h-3 -ml-5 mr-2 rounded-full border-2",
                  "cursor-pointer hover:scale-125 transition-transform",
                  port.required ? "bg-white border-white" : "bg-gray-600 border-gray-400",
                )}
                onClick={handlePortClick(port, false)}
                title={`${port.name} (${port.type})`}
              />
              <span className="text-xs text-gray-300">{port.name}</span>
            </div>
          ))}
        </div>

        {/* Parameters */}
        {node.parameters.length > 0 && (
          <div className="space-y-2 my-2 py-2 border-t border-gray-700">
            {node.parameters.map((param) => (
              <NodeParameterControl
                key={param.id}
                parameter={param}
                onChange={(value) => onParameterChange(param.id, value)}
              />
            ))}
          </div>
        )}

        {/* Output ports */}
        <div className="space-y-1 mt-2">
          {node.outputs.map((port) => (
            <div key={port.id} className="flex items-center justify-end">
              <span className="text-xs text-gray-300">{port.name}</span>
              <div
                className={cn(
                  "port-output w-3 h-3 -mr-5 ml-2 rounded-full",
                  "cursor-pointer hover:scale-125 transition-transform",
                  "bg-white border-2 border-white",
                )}
                onClick={handlePortClick(port, true)}
                title={`${port.name} (${port.type})`}
              />
            </div>
          ))}
        </div>

        {/* Preview */}
        {node.preview && (
          <div className="mt-2 pt-2 border-t border-gray-700">
            <div className="w-full h-16 bg-gray-900 rounded flex items-center justify-center text-xs text-gray-500">
              Preview
            </div>
          </div>
        )}

        {/* Error message */}
        {node.error && (
          <div className="mt-2 p-2 bg-red-900/20 border border-red-800 rounded text-xs text-red-400">{node.error}</div>
        )}

        {/* Processing indicator */}
        {node.processing && (
          <div className="absolute inset-0 bg-gray-900/50 rounded-lg flex items-center justify-center">
            <div className="animate-spin w-6 h-6 border-2 border-white border-t-transparent rounded-full" />
          </div>
        )}
      </div>
    </div>
  )
}

import type React from "react"
import { useMemo } from "react"

import { cn } from "@/lib/utils"

import type { CompositeNode, NodeConnection, NodePort } from "../../types/node-compositing"

interface ConnectionLineProps {
  connection: NodeConnection
  sourceNode: CompositeNode
  targetNode: CompositeNode
  sourcePort: NodePort
  targetPort: NodePort
  selected: boolean
  onSelect: () => void
  onDelete: () => void
}

export function ConnectionLine({
  connection,
  sourceNode,
  targetNode,
  sourcePort,
  targetPort,
  selected,
  onSelect,
  onDelete,
}: ConnectionLineProps) {
  // Calculate connection path
  const path = useMemo(() => {
    const sourcePortIndex = sourceNode.outputs.findIndex((p) => p.id === sourcePort.id)
    const targetPortIndex = targetNode.inputs.findIndex((p) => p.id === targetPort.id)

    // Estimate port positions
    const sourceX = sourceNode.position.x + (sourceNode.size?.width || 200)
    const sourceY = sourceNode.position.y + 40 + sourcePortIndex * 20

    const targetX = targetNode.position.x
    const targetY = targetNode.position.y + 40 + targetPortIndex * 20

    // Calculate bezier control points
    const distance = Math.abs(targetX - sourceX)
    const controlOffset = Math.min(distance / 2, 100)

    return `M ${sourceX} ${sourceY} C ${sourceX + controlOffset} ${sourceY}, ${targetX - controlOffset} ${targetY}, ${targetX} ${targetY}`
  }, [sourceNode, targetNode, sourcePort, targetPort])

  // Get connection color based on data type
  const getTypeColor = () => {
    switch (sourcePort.type) {
      case "video":
        return "#10b981" // green
      case "audio":
        return "#f59e0b" // amber
      case "image":
        return "#3b82f6" // blue
      case "number":
        return "#8b5cf6" // purple
      case "color":
        return "#ec4899" // pink
      case "mask":
        return "#6b7280" // gray
      default:
        return "#6b7280"
    }
  }

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onSelect()
  }

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (window.confirm("Delete this connection?")) {
      onDelete()
    }
  }

  return (
    <g className="connection-line" data-oid="pq89hyx">
      {/* Invisible wider path for easier selection */}
      <path
        d={path}
        stroke="transparent"
        strokeWidth="12"
        fill="none"
        className="cursor-pointer"
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        data-oid="9u.py.3"
      />

      {/* Shadow */}
      <path
        d={path}
        stroke="rgba(0,0,0,0.3)"
        strokeWidth="3"
        fill="none"
        style={{ transform: "translate(1px, 1px)" }}
        pointerEvents="none"
        data-oid="mpcih3s"
      />

      {/* Main connection line */}
      <path
        d={path}
        stroke={selected ? "#fff" : getTypeColor()}
        strokeWidth={selected ? "3" : "2"}
        fill="none"
        className={cn("transition-all", !connection.active && "opacity-50 stroke-dasharray-5")}
        pointerEvents="none"
        data-oid="f.e-pyd"
      />

      {/* Flow animation */}
      {connection.active && (
        <circle r="3" fill={getTypeColor()} data-oid="5wxoc4z">
          <animateMotion dur="2s" repeatCount="indefinite" path={path} data-oid="mahkzd2" />
        </circle>
      )}

      {/* Connection points */}
      <circle
        cx={sourceNode.position.x + (sourceNode.size?.width || 200)}
        cy={sourceNode.position.y + 40 + sourceNode.outputs.findIndex((p) => p.id === sourcePort.id) * 20}
        r="4"
        fill={getTypeColor()}
        stroke="#1f2937"
        strokeWidth="1"
        data-oid="xu0qe7z"
      />

      <circle
        cx={targetNode.position.x}
        cy={targetNode.position.y + 40 + targetNode.inputs.findIndex((p) => p.id === targetPort.id) * 20}
        r="4"
        fill={getTypeColor()}
        stroke="#1f2937"
        strokeWidth="1"
        data-oid="5rfov-:"
      />
    </g>
  )
}

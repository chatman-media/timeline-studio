import type React from "react"
import { useCallback, useEffect, useRef, useState } from "react"

import { cn } from "@/lib/utils"
import { useNodeEditor } from "../../hooks/use-node-editor"
import type { NodeConnection, NodeGraph } from "../../types/node-compositing"
import { ConnectionLine } from "./connection-line"
import { NodeComponent } from "./node-component"

interface NodeCanvasProps {
  graph: NodeGraph
  onGraphChange: (graph: NodeGraph) => void
  onNodeSelect?: (nodeIds: string[]) => void
  onNodeDelete?: (nodeIds: string[]) => void
  className?: string
}

export function NodeCanvas({ graph, onGraphChange, onNodeSelect, onNodeDelete, className }: NodeCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null)
  const [isPanning, setIsPanning] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [connectionStart, setConnectionStart] = useState<{
    nodeId: string
    portId: string
    isOutput: boolean
    position: { x: number; y: number }
  } | null>(null)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [selectionBox, setSelectionBox] = useState<{
    start: { x: number; y: number }
    end: { x: number; y: number }
  } | null>(null)

  const { viewport, setViewport, screenToCanvas, canvasToScreen, fitToScreen, zoomIn, zoomOut } = useNodeEditor(graph)

  // Handle mouse wheel for zoom
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault()

      if (e.ctrlKey || e.metaKey) {
        // Zoom
        const delta = e.deltaY > 0 ? 0.9 : 1.1
        const newZoom = Math.max(0.1, Math.min(3, viewport.zoom * delta))

        // Zoom towards mouse position
        const rect = canvas.getBoundingClientRect()
        const mouseX = e.clientX - rect.left
        const mouseY = e.clientY - rect.top

        const canvasPosBefore = screenToCanvas(mouseX, mouseY)

        setViewport((prev) => ({ ...prev, zoom: newZoom }))

        // Adjust pan to keep mouse position stable
        const canvasPosAfter = screenToCanvas(mouseX, mouseY)
        const deltaX = (canvasPosAfter.x - canvasPosBefore.x) * newZoom
        const deltaY = (canvasPosAfter.y - canvasPosBefore.y) * newZoom

        setViewport((prev) => ({
          ...prev,
          x: prev.x - deltaX,
          y: prev.y - deltaY,
        }))
      } else {
        // Pan
        setViewport((prev) => ({
          ...prev,
          x: prev.x - e.deltaX,
          y: prev.y - e.deltaY,
        }))
      }
    }

    canvas.addEventListener("wheel", handleWheel, { passive: false })
    return () => canvas.removeEventListener("wheel", handleWheel)
  }, [viewport.zoom, screenToCanvas, setViewport])

  // Handle mouse events
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      // Middle mouse or Alt+Left for panning
      setIsPanning(true)
      e.preventDefault()
    } else if (e.button === 0 && !(e.target as HTMLElement).closest(".node-component")) {
      // Start selection box
      const rect = canvasRef.current!.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      setSelectionBox({
        start: { x, y },
        end: { x, y },
      })
    }
  }, [])

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      const rect = canvasRef.current!.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      setMousePosition({ x, y })

      if (isPanning) {
        setViewport((prev) => ({
          ...prev,
          x: prev.x + e.movementX,
          y: prev.y + e.movementY,
        }))
      } else if (selectionBox) {
        setSelectionBox((prev) => ({
          ...prev!,
          end: { x, y },
        }))
      }
    },
    [isPanning, selectionBox, setViewport],
  )

  const handleMouseUp = useCallback(
    (_e: React.MouseEvent) => {
      setIsPanning(false)

      if (selectionBox) {
        // Select nodes within box
        const selected: string[] = []
        const box = {
          left: Math.min(selectionBox.start.x, selectionBox.end.x),
          top: Math.min(selectionBox.start.y, selectionBox.end.y),
          right: Math.max(selectionBox.start.x, selectionBox.end.x),
          bottom: Math.max(selectionBox.start.y, selectionBox.end.y),
        }

        Object.entries(graph.nodes).forEach(([nodeId, node]) => {
          const pos = canvasToScreen(node.position.x, node.position.y)
          const size = node.size || { width: 200, height: 100 }

          if (
            pos.x >= box.left &&
            pos.x + size.width <= box.right &&
            pos.y >= box.top &&
            pos.y + size.height <= box.bottom
          ) {
            selected.push(nodeId)
          }
        })

        onNodeSelect?.(selected)
        setSelectionBox(null)
      }

      if (isConnecting) {
        setIsConnecting(false)
        setConnectionStart(null)
      }
    },
    [selectionBox, isConnecting, graph.nodes, canvasToScreen, onNodeSelect],
  )

  // Handle connection creation
  const handlePortClick = useCallback(
    (nodeId: string, portId: string, isOutput: boolean, position: { x: number; y: number }) => {
      if (!isConnecting) {
        // Start connection
        setIsConnecting(true)
        setConnectionStart({ nodeId, portId, isOutput, position })
      } else if (connectionStart) {
        // Complete connection
        if (connectionStart.isOutput !== isOutput) {
          const sourceNodeId = connectionStart.isOutput ? connectionStart.nodeId : nodeId
          const sourcePortId = connectionStart.isOutput ? connectionStart.portId : portId
          const targetNodeId = connectionStart.isOutput ? nodeId : connectionStart.nodeId
          const targetPortId = connectionStart.isOutput ? portId : connectionStart.portId

          // Validate connection
          const sourceNode = graph.nodes[sourceNodeId]
          const targetNode = graph.nodes[targetNodeId]
          const sourcePort = sourceNode?.outputs.find((p) => p.id === sourcePortId)
          const targetPort = targetNode?.inputs.find((p) => p.id === targetPortId)

          if (sourcePort && targetPort && sourcePort.type === targetPort.type) {
            // Create connection
            const newConnection: NodeConnection = {
              id: `conn_${Date.now()}`,
              sourceNodeId,
              sourcePortId,
              targetNodeId,
              targetPortId,
              active: true,
            }

            onGraphChange({
              ...graph,
              connections: [...graph.connections, newConnection],
            })
          }
        }

        setIsConnecting(false)
        setConnectionStart(null)
      }
    },
    [isConnecting, connectionStart, graph, onGraphChange],
  )

  // Handle node operations
  const handleNodeMove = useCallback(
    (nodeId: string, x: number, y: number) => {
      onGraphChange({
        ...graph,
        nodes: {
          ...graph.nodes,
          [nodeId]: {
            ...graph.nodes[nodeId],
            position: { x, y },
          },
        },
      })
    },
    [graph, onGraphChange],
  )

  const handleNodeParameterChange = useCallback(
    (nodeId: string, parameterId: string, value: any) => {
      const node = graph.nodes[nodeId]
      if (!node) return

      onGraphChange({
        ...graph,
        nodes: {
          ...graph.nodes,
          [nodeId]: {
            ...node,
            parameters: node.parameters.map((p) => (p.id === parameterId ? { ...p, value } : p)),
          },
        },
      })
    },
    [graph, onGraphChange],
  )

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Delete" && graph.selectedNodeIds.length > 0) {
        onNodeDelete?.(graph.selectedNodeIds)
      } else if (e.key === "f" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault()
        fitToScreen(Object.values(graph.nodes))
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [graph.selectedNodeIds, graph.nodes, onNodeDelete, fitToScreen])

  return (
    <div
      ref={canvasRef}
      className={cn(
        "relative w-full h-full overflow-hidden bg-gray-900",
        "cursor-grab active:cursor-grabbing",
        className,
      )}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={() => {
        setIsPanning(false)
        setSelectionBox(null)
      }}
      data-oid="0mkw29v"
    >
      {/* Grid background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={
          {
            backgroundImage: `
            linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)
          `,
            backgroundSize: `${20 * viewport.zoom}px ${20 * viewport.zoom}px`,
            backgroundPosition: `${viewport.x}px ${viewport.y}px`,
          } as React.CSSProperties
        }
        data-oid="3cnc5zw"
      />

      {/* Canvas transform container */}
      <div
        className="absolute"
        style={{
          transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
          transformOrigin: "0 0",
        }}
        data-oid="nxokhxs"
      >
        {/* Render connections */}
        {graph.connections.map((connection) => {
          const sourceNode = graph.nodes[connection.sourceNodeId]
          const targetNode = graph.nodes[connection.targetNodeId]

          if (!sourceNode || !targetNode) return null

          const sourcePort = sourceNode.outputs.find((p) => p.id === connection.sourcePortId)
          const targetPort = targetNode.inputs.find((p) => p.id === connection.targetPortId)

          if (!sourcePort || !targetPort) return null

          return (
            <ConnectionLine
              key={connection.id}
              connection={connection}
              sourceNode={sourceNode}
              targetNode={targetNode}
              sourcePort={sourcePort}
              targetPort={targetPort}
              selected={false}
              onSelect={() => {}}
              onDelete={() => {
                onGraphChange({
                  ...graph,
                  connections: graph.connections.filter((c) => c.id !== connection.id),
                })
              }}
              data-oid="aiiphjp"
            />
          )
        })}

        {/* Render active connection line while connecting */}
        {isConnecting && connectionStart && (
          <svg className="absolute inset-0 pointer-events-none" style={{ overflow: "visible" }} data-oid="fvf0d-1">
            <path
              d={`M ${connectionStart.position.x} ${connectionStart.position.y} L ${screenToCanvas(mousePosition.x, mousePosition.y).x} ${screenToCanvas(mousePosition.x, mousePosition.y).y}`}
              stroke="#3b82f6"
              strokeWidth="2"
              fill="none"
              strokeDasharray="5,5"
              data-oid="o.g1mzh"
            />
          </svg>
        )}

        {/* Render nodes */}
        {Object.entries(graph.nodes).map(([nodeId, node]) => (
          <NodeComponent
            key={nodeId}
            node={node}
            selected={graph.selectedNodeIds.includes(nodeId)}
            onMove={(x, y) => handleNodeMove(nodeId, x, y)}
            onPortClick={(portId, isOutput, position) => handlePortClick(nodeId, portId, isOutput, position)}
            onParameterChange={(parameterId, value) => handleNodeParameterChange(nodeId, parameterId, value)}
            onSelect={() => onNodeSelect?.([nodeId])}
            data-oid="ti7nlnt"
          />
        ))}
      </div>

      {/* Selection box */}
      {selectionBox && (
        <div
          className="absolute border-2 border-blue-500 bg-blue-500/10 pointer-events-none"
          style={{
            left: Math.min(selectionBox.start.x, selectionBox.end.x),
            top: Math.min(selectionBox.start.y, selectionBox.end.y),
            width: Math.abs(selectionBox.end.x - selectionBox.start.x),
            height: Math.abs(selectionBox.end.y - selectionBox.start.y),
          }}
          data-oid=":-vkfkc"
        />
      )}

      {/* Controls */}
      <div className="absolute top-4 right-4 flex flex-col gap-2" data-oid="ug.6wii">
        <button
          onClick={() => zoomIn()}
          className="px-3 py-1 bg-gray-800 text-white rounded hover:bg-gray-700"
          data-oid=":gtsdf_"
        >
          +
        </button>
        <button
          onClick={() => zoomOut()}
          className="px-3 py-1 bg-gray-800 text-white rounded hover:bg-gray-700"
          data-oid="0d5zbhz"
        >
          -
        </button>
        <button
          onClick={() => fitToScreen(Object.values(graph.nodes))}
          className="px-3 py-1 bg-gray-800 text-white rounded hover:bg-gray-700"
          data-oid="66rvmwp"
        >
          Fit
        </button>
      </div>
    </div>
  )
}

import { useCallback, useState } from "react"

import { createLogger } from "@/lib/tauri-logger"
import type { CompositeNode, NodeGraph } from "../types/node-compositing"

const logger = createLogger("useNodeEditor")

interface Viewport {
  x: number
  y: number
  zoom: number
}

export function useNodeEditor(_initialGraph: NodeGraph) {
  const [viewport, setViewport] = useState<Viewport>({
    x: 0,
    y: 0,
    zoom: 1,
  })

  // Convert screen coordinates to canvas coordinates
  const screenToCanvas = useCallback(
    (screenX: number, screenY: number) => {
      return {
        x: (screenX - viewport.x) / viewport.zoom,
        y: (screenY - viewport.y) / viewport.zoom,
      }
    },
    [viewport],
  )

  // Convert canvas coordinates to screen coordinates
  const canvasToScreen = useCallback(
    (canvasX: number, canvasY: number) => {
      return {
        x: canvasX * viewport.zoom + viewport.x,
        y: canvasY * viewport.zoom + viewport.y,
      }
    },
    [viewport],
  )

  // Zoom in
  const zoomIn = useCallback(() => {
    setViewport((prev) => ({
      ...prev,
      zoom: Math.min(3, prev.zoom * 1.2),
    }))
  }, [])

  // Zoom out
  const zoomOut = useCallback(() => {
    setViewport((prev) => ({
      ...prev,
      zoom: Math.max(0.1, prev.zoom / 1.2),
    }))
  }, [])

  // Reset zoom
  const resetZoom = useCallback(() => {
    setViewport((prev) => ({
      ...prev,
      zoom: 1,
    }))
  }, [])

  // Fit nodes to screen
  const fitToScreen = useCallback((nodes: CompositeNode[], padding = 50) => {
    void logger.info(`Fitting ${nodes.length} nodes to screen`)

    if (nodes.length === 0) return

    // Calculate bounding box
    let minX = Number.POSITIVE_INFINITY
    let minY = Number.POSITIVE_INFINITY
    let maxX = Number.NEGATIVE_INFINITY
    let maxY = Number.NEGATIVE_INFINITY

    nodes.forEach((node) => {
      minX = Math.min(minX, node.position.x)
      minY = Math.min(minY, node.position.y)
      maxX = Math.max(maxX, node.position.x + (node.size?.width || 200))
      maxY = Math.max(maxY, node.position.y + (node.size?.height || 100))
    })

    const width = maxX - minX
    const height = maxY - minY

    // Get canvas dimensions (assuming full window for now)
    const canvasWidth = window.innerWidth - padding * 2
    const canvasHeight = window.innerHeight - padding * 2

    // Calculate zoom to fit
    const zoomX = canvasWidth / width
    const zoomY = canvasHeight / height
    const newZoom = Math.min(zoomX, zoomY, 1)

    // Calculate pan to center
    const centerX = (minX + maxX) / 2
    const centerY = (minY + maxY) / 2

    setViewport({
      x: canvasWidth / 2 - centerX * newZoom,
      y: canvasHeight / 2 - centerY * newZoom,
      zoom: newZoom,
    })
  }, [])

  // Pan to node
  const panToNode = useCallback((node: CompositeNode) => {
    const nodeWidth = node.size?.width || 200
    const nodeHeight = node.size?.height || 100

    const centerX = node.position.x + nodeWidth / 2
    const centerY = node.position.y + nodeHeight / 2

    setViewport((prev) => ({
      ...prev,
      x: window.innerWidth / 2 - centerX * prev.zoom,
      y: window.innerHeight / 2 - centerY * prev.zoom,
    }))
  }, [])

  // Check if point is in viewport
  const isInViewport = useCallback(
    (x: number, y: number, width = 0, height = 0) => {
      const screenPos = canvasToScreen(x, y)

      return (
        screenPos.x + width >= 0 &&
        screenPos.x <= window.innerWidth &&
        screenPos.y + height >= 0 &&
        screenPos.y <= window.innerHeight
      )
    },
    [canvasToScreen],
  )

  // Get visible nodes
  const getVisibleNodes = useCallback(
    (graph: NodeGraph) => {
      return Object.entries(graph.nodes).filter(([_, node]) => {
        return isInViewport(node.position.x, node.position.y, node.size?.width || 200, node.size?.height || 100)
      })
    },
    [isInViewport],
  )

  return {
    viewport,
    setViewport,
    screenToCanvas,
    canvasToScreen,
    zoomIn,
    zoomOut,
    resetZoom,
    fitToScreen,
    panToNode,
    isInViewport,
    getVisibleNodes,
  }
}

// Additional hook for node selection
export function useNodeSelection() {
  const [selectedNodeIds, setSelectedNodeIds] = useState<string[]>([])

  const selectNode = useCallback((nodeId: string, multi = false) => {
    void logger.info( `Selecting node ${nodeId} (multi: ${multi})`)
    if (multi) {
      setSelectedNodeIds((prev) => (prev.includes(nodeId) ? prev.filter((id) => id !== nodeId) : [...prev, nodeId]))
    } else {
      setSelectedNodeIds([nodeId])
    }
  }, [])

  const selectNodes = useCallback((nodeIds: string[]) => {
    void logger.info( `Selecting ${nodeIds.length} nodes`)
    setSelectedNodeIds(nodeIds)
  }, [])

  const deselectAll = useCallback(() => {
    void logger.info( "Deselecting all nodes")
    setSelectedNodeIds([])
  }, [])

  const isNodeSelected = useCallback(
    (nodeId: string) => {
      return selectedNodeIds.includes(nodeId)
    },
    [selectedNodeIds],
  )

  return {
    selectedNodeIds,
    selectNode,
    selectNodes,
    deselectAll,
    isNodeSelected,
  }
}

// Hook for node graph operations
export function useNodeGraphOperations() {
  const [graph, setGraph] = useState<NodeGraph>({
    id: "new_graph",
    name: "New Graph",
    nodes: {},
    connections: [],
    selectedNodeIds: [],
    viewport: { x: 0, y: 0, zoom: 1 },
  })

  const [history, setHistory] = useState<NodeGraph[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)

  // Add to history
  const addToHistory = useCallback(
    (newGraph: NodeGraph) => {
      void logger.info( `Adding to history at index ${historyIndex + 1}`)
      setHistory((prev) => [...prev.slice(0, historyIndex + 1), newGraph])
      setHistoryIndex((prev) => prev + 1)
    },
    [historyIndex],
  )

  // Undo
  const undo = useCallback(() => {
    if (historyIndex > 0) {
      void logger.info( `Undoing - moving to history index ${historyIndex - 1}`)
      setHistoryIndex((prev) => prev - 1)
      setGraph(history[historyIndex - 1])
    }
  }, [history, historyIndex])

  // Redo
  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      void logger.info( `Redoing - moving to history index ${historyIndex + 1}`)
      setHistoryIndex((prev) => prev + 1)
      setGraph(history[historyIndex + 1])
    }
  }, [history, historyIndex])

  // Update graph with history
  const updateGraph = useCallback(
    (updater: (graph: NodeGraph) => NodeGraph) => {
      const newGraph = updater(graph)
      setGraph(newGraph)
      addToHistory(newGraph)
    },
    [graph, addToHistory],
  )

  // Add node
  const addNode = useCallback(
    (node: CompositeNode) => {
      void logger.info( `Adding node ${node.id}`)
      updateGraph((g) => ({
        ...g,
        nodes: {
          ...g.nodes,
          [node.id]: node,
        },
      }))
    },
    [updateGraph],
  )

  // Remove nodes
  const removeNodes = useCallback(
    (nodeIds: string[]) => {
      void logger.info( `Removing ${nodeIds.length} nodes`)
      updateGraph((g) => {
        const newNodes = { ...g.nodes }
        const newConnections = g.connections.filter(
          (conn) => !nodeIds.includes(conn.sourceNodeId) && !nodeIds.includes(conn.targetNodeId),
        )

        nodeIds.forEach((id) => delete newNodes[id])

        return {
          ...g,
          nodes: newNodes,
          connections: newConnections,
          selectedNodeIds: g.selectedNodeIds.filter((id) => !nodeIds.includes(id)),
        }
      })
    },
    [updateGraph],
  )

  // Duplicate nodes
  const duplicateNodes = useCallback(
    (nodeIds: string[]) => {
      void logger.info( `Duplicating ${nodeIds.length} nodes`)
      updateGraph((g) => {
        const newNodes = { ...g.nodes }
        const offset = 50

        nodeIds.forEach((id) => {
          const original = g.nodes[id]
          if (!original) return

          const newNode: CompositeNode = {
            ...original,
            id: `${original.type}_${Date.now()}_${Math.random()}`,
            position: {
              x: original.position.x + offset,
              y: original.position.y + offset,
            },
          }

          newNodes[newNode.id] = newNode
        })

        return {
          ...g,
          nodes: newNodes,
        }
      })
    },
    [updateGraph],
  )

  return {
    graph,
    setGraph: updateGraph,
    history,
    historyIndex,
    undo,
    redo,
    canUndo: historyIndex > 0,
    canRedo: historyIndex < history.length - 1,
    addNode,
    removeNodes,
    duplicateNodes,
  }
}

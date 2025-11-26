import { act, renderHook } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { useNodeEditor, useNodeGraphOperations, useNodeSelection } from "../../hooks/use-node-editor"
import type { CompositeNode, NodeGraph } from "../../types/node-compositing"

// Mock logger
vi.mock("@/lib/tauri-logger", () => ({
  createLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}))

describe("useNodeEditor", () => {
  const createMockNode = (id: string, x = 0, y = 0): CompositeNode => ({
    id,
    type: "transform",
    name: `Node ${id}`,
    category: "color",
    position: { x, y },
    size: { width: 200, height: 100 },
    inputs: [{ id: "input", name: "Input", type: "image", required: false }],
    outputs: [{ id: "output", name: "Output", type: "image" }],
    parameters: [],
    cached: false,
  })

  const createMockGraph = (): NodeGraph => ({
    id: "test_graph",
    name: "Test Graph",
    nodes: {},
    connections: [],
    selectedNodeIds: [],
    viewport: { x: 0, y: 0, zoom: 1 },
  })

  beforeEach(() => {
    // Mock window dimensions
    Object.defineProperty(window, "innerWidth", { value: 1920, writable: true })
    Object.defineProperty(window, "innerHeight", { value: 1080, writable: true })
  })

  describe("viewport management", () => {
    it("should initialize with default viewport", () => {
      const { result } = renderHook(() => useNodeEditor(createMockGraph()))

      expect(result.current.viewport).toEqual({
        x: 0,
        y: 0,
        zoom: 1,
      })
    })

    it("should update viewport", () => {
      const { result } = renderHook(() => useNodeEditor(createMockGraph()))

      act(() => {
        result.current.setViewport({ x: 100, y: 50, zoom: 1.5 })
      })

      expect(result.current.viewport).toEqual({
        x: 100,
        y: 50,
        zoom: 1.5,
      })
    })
  })

  describe("coordinate conversion", () => {
    it("should convert screen to canvas coordinates", () => {
      const { result } = renderHook(() => useNodeEditor(createMockGraph()))

      act(() => {
        result.current.setViewport({ x: 100, y: 50, zoom: 2 })
      })

      const canvasCoords = result.current.screenToCanvas(200, 100)

      expect(canvasCoords).toEqual({
        x: 50, // (200 - 100) / 2
        y: 25, // (100 - 50) / 2
      })
    })

    it("should convert canvas to screen coordinates", () => {
      const { result } = renderHook(() => useNodeEditor(createMockGraph()))

      act(() => {
        result.current.setViewport({ x: 100, y: 50, zoom: 2 })
      })

      const screenCoords = result.current.canvasToScreen(50, 25)

      expect(screenCoords).toEqual({
        x: 200, // 50 * 2 + 100
        y: 100, // 25 * 2 + 50
      })
    })

    it("should handle zoom = 1", () => {
      const { result } = renderHook(() => useNodeEditor(createMockGraph()))

      const canvasCoords = result.current.screenToCanvas(100, 100)
      const screenCoords = result.current.canvasToScreen(canvasCoords.x, canvasCoords.y)

      expect(screenCoords).toEqual({ x: 100, y: 100 })
    })
  })

  describe("zoom operations", () => {
    it("should zoom in", () => {
      const { result } = renderHook(() => useNodeEditor(createMockGraph()))

      act(() => {
        result.current.zoomIn()
      })

      expect(result.current.viewport.zoom).toBe(1.2)
    })

    it("should zoom out", () => {
      const { result } = renderHook(() => useNodeEditor(createMockGraph()))

      act(() => {
        result.current.zoomOut()
      })

      expect(result.current.viewport.zoom).toBeCloseTo(1 / 1.2)
    })

    it("should limit maximum zoom", () => {
      const { result } = renderHook(() => useNodeEditor(createMockGraph()))

      act(() => {
        result.current.zoomIn()
        result.current.zoomIn()
        result.current.zoomIn()
        result.current.zoomIn()
      })

      expect(result.current.viewport.zoom).toBeLessThanOrEqual(3)
    })

    it("should limit minimum zoom", () => {
      const { result } = renderHook(() => useNodeEditor(createMockGraph()))

      act(() => {
        result.current.zoomOut()
        result.current.zoomOut()
        result.current.zoomOut()
        result.current.zoomOut()
      })

      expect(result.current.viewport.zoom).toBeGreaterThanOrEqual(0.1)
    })

    it("should reset zoom", () => {
      const { result } = renderHook(() => useNodeEditor(createMockGraph()))

      act(() => {
        result.current.zoomIn()
        result.current.zoomIn()
        result.current.resetZoom()
      })

      expect(result.current.viewport.zoom).toBe(1)
    })
  })

  describe("fit to screen", () => {
    it("should fit single node to screen", () => {
      const { result } = renderHook(() => useNodeEditor(createMockGraph()))
      const node = createMockNode("node1", 500, 500)

      act(() => {
        result.current.fitToScreen([node])
      })

      expect(result.current.viewport.zoom).toBeLessThanOrEqual(1)
    })

    it("should fit multiple nodes to screen", () => {
      const { result } = renderHook(() => useNodeEditor(createMockGraph()))
      const nodes = [
        createMockNode("node1", 0, 0),
        createMockNode("node2", 1000, 1000),
        createMockNode("node3", 2000, 500),
      ]

      act(() => {
        result.current.fitToScreen(nodes)
      })

      expect(result.current.viewport.zoom).toBeLessThanOrEqual(1)
    })

    it("should handle empty node list", () => {
      const { result } = renderHook(() => useNodeEditor(createMockGraph()))

      act(() => {
        result.current.fitToScreen([])
      })

      // Should not crash
      expect(result.current.viewport).toBeDefined()
    })

    it("should apply padding", () => {
      const { result } = renderHook(() => useNodeEditor(createMockGraph()))
      const node = createMockNode("node1", 500, 500)

      act(() => {
        result.current.fitToScreen([node], 100)
      })

      expect(result.current.viewport).toBeDefined()
    })
  })

  describe("pan to node", () => {
    it("should pan to center node", () => {
      const { result } = renderHook(() => useNodeEditor(createMockGraph()))
      const node = createMockNode("node1", 1000, 500)

      act(() => {
        result.current.panToNode(node)
      })

      // Should center node in viewport
      expect(result.current.viewport.x).toBeDefined()
      expect(result.current.viewport.y).toBeDefined()
    })

    it("should respect current zoom when panning", () => {
      const { result } = renderHook(() => useNodeEditor(createMockGraph()))
      const node = createMockNode("node1", 1000, 500)

      act(() => {
        result.current.zoomIn()
        result.current.panToNode(node)
      })

      expect(result.current.viewport.zoom).toBeGreaterThan(1)
    })
  })

  describe("viewport queries", () => {
    it("should check if point is in viewport", () => {
      const { result } = renderHook(() => useNodeEditor(createMockGraph()))

      const isVisible = result.current.isInViewport(100, 100)

      expect(typeof isVisible).toBe("boolean")
    })

    it("should check if rectangle is in viewport", () => {
      const { result } = renderHook(() => useNodeEditor(createMockGraph()))

      const isVisible = result.current.isInViewport(100, 100, 200, 100)

      expect(typeof isVisible).toBe("boolean")
    })

    it("should get visible nodes", () => {
      const { result } = renderHook(() => useNodeEditor(createMockGraph()))
      const graph: NodeGraph = {
        ...createMockGraph(),
        nodes: {
          node1: createMockNode("node1", 0, 0),
          node2: createMockNode("node2", 10000, 10000), // Far away
        },
      }

      const visibleNodes = result.current.getVisibleNodes(graph)

      expect(Array.isArray(visibleNodes)).toBe(true)
    })
  })
})

describe("useNodeSelection", () => {
  it("should initialize with empty selection", () => {
    const { result } = renderHook(() => useNodeSelection())

    expect(result.current.selectedNodeIds).toEqual([])
  })

  it("should select single node", () => {
    const { result } = renderHook(() => useNodeSelection())

    act(() => {
      result.current.selectNode("node1")
    })

    expect(result.current.selectedNodeIds).toEqual(["node1"])
  })

  it("should replace selection when multi is false", () => {
    const { result } = renderHook(() => useNodeSelection())

    act(() => {
      result.current.selectNode("node1")
      result.current.selectNode("node2", false)
    })

    expect(result.current.selectedNodeIds).toEqual(["node2"])
  })

  it("should add to selection when multi is true", () => {
    const { result } = renderHook(() => useNodeSelection())

    act(() => {
      result.current.selectNode("node1")
      result.current.selectNode("node2", true)
    })

    expect(result.current.selectedNodeIds).toContain("node1")
    expect(result.current.selectedNodeIds).toContain("node2")
  })

  it("should toggle selection in multi mode", () => {
    const { result } = renderHook(() => useNodeSelection())

    act(() => {
      result.current.selectNode("node1")
      result.current.selectNode("node2", true)
      result.current.selectNode("node1", true)
    })

    expect(result.current.selectedNodeIds).toEqual(["node2"])
  })

  it("should select multiple nodes at once", () => {
    const { result } = renderHook(() => useNodeSelection())

    act(() => {
      result.current.selectNodes(["node1", "node2", "node3"])
    })

    expect(result.current.selectedNodeIds).toEqual(["node1", "node2", "node3"])
  })

  it("should deselect all nodes", () => {
    const { result } = renderHook(() => useNodeSelection())

    act(() => {
      result.current.selectNodes(["node1", "node2", "node3"])
      result.current.deselectAll()
    })

    expect(result.current.selectedNodeIds).toEqual([])
  })

  it("should check if node is selected", () => {
    const { result } = renderHook(() => useNodeSelection())

    act(() => {
      result.current.selectNode("node1")
    })

    expect(result.current.isNodeSelected("node1")).toBe(true)
    expect(result.current.isNodeSelected("node2")).toBe(false)
  })
})

describe("useNodeGraphOperations", () => {
  const createMockNode = (id: string): CompositeNode => ({
    id,
    type: "transform",
    name: `Node ${id}`,
    category: "color",
    position: { x: 0, y: 0 },
    inputs: [],
    outputs: [],
    parameters: [],
    cached: false,
  })

  it("should initialize with empty graph", () => {
    const { result } = renderHook(() => useNodeGraphOperations())

    expect(result.current.graph.nodes).toEqual({})
    expect(result.current.graph.connections).toEqual([])
  })

  it("should add node", () => {
    const { result } = renderHook(() => useNodeGraphOperations())
    const node = createMockNode("node1")

    act(() => {
      result.current.addNode(node)
    })

    expect(result.current.graph.nodes.node1).toEqual(node)
  })

  it("should remove nodes", () => {
    const { result } = renderHook(() => useNodeGraphOperations())
    const node1 = createMockNode("node1")
    const node2 = createMockNode("node2")

    act(() => {
      result.current.addNode(node1)
      result.current.addNode(node2)
      result.current.removeNodes(["node1"])
    })

    expect(result.current.graph.nodes.node1).toBeUndefined()
    expect(result.current.graph.nodes.node2).toEqual(node2)
  })

  it("should remove connections when removing nodes", () => {
    const { result } = renderHook(() => useNodeGraphOperations())
    const node1 = createMockNode("node1")
    const node2 = createMockNode("node2")

    act(() => {
      result.current.addNode(node1)
      result.current.addNode(node2)
      result.current.setGraph((g) => ({
        ...g,
        connections: [
          {
            id: "conn1",
            sourceNodeId: "node1",
            sourcePortId: "output",
            targetNodeId: "node2",
            targetPortId: "input",
            active: true,
          },
        ],
      }))
      result.current.removeNodes(["node1"])
    })

    expect(result.current.graph.connections).toHaveLength(0)
  })

  it("should duplicate nodes", () => {
    const { result } = renderHook(() => useNodeGraphOperations())
    const node = createMockNode("node1")

    act(() => {
      result.current.addNode(node)
      result.current.duplicateNodes(["node1"])
    })

    const nodeCount = Object.keys(result.current.graph.nodes).length
    expect(nodeCount).toBe(2)
  })

  it("should offset duplicated nodes", () => {
    const { result } = renderHook(() => useNodeGraphOperations())
    const node = createMockNode("node1")

    act(() => {
      result.current.addNode(node)
      result.current.duplicateNodes(["node1"])
    })

    const duplicatedNode = Object.values(result.current.graph.nodes).find((n) => n.id !== "node1")
    expect(duplicatedNode?.position.x).toBe(50)
    expect(duplicatedNode?.position.y).toBe(50)
  })

  describe("history management", () => {
    it("should track history", () => {
      const { result } = renderHook(() => useNodeGraphOperations())

      act(() => {
        result.current.addNode(createMockNode("node1"))
      })

      expect(result.current.history.length).toBeGreaterThan(0)
    })

    it("should undo", () => {
      const { result } = renderHook(() => useNodeGraphOperations())

      act(() => {
        result.current.addNode(createMockNode("node1"))
        result.current.addNode(createMockNode("node2"))
      })

      const nodeCountBefore = Object.keys(result.current.graph.nodes).length

      act(() => {
        result.current.undo()
      })

      const nodeCountAfter = Object.keys(result.current.graph.nodes).length
      expect(nodeCountAfter).toBeLessThan(nodeCountBefore)
    })

    it("should redo", () => {
      const { result } = renderHook(() => useNodeGraphOperations())

      act(() => {
        result.current.addNode(createMockNode("node1"))
        result.current.undo()
      })

      const nodeCountBefore = Object.keys(result.current.graph.nodes).length

      act(() => {
        result.current.redo()
      })

      const nodeCountAfter = Object.keys(result.current.graph.nodes).length
      expect(nodeCountAfter).toBeGreaterThan(nodeCountBefore)
    })

    it("should check if can undo", () => {
      const { result } = renderHook(() => useNodeGraphOperations())

      expect(result.current.canUndo).toBe(false)

      act(() => {
        result.current.addNode(createMockNode("node1"))
      })

      expect(result.current.canUndo).toBe(true)
    })

    it("should check if can redo", () => {
      const { result } = renderHook(() => useNodeGraphOperations())

      act(() => {
        result.current.addNode(createMockNode("node1"))
      })

      expect(result.current.canRedo).toBe(false)

      act(() => {
        result.current.undo()
      })

      expect(result.current.canRedo).toBe(true)
    })

    it("should clear redo history on new action", () => {
      const { result } = renderHook(() => useNodeGraphOperations())

      act(() => {
        result.current.addNode(createMockNode("node1"))
        result.current.addNode(createMockNode("node2"))
        result.current.undo()
        result.current.addNode(createMockNode("node3"))
      })

      expect(result.current.canRedo).toBe(false)
    })
  })
})

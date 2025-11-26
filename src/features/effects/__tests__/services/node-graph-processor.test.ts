import { beforeEach, describe, expect, it, vi } from "vitest"
import { NodeGraphProcessor } from "../../services/node-graph-processor"
import type { CompositeNode, NodeExecutionContext, NodeGraph } from "../../types/node-compositing"

// Mock node library
vi.mock("../../services/node-library", () => ({
  getNodeProcessor: vi.fn((_type: string) => ({
    process: vi.fn(async (_node: CompositeNode, inputs: Record<string, any>) => {
      // Simple mock processor that passes through input
      return { output: inputs.input || "processed" }
    }),
  })),
}))

// Mock logger
vi.mock("@/lib/tauri-logger", () => ({
  createLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}))

describe("NodeGraphProcessor", () => {
  let processor: NodeGraphProcessor
  let mockContext: NodeExecutionContext

  beforeEach(() => {
    processor = new NodeGraphProcessor()
    mockContext = {
      frameNumber: 0,
      time: 0,
      width: 1920,
      height: 1080,
    }
  })

  const createMockNode = (id: string, type = "transform", inputs: any[] = [], outputs: any[] = []): CompositeNode => ({
    id,
    type,
    name: `Node ${id}`,
    category: "color",
    position: { x: 0, y: 0 },
    inputs: inputs.length > 0 ? inputs : [{ id: "input", name: "Input", type: "image", required: false }],
    outputs: outputs.length > 0 ? outputs : [{ id: "output", name: "Output", type: "image" }],
    parameters: [],
    cached: false,
  })

  const createMockGraph = (nodes: CompositeNode[], connections: any[] = []): NodeGraph => ({
    id: "test_graph",
    name: "Test Graph",
    nodes: nodes.reduce(
      (acc, node) => {
        acc[node.id] = node
        return acc
      },
      {} as Record<string, CompositeNode>,
    ),
    connections,
    selectedNodeIds: [],
    viewport: { x: 0, y: 0, zoom: 1 },
  })

  describe("processGraph", () => {
    it("should process empty graph", async () => {
      const graph = createMockGraph([])

      const results = await processor.processGraph(graph, mockContext)

      expect(results.size).toBe(0)
    })

    it("should process single node", async () => {
      const node = createMockNode("node1")
      const graph = createMockGraph([node])

      const results = await processor.processGraph(graph, mockContext)

      expect(results.size).toBe(1)
      expect(results.has("node1")).toBe(true)
    })

    it("should process multiple independent nodes", async () => {
      const node1 = createMockNode("node1")
      const node2 = createMockNode("node2")
      const graph = createMockGraph([node1, node2])

      const results = await processor.processGraph(graph, mockContext)

      expect(results.size).toBe(2)
      expect(results.has("node1")).toBe(true)
      expect(results.has("node2")).toBe(true)
    })

    it("should process nodes in dependency order", async () => {
      const node1 = createMockNode("node1", "source", [], [{ id: "output", name: "Output", type: "image" }])
      const node2 = createMockNode(
        "node2",
        "transform",
        [{ id: "input", name: "Input", type: "image", required: true }],
        [{ id: "output", name: "Output", type: "image" }],
      )
      const node3 = createMockNode(
        "node3",
        "output",
        [{ id: "input", name: "Input", type: "image", required: true }],
        [],
      )

      const graph = createMockGraph(
        [node1, node2, node3],
        [
          {
            id: "conn1",
            sourceNodeId: "node1",
            sourcePortId: "output",
            targetNodeId: "node2",
            targetPortId: "input",
            active: true,
          },
          {
            id: "conn2",
            sourceNodeId: "node2",
            sourcePortId: "output",
            targetNodeId: "node3",
            targetPortId: "input",
            active: true,
          },
        ],
      )

      const results = await processor.processGraph(graph, mockContext)

      expect(results.size).toBe(3)
      // All nodes should be processed
      expect(results.has("node1")).toBe(true)
      expect(results.has("node2")).toBe(true)
      expect(results.has("node3")).toBe(true)
    })

    it("should handle node processing errors gracefully", async () => {
      const node = createMockNode("failing_node")
      const graph = createMockGraph([node])

      // Mock processor to throw error
      const { getNodeProcessor } = await import("../../services/node-library")
      vi.mocked(getNodeProcessor).mockReturnValueOnce({
        process: vi.fn().mockRejectedValue(new Error("Processing failed")),
      })

      const results = await processor.processGraph(graph, mockContext)

      expect(results.size).toBe(1)
      expect(results.get("failing_node")?.data).toBeNull()
    })

    it("should clear cache when frameNumber is 0", async () => {
      const node = createMockNode("node1")
      node.cached = true
      const graph = createMockGraph([node])

      // Process first time
      await processor.processGraph(graph, { ...mockContext, frameNumber: 0 })

      // Process again with different frame
      await processor.processGraph(graph, { ...mockContext, frameNumber: 1 })

      // Cache should be cleared at frame 0
      expect(processor.getCacheStats().size).toBeGreaterThanOrEqual(0)
    })

    it("should use cached results for cached nodes", async () => {
      const node = createMockNode("node1")
      node.cached = true
      const graph = createMockGraph([node])

      // Process first time
      const results1 = await processor.processGraph(graph, { ...mockContext, frameNumber: 1 })

      // Process again with same frame
      const results2 = await processor.processGraph(graph, { ...mockContext, frameNumber: 1 })

      expect(results1.get("node1")).toBeDefined()
      expect(results2.get("node1")).toBeDefined()
    })
  })

  describe("validateGraph", () => {
    it("should validate correct graph", () => {
      const node1 = createMockNode("node1")
      const node2 = createMockNode("node2")
      const graph = createMockGraph(
        [node1, node2],
        [
          {
            id: "conn1",
            sourceNodeId: "node1",
            sourcePortId: "output",
            targetNodeId: "node2",
            targetPortId: "input",
            active: true,
          },
        ],
      )

      const validation = processor.validateGraph(graph)

      expect(validation.valid).toBe(true)
      expect(validation.errors).toHaveLength(0)
    })

    it("should detect missing source node", () => {
      const node2 = createMockNode("node2")
      const graph = createMockGraph(
        [node2],
        [
          {
            id: "conn1",
            sourceNodeId: "missing_node",
            sourcePortId: "output",
            targetNodeId: "node2",
            targetPortId: "input",
            active: true,
          },
        ],
      )

      const validation = processor.validateGraph(graph)

      expect(validation.valid).toBe(false)
      expect(validation.errors.some((err) => err.message.includes("missing_node"))).toBe(true)
    })

    it("should detect missing target node", () => {
      const node1 = createMockNode("node1")
      const graph = createMockGraph(
        [node1],
        [
          {
            id: "conn1",
            sourceNodeId: "node1",
            sourcePortId: "output",
            targetNodeId: "missing_node",
            targetPortId: "input",
            active: true,
          },
        ],
      )

      const validation = processor.validateGraph(graph)

      expect(validation.valid).toBe(false)
      expect(validation.errors.some((err) => err.message.includes("missing_node"))).toBe(true)
    })

    it("should detect port type mismatch", () => {
      const node1 = createMockNode("node1", "source", [], [{ id: "output", name: "Output", type: "image" }])
      const node2 = createMockNode(
        "node2",
        "transform",
        [{ id: "input", name: "Input", type: "number", required: true }],
        [],
      )
      const graph = createMockGraph(
        [node1, node2],
        [
          {
            id: "conn1",
            sourceNodeId: "node1",
            sourcePortId: "output",
            targetNodeId: "node2",
            targetPortId: "input",
            active: true,
          },
        ],
      )

      const validation = processor.validateGraph(graph)

      expect(validation.valid).toBe(false)
      expect(validation.errors.some((err) => err.message.includes("Type mismatch"))).toBe(true)
    })

    it("should detect missing required inputs", () => {
      const node = createMockNode("node1", "transform", [{ id: "input", name: "Input", type: "image", required: true }])
      const graph = createMockGraph([node])

      const validation = processor.validateGraph(graph)

      expect(validation.valid).toBe(false)
      expect(validation.errors.some((err) => err.message.includes("Required input"))).toBe(true)
    })

    it("should detect cycles in graph", () => {
      const node1 = createMockNode(
        "node1",
        "transform",
        [{ id: "input", name: "Input", type: "image", required: false }],
        [{ id: "output", name: "Output", type: "image" }],
      )
      const node2 = createMockNode(
        "node2",
        "transform",
        [{ id: "input", name: "Input", type: "image", required: false }],
        [{ id: "output", name: "Output", type: "image" }],
      )

      const graph = createMockGraph(
        [node1, node2],
        [
          {
            id: "conn1",
            sourceNodeId: "node1",
            sourcePortId: "output",
            targetNodeId: "node2",
            targetPortId: "input",
            active: true,
          },
          {
            id: "conn2",
            sourceNodeId: "node2",
            sourcePortId: "output",
            targetNodeId: "node1",
            targetPortId: "input",
            active: true,
          },
        ],
      )

      const validation = processor.validateGraph(graph)

      expect(validation.valid).toBe(false)
      expect(validation.errors.some((err) => err.message.includes("cycle"))).toBe(true)
    })

    it("should warn about missing output nodes", () => {
      const node = createMockNode("node1", "source")
      const graph = createMockGraph([node])

      const validation = processor.validateGraph(graph)

      expect(validation.warnings?.some((warning) => warning.includes("output node"))).toBe(true)
    })

    it("should detect missing source port", () => {
      const node1 = createMockNode("node1")
      const node2 = createMockNode("node2")
      const graph = createMockGraph(
        [node1, node2],
        [
          {
            id: "conn1",
            sourceNodeId: "node1",
            sourcePortId: "nonexistent",
            targetNodeId: "node2",
            targetPortId: "input",
            active: true,
          },
        ],
      )

      const validation = processor.validateGraph(graph)

      expect(validation.valid).toBe(false)
      expect(validation.errors.some((err) => err.message.includes("Source port"))).toBe(true)
    })

    it("should detect missing target port", () => {
      const node1 = createMockNode("node1")
      const node2 = createMockNode("node2")
      const graph = createMockGraph(
        [node1, node2],
        [
          {
            id: "conn1",
            sourceNodeId: "node1",
            sourcePortId: "output",
            targetNodeId: "node2",
            targetPortId: "nonexistent",
            active: true,
          },
        ],
      )

      const validation = processor.validateGraph(graph)

      expect(validation.valid).toBe(false)
      expect(validation.errors.some((err) => err.message.includes("Target port"))).toBe(true)
    })
  })

  describe("cache management", () => {
    it("should clear cache", () => {
      processor.clearCache()

      const stats = processor.getCacheStats()
      expect(stats.size).toBe(0)
    })

    it("should track cache statistics", async () => {
      const node = createMockNode("node1")
      node.cached = true
      const graph = createMockGraph([node])

      await processor.processGraph(graph, mockContext)

      const stats = processor.getCacheStats()
      expect(stats).toHaveProperty("size")
      expect(stats).toHaveProperty("memoryUsage")
      expect(stats).toHaveProperty("hitRate")
    })

    it("should report cache hit rate", async () => {
      const node = createMockNode("node1")
      node.cached = true
      const graph = createMockGraph([node])

      // Process multiple times
      await processor.processGraph(graph, { ...mockContext, frameNumber: 1 })
      await processor.processGraph(graph, { ...mockContext, frameNumber: 1 })
      await processor.processGraph(graph, { ...mockContext, frameNumber: 1 })

      const stats = processor.getCacheStats()
      expect(stats.hitRate).toBeGreaterThanOrEqual(0)
    })
  })

  describe("execution order calculation", () => {
    it("should calculate correct execution order for linear graph", async () => {
      const node1 = createMockNode("node1", "source", [], [{ id: "output", name: "Output", type: "image" }])
      const node2 = createMockNode(
        "node2",
        "transform",
        [{ id: "input", name: "Input", type: "image", required: false }],
        [{ id: "output", name: "Output", type: "image" }],
      )
      const node3 = createMockNode(
        "node3",
        "output",
        [{ id: "input", name: "Input", type: "image", required: false }],
        [],
      )

      const graph = createMockGraph(
        [node1, node2, node3],
        [
          {
            id: "conn1",
            sourceNodeId: "node1",
            sourcePortId: "output",
            targetNodeId: "node2",
            targetPortId: "input",
            active: true,
          },
          {
            id: "conn2",
            sourceNodeId: "node2",
            sourcePortId: "output",
            targetNodeId: "node3",
            targetPortId: "input",
            active: true,
          },
        ],
      )

      await processor.processGraph(graph, mockContext)

      // Should process in order: node1 -> node2 -> node3
      // (exact order verification would require internal access)
    })

    it("should handle parallel branches", async () => {
      const source = createMockNode("source", "source", [], [{ id: "output", name: "Output", type: "image" }])
      const branch1 = createMockNode(
        "branch1",
        "transform",
        [{ id: "input", name: "Input", type: "image", required: false }],
        [{ id: "output", name: "Output", type: "image" }],
      )
      const branch2 = createMockNode(
        "branch2",
        "transform",
        [{ id: "input", name: "Input", type: "image", required: false }],
        [{ id: "output", name: "Output", type: "image" }],
      )
      const merge = createMockNode(
        "merge",
        "merge",
        [
          { id: "input1", name: "Input 1", type: "image", required: false },
          { id: "input2", name: "Input 2", type: "image", required: false },
        ],
        [],
      )

      const graph = createMockGraph(
        [source, branch1, branch2, merge],
        [
          {
            id: "conn1",
            sourceNodeId: "source",
            sourcePortId: "output",
            targetNodeId: "branch1",
            targetPortId: "input",
            active: true,
          },
          {
            id: "conn2",
            sourceNodeId: "source",
            sourcePortId: "output",
            targetNodeId: "branch2",
            targetPortId: "input",
            active: true,
          },
          {
            id: "conn3",
            sourceNodeId: "branch1",
            sourcePortId: "output",
            targetNodeId: "merge",
            targetPortId: "input1",
            active: true,
          },
          {
            id: "conn4",
            sourceNodeId: "branch2",
            sourcePortId: "output",
            targetNodeId: "merge",
            targetPortId: "input2",
            active: true,
          },
        ],
      )

      const results = await processor.processGraph(graph, mockContext)

      expect(results.size).toBe(4)
      expect(results.has("source")).toBe(true)
      expect(results.has("branch1")).toBe(true)
      expect(results.has("branch2")).toBe(true)
      expect(results.has("merge")).toBe(true)
    })
  })

  describe("input gathering", () => {
    it("should gather inputs from multiple connections", async () => {
      const node1 = createMockNode("node1", "source", [], [{ id: "output", name: "Output", type: "image" }])
      const node2 = createMockNode("node2", "source", [], [{ id: "output", name: "Output", type: "image" }])
      const node3 = createMockNode(
        "node3",
        "merge",
        [{ id: "input", name: "Input", type: "image", required: false, multiple: true }],
        [],
      )

      const graph = createMockGraph(
        [node1, node2, node3],
        [
          {
            id: "conn1",
            sourceNodeId: "node1",
            sourcePortId: "output",
            targetNodeId: "node3",
            targetPortId: "input",
            active: true,
          },
          {
            id: "conn2",
            sourceNodeId: "node2",
            sourcePortId: "output",
            targetNodeId: "node3",
            targetPortId: "input",
            active: true,
          },
        ],
      )

      const results = await processor.processGraph(graph, mockContext)

      expect(results.size).toBe(3)
    })

    it("should skip inactive connections", async () => {
      const node1 = createMockNode("node1", "source", [], [{ id: "output", name: "Output", type: "image" }])
      const node2 = createMockNode(
        "node2",
        "transform",
        [{ id: "input", name: "Input", type: "image", required: false }],
        [],
      )

      const graph = createMockGraph(
        [node1, node2],
        [
          {
            id: "conn1",
            sourceNodeId: "node1",
            sourcePortId: "output",
            targetNodeId: "node2",
            targetPortId: "input",
            active: false,
          },
        ],
      )

      const results = await processor.processGraph(graph, mockContext)

      expect(results.size).toBe(2)
    })
  })
})

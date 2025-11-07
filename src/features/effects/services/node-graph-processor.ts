import { createLogger } from "@/lib/tauri-logger"
import type {
  CompositeNode,
  NodeExecutionContext,
  NodeGraph,
  NodeGraphValidation,
  NodeRenderResult,
} from "../types/node-compositing"
import { getNodeProcessor } from "./node-library"

const logger = createLogger({ module: "NodeGraphProcessor" })

/**
 * Node Graph Processor
 * Handles execution of node graphs with proper dependency resolution
 */
export class NodeGraphProcessor {
  private cache = new Map<string, NodeRenderResult>()
  private executionOrder: string[] = []

  /**
   * Process entire node graph
   */
  async processGraph(graph: NodeGraph, context: NodeExecutionContext): Promise<Map<string, NodeRenderResult>> {
    // Validate graph first
    const validation = this.validateGraph(graph)
    if (!validation.valid) {
      throw new Error(`Invalid graph: ${validation.errors[0]?.message}`)
    }

    // Clear cache if needed
    if (context.frameNumber === 0) {
      this.cache.clear()
    }

    // Calculate execution order
    this.executionOrder = this.calculateExecutionOrder(graph)

    // Process nodes in order
    const results = new Map<string, NodeRenderResult>()

    for (const nodeId of this.executionOrder) {
      const node = graph.nodes[nodeId]
      if (!node) continue

      try {
        const result = await this.processNode(node, graph, context)
        results.set(nodeId, result)
      } catch (error) {
        logger.error(`Error processing node ${nodeId}:`, error)
        results.set(nodeId, {
          data: null,
          metadata: {
            renderTime: 0,
            cacheHit: false,
            memoryUsage: 0,
          },
        })
      }
    }

    return results
  }

  /**
   * Process single node
   */
  private async processNode(
    node: CompositeNode,
    graph: NodeGraph,
    context: NodeExecutionContext,
  ): Promise<NodeRenderResult> {
    const startTime = performance.now()

    // Check cache
    const cacheKey = this.getCacheKey(node, context)
    if (node.cached && this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey)!
      return {
        ...cached,
        metadata: {
          ...cached.metadata!,
          cacheHit: true,
        },
      }
    }

    // Get processor
    const processor = getNodeProcessor(node.type)
    if (!processor) {
      throw new Error(`No processor found for node type: ${node.type}`)
    }

    // Gather inputs
    const inputs = await this.gatherNodeInputs(node, graph, context)

    // Process node
    const outputs = await processor.process(node, inputs, context)

    // Create result
    const result: NodeRenderResult = {
      data: outputs,
      metadata: {
        renderTime: performance.now() - startTime,
        cacheHit: false,
        memoryUsage: this.estimateMemoryUsage(outputs),
      },
    }

    // Cache result if needed
    if (node.cached) {
      this.cache.set(cacheKey, result)
    }

    return result
  }

  /**
   * Gather inputs for a node from connections
   */
  private async gatherNodeInputs(
    node: CompositeNode,
    graph: NodeGraph,
    context: NodeExecutionContext,
  ): Promise<Record<string, any>> {
    const inputs: Record<string, any> = {}

    // Find all connections to this node
    const incomingConnections = graph.connections.filter((conn) => conn.targetNodeId === node.id && conn.active)

    for (const connection of incomingConnections) {
      const sourceNode = graph.nodes[connection.sourceNodeId]
      if (!sourceNode) continue

      // Get output from cache (should already be processed due to execution order)
      const cacheKey = this.getCacheKey(sourceNode, context)
      const sourceResult = this.cache.get(cacheKey)

      if (sourceResult?.data) {
        const outputData = sourceResult.data[connection.sourcePortId]
        if (outputData !== undefined) {
          const targetPort = node.inputs.find((p) => p.id === connection.targetPortId)

          if (targetPort?.multiple) {
            // Handle multiple connections to same port
            if (!inputs[connection.targetPortId]) {
              inputs[connection.targetPortId] = []
            }
            inputs[connection.targetPortId].push(outputData)
          } else {
            inputs[connection.targetPortId] = outputData
          }
        }
      }
    }

    return inputs
  }

  /**
   * Calculate execution order using topological sort
   */
  private calculateExecutionOrder(graph: NodeGraph): string[] {
    const nodeIds = Object.keys(graph.nodes)
    const visited = new Set<string>()
    const order: string[] = []

    // Build adjacency list
    const dependencies = new Map<string, Set<string>>()
    for (const nodeId of nodeIds) {
      dependencies.set(nodeId, new Set())
    }

    for (const connection of graph.connections) {
      if (connection.active) {
        dependencies.get(connection.targetNodeId)?.add(connection.sourceNodeId)
      }
    }

    // Topological sort with DFS
    const visit = (nodeId: string) => {
      if (visited.has(nodeId)) return
      visited.add(nodeId)

      const deps = dependencies.get(nodeId) || new Set()
      for (const depId of deps) {
        visit(depId)
      }

      order.push(nodeId)
    }

    for (const nodeId of nodeIds) {
      visit(nodeId)
    }

    return order
  }

  /**
   * Validate node graph
   */
  validateGraph(graph: NodeGraph): NodeGraphValidation {
    const errors: NodeGraphValidation["errors"] = []
    const warnings: string[] = []

    // Check for cycles
    if (this.hasCycles(graph)) {
      errors.push({
        message: "Graph contains cycles",
        severity: "error",
      })
    }

    // Validate connections
    for (const connection of graph.connections) {
      const sourceNode = graph.nodes[connection.sourceNodeId]
      const targetNode = graph.nodes[connection.targetNodeId]

      if (!sourceNode) {
        errors.push({
          connectionId: connection.id,
          message: `Source node ${connection.sourceNodeId} not found`,
          severity: "error",
        })
        continue
      }

      if (!targetNode) {
        errors.push({
          connectionId: connection.id,
          message: `Target node ${connection.targetNodeId} not found`,
          severity: "error",
        })
        continue
      }

      // Validate port types
      const sourcePort = sourceNode.outputs.find((p) => p.id === connection.sourcePortId)
      const targetPort = targetNode.inputs.find((p) => p.id === connection.targetPortId)

      if (!sourcePort) {
        errors.push({
          connectionId: connection.id,
          message: `Source port ${connection.sourcePortId} not found`,
          severity: "error",
        })
      }

      if (!targetPort) {
        errors.push({
          connectionId: connection.id,
          message: `Target port ${connection.targetPortId} not found`,
          severity: "error",
        })
      }

      if (sourcePort && targetPort && sourcePort.type !== targetPort.type) {
        errors.push({
          connectionId: connection.id,
          message: `Type mismatch: ${sourcePort.type} → ${targetPort.type}`,
          severity: "error",
        })
      }
    }

    // Validate required inputs
    for (const [nodeId, node] of Object.entries(graph.nodes)) {
      for (const input of node.inputs) {
        if (input.required) {
          const hasConnection = graph.connections.some(
            (conn) => conn.targetNodeId === nodeId && conn.targetPortId === input.id && conn.active,
          )

          if (!hasConnection) {
            errors.push({
              nodeId,
              message: `Required input "${input.name}" is not connected`,
              severity: "error",
            })
          }
        }
      }
    }

    // Check for output nodes
    const outputNodes = Object.values(graph.nodes).filter((n) => n.category === "output")
    if (outputNodes.length === 0) {
      warnings.push("No output node found in graph")
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    }
  }

  /**
   * Check if graph has cycles
   */
  private hasCycles(graph: NodeGraph): boolean {
    const nodeIds = Object.keys(graph.nodes)
    const visited = new Set<string>()
    const recursionStack = new Set<string>()

    const hasCycleDFS = (nodeId: string): boolean => {
      visited.add(nodeId)
      recursionStack.add(nodeId)

      // Get all nodes that this node depends on
      const dependencies = graph.connections
        .filter((conn) => conn.targetNodeId === nodeId && conn.active)
        .map((conn) => conn.sourceNodeId)

      for (const depId of dependencies) {
        if (!visited.has(depId)) {
          if (hasCycleDFS(depId)) return true
        } else if (recursionStack.has(depId)) {
          return true
        }
      }

      recursionStack.delete(nodeId)
      return false
    }

    for (const nodeId of nodeIds) {
      if (!visited.has(nodeId)) {
        if (hasCycleDFS(nodeId)) return true
      }
    }

    return false
  }

  /**
   * Generate cache key for node
   */
  private getCacheKey(node: CompositeNode, context: NodeExecutionContext): string {
    const paramValues = node.parameters.map((p) => `${p.id}:${JSON.stringify(p.value)}`).join(",")

    return `${node.id}_${context.frameNumber}_${paramValues}`
  }

  /**
   * Estimate memory usage of data
   */
  private estimateMemoryUsage(data: any): number {
    // Simplified estimation
    const jsonSize = JSON.stringify(data).length
    return jsonSize * 2 // Rough estimate for JS object overhead
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear()
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    size: number
    memoryUsage: number
    hitRate: number
  } {
    let totalMemory = 0
    let hits = 0
    let total = 0

    for (const [_, result] of this.cache) {
      totalMemory += result.metadata?.memoryUsage || 0
      if (result.metadata?.cacheHit) hits++
      total++
    }

    return {
      size: this.cache.size,
      memoryUsage: totalMemory,
      hitRate: total > 0 ? hits / total : 0,
    }
  }
}

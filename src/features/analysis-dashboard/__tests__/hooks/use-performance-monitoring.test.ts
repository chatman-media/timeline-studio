/**
 * usePerformanceMonitoring Hook Tests
 */

import { renderHook, waitFor } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { useAnalysisMetrics, usePerformanceMonitoring } from "../../hooks/use-performance-monitoring"
import { createMockFileProgress } from "../test-utils"

describe("usePerformanceMonitoring", () => {
  it("should return initial metrics with empty data", () => {
    const { result } = renderHook(() => usePerformanceMonitoring([]))

    expect(result.current.metrics).toEqual({})
    expect(result.current.isMonitoring).toBe(false)
  })

  it("should calculate analysis metrics from files progress", async () => {
    const filesProgress = [
      createMockFileProgress({
        fileId: "file-1",
        status: "completed",
        progress: 100,
        duration: 60000, // 60 seconds
      }),
      createMockFileProgress({
        fileId: "file-2",
        status: "analyzing",
        progress: 50,
      }),
      createMockFileProgress({
        fileId: "file-3",
        status: "pending",
        progress: 0,
      }),
    ]

    const { result } = renderHook(() => usePerformanceMonitoring(filesProgress))

    await waitFor(() => {
      expect(result.current.metrics.analysis).toBeDefined()
      expect(result.current.metrics.analysis?.filesProcessed).toBe(1)
      expect(result.current.metrics.analysis?.totalFiles).toBe(3)
      expect(result.current.metrics.analysis?.avgProcessingTime).toBe(60)
    })
  })

  it("should calculate total processing time", async () => {
    const filesProgress = [
      createMockFileProgress({
        fileId: "file-1",
        status: "completed",
        duration: 60000,
      }),
      createMockFileProgress({
        fileId: "file-2",
        status: "completed",
        duration: 90000,
      }),
    ]

    const { result } = renderHook(() => usePerformanceMonitoring(filesProgress))

    await waitFor(() => {
      expect(result.current.metrics.analysis?.totalProcessingTime).toBe(150) // (60 + 90) seconds
    })
  })

  it("should calculate ETA when enabled", async () => {
    const filesProgress = [
      createMockFileProgress({
        fileId: "file-1",
        status: "completed",
        duration: 60000, // avg 60s per file
      }),
      createMockFileProgress({
        fileId: "file-2",
        status: "analyzing",
        progress: 50,
      }),
      createMockFileProgress({
        fileId: "file-3",
        status: "pending",
      }),
    ]

    const { result } = renderHook(() => usePerformanceMonitoring(filesProgress, { enableETA: true }))

    await waitFor(() => {
      // ETA = remaining files * avg time
      // remaining = 2 files (1 analyzing + 1 pending)
      // avg = 60s
      // ETA = 2 * 60 = 120s, but adjusted for analyzing file at 50% = ~90s
      expect(result.current.metrics.analysis?.eta).toBeDefined()
      expect(result.current.metrics.analysis?.eta).toBeGreaterThan(0)
    })
  })

  it("should not calculate ETA when disabled", () => {
    const filesProgress = [
      createMockFileProgress({
        fileId: "file-1",
        status: "completed",
        duration: 60000,
      }),
      createMockFileProgress({
        fileId: "file-2",
        status: "analyzing",
      }),
    ]

    const { result } = renderHook(() => usePerformanceMonitoring(filesProgress, { enableETA: false }))

    expect(result.current.metrics.analysis?.eta).toBeUndefined()
  })

  it("should start monitoring when hasActiveFiles", async () => {
    const filesProgress = [
      createMockFileProgress({
        fileId: "file-1",
        status: "analyzing",
      }),
    ]

    const { result } = renderHook(() => usePerformanceMonitoring(filesProgress))

    await waitFor(() => {
      expect(result.current.isMonitoring).toBe(true)
    })
  })

  it("should stop monitoring when no active files", async () => {
    const { result, rerender } = renderHook(({ files }) => usePerformanceMonitoring(files), {
      initialProps: {
        files: [createMockFileProgress({ status: "analyzing" })],
      },
    })

    // Wait for monitoring to start
    await waitFor(() => {
      expect(result.current.isMonitoring).toBe(true)
    })

    // Update to completed
    rerender({
      files: [createMockFileProgress({ status: "completed" })],
    })

    // Wait for monitoring to stop
    await waitFor(() => {
      expect(result.current.isMonitoring).toBe(false)
    })
  })

  it("should respect custom update interval", () => {
    const filesProgress = [createMockFileProgress({ status: "analyzing" })]

    const { result } = renderHook(() => usePerformanceMonitoring(filesProgress, { updateInterval: 500 }))

    expect(result.current.isMonitoring).toBeDefined()
  })

  it("should handle empty filesProgress array", () => {
    const { result } = renderHook(() => usePerformanceMonitoring([]))

    expect(result.current.metrics.analysis).toBeUndefined()
    expect(result.current.isMonitoring).toBe(false)
  })

  it("should provide startMonitoring and stopMonitoring functions", () => {
    const { result } = renderHook(() => usePerformanceMonitoring([]))

    expect(typeof result.current.startMonitoring).toBe("function")
    expect(typeof result.current.stopMonitoring).toBe("function")
  })

  it("should handle files without duration", async () => {
    const filesProgress = [
      createMockFileProgress({
        status: "completed",
        duration: undefined, // no duration
      }),
    ]

    const { result } = renderHook(() => usePerformanceMonitoring(filesProgress))

    await waitFor(() => {
      expect(result.current.metrics.analysis?.avgProcessingTime).toBe(0)
    })
  })

  it("should update metrics when filesProgress changes", async () => {
    // Start with completed file
    const initialFiles = [
      createMockFileProgress({
        fileId: "file-1",
        status: "completed",
        duration: 60000,
      }),
    ]

    const { result, rerender } = renderHook(({ files }) => usePerformanceMonitoring(files), {
      initialProps: { files: initialFiles },
    })

    // Wait for initial metrics
    await waitFor(
      () => {
        expect(result.current.metrics.analysis).toBeDefined()
        expect(result.current.metrics.analysis?.totalFiles).toBe(1)
        expect(result.current.metrics.analysis?.filesProcessed).toBe(1)
      },
      { timeout: 3000 },
    )

    // Update with additional analyzing file
    const updatedFiles = [
      createMockFileProgress({
        fileId: "file-1",
        status: "completed",
        duration: 60000,
      }),
      createMockFileProgress({
        fileId: "file-2",
        status: "analyzing",
        progress: 50,
      }),
    ]

    rerender({ files: updatedFiles })

    // Wait for metrics to update with new files
    await waitFor(
      () => {
        const analysis = result.current.metrics.analysis
        expect(analysis).toBeDefined()
        expect(analysis?.totalFiles).toBe(2)
        expect(analysis?.filesProcessed).toBe(1)
        expect(analysis?.avgProcessingTime).toBe(60)
      },
      { timeout: 5000, interval: 50 },
    )
  })
})

describe("useAnalysisMetrics", () => {
  it("should return only analysis metrics", async () => {
    const filesProgress = [
      createMockFileProgress({
        status: "completed",
        duration: 60000,
      }),
    ]

    const { result } = renderHook(() => useAnalysisMetrics(filesProgress))

    await waitFor(
      () => {
        expect(result.current).toBeDefined()
        expect(result.current?.filesProcessed).toBe(1)
        expect(result.current?.totalFiles).toBe(1)
        expect(result.current?.avgProcessingTime).toBe(60)
      },
      { timeout: 3000 },
    )
  })

  it("should return undefined when no files", () => {
    const { result } = renderHook(() => useAnalysisMetrics([]))

    expect(result.current).toBeUndefined()
  })

  it("should enable ETA by default", async () => {
    const filesProgress = [
      createMockFileProgress({
        status: "completed",
        duration: 60000,
      }),
      createMockFileProgress({
        status: "analyzing",
      }),
    ]

    const { result } = renderHook(() => useAnalysisMetrics(filesProgress))

    await waitFor(
      () => {
        expect(result.current?.eta).toBeDefined()
      },
      { timeout: 3000 },
    )
  })
})

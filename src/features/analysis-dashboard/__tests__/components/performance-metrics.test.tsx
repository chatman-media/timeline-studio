/**
 * PerformanceMetrics Component Tests
 */

import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { DetailedPerformanceMetrics, PerformanceMetrics } from "../../components/performance-metrics"
import { createMockPerformanceMetrics } from "../test-utils"

describe("PerformanceMetrics", () => {
  it("should render CPU metrics correctly", () => {
    const data = createMockPerformanceMetrics({
      cpu: { usage: 75, cores: 8 },
    })

    render(<PerformanceMetrics data={data} />)

    expect(screen.getByText("CPU")).toBeInTheDocument()
    expect(screen.getByText("75%")).toBeInTheDocument()
    expect(screen.getByText("8 cores")).toBeInTheDocument()
  })

  it("should render memory metrics correctly", () => {
    const data = createMockPerformanceMetrics({
      memory: { used: 4096, total: 16384 },
    })

    render(<PerformanceMetrics data={data} />)

    expect(screen.getByText("Memory")).toBeInTheDocument()
    expect(screen.getByText("4.0 GB")).toBeInTheDocument()
    expect(screen.getByText("16.0 GB total")).toBeInTheDocument()
  })

  it("should render GPU metrics correctly", () => {
    const data = createMockPerformanceMetrics({
      gpu: { usage: 0, name: "Intel Iris Plus Graphics" },
    })

    render(<PerformanceMetrics data={data} />)

    expect(screen.getByText("GPU")).toBeInTheDocument()
    expect(screen.getByText("Не используется")).toBeInTheDocument()
    expect(screen.getByText("Intel Iris Plus Graphics")).toBeInTheDocument()
  })

  it("should render analysis metrics correctly", () => {
    const data = createMockPerformanceMetrics({
      analysis: {
        filesProcessed: 3,
        totalFiles: 5,
        avgProcessingTime: 120,
        totalProcessingTime: 360,
        eta: 240,
      },
    })

    render(<PerformanceMetrics data={data} />)

    expect(screen.getByText("Анализ")).toBeInTheDocument()
    expect(screen.getByText("3/5")).toBeInTheDocument()
    expect(screen.getByText(/Avg: 2m 0s/)).toBeInTheDocument()
    expect(screen.getByText(/ETA: 4m 0s/)).toBeInTheDocument()
  })

  it("should render in compact mode", () => {
    const data = createMockPerformanceMetrics()

    const { container } = render(<PerformanceMetrics data={data} compact />)

    // В compact mode нет карточек, только inline элементы
    expect(container.querySelector(".flex.items-center.gap-4")).toBeInTheDocument()
  })

  it("should format time correctly", () => {
    const data = createMockPerformanceMetrics({
      analysis: {
        filesProcessed: 1,
        totalFiles: 1,
        avgProcessingTime: 65, // 1m 5s
        totalProcessingTime: 65,
      },
    })

    render(<PerformanceMetrics data={data} />)

    expect(screen.getByText(/1m 5s/)).toBeInTheDocument()
  })

  it("should format time in hours", () => {
    const data = createMockPerformanceMetrics({
      analysis: {
        filesProcessed: 1,
        totalFiles: 1,
        avgProcessingTime: 3665, // 1h 1m
        totalProcessingTime: 3665,
      },
    })

    render(<PerformanceMetrics data={data} />)

    expect(screen.getByText(/1h 1m/)).toBeInTheDocument()
  })

  it("should calculate memory usage percentage", () => {
    const data = createMockPerformanceMetrics({
      memory: { used: 8192, total: 16384 }, // 50%
    })

    render(<PerformanceMetrics data={data} />)

    expect(screen.getByText("50%")).toBeInTheDocument()
  })

  it("should show load status for CPU", () => {
    const lowLoad = createMockPerformanceMetrics({ cpu: { usage: 30, cores: 8 } })
    const { rerender } = render(<PerformanceMetrics data={lowLoad} />)
    expect(screen.getByText("Низкая нагрузка")).toBeInTheDocument()

    const mediumLoad = createMockPerformanceMetrics({ cpu: { usage: 65, cores: 8 } })
    rerender(<PerformanceMetrics data={mediumLoad} />)
    expect(screen.getByText("Средняя нагрузка")).toBeInTheDocument()

    const highLoad = createMockPerformanceMetrics({ cpu: { usage: 90, cores: 8 } })
    rerender(<PerformanceMetrics data={highLoad} />)
    expect(screen.getByText("Высокая нагрузка")).toBeInTheDocument()
  })

  it("should render analysis progress percentage", () => {
    const data = createMockPerformanceMetrics({
      analysis: {
        filesProcessed: 2,
        totalFiles: 5, // 40%
        avgProcessingTime: 100,
        totalProcessingTime: 200,
      },
    })

    render(<PerformanceMetrics data={data} />)

    expect(screen.getByText("40%")).toBeInTheDocument()
  })
})

describe("DetailedPerformanceMetrics", () => {
  it("should render detailed metrics with all sections", () => {
    const data = createMockPerformanceMetrics()

    render(<DetailedPerformanceMetrics data={data} />)

    expect(screen.getByText("Performance Metrics")).toBeInTheDocument()
    expect(screen.getByText("Системные ресурсы")).toBeInTheDocument()
    expect(screen.getByText("Производительность анализа")).toBeInTheDocument()
  })

  it("should render system resources section", () => {
    const data = createMockPerformanceMetrics({
      cpu: { usage: 60, cores: 8 },
      memory: { used: 8192, total: 16384 },
      gpu: { usage: 25, name: "NVIDIA RTX 3080" },
    })

    render(<DetailedPerformanceMetrics data={data} />)

    expect(screen.getByText("CPU (8 cores)")).toBeInTheDocument()
    expect(screen.getByText("60%")).toBeInTheDocument()

    expect(screen.getByText("Memory")).toBeInTheDocument()
    expect(screen.getByText("8.0 GB / 16.0 GB")).toBeInTheDocument()

    expect(screen.getByText(/GPU \(NVIDIA RTX 3080\)/)).toBeInTheDocument()
    expect(screen.getByText("25%")).toBeInTheDocument()
  })

  it("should render analysis performance section", () => {
    const data = createMockPerformanceMetrics({
      analysis: {
        filesProcessed: 3,
        totalFiles: 5,
        avgProcessingTime: 125,
        totalProcessingTime: 375,
        eta: 250,
      },
    })

    render(<DetailedPerformanceMetrics data={data} />)

    expect(screen.getByText("Обработано файлов")).toBeInTheDocument()
    expect(screen.getByText("3 / 5")).toBeInTheDocument()

    expect(screen.getByText("Среднее время")).toBeInTheDocument()
    expect(screen.getByText(/2m 5s/)).toBeInTheDocument()

    expect(screen.getByText("Общее время")).toBeInTheDocument()
    expect(screen.getByText(/6m 15s/)).toBeInTheDocument()

    expect(screen.getByText("Осталось времени")).toBeInTheDocument()
    expect(screen.getByText(/4m 10s/)).toBeInTheDocument()
  })

  it("should not render ETA section if eta is not provided", () => {
    const data = createMockPerformanceMetrics({
      analysis: {
        filesProcessed: 2,
        totalFiles: 5,
        avgProcessingTime: 100,
        totalProcessingTime: 200,
        // eta not provided
      },
    })

    render(<DetailedPerformanceMetrics data={data} />)

    expect(screen.queryByText("Осталось времени")).not.toBeInTheDocument()
  })

  it("should handle GPU not in use", () => {
    const data = createMockPerformanceMetrics({
      gpu: { usage: 0, name: "Integrated GPU" },
    })

    render(<DetailedPerformanceMetrics data={data} />)

    expect(screen.getByText("Не используется")).toBeInTheDocument()
  })

  it("should apply custom className", () => {
    const data = createMockPerformanceMetrics()

    const { container } = render(<DetailedPerformanceMetrics data={data} className="custom-class" />)

    expect(container.firstChild).toHaveClass("custom-class")
  })
})

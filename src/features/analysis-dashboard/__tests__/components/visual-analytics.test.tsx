/**
 * VisualAnalytics Component Tests
 */

import { render, screen, within } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { VisualAnalytics } from "../../components/visual-analytics"
import { createMockVisualAnalytics } from "../test-utils"

describe("VisualAnalytics", () => {
  it("should render empty state when no data is provided", () => {
    render(<VisualAnalytics data={{}} />)

    expect(screen.getByText("Нет данных для визуализации")).toBeInTheDocument()
    expect(screen.getByText("Запустите анализ для получения данных")).toBeInTheDocument()
  })

  it("should render scenes timeline when scenes data is provided", () => {
    const data = createMockVisualAnalytics({
      moments: undefined,
      qualityScores: undefined,
    })

    render(<VisualAnalytics data={data} />)

    expect(screen.getAllByText("Временная шкала сцен")[0]).toBeInTheDocument()
    expect(screen.getByText(/4 сцен/)).toBeInTheDocument()
    expect(screen.getByText(/Средняя длительность:/)).toBeInTheDocument()
  })

  it("should render quality scores chart when quality data is provided", () => {
    const data = createMockVisualAnalytics({
      scenes: undefined,
      moments: undefined,
    })

    render(<VisualAnalytics data={data} />)

    expect(screen.getByText("Качество видео")).toBeInTheDocument()
    expect(screen.getByText(/5 измерений качества/)).toBeInTheDocument()
  })

  it("should render moments distribution when moments data is provided", () => {
    const data = createMockVisualAnalytics({
      scenes: undefined,
      qualityScores: undefined,
    })

    render(<VisualAnalytics data={data} />)

    expect(screen.getByText("Анализ ключевых моментов")).toBeInTheDocument()
    expect(screen.getByText(/4 моментов обнаружено/)).toBeInTheDocument()
  })

  it("should render scene types distribution chart", () => {
    const data = createMockVisualAnalytics({
      moments: undefined,
      qualityScores: undefined,
    })

    render(<VisualAnalytics data={data} />)

    expect(screen.getByText("Типы сцен")).toBeInTheDocument()
    expect(screen.getByText("Распределение сцен по типам")).toBeInTheDocument()
  })

  it("should render all sections when full data is provided", () => {
    const data = createMockVisualAnalytics()

    render(<VisualAnalytics data={data} />)

    expect(screen.getAllByText("Временная шкала сцен").length).toBeGreaterThan(0)
    expect(screen.getByText("Качество видео")).toBeInTheDocument()
    expect(screen.getByText("Анализ ключевых моментов")).toBeInTheDocument()
    expect(screen.getByText("Типы сцен")).toBeInTheDocument()
  })

  it("should display scene legend with correct scene types", () => {
    const data = createMockVisualAnalytics({
      moments: undefined,
      qualityScores: undefined,
    })

    render(<VisualAnalytics data={data} />)

    // Scene types: intro, action, dialogue, outro
    expect(screen.getByText("intro")).toBeInTheDocument()
    expect(screen.getByText("action")).toBeInTheDocument()
    expect(screen.getByText("dialogue")).toBeInTheDocument()
    expect(screen.getByText("outro")).toBeInTheDocument()
  })

  it("should calculate and display average scene duration", () => {
    const data = createMockVisualAnalytics({
      scenes: [
        { startTime: 0, endTime: 10, duration: 10, sceneType: "intro", confidence: 0.9 },
        { startTime: 10, endTime: 30, duration: 20, sceneType: "action", confidence: 0.85 },
      ],
      moments: undefined,
      qualityScores: undefined,
      duration: 30,
    })

    render(<VisualAnalytics data={data} />)

    // Average duration: (10 + 20) / 2 = 15.0s
    expect(screen.getByText(/Средняя длительность: 15.0s/)).toBeInTheDocument()
  })

  it("should display quality metrics averages", () => {
    const data = createMockVisualAnalytics({
      scenes: undefined,
      moments: undefined,
      qualityScores: [
        { timestamp: 0, overall: 0.8, visual: 0.85, audio: 0.75 },
        { timestamp: 10, overall: 0.9, visual: 0.95, audio: 0.85 },
      ],
    })

    render(<VisualAnalytics data={data} />)

    // Check that quality cards are rendered
    expect(screen.getByText("Среднее качество")).toBeInTheDocument()
    expect(screen.getByText("Визуальное")).toBeInTheDocument()
    expect(screen.getByText("Аудио")).toBeInTheDocument()
  })

  it("should group moments by importance levels", () => {
    const data = createMockVisualAnalytics({
      scenes: undefined,
      qualityScores: undefined,
      moments: [
        { timestamp: 5, moment_type: "low", importance_score: 0.15 },
        { timestamp: 10, moment_type: "medium", importance_score: 0.45 },
        { timestamp: 15, moment_type: "high", importance_score: 0.75 },
        { timestamp: 20, moment_type: "very_high", importance_score: 0.95 },
      ],
    })

    render(<VisualAnalytics data={data} />)

    // Check that importance distribution labels are rendered
    expect(screen.getByText("0-20%")).toBeInTheDocument()
    expect(screen.getByText("20-40%")).toBeInTheDocument()
    expect(screen.getByText("40-60%")).toBeInTheDocument()
    expect(screen.getByText("60-80%")).toBeInTheDocument()
    expect(screen.getByText("80-100%")).toBeInTheDocument()
  })

  it("should display moment types distribution", () => {
    const data = createMockVisualAnalytics({
      scenes: undefined,
      qualityScores: undefined,
    })

    render(<VisualAnalytics data={data} />)

    expect(screen.getByText("Типы моментов (топ 10)")).toBeInTheDocument()
  })

  it("should apply custom className", () => {
    const data = createMockVisualAnalytics()

    const { container } = render(<VisualAnalytics data={data} className="custom-class" />)

    expect(container.firstChild).toHaveClass("custom-class")
  })

  it("should handle duration prop correctly for timeline", () => {
    const data = createMockVisualAnalytics({
      duration: 100,
      moments: undefined,
      qualityScores: undefined,
    })

    render(<VisualAnalytics data={data} />)

    // Timeline should be rendered with correct duration
    expect(screen.getAllByText("Временная шкала сцен")[0]).toBeInTheDocument()
  })

  it("should not render scenes timeline if duration is missing", () => {
    const data = createMockVisualAnalytics({
      duration: undefined,
      moments: undefined,
      qualityScores: undefined,
    })

    render(<VisualAnalytics data={data} />)

    // Scenes exist but no duration, so timeline should not render
    expect(screen.queryByText("Временная шкала сцен")).not.toBeInTheDocument()
  })

  it("should show empty state for quality chart when no scores", () => {
    const data = createMockVisualAnalytics({
      scenes: undefined,
      moments: undefined,
      qualityScores: [],
    })

    render(<VisualAnalytics data={data} />)

    expect(screen.queryByText("Качество видео")).not.toBeInTheDocument()
  })

  it("should limit moment types to top 10", () => {
    const moments = Array.from({ length: 15 }, (_, i) => ({
      timestamp: i,
      moment_type: `type_${i}`,
      importance_score: 0.5 + i * 0.01,
    }))

    const data = createMockVisualAnalytics({
      scenes: undefined,
      qualityScores: undefined,
      moments,
    })

    render(<VisualAnalytics data={data} />)

    // Should only show "топ 10"
    expect(screen.getByText("Типы моментов (топ 10)")).toBeInTheDocument()
  })
})

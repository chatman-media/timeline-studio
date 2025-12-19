/**
 * @vitest-environment jsdom
 */
// Мокаем хук до импорта компонента
vi.mock("../../hooks/use-player-ai-analysis", () => ({
  usePlayerAIAnalysis: vi.fn(),
}))

import { render, screen } from "@testing-library/react"
import { vi } from "vitest"
import type { PlayerAIAnalysisHook } from "../../hooks/use-player-ai-analysis"
import { usePlayerAIAnalysis } from "../../hooks/use-player-ai-analysis"
import { PlayerAIOverlay } from "../player-ai-overlay"

describe("PlayerAIOverlay", () => {
  const mockAIAnalysis: PlayerAIAnalysisHook = {
    state: {
      isAnalyzing: false,
      analysisProgress: 0,
      currentScene: null,
      detectedObjects: [],
      upcomingMoments: [],
      frameAnalysisRate: 2,
      analysisResult: null,
      error: null,
    },
    startRealtimeAnalysis: vi.fn(),
    stopRealtimeAnalysis: vi.fn(),
    setFrameAnalysisRate: vi.fn(),
    getCurrentSceneInfo: vi.fn().mockReturnValue(null),
    getObjectsInFrame: vi.fn().mockReturnValue([]),
    getUpcomingMoments: vi.fn().mockReturnValue([]),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(usePlayerAIAnalysis).mockReturnValue(mockAIAnalysis)
  })

  describe("Видимость компонента", () => {
    it("не отображается когда анализ не активен", () => {
      const { container } = render(<PlayerAIOverlay data-oid="3hg.qsv" />)
      expect(container.firstChild).toBeNull()
    })

    it("отображается когда анализ активен", () => {
      vi.mocked(usePlayerAIAnalysis).mockReturnValue({
        ...mockAIAnalysis,
        state: {
          ...mockAIAnalysis.state,
          isAnalyzing: true,
        },
      })

      render(<PlayerAIOverlay data-oid="tn8yqsx" />)
      expect(screen.getByText("AI анализ активен")).toBeInTheDocument()
    })
  })

  describe("Информация о сцене", () => {
    it("отображает информацию о текущей сцене", () => {
      const currentScene = {
        id: "scene-1",
        type: "dialogue",
        startTime: 0,
        endTime: 10,
        duration: 10,
        confidence: 0.85,
      }

      vi.mocked(usePlayerAIAnalysis).mockReturnValue({
        ...mockAIAnalysis,
        state: {
          ...mockAIAnalysis.state,
          isAnalyzing: true,
        },
        getCurrentSceneInfo: vi.fn().mockReturnValue(currentScene),
      })

      render(<PlayerAIOverlay showSceneInfo={true} data-oid="zme61br" />)
      expect(screen.getByText("Сцена: dialogue")).toBeInTheDocument()
    })

    it("не отображает информацию о сцене если showSceneInfo=false", () => {
      const currentScene = {
        id: "scene-1",
        type: "dialogue",
        startTime: 0,
        endTime: 10,
        duration: 10,
        confidence: 0.85,
      }

      vi.mocked(usePlayerAIAnalysis).mockReturnValue({
        ...mockAIAnalysis,
        state: {
          ...mockAIAnalysis.state,
          isAnalyzing: true,
        },
        getCurrentSceneInfo: vi.fn().mockReturnValue(currentScene),
      })

      render(<PlayerAIOverlay showSceneInfo={false} data-oid="lkice9x" />)
      expect(screen.queryByText("Сцена: dialogue")).not.toBeInTheDocument()
    })
  })

  describe("Обнаруженные объекты", () => {
    it("отображает список обнаруженных объектов", () => {
      const objects = [
        {
          id: "obj-1",
          label: "person",
          confidence: 0.92,
          boundingBox: { x: 20, y: 15, width: 30, height: 60 },
          frameNumbers: [100],
        },
        {
          id: "obj-2",
          label: "car",
          confidence: 0.87,
          boundingBox: { x: 50, y: 40, width: 25, height: 20 },
          frameNumbers: [100],
        },
      ]

      vi.mocked(usePlayerAIAnalysis).mockReturnValue({
        ...mockAIAnalysis,
        state: {
          ...mockAIAnalysis.state,
          isAnalyzing: true,
        },
        getObjectsInFrame: vi.fn().mockReturnValue(objects),
      })

      render(<PlayerAIOverlay showObjects={true} data-oid="9yfas94" />)
      expect(screen.getByText("Объекты:")).toBeInTheDocument()
      expect(screen.getByText("person (92%)")).toBeInTheDocument()
      expect(screen.getByText("car (87%)")).toBeInTheDocument()
    })

    it("показывает только первые 5 объектов", () => {
      const objects = Array.from({ length: 8 }, (_, i) => ({
        id: `obj-${i}`,
        label: `object-${i}`,
        confidence: 0.9,
        boundingBox: { x: 10, y: 10, width: 20, height: 20 },
        frameNumbers: [100],
      }))

      vi.mocked(usePlayerAIAnalysis).mockReturnValue({
        ...mockAIAnalysis,
        state: {
          ...mockAIAnalysis.state,
          isAnalyzing: true,
        },
        getObjectsInFrame: vi.fn().mockReturnValue(objects),
      })

      render(<PlayerAIOverlay showObjects={true} data-oid="0dt8iz-" />)

      // Проверяем первые 5 объектов
      for (let i = 0; i < 5; i++) {
        expect(screen.getByText(`object-${i} (90%)`)).toBeInTheDocument()
      }

      // Проверяем счетчик оставшихся
      expect(screen.getByText("+3")).toBeInTheDocument()

      // Проверяем что 6-8 не отображаются
      expect(screen.queryByText("object-5 (90%)")).not.toBeInTheDocument()
      expect(screen.queryByText("object-6 (90%)")).not.toBeInTheDocument()
      expect(screen.queryByText("object-7 (90%)")).not.toBeInTheDocument()
    })

    it("не отображает объекты если showObjects=false", () => {
      const objects = [
        {
          id: "obj-1",
          label: "person",
          confidence: 0.92,
          boundingBox: { x: 20, y: 15, width: 30, height: 60 },
          frameNumbers: [100],
        },
      ]

      vi.mocked(usePlayerAIAnalysis).mockReturnValue({
        ...mockAIAnalysis,
        state: {
          ...mockAIAnalysis.state,
          isAnalyzing: true,
        },
        getObjectsInFrame: vi.fn().mockReturnValue(objects),
      })

      render(<PlayerAIOverlay showObjects={false} data-oid="i9d_1nz" />)
      expect(screen.queryByText("Объекты:")).not.toBeInTheDocument()
    })

    it("отображает рамки вокруг объектов", () => {
      const objects = [
        {
          id: "obj-1",
          label: "person",
          confidence: 0.92,
          boundingBox: { x: 20, y: 15, width: 30, height: 60 },
          frameNumbers: [100],
        },
      ]

      vi.mocked(usePlayerAIAnalysis).mockReturnValue({
        ...mockAIAnalysis,
        state: {
          ...mockAIAnalysis.state,
          isAnalyzing: true,
        },
        getObjectsInFrame: vi.fn().mockReturnValue(objects),
      })

      const { container } = render(<PlayerAIOverlay showObjects={true} data-oid=".am961r" />)

      const boundingBox = container.querySelector('[style*="left: 20%"]')
      expect(boundingBox).toBeInTheDocument()
      expect(boundingBox).toHaveStyle({
        left: "20%",
        top: "15%",
        width: "30%",
        height: "60%",
      })
      expect(boundingBox).toHaveClass("border-blue-400/50")
    })
  })

  describe("Предстоящие моменты", () => {
    it("отображает предстоящие ключевые моменты", () => {
      const moments = [
        {
          id: "moment-1",
          timestamp: 65,
          type: "highlight",
          confidence: 0.9,
          description: "Эмоциональный момент",
        },
        {
          id: "moment-2",
          timestamp: 120,
          type: "scene_change",
          confidence: 0.85,
          description: "Смена сцены",
        },
      ]

      vi.mocked(usePlayerAIAnalysis).mockReturnValue({
        ...mockAIAnalysis,
        state: {
          ...mockAIAnalysis.state,
          isAnalyzing: true,
        },
        getUpcomingMoments: vi.fn().mockReturnValue(moments),
      })

      render(<PlayerAIOverlay showMoments={true} data-oid="i7msqr2" />)
      expect(screen.getByText("Ключевые моменты:")).toBeInTheDocument()
      expect(screen.getByText("1:05: Эмоциональный момент")).toBeInTheDocument()
      expect(screen.getByText("2:00: Смена сцены")).toBeInTheDocument()
    })

    it("показывает только первые 3 момента", () => {
      const moments = Array.from({ length: 5 }, (_, i) => ({
        id: `moment-${i}`,
        timestamp: 60 + i * 10,
        type: "highlight",
        confidence: 0.9,
        description: `Момент ${i}`,
      }))

      vi.mocked(usePlayerAIAnalysis).mockReturnValue({
        ...mockAIAnalysis,
        state: {
          ...mockAIAnalysis.state,
          isAnalyzing: true,
        },
        getUpcomingMoments: vi.fn().mockReturnValue(moments),
      })

      render(<PlayerAIOverlay showMoments={true} data-oid="kaqv7wy" />)

      // Проверяем первые 3 момента
      expect(screen.getByText("1:00: Момент 0")).toBeInTheDocument()
      expect(screen.getByText("1:10: Момент 1")).toBeInTheDocument()
      expect(screen.getByText("1:20: Момент 2")).toBeInTheDocument()

      // Проверяем что 4-5 не отображаются
      expect(screen.queryByText("1:30: Момент 3")).not.toBeInTheDocument()
      expect(screen.queryByText("1:40: Момент 4")).not.toBeInTheDocument()
    })

    it("не отображает моменты если showMoments=false", () => {
      const moments = [
        {
          id: "moment-1",
          timestamp: 65,
          type: "highlight",
          confidence: 0.9,
          description: "Эмоциональный момент",
        },
      ]

      vi.mocked(usePlayerAIAnalysis).mockReturnValue({
        ...mockAIAnalysis,
        state: {
          ...mockAIAnalysis.state,
          isAnalyzing: true,
        },
        getUpcomingMoments: vi.fn().mockReturnValue(moments),
      })

      render(<PlayerAIOverlay showMoments={false} data-oid="5v70a7x" />)
      expect(screen.queryByText("Ключевые моменты:")).not.toBeInTheDocument()
    })
  })

  describe("Форматирование времени", () => {
    it("правильно форматирует время для моментов", () => {
      const moments = [
        {
          id: "1",
          timestamp: 5,
          type: "highlight",
          confidence: 0.9,
          description: "Момент 1",
        },
        {
          id: "2",
          timestamp: 65,
          type: "highlight",
          confidence: 0.9,
          description: "Момент 2",
        },
        {
          id: "3",
          timestamp: 125,
          type: "highlight",
          confidence: 0.9,
          description: "Момент 3",
        },
        {
          id: "4",
          timestamp: 3661,
          type: "highlight",
          confidence: 0.9,
          description: "Момент 4",
        },
      ]

      vi.mocked(usePlayerAIAnalysis).mockReturnValue({
        ...mockAIAnalysis,
        state: {
          ...mockAIAnalysis.state,
          isAnalyzing: true,
        },
        getUpcomingMoments: vi.fn().mockReturnValue(moments.slice(0, 3)),
      })

      render(<PlayerAIOverlay showMoments={true} data-oid="uy8v.ym" />)

      expect(screen.getByText("0:05: Момент 1")).toBeInTheDocument()
      expect(screen.getByText("1:05: Момент 2")).toBeInTheDocument()
      expect(screen.getByText("2:05: Момент 3")).toBeInTheDocument()
    })
  })

  describe("CSS классы и стили", () => {
    it("применяет пользовательский className", () => {
      vi.mocked(usePlayerAIAnalysis).mockReturnValue({
        ...mockAIAnalysis,
        state: {
          ...mockAIAnalysis.state,
          isAnalyzing: true,
        },
      })

      const { container } = render(<PlayerAIOverlay className="custom-class" data-oid="z2n3rri" />)
      expect(container.firstChild).toHaveClass("custom-class")
    })

    it("имеет правильные базовые классы", () => {
      vi.mocked(usePlayerAIAnalysis).mockReturnValue({
        ...mockAIAnalysis,
        state: {
          ...mockAIAnalysis.state,
          isAnalyzing: true,
        },
      })

      const { container } = render(<PlayerAIOverlay data-oid="-zf4_n." />)
      expect(container.firstChild).toHaveClass("absolute", "inset-0", "pointer-events-none")
    })
  })

  describe("Индикатор анализа", () => {
    it("показывает анимированный индикатор анализа", () => {
      vi.mocked(usePlayerAIAnalysis).mockReturnValue({
        ...mockAIAnalysis,
        state: {
          ...mockAIAnalysis.state,
          isAnalyzing: true,
        },
      })

      const { container } = render(<PlayerAIOverlay data-oid="b:nj_ml" />)

      const sparklesIcon = container.querySelector(".animate-pulse")
      expect(sparklesIcon).toBeInTheDocument()
      expect(sparklesIcon).toHaveClass("text-blue-400")
    })
  })
})

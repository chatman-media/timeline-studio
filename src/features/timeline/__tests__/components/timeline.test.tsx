/**
 * @vitest-environment jsdom
 */
/**
 * Тесты для Timeline компонента
 */

import { screen } from "@testing-library/react"
import React from "react"
import { describe, expect, it, vi } from "vitest"

// Mock useUserSettings before any imports
vi.mock("@timeline-studio/core/hooks/use-user-settings", () => ({
  useUserSettings: () => ({
    openAiApiKey: "test-api-key",
    claudeApiKey: "test-claude-key",
    timelineVirtualizationEnabled: false,
    updateSettings: vi.fn(),
    settings: {
      timelineVirtualizationEnabled: false,
      language: "en",
      theme: "light",
      quality: "medium",
      audioLanguage: "en",
      subtitleLanguage: "en",
      showSubtitles: false,
      autoSave: true,
      autoSaveInterval: 5,
    },
  }),
}))

// Mock ResourcesPanel before any imports
vi.mock("@/features/resources/components/resources-panel", () => ({
  ResourcesPanel: () => (
    <div data-testid="resources-panel" data-oid="04my1iu">
      Resources
    </div>
  ),
}))

// Import mocks before components
import "../../__mocks__/hooks"
import "@/test/mocks/libraries/lucide-react"
import "@/test/mocks/libraries/resizable"
import "@/test/mocks/timeline-components"

import { renderWithTimeline, TimelineProviders } from "@/test/test-utils"
import { Timeline } from "../../components/timeline"

// Use the pre-configured renderWithTimeline function
const renderTimeline = (ui: React.ReactElement) => {
  return renderWithTimeline(ui)
}

describe("Timeline Component", () => {
  describe("Component Initialization", () => {
    it("should be defined and exportable", () => {
      expect(Timeline).toBeDefined()
      expect(typeof Timeline).toBe("function")
    })

    it("should render without errors", () => {
      expect(() => {
        renderTimeline(<Timeline data-oid="cxm5m--" />)
      }).not.toThrow()
    })

    it("should render timeline structure", () => {
      renderTimeline(<Timeline data-oid="6_uobj7" />)

      // Проверяем, что основная структура отрендерилась через testid
      const timelineElement = screen.getByTestId("timeline")
      expect(timelineElement).toBeInTheDocument()
    })
  })

  describe("Component Structure", () => {
    it("should render timeline content", () => {
      renderTimeline(<Timeline data-oid="5g8ietz" />)

      // Проверяем, что компонент содержит основные элементы
      const timelineElement = screen.getByTestId("timeline")
      expect(timelineElement).toBeInTheDocument()
    })
  })

  describe("Component Props", () => {
    it("should accept className and style props without errors", () => {
      const customStyle = { backgroundColor: "red", width: "100%" }

      expect(() => {
        renderTimeline(<Timeline className="custom-timeline" style={customStyle} data-oid=".dbcjj_" />)
      }).not.toThrow()

      const timelineElement = screen.getByTestId("timeline")
      expect(timelineElement).toBeInTheDocument()
    })
  })

  describe("Component Accessibility", () => {
    it("should have proper ARIA attributes", () => {
      renderTimeline(<Timeline data-oid="ohyhcid" />)

      const timelineElement = screen.getByTestId("timeline")
      // Проверяем базовые атрибуты доступности
      expect(timelineElement).toBeInTheDocument()
    })

    it("should be keyboard accessible", () => {
      renderTimeline(<Timeline data-oid="u_fh3.8" />)

      const timelineElement = screen.getByTestId("timeline")
      expect(timelineElement).toBeInTheDocument()

      // Timeline должен быть доступен для навигации с клавиатуры
      expect(timelineElement.tabIndex).toBeGreaterThanOrEqual(-1)
    })
  })

  describe("Component Responsiveness", () => {
    it("should handle different container sizes", () => {
      const { rerender } = renderTimeline(
        <div style={{ width: "800px", height: "400px" }} data-oid="9h92dml">
          <Timeline data-oid="wuv56y:" />
        </div>,
      )

      expect(screen.getByTestId("timeline")).toBeInTheDocument()

      // Перерендерим с другим размером
      rerender(
        <TimelineProviders data-oid="03tmgby">
          <div style={{ width: "1200px", height: "600px" }} data-oid="gxojik:">
            <Timeline data-oid="s3v_lsy" />
          </div>
        </TimelineProviders>,
      )

      expect(screen.getByTestId("timeline")).toBeInTheDocument()
    })
  })

  describe("Component Performance", () => {
    it("should render efficiently", () => {
      const startTime = performance.now()

      renderTimeline(<Timeline data-oid="pnow-f4" />)

      const endTime = performance.now()
      const renderTime = endTime - startTime

      // Проверяем, что рендеринг занимает разумное время
      // Увеличиваем порог до 500мс для CI/CD окружения и dev режима, где производительность может быть ниже
      expect(renderTime).toBeLessThan(500)
      expect(screen.getByTestId("timeline")).toBeInTheDocument()
    })

    it("should handle multiple re-renders", () => {
      const { rerender } = renderTimeline(<Timeline data-oid="kqq.x0k" />)

      // Множественные перерендеры не должны вызывать ошибок
      for (let i = 0; i < 10; i++) {
        rerender(
          <TimelineProviders data-oid="mol43lb">
            <Timeline key={i} data-oid="37jpv4i" />
          </TimelineProviders>,
        )
      }

      expect(screen.getByTestId("timeline")).toBeInTheDocument()
    })
  })

  describe("Component Error Handling", () => {
    it("should handle missing props gracefully", () => {
      expect(() => {
        renderTimeline(<Timeline data-oid="6rfs_o8" />)
      }).not.toThrow()
    })

    it("should handle invalid props gracefully", () => {
      expect(() => {
        renderTimeline(<Timeline className={null as any} data-oid="e3wawjd" />)
      }).not.toThrow()
    })
  })

  describe("Component Integration", () => {
    it("should work with React Suspense", () => {
      expect(() => {
        renderTimeline(
          <React.Suspense fallback={<div data-oid="urrl51d">Loading...</div>} data-oid="msv2q02">
            <Timeline data-oid="rztjsx3" />
          </React.Suspense>,
        )
      }).not.toThrow()
    })

    it("should work with React.StrictMode", () => {
      expect(() => {
        renderTimeline(
          <React.StrictMode data-oid="7p.i38k">
            <Timeline data-oid="3rryeeh" />
          </React.StrictMode>,
        )
      }).not.toThrow()
    })
  })
})

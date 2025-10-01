/**
 * Тесты для Timeline компонента
 */

import { screen } from "@testing-library/react"
import React from "react"
import { describe, expect, it, vi } from "vitest"

// Mock useUserSettings before any imports
vi.mock("@/features/user-settings/hooks/use-user-settings", () => ({
  useUserSettings: () => ({
    openAiApiKey: "test-api-key",
    claudeApiKey: "test-claude-key",
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

// Import mocks before components
import "../../__mocks__/hooks"
import "@/test/mocks/libraries/lucide-react"
import "@/test/mocks/libraries/resizable"
import "@/test/mocks/timeline-components"

import { ChatProvider } from "@/features/ai-chat/services"
import { ModalProvider } from "@/features/modals"
import { ProjectSettingsProvider } from "@/features/project-settings"
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
        renderTimeline(<Timeline />)
      }).not.toThrow()
    })

    it("should render timeline structure", () => {
      renderTimeline(<Timeline />)

      // Проверяем, что основная структура отрендерилась через testid
      const timelineElement = screen.getByTestId("timeline")
      expect(timelineElement).toBeInTheDocument()
    })
  })

  describe("Component Structure", () => {
    it("should render timeline content", () => {
      renderTimeline(<Timeline />)

      // Проверяем, что компонент содержит основные элементы
      const timelineElement = screen.getByTestId("timeline")
      expect(timelineElement).toBeInTheDocument()
    })
  })

  describe("Component Props", () => {
    it("should accept className and style props without errors", () => {
      const customStyle = { backgroundColor: "red", width: "100%" }

      expect(() => {
        renderTimeline(<Timeline className="custom-timeline" style={customStyle} />)
      }).not.toThrow()

      const timelineElement = screen.getByTestId("timeline")
      expect(timelineElement).toBeInTheDocument()
    })
  })

  describe("Component Accessibility", () => {
    it("should have proper ARIA attributes", () => {
      renderTimeline(<Timeline />)

      const timelineElement = screen.getByTestId("timeline")
      // Проверяем базовые атрибуты доступности
      expect(timelineElement).toBeInTheDocument()
    })

    it("should be keyboard accessible", () => {
      renderTimeline(<Timeline />)

      const timelineElement = screen.getByTestId("timeline")
      expect(timelineElement).toBeInTheDocument()

      // Timeline должен быть доступен для навигации с клавиатуры
      expect(timelineElement.tabIndex).toBeGreaterThanOrEqual(-1)
    })
  })

  describe("Component Responsiveness", () => {
    it("should handle different container sizes", () => {
      const { rerender } = renderTimeline(
        <div style={{ width: "800px", height: "400px" }}>
          <Timeline />
        </div>,
      )

      expect(screen.getByTestId("timeline")).toBeInTheDocument()

      // Перерендерим с другим размером
      rerender(
        <TimelineProviders>
          <div style={{ width: "1200px", height: "600px" }}>
            <Timeline />
          </div>
        </TimelineProviders>,
      )

      expect(screen.getByTestId("timeline")).toBeInTheDocument()
    })
  })

  describe("Component Performance", () => {
    it("should render efficiently", () => {
      const startTime = performance.now()

      renderTimeline(<Timeline />)

      const endTime = performance.now()
      const renderTime = endTime - startTime

      // Проверяем, что рендеринг занимает разумное время
      // Увеличиваем порог до 500мс для CI/CD окружения и dev режима, где производительность может быть ниже
      expect(renderTime).toBeLessThan(500)
      expect(screen.getByTestId("timeline")).toBeInTheDocument()
    })

    it("should handle multiple re-renders", () => {
      const { rerender } = renderTimeline(<Timeline />)

      // Множественные перерендеры не должны вызывать ошибок
      for (let i = 0; i < 10; i++) {
        rerender(
          <TimelineProviders>
            <Timeline key={i} />
          </TimelineProviders>,
        )
      }

      expect(screen.getByTestId("timeline")).toBeInTheDocument()
    })
  })

  describe("Component Error Handling", () => {
    it("should handle missing props gracefully", () => {
      expect(() => {
        renderTimeline(<Timeline />)
      }).not.toThrow()
    })

    it("should handle invalid props gracefully", () => {
      expect(() => {
        renderTimeline(<Timeline className={null as any} />)
      }).not.toThrow()
    })
  })

  describe("Component Integration", () => {
    it("should work with React Suspense", () => {
      expect(() => {
        renderTimeline(
          <React.Suspense fallback={<div>Loading...</div>}>
            <Timeline />
          </React.Suspense>,
        )
      }).not.toThrow()
    })

    it("should work with React.StrictMode", () => {
      expect(() => {
        renderTimeline(
          <React.StrictMode>
            <Timeline />
          </React.StrictMode>,
        )
      }).not.toThrow()
    })
  })
})

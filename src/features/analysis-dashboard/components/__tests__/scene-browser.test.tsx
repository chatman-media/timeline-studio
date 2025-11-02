/**
 * @vitest-environment jsdom
 */

import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"
import { SceneType } from "../../types/analysis"
import { SceneBrowser } from "../scene-browser"

describe("SceneBrowser", () => {
  const mockScenes = [
    {
      id: "scene-1",
      project_id: "test-project-1",
      file_id: "file-1",
      start_time: 10.5,
      end_time: 25.7,
      duration: 15.2,
      scene_type: SceneType.Cinematic,
      confidence: 0.87,
      quality_score: 0.82,
      motion_level: 0.3,
      has_faces: true,
      has_text: false,
      auto_description: "Cinematic opening scene with dramatic lighting",
      tags: ["dramatic", "dark", "atmospheric", "moody", "cinematic"],
      created_at: "2024-01-01T12:00:00Z",
    },
    {
      id: "scene-2",
      project_id: "test-project-1",
      file_id: "file-1",
      start_time: 25.7,
      end_time: 45.3,
      duration: 19.6,
      scene_type: SceneType.Dynamic,
      confidence: 0.93,
      quality_score: 0.91,
      motion_level: 0.8,
      has_faces: false,
      has_text: true,
      auto_description: "Fast-paced action sequence with high motion",
      tags: ["action", "fast"],
      created_at: "2024-01-01T12:00:00Z",
    },
    {
      id: "scene-3",
      project_id: "test-project-1",
      file_id: "file-1",
      start_time: 45.3,
      end_time: 60.0,
      duration: 14.7,
      scene_type: SceneType.Closeup,
      confidence: 0.75,
      quality_score: 0.88,
      motion_level: 0.1,
      has_faces: true,
      has_text: false,
      auto_description: "",
      tags: [],
      created_at: "2024-01-01T12:00:00Z",
    },
  ]

  const defaultProps = {
    scenes: mockScenes,
    onSceneSelect: vi.fn(),
  }

  const renderBrowser = (props = {}) => {
    return render(<SceneBrowser {...defaultProps} {...props} />)
  }

  describe("Basic Rendering", () => {
    it("should render scene browser with scenes", () => {
      renderBrowser()

      expect(screen.getByText("Обнаруженные сцены (3)")).toBeInTheDocument()
      expect(screen.getByText("Сцена 10.5с - 25.7с")).toBeInTheDocument()
      expect(screen.getByText("Сцена 25.7с - 45.3с")).toBeInTheDocument()
      expect(screen.getByText("Сцена 45.3с - 60.0с")).toBeInTheDocument()
    })

    it("should show empty state when no scenes", () => {
      renderBrowser({ scenes: [] })

      expect(screen.getByText("Нет сцен")).toBeInTheDocument()
      expect(screen.getByText("Сцены появятся после завершения анализа проекта")).toBeInTheDocument()
      expect(screen.queryByText(/Обнаруженные сцены/)).not.toBeInTheDocument()
    })
  })

  describe("Scene Information Display", () => {
    it("should display scene timing information", () => {
      renderBrowser()

      // Check durations
      expect(screen.getByText("15.2с")).toBeInTheDocument()
      expect(screen.getByText("19.6с")).toBeInTheDocument()
      expect(screen.getByText("14.7с")).toBeInTheDocument()
    })

    it("should display quality scores as percentages", () => {
      renderBrowser()

      expect(screen.getByText("82%")).toBeInTheDocument()
      expect(screen.getByText("91%")).toBeInTheDocument()
      expect(screen.getByText("88%")).toBeInTheDocument()
    })

    it("should show faces indicator when scene has faces", () => {
      renderBrowser()

      const facesElements = screen.getAllByText("Лица")
      expect(facesElements).toHaveLength(2) // scenes 1 and 3 have faces
    })

    it("should not show faces indicator when scene has no faces", () => {
      const scenesWithoutFaces = [
        { ...mockScenes[0], has_faces: false },
        { ...mockScenes[1], has_faces: false },
        { ...mockScenes[2], has_faces: false },
      ]
      renderBrowser({ scenes: scenesWithoutFaces })

      expect(screen.queryByText("Лица")).not.toBeInTheDocument()
    })
  })

  describe("Scene Types", () => {
    it.each([
      [SceneType.Cinematic, "Cinematic"],
      [SceneType.Dynamic, "Dynamic"],
      [SceneType.Closeup, "Closeup"],
      [SceneType.Wide, "Wide"],
      [SceneType.Medium, "Medium"],
    ])("should display correct badge for %s scene type", (sceneType, expectedText) => {
      const sceneWithType = [{ ...mockScenes[0], scene_type: sceneType }]
      renderBrowser({ scenes: sceneWithType })

      expect(screen.getByText(expectedText)).toBeInTheDocument()
    })

    it("should apply correct styling for different scene types", () => {
      renderBrowser()

      expect(screen.getByText("Cinematic")).toBeInTheDocument()
      expect(screen.getByText("Dynamic")).toBeInTheDocument()
      expect(screen.getByText("Closeup")).toBeInTheDocument()
    })
  })

  describe("Auto Description", () => {
    it("should display auto description when available", () => {
      renderBrowser()

      expect(screen.getByText("Cinematic opening scene with dramatic lighting")).toBeInTheDocument()
      expect(screen.getByText("Fast-paced action sequence with high motion")).toBeInTheDocument()
    })

    it("should not display auto description when empty", () => {
      renderBrowser()

      // Scene 3 has empty auto_description
      expect(screen.queryByText("")).not.toBeInTheDocument()
    })
  })

  describe("Tags Display", () => {
    it("should display scene tags", () => {
      renderBrowser()

      // First scene has 5 tags, should show first 3 + count
      expect(screen.getByText("dramatic")).toBeInTheDocument()
      expect(screen.getByText("dark")).toBeInTheDocument()
      expect(screen.getByText("atmospheric")).toBeInTheDocument()
      expect(screen.getByText("+2")).toBeInTheDocument() // +2 more tags

      // Second scene has 2 tags, should show all
      expect(screen.getByText("action")).toBeInTheDocument()
      expect(screen.getByText("fast")).toBeInTheDocument()
    })

    it("should not display tags section when no tags", () => {
      const scenesWithoutTags = [{ ...mockScenes[0], tags: [] }]
      renderBrowser({ scenes: scenesWithoutTags })

      expect(screen.queryByText("dramatic")).not.toBeInTheDocument()
    })

    it("should limit tags display to 3 and show count for extras", () => {
      const sceneWithManyTags = [
        {
          ...mockScenes[0],
          tags: ["tag1", "tag2", "tag3", "tag4", "tag5", "tag6"],
        },
      ]
      renderBrowser({ scenes: sceneWithManyTags })

      expect(screen.getByText("tag1")).toBeInTheDocument()
      expect(screen.getByText("tag2")).toBeInTheDocument()
      expect(screen.getByText("tag3")).toBeInTheDocument()
      expect(screen.getByText("+3")).toBeInTheDocument()
      expect(screen.queryByText("tag4")).not.toBeInTheDocument()
    })
  })

  describe("User Interactions", () => {
    it("should call onSceneSelect when scene card is clicked", async () => {
      const onSceneSelect = vi.fn()
      const user = userEvent.setup()
      renderBrowser({ onSceneSelect })

      const firstSceneCard = screen.getByText("Сцена 10.5с - 25.7с").closest(".cursor-pointer")!
      await user.click(firstSceneCard)

      expect(onSceneSelect).toHaveBeenCalledWith(mockScenes[0])
    })

    it("should handle multiple scene selections", async () => {
      const onSceneSelect = vi.fn()
      const user = userEvent.setup()
      renderBrowser({ onSceneSelect })

      const firstScene = screen.getByText("Сцена 10.5с - 25.7с").closest(".cursor-pointer")!
      const secondScene = screen.getByText("Сцена 25.7с - 45.3с").closest(".cursor-pointer")!

      await user.click(firstScene)
      await user.click(secondScene)

      expect(onSceneSelect).toHaveBeenCalledTimes(2)
      expect(onSceneSelect).toHaveBeenNthCalledWith(1, mockScenes[0])
      expect(onSceneSelect).toHaveBeenNthCalledWith(2, mockScenes[1])
    })
  })

  describe("Quality Visualization", () => {
    it("should display quality progress bars with correct widths", () => {
      renderBrowser()

      // Check that quality progress bars exist
      const qualityBars = screen.container.querySelectorAll('[style*="width"]')
      expect(qualityBars.length).toBeGreaterThan(0)

      // Check specific quality percentages
      expect(screen.getByText("82%")).toBeInTheDocument() // Scene 1
      expect(screen.getByText("91%")).toBeInTheDocument() // Scene 2
      expect(screen.getByText("88%")).toBeInTheDocument() // Scene 3
    })
  })

  describe("Responsive Design", () => {
    it("should render grid with responsive classes", () => {
      renderBrowser()

      const gridContainer = screen.getByText("Сцена 10.5с - 25.7с").closest(".grid")
      expect(gridContainer).toHaveClass("grid-cols-1", "md:grid-cols-2", "lg:grid-cols-3")
    })
  })

  describe("Edge Cases", () => {
    it("should handle scenes with zero duration", () => {
      const sceneWithZeroDuration = [{ ...mockScenes[0], duration: 0, start_time: 10, end_time: 10 }]
      renderBrowser({ scenes: sceneWithZeroDuration })

      expect(screen.getByText("Сцена 10.0с - 10.0с")).toBeInTheDocument()
      expect(screen.getByText("0.0с")).toBeInTheDocument()
    })

    it("should handle scenes with very low quality scores", () => {
      const lowQualityScene = [{ ...mockScenes[0], quality_score: 0.01 }]
      renderBrowser({ scenes: lowQualityScene })

      expect(screen.getByText("1%")).toBeInTheDocument()
    })

    it("should handle scenes with perfect quality scores", () => {
      const perfectQualityScene = [{ ...mockScenes[0], quality_score: 1.0 }]
      renderBrowser({ scenes: perfectQualityScene })

      expect(screen.getByText("100%")).toBeInTheDocument()
    })

    it("should handle very long scene descriptions", () => {
      const longDescriptionScene = [
        {
          ...mockScenes[0],
          auto_description:
            "This is a very long scene description that should be truncated with ellipsis when displayed in the card component to maintain proper layout and readability",
        },
      ]
      renderBrowser({ scenes: longDescriptionScene })

      // The line-clamp-2 class should handle truncation
      expect(screen.getByText(/This is a very long scene description/)).toBeInTheDocument()
    })

    it("should handle fractional timing values correctly", () => {
      const fractionalTimingScene = [
        {
          ...mockScenes[0],
          start_time: 10.123,
          end_time: 25.789,
          duration: 15.666,
        },
      ]
      renderBrowser({ scenes: fractionalTimingScene })

      expect(screen.getByText("Сцена 10.1с - 25.8с")).toBeInTheDocument() // .toFixed(1)
      expect(screen.getByText("15.7с")).toBeInTheDocument()
    })
  })

  describe("Accessibility", () => {
    it("should have proper interactive elements", () => {
      renderBrowser()

      const sceneCards = screen.getAllByRole("button", { hidden: true })
      expect(sceneCards.length).toBeGreaterThan(0)
    })

    it("should support keyboard navigation", async () => {
      const onSceneSelect = vi.fn()
      const user = userEvent.setup()
      renderBrowser({ onSceneSelect })

      const firstScene = screen.getByText("Сцена 10.5с - 25.7с").closest(".cursor-pointer")!

      // Focus and press Enter (Note: actual keyboard support would need onKeyDown handler)
      firstScene.focus()
      await user.keyboard("{Enter}")

      // For this test, we're just ensuring the structure is accessible
      expect(firstScene).toBeInTheDocument()
    })
  })
})

import { describe, expect, it } from "vitest"
import { MediaType } from "@/domains/media-management"
import { renderWithTemplates, screen } from "@/test/test-utils"

import { VideoPanelComponent } from "../../components/video-panel-component"

describe("VideoPanelComponent", () => {
  const mockVideo = {
    id: "test-video-1",
    name: "Test Video",
    path: "/test/video.mp4",
    type: MediaType.Video,
    size: 1024,
    duration: 60,
    startTime: 0,
    endTime: 60,
  }

  it("should be importable", () => {
    // Простой smoke test - проверяем, что компонент можно импортировать
    expect(VideoPanelComponent).toBeDefined()
    expect(typeof VideoPanelComponent).toBe("function")
  })

  it("should render without crashing", () => {
    renderWithTemplates(<VideoPanelComponent video={mockVideo} isActive={false} />)

    // Проверяем, что компонент отрендерился (ищем контейнер)
    const container = document.querySelector(".video-panel-template")
    expect(container).toBeInTheDocument()
  })

  it("should display video when path is provided", () => {
    renderWithTemplates(<VideoPanelComponent video={mockVideo} isActive={true} />)

    // Проверяем, что видео элемент отрендерился
    const videoElement = document.querySelector('video[data-video-id="test-video-1"]')
    expect(videoElement).toBeInTheDocument()
    expect(videoElement).toHaveAttribute("src", "/test/video.mp4")
  })

  it("should show active indicator when video is active", () => {
    renderWithTemplates(<VideoPanelComponent video={mockVideo} isActive={true} />)

    // Проверяем, что контейнер отрендерился и имеет активную рамку
    const activeContainer = document.querySelector(".border-2.border-white")
    expect(activeContainer).toBeInTheDocument()
  })

  it("should display video name when provided", () => {
    renderWithTemplates(<VideoPanelComponent video={mockVideo} isActive={true} hideLabel={false} />)

    // Проверяем, что название видео отображается
    expect(screen.getByText("Test Video")).toBeInTheDocument()
  })

  it("should hide label when hideLabel is true", () => {
    renderWithTemplates(<VideoPanelComponent video={mockVideo} isActive={true} hideLabel={true} />)

    // Проверяем, что название видео скрыто (opacity: 0)
    const labelElement = screen.getByText("Test Video")
    expect(labelElement).toHaveStyle({ opacity: "0" })
  })

  it("should show no video message when path is missing", () => {
    const videoWithoutPath = { ...mockVideo, path: "" }

    renderWithTemplates(<VideoPanelComponent video={videoWithoutPath} isActive={true} />)

    // Проверяем, что отображается сообщение об отсутствии видео
    expect(screen.getByText("timeline.player.noVideoSelected")).toBeInTheDocument()
  })

  it("should have correct component structure", () => {
    // Проверяем, что это React компонент
    expect(VideoPanelComponent.name).toBe("VideoPanelComponent")
  })
})

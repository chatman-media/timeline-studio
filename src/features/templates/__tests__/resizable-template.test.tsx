import React from "react";

import { act } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { renderWithTemplates, screen } from "@/test/test-utils";

import { ResizableTemplate } from "../components/resizable-template";

// Мокаем VideoPanelComponent
vi.mock("../components/video-panel-component", () => ({
  VideoPanelComponent: ({ video, isActive, index, className }: any) => (
    <div
      data-testid={`video-panel-${index || 1}`}
      className={className}
      data-video-id={video?.id}
      data-is-active={isActive}
    >
      Video Panel {index || 1} - {video?.name || "No Video"}
    </div>
  ),
}));

describe("ResizableTemplate", () => {
  const mockTemplate = {
    id: "split-vertical-landscape", // Используем реальный ID шаблона
    split: "vertical" as const,
    resizable: true,
    screens: 2,
    splitPosition: 50,
    render: () => React.createElement("div", { children: "Test Template" }),
  };

  const mockAppliedTemplate = {
    template: mockTemplate,
    videos: [],
  };

  const mockVideos = [
    {
      id: "video-1",
      name: "Test Video 1",
      path: "/test/video1.mp4",
      type: "video",
      size: 1024,
      duration: 60,
      startTime: 0,
      endTime: 60,
    },
    {
      id: "video-2",
      name: "Test Video 2",
      path: "/test/video2.mp4",
      type: "video",
      size: 1024,
      duration: 60,
      startTime: 0,
      endTime: 60,
    },
  ];

  it("should be importable", () => {
    // Простой smoke test - проверяем, что компонент можно импортировать
    expect(ResizableTemplate).toBeDefined();
    expect(typeof ResizableTemplate).toBe("function");
  });

  it("should render without crashing", () => {
    renderWithTemplates(
      <ResizableTemplate
        appliedTemplate={mockAppliedTemplate}
        videos={mockVideos}
        activeVideoId={null}
      />,
    );

    // Проверяем, что компонент отрендерился (используем SplitVertical для vertical template)
    expect(screen.getByTestId("video-panel-1")).toBeInTheDocument();
  });

  it("should render video panels for each screen", () => {
    renderWithTemplates(
      <ResizableTemplate
        appliedTemplate={mockAppliedTemplate}
        videos={mockVideos}
        activeVideoId={null}
      />,
    );

    // Проверяем, что отрендерились панели для каждого экрана
    expect(screen.getByTestId("video-panel-1")).toBeInTheDocument();
    expect(screen.getByTestId("video-panel-2")).toBeInTheDocument();
  });

  it("should render empty div when no videos", () => {
    renderWithTemplates(
      <ResizableTemplate
        appliedTemplate={mockAppliedTemplate}
        videos={[]}
        activeVideoId={null}
      />,
    );

    // Проверяем, что отрендерился пустой div
    const container = document.querySelector(".h-full.w-full.bg-black");
    expect(container).toBeInTheDocument();
  });

  it("should handle horizontal split template", () => {
    const horizontalTemplate = {
      ...mockTemplate,
      id: "split-horizontal-landscape", // Используем реальный ID
      split: "horizontal" as const,
    };

    const horizontalAppliedTemplate = {
      template: horizontalTemplate,
      videos: [],
    };

    renderWithTemplates(
      <ResizableTemplate
        appliedTemplate={horizontalAppliedTemplate}
        videos={mockVideos}
        activeVideoId={null}
      />,
    );

    // Проверяем, что компонент отрендерился (используем SplitHorizontal для horizontal template)
    expect(screen.getByTestId("video-panel-1")).toBeInTheDocument();
  });

  it("should handle grid template", () => {
    const gridTemplate = {
      ...mockTemplate,
      id: "split-grid-2x2-landscape",
      split: "grid" as const,
      screens: 4,
    };

    const gridAppliedTemplate = {
      template: gridTemplate,
      videos: [],
    };

    renderWithTemplates(
      <ResizableTemplate
        appliedTemplate={gridAppliedTemplate}
        videos={mockVideos}
        activeVideoId={null}
      />,
    );

    // Проверяем, что компонент отрендерился (используем SplitGrid2x2 для grid template)
    expect(screen.getByTestId("video-panel-1")).toBeInTheDocument();
  });

  it("should validate template structure", () => {
    // Проверяем корректность структуры шаблона
    expect(mockTemplate).toHaveProperty("id");
    expect(mockTemplate).toHaveProperty("split");
    expect(mockTemplate).toHaveProperty("resizable");
    expect(mockTemplate).toHaveProperty("screens");
    expect(mockTemplate).toHaveProperty("splitPosition");
    expect(mockTemplate).toHaveProperty("render");

    // Проверяем типы свойств
    expect(typeof mockTemplate.id).toBe("string");
    expect(typeof mockTemplate.split).toBe("string");
    expect(typeof mockTemplate.resizable).toBe("boolean");
    expect(typeof mockTemplate.screens).toBe("number");
    expect(typeof mockTemplate.splitPosition).toBe("number");
    expect(typeof mockTemplate.render).toBe("function");

    // Проверяем значения
    expect(mockTemplate.resizable).toBe(true);
    expect(mockTemplate.screens).toBe(2);
    expect(mockTemplate.splitPosition).toBe(50);
  });
});

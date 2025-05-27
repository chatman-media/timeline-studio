import { act } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { fireEvent, renderWithTemplates, screen } from "@/test/test-utils";

import { TemplatePreview } from "../components/template-preview";
import { MediaTemplate } from "../lib/templates";

// Локальные моки для ресурсов (переопределяем глобальные)
const mockAddTemplate = vi.fn();
const mockRemoveResource = vi.fn();
const mockIsTemplateAdded = vi.fn();

vi.mock("@/features/resources", () => ({
  useResources: () => ({
    addTemplate: mockAddTemplate,
    removeResource: mockRemoveResource,
    isTemplateAdded: mockIsTemplateAdded,
    templateResources: [
      { id: "template-resource-1", resourceId: "template-1" },
    ],
  }),
  ResourcesProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// Мокаем console.log
vi.spyOn(console, "log").mockImplementation(() => {});
vi.spyOn(console, "warn").mockImplementation(() => {});

describe("TemplatePreview", () => {
  // Создаем мок-шаблон для тестов
  const mockTemplate: MediaTemplate = {
    id: "template-1",
    split: "vertical",
    screens: 2,
    resizable: true,
    splitPosition: 50,
    render: () => <div data-testid="template-content">Template Content</div>,
  };

  const mockOnClick = vi.fn();
  const mockSize = 200;
  const mockDimensions: [number, number] = [1920, 1080];

  beforeEach(() => {
    vi.clearAllMocks();
    mockIsTemplateAdded.mockReturnValue(false);
  });

  it("should render the template preview correctly", () => {
    renderWithTemplates(
      <TemplatePreview
        template={mockTemplate}
        onClick={mockOnClick}
        size={mockSize}
        dimensions={mockDimensions}
      />,
    );

    // Проверяем, что контент шаблона отрендерился
    expect(screen.getByTestId("template-content")).toBeInTheDocument();

    // Проверяем, что кнопка избранного отрендерилась
    expect(screen.getByTestId("favorite-button")).toBeInTheDocument();

    // Проверяем, что кнопка добавления отрендерилась
    expect(screen.getByTestId("add-media-button")).toBeInTheDocument();
  });

  it("should call onClick when clicked", () => {
    renderWithTemplates(
      <TemplatePreview
        template={mockTemplate}
        onClick={mockOnClick}
        size={mockSize}
        dimensions={mockDimensions}
      />,
    );

    // Кликаем по компоненту
    const previewElement = screen.getByTestId("template-content").parentElement;
    if (previewElement) {
      act(() => {
        act(() => {
          fireEvent.click(previewElement);
        });
      });
      expect(mockOnClick).toHaveBeenCalledTimes(1);
    }
  });

  it("should add template when add button is clicked", () => {
    renderWithTemplates(
      <TemplatePreview
        template={mockTemplate}
        onClick={mockOnClick}
        size={mockSize}
        dimensions={mockDimensions}
      />,
    );

    // Кликаем по кнопке добавления
    const addButton = screen.getByTestId("add-media-button");
    act(() => {
      act(() => {
        fireEvent.click(addButton);
      });
    });

    // Проверяем, что функция добавления шаблона была вызвана
    expect(mockAddTemplate).toHaveBeenCalledTimes(1);
    expect(mockAddTemplate).toHaveBeenCalledWith(mockTemplate);
  });

  it("should remove template when remove button is clicked", () => {
    // Устанавливаем, что шаблон уже добавлен
    mockIsTemplateAdded.mockReturnValue(true);

    renderWithTemplates(
      <TemplatePreview
        template={mockTemplate}
        onClick={mockOnClick}
        size={mockSize}
        dimensions={mockDimensions}
      />,
    );

    // Кликаем по кнопке удаления
    const removeButton = screen.getByTestId("add-media-button");
    act(() => {
      act(() => {
        fireEvent.click(removeButton);
      });
    });

    // Проверяем, что функция удаления ресурса была вызвана
    expect(mockRemoveResource).toHaveBeenCalledTimes(1);
  });

  it("should calculate dimensions correctly for landscape template", () => {
    renderWithTemplates(
      <TemplatePreview
        template={mockTemplate}
        onClick={mockOnClick}
        size={mockSize}
        dimensions={[1920, 1080]}
      />,
    );

    // Проверяем, что размеры рассчитаны правильно с учетом минимума 150px для шаблонов
    const previewElement = screen.getByTestId("template-content").parentElement;
    if (previewElement) {
      // Для шаблонов применяется минимум 150px по длинному краю
      const effectiveSize = Math.max(mockSize, 150); // 150px минимум
      expect(previewElement).toHaveStyle({ width: `${effectiveSize}px` });
      expect(previewElement).toHaveStyle({
        height: `${Math.round(effectiveSize * (1080 / 1920))}px`,
      });
    }
  });

  it("should calculate dimensions correctly for portrait template", () => {
    renderWithTemplates(
      <TemplatePreview
        template={mockTemplate}
        onClick={mockOnClick}
        size={mockSize}
        dimensions={[1080, 1920]}
      />,
    );

    // Проверяем, что размеры рассчитаны правильно для вертикального шаблона с учетом минимума 150px
    const previewElement = screen.getByTestId("template-content").parentElement;
    if (previewElement) {
      // Для вертикальных шаблонов длинный край - это высота
      const effectiveSize = Math.max(mockSize, 150); // 150px минимум
      expect(previewElement).toHaveStyle({
        width: `${Math.round(effectiveSize * (1080 / 1920))}px`,
      });
      expect(previewElement).toHaveStyle({ height: `${effectiveSize}px` });
    }
  });
});

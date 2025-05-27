import React from "react";

import { act } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { fireEvent, renderWithBase, screen } from "@/test/test-utils";

import { ResourcesPanel } from "../../components/resources-panel";
import { useResources } from "../../services/resources-provider";

// Создаем моки для функций
const mockAddEffect = vi.fn();
const mockAddFilter = vi.fn();
const mockAddTransition = vi.fn();
const mockAddTemplate = vi.fn();
const mockAddMusic = vi.fn();
const mockRemoveResource = vi.fn();

// Создаем типизированные моки ресурсов
const createMockResource = (type: string, id: string, name: string) => ({
  id,
  type,
  name,
  resourceId: `${type}-${id}`,
  path: `/mock/path/${type}/${id}`,
  metadata: {
    duration: type === "music" ? 120 : undefined,
    size: { width: 1920, height: 1080 },
    format: type === "music" ? "mp3" : "mp4",
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

// Создаем наборы тестовых данных
const mockEffectResources = [
  createMockResource("effect", "brightness", "Brightness Effect"),
  createMockResource("effect", "contrast", "Contrast Effect"),
  createMockResource("effect", "blur", "Blur Effect"),
] as any;

const mockFilterResources = [
  createMockResource("filter", "vintage", "Vintage Filter"),
  createMockResource("filter", "sepia", "Sepia Filter"),
] as any;

const mockTransitionResources = [
  createMockResource("transition", "fade", "Fade Transition"),
  createMockResource("transition", "slide", "Slide Transition"),
  createMockResource("transition", "zoom", "Zoom Transition"),
] as any;

const mockTemplateResources = [
  createMockResource("template", "basic", "Basic Template"),
  createMockResource("template", "advanced", "Advanced Template"),
] as any;

const mockMusicResources = [
  createMockResource("music", "background", "Background Music"),
  createMockResource("music", "ambient", "Ambient Sound"),
] as any;

// Создаем мок функцию
const mockUseResources = vi.fn();

// Мокаем модуль resources
vi.mock("../../services/resources-provider", () => ({
  useResources: mockUseResources,
}));

// Мокаем иконки Lucide
vi.mock("lucide-react", () => ({
  AlertTriangle: ({
    className,
    size = 16,
    onClick,
    onMouseEnter,
    onMouseLeave,
    ...props
  }: any) => (
    <div
      data-testid="alert-triangle-icon"
      className={className}
      data-size={size}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      role="img"
      aria-label="Alert Triangle Icon"
      {...props}
    />
  ),
  Music: ({
    className,
    size = 16,
    onClick,
    onMouseEnter,
    onMouseLeave,
    ...props
  }: any) => (
    <div
      data-testid="music-icon"
      className={className}
      data-size={size}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      role="img"
      aria-label="Music Icon"
      {...props}
    />
  ),
  Package: ({
    className,
    size = 16,
    onClick,
    onMouseEnter,
    onMouseLeave,
    ...props
  }: any) => (
    <div
      data-testid="package-icon"
      className={className}
      data-size={size}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      role="img"
      aria-label="Package Icon"
      {...props}
    />
  ),
  Palette: ({
    className,
    size = 16,
    onClick,
    onMouseEnter,
    onMouseLeave,
    ...props
  }: any) => (
    <div
      data-testid="palette-icon"
      className={className}
      data-size={size}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      role="img"
      aria-label="Palette Icon"
      {...props}
    />
  ),
  Scissors: ({
    className,
    size = 16,
    onClick,
    onMouseEnter,
    onMouseLeave,
    ...props
  }: any) => (
    <div
      data-testid="scissors-icon"
      className={className}
      data-size={size}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      role="img"
      aria-label="Scissors Icon"
      {...props}
    />
  ),
  Subtitles: ({
    className,
    size = 16,
    onClick,
    onMouseEnter,
    onMouseLeave,
    ...props
  }: any) => (
    <div
      data-testid="subtitles-icon"
      className={className}
      data-size={size}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      role="img"
      aria-label="Subtitles Icon"
      {...props}
    />
  ),
  Video: ({
    className,
    size = 16,
    onClick,
    onMouseEnter,
    onMouseLeave,
    ...props
  }: any) => (
    <div
      data-testid="video-icon"
      className={className}
      data-size={size}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      role="img"
      aria-label="Video Icon"
      {...props}
    />
  ),
  Sticker: ({
    className,
    size = 16,
    onClick,
    onMouseEnter,
    onMouseLeave,
    ...props
  }: any) => (
    <div
      data-testid="sticker-icon"
      className={className}
      data-size={size}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      role="img"
      aria-label="Sticker Icon"
      {...props}
    />
  ),
}));

// Мокаем переводы
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        "timeline.resources.title": "Ресурсы таймлайна",
        "timeline.resources.effects": "Эффекты",
        "timeline.resources.filters": "Фильтры",
        "timeline.resources.transitions": "Переходы",
        "timeline.resources.templates": "Шаблоны",
        "timeline.resources.music": "Музыка",
        "timeline.resources.noResources": "Нет доступных ресурсов",
      };
      return translations[key] || key;
    },
  }),
  initReactI18next: {
    type: "3rdParty",
    init: vi.fn(),
  },
}));

// Используем стандартный рендеринг с AllProviders
// AllProviders уже включает в себя ResourcesProvider

describe("ResourcesPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Дефолтные пустые ресурсы
    mockUseResources.mockReturnValue({
      resources: [],
      effectResources: [],
      filterResources: [],
      transitionResources: [],
      templateResources: [],
      styleTemplateResources: [],
      musicResources: [],
      subtitleResources: [],
      addEffect: mockAddEffect,
      addFilter: mockAddFilter,
      addTransition: mockAddTransition,
      addTemplate: mockAddTemplate,
      addStyleTemplate: vi.fn(),
      addMusic: mockAddMusic,
      addSubtitle: vi.fn(),
      removeResource: mockRemoveResource,
      updateResource: vi.fn(),
      isEffectAdded: vi.fn(),
      isFilterAdded: vi.fn(),
      isTransitionAdded: vi.fn(),
      isTemplateAdded: vi.fn(),
      isStyleTemplateAdded: vi.fn(),
      isMusicFileAdded: vi.fn(),
      isSubtitleAdded: vi.fn(),
    });
  });

  it("должен корректно рендериться", () => {
    const renderResult = renderWithBase(<ResourcesPanel />);

    // Проверяем, что компонент рендерится без ошибок
    expect(renderResult.container.firstChild).toBeInTheDocument();
  });

  it.skip("должен отображать все категории ресурсов", () => {
    renderWithBase(<ResourcesPanel />);

    // Проверяем наличие всех категорий
    expect(screen.getByText("Эффекты")).toBeInTheDocument();
    expect(screen.getByText("Фильтры")).toBeInTheDocument();
    expect(screen.getByText("Переходы")).toBeInTheDocument();
    expect(screen.getByText("Шаблоны")).toBeInTheDocument();
    expect(screen.getByText("Музыка")).toBeInTheDocument();
  });

  it.skip("должен отображать правильные иконки для каждой категории", () => {
    renderWithBase(<ResourcesPanel />);

    // Проверяем наличие иконок
    expect(screen.getByTestId("package-icon")).toBeInTheDocument(); // Effects
    expect(screen.getByTestId("palette-icon")).toBeInTheDocument(); // Filters
    expect(screen.getByTestId("scissors-icon")).toBeInTheDocument(); // Transitions
    expect(screen.getByTestId("video-icon")).toBeInTheDocument(); // Templates
    expect(screen.getByTestId("music-icon")).toBeInTheDocument(); // Music
  });

  it.skip('должен отображать сообщение "нет ресурсов" когда категории пустые', () => {
    renderWithBase(<ResourcesPanel />);

    // Проверяем сообщения об отсутствии ресурсов
    const noResourcesMessages = screen.getAllByText("Нет добавленных ресурсов");
    expect(noResourcesMessages).toHaveLength(5); // По одному для каждой категории
  });

  it.skip("should display resources when they exist", () => {
    // Мокаем ресурсы с данными
    mockUseResources.mockReturnValue({
      resources: [],
      effectResources: mockEffectResources,
      filterResources: mockFilterResources,
      transitionResources: mockTransitionResources,
      templateResources: mockTemplateResources,
      styleTemplateResources: [],
      musicResources: mockMusicResources,
      subtitleResources: [],
      addEffect: mockAddEffect,
      addFilter: mockAddFilter,
      addTransition: mockAddTransition,
      addTemplate: mockAddTemplate,
      addStyleTemplate: vi.fn(),
      addMusic: mockAddMusic,
      addSubtitle: vi.fn(),
      removeResource: mockRemoveResource,
      updateResource: vi.fn(),
      isEffectAdded: vi.fn(),
      isFilterAdded: vi.fn(),
      isTransitionAdded: vi.fn(),
      isTemplateAdded: vi.fn(),
      isStyleTemplateAdded: vi.fn(),
      isMusicFileAdded: vi.fn(),
      isSubtitleAdded: vi.fn(),
    });

    renderWithBase(<ResourcesPanel />);

    // Проверяем отображение ресурсов
    expect(screen.getByText("Brightness Effect")).toBeInTheDocument();
    expect(screen.getByText("Vintage Filter")).toBeInTheDocument();
    expect(screen.getByText("Fade Transition")).toBeInTheDocument();
    expect(screen.getByText("Basic Template")).toBeInTheDocument();
    expect(screen.getByText("Background Music")).toBeInTheDocument();
  });

  it.skip("should display correct resource counts in category headers", () => {
    // Мокаем ресурсы с данными
    mockUseResources.mockReturnValue({
      resources: [],
      effectResources: mockEffectResources, // 3 элемента
      filterResources: mockFilterResources.slice(0, 1), // 1 элемент
      transitionResources: [],
      templateResources: [],
      styleTemplateResources: [],
      musicResources: [],
      subtitleResources: [],
      addEffect: mockAddEffect,
      addFilter: mockAddFilter,
      addTransition: mockAddTransition,
      addTemplate: mockAddTemplate,
      addStyleTemplate: vi.fn(),
      addMusic: mockAddMusic,
      addSubtitle: vi.fn(),
      removeResource: mockRemoveResource,
      updateResource: vi.fn(),
      isEffectAdded: vi.fn(),
      isFilterAdded: vi.fn(),
      isTransitionAdded: vi.fn(),
      isTemplateAdded: vi.fn(),
      isStyleTemplateAdded: vi.fn(),
      isMusicFileAdded: vi.fn(),
      isSubtitleAdded: vi.fn(),
    });

    renderWithBase(<ResourcesPanel />);

    // Проверяем счетчики
    expect(screen.getByText("(3)")).toBeInTheDocument(); // Effects
    expect(screen.getByText("(1)")).toBeInTheDocument(); // Filters
  });

  it.skip("should call addEffect when effect resource is clicked", () => {
    // Мокаем ресурсы с данными
    mockUseResources.mockReturnValue({
      resources: [],
      effectResources: mockEffectResources,
      filterResources: [],
      transitionResources: [],
      templateResources: [],
      styleTemplateResources: [],
      musicResources: [],
      subtitleResources: [],
      addEffect: mockAddEffect,
      addFilter: mockAddFilter,
      addTransition: mockAddTransition,
      addTemplate: mockAddTemplate,
      addStyleTemplate: vi.fn(),
      addMusic: mockAddMusic,
      addSubtitle: vi.fn(),
      removeResource: mockRemoveResource,
      updateResource: vi.fn(),
      isEffectAdded: vi.fn(),
      isFilterAdded: vi.fn(),
      isTransitionAdded: vi.fn(),
      isTemplateAdded: vi.fn(),
      isStyleTemplateAdded: vi.fn(),
      isMusicFileAdded: vi.fn(),
      isSubtitleAdded: vi.fn(),
    });

    renderWithBase(<ResourcesPanel />);

    // Находим и кликаем по эффекту
    const effectElement = screen.getByText("Brightness Effect");
    act(() => {
      act(() => {
        fireEvent.click(effectElement);
      });
    });

    // Проверяем, что addEffect был вызван с правильными параметрами
    expect(mockAddEffect).toHaveBeenCalledWith(mockEffectResources[0]);
  });

  it.skip("should call addFilter when filter resource is clicked", () => {
    // Мокаем ресурсы с данными
    mockUseResources.mockReturnValue({
      resources: [],
      effectResources: [],
      filterResources: mockFilterResources,
      transitionResources: [],
      templateResources: [],
      styleTemplateResources: [],
      musicResources: [],
      subtitleResources: [],
      addEffect: mockAddEffect,
      addFilter: mockAddFilter,
      addTransition: mockAddTransition,
      addTemplate: mockAddTemplate,
      addStyleTemplate: vi.fn(),
      addMusic: mockAddMusic,
      addSubtitle: vi.fn(),
      removeResource: mockRemoveResource,
      updateResource: vi.fn(),
      isEffectAdded: vi.fn(),
      isFilterAdded: vi.fn(),
      isTransitionAdded: vi.fn(),
      isTemplateAdded: vi.fn(),
      isStyleTemplateAdded: vi.fn(),
      isMusicFileAdded: vi.fn(),
      isSubtitleAdded: vi.fn(),
    });

    renderWithBase(<ResourcesPanel />);

    // Находим и кликаем по фильтру
    const filterElement = screen.getByText("Vintage Filter");
    act(() => {
      act(() => {
        fireEvent.click(filterElement);
      });
    });

    // Проверяем, что addFilter был вызван с правильными параметрами
    expect(mockAddFilter).toHaveBeenCalledWith(mockFilterResources[0]);
  });
});

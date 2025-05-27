import "@testing-library/jest-dom";
import React from "react";

import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

// Мок для HTMLVideoElement - переопределяем прототип
Object.defineProperty(window.HTMLVideoElement.prototype, "play", {
  writable: true,
  value: vi.fn().mockResolvedValue(undefined),
});

Object.defineProperty(window.HTMLVideoElement.prototype, "pause", {
  writable: true,
  value: vi.fn(),
});

Object.defineProperty(window.HTMLVideoElement.prototype, "load", {
  writable: true,
  value: vi.fn(),
});

// Также мокаем HTMLMediaElement для совместимости
Object.defineProperty(window.HTMLMediaElement.prototype, "play", {
  writable: true,
  value: vi.fn().mockResolvedValue(undefined),
});

Object.defineProperty(window.HTMLMediaElement.prototype, "pause", {
  writable: true,
  value: vi.fn(),
});

Object.defineProperty(window.HTMLMediaElement.prototype, "load", {
  writable: true,
  value: vi.fn(),
});

// Не переопределяем document.createElement, так как это ломает jsdom
// Вместо этого моки для HTMLVideoElement уже настроены выше через прототип

// Автоматическая очистка после каждого теста
afterEach(() => {
  cleanup();
});

// Мок для window.matchMedia (расширенный для next-themes)
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // Deprecated but still used by some libraries
    removeListener: vi.fn(), // Deprecated but still used by some libraries
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Мок для next-themes
vi.mock("next-themes", () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) =>
    React.createElement(
      "div",
      { "data-testid": "next-theme-provider" },
      children,
    ),
  useTheme: () => ({
    theme: "light",
    setTheme: vi.fn(),
    resolvedTheme: "light",
    themes: ["light", "dark", "system"],
    systemTheme: "light",
  }),
}));

// Мок для Tauri API
vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi
    .fn()
    .mockImplementation((cmd: string, args?: Record<string, unknown>) => {
      if (cmd === "get_app_language") {
        return Promise.resolve({
          language: "ru",
          system_language: "ru",
        });
      }
      if (cmd === "set_app_language") {
        // Безопасное приведение типа
        const lang = args && "lang" in args ? String(args.lang) : "ru";
        return Promise.resolve({
          language: lang,
          system_language: "ru",
        });
      }
      if (cmd === "file_exists") {
        return Promise.resolve(true);
      }
      if (cmd === "get_file_stats") {
        return Promise.resolve({
          size: 1024,
          lastModified: Date.now(),
        });
      }
      if (cmd === "read_text_file") {
        return Promise.resolve('{"test": "data"}');
      }
      if (cmd === "write_text_file") {
        return Promise.resolve();
      }
      if (cmd === "search_files_by_name") {
        return Promise.resolve([]);
      }
      if (cmd === "get_absolute_path") {
        const path = args && "path" in args ? String(args.path) : "";
        return Promise.resolve(`/absolute${path}`);
      }
      return Promise.resolve(null);
    }),
  // Добавляем мок для convertFileSrc
  convertFileSrc: vi.fn().mockImplementation((path: string) => {
    return `converted-${path}`;
  }),
}));

// Мок для Tauri path API
vi.mock("@tauri-apps/api/path", () => ({
  dirname: vi.fn().mockResolvedValue("/project/dir"),
  basename: vi
    .fn()
    .mockImplementation((path: string) => path.split("/").pop() || ""),
  join: vi.fn().mockImplementation((...paths: string[]) => paths.join("/")),
}));

// Мок для Tauri dialog API
vi.mock("@tauri-apps/plugin-dialog", () => ({
  open: vi.fn().mockResolvedValue(null),
}));

// Мок для Tauri FS API
vi.mock("@tauri-apps/plugin-fs", () => ({
  readTextFile: vi.fn().mockResolvedValue('{"test": "data"}'),
  writeTextFile: vi.fn().mockResolvedValue(undefined),
  readFile: vi.fn().mockImplementation((path: string) => {
    // Создаем фейковые аудио данные для тестирования
    const fakeAudioData = new Uint8Array([
      0x49,
      0x44,
      0x33,
      0x03,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00, // ID3 header
      0xff,
      0xfb,
      0x90,
      0x00, // MP3 frame header
      // Добавляем еще немного данных для реалистичности
      ...Array(100)
        .fill(0)
        .map(() => Math.floor(Math.random() * 256)),
    ]);
    return Promise.resolve(fakeAudioData);
  }),
}));

// Мок для react-hotkeys-hook
vi.mock("react-hotkeys-hook", () => ({
  useHotkeys: vi.fn(),
}));

// Мок для lucide-react
vi.mock("lucide-react", () => {
  const createMockIcon = (name: string) => {
    const MockIcon = React.forwardRef<
      SVGSVGElement,
      React.SVGProps<SVGSVGElement>
    >((props, ref) =>
      React.createElement(
        "svg",
        {
          ...props,
          ref,
          "data-testid": `${name.toLowerCase()}-icon`,
          "data-icon": name,
        },
        name,
      ),
    );
    MockIcon.displayName = `Mock${name}Icon`;
    return MockIcon;
  };

  return {
    AlertTriangle: createMockIcon("AlertTriangle"),
    Blend: createMockIcon("Blend"),
    Bot: createMockIcon("Bot"),
    Check: createMockIcon("Check"),
    CheckIcon: createMockIcon("CheckIcon"),
    ChevronDown: createMockIcon("ChevronDown"),
    ChevronDownIcon: createMockIcon("ChevronDownIcon"),
    ChevronRight: createMockIcon("ChevronRight"),
    ChevronRightIcon: createMockIcon("ChevronRightIcon"),
    ChevronUpIcon: createMockIcon("ChevronUpIcon"),
    CircleIcon: createMockIcon("CircleIcon"),
    CirclePause: createMockIcon("CirclePause"),
    CirclePlay: createMockIcon("CirclePlay"),
    CopyPlus: createMockIcon("CopyPlus"),
    Eye: createMockIcon("Eye"),
    EyeOff: createMockIcon("EyeOff"),
    File: createMockIcon("File"),
    FileText: createMockIcon("FileText"),
    Film: createMockIcon("Film"),
    Filter: createMockIcon("Filter"),
    FlipHorizontal2: createMockIcon("FlipHorizontal2"),
    Folder: createMockIcon("Folder"),
    FolderOpen: createMockIcon("FolderOpen"),
    Grid: createMockIcon("Grid"),
    Grid2x2: createMockIcon("Grid2x2"),
    Grid2X2: createMockIcon("Grid2X2"),
    GripVerticalIcon: createMockIcon("GripVerticalIcon"),
    Image: createMockIcon("Image"),
    Info: createMockIcon("Info"),
    LayoutDashboard: createMockIcon("LayoutDashboard"),
    LayoutTemplate: createMockIcon("LayoutTemplate"),
    List: createMockIcon("List"),
    Loader2: createMockIcon("Loader2"),
    Lock: createMockIcon("Lock"),
    Mic: createMockIcon("Mic"),
    Minus: createMockIcon("Minus"),
    Moon: createMockIcon("Moon"),
    MoveHorizontal: createMockIcon("MoveHorizontal"),
    Music: createMockIcon("Music"),
    Package: createMockIcon("Package"),
    Palette: createMockIcon("Palette"),
    PanelLeftClose: createMockIcon("PanelLeftClose"),
    PanelLeftOpen: createMockIcon("PanelLeftOpen"),
    Pause: createMockIcon("Pause"),
    Play: createMockIcon("Play"),
    Plus: createMockIcon("Plus"),
    Redo2: createMockIcon("Redo2"),
    RefreshCw: createMockIcon("RefreshCw"),
    RotateCcw: createMockIcon("RotateCcw"),
    Save: createMockIcon("Save"),
    Scissors: createMockIcon("Scissors"),
    SquareMousePointer: createMockIcon("SquareMousePointer"),
    Search: createMockIcon("Search"),
    Send: createMockIcon("Send"),
    SendHorizonal: createMockIcon("SendHorizonal"),
    Settings: createMockIcon("Settings"),
    Sparkles: createMockIcon("Sparkles"),
    Square: createMockIcon("Square"),
    Star: createMockIcon("Star"),
    Sticker: createMockIcon("Sticker"),
    StopCircle: createMockIcon("StopCircle"),
    Subtitles: createMockIcon("Subtitles"),
    Sun: createMockIcon("Sun"),
    Trash2: createMockIcon("Trash2"),
    Type: createMockIcon("Type"),
    Undo2: createMockIcon("Undo2"),
    Unlock: createMockIcon("Unlock"),
    Upload: createMockIcon("Upload"),
    User: createMockIcon("User"),
    Video: createMockIcon("Video"),
    Volume2: createMockIcon("Volume2"),
    VolumeX: createMockIcon("VolumeX"),
    X: createMockIcon("X"),
    XIcon: createMockIcon("XIcon"),
  };
});

// Мок для useAutoLoadUserData
vi.mock("@/hooks/use-auto-load-user-data", () => ({
  useAutoLoadUserData: () => ({
    isLoading: false,
    loadedData: {
      effects: [],
      transitions: [],
      filters: [],
      subtitles: [],
      templates: [],
      styleTemplates: [],
    },
    error: null,
    reload: vi.fn(),
  }),
}));

// Мок для useCurrentProject
vi.mock("@/features/app-state/hooks/use-current-project", () => ({
  useCurrentProject: () => ({
    currentProject: {
      id: "test-project",
      name: "Test Project",
      path: "/test/project",
      isDirty: false,
      isNew: false,
    },
    openProject: vi.fn(),
    saveProject: vi.fn(),
    setProjectDirty: vi.fn(),
  }),
}));

// Общие моки для шаблонов
vi.mock("@/features/templates/lib/templates", () => ({
  TEMPLATE_MAP: {
    landscape: [
      {
        id: "split-vertical-landscape",
        split: "vertical",
        resizable: true,
        screens: 2,
        splitPosition: 50,
        render: () => ({
          type: "div",
          props: {
            "data-testid": "template-vertical",
            children: "Vertical Split",
          },
        }),
      },
      {
        id: "split-horizontal-landscape",
        split: "horizontal",
        resizable: true,
        screens: 2,
        splitPosition: 50,
        render: () => ({
          type: "div",
          props: {
            "data-testid": "template-horizontal",
            children: "Horizontal Split",
          },
        }),
      },
      {
        id: "split-grid-2x2-landscape",
        split: "grid",
        resizable: true,
        screens: 4,
        render: () => ({
          type: "div",
          props: { "data-testid": "template-grid", children: "Grid 2x2" },
        }),
      },
    ],
    portrait: [
      {
        id: "split-vertical-portrait",
        split: "vertical",
        resizable: true,
        screens: 2,
        splitPosition: 50,
        render: () => ({
          type: "div",
          props: {
            "data-testid": "template-vertical-portrait",
            children: "Vertical Split Portrait",
          },
        }),
      },
    ],
    square: [
      {
        id: "split-grid-2x2-square",
        split: "grid",
        resizable: true,
        screens: 4,
        render: () => ({
          type: "div",
          props: {
            "data-testid": "template-grid-square",
            children: "Grid 2x2 Square",
          },
        }),
      },
    ],
  },
  getTemplatesByAspectRatio: vi
    .fn()
    .mockImplementation((aspectRatio: string) => {
      const templates = {
        "16:9": [
          {
            id: "split-vertical-landscape",
            split: "vertical",
            resizable: true,
            screens: 2,
            splitPosition: 50,
          },
        ],
        "9:16": [
          {
            id: "split-vertical-portrait",
            split: "vertical",
            resizable: true,
            screens: 2,
            splitPosition: 50,
          },
        ],
        "1:1": [
          {
            id: "split-grid-2x2-square",
            split: "grid",
            resizable: true,
            screens: 4,
          },
        ],
      };
      return templates[aspectRatio as keyof typeof templates] || [];
    }),
}));

// Мок для template labels
vi.mock("@/features/templates/lib/template-labels", () => ({
  getTemplateLabels: vi.fn().mockImplementation((templateId: string) => {
    const labels: Record<string, string> = {
      "split-vertical-landscape": "Вертикальное разделение",
      "split-horizontal-landscape": "Горизонтальное разделение",
      "split-grid-2x2-landscape": "Сетка 2x2",
      "split-vertical-portrait": "Вертикальное разделение (портрет)",
      "split-grid-2x2-square": "Сетка 2x2 (квадрат)",
    };
    return labels[templateId] || templateId;
  }),
  getTemplateDescription: vi.fn().mockImplementation((templateId: string) => {
    const descriptions: Record<string, string> = {
      "split-vertical-landscape": "Разделяет экран вертикально на две части",
      "split-horizontal-landscape":
        "Разделяет экран горизонтально на две части",
      "split-grid-2x2-landscape": "Создает сетку 2x2 для четырех видео",
      "split-vertical-portrait":
        "Вертикальное разделение для портретного режима",
      "split-grid-2x2-square": "Сетка 2x2 для квадратного формата",
    };
    return descriptions[templateId] || `Описание для ${templateId}`;
  }),
}));

// Общие моки для компонентов шаблонов
vi.mock("@/components/common/content-group", () => ({
  ContentGroup: ({ items, renderItem, title }: any) =>
    React.createElement(
      "div",
      { "data-testid": "content-group" },
      title &&
        React.createElement(
          "h3",
          { "data-testid": "content-group-title" },
          title,
        ),
      React.createElement(
        "div",
        { "data-testid": "content-group-items" },
        items.map((item: any, index: number) =>
          React.createElement(
            "div",
            { key: item.id, "data-testid": `group-item-${item.id}` },
            renderItem(item, index),
          ),
        ),
      ),
    ),
}));

vi.mock("@/features/browser/components/layout", () => ({
  FavoriteButton: ({ file, size, type }: any) =>
    React.createElement(
      "div",
      {
        "data-testid": "favorite-button",
        "data-file-id": file.id,
        "data-size": size,
        "data-type": type,
      },
      "Favorite Button",
    ),
  AddMediaButton: ({ file, onAddMedia, onRemoveMedia, isAdded, size }: any) =>
    React.createElement(
      "div",
      {
        "data-testid": "add-media-button",
        "data-file-id": file.id,
        "data-is-added": isAdded ? "true" : "false",
        "data-size": size,
        onClick: (e: any) =>
          isAdded ? onRemoveMedia(e, file) : onAddMedia(e, file),
      },
      isAdded ? "Remove Media" : "Add Media",
    ),
}));

// Моки для компонентов шаблонов
vi.mock("@/features/templates/components/templates/custom", () => ({
  SplitVertical: ({ videos, activeVideoId }: any) =>
    React.createElement(
      "div",
      { "data-testid": "split-vertical" },
      videos.map((video: any, index: number) =>
        React.createElement(
          "div",
          {
            key: video.id,
            "data-testid": `video-panel-${index + 1}`,
            "data-video-id": video.id,
            "data-is-active": activeVideoId === video.id,
          },
          `Video Panel ${index + 1}`,
        ),
      ),
    ),
  SplitHorizontal: ({ videos, activeVideoId }: any) =>
    React.createElement(
      "div",
      { "data-testid": "split-horizontal" },
      videos.map((video: any, index: number) =>
        React.createElement(
          "div",
          {
            key: video.id,
            "data-testid": `video-panel-${index + 1}`,
            "data-video-id": video.id,
            "data-is-active": activeVideoId === video.id,
          },
          `Video Panel ${index + 1}`,
        ),
      ),
    ),
  SplitVertical3: ({ videos, activeVideoId }: any) =>
    React.createElement(
      "div",
      { "data-testid": "split-vertical-3" },
      videos.slice(0, 3).map((video: any, index: number) =>
        React.createElement(
          "div",
          {
            key: video.id,
            "data-testid": `video-panel-${index + 1}`,
            "data-video-id": video.id,
            "data-is-active": activeVideoId === video.id,
          },
          `Video Panel ${index + 1}`,
        ),
      ),
    ),
  SplitVertical4: ({ videos, activeVideoId }: any) =>
    React.createElement(
      "div",
      { "data-testid": "split-vertical-4" },
      videos.slice(0, 4).map((video: any, index: number) =>
        React.createElement(
          "div",
          {
            key: video.id,
            "data-testid": `video-panel-${index + 1}`,
            "data-video-id": video.id,
            "data-is-active": activeVideoId === video.id,
          },
          `Video Panel ${index + 1}`,
        ),
      ),
    ),
  SplitHorizontal4: ({ videos, activeVideoId }: any) =>
    React.createElement(
      "div",
      { "data-testid": "split-horizontal-4" },
      videos.slice(0, 4).map((video: any, index: number) =>
        React.createElement(
          "div",
          {
            key: video.id,
            "data-testid": `video-panel-${index + 1}`,
            "data-video-id": video.id,
            "data-is-active": activeVideoId === video.id,
          },
          `Video Panel ${index + 1}`,
        ),
      ),
    ),
}));

// Моки для grid шаблонов
vi.mock("@/features/templates/components/templates/grid", () => ({
  SplitGrid2x2: ({ videos, activeVideoId }: any) =>
    React.createElement(
      "div",
      { "data-testid": "split-grid-2x2" },
      videos.slice(0, 4).map((video: any, index: number) =>
        React.createElement(
          "div",
          {
            key: video.id,
            "data-testid": `video-panel-${index + 1}`,
            "data-video-id": video.id,
            "data-is-active": activeVideoId === video.id,
          },
          `Video Panel ${index + 1}`,
        ),
      ),
    ),
  SplitGrid2x3: ({ videos, activeVideoId }: any) =>
    React.createElement(
      "div",
      { "data-testid": "split-grid-2x3" },
      videos.slice(0, 6).map((video: any, index: number) =>
        React.createElement(
          "div",
          {
            key: video.id,
            "data-testid": `video-panel-${index + 1}`,
            "data-video-id": video.id,
            "data-is-active": activeVideoId === video.id,
          },
          `Video Panel ${index + 1}`,
        ),
      ),
    ),
  SplitGrid3x2: ({ videos, activeVideoId }: any) =>
    React.createElement(
      "div",
      { "data-testid": "split-grid-3x2" },
      videos.slice(0, 6).map((video: any, index: number) =>
        React.createElement(
          "div",
          {
            key: video.id,
            "data-testid": `video-panel-${index + 1}`,
            "data-video-id": video.id,
            "data-is-active": activeVideoId === video.id,
          },
          `Video Panel ${index + 1}`,
        ),
      ),
    ),
  SplitGrid3x3: ({ videos, activeVideoId }: any) =>
    React.createElement(
      "div",
      { "data-testid": "split-grid-3x3" },
      videos.slice(0, 9).map((video: any, index: number) =>
        React.createElement(
          "div",
          {
            key: video.id,
            "data-testid": `video-panel-${index + 1}`,
            "data-video-id": video.id,
            "data-is-active": activeVideoId === video.id,
          },
          `Video Panel ${index + 1}`,
        ),
      ),
    ),
  SplitGrid3x4: ({ videos, activeVideoId }: any) =>
    React.createElement("div", { "data-testid": "split-grid-3x4" }, "Grid 3x4"),
  SplitGrid4x2: ({ videos, activeVideoId }: any) =>
    React.createElement("div", { "data-testid": "split-grid-4x2" }, "Grid 4x2"),
  SplitGrid4x3: ({ videos, activeVideoId }: any) =>
    React.createElement("div", { "data-testid": "split-grid-4x3" }, "Grid 4x3"),
  SplitGrid4x4: ({ videos, activeVideoId }: any) =>
    React.createElement("div", { "data-testid": "split-grid-4x4" }, "Grid 4x4"),
  SplitGrid5x2: ({ videos, activeVideoId }: any) =>
    React.createElement("div", { "data-testid": "split-grid-5x2" }, "Grid 5x2"),
  SplitGrid5x5: ({ videos, activeVideoId }: any) =>
    React.createElement("div", { "data-testid": "split-grid-5x5" }, "Grid 5x5"),
}));

// Моки для landscape шаблонов
vi.mock("@/features/templates/components/templates/landscape", () => ({
  Split13BottomLandscape: ({ videos, activeVideoId }: any) =>
    React.createElement(
      "div",
      { "data-testid": "split-1-3-bottom-landscape" },
      "1-3 Bottom",
    ),
  Split13Landscape: ({ videos, activeVideoId }: any) =>
    React.createElement(
      "div",
      { "data-testid": "split-1-3-landscape" },
      "1-3 Landscape",
    ),
  Split31BottomLandscape: ({ videos, activeVideoId }: any) =>
    React.createElement(
      "div",
      { "data-testid": "split-3-1-bottom-landscape" },
      "3-1 Bottom",
    ),
  Split31RightLandscape: ({ videos, activeVideoId }: any) =>
    React.createElement(
      "div",
      { "data-testid": "split-3-1-right-landscape" },
      "3-1 Right",
    ),
  SplitCustom51Landscape: ({ videos, activeVideoId }: any) =>
    React.createElement(
      "div",
      { "data-testid": "split-custom-5-1-landscape" },
      "Custom 5-1",
    ),
  SplitCustom52Landscape: ({ videos, activeVideoId }: any) =>
    React.createElement(
      "div",
      { "data-testid": "split-custom-5-2-landscape" },
      "Custom 5-2",
    ),
  SplitCustom53Landscape: ({ videos, activeVideoId }: any) =>
    React.createElement(
      "div",
      { "data-testid": "split-custom-5-3-landscape" },
      "Custom 5-3",
    ),
  SplitDiagonalLandscape: ({ videos, activeVideoId }: any) =>
    React.createElement(
      "div",
      { "data-testid": "split-diagonal-landscape" },
      "Diagonal",
    ),
  SplitHorizontal3Landscape: ({ videos, activeVideoId }: any) =>
    React.createElement(
      "div",
      { "data-testid": "split-horizontal-3-landscape" },
      "Horizontal 3",
    ),
  SplitMixed1Landscape: ({ videos, activeVideoId }: any) =>
    React.createElement(
      "div",
      { "data-testid": "split-mixed-1-landscape" },
      "Mixed 1",
    ),
  SplitMixed2Landscape: ({ videos, activeVideoId }: any) =>
    React.createElement(
      "div",
      { "data-testid": "split-mixed-2-landscape" },
      "Mixed 2",
    ),
}));

// Моки для portrait шаблонов
vi.mock("@/features/templates/components/templates/portrait", () => ({
  SplitCustom51Portrait: ({ videos, activeVideoId }: any) =>
    React.createElement(
      "div",
      { "data-testid": "split-custom-5-1-portrait" },
      "Custom 5-1 Portrait",
    ),
  SplitCustom52Portrait: ({ videos, activeVideoId }: any) =>
    React.createElement(
      "div",
      { "data-testid": "split-custom-5-2-portrait" },
      "Custom 5-2 Portrait",
    ),
  SplitCustom53Portrait: ({ videos, activeVideoId }: any) =>
    React.createElement(
      "div",
      { "data-testid": "split-custom-5-3-portrait" },
      "Custom 5-3 Portrait",
    ),
}));

// Мок для useUserSettings
vi.mock("@/features/user-settings", () => ({
  useUserSettings: () => ({
    activeTab: "media",
    layoutMode: "default",
    screenshotsPath: "public/screenshots",
    playerScreenshotsPath: "public/media",
    playerVolume: 100,
    openAiApiKey: "",
    claudeApiKey: "",
    isBrowserVisible: true,
    handleTabChange: vi.fn(),
    handleLayoutChange: vi.fn(),
    handleScreenshotsPathChange: vi.fn(),
    handlePlayerScreenshotsPathChange: vi.fn(),
    handlePlayerVolumeChange: vi.fn(),
    handleAiApiKeyChange: vi.fn(),
    handleClaudeApiKeyChange: vi.fn(),
    toggleBrowserVisibility: vi.fn(),
  }),
  UserSettingsProvider: ({ children }: { children: React.ReactNode }) =>
    children,
}));

// Мок для browser-state-provider
const mockSetPreviewSize = vi.fn();

vi.mock("@/components/common/browser-state-provider", () => ({
  useBrowserState: () => ({
    state: {
      activeTab: "media",
      tabSettings: {
        media: {
          searchQuery: "",
          showFavoritesOnly: false,
          sortBy: "name",
          sortOrder: "asc",
          groupBy: "none",
          filterType: "all",
          viewMode: "thumbnails",
          previewSizeIndex: 2,
        },
      },
    },
    activeTab: "media",
    currentTabSettings: {
      searchQuery: "",
      showFavoritesOnly: false,
      sortBy: "name",
      sortOrder: "asc",
      groupBy: "none",
      filterType: "all",
      viewMode: "thumbnails",
      previewSizeIndex: 2,
    },
    previewSize: 150,
    switchTab: vi.fn(),
    setSearchQuery: vi.fn(),
    toggleFavorites: vi.fn(),
    setSort: vi.fn(),
    setGroupBy: vi.fn(),
    setFilter: vi.fn(),
    setViewMode: vi.fn(),
    setPreviewSize: mockSetPreviewSize,
    resetTabSettings: vi.fn(),
    // Добавляем методы для увеличения/уменьшения размера
    increaseSize: vi.fn(),
    decreaseSize: vi.fn(),
    canIncreaseSize: true,
    canDecreaseSize: true,
  }),
  BrowserStateProvider: ({ children }: { children: React.ReactNode }) =>
    children,
  PREVIEW_SIZES: [100, 125, 150, 200, 250, 300, 400],
}));

// Мок для project-settings-provider
vi.mock("@/features/project-settings/hooks/use-project-settings", () => ({
  useProjectSettings: () => ({
    settings: {
      fps: { value: 30 },
      width: { value: 1920 },
      height: { value: 1080 },
      aspectRatio: {
        value: {
          width: 1920,
          height: 1080,
        },
      },
      sampleRate: { value: 44100 },
      channels: { value: 2 },
      bitrate: { value: 128 },
      frameRate: "30",
      colorSpace: "srgb",
      resolution: "1920x1080",
    },
    projectSettings: {
      videoSettings: {
        fps: 30,
        width: 1920,
        height: 1080,
        aspectRatio: "16:9",
      },
      audioSettings: {
        sampleRate: 44100,
        channels: 2,
        bitrate: 128,
      },
    },
    updateSettings: vi.fn(),
    updateProjectSettings: vi.fn(),
    resetSettings: vi.fn(),
    resetProjectSettings: vi.fn(),
  }),
}));

// Мок для resources provider
vi.mock("@/features/resources", () => ({
  useResources: () => ({
    resources: [],
    effectResources: [],
    filterResources: [],
    transitionResources: [],
    templateResources: [],
    styleTemplateResources: [],
    musicResources: [],
    subtitleResources: [],
    addEffect: vi.fn(),
    addFilter: vi.fn(),
    addTransition: vi.fn(),
    addTemplate: vi.fn(),
    addStyleTemplate: vi.fn(),
    addMusic: vi.fn(),
    addSubtitle: vi.fn(),
    removeResource: vi.fn(),
    updateResource: vi.fn(),
    isEffectAdded: vi.fn().mockReturnValue(false),
    isFilterAdded: vi.fn().mockReturnValue(false),
    isTransitionAdded: vi.fn().mockReturnValue(false),
    isTemplateAdded: vi.fn().mockReturnValue(false),
    isStyleTemplateAdded: vi.fn().mockReturnValue(false),
    isMusicFileAdded: vi.fn().mockReturnValue(false),
    isSubtitleAdded: vi.fn().mockReturnValue(false),
  }),
  ResourcesProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// Мок для MediaProvider
vi.mock("@/features/browser/media", () => ({
  useMedia: () => ({
    mediaFiles: [],
    addMediaFiles: vi.fn(),
    updateMediaFile: vi.fn(),
    removeMediaFile: vi.fn(),
    getMediaFile: vi.fn(),
    isItemFavorite: vi.fn().mockReturnValue(false),
    addToFavorites: vi.fn(),
    removeFromFavorites: vi.fn(),
    isFileAdded: vi.fn().mockReturnValue(false),
  }),
  MediaProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// Мок для PlayerProvider
vi.mock("@/features/video-player/services/player-provider", () => ({
  usePlayer: () => ({
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 1,
    isMuted: false,
    playbackRate: 1,
    play: vi.fn(),
    pause: vi.fn(),
    seek: vi.fn(),
    setVolume: vi.fn(),
    toggleMute: vi.fn(),
    setPlaybackRate: vi.fn(),
    reset: vi.fn(),
  }),
  PlayerProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// Мок для useModal
vi.mock("@/features/modals/services/modal-provider", () => ({
  useModal: () => ({
    modalType: "none",
    modalData: null,
    isOpen: false,
    openModal: vi.fn(),
    closeModal: vi.fn(),
    submitModal: vi.fn(),
  }),
  ModalProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// Мок для ChatProvider (AI Chat)
vi.mock("@/features/ai-chat/services/chat-provider", () => ({
  useChat: () => ({
    chatMessages: [],
    selectedAgentId: null,
    isProcessing: false,
    error: null,
    sendChatMessage: vi.fn(),
    receiveChatMessage: vi.fn(),
    selectAgent: vi.fn(),
    setProcessing: vi.fn(),
    setError: vi.fn(),
    clearMessages: vi.fn(),
    removeMessage: vi.fn(),
  }),
  ChatProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// Мок для TopBar
vi.mock("@/features/top-bar/components/top-bar", () => ({
  TopBar: ({
    layoutMode = "default",
    onLayoutChange = (layoutMode: any) => {},
  } = {}) => {
    return React.createElement(
      "div",
      { "data-testid": "top-bar" },
      // Добавляем все необходимые data-testid атрибуты
      React.createElement(
        "span",
        { "data-testid": "current-layout" },
        layoutMode,
      ),
      React.createElement(
        "button",
        {
          "data-testid": "change-layout-default",
          onClick: () => onLayoutChange("default"),
        },
        "Default",
      ),
      React.createElement(
        "button",
        {
          "data-testid": "change-layout-options",
          onClick: () => onLayoutChange("options"),
        },
        "Options",
      ),
      React.createElement(
        "button",
        {
          "data-testid": "change-layout-vertical",
          onClick: () => onLayoutChange("vertical"),
        },
        "Vertical",
      ),
      React.createElement(
        "button",
        {
          "data-testid": "change-layout-dual",
          onClick: () => onLayoutChange("dual"),
        },
        "Dual",
      ),
      // Добавляем дополнительные кнопки с data-testid
      React.createElement(
        "button",
        { "data-testid": "layout-button" },
        "Layout",
      ),
      React.createElement(
        "div",
        { "data-testid": "theme-toggle" },
        "Theme Toggle",
      ),
      React.createElement(
        "button",
        { "data-testid": "keyboard-shortcuts-button" },
        "Keyboard Shortcuts",
      ),
      React.createElement(
        "button",
        { "data-testid": "project-settings-button" },
        "Project Settings",
      ),
      React.createElement("button", { "data-testid": "save-button" }, "Save"),
      React.createElement(
        "button",
        { "data-testid": "camera-capture-button" },
        "Camera Capture",
      ),
      React.createElement(
        "button",
        { "data-testid": "voice-recording-button" },
        "Voice Recording",
      ),
      React.createElement(
        "button",
        { "data-testid": "publish-button" },
        "Publish",
      ),
      React.createElement(
        "button",
        { "data-testid": "editing-tasks-button" },
        "Editing Tasks",
      ),
      React.createElement(
        "button",
        { "data-testid": "user-settings-button" },
        "User Settings",
      ),
      React.createElement(
        "button",
        { "data-testid": "export-button" },
        "Export",
      ),
    );
  },
}));

// Мок для layouts
vi.mock("@/features/media-studio/layouts", () => ({
  DefaultLayout: () =>
    React.createElement(
      "div",
      { "data-testid": "default-layout" },
      "Default Layout",
    ),
  OptionsLayout: () =>
    React.createElement(
      "div",
      { "data-testid": "options-layout" },
      "Options Layout",
    ),
  VerticalLayout: () =>
    React.createElement(
      "div",
      { "data-testid": "vertical-layout" },
      "Vertical Layout",
    ),
  DualLayout: () =>
    React.createElement("div", { "data-testid": "dual-layout" }, "Dual Layout"),
  LayoutMode: {
    DEFAULT: "default",
    OPTIONS: "options",
    VERTICAL: "vertical",
    DUAL: "dual",
  },
  LayoutPreviews: ({
    onLayoutChange = (layout: string) => {},
    layoutMode = "default",
  } = {}) => {
    return React.createElement(
      "div",
      { "data-testid": "layout-previews" },
      React.createElement(
        "span",
        { "data-testid": "current-layout" },
        layoutMode,
      ),
      React.createElement(
        "button",
        {
          "data-testid": "change-layout-default",
          onClick: () => onLayoutChange("default"),
        },
        "Default",
      ),
      React.createElement(
        "button",
        {
          "data-testid": "change-layout-options",
          onClick: () => onLayoutChange("options"),
        },
        "Options",
      ),
    );
  },
}));

// Мок для ModalContainer
vi.mock("@/features/modals/components", () => ({
  ModalContainer: () =>
    React.createElement(
      "div",
      { "data-testid": "modal-container" },
      "Modal Container",
    ),
}));

// Мок для i18next
vi.mock("i18next", () => {
  const i18n = {
    use: vi.fn().mockReturnThis(),
    init: vi.fn(),
    on: vi.fn(),
    off: vi.fn(), // Добавляем метод off
    t: (key: string) => key,
    changeLanguage: vi.fn(),
    language: "ru",
  };
  return { default: i18n };
});

// Мок для react-i18next
vi.mock("react-i18next", () => ({
  // Этот мок заменяет хук useTranslation
  useTranslation: () => {
    return {
      t: (key: string) => key, // Просто возвращаем ключ перевода как есть
      i18n: {
        changeLanguage: vi.fn(),
        language: "ru",
      },
    };
  },
  // Добавляем initReactI18next
  initReactI18next: {
    type: "3rdParty",
    init: vi.fn(),
  },
  // Добавляем I18nextProvider
  I18nextProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// Мок для I18nProvider
vi.mock("@/i18n/i18n-provider", () => ({
  I18nProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// Мок для resizable компонентов
vi.mock("@/components/ui/resizable", () => ({
  ResizablePanelGroup: ({
    children,
    direction,
    className,
    autoSaveId,
  }: {
    children: React.ReactNode;
    direction: string;
    className?: string;
    autoSaveId?: string;
  }) =>
    React.createElement(
      "div",
      {
        "data-testid": `resizable-panel-group-${autoSaveId}`,
        "data-direction": direction,
        className,
      },
      children,
    ),
  ResizablePanel: ({
    children,
    defaultSize,
    minSize,
    maxSize,
  }: {
    children: React.ReactNode;
    defaultSize?: number;
    minSize?: number;
    maxSize?: number;
  }) =>
    React.createElement(
      "div",
      {
        "data-testid": "resizable-panel",
        "data-default-size": defaultSize?.toString(),
        "data-min-size": minSize?.toString(),
        "data-max-size": maxSize?.toString(),
      },
      children,
    ),
  ResizableHandle: () =>
    React.createElement("div", { "data-testid": "resizable-handle" }),
}));

// Моки для компонентов, используемых в layouts
vi.mock("@/features/browser/components/browser", () => ({
  Browser: () =>
    React.createElement("div", { "data-testid": "browser" }, "Browser"),
}));

vi.mock("@/features/options/components/options", () => ({
  Options: () =>
    React.createElement("div", { "data-testid": "options" }, "Options"),
}));

vi.mock("@/features/timeline/components/timeline", () => ({
  Timeline: () =>
    React.createElement("div", { "data-testid": "timeline" }, "Timeline"),
}));

vi.mock("@/features/video-player/components/video-player", () => ({
  VideoPlayer: () =>
    React.createElement(
      "div",
      { "data-testid": "video-player" },
      "Video Player",
    ),
}));

// Мок для MediaGroup
vi.mock("@/features/media/components/media-group", () => ({
  MediaGroup: ({
    title,
    files,
    viewMode,
    previewSize,
    addFilesToTimeline,
  }: {
    title: string;
    files: any[];
    viewMode: string;
    previewSize: number;
    addFilesToTimeline: (files: any[]) => void;
  }) =>
    React.createElement(
      "div",
      {
        "data-testid": "media-group",
        "data-title": title,
        "data-files-count": files.length,
        "data-view-mode": viewMode,
        "data-preview-size": previewSize,
        onClick: () => addFilesToTimeline(files),
      },
      `Media Group: ${title ?? "Untitled"}`,
    ),
}));

// Мок для dayjs
vi.mock("dayjs", () => {
  const mockDayjs = (date?: any) => ({
    utc: () => ({
      tz: () => ({
        format: (format?: string) => {
          if (format === "HH:mm:ss.SSS") return "00:01:23.456";
          return "2023-01-01T00:01:23.456Z";
        },
        hour: () => 0,
        minute: () => 1,
        second: () => 23,
        millisecond: () => 456,
      }),
    }),
    format: (format?: string) => {
      if (format === "HH:mm:ss.SSS") return "00:01:23.456";
      return "2023-01-01T00:01:23.456Z";
    },
    hour: () => 0,
    minute: () => 1,
    second: () => 23,
    millisecond: () => 456,
  });

  mockDayjs.tz = {
    guess: () => "UTC",
  };

  return { default: mockDayjs };
});

// Мок для localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      // Используем присвоение undefined вместо delete
      store = Object.fromEntries(
        Object.entries(store).filter(([k]) => k !== key),
      );
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
});

// Моки для Web Audio API
global.AudioContext = vi.fn().mockImplementation(() => ({
  createMediaElementSource: vi.fn().mockReturnValue({
    connect: vi.fn(),
    disconnect: vi.fn(),
  }),
  createMediaStreamDestination: vi.fn().mockReturnValue({
    stream: new MediaStream(),
  }),
  destination: {},
  close: vi.fn().mockResolvedValue(undefined),
  state: "running",
  sampleRate: 44100,
}));

const MockMediaRecorder = vi.fn().mockImplementation(() => ({
  start: vi.fn(),
  stop: vi.fn(),
  pause: vi.fn(),
  resume: vi.fn(),
  state: "inactive",
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
})) as any;

// Добавляем статический метод isTypeSupported
MockMediaRecorder.isTypeSupported = vi.fn().mockReturnValue(true);

global.MediaRecorder = MockMediaRecorder;

// Мок для MediaStream
global.MediaStream = vi.fn().mockImplementation(() => ({
  getTracks: vi.fn().mockReturnValue([]),
  getAudioTracks: vi.fn().mockReturnValue([]),
  getVideoTracks: vi.fn().mockReturnValue([]),
  addTrack: vi.fn(),
  removeTrack: vi.fn(),
  clone: vi.fn(),
  active: true,
  id: "mock-stream-id",
}));

// Мок для URL.createObjectURL и URL.revokeObjectURL
global.URL.createObjectURL = vi.fn().mockImplementation(() => {
  return `blob:mock-url-${Math.random().toString(36).substring(2, 11)}`;
});

global.URL.revokeObjectURL = vi.fn();

// Мок для navigator.clipboard
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn(),
  },
});

// Мок для MediaStudio
vi.mock("@/features/media-studio/media-studio", () => {
  // Создаем состояние для хранения текущего layoutMode
  let currentLayoutMode = "default";

  return {
    MediaStudio: () => {
      return React.createElement(
        "div",
        { "data-testid": "media-studio" },
        // TopBar с возможностью изменения layoutMode
        React.createElement(
          "div",
          { "data-testid": "top-bar" },
          React.createElement(
            "span",
            { "data-testid": "current-layout" },
            currentLayoutMode,
          ),
          React.createElement(
            "button",
            {
              "data-testid": "change-layout-default",
              onClick: () => {
                currentLayoutMode = "default";
              },
            },
            "Default",
          ),
          React.createElement(
            "button",
            {
              "data-testid": "change-layout-options",
              onClick: () => {
                currentLayoutMode = "options";
              },
            },
            "Options",
          ),
          React.createElement(
            "button",
            {
              "data-testid": "change-layout-vertical",
              onClick: () => {
                currentLayoutMode = "vertical";
              },
            },
            "Vertical",
          ),
          React.createElement(
            "button",
            {
              "data-testid": "change-layout-dual",
              onClick: () => {
                currentLayoutMode = "dual";
              },
            },
            "Dual",
          ),
        ),
        // Отображаем соответствующий layout в зависимости от currentLayoutMode
        currentLayoutMode === "default" &&
          React.createElement(
            "div",
            { "data-testid": "default-layout" },
            "Default Layout",
          ),
        currentLayoutMode === "options" &&
          React.createElement(
            "div",
            { "data-testid": "options-layout" },
            "Options Layout",
          ),
        currentLayoutMode === "vertical" &&
          React.createElement(
            "div",
            { "data-testid": "vertical-layout" },
            "Vertical Layout",
          ),
        currentLayoutMode === "dual" &&
          React.createElement(
            "div",
            { "data-testid": "dual-layout" },
            "Dual Layout",
          ),
        // ModalContainer
        React.createElement(
          "div",
          { "data-testid": "modal-container" },
          "Modal Container",
        ),
      );
    },
  };
});

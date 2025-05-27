import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useAppSettings } from "../../hooks";
import { AppSettingsProvider } from "../../services";

// Мокаем диалоги Tauri
vi.mock("@tauri-apps/plugin-dialog", () => ({
  open: vi.fn().mockResolvedValue("/path/to/project.tlsp"),
  save: vi.fn().mockResolvedValue("/path/to/saved/project.tlsp"),
}));

// Мокаем path из Tauri
vi.mock("@tauri-apps/api/path", () => ({
  basename: vi.fn().mockImplementation(async (path) => {
    const parts = path.split("/");
    return parts[parts.length - 1];
  }),
  appDataDir: vi.fn().mockResolvedValue("/app/data/dir"),
  join: vi.fn().mockImplementation(async (dir, file) => `${dir}/${file}`),
}));

// Мокаем машину состояний
vi.mock("../../services/app-settings-machine", () => {
  return {
    AppSettingsContext: vi.fn(),
    appSettingsMachine: {
      id: "appSettings",
      initial: "idle",
      context: {
        userSettings: {
          previewSizes: {
            MEDIA: 100,
            TRANSITIONS: 100,
            TEMPLATES: 125,
            EFFECTS: 100,
            FILTERS: 100,
            SUBTITLES: 100,
            STYLE_TEMPLATES: 125,
            MUSIC: 100,
          },
          activeTab: "media",
          layoutMode: "default",
          screenshotsPath: "",
          playerScreenshotsPath: "",
          openAiApiKey: "",
          claudeApiKey: "",
          isBrowserVisible: true,
          isLoaded: true,
        },
        recentProjects: [],
        currentProject: {
          path: null,
          name: "Новый проект",
          isDirty: false,
          isNew: true,
        },
        favorites: {
          media: [],
          audio: [],
          transition: [],
          effect: [],
          template: [],
          filter: [],
          subtitle: [],
        },
        mediaFiles: {
          allMediaFiles: [],
          error: null,
          isLoading: false,
        },
        isLoading: false,
        error: null,
      },
    },
  };
});

// Мокаем useMachine из XState
const mockSend = vi.fn();
const mockState = {
  context: {
    userSettings: {
      previewSizes: {
        MEDIA: 100,
        TRANSITIONS: 100,
        TEMPLATES: 125,
        EFFECTS: 100,
        FILTERS: 100,
        SUBTITLES: 100,
        STYLE_TEMPLATES: 125,
        MUSIC: 100,
      },
      activeTab: "media",
      layoutMode: "default",
      screenshotsPath: "",
      playerScreenshotsPath: "",
      openAiApiKey: "",
      claudeApiKey: "",
      isBrowserVisible: true,
      isLoaded: true,
    },
    recentProjects: [],
    currentProject: {
      path: null,
      name: "Новый проект",
      isDirty: false,
      isNew: true,
    },
    favorites: {
      media: [],
      audio: [],
      transition: [],
      effect: [],
      template: [],
      filter: [],
      subtitle: [],
    },
    mediaFiles: {
      allMediaFiles: [],
      error: null,
      isLoading: false,
    },
    isLoading: false,
    error: null,
  },
  matches: vi.fn((state) => state === "idle"),
  can: vi.fn(() => true),
};

vi.mock("@xstate/react", () => {
  return {
    useMachine: vi.fn(() => [mockState, mockSend, { send: mockSend }]),
  };
});

// Компонент для тестирования хука useAppSettings
const TestComponent = () => {
  const context = useAppSettings();
  const { createNewProject, openProject, saveProject, setProjectDirty } =
    context;

  // Получаем данные через геттеры
  const currentProject = context.getCurrentProject();
  const isLoadingValue = context.isLoading();
  const errorValue = context.getError();

  return (
    <div>
      <div data-testid="loading">
        {isLoadingValue ? "Loading" : "Not Loading"}
      </div>
      <div data-testid="error">{errorValue ?? "No Error"}</div>
      <div data-testid="project-name">{currentProject.name}</div>
      <div data-testid="project-path">{currentProject.path ?? "No Path"}</div>
      <div data-testid="project-dirty">
        {currentProject.isDirty ? "Dirty" : "Not Dirty"}
      </div>
      <div data-testid="project-new">
        {currentProject.isNew ? "New" : "Not New"}
      </div>
      <button
        data-testid="create-project"
        onClick={() => createNewProject("Test Project")}
      >
        Create Project
      </button>
      <button
        data-testid="open-project"
        onClick={() => {
          void openProject();
        }}
      >
        Open Project
      </button>
      <button
        data-testid="save-project"
        onClick={() => {
          void saveProject("Test Project");
        }}
      >
        Save Project
      </button>
      <button data-testid="set-dirty" onClick={() => setProjectDirty(true)}>
        Set Dirty
      </button>
    </div>
  );
};

describe("AppSettingsProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render children and provide context", async () => {
    render(
      <AppSettingsProvider>
        <div data-testid="child">Child Component</div>
      </AppSettingsProvider>,
    );

    expect(screen.getByTestId("child")).toBeInTheDocument();
  });

  it("should provide app settings context to children", async () => {
    render(
      <AppSettingsProvider>
        <TestComponent />
      </AppSettingsProvider>,
    );

    expect(screen.getByTestId("loading")).toHaveTextContent("Not Loading");
    expect(screen.getByTestId("error")).toHaveTextContent("No Error");
    expect(screen.getByTestId("project-name")).toHaveTextContent(
      "Новый проект",
    );
    expect(screen.getByTestId("project-path")).toHaveTextContent("No Path");
    expect(screen.getByTestId("project-dirty")).toHaveTextContent("Not Dirty");
    expect(screen.getByTestId("project-new")).toHaveTextContent("New");
  });

  it("should handle createNewProject function", async () => {
    render(
      <AppSettingsProvider>
        <TestComponent />
      </AppSettingsProvider>,
    );

    // Нажимаем на кнопку создания проекта
    act(() => {
      act(() => {
        fireEvent.click(screen.getByTestId("create-project"));
      });
    });

    // Проверяем, что событие было отправлено в машину состояний
    expect(mockSend).toHaveBeenCalledWith({
      type: "CREATE_NEW_PROJECT",
      name: "Test Project",
    });
  });

  it("should handle setProjectDirty function", async () => {
    render(
      <AppSettingsProvider>
        <TestComponent />
      </AppSettingsProvider>,
    );

    // Нажимаем на кнопку установки флага "грязный"
    act(() => {
      act(() => {
        fireEvent.click(screen.getByTestId("set-dirty"));
      });
    });

    // Проверяем, что событие было отправлено в машину состояний
    expect(mockSend).toHaveBeenCalledWith({
      type: "SET_PROJECT_DIRTY",
      isDirty: true,
    });
  });

  it("should handle openProject function", async () => {
    // Получаем моки из модулей
    const { open } = await import("@tauri-apps/plugin-dialog");
    const { basename, appDataDir } = await import("@tauri-apps/api/path");

    render(
      <AppSettingsProvider>
        <TestComponent />
      </AppSettingsProvider>,
    );

    // Нажимаем на кнопку открытия проекта
    act(() => {
      act(() => {
        fireEvent.click(screen.getByTestId("open-project"));
      });
    });

    // Проверяем, что appDataDir был вызван
    await waitFor(() => {
      expect(appDataDir).toHaveBeenCalled();
    });

    // Проверяем, что диалог открытия файла был вызван с правильными параметрами
    await waitFor(() => {
      expect(open).toHaveBeenCalledWith({
        multiple: false,
        filters: [
          {
            name: "Timeline Studio Project",
            extensions: ["tlsp"],
          },
        ],
        defaultPath: "/app/data/dir",
      });
    });

    // Проверяем, что basename был вызван для получения имени файла
    await waitFor(() => {
      expect(basename).toHaveBeenCalledWith("/path/to/project.tlsp");
    });

    // Проверяем, что событие было отправлено в машину состояний
    await waitFor(() => {
      expect(mockSend).toHaveBeenCalledWith({
        type: "OPEN_PROJECT",
        path: "/path/to/project.tlsp",
        name: "project.tlsp",
      });
    });
  });

  it("should handle saveProject function", async () => {
    // Получаем моки из модулей
    const { save } = await import("@tauri-apps/plugin-dialog");
    const { appDataDir, join } = await import("@tauri-apps/api/path");

    render(
      <AppSettingsProvider>
        <TestComponent />
      </AppSettingsProvider>,
    );

    // Нажимаем на кнопку сохранения проекта
    act(() => {
      act(() => {
        fireEvent.click(screen.getByTestId("save-project"));
      });
    });

    // Проверяем, что appDataDir был вызван
    await waitFor(() => {
      expect(appDataDir).toHaveBeenCalled();
    });

    // Проверяем, что join был вызван для формирования пути к файлу
    await waitFor(() => {
      expect(join).toHaveBeenCalledWith("/app/data/dir", "Test Project.tlsp");
    });

    // Проверяем, что диалог сохранения файла был вызван с правильными параметрами
    await waitFor(() => {
      expect(save).toHaveBeenCalledWith({
        filters: [
          {
            name: "Timeline Studio Project",
            extensions: ["tlsp"],
          },
        ],
        defaultPath: "/app/data/dir/Test Project.tlsp",
      });
    });

    // Проверяем, что событие было отправлено в машину состояний
    await waitFor(() => {
      expect(mockSend).toHaveBeenCalledWith({
        type: "SAVE_PROJECT",
        path: "/path/to/saved/project.tlsp",
        name: "Test Project",
      });
    });
  });
});

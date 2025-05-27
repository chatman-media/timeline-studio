import { describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";
import { ProjectSettingsModal } from "../../components/project-settings-modal";

// Мокируем все зависимости
vi.mock("../../hooks/use-project-settings", () => ({
  useProjectSettings: vi.fn(() => ({
    settings: {
      aspectRatio: {
        label: "16:9",
        textLabel: "Widescreen",
        value: { width: 1920, height: 1080 },
      },
      resolution: "1920x1080",
      frameRate: "30",
      colorSpace: "rec709",
    },
    updateSettings: vi.fn(),
    resetSettings: vi.fn(),
  })),
}));

vi.mock("@/features/modals/services/modal-provider", () => ({
  useModal: vi.fn(() => ({
    closeModal: vi.fn(),
    openModal: vi.fn(),
    isModalOpen: vi.fn(),
  })),
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

describe("ProjectSettingsModal", () => {
  it("должен рендериться без ошибок", () => {
    expect(() => {
      render(<ProjectSettingsModal />);
    }).not.toThrow();
  });

  it("должен быть React компонентом", () => {
    expect(typeof ProjectSettingsModal).toBe("function");
  });
});

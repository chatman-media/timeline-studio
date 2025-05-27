import { describe, expect, it, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import React, { ReactNode } from "react";
import { useProjectSettings } from "../../hooks/use-project-settings";

// Мокируем провайдер
vi.mock("../../services/project-settings-provider", () => ({
  ProjectSettingsContext: {
    Provider: ({ children, value }: { children: ReactNode; value: any }) =>
      React.createElement("div", { "data-testid": "mock-provider" }, children),
  },
}));

describe("useProjectSettings", () => {
  it("должен быть функцией", () => {
    expect(typeof useProjectSettings).toBe("function");
  });

  it("должен экспортироваться из модуля", () => {
    expect(useProjectSettings).toBeDefined();
  });
});

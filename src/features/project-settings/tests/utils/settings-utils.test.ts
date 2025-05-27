import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import {
  updateSettingsWithNewWidth,
  updateSettingsWithNewHeight,
  createSettingsWithNewAspectRatio,
  triggerWindowResize,
} from "../../utils/settings-utils";
import type { ProjectSettings } from "@/types/project";

describe("settings-utils", () => {
  const mockSettings: ProjectSettings = {
    aspectRatio: {
      label: "16:9",
      textLabel: "Widescreen",
      value: { width: 1920, height: 1080 },
    },
    resolution: "1920x1080",
    frameRate: "30",
    colorSpace: "rec709",
  };

  describe("updateSettingsWithNewWidth", () => {
    it("должен обновлять ширину с заблокированным соотношением сторон", () => {
      const result = updateSettingsWithNewWidth(mockSettings, 1280, 1080, true);

      expect(result.aspectRatio.value.width).toBe(1280);
      expect(result.aspectRatio.value.height).toBe(720); // 1280 / (16/9) = 720
      expect(result.resolution).toBe("1280x720");
    });

    it("должен обновлять только ширину с разблокированным соотношением сторон", () => {
      const result = updateSettingsWithNewWidth(
        mockSettings,
        1280,
        1080,
        false,
      );

      expect(result.aspectRatio.value.width).toBe(1280);
      expect(result.aspectRatio.value.height).toBe(1080); // Высота не изменилась
      expect(result.resolution).toBe("1280x1080");
    });

    it("должен сохранять другие свойства настроек", () => {
      const result = updateSettingsWithNewWidth(mockSettings, 1600, 1080, true);

      expect(result.frameRate).toBe("30");
      expect(result.colorSpace).toBe("rec709");
      expect(result.aspectRatio.label).toBe("16:9");
      expect(result.aspectRatio.textLabel).toBe("Widescreen");
    });

    it("должен корректно обрабатывать квадратное соотношение сторон", () => {
      const squareSettings = {
        ...mockSettings,
        aspectRatio: {
          ...mockSettings.aspectRatio,
          label: "1:1",
          value: { width: 1080, height: 1080 },
        },
      };

      const result = updateSettingsWithNewWidth(
        squareSettings,
        800,
        1080,
        true,
      );

      expect(result.aspectRatio.value.width).toBe(800);
      expect(result.aspectRatio.value.height).toBe(800);
      expect(result.resolution).toBe("800x800");
    });
  });

  describe("updateSettingsWithNewHeight", () => {
    it("должен обновлять высоту с заблокированным соотношением сторон", () => {
      const result = updateSettingsWithNewHeight(mockSettings, 1920, 720, true);

      expect(result.aspectRatio.value.width).toBe(1280); // 720 * (16/9) = 1280
      expect(result.aspectRatio.value.height).toBe(720);
      expect(result.resolution).toBe("1280x720");
    });

    it("должен обновлять только высоту с разблокированным соотношением сторон", () => {
      const result = updateSettingsWithNewHeight(
        mockSettings,
        1920,
        720,
        false,
      );

      expect(result.aspectRatio.value.width).toBe(1920); // Ширина не изменилась
      expect(result.aspectRatio.value.height).toBe(720);
      expect(result.resolution).toBe("1920x720");
    });

    it("должен сохранять другие свойства настроек", () => {
      const result = updateSettingsWithNewHeight(mockSettings, 1920, 900, true);

      expect(result.frameRate).toBe("30");
      expect(result.colorSpace).toBe("rec709");
      expect(result.aspectRatio.label).toBe("16:9");
      expect(result.aspectRatio.textLabel).toBe("Widescreen");
    });

    it("должен корректно обрабатывать портретное соотношение сторон", () => {
      const portraitSettings = {
        ...mockSettings,
        aspectRatio: {
          ...mockSettings.aspectRatio,
          label: "9:16",
          value: { width: 1080, height: 1920 },
        },
      };

      const result = updateSettingsWithNewHeight(
        portraitSettings,
        1080,
        1600,
        true,
      );

      expect(result.aspectRatio.value.width).toBe(900); // 1600 * (9/16) = 900
      expect(result.aspectRatio.value.height).toBe(1600);
      expect(result.resolution).toBe("900x1600");
    });
  });

  describe("createSettingsWithNewAspectRatio", () => {
    const newAspectRatio = {
      label: "1:1",
      textLabel: "Square",
      value: { width: 1080, height: 1080 },
    };

    const recommendedResolution = {
      value: "1080x1080",
      width: 1080,
      height: 1080,
      label: "1080p Square",
    };

    it("должен создавать настройки для стандартного соотношения сторон", () => {
      const result = createSettingsWithNewAspectRatio(
        mockSettings,
        newAspectRatio,
        "1080x1080",
        recommendedResolution,
        800,
        600,
      );

      expect(result.aspectRatio.label).toBe("1:1");
      expect(result.aspectRatio.value.width).toBe(1080);
      expect(result.aspectRatio.value.height).toBe(1080);
      expect(result.resolution).toBe("1080x1080");
    });

    it("должен создавать настройки для пользовательского соотношения сторон", () => {
      const customAspectRatio = {
        label: "custom",
        textLabel: "Custom",
        value: { width: 800, height: 600 },
      };

      const result = createSettingsWithNewAspectRatio(
        mockSettings,
        customAspectRatio,
        "custom",
        recommendedResolution,
        800,
        600,
      );

      expect(result.aspectRatio.label).toBe("custom");
      expect(result.aspectRatio.value.width).toBe(800);
      expect(result.aspectRatio.value.height).toBe(600);
      expect(result.resolution).toBe("custom");
    });

    it("должен сохранять другие свойства настроек", () => {
      const result = createSettingsWithNewAspectRatio(
        mockSettings,
        newAspectRatio,
        "1080x1080",
        recommendedResolution,
        800,
        600,
      );

      expect(result.frameRate).toBe("30");
      expect(result.colorSpace).toBe("rec709");
    });
  });

  describe("triggerWindowResize", () => {
    let dispatchEventSpy: any;
    let windowSpy: any;

    beforeEach(() => {
      // Мокируем window.dispatchEvent
      dispatchEventSpy = vi.fn();
      windowSpy = vi.spyOn(global, "window", "get").mockReturnValue({
        dispatchEvent: dispatchEventSpy,
      } as any);
    });

    afterEach(() => {
      windowSpy.mockRestore();
      vi.clearAllTimers();
    });

    it("должен диспатчить событие resize через 50мс", async () => {
      vi.useFakeTimers();

      triggerWindowResize();

      // Событие не должно быть вызвано сразу
      expect(dispatchEventSpy).not.toHaveBeenCalled();

      // Продвигаем время на 50мс
      vi.advanceTimersByTime(50);

      expect(dispatchEventSpy).toHaveBeenCalledWith(expect.any(Event));
      expect(dispatchEventSpy).toHaveBeenCalledTimes(1);

      // Проверяем, что событие имеет правильный тип
      const calledEvent = dispatchEventSpy.mock.calls[0][0];
      expect(calledEvent.type).toBe("resize");

      vi.useRealTimers();
    });

    it("не должен вызывать ошибку если window не определен", () => {
      windowSpy.mockReturnValue(undefined);

      expect(() => {
        triggerWindowResize();
      }).not.toThrow();
    });

    it("должен обрабатывать случай когда window.dispatchEvent не существует", () => {
      windowSpy.mockReturnValue({} as any);

      expect(() => {
        triggerWindowResize();
      }).not.toThrow();
    });
  });
});

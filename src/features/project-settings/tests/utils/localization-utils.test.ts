import { describe, expect, it, vi } from "vitest";
import {
  getAspectRatioLabel,
  getLockedAspectRatioText,
  getUnlockedAspectRatioText,
  getCustomAspectRatioText,
} from "../../utils/localization-utils";

describe("localization-utils", () => {
  describe("getAspectRatioLabel", () => {
    const mockT = vi.fn((key: string) => {
      const translations: Record<string, string> = {
        "dialogs.projectSettings.aspectRatioLabels.widescreen": "Widescreen",
        "dialogs.projectSettings.aspectRatioLabels.portrait": "Portrait",
        "dialogs.projectSettings.aspectRatioLabels.social": "Social Media",
        "dialogs.projectSettings.aspectRatioLabels.standard": "Standard",
        "dialogs.projectSettings.aspectRatioLabels.vertical": "Vertical",
        "dialogs.projectSettings.aspectRatioLabels.cinema": "Cinema",
      };
      return translations[key] || key;
    });

    it("должен возвращать локализованные метки для известных соотношений", () => {
      expect(getAspectRatioLabel("Широкоэкнранный", mockT)).toBe("Widescreen");
      expect(getAspectRatioLabel("Портрет", mockT)).toBe("Portrait");
      expect(getAspectRatioLabel("Социальные сети", mockT)).toBe(
        "Social Media",
      );
      expect(getAspectRatioLabel("Стандарт", mockT)).toBe("Standard");
      expect(getAspectRatioLabel("Вертикальный", mockT)).toBe("Vertical");
      expect(getAspectRatioLabel("Кинотеатр", mockT)).toBe("Cinema");
    });

    it("должен возвращать исходную метку для неизвестных соотношений", () => {
      expect(getAspectRatioLabel("Неизвестное соотношение", mockT)).toBe(
        "Неизвестное соотношение",
      );
      expect(getAspectRatioLabel("Custom Ratio", mockT)).toBe("Custom Ratio");
      expect(getAspectRatioLabel("", mockT)).toBe("");
    });

    it("должен вызывать функцию перевода для каждой известной метки", () => {
      mockT.mockClear();
      getAspectRatioLabel("Широкоэкнранный", mockT);

      expect(mockT).toHaveBeenCalledWith(
        "dialogs.projectSettings.aspectRatioLabels.widescreen",
      );
      expect(mockT).toHaveBeenCalledWith(
        "dialogs.projectSettings.aspectRatioLabels.portrait",
      );
      expect(mockT).toHaveBeenCalledWith(
        "dialogs.projectSettings.aspectRatioLabels.social",
      );
      expect(mockT).toHaveBeenCalledWith(
        "dialogs.projectSettings.aspectRatioLabels.standard",
      );
      expect(mockT).toHaveBeenCalledWith(
        "dialogs.projectSettings.aspectRatioLabels.vertical",
      );
      expect(mockT).toHaveBeenCalledWith(
        "dialogs.projectSettings.aspectRatioLabels.cinema",
      );
    });
  });

  describe("getLockedAspectRatioText", () => {
    const mockT = vi.fn((key: string, options?: any) => {
      if (key === "dialogs.projectSettings.aspectRatioLocked") {
        return `Locked to ${options?.ratio || "unknown"}`;
      }
      return key;
    });

    it("должен возвращать текст для заблокированного соотношения сторон", () => {
      expect(getLockedAspectRatioText("16:9", mockT)).toBe("Locked to 16:9");
      expect(getLockedAspectRatioText("1:1", mockT)).toBe("Locked to 1:1");
      expect(getLockedAspectRatioText("4:3", mockT)).toBe("Locked to 4:3");
    });

    it("должен передавать соотношение сторон в опциях", () => {
      mockT.mockClear();
      getLockedAspectRatioText("21:9", mockT);

      expect(mockT).toHaveBeenCalledWith(
        "dialogs.projectSettings.aspectRatioLocked",
        { ratio: "21:9" },
      );
    });
  });

  describe("getUnlockedAspectRatioText", () => {
    const mockT = vi.fn((key: string, options?: any) => {
      if (key === "dialogs.projectSettings.aspectRatioUnlocked") {
        return `Unlocked from ${options?.ratio || "unknown"}`;
      }
      return key;
    });

    it("должен возвращать текст для разблокированного соотношения сторон", () => {
      expect(getUnlockedAspectRatioText("16:9", mockT)).toBe(
        "Unlocked from 16:9",
      );
      expect(getUnlockedAspectRatioText("1:1", mockT)).toBe(
        "Unlocked from 1:1",
      );
      expect(getUnlockedAspectRatioText("4:3", mockT)).toBe(
        "Unlocked from 4:3",
      );
    });

    it("должен передавать соотношение сторон в опциях", () => {
      mockT.mockClear();
      getUnlockedAspectRatioText("9:16", mockT);

      expect(mockT).toHaveBeenCalledWith(
        "dialogs.projectSettings.aspectRatioUnlocked",
        { ratio: "9:16" },
      );
    });
  });

  describe("getCustomAspectRatioText", () => {
    const mockT = vi.fn((key: string) => {
      if (key === "dialogs.projectSettings.aspectRatioLabels.custom") {
        return "Custom";
      }
      return key;
    });

    it("должен возвращать текст для пользовательского соотношения сторон", () => {
      expect(getCustomAspectRatioText(mockT)).toBe("Custom");
    });

    it("должен вызывать функцию перевода с правильным ключом", () => {
      mockT.mockClear();
      getCustomAspectRatioText(mockT);

      expect(mockT).toHaveBeenCalledWith(
        "dialogs.projectSettings.aspectRatioLabels.custom",
      );
    });
  });

  describe("интеграционные тесты", () => {
    it("должен корректно работать с реальной функцией перевода", () => {
      const realT = (key: string, options?: any) => {
        const translations: Record<string, string> = {
          "dialogs.projectSettings.aspectRatioLabels.widescreen":
            "Широкоэкранный",
          "dialogs.projectSettings.aspectRatioLabels.custom":
            "Пользовательский",
          "dialogs.projectSettings.aspectRatioLocked": `Заблокировано на ${options?.ratio}`,
          "dialogs.projectSettings.aspectRatioUnlocked": `Разблокировано с ${options?.ratio}`,
        };
        return translations[key] || key;
      };

      expect(getAspectRatioLabel("Широкоэкнранный", realT)).toBe(
        "Широкоэкранный",
      );
      expect(getCustomAspectRatioText(realT)).toBe("Пользовательский");
      expect(getLockedAspectRatioText("16:9", realT)).toBe(
        "Заблокировано на 16:9",
      );
      expect(getUnlockedAspectRatioText("16:9", realT)).toBe(
        "Разблокировано с 16:9",
      );
    });
  });
});

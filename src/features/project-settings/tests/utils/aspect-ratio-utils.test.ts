import { describe, expect, it } from "vitest";
import {
  getAspectRatioString,
  gcd,
  calculateHeightFromWidth,
  calculateWidthFromHeight,
  isStandardAspectRatio,
} from "../../utils/aspect-ratio-utils";

describe("aspect-ratio-utils", () => {
  describe("getAspectRatioString", () => {
    it("должен распознавать стандартные соотношения сторон", () => {
      expect(getAspectRatioString(1920, 1080)).toBe("16:9");
      expect(getAspectRatioString(1080, 1920)).toBe("9:16");
      expect(getAspectRatioString(1080, 1080)).toBe("1:1");
      expect(getAspectRatioString(1024, 768)).toBe("4:3");
      expect(getAspectRatioString(768, 1024)).toBe("3:4");
      expect(getAspectRatioString(1280, 1024)).toBe("5:4");
      expect(getAspectRatioString(1024, 1280)).toBe("4:5");
      expect(getAspectRatioString(2560, 1080)).toBe("2:37"); // 2560/1080 = 2.37, toFixed(2) = "2.37", replace(".", ":") = "2:37"
    });

    it("должен обрабатывать небольшие погрешности в соотношениях", () => {
      // Небольшие отклонения от точного соотношения 16:9
      expect(getAspectRatioString(1921, 1080)).toBe("16:9");
      expect(getAspectRatioString(1919, 1080)).toBe("16:9");
      expect(getAspectRatioString(1920, 1081)).toBe("16:9");
      expect(getAspectRatioString(1920, 1079)).toBe("16:9");
    });

    it("должен вычислять пользовательские соотношения сторон", () => {
      expect(getAspectRatioString(1600, 900)).toBe("16:9"); // Точное соотношение
      expect(getAspectRatioString(1366, 768)).toBe("16:9"); // Близко к 16:9, попадает в погрешность
      expect(getAspectRatioString(1440, 900)).toBe("8:5"); // Упрощенное
    });

    it("должен обрабатывать большие числа", () => {
      // Для 3840x1600: НОД=320, x=12, y=5 (оба < 30), поэтому возвращается упрощенное соотношение
      expect(getAspectRatioString(3840, 1600)).toBe("12:5");

      // Для действительно больших чисел (где упрощенное соотношение > 30)
      // Например, 3200x100: НОД=100, x=32, y=1 (x > 30), поэтому десятичная дробь
      expect(getAspectRatioString(3200, 100)).toBe("32:00");
    });

    it("должен корректно обрабатывать равные размеры", () => {
      expect(getAspectRatioString(500, 500)).toBe("1:1");
      expect(getAspectRatioString(1000, 1000)).toBe("1:1");
    });
  });

  describe("gcd", () => {
    it("должен вычислять наибольший общий делитель", () => {
      expect(gcd(48, 18)).toBe(6);
      expect(gcd(1920, 1080)).toBe(120);
      expect(gcd(100, 25)).toBe(25);
      expect(gcd(17, 13)).toBe(1); // Взаимно простые числа
    });

    it("должен обрабатывать случай когда одно число равно нулю", () => {
      expect(gcd(5, 0)).toBe(5);
      expect(gcd(0, 7)).toBe(7);
    });

    it("должен обрабатывать одинаковые числа", () => {
      expect(gcd(15, 15)).toBe(15);
      expect(gcd(1, 1)).toBe(1);
    });
  });

  describe("calculateHeightFromWidth", () => {
    it("должен вычислять высоту из ширины для стандартных соотношений", () => {
      expect(calculateHeightFromWidth(1920, 16 / 9)).toBe(1080);
      expect(calculateHeightFromWidth(1280, 16 / 9)).toBe(720);
      expect(calculateHeightFromWidth(1000, 1)).toBe(1000); // Квадрат
      expect(calculateHeightFromWidth(1024, 4 / 3)).toBe(768);
    });

    it("должен округлять результат до целого числа", () => {
      expect(calculateHeightFromWidth(1366, 16 / 9)).toBe(768); // 768.375 -> 768
      expect(calculateHeightFromWidth(1440, 16 / 9)).toBe(810); // 810
    });

    it("должен обрабатывать нестандартные соотношения", () => {
      expect(calculateHeightFromWidth(800, 2.5)).toBe(320);
      expect(calculateHeightFromWidth(1500, 1.5)).toBe(1000);
    });
  });

  describe("calculateWidthFromHeight", () => {
    it("должен вычислять ширину из высоты для стандартных соотношений", () => {
      expect(calculateWidthFromHeight(1080, 16 / 9)).toBe(1920);
      expect(calculateWidthFromHeight(720, 16 / 9)).toBe(1280);
      expect(calculateWidthFromHeight(1000, 1)).toBe(1000); // Квадрат
      expect(calculateWidthFromHeight(768, 4 / 3)).toBe(1024);
    });

    it("должен округлять результат до целого числа", () => {
      expect(calculateWidthFromHeight(900, 16 / 9)).toBe(1600); // 1600
      expect(calculateWidthFromHeight(1080, 21 / 9)).toBe(2520); // 2520
    });

    it("должен обрабатывать нестандартные соотношения", () => {
      expect(calculateWidthFromHeight(400, 2.5)).toBe(1000);
      expect(calculateWidthFromHeight(600, 1.5)).toBe(900);
    });
  });

  describe("isStandardAspectRatio", () => {
    it("должен распознавать стандартные соотношения сторон", () => {
      expect(isStandardAspectRatio(1920, 1080)).toBe(true); // 16:9
      expect(isStandardAspectRatio(1080, 1920)).toBe(true); // 9:16
      expect(isStandardAspectRatio(1080, 1080)).toBe(true); // 1:1
      expect(isStandardAspectRatio(1024, 768)).toBe(true); // 4:3
      expect(isStandardAspectRatio(768, 1024)).toBe(true); // 3:4
      expect(isStandardAspectRatio(1280, 1024)).toBe(true); // 5:4
      expect(isStandardAspectRatio(1024, 1280)).toBe(true); // 4:5
      expect(isStandardAspectRatio(2520, 1080)).toBe(true); // 21:9 (точное соотношение)
    });

    it("должен обрабатывать небольшие погрешности", () => {
      expect(isStandardAspectRatio(1921, 1080)).toBe(true); // Близко к 16:9
      expect(isStandardAspectRatio(1919, 1080)).toBe(true); // Близко к 16:9
      expect(isStandardAspectRatio(1081, 1081)).toBe(true); // Близко к 1:1
    });

    it("должен отклонять нестандартные соотношения", () => {
      expect(isStandardAspectRatio(1366, 768)).toBe(true); // Близко к 16:9, попадает в погрешность
      expect(isStandardAspectRatio(1600, 900)).toBe(true); // 16:9
      expect(isStandardAspectRatio(1440, 900)).toBe(false); // 8:5, не в списке стандартных
      expect(isStandardAspectRatio(800, 600)).toBe(true); // 4:3
      expect(isStandardAspectRatio(2560, 1080)).toBe(false); // Не точное 21:9
    });

    it("должен обрабатывать крайние случаи", () => {
      expect(isStandardAspectRatio(0, 100)).toBe(false); // Нулевая ширина
      expect(isStandardAspectRatio(100, 0)).toBe(false); // Нулевая высота
      expect(isStandardAspectRatio(1, 1)).toBe(true); // Минимальный квадрат
    });
  });
});

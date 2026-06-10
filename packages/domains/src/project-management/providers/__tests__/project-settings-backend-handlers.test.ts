import { beforeEach, describe, expect, it, vi } from "vitest"
import type { ProjectSettings } from "@timeline-studio/domains/shared/types/project"
import type { ProjectEvent } from "@/types/generated/tauri-bindings"
import { convertFrontendSettingsToBackend, handleProjectSettingsEvent } from "../project-settings-backend-handlers"

// Мокируем tauri-logger
vi.mock("@/lib/tauri-logger", () => ({
  createLogger: () => ({
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  }),
}))

describe("backend-event-handlers", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("handleProjectSettingsEvent", () => {
    it("должен вернуть null для события не типа ProjectSettingsUpdated", () => {
      const event: ProjectEvent = {
        type: "ProjectOpened",
      } as any

      const result = handleProjectSettingsEvent(event)

      expect(result).toBeNull()
    })

    it("должен вернуть null если в событии нет payload", () => {
      const event: ProjectEvent = {
        type: "ProjectSettingsUpdated",
      } as any

      const result = handleProjectSettingsEvent(event)

      expect(result).toBeNull()
    })

    it("должен вернуть null если в payload нет settings", () => {
      const event = {
        type: "ProjectSettingsUpdated",
        payload: {},
      } as any

      const result = handleProjectSettingsEvent(event)

      expect(result).toBeNull()
    })

    it("должен преобразовать backend настройки в frontend формат для 16:9", () => {
      const event = {
        type: "ProjectSettingsUpdated",
        payload: {
          settings: {
            resolution: { width: 1920, height: 1080 },
            frame_rate: 30,
            audio_sample_rate: 48000,
            audio_channels: 2,
          },
        },
      } as any

      const result = handleProjectSettingsEvent(event)

      expect(result).toEqual({
        resolution: "1920x1080",
        frameRate: "30",
        colorSpace: "sdr",
        aspectRatio: {
          label: "16:9",
          textLabel: "Широкоэкранный",
          description: "YouTube",
          value: { width: 1920, height: 1080, name: "16:9" },
        },
      })
    })

    it("должен преобразовать backend настройки в frontend формат для 9:16", () => {
      const event = {
        type: "ProjectSettingsUpdated",
        payload: {
          settings: {
            resolution: { width: 1080, height: 1920 },
            frame_rate: 30,
            audio_sample_rate: 48000,
            audio_channels: 2,
          },
        },
      } as any

      const result = handleProjectSettingsEvent(event)

      expect(result).toEqual({
        resolution: "1080x1920",
        frameRate: "30",
        colorSpace: "sdr",
        aspectRatio: {
          label: "9:16",
          textLabel: "Портрет",
          description: "TikTok, YouTube Shorts",
          value: { width: 1080, height: 1920, name: "9:16" },
        },
      })
    })

    it("должен преобразовать backend настройки в frontend формат для 1:1", () => {
      const event = {
        type: "ProjectSettingsUpdated",
        payload: {
          settings: {
            resolution: { width: 1080, height: 1080 },
            frame_rate: 24,
            audio_sample_rate: 48000,
            audio_channels: 2,
          },
        },
      } as any

      const result = handleProjectSettingsEvent(event)

      expect(result).toEqual({
        resolution: "1080x1080",
        frameRate: "24",
        colorSpace: "sdr",
        aspectRatio: {
          label: "1:1",
          textLabel: "Социальные сети",
          description: "Instagram, Social media posts",
          value: { width: 1080, height: 1080, name: "1:1" },
        },
      })
    })

    it("должен преобразовать backend настройки в frontend формат для 4:3", () => {
      const event = {
        type: "ProjectSettingsUpdated",
        payload: {
          settings: {
            resolution: { width: 1440, height: 1080 },
            frame_rate: 60,
            audio_sample_rate: 48000,
            audio_channels: 2,
          },
        },
      } as any

      const result = handleProjectSettingsEvent(event)

      expect(result).toEqual({
        resolution: "1440x1080",
        frameRate: "60",
        colorSpace: "sdr",
        aspectRatio: {
          label: "4:3",
          textLabel: "Стандарт",
          description: "TV",
          value: { width: 1440, height: 1080, name: "4:3" },
        },
      })
    })

    it("должен преобразовать backend настройки в frontend формат для 4:5", () => {
      const event = {
        type: "ProjectSettingsUpdated",
        payload: {
          settings: {
            resolution: { width: 1024, height: 1280 },
            frame_rate: 30,
            audio_sample_rate: 48000,
            audio_channels: 2,
          },
        },
      } as any

      const result = handleProjectSettingsEvent(event)

      expect(result).toEqual({
        resolution: "1024x1280",
        frameRate: "30",
        colorSpace: "sdr",
        aspectRatio: {
          label: "4:5",
          textLabel: "Вертикальный",
          description: "Vertical post",
          value: { width: 1024, height: 1280, name: "4:5" },
        },
      })
    })

    it("должен преобразовать backend настройки в frontend формат для 21:9", () => {
      const event = {
        type: "ProjectSettingsUpdated",
        payload: {
          settings: {
            resolution: { width: 2520, height: 1080 }, // Точное 21:9 = 2.333...
            frame_rate: 30,
            audio_sample_rate: 48000,
            audio_channels: 2,
          },
        },
      } as any

      const result = handleProjectSettingsEvent(event)

      expect(result).toEqual({
        resolution: "2520x1080",
        frameRate: "30",
        colorSpace: "sdr",
        aspectRatio: {
          label: "21:9",
          textLabel: "Кинотеатр",
          description: "Movie",
          value: { width: 2520, height: 1080, name: "21:9" }, // Сохраняем фактическое разрешение
        },
      })
    })

    it("должен обрабатывать кастомное соотношение сторон", () => {
      const event = {
        type: "ProjectSettingsUpdated",
        payload: {
          settings: {
            resolution: { width: 1400, height: 900 }, // Не совпадает ни с одним стандартным
            frame_rate: 30,
            audio_sample_rate: 48000,
            audio_channels: 2,
          },
        },
      } as any

      const result = handleProjectSettingsEvent(event)

      expect(result).toEqual({
        resolution: "1400x900",
        frameRate: "30",
        colorSpace: "sdr",
        aspectRatio: {
          label: "custom",
          textLabel: "",
          description: "User",
          value: { width: 1400, height: 900, name: "1400:900" },
        },
      })
    })

    it("должен обрабатывать дробные значения frame_rate", () => {
      const event = {
        type: "ProjectSettingsUpdated",
        payload: {
          settings: {
            resolution: { width: 1920, height: 1080 },
            frame_rate: 29.97,
            audio_sample_rate: 48000,
            audio_channels: 2,
          },
        },
      } as any

      const result = handleProjectSettingsEvent(event)

      expect(result?.frameRate).toBe("29.97")
    })
  })

  describe("convertFrontendSettingsToBackend", () => {
    it("должен преобразовать resolution из строки в объект", () => {
      const settings: Partial<ProjectSettings> = {
        resolution: "1920x1080",
      }

      const result = convertFrontendSettingsToBackend(settings)

      expect(result.resolution).toEqual({ width: 1920, height: 1080 })
    })

    it("должен преобразовать frameRate из строки в число", () => {
      const settings: Partial<ProjectSettings> = {
        frameRate: "30",
      }

      const result = convertFrontendSettingsToBackend(settings)

      expect(result.frame_rate).toBe(30)
    })

    it("должен преобразовать дробный frameRate", () => {
      const settings: Partial<ProjectSettings> = {
        frameRate: "29.97",
      }

      const result = convertFrontendSettingsToBackend(settings)

      expect(result.frame_rate).toBe(29.97)
    })

    it("должен добавить дефолтные audio настройки", () => {
      const settings: Partial<ProjectSettings> = {
        resolution: "1920x1080",
      }

      const result = convertFrontendSettingsToBackend(settings)

      expect(result.audio_sample_rate).toBe(48000)
      expect(result.audio_channels).toBe(2)
    })

    it("должен использовать aspectRatio.value если resolution не задан", () => {
      const settings: Partial<ProjectSettings> = {
        aspectRatio: {
          label: "16:9",
          textLabel: "Widescreen",
          description: "YouTube",
          value: { width: 1920, height: 1080, name: "16:9" },
        },
      }

      const result = convertFrontendSettingsToBackend(settings)

      expect(result.resolution).toEqual({ width: 1920, height: 1080 })
    })

    it("должен игнорировать aspectRatio если resolution задан", () => {
      const settings: Partial<ProjectSettings> = {
        resolution: "3840x2160",
        aspectRatio: {
          label: "16:9",
          textLabel: "Widescreen",
          description: "YouTube",
          value: { width: 1920, height: 1080, name: "16:9" },
        },
      }

      const result = convertFrontendSettingsToBackend(settings)

      expect(result.resolution).toEqual({ width: 3840, height: 2160 })
    })

    it("должен игнорировать colorSpace (не используется в backend)", () => {
      const settings: Partial<ProjectSettings> = {
        resolution: "1920x1080",
        colorSpace: "dci-p3",
      }

      const result = convertFrontendSettingsToBackend(settings)

      expect(result.colorSpace).toBeUndefined()
    })

    it("должен обрабатывать некорректный resolution", () => {
      const settings: Partial<ProjectSettings> = {
        resolution: "invalid",
      }

      const result = convertFrontendSettingsToBackend(settings)

      // Если resolution некорректный, его не должно быть в результате
      expect(result.resolution).toBeUndefined()
    })

    it("должен обрабатывать некорректный frameRate", () => {
      const settings: Partial<ProjectSettings> = {
        frameRate: "invalid" as any,
      }

      const result = convertFrontendSettingsToBackend(settings)

      // NaN преобразуется в NaN
      expect(Number.isNaN(result.frame_rate)).toBe(true)
    })

    it("должен обрабатывать пустые настройки", () => {
      const settings: Partial<ProjectSettings> = {}

      const result = convertFrontendSettingsToBackend(settings)

      // Должны быть только дефолтные audio настройки
      expect(result).toEqual({
        audio_sample_rate: 48000,
        audio_channels: 2,
      })
    })

    it("должен обрабатывать aspectRatio без width/height", () => {
      const settings: Partial<ProjectSettings> = {
        aspectRatio: {
          label: "custom",
          textLabel: "",
          description: "Custom",
          value: { width: 0, height: 0, name: "custom" },
        },
      }

      const result = convertFrontendSettingsToBackend(settings)

      // Если width или height = 0, resolution не должен быть установлен
      expect(result.resolution).toBeUndefined()
    })

    it("должен корректно обрабатывать все параметры вместе", () => {
      const settings: Partial<ProjectSettings> = {
        resolution: "3840x2160",
        frameRate: "60",
        colorSpace: "p3-d65",
        aspectRatio: {
          label: "16:9",
          textLabel: "Widescreen",
          description: "4K",
          value: { width: 3840, height: 2160, name: "16:9" },
        },
      }

      const result = convertFrontendSettingsToBackend(settings)

      expect(result).toEqual({
        resolution: { width: 3840, height: 2160 },
        frame_rate: 60,
        audio_sample_rate: 48000,
        audio_channels: 2,
      })
    })
  })

  describe("edge cases", () => {
    it("handleProjectSettingsEvent должен обрабатывать очень большие разрешения", () => {
      const event = {
        type: "ProjectSettingsUpdated",
        payload: {
          settings: {
            resolution: { width: 7680, height: 4320 }, // 8K
            frame_rate: 120,
            audio_sample_rate: 48000,
            audio_channels: 2,
          },
        },
      } as any

      const result = handleProjectSettingsEvent(event)

      expect(result?.resolution).toBe("7680x4320")
      expect(result?.frameRate).toBe("120")
    })

    it("convertFrontendSettingsToBackend должен обрабатывать очень большие разрешения", () => {
      const settings: Partial<ProjectSettings> = {
        resolution: "7680x4320",
      }

      const result = convertFrontendSettingsToBackend(settings)

      expect(result.resolution).toEqual({ width: 7680, height: 4320 })
    })

    it("handleProjectSettingsEvent должен обрабатывать минимальные разрешения", () => {
      const event = {
        type: "ProjectSettingsUpdated",
        payload: {
          settings: {
            resolution: { width: 320, height: 240 },
            frame_rate: 15,
            audio_sample_rate: 48000,
            audio_channels: 2,
          },
        },
      } as any

      const result = handleProjectSettingsEvent(event)

      expect(result?.resolution).toBe("320x240")
      expect(result?.frameRate).toBe("15")
    })

    it("должен корректно вычислять aspect ratio с небольшими погрешностями", () => {
      // Разрешение близкое к 16:9, но не точное
      const event = {
        type: "ProjectSettingsUpdated",
        payload: {
          settings: {
            resolution: { width: 1920, height: 1100 }, // Отличается от точного 16:9 (1080)
            frame_rate: 30,
            audio_sample_rate: 48000,
            audio_channels: 2,
          },
        },
      } as any

      const result = handleProjectSettingsEvent(event)

      // Должно определиться как custom, так как отклонение больше 0.01
      expect(result?.aspectRatio.label).toBe("custom")
    })
  })
})

/**
 * Backend Event Handlers для Project Settings
 *
 * Обрабатывает события от Rust backend для синхронизации настроек проекта
 * Используется паттерн Command-Event для синхронизации
 */

import { createLogger } from "@/lib/tauri-logger"
import type { ProjectEvent } from "@/types/generated/tauri-bindings"
import type { ProjectSettings } from "../types/project"

const logger = createLogger({ module: "ProjectSettingsEventHandlers" })

/**
 * Главный обработчик backend событий для Project Settings
 * Возвращает обновленные настройки проекта при получении события
 */
export function handleProjectSettingsEvent(event: ProjectEvent): ProjectSettings | null {
  logger.info("[handleProjectSettingsEvent] Called with event", {
    eventType: event.type,
    hasPayload: !!(event as any).payload,
    payload: JSON.stringify((event as any).payload),
  })

  if (event.type !== "ProjectSettingsUpdated") {
    logger.info("[handleProjectSettingsEvent] Event type is not ProjectSettingsUpdated, ignoring")
    return null
  }

  const settings = (event as any).payload?.settings
  if (!settings) {
    logger.error("[handleProjectSettingsEvent] No settings in event payload!")
    return null
  }

  logger.info("[handleProjectSettingsEvent] Converting backend settings to frontend", {
    backendSettings: settings,
  })

  const frontendSettings = convertBackendSettingsToFrontend(settings)

  logger.info("[handleProjectSettingsEvent] Converted to frontend format", {
    frontendSettings,
  })

  return frontendSettings
}

/**
 * Преобразует backend настройки проекта в frontend формат
 */
function convertBackendSettingsToFrontend(
  backendSettings: any, // ProjectSettings from Rust
): ProjectSettings {
  // Backend структура: { resolution: { width, height }, frame_rate, audio_sample_rate, audio_channels }
  // Frontend структура: { resolution: "1920x1080", frameRate: "30", colorSpace: "sdr", aspectRatio: {...} }

  const resolution = `${backendSettings.resolution.width}x${backendSettings.resolution.height}`
  const frameRate = backendSettings.frame_rate.toString()

  // Определяем aspect ratio из разрешения
  const aspectRatio = getAspectRatioFromResolution(backendSettings.resolution.width, backendSettings.resolution.height)

  return {
    resolution,
    frameRate: frameRate as any, // FrameRate type
    colorSpace: "sdr", // По умолчанию, так как backend не хранит colorSpace
    aspectRatio,
  }
}

/**
 * Определяет aspect ratio из разрешения
 */
function getAspectRatioFromResolution(width: number, height: number) {
  const ratio = width / height
  const ratioStr = `${width}:${height}`

  // Проверяем стандартные соотношения сторон
  if (Math.abs(ratio - 16 / 9) < 0.01) {
    return {
      label: "16:9",
      textLabel: "Широкоэкранный",
      description: "YouTube",
      value: { width: 1920, height: 1080, name: "16:9" },
    }
  }
  if (Math.abs(ratio - 9 / 16) < 0.01) {
    return {
      label: "9:16",
      textLabel: "Портрет",
      description: "TikTok, YouTube Shorts",
      value: { width: 1080, height: 1920, name: "9:16" },
    }
  }
  if (Math.abs(ratio - 1) < 0.01) {
    return {
      label: "1:1",
      textLabel: "Социальные сети",
      description: "Instagram, Social media posts",
      value: { width: 1080, height: 1080, name: "1:1" },
    }
  }
  if (Math.abs(ratio - 4 / 3) < 0.01) {
    return {
      label: "4:3",
      textLabel: "Стандарт",
      description: "TV",
      value: { width: 1440, height: 1080, name: "4:3" },
    }
  }
  if (Math.abs(ratio - 4 / 5) < 0.01) {
    return {
      label: "4:5",
      textLabel: "Вертикальный",
      description: "Vertical post",
      value: { width: 1024, height: 1280, name: "4:5" },
    }
  }
  if (Math.abs(ratio - 21 / 9) < 0.01) {
    return {
      label: "21:9",
      textLabel: "Кинотеатр",
      description: "Movie",
      value: { width: 2560, height: 1080, name: "21:9" },
    }
  }

  // Кастомное соотношение
  return {
    label: "custom",
    textLabel: "",
    description: "User",
    value: { width, height, name: ratioStr },
  }
}

/**
 * Преобразует frontend настройки проекта в backend формат
 * Используется при отправке команды на backend
 */
export function convertFrontendSettingsToBackend(settings: Partial<ProjectSettings>): any {
  const result: any = {}

  // Преобразуем resolution из строки в объект
  if (settings.resolution) {
    const [width, height] = settings.resolution.split("x").map(Number)
    if (!Number.isNaN(width) && !Number.isNaN(height)) {
      result.resolution = { width, height }
    }
  }

  // Если resolution не задан, но есть aspectRatio.value - используем его
  if (!result.resolution && settings.aspectRatio?.value) {
    const { width, height } = settings.aspectRatio.value
    if (width && height) {
      result.resolution = { width, height }
    }
  }

  // Преобразуем frameRate из строки в число
  if (settings.frameRate) {
    result.frame_rate = Number.parseFloat(settings.frameRate)
  }

  // Backend не использует colorSpace и aspectRatio, игнорируем их

  // Добавляем дефолтные значения для обязательных полей backend
  if (!result.audio_sample_rate) {
    result.audio_sample_rate = 48000 // Стандартное значение
  }

  if (!result.audio_channels) {
    result.audio_channels = 2 // Стерео
  }

  return result
}

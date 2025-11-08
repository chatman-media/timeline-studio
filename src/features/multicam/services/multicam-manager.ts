/**
 * Менеджер мультикамерной системы
 * Глобальный синглтон для управления мультикамерным монтажом
 */

import { createLogger } from "@/lib/tauri-logger"
import type { MulticamCommand } from "../types/multicam"
import { SimpleEventBus } from "../utils/simple-event-bus"

const logger = createLogger({ module: "MulticamManager" })

export interface MulticamManagerEvents extends Record<string, (...args: any) => void> {
  "camera-switched": (angleIndex: number) => void
  "sync-updated": (angleIndex: number, offset: number) => void
  "angle-added": (clipId: string) => void
  "angle-removed": (angleIndex: number) => void
}

class MulticamManager extends SimpleEventBus<MulticamManagerEvents> {
  private static instance: MulticamManager
  private currentAngleIndex = 0
  private baseClipId: string | null = null

  private constructor() {
    super()
  }

  static getInstance(): MulticamManager {
    if (!MulticamManager.instance) {
      MulticamManager.instance = new MulticamManager()
    }
    return MulticamManager.instance
  }

  // Установка базового клипа для мультикамерной группы
  setBaseClip(clipId: string | null) {
    this.baseClipId = clipId
  }

  getBaseClip(): string | null {
    return this.baseClipId
  }

  // Переключение на конкретную камеру
  switchToCamera(angleIndex: number) {
    logger.info(`[MulticamManager] Switching to camera ${angleIndex + 1}`)
    this.currentAngleIndex = angleIndex
    this.emit("camera-switched", angleIndex)
  }

  // Переключение по номеру (для горячих клавиш 1-9)
  switchToCameraByNumber(cameraNumber: number) {
    // Камеры нумеруются с 1, индексы с 0
    const angleIndex = cameraNumber - 1
    this.switchToCamera(angleIndex)
  }

  // Получение текущего угла
  getCurrentAngleIndex(): number {
    return this.currentAngleIndex
  }

  // Обработка команд
  executeCommand(command: MulticamCommand) {
    switch (command.type) {
      case "switch-camera":
        this.switchToCamera(command.angleIndex)
        break
      case "sync-angle":
        this.emit("sync-updated", command.angleIndex, command.offset)
        break
      case "add-angle":
        this.emit("angle-added", command.clipId)
        break
      case "remove-angle":
        this.emit("angle-removed", command.angleIndex)
        break
      default:
        logger.warn("[MulticamManager] Unknown command type")
    }
  }
}

// Экспортируем синглтон
export const multicamManager = MulticamManager.getInstance()

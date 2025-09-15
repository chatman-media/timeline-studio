/**
 * AI инструмент для управления воспроизведением с использованием BaseAITool
 */

import { type AIToolExecutionOptions, type AIToolLogger, type AIToolResult, BaseAITool } from "../../base-ai-tool"

import type { PlaybackControlParams, PlayerToolResult } from "./types"
import { getPlayerState, hasLoadedMedia, setPlayerState } from "./utils/helpers"

// Типы для управления воспроизведением
export interface PlaybackControlInput {
  operation: "control_playback"
  action: "play" | "pause" | "stop" | "seek" | "volume" | "speed"
  value?: number
  position?: number
  reason: string
}

export interface PlaybackControlResult {
  operation: string
  success: boolean
  action: string
  previousState: any
  newState: any
  message: string
  recommendations: string[]
  warnings?: string[]
}

/**
 * AI инструмент для управления воспроизведением с унифицированной обработкой ошибок
 */
export class PlaybackControlTool extends BaseAITool {
  constructor(logger?: AIToolLogger) {
    super("PlaybackControlTool", logger)
  }

  /**
   * Выполняет операции управления воспроизведением
   */
  public async processPlaybackControl(
    input: PlaybackControlInput,
    options: AIToolExecutionOptions = {},
  ): Promise<AIToolResult<PlaybackControlResult>> {
    return this.executeWithErrorHandling(async () => {
      // Валидация входных данных
      const validation = this.validateInput(input, (data) => {
        const errors: string[] = []

        if (data.operation !== "control_playback") {
          errors.push(`Неподдерживаемая операция: ${data.operation}`)
        }

        const validActions = ["play", "pause", "stop", "seek", "volume", "speed"]
        if (!validActions.includes(data.action)) {
          errors.push(`Неподдерживаемое действие: ${data.action}`)
        }

        if (data.action === "seek" && data.position === undefined) {
          errors.push("Требуется указать position для действия seek")
        }

        if ((data.action === "volume" || data.action === "speed") && data.value === undefined) {
          errors.push(`Требуется указать value для действия ${data.action}`)
        }

        if (!data.reason) {
          errors.push("Требуется указать причину управления воспроизведением")
        }

        return { isValid: errors.length === 0, errors }
      })

      if (!validation.isValid) {
        throw new Error(validation.errors.join(", "))
      }

      // Проверка загруженного медиа
      if (!hasLoadedMedia()) {
        throw new Error("Нет загруженного медиа для управления воспроизведением")
      }

      const currentState = getPlayerState()
      if (!currentState) {
        throw new Error("Не удалось получить состояние плеера")
      }

      const result = await this.controlPlaybackInternal(input, currentState)

      return result
    }, options)
  }

  private async controlPlaybackInternal(
    params: PlaybackControlInput,
    currentState: any,
  ): Promise<PlaybackControlResult> {
    let message = ""
    const updates: any = {}
    const recommendations: string[] = []

    switch (params.action) {
      case "play":
        if (currentState.isPlaying) {
          message = "Воспроизведение уже активно"
          recommendations.push("Используйте pause для остановки")
        } else {
          updates.isPlaying = true
          message = "Воспроизведение запущено"
          recommendations.push("Используйте pause для остановки")
          recommendations.push("Настройте громкость и скорость при необходимости")
        }
        break

      case "pause":
        if (!currentState.isPlaying) {
          message = "Воспроизведение уже приостановлено"
          recommendations.push("Используйте play для запуска")
        } else {
          updates.isPlaying = false
          message = "Воспроизведение приостановлено"
          recommendations.push("Используйте play для продолжения")
        }
        break

      case "stop":
        updates.isPlaying = false
        updates.currentTime = 0
        message = "Воспроизведение остановлено"
        recommendations.push("Используйте play для начала воспроизведения")
        break

      case "seek": {
        const clampedPosition = Math.max(0, Math.min(params.position!, currentState.duration))
        updates.currentTime = clampedPosition
        message = `Перемотка на ${clampedPosition.toFixed(2)} секунд`
        recommendations.push("Проверьте правильность позиции в плеере")
        if (clampedPosition !== params.position!) {
          recommendations.push("Позиция была скорректирована в пределах длительности медиа")
        }
        break
      }

      case "volume": {
        const clampedVolume = Math.max(0, Math.min(params.value!, 1))
        updates.volume = clampedVolume
        updates.muted = clampedVolume === 0
        message = `Громкость установлена на ${(clampedVolume * 100).toFixed(0)}%`
        if (clampedVolume === 0) {
          recommendations.push("Звук отключен (muted)")
        } else if (clampedVolume < 0.3) {
          recommendations.push("Низкая громкость может затруднить восприятие")
        }
        break
      }

      case "speed": {
        const clampedSpeed = Math.max(0.1, Math.min(params.value!, 4))
        updates.playbackSpeed = clampedSpeed
        message = `Скорость воспроизведения установлена на ${clampedSpeed}x`
        if (clampedSpeed < 0.5) {
          recommendations.push("Медленное воспроизведение для детального анализа")
        } else if (clampedSpeed > 2) {
          recommendations.push("Быстрое воспроизведение может ухудшить качество")
        }
        break
      }

      default:
        throw new Error(`Неизвестное действие: ${params.action}`)
    }

    // Применяем обновления
    if (Object.keys(updates).length > 0) {
      setPlayerState(updates)
    }

    return {
      operation: "control_playback",
      success: true,
      action: params.action,
      previousState: currentState,
      newState: { ...currentState, ...updates },
      message,
      recommendations,
    }
  }
}

// Создаем singleton экземпляр
const playbackControlTool = new PlaybackControlTool()

/**
 * Функция-обертка для обратной совместимости
 */
export async function executePlaybackControlTool(
  operation: PlaybackControlInput["operation"],
  params: Omit<PlaybackControlInput, "operation">,
  options?: AIToolExecutionOptions,
): Promise<AIToolResult<PlaybackControlResult>> {
  return playbackControlTool.processPlaybackControl({ operation, ...params }, options)
}

/**
 * Функция для обратной совместимости
 */
export async function controlPlayback(params: PlaybackControlParams): Promise<PlayerToolResult> {
  const result = await playbackControlTool.processPlaybackControl({
    operation: "control_playback",
    action: params.action,
    value: params.value,
    position: params.position,
    reason: "Управление воспроизведением",
  })

  if (result.success) {
    return {
      success: true,
      message: result.data?.message ?? "",
      data: {
        action: result.data?.action,
        previousState: result.data?.previousState,
        newState: result.data?.newState,
      },
    }
  }
  return {
    success: false,
    message: result.error?.message || "Ошибка управления воспроизведением",
    errors: [result.error?.message || "Неизвестная ошибка"],
  }
}

// Экспорт для обратной совместимости
export const controlPlaybackTool: any = {
  name: "control_playback",
  description: "Управляет воспроизведением медиа в плеере",
  input_schema: {
    type: "object",
    properties: {
      action: {
        type: "string",
        enum: ["play", "pause", "stop", "seek", "volume", "speed"],
        description: "Действие для выполнения",
      },
      value: {
        type: "number",
        description: "Значение для действия (громкость 0-1, скорость 0.1-4)",
      },
      position: {
        type: "number",
        description: "Позиция для перемотки в секундах",
      },
    },
    required: ["action"],
  },
}

import { useCallback, useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { useNotifications } from "@/domains/system-integration"
import {
  CompilerSettings,
  FfmpegCapabilities,
  GpuCapabilities,
  GpuEncoder,
  GpuInfo,
  SystemInfo,
} from "@/domains/video-editing"
import { videoCompilerSystemService } from "@/domains/video-editing/services/video-compiler-system-service"
import { createLogger } from "@/lib/tauri-logger"

const logger = createLogger("UseGpuCapabilities")

interface UseGpuCapabilitiesReturn {
  // Состояние
  gpuCapabilities: GpuCapabilities | null
  currentGpu: GpuInfo | null
  systemInfo: SystemInfo | null
  ffmpegCapabilities: FfmpegCapabilities | null
  compilerSettings: CompilerSettings | null
  isLoading: boolean
  error: string | null

  // Методы
  refreshCapabilities: () => Promise<void>
  updateSettings: (settings: CompilerSettings) => Promise<void>
  checkHardwareAcceleration: () => Promise<boolean>
}

export function useGpuCapabilities(): UseGpuCapabilitiesReturn {
  const { t } = useTranslation()
  const { showSuccess, showError, showInfo } = useNotifications()
  const [gpuCapabilities, setGpuCapabilities] = useState<GpuCapabilities | null>(null)
  const [currentGpu, setCurrentGpu] = useState<GpuInfo | null>(null)
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null)
  const [ffmpegCapabilities, setFfmpegCapabilities] = useState<FfmpegCapabilities | null>(null)
  const [compilerSettings, setCompilerSettings] = useState<CompilerSettings | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Получить все возможности системы
  const refreshCapabilities = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      void logger.info("Refreshing GPU capabilities...")

      // Загружаем все данные параллельно
      const [gpuResponse, system, ffmpeg, settings] = await Promise.all([
        videoCompilerSystemService.getGpuCapabilitiesFull().catch((err: unknown) => {
          void logger.error("Failed to get GPU capabilities:", { error: err })
          throw err
        }),
        videoCompilerSystemService.getSystemInfo().catch((err: unknown) => {
          void logger.error("Failed to get system info:", { error: err })
          throw err
        }),
        videoCompilerSystemService.checkFfmpegCapabilities().catch((err: unknown) => {
          void logger.error("Failed to check FFmpeg:", { error: err })
          throw err
        }),
        videoCompilerSystemService.getCompilerSettings().catch((err: unknown) => {
          void logger.error("Failed to get compiler settings:", { error: err })
          throw err
        }),
      ])

      void logger.info("GPU Response:", { gpuResponse })

      // Преобразуем ответ в нужный формат
      const gpu: GpuCapabilities = {
        available_encoders: gpuResponse.available_encoders || [],
        recommended_encoder: gpuResponse.recommended_encoder,
        current_gpu: gpuResponse.current_gpu,
        hardware_acceleration_supported: gpuResponse.hardware_acceleration_supported || false,
      }

      setGpuCapabilities(gpu)
      setCurrentGpu(gpu.current_gpu || null)
      setSystemInfo(system)
      setFfmpegCapabilities(ffmpeg)
      setCompilerSettings(settings)

      // Показываем информацию о GPU
      if (gpu.hardware_acceleration_supported && gpu.recommended_encoder) {
        showSuccess(
          t("videoCompiler.gpu.accelerationAvailable"),
          t("videoCompiler.gpu.recommendedEncoder", { encoder: gpu.recommended_encoder }),
        )
      } else {
        showInfo(t("videoCompiler.gpu.accelerationUnavailable"), t("videoCompiler.gpu.cpuEncodingWillBeUsed"))
      }
    } catch (err) {
      let errorMsg = err instanceof Error ? err.message : t("common.unknownError")

      // Специальная обработка для Apple Silicon
      if (errorMsg.includes("Metal") || errorMsg.includes("VideoToolbox")) {
        errorMsg = t(
          "videoCompiler.gpu.appleMetalError",
          "Apple Metal/VideoToolbox initialization error. This is usually temporary.",
        )
      }

      setError(errorMsg)
      void logger.error("GPU capabilities error:", { error: err })

      // Не показываем уведомление при первой загрузке, только логируем
      if (!isLoading) {
        showError(t("videoCompiler.gpu.errorGettingInfo"), errorMsg)
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Обновить настройки компилятора
  const updateSettings = useCallback(
    async (newSettings: CompilerSettings) => {
      try {
        await videoCompilerSystemService.setHardwareAcceleration(newSettings.hardware_acceleration)
        setCompilerSettings(newSettings)

        showSuccess(
          t("videoCompiler.gpu.settingsUpdated"),
          newSettings.hardware_acceleration
            ? t("videoCompiler.gpu.accelerationEnabled")
            : t("videoCompiler.gpu.accelerationDisabled"),
        )
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : t("common.unknownError")
        showError(t("videoCompiler.gpu.errorUpdatingSettings"), errorMsg)
        throw err
      }
    },
    [showSuccess, showError, t],
  )

  // Проверить доступность аппаратного ускорения
  const checkHardwareAcceleration = useCallback(async (): Promise<boolean> => {
    try {
      return await videoCompilerSystemService.checkHardwareAccelerationSupport()
    } catch (err) {
      void logger.error("Failed to check hardware acceleration:", { error: err })
      return false
    }
  }, [])

  // Загружаем данные при монтировании
  useEffect(() => {
    void refreshCapabilities()
  }, [refreshCapabilities])

  return {
    gpuCapabilities,
    currentGpu,
    systemInfo,
    ffmpegCapabilities,
    compilerSettings,
    isLoading,
    error,
    refreshCapabilities,
    updateSettings,
    checkHardwareAcceleration,
  }
}

// Вспомогательные функции

/**
 * Получить человекочитаемое название GPU кодировщика
 */
export function getGpuEncoderDisplayName(encoder: string, t: (key: string, params?: any) => string): string {
  const names: Record<string, string> = {
    Nvenc: "NVIDIA NVENC",
    QuickSync: "Intel QuickSync",
    Vaapi: "VA-API (Linux)",
    VideoToolbox: "Apple VideoToolbox",
    AMF: "AMD AMF",
    None: t("videoCompiler.gpu.cpuNoAcceleration"),
  }
  return names[encoder] || encoder
}

/**
 * Получить цвет индикатора для GPU
 */
export function getGpuStatusColor(supported: boolean): string {
  return supported ? "text-green-600 dark:text-green-400" : "text-yellow-600 dark:text-yellow-400"
}

/**
 * Форматировать объем памяти GPU
 */
export function formatGpuMemory(bytes: number, t: (key: string, params?: any) => string): string {
  if (!bytes) return t("common.unknown")

  const gb = bytes / (1024 * 1024 * 1024)
  if (gb >= 1) {
    return t("common.gigabytes", { value: gb.toFixed(1) })
  }

  const mb = bytes / (1024 * 1024)
  return t("common.megabytes", { value: Math.round(mb) })
}

/**
 * Форматировать использование GPU
 */
export function formatGpuUtilization(utilization: number, t: (key: string, params?: any) => string): string {
  if (utilization === undefined) return t("common.unknown")
  return `${Math.round(utilization)}%`
}

/**
 * Получить рекомендации по настройкам
 */
export function getGpuRecommendations(
  capabilities: GpuCapabilities | null,
  t: (key: string, values?: any) => string,
): string[] {
  const recommendations: string[] = []

  if (!capabilities) {
    return [t("videoCompiler.gpu.loadingInfo")]
  }

  if (!capabilities.hardware_acceleration_supported) {
    recommendations.push(t("videoCompiler.gpu.recommendations.noAcceleration"))
    recommendations.push(t("videoCompiler.gpu.recommendations.installDrivers"))
    return recommendations
  }

  if (capabilities.recommended_encoder === GpuEncoder.Nvenc) {
    recommendations.push(t("videoCompiler.gpu.recommendations.nvenc"))
    recommendations.push(t("videoCompiler.gpu.recommendations.nvencQuality"))
  } else if (capabilities.recommended_encoder === GpuEncoder.QuickSync) {
    recommendations.push(t("videoCompiler.gpu.recommendations.quicksync"))
    recommendations.push(t("videoCompiler.gpu.recommendations.quicksyncQuality"))
  } else if (capabilities.recommended_encoder === GpuEncoder.VideoToolbox) {
    recommendations.push(t("videoCompiler.gpu.recommendations.videotoolbox"))
    recommendations.push(t("videoCompiler.gpu.recommendations.videotoolboxCodec"))
  }

  if (capabilities.current_gpu?.memory_total) {
    const memoryGB = capabilities.current_gpu.memory_total / (1024 * 1024 * 1024)
    if (memoryGB < 2) {
      recommendations.push(t("videoCompiler.gpu.recommendations.lowMemory"))
    } else if (memoryGB >= 8) {
      recommendations.push(t("videoCompiler.gpu.recommendations.highMemory"))
    }
  }

  return recommendations
}

import { invoke } from "@tauri-apps/api/core"
import { useCallback, useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import {
  CompilerSettings,
  FfmpegCapabilities,
  GpuCapabilities,
  GpuEncoder,
  GpuInfo,
  SystemInfo,
} from "@/domains/video-editing"

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

      console.log("Refreshing GPU capabilities...")

      // Загружаем все данные параллельно
      const [gpuResponse, system, ffmpeg, settings] = await Promise.all([
        invoke<any>("get_gpu_capabilities_full").catch((err: unknown) => {
          console.error("Failed to get GPU capabilities:", err)
          throw err
        }),
        invoke<SystemInfo>("get_system_info").catch((err: unknown) => {
          console.error("Failed to get system info:", err)
          throw err
        }),
        invoke<FfmpegCapabilities>("check_ffmpeg_capabilities").catch((err: unknown) => {
          console.error("Failed to check FFmpeg:", err)
          throw err
        }),
        invoke<CompilerSettings>("get_compiler_settings_advanced").catch((err: unknown) => {
          console.error("Failed to get compiler settings:", err)
          throw err
        }),
      ])

      console.log("GPU Response:", gpuResponse)

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
        toast.success(t("videoCompiler.gpu.accelerationAvailable"), {
          description: t("videoCompiler.gpu.recommendedEncoder", { encoder: gpu.recommended_encoder }),
        })
      } else {
        toast.info(t("videoCompiler.gpu.accelerationUnavailable"), {
          description: t("videoCompiler.gpu.cpuEncodingWillBeUsed"),
        })
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
      console.error("GPU capabilities error:", err)

      // Не показываем toast при первой загрузке, только логируем
      if (!isLoading) {
        toast.error(t("videoCompiler.gpu.errorGettingInfo"), { description: errorMsg })
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Обновить настройки компилятора
  const updateSettings = useCallback(async (newSettings: CompilerSettings) => {
    try {
      await invoke("set_hardware_acceleration", { enabled: newSettings.hardware_acceleration })
      setCompilerSettings(newSettings)

      toast.success(t("videoCompiler.gpu.settingsUpdated"), {
        description: newSettings.hardware_acceleration
          ? t("videoCompiler.gpu.accelerationEnabled")
          : t("videoCompiler.gpu.accelerationDisabled"),
      })
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : t("common.unknownError")
      toast.error(t("videoCompiler.gpu.errorUpdatingSettings"), { description: errorMsg })
      throw err
    }
  }, [])

  // Проверить доступность аппаратного ускорения
  const checkHardwareAcceleration = useCallback(async (): Promise<boolean> => {
    try {
      return await invoke<boolean>("check_hardware_acceleration_support")
    } catch (err) {
      console.error("Failed to check hardware acceleration:", err)
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

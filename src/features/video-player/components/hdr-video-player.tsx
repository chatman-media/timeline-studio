/**
 * HDR Video Player Component
 *
 * Улучшенный видеоплеер с поддержкой HDR контента:
 * - Автоматическое определение HDR формата
 * - GPU-ускоренное декодирование
 * - HDR tone mapping для SDR дисплеев
 * - Оптимизация под различные кодеки
 */

import { useCallback, useEffect, useRef, useState } from "react"

import { AspectRatio } from "@/components/ui/aspect-ratio"
import { createLogger } from "@/lib/tauri-logger"

const logger = createLogger("video-player:hdr-video-player")

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { TooltipProvider } from "@/components/ui/tooltip"
import { useNotifications } from "@/core/hooks"
import { MediaType } from "@/domains/media-management"
import { usePlayer } from "@/domains/video-editing/providers"
import { useProjectSettings } from "@/features/project-settings"
import { convertVideoSrc } from "@/lib/tauri-utils"
import { getHDRSupportService, type HDRMetadata, type VideoCodecInfo } from "../services/hdr-support"
import { PlayerAIOverlay } from "./player-ai-overlay"
import { PlayerControls } from "./player-controls"

interface HDRPlayerSettings {
  hdrEnabled: boolean
  toneMappingEnabled: boolean
  targetNits: number
  gammaCorrection: number
  saturation: number
  preferredCodec: string
  gpuAcceleration: boolean
}

export function HDRVideoPlayer() {
  const {
    settings: { aspectRatio },
  } = useProjectSettings()
  const { currentVideo: video, currentTime } = usePlayer()
  const { showInfo, showError } = useNotifications()

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [showHDRControls, setShowHDRControls] = useState(false)

  // HDR метаданные и codec информация
  const [hdrMetadata, setHdrMetadata] = useState<HDRMetadata | null>(null)
  const [codecInfo, setCodecInfo] = useState<VideoCodecInfo | null>(null)
  const [deviceCapabilities, setDeviceCapabilities] = useState<any>(null)

  // HDR настройки
  const [hdrSettings, setHdrSettings] = useState<HDRPlayerSettings>({
    hdrEnabled: true,
    toneMappingEnabled: true,
    targetNits: 100, // Стандартные SDR мониторы
    gammaCorrection: 2.2,
    saturation: 1.0,
    preferredCodec: "auto",
    gpuAcceleration: true,
  })

  // Вычисляем соотношение сторон
  const aspectRatioValue = aspectRatio.value.width / aspectRatio.value.height

  const id = "hdr-video-player"

  /**
   * Инициализация HDR поддержки
   */
  useEffect(() => {
    const initializeHDRSupport = async () => {
      try {
        // Определяем возможности устройства
        const capabilities = await getHDRSupportService().detectHDRCapabilities()
        setDeviceCapabilities(capabilities)

        if (capabilities.isHDRSupported) {
          setHdrSettings((prev) => ({
            ...prev,
            targetNits: capabilities.maxDisplayMasteringLuminance,
          }))
        }
      } catch (error) {
        logger.warn("HDR initialization failed", { error })
      }
    }

    void initializeHDRSupport()
  }, [])

  /**
   * Анализ видео при загрузке
   */
  useEffect(() => {
    if (!videoRef.current || !video?.path) return

    const analyzeVideo = async () => {
      const videoElement = videoRef.current!

      try {
        // Ждем загрузки метаданных
        if (videoElement.readyState < 1) {
          await new Promise((resolve) => {
            videoElement.addEventListener("loadedmetadata", resolve, { once: true })
          })
        }

        // Получаем HDR метаданные
        const metadata = await getHDRSupportService().parseHDRMetadata(videoElement)
        setHdrMetadata(metadata)

        // Получаем информацию о кодеке
        const codec = await getHDRSupportService().getVideoCodecInfo(videoElement)
        setCodecInfo(codec)

        // Показываем HDR controls если контент HDR
        if (metadata.isHdr) {
          setShowHDRControls(true)
          showInfo("HDR видео", `HDR ${metadata.format} видео обнаружено`)
        }
      } catch (error) {
        logger.error("video analysis failed", { error })
        showError("Ошибка анализа", "Не удалось проанализировать видео")
      }
    }

    void analyzeVideo()
  }, [video?.path, showInfo, showError])

  /**
   * Применение HDR tone mapping
   */
  const applyHDRProcessing = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || !hdrMetadata?.isHdr) return

    if (!hdrSettings.toneMappingEnabled || !hdrSettings.hdrEnabled) return

    const success = getHDRSupportService().applyHDRToneMapping(videoRef.current, canvasRef.current, {
      targetNits: hdrSettings.targetNits,
      gammaCorrection: hdrSettings.gammaCorrection,
      saturation: hdrSettings.saturation,
    })

    if (!success) {
      logger.warn("HDR tone mapping failed, falling back to standard rendering")
    }
  }, [hdrMetadata, hdrSettings])

  /**
   * Обработка кадров для HDR
   */
  useEffect(() => {
    if (!videoRef.current || !hdrMetadata?.isHdr) return

    const videoElement = videoRef.current
    let animationFrame: number

    const processFrame = () => {
      if (hdrSettings.hdrEnabled && hdrSettings.toneMappingEnabled) {
        applyHDRProcessing()
      }
      animationFrame = requestAnimationFrame(processFrame)
    }

    if (videoElement.readyState >= 2) {
      animationFrame = requestAnimationFrame(processFrame)
    }

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame)
      }
    }
  }, [hdrMetadata, hdrSettings, applyHDRProcessing])

  /**
   * Обновление HDR настроек
   */
  const updateHDRSettings = (key: keyof HDRPlayerSettings, value: any) => {
    setHdrSettings((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  /**
   * Выбор оптимального кодека
   */
  const getOptimalCodec = useCallback((): string => {
    if (!codecInfo || hdrSettings.preferredCodec !== "auto") {
      return hdrSettings.preferredCodec
    }

    // Для HDR контента предпочитаем HEVC
    if (hdrMetadata?.isHdr && codecInfo.supportedDecoders.includes("h265")) {
      return "h265"
    }

    // Для 4K предпочитаем более эффективные кодеки
    if (codecInfo.width >= 3840 && codecInfo.supportedDecoders.includes("av1")) {
      return "av1"
    }

    // Fallback на самый поддерживаемый
    return codecInfo.supportedDecoders[0] || "h264"
  }, [codecInfo, hdrMetadata, hdrSettings.preferredCodec])

  if (!video?.path) {
    return (
      <div className="media-player-container relative flex h-full flex-col">
        <div className="relative flex-1 bg-black">
          <div className="flex h-full w-full items-center justify-center">
            <div className="text-muted-foreground">Нет видео</div>
          </div>
        </div>
        <PlayerControls
          currentTime={0}
          file={video || { id: "", path: "", name: "Нет видео", type: MediaType.Video, size: 0, isVideo: true }}
        />
      </div>
    )
  }

  return (
    <TooltipProvider>
      <div className="media-player-container relative flex h-full flex-col">
        <div className="relative flex-1 bg-black">
          <div className="flex h-full w-full items-center justify-center">
            <div className="max-h-[calc(100%-85px)] w-full max-w-[100%]">
              <AspectRatio ratio={aspectRatioValue} className="bg-black">
                <div className="relative h-full w-full">
                  <video
                    ref={videoRef}
                    key={video.id || "no-video"}
                    src={convertVideoSrc(video.path)}
                    controls={false}
                    autoPlay={false}
                    loop={false}
                    disablePictureInPicture
                    preload="auto"
                    tabIndex={0}
                    playsInline
                    muted={false}
                    className="absolute inset-0 h-full w-full object-cover focus:outline-none"
                    style={{
                      position: "absolute",
                      top: "0",
                      left: "0",
                      width: "100%",
                      height: "100%",
                      display: hdrSettings.toneMappingEnabled && hdrMetadata?.isHdr ? "none" : "block",
                      zIndex: 1,
                    }}
                  />

                  {/* Canvas для HDR tone mapping */}
                  {hdrSettings.toneMappingEnabled && hdrMetadata?.isHdr && (
                    <canvas
                      ref={canvasRef}
                      className="absolute inset-0 h-full w-full object-cover"
                      style={{
                        position: "absolute",
                        top: "0",
                        left: "0",
                        width: "100%",
                        height: "100%",
                        zIndex: 2,
                      }}
                    />
                  )}

                  {/* HDR информация */}
                  {hdrMetadata?.isHdr && (
                    <div className="absolute left-4 top-4 flex flex-col gap-2">
                      <div className="rounded bg-purple-500/20 px-3 py-1">
                        <span className="text-sm text-purple-300 font-medium">HDR {hdrMetadata.format}</span>
                      </div>

                      {codecInfo && (
                        <div className="rounded bg-blue-500/20 px-3 py-1">
                          <span className="text-xs text-blue-300">
                            {codecInfo.codec.toUpperCase()} • {codecInfo.width}×{codecInfo.height} •{" "}
                            {Math.round(codecInfo.frameRate)}fps
                          </span>
                        </div>
                      )}

                      {hdrSettings.gpuAcceleration && codecInfo?.gpuAcceleration && (
                        <div className="rounded bg-green-500/20 px-3 py-1">
                          <span className="text-xs text-green-300">GPU ускорение</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Кнопка HDR настроек */}
                  <div className="absolute right-4 top-4 flex flex-col gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowHDRControls(!showHDRControls)}
                      className="bg-black/50 hover:bg-black/70"
                    >
                      HDR настройки
                    </Button>
                  </div>

                  {/* HDR Controls Panel */}
                  {showHDRControls && hdrMetadata?.isHdr && (
                    <Card className="absolute right-4 top-16 w-80 bg-black/90 border-gray-700">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm text-white">HDR Настройки</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* HDR Toggle */}
                        <div className="flex items-center justify-between">
                          <Label htmlFor={`${id}-hdr-enabled`} className="text-sm text-gray-300">
                            HDR обработка
                          </Label>
                          <Switch
                            id={`${id}-hdr-enabled`}
                            checked={hdrSettings.hdrEnabled}
                            onCheckedChange={(checked) => updateHDRSettings("hdrEnabled", checked)}
                          />
                        </div>

                        {/* Tone Mapping Toggle */}
                        <div className="flex items-center justify-between">
                          <Label htmlFor={`${id}-tone-mapping`} className="text-sm text-gray-300">
                            Tone mapping
                          </Label>
                          <Switch
                            id={`${id}-tone-mapping`}
                            checked={hdrSettings.toneMappingEnabled}
                            onCheckedChange={(checked) => updateHDRSettings("toneMappingEnabled", checked)}
                            disabled={!hdrSettings.hdrEnabled}
                          />
                        </div>

                        {/* Target Nits */}
                        <div className="space-y-2">
                          <Label className="text-sm text-gray-300">
                            Яркость дисплея: {hdrSettings.targetNits} nits
                          </Label>
                          <Slider
                            value={[hdrSettings.targetNits]}
                            onValueChange={([value]) => updateHDRSettings("targetNits", value)}
                            max={1000}
                            min={80}
                            step={10}
                            disabled={!hdrSettings.hdrEnabled || !hdrSettings.toneMappingEnabled}
                            className="w-full"
                          />
                        </div>

                        {/* Gamma Correction */}
                        <div className="space-y-2">
                          <Label className="text-sm text-gray-300">
                            Гамма коррекция: {hdrSettings.gammaCorrection.toFixed(1)}
                          </Label>
                          <Slider
                            value={[hdrSettings.gammaCorrection]}
                            onValueChange={([value]) => updateHDRSettings("gammaCorrection", value)}
                            max={3.0}
                            min={1.0}
                            step={0.1}
                            disabled={!hdrSettings.hdrEnabled || !hdrSettings.toneMappingEnabled}
                            className="w-full"
                          />
                        </div>

                        {/* Saturation */}
                        <div className="space-y-2">
                          <Label className="text-sm text-gray-300">
                            Насыщенность: {hdrSettings.saturation.toFixed(1)}
                          </Label>
                          <Slider
                            value={[hdrSettings.saturation]}
                            onValueChange={([value]) => updateHDRSettings("saturation", value)}
                            max={2.0}
                            min={0.0}
                            step={0.1}
                            disabled={!hdrSettings.hdrEnabled || !hdrSettings.toneMappingEnabled}
                            className="w-full"
                          />
                        </div>

                        {/* Preferred Codec */}
                        <div className="space-y-2">
                          <Label className="text-sm text-gray-300">Предпочитаемый кодек</Label>
                          <Select
                            value={hdrSettings.preferredCodec}
                            onValueChange={(value) => updateHDRSettings("preferredCodec", value)}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="auto">Автоматически</SelectItem>
                              <SelectItem value="h264">H.264</SelectItem>
                              <SelectItem value="h265">H.265/HEVC</SelectItem>
                              <SelectItem value="vp9">VP9</SelectItem>
                              <SelectItem value="av1">AV1</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {/* GPU Acceleration */}
                        <div className="flex items-center justify-between">
                          <Label htmlFor={`${id}-gpu-accel`} className="text-sm text-gray-300">
                            GPU ускорение
                          </Label>
                          <Switch
                            id={`${id}-gpu-accel`}
                            checked={hdrSettings.gpuAcceleration}
                            onCheckedChange={(checked) => updateHDRSettings("gpuAcceleration", checked)}
                          />
                        </div>

                        {/* Device Info */}
                        {deviceCapabilities && (
                          <div className="pt-2 border-t border-gray-700">
                            <Label className="text-xs text-gray-400">Возможности устройства:</Label>
                            <div className="text-xs text-gray-500 mt-1 space-y-1">
                              <div>HDR: {deviceCapabilities.isHDRSupported ? "Да" : "Нет"}</div>
                              <div>Цветовая гамма: {deviceCapabilities.colorGamut}</div>
                              <div>Макс. яркость: {deviceCapabilities.maxDisplayMasteringLuminance} nits</div>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  {/* AI Analysis Overlay */}
                  <PlayerAIOverlay className="z-10" />
                </div>
              </AspectRatio>
            </div>
          </div>
        </div>
        <PlayerControls currentTime={currentTime} file={video} />
      </div>
    </TooltipProvider>
  )
}

HDRVideoPlayer.displayName = "HDRVideoPlayer"

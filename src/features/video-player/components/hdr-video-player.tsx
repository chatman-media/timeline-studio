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

import { AspectRatio } from "@timeline-studio/ui/components/aspect-ratio"
import { createLogger } from "@/lib/tauri-logger"

const logger = createLogger("video-player:hdr-video-player")

import { Button } from "@timeline-studio/ui/components/button"
import { Card, CardContent, CardHeader, CardTitle } from "@timeline-studio/ui/components/card"
import { Label } from "@timeline-studio/ui/components/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@timeline-studio/ui/components/select"
import { Slider } from "@timeline-studio/ui/components/slider"
import { Switch } from "@timeline-studio/ui/components/switch"
import { TooltipProvider } from "@timeline-studio/ui/components/tooltip"
import { useNotifications } from "@timeline-studio/core/hooks"
import { MediaType } from "@timeline-studio/core/types"
import { useProjectSettings } from "@/features/project-settings"
import { usePlayer } from "@/features/timeline/providers/player-provider"
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
            videoElement.addEventListener("loadedmetadata", resolve, {
              once: true,
            })
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
      <div className="media-player-container relative flex h-full flex-col" data-oid="izib-c4">
        <div className="relative flex-1 bg-black" data-oid="lwz1-:r">
          <div className="flex h-full w-full items-center justify-center" data-oid="_h-dris">
            <div className="text-muted-foreground" data-oid="0m4u0-z">
              Нет видео
            </div>
          </div>
        </div>
        <PlayerControls
          currentTime={0}
          file={
            video || {
              id: "",
              path: "",
              name: "Нет видео",
              type: MediaType.Video,
              size: 0,
              isVideo: true,
            }
          }
          data-oid="6:qgpq8"
        />
      </div>
    )
  }

  return (
    <TooltipProvider data-oid=":k81_6z">
      <div className="media-player-container relative flex h-full flex-col" data-oid="lmykkqm">
        <div className="relative flex-1 bg-black" data-oid="ui._9fj">
          <div className="flex h-full w-full items-center justify-center" data-oid="kglnrv6">
            <div className="max-h-[calc(100%-85px)] w-full max-w-[100%]" data-oid="9dudhqs">
              <AspectRatio ratio={aspectRatioValue} className="bg-black" data-oid="c9.3aj-">
                <div className="relative h-full w-full" data-oid="6h-6koh">
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
                    data-oid="e021b9z"
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
                      data-oid="yu.w-vj"
                    />
                  )}

                  {/* HDR информация */}
                  {hdrMetadata?.isHdr && (
                    <div className="absolute left-4 top-4 flex flex-col gap-2" data-oid="7hb5y1w">
                      <div className="rounded bg-purple-500/20 px-3 py-1" data-oid="n7z1jdl">
                        <span className="text-sm text-purple-300 font-medium" data-oid="r.qt8g.">
                          HDR {hdrMetadata.format}
                        </span>
                      </div>

                      {codecInfo && (
                        <div className="rounded bg-blue-500/20 px-3 py-1" data-oid="8k_77j.">
                          <span className="text-xs text-blue-300" data-oid="e:x9xzs">
                            {codecInfo.codec.toUpperCase()} • {codecInfo.width}×{codecInfo.height} •{" "}
                            {Math.round(codecInfo.frameRate)}fps
                          </span>
                        </div>
                      )}

                      {hdrSettings.gpuAcceleration && codecInfo?.gpuAcceleration && (
                        <div className="rounded bg-green-500/20 px-3 py-1" data-oid="wtun5a:">
                          <span className="text-xs text-green-300" data-oid="swgtoj2">
                            GPU ускорение
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Кнопка HDR настроек */}
                  <div className="absolute right-4 top-4 flex flex-col gap-2" data-oid="k2ou59:">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowHDRControls(!showHDRControls)}
                      className="bg-black/50 hover:bg-black/70"
                      data-oid="dpz3ie7"
                    >
                      HDR настройки
                    </Button>
                  </div>

                  {/* HDR Controls Panel */}
                  {showHDRControls && hdrMetadata?.isHdr && (
                    <Card className="absolute right-4 top-16 w-80 bg-black/90 border-gray-700" data-oid="k9abigp">
                      <CardHeader className="pb-3" data-oid="u7n8f8t">
                        <CardTitle className="text-sm text-white" data-oid="8nue-tv">
                          HDR Настройки
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4" data-oid="8jhnfm9">
                        {/* HDR Toggle */}
                        <div className="flex items-center justify-between" data-oid="ida.g_t">
                          <Label htmlFor={`${id}-hdr-enabled`} className="text-sm text-gray-300" data-oid="flghjw.">
                            HDR обработка
                          </Label>
                          <Switch
                            id={`${id}-hdr-enabled`}
                            checked={hdrSettings.hdrEnabled}
                            onCheckedChange={(checked) => updateHDRSettings("hdrEnabled", checked)}
                            data-oid="gcl9sid"
                          />
                        </div>

                        {/* Tone Mapping Toggle */}
                        <div className="flex items-center justify-between" data-oid="wo7rc8d">
                          <Label htmlFor={`${id}-tone-mapping`} className="text-sm text-gray-300" data-oid="b6.wc.b">
                            Tone mapping
                          </Label>
                          <Switch
                            id={`${id}-tone-mapping`}
                            checked={hdrSettings.toneMappingEnabled}
                            onCheckedChange={(checked) => updateHDRSettings("toneMappingEnabled", checked)}
                            disabled={!hdrSettings.hdrEnabled}
                            data-oid="glxuata"
                          />
                        </div>

                        {/* Target Nits */}
                        <div className="space-y-2" data-oid="7jyn0-u">
                          <Label className="text-sm text-gray-300" data-oid="xgpqy_5">
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
                            data-oid="x:bdr7c"
                          />
                        </div>

                        {/* Gamma Correction */}
                        <div className="space-y-2" data-oid="q9.1mhn">
                          <Label className="text-sm text-gray-300" data-oid="6rk2m.a">
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
                            data-oid=":ov573g"
                          />
                        </div>

                        {/* Saturation */}
                        <div className="space-y-2" data-oid="3f4mscg">
                          <Label className="text-sm text-gray-300" data-oid="260mq64">
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
                            data-oid="tdo6cd_"
                          />
                        </div>

                        {/* Preferred Codec */}
                        <div className="space-y-2" data-oid="jmtk9x5">
                          <Label className="text-sm text-gray-300" data-oid="i1d5jui">
                            Предпочитаемый кодек
                          </Label>
                          <Select
                            value={hdrSettings.preferredCodec}
                            onValueChange={(value) => updateHDRSettings("preferredCodec", value)}
                            data-oid="pi54u9s"
                          >
                            <SelectTrigger className="w-full" data-oid="zflid8m">
                              <SelectValue data-oid="lprdvw8" />
                            </SelectTrigger>
                            <SelectContent data-oid="gb6qj8o">
                              <SelectItem value="auto" data-oid="1rhwq3a">
                                Автоматически
                              </SelectItem>
                              <SelectItem value="h264" data-oid="3dkcgca">
                                H.264
                              </SelectItem>
                              <SelectItem value="h265" data-oid="5fqc:3x">
                                H.265/HEVC
                              </SelectItem>
                              <SelectItem value="vp9" data-oid="4mwbsli">
                                VP9
                              </SelectItem>
                              <SelectItem value="av1" data-oid="ikpik9m">
                                AV1
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {/* GPU Acceleration */}
                        <div className="flex items-center justify-between" data-oid="0x174gi">
                          <Label htmlFor={`${id}-gpu-accel`} className="text-sm text-gray-300" data-oid="lg8gd.c">
                            GPU ускорение
                          </Label>
                          <Switch
                            id={`${id}-gpu-accel`}
                            checked={hdrSettings.gpuAcceleration}
                            onCheckedChange={(checked) => updateHDRSettings("gpuAcceleration", checked)}
                            data-oid="617h-w7"
                          />
                        </div>

                        {/* Device Info */}
                        {deviceCapabilities && (
                          <div className="pt-2 border-t border-gray-700" data-oid="thoa1:o">
                            <Label className="text-xs text-gray-400" data-oid="k541s20">
                              Возможности устройства:
                            </Label>
                            <div className="text-xs text-gray-500 mt-1 space-y-1" data-oid="whi45n4">
                              <div data-oid="5-84zye">HDR: {deviceCapabilities.isHDRSupported ? "Да" : "Нет"}</div>
                              <div data-oid="lylqh9s">Цветовая гамма: {deviceCapabilities.colorGamut}</div>
                              <div data-oid="1uv.1uh">
                                Макс. яркость: {deviceCapabilities.maxDisplayMasteringLuminance} nits
                              </div>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  {/* AI Analysis Overlay */}
                  <PlayerAIOverlay className="z-10" data-oid="0dx_yu." />
                </div>
              </AspectRatio>
            </div>
          </div>
        </div>
        <PlayerControls currentTime={currentTime} file={video} data-oid="legmoqu" />
      </div>
    </TooltipProvider>
  )
}

HDRVideoPlayer.displayName = "HDRVideoPlayer"

import { useTranslation } from "react-i18next"

import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { ResolutionOption } from "@/domains/shared/types/project"

import type { CaptureDevice } from "../types"

interface CameraSettingsProps {
  devices: CaptureDevice[]
  selectedDevice: string
  onDeviceChange: (deviceId: string) => void
  audioDevices: CaptureDevice[]
  selectedAudioDevice: string
  onAudioDeviceChange: (deviceId: string) => void
  availableResolutions: ResolutionOption[]
  selectedResolution: string
  onResolutionChange: (resolution: string) => void
  supportedResolutions: ResolutionOption[]
  frameRate: number
  onFrameRateChange: (frameRate: number) => void
  supportedFrameRates: number[]
  countdown: number
  onCountdownChange: (countdown: number) => void
  isRecording: boolean
  isLoadingCapabilities: boolean
}

/**
 * Компонент для настроек камеры (устройство, разрешение, частота кадров)
 */
export function CameraSettings({
  devices,
  selectedDevice,
  onDeviceChange,
  audioDevices,
  selectedAudioDevice,
  onAudioDeviceChange,
  availableResolutions,
  selectedResolution,
  onResolutionChange,
  supportedResolutions,
  frameRate,
  onFrameRateChange,
  supportedFrameRates,
  countdown,
  onCountdownChange,
  isRecording,
  isLoadingCapabilities,
}: CameraSettingsProps) {
  const { t } = useTranslation()

  return (
    <div className="grid grid-cols-[auto_1fr] items-center gap-x-3 gap-y-4 h-full">
      <div className="text-sm text-gray-300">{t("dialogs.cameraCapture.device")}:</div>
      <Select value={selectedDevice} onValueChange={onDeviceChange} disabled={isRecording || isLoadingCapabilities}>
        <SelectTrigger className="w-full border-[#444] bg-[#222] focus:ring-0 focus:ring-offset-0">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="w-full border-[#444] bg-[#222]" sideOffset={4} position="popper" align="start">
          {devices.map(
            (device) =>
              device.deviceId && (
                <SelectItem
                  key={device.deviceId}
                  value={device.deviceId}
                  className="text-white hover:bg-[#333] focus:bg-[#333]"
                >
                  {device.label}
                </SelectItem>
              ),
          )}
        </SelectContent>
      </Select>

      <div className="text-sm text-gray-300">{t("dialogs.cameraCapture.audioDevice")}:</div>
      <Select
        value={selectedAudioDevice}
        onValueChange={onAudioDeviceChange}
        disabled={isRecording || isLoadingCapabilities}
      >
        <SelectTrigger className="w-full border-[#444] bg-[#222] focus:ring-0 focus:ring-offset-0">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="w-full border-[#444] bg-[#222]" sideOffset={4} position="popper" align="start">
          {audioDevices.map(
            (device) =>
              device.deviceId && (
                <SelectItem
                  key={device.deviceId}
                  value={device.deviceId}
                  className="text-white hover:bg-[#333] focus:bg-[#333]"
                >
                  {device.label}
                </SelectItem>
              ),
          )}
        </SelectContent>
      </Select>

      <div className="text-sm text-gray-300">{t("dialogs.cameraCapture.resolution")}:</div>
      <div>
        {isLoadingCapabilities ? (
          <div className="flex items-center text-xs text-gray-400">
            <div className="mr-2 h-4 w-4 rounded-full border-2 border-[#0CC] border-t-transparent">
              {t("dialogs.cameraCapture.determiningCapabilities")}
            </div>
          </div>
        ) : (
          <Select value={selectedResolution} onValueChange={onResolutionChange} disabled={isRecording}>
            <SelectTrigger className="w-full border-[#444] bg-[#222] focus:ring-0 focus:ring-offset-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent
              className="max-h-56 w-full overflow-y-auto border-[#444] bg-[#222]"
              sideOffset={4}
              position="popper"
              align="start"
            >
              {availableResolutions.map(
                (res) =>
                  res.label && (
                    <SelectItem
                      key={res.label}
                      value={res.value}
                      className="text-white hover:bg-[#333] focus:bg-[#333]"
                    >
                      {res.label}
                    </SelectItem>
                  ),
              )}
            </SelectContent>
          </Select>
        )}

        {supportedResolutions.length > 0 && (
          <div className="mt-1 text-xs text-gray-400">
            {t("dialogs.cameraCapture.supportedResolutions", {
              count: supportedResolutions.length,
            })}
          </div>
        )}
      </div>

      <div className="text-sm text-gray-300">{t("dialogs.cameraCapture.frameRate")}:</div>
      <div>
        {isLoadingCapabilities ? (
          <div className="flex items-center text-xs text-gray-400">
            <div className="mr-2 h-4 w-4 rounded-full border-2 border-[#0CC] border-t-transparent">
              {t("dialogs.cameraCapture.determiningCapabilities")}
            </div>
          </div>
        ) : (
          <Select
            value={frameRate.toString()}
            onValueChange={(value) => onFrameRateChange(Number.parseInt(value, 10))}
            disabled={isRecording}
          >
            <SelectTrigger className="w-full border-[#444] bg-[#222] focus:ring-0 focus:ring-offset-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="w-full border-[#444] bg-[#222]" sideOffset={4} position="popper" align="start">
              {supportedFrameRates.map((fps) => (
                <SelectItem
                  key={fps.toString()}
                  value={fps.toString()}
                  className="text-white hover:bg-[#333] focus:bg-[#333]"
                >
                  {fps} fps
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {supportedFrameRates.length > 0 && supportedFrameRates.length < 10 && (
          <div className="mt-1 text-xs text-gray-400">
            {t("dialogs.cameraCapture.supportedFrameRates", {
              frameRates: supportedFrameRates.join(", "),
            })}
          </div>
        )}
      </div>

      <div className="text-sm text-gray-300">{t("dialogs.cameraCapture.countdown")}:</div>
      <div className="flex items-center">
        <Input
          type="number"
          value={countdown}
          onChange={(e) => onCountdownChange(Number.parseInt(e.target.value, 10) || 3)}
          min={0}
          max={10}
          className="mr-2 w-20 border-[#444] bg-[#222] text-center"
          disabled={isRecording}
        />
        <span className="text-sm text-gray-300">{t("dialogs.cameraCapture.seconds")}</span>
      </div>
    </div>
  )
}

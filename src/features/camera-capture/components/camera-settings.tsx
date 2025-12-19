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
    <div className="grid grid-cols-[auto_1fr] items-center gap-x-3 gap-y-4 h-full" data-oid="-9rmw23">
      <div className="text-sm text-gray-300" data-oid="f648kum">
        {t("dialogs.cameraCapture.device")}:
      </div>
      <Select
        value={selectedDevice}
        onValueChange={onDeviceChange}
        disabled={isRecording || isLoadingCapabilities}
        data-oid="45ajy81"
      >
        <SelectTrigger className="w-full border-[#444] bg-[#222] focus:ring-0 focus:ring-offset-0" data-oid="3q90:86">
          <SelectValue data-oid="1lqqc3l" />
        </SelectTrigger>
        <SelectContent
          className="w-full border-[#444] bg-[#222]"
          sideOffset={4}
          position="popper"
          align="start"
          data-oid="2a0.3vm"
        >
          {devices.map(
            (device) =>
              device.deviceId && (
                <SelectItem
                  key={device.deviceId}
                  value={device.deviceId}
                  className="text-white hover:bg-[#333] focus:bg-[#333]"
                  data-oid="1qs5.kn"
                >
                  {device.label}
                </SelectItem>
              ),
          )}
        </SelectContent>
      </Select>

      <div className="text-sm text-gray-300" data-oid=".olv8h4">
        {t("dialogs.cameraCapture.audioDevice")}:
      </div>
      <Select
        value={selectedAudioDevice}
        onValueChange={onAudioDeviceChange}
        disabled={isRecording || isLoadingCapabilities}
        data-oid="l0h2t.-"
      >
        <SelectTrigger className="w-full border-[#444] bg-[#222] focus:ring-0 focus:ring-offset-0" data-oid="9wsnnw1">
          <SelectValue data-oid="twotgyi" />
        </SelectTrigger>
        <SelectContent
          className="w-full border-[#444] bg-[#222]"
          sideOffset={4}
          position="popper"
          align="start"
          data-oid="yt49ei0"
        >
          {audioDevices.map(
            (device) =>
              device.deviceId && (
                <SelectItem
                  key={device.deviceId}
                  value={device.deviceId}
                  className="text-white hover:bg-[#333] focus:bg-[#333]"
                  data-oid="60794fn"
                >
                  {device.label}
                </SelectItem>
              ),
          )}
        </SelectContent>
      </Select>

      <div className="text-sm text-gray-300" data-oid="z4w3lw6">
        {t("dialogs.cameraCapture.resolution")}:
      </div>
      <div data-oid="ib8lunc">
        {isLoadingCapabilities ? (
          <div className="flex items-center text-xs text-gray-400" data-oid="t6djv-s">
            <div className="mr-2 h-4 w-4 rounded-full border-2 border-[#0CC] border-t-transparent" data-oid="jb2ee7k">
              {t("dialogs.cameraCapture.determiningCapabilities")}
            </div>
          </div>
        ) : (
          <Select
            value={selectedResolution}
            onValueChange={onResolutionChange}
            disabled={isRecording}
            data-oid="m_ghfgb"
          >
            <SelectTrigger
              className="w-full border-[#444] bg-[#222] focus:ring-0 focus:ring-offset-0"
              data-oid="vw-wf1h"
            >
              <SelectValue data-oid="nnnk88e" />
            </SelectTrigger>
            <SelectContent
              className="max-h-56 w-full overflow-y-auto border-[#444] bg-[#222]"
              sideOffset={4}
              position="popper"
              align="start"
              data-oid="_eh_fpi"
            >
              {availableResolutions.map(
                (res) =>
                  res.label && (
                    <SelectItem
                      key={res.label}
                      value={res.value}
                      className="text-white hover:bg-[#333] focus:bg-[#333]"
                      data-oid="rtnw_jh"
                    >
                      {res.label}
                    </SelectItem>
                  ),
              )}
            </SelectContent>
          </Select>
        )}

        {supportedResolutions.length > 0 && (
          <div className="mt-1 text-xs text-gray-400" data-oid="3gink-s">
            {t("dialogs.cameraCapture.supportedResolutions", {
              count: supportedResolutions.length,
            })}
          </div>
        )}
      </div>

      <div className="text-sm text-gray-300" data-oid="n3p3h30">
        {t("dialogs.cameraCapture.frameRate")}:
      </div>
      <div data-oid="68l3tnq">
        {isLoadingCapabilities ? (
          <div className="flex items-center text-xs text-gray-400" data-oid=":h2g737">
            <div className="mr-2 h-4 w-4 rounded-full border-2 border-[#0CC] border-t-transparent" data-oid="k5-qrld">
              {t("dialogs.cameraCapture.determiningCapabilities")}
            </div>
          </div>
        ) : (
          <Select
            value={frameRate.toString()}
            onValueChange={(value) => onFrameRateChange(Number.parseInt(value, 10))}
            disabled={isRecording}
            data-oid="2nwcgnq"
          >
            <SelectTrigger
              className="w-full border-[#444] bg-[#222] focus:ring-0 focus:ring-offset-0"
              data-oid="t6oqac6"
            >
              <SelectValue data-oid="1f-oosm" />
            </SelectTrigger>
            <SelectContent
              className="w-full border-[#444] bg-[#222]"
              sideOffset={4}
              position="popper"
              align="start"
              data-oid="n89h2cw"
            >
              {supportedFrameRates.map((fps) => (
                <SelectItem
                  key={fps.toString()}
                  value={fps.toString()}
                  className="text-white hover:bg-[#333] focus:bg-[#333]"
                  data-oid="m:zij1u"
                >
                  {fps} fps
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {supportedFrameRates.length > 0 && supportedFrameRates.length < 10 && (
          <div className="mt-1 text-xs text-gray-400" data-oid="skvndmo">
            {t("dialogs.cameraCapture.supportedFrameRates", {
              frameRates: supportedFrameRates.join(", "),
            })}
          </div>
        )}
      </div>

      <div className="text-sm text-gray-300" data-oid="g.w-92m">
        {t("dialogs.cameraCapture.countdown")}:
      </div>
      <div className="flex items-center" data-oid="er15ouc">
        <Input
          type="number"
          value={countdown}
          onChange={(e) => onCountdownChange(Number.parseInt(e.target.value, 10) || 3)}
          min={0}
          max={10}
          className="mr-2 w-20 border-[#444] bg-[#222] text-center"
          disabled={isRecording}
          data-oid="ml-qft0"
        />

        <span className="text-sm text-gray-300" data-oid="h_om5uz">
          {t("dialogs.cameraCapture.seconds")}
        </span>
      </div>
    </div>
  )
}

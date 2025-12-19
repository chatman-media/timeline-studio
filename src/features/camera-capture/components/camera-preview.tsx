import type { RefObject } from "react"

import { useTranslation } from "react-i18next"

interface CameraPreviewProps {
  videoRef: RefObject<HTMLVideoElement | null>
  isDeviceReady: boolean
  showCountdown: boolean
  countdown: number
}

/**
 * Компонент для отображения предпросмотра видео с камеры
 */
export function CameraPreview({ videoRef, isDeviceReady, showCountdown, countdown }: CameraPreviewProps) {
  const { t } = useTranslation()

  return (
    <div
      className="relative flex h-[400px] w-full items-center justify-center rounded-md border border-gray-800 bg-black shadow-lg mb-4"
      data-oid="2d81xgg"
    >
      {!isDeviceReady && (
        <div className="absolute inset-0 flex items-center justify-center text-gray-400" data-oid="4q156q4">
          {t("dialogs.cameraCapture.initializingCamera")}
        </div>
      )}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        data-testid="video-element"
        style={{
          display: "block",
          width: "100%",
          height: "100%",
          objectFit: "contain",
        }}
        className={`${!isDeviceReady ? "opacity-0" : "opacity-100"} transition-opacity duration-300`}
        data-oid="w3-0s:3"
      />

      {showCountdown && countdown > 0 && (
        <div
          className="absolute inset-0 flex items-center justify-center bg-black/50 text-6xl font-bold text-white"
          data-oid="z3jka7y"
        >
          {countdown}
        </div>
      )}
    </div>
  )
}

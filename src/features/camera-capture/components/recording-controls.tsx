import { Button } from "@timeline-studio/ui/components/button"
import { useTranslation } from "react-i18next"

interface RecordingControlsProps {
  isRecording: boolean
  recordingTime: number
  isDeviceReady: boolean
  onStartRecording: () => void
  onStopRecording: () => void
  formatRecordingTime: (time: number) => string
}

/**
 * Компонент для управления записью видео
 */
export function RecordingControls({
  isRecording,
  recordingTime,
  isDeviceReady,
  onStartRecording,
  onStopRecording,
  formatRecordingTime,
}: RecordingControlsProps) {
  const { t } = useTranslation()

  return (
    <div className="flex flex-row items-center justify-between px-4 py-3 bg-gray-900 rounded-md" data-oid="_y6wdhn">
      <div className="font-mono text-lg font-semibold" data-oid="86mlttt">
        {t("dialogs.cameraCapture.recordingTime")} {formatRecordingTime(recordingTime)}
      </div>
      <div className="flex items-center justify-center" data-oid="z.tw:7x">
        {!isRecording ? (
          <Button
            className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-white bg-red-600 shadow-lg hover:bg-red-700"
            onClick={onStartRecording}
            disabled={!isDeviceReady}
            title={t("dialogs.cameraCapture.startRecording")}
            aria-label={t("dialogs.cameraCapture.startRecording")}
            data-oid="gj_o5a6"
          >
            <div className="h-4 w-4 rounded-full bg-white" data-oid="v8bxhi4" />
          </Button>
        ) : (
          <Button
            className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-white bg-red-600 shadow-lg hover:bg-red-700"
            onClick={onStopRecording}
            title={t("dialogs.cameraCapture.stopRecording")}
            aria-label={t("dialogs.cameraCapture.stopRecording")}
            data-oid="nb8:nfx"
          >
            <div className="h-4 w-4 rounded bg-white" data-oid="hizmsx_" />
          </Button>
        )}
      </div>
    </div>
  )
}

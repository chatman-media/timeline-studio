import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"

interface CameraPermissionRequestProps {
  permissionStatus: "pending" | "granted" | "denied" | "error"
  errorMessage: string
  onRequestPermissions: () => void
}

/**
 * Компонент для запроса разрешений на доступ к камере и микрофону
 * и отображения ошибок, связанных с разрешениями
 */
export function CameraPermissionRequest({
  permissionStatus,
  errorMessage,
  onRequestPermissions,
}: CameraPermissionRequestProps) {
  const { t } = useTranslation()

  if (permissionStatus === "granted") {
    return null
  }

  return (
    <div className="mb-4" data-oid=":64quw3">
      {permissionStatus === "pending" && (
        <div className="text-center text-sm" data-oid="6vxg339">
          {t("dialogs.cameraCapture.requestingPermissions", "Запрашиваем разрешения...")}
        </div>
      )}

      {permissionStatus === "denied" && (
        <div className="rounded-md bg-red-900/50 p-3 text-sm text-red-100" data-oid="r_q:c8k">
          {errorMessage}
          <div className="mt-2" data-oid="l-4-izl">
            <Button className="w-full bg-red-600 hover:bg-red-700" onClick={onRequestPermissions} data-oid="1172:mz">
              {t("dialogs.cameraCapture.retryRequest")}
            </Button>
          </div>
        </div>
      )}

      {permissionStatus === "error" && (
        <div className="rounded-md bg-red-900/50 p-3 text-sm text-red-100" data-oid="63md4au">
          {errorMessage}
          <div className="mt-2" data-oid="w:kwyx9">
            <Button className="w-full bg-red-600 hover:bg-red-700" onClick={onRequestPermissions} data-oid="47y:q9c">
              {t("dialogs.cameraCapture.retry")}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

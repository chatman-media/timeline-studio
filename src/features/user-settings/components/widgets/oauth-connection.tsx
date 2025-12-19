import { ExternalLink, Link } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createLogger } from "@/lib/tauri-logger"
import { useApiKeys } from "../../hooks/use-api-keys"
import { KeyStatusIndicator } from "./key-status-indicator"

const logger = createLogger({ module: "OauthConnection" })

interface OAuthField {
  key: string
  label: string
  placeholder: string
  type?: "text" | "password"
  optional?: boolean
}

interface OAuthConnectionProps {
  service: string
  credentials: any
  onUpdate: (credentials: any) => void
  fields: OAuthField[]
  links?: Array<{
    text: string
    url: string
  }>
}

/**
 * Компонент для настройки OAuth подключений
 * Поддерживает множественные поля и авторизацию
 */
export function OAuthConnection({ service, credentials, onUpdate, fields, links = [] }: OAuthConnectionProps) {
  const { t } = useTranslation()
  const { getApiKeyStatus, saveOAuthCredentials } = useApiKeys()

  const status = getApiKeyStatus(service)

  const handleFieldChange = (key: string, value: string) => {
    onUpdate({
      ...credentials,
      [key]: value,
    })
  }

  const handleClearField = (key: string) => {
    onUpdate({
      ...credentials,
      [key]: "",
    })
  }

  const handleInitiateOAuth = async () => {
    try {
      // Simple OAuth credentials save for now
      if (credentials.clientId && credentials.clientSecret) {
        await saveOAuthCredentials(service, credentials.clientId, credentials.clientSecret)
      }
    } catch (error) {
      void logger.error(`OAuth error for ${service}:`, {
        error: String(error),
      })
    }
  }

  const isReadyForOAuth = fields
    .filter((field) => !field.optional)
    .every((field) => (credentials[field.key] || "").length > 0)

  return (
    <div className="space-y-4" data-oid="zjkk-is">
      {/* Статус подключения */}
      <div className="flex items-center justify-between" data-oid="jzqn43h">
        <span className="text-sm font-medium" data-oid="2cfivqj">
          {t("dialogs.userSettings.connectionStatus", "Статус подключения")}
        </span>
        <KeyStatusIndicator status={status} data-oid="uf8006l" />
      </div>

      {/* Поля для ввода */}
      <div className="space-y-3" data-oid="ep4ev6f">
        {fields.map((field) => (
          <div key={field.key} className="space-y-1" data-oid="--gputz">
            <Label className="text-sm" data-oid="pcl1v9w">
              {field.label}
              {field.optional && (
                <span className="text-xs text-muted-foreground ml-1" data-oid="swv9gme">
                  ({t("dialogs.userSettings.optional", "опционально")})
                </span>
              )}
            </Label>
            <div className="relative" data-oid="4c5ap79">
              <Input
                type={field.type || "text"}
                value={credentials[field.key] || ""}
                onChange={(e) => handleFieldChange(field.key, e.target.value)}
                placeholder={field.placeholder}
                className="h-9 pr-8 font-mono text-sm"
                data-oid="1rw75mb"
              />

              {(credentials[field.key] || "").length > 0 && (
                <button
                  type="button"
                  onClick={() => handleClearField(field.key)}
                  className="absolute top-1/2 right-2 -translate-y-1/2 p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                  title={t("dialogs.userSettings.clear", "Очистить")}
                  data-oid="xa3v.v9"
                >
                  ×
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Кнопки действий */}
      <div className="flex flex-wrap gap-2" data-oid="326uita">
        {/* OAuth авторизация */}
        <Button
          variant="default"
          size="sm"
          onClick={handleInitiateOAuth}
          disabled={!isReadyForOAuth || status === "testing"}
          className="flex items-center gap-2"
          data-oid="c78:vwu"
        >
          <Link className="h-3 w-3" data-oid="ib9l8g4" />
          {t("dialogs.userSettings.authorize", "Авторизоваться")}
        </Button>

        {/* Ссылки на документацию */}
        {links.map((link, index) => (
          <Button
            key={index}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
            onClick={() => window.open(link.url, "_blank")}
            data-oid=":xq:ptm"
          >
            <ExternalLink className="h-3 w-3" data-oid="mco8wxj" />
            {link.text}
          </Button>
        ))}
      </div>

      {/* Инструкции по настройке */}
      <div className="p-3 bg-muted/50 rounded-md" data-oid="2msatgi">
        <h5 className="text-sm font-medium mb-2" data-oid="bzhvboq">
          {t("dialogs.userSettings.setupInstructions", "Инструкции по настройке")}
        </h5>
        <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside" data-oid="971zbwr">
          <li data-oid="8_lgkd_">
            {t("dialogs.userSettings.step1", "Создайте OAuth приложение в консоли разработчика")}
          </li>
          <li data-oid="yg3sqg1">{t("dialogs.userSettings.step2", "Скопируйте Client ID и Client Secret")}</li>
          <li data-oid="7v:gmlz">{t("dialogs.userSettings.step3", "Введите данные в поля выше")}</li>
          <li data-oid="cmzz-qg">
            {t("dialogs.userSettings.step4", "Нажмите 'Авторизоваться' для получения токена доступа")}
          </li>
        </ol>
      </div>

      {/* Статусные сообщения */}
      {status === "valid" && (
        <div
          className="p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-md"
          data-oid="ly:v95y"
        >
          <p className="text-sm text-green-800 dark:text-green-200" data-oid="q1wri8p">
            {t(
              "dialogs.userSettings.connectionSuccess",
              "Подключение успешно настроено. Вы можете публиковать контент.",
            )}
          </p>
        </div>
      )}

      {status === "invalid" && (
        <div
          className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-md"
          data-oid="fzscqos"
        >
          <p className="text-sm text-red-800 dark:text-red-200" data-oid="4sfds8y">
            {t("dialogs.userSettings.connectionError", "Ошибка подключения. Проверьте данные и повторите авторизацию.")}
          </p>
        </div>
      )}
    </div>
  )
}

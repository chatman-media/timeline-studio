import { ExternalLink, Eye, EyeOff, Loader2, X } from "lucide-react"
import { useState } from "react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createLogger } from "@/lib/tauri-logger"
import { useApiKeys } from "../../hooks/use-api-keys"
import { KeyStatusIndicator } from "./key-status-indicator"

const logger = createLogger({ module: "ApiKeyInput" })

interface ApiKeyInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  service: string
  label?: string
  testable?: boolean
  links?: Array<{
    text: string
    url: string
  }>
}

/**
 * Переиспользуемый компонент для ввода API ключей
 * Поддерживает скрытие/показ, валидацию и тестирование
 */
export function ApiKeyInput({
  value,
  onChange,
  placeholder,
  service,
  label,
  testable = false,
  links = [],
}: ApiKeyInputProps) {
  const { t } = useTranslation()
  const { getApiKeyStatus, testApiKey, getValidationError } = useApiKeys()
  const [showKey, setShowKey] = useState(false)
  const [isTesting, setIsTesting] = useState(false)

  const status = getApiKeyStatus(service)
  const validationError = getValidationError(service)

  const handleTest = async () => {
    if (!value || isTesting) return

    setIsTesting(true)
    try {
      await testApiKey(service)
    } finally {
      setIsTesting(false)
    }
  }

  const handleClear = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onChange("")
    setShowKey(false)
  }

  const handleToggleShowKey = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setShowKey(!showKey)
  }

  return (
    <div className="space-y-3">
      {/* Label и статус */}
      {label && (
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">{label}</Label>
          <KeyStatusIndicator status={status} />
        </div>
      )}

      {/* Поле ввода */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Input
            type={showKey ? "text" : "password"}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="h-9 pr-16 font-mono text-sm"
            autoComplete="off"
            spellCheck="false"
          />

          {/* Кнопки в поле ввода */}
          <div className="absolute top-1/2 right-2 -translate-y-1/2 flex items-center gap-1">
            {/* Показать/скрыть ключ */}
            {value && (
              <button
                type="button"
                onClick={handleToggleShowKey}
                className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                title={
                  showKey
                    ? t("dialogs.userSettings.hideKey", "Скрыть ключ")
                    : t("dialogs.userSettings.showKey", "Показать ключ")
                }
                aria-label={
                  showKey
                    ? t("dialogs.userSettings.hideKey", "Скрыть ключ")
                    : t("dialogs.userSettings.showKey", "Показать ключ")
                }
              >
                {showKey ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
              </button>
            )}

            {/* Очистить ключ */}
            {value && (
              <button
                type="button"
                onClick={handleClear}
                className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                title={t("dialogs.userSettings.clearApiKey", "Очистить API ключ")}
                aria-label={t("dialogs.userSettings.clearApiKey", "Очистить API ключ")}
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>

        {/* Кнопка тестирования */}
        {testable && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleTest}
            disabled={!value || isTesting || status === "testing"}
            className="h-9 px-3"
          >
            {isTesting || status === "testing" ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              t("dialogs.userSettings.test", "Тест")
            )}
          </Button>
        )}
      </div>

      {/* Ссылки */}
      {links.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {links.map((link, index) => (
            <Button
              key={index}
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => window.open(link.url, "_blank")}
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              {link.text}
            </Button>
          ))}
        </div>
      )}

      {/* Статусное сообщение */}
      {status === "invalid" && (
        <div className="text-xs text-red-600 dark:text-red-400 space-y-1">
          <p>
            {validationError || t("dialogs.userSettings.invalidKey", "Неверный API ключ или проблемы с подключением")}
          </p>
          {/* Ссылки для пополнения кредитов - показываем только если в сообщении есть информация о кредитах */}
          {(validationError?.includes("кредит") ||
            validationError?.includes("credit") ||
            validationError?.includes("Insufficient Balance")) && (
            <div className="flex flex-wrap gap-2 mt-1">
              {service === "grok" && (
                <a
                  href="https://console.x.ai/team/e111ca1e-660a-42c1-9b09-16fcb0d64cbf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 dark:text-blue-400 hover:underline text-xs"
                >
                  Пополнить кредиты Grok
                </a>
              )}
              {service === "deepseek" && (
                <a
                  href="https://platform.deepseek.com/usage"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 dark:text-blue-400 hover:underline text-xs"
                >
                  Проверить баланс DeepSeek
                </a>
              )}
              {service === "claude" && (
                <a
                  href="https://console.anthropic.com/settings/billing"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 dark:text-blue-400 hover:underline text-xs"
                >
                  Проверить баланс Claude
                </a>
              )}
              {service === "openai" && (
                <a
                  href="https://platform.openai.com/usage"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 dark:text-blue-400 hover:underline text-xs"
                >
                  Проверить баланс OpenAI
                </a>
              )}
            </div>
          )}
        </div>
      )}
      {status === "valid" && (
        <p className="text-xs text-green-600 dark:text-green-400">
          {t("dialogs.userSettings.validKey", "API ключ работает корректно")}
        </p>
      )}
    </div>
  )
}

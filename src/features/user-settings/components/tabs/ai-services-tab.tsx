import { useEffect, useState } from "react"

import { useTranslation } from "react-i18next"

import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"

import { useApiKeys } from "../../hooks/use-api-keys"
import { ApiKeyInput } from "../widgets/api-key-input"

/**
 * Вкладка настроек AI сервисов
 * Управление API ключами для всех AI провайдеров
 */
export function AiServicesTab() {
  const { t } = useTranslation()
  const { saveSimpleApiKey, getApiKeyInfo } = useApiKeys()

  const [openAiKey, setOpenAiKey] = useState("")
  const [claudeKey, setClaudeKey] = useState("")
  const [grokKey, setGrokKey] = useState("")
  const [deepSeekKey, setDeepSeekKey] = useState("")

  // Загружаем существующие ключи при монтировании
  useEffect(() => {
    const openAiInfo = getApiKeyInfo("openai")
    const claudeInfo = getApiKeyInfo("claude")
    const grokInfo = getApiKeyInfo("grok")
    const deepSeekInfo = getApiKeyInfo("deepseek")

    // Если ключи существуют, показываем placeholder вместо значения для безопасности
    if (openAiInfo?.has_value) {
      setOpenAiKey("••••••••••••••••••••••••••••••••••••••••••••••••••••")
    }
    if (claudeInfo?.has_value) {
      setClaudeKey("••••••••••••••••••••••••••••••••••••••••••••••••••••")
    }
    if (grokInfo?.has_value) {
      setGrokKey("••••••••••••••••••••••••••••••••••••••••••••••••••••")
    }
    if (deepSeekInfo?.has_value) {
      setDeepSeekKey("••••••••••••••••••••••••••••••••••••••••••••••••••••")
    }
  }, [getApiKeyInfo])

  const handleOpenAiChange = (value: string) => {
    setOpenAiKey(value)
    // Автосохранение при изменении
    if (value && !value.includes("••••")) {
      void saveSimpleApiKey("openai", value)
    }
  }

  const handleClaudeChange = (value: string) => {
    setClaudeKey(value)
    // Автосохранение при изменении
    if (value && !value.includes("••••")) {
      void saveSimpleApiKey("claude", value)
    }
  }

  const handleGrokChange = (value: string) => {
    setGrokKey(value)
    // Автосохранение при изменении
    if (value && !value.includes("••••")) {
      void saveSimpleApiKey("grok", value)
    }
  }

  const handleDeepSeekChange = (value: string) => {
    setDeepSeekKey(value)
    // Автосохранение при изменении
    if (value && !value.includes("••••")) {
      void saveSimpleApiKey("deepseek", value)
    }
  }

  return (
    <div className="space-y-6">
      {/* Заголовок и описание */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">{t("dialogs.userSettings.tabs.aiServices", "AI Сервисы")}</h3>
        <p className="text-sm text-muted-foreground">
          {t(
            "dialogs.userSettings.aiServicesDescription",
            "Настройте API ключи для интеграции с AI ассистентами. Ключи безопасно хранятся локально.",
          )}
        </p>
      </div>

      <Separator />

      {/* OpenAI настройки */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label className="text-sm font-medium">{t("dialogs.userSettings.openAiApiKey", "OpenAI API ключ")}</Label>
          <p className="text-xs text-muted-foreground">
            {t(
              "dialogs.userSettings.openAiDescription",
              "Используется для ChatGPT интеграции и генерации контента. Получите ключ на platform.openai.com",
            )}
          </p>
        </div>

        <ApiKeyInput
          value={openAiKey}
          onChange={handleOpenAiChange}
          placeholder={t("dialogs.userSettings.enterApiKey", "Введите API ключ")}
          service="openai"
          testable={true}
          links={[
            {
              text: t("dialogs.userSettings.getApiKey", "Получить API ключ"),
              url: "https://platform.openai.com/api-keys",
            },
          ]}
        />
      </div>

      <Separator />

      {/* Claude настройки */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label className="text-sm font-medium">{t("dialogs.userSettings.claudeApiKey", "Claude API ключ")}</Label>
          <p className="text-xs text-muted-foreground">
            {t(
              "dialogs.userSettings.claudeDescription",
              "Используется для Claude AI ассистента и продвинутого анализа контента. Получите ключ в консоли Anthropic",
            )}
          </p>
        </div>

        <ApiKeyInput
          value={claudeKey}
          onChange={handleClaudeChange}
          placeholder={t("dialogs.userSettings.enterApiKey", "Введите API ключ")}
          service="claude"
          testable={true}
          links={[
            {
              text: t("dialogs.userSettings.getApiKey", "Получить API ключ"),
              url: "https://console.anthropic.com/settings/keys",
            },
          ]}
        />
      </div>

      <Separator />

      {/* Grok настройки */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label className="text-sm font-medium">{t("dialogs.userSettings.grokApiKey", "Grok API ключ")}</Label>
          <p className="text-xs text-muted-foreground">
            {t(
              "dialogs.userSettings.grokDescription",
              "Используется для моделей Grok от xAI. Получите ключ на console.x.ai",
            )}
          </p>
        </div>

        <ApiKeyInput
          value={grokKey}
          onChange={handleGrokChange}
          placeholder={t("dialogs.userSettings.enterApiKey", "Введите API ключ")}
          service="grok"
          testable={true}
          links={[
            {
              text: t("dialogs.userSettings.getApiKey", "Получить API ключ"),
              url: "https://console.x.ai",
            },
          ]}
        />
      </div>

      <Separator />

      {/* DeepSeek настройки */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label className="text-sm font-medium">{t("dialogs.userSettings.deepSeekApiKey", "DeepSeek API ключ")}</Label>
          <p className="text-xs text-muted-foreground">
            {t(
              "dialogs.userSettings.deepSeekDescription",
              "Используется для моделей DeepSeek. Получите ключ на platform.deepseek.com",
            )}
          </p>
        </div>

        <ApiKeyInput
          value={deepSeekKey}
          onChange={handleDeepSeekChange}
          placeholder={t("dialogs.userSettings.enterApiKey", "Введите API ключ")}
          service="deepseek"
          testable={true}
          links={[
            {
              text: t("dialogs.userSettings.getApiKey", "Получить API ключ"),
              url: "https://platform.deepseek.com/api_keys",
            },
          ]}
        />
      </div>

      <Separator />

      <LocalModelsSection />

      {/* Дополнительная информация */}
      <div className="mt-6 p-4 bg-muted/50 rounded-md">
        <h4 className="text-sm font-medium mb-2">
          {t("dialogs.userSettings.securityNote", "Примечание о безопасности")}
        </h4>
        <p className="text-xs text-muted-foreground">
          {t(
            "dialogs.userSettings.securityNoteText",
            "Все API ключи шифруются и хранятся локально на вашем устройстве. Они никогда не передаются третьим лицам.",
          )}
        </p>
      </div>
    </div>
  )
}

function LocalModelsSection() {
  const { t } = useTranslation()
  const [models, setModels] = useState<Array<{ name: string; size: number }>>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    checkLocalModels()
  }, [])

  const checkLocalModels = async () => {
    try {
      const response = await fetch("http://localhost:11434/api/tags", {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
        signal: AbortSignal.timeout(3000),
      })

      if (!response.ok) {
        throw new Error("Ollama not responding")
      }

      const data = await response.json()
      const models = data.models || []
      setModels(
        models.map((m: any) => ({
          name: m.name || "Unknown",
          size: m.size || 0,
        })),
      )
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Connection failed")
      setModels([])
    } finally {
      setLoading(false)
    }
  }

  const formatSize = (bytes: number): string => {
    const gb = bytes / (1024 * 1024 * 1024)
    return `${gb.toFixed(1)} GB`
  }

  const getModelDescription = (name: string): string => {
    const descriptions: Record<string, string> = {
      "llama3.2": "🦙 Fast and versatile model from Meta",
      "llama3.1": "🦙 Improved version with larger context",
      llama3: "🦙 Base Llama 3 model",
      "qwen2.5": "🔥 High-quality Chinese model from Alibaba",
      gemma2: "💎 Compact and powerful model from Google",
      phi3: "🧠 Microsoft model with excellent performance",
      mistral: "🌪️ High-quality European model",
      codellama: "💻 Specialized model for programming",
      "llama3.2-vision": "👁️ Image analysis support",
      "deepseek-coder-v2": "🎯 Specialized code model",
    }
    return descriptions[name] || "🤖 Local AI model"
  }

  if (loading) {
    return (
      <div className="space-y-3">
        <Label className="text-sm font-medium">{t("dialogs.userSettings.localModels.title", "Локальные модели")}</Label>
        <p className="text-xs text-muted-foreground">
          {t("dialogs.userSettings.localModels.description", "Модели из Ollama (localhost:11434)")}
        </p>
        <div className="flex items-center space-x-2">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <span className="text-sm text-muted-foreground">
            {t("dialogs.userSettings.localModels.checking", "Проверка доступных моделей...")}
          </span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-3">
        <Label className="text-sm font-medium">{t("dialogs.userSettings.localModels.title", "Локальные модели")}</Label>
        <p className="text-xs text-muted-foreground">
          {t("dialogs.userSettings.localModels.description", "Модели из Ollama (localhost:11434)")}
        </p>
        <div className="rounded-lg border border-dashed p-4 text-center">
          <div className="text-sm text-muted-foreground">
            {t(
              "dialogs.userSettings.localModels.notAvailable",
              "Локальные модели недоступны. Убедитесь, что Ollama запущен на localhost:11434",
            )}
          </div>
          <button onClick={checkLocalModels} className="mt-2 text-sm text-primary hover:underline">
            Повторить проверку
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium">{t("dialogs.userSettings.localModels.title", "Локальные модели")}</Label>
      <p className="text-xs text-muted-foreground">
        {t("dialogs.userSettings.localModels.description", "Модели из Ollama (localhost:11434)")}
      </p>

      {models.length === 0 ? (
        <div className="rounded-lg border border-dashed p-4 text-center">
          <div className="text-sm text-muted-foreground">
            {t("dialogs.userSettings.localModels.noModels", "Нет доступных локальных моделей")}
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {models.map((model, index) => (
            <div key={index} className="rounded-lg border p-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-sm">{model.name}</div>
                  <div className="text-xs text-muted-foreground">{getModelDescription(model.name)}</div>
                </div>
                <div className="text-xs text-muted-foreground">{formatSize(model.size)}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

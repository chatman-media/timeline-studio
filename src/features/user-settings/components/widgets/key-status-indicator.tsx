import { AlertCircle, CheckCircle, Clock, Loader2, XCircle } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Tooltip, TooltipContent, TooltipTrigger } from "@timeline-studio/ui/components/tooltip"
import { cn } from "@/lib/utils"

interface KeyStatusIndicatorProps {
  status: "not_set" | "testing" | "invalid" | "valid"
  className?: string
  /** Текст ошибки валидации (если есть) */
  errorMessage?: string
  /** Дата последней валидации (ISO string) */
  lastValidated?: string
  /** Дата создания ключа (ISO string) */
  createdAt?: string
  /** Показывать ли подробный tooltip */
  showTooltip?: boolean
}

/**
 * Индикатор статуса API ключа
 * Показывает цветной индикатор и иконку в зависимости от статуса
 */
export function KeyStatusIndicator({
  status,
  className,
  errorMessage,
  lastValidated,
  createdAt,
  showTooltip = true,
}: KeyStatusIndicatorProps) {
  const { t } = useTranslation()

  const getStatusConfig = () => {
    switch (status) {
      case "not_set":
        return {
          icon: null,
          color: "text-gray-400",
          bgColor: "bg-gray-100 dark:bg-gray-800",
          text: t("dialogs.userSettings.status.notSet", "Не настроено"),
        }
      case "testing":
        return {
          icon: <Loader2 className="h-3 w-3 animate-spin" data-oid=":9_9xaz" />,
          color: "text-blue-600",
          bgColor: "bg-blue-100 dark:bg-blue-900/20",
          text: t("dialogs.userSettings.status.testing", "Проверка..."),
        }
      case "invalid":
        return {
          icon: <XCircle className="h-3 w-3" data-oid="h-_wf8u" />,
          color: "text-red-600",
          bgColor: "bg-red-100 dark:bg-red-900/20",
          text: t("dialogs.userSettings.status.invalid", "Ошибка"),
        }
      case "valid":
        return {
          icon: <CheckCircle className="h-3 w-3" data-oid="oukv_1u" />,
          color: "text-green-600",
          bgColor: "bg-green-100 dark:bg-green-900/20",
          text: t("dialogs.userSettings.status.valid", "Работает"),
        }
      default:
        return {
          icon: null,
          color: "text-gray-400",
          bgColor: "bg-gray-100 dark:bg-gray-800",
          text: "Unknown",
        }
    }
  }

  const config = getStatusConfig()

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return null
    try {
      const date = new Date(dateStr)
      return new Intl.DateTimeFormat("ru-RU", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      }).format(date)
    } catch {
      return null
    }
  }

  const indicator = (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium",
        config.color,
        config.bgColor,
        className,
      )}
      data-oid="-aqdgav"
    >
      {config.icon}
      <span data-oid="klo18dk">{config.text}</span>
    </div>
  )

  if (!showTooltip) {
    return indicator
  }

  const hasDetails = errorMessage || lastValidated || createdAt

  return (
    <Tooltip data-oid="vzrjzbc">
      <TooltipTrigger asChild data-oid="j4ph_g3">
        {indicator}
      </TooltipTrigger>
      {hasDetails && (
        <TooltipContent side="right" className="max-w-xs" data-oid="fdqo1el">
          <div className="space-y-1.5" data-oid="rpbx-he">
            <div className="font-semibold" data-oid="f631k5s">
              {config.text}
            </div>

            {errorMessage && (
              <div className="flex items-start gap-1.5 text-red-400" data-oid="e_o8ugv">
                <AlertCircle className="h-3 w-3 mt-0.5 shrink-0" data-oid="ui8glmo" />
                <span className="text-xs" data-oid="0bh-vkz">
                  {errorMessage}
                </span>
              </div>
            )}

            {lastValidated && (
              <div className="flex items-center gap-1.5 text-muted-foreground" data-oid="cwi2ryr">
                <CheckCircle className="h-3 w-3 shrink-0" data-oid="z8zar9." />
                <span className="text-xs" data-oid="7kqa.1v">
                  {t("dialogs.userSettings.lastValidated", "Проверено")}: {formatDate(lastValidated)}
                </span>
              </div>
            )}

            {createdAt && (
              <div className="flex items-center gap-1.5 text-muted-foreground" data-oid="_bg7pbs">
                <Clock className="h-3 w-3 shrink-0" data-oid="it8p:2t" />
                <span className="text-xs" data-oid="5mxnbdd">
                  {t("dialogs.userSettings.created", "Создано")}: {formatDate(createdAt)}
                </span>
              </div>
            )}
          </div>
        </TooltipContent>
      )}
    </Tooltip>
  )
}

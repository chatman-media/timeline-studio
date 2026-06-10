/**
 * UpdateNotification - компонент уведомления о доступном обновлении
 * Показывает информацию об обновлении и предоставляет действия для пользователя
 */

import { Badge } from "@timeline-studio/ui/components/badge"
import { Button } from "@timeline-studio/ui/components/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@timeline-studio/ui/components/card"
import { X } from "lucide-react"

import { useUpdateManager } from "../hooks/use-update-manager"

interface UpdateNotificationProps {
  className?: string
  onClose?: () => void
  showProgress?: boolean
}

/**
 * Компонент уведомления об обновлении
 */
export function UpdateNotification({ className, onClose, showProgress = true }: UpdateNotificationProps) {
  const {
    isUpdateAvailable,
    isDownloading,
    isReadyToInstall,
    isInstalling,
    isInstalled,
    isError,
    availableUpdate,
    error,
    progress,
    downloadUpdate,
    installUpdate,
    dismiss,
    retry,
  } = useUpdateManager()

  // Не показываем уведомление если нет обновления или произошла ошибка
  if (!isUpdateAvailable && !isDownloading && !isReadyToInstall && !isInstalling && !isInstalled && !isError) {
    return null
  }

  const handleClose = () => {
    dismiss()
    onClose?.()
  }

  const getTitle = () => {
    if (isError) return "Ошибка обновления"
    if (isInstalled) return "Обновление установлено"
    if (isInstalling) return "Установка обновления..."
    if (isReadyToInstall) return "Готово к установке"
    if (isDownloading) return "Загрузка обновления..."
    return "Доступно обновление"
  }

  const getDescription = () => {
    if (isError) return error || "Произошла ошибка при обновлении"
    if (isInstalled) return "Обновление успешно установлено. Перезапустите приложение для применения изменений."
    if (isInstalling) return "Пожалуйста, подождите..."
    if (isReadyToInstall) return "Обновление загружено и готово к установке"
    if (isDownloading) return "Загружается новая версия приложения"
    if (availableUpdate) {
      return `Версия ${availableUpdate.version} готова к загрузке`
    }
    return "Новая версия приложения готова к загрузке"
  }

  const getActionButtons = () => {
    if (isError) {
      return (
        <div className="flex gap-2" data-oid="2u1zibo">
          <Button variant="outline" size="sm" onClick={retry} data-oid="lq6tzri">
            Повторить
          </Button>
          <Button variant="ghost" size="sm" onClick={handleClose} data-oid="nsr5cwe">
            Закрыть
          </Button>
        </div>
      )
    }

    if (isInstalled) {
      return (
        <Button variant="outline" size="sm" onClick={handleClose} data-oid="w28_y-5">
          Закрыть
        </Button>
      )
    }

    if (isInstalling) {
      return (
        <Button variant="outline" size="sm" disabled data-oid="j5bhx45">
          Установка...
        </Button>
      )
    }

    if (isReadyToInstall) {
      return (
        <div className="flex gap-2" data-oid="s2x9kfw">
          <Button size="sm" onClick={installUpdate} data-oid="i-ow1cf">
            Установить
          </Button>
          <Button variant="outline" size="sm" onClick={handleClose} data-oid="kapwbza">
            Позже
          </Button>
        </div>
      )
    }

    if (isDownloading) {
      return (
        <Button variant="outline" size="sm" disabled data-oid="bblws.f">
          Загрузка...
        </Button>
      )
    }

    // isUpdateAvailable
    return (
      <div className="flex gap-2" data-oid="xxnbs3k">
        <Button size="sm" onClick={downloadUpdate} data-oid="ul6.oaw">
          Скачать
        </Button>
        <Button variant="outline" size="sm" onClick={handleClose} data-oid="2h5s9u3">
          Пропустить
        </Button>
      </div>
    )
  }

  const getBadgeVariant = () => {
    if (isError) return "destructive" as const
    if (isInstalled) return "default" as const
    if (isInstalling || isDownloading) return "secondary" as const
    return "default" as const
  }

  const getBadgeText = () => {
    if (isError) return "Ошибка"
    if (isInstalled) return "Установлено"
    if (isInstalling) return "Установка"
    if (isReadyToInstall) return "Готово"
    if (isDownloading) return "Загрузка"
    return "Новое"
  }

  return (
    <Card className={`w-full max-w-md ${className}`} data-oid="ll6c0ol">
      <CardHeader className="pb-3" data-oid="syxqb0c">
        <div className="flex items-start justify-between" data-oid="bzc:rgn">
          <div className="flex items-center gap-2" data-oid="l60qfjz">
            <CardTitle className="text-sm font-medium" data-oid="-jqwdw1">
              {getTitle()}
            </CardTitle>
            <Badge variant={getBadgeVariant()} className="text-xs" data-oid="5c1b792">
              {getBadgeText()}
            </Badge>
          </div>
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={handleClose} data-oid="vsj:qgc">
            <X className="h-3 w-3" data-oid="fgnp4.w" />
          </Button>
        </div>
        <CardDescription className="text-xs" data-oid="-lv56th">
          {getDescription()}
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-0" data-oid=".kf0:j9">
        {/* Прогресс загрузки */}
        {showProgress && isDownloading && progress && (
          <div className="mb-3" data-oid="0m1bi-c">
            <div className="flex justify-between text-xs text-muted-foreground mb-1" data-oid="wadw5yo">
              <span data-oid="8e3.gvc">Прогресс</span>
              <span data-oid="5mpxisr">{progress.percentage}%</span>
            </div>
            <div className="w-full bg-secondary rounded-full h-2" data-oid="81oqnd2">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress.percentage}%` }}
                data-oid="a29j7pf"
              />
            </div>
            {progress.total && (
              <div className="text-xs text-muted-foreground mt-1" data-oid="9c7c189">
                {formatBytes(progress.downloaded)} / {formatBytes(progress.total)}
              </div>
            )}
          </div>
        )}

        {/* Информация о версии */}
        {availableUpdate && (isUpdateAvailable || isDownloading) && (
          <div className="mb-3 p-2 bg-muted rounded-md" data-oid="9q7vbsz">
            <div className="text-xs font-medium" data-oid="44cxdec">
              Версия {availableUpdate.version}
            </div>
            {availableUpdate.notes && (
              <div className="text-xs text-muted-foreground mt-1 line-clamp-2" data-oid="56ipvkr">
                {availableUpdate.notes}
              </div>
            )}
            {availableUpdate.pub_date && (
              <div className="text-xs text-muted-foreground mt-1" data-oid="h2pkl94">
                {new Date(availableUpdate.pub_date).toLocaleDateString("ru-RU")}
              </div>
            )}
          </div>
        )}

        {/* Кнопки действий */}
        <div className="flex justify-end" data-oid="003tov4">
          {getActionButtons()}
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Утилита для форматирования размера файла
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 Bytes"

  const k = 1024
  const sizes = ["Bytes", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${Number.parseFloat((bytes / k ** i).toFixed(1))} ${sizes[i]}`
}

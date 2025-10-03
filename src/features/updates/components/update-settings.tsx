/**
 * UpdateSettings - страница настроек обновлений
 * Позволяет пользователю настроить автоматическую проверку обновлений
 */

import { Clock, Download, Info, RefreshCw, Settings } from "lucide-react"
import { useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"

import { useUpdateManager } from "../hooks/use-update-manager"

interface UpdateSettingsProps {
  className?: string
}

/**
 * Компонент настроек обновлений
 */
export function UpdateSettings({ className }: UpdateSettingsProps) {
  const {
    currentVersion,
    availableUpdate,
    isChecking,
    isUpdateAvailable,
    autoCheckSettings,
    checkForUpdates,
    enableAutoCheck,
    disableAutoCheck,
  } = useUpdateManager()

  const [selectedInterval, setSelectedInterval] = useState(autoCheckSettings.intervalMinutes.toString())

  const handleAutoCheckToggle = (enabled: boolean) => {
    if (enabled) {
      enableAutoCheck(Number.parseInt(selectedInterval, 10))
    } else {
      disableAutoCheck()
    }
  }

  const handleIntervalChange = (value: string) => {
    setSelectedInterval(value)
    if (autoCheckSettings.enabled) {
      enableAutoCheck(Number.parseInt(value, 10))
    }
  }

  const intervalOptions = [
    { value: "15", label: "Каждые 15 минут" },
    { value: "30", label: "Каждые 30 минут" },
    { value: "60", label: "Каждый час" },
    { value: "180", label: "Каждые 3 часа" },
    { value: "360", label: "Каждые 6 часов" },
    { value: "720", label: "Каждые 12 часов" },
    { value: "1440", label: "Каждый день" },
  ]

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Заголовок */}
      <div className="flex items-center gap-2">
        <Settings className="h-5 w-5" />
        <h1 className="text-xl font-semibold">Настройки обновлений</h1>
      </div>

      {/* Текущая версия */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-4 w-4" />
            Информация о версии
          </CardTitle>
          <CardDescription>Информация о текущей версии приложения</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-sm font-medium">Текущая версия</Label>
              <div className="flex items-center gap-2">
                <Badge variant="outline">{currentVersion}</Badge>
                {isUpdateAvailable && availableUpdate && (
                  <Badge variant="default">Доступна {availableUpdate.version}</Badge>
                )}
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={checkForUpdates} disabled={isChecking}>
              {isChecking && <RefreshCw className="h-4 w-4 mr-2 animate-spin" />}
              Проверить обновления
            </Button>
          </div>

          {isUpdateAvailable && availableUpdate && (
            <div className="p-3 bg-muted rounded-lg">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <div className="font-medium">Доступно обновление</div>
                  <div className="text-sm text-muted-foreground">Версия {availableUpdate.version}</div>
                  {availableUpdate.notes && (
                    <div className="text-sm text-muted-foreground line-clamp-3">{availableUpdate.notes}</div>
                  )}
                  {availableUpdate.pub_date && (
                    <div className="text-xs text-muted-foreground">
                      {new Date(availableUpdate.pub_date).toLocaleDateString("ru-RU")}
                    </div>
                  )}
                </div>
                <Button size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Обновить
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Настройки автоматической проверки */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Автоматическая проверка
          </CardTitle>
          <CardDescription>Настройте автоматическую проверку обновлений в фоновом режиме</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">Включить автоматическую проверку</Label>
              <div className="text-sm text-muted-foreground">
                Приложение будет автоматически проверять наличие обновлений
              </div>
            </div>
            <Switch checked={autoCheckSettings.enabled} onCheckedChange={handleAutoCheckToggle} />
          </div>

          <Separator />

          <div className="space-y-3">
            <Label className="text-sm font-medium">Интервал проверки</Label>
            <Select value={selectedInterval} onValueChange={handleIntervalChange} disabled={!autoCheckSettings.enabled}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Выберите интервал" />
              </SelectTrigger>
              <SelectContent>
                {intervalOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="text-xs text-muted-foreground">
              {autoCheckSettings.enabled
                ? `Проверка обновлений происходит ${intervalOptions.find((opt) => opt.value === selectedInterval)?.label.toLowerCase()}`
                : "Выберите интервал для автоматической проверки"}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Дополнительные настройки */}
      <Card>
        <CardHeader>
          <CardTitle>Дополнительные настройки</CardTitle>
          <CardDescription>Расширенные опции для управления обновлениями</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Уведомления</Label>
              <div className="text-sm text-muted-foreground">Показывать уведомления о доступных обновлениях</div>
            </div>
            <div className="flex justify-end">
              <Switch defaultChecked />
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Автоматическая загрузка</Label>
              <div className="text-sm text-muted-foreground">Автоматически загружать обновления при обнаружении</div>
            </div>
            <div className="flex justify-end">
              <Switch />
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Проверять бета-версии</Label>
              <div className="text-sm text-muted-foreground">Включить проверку предварительных версий</div>
            </div>
            <div className="flex justify-end">
              <Switch />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Информация о релизах */}
      <Card>
        <CardHeader>
          <CardTitle>История обновлений</CardTitle>
          <CardDescription>Последние обновления приложения</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">
            История обновлений будет отображаться здесь после получения данных от сервера.
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

/**
 * Упрощенная версия настроек для встраивания в модальные окна
 */
export function CompactUpdateSettings({ className }: { className?: string }) {
  const { autoCheckSettings, enableAutoCheck, disableAutoCheck } = useUpdateManager()

  const [selectedInterval, setSelectedInterval] = useState(autoCheckSettings.intervalMinutes.toString())

  const handleAutoCheckToggle = (enabled: boolean) => {
    if (enabled) {
      enableAutoCheck(Number.parseInt(selectedInterval, 10))
    } else {
      disableAutoCheck()
    }
  }

  const handleIntervalChange = (value: string) => {
    setSelectedInterval(value)
    if (autoCheckSettings.enabled) {
      enableAutoCheck(Number.parseInt(value, 10))
    }
  }

  const intervalOptions = [
    { value: "60", label: "Каждый час" },
    { value: "180", label: "Каждые 3 часа" },
    { value: "720", label: "Каждые 12 часов" },
    { value: "1440", label: "Каждый день" },
  ]

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label className="text-sm font-medium">Автоматическая проверка обновлений</Label>
          <div className="text-xs text-muted-foreground">Проверять обновления в фоновом режиме</div>
        </div>
        <Switch checked={autoCheckSettings.enabled} onCheckedChange={handleAutoCheckToggle} />
      </div>

      {autoCheckSettings.enabled && (
        <div className="space-y-2">
          <Label className="text-sm">Интервал проверки</Label>
          <Select value={selectedInterval} onValueChange={handleIntervalChange}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {intervalOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  )
}

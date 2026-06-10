/**
 * UpdateSettings - страница настроек обновлений
 * Позволяет пользователю настроить автоматическую проверку обновлений
 */

import { Badge } from "@timeline-studio/ui/components/badge"
import { Button } from "@timeline-studio/ui/components/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@timeline-studio/ui/components/card"
import { Label } from "@timeline-studio/ui/components/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@timeline-studio/ui/components/select"
import { Separator } from "@timeline-studio/ui/components/separator"
import { Switch } from "@timeline-studio/ui/components/switch"
import { Clock, Download, Info, RefreshCw, Settings } from "lucide-react"
import { useState } from "react"

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
    <div className={`space-y-6 ${className}`} data-oid="nad9i4:">
      {/* Заголовок */}
      <div className="flex items-center gap-2" data-oid="dd2hyn_">
        <Settings className="h-5 w-5" data-oid="0-s:hgl" />
        <h1 className="text-xl font-semibold" data-oid="z3i94_v">
          Настройки обновлений
        </h1>
      </div>

      {/* Текущая версия */}
      <Card data-oid="1rq8kjr">
        <CardHeader data-oid="x1h4srq">
          <CardTitle className="flex items-center gap-2" data-oid="o6o9raw">
            <Info className="h-4 w-4" data-oid="6jgc862" />
            Информация о версии
          </CardTitle>
          <CardDescription data-oid="ixrosf0">Информация о текущей версии приложения</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4" data-oid="9dfkzox">
          <div className="flex items-center justify-between" data-oid="3v.njeu">
            <div className="space-y-1" data-oid="yndahtf">
              <Label className="text-sm font-medium" data-oid="v048tlw">
                Текущая версия
              </Label>
              <div className="flex items-center gap-2" data-oid="0juhgjr">
                <Badge variant="outline" data-oid="q1o57kz">
                  {currentVersion}
                </Badge>
                {isUpdateAvailable && availableUpdate && (
                  <Badge variant="default" data-oid="qpm_sae">
                    Доступна {availableUpdate.version}
                  </Badge>
                )}
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={checkForUpdates} disabled={isChecking} data-oid="t:od:kz">
              {isChecking && <RefreshCw className="h-4 w-4 mr-2 animate-spin" data-oid="kqp4p1y" />}
              Проверить обновления
            </Button>
          </div>

          {isUpdateAvailable && availableUpdate && (
            <div className="p-3 bg-muted rounded-lg" data-oid="v.p2m3g">
              <div className="flex items-start justify-between" data-oid="pwvc3pv">
                <div className="space-y-2" data-oid="h74mqjj">
                  <div className="font-medium" data-oid="jnkxhq4">
                    Доступно обновление
                  </div>
                  <div className="text-sm text-muted-foreground" data-oid="8_7slww">
                    Версия {availableUpdate.version}
                  </div>
                  {availableUpdate.notes && (
                    <div className="text-sm text-muted-foreground line-clamp-3" data-oid="c0aaio0">
                      {availableUpdate.notes}
                    </div>
                  )}
                  {availableUpdate.pub_date && (
                    <div className="text-xs text-muted-foreground" data-oid="izksi7i">
                      {new Date(availableUpdate.pub_date).toLocaleDateString("ru-RU")}
                    </div>
                  )}
                </div>
                <Button size="sm" data-oid="rdjk9wx">
                  <Download className="h-4 w-4 mr-2" data-oid="3i.f6a6" />
                  Обновить
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Настройки автоматической проверки */}
      <Card data-oid="hgbh3y6">
        <CardHeader data-oid="uynuj49">
          <CardTitle className="flex items-center gap-2" data-oid="-geinj_">
            <Clock className="h-4 w-4" data-oid="hkznnjg" />
            Автоматическая проверка
          </CardTitle>
          <CardDescription data-oid="kwwtbhb">
            Настройте автоматическую проверку обновлений в фоновом режиме
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4" data-oid="mq2i94y">
          <div className="flex items-center justify-between" data-oid="7m62zy5">
            <div className="space-y-0.5" data-oid="ccu304g">
              <Label className="text-sm font-medium" data-oid="vffd:.f">
                Включить автоматическую проверку
              </Label>
              <div className="text-sm text-muted-foreground" data-oid="o40ygm-">
                Приложение будет автоматически проверять наличие обновлений
              </div>
            </div>
            <Switch checked={autoCheckSettings.enabled} onCheckedChange={handleAutoCheckToggle} data-oid="o2p411_" />
          </div>

          <Separator data-oid="k3ypg0-" />

          <div className="space-y-3" data-oid="1ln6lo5">
            <Label className="text-sm font-medium" data-oid="5ayqw_4">
              Интервал проверки
            </Label>
            <Select
              value={selectedInterval}
              onValueChange={handleIntervalChange}
              disabled={!autoCheckSettings.enabled}
              data-oid="jgsijhq"
            >
              <SelectTrigger className="w-full" data-oid="rv:n608">
                <SelectValue placeholder="Выберите интервал" data-oid="k9z2zeq" />
              </SelectTrigger>
              <SelectContent data-oid="djqzfiq">
                {intervalOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value} data-oid="jq4v7k6">
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="text-xs text-muted-foreground" data-oid="71-7ict">
              {autoCheckSettings.enabled
                ? `Проверка обновлений происходит ${intervalOptions.find((opt) => opt.value === selectedInterval)?.label.toLowerCase()}`
                : "Выберите интервал для автоматической проверки"}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Дополнительные настройки */}
      <Card data-oid=":mb8cwt">
        <CardHeader data-oid="ecj5rek">
          <CardTitle data-oid="_sns4g4">Дополнительные настройки</CardTitle>
          <CardDescription data-oid="d7wl1io">Расширенные опции для управления обновлениями</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4" data-oid="k983gtn">
          <div className="grid grid-cols-2 gap-4" data-oid="xq2g6wy">
            <div className="space-y-2" data-oid="c0-no65">
              <Label className="text-sm font-medium" data-oid="8.:qi29">
                Уведомления
              </Label>
              <div className="text-sm text-muted-foreground" data-oid="s4rtfdr">
                Показывать уведомления о доступных обновлениях
              </div>
            </div>
            <div className="flex justify-end" data-oid="0cc--w3">
              <Switch defaultChecked data-oid="jrijkiu" />
            </div>
          </div>

          <Separator data-oid="s:g:5q3" />

          <div className="grid grid-cols-2 gap-4" data-oid="tseipl4">
            <div className="space-y-2" data-oid="tzk90pn">
              <Label className="text-sm font-medium" data-oid="bvtgxd3">
                Автоматическая загрузка
              </Label>
              <div className="text-sm text-muted-foreground" data-oid="pofmf62">
                Автоматически загружать обновления при обнаружении
              </div>
            </div>
            <div className="flex justify-end" data-oid="dz4gnax">
              <Switch data-oid="a8qz1nr" />
            </div>
          </div>

          <Separator data-oid="x5p8:_m" />

          <div className="grid grid-cols-2 gap-4" data-oid="ctneg17">
            <div className="space-y-2" data-oid="kgkh-33">
              <Label className="text-sm font-medium" data-oid="fcnas_e">
                Проверять бета-версии
              </Label>
              <div className="text-sm text-muted-foreground" data-oid="y5zc-zi">
                Включить проверку предварительных версий
              </div>
            </div>
            <div className="flex justify-end" data-oid="puc5b3m">
              <Switch data-oid="vx59p71" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Информация о релизах */}
      <Card data-oid="aesewn2">
        <CardHeader data-oid="snwq2tb">
          <CardTitle data-oid="0iz27ja">История обновлений</CardTitle>
          <CardDescription data-oid="f.mty21">Последние обновления приложения</CardDescription>
        </CardHeader>
        <CardContent data-oid="2ftl:rc">
          <div className="text-sm text-muted-foreground" data-oid="0ocq3tu">
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
    <div className={`space-y-4 ${className}`} data-oid="t_tbgs2">
      <div className="flex items-center justify-between" data-oid="z2j.nia">
        <div className="space-y-0.5" data-oid="uj6fc6p">
          <Label className="text-sm font-medium" data-oid="yi5_u1v">
            Автоматическая проверка обновлений
          </Label>
          <div className="text-xs text-muted-foreground" data-oid="-e._t45">
            Проверять обновления в фоновом режиме
          </div>
        </div>
        <Switch checked={autoCheckSettings.enabled} onCheckedChange={handleAutoCheckToggle} data-oid="t:6ctwu" />
      </div>

      {autoCheckSettings.enabled && (
        <div className="space-y-2" data-oid="i-::5vd">
          <Label className="text-sm" data-oid="0en_-f7">
            Интервал проверки
          </Label>
          <Select value={selectedInterval} onValueChange={handleIntervalChange} data-oid="8wv4:78">
            <SelectTrigger data-oid="xdootk_">
              <SelectValue data-oid="tli7vkg" />
            </SelectTrigger>
            <SelectContent data-oid="m4x0q2-">
              {intervalOptions.map((option) => (
                <SelectItem key={option.value} value={option.value} data-oid="8c6gza:">
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

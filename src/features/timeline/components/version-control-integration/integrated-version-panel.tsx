/**
 * Интегрированная панель управления версиями
 * Объединяет Undo/Redo и Project Version Control
 */

import { AlertTriangle, CheckCircle, GitBranch, GitCommit, History, Redo, Settings, Undo } from "lucide-react"
import { useEffect, useState } from "react"
import { Alert, AlertDescription, AlertTitle } from "@timeline-studio/ui/components/alert"
import { Badge } from "@timeline-studio/ui/components/badge"
import { Button } from "@timeline-studio/ui/components/button"
import { Card, CardContent, CardHeader, CardTitle } from "@timeline-studio/ui/components/card"
import { Input } from "@timeline-studio/ui/components/input"
import { Label } from "@timeline-studio/ui/components/label"
import { Progress } from "@timeline-studio/ui/components/progress"
import { Separator } from "@timeline-studio/ui/components/separator"
import { Switch } from "@timeline-studio/ui/components/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@timeline-studio/ui/components/tabs"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@timeline-studio/ui/components/tooltip"
import {
  type IntegrationRecommendation,
  useIntegratedVersionControl,
} from "../../hooks/integration/use-integrated-version-control"

const RECOMMENDATION_ICONS = {
  snapshot: GitCommit,
  branch: GitBranch,
  optimize: Settings,
  warning: AlertTriangle,
}

interface IntegratedVersionPanelProps {
  className?: string
  compact?: boolean
}

export function IntegratedVersionPanel({ className, compact = false }: IntegratedVersionPanelProps) {
  const {
    // Undo/Redo
    undo,
    redo,
    canUndo,
    canRedo,

    // Version Control
    createSnapshot,
    createCheckpoint,
    smartUndo,

    // Состояние
    integrationStatus,
    versionControlState,

    // Конфигурация
    updateIntegrationConfig,
    setIntegrationEnabled,

    // Рекомендации
    getRecommendations,
  } = useIntegratedVersionControl()

  const [recommendations, setRecommendations] = useState<IntegrationRecommendation[]>([])
  const [autoSnapshotThreshold, setAutoSnapshotThreshold] = useState(integrationStatus.config.autoSnapshotThreshold)
  const [autoSnapshotInterval, setAutoSnapshotInterval] = useState(integrationStatus.config.autoSnapshotInterval)

  // Обновляем рекомендации
  useEffect(() => {
    // Первоначальная загрузка
    setRecommendations(getRecommendations())

    const interval = setInterval(() => {
      setRecommendations(getRecommendations())
    }, 10000) // Каждые 10 секунд

    return () => clearInterval(interval)
  }, []) // Убираем зависимость от getRecommendations

  const handleSnapshotThresholdChange = (value: number) => {
    setAutoSnapshotThreshold(value)
    updateIntegrationConfig({ autoSnapshotThreshold: value })
  }

  const handleSnapshotIntervalChange = (value: number) => {
    setAutoSnapshotInterval(value)
    updateIntegrationConfig({ autoSnapshotInterval: value })
  }

  const getSnapshotProgress = () => {
    if (!integrationStatus.config.autoSnapshotEnabled) return 0
    return Math.min(
      100,
      (integrationStatus.actionsSinceSnapshot / integrationStatus.config.autoSnapshotThreshold) * 100,
    )
  }

  if (compact) {
    return (
      <div className={`flex items-center gap-2 ${className}`} data-oid="0dn9uxq">
        <TooltipProvider data-oid="g8-pqqn">
          {/* Основные кнопки */}
          <div className="flex items-center gap-1" data-oid="db8-a9d">
            <Tooltip data-oid="s8zg60d">
              <TooltipTrigger asChild data-oid=":m0o7ah">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={smartUndo}
                  disabled={!canUndo}
                  className="relative"
                  data-oid="24egha9"
                >
                  <Undo className="h-4 w-4" data-oid="inowlfn" />
                  {integrationStatus.pendingActions > 0 && (
                    <Badge className="absolute -top-2 -right-2 px-1 py-0 text-xs h-4 min-w-4" data-oid=".rmg4s:">
                      {integrationStatus.pendingActions}
                    </Badge>
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent data-oid="t.dfg1e">
                <div className="space-y-1" data-oid="v5f0l70">
                  <div className="font-medium" data-oid="wtv6jwn">
                    Умная отмена
                  </div>
                  <div className="text-sm" data-oid="t3bv0dx">
                    {canUndo ? "Отменить последнее действие" : "Восстановить предыдущую версию"}
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>

            <Tooltip data-oid="l_6.y-a">
              <TooltipTrigger asChild data-oid=".8y2vbz">
                <Button variant="ghost" size="sm" onClick={redo} disabled={!canRedo} data-oid="65zyp0r">
                  <Redo className="h-4 w-4" data-oid="36cw92:" />
                </Button>
              </TooltipTrigger>
              <TooltipContent data-oid=".ns80li">Повторить действие</TooltipContent>
            </Tooltip>
          </div>

          <Separator orientation="vertical" className="h-6" data-oid="05xxk9e" />

          {/* Snapshot кнопка */}
          <Tooltip data-oid="6a.0oa2">
            <TooltipTrigger asChild data-oid="eqce4t:">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => createCheckpoint()}
                className="relative"
                data-oid="bxtox_8"
              >
                <GitCommit className="h-4 w-4" data-oid="5no8-_i" />
                {integrationStatus.shouldCreateSnapshot && (
                  <div
                    className="absolute -top-1 -right-1 w-3 h-3 bg-orange-500 rounded-full animate-pulse"
                    data-oid="729c2_6"
                  />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent data-oid="e7cl4mf">
              <div className="space-y-1" data-oid="70t17yh">
                <div className="font-medium" data-oid="r0xnid6">
                  Создать снапшот
                </div>
                <div className="text-sm" data-oid=":zaf7n-">
                  {integrationStatus.actionsSinceSnapshot} действий с последнего снапшота
                </div>
              </div>
            </TooltipContent>
          </Tooltip>

          {/* Состояние */}
          <div className="flex items-center gap-1" data-oid="vmr08o0">
            <Badge variant="secondary" className="text-xs" data-oid="whrba7n">
              {versionControlState.branchName}
            </Badge>
            {versionControlState.hasUncommittedChanges && (
              <Badge variant="outline" className="text-xs" data-oid="2l6y53c">
                <AlertTriangle className="h-3 w-3 mr-1" data-oid="xklz0dz" />
                Изменения
              </Badge>
            )}
          </div>
        </TooltipProvider>
      </div>
    )
  }

  return (
    <Card className={className} data-oid="0a2n17.">
      <CardHeader data-oid="zf5kh9u">
        <CardTitle className="flex items-center justify-between" data-oid="zzaxiot">
          <div className="flex items-center gap-2" data-oid="mx5_4pv">
            <History className="h-5 w-5" data-oid="7mdr.rh" />
            Управление версиями
          </div>
          <div className="flex items-center gap-2" data-oid="7x4zf3f">
            <Badge variant={integrationStatus.isEnabled ? "default" : "secondary"} data-oid="b_d6gon">
              {integrationStatus.isEnabled ? "Включено" : "Отключено"}
            </Badge>
            <Badge variant="secondary" data-oid="xjp33ov">
              {versionControlState.branchName}
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent data-oid="dzni588">
        <Tabs defaultValue="operations" className="w-full" data-oid="i3zotsc">
          <TabsList className="grid w-full grid-cols-4" data-oid="pb6x7dz">
            <TabsTrigger value="operations" data-oid="uddfopv">
              Операции
            </TabsTrigger>
            <TabsTrigger value="status" data-oid="b7yai1i">
              Статус
            </TabsTrigger>
            <TabsTrigger value="settings" data-oid="s-r9tft">
              Настройки
            </TabsTrigger>
            <TabsTrigger value="recommendations" data-oid="5.70mwz">
              Советы
              {recommendations.length > 0 && (
                <Badge variant="secondary" className="ml-1 text-xs" data-oid="rkjlkfx">
                  {recommendations.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Операции */}
          <TabsContent value="operations" className="space-y-4" data-oid="pdg1loh">
            <div className="grid grid-cols-2 gap-4" data-oid="skzt1d_">
              {/* Быстрые операции */}
              <div className="space-y-2" data-oid="1l_d6v8">
                <Label className="text-sm font-medium" data-oid="8eld5bs">
                  Быстрые операции
                </Label>
                <div className="grid grid-cols-2 gap-2" data-oid="xtzh9a8">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={smartUndo}
                    disabled={!canUndo}
                    className="flex items-center gap-2"
                    data-oid="rg.yn38"
                  >
                    <Undo className="h-4 w-4" data-oid="ar0ary4" />
                    Умная отмена
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={redo}
                    disabled={!canRedo}
                    className="flex items-center gap-2"
                    data-oid="wkf6.ax"
                  >
                    <Redo className="h-4 w-4" data-oid="t1j9faa" />
                    Повторить
                  </Button>
                </div>
              </div>

              {/* Version Control операции */}
              <div className="space-y-2" data-oid="jmbeq1j">
                <Label className="text-sm font-medium" data-oid="q31_tcc">
                  Управление версиями
                </Label>
                <div className="grid grid-cols-1 gap-2" data-oid="zw_arx7">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => createCheckpoint()}
                    className="flex items-center gap-2"
                    data-oid=".b2gb0-"
                  >
                    <GitCommit className="h-4 w-4" data-oid="1256i15" />
                    Создать снапшот
                  </Button>
                </div>
              </div>
            </div>

            {/* Прогресс до автоснапшота */}
            {integrationStatus.config.autoSnapshotEnabled && (
              <div className="space-y-2" data-oid="jc1x82g">
                <div className="flex items-center justify-between text-sm" data-oid="pv-2r.4">
                  <Label data-oid="8emu88i">Прогресс до автоснапшота</Label>
                  <span data-oid="3x2we-a">
                    {integrationStatus.actionsSinceSnapshot} / {integrationStatus.config.autoSnapshotThreshold}
                  </span>
                </div>
                <Progress value={getSnapshotProgress()} className="w-full" data-oid="5ahwa3q" />
              </div>
            )}
          </TabsContent>

          {/* Статус */}
          <TabsContent value="status" className="space-y-4" data-oid="5j0v7iu">
            <div className="grid grid-cols-2 gap-4" data-oid="z-.19:1">
              <div className="space-y-3" data-oid="q2r7fwq">
                <div className="space-y-1" data-oid="isw0yje">
                  <Label className="text-sm" data-oid="g99wz4.">
                    Undo/Redo состояние
                  </Label>
                  <div className="text-sm space-y-1" data-oid="ol04o28">
                    <div className="flex justify-between" data-oid="q177tne">
                      <span data-oid="6v076fc">Можно отменить:</span>
                      <span className={canUndo ? "text-green-600" : "text-gray-400"} data-oid="640subh">
                        {canUndo ? "Да" : "Нет"}
                      </span>
                    </div>
                    <div className="flex justify-between" data-oid="h36u:kd">
                      <span data-oid="pgcvjdw">Можно повторить:</span>
                      <span className={canRedo ? "text-green-600" : "text-gray-400"} data-oid="w7jnq.w">
                        {canRedo ? "Да" : "Нет"}
                      </span>
                    </div>
                    <div className="flex justify-between" data-oid=".hcjzpj">
                      <span data-oid="f26sa9x">Несохр. действий:</span>
                      <span className="font-medium" data-oid="x.n1vhc">
                        {integrationStatus.pendingActions}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3" data-oid="ekwyadx">
                <div className="space-y-1" data-oid="7snzsy3">
                  <Label className="text-sm" data-oid=".x:.i8h">
                    Version Control
                  </Label>
                  <div className="text-sm space-y-1" data-oid="2afl5w5">
                    <div className="flex justify-between" data-oid="08t28sl">
                      <span data-oid="eljh9oq">Ветка:</span>
                      <Badge variant="outline" className="text-xs" data-oid=".p99ncz">
                        {versionControlState.branchName}
                      </Badge>
                    </div>
                    <div className="flex justify-between" data-oid="5el4q6e">
                      <span data-oid="r-wkmf7">Есть изменения:</span>
                      <span
                        className={versionControlState.hasUncommittedChanges ? "text-orange-600" : "text-green-600"}
                        data-oid="12qmoet"
                      >
                        {versionControlState.hasUncommittedChanges ? "Да" : "Нет"}
                      </span>
                    </div>
                    <div className="flex justify-between" data-oid="i-of3kc">
                      <span data-oid="g1m5w_1">Последний снапшот:</span>
                      <span className="text-xs" data-oid="bjmkx:7">
                        {integrationStatus.lastSnapshotTime.toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Настройки */}
          <TabsContent value="settings" className="space-y-4" data-oid="vn.nhf4">
            <div className="space-y-4" data-oid="oi5i85a">
              <div className="flex items-center justify-between" data-oid="-c_bk4d">
                <div className="space-y-0.5" data-oid="orc434.">
                  <Label data-oid="lj.wg7p">Интеграция версий</Label>
                  <div className="text-sm text-muted-foreground" data-oid="n0ktp-j">
                    Автоматическое создание снапшотов
                  </div>
                </div>
                <Switch
                  checked={integrationStatus.isEnabled}
                  onCheckedChange={setIntegrationEnabled}
                  data-oid="c82gh81"
                />
              </div>

              <Separator data-oid="ic_bij3" />

              <div className="space-y-4" data-oid="wd:iy9n">
                <div className="flex items-center justify-between" data-oid="izw2vh9">
                  <div className="space-y-0.5" data-oid="_xgssq:">
                    <Label data-oid="i8pdbb6">Автоматические снапшоты</Label>
                    <div className="text-sm text-muted-foreground" data-oid="eulzijh">
                      Создавать снапшоты автоматически
                    </div>
                  </div>
                  <Switch
                    checked={integrationStatus.config.autoSnapshotEnabled}
                    onCheckedChange={(checked) => updateIntegrationConfig({ autoSnapshotEnabled: checked })}
                    disabled={!integrationStatus.isEnabled}
                    data-oid="a55.zn_"
                  />
                </div>

                {integrationStatus.config.autoSnapshotEnabled && (
                  <>
                    <div className="space-y-2" data-oid="8lzxyi0">
                      <Label data-oid="e4vhcje">Порог действий для снапшота</Label>
                      <div className="flex items-center gap-2" data-oid="edilluk">
                        <Input
                          type="number"
                          value={autoSnapshotThreshold}
                          onChange={(e) => handleSnapshotThresholdChange(Number(e.target.value))}
                          min={10}
                          max={200}
                          className="w-20"
                          data-oid="syq.w57"
                        />

                        <span className="text-sm text-muted-foreground" data-oid="h46y0l7">
                          действий
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2" data-oid="hxuu68z">
                      <Label data-oid="66cm_io">Интервал автоснапшотов</Label>
                      <div className="flex items-center gap-2" data-oid="xlju4l1">
                        <Input
                          type="number"
                          value={autoSnapshotInterval}
                          onChange={(e) => handleSnapshotIntervalChange(Number(e.target.value))}
                          min={5}
                          max={60}
                          className="w-20"
                          data-oid="2k.wlpq"
                        />

                        <span className="text-sm text-muted-foreground" data-oid="1m6927:">
                          минут
                        </span>
                      </div>
                    </div>
                  </>
                )}
              </div>

              <Separator data-oid="h93t2rd" />

              <div className="space-y-4" data-oid="1ecmn20">
                <div className="flex items-center justify-between" data-oid="cq4a9p.">
                  <div className="space-y-0.5" data-oid="mf7-efx">
                    <Label data-oid="kjwbz.k">Очистка при переключении</Label>
                    <div className="text-sm text-muted-foreground" data-oid=".ouaz2s">
                      Очищать Undo/Redo при смене ветки
                    </div>
                  </div>
                  <Switch
                    checked={integrationStatus.config.clearHistoryOnBranchSwitch}
                    onCheckedChange={(checked) =>
                      updateIntegrationConfig({
                        clearHistoryOnBranchSwitch: checked,
                      })
                    }
                    data-oid="pfmnluv"
                  />
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Рекомендации */}
          <TabsContent value="recommendations" className="space-y-4" data-oid="p::zlc_">
            {recommendations.length === 0 ? (
              <div className="text-center text-muted-foreground py-8" data-oid="q2d8s98">
                <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" data-oid=":hqygiz" />
                <p data-oid="7pwgz7z">Все хорошо! Нет рекомендаций.</p>
              </div>
            ) : (
              <div className="space-y-3" data-oid="2ilfiw:">
                {recommendations.map((rec, index) => {
                  const Icon = RECOMMENDATION_ICONS[rec.type]
                  return (
                    <Alert
                      key={index}
                      className={`${
                        rec.priority === "high"
                          ? "border-red-500"
                          : rec.priority === "medium"
                            ? "border-orange-500"
                            : "border-blue-500"
                      }`}
                      data-oid="a5:1q86"
                    >
                      <Icon className="h-4 w-4" data-oid="bmpqlko" />
                      <AlertTitle className="flex items-center justify-between" data-oid="_uein3g">
                        {rec.title}
                        <Badge
                          variant={
                            rec.priority === "high"
                              ? "destructive"
                              : rec.priority === "medium"
                                ? "default"
                                : "secondary"
                          }
                          className="text-xs"
                          data-oid="-vn-m-z"
                        >
                          {rec.priority}
                        </Badge>
                      </AlertTitle>
                      <AlertDescription className="space-y-2" data-oid="2tpg:a7">
                        <p data-oid="aavwf:d">{rec.description}</p>
                        {rec.action && (
                          <Button size="sm" variant="outline" onClick={rec.action} data-oid="x:x382d">
                            Применить
                          </Button>
                        )}
                      </AlertDescription>
                    </Alert>
                  )
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

/**
 * Интегрированная панель управления версиями
 * Объединяет Undo/Redo и Project Version Control
 */

import { AlertTriangle, CheckCircle, GitBranch, GitCommit, History, Redo, Settings, Undo } from "lucide-react"
import { useEffect, useState } from "react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { type IntegrationRecommendation, useIntegratedVersionControl } from "../../hooks/integration/use-integrated-version-control"

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
      <div className={`flex items-center gap-2 ${className}`}>
        <TooltipProvider>
          {/* Основные кнопки */}
          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" onClick={smartUndo} disabled={!canUndo} className="relative">
                  <Undo className="h-4 w-4" />
                  {integrationStatus.pendingActions > 0 && (
                    <Badge className="absolute -top-2 -right-2 px-1 py-0 text-xs h-4 min-w-4">
                      {integrationStatus.pendingActions}
                    </Badge>
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <div className="space-y-1">
                  <div className="font-medium">Умная отмена</div>
                  <div className="text-sm">
                    {canUndo ? "Отменить последнее действие" : "Восстановить предыдущую версию"}
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" onClick={redo} disabled={!canRedo}>
                  <Redo className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Повторить действие</TooltipContent>
            </Tooltip>
          </div>

          <Separator orientation="vertical" className="h-6" />

          {/* Snapshot кнопка */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="sm" onClick={() => createCheckpoint()} className="relative">
                <GitCommit className="h-4 w-4" />
                {integrationStatus.shouldCreateSnapshot && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-orange-500 rounded-full animate-pulse" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <div className="space-y-1">
                <div className="font-medium">Создать снапшот</div>
                <div className="text-sm">{integrationStatus.actionsSinceSnapshot} действий с последнего снапшота</div>
              </div>
            </TooltipContent>
          </Tooltip>

          {/* Состояние */}
          <div className="flex items-center gap-1">
            <Badge variant="secondary" className="text-xs">
              {versionControlState.branchName}
            </Badge>
            {versionControlState.hasUncommittedChanges && (
              <Badge variant="outline" className="text-xs">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Изменения
              </Badge>
            )}
          </div>
        </TooltipProvider>
      </div>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Управление версиями
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={integrationStatus.isEnabled ? "default" : "secondary"}>
              {integrationStatus.isEnabled ? "Включено" : "Отключено"}
            </Badge>
            <Badge variant="secondary">{versionControlState.branchName}</Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="operations" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="operations">Операции</TabsTrigger>
            <TabsTrigger value="status">Статус</TabsTrigger>
            <TabsTrigger value="settings">Настройки</TabsTrigger>
            <TabsTrigger value="recommendations">
              Советы
              {recommendations.length > 0 && (
                <Badge variant="secondary" className="ml-1 text-xs">
                  {recommendations.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Операции */}
          <TabsContent value="operations" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {/* Быстрые операции */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Быстрые операции</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={smartUndo}
                    disabled={!canUndo}
                    className="flex items-center gap-2"
                  >
                    <Undo className="h-4 w-4" />
                    Умная отмена
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={redo}
                    disabled={!canRedo}
                    className="flex items-center gap-2"
                  >
                    <Redo className="h-4 w-4" />
                    Повторить
                  </Button>
                </div>
              </div>

              {/* Version Control операции */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Управление версиями</Label>
                <div className="grid grid-cols-1 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => createCheckpoint()}
                    className="flex items-center gap-2"
                  >
                    <GitCommit className="h-4 w-4" />
                    Создать снапшот
                  </Button>
                </div>
              </div>
            </div>

            {/* Прогресс до автоснапшота */}
            {integrationStatus.config.autoSnapshotEnabled && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <Label>Прогресс до автоснапшота</Label>
                  <span>
                    {integrationStatus.actionsSinceSnapshot} / {integrationStatus.config.autoSnapshotThreshold}
                  </span>
                </div>
                <Progress value={getSnapshotProgress()} className="w-full" />
              </div>
            )}
          </TabsContent>

          {/* Статус */}
          <TabsContent value="status" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label className="text-sm">Undo/Redo состояние</Label>
                  <div className="text-sm space-y-1">
                    <div className="flex justify-between">
                      <span>Можно отменить:</span>
                      <span className={canUndo ? "text-green-600" : "text-gray-400"}>{canUndo ? "Да" : "Нет"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Можно повторить:</span>
                      <span className={canRedo ? "text-green-600" : "text-gray-400"}>{canRedo ? "Да" : "Нет"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Несохр. действий:</span>
                      <span className="font-medium">{integrationStatus.pendingActions}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="space-y-1">
                  <Label className="text-sm">Version Control</Label>
                  <div className="text-sm space-y-1">
                    <div className="flex justify-between">
                      <span>Ветка:</span>
                      <Badge variant="outline" className="text-xs">
                        {versionControlState.branchName}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Есть изменения:</span>
                      <span
                        className={versionControlState.hasUncommittedChanges ? "text-orange-600" : "text-green-600"}
                      >
                        {versionControlState.hasUncommittedChanges ? "Да" : "Нет"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Последний снапшот:</span>
                      <span className="text-xs">{integrationStatus.lastSnapshotTime.toLocaleTimeString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Настройки */}
          <TabsContent value="settings" className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Интеграция версий</Label>
                  <div className="text-sm text-muted-foreground">Автоматическое создание снапшотов</div>
                </div>
                <Switch checked={integrationStatus.isEnabled} onCheckedChange={setIntegrationEnabled} />
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Автоматические снапшоты</Label>
                    <div className="text-sm text-muted-foreground">Создавать снапшоты автоматически</div>
                  </div>
                  <Switch
                    checked={integrationStatus.config.autoSnapshotEnabled}
                    onCheckedChange={(checked) => updateIntegrationConfig({ autoSnapshotEnabled: checked })}
                    disabled={!integrationStatus.isEnabled}
                  />
                </div>

                {integrationStatus.config.autoSnapshotEnabled && (
                  <>
                    <div className="space-y-2">
                      <Label>Порог действий для снапшота</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          value={autoSnapshotThreshold}
                          onChange={(e) => handleSnapshotThresholdChange(Number(e.target.value))}
                          min={10}
                          max={200}
                          className="w-20"
                        />
                        <span className="text-sm text-muted-foreground">действий</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Интервал автоснапшотов</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          value={autoSnapshotInterval}
                          onChange={(e) => handleSnapshotIntervalChange(Number(e.target.value))}
                          min={5}
                          max={60}
                          className="w-20"
                        />
                        <span className="text-sm text-muted-foreground">минут</span>
                      </div>
                    </div>
                  </>
                )}
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Очистка при переключении</Label>
                    <div className="text-sm text-muted-foreground">Очищать Undo/Redo при смене ветки</div>
                  </div>
                  <Switch
                    checked={integrationStatus.config.clearHistoryOnBranchSwitch}
                    onCheckedChange={(checked) => updateIntegrationConfig({ clearHistoryOnBranchSwitch: checked })}
                  />
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Рекомендации */}
          <TabsContent value="recommendations" className="space-y-4">
            {recommendations.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
                <p>Все хорошо! Нет рекомендаций.</p>
              </div>
            ) : (
              <div className="space-y-3">
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
                    >
                      <Icon className="h-4 w-4" />
                      <AlertTitle className="flex items-center justify-between">
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
                        >
                          {rec.priority}
                        </Badge>
                      </AlertTitle>
                      <AlertDescription className="space-y-2">
                        <p>{rec.description}</p>
                        {rec.action && (
                          <Button size="sm" variant="outline" onClick={rec.action}>
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

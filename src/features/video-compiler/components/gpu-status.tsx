import { Badge } from "@timeline-studio/ui/components/badge"
import { Button } from "@timeline-studio/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@timeline-studio/ui/components/card"
import { Progress } from "@timeline-studio/ui/components/progress"
import { Separator } from "@timeline-studio/ui/components/separator"
import { Skeleton } from "@timeline-studio/ui/components/skeleton"
import { Switch } from "@timeline-studio/ui/components/switch"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@timeline-studio/ui/components/tooltip"
import { Activity, Cpu, HardDrive, Info, Settings, Zap } from "lucide-react"
import { useTranslation } from "react-i18next"
import { cn } from "@/lib/utils"

import {
  formatGpuMemory,
  formatGpuUtilization,
  getGpuEncoderDisplayName,
  getGpuRecommendations,
  getGpuStatusColor,
  useGpuCapabilities,
} from "../hooks/use-gpu-capabilities"

interface GpuStatusProps {
  className?: string
  showDetails?: boolean
  onSettingsClick?: () => void
}

export function GpuStatus({ className, showDetails = true, onSettingsClick }: GpuStatusProps) {
  const { t } = useTranslation()
  const {
    gpuCapabilities,
    currentGpu,
    systemInfo,
    compilerSettings,
    isLoading,
    error,
    updateSettings,
    refreshCapabilities,
  } = useGpuCapabilities()

  // Обработчик переключения GPU ускорения
  const handleToggleGpuAcceleration = async (enabled: boolean) => {
    if (!compilerSettings) return

    await updateSettings({
      ...compilerSettings,
      hardware_acceleration: enabled,
    })
  }

  if (isLoading) {
    return <GpuStatusSkeleton className={className} data-oid="qpquiov" />
  }

  if (error) {
    return (
      <Card className={cn("border-destructive", className)} data-oid="wrob_yq">
        <CardHeader data-oid="owlbrit">
          <CardTitle className="text-destructive" data-oid="s:cdivo">
            {t("videoCompiler.gpu.error")}
          </CardTitle>
          <CardDescription data-oid="3khemu3">{error}</CardDescription>
        </CardHeader>
        <CardFooter data-oid="3jsuvqh">
          <Button variant="outline" size="sm" onClick={refreshCapabilities} data-oid="ijcrkdo">
            {t("videoCompiler.gpu.retry")}
          </Button>
        </CardFooter>
      </Card>
    )
  }

  const isGpuAvailable = gpuCapabilities?.hardware_acceleration_supported || false
  const recommendations = getGpuRecommendations(gpuCapabilities, t)

  return (
    <Card className={className} data-oid="m1-6:gk">
      <CardHeader data-oid="21qo3dr">
        <div className="flex items-center justify-between" data-oid="qnj2pjp">
          <div className="flex items-center gap-2" data-oid="_fb63cc">
            <Zap className={cn("h-5 w-5", getGpuStatusColor(isGpuAvailable))} data-oid="036d.pv" />
            <CardTitle data-oid="pzv7gce">{t("videoCompiler.gpu.acceleration")}</CardTitle>
          </div>
          <div className="flex items-center gap-2" data-oid="1b:ott_">
            <Switch
              checked={compilerSettings?.hardware_acceleration || false}
              onCheckedChange={handleToggleGpuAcceleration}
              disabled={!isGpuAvailable}
              data-oid="03.cvso"
            />

            {onSettingsClick && (
              <Button variant="ghost" size="icon" onClick={onSettingsClick} data-oid="8sa2j4p">
                <Settings className="h-4 w-4" data-oid="ony:3u3" />
              </Button>
            )}
          </div>
        </div>
        <CardDescription data-oid="8o8fd05">
          {isGpuAvailable
            ? t("videoCompiler.gpu.accelerationAvailable")
            : t("videoCompiler.gpu.accelerationUnavailable")}
        </CardDescription>
      </CardHeader>

      {showDetails && (
        <>
          <CardContent className="space-y-4" data-oid="u4:nmdr">
            {/* Информация о GPU */}
            {currentGpu && (
              <div className="space-y-2" data-oid="zdgs0xc">
                <div className="flex items-center gap-2 text-sm font-medium" data-oid="zatiipf">
                  <Cpu className="h-4 w-4" data-oid="uoo:iw2" />
                  {t("videoCompiler.gpu.videoCard")}
                </div>
                <div className="ml-6 space-y-1" data-oid="h_9_x:x">
                  <p className="text-sm" data-oid="xt2lny6">
                    {currentGpu.name}
                  </p>
                  {currentGpu.driver_version && (
                    <p className="text-xs text-muted-foreground" data-oid="x42a00b">
                      {t("videoCompiler.gpu.driver")}: {currentGpu.driver_version}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Память GPU */}
            {currentGpu?.memory_total && (
              <div className="space-y-2" data-oid="hthb2pl">
                <div className="flex items-center gap-2 text-sm font-medium" data-oid="nrt-.zs">
                  <HardDrive className="h-4 w-4" data-oid="vvrsc7v" />
                  {t("videoCompiler.gpu.videoMemory")}
                </div>
                <div className="ml-6 space-y-2" data-oid=":ihflcc">
                  <div className="flex justify-between text-sm" data-oid="cs9o0ck">
                    <span data-oid="ldbg-ae">{t("videoCompiler.gpu.memoryUsed")}</span>
                    <span data-oid="gcnigx8">
                      {formatGpuMemory(currentGpu.memory_used ?? 0, t)} / {formatGpuMemory(currentGpu.memory_total, t)}
                    </span>
                  </div>
                  {currentGpu.memory_used && currentGpu.memory_total && (
                    <Progress
                      value={(currentGpu.memory_used / currentGpu.memory_total) * 100}
                      className="h-2"
                      data-oid="611nxcl"
                    />
                  )}
                </div>
              </div>
            )}

            {/* Загрузка GPU */}
            {currentGpu?.utilization !== undefined && (
              <div className="space-y-2" data-oid="47g7qdx">
                <div className="flex items-center gap-2 text-sm font-medium" data-oid="ai-:d1t">
                  <Activity className="h-4 w-4" data-oid="1:u2oyc" />
                  {t("videoCompiler.gpu.gpuLoad")}
                </div>
                <div className="ml-6 space-y-2" data-oid="kmw67y5">
                  <div className="flex justify-between text-sm" data-oid="u59pk3c">
                    <span data-oid="p_hn6tm">{t("videoCompiler.gpu.usage")}</span>
                    <span data-oid="tsdeyzy">{formatGpuUtilization(currentGpu.utilization, t)}</span>
                  </div>
                  <Progress value={currentGpu.utilization} className="h-2" data-oid="kj1bdz7" />
                </div>
              </div>
            )}

            <Separator data-oid="xv39x:k" />

            {/* Доступные кодировщики */}
            {gpuCapabilities && (
              <div className="space-y-2" data-oid="-iy86pu">
                <div className="flex items-center gap-2 text-sm font-medium" data-oid="76348v_">
                  <Cpu className="h-4 w-4" data-oid="07racu9" />
                  {t("videoCompiler.gpu.encoders")}
                </div>
                <div className="ml-6 flex flex-wrap gap-2" data-oid="hg3ood0">
                  {gpuCapabilities.available_encoders.map((encoder) => (
                    <Badge
                      key={encoder}
                      variant={encoder === gpuCapabilities.recommended_encoder ? "default" : "secondary"}
                      data-oid=".p.y49i"
                    >
                      {getGpuEncoderDisplayName(encoder, t)}
                    </Badge>
                  ))}
                  {gpuCapabilities.available_encoders.length === 0 && (
                    <Badge variant="outline" data-oid="ok9s5px">
                      {t("videoCompiler.gpu.cpuOnly")}
                    </Badge>
                  )}
                </div>
              </div>
            )}

            {/* Системная информация */}
            {systemInfo && (
              <div className="space-y-2" data-oid="wd-ezvs">
                <div className="flex items-center gap-2 text-sm font-medium" data-oid="pw.sw23">
                  <Info className="h-4 w-4" data-oid="fs9b6u_" />
                  {t("videoCompiler.gpu.system")}
                </div>
                <div className="ml-6 space-y-1 text-sm text-muted-foreground" data-oid="t:zikt0">
                  <p data-oid="pst-p4s">
                    {t("videoCompiler.gpu.os")}: {systemInfo.os.type} {systemInfo.os.version} (
                    {systemInfo.os.architecture})
                  </p>
                  <p data-oid="c2srzn5">
                    {t("videoCompiler.gpu.cpu")}: {systemInfo.cpu.cores} {t("videoCompiler.gpu.cores")} (
                    {systemInfo.cpu.arch})
                  </p>
                  {systemInfo.memory && (
                    <p data-oid="_fv9kzr">
                      {t("videoCompiler.gpu.memory")}: {formatGpuMemory(systemInfo.memory.total_bytes, t)}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Рекомендации */}
            {recommendations.length > 0 && (
              <>
                <Separator data-oid="gqqjf7e" />
                <div className="space-y-2" data-oid="i6sm:wx">
                  <p className="text-sm font-medium" data-oid="fu3wvv7">
                    {t("videoCompiler.gpu.recommendationsTitle")}
                  </p>
                  <ul className="ml-2 space-y-1" data-oid="s8f1tzm">
                    {recommendations.map((rec, index) => (
                      <li
                        key={index}
                        className="flex items-start gap-2 text-sm text-muted-foreground"
                        data-oid="_:1wur7"
                      >
                        <span className="mt-1.5 h-1 w-1 rounded-full bg-muted-foreground" data-oid="dqp7p6g" />
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            )}
          </CardContent>

          <CardFooter className="justify-between" data-oid="22uc0k3">
            <TooltipProvider data-oid="eyw5:pr">
              <Tooltip data-oid="0v5p-so">
                <TooltipTrigger asChild data-oid="zm3gus7">
                  <Button variant="ghost" size="sm" onClick={refreshCapabilities} data-oid="zgxghui">
                    {t("videoCompiler.gpu.refresh")}
                  </Button>
                </TooltipTrigger>
                <TooltipContent data-oid="0f6m104">
                  <p data-oid="ksb-4an">{t("videoCompiler.gpu.refreshTooltip")}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {compilerSettings && (
              <div className="text-xs text-muted-foreground" data-oid=".s4sgf8">
                {t("videoCompiler.gpu.maxTasks")}: {compilerSettings.max_concurrent_jobs}
              </div>
            )}
          </CardFooter>
        </>
      )}
    </Card>
  )
}

// Скелетон для загрузки
function GpuStatusSkeleton({ className }: { className?: string }) {
  return (
    <Card className={className} data-oid="hhrtzoi">
      <CardHeader data-oid="cs9:vrb">
        <div className="flex items-center justify-between" data-oid="fapt.i7">
          <div className="flex items-center gap-2" data-oid="b2xph2k">
            <Skeleton className="h-5 w-5 rounded" data-oid="ew31hrq" />
            <Skeleton className="h-6 w-32" data-oid="1_35xl5" />
          </div>
          <Skeleton className="h-6 w-12" data-oid="qiml:66" />
        </div>
        <Skeleton className="h-4 w-48" data-oid="a6ptd4q" />
      </CardHeader>
      <CardContent className="space-y-4" data-oid="u43cb-e">
        <div className="space-y-2" data-oid="1:3tt2q">
          <Skeleton className="h-4 w-24" data-oid="66vw11:" />
          <Skeleton className="h-3 w-full" data-oid="l9_.tf-" />
        </div>
        <div className="space-y-2" data-oid="lc:1cxl">
          <Skeleton className="h-4 w-24" data-oid="g2btvk:" />
          <Skeleton className="h-2 w-full" data-oid="uusk9ee" />
        </div>
      </CardContent>
    </Card>
  )
}

// Компактная версия для панели инструментов
export function GpuStatusBadge({ className }: { className?: string }) {
  const { t } = useTranslation()
  const { gpuCapabilities, isLoading } = useGpuCapabilities()

  if (isLoading) {
    return <Skeleton className={cn("h-5 w-20", className)} data-oid="zyme2rb" />
  }

  const isGpuAvailable = gpuCapabilities?.hardware_acceleration_supported || false
  const encoder = gpuCapabilities?.recommended_encoder

  return (
    <TooltipProvider data-oid="rpdv41l">
      <Tooltip data-oid="dgkuert">
        <TooltipTrigger asChild data-oid="facxd-i">
          <Badge
            variant={isGpuAvailable ? "default" : "secondary"}
            className={cn("gap-1", className)}
            data-oid="l8whzdy"
          >
            <Zap className="h-3 w-3" data-oid="1ocnz-z" />
            {encoder ? getGpuEncoderDisplayName(encoder, t) : t("videoCompiler.gpu.cpuOnly")}
          </Badge>
        </TooltipTrigger>
        <TooltipContent data-oid="p-_hx-o">
          <p data-oid="7hdpfiw">
            {isGpuAvailable
              ? t("videoCompiler.gpu.gpuTooltip", { encoder })
              : t("videoCompiler.gpu.gpuUnavailableTooltip")}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

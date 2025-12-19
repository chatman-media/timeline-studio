/**
 * MIDI Router View Component
 * Visual interface for creating and managing MIDI routes
 */

import { ArrowRight, Filter, GitBranch, Keyboard, Music, Plus, Settings, Shuffle, Zap } from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import { useTranslation } from "react-i18next"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { createLogger } from "@/lib/tauri-logger"
import { useMidiEngine } from "../../hooks/use-midi-engine"
import type { MidiDestination, MidiRoute } from "../../services/midi/midi-router"

const logger = createLogger("MidiRouterView")

interface RouteItemProps {
  route: MidiRoute
  onUpdate: (updates: Partial<MidiRoute>) => void
  onDelete: () => void
  devices: Array<{ id: string; name: string }>
}

function RouteItem({ route, onUpdate, onDelete, devices }: RouteItemProps) {
  const { t } = useTranslation()
  const getRouteIcon = () => {
    if (route.processors.some((p) => p.type === "split"))
      return <GitBranch className="w-4 h-4" data-testid="git-branch-icon" data-oid="tx:msgq" />
    if (route.processors.some((p) => p.type === "filter"))
      return <Filter className="w-4 h-4" data-testid="filter-icon" data-oid="tvt.0sq" />
    if (route.processors.some((p) => p.type === "transform"))
      return <Shuffle className="w-4 h-4" data-testid="shuffle-icon" data-oid="hgk60t2" />
    return <ArrowRight className="w-4 h-4" data-testid="arrow-right-icon" data-oid="x9.n7dv" />
  }

  const getSourceLabel = () => {
    const parts = []
    if (route.sourceDevice) {
      const device = devices.find((d) => d.id === route.sourceDevice)
      parts.push(device?.name || route.sourceDevice)
    } else {
      parts.push(t("fairlightAudio.midi.router.source.anyDevice"))
    }

    if (route.sourceChannel) {
      parts.push(`${t("fairlightAudio.midi.router.source.channel")} ${route.sourceChannel}`)
    }

    if (route.sourceType?.length) {
      parts.push(`[${route.sourceType.join(", ")}]`)
    }

    return parts.join(" → ")
  }

  const getDestinationLabel = (dest: MidiDestination) => {
    switch (dest.type) {
      case "device": {
        const device = devices.find((d) => d.id === dest.deviceId)
        return device?.name || dest.deviceId || "Unknown"
      }
      case "channel":
        return `${t("fairlightAudio.midi.router.destination.channel")} ${dest.targetChannel}`
      case "virtual":
        return `${t("fairlightAudio.midi.router.destination.virtual")} ${dest.virtualId}`
      case "function":
        return t("fairlightAudio.midi.router.destination.functionCallback")
      default:
        return t("fairlightAudio.midi.router.destination.unknown")
    }
  }

  return (
    <div className="border rounded-lg p-4 space-y-3" data-oid="gdsm_u6">
      <div className="flex items-center justify-between" data-oid="yelqjc6">
        <div className="flex items-center gap-3" data-oid="32kqm_7">
          <Switch
            checked={route.enabled}
            onCheckedChange={(enabled) => onUpdate({ enabled })}
            aria-label={t("fairlightAudio.midi.router.route.enableRoute")}
            data-oid="3l6lqck"
          />

          <div className="flex items-center gap-2" data-oid="bimpn-.">
            {getRouteIcon()}
            <span className="font-medium" data-oid=".adp60c">
              {route.name}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2" data-oid="gnw5yci">
          <Badge variant={route.enabled ? "default" : "secondary"} data-oid="32:.i1k">
            {route.enabled
              ? t("fairlightAudio.midi.router.route.active")
              : t("fairlightAudio.midi.router.route.inactive")}
          </Badge>
          <DropdownMenu data-oid="yp42pmv">
            <DropdownMenuTrigger asChild data-oid="m.und4k">
              <Button variant="ghost" size="icon" data-oid="7.pn_8a">
                <Settings className="w-4 h-4" data-testid="settings-icon" data-oid="2g46ay7" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent data-oid="mjo9xbp">
              <DropdownMenuItem data-oid="ai92w6.">{t("fairlightAudio.midi.router.route.editRoute")}</DropdownMenuItem>
              <DropdownMenuItem data-oid="..xn_h-">{t("fairlightAudio.midi.router.route.duplicate")}</DropdownMenuItem>
              <DropdownMenuItem onClick={onDelete} className="text-red-600" data-oid="8teolpb">
                {t("fairlightAudio.midi.router.route.delete")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="text-sm text-muted-foreground space-y-1" data-oid="lmdszkj">
        <div className="flex items-center gap-2" data-oid="m9.se.f">
          <span className="font-medium" data-oid="ddwhmtl">
            {t("fairlightAudio.midi.router.source.from")}
          </span>
          <span data-oid="s-0ryrh">{getSourceLabel()}</span>
        </div>
        <div className="flex items-center gap-2" data-oid="w-316s3">
          <span className="font-medium" data-oid="mw.vi8i">
            {t("fairlightAudio.midi.router.destination.to")}
          </span>
          <div className="flex flex-wrap gap-2" data-oid="-7q_4z2">
            {route.destinations.map((dest, idx) => (
              <Badge key={idx} variant="outline" data-oid="8_g38:n">
                {getDestinationLabel(dest)}
              </Badge>
            ))}
          </div>
        </div>
        {route.processors.length > 0 && (
          <div className="flex items-center gap-2" data-oid="s-tuy-s">
            <span className="font-medium" data-oid="ffn:mqa">
              {t("fairlightAudio.midi.router.processors")}
            </span>
            <div className="flex gap-1" data-oid="tur5t:a">
              {route.processors.map((proc, idx) => (
                <Badge key={idx} variant="secondary" className="text-xs" data-oid="7wzue58">
                  {proc.type}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export function MidiRouterView() {
  const { t } = useTranslation()
  const { engine, devices } = useMidiEngine()
  const [routes, setRoutes] = useState<MidiRoute[]>([])
  const [selectedPreset, setSelectedPreset] = useState<string>("")

  useEffect(() => {
    if (!engine?.router) return

    const updateRoutes = () => {
      if (engine.router) {
        setRoutes(engine.router.getRoutes())
      }
    }

    // Initial load
    updateRoutes()

    // Listen for changes
    engine.router.on("routeCreated", updateRoutes)
    engine.router.on("routeUpdated", updateRoutes)
    engine.router.on("routeDeleted", updateRoutes)
    engine.router.on("routesReordered", updateRoutes)

    return () => {
      engine.router?.off("routeCreated", updateRoutes)
      engine.router?.off("routeUpdated", updateRoutes)
      engine.router?.off("routeDeleted", updateRoutes)
      engine.router?.off("routesReordered", updateRoutes)
    }
  }, [engine])

  const handleCreatePreset = useCallback(() => {
    if (!engine?.router || !selectedPreset) return

    switch (selectedPreset) {
      case "keyboard-split":
        engine.router.createKeyboardSplitRoute(
          60, // Middle C
          devices.output[0]?.id || "",
          devices.output[0]?.id || "",
          1,
          2,
        )
        break

      case "channel-filter":
        engine.router.createChannelFilterRoute(1, devices.output[0]?.id || "")
        break

      case "cc-remap":
        engine.router.createCCRemapRoute(
          1, // Mod wheel
          11, // Expression
          devices.output[0]?.id,
        )
        break
      default:
        logger.warn("Unknown preset:", { preset: selectedPreset })
        break
    }

    setSelectedPreset("")
  }, [engine, devices, selectedPreset])

  const handleUpdateRoute = useCallback(
    (routeId: string, updates: Partial<MidiRoute>) => {
      engine?.router?.updateRoute(routeId, updates)
    },
    [engine],
  )

  const handleDeleteRoute = useCallback(
    (routeId: string) => {
      engine?.router?.deleteRoute(routeId)
    },
    [engine],
  )

  if (!engine) {
    return (
      <Card data-oid="lyy42ww">
        <CardHeader data-oid="_663azn">
          <CardTitle data-oid="0a8shch">{t("fairlightAudio.midi.router.title")}</CardTitle>
        </CardHeader>
        <CardContent data-oid="gxczop6">
          <p className="text-muted-foreground" data-oid="i8emq7w">
            {t("fairlightAudio.midi.router.engineNotInitialized")}
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="h-full" data-oid="vr_2gj2">
      <CardHeader className="flex flex-row items-center justify-between" data-oid="4wehqbd">
        <CardTitle className="flex items-center gap-2" data-oid="41q76q2">
          <Zap className="w-5 h-5" data-testid="zap-icon" data-oid="248nu-u" />
          {t("fairlightAudio.midi.router.title")}
        </CardTitle>
        <div className="flex items-center gap-2" data-oid="4ww4xcn">
          <Select value={selectedPreset} onValueChange={setSelectedPreset} data-oid="ff41kmn">
            <SelectTrigger className="w-48" data-oid="-3a9s5c">
              <SelectValue placeholder={t("fairlightAudio.midi.router.createFromPreset")} data-oid="f75yp-d" />
            </SelectTrigger>
            <SelectContent data-oid="0_xxx-_">
              <SelectItem value="keyboard-split" data-oid="aekvha:">
                <div className="flex items-center gap-2" data-oid="sq:q0u8">
                  <Keyboard className="w-4 h-4" data-testid="keyboard-icon" data-oid="iskgrc5" />
                  <span data-oid="uvcxijr">{t("fairlightAudio.midi.router.presets.keyboardSplit")}</span>
                </div>
              </SelectItem>
              <SelectItem value="channel-filter" data-oid="gkb5.i_">
                <div className="flex items-center gap-2" data-oid="cf2.uoo">
                  <Filter className="w-4 h-4" data-testid="filter-icon" data-oid="bh0vas_" />
                  <span data-oid="7un1jwa">{t("fairlightAudio.midi.router.presets.channelFilter")}</span>
                </div>
              </SelectItem>
              <SelectItem value="cc-remap" data-oid="g0nydyo">
                <div className="flex items-center gap-2" data-oid="p6:t:j:">
                  <Shuffle className="w-4 h-4" data-testid="shuffle-icon" data-oid="ltj46k." />
                  <span data-oid="3rii9je">{t("fairlightAudio.midi.router.presets.ccRemap")}</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleCreatePreset} disabled={!selectedPreset} size="sm" data-oid="qpdlt1t">
            <Plus className="w-4 h-4 mr-1" data-testid="plus-icon" data-oid="pjavcp." />
            {t("fairlightAudio.midi.router.create")}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0" data-oid="f.vbaxx">
        <Tabs defaultValue="routes" className="h-full" data-oid="s7x09nn">
          <TabsList className="w-full justify-start rounded-none border-b" data-oid="_q-6oj1">
            <TabsTrigger value="routes" data-oid="qga30qb">
              {t("fairlightAudio.midi.router.tabs.routes")}
            </TabsTrigger>
            <TabsTrigger value="matrix" data-oid="gnc5q:8">
              {t("fairlightAudio.midi.router.tabs.matrixView")}
            </TabsTrigger>
            <TabsTrigger value="monitor" data-oid="r6zn1_1">
              {t("fairlightAudio.midi.router.tabs.monitor")}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="routes" className="p-4" data-oid="81qty.n">
            <ScrollArea className="h-[400px]" data-oid="vvps8_n">
              {routes.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground" data-oid="we_8s-q">
                  <Music className="w-12 h-12 mx-auto mb-3 opacity-30" data-testid="music-icon" data-oid="j9vz4cd" />
                  <p data-oid="l5uq3c1">{t("fairlightAudio.midi.router.noRoutes")}</p>
                  <p className="text-sm mt-1" data-oid="vi0esep">
                    {t("fairlightAudio.midi.router.createFirstRoute")}
                  </p>
                </div>
              ) : (
                <div className="space-y-3" data-oid="3:3kvev">
                  {routes.map((route) => (
                    <RouteItem
                      key={route.id}
                      route={route}
                      onUpdate={(updates) => handleUpdateRoute(route.id, updates)}
                      onDelete={() => handleDeleteRoute(route.id)}
                      devices={[...devices.input, ...devices.output]}
                      data-oid="fwfgg-4"
                    />
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="matrix" className="p-4" data-oid="zvwz2ch">
            <div className="text-center py-8 text-muted-foreground" data-oid="timj.dk">
              <GitBranch
                className="w-12 h-12 mx-auto mb-3 opacity-30"
                data-testid="git-branch-icon"
                data-oid="eblove-"
              />

              <p data-oid="f-v368y">{t("fairlightAudio.midi.router.matrixViewComingSoon")}</p>
              <p className="text-sm mt-1" data-oid="-haaxna">
                {t("fairlightAudio.midi.router.matrixDescription")}
              </p>
            </div>
          </TabsContent>

          <TabsContent value="monitor" className="p-4" data-oid="2-oh.jt">
            <div className="text-center py-8 text-muted-foreground" data-oid="5boujev">
              <Zap className="w-12 h-12 mx-auto mb-3 opacity-30" data-testid="zap-icon" data-oid="m9_u0.8" />
              <p data-oid="yvsa2s2">{t("fairlightAudio.midi.router.monitorComingSoon")}</p>
              <p className="text-sm mt-1" data-oid="c5ibzv.">
                {t("fairlightAudio.midi.router.monitorDescription")}
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

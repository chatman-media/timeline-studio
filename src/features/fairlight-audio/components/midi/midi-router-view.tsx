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

const logger = createLogger({ module: "MidiRouterView" })

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
      return <GitBranch className="w-4 h-4" data-testid="git-branch-icon" />
    if (route.processors.some((p) => p.type === "filter"))
      return <Filter className="w-4 h-4" data-testid="filter-icon" />
    if (route.processors.some((p) => p.type === "transform"))
      return <Shuffle className="w-4 h-4" data-testid="shuffle-icon" />
    return <ArrowRight className="w-4 h-4" data-testid="arrow-right-icon" />
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
    <div className="border rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Switch
            checked={route.enabled}
            onCheckedChange={(enabled) => onUpdate({ enabled })}
            aria-label={t("fairlightAudio.midi.router.route.enableRoute")}
          />
          <div className="flex items-center gap-2">
            {getRouteIcon()}
            <span className="font-medium">{route.name}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={route.enabled ? "default" : "secondary"}>
            {route.enabled
              ? t("fairlightAudio.midi.router.route.active")
              : t("fairlightAudio.midi.router.route.inactive")}
          </Badge>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <Settings className="w-4 h-4" data-testid="settings-icon" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem>{t("fairlightAudio.midi.router.route.editRoute")}</DropdownMenuItem>
              <DropdownMenuItem>{t("fairlightAudio.midi.router.route.duplicate")}</DropdownMenuItem>
              <DropdownMenuItem onClick={onDelete} className="text-red-600">
                {t("fairlightAudio.midi.router.route.delete")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="text-sm text-muted-foreground space-y-1">
        <div className="flex items-center gap-2">
          <span className="font-medium">{t("fairlightAudio.midi.router.source.from")}</span>
          <span>{getSourceLabel()}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-medium">{t("fairlightAudio.midi.router.destination.to")}</span>
          <div className="flex flex-wrap gap-2">
            {route.destinations.map((dest, idx) => (
              <Badge key={idx} variant="outline">
                {getDestinationLabel(dest)}
              </Badge>
            ))}
          </div>
        </div>
        {route.processors.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="font-medium">{t("fairlightAudio.midi.router.processors")}</span>
            <div className="flex gap-1">
              {route.processors.map((proc, idx) => (
                <Badge key={idx} variant="secondary" className="text-xs">
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
        logger.warn("Unknown preset:", selectedPreset)
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
      <Card>
        <CardHeader>
          <CardTitle>{t("fairlightAudio.midi.router.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">{t("fairlightAudio.midi.router.engineNotInitialized")}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Zap className="w-5 h-5" data-testid="zap-icon" />
          {t("fairlightAudio.midi.router.title")}
        </CardTitle>
        <div className="flex items-center gap-2">
          <Select value={selectedPreset} onValueChange={setSelectedPreset}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder={t("fairlightAudio.midi.router.createFromPreset")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="keyboard-split">
                <div className="flex items-center gap-2">
                  <Keyboard className="w-4 h-4" data-testid="keyboard-icon" />
                  <span>{t("fairlightAudio.midi.router.presets.keyboardSplit")}</span>
                </div>
              </SelectItem>
              <SelectItem value="channel-filter">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4" data-testid="filter-icon" />
                  <span>{t("fairlightAudio.midi.router.presets.channelFilter")}</span>
                </div>
              </SelectItem>
              <SelectItem value="cc-remap">
                <div className="flex items-center gap-2">
                  <Shuffle className="w-4 h-4" data-testid="shuffle-icon" />
                  <span>{t("fairlightAudio.midi.router.presets.ccRemap")}</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleCreatePreset} disabled={!selectedPreset} size="sm">
            <Plus className="w-4 h-4 mr-1" data-testid="plus-icon" />
            {t("fairlightAudio.midi.router.create")}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Tabs defaultValue="routes" className="h-full">
          <TabsList className="w-full justify-start rounded-none border-b">
            <TabsTrigger value="routes">{t("fairlightAudio.midi.router.tabs.routes")}</TabsTrigger>
            <TabsTrigger value="matrix">{t("fairlightAudio.midi.router.tabs.matrixView")}</TabsTrigger>
            <TabsTrigger value="monitor">{t("fairlightAudio.midi.router.tabs.monitor")}</TabsTrigger>
          </TabsList>

          <TabsContent value="routes" className="p-4">
            <ScrollArea className="h-[400px]">
              {routes.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Music className="w-12 h-12 mx-auto mb-3 opacity-30" data-testid="music-icon" />
                  <p>{t("fairlightAudio.midi.router.noRoutes")}</p>
                  <p className="text-sm mt-1">{t("fairlightAudio.midi.router.createFirstRoute")}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {routes.map((route) => (
                    <RouteItem
                      key={route.id}
                      route={route}
                      onUpdate={(updates) => handleUpdateRoute(route.id, updates)}
                      onDelete={() => handleDeleteRoute(route.id)}
                      devices={[...devices.input, ...devices.output]}
                    />
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="matrix" className="p-4">
            <div className="text-center py-8 text-muted-foreground">
              <GitBranch className="w-12 h-12 mx-auto mb-3 opacity-30" data-testid="git-branch-icon" />
              <p>{t("fairlightAudio.midi.router.matrixViewComingSoon")}</p>
              <p className="text-sm mt-1">{t("fairlightAudio.midi.router.matrixDescription")}</p>
            </div>
          </TabsContent>

          <TabsContent value="monitor" className="p-4">
            <div className="text-center py-8 text-muted-foreground">
              <Zap className="w-12 h-12 mx-auto mb-3 opacity-30" data-testid="zap-icon" />
              <p>{t("fairlightAudio.midi.router.monitorComingSoon")}</p>
              <p className="text-sm mt-1">{t("fairlightAudio.midi.router.monitorDescription")}</p>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

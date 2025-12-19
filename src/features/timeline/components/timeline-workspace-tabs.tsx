import { BarChart3, Layers, Sliders } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export type WorkspaceView = "timeline" | "audio-mixer" | "analysis"

interface TimelineWorkspaceTabsProps {
  activeView: WorkspaceView
  onViewChange: (view: WorkspaceView) => void
}

export function TimelineWorkspaceTabs({ activeView, onViewChange }: TimelineWorkspaceTabsProps) {
  const { t } = useTranslation()

  return (
    <div className="flex h-10 items-center border-b bg-background px-1" data-oid="oxrtbps">
      <div className="flex gap-1" data-oid="6qkzye4">
        {/* Analysis - первая вкладка */}
        <Button
          variant={activeView === "analysis" ? "secondary" : "ghost"}
          size="sm"
          onClick={() => onViewChange("analysis")}
          className={cn("h-7 cursor-pointer gap-3", activeView === "analysis" && "bg-secondary")}
          data-oid="gcq:4tn"
        >
          <BarChart3 className="h-4 w-4" data-oid="vskk6gy" />
          <span data-oid="mas.rl.">{t("timeline.workspace.analysis")}</span>
        </Button>

        {/* Timeline - вторая вкладка */}
        <Button
          variant={activeView === "timeline" ? "secondary" : "ghost"}
          size="sm"
          onClick={() => onViewChange("timeline")}
          className={cn("h-7 cursor-pointer gap-3", activeView === "timeline" && "bg-secondary")}
          data-oid="9.17g03"
        >
          <Layers className="h-4 w-4" data-oid="eb-99a2" />
          <span data-oid="yz3dti_">{t("timeline.workspace.timeline")}</span>
        </Button>

        {/* Audio Mixer - третья вкладка */}
        <Button
          variant={activeView === "audio-mixer" ? "secondary" : "ghost"}
          size="sm"
          onClick={() => onViewChange("audio-mixer")}
          className={cn("h-7 cursor-pointer gap-3", activeView === "audio-mixer" && "bg-secondary")}
          data-oid="c842r.j"
        >
          <Sliders className="h-4 w-4" data-oid=".a1ej1_" />
          <span data-oid="pnl5d71">{t("timeline.workspace.audioMixer")}</span>
        </Button>
      </div>
    </div>
  )
}

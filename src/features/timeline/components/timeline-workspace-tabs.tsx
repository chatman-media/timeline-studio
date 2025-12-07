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
    <div className="flex h-11 items-center border-b bg-background px-2">
      <div className="flex gap-1">
        <Button
          variant={activeView === "timeline" ? "secondary" : "ghost"}
          size="sm"
          onClick={() => onViewChange("timeline")}
          className={cn("h-8 gap-2", activeView === "timeline" && "bg-secondary")}
        >
          <Layers className="h-4 w-4" />
          <span>{t("timeline.workspace.timeline")}</span>
        </Button>

        <Button
          variant={activeView === "audio-mixer" ? "secondary" : "ghost"}
          size="sm"
          onClick={() => onViewChange("audio-mixer")}
          className={cn("h-8 gap-2", activeView === "audio-mixer" && "bg-secondary")}
        >
          <Sliders className="h-4 w-4" />
          <span>{t("timeline.workspace.audioMixer")}</span>
        </Button>

        <Button
          variant={activeView === "analysis" ? "secondary" : "ghost"}
          size="sm"
          onClick={() => onViewChange("analysis")}
          className={cn("h-8 gap-2", activeView === "analysis" && "bg-secondary")}
        >
          <BarChart3 className="h-4 w-4" />
          <span>{t("timeline.workspace.analysis")}</span>
        </Button>
      </div>
    </div>
  )
}

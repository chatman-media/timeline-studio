import { useMemo } from "react"

import { useTranslation } from "react-i18next"
import type { AutomationEngine, AutomationMode } from "../../services/automation-engine"
import { AutomationLaneComponent } from "./automation-lane"
import { AutomationPanel } from "./automation-panel"

interface AutomationViewProps {
  automationEngine: AutomationEngine
  currentTime: number
  pixelsPerSecond?: number
  laneHeight?: number
  totalWidth?: number
}

export function AutomationView({
  automationEngine,
  currentTime,
  pixelsPerSecond = 50,
  laneHeight = 60,
  totalWidth = 2000,
}: AutomationViewProps) {
  const { t } = useTranslation()
  const state = automationEngine.getState()
  const visibleLanes = useMemo(() => Array.from(state.lanes.values()).filter((lane) => lane.isVisible), [state.lanes])

  const handleModeChange = (mode: AutomationMode) => {
    automationEngine.setMode(mode)
  }

  const handleStartRecording = () => {
    automationEngine.startRecording()
  }

  const handleStopRecording = () => {
    automationEngine.stopRecording()
  }

  const handleAddLane = (channelId: string, parameterId: string) => {
    const lane = automationEngine.createLane(channelId, parameterId)
    automationEngine.toggleLaneVisibility(lane.id)
  }

  const handleClearLane = (laneId: string) => {
    const lane = state.lanes.get(laneId)
    if (lane) {
      // Оставляем только первую точку
      const firstPoint = lane.points[0]
      if (firstPoint) {
        lane.points = [firstPoint]
      }
    }
  }

  const handlePointsChange = (laneId: string, points: any[]) => {
    const lane = state.lanes.get(laneId)
    if (lane) {
      lane.points = points
    }
  }

  const handleVisibilityToggle = (laneId: string) => {
    automationEngine.toggleLaneVisibility(laneId)
  }

  return (
    <div className="flex flex-col h-full bg-zinc-950" data-oid="2a9ni2z">
      {/* Automation Panel */}
      <AutomationPanel
        mode={state.mode}
        isRecording={state.isRecording}
        lanes={Array.from(state.lanes.values())}
        onModeChange={handleModeChange}
        onStartRecording={handleStartRecording}
        onStopRecording={handleStopRecording}
        onAddLane={handleAddLane}
        onClearLane={handleClearLane}
        data-oid="7b6n:db"
      />

      {/* Time Ruler */}
      <div className="h-8 bg-zinc-900 border-b border-zinc-800 relative overflow-hidden" data-oid="n637xys">
        <div className="flex items-center h-full" data-oid="ihrqcz6">
          {/* Track header space */}
          <div className="w-32 border-r border-zinc-800" data-oid="lw4s86u" />

          {/* Time markers */}
          <div className="flex-1 relative" data-oid="6vuiijo">
            {Array.from({
              length: Math.ceil(totalWidth / pixelsPerSecond),
            }).map((_, i) => (
              <div
                key={i}
                className="absolute top-0 h-full border-l border-zinc-700"
                style={{ left: `${i * pixelsPerSecond}px` }}
                data-oid="dja5x2m"
              >
                <span className="absolute top-1 left-1 text-xs text-zinc-400" data-oid="zumepg2">
                  {i}s
                </span>
              </div>
            ))}

            {/* Current time indicator */}
            <div
              className="absolute top-0 h-full w-0.5 bg-red-500 z-10"
              style={{ left: `${currentTime * pixelsPerSecond}px` }}
              data-oid="etj1rry"
            />
          </div>
        </div>
      </div>

      {/* Automation Lanes */}
      <div className="flex-1 overflow-y-auto" data-oid="b64:80l">
        {visibleLanes.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-zinc-500" data-oid="ffl2mab">
            <div className="text-center" data-oid="wrr2o7g">
              <p className="mb-2" data-oid="ezhy6de">
                {t("fairlightAudio.automationView.noLanesVisible")}
              </p>
              <p className="text-sm" data-oid="0ost:h7">
                {t("fairlightAudio.automationView.addLanePrompt")}
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-0" data-oid="udfa.rs">
            {visibleLanes.map((lane) => (
              <AutomationLaneComponent
                key={lane.id}
                lane={lane}
                width={totalWidth}
                height={laneHeight}
                pixelsPerSecond={pixelsPerSecond}
                currentTime={currentTime}
                onPointsChange={(points) => handlePointsChange(lane.id, points)}
                onVisibilityToggle={() => handleVisibilityToggle(lane.id)}
                data-oid="iee5f0u"
              />
            ))}
          </div>
        )}
      </div>

      {/* Status Info */}
      <div
        className="h-8 bg-zinc-900 border-t border-zinc-800 flex items-center px-3 text-xs text-zinc-500"
        data-oid="73xla5z"
      >
        <span data-oid="ct:m5vv">
          {t("fairlightAudio.automationView.status.automation")} {state.mode} •{" "}
          {t("fairlightAudio.automationView.status.lanes")} {state.lanes.size}{" "}
          {t("fairlightAudio.automationView.status.total")}, {visibleLanes.length}{" "}
          {t("fairlightAudio.automationView.status.visible")} • {t("fairlightAudio.automationView.status.time")}{" "}
          {currentTime.toFixed(2)}s{state.isRecording && ` • ${t("fairlightAudio.automationView.status.recording")}`}
        </span>
      </div>
    </div>
  )
}

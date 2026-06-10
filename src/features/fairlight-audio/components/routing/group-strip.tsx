import { Settings, Users, X } from "lucide-react"

import { Button } from "@timeline-studio/ui/components/button"
import { cn } from "@/lib/utils"

import type { ChannelGroup } from "../../services/bus-router"
import { Fader } from "../mixer/fader"

interface GroupStripProps {
  group: ChannelGroup
  value: number // 0-100
  onGainChange: (value: number) => void
  onMute: () => void
  onSolo: () => void
  onDelete: () => void
  onEditChannels: () => void
  className?: string
}

export function GroupStrip({
  group,
  value,
  onGainChange,
  onMute,
  onSolo,
  onDelete,
  onEditChannels,
  className,
}: GroupStripProps) {
  return (
    <div
      className={cn(
        "w-16 bg-zinc-900 border border-zinc-800 rounded-lg p-2 flex flex-col items-center gap-2",
        className,
      )}
      style={{
        boxShadow: `inset 0 0 0 2px ${group.color}20`,
        borderLeftColor: group.color,
        borderLeftWidth: "3px",
      }}
      data-oid="qm4m8ul"
    >
      {/* Group Header */}
      <div className="w-full space-y-1" data-oid="edh-w52">
        {/* Group Name */}
        <div className="text-xs font-semibold text-zinc-200 text-center truncate" data-oid="aomxt5o">
          {group.name}
        </div>

        {/* Channel Count */}
        <div className="flex items-center justify-center gap-1" data-oid="1eqcj:1">
          <Users className="w-3 h-3 text-zinc-400" data-oid="m4.vd74" />
          <span className="text-xs text-zinc-400" data-oid="ahgaxjb">
            {group.channelIds.length}
          </span>
        </div>
      </div>

      {/* Group Controls */}
      <div className="w-full space-y-1" data-oid="ziufxof">
        {/* Edit Channels Button */}
        <Button
          size="sm"
          variant="ghost"
          onClick={onEditChannels}
          className="h-6 w-full p-0 text-zinc-400 hover:text-zinc-200"
          title="Edit channels in group"
          data-oid="40:3or2"
        >
          <Settings className="w-3 h-3" data-oid="h34fwws" />
        </Button>

        {/* Delete Group Button */}
        <Button
          size="sm"
          variant="ghost"
          onClick={onDelete}
          className="h-6 w-full p-0 text-red-400 hover:text-red-300"
          title="Delete group"
          data-oid="bt8e9iz"
        >
          <X className="w-3 h-3" data-oid="1:w9yn1" />
        </Button>
      </div>

      {/* Group Fader */}
      <div className="flex-1 flex flex-col items-center" data-oid="m.m5zps">
        <Fader
          value={value}
          onChange={onGainChange}
          muted={group.isMuted}
          solo={group.isSolo}
          onMute={onMute}
          onSolo={onSolo}
          dbScale={true}
          channelId={group.id}
          parameterId="groupGain"
          className="h-full"
          data-oid="dnzedrx"
        />
      </div>

      {/* Group Status */}
      <div className="w-full text-center" data-oid=":dy2qge">
        <div className="text-xs text-zinc-500" data-oid="4vcv.fu">
          {group.isMuted ? "MUTED" : group.isSolo ? "SOLO" : "ACTIVE"}
        </div>
      </div>

      {/* Bus Assignment */}
      <div className="w-full text-center" data-oid=":zdg3-3">
        <div className="text-xs text-zinc-400 truncate" title={group.busId} data-oid="h33z-sf">
          → {group.busId.replace("_bus", "")}
        </div>
      </div>
    </div>
  )
}

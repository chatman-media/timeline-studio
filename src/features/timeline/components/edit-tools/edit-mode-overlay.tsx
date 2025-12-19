import { useEditModeContext } from "@/features/timeline/hooks/editing/use-edit-mode"
import { cn } from "@/lib/utils"
import { EDIT_MODE_CONFIGS, EDIT_MODES } from "../../types/edit-modes"

interface EditModeOverlayProps {
  className?: string
}

export function EditModeOverlay({ className }: EditModeOverlayProps) {
  const { editMode } = useEditModeContext()
  const config = EDIT_MODE_CONFIGS[editMode]

  // Don't show overlay for select mode
  if (editMode === EDIT_MODES.SELECT) return null

  return (
    <div
      className={cn(
        "fixed top-20 left-1/2 -translate-x-1/2 z-50",
        "px-4 py-2 rounded-lg",
        "bg-background/90 backdrop-blur-sm border",
        "shadow-lg animate-in fade-in slide-in-from-top-2",
        "pointer-events-none select-none",
        className,
      )}
      data-oid="s_0b_c0"
    >
      <div className="flex items-center gap-3" data-oid="fxk.p4a">
        <div
          className={cn("w-10 h-10 rounded-md flex items-center justify-center", "bg-primary/10 text-primary")}
          data-oid="oo:r0av"
        >
          {/* Icon would go here - using text for now */}
          <span className="text-sm font-bold" data-oid="cbip5._">
            {config.hotkey}
          </span>
        </div>

        <div data-oid="r5o6:h4">
          <div className="font-semibold" data-oid="iww0:t2">
            {config.name} Mode
          </div>
          <div className="text-xs text-muted-foreground" data-oid=":6ld7fg">
            {config.description}
          </div>
        </div>

        <div className="ml-4 text-xs text-muted-foreground" data-oid="gq1ldjq">
          Press{" "}
          <kbd className="px-1 py-0.5 bg-muted rounded" data-oid="k.2g9oe">
            ESC
          </kbd>{" "}
          to exit
        </div>
      </div>
    </div>
  )
}

// Cursor overlay for custom cursors
interface EditCursorOverlayProps {
  mousePosition: { x: number; y: number } | null
  isActive: boolean
}

export function EditCursorOverlay({ mousePosition, isActive }: EditCursorOverlayProps) {
  const { editMode } = useEditModeContext()

  if (!isActive || !mousePosition || editMode === EDIT_MODES.SELECT) {
    return null
  }

  const getCursorIcon = () => {
    switch (editMode) {
      case EDIT_MODES.TRIM:
        return <TrimCursor data-oid="-_10u0w" />
      case EDIT_MODES.RIPPLE:
        return <RippleCursor data-oid="l.l-rhd" />
      case EDIT_MODES.ROLL:
        return <RollCursor data-oid="fc_g-3f" />
      case EDIT_MODES.SLIP:
        return <SlipCursor data-oid="c9.jquo" />
      case EDIT_MODES.SLIDE:
        return <SlideCursor data-oid="5mm5prg" />
      case EDIT_MODES.SPLIT:
        return <SplitCursor data-oid="6r_j0gf" />
      case EDIT_MODES.RATE:
        return <RateCursor data-oid="irivvi-" />
      default:
        return null
    }
  }

  const cursor = getCursorIcon()
  if (!cursor) return null

  return (
    <div
      className="fixed pointer-events-none z-[100]"
      style={{
        left: `${mousePosition.x}px`,
        top: `${mousePosition.y}px`,
        transform: "translate(-50%, -50%)",
      }}
      data-oid="hlud3y-"
    >
      {cursor}
    </div>
  )
}

// Custom cursor components
function TrimCursor() {
  return (
    <div className="relative" data-oid="h_8z7a-">
      <svg width="32" height="32" viewBox="0 0 32 32" className="text-primary" data-oid="vo3qg.w">
        <path
          d="M8 8 L8 24 M24 8 L24 24 M8 16 L24 16"
          stroke="currentColor"
          strokeWidth="2"
          fill="none"
          data-oid="c1bvb_7"
        />

        <path
          d="M4 12 L8 16 L4 20 M28 12 L24 16 L28 20"
          stroke="currentColor"
          strokeWidth="2"
          fill="none"
          data-oid="pn:b0zx"
        />
      </svg>
    </div>
  )
}

function RippleCursor() {
  return (
    <div className="relative" data-oid="vg6ktxa">
      <svg width="32" height="32" viewBox="0 0 32 32" className="text-orange-500" data-oid="j7-411r">
        <path
          d="M8 16 L24 16 M20 12 L24 16 L20 20"
          stroke="currentColor"
          strokeWidth="2"
          fill="none"
          data-oid="_ocbowp"
        />

        <circle cx="8" cy="16" r="2" fill="currentColor" data-oid="lfjgbk2" />
        <path
          d="M12 12 L12 20 M16 12 L16 20"
          stroke="currentColor"
          strokeWidth="1"
          strokeDasharray="2 2"
          data-oid="esobd7h"
        />
      </svg>
    </div>
  )
}

function RollCursor() {
  return (
    <div className="relative" data-oid=".xo._o.">
      <svg width="32" height="32" viewBox="0 0 32 32" className="text-purple-500" data-oid="8ibtv9c">
        <circle cx="16" cy="16" r="6" fill="currentColor" opacity="0.3" data-oid="z7_:ti9" />
        <path
          d="M10 16 L22 16 M10 12 L10 20 M22 12 L22 20"
          stroke="currentColor"
          strokeWidth="2"
          fill="none"
          data-oid="54ucjyz"
        />
      </svg>
    </div>
  )
}

function SlipCursor() {
  return (
    <div className="relative" data-oid="org0k_u">
      <svg width="32" height="32" viewBox="0 0 32 32" className="text-blue-500" data-oid="px0uvz9">
        <rect x="8" y="12" width="16" height="8" stroke="currentColor" strokeWidth="2" fill="none" data-oid="o8_.:v5" />
        <path
          d="M4 16 L8 16 M24 16 L28 16"
          stroke="currentColor"
          strokeWidth="2"
          strokeDasharray="2 2"
          data-oid="gbzea6e"
        />

        <path d="M12 16 L20 16 M12 13 L12 19 M20 13 L20 19" stroke="currentColor" strokeWidth="1" data-oid="90cg0dv" />
      </svg>
    </div>
  )
}

function SlideCursor() {
  return (
    <div className="relative" data-oid="9rgilo9">
      <svg width="32" height="32" viewBox="0 0 32 32" className="text-green-500" data-oid="7j7q8u2">
        <rect
          x="10"
          y="12"
          width="12"
          height="8"
          stroke="currentColor"
          strokeWidth="2"
          fill="currentColor"
          opacity="0.3"
          data-oid="fiiwx38"
        />

        <path
          d="M4 16 L8 16 M24 16 L28 16 M6 12 L6 20 M26 12 L26 20"
          stroke="currentColor"
          strokeWidth="2"
          data-oid="hhhfv.h"
        />
      </svg>
    </div>
  )
}

function SplitCursor() {
  return (
    <div className="relative" data-oid="p:0gk9d">
      <svg width="32" height="32" viewBox="0 0 32 32" className="text-red-500" data-oid="j_8n522">
        <path d="M16 4 L16 28" stroke="currentColor" strokeWidth="2" data-oid="6-acz.1" />
        <path
          d="M10 10 L4 16 L10 22 M22 10 L28 16 L22 22"
          stroke="currentColor"
          strokeWidth="2"
          fill="none"
          data-oid="ydg38db"
        />
      </svg>
    </div>
  )
}

function RateCursor() {
  return (
    <div className="relative" data-oid="qp9k5jf">
      <svg width="32" height="32" viewBox="0 0 32 32" className="text-yellow-500" data-oid=".-r-8s7">
        <path d="M8 16 L24 16 M8 12 L8 20 M24 12 L24 20" stroke="currentColor" strokeWidth="2" data-oid="eze96v_" />
        <path
          d="M12 8 L12 24 M16 8 L16 24 M20 8 L20 24"
          stroke="currentColor"
          strokeWidth="1"
          opacity="0.5"
          data-oid="3h2927m"
        />

        <text x="16" y="26" textAnchor="middle" fontSize="8" fill="currentColor" fontWeight="bold" data-oid="tv5t1fz">
          2x
        </text>
      </svg>
    </div>
  )
}

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
    >
      <div className="flex items-center gap-3">
        <div className={cn("w-10 h-10 rounded-md flex items-center justify-center", "bg-primary/10 text-primary")}>
          {/* Icon would go here - using text for now */}
          <span className="text-sm font-bold">{config.hotkey}</span>
        </div>

        <div>
          <div className="font-semibold">{config.name} Mode</div>
          <div className="text-xs text-muted-foreground">{config.description}</div>
        </div>

        <div className="ml-4 text-xs text-muted-foreground">
          Press <kbd className="px-1 py-0.5 bg-muted rounded">ESC</kbd> to exit
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
        return <TrimCursor />
      case EDIT_MODES.RIPPLE:
        return <RippleCursor />
      case EDIT_MODES.ROLL:
        return <RollCursor />
      case EDIT_MODES.SLIP:
        return <SlipCursor />
      case EDIT_MODES.SLIDE:
        return <SlideCursor />
      case EDIT_MODES.SPLIT:
        return <SplitCursor />
      case EDIT_MODES.RATE:
        return <RateCursor />
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
    >
      {cursor}
    </div>
  )
}

// Custom cursor components
function TrimCursor() {
  return (
    <div className="relative">
      <svg width="32" height="32" viewBox="0 0 32 32" className="text-primary">
        <path d="M8 8 L8 24 M24 8 L24 24 M8 16 L24 16" stroke="currentColor" strokeWidth="2" fill="none" />
        <path d="M4 12 L8 16 L4 20 M28 12 L24 16 L28 20" stroke="currentColor" strokeWidth="2" fill="none" />
      </svg>
    </div>
  )
}

function RippleCursor() {
  return (
    <div className="relative">
      <svg width="32" height="32" viewBox="0 0 32 32" className="text-orange-500">
        <path d="M8 16 L24 16 M20 12 L24 16 L20 20" stroke="currentColor" strokeWidth="2" fill="none" />
        <circle cx="8" cy="16" r="2" fill="currentColor" />
        <path d="M12 12 L12 20 M16 12 L16 20" stroke="currentColor" strokeWidth="1" strokeDasharray="2 2" />
      </svg>
    </div>
  )
}

function RollCursor() {
  return (
    <div className="relative">
      <svg width="32" height="32" viewBox="0 0 32 32" className="text-purple-500">
        <circle cx="16" cy="16" r="6" fill="currentColor" opacity="0.3" />
        <path d="M10 16 L22 16 M10 12 L10 20 M22 12 L22 20" stroke="currentColor" strokeWidth="2" fill="none" />
      </svg>
    </div>
  )
}

function SlipCursor() {
  return (
    <div className="relative">
      <svg width="32" height="32" viewBox="0 0 32 32" className="text-blue-500">
        <rect x="8" y="12" width="16" height="8" stroke="currentColor" strokeWidth="2" fill="none" />
        <path d="M4 16 L8 16 M24 16 L28 16" stroke="currentColor" strokeWidth="2" strokeDasharray="2 2" />
        <path d="M12 16 L20 16 M12 13 L12 19 M20 13 L20 19" stroke="currentColor" strokeWidth="1" />
      </svg>
    </div>
  )
}

function SlideCursor() {
  return (
    <div className="relative">
      <svg width="32" height="32" viewBox="0 0 32 32" className="text-green-500">
        <rect
          x="10"
          y="12"
          width="12"
          height="8"
          stroke="currentColor"
          strokeWidth="2"
          fill="currentColor"
          opacity="0.3"
        />
        <path d="M4 16 L8 16 M24 16 L28 16 M6 12 L6 20 M26 12 L26 20" stroke="currentColor" strokeWidth="2" />
      </svg>
    </div>
  )
}

function SplitCursor() {
  return (
    <div className="relative">
      <svg width="32" height="32" viewBox="0 0 32 32" className="text-red-500">
        <path d="M16 4 L16 28" stroke="currentColor" strokeWidth="2" />
        <path d="M10 10 L4 16 L10 22 M22 10 L28 16 L22 22" stroke="currentColor" strokeWidth="2" fill="none" />
      </svg>
    </div>
  )
}

function RateCursor() {
  return (
    <div className="relative">
      <svg width="32" height="32" viewBox="0 0 32 32" className="text-yellow-500">
        <path d="M8 16 L24 16 M8 12 L8 20 M24 12 L24 20" stroke="currentColor" strokeWidth="2" />
        <path d="M12 8 L12 24 M16 8 L16 24 M20 8 L20 24" stroke="currentColor" strokeWidth="1" opacity="0.5" />
        <text x="16" y="26" textAnchor="middle" fontSize="8" fill="currentColor" fontWeight="bold">
          2x
        </text>
      </svg>
    </div>
  )
}

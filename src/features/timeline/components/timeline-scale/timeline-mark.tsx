import { formatTime } from "@/lib/date"

interface TimelineMarkProps {
  timestamp: number
  position: number
  markType: "large" | "medium" | "small" | "smallest"
  showValue?: boolean
  isFirstMark?: boolean
}

export function TimelineMark({ timestamp, position, markType, showValue }: TimelineMarkProps) {
  const getMarkHeight = () => {
    switch (markType) {
      case "large":
        return "h-6 bg-[#4a4a4a]/50 dark:bg-[#aeaeae]/50 w-[1px]"
      case "medium":
        return "h-3 bg-[#4a4a4a]/50 dark:bg-[#aeaeae]/50 w-[1px]"
      case "small":
        return "h-2 bg-[#4a4a4a]/50 dark:bg-[#aeaeae]/50 opacity-70 w-[1px]"
      case "smallest":
        return "h-1.5 bg-[#4a4a4a]/50 dark:bg-[#aeaeae]/50 opacity-50 w-[1px]"
      default:
        return "h-2 bg-[#4a4a4a]/50 dark:bg-[#aeaeae]/50 opacity-70 w-[1px]"
    }
  }

  return (
    <div className="absolute flex h-full flex-col items-center" style={{ left: `${position}%` }} data-oid="iu0df_n">
      <div className={getMarkHeight()} data-oid="v6wvt0a" />
      {showValue && (
        <span
          className="absolute top-2.5 translate-x-1/2 transform px-1 text-[11px] whitespace-nowrap opacity-60"
          data-oid="4p1li6z"
        >
          {formatTime(timestamp)}
        </span>
      )}
    </div>
  )
}

/**
 * Визуальные индикаторы Split Edit
 */

import { AnimatePresence, motion } from "motion/react"

import { cn } from "@/lib/utils"

import { useSplitEdit } from "../hooks/editing/use-split-edit"

interface SplitEditIndicatorsProps {
  className?: string
  timelineWidth: number
  timelineHeight: number
  pixelsPerSecond: number
  currentTime: number
}

export function SplitEditIndicators({ className, timelineHeight, pixelsPerSecond }: SplitEditIndicatorsProps) {
  const { config, toolSettings, visualSettings, activeSplitEdits, isEnabled } = useSplitEdit()

  if (!isEnabled) return null

  const timeToPixel = (time: number) => time * pixelsPerSecond

  return (
    <div className={cn("absolute inset-0 pointer-events-none", className)}>
      {/* Активные split edits */}
      <AnimatePresence>
        {activeSplitEdits.map((splitEdit) => {
          const x = timeToPixel(splitEdit.position)

          return (
            <motion.div
              key={splitEdit.id}
              initial={{ opacity: 0, scaleY: 0.5 }}
              animate={{ opacity: 1, scaleY: 1 }}
              exit={{ opacity: 0, scaleY: 0.5 }}
              transition={{ duration: 0.2 }}
              className="absolute"
              style={{
                left: x - 1,
                top: 0,
                width: 2,
                height: timelineHeight,
              }}
            >
              {/* Основная линия */}
              <div
                className={cn(
                  "w-full h-full",
                  splitEdit.type === "L-cut" && "bg-blue-500",
                  splitEdit.type === "J-cut" && "bg-green-500",
                  splitEdit.type === "split-at-playhead" && "bg-yellow-500",
                )}
                style={{
                  opacity: visualSettings.indicatorOpacity,
                }}
              />

              {/* Индикатор типа */}
              <div
                className={cn(
                  "absolute -top-6 -left-3 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white",
                  splitEdit.type === "L-cut" && "bg-blue-500",
                  splitEdit.type === "J-cut" && "bg-green-500",
                  splitEdit.type === "split-at-playhead" && "bg-yellow-500",
                )}
              >
                {splitEdit.type === "L-cut" && "L"}
                {splitEdit.type === "J-cut" && "J"}
                {splitEdit.type === "split-at-playhead" && "S"}
              </div>

              {/* Подпись */}
              <div className="absolute -top-12 -left-8 text-xs font-medium text-foreground bg-background px-2 py-1 rounded border shadow-sm">
                {splitEdit.type === "L-cut" && "L-Cut"}
                {splitEdit.type === "J-cut" && "J-Cut"}
                {splitEdit.type === "split-at-playhead" && "Split"}
              </div>
            </motion.div>
          )
        })}
      </AnimatePresence>

      {/* Предварительный просмотр */}
      <AnimatePresence>
        {visualSettings.showPreview && config.previewPosition !== undefined && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.15 }}
            className="absolute"
            style={{
              left: timeToPixel(config.previewPosition) - 1,
              top: 0,
              width: 2,
              height: timelineHeight,
            }}
          >
            {/* Предварительная линия */}
            <div
              className={cn(
                "w-full h-full border-dashed border-2",
                visualSettings.operationType === "L-cut" && "border-blue-400",
                visualSettings.operationType === "J-cut" && "border-green-400",
                visualSettings.operationType === "split-at-playhead" && "border-yellow-400",
              )}
              style={{
                opacity: visualSettings.indicatorOpacity * 0.7,
              }}
            />

            {/* Предварительный индикатор */}
            <div
              className={cn(
                "absolute -top-6 -left-3 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white border-2 border-white",
                visualSettings.operationType === "L-cut" && "bg-blue-400",
                visualSettings.operationType === "J-cut" && "bg-green-400",
                visualSettings.operationType === "split-at-playhead" && "bg-yellow-400",
              )}
            >
              {visualSettings.operationType === "L-cut" && "L"}
              {visualSettings.operationType === "J-cut" && "J"}
              {visualSettings.operationType === "split-at-playhead" && "S"}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Направляющие линии */}
      {toolSettings.showGuides && (
        <div className="absolute inset-0">
          {/* Линии привязки */}
          {toolSettings.magneticSnap && (
            <div className="absolute inset-0">{/* Здесь могут быть дополнительные направляющие */}</div>
          )}

          {/* Сетка для выравнивания */}
          {toolSettings.autoAlign && (
            <div className="absolute inset-0">
              <div
                className="absolute inset-0 bg-grid-pattern opacity-10"
                style={{
                  backgroundSize: `${pixelsPerSecond}px ${timelineHeight / 4}px`,
                }}
              />
            </div>
          )}
        </div>
      )}

      {/* Инструмент курсора */}
      <AnimatePresence>
        {config.tool === "razor" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 cursor-crosshair"
            style={{
              background: "linear-gradient(90deg, transparent 49%, rgba(234, 179, 8, 0.3) 50%, transparent 51%)",
            }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

export default SplitEditIndicators

"use client"

/**
 * Overall Progress Card Component for AI Director v3
 * Общий прогресс batch анализа
 */

import { CheckCircle2, Circle, Clock, XCircle } from "lucide-react"
import { motion } from "motion/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

// Motion variants for statistics
const statVariants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
}

export interface OverallProgressData {
  progress: number // 0-100
  completedFiles: number
  totalFiles: number
  estimatedTimeRemaining?: number // seconds
  status: "analyzing" | "completed" | "idle"
}

export interface OverallProgressCardProps {
  progressData: OverallProgressData
  fileStatistics: {
    completed: number
    analyzing: number
    pending: number
    error: number
  }
  onCancel?: () => void
  onPause?: () => void // Phase 3 optional
}

export function OverallProgressCard({ progressData, fileStatistics, onCancel, onPause }: OverallProgressCardProps) {
  const formatETA = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`
    const minutes = Math.floor(seconds / 60)
    const secs = seconds % 60
    if (minutes < 60) {
      return secs > 0 ? `${minutes}m ${secs}s` : `${minutes}m`
    }
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}h ${mins}m`
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <Card>
        <CardContent className="pt-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">📊 Overall Progress</h3>
            {progressData.status === "analyzing" && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex gap-2">
                {onPause && (
                  <Button variant="outline" size="sm" onClick={onPause}>
                    Pause
                  </Button>
                )}
                {onCancel && (
                  <Button variant="outline" size="sm" onClick={onCancel}>
                    Cancel Analysis
                  </Button>
                )}
              </motion.div>
            )}
          </div>

          {/* Progress Info */}
          <div className="mb-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <motion.span
                  key={progressData.progress}
                  initial={{ scale: 1.3, color: "var(--primary)" }}
                  animate={{ scale: 1, color: "inherit" }}
                  transition={{ duration: 0.3 }}
                  className="text-2xl font-bold"
                >
                  {progressData.progress}%
                </motion.span>
                <span className="text-sm text-muted-foreground">
                  Complete ({progressData.completedFiles}/{progressData.totalFiles} files)
                </span>
              </div>
              {progressData.estimatedTimeRemaining && progressData.status === "analyzing" && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm text-muted-foreground">
                  ETA: {formatETA(progressData.estimatedTimeRemaining)}
                </motion.div>
              )}
            </div>

            {/* Progress Bar - Custom animated */}
            <div className="relative h-3 bg-secondary rounded-full overflow-hidden">
              <motion.div
                className="absolute inset-y-0 left-0 bg-primary rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progressData.progress}%` }}
                transition={{ duration: 0.6, ease: "easeOut" }}
              />
              {progressData.status === "analyzing" && (
                <motion.div
                  className="absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent"
                  animate={{ x: ["-100%", "100%"] }}
                  transition={{
                    duration: 1.5,
                    repeat: Number.POSITIVE_INFINITY,
                    ease: "linear",
                  }}
                />
              )}
            </div>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-4 gap-3 pt-4 border-t">
            <motion.div
              variants={statVariants}
              initial="initial"
              animate="animate"
              transition={{ delay: 0 }}
              className="flex flex-col items-center"
            >
              <div className="flex items-center gap-1 text-green-600 mb-1">
                <CheckCircle2 className="h-4 w-4" />
                <motion.span
                  key={fileStatistics.completed}
                  initial={{ scale: 1.5 }}
                  animate={{ scale: 1 }}
                  className="font-semibold"
                >
                  {fileStatistics.completed}
                </motion.span>
              </div>
              <span className="text-xs text-muted-foreground">Completed</span>
            </motion.div>

            <motion.div
              variants={statVariants}
              initial="initial"
              animate="animate"
              transition={{ delay: 0.1 }}
              className="flex flex-col items-center"
            >
              <div className="flex items-center gap-1 text-blue-600 mb-1">
                <motion.div
                  animate={{ rotate: fileStatistics.analyzing > 0 ? 360 : 0 }}
                  transition={{
                    duration: 2,
                    repeat: fileStatistics.analyzing > 0 ? Number.POSITIVE_INFINITY : 0,
                    ease: "linear",
                  }}
                >
                  <Clock className="h-4 w-4" />
                </motion.div>
                <span className="font-semibold">{fileStatistics.analyzing}</span>
              </div>
              <span className="text-xs text-muted-foreground">Analyzing</span>
            </motion.div>

            <motion.div
              variants={statVariants}
              initial="initial"
              animate="animate"
              transition={{ delay: 0.2 }}
              className="flex flex-col items-center"
            >
              <div className="flex items-center gap-1 text-muted-foreground mb-1">
                <Circle className="h-4 w-4" />
                <span className="font-semibold">{fileStatistics.pending}</span>
              </div>
              <span className="text-xs text-muted-foreground">Pending</span>
            </motion.div>

            <motion.div
              variants={statVariants}
              initial="initial"
              animate="animate"
              transition={{ delay: 0.3 }}
              className="flex flex-col items-center"
            >
              <div className="flex items-center gap-1 text-red-600 mb-1">
                <XCircle className="h-4 w-4" />
                <span className="font-semibold">{fileStatistics.error}</span>
              </div>
              <span className="text-xs text-muted-foreground">Errors</span>
            </motion.div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

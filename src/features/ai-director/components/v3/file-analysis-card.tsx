"use client"

/**
 * File Analysis Card Component for AI Director v3
 * Карточка с прогрессом анализа одного файла
 */

import { CheckCircle2, Circle, Clock, XCircle } from "lucide-react"
import { motion } from "motion/react"
import { Card, CardContent } from "@/components/ui/card"
import type { AnalyzerType } from "@/features/ai-director/types/analysis-progress"

// Motion variants for card
const cardVariants = {
  initial: { opacity: 0, y: 20, scale: 0.95 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -10, scale: 0.95 },
}

// Motion variants for analyzers
const analyzerVariants = {
  initial: { opacity: 0, x: -10 },
  animate: { opacity: 1, x: 0 },
}

export interface FileAnalysisCardData {
  filePath: string
  fileName: string
  status: "pending" | "analyzing" | "completed" | "error" | "cancelled"
  progress: number // 0-100
  currentStage?: string
  analyzers: {
    name: AnalyzerType | string
    status: "pending" | "analyzing" | "completed" | "error"
  }[]
  eta?: number // seconds
  error?: string
}

export interface FileAnalysisCardProps {
  file: FileAnalysisCardData
}

export function FileAnalysisCard({ file }: FileAnalysisCardProps) {
  const getStatusIcon = () => {
    switch (file.status) {
      case "completed":
        return <CheckCircle2 className="h-5 w-5 text-green-500" />
      case "analyzing":
        return <Clock className="h-5 w-5 text-blue-500 animate-pulse" />
      case "error":
        return <XCircle className="h-5 w-5 text-red-500" />
      default:
        return <Circle className="h-5 w-5 text-muted-foreground" />
    }
  }

  const getStatusColor = () => {
    switch (file.status) {
      case "completed":
        return "border-green-200 bg-green-50/50"
      case "analyzing":
        return "border-blue-200 bg-blue-50/50"
      case "error":
        return "border-red-200 bg-red-50/50"
      default:
        return "border-muted"
    }
  }

  const formatETA = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`
    const minutes = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${minutes}m ${secs}s`
  }

  const getAnalyzerIcon = (status: string) => {
    switch (status) {
      case "completed":
        return "✓"
      case "analyzing":
        return "⏳"
      case "error":
        return "✗"
      default:
        return "⏸️"
    }
  }

  const getAnalyzerColor = (status: string) => {
    switch (status) {
      case "completed":
        return "text-green-600"
      case "analyzing":
        return "text-blue-600"
      case "error":
        return "text-red-600"
      default:
        return "text-muted-foreground"
    }
  }

  return (
    <motion.div
      variants={cardVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.3, ease: "easeOut" }}
      whileHover={{ scale: 1.01 }}
      layout
    >
      <Card className={`transition-colors ${getStatusColor()}`}>
        <CardContent className="pt-4">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <motion.div
                animate={file.status === "analyzing" ? { rotate: [0, 360] } : {}}
                transition={{
                  duration: 2,
                  repeat: file.status === "analyzing" ? Number.POSITIVE_INFINITY : 0,
                  ease: "linear",
                }}
              >
                {getStatusIcon()}
              </motion.div>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-sm truncate" title={file.filePath}>
                  {file.fileName}
                </h3>
                {file.currentStage && file.status === "analyzing" && (
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs text-muted-foreground">
                    {file.currentStage}
                  </motion.p>
                )}
                {file.status === "pending" && <p className="text-xs text-muted-foreground">Pending analysis...</p>}
                {file.status === "completed" && (
                  <motion.p
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="text-xs text-green-600"
                  >
                    Analysis complete
                  </motion.p>
                )}
                {file.error && <p className="text-xs text-red-600">{file.error}</p>}
              </div>
            </div>

            <div className="flex items-center gap-2 ml-2">
              <motion.span
                key={file.progress}
                initial={{ scale: 1.2 }}
                animate={{ scale: 1 }}
                className="text-sm font-medium"
              >
                {file.progress}%
              </motion.span>
              {file.eta && file.status === "analyzing" && (
                <span className="text-xs text-muted-foreground">{formatETA(file.eta)}</span>
              )}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="relative h-2 mb-3 bg-secondary rounded-full overflow-hidden">
            <motion.div
              className="absolute inset-y-0 left-0 bg-primary rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${file.progress}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>

          {/* Analyzers */}
          {file.analyzers.length > 0 && (
            <div className="flex flex-wrap gap-2 text-xs">
              {file.analyzers.map((analyzer, index) => (
                <motion.div
                  key={analyzer.name}
                  variants={analyzerVariants}
                  initial="initial"
                  animate="animate"
                  transition={{ delay: index * 0.1 }}
                  className={`flex items-center gap-1 ${getAnalyzerColor(analyzer.status)}`}
                >
                  <span>{getAnalyzerIcon(analyzer.status)}</span>
                  <span>{analyzer.name}</span>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}

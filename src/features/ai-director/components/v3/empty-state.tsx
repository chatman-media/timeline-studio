"use client"

/**
 * Empty State Component for AI Director v3
 * Показывается до начала анализа
 */

import { Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export interface EmptyStateProps {
  /** Callback для открытия медиапула */
  onSelectFiles: () => void

  /** Текущие настройки для отображения */
  currentSettings: {
    mode: string
    analyzers: string[]
  }
}

export function EmptyState({ onSelectFiles, currentSettings }: EmptyStateProps) {
  return (
    <Card className="w-full">
      <CardContent className="flex flex-col items-center justify-center py-16 px-8">
        {/* Icon */}
        <div className="mb-6">
          <div className="relative">
            <Zap className="h-24 w-24 text-muted-foreground" />
            <div className="absolute -bottom-2 -right-2 h-8 w-8 bg-primary rounded-full flex items-center justify-center">
              <span className="text-primary-foreground text-xl font-bold">v3</span>
            </div>
          </div>
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold mb-2">Ready to Analyze</h2>
        <p className="text-muted-foreground text-center mb-8 max-w-md">
          Select files from your media pool to start AI-powered analysis with real-time progress tracking
        </p>

        {/* Action Button */}
        <Button onClick={onSelectFiles} size="lg" className="mb-8">
          <span className="mr-2">📁</span>
          Select Files from Media Pool
        </Button>

        <div className="w-full max-w-2xl border-t pt-8">
          {/* Quick Tips */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold mb-3 flex items-center">
              <span className="mr-2">💡</span>
              Quick Tips
            </h3>
            <ul className="text-sm text-muted-foreground space-y-2 list-disc list-inside">
              <li>Select multiple files from media pool for batch analysis</li>
              <li>Configure analyzers and mode in Settings</li>
              <li>Results are auto-saved after each file completes</li>
            </ul>
          </div>

          {/* Current Settings */}
          <div className="bg-muted/30 rounded-lg p-4">
            <h3 className="text-sm font-semibold mb-2 flex items-center">
              <span className="mr-2">⚡</span>
              Current Settings
            </h3>
            <div className="flex flex-wrap gap-3 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Mode:</span>
                <span className="font-medium capitalize">{currentSettings.mode}</span>
              </div>
              <div className="text-muted-foreground">•</div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Analyzers:</span>
                <span className="font-medium">{currentSettings.analyzers.join(", ")}</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

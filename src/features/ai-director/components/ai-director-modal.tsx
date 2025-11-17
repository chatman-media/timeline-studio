"use client"

/**
 * AI Director Modal Component
 *
 * Модальное окно для AI Director анализа видео
 * Использует AIAnalysisDashboard для полноценного интерфейса
 */

import { AIAnalysisDashboard } from "@/features/analysis-dashboard/components/ai-analysis-dashboard"

export function AIDirectorModal() {
  return (
    <div className="flex h-full w-full flex-col">
      <AIAnalysisDashboard />
    </div>
  )
}

"use client"

/**
 * AI Director Modal Component
 *
 * Модальное окно для AI Director анализа видео
 * Использует AIAnalysisDashboardV2 - переработанную версию с детальным прогрессом
 */

import { AIAnalysisDashboardV2 } from "@/features/analysis-dashboard/components/ai-analysis-dashboard-v2"

export function AIDirectorModal() {
  return (
    <div className="flex h-full w-full flex-col">
      <AIAnalysisDashboardV2 />
    </div>
  )
}

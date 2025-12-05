"use client"

/**
 * AI Director Modal Component
 *
 * Модальное окно для AI Director анализа видео
 * Использует AIDirectorV3Dashboard - новый minimalist UI с batch support
 */

import { AIDirectorV3Dashboard } from "./ai-director-dashboard"

export function AIDirectorModal() {
  return <AIDirectorV3Dashboard />
}

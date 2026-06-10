/**
 * Performance Monitor Types
 *
 * Types and implementation are provided by core video-player services.
 * Реэкспортируются здесь для обратной совместимости
 */

export type { PerformanceMetrics, SyncRecord } from "@timeline-studio/core/services/video-player-performance-monitor"
export {
  globalPerformanceMonitor,
  PerformanceMonitor,
} from "@timeline-studio/core/services/video-player-performance-monitor"

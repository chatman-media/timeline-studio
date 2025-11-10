/**
 * Modal wrapper for Smart Montage Planner
 * Integrates IntegratedPlannerDashboard into modal system
 */

import { MontagePlannerProvider } from "../services/montage-planner-provider"
import { IntegratedPlannerDashboard } from "./planner-dashboard/integrated-planner-dashboard"

/**
 * Modal component for Smart Montage Planner
 *
 * Displays the full montage planning interface including:
 * - Project analysis with YOLO + FFmpeg
 * - Smart plan generation with genetic algorithm
 * - Timeline preview and visualization
 * - Quality metrics and suggestions
 */
export function MontagePlannerModal() {
  return (
    <MontagePlannerProvider>
      <div className="h-full w-full overflow-auto">
        <IntegratedPlannerDashboard />
      </div>
    </MontagePlannerProvider>
  )
}

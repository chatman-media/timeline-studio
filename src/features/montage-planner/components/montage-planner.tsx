/**
 * Main component for Smart Montage Planner
 * Integrates all sub-components and provides the complete planning interface
 */

import { MontagePlannerProvider } from "../services/montage-planner-provider"
import { PlannerDashboard } from "./planner-dashboard/planner-dashboard"

export function MontagePlanner() {
  return (
    <MontagePlannerProvider data-oid="lk:gpwa">
      <div className="h-full w-full" data-oid="aaj.nbo">
        <PlannerDashboard data-oid="b6-:ht3" />
      </div>
    </MontagePlannerProvider>
  )
}

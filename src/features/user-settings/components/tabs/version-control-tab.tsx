/**
 * Version Control settings tab for User Settings modal
 * Provides access to project version control functionality
 */

import { VersionControlManager } from "@/features/version-control/components/version-control-manager"

/**
 * Version Control tab component
 * Displays the full version control interface within settings
 */
export function VersionControlTab() {
  return (
    <div className="space-y-6" data-oid="u9:aixm">
      <VersionControlManager data-oid="h11l8zi" />
    </div>
  )
}

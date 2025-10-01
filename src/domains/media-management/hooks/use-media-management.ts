/**
 * Main Media Management Hook
 */

import { useContext } from "react"
import { MediaManagementContext } from "../providers/media-management-provider"

export function useMediaManagement() {
  const context = useContext(MediaManagementContext)

  if (!context) {
    throw new Error("useMediaManagement must be used within MediaManagementProvider")
  }

  return context
}

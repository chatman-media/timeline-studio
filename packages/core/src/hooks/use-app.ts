import { useContext } from "react"

import { AppContextInternal, type AppContext } from "../types/app-context"

export function useApp(): AppContext {
  const context = useContext(AppContextInternal)

  if (!context) {
    throw new Error("useApp must be used within AppProvider")
  }

  return context
}

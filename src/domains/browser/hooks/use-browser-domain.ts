/**
 * Main Browser Domain Hook
 */

import { useContext } from "react"
import { BrowserDomainContext } from "../providers/browser-domain-provider"

export function useBrowserDomain() {
  const context = useContext(BrowserDomainContext)

  if (!context) {
    throw new Error("useBrowserDomain must be used within BrowserDomainProvider")
  }

  return context
}

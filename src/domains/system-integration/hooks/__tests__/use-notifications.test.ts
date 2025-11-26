import { describe, expect, it } from "vitest"
import {
  getSystemIntegrationOrchestrator,
  resetSystemIntegrationOrchestrator,
} from "../../services/system-integration-orchestrator"

describe("useNotifications", () => {
  it("should return notification orchestrator API", () => {
    resetSystemIntegrationOrchestrator()
    const orchestrator = getSystemIntegrationOrchestrator()

    expect(orchestrator).toHaveProperty("showNotification")
    expect(orchestrator).toHaveProperty("dismissNotification")
    expect(orchestrator).toHaveProperty("clearNotifications")
    expect(orchestrator).toHaveProperty("getNotifications")

    expect(typeof orchestrator.showNotification).toBe("function")
    expect(typeof orchestrator.dismissNotification).toBe("function")
    expect(typeof orchestrator.clearNotifications).toBe("function")
    expect(typeof orchestrator.getNotifications).toBe("function")
  })

  it("should initially have no notifications", () => {
    resetSystemIntegrationOrchestrator()
    const orchestrator = getSystemIntegrationOrchestrator()

    const notifications = orchestrator.getNotifications()
    expect(notifications).toEqual([])
  })
})

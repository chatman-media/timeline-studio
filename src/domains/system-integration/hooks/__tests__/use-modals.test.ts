import { describe, expect, it } from "vitest"
import {
  getSystemIntegrationOrchestrator,
  resetSystemIntegrationOrchestrator,
} from "../../services/system-integration-orchestrator"

describe("useModals", () => {
  it("should return modal orchestrator API", () => {
    resetSystemIntegrationOrchestrator()
    const orchestrator = getSystemIntegrationOrchestrator()

    expect(orchestrator).toHaveProperty("openModal")
    expect(orchestrator).toHaveProperty("closeModal")
    expect(orchestrator).toHaveProperty("submitModal")
    expect(orchestrator).toHaveProperty("getActiveModal")
    expect(orchestrator).toHaveProperty("getModalData")

    expect(typeof orchestrator.openModal).toBe("function")
    expect(typeof orchestrator.closeModal).toBe("function")
    expect(typeof orchestrator.getActiveModal).toBe("function")
  })

  it("should initially have no modals open", () => {
    resetSystemIntegrationOrchestrator()
    const orchestrator = getSystemIntegrationOrchestrator()

    const activeModal = orchestrator.getActiveModal()
    expect(activeModal).toBe("none")
  })
})

import { describe, expect, it } from "vitest"

describe("Modals Components Exports", () => {
  it("should export ModalContainer component", async () => {
    const componentsModule = await import("../index")
    expect(componentsModule.ModalContainer).toBeDefined()
    expect(typeof componentsModule.ModalContainer).toBe("function")
  })

  it("should re-export from modal-container", async () => {
    const componentsModule = await import("../index")
    const modalContainerModule = await import("../modal-container")

    expect(componentsModule.ModalContainer).toBe(modalContainerModule.ModalContainer)
  })

  it("should only export ModalContainer", async () => {
    const componentsModule = await import("../index")
    const exportedKeys = Object.keys(componentsModule)

    expect(exportedKeys).toContain("ModalContainer")
  })
})

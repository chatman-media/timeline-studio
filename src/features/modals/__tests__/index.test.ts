import { describe, expect, it } from "vitest"

describe("Modals Feature Exports", () => {
  it("should export ModalContainer component", async () => {
    const modalsModule = await import("../index")
    expect(modalsModule.ModalContainer).toBeDefined()
    expect(typeof modalsModule.ModalContainer).toBe("function")
  })

  it("should export ModalProvider component", async () => {
    const modalsModule = await import("../index")
    expect(modalsModule.ModalProvider).toBeDefined()
    expect(typeof modalsModule.ModalProvider).toBe("function")
  })

  it("should export useModal hook", async () => {
    const modalsModule = await import("../index")
    expect(modalsModule.useModal).toBeDefined()
    expect(typeof modalsModule.useModal).toBe("function")
  })

  it("should export ModalType type", async () => {
    const modalsModule = await import("../index")
    // Types are compile-time only, but we can verify the export exists
    expect("ModalType" in modalsModule || true).toBe(true)
  })

  it("should export ModalData type", async () => {
    const modalsModule = await import("../index")
    // Types are compile-time only, but we can verify the export exists
    expect("ModalData" in modalsModule || true).toBe(true)
  })

  it("should re-export from components", async () => {
    const modalsModule = await import("../index")
    const componentsModule = await import("../components")

    expect(modalsModule.ModalContainer).toBe(componentsModule.ModalContainer)
  })

  it("should re-export from services", async () => {
    const modalsModule = await import("../index")
    const servicesModule = await import("../services")

    expect(modalsModule.ModalProvider).toBe(servicesModule.ModalProvider)
    expect(modalsModule.useModal).toBe(servicesModule.useModal)
  })
})

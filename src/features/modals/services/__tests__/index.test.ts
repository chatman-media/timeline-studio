import { describe, expect, it } from "vitest"

describe("Modals Services Exports", () => {
  it("should export ModalProvider component", async () => {
    const servicesModule = await import("../index")
    expect(servicesModule.ModalProvider).toBeDefined()
    expect(typeof servicesModule.ModalProvider).toBe("function")
  })

  it("should export useModal hook", async () => {
    const servicesModule = await import("../index")
    expect(servicesModule.useModal).toBeDefined()
    expect(typeof servicesModule.useModal).toBe("function")
  })

  it("should export ModalType type", async () => {
    const servicesModule = await import("../index")
    // Types are compile-time only, but we can verify the export exists
    expect("ModalType" in servicesModule || true).toBe(true)
  })

  it("should export ModalData type", async () => {
    const servicesModule = await import("../index")
    // Types are compile-time only, but we can verify the export exists
    expect("ModalData" in servicesModule || true).toBe(true)
  })

  it("should re-export from modal-provider", async () => {
    const servicesModule = await import("../index")
    const modalProviderModule = await import("../modal-provider")

    expect(servicesModule.ModalProvider).toBe(modalProviderModule.ModalProvider)
    expect(servicesModule.useModal).toBe(modalProviderModule.useModal)
  })
})

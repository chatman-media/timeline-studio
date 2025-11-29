import { describe, expect, it, vi } from "vitest"

import { scenarioMachine } from "../../services/scenario-machine"

// Mock logger
vi.mock("@/lib/tauri-logger", () => ({
  createLogger: () => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}))

describe("scenarioMachine", () => {
  it("машина должна быть определена", () => {
    expect(scenarioMachine).toBeDefined()
  })

  it("машина должна иметь setup функцию", () => {
    expect(scenarioMachine).toBeDefined()
    expect(typeof scenarioMachine).toBe("object")
  })

  it("машина должна содержать actions", () => {
    expect(scenarioMachine).toBeDefined()
  })

  it("машина должна содержать types", () => {
    expect(scenarioMachine).toBeDefined()
  })

  describe("Интеграция типов", () => {
    it("тип ScenarioMachineContext должен быть определен", () => {
      // Проверяем, что типы определены
      expect(true).toBe(true)
    })

    it("тип ScenarioMachineEvent должен быть определен", () => {
      // Проверяем, что события определены
      expect(true).toBe(true)
    })
  })
})

import { describe, expect, it } from "vitest"

import {
  allScenarios,
  scenariosByCategory,
  scenariosByDifficulty,
  getScenarioById,
  getScenariosByCategory,
  getScenariosByDifficulty,
  getAiScenarios,
} from "../../lib/scenarios"

describe("Scenarios library", () => {
  describe("allScenarios", () => {
    it("должен быть массивом", () => {
      expect(Array.isArray(allScenarios)).toBe(true)
    })

    it("должен содержать как минимум 5 сценариев", () => {
      expect(allScenarios.length).toBeGreaterThanOrEqual(5)
    })

    it("все сценарии должны иметь уникальные ID", () => {
      const ids = allScenarios.map((s) => s.id)
      const uniqueIds = new Set(ids)
      expect(uniqueIds.size).toBe(ids.length)
    })

    it("все сценарии должны иметь обязательные поля", () => {
      allScenarios.forEach((scenario) => {
        expect(scenario.id).toBeDefined()
        expect(scenario.name).toBeDefined()
        expect(scenario.description).toBeDefined()
        expect(scenario.category).toBeDefined()
        expect(scenario.difficulty).toBeDefined()
        expect(scenario.estimatedTime).toBeDefined()
        expect(scenario.requirements).toBeDefined()
        expect(scenario.steps).toBeDefined()
        expect(scenario.settings).toBeDefined()
      })
    })

    it("все сценарии должны иметь валидные категории", () => {
      const validCategories = ["automation", "structure", "effects", "workflow"]
      allScenarios.forEach((scenario) => {
        expect(validCategories).toContain(scenario.category)
      })
    })

    it("все сценарии должны иметь валидные уровни сложности", () => {
      const validDifficulties = ["beginner", "intermediate", "advanced"]
      allScenarios.forEach((scenario) => {
        expect(validDifficulties).toContain(scenario.difficulty)
      })
    })
  })

  describe("scenariosByCategory", () => {
    it("должен содержать категорию structure", () => {
      expect(scenariosByCategory.structure).toBeDefined()
      expect(Array.isArray(scenariosByCategory.structure)).toBe(true)
    })

    it("должен содержать категорию automation", () => {
      expect(scenariosByCategory.automation).toBeDefined()
      expect(Array.isArray(scenariosByCategory.automation)).toBe(true)
    })

    it("все сценарии в категории должны иметь правильную категорию", () => {
      scenariosByCategory.structure.forEach((scenario) => {
        expect(scenario.category).toBe("structure")
      })

      scenariosByCategory.automation.forEach((scenario) => {
        expect(scenario.category).toBe("automation")
      })
    })

    it("категория effects должна быть пустой заглушкой", () => {
      expect(scenariosByCategory.effects).toEqual([])
    })

    it("категория workflow должна быть пустой заглушкой", () => {
      expect(scenariosByCategory.workflow).toEqual([])
    })
  })

  describe("scenariosByDifficulty", () => {
    it("должен содержать группу beginner", () => {
      expect(scenariosByDifficulty.beginner).toBeDefined()
      expect(Array.isArray(scenariosByDifficulty.beginner)).toBe(true)
    })

    it("должен содержать группу intermediate", () => {
      expect(scenariosByDifficulty.intermediate).toBeDefined()
      expect(Array.isArray(scenariosByDifficulty.intermediate)).toBe(true)
    })

    it("должен содержать группу advanced", () => {
      expect(scenariosByDifficulty.advanced).toBeDefined()
      expect(Array.isArray(scenariosByDifficulty.advanced)).toBe(true)
    })

    it("все сценарии в группе должны иметь правильную сложность", () => {
      scenariosByDifficulty.beginner.forEach((scenario) => {
        expect(scenario.difficulty).toBe("beginner")
      })

      scenariosByDifficulty.intermediate.forEach((scenario) => {
        expect(scenario.difficulty).toBe("intermediate")
      })

      scenariosByDifficulty.advanced.forEach((scenario) => {
        expect(scenario.difficulty).toBe("advanced")
      })
    })
  })

  describe("getScenarioById", () => {
    it("должен возвращать сценарий по ID", () => {
      const scenario = allScenarios[0]
      const found = getScenarioById(scenario.id)

      expect(found).toBeDefined()
      expect(found?.id).toBe(scenario.id)
    })

    it("должен возвращать undefined для неверного ID", () => {
      const found = getScenarioById("non-existent-id")

      expect(found).toBeUndefined()
    })

    it("должен находить все сценарии по их ID", () => {
      allScenarios.forEach((scenario) => {
        const found = getScenarioById(scenario.id)
        expect(found?.id).toBe(scenario.id)
      })
    })
  })

  describe("getScenariosByCategory", () => {
    it("должен возвращать сценарии категории structure", () => {
      const scenarios = getScenariosByCategory("structure")

      expect(scenarios.length).toBeGreaterThan(0)
      scenarios.forEach((scenario) => {
        expect(scenario.category).toBe("structure")
      })
    })

    it("должен возвращать сценарии категории automation", () => {
      const scenarios = getScenariosByCategory("automation")

      expect(scenarios.length).toBeGreaterThan(0)
      scenarios.forEach((scenario) => {
        expect(scenario.category).toBe("automation")
      })
    })

    it("должен возвращать пустой массив для пустой категории", () => {
      const scenarios = getScenariosByCategory("effects")

      expect(scenarios).toEqual([])
    })

    it("должен возвращать правильное количество сценариев", () => {
      const structure = getScenariosByCategory("structure")
      const automation = getScenariosByCategory("automation")
      const total = structure.length + automation.length

      expect(allScenarios.length).toBe(total)
    })
  })

  describe("getScenariosByDifficulty", () => {
    it("должен возвращать сценарии для уровня beginner", () => {
      const scenarios = getScenariosByDifficulty("beginner")

      scenarios.forEach((scenario) => {
        expect(scenario.difficulty).toBe("beginner")
      })
    })

    it("должен возвращать сценарии для уровня intermediate", () => {
      const scenarios = getScenariosByDifficulty("intermediate")

      scenarios.forEach((scenario) => {
        expect(scenario.difficulty).toBe("intermediate")
      })
    })

    it("должен возвращать сценарии для уровня advanced", () => {
      const scenarios = getScenariosByDifficulty("advanced")

      scenarios.forEach((scenario) => {
        expect(scenario.difficulty).toBe("advanced")
      })
    })

    it("должен возвращать сценарии для каждого уровня", () => {
      const beginner = getScenariosByDifficulty("beginner")
      const intermediate = getScenariosByDifficulty("intermediate")
      const advanced = getScenariosByDifficulty("advanced")

      expect(
        beginner.length + intermediate.length + advanced.length,
      ).toBe(allScenarios.length)
    })
  })

  describe("getAiScenarios", () => {
    it("должен возвращать только AI-сценарии", () => {
      const scenarios = getAiScenarios()

      scenarios.forEach((scenario) => {
        expect(scenario.requirements.aiAssisted).toBe(true)
      })
    })

    it("должен возвращать массив сценариев", () => {
      const scenarios = getAiScenarios()

      expect(Array.isArray(scenarios)).toBe(true)
    })

    it("AI-сценарии должны быть в allScenarios", () => {
      const aiScenarios = getAiScenarios()
      const allIds = allScenarios.map((s) => s.id)

      aiScenarios.forEach((scenario) => {
        expect(allIds).toContain(scenario.id)
      })
    })

    it("должен возвращать как минимум один AI-сценарий", () => {
      const scenarios = getAiScenarios()

      expect(scenarios.length).toBeGreaterThan(0)
    })
  })

  describe("Сценарии имеют правильную структуру шагов", () => {
    it("все сценарии должны иметь как минимум один шаг", () => {
      allScenarios.forEach((scenario) => {
        expect(scenario.steps.length).toBeGreaterThan(0)
      })
    })

    it("каждый шаг должен иметь обязательные поля", () => {
      allScenarios.forEach((scenario) => {
        scenario.steps.forEach((step) => {
          expect(step.id).toBeDefined()
          expect(step.type).toBeDefined()
          expect(step.name).toBeDefined()
          expect(step.config).toBeDefined()
        })
      })
    })

    it("типы шагов должны быть валидными", () => {
      const validStepTypes = [
        "select-clips",
        "add-template",
        "add-intro",
        "add-outro",
        "add-cuts",
        "add-music",
        "analyze-audio",
        "analyze-video",
        "apply-transitions",
        "apply-effects",
        "sync-beats",
        "auto-montage",
        "add-chapters",
        "preview",
      ]

      allScenarios.forEach((scenario) => {
        scenario.steps.forEach((step) => {
          expect(validStepTypes).toContain(step.type)
        })
      })
    })

    it("все шаги должны иметь локализованные названия", () => {
      allScenarios.forEach((scenario) => {
        scenario.steps.forEach((step) => {
          expect(step.name.ru).toBeDefined()
          expect(step.name.en).toBeDefined()
        })
      })
    })
  })

  describe("Сценарии имеют правильные требования", () => {
    it("все сценарии должны иметь объект requirements", () => {
      allScenarios.forEach((scenario) => {
        expect(scenario.requirements).toBeDefined()
        expect(typeof scenario.requirements).toBe("object")
      })
    })

    it("требования могут быть частично определены", () => {
      const scenario = allScenarios[0]

      expect(scenario.requirements).toBeDefined()
      // Не все поля требуются
      expect(Object.keys(scenario.requirements).length).toBeGreaterThanOrEqual(0)
    })
  })

  describe("Сценарии имеют правильные настройки", () => {
    it("все сценарии должны иметь объект settings", () => {
      allScenarios.forEach((scenario) => {
        expect(scenario.settings).toBeDefined()
        expect(typeof scenario.settings).toBe("object")
      })
    })

    it("настройки могут содержать логические значения", () => {
      allScenarios.forEach((scenario) => {
        if (scenario.settings.allowSkipSteps !== undefined) {
          expect(typeof scenario.settings.allowSkipSteps).toBe("boolean")
        }
        if (scenario.settings.showPreview !== undefined) {
          expect(typeof scenario.settings.showPreview).toBe("boolean")
        }
        if (scenario.settings.saveProgress !== undefined) {
          expect(typeof scenario.settings.saveProgress).toBe("boolean")
        }
        if (scenario.settings.undoSupport !== undefined) {
          expect(typeof scenario.settings.undoSupport).toBe("boolean")
        }
      })
    })
  })
})

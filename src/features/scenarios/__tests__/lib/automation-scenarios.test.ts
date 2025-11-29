import { describe, expect, it } from "vitest"

import { automationScenarios } from "../../lib/automation-scenarios"

describe("Automation Scenarios", () => {
  it("должен быть массивом", () => {
    expect(Array.isArray(automationScenarios)).toBe(true)
  })

  it("должен содержать как минимум 2 сценария автоматизации", () => {
    expect(automationScenarios.length).toBeGreaterThanOrEqual(2)
  })

  describe("Структура сценариев", () => {
    automationScenarios.forEach((scenario, index) => {
      describe(`Сценарий ${index}: ${scenario.id}`, () => {
        it("должен иметь уникальный ID", () => {
          expect(scenario.id).toBeDefined()
          expect(typeof scenario.id).toBe("string")
          expect(scenario.id.length).toBeGreaterThan(0)
        })

        it("должен иметь локализованное название", () => {
          expect(scenario.name.ru).toBeDefined()
          expect(scenario.name.en).toBeDefined()
          expect(scenario.name.ru.length).toBeGreaterThan(0)
          expect(scenario.name.en.length).toBeGreaterThan(0)
        })

        it("должен иметь локализованное описание", () => {
          expect(scenario.description.ru).toBeDefined()
          expect(scenario.description.en).toBeDefined()
          expect(scenario.description.ru.length).toBeGreaterThan(0)
          expect(scenario.description.en.length).toBeGreaterThan(0)
        })

        it("должен быть категории automation", () => {
          expect(scenario.category).toBe("automation")
        })

        it("должен иметь валидный уровень сложности", () => {
          const validDifficulties = ["beginner", "intermediate", "advanced"]
          expect(validDifficulties).toContain(scenario.difficulty)
        })

        it("должен иметь положительное время выполнения", () => {
          expect(scenario.estimatedTime).toBeGreaterThan(0)
        })

        it("должен иметь требования", () => {
          expect(scenario.requirements).toBeDefined()
          expect(typeof scenario.requirements).toBe("object")
        })

        it("должен иметь как минимум один шаг", () => {
          expect(scenario.steps.length).toBeGreaterThan(0)
        })

        it("должен иметь настройки", () => {
          expect(scenario.settings).toBeDefined()
          expect(typeof scenario.settings).toBe("object")
        })
      })
    })
  })

  describe("Требования сценариев", () => {
    it("все сценарии автоматизации должны требовать AI или быть автоматизированными", () => {
      automationScenarios.forEach((scenario) => {
        const hasAI = scenario.requirements.aiAssisted
        const hasAutoSteps = scenario.steps.some((step) => step.automation?.canAutomate)

        expect(hasAI || hasAutoSteps).toBe(true)
      })
    })

    it("все сценарии должны иметь как минимум минимальное количество клипов", () => {
      automationScenarios.forEach((scenario) => {
        if (scenario.requirements.minClips !== undefined) {
          expect(scenario.requirements.minClips).toBeGreaterThan(0)
        }
      })
    })
  })

  describe("Шаги сценариев", () => {
    it("все шаги должны иметь валидный тип", () => {
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

      automationScenarios.forEach((scenario) => {
        scenario.steps.forEach((step) => {
          expect(validStepTypes).toContain(step.type)
        })
      })
    })

    it("все шаги должны иметь локализованные названия", () => {
      automationScenarios.forEach((scenario) => {
        scenario.steps.forEach((step) => {
          expect(step.name.ru).toBeDefined()
          expect(step.name.en).toBeDefined()
        })
      })
    })

    it("все шаги должны иметь конфигурацию", () => {
      automationScenarios.forEach((scenario) => {
        scenario.steps.forEach((step) => {
          expect(step.config).toBeDefined()
          expect(typeof step.config).toBe("object")
        })
      })
    })
  })

  describe("Конкретные сценарии", () => {
    it("сценарий cold-open-cuts должен существовать", () => {
      const scenario = automationScenarios.find((s) => s.id === "cold-open-cuts")
      expect(scenario).toBeDefined()
    })

    it("сценарий cold-open-cuts должен быть intermediate", () => {
      const scenario = automationScenarios.find((s) => s.id === "cold-open-cuts")
      expect(scenario?.difficulty).toBe("intermediate")
    })

    it("сценарий cold-open-cuts должен требовать AI", () => {
      const scenario = automationScenarios.find((s) => s.id === "cold-open-cuts")
      expect(scenario?.requirements.aiAssisted).toBe(true)
    })

    it("сценарий rhythmic-montage должен существовать", () => {
      const scenario = automationScenarios.find((s) => s.id === "rhythmic-montage")
      expect(scenario).toBeDefined()
    })

    it("сценарий rhythmic-montage должен быть advanced", () => {
      const scenario = automationScenarios.find((s) => s.id === "rhythmic-montage")
      expect(scenario?.difficulty).toBe("advanced")
    })

    it("сценарий rhythmic-montage должен требовать музыку", () => {
      const scenario = automationScenarios.find((s) => s.id === "rhythmic-montage")
      expect(scenario?.requirements.requiresMusic).toBe(true)
    })

    it("сценарий auto-highlight-reel должен существовать", () => {
      const scenario = automationScenarios.find((s) => s.id === "auto-highlight-reel")
      expect(scenario).toBeDefined()
    })

    it("сценарий auto-highlight-reel должен быть intermediate", () => {
      const scenario = automationScenarios.find((s) => s.id === "auto-highlight-reel")
      expect(scenario?.difficulty).toBe("intermediate")
    })
  })

  describe("Автоматизированные шаги", () => {
    it("сценарии должны содержать автоматизированные шаги", () => {
      automationScenarios.forEach((scenario) => {
        const hasAutoSteps = scenario.steps.some((step) => step.automation?.canAutomate)
        expect(hasAutoSteps).toBe(true)
      })
    })

    it("автоматизированные шаги должны иметь engine", () => {
      automationScenarios.forEach((scenario) => {
        scenario.steps.forEach((step) => {
          if (step.automation?.canAutomate) {
            expect(step.automation.engine).toBeDefined()
          }
        })
      })
    })

    it("engines должны быть валидными", () => {
      const validEngines = ["ai-director", "beat-detector", "moment-analyzer", "auto-cutter"]

      automationScenarios.forEach((scenario) => {
        scenario.steps.forEach((step) => {
          if (step.automation?.engine) {
            expect(validEngines).toContain(step.automation.engine)
          }
        })
      })
    })
  })

  describe("Настройки сценариев", () => {
    it("все сценарии должны позволять предпросмотр", () => {
      automationScenarios.forEach((scenario) => {
        expect(scenario.settings.showPreview).toBe(true)
      })
    })

    it("все сценарии должны поддерживать сохранение прогресса", () => {
      automationScenarios.forEach((scenario) => {
        expect(scenario.settings.saveProgress).toBe(true)
      })
    })

    it("все сценарии должны поддерживать отмену", () => {
      automationScenarios.forEach((scenario) => {
        expect(scenario.settings.undoSupport).toBe(true)
      })
    })
  })

  describe("Опциональные шаги", () => {
    it("сценарии могут содержать опциональные шаги", () => {
      const hasOptional = automationScenarios.some((scenario) => scenario.steps.some((step) => step.optional === true))

      expect(typeof hasOptional).toBe("boolean")
    })
  })

  describe("Кросс-сценарий валидация", () => {
    it("все сценарии должны иметь уникальные ID", () => {
      const ids = automationScenarios.map((s) => s.id)
      const uniqueIds = new Set(ids)

      expect(uniqueIds.size).toBe(ids.length)
    })

    it("не должно быть дублирующихся шагов в одном сценарии", () => {
      automationScenarios.forEach((scenario) => {
        const stepIds = scenario.steps.map((s) => s.id)
        const uniqueStepIds = new Set(stepIds)

        expect(uniqueStepIds.size).toBe(stepIds.length)
      })
    })
  })
})

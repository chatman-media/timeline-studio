import { describe, expect, it } from "vitest"

import { structureScenarios } from "../../lib/structure-scenarios"

describe("Structure Scenarios", () => {
  it("должен быть массивом", () => {
    expect(Array.isArray(structureScenarios)).toBe(true)
  })

  it("должен содержать как минимум 2 сценария структуры", () => {
    expect(structureScenarios.length).toBeGreaterThanOrEqual(2)
  })

  describe("Структура сценариев", () => {
    structureScenarios.forEach((scenario, index) => {
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

        it("должен быть категории structure", () => {
          expect(scenario.category).toBe("structure")
        })

        it("должен быть для начинающих", () => {
          expect(scenario.difficulty).toBe("beginner")
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
    it("все сценарии должны требовать как минимум 1 клип", () => {
      structureScenarios.forEach((scenario) => {
        expect(scenario.requirements.minClips).toBeGreaterThanOrEqual(1)
      })
    })

    it("сценарии add-intro-outro должны требовать интро и аутро", () => {
      const scenario = structureScenarios.find((s) => s.id === "add-intro-outro")

      expect(scenario?.requirements.requiresIntro).toBe(true)
      expect(scenario?.requirements.requiresOutro).toBe(true)
    })

    it("не все сценарии требуют AI (может быть undefined)", () => {
      structureScenarios.forEach((scenario) => {
        // aiAssisted может быть boolean или undefined
        if (scenario.requirements.aiAssisted !== undefined) {
          expect(typeof scenario.requirements.aiAssisted).toBe("boolean")
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

      structureScenarios.forEach((scenario) => {
        scenario.steps.forEach((step) => {
          expect(validStepTypes).toContain(step.type)
        })
      })
    })

    it("все шаги должны иметь локализованные названия", () => {
      structureScenarios.forEach((scenario) => {
        scenario.steps.forEach((step) => {
          expect(step.name.ru).toBeDefined()
          expect(step.name.en).toBeDefined()
        })
      })
    })

    it("все шаги должны иметь конфигурацию", () => {
      structureScenarios.forEach((scenario) => {
        scenario.steps.forEach((step) => {
          expect(step.config).toBeDefined()
          expect(typeof step.config).toBe("object")
        })
      })
    })
  })

  describe("Конкретные сценарии", () => {
    it("сценарий add-intro-outro должен существовать", () => {
      const scenario = structureScenarios.find((s) => s.id === "add-intro-outro")
      expect(scenario).toBeDefined()
    })

    it("сценарий add-intro-outro должен иметь 4+ шагов", () => {
      const scenario = structureScenarios.find((s) => s.id === "add-intro-outro")
      expect(scenario?.steps.length).toBeGreaterThanOrEqual(4)
    })

    it("сценарий add-intro-outro должен содержать шаги add-intro и add-outro", () => {
      const scenario = structureScenarios.find((s) => s.id === "add-intro-outro")
      const hasIntro = scenario?.steps.some((s) => s.type === "add-intro")
      const hasOutro = scenario?.steps.some((s) => s.type === "add-outro")

      expect(hasIntro).toBe(true)
      expect(hasOutro).toBe(true)
    })

    it("сценарий add-chapters должен существовать", () => {
      const scenario = structureScenarios.find((s) => s.id === "add-chapters")
      expect(scenario).toBeDefined()
    })

    it("сценарий add-chapters должен содержать шаг add-chapters", () => {
      const scenario = structureScenarios.find((s) => s.id === "add-chapters")
      const hasChapters = scenario?.steps.some((s) => s.type === "add-chapters")

      expect(hasChapters).toBe(true)
    })

    it("сценарий add-chapters должен содержать шаг анализа контента", () => {
      const scenario = structureScenarios.find((s) => s.id === "add-chapters")
      const hasAnalyze = scenario?.steps.some((s) => s.type === "analyze-video")

      expect(hasAnalyze).toBe(true)
    })
  })

  describe("Валидация шагов", () => {
    it("обязательные шаги должны иметь validation.required=true", () => {
      structureScenarios.forEach((scenario) => {
        scenario.steps.forEach((step) => {
          if (step.validation?.required) {
            expect(step.validation.required).toBe(true)
          }
        })
      })
    })

    it("обязательные шаги должны иметь сообщения об ошибках", () => {
      structureScenarios.forEach((scenario) => {
        scenario.steps.forEach((step) => {
          if (step.validation?.required) {
            if (step.validation.errorMessage) {
              expect(step.validation.errorMessage.ru).toBeDefined()
              expect(step.validation.errorMessage.en).toBeDefined()
            }
          }
        })
      })
    })
  })

  describe("Опциональные шаги", () => {
    it("сценарии могут содержать опциональные шаги", () => {
      structureScenarios.forEach((scenario) => {
        scenario.steps.forEach((step) => {
          if (step.optional !== undefined) {
            expect(typeof step.optional).toBe("boolean")
          }
        })
      })
    })

    it("сценарий add-intro-outro должен позволять пропуск step preview", () => {
      const scenario = structureScenarios.find((s) => s.id === "add-intro-outro")
      const previewStep = scenario?.steps.find((s) => s.type === "preview")

      expect(previewStep?.optional).toBe(true)
    })
  })

  describe("Конфигурация шагов", () => {
    it("шаги select-clips должны иметь конфигурацию с allowedTypes", () => {
      structureScenarios.forEach((scenario) => {
        scenario.steps.forEach((step) => {
          if (step.type === "select-clips") {
            if (step.config.allowedTypes) {
              expect(Array.isArray(step.config.allowedTypes)).toBe(true)
            }
          }
        })
      })
    })

    it("шаги add-intro должны иметь templateType graphics", () => {
      structureScenarios.forEach((scenario) => {
        scenario.steps.forEach((step) => {
          if (step.type === "add-intro") {
            expect(step.config.templateType).toBe("graphics")
          }
        })
      })
    })

    it("шаги add-outro должны иметь templateType graphics", () => {
      structureScenarios.forEach((scenario) => {
        scenario.steps.forEach((step) => {
          if (step.type === "add-outro") {
            expect(step.config.templateType).toBe("graphics")
          }
        })
      })
    })
  })

  describe("Настройки сценариев", () => {
    it("сценарий add-intro-outro должен запрещать пропуск шагов", () => {
      const scenario = structureScenarios.find((s) => s.id === "add-intro-outro")
      expect(scenario?.settings.allowSkipSteps).toBe(false)
    })

    it("сценарий add-chapters должен позволять пропуск шагов", () => {
      const scenario = structureScenarios.find((s) => s.id === "add-chapters")
      expect(scenario?.settings.allowSkipSteps).toBe(true)
    })

    it("все сценарии должны показывать предпросмотр", () => {
      structureScenarios.forEach((scenario) => {
        expect(scenario.settings.showPreview).toBe(true)
      })
    })

    it("все сценарии должны сохранять прогресс", () => {
      structureScenarios.forEach((scenario) => {
        expect(scenario.settings.saveProgress).toBe(true)
      })
    })

    it("все сценарии должны поддерживать отмену", () => {
      structureScenarios.forEach((scenario) => {
        expect(scenario.settings.undoSupport).toBe(true)
      })
    })
  })

  describe("Время выполнения", () => {
    it("все сценарии должны быть быстрыми (менее 10 минут)", () => {
      structureScenarios.forEach((scenario) => {
        expect(scenario.estimatedTime).toBeLessThan(10)
      })
    })

    it("add-intro-outro должен быть самым быстрым", () => {
      const introOutro = structureScenarios.find((s) => s.id === "add-intro-outro")
      const chapters = structureScenarios.find((s) => s.id === "add-chapters")

      if (introOutro && chapters) {
        expect(introOutro.estimatedTime).toBeLessThanOrEqual(chapters.estimatedTime)
      }
    })
  })

  describe("Кросс-сценарий валидация", () => {
    it("все сценарии должны иметь уникальные ID", () => {
      const ids = structureScenarios.map((s) => s.id)
      const uniqueIds = new Set(ids)

      expect(uniqueIds.size).toBe(ids.length)
    })

    it("не должно быть дублирующихся шагов в одном сценарии", () => {
      structureScenarios.forEach((scenario) => {
        const stepIds = scenario.steps.map((s) => s.id)
        const uniqueStepIds = new Set(stepIds)

        expect(uniqueStepIds.size).toBe(stepIds.length)
      })
    })

    it("все сценарии должны начинаться с select-clips", () => {
      structureScenarios.forEach((scenario) => {
        expect(scenario.steps[0].type).toBe("select-clips")
      })
    })
  })
})

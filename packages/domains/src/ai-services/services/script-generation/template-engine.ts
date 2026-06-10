/**
 * Template Engine
 * Движок шаблонов для генерации сценариев
 */

import { GeneratedScript, NarrativeType, ScriptScene, ScriptStyle } from "./types"

export interface ScriptTemplate {
  id: string
  name: string
  description: string
  narrativeType: NarrativeType
  defaultStyle: ScriptStyle
  structure: TemplateStructure
}

export interface TemplateStructure {
  acts: ActTemplate[]
  requiredScenes: SceneTemplate[]
  optionalScenes?: SceneTemplate[]
  pacing: PacingTemplate
}

export interface ActTemplate {
  name: string
  description: string
  percentageOfTotal: number
  requiredElements: string[]
}

export interface SceneTemplate {
  type: string
  purpose: string
  suggestedPlacement: "beginning" | "middle" | "end"
  duration: { min: number; max: number }
}

export interface PacingTemplate {
  pattern: "steady" | "building" | "episodic" | "variable"
  keyMoments: Array<{
    percentage: number
    intensity: number
    description: string
  }>
}

export class TemplateEngine {
  private static instance: TemplateEngine | null = null
  private templates: Map<string, ScriptTemplate> = new Map()
  private isInitialized = false

  private constructor() {
    this.loadDefaultTemplates()
  }

  static getInstance(): TemplateEngine {
    if (!TemplateEngine.instance) {
      TemplateEngine.instance = new TemplateEngine()
    }
    return TemplateEngine.instance
  }

  async initialize(): Promise<void> {
    // Загрузка дополнительных шаблонов
    this.isInitialized = true
  }

  /**
   * Получить шаблон по типу повествования
   */
  getTemplateByNarrativeType(type: NarrativeType): ScriptTemplate | undefined {
    return Array.from(this.templates.values()).find((t) => t.narrativeType === type)
  }

  /**
   * Применить шаблон к сценарию
   */
  applyTemplate(template: ScriptTemplate, scenes: ScriptScene[], duration: number): GeneratedScript {
    // Базовая структура сценария по шаблону
    const script: Partial<GeneratedScript> = {
      id: `script_${Date.now()}`,
      title: "Generated Script",
      genre: [],
      duration,
      scenes: this.distributeScenesByTemplate(scenes, template, duration),
    }

    return script as GeneratedScript
  }

  /**
   * Создать кастомный шаблон
   */
  createCustomTemplate(
    name: string,
    baseTemplate: NarrativeType,
    modifications: Partial<ScriptTemplate>,
  ): ScriptTemplate {
    const base = this.getTemplateByNarrativeType(baseTemplate)
    if (!base) {
      throw new Error(`Base template ${baseTemplate} not found`)
    }

    const customTemplate: ScriptTemplate = {
      ...base,
      id: `custom_${Date.now()}`,
      name,
      ...modifications,
    }

    this.templates.set(customTemplate.id, customTemplate)
    return customTemplate
  }

  /**
   * Загрузить стандартные шаблоны
   */
  private loadDefaultTemplates(): void {
    // Three Act Structure
    this.templates.set("three_act", {
      id: "three_act",
      name: "Three Act Structure",
      description: "Classic beginning, middle, end structure",
      narrativeType: NarrativeType.THREE_ACT,
      defaultStyle: {
        narrative: "dramatic",
        visual: "cinematic",
        pacing: "medium",
      },
      structure: {
        acts: [
          {
            name: "Setup",
            description: "Introduction and establishment",
            percentageOfTotal: 25,
            requiredElements: ["exposition", "inciting_incident"],
          },
          {
            name: "Confrontation",
            description: "Rising action and conflict",
            percentageOfTotal: 50,
            requiredElements: ["obstacles", "midpoint", "complications"],
          },
          {
            name: "Resolution",
            description: "Climax and conclusion",
            percentageOfTotal: 25,
            requiredElements: ["climax", "resolution", "denouement"],
          },
        ],
        requiredScenes: [
          {
            type: "opening",
            purpose: "Hook the audience",
            suggestedPlacement: "beginning",
            duration: { min: 30, max: 120 },
          },
          {
            type: "inciting_incident",
            purpose: "Start the main conflict",
            suggestedPlacement: "beginning",
            duration: { min: 60, max: 180 },
          },
          {
            type: "climax",
            purpose: "Peak of conflict",
            suggestedPlacement: "end",
            duration: { min: 120, max: 300 },
          },
        ],
        pacing: {
          pattern: "building",
          keyMoments: [
            { percentage: 10, intensity: 0.3, description: "Hook" },
            { percentage: 25, intensity: 0.5, description: "Inciting incident" },
            { percentage: 50, intensity: 0.7, description: "Midpoint" },
            { percentage: 75, intensity: 0.9, description: "Climax" },
            { percentage: 95, intensity: 0.4, description: "Resolution" },
          ],
        },
      },
    })

    // Hero's Journey
    this.templates.set("hero_journey", {
      id: "hero_journey",
      name: "Hero's Journey",
      description: "Campbell's monomyth structure",
      narrativeType: NarrativeType.HEROS_JOURNEY,
      defaultStyle: {
        narrative: "dramatic",
        visual: "cinematic",
        pacing: "variable",
      },
      structure: {
        acts: [
          {
            name: "Departure",
            description: "Hero leaves the ordinary world",
            percentageOfTotal: 30,
            requiredElements: ["ordinary_world", "call_to_adventure", "crossing_threshold"],
          },
          {
            name: "Initiation",
            description: "Hero faces trials and transformation",
            percentageOfTotal: 50,
            requiredElements: ["tests", "approach", "ordeal", "reward"],
          },
          {
            name: "Return",
            description: "Hero returns transformed",
            percentageOfTotal: 20,
            requiredElements: ["road_back", "resurrection", "return_with_elixir"],
          },
        ],
        requiredScenes: [
          {
            type: "ordinary_world",
            purpose: "Establish hero's normal life",
            suggestedPlacement: "beginning",
            duration: { min: 60, max: 180 },
          },
          {
            type: "call_to_adventure",
            purpose: "Present the quest",
            suggestedPlacement: "beginning",
            duration: { min: 60, max: 120 },
          },
          {
            type: "ordeal",
            purpose: "Greatest fear/most difficult challenge",
            suggestedPlacement: "middle",
            duration: { min: 120, max: 240 },
          },
        ],
        pacing: {
          pattern: "episodic",
          keyMoments: [
            { percentage: 10, intensity: 0.2, description: "Ordinary world" },
            { percentage: 20, intensity: 0.4, description: "Call to adventure" },
            { percentage: 60, intensity: 1.0, description: "Ordeal" },
            { percentage: 80, intensity: 0.8, description: "Resurrection" },
            { percentage: 95, intensity: 0.3, description: "Return" },
          ],
        },
      },
    })

    // Nonlinear Structure
    this.templates.set("nonlinear", {
      id: "nonlinear",
      name: "Nonlinear Structure",
      description: "Non-chronological storytelling",
      narrativeType: NarrativeType.NONLINEAR,
      defaultStyle: {
        narrative: "artistic",
        visual: "dynamic",
        pacing: "variable",
      },
      structure: {
        acts: [
          {
            name: "Present",
            description: "Current timeline",
            percentageOfTotal: 40,
            requiredElements: ["current_conflict", "mystery"],
          },
          {
            name: "Past",
            description: "Flashbacks and history",
            percentageOfTotal: 40,
            requiredElements: ["backstory", "revelation"],
          },
          {
            name: "Convergence",
            description: "Timelines meet",
            percentageOfTotal: 20,
            requiredElements: ["resolution", "understanding"],
          },
        ],
        requiredScenes: [
          {
            type: "hook",
            purpose: "Intriguing opening",
            suggestedPlacement: "beginning",
            duration: { min: 30, max: 90 },
          },
          {
            type: "revelation",
            purpose: "Key information revealed",
            suggestedPlacement: "middle",
            duration: { min: 60, max: 120 },
          },
          {
            type: "convergence",
            purpose: "Timelines connect",
            suggestedPlacement: "end",
            duration: { min: 90, max: 180 },
          },
        ],
        pacing: {
          pattern: "variable",
          keyMoments: [
            { percentage: 5, intensity: 0.7, description: "Intriguing opening" },
            { percentage: 30, intensity: 0.5, description: "First flashback" },
            { percentage: 60, intensity: 0.8, description: "Major revelation" },
            { percentage: 85, intensity: 1.0, description: "Convergence" },
            { percentage: 95, intensity: 0.6, description: "Resolution" },
          ],
        },
      },
    })
  }

  /**
   * Распределить сцены по шаблону
   */
  private distributeScenesByTemplate(
    scenes: ScriptScene[],
    template: ScriptTemplate,
    totalDuration: number,
  ): ScriptScene[] {
    const distributedScenes: ScriptScene[] = []
    const acts = template.structure.acts

    let currentTime = 0
    let sceneIndex = 0

    for (const act of acts) {
      const actDuration = (act.percentageOfTotal / 100) * totalDuration
      const actEndTime = currentTime + actDuration

      // Добавляем сцены в акт
      while (sceneIndex < scenes.length && currentTime < actEndTime) {
        const scene = scenes[sceneIndex]

        if (currentTime + scene.duration <= actEndTime) {
          distributedScenes.push({
            ...scene,
            timestamp: currentTime,
          })
          currentTime += scene.duration
          sceneIndex++
        } else {
          break
        }
      }
    }

    // Добавляем оставшиеся сцены
    while (sceneIndex < scenes.length) {
      distributedScenes.push({
        ...scenes[sceneIndex],
        timestamp: currentTime,
      })
      currentTime += scenes[sceneIndex].duration
      sceneIndex++
    }

    return distributedScenes
  }

  /**
   * Валидировать структуру по шаблону
   */
  validateStructure(script: GeneratedScript, template: ScriptTemplate): ValidationResult {
    const issues: string[] = []
    const warnings: string[] = []

    // Проверяем обязательные сцены
    for (const requiredScene of template.structure.requiredScenes) {
      const hasScene = script.scenes.some((s) => s.type === requiredScene.type)
      if (!hasScene) {
        issues.push(`Missing required scene type: ${requiredScene.type}`)
      }
    }

    // Проверяем темп
    const pacing = template.structure.pacing
    for (const keyMoment of pacing.keyMoments) {
      const expectedTime = (keyMoment.percentage / 100) * script.duration
      const tolerance = script.duration * 0.1 // 10% допуск

      const momentScene = script.scenes.find((s) => s.timestamp && Math.abs(s.timestamp - expectedTime) < tolerance)

      if (!momentScene) {
        warnings.push(`No significant scene around ${keyMoment.description} (${keyMoment.percentage}%)`)
      }
    }

    return {
      isValid: issues.length === 0,
      issues,
      warnings,
    }
  }
}

export interface ValidationResult {
  isValid: boolean
  issues: string[]
  warnings: string[]
}

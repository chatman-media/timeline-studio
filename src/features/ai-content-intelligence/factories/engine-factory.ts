/**
 * Engine Factory для AI Content Intelligence
 * Создает и управляет движками с использованием DI
 */

import { getAIContainer } from "@/domains/ai-core/container/di-container"
import { SceneAnalysisEngine } from "@/domains/ai-services/services/scene-analysis/scene-analysis-engine"
import { ContentClassificationEngine } from "../engines/content-classification/content-classification-engine"

// Интерфейсы для движков
export interface ISceneAnalysisEngine {
  analyzeScenes(mediaFile: any, options?: any): Promise<any[]>
}

export interface IContentClassificationEngine {
  classifyContent(scenes: any[], options?: any): Promise<any>
}

export interface IScriptGenerationEngine {
  generateScript(context: any, params: any): Promise<any>
}

/**
 * Фабрика для создания движков AI Content Intelligence
 */
export class EngineFactory {
  private container = getAIContainer()

  constructor() {
    this.registerEngines()
  }

  /**
   * Регистрация всех движков в DI контейнере
   */
  private registerEngines(): void {
    // Scene Analysis Engine
    this.container.registerSingleton("SceneAnalysisEngine", () => new SceneAnalysisEngine())

    // Content Classification Engine
    this.container.registerSingleton("ContentClassificationEngine", () => new ContentClassificationEngine())

    // Script Generation Engine и его зависимости
    // this.container.registerSingleton("TemplateEngine", () => new TemplateEngine())

    // this.container.registerSingleton("DialogueGenerator", () => new DialogueGenerator())

    // this.container.registerSingleton("ScriptGenerationEngine", () => new ScriptGenerationEngine())
  }

  /**
   * Создать Scene Analysis Engine с зависимостями
   */
  async createSceneAnalysisEngine(): Promise<ISceneAnalysisEngine> {
    // Engine сам получит зависимости через getAIContainer внутри
    return await this.container.resolve<ISceneAnalysisEngine>("SceneAnalysisEngine")
  }

  /**
   * Создать Content Classification Engine
   */
  async createContentClassificationEngine(): Promise<IContentClassificationEngine> {
    return await this.container.resolve<IContentClassificationEngine>("ContentClassificationEngine")
  }

  /**
   * Создать Script Generation Engine
   */
  async createScriptGenerationEngine(): Promise<IScriptGenerationEngine> {
    return await this.container.resolve<IScriptGenerationEngine>("ScriptGenerationEngine")
  }

  /**
   * Создать все движки сразу (для pipeline)
   */
  async createAllEngines() {
    const [scene, classification, script] = await Promise.all([
      this.createSceneAnalysisEngine(),
      this.createContentClassificationEngine(),
      this.createScriptGenerationEngine(),
    ])

    return {
      sceneEngine: scene,
      classificationEngine: classification,
      scriptEngine: script,
    }
  }
}

// Singleton instance
let engineFactoryInstance: EngineFactory | null = null

export function getEngineFactory(): EngineFactory {
  if (!engineFactoryInstance) {
    engineFactoryInstance = new EngineFactory()
  }
  return engineFactoryInstance
}

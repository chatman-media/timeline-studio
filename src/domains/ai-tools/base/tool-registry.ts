/**
 * Реестр AI инструментов
 * Управляет регистрацией, поиском и загрузкой инструментов
 */

import type {
  AIIToolInfo,
  AIToolCategory,
  AIToolDomain,
  IAITool,
  IToolRegistry,
  ToolSearchFilters,
  ToolSearchMatch,
  ToolSearchResult,
} from "../types"

/**
 * Реализация реестра AI инструментов
 */
export class ToolRegistry implements IToolRegistry {
  private static instance: ToolRegistry
  private tools = new Map<string, IAITool>()
  private toolInfo = new Map<string, AIIToolInfo>()
  private domainIndex = new Map<AIToolDomain, Set<string>>()
  private categoryIndex = new Map<AIToolCategory, Set<string>>()
  private tagIndex = new Map<string, Set<string>>()

  private constructor() {
    this.initializeIndexes()
  }

  /**
   * Получить единственный экземпляр реестра
   */
  public static getInstance(): ToolRegistry {
    if (!ToolRegistry.instance) {
      ToolRegistry.instance = new ToolRegistry()
    }
    return ToolRegistry.instance
  }

  /**
   * Инициализация индексов
   */
  private initializeIndexes(): void {
    // Инициализируем индексы для всех доменов
    const domains: AIToolDomain[] = ["core", "analysis", "automation", "integration"]
    domains.forEach((domain) => {
      this.domainIndex.set(domain, new Set())
    })
  }

  /**
   * Регистрация инструмента
   */
  public register(tool: IAITool): void {
    const toolName = tool.metadata.name

    if (this.tools.has(toolName)) {
      throw new Error(`Инструмент с именем "${toolName}" уже зарегистрирован`)
    }

    // Регистрируем инструмент
    this.tools.set(toolName, tool)

    // Создаем информацию об инструменте
    const info: AIIToolInfo = {
      name: toolName,
      domain: tool.metadata.domain,
      category: tool.metadata.category,
      description: tool.metadata.description,
      version: tool.metadata.version,
      isLoaded: true,
      usageCount: 0,
    }
    this.toolInfo.set(toolName, info)

    // Обновляем индексы
    this.updateIndexes(tool, "add")

    console.log(
      `[ToolRegistry] Зарегистрирован инструмент: ${toolName} (${tool.metadata.domain}/${tool.metadata.category})`,
    )
  }

  /**
   * Отмена регистрации инструмента
   */
  public unregister(toolName: string): void {
    const tool = this.tools.get(toolName)
    if (!tool) {
      throw new Error(`Инструмент "${toolName}" не найден`)
    }

    // Удаляем из индексов
    this.updateIndexes(tool, "remove")

    // Удаляем инструмент
    this.tools.delete(toolName)
    this.toolInfo.delete(toolName)

    console.log(`[ToolRegistry] Отменена регистрация инструмента: ${toolName}`)
  }

  /**
   * Получить инструмент по имени
   */
  public get(toolName: string): IAITool | undefined {
    const tool = this.tools.get(toolName)
    if (tool) {
      // Обновляем статистику использования
      const info = this.toolInfo.get(toolName)
      if (info) {
        info.usageCount++
        info.lastUsed = new Date()
      }
    }
    return tool
  }

  /**
   * Получить инструменты по домену
   */
  public getByDomain(domain: AIToolDomain): IAITool[] {
    const toolNames = this.domainIndex.get(domain) || new Set()
    return Array.from(toolNames)
      .map((name) => this.tools.get(name))
      .filter((tool): tool is IAITool => tool !== undefined)
  }

  /**
   * Получить инструменты по категории
   */
  public getByCategory(category: AIToolCategory): IAITool[] {
    const toolNames = this.categoryIndex.get(category) || new Set()
    return Array.from(toolNames)
      .map((name) => this.tools.get(name))
      .filter((tool): tool is IAITool => tool !== undefined)
  }

  /**
   * Получить список всех инструментов
   */
  public list(): AIIToolInfo[] {
    return Array.from(this.toolInfo.values())
  }

  /**
   * Поиск инструментов
   */
  public search(query: string, filters?: ToolSearchFilters): ToolSearchResult {
    const startTime = Date.now()
    const normalizedQuery = query.toLowerCase().trim()
    const matches: ToolSearchMatch[] = []

    for (const [toolName, tool] of this.tools) {
      const info = this.toolInfo.get(toolName)
      if (!info) continue

      // Применяем фильтры
      if (filters) {
        if (filters.domain && info.domain !== filters.domain) continue
        if (filters.category && info.category !== filters.category) continue
        if (filters.author && tool.metadata.author !== filters.author) continue
        if (filters.tags && !filters.tags.some((tag) => tool.metadata.tags?.includes(tag))) continue
      }

      // Вычисляем релевантность
      const score = this.calculateRelevanceScore(tool, normalizedQuery)
      if (score > 0) {
        matches.push({
          toolName,
          score,
          matchedFields: this.getMatchedFields(tool, normalizedQuery),
          highlights: this.getHighlights(tool, normalizedQuery),
          metadata: tool.metadata,
        })
      }
    }

    // Сортируем по релевантности
    matches.sort((a, b) => b.score - a.score)

    const executionTime = Math.max(Date.now() - startTime, 1) // Минимум 1мс

    return {
      query,
      totalResults: matches.length,
      executionTime,
      tools: matches,
      appliedFilters: filters || {},
      suggestions: this.generateSuggestions(query, matches),
      metadata: {
        searchAlgorithm: "simple_text_matching",
        indexVersion: "1.0.0",
      },
    }
  }

  /**
   * Обновление индексов
   */
  private updateIndexes(tool: IAITool, operation: "add" | "remove"): void {
    const toolName = tool.metadata.name

    if (operation === "add") {
      // Добавляем в индекс домена
      let domainSet = this.domainIndex.get(tool.metadata.domain)
      if (!domainSet) {
        domainSet = new Set()
        this.domainIndex.set(tool.metadata.domain, domainSet)
      }
      domainSet.add(toolName)

      // Добавляем в индекс категории
      let categorySet = this.categoryIndex.get(tool.metadata.category)
      if (!categorySet) {
        categorySet = new Set()
        this.categoryIndex.set(tool.metadata.category, categorySet)
      }
      categorySet.add(toolName)

      // Добавляем в индекс тегов
      if (tool.metadata.tags) {
        tool.metadata.tags.forEach((tag) => {
          let tagSet = this.tagIndex.get(tag)
          if (!tagSet) {
            tagSet = new Set()
            this.tagIndex.set(tag, tagSet)
          }
          tagSet.add(toolName)
        })
      }
    } else {
      // Удаляем из индексов
      this.domainIndex.get(tool.metadata.domain)?.delete(toolName)
      this.categoryIndex.get(tool.metadata.category)?.delete(toolName)

      if (tool.metadata.tags) {
        tool.metadata.tags.forEach((tag) => {
          this.tagIndex.get(tag)?.delete(toolName)
        })
      }
    }
  }

  /**
   * Вычисление релевантности поиска
   */
  private calculateRelevanceScore(tool: IAITool, query: string): number {
    let score = 0
    const metadata = tool.metadata

    // Точное совпадение имени (высший приоритет)
    if (metadata.name.toLowerCase() === query) {
      score += 100
    } else if (metadata.name.toLowerCase().includes(query)) {
      // Дополнительные очки за позицию в имени
      if (metadata.name.toLowerCase().startsWith(query)) {
        score += 60
      } else {
        score += 40
      }
    }

    // Совпадение в описании
    if (metadata.description.toLowerCase().includes(query)) {
      score += 20
    }

    // Совпадение в тегах
    if (metadata.tags) {
      metadata.tags.forEach((tag) => {
        if (tag.toLowerCase().includes(query)) {
          score += 10
        }
      })
    }

    // Совпадение в категории
    if (metadata.category.toLowerCase().includes(query)) {
      score += 15
    }

    // Совпадение в домене
    if (metadata.domain.toLowerCase().includes(query)) {
      score += 5
    }

    return score
  }

  /**
   * Получение полей, в которых найдено совпадение
   */
  private getMatchedFields(tool: IAITool, query: string): string[] {
    const fields: string[] = []
    const metadata = tool.metadata

    if (metadata.name.toLowerCase().includes(query)) fields.push("name")
    if (metadata.description.toLowerCase().includes(query)) fields.push("description")
    if (metadata.category.toLowerCase().includes(query)) fields.push("category")
    if (metadata.domain.toLowerCase().includes(query)) fields.push("domain")
    if (metadata.tags?.some((tag) => tag.toLowerCase().includes(query))) fields.push("tags")

    return fields
  }

  /**
   * Получение подсвеченных фрагментов
   */
  private getHighlights(tool: IAITool, query: string): Record<string, string> {
    const highlights: Record<string, string> = {}
    const metadata = tool.metadata

    // Простая подсветка (в реальном проекте можно использовать более сложную логику)
    if (metadata.name.toLowerCase().includes(query)) {
      highlights.name = metadata.name.replace(new RegExp(query, "gi"), "<mark>$&</mark>")
    }

    if (metadata.description.toLowerCase().includes(query)) {
      highlights.description = metadata.description.replace(new RegExp(query, "gi"), "<mark>$&</mark>")
    }

    return highlights
  }

  /**
   * Генерация предложений для поиска
   */
  private generateSuggestions(query: string, matches: ToolSearchMatch[]): string[] {
    const suggestions: string[] = []

    // Если результатов мало, предлагаем похожие термины
    if (matches.length < 3) {
      // Простая логика предложений (можно расширить)
      const allToolNames = Array.from(this.tools.keys())
      const similarNames = allToolNames.filter(
        (name) =>
          name.toLowerCase().includes(query.toLowerCase()) ||
          this.levenshteinDistance(name.toLowerCase(), query.toLowerCase()) <= 2,
      )

      suggestions.push(...similarNames.slice(0, 5))
    }

    return suggestions
  }

  /**
   * Вычисление расстояния Левенштейна
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = []

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i]
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1]
        } else {
          matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j] + 1)
        }
      }
    }

    return matrix[str2.length][str1.length]
  }

  /**
   * Получить статистику реестра
   */
  public getStatistics() {
    const stats = {
      totalTools: this.tools.size,
      byDomain: {} as Record<AIToolDomain, number>,
      byCategory: {} as Record<string, number>,
      mostUsed: [] as Array<{ name: string; usageCount: number }>,
    }

    // Статистика по доменам
    for (const [domain, toolSet] of this.domainIndex) {
      stats.byDomain[domain] = toolSet.size
    }

    // Статистика по категориям
    for (const [category, toolSet] of this.categoryIndex) {
      stats.byCategory[category] = toolSet.size
    }

    // Самые используемые инструменты
    const sortedByUsage = Array.from(this.toolInfo.values())
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, 10)
      .map((info) => ({ name: info.name, usageCount: info.usageCount }))

    stats.mostUsed = sortedByUsage

    return stats
  }

  /**
   * Очистка реестра
   */
  public clear(): void {
    this.tools.clear()
    this.toolInfo.clear()
    this.domainIndex.clear()
    this.categoryIndex.clear()
    this.tagIndex.clear()
    this.initializeIndexes()
  }
}

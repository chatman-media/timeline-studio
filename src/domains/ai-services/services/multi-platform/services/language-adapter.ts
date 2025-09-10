/**
 * Language Adapter
 * Адаптер для многоязычной поддержки контента
 */

import { UnifiedAIService } from "@/domains/ai-core/services"
import { AdaptedContent } from "@/domains/ai-services/types"

export class LanguageAdapter {
  private aiService: UnifiedAIService
  private isInitialized = false
  private supportedLanguages: Set<string>

  constructor() {
    this.aiService = UnifiedAIService.getInstance()
    this.supportedLanguages = new Set([
      "en",
      "ru",
      "es",
      "fr",
      "de",
      "pt",
      "zh",
      "ja",
      "ko",
      "ar",
      "hi",
      "it",
      "tr",
      "pl",
      "nl",
      "sv",
      "da",
      "no",
      "fi",
      "cs",
    ])
  }

  async initialize(): Promise<void> {
    this.isInitialized = true
  }

  /**
   * Перевести контент на целевые языки
   */
  async translate(content: AdaptedContent, sourceLanguage: string, targetLanguages: string[]): Promise<void> {
    if (!this.isInitialized) {
      throw new Error("Language Adapter not initialized")
    }

    // Фильтруем только поддерживаемые языки
    const validTargets = targetLanguages.filter((lang) => this.supportedLanguages.has(lang) && lang !== sourceLanguage)

    if (validTargets.length === 0) {
      return
    }

    // Переводим метаданные
    await this.translateMetadata(content, sourceLanguage, validTargets)

    // Переводим субтитры если есть
    if (content.adaptations?.text?.captions) {
      await this.translateCaptions(content, sourceLanguage, validTargets)
    }
  }

  /**
   * Перевести метаданные контента
   */
  private async translateMetadata(
    content: AdaptedContent,
    sourceLanguage: string,
    targetLanguages: string[],
  ): Promise<void> {
    const metadata = content.metadata

    // Создаем промпты для перевода
    const translations = await Promise.all(
      targetLanguages.map(async (targetLang) => {
        const titlePrompt = `Translate this video title from ${sourceLanguage} to ${targetLang}.
        Maintain the tone and SEO keywords.
        Title: "${metadata.title || ""}"
        
        Provide only the translation, no explanation.`

        const descPrompt = `Translate this video description from ${sourceLanguage} to ${targetLang}.
        Maintain the tone, structure, and SEO keywords.
        Description: "${metadata.description || ""}"
        
        Provide only the translation, no explanation.`

        const [translatedTitle, translatedDesc] = await Promise.all([
          this.aiService
            .sendRequest("gpt-4", [{ role: "user", content: titlePrompt }], { temperature: 0.3 })
            .then((r) => r.content),
          this.aiService
            .sendRequest("gpt-4", [{ role: "user", content: descPrompt }], { temperature: 0.3 })
            .then((r) => r.content),
        ])

        // Переводим хэштеги
        const translatedHashtags = await this.translateHashtags(metadata.hashtags || [], sourceLanguage, targetLang)

        return {
          language: targetLang,
          title: translatedTitle.trim(),
          description: translatedDesc.trim(),
          hashtags: translatedHashtags,
        }
      }),
    )

    // Сохраняем переводы в контенте
    if (!content.metadata.translations) {
      content.metadata.translations = {}
    }

    translations.forEach((translation) => {
      content.metadata.translations![translation.language] = {
        title: translation.title,
        description: translation.description,
        hashtags: translation.hashtags,
      }
    })
  }

  /**
   * Перевести хэштеги
   */
  private async translateHashtags(
    hashtags: string[],
    sourceLanguage: string,
    targetLanguage: string,
  ): Promise<string[]> {
    if (hashtags.length === 0) return []

    const prompt = `Translate these hashtags from ${sourceLanguage} to ${targetLanguage}.
    Keep the # symbol and maintain relevance for social media.
    Some hashtags might be better kept in English if they're universal.
    
    Hashtags: ${hashtags.join(" ")}
    
    Return translated hashtags separated by spaces.`

    const response = await this.aiService
      .sendRequest("gpt-4", [{ role: "user", content: prompt }], { temperature: 0.3 })
      .then((r) => r.content)

    return response
      .trim()
      .split(/\s+/)
      .filter((tag) => tag.startsWith("#"))
  }

  /**
   * Перевести субтитры
   */
  private async translateCaptions(
    content: AdaptedContent,
    sourceLanguage: string,
    targetLanguages: string[],
  ): Promise<void> {
    const captions = content.adaptations?.text?.captions?.content
    if (!captions || captions.length === 0) return

    // Группируем субтитры для более эффективного перевода
    const captionBatches = this.batchCaptions(captions, 10) // По 10 субтитров

    for (const targetLang of targetLanguages) {
      const translatedBatches = await Promise.all(
        captionBatches.map((batch) => this.translateCaptionBatch(batch, sourceLanguage, targetLang)),
      )

      // Объединяем результаты
      const allTranslated = translatedBatches.flat()

      // Сохраняем переведенные субтитры
      if (!content.adaptations.text.captions.translations) {
        content.adaptations.text.captions.translations = {}
      }

      content.adaptations.text.captions.translations[targetLang] = allTranslated
    }
  }

  /**
   * Разбить субтитры на батчи
   */
  private batchCaptions(captions: any[], batchSize: number): any[][] {
    const batches = []
    for (let i = 0; i < captions.length; i += batchSize) {
      batches.push(captions.slice(i, i + batchSize))
    }
    return batches
  }

  /**
   * Перевести батч субтитров
   */
  private async translateCaptionBatch(batch: any[], sourceLanguage: string, targetLanguage: string): Promise<any[]> {
    const captionTexts = batch.map((c, i) => `${i + 1}. ${c.text}`).join("\n")

    const prompt = `Translate these video captions from ${sourceLanguage} to ${targetLanguage}.
    Maintain timing and natural speech patterns.
    Keep line numbers for reference.
    
    Captions:
    ${captionTexts}
    
    Format: Return each translation on a new line with the same numbering.`

    const response = await this.aiService
      .sendRequest("gpt-4", [{ role: "user", content: prompt }], { temperature: 0.3 })
      .then((r) => r.content)

    // Парсим ответ
    const translatedLines = response.trim().split("\n")

    return batch.map((caption, index) => {
      const translatedLine = translatedLines[index] || ""
      const translatedText = translatedLine.replace(/^\d+\.\s*/, "")

      return {
        ...caption,
        text: translatedText,
        language: targetLanguage,
      }
    })
  }

  /**
   * Определить язык контента
   */
  async detectLanguage(text: string): Promise<string> {
    const prompt = `Detect the language of this text and return only the ISO 639-1 language code (e.g., 'en', 'ru', 'es').
    
    Text: "${text.substring(0, 500)}"
    
    Return only the 2-letter language code.`

    const response = await this.aiService
      .sendRequest("gpt-4", [{ role: "user", content: prompt }], { temperature: 0, maxTokens: 10 })
      .then((r) => r.content)

    const langCode = response.trim().toLowerCase()
    return this.supportedLanguages.has(langCode) ? langCode : "en"
  }

  /**
   * Адаптировать контент культурно
   */
  async adaptCulturally(content: AdaptedContent, targetLanguage: string, targetRegion?: string): Promise<void> {
    // Адаптируем культурные ссылки, идиомы, примеры
    const culturalPrompt = `Review this content and suggest cultural adaptations for ${targetLanguage}${targetRegion ? ` (${targetRegion})` : ""}.
    
    Title: "${content.metadata.title}"
    Description: "${content.metadata.description}"
    
    Suggest:
    1. Cultural references that might need adjustment
    2. Local examples or analogies
    3. Appropriate tone adjustments
    4. Region-specific hashtags or keywords
    
    Format as JSON with suggestions.`

    const response = await this.aiService
      .sendRequest("gpt-4", [{ role: "user", content: culturalPrompt }], { temperature: 0.5 })
      .then((r) => r.content)

    try {
      const suggestions = JSON.parse(response)
      // Сохраняем культурные адаптации как метаданные
      if (!content.metadata.culturalAdaptations) {
        content.metadata.culturalAdaptations = {}
      }
      content.metadata.culturalAdaptations[targetLanguage] = suggestions
    } catch (error) {
      console.error("Failed to parse cultural adaptation suggestions:", error)
    }
  }

  /**
   * Получить поддерживаемые языки
   */
  getSupportedLanguages(): string[] {
    return Array.from(this.supportedLanguages)
  }

  /**
   * Проверить поддержку языка
   */
  isLanguageSupported(language: string): boolean {
    return this.supportedLanguages.has(language)
  }
}

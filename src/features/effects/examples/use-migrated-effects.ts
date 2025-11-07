/**
 * Пример использования мигрированных эффектов
 */

import { createLogger } from "@/lib/tauri-logger"
import {
  createEffectManager,
  createEffectRenderer,
  findMigratedEffect,
  getMigratedEffectsByCategory,
  getMigratedEffectsByTags,
  migrationStats,
} from "../index"

const logger = createLogger({ module: "UseMigratedEffects" })

// Создаем менеджер эффектов с загрузкой всех эффектов
const effectManager = createEffectManager({
  loadBasicEffects: true,
  loadMigratedEffects: true,
  loadProfessionalEffects: true,
})

// Создаем рендерер
const renderer = createEffectRenderer()

// Показываем статистику миграции
logger.info("📊 Статистика миграции эффектов:")
logger.info(`   Всего категорий: ${migrationStats.totalCategories}`)
logger.info(`   Всего эффектов: ${migrationStats.totalEffects}`)
logger.info("\n   По категориям:")
Object.entries(migrationStats.effectsByCategory).forEach(([category, count]) => {
  logger.info(`   - ${category}: ${String(count)} эффектов`)
})

// Примеры использования
logger.info("\n🎨 Примеры эффектов:")

// 1. Находим эффект по ID
const brightnessEffect = findMigratedEffect("effect_brightness")
if (brightnessEffect) {
  logger.info(`\n1. Эффект яркости: ${brightnessEffect.name.ru}`)
  logger.info(`   Категория: ${brightnessEffect.category}`)
  logger.info(`   Параметры: ${brightnessEffect.parameters.map((p) => p.name.ru).join(", ")}`)
}

// 2. Получаем все эффекты цветокоррекции
const colorEffects = getMigratedEffectsByCategory("color_correction")
logger.info(`\n2. Эффекты цветокоррекции (${colorEffects.length}):`)
colorEffects.forEach((effect) => {
  logger.info(`   - ${effect.name.ru} (${effect.id})`)
})

// 3. Находим популярные эффекты
const popularEffects = getMigratedEffectsByTags(["popular"])
logger.info(`\n3. Популярные эффекты (${popularEffects.length}):`)
popularEffects.slice(0, 5).forEach((effect) => {
  logger.info(`   - ${effect.name.ru} (${effect.category})`)
})

// 4. Применяем эффект к клипу
logger.info("\n4. Применение эффекта:")
const appliedEffect = effectManager.applyEffect("effect_sepia", "clip_123", "clip")
if (appliedEffect) {
  logger.info(`   ✅ Эффект "${appliedEffect.effectId}" применен к клипу`)

  // Настраиваем параметры
  effectManager.setEffectParameter(appliedEffect.id, "intensity", 0.8)
  logger.info("   ✅ Параметры настроены")
}

// 5. Создаем стек эффектов
logger.info("\n5. Создание стека эффектов:")
const effectStack = effectManager.createEffectStack("clip_123", "clip")
if (effectStack) {
  // Добавляем эффекты в стек
  effectManager.applyEffect("effect_brightness", effectStack.id, "clip", {})
  effectManager.applyEffect("effect_contrast", effectStack.id, "clip", {})
  effectManager.applyEffect("effect_vintage_film", effectStack.id, "clip", {})

  logger.info(`   ✅ Создан стек с ${effectStack.effects.length} эффектами`)
}

// 6. Рендеринг с эффектами (пример)
logger.info("\n6. Рендеринг эффектов:")
async function renderExample() {
  // Создаем тестовое изображение
  const canvas = document.createElement("canvas")
  canvas.width = 1920
  canvas.height = 1080
  const ctx = canvas.getContext("2d")!

  // Заполняем градиентом
  const gradient = ctx.createLinearGradient(0, 0, 1920, 1080)
  gradient.addColorStop(0, "#ff0000")
  gradient.addColorStop(0.5, "#00ff00")
  gradient.addColorStop(1, "#0000ff")
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, 1920, 1080)

  // Конвертируем в ImageBitmap
  const imageBitmap = await createImageBitmap(canvas)

  // Рендерим с эффектами
  const renderCanvas = document.createElement("canvas")
  renderCanvas.width = 1920
  renderCanvas.height = 1080

  const context = {
    source: renderCanvas,
    width: 1920,
    height: 1080,
    currentTime: 0,
    quality: "preview" as const,
  }

  const result = await renderer.renderEffectStack(effectStack.effects, new Map(), context)

  if (result.success && result.output) {
    logger.info("   ✅ Рендеринг успешен")
    logger.info(`   Время рендеринга: ${result.processingTime}ms`)
  }
}

// Запускаем рендеринг если в браузере
if (typeof window !== "undefined") {
  renderExample().catch((error) => logger.errorSync("Failed to render example", { error }))
}

// 7. Экспорт конфигурации эффектов
logger.info("\n7. Экспорт конфигурации:")
const exportData = effectManager.exportEffectStack(effectStack.id)
if (exportData) {
  logger.info("   ✅ Конфигурация экспортирована")
  logger.info(`   Размер: ${JSON.stringify(exportData).length} байт`)
}

logger.info("\n✨ Готово! Система эффектов работает с мигрированными эффектами.")

/**
 * Скрипт миграции эффектов из старой системы в новую
 * Использование: bun run src/features/effects/scripts/migrate-effects.ts
 */

import { readFileSync, writeFileSync } from "fs"
import { join } from "path"
import { createLogger } from "@/lib/tauri-logger"
import { EffectMigrator } from "../services/effect-migrator"
import type { BaseEffect } from "../types/unified-effects"

const logger = createLogger("MigrateEffects")

// Интерфейс старого эффекта
interface OldEffect {
  id: string
  name: string
  type: string
  duration: number
  category: string
  complexity: string
  tags: string[]
  description: {
    ru: string
    en: string
    [key: string]: string
  }
  ffmpegCommand?: string
  cssFilter?: string
  params?: Record<string, any>
  previewPath?: string
  labels: {
    ru: string
    en: string
    [key: string]: string
  }
  presets?: Record<
    string,
    {
      name: Record<string, string>
      params: Record<string, any>
      description?: Record<string, string>
    }
  >
}

// Путь к файлам
const DATA_DIR = join(process.cwd(), "src/features/effects/data")
const OLD_EFFECTS_PATH = join(DATA_DIR, "effects.json")
const MIGRATED_EFFECTS_DIR = join(DATA_DIR, "effects")

// Функция для чтения старых эффектов
function readOldEffects(): OldEffect[] {
  try {
    const content = readFileSync(OLD_EFFECTS_PATH, "utf-8")
    const data = JSON.parse(content)
    return data.effects || []
  } catch (error) {
    void logger.error("Ошибка чтения файла эффектов:", { error: error })
    return []
  }
}

// Функция для сохранения мигрированных эффектов
function saveMigratedEffects(category: string, effects: BaseEffect[], stats: ReturnType<EffectMigrator["getStats"]>) {
  const outputPath = join(MIGRATED_EFFECTS_DIR, `${category}-effects.json`)

  const data = {
    version: "2.0.0",
    category,
    migratedAt: new Date().toISOString(),
    stats: {
      total: stats.migrated + stats.skipped,
      migrated: stats.migrated,
      skipped: stats.skipped,
      successRate: `${stats.successRate.toFixed(2)}%`,
      errors: stats.errors,
    },
    effects,
  }

  writeFileSync(outputPath, JSON.stringify(data, null, 2))
  logger.info(`✅ Сохранено ${effects.length} эффектов в ${outputPath}`)
}

// Функция для миграции по категориям
async function migrateByCategory(category: string) {
  logger.info(`\n🔄 Начинаем миграцию категории: ${category}`)

  const migrator = new EffectMigrator()
  const oldEffects = readOldEffects()

  // Фильтруем эффекты по категории
  const categoryEffects = oldEffects.filter((e) => e.category === category)
  logger.info(`📊 Найдено ${categoryEffects.length} эффектов в категории ${category}`)

  // Мигрируем
  const migratedEffects = migrator.migrateEffects(categoryEffects)

  // Получаем статистику
  const stats = migrator.getStats()

  logger.info("\n📈 Статистика миграции:")
  logger.info(`   - Успешно мигрировано: ${stats.migrated}`)
  logger.info(`   - Пропущено: ${stats.skipped}`)
  logger.info(`   - Успешность: ${stats.successRate.toFixed(2)}%`)

  if (stats.errors.length > 0) {
    logger.info("\n⚠️  Ошибки при миграции:")
    stats.errors.forEach((err) => {
      logger.info(`   - ${err.effectId}: ${err.error}`)
    })
  }

  // Сохраняем результаты
  if (migratedEffects.length > 0) {
    saveMigratedEffects(category, migratedEffects, stats)
  }

  return { migratedEffects, stats }
}

// Функция для тестовой миграции одной категории
async function testMigration() {
  logger.info("🚀 Запуск тестовой миграции эффектов...\n")

  // Мигрируем категорию color-correction как тест
  const testCategory = "color-correction"

  try {
    const { migratedEffects, stats } = await migrateByCategory(testCategory)

    // Выводим примеры мигрированных эффектов
    if (migratedEffects.length > 0) {
      logger.info("\n📋 Примеры мигрированных эффектов:")
      migratedEffects.slice(0, 3).forEach((effect) => {
        logger.info(`\n   🎨 ${effect.name.en} (${effect.name.ru})`)
        logger.info(`      ID: ${effect.id}`)
        logger.info(`      Категория: ${effect.category}`)
        logger.info(`      Область: ${effect.scope.join(", ")}`)
        logger.info(`      Процессоры: ${Object.keys(effect.processors).join(", ")}`)
        logger.info(`      Параметры: ${effect.parameters.length}`)
      })
    }

    logger.info("\n✅ Тестовая миграция завершена успешно!")
    logger.info("\n💡 Для миграции других категорий используйте:")
    logger.info("   bun run migrate-effects.ts --category=<category>")
    logger.info("\n   Доступные категории:")
    logger.info("   - color-correction")
    logger.info("   - vintage")
    logger.info("   - artistic")
    logger.info("   - cinematic")
    logger.info("   - creative")
    logger.info("   - technical")
    logger.info("   - motion")
    logger.info("   - distortion")
  } catch (error) {
    void logger.error("❌ Ошибка при миграции:", { error: error })
  }
}

// Основная функция
async function main() {
  const args = process.argv.slice(2)
  const categoryArg = args.find((arg) => arg.startsWith("--category="))

  if (categoryArg) {
    const category = categoryArg.split("=")[1]
    await migrateByCategory(category)
  } else {
    await testMigration()
  }
}

// Запускаем
main().catch((error) => logger.errorSync("Migration failed", { error }))

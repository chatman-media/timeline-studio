#!/usr/bin/env bun

/**
 * Скрипт нормализации файлов переводов (i18n)
 *
 * Выполняет:
 * - Добавление отсутствующих ключей из базового языка
 * - Удаление лишних ключей
 * - Сортировку ключей в алфавитном порядке
 * - Форматирование JSON файлов
 *
 * Использование:
 *   bun run scripts/normalize-i18n.ts
 *   bun run scripts/normalize-i18n.ts --dry-run  # Только проверка без изменений
 */

import * as fs from "fs"
import * as path from "path"

// Цвета для вывода в консоль
const colors = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
}

const LANGUAGES = [
  "ar",
  "de",
  "en",
  "es",
  "fa",
  "fr",
  "hi",
  "it",
  "ja",
  "ko",
  "pt",
  "ru",
  "th",
  "tr",
  "zh",
]

const BASE_LANGUAGE = "en"
const LOCALES_DIR = path.join(process.cwd(), "src", "i18n", "locales")

// Флаг --dry-run
const isDryRun = process.argv.includes("--dry-run")

/**
 * Рекурсивно клонировать структуру объекта
 */
function cloneStructure(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(obj)) {
    if (value && typeof value === "object" && !Array.isArray(value)) {
      result[key] = cloneStructure(value as Record<string, unknown>)
    } else {
      // Для строк сохраняем пустую строку с пометкой
      result[key] = typeof value === "string" ? `[TODO: ${key}]` : value
    }
  }

  return result
}

/**
 * Нормализовать объект по базовой структуре
 */
function normalizeStructure(
  base: Record<string, unknown>,
  target: Record<string, unknown>
): Record<string, unknown> {
  const result: Record<string, unknown> = {}

  // Проходим по всем ключам базового языка
  for (const [key, baseValue] of Object.entries(base)) {
    if (key in target) {
      const targetValue = target[key]

      if (baseValue && typeof baseValue === "object" && !Array.isArray(baseValue)) {
        // Рекурсивно нормализуем вложенные объекты
        if (targetValue && typeof targetValue === "object" && !Array.isArray(targetValue)) {
          result[key] = normalizeStructure(
            baseValue as Record<string, unknown>,
            targetValue as Record<string, unknown>
          )
        } else {
          // Если в target не объект, берем структуру из base
          result[key] = cloneStructure(baseValue as Record<string, unknown>)
        }
      } else {
        // Сохраняем существующее значение
        result[key] = targetValue
      }
    } else {
      // Ключ отсутствует - добавляем из базы
      if (baseValue && typeof baseValue === "object" && !Array.isArray(baseValue)) {
        result[key] = cloneStructure(baseValue as Record<string, unknown>)
      } else {
        result[key] = baseValue
      }
    }
  }

  return result
}

/**
 * Сортировать ключи объекта рекурсивно
 */
function sortKeys(obj: Record<string, unknown>): Record<string, unknown> {
  const sorted: Record<string, unknown> = {}
  const keys = Object.keys(obj).sort()

  for (const key of keys) {
    const value = obj[key]
    if (value && typeof value === "object" && !Array.isArray(value)) {
      sorted[key] = sortKeys(value as Record<string, unknown>)
    } else {
      sorted[key] = value
    }
  }

  return sorted
}

/**
 * Загрузить файл перевода
 */
function loadTranslation(language: string): Record<string, unknown> | null {
  const filePath = path.join(LOCALES_DIR, `${language}.json`)

  try {
    const content = fs.readFileSync(filePath, "utf-8")
    return JSON.parse(content) as Record<string, unknown>
  } catch (error) {
    console.error(`${colors.red}❌ Ошибка при загрузке ${language}.json:${colors.reset}`, error)
    return null
  }
}

/**
 * Сохранить файл перевода
 */
function saveTranslation(language: string, data: Record<string, unknown>): void {
  const filePath = path.join(LOCALES_DIR, `${language}.json`)

  try {
    const content = JSON.stringify(data, null, 2) + "\n"
    fs.writeFileSync(filePath, content, "utf-8")
    console.log(`${colors.green}  ✅ Сохранено: ${language}.json${colors.reset}`)
  } catch (error) {
    console.error(`${colors.red}  ❌ Ошибка при сохранении ${language}.json:${colors.reset}`, error)
  }
}

/**
 * Подсчитать количество ключей в объекте
 */
function countKeys(obj: Record<string, unknown>): number {
  let count = 0

  for (const value of Object.values(obj)) {
    if (value && typeof value === "object" && !Array.isArray(value)) {
      count += countKeys(value as Record<string, unknown>)
    } else {
      count++
    }
  }

  return count
}

/**
 * Главная функция нормализации
 */
function main(): void {
  console.log(`${colors.cyan}
╔════════════════════════════════════════════════════════════╗
║          Нормализация структуры переводов (i18n)           ║
╚════════════════════════════════════════════════════════════╝
${colors.reset}`)

  if (isDryRun) {
    console.log(`${colors.yellow}⚠️  Режим проверки (--dry-run): изменения не будут сохранены\n${colors.reset}`)
  }

  // Загружаем базовый язык
  const baseTranslation = loadTranslation(BASE_LANGUAGE)

  if (!baseTranslation) {
    console.error(`${colors.red}❌ Не удалось загрузить базовый язык (${BASE_LANGUAGE})${colors.reset}`)
    process.exit(1)
  }

  const baseKeysCount = countKeys(baseTranslation)
  console.log(`${colors.blue}📋 Базовый язык: ${BASE_LANGUAGE}${colors.reset}`)
  console.log(`${colors.blue}🔑 Всего ключей: ${baseKeysCount}${colors.reset}\n`)

  // Нормализуем каждый язык
  for (const language of LANGUAGES) {
    if (language === BASE_LANGUAGE) {
      console.log(`${colors.cyan}⏭️  Пропуск ${language} (базовый язык)${colors.reset}\n`)
      continue
    }

    console.log(`${colors.yellow}🔧 Обработка ${language}...${colors.reset}`)

    const translation = loadTranslation(language)

    if (!translation) {
      console.log(`${colors.red}  ❌ Пропуск из-за ошибки загрузки${colors.reset}\n`)
      continue
    }

    const beforeCount = countKeys(translation)

    // Нормализуем структуру
    let normalized = normalizeStructure(baseTranslation, translation)

    // Сортируем ключи
    normalized = sortKeys(normalized)

    const afterCount = countKeys(normalized)

    console.log(`${colors.blue}  📊 Было ключей: ${beforeCount}${colors.reset}`)
    console.log(`${colors.blue}  📊 Стало ключей: ${afterCount}${colors.reset}`)

    if (beforeCount !== afterCount) {
      const diff = afterCount - beforeCount
      if (diff > 0) {
        console.log(`${colors.green}  ➕ Добавлено ключей: ${diff}${colors.reset}`)
      } else {
        console.log(`${colors.red}  ➖ Удалено ключей: ${Math.abs(diff)}${colors.reset}`)
      }
    }

    // Сохраняем если не dry-run
    if (!isDryRun) {
      saveTranslation(language, normalized)
    } else {
      console.log(`${colors.yellow}  ⏭️  Пропуск сохранения (dry-run)${colors.reset}`)
    }

    console.log()
  }

  console.log(`${colors.cyan}
╔════════════════════════════════════════════════════════════╗
║                        Завершено!                           ║
╚════════════════════════════════════════════════════════════╝
${colors.reset}`)

  if (isDryRun) {
    console.log(`${colors.yellow}⚠️  Это была проверка. Запустите без --dry-run для применения изменений.${colors.reset}\n`)
  } else {
    console.log(`${colors.green}✅ Все файлы переводов нормализованы!${colors.reset}`)
    console.log(`${colors.cyan}   Запустите валидацию для проверки: bun run scripts/validate-i18n.ts${colors.reset}\n`)
  }
}

// Запуск
main()

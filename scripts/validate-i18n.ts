#!/usr/bin/env bun

/**
 * Скрипт валидации структуры файлов переводов (i18n)
 *
 * Проверяет:
 * - Согласованность структуры всех языков с базовым (английским)
 * - Отсутствующие ключи
 * - Лишние ключи
 * - Пустые значения
 *
 * Использование:
 *   bun run scripts/validate-i18n.ts
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

interface ValidationResult {
  language: string
  missingKeys: string[]
  extraKeys: string[]
  emptyValues: string[]
  totalKeys: number
}

// Поддерживаемые языки
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

/**
 * Получить все ключи из объекта рекурсивно
 */
function getAllKeys(obj: Record<string, unknown>, prefix = ""): string[] {
  const keys: string[] = []

  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key

    if (value && typeof value === "object" && !Array.isArray(value)) {
      keys.push(...getAllKeys(value as Record<string, unknown>, fullKey))
    } else {
      keys.push(fullKey)
    }
  }

  return keys
}

/**
 * Получить значение по пути ключа
 */
function getValueByPath(obj: Record<string, unknown>, path: string): unknown {
  const parts = path.split(".")
  let current: unknown = obj

  for (const part of parts) {
    if (current && typeof current === "object" && part in current) {
      current = (current as Record<string, unknown>)[part]
    } else {
      return undefined
    }
  }

  return current
}

/**
 * Проверить, является ли значение пустым
 */
function isEmpty(value: unknown): boolean {
  if (value === null || value === undefined) return true
  if (typeof value === "string") return value.trim() === ""
  return false
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
 * Валидация одного языка
 */
function validateLanguage(
  language: string,
  baseKeys: string[],
  baseTranslation: Record<string, unknown>
): ValidationResult {
  const translation = loadTranslation(language)

  if (!translation) {
    return {
      language,
      missingKeys: baseKeys,
      extraKeys: [],
      emptyValues: [],
      totalKeys: 0,
    }
  }

  const keys = getAllKeys(translation)
  const baseKeySet = new Set(baseKeys)
  const keySet = new Set(keys)

  // Отсутствующие ключи
  const missingKeys = baseKeys.filter((key) => !keySet.has(key))

  // Лишние ключи
  const extraKeys = keys.filter((key) => !baseKeySet.has(key))

  // Пустые значения
  const emptyValues = keys.filter((key) => {
    const value = getValueByPath(translation, key)
    return isEmpty(value)
  })

  return {
    language,
    missingKeys,
    extraKeys,
    emptyValues,
    totalKeys: keys.length,
  }
}

/**
 * Главная функция валидации
 */
function main(): void {
  console.log(`${colors.cyan}
╔════════════════════════════════════════════════════════════╗
║          Валидация структуры переводов (i18n)              ║
╚════════════════════════════════════════════════════════════╝
${colors.reset}`)

  // Загружаем базовый язык (английский)
  const baseTranslation = loadTranslation(BASE_LANGUAGE)

  if (!baseTranslation) {
    console.error(`${colors.red}❌ Не удалось загрузить базовый язык (${BASE_LANGUAGE})${colors.reset}`)
    process.exit(1)
  }

  const baseKeys = getAllKeys(baseTranslation)
  console.log(`${colors.blue}📋 Базовый язык: ${BASE_LANGUAGE}${colors.reset}`)
  console.log(`${colors.blue}🔑 Всего ключей в базе: ${baseKeys.length}${colors.reset}\n`)

  // Валидируем каждый язык
  const results: ValidationResult[] = []
  let hasErrors = false

  for (const language of LANGUAGES) {
    if (language === BASE_LANGUAGE) continue // Пропускаем базовый язык

    console.log(`${colors.yellow}🔍 Проверка ${language}...${colors.reset}`)
    const result = validateLanguage(language, baseKeys, baseTranslation)
    results.push(result)

    // Выводим результаты
    if (result.missingKeys.length === 0 && result.extraKeys.length === 0 && result.emptyValues.length === 0) {
      console.log(`${colors.green}  ✅ Все проверки пройдены (${result.totalKeys} ключей)${colors.reset}\n`)
    } else {
      hasErrors = true

      if (result.missingKeys.length > 0) {
        console.log(`${colors.red}  ❌ Отсутствует ${result.missingKeys.length} ключей:${colors.reset}`)
        result.missingKeys.slice(0, 5).forEach((key) => {
          console.log(`${colors.red}     - ${key}${colors.reset}`)
        })
        if (result.missingKeys.length > 5) {
          console.log(`${colors.red}     ... и ещё ${result.missingKeys.length - 5}${colors.reset}`)
        }
      }

      if (result.extraKeys.length > 0) {
        console.log(`${colors.yellow}  ⚠️  Лишних ключей: ${result.extraKeys.length}${colors.reset}`)
        result.extraKeys.slice(0, 3).forEach((key) => {
          console.log(`${colors.yellow}     + ${key}${colors.reset}`)
        })
        if (result.extraKeys.length > 3) {
          console.log(`${colors.yellow}     ... и ещё ${result.extraKeys.length - 3}${colors.reset}`)
        }
      }

      if (result.emptyValues.length > 0) {
        console.log(`${colors.red}  ❌ Пустых значений: ${result.emptyValues.length}${colors.reset}`)
      }

      console.log()
    }
  }

  // Итоговая статистика
  console.log(`${colors.cyan}
╔════════════════════════════════════════════════════════════╗
║                    Итоговая статистика                      ║
╚════════════════════════════════════════════════════════════╝
${colors.reset}`)

  const totalMissing = results.reduce((sum, r) => sum + r.missingKeys.length, 0)
  const totalExtra = results.reduce((sum, r) => sum + r.extraKeys.length, 0)
  const totalEmpty = results.reduce((sum, r) => sum + r.emptyValues.length, 0)

  console.log(`${colors.blue}Всего языков проверено: ${LANGUAGES.length - 1}${colors.reset}`)
  console.log(`${colors.blue}Базовых ключей: ${baseKeys.length}${colors.reset}`)
  console.log(`${totalMissing > 0 ? colors.red : colors.green}Отсутствующих ключей: ${totalMissing}${colors.reset}`)
  console.log(`${totalExtra > 0 ? colors.yellow : colors.green}Лишних ключей: ${totalExtra}${colors.reset}`)
  console.log(`${totalEmpty > 0 ? colors.red : colors.green}Пустых значений: ${totalEmpty}${colors.reset}\n`)

  if (hasErrors) {
    console.log(`${colors.red}❌ Обнаружены проблемы! Запустите скрипт нормализации для исправления.${colors.reset}`)
    console.log(`${colors.cyan}   bun run scripts/normalize-i18n.ts${colors.reset}\n`)
    process.exit(1)
  } else {
    console.log(`${colors.green}✅ Все файлы переводов согласованы!${colors.reset}\n`)
    process.exit(0)
  }
}

// Запуск
main()

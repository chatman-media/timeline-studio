/**
 * Сервис для обнаружения и разрешения конфликтов клавиатурных сочетаний
 */

import { createLogger } from "@/lib/tauri-logger"
import type { ShortcutDefinition } from "./shortcuts-registry"

const logger = createLogger({ module: "ShortcutsConflicts" })

export interface ConflictInfo {
  key: string // Конфликтующая комбинация клавиш
  shortcuts: ShortcutDefinition[] // Shortcuts с этой комбинацией
  severity: "error" | "warning" // Тип конфликта
  context: string[] // Контексты, в которых возникает конфликт
}

export interface ConflictResolution {
  shortcutId: string
  newKeys: string[]
  reason: string
}

/**
 * Нормализует комбинацию клавиш для сравнения
 */
export function normalizeKeys(keyCombination: string): string {
  // Нормализуем строку
  const normalized = keyCombination
    .toLowerCase()
    .replace(/command|cmd|meta/g, "mod")
    .replace(/option/g, "alt")
    .replace(/control/g, "ctrl")
    .replace(/\s+/g, "")

  // Разделяем на части
  const parts = normalized.split("+")

  // Определяем порядок модификаторов
  const modifierOrder = ["ctrl", "alt", "shift", "mod"]
  const modifiers: string[] = []
  const regularKeys: string[] = []

  parts.forEach((part) => {
    if (modifierOrder.includes(part)) {
      modifiers.push(part)
    } else {
      regularKeys.push(part)
    }
  })

  // Сортируем модификаторы по заданному порядку
  modifiers.sort((a, b) => modifierOrder.indexOf(a) - modifierOrder.indexOf(b))

  // Возвращаем комбинацию: модификаторы + клавиши
  return [...modifiers, ...regularKeys].join("+")
}

/**
 * Проверяет, совпадают ли две комбинации клавиш
 */
export function keysMatch(keys1: string, keys2: string): boolean {
  return normalizeKeys(keys1) === normalizeKeys(keys2)
}

/**
 * Обнаруживает конфликты в списке shortcuts
 */
export function detectConflicts(shortcuts: ShortcutDefinition[]): ConflictInfo[] {
  const conflicts: ConflictInfo[] = []
  const keyMap = new Map<string, ShortcutDefinition[]>()

  // Группируем shortcuts по нормализованным комбинациям клавиш
  shortcuts.forEach((shortcut) => {
    if (!shortcut.enabled) return // Игнорируем отключенные shortcuts

    shortcut.keys.forEach((key) => {
      const normalized = normalizeKeys(key)
      const existing = keyMap.get(normalized) || []
      existing.push(shortcut)
      keyMap.set(normalized, existing)
    })
  })

  // Анализируем конфликты
  keyMap.forEach((shortcutsWithKey, normalizedKey) => {
    if (shortcutsWithKey.length > 1) {
      // Проверяем контексты
      const contexts = shortcutsWithKey.map((s) => s.context || "global")
      const uniqueContexts = Array.from(new Set(contexts))

      // Определяем серьезность конфликта
      const hasGlobalConflict = contexts.filter((c) => c === "global").length > 1
      const hasSameContextConflict = uniqueContexts.length < contexts.length

      let severity: "error" | "warning" = "warning"

      if (hasGlobalConflict || hasSameContextConflict) {
        severity = "error" // Конфликт в одном контексте - критично
      }

      conflicts.push({
        key: normalizedKey,
        shortcuts: shortcutsWithKey,
        severity,
        context: uniqueContexts,
      })

      logger.warn("Keyboard shortcut conflict detected:", {
        key: normalizedKey,
        shortcuts: shortcutsWithKey.map((s) => s.id),
        severity,
      })
    }
  })

  return conflicts
}

/**
 * Генерирует альтернативные комбинации клавиш
 */
export function generateAlternativeKeys(originalKeys: string[], existingKeys: Set<string>): string[] {
  const alternatives: string[] = []

  // Модификаторы для генерации альтернатив
  const modifierCombinations = [
    ["ctrl", "shift"],
    ["ctrl", "alt"],
    ["alt", "shift"],
    ["ctrl", "alt", "shift"],
  ]

  // Извлекаем основную клавишу из первой комбинации
  const firstKey = originalKeys[0]
  const baseKey = firstKey.split(/[+\s]/).pop() || firstKey

  // Генерируем альтернативы с модификаторами
  for (const mods of modifierCombinations) {
    const alternative = [...mods, baseKey].join("+")
    const normalized = normalizeKeys(alternative)

    if (!existingKeys.has(normalized)) {
      alternatives.push(alternative)
      existingKeys.add(normalized)
    }
  }

  // Если нет альтернатив с модификаторами, используем функциональные клавиши
  if (alternatives.length === 0) {
    const alternativeBaseKeys = ["F1", "F2", "F3", "F4", "F5", "F6", "F7", "F8", "F9", "F10", "F11", "F12"]

    for (const altKey of alternativeBaseKeys) {
      const normalized = normalizeKeys(altKey)
      if (!existingKeys.has(normalized)) {
        alternatives.push(altKey)
        existingKeys.add(normalized)
        break
      }
    }
  }

  return alternatives
}

/**
 * Предлагает автоматическое разрешение конфликтов
 */
export function suggestConflictResolution(
  conflict: ConflictInfo,
  allShortcuts: ShortcutDefinition[],
): ConflictResolution[] {
  const resolutions: ConflictResolution[] = []

  // Собираем все используемые комбинации клавиш
  const usedKeys = new Set<string>()
  allShortcuts.forEach((shortcut) => {
    shortcut.keys.forEach((key) => {
      usedKeys.add(normalizeKeys(key))
    })
  })

  // Для каждого конфликтующего shortcut предлагаем альтернативу
  conflict.shortcuts.forEach((shortcut, index) => {
    if (index === 0) {
      // Первый shortcut оставляем как есть
      return
    }

    const alternatives = generateAlternativeKeys(shortcut.keys, usedKeys)

    if (alternatives.length > 0) {
      resolutions.push({
        shortcutId: shortcut.id,
        newKeys: alternatives,
        reason: `Конфликт с "${conflict.shortcuts[0].name}" (${conflict.key})`,
      })
    }
  })

  return resolutions
}

/**
 * Применяет автоматическое разрешение конфликтов
 */
export function applyConflictResolutions(
  shortcuts: ShortcutDefinition[],
  resolutions: ConflictResolution[],
): ShortcutDefinition[] {
  const updated = [...shortcuts]

  resolutions.forEach((resolution) => {
    const index = updated.findIndex((s) => s.id === resolution.shortcutId)
    if (index !== -1) {
      updated[index] = {
        ...updated[index],
        keys: resolution.newKeys,
      }

      logger.info("Applied conflict resolution:", {
        shortcutId: resolution.shortcutId,
        newKeys: resolution.newKeys,
        reason: resolution.reason,
      })
    }
  })

  return updated
}

/**
 * Проверяет, есть ли конфликты для данного shortcut
 */
export function hasConflicts(shortcut: ShortcutDefinition, allShortcuts: ShortcutDefinition[]): boolean {
  const otherShortcuts = allShortcuts.filter((s) => s.id !== shortcut.id && s.enabled)

  return shortcut.keys.some((key) => {
    const normalized = normalizeKeys(key)
    return otherShortcuts.some((other) =>
      other.keys.some(
        (otherKey) =>
          normalizeKeys(otherKey) === normalized &&
          (shortcut.context === other.context || shortcut.context === "global" || other.context === "global"),
      ),
    )
  })
}

/**
 * Получает список shortcuts, конфликтующих с данным
 */
export function getConflictingShortcuts(
  shortcut: ShortcutDefinition,
  allShortcuts: ShortcutDefinition[],
): ShortcutDefinition[] {
  const conflicts: ShortcutDefinition[] = []
  const otherShortcuts = allShortcuts.filter((s) => s.id !== shortcut.id && s.enabled)

  shortcut.keys.forEach((key) => {
    const normalized = normalizeKeys(key)
    otherShortcuts.forEach((other) => {
      if (
        other.keys.some((otherKey) => normalizeKeys(otherKey) === normalized) &&
        (shortcut.context === other.context || shortcut.context === "global" || other.context === "global")
      ) {
        if (!conflicts.includes(other)) {
          conflicts.push(other)
        }
      }
    })
  })

  return conflicts
}

/**
 * Валидирует новую комбинацию клавиш
 */
export function validateNewKeys(
  newKeys: string[],
  shortcutId: string,
  allShortcuts: ShortcutDefinition[],
): { valid: boolean; error?: string; conflicts?: ShortcutDefinition[] } {
  if (newKeys.length === 0) {
    return { valid: false, error: "Комбинация клавиш не может быть пустой" }
  }

  // Проверяем на недопустимые символы
  const invalidChars = /[^a-zA-Z0-9+\-_\s⌘⌥⇧⌃←→↑↓]/
  if (newKeys.some((key) => invalidChars.test(key))) {
    return { valid: false, error: "Недопустимые символы в комбинации клавиш" }
  }

  // Проверяем на конфликты
  const shortcut = allShortcuts.find((s) => s.id === shortcutId)
  if (!shortcut) {
    return { valid: false, error: "Shortcut не найден" }
  }

  const tempShortcut = { ...shortcut, keys: newKeys }
  const conflicts = getConflictingShortcuts(tempShortcut, allShortcuts)

  if (conflicts.length > 0) {
    return {
      valid: false,
      error: `Конфликт с: ${conflicts.map((c) => c.name).join(", ")}`,
      conflicts,
    }
  }

  return { valid: true }
}

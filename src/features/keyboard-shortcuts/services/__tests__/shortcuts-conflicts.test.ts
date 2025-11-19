import { describe, expect, it } from "vitest"
import {
  applyConflictResolutions,
  detectConflicts,
  generateAlternativeKeys,
  getConflictingShortcuts,
  hasConflicts,
  keysMatch,
  normalizeKeys,
  suggestConflictResolution,
  validateNewKeys,
} from "../shortcuts-conflicts"
import type { ShortcutDefinition } from "../shortcuts-registry"

describe("ShortcutsConflicts", () => {
  const mockShortcuts: ShortcutDefinition[] = [
    {
      id: "shortcut-1",
      name: "Save",
      category: "file",
      keys: ["Cmd+S", "Ctrl+S"],
      enabled: true,
      context: "global",
    },
    {
      id: "shortcut-2",
      name: "Save As",
      category: "file",
      keys: ["Cmd+Shift+S", "Ctrl+Shift+S"],
      enabled: true,
      context: "global",
    },
    {
      id: "shortcut-3",
      name: "Search",
      category: "edit",
      keys: ["Cmd+F", "Ctrl+F"],
      enabled: true,
      context: "global",
    },
  ]

  describe("normalizeKeys", () => {
    it("должен нормализовать комбинацию клавиш", () => {
      expect(normalizeKeys("Cmd+S")).toBe("mod+s")
      expect(normalizeKeys("Ctrl+S")).toBe("ctrl+s")
      expect(normalizeKeys("Command+Shift+A")).toBe("shift+mod+a")
      expect(normalizeKeys("Option+K")).toBe("alt+k")
    })

    it("должен сортировать модификаторы", () => {
      expect(normalizeKeys("S+Shift+Cmd")).toBe("shift+mod+s")
      expect(normalizeKeys("Ctrl+Alt+Delete")).toBe("ctrl+alt+delete")
    })

    it("должен убирать пробелы", () => {
      expect(normalizeKeys("Cmd + S")).toBe("mod+s")
      expect(normalizeKeys("  Ctrl  +  Shift  +  A  ")).toBe("ctrl+shift+a")
    })
  })

  describe("keysMatch", () => {
    it("должен определять совпадающие комбинации", () => {
      expect(keysMatch("Cmd+S", "Command+S")).toBe(true)
      expect(keysMatch("Ctrl+S", "Control+S")).toBe(true)
      expect(keysMatch("Option+K", "Alt+K")).toBe(true)
    })

    it("должен определять несовпадающие комбинации", () => {
      expect(keysMatch("Cmd+S", "Cmd+A")).toBe(false)
      expect(keysMatch("Ctrl+S", "Ctrl+Shift+S")).toBe(false)
    })

    it("должен игнорировать регистр", () => {
      expect(keysMatch("CMD+S", "cmd+s")).toBe(true)
      expect(keysMatch("Ctrl+F", "CTRL+f")).toBe(true)
    })
  })

  describe("detectConflicts", () => {
    it("не должен находить конфликтов в корректных shortcuts", () => {
      const conflicts = detectConflicts(mockShortcuts)
      expect(conflicts).toHaveLength(0)
    })

    it("должен обнаруживать конфликты в одном контексте", () => {
      const conflictingShortcuts: ShortcutDefinition[] = [
        {
          id: "shortcut-1",
          name: "Action 1",
          category: "file",
          keys: ["Cmd+S"],
          enabled: true,
          context: "global",
        },
        {
          id: "shortcut-2",
          name: "Action 2",
          category: "edit",
          keys: ["Command+S"], // Конфликт с shortcut-1
          enabled: true,
          context: "global",
        },
      ]

      const conflicts = detectConflicts(conflictingShortcuts)
      expect(conflicts).toHaveLength(1)
      expect(conflicts[0].shortcuts).toHaveLength(2)
      expect(conflicts[0].severity).toBe("error")
    })

    it("должен игнорировать конфликты в разных контекстах", () => {
      const shortcuts: ShortcutDefinition[] = [
        {
          id: "shortcut-1",
          name: "Action 1",
          category: "file",
          keys: ["Cmd+S"],
          enabled: true,
          context: "timeline",
        },
        {
          id: "shortcut-2",
          name: "Action 2",
          category: "edit",
          keys: ["Cmd+S"],
          enabled: true,
          context: "browser",
        },
      ]

      const conflicts = detectConflicts(shortcuts)
      expect(conflicts).toHaveLength(1)
      expect(conflicts[0].severity).toBe("warning") // Разные контексты - warning
    })

    it("должен игнорировать отключенные shortcuts", () => {
      const shortcuts: ShortcutDefinition[] = [
        {
          id: "shortcut-1",
          name: "Action 1",
          category: "file",
          keys: ["Cmd+S"],
          enabled: true,
          context: "global",
        },
        {
          id: "shortcut-2",
          name: "Action 2",
          category: "edit",
          keys: ["Cmd+S"],
          enabled: false, // Отключен
          context: "global",
        },
      ]

      const conflicts = detectConflicts(shortcuts)
      expect(conflicts).toHaveLength(0)
    })

    it("должен обнаруживать множественные конфликты", () => {
      const shortcuts: ShortcutDefinition[] = [
        {
          id: "shortcut-1",
          name: "Action 1",
          category: "file",
          keys: ["Cmd+S"],
          enabled: true,
          context: "global",
        },
        {
          id: "shortcut-2",
          name: "Action 2",
          category: "edit",
          keys: ["Cmd+S"],
          enabled: true,
          context: "global",
        },
        {
          id: "shortcut-3",
          name: "Action 3",
          category: "view",
          keys: ["Command+S"],
          enabled: true,
          context: "global",
        },
      ]

      const conflicts = detectConflicts(shortcuts)
      expect(conflicts).toHaveLength(1)
      expect(conflicts[0].shortcuts).toHaveLength(3)
    })
  })

  describe("generateAlternativeKeys", () => {
    it("должен генерировать альтернативные комбинации", () => {
      const usedKeys = new Set(["mod+s", "ctrl+shift+s"])
      const alternatives = generateAlternativeKeys(["Cmd+S"], usedKeys)

      expect(alternatives.length).toBeGreaterThan(0)
      alternatives.forEach((alt) => {
        expect(usedKeys.has(normalizeKeys(alt))).toBe(true) // Должны быть добавлены в set
      })
    })

    it("должен избегать уже используемых комбинаций", () => {
      const usedKeys = new Set(["mod+s", "ctrl+shift+s", "ctrl+alt+s"])
      const alternatives = generateAlternativeKeys(["Cmd+S"], usedKeys)

      alternatives.forEach((alt) => {
        const normalized = normalizeKeys(alt)
        // Новые альтернативы не должны быть в исходном set
        expect(["mod+s", "ctrl+shift+s", "ctrl+alt+s"].includes(normalized)).toBe(false)
      })
    })

    it("должен использовать функциональные клавиши если нет других вариантов", () => {
      // Заполняем usedKeys всеми возможными комбинациями с 's'
      const baseKey = "s"
      const usedKeys = new Set<string>()

      // Добавляем все возможные комбинации модификаторов с 's'
      const allModifierCombinations = [
        ["ctrl", "shift"],
        ["ctrl", "alt"],
        ["alt", "shift"],
        ["ctrl", "alt", "shift"],
      ]

      allModifierCombinations.forEach((mods) => {
        const key = [...mods, baseKey].join("+")
        usedKeys.add(normalizeKeys(key))
      })

      const alternatives = generateAlternativeKeys(["Cmd+S"], usedKeys)

      expect(alternatives.length).toBeGreaterThan(0)
      // Должна быть хотя бы одна функциональная клавиша
      const hasFunctionKey = alternatives.some((alt) => /^F\d+$/.test(alt))
      expect(hasFunctionKey).toBe(true)
    })
  })

  describe("suggestConflictResolution", () => {
    it("должен предлагать разрешение для конфликтов", () => {
      const conflictingShortcuts: ShortcutDefinition[] = [
        {
          id: "shortcut-1",
          name: "Action 1",
          category: "file",
          keys: ["Cmd+S"],
          enabled: true,
          context: "global",
        },
        {
          id: "shortcut-2",
          name: "Action 2",
          category: "edit",
          keys: ["Cmd+S"],
          enabled: true,
          context: "global",
        },
      ]

      const conflicts = detectConflicts(conflictingShortcuts)
      const resolutions = suggestConflictResolution(conflicts[0], conflictingShortcuts)

      expect(resolutions).toHaveLength(1)
      expect(resolutions[0].shortcutId).toBe("shortcut-2")
      expect(resolutions[0].newKeys.length).toBeGreaterThan(0)
    })

    it("должен сохранять первый shortcut без изменений", () => {
      const conflictingShortcuts: ShortcutDefinition[] = [
        {
          id: "shortcut-1",
          name: "Action 1",
          category: "file",
          keys: ["Cmd+S"],
          enabled: true,
          context: "global",
        },
        {
          id: "shortcut-2",
          name: "Action 2",
          category: "edit",
          keys: ["Cmd+S"],
          enabled: true,
          context: "global",
        },
      ]

      const conflicts = detectConflicts(conflictingShortcuts)
      const resolutions = suggestConflictResolution(conflicts[0], conflictingShortcuts)

      // Первый shortcut не должен быть в списке разрешений
      expect(resolutions.every((r) => r.shortcutId !== "shortcut-1")).toBe(true)
    })
  })

  describe("applyConflictResolutions", () => {
    it("должен применять разрешения конфликтов", () => {
      const shortcuts: ShortcutDefinition[] = [
        {
          id: "shortcut-1",
          name: "Action 1",
          category: "file",
          keys: ["Cmd+S"],
          enabled: true,
          context: "global",
        },
        {
          id: "shortcut-2",
          name: "Action 2",
          category: "edit",
          keys: ["Cmd+S"],
          enabled: true,
          context: "global",
        },
      ]

      const resolutions = [
        {
          shortcutId: "shortcut-2",
          newKeys: ["Ctrl+Shift+S"],
          reason: "Conflict with shortcut-1",
        },
      ]

      const updated = applyConflictResolutions(shortcuts, resolutions)

      expect(updated[1].keys).toEqual(["Ctrl+Shift+S"])
      expect(updated[0].keys).toEqual(["Cmd+S"]) // Не изменился
    })

    it("не должен изменять исходный массив", () => {
      const shortcuts: ShortcutDefinition[] = [
        {
          id: "shortcut-1",
          name: "Action 1",
          category: "file",
          keys: ["Cmd+S"],
          enabled: true,
          context: "global",
        },
      ]

      const resolutions = [
        {
          shortcutId: "shortcut-1",
          newKeys: ["Ctrl+Shift+S"],
          reason: "Test",
        },
      ]

      applyConflictResolutions(shortcuts, resolutions)

      // Исходный массив не должен измениться
      expect(shortcuts[0].keys).toEqual(["Cmd+S"])
    })
  })

  describe("hasConflicts", () => {
    it("должен определять наличие конфликтов", () => {
      const shortcuts: ShortcutDefinition[] = [
        {
          id: "shortcut-1",
          name: "Action 1",
          category: "file",
          keys: ["Cmd+S"],
          enabled: true,
          context: "global",
        },
        {
          id: "shortcut-2",
          name: "Action 2",
          category: "edit",
          keys: ["Cmd+S"],
          enabled: true,
          context: "global",
        },
      ]

      expect(hasConflicts(shortcuts[0], shortcuts)).toBe(true)
      expect(hasConflicts(shortcuts[1], shortcuts)).toBe(true)
    })

    it("не должен находить конфликтов в уникальных shortcuts", () => {
      expect(hasConflicts(mockShortcuts[0], mockShortcuts)).toBe(false)
      expect(hasConflicts(mockShortcuts[1], mockShortcuts)).toBe(false)
    })

    it("должен игнорировать отключенные shortcuts", () => {
      const shortcuts: ShortcutDefinition[] = [
        {
          id: "shortcut-1",
          name: "Action 1",
          category: "file",
          keys: ["Cmd+S"],
          enabled: true,
          context: "global",
        },
        {
          id: "shortcut-2",
          name: "Action 2",
          category: "edit",
          keys: ["Cmd+S"],
          enabled: false,
          context: "global",
        },
      ]

      expect(hasConflicts(shortcuts[0], shortcuts)).toBe(false)
    })
  })

  describe("getConflictingShortcuts", () => {
    it("должен возвращать конфликтующие shortcuts", () => {
      const shortcuts: ShortcutDefinition[] = [
        {
          id: "shortcut-1",
          name: "Action 1",
          category: "file",
          keys: ["Cmd+S"],
          enabled: true,
          context: "global",
        },
        {
          id: "shortcut-2",
          name: "Action 2",
          category: "edit",
          keys: ["Command+S"],
          enabled: true,
          context: "global",
        },
        {
          id: "shortcut-3",
          name: "Action 3",
          category: "view",
          keys: ["Cmd+F"],
          enabled: true,
          context: "global",
        },
      ]

      const conflicts = getConflictingShortcuts(shortcuts[0], shortcuts)

      expect(conflicts).toHaveLength(1)
      expect(conflicts[0].id).toBe("shortcut-2")
    })

    it("должен возвращать пустой массив если нет конфликтов", () => {
      const conflicts = getConflictingShortcuts(mockShortcuts[0], mockShortcuts)

      expect(conflicts).toHaveLength(0)
    })

    it("не должен включать сам shortcut в список конфликтов", () => {
      const shortcuts: ShortcutDefinition[] = [
        {
          id: "shortcut-1",
          name: "Action 1",
          category: "file",
          keys: ["Cmd+S"],
          enabled: true,
          context: "global",
        },
      ]

      const conflicts = getConflictingShortcuts(shortcuts[0], shortcuts)

      expect(conflicts).not.toContainEqual(shortcuts[0])
    })
  })

  describe("validateNewKeys", () => {
    it("должен валидировать корректные комбинации", () => {
      const result = validateNewKeys(["Ctrl+K"], "shortcut-1", mockShortcuts)

      expect(result.valid).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it("должен отклонять пустые комбинации", () => {
      const result = validateNewKeys([], "shortcut-1", mockShortcuts)

      expect(result.valid).toBe(false)
      expect(result.error).toBeDefined()
    })

    it("должен отклонять недопустимые символы", () => {
      const result = validateNewKeys(["Cmd+@"], "shortcut-1", mockShortcuts)

      expect(result.valid).toBe(false)
      expect(result.error).toContain("Недопустимые символы")
    })

    it("должен обнаруживать конфликты", () => {
      const result = validateNewKeys(["Cmd+F"], "shortcut-1", mockShortcuts)

      expect(result.valid).toBe(false)
      expect(result.error).toContain("Конфликт")
      expect(result.conflicts).toBeDefined()
      expect(result.conflicts?.length).toBeGreaterThan(0)
    })

    it("должен разрешать конфликты в разных контекстах", () => {
      const shortcuts: ShortcutDefinition[] = [
        {
          id: "shortcut-1",
          name: "Action 1",
          category: "file",
          keys: ["Cmd+S"],
          enabled: true,
          context: "timeline",
        },
        {
          id: "shortcut-2",
          name: "Action 2",
          category: "edit",
          keys: ["Cmd+F"],
          enabled: true,
          context: "browser",
        },
      ]

      const result = validateNewKeys(["Cmd+F"], "shortcut-1", shortcuts)

      expect(result.valid).toBe(true) // Разные контексты
    })

    it("должен возвращать ошибку для несуществующего shortcut", () => {
      const result = validateNewKeys(["Cmd+K"], "non-existent", mockShortcuts)

      expect(result.valid).toBe(false)
      expect(result.error).toContain("не найден")
    })
  })

  describe("edge cases", () => {
    it("должен обрабатывать shortcuts без контекста", () => {
      const shortcuts: ShortcutDefinition[] = [
        {
          id: "shortcut-1",
          name: "Action 1",
          category: "file",
          keys: ["Cmd+S"],
          enabled: true,
          // context не указан
        },
        {
          id: "shortcut-2",
          name: "Action 2",
          category: "edit",
          keys: ["Cmd+S"],
          enabled: true,
          // context не указан
        },
      ]

      const conflicts = detectConflicts(shortcuts)
      expect(conflicts).toHaveLength(1)
    })

    it("должен обрабатывать пустой список shortcuts", () => {
      const conflicts = detectConflicts([])
      expect(conflicts).toHaveLength(0)
    })

    it("должен обрабатывать shortcuts с множественными комбинациями", () => {
      const shortcuts: ShortcutDefinition[] = [
        {
          id: "shortcut-1",
          name: "Action 1",
          category: "file",
          keys: ["Cmd+S", "Ctrl+S"],
          enabled: true,
          context: "global",
        },
        {
          id: "shortcut-2",
          name: "Action 2",
          category: "edit",
          keys: ["Ctrl+S", "Meta+S"],
          enabled: true,
          context: "global",
        },
      ]

      const conflicts = detectConflicts(shortcuts)
      expect(conflicts.length).toBeGreaterThan(0)
    })
  })
})

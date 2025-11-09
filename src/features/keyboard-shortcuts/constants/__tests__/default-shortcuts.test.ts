import { describe, expect, it } from "vitest"
import { DEFAULT_SHORTCUTS, SHORTCUTS_BY_CATEGORY } from "../default-shortcuts"

describe("DEFAULT_SHORTCUTS", () => {
  describe("Structure", () => {
    it("должен быть массивом", () => {
      expect(Array.isArray(DEFAULT_SHORTCUTS)).toBe(true)
    })

    it("должен содержать shortcuts", () => {
      expect(DEFAULT_SHORTCUTS.length).toBeGreaterThan(0)
    })

    it("каждый shortcut должен иметь обязательные поля", () => {
      DEFAULT_SHORTCUTS.forEach((shortcut) => {
        expect(shortcut).toHaveProperty("id")
        expect(shortcut).toHaveProperty("name")
        expect(shortcut).toHaveProperty("category")
        expect(shortcut).toHaveProperty("keys")

        expect(typeof shortcut.id).toBe("string")
        expect(typeof shortcut.name).toBe("string")
        expect(typeof shortcut.category).toBe("string")
        expect(Array.isArray(shortcut.keys)).toBe(true)
      })
    })

    it("каждый shortcut должен иметь описание", () => {
      DEFAULT_SHORTCUTS.forEach((shortcut) => {
        expect(shortcut.description).toBeDefined()
        expect(typeof shortcut.description).toBe("string")
        expect(shortcut.description!.length).toBeGreaterThan(0)
      })
    })
  })

  describe("Unique IDs", () => {
    it("все ID должны быть уникальными", () => {
      const ids = DEFAULT_SHORTCUTS.map((s) => s.id)
      const uniqueIds = new Set(ids)

      expect(uniqueIds.size).toBe(ids.length)
    })

    it("ID должны использовать kebab-case", () => {
      DEFAULT_SHORTCUTS.forEach((shortcut) => {
        expect(shortcut.id).toMatch(/^[a-z]+(-[a-z0-9]+)*$/)
      })
    })
  })

  describe("Categories", () => {
    it("должен содержать стандартные категории", () => {
      const categories = new Set(DEFAULT_SHORTCUTS.map((s) => s.category))

      const expectedCategories = [
        "settings",
        "file",
        "edit",
        "view",
        "timeline",
        "playback",
        "tools",
        "multicam",
        "export",
        "other",
        "browser",
        "chat",
      ]

      expectedCategories.forEach((category) => {
        expect(categories.has(category)).toBe(true)
      })
    })

    it("каждая категория должна содержать shortcuts", () => {
      const categoryCounts = DEFAULT_SHORTCUTS.reduce<Record<string, number>>((acc, shortcut) => {
        acc[shortcut.category] = (acc[shortcut.category] || 0) + 1
        return acc
      }, {})

      Object.values(categoryCounts).forEach((count) => {
        expect(count).toBeGreaterThan(0)
      })
    })
  })

  describe("Keys", () => {
    it("каждый shortcut должен иметь хотя бы одну клавишу", () => {
      DEFAULT_SHORTCUTS.forEach((shortcut) => {
        expect(shortcut.keys.length).toBeGreaterThan(0)
      })
    })

    it("ключи не должны быть пустыми строками", () => {
      DEFAULT_SHORTCUTS.forEach((shortcut) => {
        shortcut.keys.forEach((key) => {
          expect(key.length).toBeGreaterThan(0)
        })
      })
    })

    it("должен содержать валидные комбинации клавиш", () => {
      DEFAULT_SHORTCUTS.forEach((shortcut) => {
        shortcut.keys.forEach((key) => {
          // Проверяем что ключ не пустой
          expect(key.length).toBeGreaterThan(0)
        })
      })
    })

    it("shortcuts должны иметь альтернативные варианты клавиш", () => {
      // Shortcuts с ⌘ должны иметь варианты с cmd+, command+, meta+
      const cmdShortcuts = DEFAULT_SHORTCUTS.filter((s) => s.keys.some((k) => k.includes("⌘")))

      cmdShortcuts.forEach((shortcut) => {
        const hasAlternatives =
          shortcut.keys.some((k) => k.includes("cmd+")) ||
          shortcut.keys.some((k) => k.includes("command+")) ||
          shortcut.keys.some((k) => k.includes("meta+"))

        expect(hasAlternatives).toBe(true)
      })

      // Shortcuts с ⌥ должны иметь варианты с alt+, option+, opt+
      const optShortcuts = DEFAULT_SHORTCUTS.filter((s) => s.keys.some((k) => k.includes("⌥")))

      optShortcuts.forEach((shortcut) => {
        const hasAlternatives =
          shortcut.keys.some((k) => k.includes("alt+")) ||
          shortcut.keys.some((k) => k.includes("option+")) ||
          shortcut.keys.some((k) => k.includes("opt+"))

        expect(hasAlternatives).toBe(true)
      })
    })
  })

  describe("Contexts", () => {
    it("shortcuts должны иметь валидный контекст", () => {
      const validContexts = ["global", "timeline", "browser", "player", "chat", "modal"]

      DEFAULT_SHORTCUTS.forEach((shortcut) => {
        if (shortcut.context) {
          expect(validContexts).toContain(shortcut.context)
        }
      })
    })

    it("shortcuts без контекста или с global контекстом", () => {
      const globalShortcuts = DEFAULT_SHORTCUTS.filter((s) => !s.context || s.context === "global")

      // Должны быть shortcuts с глобальным контекстом
      expect(globalShortcuts.length).toBeGreaterThan(0)
    })

    it("должен содержать shortcuts для разных контекстов", () => {
      const contexts = new Set(DEFAULT_SHORTCUTS.map((s) => s.context || "global"))

      expect(contexts.size).toBeGreaterThan(1)
    })
  })

  describe("Common Shortcuts", () => {
    it("должен содержать стандартные shortcuts", () => {
      const requiredShortcuts = [
        "new-project",
        "open-project",
        "save-project",
        "undo",
        "redo",
        "cut",
        "copy",
        "paste",
        "delete",
        "select-all",
        "play-pause",
        "export-video",
      ]

      const ids = DEFAULT_SHORTCUTS.map((s) => s.id)

      requiredShortcuts.forEach((id) => {
        expect(ids).toContain(id)
      })
    })

    it("должен содержать shortcuts для настроек", () => {
      const settingsShortcuts = DEFAULT_SHORTCUTS.filter((s) => s.category === "settings")

      expect(settingsShortcuts.length).toBeGreaterThan(0)

      const ids = settingsShortcuts.map((s) => s.id)
      expect(ids).toContain("open-user-settings")
      expect(ids).toContain("open-project-settings")
      expect(ids).toContain("open-keyboard-shortcuts")
    })

    it("должен содержать shortcuts для воспроизведения", () => {
      const playbackShortcuts = DEFAULT_SHORTCUTS.filter((s) => s.category === "playback")

      expect(playbackShortcuts.length).toBeGreaterThan(0)

      const ids = playbackShortcuts.map((s) => s.id)
      expect(ids).toContain("play-pause")
      expect(ids).toContain("stop")
      expect(ids).toContain("next-frame")
      expect(ids).toContain("previous-frame")
    })

    it("должен содержать shortcuts для таймлайна", () => {
      const timelineShortcuts = DEFAULT_SHORTCUTS.filter((s) => s.category === "timeline")

      expect(timelineShortcuts.length).toBeGreaterThan(0)

      const ids = timelineShortcuts.map((s) => s.id)
      expect(ids).toContain("split-clip")
      expect(ids).toContain("delete-clip")
    })
  })

  describe("Multicam Shortcuts", () => {
    it("должен содержать shortcuts для переключения камер 1-9", () => {
      const multicamShortcuts = DEFAULT_SHORTCUTS.filter((s) => s.category === "multicam")

      expect(multicamShortcuts.length).toBe(9)

      for (let i = 1; i <= 9; i++) {
        const shortcut = multicamShortcuts.find((s) => s.id === `switch-camera-${i}`)
        expect(shortcut).toBeDefined()
        if (shortcut) {
          expect(shortcut.keys).toContain(String(i))
        }
      }
    })
  })
})

describe("SHORTCUTS_BY_CATEGORY", () => {
  it("должен быть объектом", () => {
    expect(typeof SHORTCUTS_BY_CATEGORY).toBe("object")
  })

  it("должен содержать все категории", () => {
    const categories = new Set(DEFAULT_SHORTCUTS.map((s) => s.category))

    categories.forEach((category) => {
      expect(SHORTCUTS_BY_CATEGORY).toHaveProperty(category)
    })
  })

  it("каждая категория должна содержать корректные shortcuts", () => {
    Object.entries(SHORTCUTS_BY_CATEGORY).forEach(([category, shortcuts]) => {
      expect(Array.isArray(shortcuts)).toBe(true)
      expect(shortcuts.length).toBeGreaterThan(0)

      shortcuts.forEach((shortcut) => {
        expect(shortcut.category).toBe(category)
      })
    })
  })

  it("общее количество shortcuts должно совпадать", () => {
    const totalInCategories = Object.values(SHORTCUTS_BY_CATEGORY).reduce((sum, shortcuts) => sum + shortcuts.length, 0)

    expect(totalInCategories).toBe(DEFAULT_SHORTCUTS.length)
  })

  it("не должно быть дублирующих shortcuts между категориями", () => {
    const allIds = new Set<string>()

    Object.values(SHORTCUTS_BY_CATEGORY).forEach((shortcuts) => {
      shortcuts.forEach((shortcut) => {
        expect(allIds.has(shortcut.id)).toBe(false)
        allIds.add(shortcut.id)
      })
    })
  })
})

describe("Keyboard Layout Compatibility", () => {
  it("должен содержать валидные комбинации клавиш", () => {
    DEFAULT_SHORTCUTS.forEach((shortcut) => {
      shortcut.keys.forEach((key) => {
        // Проверяем что ключ содержит валидные символы
        expect(key).toMatch(/^[a-zA-Z0-9⌘⌥⇧⌃→←↑↓+';,.\-?\s]+$/)
      })
    })
  })
})

describe("Accessibility", () => {
  it("критические системные shortcuts должны быть задокументированы", () => {
    // Проверяем что критические системные shortcuts (⌘Q) отсутствуют
    const criticalSystemShortcuts = ["⌘Q"] // Quit

    DEFAULT_SHORTCUTS.forEach((shortcut) => {
      shortcut.keys.forEach((key) => {
        expect(criticalSystemShortcuts).not.toContain(key)
      })
    })
  })

  it("каждый shortcut должен иметь описание", () => {
    DEFAULT_SHORTCUTS.forEach((shortcut) => {
      expect(shortcut.description).toBeDefined()
      if (shortcut.description) {
        expect(shortcut.description.length).toBeGreaterThan(0)
      }
    })
  })
})

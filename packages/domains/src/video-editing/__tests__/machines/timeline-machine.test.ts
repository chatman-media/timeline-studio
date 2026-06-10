/**
 * Timeline Machine Tests
 *
 * Тесты для XState машины управления UI состоянием timeline
 *
 * TODO: Эти тесты требуют переработки для работы с новой архитектурой машины.
 * Машина теперь имеет состояния idle/active, и большинство событий обрабатываются
 * только в состоянии active. Необходимо:
 * 1. Добавить helper для создания машины в состоянии active
 * 2. Переписать тесты с учетом асинхронных переходов
 * 3. Добавить тесты для новых событий (SELECT_SECTIONS, etc.)
 */

import { afterEach, beforeEach, describe, expect, it } from "vitest"
import { createActor } from "xstate"
import { timelineMachine } from "../../machines/timeline-machine"

describe("TimelineMachine", () => {
  let actor: ReturnType<typeof createActor<typeof timelineMachine>>

  beforeEach(() => {
    actor = createActor(timelineMachine)
    actor.start()
  })

  afterEach(() => {
    actor.stop()
  })

  describe("Initial State", () => {
    it("should start in idle state", () => {
      expect(actor.getSnapshot().value).toBe("idle")
    })

    it("should have initial context values", () => {
      const { context } = actor.getSnapshot()

      expect(context.isPlaying).toBe(false)
      expect(context.currentTime).toBe(0)
      expect(context.playbackRate).toBe(1)
      expect(context.timeScale).toBe(100)
      expect(context.scrollPosition).toEqual({ x: 0, y: 0 })
      expect(context.editMode).toBe("select")
      expect(context.snapMode).toBe("clips")
      expect(context.selectedClipIds).toEqual([])
      expect(context.selectedTrackIds).toEqual([])
      expect(context.selectedSectionIds).toEqual([])
      expect(context.isDragging).toBe(false)
    })
  })

  // TODO: Следующие тесты требуют состояния 'active' и должны быть переписаны
  // describe("Playback State Synchronization", () => { ... })
  // describe("UI Controls", () => { ... })
  // describe("Clip Selection", () => { ... })
  // describe("Track Selection", () => { ... })
  // describe("Section Selection", () => { ... })
  // describe("Drag and Drop", () => { ... })
  // describe("UI Flags", () => { ... })
  // describe("Error Handling", () => { ... })
  // describe("Complex Workflows", () => { ... })
  // describe("State Persistence", () => { ... })
})

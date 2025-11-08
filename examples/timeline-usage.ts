/**
 * Примеры использования Timeline Architecture v2
 *
 * Этот файл демонстрирует, как работать с новой архитектурой Timeline
 */

import {
  createTimelineClip,
  createTimelineProject,
  createTimelineSection,
  createTimelineTrack,
  type TimelineProject,
  type TrackType,
} from "../src/features/timeline/types"

import {
  calculateProjectDuration,
  canPlaceClipOnTrack,
  findSectionAtTime,
  getAllClips,
  getAllTracks,
  secondsToTimecode,
  snapToGrid,
  validateProject,
} from "../src/features/timeline/utils/utils"

// ============================================================================
// ПРИМЕР 1: Создание простого проекта
// ============================================================================

function createSimpleProject(): TimelineProject {
  // Создаем новый проект
  const project = createTimelineProject("Мой первый проект", {
    resolution: { width: 1920, height: 1080 },
    fps: 30,
    aspectRatio: "16:9",
  })

  // Создаем секцию для утреннего контента
  const morningSection = createTimelineSection(
    "Утро",
    0, // начало в 0 секунд
    300, // длительность 5 минут
    new Date("2024-01-15T08:00:00"), // реальное время съемки
  )

  // Добавляем видео трек в секцию
  const videoTrack = createTimelineTrack("Основное видео", "video", morningSection.id)
  videoTrack.order = 0

  // Добавляем аудио трек
  const audioTrack = createTimelineTrack("Основной звук", "audio", morningSection.id)
  audioTrack.order = 1

  // Добавляем треки в секцию
  morningSection.tracks = [videoTrack, audioTrack]

  // Создаем глобальный трек для музыки
  const musicTrack = createTimelineTrack("Фоновая музыка", "music")
  musicTrack.volume = 0.3 // Тише основного звука

  // Добавляем секцию и глобальный трек в проект
  project.sections = [morningSection]
  project.globalTracks = [musicTrack]

  return project
}

// ============================================================================
// ПРИМЕР 2: Добавление клипов
// ============================================================================

function addClipsToProject(project: TimelineProject): void {
  const videoTrack = getAllTracks(project).find((t) => t.type === "video")
  const audioTrack = getAllTracks(project).find((t) => t.type === "audio")
  const musicTrack = getAllTracks(project).find((t) => t.type === "music")

  if (!videoTrack || !audioTrack || !musicTrack) return

  // Добавляем видео клип
  const videoClip1 = createTimelineClip(
    "media-video-001", // ID медиафайла
    videoTrack.id,
    0, // начало на треке
    120, // длительность 2 минуты
    10, // начало в исходном файле (обрезаем первые 10 сек)
  )
  videoClip1.name = "Основная сцена"

  // Добавляем второй видео клип
  const videoClip2 = createTimelineClip(
    "media-video-002",
    videoTrack.id,
    120, // начинается после первого клипа
    60, // 1 минута
    0,
  )
  videoClip2.name = "Крупный план"

  // Добавляем аудио клипы (синхронно с видео)
  const audioClip1 = createTimelineClip("media-audio-001", audioTrack.id, 0, 120, 10)
  const audioClip2 = createTimelineClip("media-audio-002", audioTrack.id, 120, 60, 0)

  // Добавляем фоновую музыку на весь проект
  const musicClip = createTimelineClip("media-music-001", musicTrack.id, 0, 300, 0)
  musicClip.name = "Фоновая мелодия"
  musicClip.volume = 0.3

  // Добавляем клипы в треки
  videoTrack.clips = [videoClip1, videoClip2]
  audioTrack.clips = [audioClip1, audioClip2]
  musicTrack.clips = [musicClip]
}

// ============================================================================
// ПРИМЕР 3: Применение эффектов и фильтров
// ============================================================================

function applyEffectsToClips(project: TimelineProject): void {
  const videoClips = getAllClips(project).filter((clip) => {
    const track = getAllTracks(project).find((t) => t.id === clip.trackId)
    return track?.type === "video"
  })

  if (videoClips.length === 0) return

  const firstClip = videoClips[0]

  // Добавляем эффект яркости
  firstClip.effects.push({
    id: `effect-${Date.now()}`,
    effectId: "brightness-effect",
    enabled: true,
    order: 0,
  })

  // Добавляем фильтр
  firstClip.filters.push({
    id: `filter-${Date.now()}`,
    filterId: "vintage-filter",
    isEnabled: true,
    order: 0,
  })

  // Добавляем переход в конце клипа
  firstClip.transitions.push({
    id: `transition-${Date.now()}`,
    transitionId: "fade-transition",
    type: "out",
    duration: 1, // 1 секунда
    isEnabled: true,
  })
}

// ============================================================================
// ПРИМЕР 4: Работа с временем и навигацией
// ============================================================================

function demonstrateTimeOperations(project: TimelineProject): void {
  // Вычисляем общую длительность проекта
  const totalDuration = calculateProjectDuration(project)
  console.log(`Общая длительность: ${secondsToTimecode(totalDuration)} (${totalDuration} сек)`)

  // Находим секцию в определенное время
  const sectionAt90s = findSectionAtTime(project, 90)
  console.log(`Секция на 90 секунде: ${sectionAt90s?.name || "не найдена"}`)

  // Привязываем время к сетке (каждые 5 секунд)
  const snappedTime = snapToGrid(87.3, 5)
  console.log(`87.3 сек привязано к сетке 5 сек: ${snappedTime} сек`)

  // Конвертируем время в разные форматы
  const time = 125.75
  console.log(`${time} сек = ${secondsToTimecode(time, 30)} (30fps)`)
  console.log(`${time} сек = ${secondsToTimecode(time, 25)} (25fps)`)
}

// ============================================================================
// ПРИМЕР 5: Валидация и проверки
// ============================================================================

function validateAndCheckProject(project: TimelineProject): void {
  // Валидируем структуру проекта
  const errors = validateProject(project)
  if (errors.length > 0) {
    console.error("Ошибки в проекте:", errors)
    return
  }

  // Проверяем, можно ли разместить новый клип
  const videoTrack = getAllTracks(project).find((t) => t.type === "video")
  if (videoTrack) {
    const canPlace = canPlaceClipOnTrack(videoTrack, 200, 30)
    console.log(`Можно разместить клип на 200 сек длительностью 30 сек: ${canPlace}`)
  }

  // Получаем статистику проекта
  const stats = {
    totalTracks: getAllTracks(project).length,
    totalClips: getAllClips(project).length,
    totalSections: project.sections.length,
    duration: calculateProjectDuration(project),
  }
  console.log("Статистика проекта:", stats)
}

// ============================================================================
// ПРИМЕР 6: Сложный проект с несколькими секциями
// ============================================================================

function createComplexProject(): TimelineProject {
  const project = createTimelineProject("Сложный проект")

  // Создаем несколько секций для разного времени дня
  const sections = [
    createTimelineSection("Утро", 0, 600, new Date("2024-01-15T08:00:00")),
    createTimelineSection("День", 600, 900, new Date("2024-01-15T12:00:00")),
    createTimelineSection("Вечер", 1500, 600, new Date("2024-01-15T18:00:00")),
  ]

  // Для каждой секции создаем стандартный набор треков
  sections.forEach((section, index) => {
    const trackTypes: TrackType[] = ["video", "audio", "title"]

    section.tracks = trackTypes.map((type, trackIndex) => {
      const track = createTimelineTrack(`${type} ${index + 1}`, type, section.id)
      track.order = trackIndex
      return track
    })
  })

  // Добавляем глобальные треки
  project.globalTracks = [
    createTimelineTrack("Фоновая музыка", "music"),
    createTimelineTrack("Звуковые эффекты", "sfx"),
    createTimelineTrack("Закадровый голос", "voiceover"),
  ]

  project.sections = sections
  return project
}

// ============================================================================
// ДЕМОНСТРАЦИЯ ИСПОЛЬЗОВАНИЯ
// ============================================================================

export function demonstrateTimelineV2(): void {
  console.log("=== Демонстрация Timeline Architecture v2 ===\n")

  // Создаем простой проект
  console.log("1. Создание простого проекта...")
  const project = createSimpleProject()
  console.log(`Создан проект: ${project.name}`)

  // Добавляем клипы
  console.log("\n2. Добавление клипов...")
  addClipsToProject(project)
  console.log(`Добавлено клипов: ${getAllClips(project).length}`)

  // Применяем эффекты
  console.log("\n3. Применение эффектов...")
  applyEffectsToClips(project)
  const firstClip = getAllClips(project)[0]
  console.log(`Эффектов на первом клипе: ${firstClip?.effects.length || 0}`)

  // Демонстрируем работу с временем
  console.log("\n4. Работа с временем...")
  demonstrateTimeOperations(project)

  // Валидируем проект
  console.log("\n5. Валидация проекта...")
  validateAndCheckProject(project)

  // Создаем сложный проект
  console.log("\n6. Создание сложного проекта...")
  const complexProject = createComplexProject()
  console.log(`Сложный проект: ${complexProject.sections.length} секций, ${getAllTracks(complexProject).length} треков`)

  console.log("\n=== Демонстрация завершена ===")
}

// Экспортируем функции для использования в тестах
export { createSimpleProject, addClipsToProject, applyEffectsToClips, createComplexProject }

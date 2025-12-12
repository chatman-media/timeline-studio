import { useCallback, useEffect, useMemo, useState } from "react"
import type { TimelineClip, TimelineSection, TimelineTrack } from "@/features/timeline/types"
import { TimelineGroupManager } from "../services/group-manager"
import { useTimeline } from "../state/use-timeline"
import type {
  ClipGroup,
  ClipReference,
  GroupId,
  GroupOperationResult,
  GroupOptions,
  NestedSequence,
} from "../types/clip-groups"

export interface UseClipGroupsReturn {
  groups: ClipGroup[]
  groupManager: TimelineGroupManager

  // Операции с группами
  createGroup: (clips: TimelineClip[], name?: string, options?: GroupOptions) => GroupOperationResult
  ungroupClips: (groupId: GroupId) => GroupOperationResult
  addToGroup: (groupId: GroupId, clips: TimelineClip[]) => GroupOperationResult
  removeFromGroup: (groupId: GroupId, clips: TimelineClip[]) => GroupOperationResult

  // Управление состоянием
  toggleCollapse: (groupId: GroupId) => void
  lockGroup: (groupId: GroupId, locked: boolean) => void
  renameGroup: (groupId: GroupId, name: string) => void
  setGroupColor: (groupId: GroupId, color: string) => void

  // Вложенные sequences
  createNestedSequence: (clips: TimelineClip[], name?: string) => GroupOperationResult
  updateNestedSequence: (sequenceId: GroupId, updates: Partial<NestedSequence>) => void
  breakApartSequence: (sequenceId: GroupId) => GroupOperationResult

  // Запросы
  getGroupByClip: (clipId: string) => ClipGroup | undefined
  isClipInGroup: (clipId: string) => boolean
  getClipsInGroup: (groupId: GroupId) => TimelineClip[]
}

export function useClipGroups(): UseClipGroupsReturn {
  const timeline = useTimeline()
  const { project, send } = timeline
  const [groups, setGroups] = useState<ClipGroup[]>([])

  // Создаем менеджер групп
  const groupManager = useMemo(() => new TimelineGroupManager(), [])

  // Синхронизация состояния групп
  useEffect(() => {
    const updateGroups = () => {
      setGroups(groupManager.getGroupHierarchy())
    }

    // Подписываемся на события менеджера
    groupManager.addEventListener(updateGroups)

    return () => {
      groupManager.removeEventListener(updateGroups)
    }
  }, [groupManager])

  // Преобразование TimelineClip в ClipReference
  const clipToReference = useCallback((clip: TimelineClip): ClipReference => {
    return {
      clipId: clip.id,
      trackId: clip.trackId,
    }
  }, [])

  // Создание группы
  const createGroup = useCallback(
    (clips: TimelineClip[], name?: string, options?: GroupOptions): GroupOperationResult => {
      const references = clips.map(clipToReference)
      const result = groupManager.createGroup(references, name, options)

      if (result.success) {
        // Обновляем timeline state
        send({
          type: "CLIPS_GROUPED",
          groupId: result.groupId!,
          clipIds: clips.map((c) => c.id),
        })
      }

      return result
    },
    [groupManager, clipToReference, send],
  )

  // Разгруппировка
  const ungroupClips = useCallback(
    (groupId: GroupId): GroupOperationResult => {
      const result = groupManager.ungroupClips(groupId)

      if (result.success) {
        send({
          type: "CLIPS_UNGROUPED",
          groupId,
          clipIds: result.affectedClips!.map((c) => c.clipId),
        })
      }

      return result
    },
    [groupManager, send],
  )

  // Добавление в группу
  const addToGroup = useCallback(
    (groupId: GroupId, clips: TimelineClip[]): GroupOperationResult => {
      const references = clips.map(clipToReference)
      const result = groupManager.addToGroup(groupId, references)

      if (result.success) {
        send({
          type: "CLIPS_ADDED_TO_GROUP",
          groupId,
          clipIds: clips.map((c) => c.id),
        })
      }

      return result
    },
    [groupManager, clipToReference, send],
  )

  // Удаление из группы
  const removeFromGroup = useCallback(
    (groupId: GroupId, clips: TimelineClip[]): GroupOperationResult => {
      const references = clips.map(clipToReference)
      const result = groupManager.removeFromGroup(groupId, references)

      if (result.success) {
        send({
          type: "CLIPS_REMOVED_FROM_GROUP",
          groupId,
          clipIds: clips.map((c) => c.id),
        })
      }

      return result
    },
    [groupManager, clipToReference, send],
  )

  // Переключение состояния свернутости
  const toggleCollapse = useCallback(
    (groupId: GroupId) => {
      groupManager.toggleCollapse(groupId)
      send({
        type: "GROUP_TOGGLED",
        groupId,
      })
    },
    [groupManager, send],
  )

  // Блокировка группы
  const lockGroup = useCallback(
    (groupId: GroupId, locked: boolean) => {
      groupManager.lockGroup(groupId, locked)
      send({
        type: "GROUP_LOCKED",
        groupId,
        locked,
      })
    },
    [groupManager, send],
  )

  // Переименование группы
  const renameGroup = useCallback(
    (groupId: GroupId, name: string) => {
      groupManager.renameGroup(groupId, name)
    },
    [groupManager],
  )

  // Изменение цвета группы
  const setGroupColor = useCallback(
    (groupId: GroupId, color: string) => {
      groupManager.setGroupColor(groupId, color)
    },
    [groupManager],
  )

  // Создание вложенной последовательности
  const createNestedSequence = useCallback(
    (clips: TimelineClip[], name?: string): GroupOperationResult => {
      const references = clips.map(clipToReference)
      const result = groupManager.createNestedSequence(references, name)

      if (result.success) {
        send({
          type: "NESTED_SEQUENCE_CREATED",
          sequenceId: result.groupId!,
          clipIds: clips.map((c) => c.id),
        })
      }

      return result
    },
    [groupManager, clipToReference, send],
  )

  // Обновление вложенной последовательности
  const updateNestedSequence = useCallback(
    (sequenceId: GroupId, updates: Partial<NestedSequence>) => {
      groupManager.updateNestedSequence(sequenceId, updates)
    },
    [groupManager],
  )

  // Разбор вложенной последовательности
  const breakApartSequence = useCallback(
    (sequenceId: GroupId): GroupOperationResult => {
      const result = groupManager.breakApartSequence(sequenceId)

      if (result.success) {
        send({
          type: "NESTED_SEQUENCE_BROKEN",
          sequenceId,
          clipIds: result.affectedClips!.map((c) => c.clipId),
        })
      }

      return result
    },
    [groupManager, send],
  )

  // Получение группы по клипу
  const getGroupByClip = useCallback(
    (clipId: string) => {
      return groupManager.getGroupByClip(clipId)
    },
    [groupManager],
  )

  // Проверка, находится ли клип в группе
  const isClipInGroup = useCallback(
    (clipId: string) => {
      return groupManager.isClipInGroup(clipId)
    },
    [groupManager],
  )

  // Получение клипов в группе
  const getClipsInGroup = useCallback(
    (groupId: GroupId): TimelineClip[] => {
      const group = groupManager.getGroup(groupId)
      if (!group || !project) return []

      // Находим клипы по их ID в timeline state
      const clips: TimelineClip[] = []

      // Проверяем глобальные треки
      project.globalTracks.forEach((track: TimelineTrack) => {
        track.clips.forEach((clip: TimelineClip) => {
          if (group.clips.some((ref) => ref.clipId === clip.id)) {
            clips.push(clip)
          }
        })
      })

      // Проверяем треки в секциях
      project.sections.forEach((section: TimelineSection) => {
        section.tracks.forEach((track: TimelineTrack) => {
          track.clips.forEach((clip: TimelineClip) => {
            if (group.clips.some((ref) => ref.clipId === clip.id)) {
              clips.push(clip)
            }
          })
        })
      })

      return clips
    },
    [groupManager, project],
  )

  return {
    groups,
    groupManager,
    createGroup,
    ungroupClips,
    addToGroup,
    removeFromGroup,
    toggleCollapse,
    lockGroup,
    renameGroup,
    setGroupColor,
    createNestedSequence,
    updateNestedSequence,
    breakApartSequence,
    getGroupByClip,
    isClipInGroup,
    getClipsInGroup,
  }
}

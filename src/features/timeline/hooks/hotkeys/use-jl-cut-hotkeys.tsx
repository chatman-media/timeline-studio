import { useEffect } from "react"

import { shortcutsRegistry } from "@/features/keyboard-shortcuts"
import { useJLCuts } from "../editing/use-jl-cuts"
import { useTimeline } from "../state/use-timeline"

export function useJLCutHotkeys() {
  const { project, selectedClipIds = [] } = useTimeline()
  const { createJCut, createLCut, resetCut, linkClips, unlinkClips, getLinkedPair } = useJLCuts()

  // Register keyboard shortcuts for JL cut operations
  useEffect(() => {
    const shortcuts = [
      {
        id: "j-cut",
        action: () => {
          if (selectedClipIds.length === 1) {
            const clipId = selectedClipIds[0]
            const pair = getLinkedPair(clipId)
            if (pair) {
              createJCut(clipId, 0.5) // Default 0.5 second offset
            }
          }
        },
      },
      {
        id: "l-cut",
        action: () => {
          if (selectedClipIds.length === 1) {
            const clipId = selectedClipIds[0]
            const pair = getLinkedPair(clipId)
            if (pair) {
              createLCut(clipId, 0.5) // Default 0.5 second offset
            }
          }
        },
      },
      {
        id: "j-cut-large",
        action: () => {
          if (selectedClipIds.length === 1) {
            const clipId = selectedClipIds[0]
            const pair = getLinkedPair(clipId)
            if (pair) {
              createJCut(clipId, 1.5) // Larger 1.5 second offset
            }
          }
        },
      },
      {
        id: "l-cut-large",
        action: () => {
          if (selectedClipIds.length === 1) {
            const clipId = selectedClipIds[0]
            const pair = getLinkedPair(clipId)
            if (pair) {
              createLCut(clipId, 1.5) // Larger 1.5 second offset
            }
          }
        },
      },
      {
        id: "reset-cut",
        action: () => {
          if (selectedClipIds.length === 1) {
            const clipId = selectedClipIds[0]
            resetCut(clipId)
          }
        },
      },
      {
        id: "link-clips",
        action: () => {
          if (selectedClipIds.length === 2 && project) {
            const [clip1Id, clip2Id] = selectedClipIds

            // Find clips
            const allClips = [...project.globalTracks, ...project.sections.flatMap((s) => s.tracks)].flatMap(
              (track) => track.clips,
            )

            const clip1 = allClips.find((c) => c.id === clip1Id)
            const clip2 = allClips.find((c) => c.id === clip2Id)

            if (clip1 && clip2) {
              // Determine which is video and which is audio
              const track1 = [...project.globalTracks, ...project.sections.flatMap((s) => s.tracks)].find(
                (t) => t.id === clip1.trackId,
              )
              const track2 = [...project.globalTracks, ...project.sections.flatMap((s) => s.tracks)].find(
                (t) => t.id === clip2.trackId,
              )

              const isVideo1 = track1?.type === "video" || track1?.type === "image"
              const isVideo2 = track2?.type === "video" || track2?.type === "image"
              const isAudio1 = ["audio", "music", "voiceover", "sfx", "ambient"].includes(track1?.type || "")
              const isAudio2 = ["audio", "music", "voiceover", "sfx", "ambient"].includes(track2?.type || "")

              if ((isVideo1 && isAudio2) || (isAudio1 && isVideo2)) {
                const videoClipId = isVideo1 ? clip1Id : clip2Id
                const audioClipId = isAudio1 ? clip1Id : clip2Id
                linkClips(videoClipId, audioClipId)
              }
            }
          }
        },
      },
      {
        id: "unlink-clips",
        action: () => {
          if (selectedClipIds.length >= 1) {
            const clipId = selectedClipIds[0]
            unlinkClips(clipId)
          }
        },
      },
    ]

    // Регистрируем все shortcuts
    shortcuts.forEach(({ id, action }) => {
      shortcutsRegistry.updateAction(id, action)
    })

    // Очищаем actions при размонтировании
    return () => {
      shortcuts.forEach(({ id }) => {
        shortcutsRegistry.updateAction(id, undefined)
      })
    }
  }, [selectedClipIds, project, getLinkedPair, createJCut, createLCut, resetCut, linkClips, unlinkClips])
}

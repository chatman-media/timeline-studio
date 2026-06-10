import { useApp } from "@timeline-studio/core/hooks/use-app"
import type { MediaFile } from "@timeline-studio/core/types"
import type { MediaItem } from "@/types/generated/tauri-bindings"

export function useMusicFiles() {
  const { projectState, executeCommand } = useApp()

  const musicFiles: MediaItem[] = projectState?.project?.media_pool?.items
    ? Object.values(projectState.project.media_pool.items).filter((item): item is MediaItem => {
        return (
          item !== undefined &&
          item !== null &&
          typeof item === "object" &&
          "media_type" in item &&
          item.media_type === "Audio"
        )
      })
    : []

  const addMusicFile = async (path: string) => {
    return executeCommand({
      type: "AddMedia",
      params: { path, media_type: "Audio" },
    })
  }

  const removeMusicFile = async (mediaId: string) => {
    return executeCommand({
      type: "RemoveMedia",
      params: { media_id: mediaId },
    })
  }

  const updateMusicFile = async (mediaId: string, updates: any) => {
    return executeCommand({
      type: "UpdateMedia",
      params: { media_id: mediaId, updates },
    })
  }

  const updateMusicFiles = async (files: MediaFile[]) => {
    for (const file of files) {
      executeCommand({
        type: "AddMedia",
        params: {
          path: file.path,
          media_type: "Audio",
        },
      })
    }
  }

  return {
    musicFiles,
    addMusicFile,
    removeMusicFile,
    updateMusicFile,
    updateMusicFiles,
  }
}

import type { MediaItem } from "@/types/generated/tauri-bindings"
import { useApp } from "./use-app"

export function useMediaFiles() {
  const { projectState, executeCommand } = useApp()

  const mediaFiles: MediaItem[] = projectState?.project?.media_pool?.items
    ? Object.values(projectState.project.media_pool.items).filter((item): item is MediaItem => item !== undefined)
    : []

  const addMediaFile = async (path: string, mediaType: "Video" | "Audio" | "Image") => {
    return executeCommand({
      type: "AddMedia",
      params: { path, media_type: mediaType },
    })
  }

  const removeMediaFile = async (mediaId: string) => {
    return executeCommand({
      type: "RemoveMedia",
      params: { media_id: mediaId },
    })
  }

  const updateMediaFile = async (mediaId: string, updates: any) => {
    return executeCommand({
      type: "UpdateMedia",
      params: { media_id: mediaId, updates },
    })
  }

  return {
    mediaFiles,
    addMediaFile,
    removeMediaFile,
    updateMediaFile,
  }
}

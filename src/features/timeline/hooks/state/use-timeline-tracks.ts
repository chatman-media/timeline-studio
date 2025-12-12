import { useMemo } from "react"

// Temporary implementation until timeline integration
export function useTimelineTracks() {
  // Mock data for now
  const audioTracks = useMemo(() => {
    return [
      {
        id: "audio1",
        name: "Audio Track 1",
        type: "stereo" as const,
        trackId: "audio1",
      },
      {
        id: "audio2",
        name: "Audio Track 2",
        type: "mono" as const,
        trackId: "audio2",
      },
    ]
  }, [])

  const videoTracks = useMemo(() => {
    return [
      {
        id: "video1",
        name: "Video Track 1",
        trackId: "video1",
      },
    ]
  }, [])

  return {
    audioTracks,
    videoTracks,
    allTracks: [...videoTracks, ...audioTracks],
  }
}

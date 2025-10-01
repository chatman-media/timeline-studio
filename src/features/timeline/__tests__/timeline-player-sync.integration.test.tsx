import { render } from "@testing-library/react"
import React from "react"
import { vi } from "vitest"

// Enable timeline services in this test scope
vi.mock("@/shared/config/service-config", () => ({
  isServiceEnabled: (_: any) => true,
}))

import { getBackendSync } from "@/features/app-state/services/backend-sync"
import { timelinePlayerSync } from "@/features/timeline/services/timeline-player-sync"
import { PlayerProvider, usePlayer } from "@/features/video-player/services/player-provider"

function makeClip() {
  return {
    id: "clip-1",
    name: "Test Clip",
    startTime: 10,
    duration: 20,
    mediaId: "media-1",
    mediaStartTime: 5,
    effects: [],
    filters: [],
  }
}

describe("timelinePlayerSync integration", () => {
  it("routes selected clip sync to backend via player context", async () => {
    // Prepare clip
    const clip = makeClip()

    // Create a small component that grabs usePlayer() and sets it as timelinePlayerSync context
    function TestComponent() {
      const player = usePlayer()
      React.useEffect(() => {
        timelinePlayerSync.setPlayerContext(player as any)
        // Trigger sync once player context is set
        void timelinePlayerSync.syncSelectedClip(clip as any)
      }, [player])

      return <div />
    }

    // Render PlayerProvider with the TestComponent to run hook-based logic
    render(
      <PlayerProvider>
        <TestComponent />
      </PlayerProvider>,
    )

    // wait for async operations to flush
    await new Promise((r) => setTimeout(r, 0))

    // Verify backend received calls
    const backend = getBackendSync()
    expect(backend.executeCommand).toHaveBeenCalled()

    // Find calls for set source, select clip, and set media
    const calls = (backend.executeCommand as any).mock.calls.map((c: any[]) => c[0].type)
    expect(calls).toContain("PlayerSetSource")
    expect(calls).toContain("PlayerSelectClip")
    expect(calls).toContain("PlayerSetMedia")
  })
})

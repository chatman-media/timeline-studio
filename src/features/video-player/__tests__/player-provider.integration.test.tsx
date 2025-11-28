import { render, waitFor } from "@testing-library/react"
import { vi } from "vitest"
import { container } from "@/core/container"

let PlayerProvider: any
let usePlayer: any

// Ensure domain services are enabled in tests so PlayerProvider doesn't early-return
vi.mock("@/shared/config/service-config", () => ({
  isServiceEnabled: (_: any) => true,
}))

function TestComponent() {
  const player = usePlayer()

  return (
    <div>
      <button onClick={() => player.play()}>Play</button>
      <button onClick={() => player.pause()}>Pause</button>
      <button onClick={() => player.seek(12)}>Seek</button>
    </div>
  )
}

describe("PlayerProvider integration", () => {
  it("calls backend executeCommand on play/pause/seek", async () => {
    // Import the real PlayerProvider implementation (bypass global mocks in setup)
    const mod = await vi.importActual<typeof import("@/features/video-player/services/player-provider")>(
      "@/features/video-player/services/player-provider",
    )
    PlayerProvider = mod.PlayerProvider
    usePlayer = mod.usePlayer

    const backend = container.getBackend()
    // Setup mock to resolve successfully with proper success response
    ;(backend.executeCommand as any).mockResolvedValue({ success: true })

    const { getByText } = render(
      <PlayerProvider>
        <TestComponent />
      </PlayerProvider>,
    )

    getByText("Play").click()
    getByText("Pause").click()
    getByText("Seek").click()

    // Wait for all commands to be executed
    await waitFor(
      () => {
        const calls = (backend.executeCommand as any).mock.calls
        expect(calls.length).toBeGreaterThanOrEqual(3)
      },
      { timeout: 2000 },
    )

    // Verify called with expected commands
    const calls = (backend.executeCommand as any).mock.calls
    expect(calls[0][0].type).toBe("Play")
    expect(calls[1][0].type).toBe("Pause")
    expect(calls[2][0].type).toBe("Seek")
    expect(calls[2][0].params.time).toBe(12)
  })
})

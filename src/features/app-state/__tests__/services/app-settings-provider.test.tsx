import { render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { AppProvider, useApp } from "../../services/app-provider"

const mockAppState = {
  context: {
    isConnected: false,
    error: null,
    projectState: { currentProject: { path: null, name: "Test Project", isDirty: false } },
  },
  matches: vi.fn((state) => state === "disconnected"),
}

const mockSend = vi.fn()
const mockAppActor = {
  getSnapshot: vi.fn(() => mockAppState),
  subscribe: vi.fn(() => ({ unsubscribe: vi.fn() })),
  send: mockSend,
}

vi.mock("@/domains/project-management/services/project-management-orchestrator", () => ({
  getProjectManagementOrchestrator: vi.fn(() => ({
    getAppActor: vi.fn(() => mockAppActor),
    getAppState: vi.fn(() => mockAppState),
    subscribeToAppState: vi.fn(() => () => {}),
  })),
}))

vi.mock("@xstate/react", () => ({
  useSelector: vi.fn((actor, selector) => selector(mockAppState)),
}))

vi.mock("../../services/backend-sync", () => ({
  getBackendSync: vi.fn(() => ({
    executeCommand: vi.fn().mockResolvedValue({ success: true }),
  })),
}))

const TestComponent = () => {
  const { isConnected, isConnecting, connectionError, projectState, executeCommand } = useApp()
  return (
    <div>
      <div data-testid="connected">{isConnected ? "Connected" : "Disconnected"}</div>
      <div data-testid="connecting">{isConnecting ? "Connecting" : "Not Connecting"}</div>
      <div data-testid="error">{connectionError ?? "No Error"}</div>
      <div data-testid="project-name">{(projectState as any)?.currentProject?.name ?? "No Project"}</div>
      <div data-testid="has-execute">{typeof executeCommand === "function" ? "yes" : "no"}</div>
    </div>
  )
}

describe("AppProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should render children and provide context", () => {
    render(
      <AppProvider>
        <div data-testid="child">Child</div>
      </AppProvider>,
    )
    expect(screen.getByTestId("child")).toBeInTheDocument()
  })

  it("should provide app context to children", () => {
    render(
      <AppProvider>
        <TestComponent />
      </AppProvider>,
    )
    expect(screen.getByTestId("connected")).toHaveTextContent("Disconnected")
    expect(screen.getByTestId("connecting")).toHaveTextContent("Not Connecting")
    expect(screen.getByTestId("error")).toHaveTextContent("No Error")
    expect(screen.getByTestId("project-name")).toHaveTextContent("Test Project")
  })

  it("should provide executeCommand function", () => {
    render(
      <AppProvider>
        <TestComponent />
      </AppProvider>,
    )
    expect(screen.getByTestId("has-execute")).toHaveTextContent("yes")
  })

  it("should provide disconnect functionality", () => {
    const DisconnectComponent = () => {
      const { disconnect } = useApp()
      return (
        <button data-testid="disconnect" onClick={disconnect}>
          Disconnect
        </button>
      )
    }
    render(
      <AppProvider>
        <DisconnectComponent />
      </AppProvider>,
    )
    screen.getByTestId("disconnect").click()
    expect(mockSend).toHaveBeenCalledWith({ type: "DISCONNECT" })
  })

  it("should provide retry connection functionality", () => {
    const RetryComponent = () => {
      const { retryConnection } = useApp()
      return (
        <button data-testid="retry" onClick={retryConnection}>
          Retry
        </button>
      )
    }
    render(
      <AppProvider>
        <RetryComponent />
      </AppProvider>,
    )
    screen.getByTestId("retry").click()
    expect(mockSend).toHaveBeenCalledWith({ type: "RETRY_CONNECTION" })
  })
})

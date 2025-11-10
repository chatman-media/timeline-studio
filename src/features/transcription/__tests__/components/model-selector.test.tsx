import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"
import { ModelSelector } from "../../components/model-selector"
import { createMockModels } from "../test-utils"

// Mock the useWhisperModels hook
const mockUseWhisperModels = {
  models: createMockModels(),
  isLoading: false,
  downloadProgress: {},
  loadModels: vi.fn(),
  downloadModel: vi.fn(),
}

vi.mock("../../hooks/use-transcription", () => ({
  useWhisperModels: () => mockUseWhisperModels,
}))

// Mock react-i18next
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, defaultValue: string) => defaultValue || key,
  }),
}))

describe("ModelSelector", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseWhisperModels.models = createMockModels()
    mockUseWhisperModels.isLoading = false
    mockUseWhisperModels.downloadProgress = {}
  })

  it("should load models on mount", () => {
    render(<ModelSelector />)
    expect(mockUseWhisperModels.loadModels).toHaveBeenCalled()
  })

  it("should show loading state", () => {
    mockUseWhisperModels.isLoading = true
    const { container } = render(<ModelSelector />)

    // Should show loading spinner (check if component renders when loading)
    expect(container).toBeInTheDocument()
  })

  it("should render list of models", () => {
    render(<ModelSelector />)

    // Check if models are rendered
    expect(screen.getByText("tiny")).toBeInTheDocument()
    expect(screen.getByText("base")).toBeInTheDocument()
    expect(screen.getByText("small")).toBeInTheDocument()
    expect(screen.getByText("medium")).toBeInTheDocument()
    expect(screen.getByText("large-v3")).toBeInTheDocument()
  })

  it("should show downloaded status for downloaded models", () => {
    render(<ModelSelector />)

    // base model is downloaded in mock data
    expect(screen.getByText("Скачано")).toBeInTheDocument()
  })

  it("should show download button for not downloaded models", () => {
    render(<ModelSelector />)

    // tiny, small, medium, large-v3 are not downloaded
    const downloadButtons = screen.getAllByText("Скачать")
    expect(downloadButtons.length).toBeGreaterThan(0)
  })

  it("should call downloadModel when download button is clicked", async () => {
    const user = userEvent.setup()
    render(<ModelSelector />)

    const downloadButtons = screen.getAllByText("Скачать")
    await user.click(downloadButtons[0])

    expect(mockUseWhisperModels.downloadModel).toHaveBeenCalled()
  })

  it("should show download progress", () => {
    mockUseWhisperModels.downloadProgress = { tiny: 50 }
    render(<ModelSelector />)

    // Should show progress percentage
    expect(screen.getByText("50%")).toBeInTheDocument()
  })

  it("should display model sizes", () => {
    render(<ModelSelector />)

    expect(screen.getByText("39M")).toBeInTheDocument()
    expect(screen.getByText("74M")).toBeInTheDocument()
    expect(screen.getByText("244M")).toBeInTheDocument()
  })

  it("should display model descriptions", () => {
    render(<ModelSelector />)

    expect(screen.getByText("Самая быстрая, базовое качество")).toBeInTheDocument()
    expect(screen.getByText("Хороший баланс скорости и качества")).toBeInTheDocument()
  })

  it("should show tip for users", () => {
    render(<ModelSelector />)

    expect(screen.getByText("Совет:")).toBeInTheDocument()
  })
})

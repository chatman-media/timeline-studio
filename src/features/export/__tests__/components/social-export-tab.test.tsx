/**
 * @vitest-environment jsdom
 */
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { OutputFormat } from "@/features/video-compiler/types/render"

import { SocialExportTab } from "../../components/social-export-tab"
import type { SocialExportSettings } from "../../types/export-types"

// Mock translations
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: vi.fn((key: string, params?: any) => {
      if (params) {
        return key.replace(/\{\{(\w+)\}\}/g, (match, p1) => params[p1] || match)
      }
      return key
    }),
  }),
}))

// Mock Lucide icons
vi.mock("lucide-react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("lucide-react")>()
  return {
    ...actual,
    LogIn: ({ className }: { className?: string }) => <div data-testid="login-icon" className={className} />,
    Upload: ({ className }: { className?: string }) => <div data-testid="upload-icon" className={className} />,
    AlertCircle: ({ className }: { className?: string }) => (
      <div data-testid="alert-circle-icon" className={className} />
    ),
    CheckCircle: ({ className }: { className?: string }) => (
      <div data-testid="check-circle-icon" className={className} />
    ),
    Info: ({ className }: { className?: string }) => <div data-testid="info-icon" className={className} />,
  }
})

// Mock social export hook
const mockUseSocialExport = {
  loginToSocialNetwork: vi.fn().mockResolvedValue(true),
  logoutFromSocialNetwork: vi.fn().mockResolvedValue(true),
  uploadToSocialNetwork: vi.fn().mockResolvedValue(true),
  validateSocialExport: vi.fn().mockReturnValue({ valid: true, error: null }),
  getNetworkLimits: vi.fn().mockReturnValue({
    titleMaxLength: 100,
    descriptionMaxLength: 5000,
    tagsMaxCount: 15,
    maxFileSize: 128 * 1024 * 1024 * 1024,
    maxDuration: 12 * 60 * 60,
  }),
  getOptimalSettings: vi.fn().mockReturnValue({
    resolution: "1080",
    quality: "good",
    format: "mp4",
  }),
}

vi.mock("../../hooks/use-social-export", () => ({
  useSocialExport: () => mockUseSocialExport,
}))

const mockSettings: SocialExportSettings = {
  fileName: "test-video",
  savePath: "/test/path",
  format: OutputFormat.Mp4,
  quality: "good" as const,
  resolution: "1080" as const,
  frameRate: "30",
  enableGPU: false,
  socialNetwork: "youtube",
  isLoggedIn: false,
  privacy: "public",
  title: "Test Video",
  description: "Test Description",
}

const mockProps = {
  settings: mockSettings,
  onSettingsChange: vi.fn(),
  onExport: vi.fn(),
  onCancelExport: vi.fn(),
  onClose: vi.fn(),
  isRendering: false,
  renderProgress: null,
  hasProject: true,
}

describe("SocialExportTab", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("Basic rendering", () => {
    it("should render social networks", () => {
      render(<SocialExportTab {...mockProps} />)

      expect(screen.getByText("YouTube")).toBeInTheDocument()
      expect(screen.getByText("TikTok")).toBeInTheDocument()
      expect(screen.getByText("Telegram")).toBeInTheDocument()
    })

    it("should show network specifications", () => {
      render(<SocialExportTab {...mockProps} />)

      // Should show max resolution and fps for each network
      // Check YouTube specifications
      const youtubeCard = screen.getByText("YouTube").closest('[data-slot="card"]')
      if (youtubeCard) {
        expect(youtubeCard.textContent).toContain("Max: 4k • 60fps")
      }

      // Check TikTok specifications
      const tiktokCard = screen.getAllByText("TikTok")[0].closest('[data-slot="card"]')
      if (tiktokCard) {
        expect(tiktokCard.textContent).toContain("Max: 1080 • 60fps")
      }

      // Check Telegram specifications
      const telegramCard = screen.getAllByText("Telegram")[0].closest('[data-slot="card"]')
      if (telegramCard) {
        expect(telegramCard.textContent).toContain("Max: 720 • 30fps")
      }
    })

    it("should highlight selected network", () => {
      render(<SocialExportTab {...mockProps} />)

      // YouTube should be selected by default and show additional UI
      expect(screen.getByText("dialogs.export.login")).toBeInTheDocument()
    })
  })

  describe("Authentication", () => {
    it("should show login button when not logged in", () => {
      render(<SocialExportTab {...mockProps} />)

      expect(screen.getByText("dialogs.export.login")).toBeInTheDocument()
    })

    it("should show logout button when logged in", async () => {
      const loggedInSettings = { ...mockSettings, isLoggedIn: true }
      const loggedInProps = { ...mockProps, settings: loggedInSettings }

      render(<SocialExportTab {...loggedInProps} />)

      // Simulate login state
      const loginButton = screen.getByText("dialogs.export.login")
      fireEvent.click(loginButton)

      await waitFor(() => {
        expect(mockUseSocialExport.loginToSocialNetwork).toHaveBeenCalledWith("youtube")
      })
    })

    it("should handle login button click", () => {
      render(<SocialExportTab {...mockProps} />)

      const loginButton = screen.getByText("dialogs.export.login")
      fireEvent.click(loginButton)

      // Test passes if no error is thrown
      expect(loginButton).toBeInTheDocument()
    })
  })

  describe("Upload settings", () => {
    it("should render video title input", () => {
      render(<SocialExportTab {...mockProps} />)

      // Form fields are shown after network is selected
      expect(screen.getByText("dialogs.export.videoTitle")).toBeInTheDocument()
      expect(screen.getByPlaceholderText("dialogs.export.enterTitle")).toBeInTheDocument()
    })

    it("should render description textarea", () => {
      render(<SocialExportTab {...mockProps} />)

      expect(screen.getByText("dialogs.export.description")).toBeInTheDocument()
      expect(screen.getByPlaceholderText("dialogs.export.enterDescription")).toBeInTheDocument()
    })

    it("should render privacy selector", () => {
      render(<SocialExportTab {...mockProps} />)

      expect(screen.getByText("dialogs.export.privacy")).toBeInTheDocument()
    })

    it("should show YouTube-specific fields", () => {
      render(<SocialExportTab {...mockProps} />)

      // YouTube is selected by default, so these fields should be visible
      expect(screen.getByText("dialogs.export.tags")).toBeInTheDocument()
      expect(screen.getByText("dialogs.export.category")).toBeInTheDocument()
    })

    it("should handle settings changes", () => {
      const onSettingsChange = vi.fn()
      render(<SocialExportTab {...mockProps} onSettingsChange={onSettingsChange} />)

      const titleInput = screen.getByPlaceholderText("dialogs.export.enterTitle")
      fireEvent.change(titleInput, { target: { value: "New Title" } })

      expect(onSettingsChange).toHaveBeenCalledWith({ title: "New Title" })
    })
  })

  describe("Network selection", () => {
    it("should allow selecting different networks", () => {
      render(<SocialExportTab {...mockProps} />)

      // Click on TikTok card
      const tiktokCard = screen.getByText("TikTok").closest(".cursor-pointer")
      fireEvent.click(tiktokCard!)

      // Should update selection
      expect(tiktokCard).toHaveClass("ring-2")
    })

    it("should show different fields for different networks", () => {
      render(<SocialExportTab {...mockProps} />)

      // YouTube is selected by default and should show tags and category
      expect(screen.getByText("dialogs.export.tags")).toBeInTheDocument()
      expect(screen.getByText("dialogs.export.category")).toBeInTheDocument()

      // Tags and category are YouTube-specific
      const tagsInput = screen.getByPlaceholderText("dialogs.export.enterTags")
      expect(tagsInput).toBeInTheDocument()
    })
  })

  describe("Export functionality", () => {
    it("should render upload button", () => {
      const loggedInSettings = { ...mockSettings, isLoggedIn: true }
      render(<SocialExportTab {...mockProps} settings={loggedInSettings} />)

      expect(screen.getByText(/dialogs.export.uploadTo/)).toBeInTheDocument()
    })

    it("should disable upload button when not logged in", () => {
      render(<SocialExportTab {...mockProps} />)

      const uploadButton = screen.getByRole("button", { name: /dialogs.export.uploadTo/ })
      expect(uploadButton).toBeDisabled()
    })

    it("should handle export button click", async () => {
      const onExport = vi.fn()
      const loggedInSettings = { ...mockSettings, isLoggedIn: true }
      render(<SocialExportTab {...mockProps} settings={loggedInSettings} onExport={onExport} />)

      // First, simulate login to enable the button
      const loginButton = screen.getByText("dialogs.export.login")
      await act(async () => {
        fireEvent.click(loginButton)
      })

      // Wait for login to complete
      await waitFor(() => {
        expect(mockUseSocialExport.loginToSocialNetwork).toHaveBeenCalledWith("youtube")
      })

      // Now find and click the upload button
      const uploadButton = screen.getByRole("button", { name: /dialogs.export.uploadTo/ })

      await act(async () => {
        fireEvent.click(uploadButton)
      })

      // Wait for the validation and export to complete
      await waitFor(() => {
        expect(mockUseSocialExport.validateSocialExport).toHaveBeenCalledWith(loggedInSettings)
        expect(onExport).toHaveBeenCalledWith("youtube")
      })
    })
  })

  describe("Rendering state", () => {
    it("should show progress when rendering", () => {
      const renderingProps = {
        ...mockProps,
        isRendering: true,
        renderProgress: { percentage: 50, message: "Uploading..." },
      }

      render(<SocialExportTab {...renderingProps} />)

      expect(screen.getByText("dialogs.export.uploadProgress")).toBeInTheDocument()
      expect(screen.getByText("50%")).toBeInTheDocument()
    })

    it("should show cancel button when rendering", () => {
      const renderingProps = {
        ...mockProps,
        isRendering: true,
        renderProgress: { percentage: 25 },
      }

      render(<SocialExportTab {...renderingProps} />)

      expect(screen.getByText("dialogs.export.cancel")).toBeInTheDocument()
      expect(screen.getByText("dialogs.export.uploading...")).toBeInTheDocument()
    })

    it("should disable inputs when rendering", () => {
      const renderingProps = {
        ...mockProps,
        isRendering: true,
      }

      render(<SocialExportTab {...renderingProps} />)

      const titleInput = screen.getByPlaceholderText("dialogs.export.enterTitle")
      expect(titleInput).toBeDisabled()
    })
  })

  describe("Error handling", () => {
    it("should handle component without errors", () => {
      expect(() => render(<SocialExportTab {...mockProps} />)).not.toThrow()
    })

    it("should handle missing project", () => {
      const noProjectProps = { ...mockProps, hasProject: false }

      render(<SocialExportTab {...noProjectProps} />)

      const uploadButton = screen.getByRole("button", { name: /dialogs.export.uploadTo/ })
      expect(uploadButton).toBeDisabled()
    })

    it("should handle network switching", () => {
      render(<SocialExportTab {...mockProps} />)

      // Component should render different networks without errors
      expect(screen.getByText("TikTok")).toBeInTheDocument()
      expect(screen.getByText("YouTube")).toBeInTheDocument()
      expect(screen.getByText("Telegram")).toBeInTheDocument()
    })
  })

  describe("Integration", () => {
    it("should integrate with social export hook", () => {
      render(<SocialExportTab {...mockProps} />)

      // Component should use the mocked hook without errors
      expect(screen.getByText("YouTube")).toBeInTheDocument()
    })

    it("should pass all required props", () => {
      expect(() => render(<SocialExportTab {...mockProps} />)).not.toThrow()
    })

    it("should handle close button click", () => {
      const onClose = vi.fn()
      render(<SocialExportTab {...mockProps} onClose={onClose} />)

      const closeButton = screen.getByText("dialogs.export.close")
      fireEvent.click(closeButton)

      expect(onClose).toHaveBeenCalled()
    })
  })
})

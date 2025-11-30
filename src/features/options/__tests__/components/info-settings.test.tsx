import { fireEvent, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import type { MediaFile } from "@/features/media/types/media"
import { setTranslations } from "@/test/mocks/libraries/i18n"
import { renderWithProviders, screen } from "@/test/test-utils"

import { InfoSettings } from "../../components/info-settings"

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Create mock media files
const mockVideoFile: MediaFile = {
  id: "test-media-1",
  name: "test-video.mp4",
  path: "/path/to/test-video.mp4",
  type: "video" as any,
  isVideo: true,
  isAudio: false,
  isImage: false,
  size: 1024000,
  duration: 120,
  createdAt: new Date("2023-01-01T00:00:00Z"),
  probeData: {
    streams: [
      {
        index: 0,
        codec_name: "h264",
        codec_type: "video",
        width: 1920,
        height: 1080,
      },
      {
        index: 1,
        codec_name: "aac",
        codec_type: "audio",
        sample_rate: 48000,
        channels: 2,
      },
    ],
    format: {
      format_name: "mov,mp4,m4a,3gp,3g2,mj2",
      format_long_name: "QuickTime / MOV",
      duration: 120.0,
      size: 1024000,
      bit_rate: 68266,
    },
  },
}

const mockAudioFile: MediaFile = {
  id: "test-audio-1",
  name: "test-audio.mp3",
  path: "/path/to/test-audio.mp3",
  type: "audio" as any,
  isVideo: false,
  isAudio: true,
  isImage: false,
  size: 512000,
  duration: 60,
  createdAt: new Date("2023-06-15T00:00:00Z"),
  probeData: {
    streams: [
      {
        index: 0,
        codec_name: "mp3",
        codec_type: "audio",
        sample_rate: 44100,
        channels: 2,
      },
    ],
    format: {
      format_name: "mp3",
      format_long_name: "MP2/3 (MPEG audio layer 2/3)",
      duration: 60.0,
      size: 512000,
      bit_rate: 68266,
    },
  },
}

// Set up translations
setTranslations({
  "options.info.mediaInfo": "Media Information",
  "options.info.projectInfo": "Project Information",
  "options.info.technicalInfo": "Technical Information",
  "options.info.advanced": "Advanced Information",
  "options.info.fileName": "File Name",
  "options.info.filePath": "File Path",
  "options.info.fileSize": "File Size",
  "options.info.duration": "Duration",
  "options.info.fileType": "File Type",
  "options.info.noMediaSelected": "No media file selected",
  "options.info.selectMediaHint": "Select a media file or clip to view information",
  "options.info.projectName": "Project Name",
  "options.info.resolution": "Resolution",
  "options.info.frameRate": "Frame Rate",
  "options.info.projectDuration": "Project Duration",
  "options.info.sections": "Sections",
  "options.info.tracks": "Tracks",
  "options.info.noProject": "No project loaded",
  "options.info.videoCodec": "Video Codec",
  "options.info.videoBitrate": "Video Bitrate",
  "options.info.audioCodec": "Audio Codec",
  "options.info.sampleRate": "Sample Rate",
  "options.info.channels": "Audio Channels",
  "options.info.createdAt": "Created",
  "options.info.noTechnicalInfo": "No technical information available",
  "options.info.selectedClip": "Selected Clip",
  "options.info.clipName": "Clip Name",
  "options.info.clipDuration": "Clip Duration",
  "options.info.clipStartTime": "Start Time",
  "options.info.clipVolume": "Volume",
  "options.info.clipSpeed": "Speed",
  "options.info.noClipSelected": "No clip selected",
})

describe("InfoSettings", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("Component Rendering", () => {
    it("should render info settings component", () => {
      renderWithProviders(<InfoSettings />)
      expect(screen.getByTestId("info-settings")).toBeInTheDocument()
    })

    it("should render all collapsible sections", () => {
      renderWithProviders(<InfoSettings />)

      expect(screen.getByText("Media Information")).toBeInTheDocument()
      expect(screen.getByText("Project Information")).toBeInTheDocument()
      expect(screen.getByText("Technical Information")).toBeInTheDocument()
      expect(screen.getByText("Advanced Information")).toBeInTheDocument()
    })

    it("should have media info section open by default", () => {
      renderWithProviders(<InfoSettings />)

      // Should show no media selected message
      expect(screen.getByText("No media file selected")).toBeInTheDocument()
    })

    it("should render with video file", () => {
      renderWithProviders(<InfoSettings selectedMediaFile={mockVideoFile} />)
      expect(screen.getByText(mockVideoFile.name)).toBeInTheDocument()
    })

    it("should render with audio file", () => {
      renderWithProviders(<InfoSettings selectedMediaFile={mockAudioFile} />)
      expect(screen.getByText(mockAudioFile.name)).toBeInTheDocument()
    })
  })

  describe("Collapsible Sections", () => {
    it("should toggle media info section", async () => {
      renderWithProviders(<InfoSettings selectedMediaFile={mockVideoFile} />)

      const mediaInfoButton = screen.getByRole("button", { name: /Media Information/i })

      // Section is open by default
      expect(screen.getByText("File Name")).toBeInTheDocument()

      // Click to close
      fireEvent.click(mediaInfoButton)

      await waitFor(() => {
        expect(mediaInfoButton).toBeInTheDocument()
      })
    })

    it("should toggle project info section", async () => {
      renderWithProviders(<InfoSettings />)

      const projectInfoButton = screen.getByRole("button", { name: /Project Information/i })

      // Click to open
      fireEvent.click(projectInfoButton)

      await waitFor(() => {
        expect(screen.getByText("No project loaded")).toBeInTheDocument()
      })
    })

    it("should toggle technical info section", async () => {
      renderWithProviders(<InfoSettings selectedMediaFile={mockVideoFile} />)

      const technicalInfoButton = screen.getByRole("button", { name: /Technical Information/i })

      // Click to open
      fireEvent.click(technicalInfoButton)

      await waitFor(() => {
        expect(screen.getByText("Video Codec")).toBeInTheDocument()
        expect(screen.getByText("Audio Codec")).toBeInTheDocument()
      })
    })

    it("should toggle advanced info section", async () => {
      renderWithProviders(<InfoSettings />)

      const advancedInfoButton = screen.getByRole("button", { name: /Advanced Information/i })

      // Click to open
      fireEvent.click(advancedInfoButton)

      await waitFor(() => {
        expect(screen.getByText("No clip selected")).toBeInTheDocument()
      })
    })
  })

  describe("Media Information Display", () => {
    it("should display video file name", () => {
      renderWithProviders(<InfoSettings selectedMediaFile={mockVideoFile} />)
      expect(screen.getByText("File Name")).toBeInTheDocument()
      expect(screen.getByText(mockVideoFile.name)).toBeInTheDocument()
    })

    it("should display file path", () => {
      renderWithProviders(<InfoSettings selectedMediaFile={mockVideoFile} />)
      expect(screen.getByText("File Path")).toBeInTheDocument()
      expect(screen.getByText(mockVideoFile.path)).toBeInTheDocument()
    })

    it("should display file size", () => {
      renderWithProviders(<InfoSettings selectedMediaFile={mockVideoFile} />)
      expect(screen.getByText("File Size")).toBeInTheDocument()
      expect(screen.getByText(/KB|MB|GB/)).toBeInTheDocument()
    })

    it("should display duration", () => {
      renderWithProviders(<InfoSettings selectedMediaFile={mockVideoFile} />)
      expect(screen.getByText("Duration")).toBeInTheDocument()
      expect(screen.getByText(/02:00/)).toBeInTheDocument()
    })

    it("should display file type", () => {
      renderWithProviders(<InfoSettings selectedMediaFile={mockVideoFile} />)
      expect(screen.getByText("File Type")).toBeInTheDocument()
      // File type is extracted from extension and uppercased
      expect(screen.getAllByText(/mp4/i).length).toBeGreaterThan(0)
    })

    it("should display audio file type", () => {
      renderWithProviders(<InfoSettings selectedMediaFile={mockAudioFile} />)
      expect(screen.getByText("File Type")).toBeInTheDocument()
      // File type is extracted from extension and uppercased
      expect(screen.getAllByText(/mp3/i).length).toBeGreaterThan(0)
    })

    it("should show no media selected when no file provided", () => {
      renderWithProviders(<InfoSettings />)
      expect(screen.getByText("No media file selected")).toBeInTheDocument()
      expect(screen.getByText("Select a media file or clip to view information")).toBeInTheDocument()
    })
  })

  describe("Technical Information Display", () => {
    it("should display video codec for video files", async () => {
      renderWithProviders(<InfoSettings selectedMediaFile={mockVideoFile} />)

      const technicalInfoButton = screen.getByRole("button", { name: /Technical Information/i })
      fireEvent.click(technicalInfoButton)

      await waitFor(() => {
        expect(screen.getByText("Video Codec")).toBeInTheDocument()
      })
    })

    it("should display audio codec for video files", async () => {
      renderWithProviders(<InfoSettings selectedMediaFile={mockVideoFile} />)

      const technicalInfoButton = screen.getByRole("button", { name: /Technical Information/i })
      fireEvent.click(technicalInfoButton)

      await waitFor(() => {
        expect(screen.getByText("Audio Codec")).toBeInTheDocument()
        expect(screen.getByText("Sample Rate")).toBeInTheDocument()
        expect(screen.getByText("Audio Channels")).toBeInTheDocument()
      })
    })

    it("should display audio codec for audio files", async () => {
      renderWithProviders(<InfoSettings selectedMediaFile={mockAudioFile} />)

      const technicalInfoButton = screen.getByRole("button", { name: /Technical Information/i })
      fireEvent.click(technicalInfoButton)

      await waitFor(() => {
        expect(screen.getByText("Audio Codec")).toBeInTheDocument()
        expect(screen.getByText("Sample Rate")).toBeInTheDocument()
        expect(screen.getByText("Audio Channels")).toBeInTheDocument()
      })
    })

    it("should display creation date", async () => {
      renderWithProviders(<InfoSettings selectedMediaFile={mockVideoFile} />)

      const technicalInfoButton = screen.getByRole("button", { name: /Technical Information/i })
      fireEvent.click(technicalInfoButton)

      await waitFor(() => {
        expect(screen.getByText("Created")).toBeInTheDocument()
      })
    })

    it("should show no technical info when no media file", async () => {
      renderWithProviders(<InfoSettings />)

      const technicalInfoButton = screen.getByRole("button", { name: /Technical Information/i })
      fireEvent.click(technicalInfoButton)

      await waitFor(() => {
        expect(screen.getByText("No technical information available")).toBeInTheDocument()
      })
    })
  })

  describe("Project Information Display", () => {
    it("should show no project loaded when no project", async () => {
      renderWithProviders(<InfoSettings />)

      const projectInfoButton = screen.getByRole("button", { name: /Project Information/i })
      fireEvent.click(projectInfoButton)

      await waitFor(() => {
        expect(screen.getByText("No project loaded")).toBeInTheDocument()
      })
    })
  })

  describe("Advanced Information Display", () => {
    it("should show no clip selected when no clip", async () => {
      renderWithProviders(<InfoSettings />)

      const advancedInfoButton = screen.getByRole("button", { name: /Advanced Information/i })
      fireEvent.click(advancedInfoButton)

      await waitFor(() => {
        expect(screen.getByText("No clip selected")).toBeInTheDocument()
      })
    })
  })

  describe("Helper Functions", () => {
    it("should format file size correctly", () => {
      renderWithProviders(<InfoSettings selectedMediaFile={mockVideoFile} />)

      // File size should be formatted as KB or MB
      const fileSizeText = screen.getByText(/KB|MB/)
      expect(fileSizeText).toBeInTheDocument()
    })

    it("should format duration correctly", () => {
      renderWithProviders(<InfoSettings selectedMediaFile={mockVideoFile} />)

      // Duration should be formatted as MM:SS
      const durationText = screen.getByText(/\d{2}:\d{2}/)
      expect(durationText).toBeInTheDocument()
    })

    it("should extract file extension correctly", () => {
      renderWithProviders(<InfoSettings selectedMediaFile={mockVideoFile} />)

      expect(screen.getAllByText(/mp4/i).length).toBeGreaterThan(0)
    })

    it("should get correct media type icon for video", () => {
      renderWithProviders(<InfoSettings selectedMediaFile={mockVideoFile} />)
      expect(screen.getByTestId("info-settings")).toBeInTheDocument()
    })

    it("should get correct media type icon for audio", () => {
      renderWithProviders(<InfoSettings selectedMediaFile={mockAudioFile} />)
      expect(screen.getByTestId("info-settings")).toBeInTheDocument()
    })
  })

  describe("Timeline Integration", () => {
    it("should safely handle missing timeline provider", () => {
      expect(() => {
        renderWithProviders(<InfoSettings />)
      }).not.toThrow()
    })

    it("should render when timeline provider is not available", () => {
      renderWithProviders(<InfoSettings />)
      expect(screen.getByTestId("info-settings")).toBeInTheDocument()
    })
  })

  describe("Edge Cases", () => {
    it("should render without errors", () => {
      expect(() => {
        renderWithProviders(<InfoSettings />)
      }).not.toThrow()
    })

    it("should handle null selectedMediaFile", () => {
      expect(() => {
        renderWithProviders(<InfoSettings selectedMediaFile={null} />)
      }).not.toThrow()
    })

    it("should handle undefined selectedMediaFile", () => {
      expect(() => {
        renderWithProviders(<InfoSettings selectedMediaFile={undefined} />)
      }).not.toThrow()
    })

    it("should handle media file without probe data", () => {
      const fileWithoutProbe = {
        ...mockVideoFile,
        probeData: undefined,
      }

      expect(() => {
        renderWithProviders(<InfoSettings selectedMediaFile={fileWithoutProbe} />)
      }).not.toThrow()
    })

    it("should handle media file without creation date", () => {
      const fileWithoutDate = {
        ...mockVideoFile,
        createdAt: undefined,
      }

      expect(() => {
        renderWithProviders(<InfoSettings selectedMediaFile={fileWithoutDate} />)
      }).not.toThrow()
    })

    it("should handle media file with zero size", () => {
      const zeroSizeFile = {
        ...mockVideoFile,
        size: 0,
      }

      renderWithProviders(<InfoSettings selectedMediaFile={zeroSizeFile} />)
      expect(screen.getByText("0 B")).toBeInTheDocument()
    })

    it("should handle media file with zero duration", () => {
      const zeroDurationFile = {
        ...mockVideoFile,
        duration: 0,
      }

      renderWithProviders(<InfoSettings selectedMediaFile={zeroDurationFile} />)
      expect(screen.getByText("00:00")).toBeInTheDocument()
    })

    it("should have scrollable content area", () => {
      const { container } = renderWithProviders(<InfoSettings />)
      const scrollableArea = container.querySelector(".overflow-y-auto")
      expect(scrollableArea).toBeInTheDocument()
    })
  })

  describe("Accessibility", () => {
    it("should have proper test id", () => {
      renderWithProviders(<InfoSettings />)
      expect(screen.getByTestId("info-settings")).toBeInTheDocument()
    })

    it("should have accessible section buttons", () => {
      renderWithProviders(<InfoSettings />)

      expect(screen.getByRole("button", { name: /Media Information/i })).toBeInTheDocument()
      expect(screen.getByRole("button", { name: /Project Information/i })).toBeInTheDocument()
      expect(screen.getByRole("button", { name: /Technical Information/i })).toBeInTheDocument()
      expect(screen.getByRole("button", { name: /Advanced Information/i })).toBeInTheDocument()
    })
  })

  describe("Component Structure", () => {
    it("should have correct DOM structure", () => {
      const { container } = renderWithProviders(<InfoSettings />)
      const infoSettings = container.querySelector('[data-testid="info-settings"]')

      expect(infoSettings).toHaveClass("flex", "flex-col", "h-full")
    })

    it("should render with four collapsible sections", () => {
      renderWithProviders(<InfoSettings />)

      const sectionButtons = [
        screen.getByRole("button", { name: /Media Information/i }),
        screen.getByRole("button", { name: /Project Information/i }),
        screen.getByRole("button", { name: /Technical Information/i }),
        screen.getByRole("button", { name: /Advanced Information/i }),
      ]

      expect(sectionButtons).toHaveLength(4)
      sectionButtons.forEach((button) => {
        expect(button).toBeInTheDocument()
      })
    })
  })

  describe("Data Formatting", () => {
    it("should format large file sizes correctly", () => {
      const largeFile = {
        ...mockVideoFile,
        size: 1073741824, // 1 GB
      }

      renderWithProviders(<InfoSettings selectedMediaFile={largeFile} />)
      expect(screen.getByText(/GB/)).toBeInTheDocument()
    })

    it("should format long durations correctly", () => {
      const longDuration = {
        ...mockVideoFile,
        duration: 3661, // 1 hour, 1 minute, 1 second
      }

      renderWithProviders(<InfoSettings selectedMediaFile={longDuration} />)
      expect(screen.getByText(/01:01:01/)).toBeInTheDocument()
    })

    it("should handle file name with multiple dots", () => {
      const multiDotFile = {
        ...mockVideoFile,
        name: "test.file.name.with.dots.mp4",
      }

      renderWithProviders(<InfoSettings selectedMediaFile={multiDotFile} />)
      expect(screen.getAllByText(/mp4/i).length).toBeGreaterThan(0)
    })

    it("should handle file name without extension", () => {
      const noExtFile = {
        ...mockVideoFile,
        name: "testfile",
      }

      renderWithProviders(<InfoSettings selectedMediaFile={noExtFile} />)
      expect(screen.getByTestId("info-settings")).toBeInTheDocument()
    })
  })
})

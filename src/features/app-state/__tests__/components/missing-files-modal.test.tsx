/**
 * Tests for MissingFilesModal component
 * Tests file resolution UI, actions, and state management
 */

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SavedMediaFile } from "@/features/media/types/saved-media";
import { MissingFilesModal } from "../../components/missing-files-modal";

// Mock dependencies
vi.mock("@/features/modals/services", () => ({
  useModal: vi.fn(),
}));

vi.mock("@/features/media/services/media-restoration-service", () => ({
  promptUserToFindFile: vi.fn(),
}));

vi.mock("@/lib/tauri-logger", () => ({
  createLogger: vi.fn(() => ({
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  })),
}));

const { useModal } = await import("@/features/modals/services");
const { promptUserToFindFile } = await import(
  "@/features/media/services/media-restoration-service"
);

describe.skip("MissingFilesModal", () => {
  const mockMissingFiles: SavedMediaFile[] = [
    {
      id: "file1",
      name: "video1.mp4",
      originalPath: "/old/path/video1.mp4",
      size: 1024 * 1024 * 100, // 100MB
      lastModified: Date.now(),
      isVideo: true,
      isAudio: false,
      isImage: false,
      metadata: {
        duration: 60,
        createdAt: new Date().toISOString(),
      },
      status: "missing",
      lastChecked: Date.now(),
    },
    {
      id: "file2",
      name: "audio1.mp3",
      originalPath: "/old/path/audio1.mp3",
      size: 1024 * 1024 * 10, // 10MB
      lastModified: Date.now(),
      isVideo: false,
      isAudio: true,
      isImage: false,
      metadata: {
        duration: 180,
        createdAt: new Date().toISOString(),
      },
      status: "missing",
      lastChecked: Date.now(),
    },
  ];

  let mockCloseModal: ReturnType<typeof vi.fn>;
  let mockOnResolve: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockCloseModal = vi.fn();
    mockOnResolve = vi.fn();

    vi.mocked(useModal).mockReturnValue({
      modalData: {
        missingFiles: mockMissingFiles,
        onResolve: mockOnResolve,
      },
      closeModal: mockCloseModal,
    } as any);

    vi.mocked(promptUserToFindFile).mockResolvedValue(null);
  });

  describe("Rendering", () => {
    it("should render modal with missing files", () => {
      render(<MissingFilesModal />);

      expect(screen.getByText("video1.mp4")).toBeInTheDocument();
      expect(screen.getByText("audio1.mp3")).toBeInTheDocument();
    });

    it("should display file count", () => {
      render(<MissingFilesModal />);

      expect(screen.getByText(/Файлов: 2/)).toBeInTheDocument();
    });

    it("should display resolution progress", () => {
      render(<MissingFilesModal />);

      expect(screen.getByText(/Обработано: 0\/2/)).toBeInTheDocument();
    });

    it("should display file sizes", () => {
      render(<MissingFilesModal />);

      expect(screen.getByText(/Размер: 100\.0 МБ/)).toBeInTheDocument();
      expect(screen.getByText(/Размер: 10\.0 МБ/)).toBeInTheDocument();
    });

    it("should display original file paths", () => {
      render(<MissingFilesModal />);

      expect(screen.getByText("/old/path/video1.mp4")).toBeInTheDocument();
      expect(screen.getByText("/old/path/audio1.mp3")).toBeInTheDocument();
    });

    it("should show warning message", () => {
      render(<MissingFilesModal />);

      expect(
        screen.getByText(/При открытии проекта обнаружены отсутствующие файлы/),
      ).toBeInTheDocument();
    });
  });

  describe("File actions", () => {
    it("should handle find file action", async () => {
      vi.mocked(promptUserToFindFile).mockResolvedValueOnce(
        "/new/path/video1.mp4",
      );

      render(<MissingFilesModal />);

      const findButtons = screen.getAllByRole("button");
      const firstFindButton = findButtons.find((btn) =>
        btn.querySelector("svg")?.classList.contains("lucide-search"),
      );

      fireEvent.click(firstFindButton!);

      await waitFor(() => {
        expect(promptUserToFindFile).toHaveBeenCalledWith(mockMissingFiles[0]);
      });

      await waitFor(() => {
        expect(screen.getByText("Найден")).toBeInTheDocument();
      });
    });

    it("should handle remove file action", () => {
      render(<MissingFilesModal />);

      const removeButtons = screen.getAllByRole("button");
      const firstRemoveButton = removeButtons.find((btn) =>
        btn.querySelector("svg")?.classList.contains("lucide-trash-2"),
      );

      fireEvent.click(firstRemoveButton!);

      expect(screen.getByText("Удалить")).toBeInTheDocument();
    });

    it("should handle skip file action after marking for removal", () => {
      render(<MissingFilesModal />);

      // First mark as remove
      const removeButtons = screen.getAllByRole("button");
      const firstRemoveButton = removeButtons.find((btn) =>
        btn.querySelector("svg")?.classList.contains("lucide-trash-2"),
      );
      fireEvent.click(firstRemoveButton!);

      // Then click "Отменить"
      const cancelButton = screen.getByText("Отменить");
      fireEvent.click(cancelButton);

      expect(screen.getByText("Ожидает")).toBeInTheDocument();
    });

    it("should disable find button while processing", async () => {
      vi.mocked(promptUserToFindFile).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(null), 100)),
      );

      render(<MissingFilesModal />);

      const findButtons = screen.getAllByRole("button");
      const firstFindButton = findButtons.find((btn) =>
        btn.querySelector("svg")?.classList.contains("lucide-search"),
      );

      fireEvent.click(firstFindButton!);

      // Button should be disabled during processing
      await waitFor(() => {
        expect(firstFindButton).toBeDisabled();
      });
    });

    it("should handle file not found (user cancels)", async () => {
      vi.mocked(promptUserToFindFile).mockResolvedValueOnce(null);

      render(<MissingFilesModal />);

      const findButtons = screen.getAllByRole("button");
      const firstFindButton = findButtons.find((btn) =>
        btn.querySelector("svg")?.classList.contains("lucide-search"),
      );

      fireEvent.click(firstFindButton!);

      await waitFor(() => {
        expect(screen.getByText("Пропущен")).toBeInTheDocument();
      });
    });
  });

  describe("Resolution workflow", () => {
    it("should update resolution count when marking files", () => {
      render(<MissingFilesModal />);

      // Mark first file for removal
      const removeButtons = screen.getAllByRole("button");
      const firstRemoveButton = removeButtons.find((btn) =>
        btn.querySelector("svg")?.classList.contains("lucide-trash-2"),
      );
      fireEvent.click(firstRemoveButton!);

      expect(screen.getByText(/Обработано: 1\/2/)).toBeInTheDocument();
    });

    it("should enable apply button when files are resolved", () => {
      render(<MissingFilesModal />);

      const applyButton = screen.getByText("Применить изменения");
      expect(applyButton).toBeDisabled();

      // Mark first file for removal
      const removeButtons = screen.getAllByRole("button");
      const firstRemoveButton = removeButtons.find((btn) =>
        btn.querySelector("svg")?.classList.contains("lucide-trash-2"),
      );
      fireEvent.click(firstRemoveButton!);

      expect(applyButton).not.toBeDisabled();
    });

    it("should call onResolve with resolved files", async () => {
      render(<MissingFilesModal />);

      // Mark first file for removal
      const removeButtons = screen.getAllByRole("button");
      const firstRemoveButton = removeButtons.find((btn) =>
        btn.querySelector("svg")?.classList.contains("lucide-trash-2"),
      );
      fireEvent.click(firstRemoveButton!);

      // Click apply
      const applyButton = screen.getByText("Применить изменения");
      fireEvent.click(applyButton);

      expect(mockOnResolve).toHaveBeenCalledWith([
        {
          file: mockMissingFiles[0],
          action: "remove",
          newPath: undefined,
        },
      ]);
      expect(mockCloseModal).toHaveBeenCalled();
    });

    it("should handle skip all action", () => {
      render(<MissingFilesModal />);

      const skipAllButton = screen.getByText("Пропустить все");
      fireEvent.click(skipAllButton);

      expect(mockOnResolve).toHaveBeenCalledWith([]);
      expect(mockCloseModal).toHaveBeenCalled();
    });

    it("should show resolved count in apply button", () => {
      render(<MissingFilesModal />);

      // Mark two files
      const removeButtons = screen.getAllByRole("button");
      const removeButtonsList = removeButtons.filter((btn) =>
        btn.querySelector("svg")?.classList.contains("lucide-trash-2"),
      );

      fireEvent.click(removeButtonsList[0]);
      fireEvent.click(removeButtonsList[1]);

      expect(screen.getByText(/Будет обработано 2 файлов/)).toBeInTheDocument();
    });
  });

  describe("Edge cases", () => {
    it("should handle empty missing files array", () => {
      vi.mocked(useModal).mockReturnValue({
        modalData: {
          missingFiles: [],
          onResolve: mockOnResolve,
        },
        closeModal: mockCloseModal,
      } as any);

      render(<MissingFilesModal />);

      expect(screen.getByText(/Файлов: 0/)).toBeInTheDocument();
    });

    it("should handle missing modalData", () => {
      vi.mocked(useModal).mockReturnValue({
        modalData: null,
        closeModal: mockCloseModal,
      } as any);

      render(<MissingFilesModal />);

      expect(screen.getByText(/Файлов: 0/)).toBeInTheDocument();
    });

    it("should handle missing onResolve callback", () => {
      vi.mocked(useModal).mockReturnValue({
        modalData: {
          missingFiles: mockMissingFiles,
          onResolve: undefined,
        },
        closeModal: mockCloseModal,
      } as any);

      render(<MissingFilesModal />);

      const skipAllButton = screen.getByText("Пропустить все");
      fireEvent.click(skipAllButton);

      // Should not crash
      expect(mockCloseModal).toHaveBeenCalled();
    });

    it("should handle file without size", () => {
      const fileWithoutSize = {
        ...mockMissingFiles[0],
        size: undefined,
      };

      vi.mocked(useModal).mockReturnValue({
        modalData: {
          missingFiles: [fileWithoutSize],
          onResolve: mockOnResolve,
        },
        closeModal: mockCloseModal,
      } as any);

      render(<MissingFilesModal />);

      // Should not show size text
      expect(screen.queryByText(/Размер:/)).not.toBeInTheDocument();
    });

    it("should handle promptUserToFindFile error", async () => {
      vi.mocked(promptUserToFindFile).mockRejectedValueOnce(
        new Error("File dialog error"),
      );

      render(<MissingFilesModal />);

      const findButtons = screen.getAllByRole("button");
      const firstFindButton = findButtons.find((btn) =>
        btn.querySelector("svg")?.classList.contains("lucide-search"),
      );

      fireEvent.click(firstFindButton!);

      // Should handle error gracefully and return to pending state
      await waitFor(() => {
        expect(screen.getByText("Ожидает")).toBeInTheDocument();
      });
    });
  });

  describe("UI states", () => {
    it("should show correct icon for pending state", () => {
      render(<MissingFilesModal />);

      const statusIcons = screen.getAllByText("Ожидает");
      expect(statusIcons).toHaveLength(2); // Two files pending
    });

    it("should show correct icon for found state", async () => {
      vi.mocked(promptUserToFindFile).mockResolvedValueOnce(
        "/new/path/video1.mp4",
      );

      render(<MissingFilesModal />);

      const findButtons = screen.getAllByRole("button");
      const firstFindButton = findButtons.find((btn) =>
        btn.querySelector("svg")?.classList.contains("lucide-search"),
      );

      fireEvent.click(firstFindButton!);

      await waitFor(() => {
        expect(screen.getByText("Найден")).toBeInTheDocument();
      });
    });

    it("should show correct icon for remove state", () => {
      render(<MissingFilesModal />);

      const removeButtons = screen.getAllByRole("button");
      const firstRemoveButton = removeButtons.find((btn) =>
        btn.querySelector("svg")?.classList.contains("lucide-trash-2"),
      );

      fireEvent.click(firstRemoveButton!);

      expect(screen.getByText("Удалить")).toBeInTheDocument();
    });

    it("should show correct icon for skip state", async () => {
      vi.mocked(promptUserToFindFile).mockResolvedValueOnce(null);

      render(<MissingFilesModal />);

      const findButtons = screen.getAllByRole("button");
      const firstFindButton = findButtons.find((btn) =>
        btn.querySelector("svg")?.classList.contains("lucide-search"),
      );

      fireEvent.click(firstFindButton!);

      await waitFor(() => {
        expect(screen.getByText("Пропущен")).toBeInTheDocument();
      });
    });
  });
});

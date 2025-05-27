import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { MediaFile } from "@/features/media/types/media";

import { StatusBar } from "../../../components/layout/status-bar";

// Мокаем react-i18next
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        "browser.media.addAllVideo": "Add all video",
        "browser.media.video": "video",
        "browser.media.addAllAudio": "Add all audio",
        "browser.media.audio": "audio",
        "browser.media.addDate": "Add date",
        "common.allFilesAdded": "All files added",
        "browser.media.addAll": "Add all",
      };
      return translations[key] || key;
    },
  }),
}));

// Мокаем lucide-react
vi.mock("lucide-react", () => ({
  CopyPlus: () => <div data-testid="copy-plus-icon">CopyPlus</div>,
}));

// Мокаем функции из lib/media-files
vi.mock("@/lib/media-files", () => ({
  getRemainingMediaCounts: vi
    .fn()
    .mockImplementation((media, addedFilesSet) => {
      const remainingVideoCount = media.filter(
        (file: { isVideo: any; path: any }) =>
          file.isVideo && !addedFilesSet.has(file.path),
      ).length;
      const remainingAudioCount = media.filter(
        (file: { isAudio: any; path: any }) =>
          file.isAudio && !addedFilesSet.has(file.path),
      ).length;
      const allFilesAdded =
        remainingVideoCount === 0 && remainingAudioCount === 0;
      return { remainingVideoCount, remainingAudioCount, allFilesAdded };
    }),
  getTopDateWithRemainingFiles: vi
    .fn()
    .mockImplementation((sortedDates, addedFilesSet) => {
      for (const dateGroup of sortedDates) {
        const remainingFiles = dateGroup.files.filter(
          (file: { path: any }) => !addedFilesSet.has(file.path),
        );
        if (remainingFiles.length > 0) {
          return {
            date: dateGroup.date,
            files: dateGroup.files,
            remainingFiles,
          };
        }
      }
      return null;
    }),
}));

describe("StatusBar", () => {
  // Создаем тестовые данные
  const videoFile1: MediaFile = {
    id: "video1",
    name: "video1.mp4",
    path: "/path/to/video1.mp4",
    isVideo: true,
    isAudio: false,
    isImage: false,
  };

  const videoFile2: MediaFile = {
    id: "video2",
    name: "video2.mp4",
    path: "/path/to/video2.mp4",
    isVideo: true,
    isAudio: false,
    isImage: false,
  };

  const audioFile1: MediaFile = {
    id: "audio1",
    name: "audio1.mp3",
    path: "/path/to/audio1.mp3",
    isVideo: false,
    isAudio: true,
    isImage: false,
  };

  const audioFile2: MediaFile = {
    id: "audio2",
    name: "audio2.mp3",
    path: "/path/to/audio2.mp3",
    isVideo: false,
    isAudio: true,
    isImage: false,
  };

  const media = [videoFile1, videoFile2, audioFile1, audioFile2];

  const sortedDates = [
    {
      date: "2023-05-20",
      files: [videoFile1, videoFile2],
    },
    {
      date: "2023-05-19",
      files: [audioFile1, audioFile2],
    },
  ];

  it("should render with remaining video and audio files", () => {
    const onAddAllVideoFiles = vi.fn();
    const onAddAllAudioFiles = vi.fn();
    const onAddDateFiles = vi.fn();
    const onAddAllFiles = vi.fn();

    render(
      <StatusBar
        media={media}
        onAddAllVideoFiles={onAddAllVideoFiles}
        onAddAllAudioFiles={onAddAllAudioFiles}
        onAddDateFiles={onAddDateFiles}
        onAddAllFiles={onAddAllFiles}
        sortedDates={sortedDates}
        addedFiles={[]}
      />,
    );

    // Проверяем, что кнопки для добавления видео и аудио отображаются
    expect(screen.getByText("2 video")).toBeInTheDocument();
    expect(screen.getByText("2 audio")).toBeInTheDocument();

    // Проверяем, что кнопка для добавления файлов за дату отображается
    expect(screen.getByText("2 video 2023-05-20")).toBeInTheDocument();

    // Проверяем, что кнопка для добавления всех файлов отображается
    expect(screen.getByText("Add all")).toBeInTheDocument();
  });

  it("should call onAddAllVideoFiles when clicking on video button", () => {
    const onAddAllVideoFiles = vi.fn();
    const onAddAllAudioFiles = vi.fn();
    const onAddDateFiles = vi.fn();
    const onAddAllFiles = vi.fn();

    render(
      <StatusBar
        media={media}
        onAddAllVideoFiles={onAddAllVideoFiles}
        onAddAllAudioFiles={onAddAllAudioFiles}
        onAddDateFiles={onAddDateFiles}
        onAddAllFiles={onAddAllFiles}
        sortedDates={sortedDates}
        addedFiles={[]}
      />,
    );

    // Кликаем на кнопку добавления всех видео
    act(() => {
      act(() => {
        fireEvent.click(screen.getByText("2 video"));
      });
    });

    // Проверяем, что функция была вызвана
    expect(onAddAllVideoFiles).toHaveBeenCalledTimes(1);
  });

  it("should call onAddAllAudioFiles when clicking on audio button", () => {
    const onAddAllVideoFiles = vi.fn();
    const onAddAllAudioFiles = vi.fn();
    const onAddDateFiles = vi.fn();
    const onAddAllFiles = vi.fn();

    render(
      <StatusBar
        media={media}
        onAddAllVideoFiles={onAddAllVideoFiles}
        onAddAllAudioFiles={onAddAllAudioFiles}
        onAddDateFiles={onAddDateFiles}
        onAddAllFiles={onAddAllFiles}
        sortedDates={sortedDates}
        addedFiles={[]}
      />,
    );

    // Кликаем на кнопку добавления всех аудио
    act(() => {
      act(() => {
        fireEvent.click(screen.getByText("2 audio"));
      });
    });

    // Проверяем, что функция была вызвана
    expect(onAddAllAudioFiles).toHaveBeenCalledTimes(1);
  });

  it("should call onAddDateFiles when clicking on date button", () => {
    const onAddAllVideoFiles = vi.fn();
    const onAddAllAudioFiles = vi.fn();
    const onAddDateFiles = vi.fn();
    const onAddAllFiles = vi.fn();

    render(
      <StatusBar
        media={media}
        onAddAllVideoFiles={onAddAllVideoFiles}
        onAddAllAudioFiles={onAddAllAudioFiles}
        onAddDateFiles={onAddDateFiles}
        onAddAllFiles={onAddAllFiles}
        sortedDates={sortedDates}
        addedFiles={[]}
      />,
    );

    // Кликаем на кнопку добавления файлов за дату
    act(() => {
      act(() => {
        fireEvent.click(screen.getByText("2 video 2023-05-20"));
      });
    });

    // Проверяем, что функция была вызвана с правильными параметрами
    expect(onAddDateFiles).toHaveBeenCalledTimes(1);
    expect(onAddDateFiles).toHaveBeenCalledWith([videoFile1, videoFile2]);
  });

  it("should call onAddAllFiles when clicking on add all button", () => {
    const onAddAllVideoFiles = vi.fn();
    const onAddAllAudioFiles = vi.fn();
    const onAddDateFiles = vi.fn();
    const onAddAllFiles = vi.fn();

    render(
      <StatusBar
        media={media}
        onAddAllVideoFiles={onAddAllVideoFiles}
        onAddAllAudioFiles={onAddAllAudioFiles}
        onAddDateFiles={onAddDateFiles}
        onAddAllFiles={onAddAllFiles}
        sortedDates={sortedDates}
        addedFiles={[]}
      />,
    );

    // Кликаем на кнопку добавления всех файлов
    act(() => {
      act(() => {
        fireEvent.click(screen.getByText("Add all"));
      });
    });

    // Проверяем, что функция была вызвана
    expect(onAddAllFiles).toHaveBeenCalledTimes(1);
  });

  it("should show 'All files added' when all files are added", () => {
    const onAddAllVideoFiles = vi.fn();
    const onAddAllAudioFiles = vi.fn();
    const onAddDateFiles = vi.fn();
    const onAddAllFiles = vi.fn();

    render(
      <StatusBar
        media={media}
        onAddAllVideoFiles={onAddAllVideoFiles}
        onAddAllAudioFiles={onAddAllAudioFiles}
        onAddDateFiles={onAddDateFiles}
        onAddAllFiles={onAddAllFiles}
        sortedDates={sortedDates}
        addedFiles={media}
      />,
    );

    // Проверяем, что отображается сообщение о том, что все файлы добавлены
    expect(screen.getByText("All files added")).toBeInTheDocument();

    // Проверяем, что кнопки для добавления файлов не отображаются
    expect(screen.queryByText("Add all")).not.toBeInTheDocument();
  });
});

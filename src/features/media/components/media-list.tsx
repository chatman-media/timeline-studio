import { useCallback, useMemo } from "react";

import { useTranslation } from "react-i18next";

import { useBrowserState } from "@/components/common/browser-state-provider";
import { useMedia } from "@/features/browser";
import { MediaFile } from "@/features/media/types/media";
import { useTimelineActions } from "@/features/timeline/hooks";
import i18n from "@/i18n";
import { formatDateByLanguage } from "@/i18n/constants";
import { getFileType, groupFilesByDate } from "@/lib/media-files";
import { FfprobeStream } from "@/types/ffprobe";

import { MediaContent } from "./media-content";
import { StatusBar } from "../../browser/components/layout/status-bar";

interface GroupedMediaFiles {
  title: string;
  files: MediaFile[];
}

/**
 * Компонент для отображения списка медиа-файлов
 *
 * @returns {JSX.Element} Компонент списка медиа-файлов
 */
export function MediaList() {
  const { t } = useTranslation();
  const { allMediaFiles, isLoading, error, isItemFavorite, includedFiles } =
    useMedia();

  // Хук для добавления медиафайлов на таймлайн
  const { addMediaToTimeline } = useTimelineActions();

  // Получаем значения из общего провайдера состояния браузера
  const { currentTabSettings, previewSize } = useBrowserState();

  // Извлекаем настройки для медиа-вкладки
  const {
    searchQuery,
    showFavoritesOnly,
    viewMode,
    sortBy,
    filterType,
    groupBy,
    sortOrder,
  } = currentTabSettings;

  // Фильтрация и сортировка
  const filteredAndSortedMedia = useMemo(() => {
    // Сначала фильтрация по типу
    let filtered =
      filterType === "all"
        ? allMediaFiles
        : allMediaFiles.filter((file: MediaFile) => {
            try {
              // Проверяем, загружены ли метаданные
              if (file.isLoadingMetadata === true) {
                // Если метаданные еще загружаются, используем базовые свойства файла
                if (filterType === "video" && file.isVideo) return true;
                if (filterType === "audio" && file.isAudio) return true;
                if (filterType === "image" && file.isImage) return true;
                return false;
              }

              // Если метаданные загружены, используем их для более точной фильтрации
              if (
                filterType === "video" &&
                (file.isVideo ||
                  file.probeData?.streams.some((s) => s.codec_type === "video"))
              )
                return true;

              if (
                filterType === "audio" &&
                (file.isAudio ||
                  file.probeData?.streams.some((s) => s.codec_type === "audio"))
              )
                return true;

              if (
                filterType === "image" &&
                (file.isImage || /\.(jpg|jpeg|png|gif|webp)$/i.exec(file.name))
              )
                return true;

              return false;
            } catch (error) {
              console.error("Error filtering file:", file, error);
              return false; // Пропускаем файл при ошибке
            }
          });

    // Фильтрация по избранному
    if (showFavoritesOnly) {
      filtered = filtered.filter((file: MediaFile) => {
        try {
          // Определяем тип файла для проверки в избранном
          let itemType = "media";

          // Для аудиофайлов используем тип "audio"
          if (
            file.isAudio ||
            (file.probeData?.streams[0]?.codec_type === "audio" &&
              !file.probeData.streams.some(
                (stream) => stream.codec_type === "video",
              ))
          ) {
            itemType = "audio";
          }

          return isItemFavorite(file, itemType);
        } catch (error) {
          console.error("Error filtering favorite file:", file, error);
          return false; // Пропускаем файл при ошибке
        }
      });
    }

    // Затем фильтрация по поисковому запросу
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((file: MediaFile) => {
        try {
          return (
            file.name.toLowerCase().includes(query) ||
            String(file.probeData?.format.tags?.title ?? "")
              .toLowerCase()
              .includes(query) ||
            String(file.probeData?.format.tags?.artist ?? "")
              .toLowerCase()
              .includes(query) ||
            String(file.probeData?.format.tags?.album ?? "")
              .toLowerCase()
              .includes(query)
          );
        } catch (error) {
          console.error("Error filtering file by search query:", file, error);
          return false; // Пропускаем файл при ошибке
        }
      });
    }

    // Затем сортировка
    return [...filtered].sort((a: MediaFile, b: MediaFile) => {
      // Определяем множитель для направления сортировки
      const orderMultiplier = sortOrder === "asc" ? 1 : -1;

      if (sortBy === "name") {
        return orderMultiplier * (a.name || "").localeCompare(b.name || "");
      }

      if (sortBy === "size") {
        // Получаем размер из метаданных или из поля size
        const getSizeValue = (file: MediaFile): number => {
          // Приоритетно используем размер из метаданных, если он доступен
          if (file.probeData?.format.size !== undefined) {
            return file.probeData.format.size;
          }

          // Иначе используем поле size (с конвертацией, если нужно)
          if (file.size !== undefined) {
            if (typeof file.size === "number") return file.size;
            if (typeof file.size === "string") {
              // Если размер представлен строкой с единицами измерения (например, "1.5 GB")
              const sizeStr = file.size as string; // явное приведение типа для линтера
              const match = /^([\d.]+)\s*([KMGT]?B)?$/i.exec(sizeStr);
              if (match) {
                const value = Number.parseFloat(match[1]);
                const unit = (match[2] || "").toUpperCase();

                if (unit === "KB") return value * 1024;
                if (unit === "MB") return value * 1024 * 1024;
                if (unit === "GB") return value * 1024 * 1024 * 1024;
                if (unit === "TB") return value * 1024 * 1024 * 1024 * 1024;
                return value; // Просто байты
              }
              return Number.parseFloat(sizeStr) || 0;
            }
          }

          return 0;
        };

        return orderMultiplier * (getSizeValue(b) - getSizeValue(a));
      }

      if (sortBy === "duration") {
        // Преобразуем duration в секунды, если это строка формата "00:00:00" или другого формата
        const getDurationInSeconds = (duration: any): number => {
          if (!duration) return 0;
          if (typeof duration === "number") return duration;
          if (typeof duration === "string") {
            // Если формат "01:23:45"
            const parts = duration.split(":").map(Number);
            if (parts.length === 3) {
              return parts[0] * 3600 + parts[1] * 60 + parts[2];
            }
            // Если формат "01:23"
            if (parts.length === 2) {
              return parts[0] * 60 + parts[1];
            }
            // Если только число
            return Number.parseFloat(duration) || 0;
          }
          return 0;
        };

        return (
          orderMultiplier *
          (getDurationInSeconds(b.duration) - getDurationInSeconds(a.duration))
        );
      }

      // По умолчанию сортируем по дате
      const timeA = a.startTime ?? 0;
      const timeB = b.startTime ?? 0;
      return orderMultiplier * (timeB - timeA);
    });
  }, [
    filterType,
    allMediaFiles,
    showFavoritesOnly,
    searchQuery,
    isItemFavorite,
    sortOrder,
    sortBy,
  ]);

  // Группируем файлы
  const groupedFiles = useMemo<GroupedMediaFiles[]>(() => {
    if (groupBy === "none") {
      return [{ title: "", files: filteredAndSortedMedia }];
    }

    if (groupBy === "type") {
      const groups: Record<string, MediaFile[]> = {
        video: [],
        audio: [],
        image: [],
      };

      filteredAndSortedMedia.forEach((file) => {
        const fileType = getFileType(file);
        if (fileType === "video") {
          groups.video.push(file);
        } else if (fileType === "audio") {
          groups.audio.push(file);
        } else {
          groups.image.push(file);
        }
      });

      return Object.entries(groups)
        .filter(([, files]) => files.length > 0)
        .sort(([a], [b]) => {
          if (sortOrder === "asc") {
            return a.localeCompare(b);
          }
          return b.localeCompare(a);
        })
        .map(([type, files]) => ({
          title: t(`browser.media.${type}`),
          files,
        }));
    }

    if (groupBy === "date") {
      const groups: Record<string, MediaFile[]> = {};
      // Получаем текущий язык из i18n
      const currentLanguage = i18n.language || "ru";
      const noDateText = i18n.t("dates.noDate", { defaultValue: "No date" });

      filteredAndSortedMedia.forEach((file) => {
        // Для изображений используем дату создания файла, если она доступна
        let timestamp = file.startTime;
        if (!timestamp && /\.(jpg|jpeg|png|gif|webp)$/i.exec(file.name)) {
          // Пробуем получить дату из метаданных
          timestamp = file.probeData?.format.tags?.creation_time
            ? new Date(file.probeData.format.tags.creation_time).getTime() /
              1000
            : 0;
        }

        const date = timestamp
          ? formatDateByLanguage(new Date(timestamp * 1000), currentLanguage, {
              includeYear: true,
              longFormat: true,
            })
          : noDateText;

        if (!groups[date]) {
          groups[date] = [];
        }
        groups[date].push(file);
      });

      return Object.entries(groups)
        .sort(([a], [b]) => {
          if (a === noDateText) return 1;
          if (b === noDateText) return -1;
          const dateA = new Date(a);
          const dateB = new Date(b);
          return sortOrder === "asc"
            ? dateA.getTime() - dateB.getTime()
            : dateB.getTime() - dateA.getTime();
        })
        .map(([date, files]) => ({
          title: date,
          files,
        }));
    }

    if (groupBy === "duration") {
      const groups: Record<string, MediaFile[]> = {
        noDuration: [], // файлы без длительности (изображения)
        veryShort: [], // до 1 минуты
        short: [], // 1-5 минут
        medium: [], // 5-30 минут
        long: [], // 30-60 минут
        veryLong: [], // 1-3 часа
        extraLong: [], // 3+ часа
      };

      filteredAndSortedMedia.forEach((file) => {
        // Для изображений используем специальную логику
        if (/\.(jpg|jpeg|png|gif|webp)$/i.exec(file.name)) {
          groups.noDuration.push(file);
          return;
        }

        const duration = file.probeData?.format.duration ?? 0;
        if (duration < 60) {
          // до 1 минуты
          groups.veryShort.push(file);
        } else if (duration < 300) {
          // 1-5 минут
          groups.short.push(file);
        } else if (duration < 1800) {
          // 5-30 минут
          groups.medium.push(file);
        } else if (duration < 3600) {
          // 30-60 минут
          groups.long.push(file);
        } else if (duration < 10800) {
          // 1-3 часа
          groups.veryLong.push(file);
        } else {
          // 3+ часа
          groups.extraLong.push(file);
        }
      });

      const groupOrder = [
        "noDuration",
        "veryShort",
        "short",
        "medium",
        "long",
        "veryLong",
        "extraLong",
      ];

      return Object.entries(groups)
        .filter(([, files]) => files.length > 0)
        .sort(([a], [b]) => {
          const indexA = groupOrder.indexOf(a);
          const indexB = groupOrder.indexOf(b);
          return sortOrder === "asc" ? indexA - indexB : indexB - indexA;
        })
        .map(([type, files]) => ({
          title: t(`browser.toolbar.duration.${type}`),
          files,
        }));
    }

    return [{ title: "", files: filteredAndSortedMedia }];
  }, [filteredAndSortedMedia, groupBy, sortOrder, t]);

  // Мемоизируем другие вычисления
  const sortedDates = useMemo(
    () => groupFilesByDate(allMediaFiles),
    [allMediaFiles],
  );

  const handleAddAllFiles = useCallback(() => {
    const nonImageFiles = allMediaFiles.filter(
      (file: MediaFile) => !file.isImage,
    );
    if (nonImageFiles.length > 0) {
      addMediaToTimeline(nonImageFiles);
    }
  }, [allMediaFiles, addMediaToTimeline]);

  const addDateFiles = useCallback(
    (files: MediaFile[]) => {
      addMediaToTimeline(files);
    },
    [addMediaToTimeline],
  );

  const handleAddAllVideoFiles = useCallback(() => {
    const videoFiles = allMediaFiles.filter((file: MediaFile) =>
      file.probeData?.streams.some(
        (stream: FfprobeStream) => stream.codec_type === "video",
      ),
    );
    if (videoFiles.length > 0) {
      addMediaToTimeline(videoFiles);
    }
  }, [allMediaFiles, addMediaToTimeline]);

  const handleAddAllAudioFiles = useCallback(() => {
    const audioFiles = allMediaFiles.filter(
      (file: MediaFile) =>
        !file.probeData?.streams.some(
          (stream: FfprobeStream) => stream.codec_type === "video",
        ) &&
        file.probeData?.streams.some(
          (stream: FfprobeStream) => stream.codec_type === "audio",
        ),
    );
    if (audioFiles.length > 0) {
      addMediaToTimeline(audioFiles);
    }
  }, [allMediaFiles, addMediaToTimeline]);

  // Обработчик повторной загрузки
  const handleRetry = useCallback(() => {
    console.log("Retry requested");
    // TODO: Реализовать повторную загрузку через useMedia
  }, []);

  return (
    <div
      className="flex h-full w-full flex-col overflow-hidden"
      style={{ height: "100%" }}
    >
      <div className="min-h-0 flex-1 overflow-y-auto p-0 bg-background">
        <MediaContent
          groupedFiles={groupedFiles}
          viewMode={viewMode}
          previewSize={previewSize}
          isLoading={isLoading}
          error={error}
          addFilesToTimeline={addMediaToTimeline}
          onRetry={handleRetry}
        />
      </div>
      {filteredAndSortedMedia.length > 0 && (
        <div className="m-0 flex-shrink-0 py-0.5 transition-all duration-200 ease-in-out">
          <StatusBar
            media={filteredAndSortedMedia}
            onAddAllVideoFiles={handleAddAllVideoFiles}
            onAddAllAudioFiles={handleAddAllAudioFiles}
            onAddDateFiles={addDateFiles}
            onAddAllFiles={handleAddAllFiles}
            sortedDates={sortedDates}
            addedFiles={includedFiles}
          />
        </div>
      )}
    </div>
  );
}

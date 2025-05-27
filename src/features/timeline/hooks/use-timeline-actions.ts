/**
 * Hook for Timeline actions - добавление медиафайлов на таймлайн
 */

import { useCallback } from "react";

import { MediaFile } from "@/features/media/types/media";

import { useTimeline } from "../timeline-provider";
import { TrackType } from "../types";
import { useClips } from "./use-clips";
import { useTracks } from "./use-tracks";

export interface UseTimelineActionsReturn {
  // Добавление медиафайлов
  addMediaToTimeline: (files: MediaFile[]) => void;
  addSingleMediaToTimeline: (file: MediaFile) => void;

  // Утилиты
  getTrackTypeForMedia: (file: MediaFile) => TrackType;
  findBestTrackForMedia: (file: MediaFile) => string | null;
  calculateClipStartTime: (trackId: string) => number;
}

/**
 * Определяет тип трека для медиафайла
 */
function getTrackTypeForMediaFile(file: MediaFile): TrackType {
  // Проверяем по расширению файла
  if (file.isImage) {
    return "image";
  }

  if (file.isVideo) {
    return "video";
  }

  if (file.isAudio) {
    return "audio";
  }

  // Проверяем по метаданным, если они доступны
  if (file.probeData?.streams) {
    const hasVideo = file.probeData.streams.some(
      (stream) => stream.codec_type === "video",
    );
    const hasAudio = file.probeData.streams.some(
      (stream) => stream.codec_type === "audio",
    );

    if (hasVideo) {
      return "video";
    } else if (hasAudio) {
      return "audio";
    }
  }

  // По умолчанию считаем видео
  return "video";
}

export function useTimelineActions(): UseTimelineActionsReturn {
  const { project, addTrack, addClip } = useTimeline();
  const { tracks, getTracksByType } = useTracks();
  const { getClipsByTrack } = useClips();

  // ============================================================================
  // UTILITY FUNCTIONS
  // ============================================================================

  const getTrackTypeForMedia = useCallback((file: MediaFile): TrackType => {
    return getTrackTypeForMediaFile(file);
  }, []);

  const findBestTrackForMedia = useCallback(
    (file: MediaFile): string | null => {
      const trackType = getTrackTypeForMedia(file);
      const tracksOfType = getTracksByType(trackType);

      if (tracksOfType.length === 0) {
        return null; // Нет подходящих треков
      }

      // Возвращаем первый трек подходящего типа
      // В будущем можно добавить более сложную логику выбора
      return tracksOfType[0].id;
    },
    [getTrackTypeForMedia, getTracksByType],
  );

  const calculateClipStartTime = useCallback(
    (trackId: string): number => {
      const clipsOnTrack = getClipsByTrack(trackId);

      if (clipsOnTrack.length === 0) {
        return 0; // Начинаем с начала трека
      }

      // Находим последний клип и добавляем новый после него
      const lastClip = clipsOnTrack.reduce((latest, clip) => {
        const clipEndTime = clip.startTime + clip.duration;
        const latestEndTime = latest.startTime + latest.duration;
        return clipEndTime > latestEndTime ? clip : latest;
      });

      return lastClip.startTime + lastClip.duration;
    },
    [getClipsByTrack],
  );

  // ============================================================================
  // MAIN ACTIONS
  // ============================================================================

  const addSingleMediaToTimeline = useCallback(
    (file: MediaFile) => {
      if (!project) {
        console.warn("No project available for adding media");
        return;
      }

      const trackType = getTrackTypeForMedia(file);
      let targetTrackId = findBestTrackForMedia(file);

      // Если нет подходящего трека, создаем новый
      if (!targetTrackId) {
        const trackName = `${trackType.charAt(0).toUpperCase() + trackType.slice(1)} Track`;
        addTrack(trackType, undefined, trackName);

        // Находим только что созданный трек
        const newTracks = getTracksByType(trackType);
        if (newTracks.length > 0) {
          targetTrackId = newTracks[newTracks.length - 1].id;
        }
      }

      if (!targetTrackId) {
        console.error("Failed to create or find track for media file");
        return;
      }

      // Вычисляем время начала клипа
      const startTime = calculateClipStartTime(targetTrackId);

      // Добавляем клип на трек
      addClip(targetTrackId, file, startTime, file.duration);

      console.log(
        `Added ${file.name} to track ${targetTrackId} at time ${startTime}`,
      );
    },
    [
      project,
      getTrackTypeForMedia,
      findBestTrackForMedia,
      addTrack,
      getTracksByType,
      calculateClipStartTime,
      addClip,
    ],
  );

  const addMediaToTimeline = useCallback(
    (files: MediaFile[]) => {
      if (!files || files.length === 0) {
        return;
      }

      console.log(`Adding ${files.length} files to timeline`);

      // Добавляем файлы по одному
      files.forEach((file, index) => {
        // Небольшая задержка между добавлениями для лучшего UX
        setTimeout(() => {
          addSingleMediaToTimeline(file);
        }, index * 50);
      });
    },
    [addSingleMediaToTimeline],
  );

  // ============================================================================
  // RETURN
  // ============================================================================

  return {
    // Основные действия
    addMediaToTimeline,
    addSingleMediaToTimeline,

    // Утилиты
    getTrackTypeForMedia,
    findBestTrackForMedia,
    calculateClipStartTime,
  };
}

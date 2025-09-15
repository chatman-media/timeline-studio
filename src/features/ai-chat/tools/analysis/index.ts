/**
 * Analysis AI Tools - Инструменты анализа и обработки контента
 *
 * Анализ видео, аудио, контента и мультимодальный анализ
 */

// Migrated tools
import { audioAnalysisTools } from "@/domains/ai-tools/tools/analysis/audio-analysis";
import { videoAnalysisTools } from "@/domains/ai-tools/tools/analysis/video-analysis";
import { contentIntelligenceTools } from "@/domains/ai-tools/tools/analysis/content-intelligence";
import { multimodalTools } from "@/domains/ai-tools/tools/analysis/multimodal";
import { personIdentificationTools } from "@/domains/ai-tools/tools/analysis/person-identification";
import { whisperTools } from "@/domains/ai-tools/tools/analysis/whisper";
import { colorStyleTools } from "@/domains/ai-tools/tools/analysis/color-style";

export const analysisTools = [
  ...videoAnalysisTools,
  ...audioAnalysisTools,
  ...contentIntelligenceTools,
  ...multimodalTools,
  ...personIdentificationTools,
  ...whisperTools,
  ...colorStyleTools,
];

export const ANALYSIS_TOOLS_COUNT = analysisTools.length;

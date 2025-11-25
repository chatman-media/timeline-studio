import type { Meta, StoryObj } from "@storybook/react"

import { FileAnalysisCard, type FileAnalysisCardData } from "./file-analysis-card"

/**
 * FileAnalysisCard отображает прогресс анализа одного медиа файла в AI Director v3.
 * Показывает статус файла, прогресс, текущий этап анализа и статусы отдельных анализаторов.
 */
const meta = {
  title: "Features/AI Director/v3/FileAnalysisCard",
  component: FileAnalysisCard,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Карточка с прогрессом анализа одного файла. Отображает общий прогресс, статус, текущий этап и состояние каждого анализатора.",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    file: {
      description: "Данные о файле и его анализе",
    },
  },
} satisfies Meta<typeof FileAnalysisCard>

export default meta
type Story = StoryObj<typeof meta>

const mockFileAnalyzing: FileAnalysisCardData = {
  filePath: "/media/project/interview-01.mp4",
  fileName: "interview-01.mp4",
  status: "analyzing",
  progress: 45,
  currentStage: "Scene Detection",
  analyzers: [
    { name: "scene_detection", status: "analyzing" },
    { name: "audio_quality", status: "pending" },
    { name: "speech_recognition", status: "pending" },
  ],
  eta: 120,
}

const mockFileCompleted: FileAnalysisCardData = {
  filePath: "/media/project/demo-footage.mp4",
  fileName: "demo-footage.mp4",
  status: "completed",
  progress: 100,
  analyzers: [
    { name: "scene_detection", status: "completed" },
    { name: "audio_quality", status: "completed" },
    { name: "face_detection", status: "completed" },
  ],
}

const mockFilePending: FileAnalysisCardData = {
  filePath: "/media/project/presentation-02.mp4",
  fileName: "presentation-02.mp4",
  status: "pending",
  progress: 0,
  analyzers: [
    { name: "scene_detection", status: "pending" },
    { name: "audio_quality", status: "pending" },
  ],
}

const mockFileError: FileAnalysisCardData = {
  filePath: "/media/project/corrupted-file.mp4",
  fileName: "corrupted-file.mp4",
  status: "error",
  progress: 15,
  currentStage: "Audio Quality Analysis",
  analyzers: [
    { name: "scene_detection", status: "completed" },
    { name: "audio_quality", status: "error" },
    { name: "speech_recognition", status: "pending" },
  ],
  error: "Failed to decode audio stream: Unsupported codec",
}

/**
 * Файл в процессе анализа
 */
export const Analyzing: Story = {
  args: {
    file: mockFileAnalyzing,
  },
}

/**
 * Файл успешно проанализирован
 */
export const Completed: Story = {
  args: {
    file: mockFileCompleted,
  },
}

/**
 * Файл ожидает анализа
 */
export const Pending: Story = {
  args: {
    file: mockFilePending,
  },
}

/**
 * Ошибка при анализе файла
 */
export const FileError: Story = {
  args: {
    file: mockFileError,
  },
}

/**
 * Файл с длинным именем и многими анализаторами
 */
export const LongFileName: Story = {
  args: {
    file: {
      filePath: "/media/project/very-long-filename-that-might-overflow-the-card-layout-2024-01-15.mp4",
      fileName: "very-long-filename-that-might-overflow-the-card-layout-2024-01-15.mp4",
      status: "analyzing",
      progress: 67,
      currentStage: "Face Detection",
      analyzers: [
        { name: "scene_detection", status: "completed" },
        { name: "audio_quality", status: "completed" },
        { name: "speech_recognition", status: "analyzing" },
        { name: "face_detection", status: "analyzing" },
        { name: "object_detection", status: "pending" },
      ],
      eta: 45,
    },
  },
}

/**
 * Файл почти завершен
 */
export const NearlyComplete: Story = {
  args: {
    file: {
      filePath: "/media/project/final-video.mp4",
      fileName: "final-video.mp4",
      status: "analyzing",
      progress: 95,
      currentStage: "Object Detection (final pass)",
      analyzers: [
        { name: "scene_detection", status: "completed" },
        { name: "audio_quality", status: "completed" },
        { name: "speech_recognition", status: "completed" },
        { name: "face_detection", status: "completed" },
        { name: "object_detection", status: "analyzing" },
      ],
      eta: 8,
    },
  },
}

import type { Meta, StoryObj } from "@storybook/react"
import { fn } from "@storybook/test"

import { OverallProgressCard } from "./overall-progress-card"

/**
 * OverallProgressCard отображает общий прогресс batch анализа файлов в AI Director v3.
 * Показывает процент выполнения, количество файлов, ETA и статистику по статусам файлов.
 */
const meta = {
  title: "Features/AI Director/v3/OverallProgressCard",
  component: OverallProgressCard,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Карточка общего прогресса batch анализа. Отображает процент выполнения, количество завершенных файлов, расчетное время и статистику по файлам с разными статусами.",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    progressData: {
      description: "Данные о прогрессе анализа",
    },
    fileStatistics: {
      description: "Статистика по файлам",
    },
    onCancel: {
      description: "Callback для отмены анализа",
    },
    onPause: {
      description: "Callback для паузы анализа (опционально)",
    },
  },
  args: {
    onCancel: fn(),
    onPause: fn(),
  },
} satisfies Meta<typeof OverallProgressCard>

export default meta
type Story = StoryObj<typeof meta>

/**
 * Анализ в процессе - начальная стадия
 */
export const AnalyzingEarly: Story = {
  args: {
    progressData: {
      progress: 15,
      completedFiles: 1,
      totalFiles: 8,
      estimatedTimeRemaining: 480,
      status: "analyzing",
    },
    fileStatistics: {
      completed: 1,
      analyzing: 2,
      pending: 5,
      error: 0,
    },
  },
}

/**
 * Анализ в процессе - середина
 */
export const AnalyzingMidway: Story = {
  args: {
    progressData: {
      progress: 55,
      completedFiles: 5,
      totalFiles: 10,
      estimatedTimeRemaining: 240,
      status: "analyzing",
    },
    fileStatistics: {
      completed: 5,
      analyzing: 2,
      pending: 3,
      error: 0,
    },
  },
}

/**
 * Анализ почти завершен
 */
export const AnalyzingNearComplete: Story = {
  args: {
    progressData: {
      progress: 90,
      completedFiles: 9,
      totalFiles: 10,
      estimatedTimeRemaining: 45,
      status: "analyzing",
    },
    fileStatistics: {
      completed: 9,
      analyzing: 1,
      pending: 0,
      error: 0,
    },
  },
}

/**
 * Анализ завершен успешно
 */
export const Completed: Story = {
  args: {
    progressData: {
      progress: 100,
      completedFiles: 15,
      totalFiles: 15,
      status: "completed",
    },
    fileStatistics: {
      completed: 15,
      analyzing: 0,
      pending: 0,
      error: 0,
    },
  },
}

/**
 * Анализ с ошибками
 */
export const WithErrors: Story = {
  args: {
    progressData: {
      progress: 100,
      completedFiles: 8,
      totalFiles: 10,
      status: "completed",
    },
    fileStatistics: {
      completed: 8,
      analyzing: 0,
      pending: 0,
      error: 2,
    },
  },
}

/**
 * Idle состояние
 */
export const Idle: Story = {
  args: {
    progressData: {
      progress: 0,
      completedFiles: 0,
      totalFiles: 0,
      status: "idle",
    },
    fileStatistics: {
      completed: 0,
      analyzing: 0,
      pending: 0,
      error: 0,
    },
  },
}

/**
 * Большая batch (много файлов)
 */
export const LargeBatch: Story = {
  args: {
    progressData: {
      progress: 35,
      completedFiles: 35,
      totalFiles: 100,
      estimatedTimeRemaining: 3600,
      status: "analyzing",
    },
    fileStatistics: {
      completed: 35,
      analyzing: 5,
      pending: 58,
      error: 2,
    },
  },
}

/**
 * Анализ с только кнопкой Cancel (без Pause)
 */
export const WithoutPauseButton: Story = {
  args: {
    progressData: {
      progress: 45,
      completedFiles: 4,
      totalFiles: 9,
      estimatedTimeRemaining: 180,
      status: "analyzing",
    },
    fileStatistics: {
      completed: 4,
      analyzing: 2,
      pending: 3,
      error: 0,
    },
    onPause: undefined,
  },
}

import type { Meta, StoryObj } from "@storybook/react"
import { fn } from "@storybook/test"

import { EmptyState } from "./empty-state"

/**
 * EmptyState отображается до начала анализа в AI Director v3.
 * Показывает пользователю текущие настройки и предлагает выбрать файлы из медиапула.
 */
const meta = {
  title: "Features/AI Director/v3/EmptyState",
  component: EmptyState,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Компонент пустого состояния для AI Director v3. Показывает призыв к действию для начала анализа и текущие настройки анализа.",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    onSelectFiles: {
      description: "Callback для открытия медиапула",
    },
    currentSettings: {
      description: "Текущие настройки анализа",
    },
  },
  args: {
    onSelectFiles: fn(),
  },
} satisfies Meta<typeof EmptyState>

export default meta
type Story = StoryObj<typeof meta>

/**
 * Balanced режим с базовыми анализаторами
 */
export const BalancedMode: Story = {
  args: {
    currentSettings: {
      mode: "balanced",
      analyzers: ["scene_detection", "audio_quality"],
    },
  },
}

/**
 * Fast режим с минимальным набором анализаторов
 */
export const FastMode: Story = {
  args: {
    currentSettings: {
      mode: "fast",
      analyzers: ["scene_detection"],
    },
  },
}

/**
 * Thorough режим со всеми анализаторами
 */
export const ThoroughMode: Story = {
  args: {
    currentSettings: {
      mode: "thorough",
      analyzers: ["scene_detection", "audio_quality", "speech_recognition", "face_detection", "object_detection"],
    },
  },
}

/**
 * Custom режим с выборочными анализаторами
 */
export const CustomMode: Story = {
  args: {
    currentSettings: {
      mode: "custom",
      analyzers: ["scene_detection", "face_detection", "speech_recognition"],
    },
  },
}

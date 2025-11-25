import type { Meta, StoryObj } from "@storybook/react"
import { fn } from "@storybook/test"

import { AnalysisSettings, type AnalysisSettings as AnalysisSettingsType } from "./analysis-settings"

/**
 * AnalysisSettings - панель настроек анализа для AI Director v3.
 * Позволяет выбрать режим анализа (quick/balanced/comprehensive) и включить/выключить отдельные анализаторы.
 */
const meta = {
  title: "Features/AI Director/v3/AnalysisSettings",
  component: AnalysisSettings,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Компактная панель настроек анализа. Включает выбор режима (Quick/Balanced/Comprehensive) и управление отдельными анализаторами (Audio Quality, Scene Detection, и т.д.).",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    settings: {
      description: "Текущие настройки анализа",
    },
    onSettingsChange: {
      description: "Callback при изменении настроек",
    },
    disabled: {
      control: "boolean",
      description: "Disabled state панели",
    },
  },
  args: {
    onSettingsChange: fn(),
  },
} satisfies Meta<typeof AnalysisSettings>

export default meta
type Story = StoryObj<typeof meta>

const quickSettings: AnalysisSettingsType = {
  mode: "quick",
  analyzers: ["scene_detection"],
}

const balancedSettings: AnalysisSettingsType = {
  mode: "balanced",
  analyzers: ["audio_quality", "scene_detection", "moment_detection"],
}

const comprehensiveSettings: AnalysisSettingsType = {
  mode: "comprehensive",
  analyzers: [
    "audio_quality",
    "scene_detection",
    "moment_detection",
    "person_recognition",
    "speech_detection",
    "visual_quality",
  ],
}

/**
 * Quick режим с минимальным набором анализаторов
 */
export const QuickMode: Story = {
  args: {
    settings: quickSettings,
    disabled: false,
  },
}

/**
 * Balanced режим со стандартным набором анализаторов
 */
export const BalancedMode: Story = {
  args: {
    settings: balancedSettings,
    disabled: false,
  },
}

/**
 * Comprehensive режим со всеми анализаторами
 */
export const ComprehensiveMode: Story = {
  args: {
    settings: comprehensiveSettings,
    disabled: false,
  },
}

/**
 * Кастомный набор анализаторов
 */
export const CustomSelection: Story = {
  args: {
    settings: {
      mode: "balanced",
      analyzers: ["scene_detection", "speech_detection"],
    },
    disabled: false,
  },
}

/**
 * Ни один анализатор не выбран
 */
export const NoAnalyzers: Story = {
  args: {
    settings: {
      mode: "quick",
      analyzers: [],
    },
    disabled: false,
  },
}

/**
 * Disabled состояние (во время анализа)
 */
export const Disabled: Story = {
  args: {
    settings: balancedSettings,
    disabled: true,
  },
}

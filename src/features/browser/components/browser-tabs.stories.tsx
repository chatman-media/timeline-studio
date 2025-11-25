import type { Meta, StoryObj } from "@storybook/react"
import { fn } from "@storybook/test"

import { BrowserTabs } from "./browser-tabs"

/**
 * BrowserTabs отображает навигационные вкладки для переключения между разными типами контента
 * (медиа, музыка, субтитры, эффекты, фильтры, переходы, шаблоны, стилистические шаблоны, сценарии).
 */
const meta = {
  title: "Features/Browser/BrowserTabs",
  component: BrowserTabs,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Компонент навигации по вкладкам Browser. Показывает иконки и названия вкладок с поддержкой активного состояния и i18n.",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    activeTab: {
      control: "select",
      options: [
        "media",
        "music",
        "subtitles",
        "effects",
        "filters",
        "transitions",
        "templates",
        "style-templates",
        "scenarios",
      ],
      description: "Активная вкладка",
    },
    onTabChange: {
      description: "Колбэк при переключении вкладки",
    },
  },
  args: {
    onTabChange: fn(),
  },
} satisfies Meta<typeof BrowserTabs>

export default meta
type Story = StoryObj<typeof meta>

/**
 * Вкладка Media активна (по умолчанию)
 */
export const MediaTab: Story = {
  args: {
    activeTab: "media",
  },
}

/**
 * Вкладка Music активна
 */
export const MusicTab: Story = {
  args: {
    activeTab: "music",
  },
}

/**
 * Вкладка Subtitles активна
 */
export const SubtitlesTab: Story = {
  args: {
    activeTab: "subtitles",
  },
}

/**
 * Вкладка Effects активна
 */
export const EffectsTab: Story = {
  args: {
    activeTab: "effects",
  },
}

/**
 * Вкладка Filters активна
 */
export const FiltersTab: Story = {
  args: {
    activeTab: "filters",
  },
}

/**
 * Вкладка Transitions активна
 */
export const TransitionsTab: Story = {
  args: {
    activeTab: "transitions",
  },
}

/**
 * Вкладка Templates активна
 */
export const TemplatesTab: Story = {
  args: {
    activeTab: "templates",
  },
}

/**
 * Вкладка Style Templates активна
 */
export const StyleTemplatesTab: Story = {
  args: {
    activeTab: "style-templates",
  },
}

/**
 * Вкладка Scenarios активна
 */
export const ScenariosTab: Story = {
  args: {
    activeTab: "scenarios",
  },
}

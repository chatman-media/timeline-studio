import type { Meta, StoryObj } from "@storybook/react"
import { fn } from "@storybook/test"

import { type MediaType, NoFiles } from "./no-files"

/**
 * NoFiles компонент отображает пустое состояние когда нет файлов определенного типа.
 * Показывает инструкции по добавлению файлов и поддерживаемые форматы.
 */
const meta = {
  title: "Features/Browser/NoFiles",
  component: NoFiles,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Универсальный компонент для отображения пустого состояния. Показывает иконку, описание, кнопку импорта и поддерживаемые форматы для разных типов контента.",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    type: {
      control: "select",
      options: [
        "media",
        "music",
        "effects",
        "filters",
        "transitions",
        "templates",
        "style-templates",
        "subtitles",
      ] as MediaType[],
      description: "Тип медиа контента",
    },
    onImport: {
      description: "Колбэк при клике на кнопку импорта",
    },
    className: {
      control: "text",
      description: "Дополнительные CSS классы",
    },
  },
  args: {
    onImport: fn(),
  },
  decorators: [
    (Story) => (
      <div className="w-[600px] h-[500px]">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof NoFiles>

export default meta
type Story = StoryObj<typeof meta>

/**
 * Пустое состояние для медиафайлов (видео, аудио, фото)
 */
export const Media: Story = {
  args: {
    type: "media",
  },
}

/**
 * Пустое состояние для музыкальных файлов
 */
export const Music: Story = {
  args: {
    type: "music",
  },
}

/**
 * Пустое состояние для видео эффектов
 */
export const Effects: Story = {
  args: {
    type: "effects",
  },
}

/**
 * Пустое состояние для цветовых фильтров
 */
export const Filters: Story = {
  args: {
    type: "filters",
  },
}

/**
 * Пустое состояние для переходов между клипами
 */
export const Transitions: Story = {
  args: {
    type: "transitions",
  },
}

/**
 * Пустое состояние для шаблонов проектов
 */
export const Templates: Story = {
  args: {
    type: "templates",
  },
}

/**
 * Пустое состояние для стилистических шаблонов
 */
export const StyleTemplates: Story = {
  args: {
    type: "style-templates",
  },
}

/**
 * Пустое состояние для субтитров
 */
export const Subtitles: Story = {
  args: {
    type: "subtitles",
  },
}

/**
 * Без кнопки импорта
 */
export const WithoutImportButton: Story = {
  args: {
    type: "media",
    onImport: undefined,
  },
}

/**
 * С дополнительным CSS классом
 */
export const WithCustomClassName: Story = {
  args: {
    type: "music",
    className: "bg-muted/50",
  },
}

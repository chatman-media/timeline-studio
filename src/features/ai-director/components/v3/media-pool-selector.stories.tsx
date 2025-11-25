import type { Meta, StoryObj } from "@storybook/react"
import { fn } from "@storybook/test"

import { MediaPoolSelector } from "./media-pool-selector"

/**
 * MediaPoolSelector - кнопка для открытия медиапула и отображения выбранных файлов.
 * Используется в AI Director v3 для выбора файлов, которые нужно проанализировать.
 */
const meta = {
  title: "Features/AI Director/v3/MediaPoolSelector",
  component: MediaPoolSelector,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Кнопка для открытия медиапула. Отображает количество выбранных файлов в виде badge. Может быть отключена во время анализа.",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    selectedCount: {
      control: { type: "number", min: 0, max: 100 },
      description: "Количество выбранных файлов",
    },
    onOpenMediaPool: {
      description: "Callback для открытия медиапула",
    },
    disabled: {
      control: "boolean",
      description: "Disabled state кнопки",
    },
  },
  args: {
    onOpenMediaPool: fn(),
  },
} satisfies Meta<typeof MediaPoolSelector>

export default meta
type Story = StoryObj<typeof meta>

/**
 * Нет выбранных файлов
 */
export const NoSelection: Story = {
  args: {
    selectedCount: 0,
    disabled: false,
  },
}

/**
 * Несколько файлов выбрано
 */
export const FewFilesSelected: Story = {
  args: {
    selectedCount: 3,
    disabled: false,
  },
}

/**
 * Много файлов выбрано
 */
export const ManyFilesSelected: Story = {
  args: {
    selectedCount: 25,
    disabled: false,
  },
}

/**
 * Один файл выбран
 */
export const SingleFileSelected: Story = {
  args: {
    selectedCount: 1,
    disabled: false,
  },
}

/**
 * Disabled состояние (во время анализа)
 */
export const DisabledWithSelection: Story = {
  args: {
    selectedCount: 5,
    disabled: true,
  },
}

/**
 * Disabled без выбора
 */
export const DisabledWithoutSelection: Story = {
  args: {
    selectedCount: 0,
    disabled: true,
  },
}

import type { Meta, StoryObj } from "@storybook/react"
import { fn } from "@storybook/test"
import { UserSettingsProvider } from "@/features/user-settings"

import { VolumeSlider } from "./volume-slider"

/**
 * VolumeSlider - компонент слайдера громкости для управления звуком в видео плеере.
 * Поддерживает визуальное отображение уровня громкости и плавное изменение значения.
 */
const meta = {
  title: "Features/VideoPlayer/VolumeSlider",
  component: VolumeSlider,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Слайдер громкости с custom визуализацией. Использует встроенный Slider компонент с визуальным оверлеем для отображения уровня громкости.",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    volume: {
      control: { type: "range", min: 0, max: 100, step: 1 },
      description: "Текущая громкость (0-100)",
    },
    onValueChange: {
      description: "Колбэк при изменении значения",
    },
    onValueCommit: {
      description: "Колбэк при завершении изменения",
    },
  },
  args: {
    onValueChange: fn(),
    onValueCommit: fn(),
  },
  decorators: [
    (Story) => (
      <UserSettingsProvider>
        <div className="p-8">
          <Story />
        </div>
      </UserSettingsProvider>
    ),
  ],
} satisfies Meta<typeof VolumeSlider>

export default meta
type Story = StoryObj<typeof meta>

/**
 * Слайдер с громкостью на уровне 50%
 */
export const Default: Story = {
  args: {
    volume: 50,
  },
}

/**
 * Минимальная громкость (отключен звук)
 */
export const Muted: Story = {
  args: {
    volume: 0,
  },
}

/**
 * Максимальная громкость
 */
export const MaxVolume: Story = {
  args: {
    volume: 100,
  },
}

/**
 * Низкая громкость (25%)
 */
export const LowVolume: Story = {
  args: {
    volume: 25,
  },
}

/**
 * Высокая громкость (75%)
 */
export const HighVolume: Story = {
  args: {
    volume: 75,
  },
}

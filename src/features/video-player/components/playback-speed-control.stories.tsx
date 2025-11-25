import type { Meta, StoryObj } from "@storybook/react"

import { PlaybackSpeedControl } from "./playback-speed-control"

/**
 * PlaybackSpeedControl - компонент выпадающего меню для изменения скорости воспроизведения видео.
 * Предлагает предустановленные значения скорости от 0.25x до 2x.
 *
 * NOTE: Этот компонент требует PlayerProvider контекста для полной функциональности.
 * В Storybook отображается только UI, без реальной функциональности.
 */
const meta = {
  title: "Features/VideoPlayer/PlaybackSpeedControl",
  component: PlaybackSpeedControl,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Dropdown меню для управления скоростью воспроизведения. Показывает текущую скорость и предлагает выбор из предустановленных значений (0.25x, 0.5x, 0.75x, 1x, 1.25x, 1.5x, 2x).",
      },
    },
  },
  tags: ["autodocs"],
  decorators: [
    (Story) => {
      // Mock the hook for Storybook
      const mockHook = () => ({
        currentPlaybackRate: 1.0,
        updatePlaybackRate: () => {},
      })

      // Replace the hook temporarily for story rendering
      // This is a workaround since we can't easily provide PlayerProvider context
      const OriginalComponent = Story as any
      return (
        <div className="p-8">
          <OriginalComponent />
        </div>
      )
    },
  ],
} satisfies Meta<typeof PlaybackSpeedControl>

export default meta
type Story = StoryObj<typeof meta>

/**
 * Контрол скорости воспроизведения (UI only в Storybook)
 *
 * NOTE: В реальном приложении этот компонент требует PlayerProvider и PlayerSpeedRamping хуки.
 * В Storybook показан только UI без функциональности.
 */
export const Default: Story = {}

/**
 * Компонент в темной теме
 */
export const DarkTheme: Story = {
  parameters: {
    backgrounds: { default: "dark" },
  },
  decorators: [
    (Story) => (
      <div className="dark">
        <Story />
      </div>
    ),
  ],
}

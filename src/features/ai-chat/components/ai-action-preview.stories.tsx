import type { Meta, StoryObj } from "@storybook/react"
import { fn } from "@storybook/test"

import { type ActionPreviewItem, AIActionPreview } from "./ai-action-preview"

/**
 * AIActionPreview - превью действий AI перед выполнением.
 * Показывает что AI планирует сделать и позволяет подтвердить или отменить.
 */
const meta = {
  title: "Features/AIChat/AIActionPreview",
  component: AIActionPreview,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Компонент предпросмотра действий AI с возможностью подтверждения или отмены. Показывает детали каждого действия, уровень риска и параметры.",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    actions: {
      control: "object",
      description: "Список действий для превью",
    },
    onConfirm: {
      description: "Callback при подтверждении",
    },
    onCancel: {
      description: "Callback при отмене",
    },
    className: {
      control: "text",
      description: "Дополнительные CSS классы",
    },
  },
  args: {
    onConfirm: fn(),
    onCancel: fn(),
  },
  decorators: [
    (Story) => (
      <div className="w-[700px] p-8" data-oid="w.s_8:r">
        <Story data-oid="_6svkv9" />
      </div>
    ),
  ],
} satisfies Meta<typeof AIActionPreview>

export default meta
type Story = StoryObj<typeof meta>

const singleAction: ActionPreviewItem[] = [
  {
    id: "1",
    name: "read_file",
    description: "Прочитать файл components/video-player.tsx",
    params: {
      file_path: "src/components/video-player.tsx",
      line_range: [1, 100],
    },
    risk: "low",
  },
]

const multipleActionsLowRisk: ActionPreviewItem[] = [
  {
    id: "1",
    name: "read_file",
    description: "Прочитать файл components/video-player.tsx",
    params: {
      file_path: "src/components/video-player.tsx",
    },
    risk: "low",
  },
  {
    id: "2",
    name: "grep_search",
    description: "Поиск использования hook useVideoPlayer",
    params: {
      pattern: "useVideoPlayer",
      path: "src/",
      glob: "**/*.tsx",
    },
    risk: "low",
  },
]

const multipleActionsMixedRisk: ActionPreviewItem[] = [
  {
    id: "1",
    name: "read_file",
    description: "Прочитать текущий файл конфигурации",
    params: {
      file_path: "config/app.json",
    },
    risk: "low",
  },
  {
    id: "2",
    name: "edit_file",
    description: "Обновить настройки в файле конфигурации",
    params: {
      file_path: "config/app.json",
      old_string: '"debug": false',
      new_string: '"debug": true',
    },
    risk: "medium",
  },
  {
    id: "3",
    name: "bash_command",
    description: "Перезапустить сервер приложения",
    params: {
      command: "npm run restart",
      timeout: 30000,
    },
    risk: "high",
  },
]

const complexActions: ActionPreviewItem[] = [
  {
    id: "1",
    name: "glob_search",
    description: "Найти все файлы компонентов",
    params: {
      pattern: "src/components/**/*.tsx",
    },
    risk: "low",
  },
  {
    id: "2",
    name: "read_file",
    description: "Прочитать основной компонент приложения",
    params: {
      file_path: "src/app.tsx",
      offset: 0,
      limit: 500,
    },
  },
  {
    id: "3",
    name: "edit_file",
    description: "Добавить новый импорт",
    params: {
      file_path: "src/app.tsx",
      old_string: 'import { Router } from "react-router"',
      new_string: 'import { Router, Route } from "react-router"',
    },
    risk: "medium",
  },
  {
    id: "4",
    name: "write_file",
    description: "Создать новый файл конфигурации",
    params: {
      file_path: "src/config/routes.ts",
      content: "export const routes = []\n",
    },
    risk: "medium",
  },
  {
    id: "5",
    name: "bash_command",
    description: "Запустить линтер для проверки кода",
    params: {
      command: "npm run lint",
    },
    risk: "low",
  },
]

/**
 * Одно действие с низким риском
 */
export const SingleAction: Story = {
  args: {
    actions: singleAction,
  },
}

/**
 * Несколько действий с низким риском
 */
export const MultipleActionsLowRisk: Story = {
  args: {
    actions: multipleActionsLowRisk,
  },
}

/**
 * Действия со смешанным уровнем риска (низкий, средний, высокий)
 */
export const MixedRiskActions: Story = {
  args: {
    actions: multipleActionsMixedRisk,
  },
}

/**
 * Комплексный сценарий с множеством действий
 */
export const ComplexScenario: Story = {
  args: {
    actions: complexActions,
  },
}

/**
 * Действие без указания уровня риска
 */
export const WithoutRiskLevel: Story = {
  args: {
    actions: [
      {
        id: "1",
        name: "web_fetch",
        description: "Получить данные с API",
        params: {
          url: "https://api.example.com/data",
          method: "GET",
        },
      },
    ],
  },
}

/**
 * С пользовательским классом
 */
export const WithCustomClassName: Story = {
  args: {
    actions: singleAction,
    className: "border-2 border-teal",
  },
}

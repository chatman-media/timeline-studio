import type { Meta, StoryObj } from "@storybook/react"

import { AIProcessingIndicator, type AIProcessingStage } from "./ai-processing-indicator"

/**
 * AIProcessingIndicator - детальный индикатор процесса обработки AI.
 * Показывает что именно AI делает сейчас: анализ контекста, использование инструментов, генерация ответа.
 */
const meta = {
  title: "Features/AIChat/AIProcessingIndicator",
  component: AIProcessingIndicator,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Индикатор AI процесса с анимациями и детализацией. Показывает текущий этап обработки, используемые инструменты и прогресс выполнения.",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    stage: {
      control: "select",
      options: ["idle", "analyzing", "using-tools", "generating"] as AIProcessingStage[],
      description: "Текущий этап обработки",
    },
    toolsInUse: {
      control: "object",
      description: "Список используемых инструментов",
    },
    progress: {
      control: { type: "range", min: 0, max: 100, step: 1 },
      description: "Прогресс выполнения (0-100)",
    },
    className: {
      control: "text",
      description: "Дополнительные CSS классы",
    },
  },
  decorators: [
    (Story) => (
      <div className="w-[600px] p-8">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof AIProcessingIndicator>

export default meta
type Story = StoryObj<typeof meta>

/**
 * Анализ контекста проекта
 */
export const Analyzing: Story = {
  args: {
    stage: "analyzing",
  },
}

/**
 * Использование инструментов (один инструмент)
 */
export const UsingToolsSingle: Story = {
  args: {
    stage: "using-tools",
    toolsInUse: ["read_file"],
  },
}

/**
 * Использование нескольких инструментов
 */
export const UsingToolsMultiple: Story = {
  args: {
    stage: "using-tools",
    toolsInUse: ["read_file", "grep_search", "edit_file"],
  },
}

/**
 * Генерация ответа
 */
export const Generating: Story = {
  args: {
    stage: "generating",
  },
}

/**
 * Idle состояние (компонент скрыт)
 */
export const Idle: Story = {
  args: {
    stage: "idle",
  },
}

/**
 * С прогресс баром (0%)
 */
export const WithProgressZero: Story = {
  args: {
    stage: "analyzing",
    progress: 0,
  },
}

/**
 * С прогресс баром (50%)
 */
export const WithProgressHalf: Story = {
  args: {
    stage: "using-tools",
    toolsInUse: ["read_file"],
    progress: 50,
  },
}

/**
 * С прогресс баром (100%)
 */
export const WithProgressFull: Story = {
  args: {
    stage: "generating",
    progress: 100,
  },
}

/**
 * С пользовательским классом
 */
export const WithCustomClassName: Story = {
  args: {
    stage: "analyzing",
    className: "border-2 border-blue-500",
  },
}

/**
 * Длинный список инструментов
 */
export const WithManyTools: Story = {
  args: {
    stage: "using-tools",
    toolsInUse: [
      "read_file",
      "write_file",
      "grep_search",
      "glob_search",
      "edit_file",
      "bash_command",
      "web_fetch",
      "list_files",
    ],
    progress: 35,
  },
}

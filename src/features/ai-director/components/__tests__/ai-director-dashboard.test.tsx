/**
 * @vitest-environment jsdom
 */

import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import type { AgentType, DashboardStats } from "../../types/dashboard"
import { AIDirectorDashboard } from "../ai-director-dashboard"

describe("AIDirectorDashboard", () => {
  const mockStats: DashboardStats = {
    totalAnalysis: 10,
    totalMontages: 5,
    totalRecognitions: 3,
    totalExports: 2,
    totalProcessingTime: 1000,
    averageProcessingTime: 100,
    todayAnalysis: 2,
    todayMontages: 1,
  }

  describe("Rendering", () => {
    it("should render dashboard title", () => {
      render(<AIDirectorDashboard />)

      expect(screen.getByText("AI Director")).toBeInTheDocument()
      expect(screen.getByText("Центр управления AI ассистентами")).toBeInTheDocument()
    })

    it("should render stats cards", () => {
      render(<AIDirectorDashboard stats={mockStats} />)

      expect(screen.getByText("Анализы")).toBeInTheDocument()
      expect(screen.getByText("Монтажи")).toBeInTheDocument()
      expect(screen.getByText("Распознавания")).toBeInTheDocument()
      expect(screen.getByText("Экспорты")).toBeInTheDocument()

      expect(screen.getByText("10")).toBeInTheDocument()
      expect(screen.getByText("5")).toBeInTheDocument()
      expect(screen.getByText("3")).toBeInTheDocument()
      expect(screen.getByText("2")).toBeInTheDocument()
    })

    it("should render default stats when none provided", () => {
      render(<AIDirectorDashboard />)

      // Should show zeros
      const zeros = screen.getAllByText("0")
      expect(zeros.length).toBeGreaterThan(0)
    })

    it("should render tabs", () => {
      render(<AIDirectorDashboard />)

      expect(screen.getByRole("tab", { name: /обзор/i })).toBeInTheDocument()
      expect(screen.getByRole("tab", { name: /агенты/i })).toBeInTheDocument()
      expect(screen.getByRole("tab", { name: /шаблоны/i })).toBeInTheDocument()
    })
  })

  describe("Active Agents", () => {
    it("should show active agents count", () => {
      const agents = [
        {
          id: "agent-1",
          type: "analysis" as AgentType,
          name: "Video Analysis",
          description: "Analyzing video",
          status: "running" as const,
          progress: 50,
        },
      ]

      render(<AIDirectorDashboard agents={agents} />)

      expect(screen.getByText("1 активных агентов")).toBeInTheDocument()
    })

    it("should not show active status when no agents", () => {
      render(<AIDirectorDashboard agents={[]} />)

      expect(screen.queryByText(/активных агентов/)).not.toBeInTheDocument()
    })

    it("should display agent cards in overview", () => {
      const agents = [
        {
          id: "agent-1",
          type: "analysis" as AgentType,
          name: "Video Analysis",
          description: "Analyzing video.mp4",
          status: "running" as const,
          progress: 75,
        },
      ]

      render(<AIDirectorDashboard agents={agents} />)

      expect(screen.getByText("Video Analysis")).toBeInTheDocument()
      expect(screen.getByText("Analyzing video.mp4")).toBeInTheDocument()
      expect(screen.getByText("75%")).toBeInTheDocument()
    })

    it("should show empty state when no active agents", () => {
      render(<AIDirectorDashboard agents={[]} />)

      expect(screen.getByText("Нет активных задач")).toBeInTheDocument()
      expect(screen.getByText("Выберите шаблон для начала работы")).toBeInTheDocument()
    })
  })

  describe("Completed Agents", () => {
    it("should show completed agents section", () => {
      const agents = [
        {
          id: "agent-1",
          type: "analysis" as AgentType,
          name: "Video Analysis",
          description: "Completed",
          status: "completed" as const,
          startedAt: new Date(),
          completedAt: new Date(),
        },
      ]

      render(<AIDirectorDashboard agents={agents} />)

      expect(screen.getByText("Последние результаты")).toBeInTheDocument()
      expect(screen.getByText("Video Analysis")).toBeInTheDocument()
    })

    it("should not show completed section when no completed agents", () => {
      const agents = [
        {
          id: "agent-1",
          type: "analysis" as AgentType,
          name: "Video Analysis",
          description: "Running",
          status: "running" as const,
        },
      ]

      render(<AIDirectorDashboard agents={agents} />)

      expect(screen.queryByText("Последние результаты")).not.toBeInTheDocument()
    })
  })

  describe("Tabs Navigation", () => {
    it("should switch to agents tab", async () => {
      const user = userEvent.setup()
      render(<AIDirectorDashboard />)

      const agentsTab = screen.getByRole("tab", { name: /агенты/i })
      await user.click(agentsTab)

      expect(screen.getByText("Все AI агенты")).toBeInTheDocument()
      expect(screen.getByText("Статус и возможности каждого агента")).toBeInTheDocument()
    })

    it("should switch to workflows tab", async () => {
      const user = userEvent.setup()
      render(<AIDirectorDashboard />)

      const workflowsTab = screen.getByRole("tab", { name: /шаблоны/i })
      await user.click(workflowsTab)

      expect(screen.getByText("Workflow Templates")).toBeInTheDocument()
      expect(screen.getByText("Готовые сценарии для разных задач")).toBeInTheDocument()
    })
  })

  describe("Workflow Selection", () => {
    it("should call onWorkflowSelect when workflow clicked", async () => {
      const user = userEvent.setup()
      const onWorkflowSelect = vi.fn()

      render(<AIDirectorDashboard onWorkflowSelect={onWorkflowSelect} />)

      // Switch to workflows tab
      const workflowsTab = screen.getByRole("tab", { name: /шаблоны/i })
      await user.click(workflowsTab)

      // Workflow cards are Card components - find by workflow name
      const tiktokWorkflow = screen.getByText("TikTok/Reels")
      const card = tiktokWorkflow.closest('[data-slot="card"]')

      expect(card).toBeInTheDocument()
      if (card) {
        await user.click(card)
        expect(onWorkflowSelect).toHaveBeenCalled()
      }
    })
  })

  describe("Agent Types Display", () => {
    it("should show all agent types in agents tab", async () => {
      const user = userEvent.setup()
      render(<AIDirectorDashboard />)

      const agentsTab = screen.getByRole("tab", { name: /агенты/i })
      await user.click(agentsTab)

      expect(screen.getByText("Video Analysis")).toBeInTheDocument()
      expect(screen.getByText("Smart Montage")).toBeInTheDocument()
      expect(screen.getByText("Object Recognition")).toBeInTheDocument()
    })

    it("should highlight active agent types", async () => {
      const user = userEvent.setup()
      const agents = [
        {
          id: "agent-1",
          type: "analysis" as AgentType,
          name: "Video Analysis",
          description: "Active",
          status: "running" as const,
        },
      ]

      render(<AIDirectorDashboard agents={agents} />)

      const agentsTab = screen.getByRole("tab", { name: /агенты/i })
      await user.click(agentsTab)

      // Active agent type card should have special styling
      const analysisCards = screen.getAllByText("Video Analysis")
      expect(analysisCards.length).toBeGreaterThan(0)
    })
  })

  describe("Quick Actions", () => {
    it("should render quick action buttons", () => {
      render(<AIDirectorDashboard />)

      expect(screen.getByText("Анализ видео")).toBeInTheDocument()
      expect(screen.getByText("Smart Montage")).toBeInTheDocument()
      expect(screen.getByText("Распознавание")).toBeInTheDocument()
      expect(screen.getByText("Транскрипция")).toBeInTheDocument()
      expect(screen.getByText("Цветокоррекция")).toBeInTheDocument()
      expect(screen.getByText("Экспорт")).toBeInTheDocument()
    })
  })

  describe("Today's Stats", () => {
    it("should show today's changes in stats", () => {
      const stats: DashboardStats = {
        totalAnalysis: 10,
        totalMontages: 5,
        totalRecognitions: 3,
        totalExports: 2,
        totalProcessingTime: 1000,
        averageProcessingTime: 100,
        todayAnalysis: 3,
        todayMontages: 2,
      }

      render(<AIDirectorDashboard stats={stats} />)

      expect(screen.getByText("+3 сегодня")).toBeInTheDocument()
      expect(screen.getByText("+2 сегодня")).toBeInTheDocument()
    })

    it("should not show today's change when zero", () => {
      const stats: DashboardStats = {
        totalAnalysis: 10,
        totalMontages: 5,
        totalRecognitions: 3,
        totalExports: 2,
        totalProcessingTime: 1000,
        averageProcessingTime: 100,
        todayAnalysis: 0,
        todayMontages: 0,
      }

      render(<AIDirectorDashboard stats={stats} />)

      expect(screen.queryByText(/сегодня/)).not.toBeInTheDocument()
    })
  })
})

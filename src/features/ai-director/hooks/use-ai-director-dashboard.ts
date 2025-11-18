/**
 * Hook для управления AI Director Dashboard
 * Интеграция с существующими AI сервисами и управление состоянием
 */

import { useCallback, useEffect, useState } from "react"

import { createLogger } from "@/lib/tauri-logger"

import type { FileAnalysisProgress } from "../types/analysis-progress"
import type { AgentStatus, AgentType, AIAgent, DashboardStats, WorkflowTemplate } from "../types/dashboard"

const logger = createLogger("useAIDirectorDashboard")

export interface UseAIDirectorDashboardReturn {
  /** Все агенты */
  agents: AIAgent[]
  /** Статистика */
  stats: DashboardStats
  /** Запустить workflow */
  startWorkflow: (workflow: WorkflowTemplate) => Promise<void>
  /** Обновить статус агента */
  updateAgent: (agentId: string, updates: Partial<AIAgent>) => void
  /** Добавить агента */
  addAgent: (agent: AIAgent) => void
  /** Удалить агента */
  removeAgent: (agentId: string) => void
  /** Очистить завершенные агенты */
  clearCompleted: () => void
}

/**
 * Hook для управления Dashboard
 */
export function useAIDirectorDashboard(filesProgress?: FileAnalysisProgress[]): UseAIDirectorDashboardReturn {
  const [agents, setAgents] = useState<AIAgent[]>([])
  const [stats, setStats] = useState<DashboardStats>({
    totalAnalysis: 0,
    totalMontages: 0,
    totalRecognitions: 0,
    totalExports: 0,
    totalProcessingTime: 0,
    averageProcessingTime: 0,
    todayAnalysis: 0,
    todayMontages: 0,
  })

  // Синхронизация с filesProgress для создания агентов анализа
  useEffect(() => {
    if (!filesProgress || filesProgress.length === 0) return

    // Создаем или обновляем агенты на основе filesProgress
    const activeFiles = filesProgress.filter((f) => f.status === "analyzing")
    const completedFiles = filesProgress.filter((f) => f.status === "completed")

    // Обновляем агентов анализа
    setAgents((prev) => {
      const existingAnalysisAgents = prev.filter((a) => a.type === "analysis")
      const otherAgents = prev.filter((a) => a.type !== "analysis")

      // Создаем новых агентов для активных файлов
      const newAgents: AIAgent[] = activeFiles.map((file) => {
        const existing = existingAnalysisAgents.find((a) => a.task?.currentFile === file.filePath)
        if (existing) {
          return {
            ...existing,
            progress: file.progress,
          }
        }

        return {
          id: `analysis-${file.fileId}`,
          type: "analysis" as AgentType,
          name: "Video Analysis",
          description: `Analyzing ${file.fileName}`,
          status: "running" as AgentStatus,
          progress: file.progress,
          startedAt: file.startTime ? new Date(file.startTime) : new Date(),
          task: {
            type: "analysis",
            currentFile: file.filePath,
            filesCount: filesProgress.length,
            processedFiles: completedFiles.length,
          },
        }
      })

      return [...otherAgents, ...newAgents]
    })

    // Обновляем статистику
    setStats((prev) => ({
      ...prev,
      totalAnalysis: completedFiles.length,
      todayAnalysis: completedFiles.filter((f) => {
        const today = new Date()
        return f.startTime && new Date(f.startTime).toDateString() === today.toDateString()
      }).length,
    }))
  }, [filesProgress])

  // Запустить workflow
  const startWorkflow = useCallback(async (workflow: WorkflowTemplate) => {
    logger.infoSync("[Dashboard] Starting workflow", { workflowId: workflow.id })

    // Создаем агенты для каждого этапа workflow
    for (const agentType of workflow.agents) {
      const agentId = `${workflow.id}-${agentType}-${Date.now()}`

      const agent: AIAgent = {
        id: agentId,
        type: agentType,
        name: getAgentName(agentType),
        description: `Running ${workflow.name} workflow`,
        status: "idle" as AgentStatus,
        task: {
          type: workflow.id,
        },
      }

      setAgents((prev) => [...prev, agent])

      // TODO: Запустить реальную задачу агента
      // Здесь должна быть интеграция с существующими сервисами
    }
  }, [])

  // Обновить агента
  const updateAgent = useCallback((agentId: string, updates: Partial<AIAgent>) => {
    setAgents((prev) =>
      prev.map((agent) =>
        agent.id === agentId
          ? {
              ...agent,
              ...updates,
            }
          : agent,
      ),
    )
  }, [])

  // Добавить агента
  const addAgent = useCallback((agent: AIAgent) => {
    setAgents((prev) => [...prev, agent])
  }, [])

  // Удалить агента
  const removeAgent = useCallback((agentId: string) => {
    setAgents((prev) => prev.filter((a) => a.id !== agentId))
  }, [])

  // Очистить завершенные
  const clearCompleted = useCallback(() => {
    setAgents((prev) => prev.filter((a) => a.status !== "completed"))
  }, [])

  return {
    agents,
    stats,
    startWorkflow,
    updateAgent,
    addAgent,
    removeAgent,
    clearCompleted,
  }
}

/**
 * Получить название агента по типу
 */
function getAgentName(type: AgentType): string {
  const names: Record<AgentType, string> = {
    analysis: "Video Analysis",
    montage: "Smart Montage",
    recognition: "Object Recognition",
    transcription: "Speech-to-Text",
    color: "Color Grading",
    export: "Export Optimizer",
  }
  return names[type]
}

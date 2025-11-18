"use client"

/**
 * AI Director Dashboard - Центральная панель управления AI функциями
 * Показывает активные агенты, workflow templates, статистику
 */

import { Activity, BarChart3, Sparkles, Zap } from "lucide-react"
import { useState } from "react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"

import type { AgentType, AIAgent, DashboardStats, WorkflowTemplate } from "../types/dashboard"
import { AGENT_TYPE_DESCRIPTIONS, AGENT_TYPE_ICONS, AGENT_TYPE_NAMES, BUILT_IN_WORKFLOWS } from "../types/dashboard"

interface AIDirectorDashboardProps {
  agents?: AIAgent[]
  stats?: DashboardStats
  onWorkflowSelect?: (workflow: WorkflowTemplate) => void
  className?: string
}

export function AIDirectorDashboard({ agents = [], stats, onWorkflowSelect, className }: AIDirectorDashboardProps) {
  const [activeTab, setActiveTab] = useState<string>("overview")

  // Фильтруем активные агенты
  const activeAgents = agents.filter((a) => a.status === "running")
  const completedAgents = agents.filter((a) => a.status === "completed")
  const errorAgents = agents.filter((a) => a.status === "error")

  // Статистика по умолчанию
  const defaultStats: DashboardStats = stats || {
    totalAnalysis: 0,
    totalMontages: 0,
    totalRecognitions: 0,
    totalExports: 0,
    totalProcessingTime: 0,
    averageProcessingTime: 0,
    todayAnalysis: 0,
    todayMontages: 0,
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Заголовок Dashboard */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Sparkles className="h-8 w-8 text-primary" />
            AI Director
          </h2>
          <p className="text-muted-foreground mt-1">Центр управления AI ассистентами</p>
        </div>

        {/* Статус активности */}
        <div className="flex items-center gap-4">
          {activeAgents.length > 0 && (
            <div className="flex items-center gap-2 text-sm">
              <Activity className="h-4 w-4 text-green-500 animate-pulse" />
              <span className="font-medium">{activeAgents.length} активных агентов</span>
            </div>
          )}
        </div>
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatsCard title="Анализы" value={defaultStats.totalAnalysis} change={defaultStats.todayAnalysis} icon="🔍" />
        <StatsCard title="Монтажи" value={defaultStats.totalMontages} change={defaultStats.todayMontages} icon="✂️" />
        <StatsCard title="Распознавания" value={defaultStats.totalRecognitions} icon="👁️" />
        <StatsCard title="Экспорты" value={defaultStats.totalExports} icon="📤" />
      </div>

      {/* Основной контент */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Обзор</TabsTrigger>
          <TabsTrigger value="agents">
            Агенты
            {activeAgents.length > 0 && (
              <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-primary text-primary-foreground">
                {activeAgents.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="workflows">Шаблоны</TabsTrigger>
        </TabsList>

        {/* Обзор */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Активные агенты */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Активные задачи
                </CardTitle>
                <CardDescription>Текущие операции AI агентов</CardDescription>
              </CardHeader>
              <CardContent>
                {activeAgents.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Zap className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Нет активных задач</p>
                    <p className="text-sm mt-1">Выберите шаблон для начала работы</p>
                  </div>
                ) : (
                  <ScrollArea className="h-[300px]">
                    <div className="space-y-3">
                      {activeAgents.map((agent) => (
                        <AgentCard key={agent.id} agent={agent} />
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>

            {/* Быстрые действия */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Быстрые действия
                </CardTitle>
                <CardDescription>Запустить AI ассистента одним кликом</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  <QuickActionButton icon="🔍" label="Анализ видео" description="Полный анализ" />
                  <QuickActionButton icon="✂️" label="Smart Montage" description="Автомонтаж" />
                  <QuickActionButton icon="👁️" label="Распознавание" description="Объекты и лица" />
                  <QuickActionButton icon="💬" label="Транскрипция" description="Речь в текст" />
                  <QuickActionButton icon="🎨" label="Цветокоррекция" description="Авто-грейдинг" />
                  <QuickActionButton icon="📤" label="Экспорт" description="Оптимизация" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Последние результаты */}
          {completedAgents.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Последние результаты
                </CardTitle>
                <CardDescription>Завершенные задачи</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[200px]">
                  <div className="space-y-2">
                    {completedAgents.slice(0, 5).map((agent) => (
                      <CompletedAgentItem key={agent.id} agent={agent} />
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Агенты */}
        <TabsContent value="agents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Все AI агенты</CardTitle>
              <CardDescription>Статус и возможности каждого агента</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(AGENT_TYPE_NAMES).map(([type, name]) => {
                  const agentType = type as AgentType
                  return (
                    <AgentTypeCard
                      key={type}
                      type={agentType}
                      name={name}
                      description={AGENT_TYPE_DESCRIPTIONS[agentType]}
                      icon={AGENT_TYPE_ICONS[agentType]}
                      isActive={activeAgents.some((a) => a.type === agentType)}
                    />
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Workflow Templates */}
        <TabsContent value="workflows" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Workflow Templates</CardTitle>
              <CardDescription>Готовые сценарии для разных задач</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {BUILT_IN_WORKFLOWS.map((workflow) => (
                  <WorkflowCard key={workflow.id} workflow={workflow} onSelect={() => onWorkflowSelect?.(workflow)} />
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

/**
 * Карточка статистики
 */
interface StatsCardProps {
  title: string
  value: number
  change?: number
  icon: string
}

function StatsCard({ title, value, change, icon }: StatsCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <span className="text-2xl">{icon}</span>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value.toLocaleString()}</div>
        {change !== undefined && change > 0 && <p className="text-xs text-muted-foreground">+{change} сегодня</p>}
      </CardContent>
    </Card>
  )
}

/**
 * Карточка активного агента
 */
function AgentCard({ agent }: { agent: AIAgent }) {
  const icon = AGENT_TYPE_ICONS[agent.type]

  return (
    <div className="flex items-start gap-3 p-3 rounded-lg border bg-card">
      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-xl">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm">{agent.name}</p>
        <p className="text-xs text-muted-foreground truncate">{agent.description}</p>
        {agent.progress !== undefined && (
          <div className="mt-2 space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Прогресс</span>
              <span className="font-medium">{agent.progress}%</span>
            </div>
            <Progress value={agent.progress} className="h-1" />
          </div>
        )}
        {agent.task?.currentFile && <p className="text-xs text-muted-foreground mt-1">{agent.task.currentFile}</p>}
      </div>
    </div>
  )
}

/**
 * Быстрая кнопка действия
 */
interface QuickActionButtonProps {
  icon: string
  label: string
  description: string
  onClick?: () => void
}

function QuickActionButton({ icon, label, description, onClick }: QuickActionButtonProps) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-2 p-4 rounded-lg border bg-card hover:bg-accent transition-colors text-center"
    >
      <span className="text-3xl">{icon}</span>
      <div>
        <p className="font-medium text-sm">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </button>
  )
}

/**
 * Элемент завершенного агента
 */
function CompletedAgentItem({ agent }: { agent: AIAgent }) {
  const icon = AGENT_TYPE_ICONS[agent.type]
  const duration =
    agent.completedAt && agent.startedAt
      ? Math.round((agent.completedAt.getTime() - agent.startedAt.getTime()) / 1000)
      : 0

  return (
    <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent/50 transition-colors">
      <span className="text-xl">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{agent.name}</p>
        <p className="text-xs text-muted-foreground">
          {agent.results?.filesAnalyzed && `${agent.results.filesAnalyzed} файлов • `}
          {duration > 0 && `${duration}s`}
        </p>
      </div>
      <span className="text-green-500 text-xs">✓</span>
    </div>
  )
}

/**
 * Карточка типа агента
 */
interface AgentTypeCardProps {
  type: string
  name: string
  description: string
  icon: string
  isActive: boolean
}

function AgentTypeCard({ name, description, icon, isActive }: AgentTypeCardProps) {
  return (
    <Card className={cn("relative", isActive && "ring-2 ring-primary")}>
      {isActive && <div className="absolute -top-2 -right-2 w-4 h-4 rounded-full bg-green-500 animate-pulse" />}
      <CardHeader>
        <div className="flex items-center gap-3">
          <span className="text-3xl">{icon}</span>
          <div>
            <CardTitle className="text-base">{name}</CardTitle>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  )
}

/**
 * Карточка workflow
 */
interface WorkflowCardProps {
  workflow: WorkflowTemplate
  onSelect?: () => void
}

function WorkflowCard({ workflow, onSelect }: WorkflowCardProps) {
  const categoryColors = {
    social: "text-pink-500",
    professional: "text-blue-500",
    cinematic: "text-purple-500",
    tutorial: "text-green-500",
  }

  return (
    <Card className="cursor-pointer hover:shadow-md transition-all" onClick={onSelect}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{workflow.icon}</span>
            <CardTitle className="text-base">{workflow.name}</CardTitle>
          </div>
          <span className={cn("text-xs font-medium", categoryColors[workflow.category])}>{workflow.category}</span>
        </div>
        <CardDescription className="text-xs">{workflow.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-1">
          {workflow.tags.slice(0, 3).map((tag) => (
            <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-muted">
              {tag}
            </span>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

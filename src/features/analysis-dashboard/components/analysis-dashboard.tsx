// Main Analysis Dashboard component

import { BarChart3, Eye, FileVideo, Plus, Search, Star, Users, Zap } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAnalysis } from "../hooks/use-analysis"
import { AnalysisStatus } from "../types/analysis"
import { CreateProjectDialog } from "./create-project-dialog"
import { MomentBrowser } from "./moment-browser"
import { ProgressVisualization } from "./progress-visualization"
import { ProjectCard } from "./project-card"
import { RealEnginePanel } from "./real-engine-panel"
import { SceneBrowser } from "./scene-browser"
import { StatisticsOverview } from "./statistics-overview"

export function AnalysisDashboard() {
  const {
    dashboardData,
    loading,
    error,
    startAnalysis,
    getProject,
    getProjectScenes,
    getProjectMoments,
    getProjectStatistics,
  } = useAnalysis()

  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  // Handle project selection
  const handleProjectSelect = async (projectId: string) => {
    setSelectedProjectId(projectId)
    await getProject(projectId)
    await getProjectScenes(projectId)
    await getProjectMoments(projectId)
    await getProjectStatistics(projectId)
  }

  // Handle start analysis
  const handleStartAnalysis = async (projectId: string) => {
    await startAnalysis(projectId)
  }

  // Get status color
  const getStatusColor = (status: AnalysisStatus) => {
    switch (status) {
      case AnalysisStatus.Completed:
        return "bg-green-500"
      case AnalysisStatus.InProgress:
        return "bg-blue-500"
      case AnalysisStatus.Failed:
        return "bg-red-500"
      case AnalysisStatus.Cancelled:
        return "bg-gray-500"
      default:
        return "bg-yellow-500"
    }
  }

  // Get progress percentage
  const getProgressPercentage = () => {
    return dashboardData.progress?.progress ? Math.round(dashboardData.progress.progress * 100) : 0
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">AI Analysis Dashboard</h1>
          <p className="text-muted-foreground">Анализ видео с помощью ИИ - сцены, моменты, персоны</p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Новый проект
        </Button>
      </div>

      {/* Error display */}
      {error && (
        <Card className="border-red-200">
          <CardContent className="pt-6">
            <p className="text-red-600">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <FileVideo className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{dashboardData.projects.length}</p>
                <p className="text-xs text-muted-foreground">Проектов</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Eye className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{dashboardData.recentScenes.length}</p>
                <p className="text-xs text-muted-foreground">Сцен найдено</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Star className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-2xl font-bold">{dashboardData.topMoments.length}</p>
                <p className="text-xs text-muted-foreground">Ключевых моментов</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">{dashboardData.statistics?.total_persons || 0}</p>
                <p className="text-xs text-muted-foreground">Персон</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="projects" className="space-y-6">
        <div className="flex justify-between items-center">
          <TabsList>
            <TabsTrigger value="projects">Проекты</TabsTrigger>
            <TabsTrigger value="scenes">Сцены</TabsTrigger>
            <TabsTrigger value="moments">Моменты</TabsTrigger>
            <TabsTrigger value="statistics">Статистика</TabsTrigger>
            <TabsTrigger value="engine">Real Engine</TabsTrigger>
          </TabsList>

          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Поиск по проектам..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-64"
            />
          </div>
        </div>

        {/* Projects Tab */}
        <TabsContent value="projects" className="space-y-4">
          {/* Active Analysis Progress */}
          {dashboardData.progress && dashboardData.progress.status === AnalysisStatus.InProgress && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-blue-500" />
                  Анализ выполняется
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ProgressVisualization progress={dashboardData.progress} />
              </CardContent>
            </Card>
          )}

          {/* Projects Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {dashboardData.projects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onSelect={() => handleProjectSelect(project.id)}
                onStartAnalysis={() => handleStartAnalysis(project.id)}
                isSelected={selectedProjectId === project.id}
              />
            ))}
          </div>

          {dashboardData.projects.length === 0 && !loading && (
            <Card>
              <CardContent className="pt-6 text-center">
                <FileVideo className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Нет проектов анализа</h3>
                <p className="text-muted-foreground mb-4">Создайте первый проект для анализа ваших видео</p>
                <Button onClick={() => setShowCreateDialog(true)}>Создать проект</Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Scenes Tab */}
        <TabsContent value="scenes">
          <SceneBrowser
            scenes={dashboardData.recentScenes}
            onSceneSelect={(scene) => console.log("Selected scene:", scene)}
          />
        </TabsContent>

        {/* Moments Tab */}
        <TabsContent value="moments">
          <MomentBrowser
            moments={dashboardData.topMoments}
            onMomentSelect={(moment) => console.log("Selected moment:", moment)}
          />
        </TabsContent>

        {/* Statistics Tab */}
        <TabsContent value="statistics">
          {dashboardData.statistics ? (
            <StatisticsOverview statistics={dashboardData.statistics} />
          ) : (
            <Card>
              <CardContent className="pt-6 text-center">
                <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Нет данных статистики</h3>
                <p className="text-muted-foreground">Выберите проект для просмотра статистики анализа</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Real Engine Tab */}
        <TabsContent value="engine">
          <RealEnginePanel />
        </TabsContent>
      </Tabs>

      {/* Create Project Dialog */}
      <CreateProjectDialog open={showCreateDialog} onOpenChange={setShowCreateDialog} />
    </div>
  )
}

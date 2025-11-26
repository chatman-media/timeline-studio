/**
 * Emotion graph component for Smart Montage Planner
 * Visualizes emotional arc and intensity throughout the montage
 */

import { Activity, Frown, Heart, Smile, Sparkles, Zap } from "lucide-react"
import type React from "react"
import { useTranslation } from "react-i18next"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"

import type { EmotionalArc, MontagePlan } from "../../types"

interface EmotionGraphProps {
  plan?: MontagePlan
  emotionalArc?: EmotionalArc[]
  className?: string
}

export function EmotionGraph({ plan, emotionalArc, className }: EmotionGraphProps) {
  const { t } = useTranslation()

  const getEmotionIcon = (emotion: string) => {
    const icons: Record<string, React.ReactNode> = {
      joy: <Smile className="h-4 w-4" />,
      excitement: <Zap className="h-4 w-4" />,
      tension: <Activity className="h-4 w-4" />,
      sadness: <Frown className="h-4 w-4" />,
      love: <Heart className="h-4 w-4" />,
      inspiration: <Sparkles className="h-4 w-4" />,
    }
    return icons[emotion.toLowerCase()] || <Heart className="h-4 w-4" />
  }

  const getEmotionColor = (emotion: string) => {
    const colors: Record<string, string> = {
      joy: "text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20",
      excitement: "text-orange-600 bg-orange-100 dark:bg-orange-900/20",
      tension: "text-red-600 bg-red-100 dark:bg-red-900/20",
      sadness: "text-blue-600 bg-blue-100 dark:bg-blue-900/20",
      love: "text-pink-600 bg-pink-100 dark:bg-pink-900/20",
      inspiration: "text-purple-600 bg-purple-100 dark:bg-purple-900/20",
    }
    return colors[emotion.toLowerCase()] || "text-gray-600 bg-gray-100 dark:bg-gray-900/20"
  }

  const getEnergyColor = (energy: number) => {
    if (energy >= 80) return "text-red-600"
    if (energy >= 60) return "text-orange-600"
    if (energy >= 40) return "text-yellow-600"
    return "text-green-600"
  }

  const getEnergyGradient = (energy: number) => {
    if (energy >= 80) return "from-red-500 to-orange-500"
    if (energy >= 60) return "from-orange-500 to-yellow-500"
    if (energy >= 40) return "from-yellow-500 to-green-500"
    return "from-green-500 to-blue-500"
  }

  // Calculate emotional journey
  const emotionalJourney =
    emotionalArc?.map((point, index) => {
      const nextPoint = emotionalArc[index + 1]
      const currentEnergy = point.peakEnergy ?? point.emotionalIntensity
      const nextEnergy = nextPoint ? (nextPoint.peakEnergy ?? nextPoint.emotionalIntensity) : currentEnergy

      const trend = nextPoint
        ? nextEnergy > currentEnergy
          ? "rising"
          : nextEnergy < currentEnergy
            ? "falling"
            : "stable"
        : "stable"

      // Calculate emotion intensity and dominant emotion
      const emotionIntensity = point.emotionalWeights
        ? Math.max(...Object.values(point.emotionalWeights))
        : point.emotionalIntensity

      const dominantEmotion = point.emotionalWeights
        ? Object.entries(point.emotionalWeights).reduce((a, b) => (a[1] > b[1] ? a : b))[0]
        : point.category

      return {
        ...point,
        trend,
        emotionIntensity,
        dominantEmotion,
      }
    }) || []

  // Calculate pacing statistics
  const averageEnergy = emotionalArc
    ? emotionalArc.reduce((sum, point) => sum + point.emotionalIntensity, 0) / emotionalArc.length
    : 0

  const peakEnergy = emotionalArc ? Math.max(...emotionalArc.map((point) => point.emotionalIntensity)) : 0

  const valleyEnergy = emotionalArc ? Math.min(...emotionalArc.map((point) => point.emotionalIntensity)) : 0

  const emotionalRange = peakEnergy - valleyEnergy

  return (
    <Card className={cn("", className)}>
      <CardHeader>
        <CardTitle>{t("montage-planner.analysis.emotionalArc")}</CardTitle>
        <CardDescription>{t("montage-planner.analysis.emotionalArcDescription")}</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="graph" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="graph">{t("montage-planner.analysis.energyGraph")}</TabsTrigger>
            <TabsTrigger value="emotions">{t("montage-planner.emotions.title")}</TabsTrigger>
            <TabsTrigger value="analysis">{t("montage-planner.analysis.title")}</TabsTrigger>
          </TabsList>

          {/* Energy Graph Tab */}
          <TabsContent value="graph" className="space-y-4">
            {/* Main Graph */}
            <div className="relative h-[200px] border rounded-lg p-4 bg-muted/10">
              {/* Y-axis labels */}
              <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between text-xs text-muted-foreground w-8">
                <span>100</span>
                <span>75</span>
                <span>50</span>
                <span>25</span>
                <span>0</span>
              </div>

              {/* Graph area */}
              <div className="ml-10 h-full relative">
                {/* Grid lines */}
                <div className="absolute inset-0 flex flex-col justify-between">
                  {[0, 25, 50, 75, 100].map((value) => (
                    <div key={value} className="border-t border-muted-foreground/10" />
                  ))}
                </div>

                {/* Energy bars */}
                <div className="absolute inset-0 flex items-end justify-between gap-1">
                  {emotionalJourney.map((point, index) => (
                    <div key={`emotion-${index}`} className="flex-1 relative group">
                      {/* Peak energy bar */}
                      <div
                        className={cn(
                          "absolute bottom-0 left-0 right-0 rounded-t transition-all",
                          "bg-linear-to-t",
                          getEnergyGradient(point.emotionalIntensity),
                          "opacity-80 group-hover:opacity-100",
                        )}
                        style={{ height: `${point.emotionalIntensity}%` }}
                      />

                      {/* Average energy line */}
                      <div
                        className="absolute left-0 right-0 h-0.5 bg-white/50"
                        style={{ bottom: `${point.score}%` }}
                      />

                      {/* Tooltip */}
                      <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                        <div className="bg-popover text-popover-foreground text-xs rounded p-2 shadow-lg whitespace-nowrap">
                          <p className="font-medium">
                            {t("montage-planner.sequence")} {index + 1}
                          </p>
                          <p>
                            {t("montage-planner.analysis.peak")}: {point.emotionalIntensity}%
                          </p>
                          <p>
                            {t("montage-planner.analysis.avg")}: {point.score.toFixed(0)}%
                          </p>
                          <p className="capitalize">{point.dominantEmotion}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* X-axis labels */}
              <div className="ml-10 mt-2 flex justify-between text-xs text-muted-foreground">
                <span>{t("montage-planner.timeline.start")}</span>
                <span>{t("montage-planner.timeline.middle")}</span>
                <span>{t("montage-planner.timeline.end")}</span>
              </div>
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-4 gap-4 text-sm">
              <div className="space-y-1">
                <p className="text-muted-foreground">{t("montage-planner.analysis.averageEnergy")}</p>
                <p className={cn("text-2xl font-bold", getEnergyColor(averageEnergy))}>{averageEnergy.toFixed(0)}%</p>
              </div>
              <div className="space-y-1">
                <p className="text-muted-foreground">{t("montage-planner.analysis.peakEnergy")}</p>
                <p className={cn("text-2xl font-bold", getEnergyColor(peakEnergy))}>{peakEnergy}%</p>
              </div>
              <div className="space-y-1">
                <p className="text-muted-foreground">{t("montage-planner.analysis.valleyEnergy")}</p>
                <p className={cn("text-2xl font-bold", getEnergyColor(valleyEnergy))}>{valleyEnergy.toFixed(0)}%</p>
              </div>
              <div className="space-y-1">
                <p className="text-muted-foreground">{t("montage-planner.analysis.dynamicRange")}</p>
                <p className="text-2xl font-bold">{emotionalRange.toFixed(0)}%</p>
              </div>
            </div>
          </TabsContent>

          {/* Emotions Tab */}
          <TabsContent value="emotions" className="space-y-4">
            {/* Emotion Timeline */}
            <div className="space-y-2">
              <p className="text-sm font-medium">{t("montage-planner.emotions.journey")}</p>
              <div className="space-y-2">
                {emotionalJourney.map((point, index) => (
                  <div key={`journey-${index}`} className="flex items-center gap-2">
                    <div className="w-12 text-sm text-muted-foreground">#{index + 1}</div>
                    <div className={cn("p-1.5 rounded", getEmotionColor(point.dominantEmotion))}>
                      {getEmotionIcon(point.dominantEmotion)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium capitalize">{point.dominantEmotion}</span>
                        <Badge variant="outline" className="text-xs">
                          {point.emotionIntensity.toFixed(0)}%
                        </Badge>
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {point.trend === "rising" && "↗"}
                      {point.trend === "falling" && "↘"}
                      {point.trend === "stable" && "→"}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Emotion Distribution */}
            <div className="space-y-2">
              <p className="text-sm font-medium">{t("montage-planner.emotions.distribution")}</p>
              <div className="grid grid-cols-2 gap-2">
                {emotionalArc &&
                  Object.entries(
                    emotionalArc.reduce<Record<string, number>>((acc, point) => {
                      // Group by category (using category as emotion type)
                      const emotion = point.category
                      acc[emotion] = (acc[emotion] || 0) + point.emotionalIntensity
                      return acc
                    }, {}),
                  )
                    .sort((a, b) => b[1] - a[1])
                    .map(([emotion, totalWeight]) => (
                      <div key={emotion} className="flex items-center gap-2 p-2 rounded border">
                        <div className={cn("p-1 rounded", getEmotionColor(emotion))}>{getEmotionIcon(emotion)}</div>
                        <span className="text-sm capitalize flex-1">{emotion}</span>
                        <span className="text-sm font-medium">
                          {((totalWeight / emotionalArc.length) * 100).toFixed(0)}%
                        </span>
                      </div>
                    ))}
              </div>
            </div>
          </TabsContent>

          {/* Analysis Tab */}
          <TabsContent value="analysis" className="space-y-4">
            {/* Arc Type */}
            <div className="space-y-2">
              <p className="text-sm font-medium">{t("montage-planner.analysis.arcAnalysis")}</p>
              <div className="space-y-2 text-sm">
                {emotionalRange > 50 && (
                  <div className="flex items-start gap-2">
                    <Badge variant="default">{t("montage-planner.analysis.highContrast")}</Badge>
                    <p className="text-muted-foreground">{t("montage-planner.analysis.highContrastDescription")}</p>
                  </div>
                )}
                {emotionalRange <= 50 && emotionalRange > 25 && (
                  <div className="flex items-start gap-2">
                    <Badge variant="secondary">{t("montage-planner.analysis.balanced")}</Badge>
                    <p className="text-muted-foreground">{t("montage-planner.analysis.balancedDescription")}</p>
                  </div>
                )}
                {emotionalRange <= 25 && (
                  <div className="flex items-start gap-2">
                    <Badge variant="outline">{t("montage-planner.analysis.steady")}</Badge>
                    <p className="text-muted-foreground">{t("montage-planner.analysis.steadyDescription")}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Pacing Recommendations */}
            <div className="space-y-2">
              <p className="text-sm font-medium">{t("montage-planner.analysis.pacingInsights")}</p>
              <div className="space-y-2">
                {averageEnergy > 70 && (
                  <div className="p-3 rounded-lg bg-orange-100 dark:bg-orange-900/20 text-sm">
                    <p className="font-medium text-orange-900 dark:text-orange-100">
                      {t("montage-planner.analysis.highEnergyDetected")}
                    </p>
                    <p className="text-orange-800 dark:text-orange-200">
                      {t("montage-planner.analysis.highEnergyAdvice")}
                    </p>
                  </div>
                )}
                {averageEnergy < 40 && (
                  <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900/20 text-sm">
                    <p className="font-medium text-blue-900 dark:text-blue-100">
                      {t("montage-planner.analysis.lowEnergyDetected")}
                    </p>
                    <p className="text-blue-800 dark:text-blue-200">{t("montage-planner.analysis.lowEnergyAdvice")}</p>
                  </div>
                )}
                {plan && plan.sequences.some((s) => s.energyLevel > 90) && (
                  <div className="p-3 rounded-lg bg-purple-100 dark:bg-purple-900/20 text-sm">
                    <p className="font-medium text-purple-900 dark:text-purple-100">
                      {t("montage-planner.analysis.peakMoments")}
                    </p>
                    <p className="text-purple-800 dark:text-purple-200">
                      {t("montage-planner.analysis.peakMomentsAdvice")}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

/**
 * Plan viewer component for Smart Montage Planner
 * Displays the generated montage plan with sequences and timeline visualization
 */

import { Check, Layers, Sparkles, TrendingUp, Wand2, X } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { MediaFile } from "@/domains/video-editing/types/media"
import { useMediaFiles } from "@/domains/project-management/hooks"
import { MediaType } from "@/features/media/types/media"
import { formatTime } from "@/lib/date"

import { usePlanGenerator } from "../../hooks/use-plan-generator"
import { useTimelineIntegration } from "../../hooks/use-timeline-integration"

import type { MontagePlan, SequenceType } from "../../types"

interface PlanViewerProps {
  plan: MontagePlan
}

export function PlanViewer({ plan }: PlanViewerProps) {
  const { planStats, sequenceBreakdown, emotionalArc, transitionUsage } = usePlanGenerator()
  const { mediaFiles } = useMediaFiles()
  const { applyPlanToTimeline, isApplying, error, canApplyPlan } = useTimelineIntegration()

  // TODO: Implement plan validation
  const planValidation = null as any

  const handleApplyToTimeline = async () => {
    // Convert MediaItem[] to MediaFile[]
    const convertedMediaFiles: MediaFile[] = mediaFiles.map((item) => {
      const isVideo = item.media_type.toLowerCase().includes("video")
      const isAudio = item.media_type.toLowerCase() === "audio"
      return {
        id: item.id,
        path: item.path,
        name: item.name,
        type: isVideo ? MediaType.Video : isAudio ? MediaType.Audio : MediaType.Unknown,
        isVideo,
        isAudio,
        duration: item.duration || 0,
      }
    })

    await applyPlanToTimeline(plan, convertedMediaFiles, {
      createNewSection: true,
      sectionName: plan.name,
      applyTransitions: true,
    })
  }

  const getSequenceColor = (type: SequenceType) => {
    const colors = {
      intro: "bg-blue-500",
      main: "bg-green-500",
      climax: "bg-red-500",
      resolution: "bg-purple-500",
      outro: "bg-indigo-500",
      montage: "bg-yellow-500",
    }
    return colors[type] || "bg-gray-500"
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600"
    if (score >= 60) return "text-yellow-600"
    return "text-red-600"
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Montage Plan: {plan.name}</h3>
        <div className="flex gap-2">
          <Badge variant="outline">{plan.sequences.length} sequences</Badge>
          <Badge variant="outline">{formatTime(plan.totalDuration)}</Badge>
          <Button onClick={handleApplyToTimeline} disabled={!canApplyPlan(plan) || isApplying} className="gap-2">
            <Wand2 className="h-4 w-4" />
            {isApplying ? "Applying..." : "Apply to Timeline"}
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Plan Scores */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Quality Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <span className={`text-2xl font-bold ${getScoreColor(plan.qualityScore)}`}>
                {plan.qualityScore.toFixed(0)}%
              </span>
              <Progress value={plan.qualityScore} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Engagement Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <span className={`text-2xl font-bold ${getScoreColor(plan.engagementScore)}`}>
                {plan.engagementScore.toFixed(0)}%
              </span>
              <Progress value={plan.engagementScore} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Layers className="h-4 w-4" />
              Coherence Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <span className={`text-2xl font-bold ${getScoreColor(plan.coherenceScore)}`}>
                {plan.coherenceScore.toFixed(0)}%
              </span>
              <Progress value={plan.coherenceScore} className="h-2" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Timeline Visualization */}
      <Card>
        <CardHeader>
          <CardTitle>Timeline Preview</CardTitle>
          <CardDescription>Visual representation of your montage structure</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="w-full">
            <div className="flex gap-1 pb-4">
              {plan.sequences.map((sequence) => (
                <div
                  key={sequence.id}
                  className="relative group"
                  style={{
                    width: `${(sequence.duration / plan.totalDuration) * 100}%`,
                    minWidth: "60px",
                  }}
                >
                  <div className={`h-16 rounded ${getSequenceColor(sequence.type)} opacity-80`}>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xs text-white font-medium capitalize">{sequence.type}</span>
                    </div>
                  </div>
                  <div className="absolute -bottom-6 left-0 right-0 text-xs text-center text-muted-foreground">
                    {formatTime(sequence.duration)}
                  </div>
                  <div className="absolute top-0 left-0 right-0 h-full opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="bg-black/50 rounded text-white text-xs p-2">
                      <p>{sequence.clips.length} clips</p>
                      <p>Energy: {sequence.energyLevel}%</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Detailed View */}
      <Tabs defaultValue="sequences" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="sequences">Sequences</TabsTrigger>
          <TabsTrigger value="rhythm">Rhythm</TabsTrigger>
          <TabsTrigger value="transitions">Transitions</TabsTrigger>
          <TabsTrigger value="validation">Validation</TabsTrigger>
        </TabsList>

        {/* Sequences Tab */}
        <TabsContent value="sequences">
          <Card>
            <CardHeader>
              <CardTitle>Sequence Details</CardTitle>
              <CardDescription>Breakdown of each sequence in your montage</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-4">
                  {sequenceBreakdown.map((seq: any, index: number) => (
                    <div key={seq.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`h-3 w-3 rounded ${getSequenceColor(seq.type)}`} />
                          <h4 className="font-medium capitalize">
                            {seq.type} #{Number(index || 0) + 1}
                          </h4>
                        </div>
                        <div className="flex gap-2 text-sm text-muted-foreground">
                          <span>{seq.clipCount} clips</span>
                          <span>•</span>
                          <span>{formatTime(seq.duration)}</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Energy Level</span>
                          <span>{seq.energyLevel}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Purpose</span>
                          <span className="capitalize">{seq.purpose.replace("-", " ")}</span>
                        </div>
                      </div>
                      {index < sequenceBreakdown.length - 1 && <Separator />}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Rhythm Tab */}
        <TabsContent value="rhythm">
          <Card>
            <CardHeader>
              <CardTitle>Emotional Rhythm</CardTitle>
              <CardDescription>Energy flow throughout your montage</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Energy Graph */}
                <div className="h-[200px] relative border rounded-lg p-4">
                  <div className="absolute inset-4 flex items-end justify-between gap-1">
                    {emotionalArc.map((point: any, _index: number) => (
                      <div
                        key={point.sequenceId}
                        className="flex-1 bg-primary/20 rounded-t"
                        style={{
                          height: `${point.peakEnergy}%`,
                        }}
                      >
                        <div className="text-xs text-center mt-1">{Math.round(point.peakEnergy)}</div>
                      </div>
                    ))}
                  </div>
                  <div className="absolute bottom-0 left-4 right-4 flex justify-between text-xs text-muted-foreground">
                    <span>Start</span>
                    <span>Peak</span>
                    <span>End</span>
                  </div>
                </div>

                {/* Pacing Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium">Pacing Type</p>
                    <p className="text-sm text-muted-foreground capitalize">{plan.pacing.type.replace("-", " ")}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Average Cut Duration</p>
                    <p className="text-sm text-muted-foreground">{plan.pacing.averageCutDuration.toFixed(1)}s</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Cut Range</p>
                    <p className="text-sm text-muted-foreground">
                      {plan.pacing.cutDurationRange[0].toFixed(1)}s - {plan.pacing.cutDurationRange[1].toFixed(1)}s
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Rhythm Complexity</p>
                    <p className="text-sm text-muted-foreground">{plan.pacing.rhythmComplexity}%</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Transitions Tab */}
        <TabsContent value="transitions">
          <Card>
            <CardHeader>
              <CardTitle>Transition Usage</CardTitle>
              <CardDescription>Types and frequency of transitions in your montage</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {transitionUsage.length > 0 ? (
                  transitionUsage.map((usage: any) => (
                    <div key={usage.transitionId} className="flex items-center justify-between">
                      <span className="capitalize">{usage.transitionId.replace("-", " ")}</span>
                      <div className="flex items-center gap-2">
                        <Progress value={(usage.count / transitionUsage[0].count) * 100} className="w-[100px] h-2" />
                        <Badge variant="secondary">{usage.count}</Badge>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No transitions applied yet</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Validation Tab */}
        <TabsContent value="validation">
          <Card>
            <CardHeader>
              <CardTitle>Plan Validation</CardTitle>
              <CardDescription>Quality checks and potential issues</CardDescription>
            </CardHeader>
            <CardContent>
              {planValidation ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    {planValidation.isValid ? (
                      <>
                        <Check className="h-5 w-5 text-green-600" />
                        <span className="font-medium text-green-600">Plan is valid</span>
                      </>
                    ) : (
                      <>
                        <X className="h-5 w-5 text-red-600" />
                        <span className="font-medium text-red-600">Issues detected</span>
                      </>
                    )}
                  </div>

                  {planValidation.issues.length > 0 && (
                    <div className="space-y-2">
                      {planValidation.issues.map((issue: any, index: number) => (
                        <div key={index} className="flex items-start gap-2 text-sm">
                          <Badge
                            variant={
                              issue.severity === "error"
                                ? "destructive"
                                : issue.severity === "warning"
                                  ? "secondary"
                                  : "outline"
                            }
                          >
                            {issue.severity}
                          </Badge>
                          <p className="flex-1">{issue.message}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {planValidation.suggestions.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Suggestions</p>
                      {planValidation.suggestions.map((suggestion: any, index: number) => (
                        <p key={index} className="text-sm text-muted-foreground">
                          • {suggestion}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Run validation to check plan quality</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

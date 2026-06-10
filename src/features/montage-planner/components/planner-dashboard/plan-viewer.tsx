/**
 * Plan viewer component for Smart Montage Planner
 * Displays the generated montage plan with sequences and timeline visualization
 */

import { useMediaFiles } from "@timeline-studio/core/hooks"
import type { MediaFile } from "@timeline-studio/core/types"
import { MediaType } from "@timeline-studio/core/types"
import { Badge } from "@timeline-studio/ui/components/badge"
import { Button } from "@timeline-studio/ui/components/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@timeline-studio/ui/components/card"
import { Progress } from "@timeline-studio/ui/components/progress"
import { ScrollArea, ScrollBar } from "@timeline-studio/ui/components/scroll-area"
import { Separator } from "@timeline-studio/ui/components/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@timeline-studio/ui/components/tabs"
import { Check, Layers, Sparkles, TrendingUp, Wand2, X } from "lucide-react"
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
    <div className="space-y-4" data-oid="asno_zo">
      <div className="flex items-center justify-between" data-oid="h-wg:l:">
        <h3 className="text-lg font-semibold" data-oid="o.p8lvi">
          Montage Plan: {plan.name}
        </h3>
        <div className="flex gap-2" data-oid="c35se0a">
          <Badge variant="outline" data-oid="5f.onop">
            {plan.sequences.length} sequences
          </Badge>
          <Badge variant="outline" data-oid="qd34vfz">
            {formatTime(plan.totalDuration)}
          </Badge>
          <Button
            onClick={handleApplyToTimeline}
            disabled={!canApplyPlan(plan) || isApplying}
            className="gap-2"
            data-oid="xoa069t"
          >
            <Wand2 className="h-4 w-4" data-oid="qp:fekj" />
            {isApplying ? "Applying..." : "Apply to Timeline"}
          </Button>
        </div>
      </div>

      {error && (
        <div
          className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 text-sm text-destructive"
          data-oid="::wapjv"
        >
          {error}
        </div>
      )}

      {/* Plan Scores */}
      <div className="grid gap-4 md:grid-cols-3" data-oid="orzwa:q">
        <Card data-oid="775yk_j">
          <CardHeader className="pb-3" data-oid="ljs15sj">
            <CardTitle className="text-sm font-medium flex items-center gap-2" data-oid="0ix4qde">
              <Sparkles className="h-4 w-4" data-oid="93mmmpe" />
              Quality Score
            </CardTitle>
          </CardHeader>
          <CardContent data-oid="viy2n7i">
            <div className="space-y-2" data-oid="6jf8ehn">
              <span className={`text-2xl font-bold ${getScoreColor(plan.qualityScore)}`} data-oid="grjsrw:">
                {plan.qualityScore.toFixed(0)}%
              </span>
              <Progress value={plan.qualityScore} className="h-2" data-oid="f7ac8.0" />
            </div>
          </CardContent>
        </Card>

        <Card data-oid="nwjf9h0">
          <CardHeader className="pb-3" data-oid="j0u.77c">
            <CardTitle className="text-sm font-medium flex items-center gap-2" data-oid="dqwcp97">
              <TrendingUp className="h-4 w-4" data-oid="d6h92yv" />
              Engagement Score
            </CardTitle>
          </CardHeader>
          <CardContent data-oid="ruq76ei">
            <div className="space-y-2" data-oid="-_84yuq">
              <span className={`text-2xl font-bold ${getScoreColor(plan.engagementScore)}`} data-oid="uk8jtb5">
                {plan.engagementScore.toFixed(0)}%
              </span>
              <Progress value={plan.engagementScore} className="h-2" data-oid="ccsp4vp" />
            </div>
          </CardContent>
        </Card>

        <Card data-oid="g0fjtyh">
          <CardHeader className="pb-3" data-oid="166vq0-">
            <CardTitle className="text-sm font-medium flex items-center gap-2" data-oid="3xjr6xd">
              <Layers className="h-4 w-4" data-oid="mr2w58z" />
              Coherence Score
            </CardTitle>
          </CardHeader>
          <CardContent data-oid="vt-ypm_">
            <div className="space-y-2" data-oid="jrs6yvh">
              <span className={`text-2xl font-bold ${getScoreColor(plan.coherenceScore)}`} data-oid="oug3be4">
                {plan.coherenceScore.toFixed(0)}%
              </span>
              <Progress value={plan.coherenceScore} className="h-2" data-oid="aihfk3j" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Timeline Visualization */}
      <Card data-oid="7jnvf43">
        <CardHeader data-oid="na6ifmv">
          <CardTitle data-oid="a2bdc.e">Timeline Preview</CardTitle>
          <CardDescription data-oid="8skxz4c">Visual representation of your montage structure</CardDescription>
        </CardHeader>
        <CardContent data-oid=":jcruc1">
          <ScrollArea className="w-full" data-oid="fy6i2mi">
            <div className="flex gap-1 pb-4" data-oid="70yznah">
              {plan.sequences.map((sequence) => (
                <div
                  key={sequence.id}
                  className="relative group"
                  style={{
                    width: `${(sequence.duration / plan.totalDuration) * 100}%`,
                    minWidth: "60px",
                  }}
                  data-oid="p7304:9"
                >
                  <div className={`h-16 rounded ${getSequenceColor(sequence.type)} opacity-80`} data-oid="fn.f_f4">
                    <div className="absolute inset-0 flex items-center justify-center" data-oid="jaupuhd">
                      <span className="text-xs text-white font-medium capitalize" data-oid="q7jw8bo">
                        {sequence.type}
                      </span>
                    </div>
                  </div>
                  <div
                    className="absolute -bottom-6 left-0 right-0 text-xs text-center text-muted-foreground"
                    data-oid="64c0k5f"
                  >
                    {formatTime(sequence.duration)}
                  </div>
                  <div
                    className="absolute top-0 left-0 right-0 h-full opacity-0 group-hover:opacity-100 transition-opacity"
                    data-oid="u8hib3u"
                  >
                    <div className="bg-black/50 rounded text-white text-xs p-2" data-oid="cyeo.52">
                      <p data-oid="_ajxn0c">{sequence.clips.length} clips</p>
                      <p data-oid="n_845pu">Energy: {sequence.energyLevel}%</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <ScrollBar orientation="horizontal" data-oid="z.arvs8" />
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Detailed View */}
      <Tabs defaultValue="sequences" className="w-full" data-oid="p:4f_h2">
        <TabsList className="grid w-full grid-cols-4" data-oid="g7q7ei3">
          <TabsTrigger value="sequences" data-oid="r_0vb9f">
            Sequences
          </TabsTrigger>
          <TabsTrigger value="rhythm" data-oid="xw48h9l">
            Rhythm
          </TabsTrigger>
          <TabsTrigger value="transitions" data-oid="9lt3_e-">
            Transitions
          </TabsTrigger>
          <TabsTrigger value="validation" data-oid="o1m.e0r">
            Validation
          </TabsTrigger>
        </TabsList>

        {/* Sequences Tab */}
        <TabsContent value="sequences" data-oid="ai_8ihb">
          <Card data-oid="j_kectl">
            <CardHeader data-oid="3zrykir">
              <CardTitle data-oid="oscjw5b">Sequence Details</CardTitle>
              <CardDescription data-oid="jk:nya:">Breakdown of each sequence in your montage</CardDescription>
            </CardHeader>
            <CardContent data-oid=":80p8zz">
              <ScrollArea className="h-[400px]" data-oid="0e:1oln">
                <div className="space-y-4" data-oid="pv98e9e">
                  {sequenceBreakdown.map((seq: any, index: number) => (
                    <div key={seq.id} className="space-y-2" data-oid="haq3_95">
                      <div className="flex items-center justify-between" data-oid="7_qswo3">
                        <div className="flex items-center gap-2" data-oid=":r_jb1z">
                          <div className={`h-3 w-3 rounded ${getSequenceColor(seq.type)}`} data-oid="18tb.g:" />
                          <h4 className="font-medium capitalize" data-oid="is9-2ld">
                            {seq.type} #{Number(index || 0) + 1}
                          </h4>
                        </div>
                        <div className="flex gap-2 text-sm text-muted-foreground" data-oid="z77ccsl">
                          <span data-oid="uwa_.:c">{seq.clipCount} clips</span>
                          <span data-oid=":7fw7yx">•</span>
                          <span data-oid="hd4n6x8">{formatTime(seq.duration)}</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm" data-oid="foz_5m:">
                        <div className="flex justify-between" data-oid="wpxy8mr">
                          <span className="text-muted-foreground" data-oid="zkyu_uu">
                            Energy Level
                          </span>
                          <span data-oid=".7_qaw-">{seq.energyLevel}%</span>
                        </div>
                        <div className="flex justify-between" data-oid="l1g7caa">
                          <span className="text-muted-foreground" data-oid="h.q7.g1">
                            Purpose
                          </span>
                          <span className="capitalize" data-oid="01318_i">
                            {seq.purpose.replace("-", " ")}
                          </span>
                        </div>
                      </div>
                      {index < sequenceBreakdown.length - 1 && <Separator data-oid="n0ixmrm" />}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Rhythm Tab */}
        <TabsContent value="rhythm" data-oid="b60ef9l">
          <Card data-oid="0x18kjb">
            <CardHeader data-oid="_0w9rzx">
              <CardTitle data-oid="b.xjkbw">Emotional Rhythm</CardTitle>
              <CardDescription data-oid="-as0hqq">Energy flow throughout your montage</CardDescription>
            </CardHeader>
            <CardContent data-oid=".cm5plp">
              <div className="space-y-4" data-oid="hp6dt8n">
                {/* Energy Graph */}
                <div className="h-[200px] relative border rounded-lg p-4" data-oid="3x1ta.l">
                  <div className="absolute inset-4 flex items-end justify-between gap-1" data-oid="b83gcxz">
                    {emotionalArc.map((point: any, _index: number) => (
                      <div
                        key={point.sequenceId}
                        className="flex-1 bg-primary/20 rounded-t"
                        style={{
                          height: `${point.peakEnergy}%`,
                        }}
                        data-oid="1jkg-3:"
                      >
                        <div className="text-xs text-center mt-1" data-oid="qwer14.">
                          {Math.round(point.peakEnergy)}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div
                    className="absolute bottom-0 left-4 right-4 flex justify-between text-xs text-muted-foreground"
                    data-oid="5k-k:p:"
                  >
                    <span data-oid="o47cfb3">Start</span>
                    <span data-oid="3gm19zq">Peak</span>
                    <span data-oid="22lfwxr">End</span>
                  </div>
                </div>

                {/* Pacing Info */}
                <div className="grid grid-cols-2 gap-4" data-oid="3fc-1qi">
                  <div data-oid="swktqo:">
                    <p className="text-sm font-medium" data-oid="l6eq8pf">
                      Pacing Type
                    </p>
                    <p className="text-sm text-muted-foreground capitalize" data-oid="jwpioka">
                      {plan.pacing.type.replace("-", " ")}
                    </p>
                  </div>
                  <div data-oid="cz93h6k">
                    <p className="text-sm font-medium" data-oid="i._ugf_">
                      Average Cut Duration
                    </p>
                    <p className="text-sm text-muted-foreground" data-oid="a-cckl_">
                      {plan.pacing.averageCutDuration.toFixed(1)}s
                    </p>
                  </div>
                  <div data-oid="oz2y4kj">
                    <p className="text-sm font-medium" data-oid="rg4kie3">
                      Cut Range
                    </p>
                    <p className="text-sm text-muted-foreground" data-oid="0s1:cl5">
                      {plan.pacing.cutDurationRange[0].toFixed(1)}s - {plan.pacing.cutDurationRange[1].toFixed(1)}s
                    </p>
                  </div>
                  <div data-oid="re_fo_4">
                    <p className="text-sm font-medium" data-oid="qlpix6d">
                      Rhythm Complexity
                    </p>
                    <p className="text-sm text-muted-foreground" data-oid="5n.n_dy">
                      {plan.pacing.rhythmComplexity}%
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Transitions Tab */}
        <TabsContent value="transitions" data-oid="ouaiqoz">
          <Card data-oid="m7tfmx.">
            <CardHeader data-oid="v6mue72">
              <CardTitle data-oid="2jy6403">Transition Usage</CardTitle>
              <CardDescription data-oid="otrh3c.">Types and frequency of transitions in your montage</CardDescription>
            </CardHeader>
            <CardContent data-oid="csloo:6">
              <div className="space-y-3" data-oid="06wopi-">
                {transitionUsage.length > 0 ? (
                  transitionUsage.map((usage: any) => (
                    <div key={usage.transitionId} className="flex items-center justify-between" data-oid="s9-p-1b">
                      <span className="capitalize" data-oid="mg50zv:">
                        {usage.transitionId.replace("-", " ")}
                      </span>
                      <div className="flex items-center gap-2" data-oid="m:76999">
                        <Progress
                          value={(usage.count / transitionUsage[0].count) * 100}
                          className="w-[100px] h-2"
                          data-oid="5pie45_"
                        />

                        <Badge variant="secondary" data-oid="-8-54kj">
                          {usage.count}
                        </Badge>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground" data-oid="yogri_u">
                    No transitions applied yet
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Validation Tab */}
        <TabsContent value="validation" data-oid="67gsv6a">
          <Card data-oid="3aqix46">
            <CardHeader data-oid="c7gs2vu">
              <CardTitle data-oid="ykg8_wz">Plan Validation</CardTitle>
              <CardDescription data-oid="tvuoxra">Quality checks and potential issues</CardDescription>
            </CardHeader>
            <CardContent data-oid="hbxkw0g">
              {planValidation ? (
                <div className="space-y-4" data-oid="7m-2c45">
                  <div className="flex items-center gap-2" data-oid="b59schf">
                    {planValidation.isValid ? (
                      <>
                        <Check className="h-5 w-5 text-green-600" data-oid="iq644nx" />
                        <span className="font-medium text-green-600" data-oid="kb2c2f_">
                          Plan is valid
                        </span>
                      </>
                    ) : (
                      <>
                        <X className="h-5 w-5 text-red-600" data-oid="rsff5qn" />
                        <span className="font-medium text-red-600" data-oid=":c8kh73">
                          Issues detected
                        </span>
                      </>
                    )}
                  </div>

                  {planValidation.issues.length > 0 && (
                    <div className="space-y-2" data-oid="19y.kag">
                      {planValidation.issues.map((issue: any, index: number) => (
                        <div key={index} className="flex items-start gap-2 text-sm" data-oid="-h2t:68">
                          <Badge
                            variant={
                              issue.severity === "error"
                                ? "destructive"
                                : issue.severity === "warning"
                                  ? "secondary"
                                  : "outline"
                            }
                            data-oid="mbf5akh"
                          >
                            {issue.severity}
                          </Badge>
                          <p className="flex-1" data-oid=":ljz-.n">
                            {issue.message}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  {planValidation.suggestions.length > 0 && (
                    <div className="space-y-2" data-oid="6vwfcg:">
                      <p className="text-sm font-medium" data-oid="4y9wdwo">
                        Suggestions
                      </p>
                      {planValidation.suggestions.map((suggestion: any, index: number) => (
                        <p key={index} className="text-sm text-muted-foreground" data-oid="_b2vg8l">
                          • {suggestion}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground" data-oid="ldotty.">
                  Run validation to check plan quality
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

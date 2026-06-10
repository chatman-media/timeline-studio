/**
 * Moment detector UI component for Smart Montage Planner
 * Visualizes detected key moments and their scores
 */

import { Camera, Heart, Music, Sparkles, Target, Users, Zap } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Badge } from "@timeline-studio/ui/components/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@timeline-studio/ui/components/card"
import { Progress } from "@timeline-studio/ui/components/progress"
import { ScrollArea } from "@timeline-studio/ui/components/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@timeline-studio/ui/components/tabs"
import { formatTime } from "@/lib/date"
import { cn } from "@/lib/utils"
import type { Fragment } from "../../types"
import { MomentCategory } from "../../types"

interface MomentDetectorProps {
  fragments: Fragment[]
  className?: string
}

export function MomentDetector({ fragments, className }: MomentDetectorProps) {
  const { t } = useTranslation()

  const getMomentIcon = (type: MomentCategory) => {
    const icons = {
      [MomentCategory.Highlight]: <Sparkles className="h-4 w-4" data-oid="0:vp:8n" />,
      [MomentCategory.Action]: <Zap className="h-4 w-4" data-oid="ql9yg3:" />,
      [MomentCategory.Drama]: <Heart className="h-4 w-4" data-oid="y5f:1r0" />,
      [MomentCategory.Comedy]: <Music className="h-4 w-4" data-oid="jvri3to" />,
      [MomentCategory.Transition]: <Camera className="h-4 w-4" data-oid="rzkefrd" />,
      [MomentCategory.BRoll]: <Camera className="h-4 w-4" data-oid="krzdrbt" />,
      [MomentCategory.Opening]: <Target className="h-4 w-4" data-oid="4gg.x2l" />,
      [MomentCategory.Closing]: <Users className="h-4 w-4" data-oid="d6ovz9y" />,
    }
    return icons[type] || <Sparkles className="h-4 w-4" data-oid="v-4hpyc" />
  }

  const getMomentColor = (type: MomentCategory) => {
    const colors = {
      [MomentCategory.Highlight]: "text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20",
      [MomentCategory.Action]: "text-red-600 bg-red-100 dark:bg-red-900/20",
      [MomentCategory.Drama]: "text-pink-600 bg-pink-100 dark:bg-pink-900/20",
      [MomentCategory.Comedy]: "text-purple-600 bg-purple-100 dark:bg-purple-900/20",
      [MomentCategory.Transition]: "text-blue-600 bg-blue-100 dark:bg-blue-900/20",
      [MomentCategory.BRoll]: "text-gray-600 bg-gray-100 dark:bg-gray-900/20",
      [MomentCategory.Opening]: "text-green-600 bg-green-100 dark:bg-green-900/20",
      [MomentCategory.Closing]: "text-orange-600 bg-orange-100 dark:bg-orange-900/20",
    }
    return colors[type] || "text-gray-600 bg-gray-100 dark:bg-gray-900/20"
  }

  const getScoreBadgeVariant = (score: number): "default" | "secondary" | "outline" => {
    if (score >= 80) return "default"
    if (score >= 60) return "secondary"
    return "outline"
  }

  // Group fragments by video and moment type
  const fragmentsByVideo = fragments.reduce<Record<string, Fragment[]>>((acc, fragment) => {
    if (!acc[fragment.videoId]) {
      acc[fragment.videoId] = []
    }
    acc[fragment.videoId].push(fragment)
    return acc
  }, {})

  const fragmentsByType = fragments.reduce<Record<MomentCategory, Fragment[]>>(
    (acc, fragment) => {
      const type = fragment.score.category
      if (!acc[type]) {
        acc[type] = []
      }
      acc[type].push(fragment)
      return acc
    },
    {} as Record<MomentCategory, Fragment[]>,
  )

  // Sort fragments by score
  const topMoments = [...fragments].sort((a, b) => b.score.totalScore - a.score.totalScore).slice(0, 10)

  // Calculate statistics
  const averageScore =
    fragments.length > 0 ? fragments.reduce((sum, f) => sum + f.score.totalScore, 0) / fragments.length : 0

  const momentTypeCounts = Object.entries(fragmentsByType)
    .map(([type, frags]) => ({
      type: type as MomentCategory,
      count: frags.length,
      percentage: (frags.length / fragments.length) * 100,
    }))
    .sort((a, b) => b.count - a.count)

  return (
    <Card className={cn("", className)} data-oid="4ceo44o">
      <CardHeader data-oid="s3v-2y7">
        <CardTitle data-oid="2pc2wr7">{t("montage-planner.analysis.moments")}</CardTitle>
        <CardDescription data-oid="k7m5:-m">
          {t("common.analyzedMoments", {
            count: fragments.length,
            videos: Object.keys(fragmentsByVideo).length,
          })}
        </CardDescription>
      </CardHeader>
      <CardContent data-oid="5_e8a-t">
        <Tabs defaultValue="overview" className="w-full" data-oid="gyuni_7">
          <TabsList className="grid w-full grid-cols-3" data-oid="peqc.d:">
            <TabsTrigger value="overview" data-oid="_4tf2hn">
              {t("common.overview")}
            </TabsTrigger>
            <TabsTrigger value="moments" data-oid="cq4vst-">
              {t("common.topMoments")}
            </TabsTrigger>
            <TabsTrigger value="timeline" data-oid="ptqyrt3">
              {t("timeline.title")}
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4" data-oid="0qky4o4">
            {/* Statistics */}
            <div className="grid grid-cols-2 gap-4" data-oid="6-hzhai">
              <div className="space-y-2" data-oid="_gbd906">
                <p className="text-sm font-medium" data-oid="x-gy2i3">
                  {t("common.averageScore")}
                </p>
                <div className="flex items-center gap-2" data-oid="rf_.t1f">
                  <span className="text-2xl font-bold" data-oid="h.1fv44">
                    {averageScore.toFixed(0)}
                  </span>
                  <Progress value={averageScore} className="flex-1 h-2" data-oid="4u4.a2s" />
                </div>
              </div>
              <div className="space-y-2" data-oid="0.8ulpm">
                <p className="text-sm font-medium" data-oid="z6:hl:-">
                  {t("common.detectionRate")}
                </p>
                <div className="flex items-center gap-2" data-oid="4ux_a.7">
                  <span className="text-2xl font-bold" data-oid="w6km:gj">
                    {fragments.length}
                  </span>
                  <span className="text-sm text-muted-foreground" data-oid="0u.7c4h">
                    {t("common.momentsDetected")}
                  </span>
                </div>
              </div>
            </div>

            {/* Moment Type Distribution */}
            <div className="space-y-2" data-oid="3yx9ul9">
              <p className="text-sm font-medium" data-oid="gheqd03">
                {t("common.momentTypes")}
              </p>
              <div className="space-y-2" data-oid="_q3rgqa">
                {momentTypeCounts.map(({ type, count, percentage }) => (
                  <div key={type} className="flex items-center gap-2" data-oid="h0l15eb">
                    <div className={cn("p-1 rounded", getMomentColor(type))} data-oid="hv2kwwp">
                      {getMomentIcon(type)}
                    </div>
                    <span className="text-sm flex-1" data-oid="grp74r6">
                      {type}
                    </span>
                    <Badge variant="secondary" data-oid="72c357-">
                      {count}
                    </Badge>
                    <Progress value={percentage} className="w-20 h-2" data-oid="hxsn9fu" />
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Top Moments Tab */}
          <TabsContent value="moments" data-oid="40pglhl">
            <ScrollArea className="h-[400px]" data-oid="wc2pyuc">
              <div className="space-y-2" data-oid="j5:d.tf">
                {topMoments.map((fragment, index) => (
                  <div
                    key={fragment.id}
                    className="flex items-start gap-3 p-3 rounded-lg border hover:bg-accent/50 transition-colors"
                    data-oid="j.kru-5"
                  >
                    <div
                      className="flex items-center justify-center w-8 h-8 rounded-full bg-muted text-sm font-medium"
                      data-oid="216023s"
                    >
                      {index + 1}
                    </div>

                    <div className="flex-1 space-y-2" data-oid=".jqk8_:">
                      <div className="flex items-start justify-between" data-oid="kw.ob.i">
                        <div className="flex items-center gap-2" data-oid="r3:m6y7">
                          <div
                            className={cn("p-1 rounded", getMomentColor(fragment.score.category))}
                            data-oid="th.41v."
                          >
                            {getMomentIcon(fragment.score.category)}
                          </div>
                          <span className="font-medium" data-oid="x6j1h_-">
                            {fragment.videoId}
                          </span>
                          <span className="text-sm text-muted-foreground" data-oid="dmsrm8m">
                            {formatTime(fragment.startTime)} - {formatTime(fragment.endTime)}
                          </span>
                        </div>
                        <Badge variant={getScoreBadgeVariant(fragment.score.totalScore)} data-oid="l-qv8xp">
                          {fragment.score.totalScore.toFixed(0)}
                        </Badge>
                      </div>

                      {fragment.description && (
                        <p className="text-sm text-muted-foreground" data-oid="amo4-l9">
                          {fragment.description}
                        </p>
                      )}

                      <div className="flex items-center gap-4 text-xs text-muted-foreground" data-oid="zcmd0yy">
                        <span data-oid="t0srtpo">Visual: {fragment.score.scores.visual.toFixed(0)}</span>
                        <span data-oid="fmd3jtz">Technical: {fragment.score.scores.technical.toFixed(0)}</span>
                        <span data-oid="5tn3wei">Emotional: {fragment.score.scores.emotional.toFixed(0)}</span>
                        <span data-oid="ixifjyg">Narrative: {fragment.score.scores.narrative.toFixed(0)}</span>
                      </div>

                      {fragment.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1" data-oid="by48qm3">
                          {fragment.tags.map((tag) => (
                            <Badge key={tag} variant="outline" className="text-xs" data-oid="p.5t5i4">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Timeline Tab */}
          <TabsContent value="timeline" data-oid="cmim1-3">
            <div className="space-y-4" data-oid="ak:pop_">
              {Object.entries(fragmentsByVideo).map(([videoId, videoFragments]) => (
                <div key={videoId} className="space-y-2" data-oid="ww0hq4.">
                  <p className="text-sm font-medium" data-oid="_nqc:yr">
                    {videoId}
                  </p>
                  <div className="relative h-8 bg-muted rounded overflow-hidden" data-oid="fit2kxl">
                    {videoFragments.map((fragment) => {
                      const videoDuration = Math.max(...videoFragments.map((f) => f.endTime))
                      const left = (fragment.startTime / videoDuration) * 100
                      const width = (fragment.duration / videoDuration) * 100

                      return (
                        <div
                          key={fragment.id}
                          className={cn(
                            "absolute top-1 h-6 rounded",
                            getMomentColor(fragment.score.category),
                            "opacity-80 hover:opacity-100 transition-opacity cursor-pointer",
                          )}
                          style={{
                            left: `${left}%`,
                            width: `${width}%`,
                            minWidth: "2px",
                          }}
                          title={`${fragment.score.category} - Score: ${fragment.score.totalScore.toFixed(0)}`}
                          data-oid="bk.79_j"
                        />
                      )
                    })}
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground" data-oid="myu6ts4">
                    <span data-oid="lkp0cjq">0:00</span>
                    <span data-oid="h5zvws_">{formatTime(Math.max(...videoFragments.map((f) => f.endTime)))}</span>
                  </div>
                </div>
              ))}

              {/* Legend */}
              <div className="flex flex-wrap gap-2 pt-4 border-t" data-oid="h22u9c.">
                {Object.keys(fragmentsByType).map((type) => (
                  <div key={type} className="flex items-center gap-1" data-oid="hapot1w">
                    <div className={cn("p-1 rounded", getMomentColor(type as MomentCategory))} data-oid=":5b52u1">
                      {getMomentIcon(type as MomentCategory)}
                    </div>
                    <span className="text-xs" data-oid="hl:4kls">
                      {type}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

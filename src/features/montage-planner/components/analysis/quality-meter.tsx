/**
 * Quality meter component for Smart Montage Planner
 * Displays real-time quality metrics for video fragments and overall plan
 */

import { Badge } from "@timeline-studio/ui/components/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@timeline-studio/ui/components/card"
import { Progress } from "@timeline-studio/ui/components/progress"
import { AlertTriangle, CheckCircle, Minus, TrendingDown, TrendingUp } from "lucide-react"
import { useTranslation } from "react-i18next"
import { cn } from "@/lib/utils"

import type { AudioAnalysis, MomentScore, VideoAnalysis } from "../../types"

interface QualityMeterProps {
  videoAnalysis?: VideoAnalysis
  audioAnalysis?: AudioAnalysis
  momentScore?: MomentScore
  className?: string
}

export function QualityMeter({ videoAnalysis, audioAnalysis, momentScore, className }: QualityMeterProps) {
  const { t } = useTranslation()
  const getQualityColor = (score: number) => {
    if (score >= 80) return "text-green-600"
    if (score >= 60) return "text-yellow-600"
    return "text-red-600"
  }

  const getQualityBadge = (score: number) => {
    if (score >= 90)
      return {
        label: t("montage-planner.quality.excellent"),
        variant: "default" as const,
      }
    if (score >= 75)
      return {
        label: t("montage-planner.quality.good"),
        variant: "secondary" as const,
      }
    if (score >= 50)
      return {
        label: t("montage-planner.quality.fair"),
        variant: "outline" as const,
      }
    return {
      label: t("montage-planner.quality.poor"),
      variant: "destructive" as const,
    }
  }

  const getTrendIcon = (current: number, previous?: number) => {
    if (!previous) return <Minus className="h-3 w-3" data-oid="8ycc065" />
    if (current > previous + 5) return <TrendingUp className="h-3 w-3 text-green-600" data-oid="hkk5ka3" />
    if (current < previous - 5) return <TrendingDown className="h-3 w-3 text-red-600" data-oid="iqztdn-" />
    return <Minus className="h-3 w-3" data-oid="3rfvn69" />
  }

  const overallScore = momentScore?.totalScore || 0
  const qualityBadge = getQualityBadge(overallScore)

  return (
    <Card className={cn("", className)} data-oid="vrjnsge">
      <CardHeader data-oid="ss7oiqm">
        <CardTitle data-oid="17xh96r">{t("montage-planner.analysis.quality")}</CardTitle>
        <CardDescription data-oid=":dkuy:k">{t("common.qualityAssessment")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4" data-oid="y5aqj62">
        {/* Overall Quality */}
        <div className="space-y-2" data-oid="hj054pg">
          <div className="flex items-center justify-between" data-oid=".u.fvce">
            <span className="text-sm font-medium" data-oid="da81:3v">
              {t("common.overallQuality")}
            </span>
            <div className="flex items-center gap-2" data-oid=".yf8nzn">
              <Badge variant={qualityBadge.variant} data-oid="4f_qe9:">
                {qualityBadge.label}
              </Badge>
              <span className={cn("text-2xl font-bold", getQualityColor(overallScore))} data-oid="tn_4vdh">
                {overallScore.toFixed(0)}%
              </span>
            </div>
          </div>
          <Progress value={overallScore} className="h-3" data-oid="oyc2v:m" />
        </div>

        {/* Video Metrics */}
        {videoAnalysis && (
          <div className="space-y-3" data-oid="l5qgi7q">
            <h4 className="text-sm font-medium flex items-center gap-2" data-oid="_ojqf7z">
              {t("montage-planner.analysis.title")}
              {(videoAnalysis.quality?.sharpness || 0) >= 70 ? (
                <CheckCircle className="h-4 w-4 text-green-600" data-oid="cdi51u0" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-yellow-600" data-oid="aw_px:q" />
              )}
            </h4>

            <div className="grid grid-cols-2 gap-3 text-sm" data-oid="67mo79l">
              <div className="space-y-1" data-oid="s2z2ps5">
                <div className="flex justify-between items-center" data-oid="i.ml-jv">
                  <span className="text-muted-foreground" data-oid="2axq3ak">
                    {t("common.resolution")}
                  </span>
                  <span className="font-medium" data-oid="9:tbpzf">
                    {videoAnalysis.quality?.resolution?.width || 0}x{videoAnalysis.quality?.resolution?.height || 0}
                  </span>
                </div>
                <div className="flex justify-between items-center" data-oid="sl6g-4:">
                  <span className="text-muted-foreground" data-oid="rejq.4t">
                    {t("common.frameRate")}
                  </span>
                  <span className="font-medium" data-oid="_olp3.s">
                    {videoAnalysis.quality?.frameRate || 0} fps
                  </span>
                </div>
                <div className="flex justify-between items-center" data-oid="u6ya_hh">
                  <span className="text-muted-foreground" data-oid="csv2v-0">
                    {t("common.bitrate")}
                  </span>
                  <span className="font-medium" data-oid="ndl2-9m">
                    {((videoAnalysis.quality?.bitrate || 0) / 1000000).toFixed(1)} Mbps
                  </span>
                </div>
              </div>

              <div className="space-y-1" data-oid="1d_uxgs">
                <div className="flex justify-between items-center" data-oid="h7y:f1f">
                  <span className="text-muted-foreground" data-oid="5-5b13_">
                    {t("montage-planner.quality.sharpness")}
                  </span>
                  <div className="flex items-center gap-1" data-oid="vtj:7v1">
                    <span
                      className={cn("font-medium", getQualityColor(videoAnalysis.quality?.sharpness || 0))}
                      data-oid="ulpva63"
                    >
                      {(videoAnalysis.quality?.sharpness || 0).toFixed(0)}%
                    </span>
                    {getTrendIcon(videoAnalysis.quality?.sharpness || 0)}
                  </div>
                </div>
                <div className="flex justify-between items-center" data-oid="wrxdq67">
                  <span className="text-muted-foreground" data-oid="v2tf:-.">
                    {t("montage-planner.quality.stability")}
                  </span>
                  <div className="flex items-center gap-1" data-oid="3-jm8jg">
                    <span
                      className={cn("font-medium", getQualityColor(videoAnalysis.quality?.stability || 0))}
                      data-oid="2efxkpu"
                    >
                      {(videoAnalysis.quality?.stability || 0).toFixed(0)}%
                    </span>
                    {getTrendIcon(videoAnalysis.quality?.stability || 0)}
                  </div>
                </div>
                <div className="flex justify-between items-center" data-oid="mf0tlsf">
                  <span className="text-muted-foreground" data-oid="egslm1w">
                    {t("montage-planner.quality.exposure")}
                  </span>
                  <div className="flex items-center gap-1" data-oid=".ad:zgr">
                    <span
                      className={cn("font-medium", getQualityColor(videoAnalysis.quality?.exposure || 0))}
                      data-oid="b5accq_"
                    >
                      {(videoAnalysis.quality?.exposure || 0).toFixed(0)}%
                    </span>
                    {getTrendIcon(videoAnalysis.quality?.exposure || 0)}
                  </div>
                </div>
              </div>
            </div>

            {/* Composition */}
            <div className="space-y-2" data-oid="y02vj.1">
              <span className="text-sm text-muted-foreground" data-oid="9-t_zuh">
                {t("montage-planner.quality.composition")}
              </span>
              <div className="grid grid-cols-3 gap-2" data-oid="-7_k5s_">
                <div className="text-center" data-oid="i1zt3q8">
                  <Progress value={momentScore?.scores.composition || 0} className="h-2" data-oid="a5gqnwu" />
                  <span className="text-xs text-muted-foreground mt-1" data-oid="-gyv21f">
                    {t("common.ruleOfThirds")}
                  </span>
                </div>
                <div className="text-center" data-oid="f2jl0cp">
                  <Progress value={momentScore?.scores.visual || 0} className="h-2" data-oid="9n-cl3g" />
                  <span className="text-xs text-muted-foreground mt-1" data-oid="lwbwi-g">
                    {t("common.balance")}
                  </span>
                </div>
                <div className="text-center" data-oid="lvhgpx7">
                  <Progress value={videoAnalysis.content?.actionLevel || 0} className="h-2" data-oid="x6zl4jg" />
                  <span className="text-xs text-muted-foreground mt-1" data-oid="19v9szo">
                    {t("common.leadingLines")}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Audio Metrics */}
        {audioAnalysis && (
          <div className="space-y-3" data-oid="g:6idp2">
            <h4 className="text-sm font-medium flex items-center gap-2" data-oid="42sxl5n">
              {t("montage-planner.analysis.audio")}
              {(audioAnalysis.quality?.clarity || 0) >= 70 ? (
                <CheckCircle className="h-4 w-4 text-green-600" data-oid="51usjww" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-yellow-600" data-oid="hiel:4r" />
              )}
            </h4>

            <div className="grid grid-cols-2 gap-3 text-sm" data-oid="68nzqkr">
              <div className="space-y-1" data-oid="3sszbzq">
                <div className="flex justify-between items-center" data-oid="-61vqtd">
                  <span className="text-muted-foreground" data-oid="7bon0wl">
                    {t("common.sampleRate")}
                  </span>
                  <span className="font-medium" data-oid="w0nrtix">
                    {audioAnalysis.quality?.sampleRate || 0} Hz
                  </span>
                </div>
                <div className="flex justify-between items-center" data-oid="v6.wtsj">
                  <span className="text-muted-foreground" data-oid="oz03g9r">
                    {t("common.bitDepth")}
                  </span>
                  <span className="font-medium" data-oid="ibo1w_j">
                    {audioAnalysis.quality?.bitDepth || 0} bit
                  </span>
                </div>
                <div className="flex justify-between items-center" data-oid="fk5nx3w">
                  <span className="text-muted-foreground" data-oid=".irubcl">
                    {t("common.noiseLevel")}
                  </span>
                  <span className="font-medium" data-oid="91vsuwv">
                    {(audioAnalysis.quality?.noiseLevel || 0).toFixed(0)}%
                  </span>
                </div>
              </div>

              <div className="space-y-1" data-oid="_3adhgd">
                <div className="flex justify-between items-center" data-oid="1ib1irw">
                  <span className="text-muted-foreground" data-oid="ycu-t_3">
                    {t("common.speechClarity")}
                  </span>
                  <div className="flex items-center gap-1" data-oid="-9apota">
                    <span
                      className={cn("font-medium", getQualityColor(audioAnalysis.quality?.clarity || 0))}
                      data-oid="s_dxgka"
                    >
                      {(audioAnalysis.quality?.clarity || 0).toFixed(0)}%
                    </span>
                    {getTrendIcon(audioAnalysis.quality?.clarity || 0)}
                  </div>
                </div>
                <div className="flex justify-between items-center" data-oid="nnr8_a4">
                  <span className="text-muted-foreground" data-oid="hcjk-0c">
                    {t("common.musicEnergy")}
                  </span>
                  <div className="flex items-center gap-1" data-oid="ln720nk">
                    <span
                      className={cn("font-medium", getQualityColor(audioAnalysis.music?.energy || 0))}
                      data-oid="n-cofxr"
                    >
                      {(audioAnalysis.music?.energy || 0).toFixed(0)}%
                    </span>
                    {getTrendIcon(audioAnalysis.music?.energy || 0)}
                  </div>
                </div>
                <div className="flex justify-between items-center" data-oid="x7m-_2a">
                  <span className="text-muted-foreground" data-oid="_gft0r-">
                    {t("common.silenceRatio")}
                  </span>
                  <span className="font-medium" data-oid="vijnw-3">
                    {(
                      100 -
                      (audioAnalysis.content?.speechPresence || 0) -
                      (audioAnalysis.content?.musicPresence || 0)
                    ).toFixed(0)}
                    %
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Moment Score Breakdown */}
        {momentScore && (
          <div className="space-y-3" data-oid="cbp3.67">
            <h4 className="text-sm font-medium" data-oid="8id1jxt">
              {t("montage-planner.analysis.moments")}
            </h4>
            <div className="grid grid-cols-2 gap-2 text-sm" data-oid="xe6sd2j">
              <div className="space-y-1" data-oid=":-7tg5g">
                <div className="flex justify-between items-center" data-oid="oi3mzrd">
                  <span className="text-muted-foreground" data-oid="wc0.6cj">
                    {t("common.visualImpact")}
                  </span>
                  <Progress value={momentScore.scores.visual} className="w-16 h-2" data-oid="w28o.-6" />
                </div>
                <div className="flex justify-between items-center" data-oid="kpmzb-p">
                  <span className="text-muted-foreground" data-oid=".6xdb0z">
                    {t("common.technicalQuality")}
                  </span>
                  <Progress value={momentScore.scores.technical} className="w-16 h-2" data-oid="znmcr2w" />
                </div>
              </div>
              <div className="space-y-1" data-oid="8r34rwk">
                <div className="flex justify-between items-center" data-oid="b0u6r8d">
                  <span className="text-muted-foreground" data-oid="9qca0vn">
                    {t("common.emotionalValue")}
                  </span>
                  <Progress value={momentScore.scores.emotional} className="w-16 h-2" data-oid="jlcxllk" />
                </div>
                <div className="flex justify-between items-center" data-oid="kadylsf">
                  <span className="text-muted-foreground" data-oid="qxf4nca">
                    {t("common.relevance")}
                  </span>
                  <Progress value={momentScore.scores.narrative} className="w-16 h-2" data-oid="z56aoc6" />
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

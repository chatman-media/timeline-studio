/**
 * Timing adjuster component for Smart Montage Planner
 * Fine-tune timing, transitions, and pacing of montage sequences
 */

import { Badge } from "@timeline-studio/ui/components/badge"
import { Button } from "@timeline-studio/ui/components/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@timeline-studio/ui/components/card"
import { Label } from "@timeline-studio/ui/components/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@timeline-studio/ui/components/select"
import { Slider } from "@timeline-studio/ui/components/slider"
import { Switch } from "@timeline-studio/ui/components/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@timeline-studio/ui/components/tabs"
import { Film, Music, Pause, Play, Settings2, Zap } from "lucide-react"
import { useState } from "react"
import { formatTime } from "@/lib/date"
import { cn } from "@/lib/utils"
import type { MontagePlan, PacingProfile, TransitionStyle } from "../../types"
import { PacingType } from "../../types"

interface TimingAdjusterProps {
  plan: MontagePlan
  onPlanUpdate: (updates: Partial<MontagePlan>) => void
  onPreview?: () => void
  isPlaying?: boolean
  className?: string
}

export function TimingAdjuster({ plan, onPlanUpdate, onPreview, isPlaying = false, className }: TimingAdjusterProps) {
  const [selectedSequenceId, setSelectedSequenceId] = useState<string | null>(plan.sequences[0]?.id || null)

  const transitionStyles: TransitionStyle[] = ["cut", "dissolve", "fade", "wipe", "slide", "zoom", "blur", "glitch"]

  const pacingTypes = [
    {
      value: PacingType.Steady,
      label: "Steady",
      description: "Balanced rhythm",
    },
    {
      value: PacingType.Variable,
      label: "Variable",
      description: "Varied pacing",
    },
    {
      value: PacingType.Rhythmic,
      label: "Rhythmic",
      description: "Musical rhythm",
    },
    {
      value: PacingType.Accelerating,
      label: "Accelerating",
      description: "Building momentum",
    },
    {
      value: PacingType.Decelerating,
      label: "Decelerating",
      description: "Slowing down",
    },
  ]

  const updatePacing = (updates: Partial<PacingProfile>) => {
    onPlanUpdate({
      pacing: {
        ...plan.pacing,
        ...updates,
      },
    })
  }

  const updateSequenceTiming = (sequenceId: string, duration: number) => {
    const updatedSequences = plan.sequences.map((seq) => (seq.id === sequenceId ? { ...seq, duration } : seq))
    const totalDuration = updatedSequences.reduce((sum, seq) => sum + seq.duration, 0)

    onPlanUpdate({
      sequences: updatedSequences,
      totalDuration,
    })
  }

  const applyTransitionPreset = (preset: string) => {
    let transitions: Array<{
      from: string
      to: string
      style: TransitionStyle
      duration: number
    }>

    switch (preset) {
      case "smooth":
        transitions = plan.sequences.slice(0, -1).map((seq, i) => ({
          from: seq.id,
          to: plan.sequences[i + 1].id,
          style: "dissolve",
          duration: 1.0,
        }))
        break
      case "dynamic":
        transitions = plan.sequences.slice(0, -1).map((seq, i) => ({
          from: seq.id,
          to: plan.sequences[i + 1].id,
          style: i % 2 === 0 ? "cut" : "slide",
          duration: i % 2 === 0 ? 0 : 0.5,
        }))
        break
      case "cinematic":
        transitions = plan.sequences.slice(0, -1).map((seq, i) => ({
          from: seq.id,
          to: plan.sequences[i + 1].id,
          style: "fade",
          duration: 2.0,
        }))
        break
      default:
        transitions = []
    }

    onPlanUpdate({ transitions })
  }

  const selectedSequence = plan.sequences.find((seq) => seq.id === selectedSequenceId)

  return (
    <Card className={cn("", className)} data-oid="egjkm5p">
      <CardHeader data-oid="81co30g">
        <div className="flex items-center justify-between" data-oid="no9q7sv">
          <div data-oid=".p62m_z">
            <CardTitle data-oid="e9i62qg">Timing & Pacing</CardTitle>
            <CardDescription data-oid="ut4bja:">Fine-tune the rhythm and flow of your montage</CardDescription>
          </div>
          {onPreview && (
            <Button variant="outline" size="sm" onClick={onPreview} data-oid="5mth4-s">
              {isPlaying ? (
                <>
                  <Pause className="h-4 w-4 mr-2" data-oid=":c7y9ha" />
                  Pause
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" data-oid="ln7tal:" />
                  Preview
                </>
              )}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent data-oid="aekxnw7">
        <Tabs defaultValue="pacing" className="w-full" data-oid="ydfl1y9">
          <TabsList className="grid w-full grid-cols-3" data-oid="zt.h9gy">
            <TabsTrigger value="pacing" data-oid="-xaoarv">
              Pacing
            </TabsTrigger>
            <TabsTrigger value="sequences" data-oid="tvjgq96">
              Sequences
            </TabsTrigger>
            <TabsTrigger value="transitions" data-oid="9k-hgn8">
              Transitions
            </TabsTrigger>
          </TabsList>

          {/* Pacing Tab */}
          <TabsContent value="pacing" className="space-y-4" data-oid="t7w41c8">
            {/* Pacing Type */}
            <div className="space-y-2" data-oid="etqacsr">
              <Label data-oid="zlfp9nf">Pacing Style</Label>
              <Select
                value={plan.pacing.type}
                onValueChange={(value) => updatePacing({ type: value as PacingType })}
                data-oid="f3gpn:5"
              >
                <SelectTrigger data-oid="aew_b6.">
                  <SelectValue data-oid="p4xijla" />
                </SelectTrigger>
                <SelectContent data-oid="07w-nd7">
                  {pacingTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value} data-oid="0qq46yj">
                      <div data-oid="h9-ci5.">
                        <div className="font-medium" data-oid="7mguwsr">
                          {type.label}
                        </div>
                        <div className="text-xs text-muted-foreground" data-oid="z2hu9io">
                          {type.description}
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Average Cut Duration */}
            <div className="space-y-2" data-oid="p_.0-q4">
              <div className="flex items-center justify-between" data-oid="a7_rrl8">
                <Label data-oid="5sgojjs">Average Cut Duration</Label>
                <span className="text-sm text-muted-foreground" data-oid="gj45pwu">
                  {plan.pacing.averageCutDuration.toFixed(1)}s
                </span>
              </div>
              <Slider
                value={[plan.pacing.averageCutDuration]}
                onValueChange={([value]) => updatePacing({ averageCutDuration: value })}
                min={0.5}
                max={10}
                step={0.1}
                className="w-full"
                data-oid="lc8fs7g"
              />
            </div>

            {/* Cut Duration Range */}
            <div className="space-y-2" data-oid="r-z1f9h">
              <Label data-oid="8:6bmju">Cut Duration Range</Label>
              <div className="grid grid-cols-2 gap-4" data-oid="-rys4ib">
                <div className="space-y-2" data-oid="hl9x6no">
                  <div className="flex items-center justify-between" data-oid="zfh-10f">
                    <span className="text-sm" data-oid="qdfk.29">
                      Minimum
                    </span>
                    <span className="text-sm text-muted-foreground" data-oid="m.dd27d">
                      {plan.pacing.cutDurationRange[0].toFixed(1)}s
                    </span>
                  </div>
                  <Slider
                    value={[plan.pacing.cutDurationRange[0]]}
                    onValueChange={([value]) =>
                      updatePacing({
                        cutDurationRange: [value, plan.pacing.cutDurationRange[1]],
                      })
                    }
                    min={0.1}
                    max={plan.pacing.cutDurationRange[1]}
                    step={0.1}
                    className="w-full"
                    data-oid="vmvt6ip"
                  />
                </div>
                <div className="space-y-2" data-oid="8jiatnq">
                  <div className="flex items-center justify-between" data-oid="f.vokay">
                    <span className="text-sm" data-oid="v6knqr4">
                      Maximum
                    </span>
                    <span className="text-sm text-muted-foreground" data-oid="4ssal0n">
                      {plan.pacing.cutDurationRange[1].toFixed(1)}s
                    </span>
                  </div>
                  <Slider
                    value={[plan.pacing.cutDurationRange[1]]}
                    onValueChange={([value]) =>
                      updatePacing({
                        cutDurationRange: [plan.pacing.cutDurationRange[0], value],
                      })
                    }
                    min={plan.pacing.cutDurationRange[0]}
                    max={20}
                    step={0.1}
                    className="w-full"
                    data-oid="m5.9dv3"
                  />
                </div>
              </div>
            </div>

            {/* Rhythm Complexity */}
            <div className="space-y-2" data-oid=":etf_m2">
              <div className="flex items-center justify-between" data-oid="77b_a67">
                <Label data-oid="09-axdx">Rhythm Complexity</Label>
                <span className="text-sm text-muted-foreground" data-oid="dshbq6a">
                  {plan.pacing.rhythmComplexity}%
                </span>
              </div>
              <Slider
                value={[plan.pacing.rhythmComplexity]}
                onValueChange={([value]) => updatePacing({ rhythmComplexity: value })}
                max={100}
                step={5}
                className="w-full"
                data-oid="zj3ywzo"
              />

              <p className="text-xs text-muted-foreground" data-oid="48lihww">
                Higher complexity creates more varied and dynamic rhythm patterns
              </p>
            </div>

            {/* Music Sync */}
            <div className="space-y-2" data-oid="wpitx:p">
              <div className="flex items-center justify-between" data-oid="tbczi3_">
                <Label htmlFor="music-sync" className="flex items-center gap-2" data-oid="wqhxht:">
                  <Music className="h-4 w-4" data-oid="..02:g1" />
                  Sync to Music Beats
                </Label>
                <Switch
                  id="music-sync"
                  checked={plan.musicSync || false}
                  onCheckedChange={(checked) => onPlanUpdate({ musicSync: checked })}
                  data-oid="yy:u4zx"
                />
              </div>
              {plan.musicSync && (
                <p className="text-xs text-muted-foreground" data-oid="w.yep0u">
                  Cuts will align with detected music beats when possible
                </p>
              )}
            </div>
          </TabsContent>

          {/* Sequences Tab */}
          <TabsContent value="sequences" className="space-y-4" data-oid="v_gm5xj">
            {/* Sequence Selector */}
            <div className="space-y-2" data-oid="2e8zcyr">
              <Label data-oid="q_7f:zp">Select Sequence</Label>
              <Select value={selectedSequenceId || ""} onValueChange={setSelectedSequenceId} data-oid="3etrj-w">
                <SelectTrigger data-oid="u6jtje8">
                  <SelectValue placeholder="Choose a sequence" data-oid="i9o7025" />
                </SelectTrigger>
                <SelectContent data-oid="41ezfbg">
                  {plan.sequences.map((seq, index) => (
                    <SelectItem key={seq.id} value={seq.id} data-oid="6c4dgze">
                      <div className="flex items-center gap-2" data-oid="y03:xep">
                        <span className="capitalize" data-oid="hcq_j0k">
                          {seq.type}
                        </span>
                        <Badge variant="outline" data-oid="z8cip-k">
                          #{index + 1}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Sequence Timing */}
            {selectedSequence && (
              <>
                <div className="space-y-2" data-oid="twjq6wl">
                  <div className="flex items-center justify-between" data-oid="_i16_q2">
                    <Label data-oid="4rp5j87">Sequence Duration</Label>
                    <span className="text-sm text-muted-foreground" data-oid="371z3ah">
                      {formatTime(selectedSequence.duration)}
                    </span>
                  </div>
                  <Slider
                    value={[selectedSequence.duration]}
                    onValueChange={([value]) => updateSequenceTiming(selectedSequence.id, value)}
                    min={1}
                    max={60}
                    step={0.5}
                    className="w-full"
                    data-oid="36q0ly3"
                  />
                </div>

                <div className="space-y-2" data-oid="f7ov27-">
                  <div className="flex items-center justify-between" data-oid="klznaz2">
                    <Label data-oid="_vxariy">Energy Level</Label>
                    <span className="text-sm text-muted-foreground" data-oid="g9wmbpi">
                      {selectedSequence.energyLevel}%
                    </span>
                  </div>
                  <div className="h-4 bg-muted rounded overflow-hidden" data-oid="c15dya8">
                    <div
                      className="h-full bg-linear-to-r from-green-500 to-red-500 transition-all"
                      style={{ width: `${selectedSequence.energyLevel}%` }}
                      data-oid="ehsh92p"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm" data-oid="zmm2nvc">
                  <div data-oid="x8ao4gv">
                    <span className="text-muted-foreground" data-oid="cid3u4a">
                      Clips
                    </span>
                    <p className="font-medium" data-oid="h_m_4ws">
                      {selectedSequence.clips.length}
                    </p>
                  </div>
                  <div data-oid="nibiz5o">
                    <span className="text-muted-foreground" data-oid="mo67iwe">
                      Purpose
                    </span>
                    <p className="font-medium capitalize" data-oid="m5tw3aj">
                      {selectedSequence.purpose.replace("-", " ")}
                    </p>
                  </div>
                </div>
              </>
            )}
          </TabsContent>

          {/* Transitions Tab */}
          <TabsContent value="transitions" className="space-y-4" data-oid="l4kqfyp">
            {/* Transition Presets */}
            <div className="space-y-2" data-oid="g8la6yk">
              <Label data-oid="opkn9ji">Quick Presets</Label>
              <div className="grid grid-cols-3 gap-2" data-oid="aqk1la2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => applyTransitionPreset("smooth")}
                  className="h-auto py-2"
                  data-oid="193edsf"
                >
                  <div className="text-center" data-oid="5_3o_g1">
                    <Film className="h-4 w-4 mx-auto mb-1" data-oid="ei:u27u" />
                    <div className="text-xs" data-oid="aft:us4">
                      Smooth
                    </div>
                    <div className="text-xs text-muted-foreground" data-oid="khdj0v7">
                      Dissolves
                    </div>
                  </div>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => applyTransitionPreset("dynamic")}
                  className="h-auto py-2"
                  data-oid="zsj0jd7"
                >
                  <div className="text-center" data-oid="wxutnor">
                    <Zap className="h-4 w-4 mx-auto mb-1" data-oid="zt9br4-" />
                    <div className="text-xs" data-oid="i.efno6">
                      Dynamic
                    </div>
                    <div className="text-xs text-muted-foreground" data-oid="qakqvnd">
                      Mixed
                    </div>
                  </div>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => applyTransitionPreset("cinematic")}
                  className="h-auto py-2"
                  data-oid=".wiko-4"
                >
                  <div className="text-center" data-oid="7r0ju7d">
                    <Settings2 className="h-4 w-4 mx-auto mb-1" data-oid="lpx3:8q" />
                    <div className="text-xs" data-oid="rq3w2zh">
                      Cinematic
                    </div>
                    <div className="text-xs text-muted-foreground" data-oid="ret4.h:">
                      Fades
                    </div>
                  </div>
                </Button>
              </div>
            </div>

            {/* Transition List */}
            <div className="space-y-2" data-oid="_rpfk61">
              <Label data-oid="iv14tdk">Sequence Transitions</Label>
              <div className="space-y-2" data-oid="bp5pbtj">
                {plan.sequences.slice(0, -1).map((seq, index) => {
                  const nextSeq = plan.sequences[index + 1]
                  const transition = plan.transitions?.find((t) => t.from === seq.id && t.to === nextSeq.id)

                  return (
                    <div
                      key={`${seq.id}-${nextSeq.id}`}
                      className="flex items-center gap-2 p-2 rounded border"
                      data-oid="44uaelt"
                    >
                      <span className="text-sm capitalize flex-1" data-oid="xfr4-f0">
                        {seq.type} → {nextSeq.type}
                      </span>
                      <Select
                        value={transition?.style || "cut"}
                        onValueChange={(value: TransitionStyle) => {
                          const newTransitions = [
                            ...(plan.transitions || []).filter((t) => !(t.from === seq.id && t.to === nextSeq.id)),
                            {
                              from: seq.id,
                              to: nextSeq.id,
                              style: value,
                              duration: value === "cut" ? 0 : 1.0,
                            },
                          ]

                          onPlanUpdate({ transitions: newTransitions })
                        }}
                        data-oid="upz5:.j"
                      >
                        <SelectTrigger className="w-[120px]" data-oid="o2:b8dr">
                          <SelectValue data-oid="6400a4d" />
                        </SelectTrigger>
                        <SelectContent data-oid="9d7yvlh">
                          {transitionStyles.map((style) => (
                            <SelectItem key={style} value={style} data-oid="w5bya6j">
                              <span className="capitalize" data-oid="go7w2p2">
                                {style}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Global Transition Settings */}
            <div className="space-y-2" data-oid="dlzdcf.">
              <Label data-oid="f:shsn7">Default Transition Duration</Label>
              <div className="flex items-center gap-4" data-oid="vcpox_0">
                <Slider value={[1.0]} min={0} max={3} step={0.1} className="flex-1" data-oid="5-oolo5" />
                <span className="text-sm text-muted-foreground w-12" data-oid="uve4xpk">
                  1.0s
                </span>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

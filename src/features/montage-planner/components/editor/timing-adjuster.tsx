/**
 * Timing adjuster component for Smart Montage Planner
 * Fine-tune timing, transitions, and pacing of montage sequences
 */

import { Film, Music, Pause, Play, Settings2, Zap } from "lucide-react"
import { useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
    <Card className={cn("", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Timing & Pacing</CardTitle>
            <CardDescription>Fine-tune the rhythm and flow of your montage</CardDescription>
          </div>
          {onPreview && (
            <Button variant="outline" size="sm" onClick={onPreview}>
              {isPlaying ? (
                <>
                  <Pause className="h-4 w-4 mr-2" />
                  Pause
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Preview
                </>
              )}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="pacing" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="pacing">Pacing</TabsTrigger>
            <TabsTrigger value="sequences">Sequences</TabsTrigger>
            <TabsTrigger value="transitions">Transitions</TabsTrigger>
          </TabsList>

          {/* Pacing Tab */}
          <TabsContent value="pacing" className="space-y-4">
            {/* Pacing Type */}
            <div className="space-y-2">
              <Label>Pacing Style</Label>
              <Select value={plan.pacing.type} onValueChange={(value) => updatePacing({ type: value as PacingType })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {pacingTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <div>
                        <div className="font-medium">{type.label}</div>
                        <div className="text-xs text-muted-foreground">{type.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Average Cut Duration */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Average Cut Duration</Label>
                <span className="text-sm text-muted-foreground">{plan.pacing.averageCutDuration.toFixed(1)}s</span>
              </div>
              <Slider
                value={[plan.pacing.averageCutDuration]}
                onValueChange={([value]) => updatePacing({ averageCutDuration: value })}
                min={0.5}
                max={10}
                step={0.1}
                className="w-full"
              />
            </div>

            {/* Cut Duration Range */}
            <div className="space-y-2">
              <Label>Cut Duration Range</Label>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Minimum</span>
                    <span className="text-sm text-muted-foreground">{plan.pacing.cutDurationRange[0].toFixed(1)}s</span>
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
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Maximum</span>
                    <span className="text-sm text-muted-foreground">{plan.pacing.cutDurationRange[1].toFixed(1)}s</span>
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
                  />
                </div>
              </div>
            </div>

            {/* Rhythm Complexity */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Rhythm Complexity</Label>
                <span className="text-sm text-muted-foreground">{plan.pacing.rhythmComplexity}%</span>
              </div>
              <Slider
                value={[plan.pacing.rhythmComplexity]}
                onValueChange={([value]) => updatePacing({ rhythmComplexity: value })}
                max={100}
                step={5}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                Higher complexity creates more varied and dynamic rhythm patterns
              </p>
            </div>

            {/* Music Sync */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="music-sync" className="flex items-center gap-2">
                  <Music className="h-4 w-4" />
                  Sync to Music Beats
                </Label>
                <Switch
                  id="music-sync"
                  checked={plan.musicSync || false}
                  onCheckedChange={(checked) => onPlanUpdate({ musicSync: checked })}
                />
              </div>
              {plan.musicSync && (
                <p className="text-xs text-muted-foreground">Cuts will align with detected music beats when possible</p>
              )}
            </div>
          </TabsContent>

          {/* Sequences Tab */}
          <TabsContent value="sequences" className="space-y-4">
            {/* Sequence Selector */}
            <div className="space-y-2">
              <Label>Select Sequence</Label>
              <Select value={selectedSequenceId || ""} onValueChange={setSelectedSequenceId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a sequence" />
                </SelectTrigger>
                <SelectContent>
                  {plan.sequences.map((seq, index) => (
                    <SelectItem key={seq.id} value={seq.id}>
                      <div className="flex items-center gap-2">
                        <span className="capitalize">{seq.type}</span>
                        <Badge variant="outline">#{index + 1}</Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Sequence Timing */}
            {selectedSequence && (
              <>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Sequence Duration</Label>
                    <span className="text-sm text-muted-foreground">{formatTime(selectedSequence.duration)}</span>
                  </div>
                  <Slider
                    value={[selectedSequence.duration]}
                    onValueChange={([value]) => updateSequenceTiming(selectedSequence.id, value)}
                    min={1}
                    max={60}
                    step={0.5}
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Energy Level</Label>
                    <span className="text-sm text-muted-foreground">{selectedSequence.energyLevel}%</span>
                  </div>
                  <div className="h-4 bg-muted rounded overflow-hidden">
                    <div
                      className="h-full bg-linear-to-r from-green-500 to-red-500 transition-all"
                      style={{ width: `${selectedSequence.energyLevel}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Clips</span>
                    <p className="font-medium">{selectedSequence.clips.length}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Purpose</span>
                    <p className="font-medium capitalize">{selectedSequence.purpose.replace("-", " ")}</p>
                  </div>
                </div>
              </>
            )}
          </TabsContent>

          {/* Transitions Tab */}
          <TabsContent value="transitions" className="space-y-4">
            {/* Transition Presets */}
            <div className="space-y-2">
              <Label>Quick Presets</Label>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => applyTransitionPreset("smooth")}
                  className="h-auto py-2"
                >
                  <div className="text-center">
                    <Film className="h-4 w-4 mx-auto mb-1" />
                    <div className="text-xs">Smooth</div>
                    <div className="text-xs text-muted-foreground">Dissolves</div>
                  </div>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => applyTransitionPreset("dynamic")}
                  className="h-auto py-2"
                >
                  <div className="text-center">
                    <Zap className="h-4 w-4 mx-auto mb-1" />
                    <div className="text-xs">Dynamic</div>
                    <div className="text-xs text-muted-foreground">Mixed</div>
                  </div>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => applyTransitionPreset("cinematic")}
                  className="h-auto py-2"
                >
                  <div className="text-center">
                    <Settings2 className="h-4 w-4 mx-auto mb-1" />
                    <div className="text-xs">Cinematic</div>
                    <div className="text-xs text-muted-foreground">Fades</div>
                  </div>
                </Button>
              </div>
            </div>

            {/* Transition List */}
            <div className="space-y-2">
              <Label>Sequence Transitions</Label>
              <div className="space-y-2">
                {plan.sequences.slice(0, -1).map((seq, index) => {
                  const nextSeq = plan.sequences[index + 1]
                  const transition = plan.transitions?.find((t) => t.from === seq.id && t.to === nextSeq.id)

                  return (
                    <div key={`${seq.id}-${nextSeq.id}`} className="flex items-center gap-2 p-2 rounded border">
                      <span className="text-sm capitalize flex-1">
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
                      >
                        <SelectTrigger className="w-[120px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {transitionStyles.map((style) => (
                            <SelectItem key={style} value={style}>
                              <span className="capitalize">{style}</span>
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
            <div className="space-y-2">
              <Label>Default Transition Duration</Label>
              <div className="flex items-center gap-4">
                <Slider value={[1.0]} min={0} max={3} step={0.1} className="flex-1" />
                <span className="text-sm text-muted-foreground w-12">1.0s</span>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

/**
 * Sequence builder component for Smart Montage Planner
 * Allows visual construction and editing of montage sequences
 */

import { ChevronDown, ChevronUp, Copy, GripVertical, Plus, Trash2 } from "lucide-react"
import { useState } from "react"

import { Badge } from "@timeline-studio/ui/components/badge"
import { Button } from "@timeline-studio/ui/components/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@timeline-studio/ui/components/card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@timeline-studio/ui/components/collapsible"
import { Label } from "@timeline-studio/ui/components/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@timeline-studio/ui/components/select"
import { Slider } from "@timeline-studio/ui/components/slider"
import { formatTime } from "@/lib/date"
import { cn } from "@/lib/utils"
import type { Fragment, PlannedClip, Sequence } from "../../types"
import { ClipRole, SequencePurpose, SequenceType } from "../../types"

interface SequenceBuilderProps {
  sequences: Sequence[]
  availableFragments: Fragment[]
  onSequencesChange: (sequences: Sequence[]) => void
  className?: string
}

export function SequenceBuilder({ sequences, availableFragments, onSequencesChange, className }: SequenceBuilderProps) {
  const [expandedSequences, setExpandedSequences] = useState<Set<string>>(new Set())
  const [editingSequence, setEditingSequence] = useState<string | null>(null)

  const sequenceTypes: SequenceType[] = [
    SequenceType.Intro,
    SequenceType.Main,
    SequenceType.Climax,
    SequenceType.Resolution,
    SequenceType.Outro,
    SequenceType.Montage,
  ]

  const sequenceColors: Record<SequenceType, string> = {
    [SequenceType.Intro]: "bg-blue-500",
    [SequenceType.Main]: "bg-green-500",
    [SequenceType.Climax]: "bg-red-500",
    [SequenceType.Resolution]: "bg-purple-500",
    [SequenceType.Outro]: "bg-indigo-500",
    [SequenceType.Montage]: "bg-yellow-500",
  }

  const toggleSequenceExpanded = (sequenceId: string) => {
    const newExpanded = new Set(expandedSequences)
    if (newExpanded.has(sequenceId)) {
      newExpanded.delete(sequenceId)
    } else {
      newExpanded.add(sequenceId)
    }
    setExpandedSequences(newExpanded)
  }

  const addSequence = () => {
    const newSequence: Sequence = {
      id: `seq_${Date.now()}`,
      type: SequenceType.Main,
      clips: [],
      duration: 0,
      energyLevel: 50,
      purpose: SequencePurpose.Development,
      emotionalArc: {
        startEnergy: 50,
        peakPosition: 0.5,
        peakEnergy: 70,
        endEnergy: 50,
        variability: 30,
      },
      transitions: [],
    }
    onSequencesChange([...sequences, newSequence])
  }

  const updateSequence = (sequenceId: string, updates: Partial<Sequence>) => {
    onSequencesChange(sequences.map((seq) => (seq.id === sequenceId ? { ...seq, ...updates } : seq)))
  }

  const deleteSequence = (sequenceId: string) => {
    onSequencesChange(sequences.filter((seq) => seq.id !== sequenceId))
  }

  const duplicateSequence = (sequence: Sequence) => {
    const newSequence: Sequence = {
      ...sequence,
      id: `seq_${Date.now()}`,
      clips: [...sequence.clips],
    }
    const index = sequences.findIndex((seq) => seq.id === sequence.id)
    const newSequences = [...sequences]
    newSequences.splice(index + 1, 0, newSequence)
    onSequencesChange(newSequences)
  }

  const moveSequence = (index: number, direction: "up" | "down") => {
    const newSequences = [...sequences]
    const newIndex = direction === "up" ? index - 1 : index + 1
    if (newIndex >= 0 && newIndex < sequences.length) {
      ;[newSequences[index], newSequences[newIndex]] = [newSequences[newIndex], newSequences[index]]
      onSequencesChange(newSequences)
    }
  }

  const addClipToSequence = (sequenceId: string, fragment: Fragment) => {
    const sequence = sequences.find((seq) => seq.id === sequenceId)
    if (!sequence) return

    const newClip: PlannedClip = {
      fragmentId: fragment.id,
      fragment: fragment,
      sequenceOrder: sequence.clips.length,
      role: ClipRole.Supporting,
      importance: fragment.score?.totalScore || 50,
      suggestions: [],
    }

    updateSequence(sequenceId, {
      clips: [...sequence.clips, newClip],
      duration: sequence.duration + fragment.duration,
    })
  }

  const removeClipFromSequence = (sequenceId: string, fragmentId: string) => {
    const sequence = sequences.find((seq) => seq.id === sequenceId)
    if (!sequence) return

    const clipToRemove = sequence.clips.find((clip) => clip.fragmentId === fragmentId)
    if (!clipToRemove) return

    const newClips = sequence.clips.filter((clip) => clip.fragmentId !== fragmentId)
    const newDuration = newClips.reduce((sum, clip) => sum + (clip.fragment?.duration || 0), 0)

    // Update sequence orders
    newClips.forEach((clip, index) => {
      clip.sequenceOrder = index
    })

    updateSequence(sequenceId, {
      clips: newClips,
      duration: newDuration,
    })
  }

  return (
    <Card className={cn("", className)} data-oid="u1nvujy">
      <CardHeader data-oid="v2-8rtu">
        <div className="flex items-center justify-between" data-oid="z:oguau">
          <div data-oid="vk9:l0w">
            <CardTitle data-oid="alxrjtc">Sequence Builder</CardTitle>
            <CardDescription data-oid="3d1u8s7">Construct and arrange sequences for your montage</CardDescription>
          </div>
          <Button onClick={addSequence} size="sm" data-oid="_49i_2j">
            <Plus className="h-4 w-4 mr-2" data-oid="7k5.o8f" />
            Add Sequence
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4" data-oid="9qq1opc">
        {sequences.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground" data-oid="-7yn6jv">
            <p data-oid=".4jiq4g">No sequences yet. Click &quot;Add Sequence&quot; to start building your montage.</p>
          </div>
        ) : (
          <div className="space-y-3" data-oid="pop.f:j">
            {sequences.map((sequence, index) => {
              const isExpanded = expandedSequences.has(sequence.id)
              const isEditing = editingSequence === sequence.id

              return (
                <div key={sequence.id} className="border rounded-lg overflow-hidden" data-oid="d:o_f1h">
                  {/* Sequence Header */}
                  <div className="p-3 bg-muted/50" data-oid="mahu9um">
                    <div className="flex items-center gap-2" data-oid="iv6zcr5">
                      <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" data-oid="sl39qxm" />

                      <div className={cn("w-3 h-3 rounded", sequenceColors[sequence.type])} data-oid="2-0c7qi" />

                      {isEditing ? (
                        <Select
                          value={sequence.type}
                          onValueChange={(value: SequenceType) => {
                            updateSequence(sequence.id, { type: value })
                            setEditingSequence(null)
                          }}
                          data-oid="h03b_:n"
                        >
                          <SelectTrigger className="w-[120px] h-8" data-oid="0qiw:i9">
                            <SelectValue data-oid="jszplvu" />
                          </SelectTrigger>
                          <SelectContent data-oid="6xic-ys">
                            {sequenceTypes.map((type) => (
                              <SelectItem key={type} value={type} data-oid="u9.dhe5">
                                <span className="capitalize" data-oid="es66zy1">
                                  {type}
                                </span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <button
                          onClick={() => setEditingSequence(sequence.id)}
                          className="font-medium capitalize hover:underline"
                          data-oid="qanr4sh"
                        >
                          {sequence.type}
                        </button>
                      )}

                      <Badge variant="outline" className="ml-auto" data-oid="gdpr7j3">
                        {sequence.clips.length} clips
                      </Badge>

                      <span className="text-sm text-muted-foreground" data-oid="ohw17hv">
                        {formatTime(sequence.duration)}
                      </span>

                      <div className="flex items-center gap-1" data-oid="907ru3l">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => moveSequence(index, "up")}
                          disabled={index === 0}
                          data-oid="nsw:wtk"
                        >
                          <ChevronUp className="h-4 w-4" data-oid="zv603dz" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => moveSequence(index, "down")}
                          disabled={index === sequences.length - 1}
                          data-oid="bjwlq79"
                        >
                          <ChevronDown className="h-4 w-4" data-oid="jtfh2so" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => duplicateSequence(sequence)}
                          data-oid="5q4us66"
                        >
                          <Copy className="h-4 w-4" data-oid="hwn-lqj" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => deleteSequence(sequence.id)}
                          data-oid="..hike6"
                        >
                          <Trash2 className="h-4 w-4" data-oid="_z0krma" />
                        </Button>
                      </div>

                      <CollapsibleTrigger asChild data-oid="5wi0ww8">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => toggleSequenceExpanded(sequence.id)}
                          data-oid="14s_be2"
                        >
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4" data-oid="kpfx5e2" />
                          ) : (
                            <ChevronDown className="h-4 w-4" data-oid="sw56rdj" />
                          )}
                        </Button>
                      </CollapsibleTrigger>
                    </div>
                  </div>

                  {/* Sequence Content */}
                  <Collapsible open={isExpanded} data-oid="j6wd:-p">
                    <CollapsibleContent data-oid="o_ik2ti">
                      <div className="p-4 space-y-4" data-oid="elwqo11">
                        {/* Energy Level */}
                        <div className="space-y-2" data-oid="h6mipb8">
                          <div className="flex items-center justify-between" data-oid="o9mhyam">
                            <Label data-oid="emcdo3o">Energy Level</Label>
                            <span className="text-sm text-muted-foreground" data-oid="ekwx18z">
                              {sequence.energyLevel}%
                            </span>
                          </div>
                          <Slider
                            value={[sequence.energyLevel]}
                            onValueChange={([value]) =>
                              updateSequence(sequence.id, {
                                energyLevel: value,
                              })
                            }
                            max={100}
                            step={5}
                            className="w-full"
                            data-oid="5ugk:v:"
                          />
                        </div>

                        {/* Purpose */}
                        <div className="space-y-2" data-oid="ipngl.t">
                          <Label data-oid="fpc_vrg">Purpose</Label>
                          <Select
                            value={sequence.purpose}
                            onValueChange={(value: SequencePurpose) => updateSequence(sequence.id, { purpose: value })}
                            data-oid="woxs-2:"
                          >
                            <SelectTrigger data-oid="t23sg86">
                              <SelectValue data-oid="me2c0a9" />
                            </SelectTrigger>
                            <SelectContent data-oid="sl730q9">
                              <SelectItem value={SequencePurpose.Hook} data-oid="r4e:wvf">
                                Hook
                              </SelectItem>
                              <SelectItem value={SequencePurpose.Exposition} data-oid="lt_ort:">
                                Exposition
                              </SelectItem>
                              <SelectItem value={SequencePurpose.Development} data-oid="r7mb9g5">
                                Development
                              </SelectItem>
                              <SelectItem value={SequencePurpose.Climax} data-oid="9l:67v9">
                                Climax
                              </SelectItem>
                              <SelectItem value={SequencePurpose.Resolution} data-oid="_ygw9ie">
                                Resolution
                              </SelectItem>
                              <SelectItem value={SequencePurpose.CallToAction} data-oid="e98s15:">
                                Call to Action
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Clips */}
                        <div className="space-y-2" data-oid="er9w1.t">
                          <Label data-oid="740at8s">Clips in Sequence</Label>
                          {sequence.clips.length === 0 ? (
                            <p className="text-sm text-muted-foreground" data-oid="f3.9dpb">
                              No clips added yet. Drag fragments here to add them.
                            </p>
                          ) : (
                            <div className="space-y-1" data-oid="pbrd6al">
                              {sequence.clips.map((clip) => {
                                const fragment =
                                  clip.fragment || availableFragments.find((f) => f.id === clip.fragmentId)
                                return (
                                  <div
                                    key={clip.fragmentId}
                                    className="flex items-center justify-between p-2 rounded border"
                                    data-oid="a:vhjc:"
                                  >
                                    <span className="text-sm" data-oid="c0woqf_">
                                      {fragment?.videoId || "Unknown"} • {formatTime(fragment?.startTime || 0)} -{" "}
                                      {formatTime((fragment?.startTime || 0) + (fragment?.duration || 0))}
                                    </span>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-6 w-6"
                                      onClick={() => removeClipFromSequence(sequence.id, clip.fragmentId)}
                                      data-oid="g5t47ky"
                                    >
                                      <Trash2 className="h-3 w-3" data-oid="cnva0r8" />
                                    </Button>
                                  </div>
                                )
                              })}
                            </div>
                          )}
                        </div>

                        {/* Available Fragments (simplified) */}
                        <div className="space-y-2" data-oid="icvhels">
                          <Label data-oid="oa:906.">Available Fragments</Label>
                          <div className="grid grid-cols-2 gap-2 max-h-[200px] overflow-y-auto" data-oid="hd4h31d">
                            {availableFragments.slice(0, 10).map((fragment) => (
                              <Button
                                key={fragment.id}
                                variant="outline"
                                size="sm"
                                className="justify-start"
                                onClick={() => addClipToSequence(sequence.id, fragment)}
                                data-oid="eelq22l"
                              >
                                <Plus className="h-3 w-3 mr-1" data-oid="l3cud.q" />
                                {fragment.videoId} ({formatTime(fragment.duration)})
                              </Button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                </div>
              )
            })}
          </div>
        )}

        {/* Total Duration */}
        {sequences.length > 0 && (
          <div className="pt-4 border-t" data-oid="q3lhcxg">
            <div className="flex items-center justify-between text-sm" data-oid=":cz5zvq">
              <span className="text-muted-foreground" data-oid="x7xin9r">
                Total Duration
              </span>
              <span className="font-medium" data-oid="13kz9xq">
                {formatTime(sequences.reduce((sum, seq) => sum + seq.duration, 0))}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

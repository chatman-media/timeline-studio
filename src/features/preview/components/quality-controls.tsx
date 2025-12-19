/**
 * Quality Controls - Adjust preview quality settings
 */

import { Eye, Gauge, Monitor, Settings, Zap } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"

import type { GPUTier, PreviewQuality } from "../types"

interface QualityControlsProps {
  quality: PreviewQuality
  gpuTier: GPUTier
  onChange: (quality: PreviewQuality) => void
  className?: string
}

export function QualityControls({ quality, gpuTier, onChange, className }: QualityControlsProps) {
  const updateQuality = (updates: Partial<PreviewQuality>) => {
    onChange({ ...quality, ...updates })
  }

  const getGPUTierInfo = () => {
    const info = {
      high: {
        color: "bg-green-500",
        description: "High-end GPU detected. All effects supported at full quality.",
        recommendations: "Use maximum settings for best quality",
      },
      medium: {
        color: "bg-yellow-500",
        description: "Mid-range GPU detected. Most effects supported.",
        recommendations: "Moderate settings recommended for smooth performance",
      },
      low: {
        color: "bg-red-500",
        description: "Entry-level GPU detected. Limited effect support.",
        recommendations: "Lower settings recommended for stable performance",
      },
    }
    return info[gpuTier]
  }

  const getRecommendedSettings = () => {
    const recommendations = {
      high: {
        resolution: 1.0,
        effects: "all" as const,
        fps: 30,
        antialiasing: true,
      },
      medium: {
        resolution: 0.75,
        effects: "all" as const,
        fps: 24,
        antialiasing: true,
      },
      low: {
        resolution: 0.5,
        effects: "basic" as const,
        fps: 15,
        antialiasing: false,
      },
    }
    return recommendations[gpuTier]
  }

  const applyRecommended = () => {
    const recommended = getRecommendedSettings()
    onChange(recommended)
  }

  const getPerformanceEstimate = () => {
    let score = 100

    // Resolution impact
    score *= quality.resolution

    // Effects impact
    if (quality.effects === "all") score *= 0.7
    else if (quality.effects === "basic") score *= 0.9

    // FPS impact
    score *= Math.min(1, 24 / quality.fps)

    // Antialiasing impact
    if (quality.antialiasing) score *= 0.8

    // GPU tier adjustment
    const gpuMultiplier = { high: 1.5, medium: 1.0, low: 0.6 }
    score *= gpuMultiplier[gpuTier]

    return Math.max(0, Math.min(100, score))
  }

  const getPerformanceLabel = (score: number) => {
    if (score >= 80) return { label: "Excellent", color: "text-green-600" }
    if (score >= 60) return { label: "Good", color: "text-yellow-600" }
    if (score >= 40) return { label: "Fair", color: "text-orange-600" }
    return { label: "Poor", color: "text-red-600" }
  }

  const gpuInfo = getGPUTierInfo()
  const performanceScore = getPerformanceEstimate()
  const performanceLabel = getPerformanceLabel(performanceScore)

  return (
    <div className={`space-y-6 ${className}`} data-oid="fr05ev2">
      {/* GPU Information */}
      <Card className="p-4" data-oid="1.j9u.l">
        <div className="flex items-center gap-3 mb-3" data-oid="czp9009">
          <Monitor className="w-5 h-5" data-oid="zh8ynv:" />
          <h4 className="font-medium" data-oid="i2g8iih">
            GPU Information
          </h4>
          <Badge variant="outline" data-oid="o809bgw">
            <div className={`w-2 h-2 rounded-full ${gpuInfo.color} mr-2`} data-oid="v3bw6r3" />
            {gpuTier.toUpperCase()} TIER
          </Badge>
        </div>

        <p className="text-sm text-muted-foreground mb-2" data-oid="qtq8mvb">
          {gpuInfo.description}
        </p>

        <div className="flex items-center gap-2 text-sm" data-oid="5_ez4pw">
          <Zap className="w-4 h-4 text-muted-foreground" data-oid=":h.w:07" />
          <span className="text-muted-foreground" data-oid="_7ao.8c">
            {gpuInfo.recommendations}
          </span>
        </div>
      </Card>

      {/* Performance Estimate */}
      <Card className="p-4" data-oid="meggvsu">
        <div className="flex items-center gap-3 mb-3" data-oid="py_0gch">
          <Gauge className="w-5 h-5" data-oid="1elrklo" />
          <h4 className="font-medium" data-oid="4ie1x7b">
            Performance Estimate
          </h4>
          <Badge variant="outline" className={performanceLabel.color} data-oid=":02m:7-">
            {performanceLabel.label}
          </Badge>
        </div>

        <div className="space-y-2" data-oid="d1hy047">
          <div className="flex justify-between text-sm" data-oid="d:bd269">
            <span data-oid="97n14la">Expected Performance</span>
            <span className={`font-medium ${performanceLabel.color}`} data-oid="0_zt-zb">
              {Math.round(performanceScore)}%
            </span>
          </div>

          <div className="w-full bg-muted rounded-full h-2" data-oid="t0_80_q">
            <div
              className="bg-primary h-2 rounded-full transition-all"
              style={{ width: `${performanceScore}%` }}
              data-oid="jt0m1b6"
            />
          </div>

          <button
            onClick={applyRecommended}
            className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors mt-2"
            data-oid="6rlpwha"
          >
            Apply recommended settings for {gpuTier} tier GPU
          </button>
        </div>
      </Card>

      {/* Quality Settings */}
      <div className="space-y-4" data-oid="1201ckc">
        <div className="flex items-center gap-3" data-oid="v:ps82b">
          <Settings className="w-5 h-5" data-oid="54:xws6" />
          <h4 className="font-medium" data-oid="nyair-3">
            Quality Settings
          </h4>
        </div>

        {/* Resolution */}
        <div className="space-y-2" data-oid="wjq_oiy">
          <div className="flex justify-between" data-oid="-3iu83g">
            <label className="text-sm font-medium" data-oid="btz:k-e">
              Resolution
            </label>
            <span className="text-sm text-muted-foreground" data-oid="f1vu41a">
              {Math.round(quality.resolution * 100)}%
            </span>
          </div>
          <Slider
            value={[quality.resolution * 100]}
            onValueChange={([value]) => updateQuality({ resolution: value / 100 })}
            max={100}
            min={25}
            step={25}
            className="w-full"
            data-oid=":lj8t8d"
          />

          <div className="flex justify-between text-xs text-muted-foreground" data-oid="_f7rfw5">
            <span data-oid="jdvmdny">25%</span>
            <span data-oid="5f9v-q-">50%</span>
            <span data-oid="cxe5f4i">75%</span>
            <span data-oid=".o9y0mt">100%</span>
          </div>
        </div>

        {/* Effects Quality */}
        <div className="space-y-2" data-oid="gf7m04y">
          <label className="text-sm font-medium" data-oid="fc49gqf">
            Effects Quality
          </label>
          <Select
            value={quality.effects}
            onValueChange={(value: "all" | "basic" | "none") => updateQuality({ effects: value })}
            data-oid="kg6x:jh"
          >
            <SelectTrigger data-oid="yrkw:yj">
              <SelectValue data-oid="vvj85-7" />
            </SelectTrigger>
            <SelectContent data-oid="hlhhiqn">
              <SelectItem value="all" data-oid="nx8iydv">
                <div className="flex items-center gap-2" data-oid="uz5zcum">
                  <Eye className="w-4 h-4" data-oid="pxu09t0" />
                  All Effects
                </div>
              </SelectItem>
              <SelectItem value="basic" data-oid="0.sg07i">
                <div className="flex items-center gap-2" data-oid="zm5824v">
                  <Eye className="w-4 h-4 opacity-60" data-oid="l_-el-i" />
                  Basic Effects Only
                </div>
              </SelectItem>
              <SelectItem value="none" data-oid="vdeikme">
                <div className="flex items-center gap-2" data-oid="7kb4v9i">
                  <Eye className="w-4 h-4 opacity-30" data-oid="j2y82a_" />
                  No Effects
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground" data-oid="1s6:uby">
            {quality.effects === "all" && "All effects enabled for maximum quality"}
            {quality.effects === "basic" && "Only color correction and transforms"}
            {quality.effects === "none" && "Effects disabled for maximum performance"}
          </p>
        </div>

        {/* Frame Rate */}
        <div className="space-y-2" data-oid="k:snly8">
          <div className="flex justify-between" data-oid="2o9rz25">
            <label className="text-sm font-medium" data-oid="bg154vi">
              Frame Rate
            </label>
            <span className="text-sm text-muted-foreground" data-oid="qc4gn6o">
              {quality.fps} FPS
            </span>
          </div>
          <Slider
            value={[quality.fps]}
            onValueChange={([value]) => updateQuality({ fps: value })}
            max={60}
            min={10}
            step={5}
            className="w-full"
            data-oid="6:timrr"
          />

          <div className="flex justify-between text-xs text-muted-foreground" data-oid="ywtgbul">
            <span data-oid="4evm0ge">10 FPS</span>
            <span data-oid="md.-ukq">30 FPS</span>
            <span data-oid="0nxn9kq">60 FPS</span>
          </div>
        </div>

        {/* Antialiasing */}
        <div className="flex items-center justify-between" data-oid="c9cx-ix">
          <div className="space-y-0.5" data-oid="i47w2rw">
            <label className="text-sm font-medium" data-oid="m0-60a-">
              Antialiasing
            </label>
            <p className="text-xs text-muted-foreground" data-oid=":r:hznq">
              Smooth edges but requires more GPU power
            </p>
          </div>
          <Switch
            checked={quality.antialiasing}
            onCheckedChange={(checked) => updateQuality({ antialiasing: checked })}
            data-oid="dnpg4aw"
          />
        </div>
      </div>
    </div>
  )
}

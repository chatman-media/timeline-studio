/**
 * Analysis Results Component
 * Отображает результаты AI анализа
 */

import { IntelligentContent } from "@/domains/ai-services/types"
import { cn } from "@/lib/utils"

interface AnalysisResultsProps {
  result: IntelligentContent
  activeTab: "analysis" | "script" | "platforms"
  className?: string
}

export function AnalysisResults({ result, activeTab, className }: AnalysisResultsProps) {
  return (
    <div className={cn("space-y-4", className)}>
      {activeTab === "analysis" && <AnalysisTabContent result={result} />}
      {activeTab === "script" && <ScriptTabContent result={result} />}
      {activeTab === "platforms" && <PlatformsTabContent result={result} />}
    </div>
  )
}

function AnalysisTabContent({ result }: { result: IntelligentContent }) {
  const { analysis, moments, classification } = result

  return (
    <div className="space-y-4">
      {/* Content Info */}
      <div className="bg-muted rounded-lg p-4">
        <h3 className="font-medium mb-3">Content Analysis</h3>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-muted-foreground">Type:</span>
            <span className="ml-2 font-medium">{analysis.contentType}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Duration:</span>
            <span className="ml-2 font-medium">{formatDuration(analysis.technicalSpecs.duration)}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Resolution:</span>
            <span className="ml-2 font-medium">
              {analysis.technicalSpecs.resolution.width}x{analysis.technicalSpecs.resolution.height}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">Quality:</span>
            <span className="ml-2 font-medium">{analysis.qualityMetrics.overall}/100</span>
          </div>
        </div>
      </div>

      {/* Scenes */}
      <div className="bg-muted rounded-lg p-4">
        <h3 className="font-medium mb-3">Scenes Detected</h3>
        <div className="space-y-2">
          {analysis.scenes.slice(0, 5).map((scene: any, index: number) => (
            <div key={scene.id} className="flex items-center justify-between text-sm">
              <span>
                Scene {index + 1}: {scene.type}
              </span>
              <span className="text-muted-foreground">{formatDuration(scene.duration)}</span>
            </div>
          ))}
          {analysis.scenes.length > 5 && (
            <div className="text-sm text-muted-foreground text-center pt-2">
              +{analysis.scenes.length - 5} more scenes
            </div>
          )}
        </div>
      </div>

      {/* Key Moments */}
      {moments.length > 0 && (
        <div className="bg-muted rounded-lg p-4">
          <h3 className="font-medium mb-3">Key Moments</h3>
          <div className="space-y-2">
            {moments.slice(0, 3).map((moment: any) => (
              <div key={moment.id} className="flex items-start space-x-2">
                <div className="text-lg">⭐</div>
                <div className="flex-1">
                  <div className="text-sm font-medium">{moment.type}</div>
                  <div className="text-xs text-muted-foreground">{moment.description}</div>
                </div>
                <div className="text-sm text-muted-foreground">{formatTimestamp(moment.timestamp)}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Insights */}
      {analysis.insights && (
        <div className="bg-muted rounded-lg p-4">
          <h3 className="font-medium mb-3">AI Insights</h3>
          <p className="text-sm text-muted-foreground mb-2">
            {(analysis.insights as any).summary || "Краткое описание недоступно"}
          </p>
          {((analysis.insights as any).suggestions || []).length > 0 && (
            <div className="space-y-1">
              {((analysis.insights as any).suggestions || []).slice(0, 3).map((suggestion: any, index: number) => (
                <div key={index} className="flex items-start space-x-2 text-sm">
                  <span>💡</span>
                  <span>{suggestion.description}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function ScriptTabContent({ result }: { result: IntelligentContent }) {
  if (!result.script) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground">
        <div className="text-center">
          <div className="text-4xl mb-2">📝</div>
          <p>No script generated yet</p>
          <p className="text-sm mt-1">Run full pipeline with script generation enabled</p>
        </div>
      </div>
    )
  }

  const { script } = result

  return (
    <div className="space-y-4">
      {/* Script Info */}
      <div className="bg-muted rounded-lg p-4">
        <h3 className="font-medium mb-3">{script.title}</h3>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-muted-foreground">Genre:</span>
            <span className="ml-2 font-medium">{script.genre.join(", ")}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Duration:</span>
            <span className="ml-2 font-medium">{formatDuration(script.duration)}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Structure:</span>
            <span className="ml-2 font-medium">{script.structure.type}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Scenes:</span>
            <span className="ml-2 font-medium">{script.scenes.length}</span>
          </div>
        </div>
      </div>

      {/* Script Scenes */}
      <div className="bg-muted rounded-lg p-4">
        <h3 className="font-medium mb-3">Script Scenes</h3>
        <div className="space-y-3">
          {script.scenes.slice(0, 5).map((scene: any) => (
            <div key={scene.id} className="border-l-2 border-primary/20 pl-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium">{scene.title}</h4>
                <span className="text-xs text-muted-foreground">{formatDuration(scene.duration)}</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">{scene.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function PlatformsTabContent({ result }: { result: IntelligentContent }) {
  if (!result.platformContent || result.platformContent.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground">
        <div className="text-center">
          <div className="text-4xl mb-2">🌍</div>
          <p>No platform adaptations yet</p>
          <p className="text-sm mt-1">Run full pipeline with platform adaptation enabled</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {result.platformContent.map((content: any) => (
        <div key={content.id} className="bg-muted rounded-lg p-4">
          <h3 className="font-medium mb-3 flex items-center space-x-2">
            <span>{getPlatformIcon(content.platform)}</span>
            <span>{getPlatformName(content.platform)}</span>
          </h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-muted-foreground">Resolution:</span>
              <span className="ml-2 font-medium">
                {content.adaptations.video.resolution.width}x{content.adaptations.video.resolution.height}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Aspect Ratio:</span>
              <span className="ml-2 font-medium">{content.adaptations.video.aspectRatio.ratio}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Duration:</span>
              <span className="ml-2 font-medium">{formatDuration(content.originalContent.duration)}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Language:</span>
              <span className="ml-2 font-medium">{content.metadata.language}</span>
            </div>
          </div>
          {content.adaptations.text.hashtags.length > 0 && (
            <div className="mt-3">
              <span className="text-sm text-muted-foreground">Hashtags:</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {content.adaptations.text.hashtags.map((tag: any, index: number) => (
                  <span key={index} className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

// Utility functions
function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }
  return `${minutes}:${secs.toString().padStart(2, "0")}`
}

function formatTimestamp(seconds: number): string {
  return formatDuration(seconds)
}

function getPlatformIcon(platform: string): string {
  const icons: Record<string, string> = {
    youtube: "📺",
    youtube_shorts: "📱",
    tiktok: "🎵",
    instagram_reels: "📷",
    instagram_feed: "📸",
    instagram_stories: "⭕",
    facebook: "👥",
    twitter: "🐦",
    linkedin: "💼",
    vimeo: "🎬",
    twitch: "🎮",
    snapchat: "👻",
  }
  return icons[platform] || "🌐"
}

function getPlatformName(platform: string): string {
  const names: Record<string, string> = {
    youtube: "YouTube",
    youtube_shorts: "YouTube Shorts",
    tiktok: "TikTok",
    instagram_reels: "Instagram Reels",
    instagram_feed: "Instagram Feed",
    instagram_stories: "Instagram Stories",
    facebook: "Facebook",
    twitter: "Twitter",
    linkedin: "LinkedIn",
    vimeo: "Vimeo",
    twitch: "Twitch",
    snapchat: "Snapchat",
  }
  return names[platform] || platform
}

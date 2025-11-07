# AI Director - Примеры использования

**Версия**: 1.0
**Дата**: 8 ноября 2025

## Обзор

Этот документ содержит практические примеры использования AI Director в Timeline Studio через Unified Orchestrator и React hooks.

## 1. Базовый анализ видео

### React Component

```typescript
import { useUnifiedAnalysis } from "@/domains/ai-services/hooks/use-unified-analysis"
import { Button } from "@/components/ui/button"

export function BasicAnalysisExample() {
  const { analyzeComprehensive, state } = useUnifiedAnalysis()

  const handleAnalyze = async () => {
    try {
      const result = await analyzeComprehensive("/path/to/video.mp4", {
        aiDirectorConfig: {
          performance_mode: "balanced",
          enable_scene_detection: true,
          enable_moment_detection: true,
          enable_audio_analysis: true,
        },
        skipMontageAnalysis: true, // Только AI Director анализ
      })

      console.log("Analysis completed:", result.unified)
      console.log("Detected scenes:", result.unified.scenes.length)
      console.log("Key moments:", result.unified.keyMoments.length)
    } catch (error) {
      console.error("Analysis failed:", error)
    }
  }

  return (
    <div>
      <Button onClick={handleAnalyze} disabled={state.isAnalyzing}>
        {state.isAnalyzing ? \`Analyzing... \${state.progress}%\` : "Analyze Video"}
      </Button>

      {state.error && <div className="error">{state.error}</div>}

      {state.latestResult && (
        <div className="results">
          <h3>Analysis Results</h3>
          <p>Scenes: {state.latestResult.scenes.length}</p>
          <p>Key Moments: {state.latestResult.keyMoments.length}</p>
        </div>
      )}
    </div>
  )
}
```

## References

- **Architecture**: \`/docs/ru/03_architecture/ai-director-architecture.md\`
- **Migration Guide**: \`/docs/ru/05_development/ai-director-migration-guide.md\`

---

**Последнее обновление**: 8 ноября 2025

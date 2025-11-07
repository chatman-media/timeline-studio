# AI Director - Usage Examples

**Version**: 1.0
**Date**: November 8, 2025

## Overview

This document contains practical examples of using AI Director in Timeline Studio via Unified Orchestrator and React hooks.

## 1. Basic Video Analysis

```typescript
import { useUnifiedAnalysis } from "@/domains/ai-services/hooks/use-unified-analysis"

export function BasicAnalysisExample() {
  const { analyzeComprehensive, state } = useUnifiedAnalysis()

  const handleAnalyze = async () => {
    const result = await analyzeComprehensive("/path/to/video.mp4", {
      aiDirectorConfig: {
        performance_mode: "balanced",
        enable_scene_detection: true,
        enable_moment_detection: true,
      },
    })
    
    console.log("Scenes:", result.unified.scenes.length)
  }

  return <button onClick={handleAnalyze}>Analyze</button>
}
```

## References

- **Architecture**: `/docs/en/03_architecture/ai-director-architecture.md`
- **Migration Guide**: `/docs/en/05_development/ai-director-migration-guide.md`

---

**Last updated**: November 8, 2025

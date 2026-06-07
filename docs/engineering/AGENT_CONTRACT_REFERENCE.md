# Agent Contract Reference

> **Source of truth** for the typed interface between external agents
> (Lead Engine, TypeScript SDK, CLI tools) and the Timeline Studio backend.
>
> All types live in `crates/ts-schema/src/contracts.rs`.  
> TypeScript mirrors are in `packages/shared-types/src/contracts.ts` (generated).  
> Schema version: **`1.0.0`**

---

## Overview

Agents communicate with the Timeline Studio engine through three contract pairs:

```
Agent
 ├─ AnalysisRequest  →  AnalysisResult     (AI analysis pass)
 ├─ OptimizeRequest  →  OptimizeResult     (non-destructive optimisation)
 └─ PublishRequest   →  PublishResult      (render + publish pipeline)
```

All requests and results carry a `schema_version` field (`"1.0.0"`) for
forward-compatibility checking.  If the version does not match, reject the
payload and surface a clear error to the user.

---

## AnalysisRequest / AnalysisResult

### AnalysisRequest

```json
{
  "schema_version": "1.0.0",
  "mode": "full",
  "target": "/path/to/project.json",
  "clip_id": null,
  "hints": {}
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `schema_version` | `string` | ✅ | Must be `"1.0.0"` |
| `mode` | `"project" \| "clip" \| "audio" \| "full"` | ✅ | Analysis scope |
| `target` | `string` | ✅ | Path to project JSON or media asset |
| `clip_id` | `string \| null` | — | Restrict to one clip (project mode only) |
| `hints` | `object` | — | Arbitrary key-value hints for the engine |

**Modes:**

| Mode | What runs |
|---|---|
| `project` | Scene detection + AI director suggestions |
| `clip` | Single-clip video quality + scene |
| `audio` | Audio levels, noise, speech/music segmentation |
| `full` | All of the above + quality metrics |

### AnalysisResult

```json
{
  "schema_version": "1.0.0",
  "success": true,
  "scenes": [
    {
      "index": 0,
      "start_sec": 0.0,
      "end_sec": 5.5,
      "confidence": 0.94,
      "mood": "energetic",
      "keyframe_sec": 2.1
    }
  ],
  "audio": {
    "loudness_lufs": -14.3,
    "peak_dbfs": -1.2,
    "dynamic_range_db": 8.1,
    "noise_floor_dbfs": -60.0,
    "speech_segments": [[1.0, 4.5]],
    "music_segments": [[0.0, 1.0]]
  },
  "quality": {
    "overall_score": 87.0,
    "sharpness": 90.0,
    "noise_score": 85.0,
    "color_consistency": 88.0,
    "audio_score": 82.0
  },
  "suggestions": [
    {
      "category": "pacing",
      "description": "Scene 2 is 18 s — consider trimming to under 10 s",
      "confidence": 0.8,
      "affected_clips": ["clip_abc123"],
      "action": { "type": "trim", "clip_id": "clip_abc123", "end_time": 9.5 }
    }
  ],
  "diagnostics": []
}
```

---

## OptimizeRequest / OptimizeResult

### OptimizeRequest

```json
{
  "schema_version": "1.0.0",
  "project_path": "/path/to/project.json",
  "output_path": "/path/to/project_optimized.json",
  "passes": ["trim_silence", "normalise_audio"],
  "silence_threshold_sec": 0.3,
  "target_loudness_lufs": -14.0
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `schema_version` | `string` | ✅ | `"1.0.0"` |
| `project_path` | `string` | ✅ | Input `ProjectSchema` JSON |
| `output_path` | `string \| null` | — | Write result here; if absent, returned inline |
| `passes` | `OptimizePass[]` | ✅ | Which passes to run |
| `silence_threshold_sec` | `number \| null` | — | Default `0.3` |
| `target_loudness_lufs` | `number \| null` | — | Default `-14` |

**Available passes:**

| Pass | Effect |
|---|---|
| `trim_silence` | Trim leading/trailing silence from audio clips |
| `normalise_audio` | Normalise integrated loudness to target LUFS |
| `colour_grade` | Auto-colour-grade for consistent look |
| `suggest_cuts` | Mark suggested cut points via `AiSuggestion` |
| `deduplicate_frames` | Remove visually duplicate frames |

### OptimizeResult

```json
{
  "schema_version": "1.0.0",
  "success": true,
  "project_json": null,
  "output_path": "/path/to/project_optimized.json",
  "changes": [
    {
      "pass": "trim_silence",
      "clip_id": "clip_abc123",
      "description": "Trimmed 1.2 s of silence from end",
      "before": { "end_time": 12.0 },
      "after":  { "end_time": 10.8 }
    }
  ],
  "diagnostics": []
}
```

---

## PublishRequest / PublishResult

### PublishRequest

```json
{
  "schema_version": "1.0.0",
  "project_path": "/path/to/project.json",
  "output_dir": "/path/to/output",
  "output_name": "my_video",
  "quality": "web",
  "watermark": {
    "image_path": "/assets/logo.png",
    "x": "right",
    "y": "bottom",
    "opacity": 0.7,
    "scale": 0.08
  },
  "thumbnail_sec": 3.0,
  "emit_sidecar": true,
  "metadata": {
    "title": "My Video",
    "artist": "Timeline Studio"
  }
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `schema_version` | `string` | ✅ | `"1.0.0"` |
| `project_path` | `string` | ✅ | Input `ProjectSchema` JSON |
| `output_dir` | `string` | ✅ | Output directory |
| `output_name` | `string \| null` | — | Filename without extension |
| `quality` | `RenderQuality` | ✅ | See table below |
| `watermark` | `WatermarkConfig \| null` | — | Optional overlay |
| `thumbnail_sec` | `number \| null` | — | Extract thumbnail at this time |
| `emit_sidecar` | `boolean` | — | Write `PublishResult` JSON alongside video |
| `metadata` | `object` | — | Embedded file metadata |

**Quality presets:**

| Preset | CRF | Speed | Use case |
|---|---|---|---|
| `preview` | 28 | `veryfast` | Quick draft / scrubbing |
| `web` | 23 | `medium` | Default distribution |
| `high` | 18 | `slow` | High-quality distribution |
| `lossless` | 0 | `veryslow` | Archive / colour grading source |

### PublishResult

```json
{
  "schema_version": "1.0.0",
  "success": true,
  "video_path": "/path/to/output/my_video.mp4",
  "thumbnail_path": "/path/to/output/my_video_thumb.jpg",
  "sidecar_path": "/path/to/output/my_video.publish.json",
  "render_duration_sec": 12.4,
  "file_size_bytes": 45678901,
  "resolution": { "width": 1920, "height": 1080 },
  "video_duration_sec": 30.5,
  "diagnostics": []
}
```

---

## Shared types

### Diagnostic

```typescript
{
  severity: "info" | "warning" | "error"
  message: string
  source?: string        // e.g. "scene_detector"
  timestamp_sec?: number // timeline position, if applicable
}
```

### AiSuggestion

```typescript
{
  category: string       // "pacing" | "audio" | "color" | "structure" | "trim"
  description: string
  confidence: number     // [0, 1]
  affected_clips: string[]
  action?: unknown       // machine-readable action for auto-apply
}
```

---

## TypeScript usage

```typescript
import type {
  AnalysisRequest, AnalysisResult,
  OptimizeRequest, OptimizeResult,
  PublishRequest, PublishResult,
} from "@timeline/shared-types/contracts"

// Build an analysis request
const req: AnalysisRequest = {
  schema_version: "1.0.0",
  mode: "full",
  target: "/projects/demo.json",
  clip_id: null,
  hints: {},
}

// Parse a result safely
const raw = await fetchAnalysisResult()
const result = raw as AnalysisResult
if (!result.success) {
  console.error(result.diagnostics.map(d => d.message).join("\n"))
}
```

---

## Rust usage

```rust
use ts_schema::contracts::{
    AnalysisRequest, AnalysisMode, AnalysisResult,
    OptimizeRequest, OptimizePass,
    PublishRequest, RenderQuality,
};

// Deserialise a request from JSON
let req: AnalysisRequest = serde_json::from_str(&json_str)?;

// Build a publish pipeline request
let pub_req = PublishRequest::new("/project.json", "/output", RenderQuality::Web);
```

## Headless smoke test

Run the end-to-end agent smoke locally from the repository root:

```bash
cd crates && cargo test -p ts-cli --test headless_pipeline_smoke -- --nocapture
```

The test exercises the public `timeline` CLI contract without GUI/Tauri:
`emit-schema`, synthetic media analysis, `pipeline --validate-only` with a
Telegram publish target shape, `emit-example -> render`, and `pipeline`
`analyze -> optimize` without external tokens.

---

## Versioning policy

- **Additive changes** (new optional fields) → keep `schema_version = "1.0.0"`.
- **Breaking changes** (renamed/removed fields, changed semantics) → bump to `"2.0.0"` and update both the Rust `contracts.rs` and this document.
- Always check `schema_version` on the consumer side and return a clear error if it doesn't match.

---

*Last updated: 2026-06-07 — initial contract release.*

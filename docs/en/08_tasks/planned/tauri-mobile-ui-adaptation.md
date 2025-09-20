# Tauri Mobile UI Adaptation (iOS/Android + Web Mobile)

## Overview
Adapt the existing Timeline Studio UI for mobile using Tauri v2 (iOS/Android) and Web Mobile (PWA/Browser). The goal is to reuse the current codebase, ensure consistent UX, and provide responsive, touch-friendly controls with safe performance budgets.

## Goals
- Deliver a responsive UI for iPhone/Android phone form-factors
- Support touch gestures for timeline and player controls
- Respect safe areas (notch), status bar, virtual keyboard
- Keep a single command invocation path that works in Tauri and Browser
- Stay performant: 60 FPS on interactions, smooth scrubbing

## Scope
- UI/UX only: responsive layout, navigation patterns, touch interactions
- Tauri mobile specifics: environment detection, permissions prompts, path APIs
- Web Mobile parity: feature fallbacks when Tauri APIs are not available

Out of scope (for this task):
- Push notifications, deep links, sign-in with Apple/Google
- Camera capture pipeline, background tasks
- Full FFmpeg mobile builds and codecs setup (tracked separately)

## Architecture Notes
- Environment detection: use existing helpers (isTauriEnvironment, waitForTauri/initializeTauri) to branch behavior safely without fragile globals.
- Single backend bridge: use BackendSync/commands instead of direct `window.__TAURI_INVOKE__`.
- Feature toggles: provide graceful no-op or polyfill for unsupported features on Web Mobile.

## Deliverables
- Responsive layout and controls across breakpoints (≤768px focus)
- Touch gestures: pan/scroll timeline, pinch-to-zoom, long press (context)
- Safe-area aware layout (iOS notches, Android cutouts)
- Mobile navigation (bottom bar or sheet/drawer) for key actions
- Keyboard-aware inputs (avoid overlapping)
- Unified command invocation that works both in Tauri and browser
- Basic device testing matrix (iOS + Android + Mobile Safari/Chrome)

## Implementation Plan

### Phase 0 — Foundations (Tauri-aware runtime)
1. Audit Tauri environment checks and auto-init in the app bootstrap.
2. Ensure all backend calls go via BackendSync (no direct `__TAURI_INVOKE__`).
3. Add safe fallbacks for browser mode where native features are missing.

### Phase 1 — Responsive UI
1. Add/adjust Tailwind breakpoints and utility classes for mobile.
2. Rework header/actions: compress or move into an overflow menu on small screens.
3. Sidebars: convert to modal sheets/drawers on mobile.
4. Ensure timeline viewport supports horizontal scroll with momentum.

### Phase 2 — Touch & Gestures
1. Pan/scroll: natural touch scrolling for the timeline container.
2. Pinch-to-zoom: smooth scale for timeline zoom.
3. Tap/long-press: selection and context actions.
4. Increase hit targets (≥44×44) and spacing.

### Phase 3 — Safe Areas & Keyboard
1. Add CSS env(safe-area-inset-*) padding for top/bottom bars.
2. Status bar contrast: respect light/dark for readability.
3. Keyboard overlay handling for inputs (avoid covered inputs/forms).

### Phase 4 — Player & Controls
1. Player toolbar: larger buttons, accessible labels, one-hand ergonomics.
2. Scrubber: thumb size and touch precision tweaks, haptics optional.
3. HUD overlays: readable on small screens, collapsible where needed.

### Phase 5 — Packaging & Testing
1. Tauri mobile run scripts (ios/android dev/build) in CI optional.
2. Device tests (real or simulators) for Safari iOS, Chrome Android.
3. Performance check: interaction > 60 FPS, no major layout thrash.

## Acceptance Criteria
- UI scales well at 320–768 px widths without horizontal overflow.
- Timeline scrolls smoothly with touch; pinch-to-zoom works without jank.
- All actionable UI elements meet 44×44 hit area.
- No critical controls are obscured by notches or home indicators.
- Player controls are operable with one hand; scrubbing is precise.
- No direct references to `window.__TAURI__`/`__TAURI_INVOKE__` in app code; all calls use BackendSync and browser fallbacks work.
- Tested on: iPhone (Safari), Android (Chrome), plus Tauri iOS/Android dev builds.

## Risks & Mitigations
- Gesture conflicts (scroll vs. pinch): carefully scope handlers to containers.
- Performance on heavy timelines: use GPU-accelerated transforms, avoid forced sync layout.
- Platform differences (iOS viewport units): use modern units (dvh/svh) with fallbacks.

## Checklist
- [ ] Centralize environment checks (Tauri vs Browser) in shared utils
- [ ] Remove/avoid direct `__TAURI_INVOKE__` usage in application code
- [ ] Ensure BackendSync returns consistent results in browser fallback
- [ ] Add mobile breakpoints and responsive variants for core pages
- [ ] Convert sidebars into modal sheets/drawers on mobile
- [ ] Implement touch pan/scroll for timeline container
- [ ] Implement pinch-to-zoom for timeline scaling
- [ ] Enforce 44×44 minimum hit targets for interactive elements
- [ ] Add safe-area padding for header/footer/player bars
- [ ] Make inputs keyboard-aware (scroll into view on focus)
- [ ] Resize player controls and scrubber for touch
- [ ] Verify light/dark contrast and status bar appearance
- [ ] Smoke-test on iOS Safari and Android Chrome
- [ ] Smoke-test Tauri iOS/Android dev builds
- [ ] Capture perf metrics (FPS while scrolling/zooming)

## Nice to Have (Optional)
- Haptics feedback on critical actions (Tauri plugin)
- Reduced motion mode for accessibility
- Quick actions via long-press context menu

## References
- Tauri v2 mobile targets (iOS/Android)
- Tailwind responsive utilities and safe-area insets
- Web platform viewport units: dvh/svh with fallbacks
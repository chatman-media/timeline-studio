# Analysis Dashboard Tests

This directory contains comprehensive tests for the `analysis-dashboard` feature.

## Test Coverage

Current coverage: **95.83%**

- **Statements**: 95.83%
- **Branches**: 92.59%
- **Functions**: 100%
- **Lines**: 95.83%

## Test Structure

### Components Tests

#### `ai-analysis-dashboard.test.tsx` (38 tests)

Comprehensive tests for the main AIAnalysisDashboard component:

**Initial Render (6 tests)**
- Header and description rendering
- Reset button presence
- Setup panel visibility
- Empty state display
- File count display
- Start analysis button

**Analyzer Selection (4 tests)**
- Default analyzer initialization
- Manual mode toggling
- Preset application
- Custom preset save/delete

**Starting Analysis (1 test)**
- Batch analysis with selected files and analyzers

**Reset Functionality (2 tests)**
- Analysis state reset
- Analyzer defaults reset

**Tabs Navigation (2 tests)**
- Default presets tab
- Manual tab switching

**Component Integration (2 tests)**
- AnalyzerPresetSelector rendering
- AnalyzerCheckboxGroup rendering

**Accessibility (2 tests)**
- Accessible button labels
- Proper ARIA structure

**Memoization (1 test)**
- selectedFilePaths memoization

**Error Cases (3 tests)**
- Missing file handling
- No files selected warning
- Analysis failure error logging

**Edge Cases (3 tests)**
- Empty mediaPool
- Null project
- Undefined browserState

**Button States (3 tests)**
- Disabled when no analyzers
- Correct file count
- No files selected prevention

**Progress Display States (9 tests)**
- Progress panel visibility
- File progress cards
- Overall stats
- AI Director Chat (completed files)
- No chat for incomplete files
- Tab switching
- New analysis button (not analyzing)
- No new analysis button (analyzing)
- Overall progress stats

## Testing Patterns

### Mock Setup

The tests use targeted mocks for specific hooks and components:

```typescript
vi.mock("@/features/ai-director/hooks/use-ai-director-analysis-v2")
vi.mock("@/features/ai-director/hooks/use-analyzer-presets")
vi.mock("@/features/ai-director/hooks/use-ai-director-dashboard")
```

Components are mocked to simplify testing:
- AIDirectorChat
- AIDirectorDashboard
- AnalyzerCheckboxGroup
- AnalyzerPresetSelector
- FileAnalysisProgress

### State Management

Mock state variables control component behavior:
- `mockIsAnalyzing` - controls analyzing state
- `mockFilesProgress` - controls progress display
- `mockBrowserState` - simulates browser selection
- `mockMediaPool` - simulates media pool files

### Test Data Reset

All mock data is reset in `beforeEach`:

```typescript
beforeEach(() => {
  vi.clearAllMocks()
  mockIsAnalyzing = false
  mockFilesProgress = []
  // Reset browser and media pool state...
})
```

## Running Tests

```bash
# Run all tests
bun run test src/features/analysis-dashboard

# Run with coverage
bun run test src/features/analysis-dashboard --coverage

# Run specific test file
bun run test src/features/analysis-dashboard/__tests__/components/ai-analysis-dashboard.test.tsx

# Watch mode
bun run test:watch src/features/analysis-dashboard
```

## Coverage Goals

✅ **Target: >90% coverage - ACHIEVED (95.83%)**

Uncovered lines:
- Lines 110-111: Logger warning when no files selected (edge case, low priority)

## Future Improvements

1. Add integration tests with real AI Director hooks
2. Test keyboard navigation
3. Test drag-and-drop file selection
4. Performance tests for large file lists
5. Visual regression tests

## Related Documentation

- [Analysis Dashboard Architecture](../../README.md)
- [AI Director Tests](../../../ai-director/__tests__/README.md)
- [Testing Strategy](../../../../docs/05_development/ru/testing-strategy.md)

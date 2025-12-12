# Timeline Testing Documentation

## Overview

This document describes the testing strategy and structure for Timeline feature hooks and components.

## Test Structure

### Organized by Functionality Groups

Tests are organized into logical groups using nested `describe` blocks:

```typescript
describe("useTimelineActions", () => {
  describe("Hook Initialization", () => {
    // Tests for hook setup and basic functionality
  })

  describe("Media Type Detection", () => {
    // Tests for media file type detection
  })

  describe("Timeline Operations", () => {
    // Tests for timeline manipulation operations
  })

  describe("Track Management", () => {
    // Tests for track-related functionality
  })
})
```

### Test Categories

1. **Hook Initialization**
   - Verify hook is defined and exportable
   - Check return object has all required properties and methods

2. **Default State**
   - Test initial/empty state values
   - Verify default return values

3. **Core Functionality**
   - Test main business logic
   - Verify method behaviors with valid inputs

4. **Error Handling**
   - Test behavior with invalid parameters
   - Ensure no errors are thrown

## Testing Patterns

### 1. Hook Structure Validation

```typescript
it("should return object with all required properties and methods", () => {
  const { result } = renderHook(() => useHook())

  expect(result.current).toHaveProperty("property1")
  expect(result.current).toHaveProperty("method1")
})
```

### 2. Default State Testing

```typescript
it("should return empty arrays by default", () => {
  const { result } = renderHook(() => useHook())

  expect(result.current.items).toEqual([])
})
```

### 3. Method Behavior Testing

```typescript
it("should return null for non-existent item", () => {
  const { result } = renderHook(() => useHook())

  const item = result.current.findItem("non-existent")
  expect(item).toBeNull()
})
```

### 4. Error Handling Testing

```typescript
it("should not throw errors with invalid parameters", () => {
  const { result } = renderHook(() => useHook())

  expect(() => {
    result.current.method("")
    result.current.method(null)
  }).not.toThrow()
})
```

## Mock Strategy

### Global Mocks (setup.ts)

Timeline hooks are mocked globally in `src/test/setup.ts`:

```typescript
vi.mock("@/features/timeline/hooks/clips/use-clips", () => ({
  useClips: () => ({
    clips: [],
    selectedClips: [],
    // ... other default values
  }),
}))
```

### Benefits of Global Mocks

1. **Consistency**: Same mock behavior across all tests
2. **Simplicity**: No need to mock in individual test files
3. **Isolation**: Tests focus on interface contracts, not implementation
4. **Speed**: Fast execution without complex provider setup

## Test Files

### Current Test Coverage

#### Hooks Tests
- `use-clips.test.tsx` - Tests for clip management hook (11 tests)
- `use-tracks.test.tsx` - Tests for track management hook (9 tests)
- `use-timeline-actions.test.tsx` - Tests for timeline actions hook (9 tests)
- `use-timeline-selection.test.tsx` - Tests for selection management hook (13 tests)

#### Component Tests
- `timeline.test.tsx` - Tests for main Timeline component (14 tests)
- `track.test.tsx` - Tests for Track component (18 tests)

#### Service Tests
- `timeline-provider.test.tsx` - Tests for TimelineProvider (11 tests)
- `timeline-machine.test.ts` - Tests for XState machine (20 tests)

#### Type Tests
- `factories.test.ts` - Tests for factory functions (18 tests)

### Test Metrics

- **Total Tests**: 1793 ✅
- **Test Files**: 89
- **Coverage**: 100% success rate
- **Execution Time**: ~20 seconds
- **Last Updated**: August 2025

#### Breakdown by Category:
- **Hooks**: 1200+ tests (comprehensive tests for all hooks including edge cases)
- **Components**: 400+ tests (timeline, track, clip, markers, etc.)
- **Services**: 150+ tests (timeline-machine, providers, speed-ramping)
- **Types/Factories**: 43 tests (factories, validators)

## Running Tests

```bash
# Run all timeline hook tests
bun run test src/features/timeline/__tests__/hooks

# Run specific test file
bun run test src/features/timeline/__tests__/hooks/use-clips.test.tsx

# Run with watch mode
bun run test src/features/timeline/__tests__/hooks --watch
```

## Best Practices

1. **Group Related Tests**: Use nested describe blocks for organization
2. **Test Interfaces**: Focus on public API contracts
3. **Use Descriptive Names**: Clear test descriptions in English
4. **Test Edge Cases**: Include error handling and invalid inputs
5. **Keep Tests Simple**: One assertion per test when possible
6. **Mock Dependencies**: Use global mocks for consistency

## Recent Updates (August 2025)

### ✅ Модульная архитектура провайдеров
1. **Рефакторинг TimelineProvider** на отдельные модульные провайдеры
2. **Создание специализированных провайдеров**:
   - TimelineProjectProvider
   - TimelineSelectionProvider
   - TimelinePlaybackProvider
   - TimelineClipsProvider
   - TimelineTracksProvider
   - TimelineEffectsProvider
3. **Исправление всех тестов** для работы с новой архитектурой
4. **Добавление защиты от undefined** в хуках (selectedClipIds, selectedTrackIds)
5. **Обновление моков** для совместимости с модульной архитектурой

## Previous Updates (May 2025)

### ✅ Completed
1. **Added comprehensive component tests** for Timeline and Track
2. **Enhanced test coverage** to 123 tests (100% success rate)
3. **Added data-testid attributes** to components for reliable testing
4. **Implemented error handling** for edge cases (null props, invalid data)
5. **Added ResizeObserver mock** for component testing
6. **Removed style-specific tests** (as requested for flexibility)
7. **Added support for className and style props** in components

### 🔧 Technical Improvements
- **Timeline component**: Added props support and test-id
- **Track component**: Enhanced with callbacks, error handling, accessibility
- **TrackHeader**: Added test-ids for mute/lock buttons
- **Global mocks**: Updated setup.ts with timeline-specific mocks

## Future Improvements

1. **Integration Tests**: Add tests with real providers
2. **E2E Tests**: Test complete user workflows
3. **Performance Tests**: Measure hook performance
4. **Visual Tests**: Screenshot testing for UI components
5. **Accessibility Tests**: Enhanced a11y testing

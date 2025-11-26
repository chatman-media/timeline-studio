# Scenarios

**English** | [Русский](./README.ru.md)

## Overview

Editing scenarios system for Timeline Studio. Provides predefined automated workflows for common video editing tasks including step-by-step wizards for automation, structure creation, effects application, and workflow optimization.

## Status

- ✅ **Components**: 3 UI components for scenario browser, preview, and wizard
- ✅ **Hooks**: 2 hooks for scenario management and wizard control
- ✅ **Services**: Scenario executor with step handlers and state machine
- ✅ **Tests**: 30+ tests passing

## Structure

```
scenarios/
├── components/         # UI components
│   ├── scenario-browser.tsx
│   ├── scenario-preview.tsx
│   └── scenario-wizard.tsx
├── hooks/              # React hooks
│   ├── use-scenario.ts
│   └── use-scenario-wizard.ts
├── lib/                # Scenario libraries
│   ├── automation-scenarios.ts
│   ├── scenarios.ts
│   └── structure-scenarios.ts
├── services/           # Business logic
│   ├── scenario-executor.ts
│   └── scenario-machine.ts
├── types/              # TypeScript types
│   └── scenario.ts
└── __tests__/          # Tests (30+ tests)
```

## Features

### ✅ Implemented

- [x] **Scenario Categories**: Automation, Structure, Effects, Workflow
- [x] **Difficulty Levels**: Beginner (5-10 min), Intermediate (10-20 min), Advanced (20+ min)
- [x] **Scenario Steps**: Select clips, add templates, add cuts, sync beats, apply effects, etc.
- [x] **Execution System**: Step-by-step wizard with progress tracking
- [x] **AI Integration**: AI-assisted automation scenarios
- [x] **Filtering & Search**: By category, difficulty, AI-assisted, duration
- [x] **Error Handling**: Stop on error or continue modes
- [x] **Undo Support**: Revert scenario steps

### ❌ Not Implemented

- [ ] Visual scenario editor
- [ ] Custom user scenarios
- [ ] Scenario templates marketplace

## Usage

```typescript
import { useScenario } from '@/features/scenarios'

function ScenarioPanel() {
  const {
    scenarios,
    selectedScenario,
    currentStep,
    totalSteps,
    progress,
    isExecuting,
    selectScenario,
    startExecution,
    pauseExecution,
    resumeExecution,
    cancelExecution,
  } = useScenario()

  const handleExecute = async () => {
    if (selectedScenario) {
      await startExecution(project, {
        onProgress: (stepId, percentage) => {
          console.log(`Step ${stepId}: ${percentage}%`)
        },
        onStepComplete: (stepId, result) => {
          console.log(`Completed: ${stepId}`, result)
        }
      })
    }
  }

  return (
    <div>
      <select onChange={(e) => selectScenario(e.target.value)}>
        {scenarios.map(s => (
          <option key={s.id} value={s.id}>
            {s.name.ru} ({s.difficulty})
          </option>
        ))}
      </select>
      <button onClick={handleExecute} disabled={!selectedScenario}>
        Execute Scenario
      </button>
      {isExecuting && <progress value={progress} max={100} />}
    </div>
  )
}
```

## Integration

- **Depends on**: @/features/project-settings, @/lib/tauri-logger
- **Used by**: Media Studio, AI Director, Timeline

## Testing

- **Total tests**: 30+ tests
- **Test files**: `__tests__/hooks/use-scenario.test.tsx`, `__tests__/services/scenario-executor.test.ts`
- **Coverage**: Scenario execution, filtering, searching, error handling

```bash
# Run all scenario tests
bun run test src/features/scenarios

# Run specific test file
bun run test src/features/scenarios/__tests__/hooks/use-scenario.test.tsx
```

## TODO / Roadmap

- [ ] Add visual scenario editor for creating custom workflows
- [ ] Implement scenario sharing and marketplace
- [ ] Add more AI-assisted scenarios
- [ ] Improve error recovery mechanisms
- [ ] Add scenario preview before execution

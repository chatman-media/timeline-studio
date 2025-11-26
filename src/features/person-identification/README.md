# Person Identification

**English** | [Русский](./README.ru.md)

## Overview
Advanced face detection, person identification, and tracking system with Timeline integration and ML-powered clustering capabilities.

## Status
- ✅ **Components**: Full person management UI (list, detail, form)
- ✅ **Hooks**: usePersonIdentification, useTimelinePersons ready
- ✅ **Services**: PersonDatabaseService with Tauri backend integration
- ✅ **Tests**: 20+ tests passing (components, hooks, services)

## Structure
```
person-identification/
├── components/
│   ├── person-list.tsx          # Person list with filtering
│   ├── person-detail.tsx        # Detailed person info
│   ├── person-form.tsx          # Create/edit form
│   └── person-manager.tsx       # Main management component
├── hooks/
│   └── use-person-identification.ts  # Main hook
├── services/
│   └── person-database-service.ts    # Database service
├── types/
│   └── person.ts                # TypeScript types
└── __tests__/
    ├── components/              # Component tests
    ├── hooks/                   # Hook tests
    └── services/                # Service tests
```

## Features
### ✅ Implemented
- [x] Automatic face detection using Scene Analysis Engine
- [x] Face clustering (DBSCAN algorithm)
- [x] Person profile management (CRUD)
- [x] Timeline integration with person indicators
- [x] Search and filtering by name/tags
- [x] Appearance statistics and tracking
- [x] FaceNet embeddings (512D/128D)
- [x] RetinaFace detection with quality assessment
- [x] Privacy processor (face blurring)
- [x] Advanced tracking system
- [x] Real-time face detection

### ❌ Not Implemented
- [ ] MediaPipe integration (468 3D landmarks)
- [ ] Expression analysis
- [ ] Age/gender estimation
- [ ] Emotion recognition
- [ ] Face swapping features
- [ ] Auto-tagging based on context

## Usage
```typescript
import { PersonManager } from '@/features/person-identification'
import { usePersonIdentification, useTimelinePersons } from '@/features/person-identification'

// Basic usage
<PersonManager />

// In components
const {
  persons,
  addPerson,
  updatePerson,
  deletePerson,
  detectFaces,
  identifyPerson
} = usePersonIdentification()

// Timeline integration
const {
  getPersonsForClip,
  analyzeClipForPersons,
  confidenceThreshold
} = useTimelinePersons()
```

## Integration
- **Depends on**: @/domains/ai-content-intelligence (Scene Analysis, Computer Vision)
- **Used by**: @/features/timeline, @/features/media-studio
- **Timeline**: Person indicators on clips, persons panel
- **Backend**: Extensive Tauri command integration

## Testing
- **Total tests**: 20+ tests
- **Coverage**: Components, hooks, services, Tauri integration

```bash
# Run all tests
bun run test src/features/person-identification

# Run specific test suite
bun run test src/features/person-identification/__tests__/services/person-database-service.tauri.test.ts
```

## TODO / Roadmap
- [ ] MediaPipe 3D facial landmarks integration
- [ ] Real-time expression analysis
- [ ] Advanced tracking improvements (occlusion handling)
- [ ] Person re-identification across scenes
- [ ] Auto-save face embeddings during analysis
- [ ] Batch person tagging
- [ ] Export person appearance reports
- [ ] Privacy features enhancement (selective blurring)
- [ ] Integration with project export (anonymization)

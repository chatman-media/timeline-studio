# Provider Migration Analysis Report

Generated: 2025-09-23T23:36:16.659Z

## Summary Statistics

- **Total Providers**: 41
- **Fully Integrated**: 8 (20%)
- **Partially Integrated**: 11 (27%)
- **Local Only**: 8 (20%)
- **Unknown Status**: 14 (34%)

## Detailed Analysis

## ✅ Fully Integrated Providers

### video-editing-provider.integration.test
- **File**: `src/domains/video-editing/providers/__tests__/video-editing-provider.integration.test.tsx`
- **Status**: integrated
- **Backend Integration**:
  - Uses BackendSync: true
  - Uses App Actor: false
  - Uses Orchestrator: true
  - Local State Only: false
- **Test Coverage**:
  - Has Tests: false
  - Has Integration Tests: false
- **Recommendations**:
  - Add unit tests
  - Add integration tests with MockBackendProvider

### resources-provider.test
- **File**: `src/features/resources/__tests__/services/resources-provider.test.tsx`
- **Status**: integrated
- **Backend Integration**:
  - Uses BackendSync: true
  - Uses App Actor: false
  - Uses Orchestrator: false
  - Local State Only: false
- **Test Coverage**:
  - Has Tests: false
  - Has Integration Tests: false
- **Recommendations**:
  - Add unit tests
  - Add integration tests with MockBackendProvider

### resources-provider
- **File**: `src/features/resources/services/resources-provider.tsx`
- **Status**: integrated
- **Backend Integration**:
  - Uses BackendSync: true
  - Uses App Actor: false
  - Uses Orchestrator: false
  - Local State Only: false
- **Test Coverage**:
  - Has Tests: false
  - Has Integration Tests: false
- **Recommendations**:
  - Add unit tests
  - Add integration tests with MockBackendProvider

### project-settings-provider
- **File**: `src/features/project-settings/services/project-settings-provider.tsx`
- **Status**: integrated
- **Backend Integration**:
  - Uses BackendSync: true
  - Uses App Actor: false
  - Uses Orchestrator: false
  - Local State Only: false
- **Test Coverage**:
  - Has Tests: false
  - Has Integration Tests: false
- **Recommendations**:
  - Add unit tests
  - Add integration tests with MockBackendProvider

### chat-provider
- **File**: `src/features/ai-chat/services/chat-provider.tsx`
- **Status**: integrated
- **Backend Integration**:
  - Uses BackendSync: true
  - Uses App Actor: false
  - Uses Orchestrator: false
  - Local State Only: false
- **Test Coverage**:
  - Has Tests: false
  - Has Integration Tests: false
- **Recommendations**:
  - Add unit tests
  - Add integration tests with MockBackendProvider

### player-provider.integration.test
- **File**: `src/features/video-player/__tests__/player-provider.integration.test.tsx`
- **Status**: integrated
- **Backend Integration**:
  - Uses BackendSync: true
  - Uses App Actor: false
  - Uses Orchestrator: false
  - Local State Only: false
- **Test Coverage**:
  - Has Tests: false
  - Has Integration Tests: false
- **Recommendations**:
  - Add unit tests
  - Add integration tests with MockBackendProvider

### player-provider
- **File**: `src/features/video-player/services/player-provider.tsx`
- **Status**: integrated
- **Backend Integration**:
  - Uses BackendSync: true
  - Uses App Actor: false
  - Uses Orchestrator: false
  - Local State Only: false
- **Test Coverage**:
  - Has Tests: false
  - Has Integration Tests: false
- **Recommendations**:
  - Add unit tests
  - Add integration tests with MockBackendProvider

### player-provider.integration.test
- **File**: `src/features/video-player/services/__tests__/player-provider.integration.test.tsx`
- **Status**: integrated
- **Backend Integration**:
  - Uses BackendSync: true
  - Uses App Actor: false
  - Uses Orchestrator: false
  - Local State Only: false
- **Test Coverage**:
  - Has Tests: false
  - Has Integration Tests: false
- **Recommendations**:
  - Add unit tests
  - Add integration tests with MockBackendProvider

## ⚠️ Partially Integrated Providers

### project-management-provider
- **File**: `src/domains/project-management/providers/project-management-provider.tsx`
- **Status**: partial
- **Backend Integration**:
  - Uses BackendSync: false
  - Uses App Actor: false
  - Uses Orchestrator: true
  - Local State Only: true
- **Test Coverage**:
  - Has Tests: false
  - Has Integration Tests: false
- **Recommendations**:
  - Add unit tests
  - Consider migrating from orchestrator to direct backend-sync usage
  - Add integration tests if not present

### browser-domain-provider
- **File**: `src/domains/browser/providers/browser-domain-provider.tsx`
- **Status**: partial
- **Backend Integration**:
  - Uses BackendSync: false
  - Uses App Actor: true
  - Uses Orchestrator: false
  - Local State Only: false
- **Test Coverage**:
  - Has Tests: false
  - Has Integration Tests: false
- **Recommendations**:
  - Add unit tests
  - Consider migrating from orchestrator to direct backend-sync usage
  - Add integration tests if not present

### timeline-providers
- **File**: `src/domains/video-editing/providers/timeline-providers.tsx`
- **Status**: partial
- **Backend Integration**:
  - Uses BackendSync: false
  - Uses App Actor: false
  - Uses Orchestrator: true
  - Local State Only: false
- **Test Coverage**:
  - Has Tests: false
  - Has Integration Tests: false
- **Recommendations**:
  - Add unit tests
  - Consider migrating from orchestrator to direct backend-sync usage
  - Add integration tests if not present

### video-editing-provider
- **File**: `src/domains/video-editing/providers/video-editing-provider.tsx`
- **Status**: partial
- **Backend Integration**:
  - Uses BackendSync: false
  - Uses App Actor: false
  - Uses Orchestrator: true
  - Local State Only: true
- **Test Coverage**:
  - Has Tests: false
  - Has Integration Tests: false
- **Recommendations**:
  - Add unit tests
  - Consider migrating from orchestrator to direct backend-sync usage
  - Add integration tests if not present

### media-management-provider
- **File**: `src/domains/media-management/providers/media-management-provider.tsx`
- **Status**: partial
- **Backend Integration**:
  - Uses BackendSync: false
  - Uses App Actor: true
  - Uses Orchestrator: false
  - Local State Only: false
- **Test Coverage**:
  - Has Tests: false
  - Has Integration Tests: false
- **Recommendations**:
  - Add unit tests
  - Consider migrating from orchestrator to direct backend-sync usage
  - Add integration tests if not present

### system-integration-provider
- **File**: `src/domains/system-integration/providers/system-integration-provider.tsx`
- **Status**: partial
- **Backend Integration**:
  - Uses BackendSync: false
  - Uses App Actor: false
  - Uses Orchestrator: true
  - Local State Only: true
- **Test Coverage**:
  - Has Tests: false
  - Has Integration Tests: false
- **Recommendations**:
  - Add unit tests
  - Consider migrating from orchestrator to direct backend-sync usage
  - Add integration tests if not present

### ai-services-domain-provider
- **File**: `src/domains/ai-services/providers/ai-services-domain-provider.tsx`
- **Status**: partial
- **Backend Integration**:
  - Uses BackendSync: false
  - Uses App Actor: true
  - Uses Orchestrator: false
  - Local State Only: false
- **Test Coverage**:
  - Has Tests: false
  - Has Integration Tests: false
- **Recommendations**:
  - Add unit tests
  - Consider migrating from orchestrator to direct backend-sync usage
  - Add integration tests if not present

### user-settings-provider
- **File**: `src/features/user-settings/services/user-settings-provider.tsx`
- **Status**: partial
- **Backend Integration**:
  - Uses BackendSync: false
  - Uses App Actor: false
  - Uses Orchestrator: true
  - Local State Only: true
- **Test Coverage**:
  - Has Tests: false
  - Has Integration Tests: false
- **Recommendations**:
  - Add unit tests
  - Consider migrating from orchestrator to direct backend-sync usage
  - Add integration tests if not present

### montage-planner-provider
- **File**: `src/features/montage-planner/services/montage-planner-provider.tsx`
- **Status**: partial
- **Backend Integration**:
  - Uses BackendSync: false
  - Uses App Actor: true
  - Uses Orchestrator: false
  - Local State Only: false
- **Test Coverage**:
  - Has Tests: false
  - Has Integration Tests: false
- **Recommendations**:
  - Add unit tests
  - Consider migrating from orchestrator to direct backend-sync usage
  - Add integration tests if not present

### app-settings-provider.test
- **File**: `src/features/app-state/__tests__/services/app-settings-provider.test.tsx`
- **Status**: partial
- **Backend Integration**:
  - Uses BackendSync: false
  - Uses App Actor: true
  - Uses Orchestrator: false
  - Local State Only: false
- **Test Coverage**:
  - Has Tests: false
  - Has Integration Tests: false
- **Recommendations**:
  - Add unit tests
  - Consider migrating from orchestrator to direct backend-sync usage
  - Add integration tests if not present

### app-provider
- **File**: `src/features/app-state/services/app-provider.tsx`
- **Status**: partial
- **Backend Integration**:
  - Uses BackendSync: false
  - Uses App Actor: true
  - Uses Orchestrator: false
  - Local State Only: false
- **Test Coverage**:
  - Has Tests: false
  - Has Integration Tests: false
- **Recommendations**:
  - Add unit tests
  - Consider migrating from orchestrator to direct backend-sync usage
  - Add integration tests if not present

## 🔧 Local Only Providers (Need Migration)

### ai-services-provider
- **File**: `src/domains/ai-core/react/ai-services-provider.tsx`
- **Status**: local
- **Backend Integration**:
  - Uses BackendSync: false
  - Uses App Actor: false
  - Uses Orchestrator: false
  - Local State Only: true
- **Test Coverage**:
  - Has Tests: false
  - Has Integration Tests: false
- **Recommendations**:
  - Add unit tests
  - Migrate to use getBackendSync() or useApp()
  - Add integration tests with MockBackendProvider

### ai-intelligence-provider
- **File**: `src/features/ai-content-intelligence/services/ai-intelligence-provider.tsx`
- **Status**: local
- **Backend Integration**:
  - Uses BackendSync: false
  - Uses App Actor: false
  - Uses Orchestrator: false
  - Local State Only: true
- **Test Coverage**:
  - Has Tests: false
  - Has Integration Tests: false
- **Recommendations**:
  - Add unit tests
  - Migrate to use getBackendSync() or useApp()
  - Add integration tests with MockBackendProvider

### effects-provider
- **File**: `src/features/browser/providers/effects-provider.tsx`
- **Status**: local
- **Backend Integration**:
  - Uses BackendSync: false
  - Uses App Actor: false
  - Uses Orchestrator: false
  - Local State Only: true
- **Test Coverage**:
  - Has Tests: false
  - Has Integration Tests: false
- **Recommendations**:
  - Add unit tests
  - Migrate to use getBackendSync() or useApp()
  - Add integration tests with MockBackendProvider

### effects-provider.test
- **File**: `src/features/browser/__tests__/providers/effects-provider.test.tsx`
- **Status**: local
- **Backend Integration**:
  - Uses BackendSync: false
  - Uses App Actor: false
  - Uses Orchestrator: false
  - Local State Only: true
- **Test Coverage**:
  - Has Tests: false
  - Has Integration Tests: false
- **Recommendations**:
  - Add unit tests
  - Migrate to use getBackendSync() or useApp()
  - Add integration tests with MockBackendProvider

### browser-state-provider
- **File**: `src/features/browser/services/browser-state-provider.tsx`
- **Status**: local
- **Backend Integration**:
  - Uses BackendSync: false
  - Uses App Actor: false
  - Uses Orchestrator: false
  - Local State Only: true
- **Test Coverage**:
  - Has Tests: false
  - Has Integration Tests: false
- **Recommendations**:
  - Add unit tests
  - Migrate to use getBackendSync() or useApp()
  - Add integration tests with MockBackendProvider

### shortcuts-provider
- **File**: `src/features/keyboard-shortcuts/services/shortcuts-provider.tsx`
- **Status**: local
- **Backend Integration**:
  - Uses BackendSync: false
  - Uses App Actor: false
  - Uses Orchestrator: false
  - Local State Only: true
- **Test Coverage**:
  - Has Tests: true
  - Has Integration Tests: false
  - Test File: `src/features/keyboard-shortcuts/services/__tests__/shortcuts-provider.test.tsx`
- **Recommendations**:
  - Migrate to use getBackendSync() or useApp()
  - Add integration tests with MockBackendProvider

### mock-backend-provider
- **File**: `src/features/app-state/testing/mock-backend-provider.tsx`
- **Status**: local
- **Backend Integration**:
  - Uses BackendSync: false
  - Uses App Actor: false
  - Uses Orchestrator: false
  - Local State Only: true
- **Test Coverage**:
  - Has Tests: false
  - Has Integration Tests: false
- **Recommendations**:
  - Add unit tests
  - Migrate to use getBackendSync() or useApp()
  - Add integration tests with MockBackendProvider

### i18n-provider
- **File**: `src/i18n/services/i18n-provider.tsx`
- **Status**: local
- **Backend Integration**:
  - Uses BackendSync: false
  - Uses App Actor: false
  - Uses Orchestrator: false
  - Local State Only: true
- **Test Coverage**:
  - Has Tests: false
  - Has Integration Tests: false
- **Recommendations**:
  - Add unit tests
  - Migrate to use getBackendSync() or useApp()
  - Add integration tests with MockBackendProvider

## ❓ Unknown Status

### undo-redo-provider
- **File**: `src/domains/video-editing/providers/undo-redo-provider.tsx`
- **Status**: unknown
- **Backend Integration**:
  - Uses BackendSync: false
  - Uses App Actor: false
  - Uses Orchestrator: false
  - Local State Only: false
- **Test Coverage**:
  - Has Tests: false
  - Has Integration Tests: false
- **Recommendations**:
  - Add unit tests
  - Analyze provider architecture and determine migration path

### color-grading-provider
- **File**: `src/features/color-grading/services/color-grading-provider.tsx`
- **Status**: unknown
- **Backend Integration**:
  - Uses BackendSync: false
  - Uses App Actor: false
  - Uses Orchestrator: false
  - Local State Only: false
- **Test Coverage**:
  - Has Tests: true
  - Has Integration Tests: false
  - Test File: `src/features/color-grading/services/__tests__/color-grading-provider.test.tsx`
- **Recommendations**:
  - Analyze provider architecture and determine migration path

### color-grading-provider.test
- **File**: `src/features/color-grading/services/__tests__/color-grading-provider.test.tsx`
- **Status**: unknown
- **Backend Integration**:
  - Uses BackendSync: false
  - Uses App Actor: false
  - Uses Orchestrator: false
  - Local State Only: false
- **Test Coverage**:
  - Has Tests: false
  - Has Integration Tests: false
- **Recommendations**:
  - Add unit tests
  - Analyze provider architecture and determine migration path

### project-settings-provider.test
- **File**: `src/features/project-settings/__tests__/services/project-settings-provider.test.tsx`
- **Status**: unknown
- **Backend Integration**:
  - Uses BackendSync: false
  - Uses App Actor: false
  - Uses Orchestrator: false
  - Local State Only: false
- **Test Coverage**:
  - Has Tests: false
  - Has Integration Tests: false
- **Recommendations**:
  - Add unit tests
  - Analyze provider architecture and determine migration path

### modal-provider.test
- **File**: `src/features/modals/services/__tests__/modal-provider.test.tsx`
- **Status**: unknown
- **Backend Integration**:
  - Uses BackendSync: false
  - Uses App Actor: false
  - Uses Orchestrator: false
  - Local State Only: false
- **Test Coverage**:
  - Has Tests: false
  - Has Integration Tests: false
- **Recommendations**:
  - Add unit tests
  - Analyze provider architecture and determine migration path

### modal-provider
- **File**: `src/features/modals/services/modal-provider.tsx`
- **Status**: unknown
- **Backend Integration**:
  - Uses BackendSync: false
  - Uses App Actor: false
  - Uses Orchestrator: false
  - Local State Only: false
- **Test Coverage**:
  - Has Tests: true
  - Has Integration Tests: false
  - Test File: `src/features/modals/services/__tests__/modal-provider.test.tsx`
- **Recommendations**:
  - Analyze provider architecture and determine migration path

### adapter-test-providers
- **File**: `src/features/browser/__tests__/adapters/adapter-test-providers.tsx`
- **Status**: unknown
- **Backend Integration**:
  - Uses BackendSync: false
  - Uses App Actor: false
  - Uses Orchestrator: false
  - Local State Only: false
- **Test Coverage**:
  - Has Tests: false
  - Has Integration Tests: false
- **Recommendations**:
  - Add unit tests
  - Analyze provider architecture and determine migration path

### tauri-mock-provider
- **File**: `src/features/media-studio/services/tauri-mock-provider.tsx`
- **Status**: unknown
- **Backend Integration**:
  - Uses BackendSync: false
  - Uses App Actor: false
  - Uses Orchestrator: false
  - Local State Only: false
- **Test Coverage**:
  - Has Tests: false
  - Has Integration Tests: false
- **Recommendations**:
  - Add unit tests
  - Analyze provider architecture and determine migration path

### providers
- **File**: `src/features/media-studio/services/providers.tsx`
- **Status**: unknown
- **Backend Integration**:
  - Uses BackendSync: false
  - Uses App Actor: false
  - Uses Orchestrator: false
  - Local State Only: false
- **Test Coverage**:
  - Has Tests: false
  - Has Integration Tests: false
- **Recommendations**:
  - Add unit tests
  - Analyze provider architecture and determine migration path

### undo-redo-provider
- **File**: `src/features/timeline/providers/undo-redo-provider.tsx`
- **Status**: unknown
- **Backend Integration**:
  - Uses BackendSync: false
  - Uses App Actor: false
  - Uses Orchestrator: false
  - Local State Only: false
- **Test Coverage**:
  - Has Tests: false
  - Has Integration Tests: false
- **Recommendations**:
  - Add unit tests
  - Analyze provider architecture and determine migration path

### drag-drop-provider
- **File**: `src/features/timeline/components/drag-drop-provider.tsx`
- **Status**: unknown
- **Backend Integration**:
  - Uses BackendSync: false
  - Uses App Actor: false
  - Uses Orchestrator: false
  - Local State Only: false
- **Test Coverage**:
  - Has Tests: false
  - Has Integration Tests: false
- **Recommendations**:
  - Add unit tests
  - Analyze provider architecture and determine migration path

### test-providers
- **File**: `src/features/timeline/__tests__/test-providers.tsx`
- **Status**: unknown
- **Backend Integration**:
  - Uses BackendSync: false
  - Uses App Actor: false
  - Uses Orchestrator: false
  - Local State Only: false
- **Test Coverage**:
  - Has Tests: false
  - Has Integration Tests: false
- **Recommendations**:
  - Add unit tests
  - Analyze provider architecture and determine migration path

### drag-drop-provider.test
- **File**: `src/features/timeline/__tests__/components/drag-drop-provider.test.tsx`
- **Status**: unknown
- **Backend Integration**:
  - Uses BackendSync: false
  - Uses App Actor: false
  - Uses Orchestrator: false
  - Local State Only: false
- **Test Coverage**:
  - Has Tests: false
  - Has Integration Tests: false
- **Recommendations**:
  - Add unit tests
  - Analyze provider architecture and determine migration path

### shortcuts-provider.test
- **File**: `src/features/keyboard-shortcuts/services/__tests__/shortcuts-provider.test.tsx`
- **Status**: unknown
- **Backend Integration**:
  - Uses BackendSync: false
  - Uses App Actor: false
  - Uses Orchestrator: false
  - Local State Only: false
- **Test Coverage**:
  - Has Tests: false
  - Has Integration Tests: false
- **Recommendations**:
  - Add unit tests
  - Analyze provider architecture and determine migration path

## CSV Summary Table

```csv
Provider Name,File Path,Status,Uses BackendSync,Uses App Actor,Uses Orchestrator,Local State Only,Has Tests,Has Integration Tests,Recommendations
project-management-provider,src/domains/project-management/providers/project-management-provider.tsx,partial,false,false,true,true,false,false,"Add unit tests; Consider migrating from orchestrator to direct backend-sync usage; Add integration tests if not present"
browser-domain-provider,src/domains/browser/providers/browser-domain-provider.tsx,partial,false,true,false,false,false,false,"Add unit tests; Consider migrating from orchestrator to direct backend-sync usage; Add integration tests if not present"
ai-services-provider,src/domains/ai-core/react/ai-services-provider.tsx,local,false,false,false,true,false,false,"Add unit tests; Migrate to use getBackendSync() or useApp(); Add integration tests with MockBackendProvider"
timeline-providers,src/domains/video-editing/providers/timeline-providers.tsx,partial,false,false,true,false,false,false,"Add unit tests; Consider migrating from orchestrator to direct backend-sync usage; Add integration tests if not present"
video-editing-provider,src/domains/video-editing/providers/video-editing-provider.tsx,partial,false,false,true,true,false,false,"Add unit tests; Consider migrating from orchestrator to direct backend-sync usage; Add integration tests if not present"
video-editing-provider.integration.test,src/domains/video-editing/providers/__tests__/video-editing-provider.integration.test.tsx,integrated,true,false,true,false,false,false,"Add unit tests; Add integration tests with MockBackendProvider"
undo-redo-provider,src/domains/video-editing/providers/undo-redo-provider.tsx,unknown,false,false,false,false,false,false,"Add unit tests; Analyze provider architecture and determine migration path"
media-management-provider,src/domains/media-management/providers/media-management-provider.tsx,partial,false,true,false,false,false,false,"Add unit tests; Consider migrating from orchestrator to direct backend-sync usage; Add integration tests if not present"
system-integration-provider,src/domains/system-integration/providers/system-integration-provider.tsx,partial,false,false,true,true,false,false,"Add unit tests; Consider migrating from orchestrator to direct backend-sync usage; Add integration tests if not present"
ai-services-domain-provider,src/domains/ai-services/providers/ai-services-domain-provider.tsx,partial,false,true,false,false,false,false,"Add unit tests; Consider migrating from orchestrator to direct backend-sync usage; Add integration tests if not present"
user-settings-provider,src/features/user-settings/services/user-settings-provider.tsx,partial,false,false,true,true,false,false,"Add unit tests; Consider migrating from orchestrator to direct backend-sync usage; Add integration tests if not present"
resources-provider.test,src/features/resources/__tests__/services/resources-provider.test.tsx,integrated,true,false,false,false,false,false,"Add unit tests; Add integration tests with MockBackendProvider"
resources-provider,src/features/resources/services/resources-provider.tsx,integrated,true,false,false,false,false,false,"Add unit tests; Add integration tests with MockBackendProvider"
color-grading-provider,src/features/color-grading/services/color-grading-provider.tsx,unknown,false,false,false,false,true,false,"Analyze provider architecture and determine migration path"
color-grading-provider.test,src/features/color-grading/services/__tests__/color-grading-provider.test.tsx,unknown,false,false,false,false,false,false,"Add unit tests; Analyze provider architecture and determine migration path"
project-settings-provider.test,src/features/project-settings/__tests__/services/project-settings-provider.test.tsx,unknown,false,false,false,false,false,false,"Add unit tests; Analyze provider architecture and determine migration path"
project-settings-provider,src/features/project-settings/services/project-settings-provider.tsx,integrated,true,false,false,false,false,false,"Add unit tests; Add integration tests with MockBackendProvider"
modal-provider.test,src/features/modals/services/__tests__/modal-provider.test.tsx,unknown,false,false,false,false,false,false,"Add unit tests; Analyze provider architecture and determine migration path"
modal-provider,src/features/modals/services/modal-provider.tsx,unknown,false,false,false,false,true,false,"Analyze provider architecture and determine migration path"
ai-intelligence-provider,src/features/ai-content-intelligence/services/ai-intelligence-provider.tsx,local,false,false,false,true,false,false,"Add unit tests; Migrate to use getBackendSync() or useApp(); Add integration tests with MockBackendProvider"
chat-provider,src/features/ai-chat/services/chat-provider.tsx,integrated,true,false,false,false,false,false,"Add unit tests; Add integration tests with MockBackendProvider"
effects-provider,src/features/browser/providers/effects-provider.tsx,local,false,false,false,true,false,false,"Add unit tests; Migrate to use getBackendSync() or useApp(); Add integration tests with MockBackendProvider"
effects-provider.test,src/features/browser/__tests__/providers/effects-provider.test.tsx,local,false,false,false,true,false,false,"Add unit tests; Migrate to use getBackendSync() or useApp(); Add integration tests with MockBackendProvider"
adapter-test-providers,src/features/browser/__tests__/adapters/adapter-test-providers.tsx,unknown,false,false,false,false,false,false,"Add unit tests; Analyze provider architecture and determine migration path"
browser-state-provider,src/features/browser/services/browser-state-provider.tsx,local,false,false,false,true,false,false,"Add unit tests; Migrate to use getBackendSync() or useApp(); Add integration tests with MockBackendProvider"
tauri-mock-provider,src/features/media-studio/services/tauri-mock-provider.tsx,unknown,false,false,false,false,false,false,"Add unit tests; Analyze provider architecture and determine migration path"
providers,src/features/media-studio/services/providers.tsx,unknown,false,false,false,false,false,false,"Add unit tests; Analyze provider architecture and determine migration path"
montage-planner-provider,src/features/montage-planner/services/montage-planner-provider.tsx,partial,false,true,false,false,false,false,"Add unit tests; Consider migrating from orchestrator to direct backend-sync usage; Add integration tests if not present"
undo-redo-provider,src/features/timeline/providers/undo-redo-provider.tsx,unknown,false,false,false,false,false,false,"Add unit tests; Analyze provider architecture and determine migration path"
drag-drop-provider,src/features/timeline/components/drag-drop-provider.tsx,unknown,false,false,false,false,false,false,"Add unit tests; Analyze provider architecture and determine migration path"
test-providers,src/features/timeline/__tests__/test-providers.tsx,unknown,false,false,false,false,false,false,"Add unit tests; Analyze provider architecture and determine migration path"
drag-drop-provider.test,src/features/timeline/__tests__/components/drag-drop-provider.test.tsx,unknown,false,false,false,false,false,false,"Add unit tests; Analyze provider architecture and determine migration path"
player-provider.integration.test,src/features/video-player/__tests__/player-provider.integration.test.tsx,integrated,true,false,false,false,false,false,"Add unit tests; Add integration tests with MockBackendProvider"
player-provider,src/features/video-player/services/player-provider.tsx,integrated,true,false,false,false,false,false,"Add unit tests; Add integration tests with MockBackendProvider"
player-provider.integration.test,src/features/video-player/services/__tests__/player-provider.integration.test.tsx,integrated,true,false,false,false,false,false,"Add unit tests; Add integration tests with MockBackendProvider"
shortcuts-provider,src/features/keyboard-shortcuts/services/shortcuts-provider.tsx,local,false,false,false,true,true,false,"Migrate to use getBackendSync() or useApp(); Add integration tests with MockBackendProvider"
shortcuts-provider.test,src/features/keyboard-shortcuts/services/__tests__/shortcuts-provider.test.tsx,unknown,false,false,false,false,false,false,"Add unit tests; Analyze provider architecture and determine migration path"
mock-backend-provider,src/features/app-state/testing/mock-backend-provider.tsx,local,false,false,false,true,false,false,"Add unit tests; Migrate to use getBackendSync() or useApp(); Add integration tests with MockBackendProvider"
app-settings-provider.test,src/features/app-state/__tests__/services/app-settings-provider.test.tsx,partial,false,true,false,false,false,false,"Add unit tests; Consider migrating from orchestrator to direct backend-sync usage; Add integration tests if not present"
app-provider,src/features/app-state/services/app-provider.tsx,partial,false,true,false,false,false,false,"Add unit tests; Consider migrating from orchestrator to direct backend-sync usage; Add integration tests if not present"
i18n-provider,src/i18n/services/i18n-provider.tsx,local,false,false,false,true,false,false,"Add unit tests; Migrate to use getBackendSync() or useApp(); Add integration tests with MockBackendProvider"
```

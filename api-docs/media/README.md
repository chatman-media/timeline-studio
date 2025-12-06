# AI Chat Feature

UI компоненты и интеграции для AI чата в Timeline Studio.

## 🏗️ Архитектура (FEOD)

Модуль `features/ai-chat` содержит **только UI и интеграции**. Domain логика находится в `domains/ai-services`.

\`\`\`
domains/ai-services/              features/ai-chat/
├── providers/                    ├── components/  (UI компоненты)
│   ├── ChatProvider ✓            │   ├── AiChat
│   └── MCPProvider ✓             │   ├── AIActionPreview
├── machines/                     │   └── CacheStatsPanel
│   ├── chatMachine ✓             ├── hooks/ (интеграционные хуки)
│   └── backend-event-handlers    │   ├── useTimelineAI
└── types/                        │   ├── usePlayerAIIntegration
    └── chat                      │   └── useBrowserAIIntegration
                                  ├── utils/ (feature-specific)
                                  └── types/ (UI types)
\`\`\`

## 📦 Публичный API

### UI Компоненты

\`\`\`tsx
import { AiChat, AIActionPreview, CacheStatsPanel } from '@/features/ai-chat'

// Главный UI компонент чата
<AiChat />
\`\`\`

### Интеграционные хуки

\`\`\`tsx
import {
  useTimelineAI,
  usePlayerAIIntegration,
  useBrowserAIIntegration,
  useResourcesAIIntegration
} from '@/features/ai-chat'

// Интеграция AI с timeline
const { analyzeClips, suggestTransitions } = useTimelineAI()

// Интеграция AI с плеером
const { analyzeCurrentFrame } = usePlayerAIIntegration()
\`\`\`

## ⚠️ Что НЕ экспортируется

**Domain логика** (используйте \`@/domains/ai-services\`):
\`\`\`tsx
// ❌ НЕПРАВИЛЬНО
import { ChatProvider } from '@/features/ai-chat'

// ✅ ПРАВИЛЬНО
import { ChatProvider, MCPProvider, chatMachine } from '@/domains/ai-services'
\`\`\`

## 🔧 Управление чатами

История чатов управляется через **backend** (Rust):

\`\`\`tsx
import { ChatProvider, useChat } from '@/domains/ai-services'

function MyComponent() {
  const {
    createSession,    // Создать новую сессию (backend)
    sendMessage,      // Отправить сообщение (backend + AI)
    sessions,         // Список сессий (backend)
    currentSession    // Текущая сессия (backend)
  } = useChat()
}
\`\`\`

**Персистентность:**
- ✅ История сохраняется через \`IBackendService\` (Tauri commands)
- ✅ Проектное состояние синхронизируется с Rust
- ✅ Работает в offline режиме (локальное хранилище Tauri)

## 🗑️ Удалённое (Legacy)

- ❌ \`LocalChatStorageService\` - заменён на backend через ChatProvider
- ❌ \`ChatStorageService\` interface - deprecated, используйте ChatProvider

## 📚 Дополнительно

- \`/components/README.md\` - документация UI компонентов
- \`/hooks/README.md\` - документация хуков
- \`/docs/03_architecture/feod-app-layer.md\` - архитектура FEOD

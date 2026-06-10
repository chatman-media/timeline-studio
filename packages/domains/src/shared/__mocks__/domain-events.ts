/**
 * Mock Utilities for Domain Events Testing
 */

import { vi } from "vitest"
import type { DomainEvent, DomainName, EventHandler, PublishResult, SubscriptionOptions } from "../events/domain-event"

/**
 * Create mock DomainEvent
 */
export function createMockDomainEvent<T = unknown>(overrides?: Partial<DomainEvent<T>>): DomainEvent<T> {
  return {
    id: "mock-event-id",
    type: "test.event",
    source: "ai-services",
    timestamp: Date.now(),
    payload: {} as T,
    ...overrides,
  }
}

/**
 * Create mock EventBus
 */
export function createMockEventBus() {
  const subscriptions = new Map<string, EventHandler[]>()

  return {
    subscribe: vi.fn((handler: EventHandler, options?: SubscriptionOptions) => {
      const types = options?.filter?.type
        ? Array.isArray(options.filter.type)
          ? options.filter.type
          : [options.filter.type]
        : ["*"]

      types.forEach((type) => {
        const handlers = subscriptions.get(type) || []
        handlers.push(handler)
        subscriptions.set(type, handlers)
      })

      return vi.fn(() => {
        types.forEach((type) => {
          const handlers = subscriptions.get(type) || []
          const index = handlers.indexOf(handler)
          if (index > -1) {
            handlers.splice(index, 1)
          }
        })
      })
    }),

    publish: vi.fn(
      async <T = unknown>(
        type: string,
        source: DomainName,
        payload: T,
        metadata?: Record<string, unknown>,
      ): Promise<PublishResult> => {
        const event: DomainEvent<T> = {
          id: `mock-${Date.now()}`,
          type,
          source,
          timestamp: Date.now(),
          payload,
          metadata,
        }

        const handlers = [...(subscriptions.get(type) || []), ...(subscriptions.get("*") || [])]

        const errors: Error[] = []

        await Promise.all(
          handlers.map(async (handler) => {
            try {
              await handler(event)
            } catch (error) {
              errors.push(error as Error)
            }
          }),
        )

        return {
          eventId: event.id,
          handlerCount: handlers.length,
          errors: errors.length > 0 ? errors : undefined,
        }
      },
    ),

    getHistory: vi.fn(() => []),
    clearHistory: vi.fn(),
    reset: vi.fn(() => {
      subscriptions.clear()
    }),
    getStats: vi.fn(() => ({
      subscriptionCount: 0,
      patternCount: 0,
      historySize: 0,
      subscriptionsByPattern: [],
    })),
  }
}

/**
 * Create mock useDomainEvents hook return value
 */
export function createMockDomainEventsHook(_domain: DomainName = "ai-services") {
  return {
    publish: vi.fn(
      async <T = unknown>(_type: string, _payload: T, _metadata?: Record<string, unknown>): Promise<PublishResult> => {
        return {
          eventId: `mock-${Date.now()}`,
          handlerCount: 0,
        }
      },
    ),

    subscribe: vi.fn(<T = unknown>(_handler: EventHandler<T>, _options?: SubscriptionOptions) => {
      // Mock subscription - does nothing
    }),

    on: vi.fn(
      <T = unknown>(
        _eventType: string | string[],
        _handler: EventHandler<T>,
        _options?: Omit<SubscriptionOptions, "filter">,
      ) => {
        // Mock subscription - does nothing
      },
    ),

    once: vi.fn(<T = unknown>(_eventType: string, _handler: EventHandler<T>) => {
      // Mock subscription - does nothing
    }),
  }
}

/**
 * Mock event payloads for different domains
 */

// AI Services Events
export const mockAIServicePayloads = {
  chatMessageSent: {
    sessionId: "session-123",
    message: {
      id: "msg-1",
      content: "Test message",
      role: "user" as const,
    },
  },

  contentAnalysisCompleted: {
    analysisId: "analysis-123",
    results: {
      scenes: [{ id: 1, timestamp: 0, duration: 5 }],
      objects: [],
      emotions: [],
      transcript: "Test transcript",
    },
    duration: 1000,
  },

  montagePlanGenerated: {
    planId: "plan-123",
    plan: {
      id: "plan-123",
      fragments: [],
      totalDuration: 60,
      estimatedQuality: 0.8,
    },
    mediaFiles: [],
    style: "dynamic",
    duration: 60,
  },
}

// Media Management Events
export const mockMediaManagementPayloads = {
  filesImported: {
    files: [
      {
        id: "file-1",
        path: "/path/to/video.mp4",
        name: "video.mp4",
        type: "video" as const,
        duration: 120,
      },
    ],
    source: "drag-drop" as const,
  },

  metadataExtracted: {
    fileId: "file-1",
    filePath: "/path/to/video.mp4",
    metadata: {
      duration: 120,
      width: 1920,
      height: 1080,
      fps: 30,
      codec: "h264",
      bitrate: 5000,
    },
  },

  importCompleted: {
    importId: "import-123",
    successCount: 5,
    failureCount: 0,
    duration: 3000,
  },
}

// Video Editing Events
export const mockVideoEditingPayloads = {
  clipAdded: {
    clipId: "clip-123",
    trackId: "track-1",
    startTime: 0,
    duration: 10,
    mediaFileId: "file-1",
  },

  timelineUpdated: {
    timelineId: "timeline-1",
    changeType: "clip-added" as const,
    affectedClips: ["clip-123"],
  },
}

// Browser Events
export const mockBrowserPayloads = {
  tabChanged: {
    previousTab: "media",
    currentTab: "effects",
  },

  filesSelected: {
    tab: "media",
    selectedFiles: ["file-1", "file-2"],
    totalSelected: 2,
  },
}

/**
 * Create event simulation helper
 */
export function createEventSimulator() {
  const eventBus = createMockEventBus()

  return {
    eventBus,

    // Simulate AI Services events
    simulateAnalysisCompleted: async (payload = mockAIServicePayloads.contentAnalysisCompleted) => {
      return eventBus.publish("ai-services.content.analysis-completed", "ai-services", payload)
    },

    simulateMontagePlanGenerated: async (payload = mockAIServicePayloads.montagePlanGenerated) => {
      return eventBus.publish("ai-services.montage.plan-generated", "ai-services", payload)
    },

    // Simulate Media Management events
    simulateFilesImported: async (payload = mockMediaManagementPayloads.filesImported) => {
      return eventBus.publish("media.files.imported", "media-management", payload)
    },

    simulateMetadataExtracted: async (payload = mockMediaManagementPayloads.metadataExtracted) => {
      return eventBus.publish("media.metadata.extracted", "media-management", payload)
    },

    // Simulate Video Editing events
    simulateClipAdded: async (payload = mockVideoEditingPayloads.clipAdded) => {
      return eventBus.publish("video-editing.clip.added", "video-editing", payload)
    },

    // Simulate Browser events
    simulateTabChanged: async (payload = mockBrowserPayloads.tabChanged) => {
      return eventBus.publish("media.browser.tab-changed", "browser", payload)
    },
  }
}

/**
 * Wait for event to be published
 */
export async function waitForEvent(
  eventBus: ReturnType<typeof createMockEventBus>,
  eventType: string,
  timeout = 1000,
): Promise<DomainEvent> {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error(`Event ${eventType} not received within ${timeout}ms`))
    }, timeout)

    eventBus.subscribe(
      (event) => {
        if (event.type === eventType) {
          clearTimeout(timeoutId)
          resolve(event)
        }
      },
      {
        filter: { type: eventType },
      },
    )
  })
}

/**
 * Create spy for event handler
 */
export function createEventSpy<T = unknown>() {
  const calls: DomainEvent<T>[] = []

  const handler: EventHandler<T> = (event) => {
    calls.push(event)
  }

  return {
    handler,
    calls,
    calledTimes: () => calls.length,
    calledWith: (index: number) => calls[index],
    lastCall: () => calls[calls.length - 1],
    clear: () => {
      calls.length = 0
    },
  }
}

/**
 * Assert event was published
 */
export function assertEventPublished(eventBus: ReturnType<typeof createMockEventBus>, eventType: string): void {
  const calls = vi.mocked(eventBus.publish).mock.calls
  const found = calls.some((call) => call[0] === eventType)

  if (!found) {
    throw new Error(`Expected event "${eventType}" to be published, but it wasn't`)
  }
}

/**
 * Assert event was not published
 */
export function assertEventNotPublished(eventBus: ReturnType<typeof createMockEventBus>, eventType: string): void {
  const calls = vi.mocked(eventBus.publish).mock.calls
  const found = calls.some((call) => call[0] === eventType)

  if (found) {
    throw new Error(`Expected event "${eventType}" not to be published, but it was`)
  }
}

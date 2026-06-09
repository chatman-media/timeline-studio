import fs from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import {
  type BotEditSession,
  type BotRenderJobArtifact,
  type BotRenderJobMediaInput,
  type BotWorkflowRequest,
  createBotEditSessionFromWorkflow,
  createTelegramLikeBotWorkflow,
  DefaultBotFirstCutGenerator,
} from "@/core"
import type { IBotFeedbackTranscriber, IPublishService } from "@/core/ports"
import approveUpdateFixture from "../../../../docs/08_tasks/planned/fixtures/telegram-ai-review-approve-update.json"
import mediaUploadUpdateFixture from "../../../../docs/08_tasks/planned/fixtures/telegram-ai-review-media-upload-update.json"
import textFeedbackUpdateFixture from "../../../../docs/08_tasks/planned/fixtures/telegram-ai-review-text-feedback-update.json"
import voiceFeedbackUpdateFixture from "../../../../docs/08_tasks/planned/fixtures/telegram-ai-review-voice-feedback-update.json"
import { MockAIProjectEditor } from "../../mock/ai-project-editor"
import { NodeBotEditSessionFileStore } from "../bot-edit-sessions"
import type { NodeBotWorkflowService } from "../bot-workflow"
import {
  createTelegramLikePayloadFromUpdate,
  type NodeTelegramBotReviewPreviewRenderer,
  type NodeTelegramBotReviewPreviewResponder,
  NodeTelegramBotWorker,
  type TelegramBotUpdate,
} from "../telegram-bot-worker"

describe("Telegram AI review workflow smoke", () => {
  let tempDir: string

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "telegram-ai-review-smoke-"))
  })

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true })
  })

  it("creates a persisted first-preview edit session from the media upload fixture", async () => {
    const { session, store } = await createFirstPreviewSession(tempDir)
    const restartedStore = new NodeBotEditSessionFileStore(tempDir)
    const restored = await restartedStore.readCurrentSession({
      source: "telegram",
      chatId: "smoke-chat",
      userId: "smoke-user",
    })

    expect(session).toMatchObject({
      id: "edit:telegram:smoke-chat:smoke-user",
      status: "preview_ready",
      publishTarget: "telegram",
      previewDestination: "telegram",
      revisionCounter: 1,
    })
    expect(session.revisions).toHaveLength(1)
    expect(session.revisions[0]).toMatchObject({
      id: "edit:telegram:smoke-chat:smoke-user:revision:0",
      index: 0,
      artifact: {
        path: "/tmp/telegram-ai-review-smoke-revision-0.mp4",
      },
    })
    expect(await store.readSession(session.id)).toMatchObject({ id: session.id })
    expect(restored).toMatchObject({
      id: session.id,
      currentArtifact: {
        path: "/tmp/telegram-ai-review-smoke-revision-0.mp4",
      },
    })
  })

  it("runs mocked text and voice revisions, survives restart, and publishes after approval", async () => {
    const { session } = await createFirstPreviewSession(tempDir)
    const previewRenderer = createPreviewRenderer()
    const previewResponder = createPreviewResponder()
    const feedbackTranscriber = createFeedbackTranscriber()
    const publishService = createPublishService()

    const firstWorker = createReviewWorker({
      store: new NodeBotEditSessionFileStore(tempDir),
      previewRenderer,
      previewResponder,
      feedbackTranscriber,
      publishService,
    })

    const textResult = await firstWorker.handleUpdate(asTelegramUpdate(textFeedbackUpdateFixture))
    expect(textResult).toMatchObject({
      skipped: true,
      reviewAction: "feedback_applied",
      editRevision: {
        id: "edit:telegram:smoke-chat:smoke-user:revision:1",
        index: 1,
        artifact: {
          path: "/tmp/telegram-ai-review-smoke-revision-1.mp4",
        },
      },
    })

    const restartedStore = new NodeBotEditSessionFileStore(tempDir)
    const secondWorker = createReviewWorker({
      store: restartedStore,
      previewRenderer,
      previewResponder,
      feedbackTranscriber,
      publishService,
    })

    const voiceResult = await secondWorker.handleUpdate(asTelegramUpdate(voiceFeedbackUpdateFixture))
    const approveResult = await secondWorker.handleUpdate(asTelegramUpdate(approveUpdateFixture))
    const finalSession = await restartedStore.readSession(session.id)

    expect(voiceResult).toMatchObject({
      skipped: true,
      reviewAction: "feedback_applied",
      editRevision: {
        id: "edit:telegram:smoke-chat:smoke-user:revision:2",
        index: 2,
        artifact: {
          path: "/tmp/telegram-ai-review-smoke-revision-2.mp4",
        },
      },
    })
    expect(approveResult).toMatchObject({
      skipped: true,
      reviewAction: "published",
      publishResult: {
        destination: "telegram",
        status: "done",
        providerId: "telegram-message-99",
      },
    })
    expect(feedbackTranscriber.transcribeFeedback).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: "voice",
        metadata: {
          sessionId: session.id,
        },
      }),
    )
    expect(previewRenderer.renderPreview).toHaveBeenCalledTimes(2)
    expect(previewResponder.sendVideo).toHaveBeenCalledTimes(2)
    expect(previewResponder.sendVideo).toHaveBeenLastCalledWith(
      expect.objectContaining({
        chatId: "smoke-chat",
        path: "/tmp/telegram-ai-review-smoke-revision-2.mp4",
        caption: expect.stringContaining("edit:telegram:smoke-chat:smoke-user:revision:2"),
      }),
    )
    expect(publishService.publish).toHaveBeenCalledWith(
      expect.objectContaining({
        destination: "telegram",
        artifact: {
          type: "file",
          path: "/tmp/telegram-ai-review-smoke-revision-2.mp4",
          destination: "file",
          mimeType: "video/mp4",
        },
        params: {
          sessionId: session.id,
          revisionId: "edit:telegram:smoke-chat:smoke-user:revision:2",
          approvedMessageId: "13",
        },
      }),
    )
    expect(finalSession).toMatchObject({
      id: session.id,
      status: "done",
      approvedRevisionId: "edit:telegram:smoke-chat:smoke-user:revision:2",
      publishResult: {
        destination: "telegram",
        status: "done",
        providerId: "telegram-message-99",
      },
    })
    expect(finalSession?.revisions).toHaveLength(3)
  })
})

async function createFirstPreviewSession(directory: string): Promise<{
  session: BotEditSession
  store: NodeBotEditSessionFileStore
}> {
  const uploadPayload = createTelegramLikePayloadFromUpdate(asTelegramUpdate(mediaUploadUpdateFixture))
  if (!uploadPayload) throw new Error("Expected media upload fixture to produce a Telegram-like payload")

  const workflow = createTelegramLikeBotWorkflow(uploadPayload)
  const session = createBotEditSessionFromWorkflow(workflow, {
    status: "generating",
    previewDestination: "telegram",
    publishTarget: "telegram",
    now: () => "2026-06-09T04:00:00.000Z",
  })
  const firstCut = await new DefaultBotFirstCutGenerator({
    now: () => "2026-06-09T04:00:01.000Z",
  }).generateFirstCut({
    sessionId: session.id,
    sourceMessageId: workflow.messageId,
    sourceMedia: workflowMediaToSourceMedia(workflow),
    goal: workflow.text,
    targetPlatform: "telegram",
    publishDestination: "telegram",
  })
  if (!firstCut.revision) throw new Error("Expected first-cut generator to create revision 0")

  const artifact = createPreviewArtifact(0)
  const previewReadySession: BotEditSession = {
    ...session,
    status: "preview_ready",
    currentProjectSchema: firstCut.projectSchema,
    currentArtifact: artifact,
    revisionCounter: 1,
    revisions: [
      {
        ...firstCut.revision,
        artifact,
        metadata: {
          ...(firstCut.revision.metadata ?? {}),
          previewDelivery: {
            status: "sent",
            messageId: "preview-message-0",
            artifactPath: artifact.path,
          },
        },
      },
    ],
    updatedAt: "2026-06-09T04:00:02.000Z",
  }

  const store = new NodeBotEditSessionFileStore(directory)
  await store.writeSession(previewReadySession)
  return { session: previewReadySession, store }
}

function createReviewWorker(options: {
  store: NodeBotEditSessionFileStore
  previewRenderer: NodeTelegramBotReviewPreviewRenderer
  previewResponder: NodeTelegramBotReviewPreviewResponder
  feedbackTranscriber: IBotFeedbackTranscriber
  publishService: IPublishService
}): NodeTelegramBotWorker {
  return new NodeTelegramBotWorker({
    workflow: createUnusedWorkflowService(),
    editSessionStore: options.store,
    aiProjectEditor: new MockAIProjectEditor(),
    feedbackTranscriber: options.feedbackTranscriber,
    previewRenderer: options.previewRenderer,
    previewResponder: options.previewResponder,
    publishService: options.publishService,
    now: () => "2026-06-09T04:00:03.000Z",
  })
}

function createUnusedWorkflowService(): NodeBotWorkflowService {
  return {
    runWorkflow: vi.fn(),
    runTelegramLikePayload: vi.fn(),
    cancelRenderJob: vi.fn(),
  } as unknown as NodeBotWorkflowService
}

function createPreviewRenderer(): NodeTelegramBotReviewPreviewRenderer {
  return {
    renderPreview: vi.fn(async ({ revision }) => createPreviewArtifact(revision.index)),
  }
}

function createPreviewResponder(): NodeTelegramBotReviewPreviewResponder {
  let nextMessageId = 1
  return {
    sendMessage: vi.fn(async () => ({ messageId: "fallback-message" })),
    sendVideo: vi.fn(async () => ({ messageId: `preview-message-${nextMessageId++}` })),
  }
}

function createFeedbackTranscriber(): IBotFeedbackTranscriber {
  return {
    transcribeFeedback: vi.fn(async (request) => ({
      text: "Make the ending punchier from the voice note",
      language: "en",
      provider: "local" as const,
      kind: request.kind,
      media: request.media,
      segments: [],
      processingTime: 12,
    })),
  }
}

function createPublishService(): IPublishService {
  return {
    canPublish: (destination) => destination === "telegram",
    publish: vi.fn(async (request) => ({
      destination: request.destination,
      status: "done" as const,
      artifact: request.artifact,
      providerId: "telegram-message-99",
      url: "https://t.me/timeline_smoke/99",
      metadata: request.metadata,
    })),
  }
}

function workflowMediaToSourceMedia(workflow: BotWorkflowRequest): BotRenderJobMediaInput[] {
  return (workflow.media ?? []).map((item) => ({
    type: item.type,
    value: item.value,
    ...(item.name ? { name: item.name } : {}),
    ...(item.mimeType ? { mimeType: item.mimeType } : {}),
    ...(item.metadata ? { metadata: item.metadata } : {}),
  }))
}

function createPreviewArtifact(index: number): BotRenderJobArtifact {
  return {
    type: "file",
    path: `/tmp/telegram-ai-review-smoke-revision-${index}.mp4`,
    destination: "file",
    mimeType: "video/mp4",
  }
}

function asTelegramUpdate(update: unknown): TelegramBotUpdate {
  return update as TelegramBotUpdate
}

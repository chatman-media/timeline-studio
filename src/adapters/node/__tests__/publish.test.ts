import fs from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { NodePublishService } from "../publish"

describe("NodePublishService", () => {
  let tempDir: string
  let artifactPath: string

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "node-publish-service-"))
    artifactPath = path.join(tempDir, "video.mp4")
    await fs.writeFile(artifactPath, "video")
  })

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true })
  })

  it("publishes file artifacts as local results", async () => {
    const service = new NodePublishService()

    await expect(
      service.publish({
        destination: "file",
        artifact: {
          type: "file",
          path: artifactPath,
          destination: "file",
          mimeType: "video/mp4",
        },
      }),
    ).resolves.toEqual({
      destination: "file",
      status: "done",
      artifact: {
        type: "file",
        path: artifactPath,
        destination: "file",
        mimeType: "video/mp4",
      },
      metadata: undefined,
    })
  })

  it("publishes telegram artifacts through an injected client", async () => {
    const client = {
      sendVideo: vi.fn().mockResolvedValue({
        messageId: "message-1",
        url: "https://t.me/channel/1",
      }),
    }
    const service = new NodePublishService({ telegram: { client } })

    await expect(
      service.publish({
        destination: "telegram",
        artifact: {
          type: "file",
          path: artifactPath,
          destination: "file",
          mimeType: "video/mp4",
        },
        metadata: {
          chatId: "chat-1",
          caption: "Done",
        },
      }),
    ).resolves.toEqual({
      destination: "telegram",
      status: "done",
      artifact: {
        type: "url",
        url: "https://t.me/channel/1",
        destination: "telegram",
        mimeType: "video/mp4",
      },
      providerId: "message-1",
      url: "https://t.me/channel/1",
      metadata: {
        chatId: "chat-1",
        caption: "Done",
      },
    })

    expect(client.sendVideo).toHaveBeenCalledWith({
      path: artifactPath,
      chatId: "chat-1",
      caption: "Done",
      mimeType: "video/mp4",
      metadata: {
        chatId: "chat-1",
        caption: "Done",
      },
    })
  })

  it("returns failed results for incomplete telegram configuration", async () => {
    const service = new NodePublishService()

    await expect(
      service.publish({
        destination: "telegram",
        artifact: {
          type: "file",
          path: artifactPath,
          destination: "file",
          mimeType: "video/mp4",
        },
      }),
    ).resolves.toMatchObject({
      destination: "telegram",
      status: "failed",
      error: "Telegram publisher is not configured",
    })
  })

  it("returns unsupported for destinations without node publishers yet", async () => {
    const service = new NodePublishService()

    await expect(
      service.publish({
        destination: "youtube",
        artifact: {
          type: "file",
          path: artifactPath,
          destination: "file",
        },
      }),
    ).resolves.toMatchObject({
      destination: "youtube",
      status: "unsupported",
      error: "Publishing to youtube is not implemented yet",
    })
  })
})

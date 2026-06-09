import { describe, expect, it, vi } from "vitest"

import { NodeRustPublishService } from "../rust-publish"

describe("NodeRustPublishService", () => {
  it("publishes Telegram artifacts through timeline publish telegram JSON output", async () => {
    const runCommand = vi.fn(async () => ({
      stdout: JSON.stringify({
        platform: "telegram",
        message_id: 42,
        url: "https://t.me/channel/42",
        file_size: 1024,
        elapsed_secs: 1.25,
      }),
      stderr: "",
    }))
    const service = new NodeRustPublishService({
      command: "timeline",
      telegram: {
        botToken: "telegram-secret",
      },
      runCommand,
    })

    const result = await service.publish({
      destination: "telegram",
      artifact: {
        type: "file",
        path: "/tmp/revision.mp4",
        destination: "file",
        mimeType: "video/mp4",
      },
      metadata: {
        chatId: "chat-1",
        caption: "caption",
      },
    })

    expect(runCommand).toHaveBeenCalledWith(
      "timeline",
      [
        "publish",
        "telegram",
        "--input",
        "/tmp/revision.mp4",
        "--token",
        "telegram-secret",
        "--chat",
        "chat-1",
        "--json",
        "--caption",
        "caption",
      ],
      expect.any(Object),
    )
    expect(result).toMatchObject({
      destination: "telegram",
      status: "done",
      providerId: "42",
      url: "https://t.me/channel/42",
      artifact: {
        type: "url",
        url: "https://t.me/channel/42",
        destination: "telegram",
      },
      metadata: {
        provider: {
          platform: "telegram",
          message_id: 42,
          args: expect.arrayContaining(["[redacted]"]),
        },
      },
    })
    expect(result.metadata?.provider?.args).not.toContain("telegram-secret")
  })

  it("publishes YouTube artifacts through timeline publish youtube JSON output", async () => {
    const runCommand = vi.fn(async () => ({
      stdout: JSON.stringify({
        video_id: "youtube-video-1",
        url: "https://youtu.be/youtube-video-1",
        status: "uploaded",
        file_size: 2048,
        elapsed_secs: 2.5,
      }),
      stderr: "",
    }))
    const service = new NodeRustPublishService({
      command: "timeline",
      youtube: {
        accessToken: "youtube-secret",
      },
      runCommand,
    })

    const result = await service.publish({
      destination: "youtube",
      artifact: {
        type: "file",
        path: "/tmp/revision.mp4",
        destination: "file",
        mimeType: "video/mp4",
      },
      metadata: {
        title: "Launch",
        description: "Description",
        tags: ["timeline", "ai"],
        visibility: "unlisted",
      },
    })

    expect(runCommand).toHaveBeenCalledWith(
      "timeline",
      [
        "publish",
        "youtube",
        "--input",
        "/tmp/revision.mp4",
        "--token",
        "youtube-secret",
        "--title",
        "Launch",
        "--json",
        "--description",
        "Description",
        "--tags",
        "timeline,ai",
        "--privacy",
        "unlisted",
      ],
      expect.any(Object),
    )
    expect(result).toMatchObject({
      destination: "youtube",
      status: "done",
      providerId: "youtube-video-1",
      url: "https://youtu.be/youtube-video-1",
      artifact: {
        type: "url",
        destination: "youtube",
      },
    })
    expect(result.metadata?.provider?.args).not.toContain("youtube-secret")
  })

  it("supports Telegram validate-only through Rust publish", async () => {
    const runCommand = vi.fn(async () => ({
      stdout: JSON.stringify({
        platform: "telegram",
        status: "validated",
        bot: "@timeline_bot",
      }),
      stderr: "",
    }))
    const service = new NodeRustPublishService({
      command: "timeline",
      telegram: {
        botToken: "telegram-secret",
        defaultChatId: "chat-1",
      },
      runCommand,
    })

    const result = await service.publish({
      destination: "telegram",
      artifact: {
        type: "file",
        destination: "file",
      },
      params: {
        validateOnly: true,
      },
    })

    expect(runCommand).toHaveBeenCalledWith(
      "timeline",
      ["publish", "telegram", "--token", "telegram-secret", "--chat", "chat-1", "--json", "--validate-only"],
      expect.any(Object),
    )
    expect(result).toMatchObject({
      destination: "telegram",
      status: "done",
      metadata: {
        provider: {
          platform: "telegram",
          status: "validated",
          bot: "@timeline_bot",
        },
      },
    })
  })

  it("returns unsupported for destinations without Rust publish support", async () => {
    const service = new NodeRustPublishService()

    await expect(
      service.publish({
        destination: "vimeo",
        artifact: {
          type: "file",
          path: "/tmp/revision.mp4",
          destination: "file",
        },
      }),
    ).resolves.toMatchObject({
      destination: "vimeo",
      status: "unsupported",
    })
  })
})

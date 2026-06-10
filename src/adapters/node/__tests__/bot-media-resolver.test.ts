import fs from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { type FetchLike, NodeBotMediaResolver } from "../bot-media-resolver"

describe("NodeBotMediaResolver", () => {
  let tempDir: string

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "bot-media-resolver-"))
  })

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true })
  })

  it("downloads remote URL media when enabled", async () => {
    const fetchMock = vi.fn(async (_url: string) => responseWithBytes("video-data"))
    const resolver = new NodeBotMediaResolver({
      downloadDir: tempDir,
      downloadRemoteUrls: true,
      fetch: fetchMock as FetchLike,
      idFactory: () => "download-1",
    })

    const resolved = await resolver.resolve(
      {
        type: "url",
        value: "https://cdn.example.com/input.mp4",
        name: "input.mp4",
      },
      {
        workflow: { source: "telegram" },
        request: { source: "bot", output: { format: "mp4" } },
        index: 0,
      },
    )

    expect(resolved).toMatchObject({
      type: "file",
      value: path.join(tempDir, "download-1-input.mp4"),
      metadata: {
        resolvedFrom: "https://cdn.example.com/input.mp4",
        resolvedUrl: "https://cdn.example.com/input.mp4",
        resolvedPath: path.join(tempDir, "download-1-input.mp4"),
      },
    })
    await expect(fs.readFile(resolved.value, "utf-8")).resolves.toBe("video-data")
    expect(fetchMock).toHaveBeenCalledWith("https://cdn.example.com/input.mp4")
  })

  it("downloads allowed remote URL media when host policy is configured", async () => {
    const fetchMock = vi.fn(async (_url: string) => responseWithBytes("video-data"))
    const resolver = new NodeBotMediaResolver({
      downloadDir: tempDir,
      downloadRemoteUrls: true,
      remoteUrlAllowedHosts: ["cdn.example.com", "*.trusted.example"],
      fetch: fetchMock as FetchLike,
      idFactory: () => "download-allowed",
    })

    const resolved = await resolver.resolve(
      {
        type: "url",
        value: "https://cdn.example.com/input.mp4",
        name: "input.mp4",
      },
      {
        workflow: { source: "telegram" },
        request: { source: "bot", output: { format: "mp4" } },
        index: 0,
      },
    )

    expect(resolved.value).toBe(path.join(tempDir, "download-allowed-input.mp4"))
    expect(fetchMock).toHaveBeenCalledWith("https://cdn.example.com/input.mp4")
  })

  it("rejects blocked remote URL media before fetching", async () => {
    const fetchMock = vi.fn()
    const resolver = new NodeBotMediaResolver({
      downloadDir: tempDir,
      downloadRemoteUrls: true,
      remoteUrlAllowedHosts: ["cdn.example.com"],
      remoteUrlBlockedHosts: ["blocked.example.com"],
      fetch: fetchMock,
    })

    await expect(
      resolver.resolve(
        {
          type: "url",
          value: "https://blocked.example.com/input.mp4",
          name: "input.mp4",
        },
        {
          workflow: { source: "telegram" },
          request: { source: "bot", output: { format: "mp4" } },
          index: 0,
        },
      ),
    ).rejects.toThrow("Remote media host is blocked: blocked.example.com")
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it("rejects oversized Telegram media from metadata before getFile", async () => {
    const fetchMock = vi.fn()
    const telegramClient = {
      getFile: vi.fn(),
    }
    const resolver = new NodeBotMediaResolver({
      downloadDir: tempDir,
      telegram: {
        botToken: "token-1",
        client: telegramClient,
      },
      maxDownloadBytes: 10,
      fetch: fetchMock,
    })

    await expect(
      resolver.resolve(
        {
          type: "file",
          value: "telegram-file-id",
          name: "clip.mp4",
          metadata: {
            telegramFileId: "telegram-file-id",
            telegramFileSize: 11,
          },
        },
        {
          workflow: { source: "telegram" },
          request: { source: "bot", output: { format: "mp4" } },
          index: 0,
        },
      ),
    ).rejects.toThrow("Bot media is too large: 11 bytes exceeds configured limit 10 bytes")
    expect(telegramClient.getFile).not.toHaveBeenCalled()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it("rejects oversized remote media from Content-Length before buffering", async () => {
    const arrayBuffer = vi.fn(async () => Buffer.from("01234567890").buffer as ArrayBuffer)
    const fetchMock = vi.fn(async (_url: string) => ({
      ok: true,
      status: 200,
      headers: {
        get: (name: string) => (name.toLowerCase() === "content-length" ? "11" : null),
      },
      arrayBuffer,
    }))
    const resolver = new NodeBotMediaResolver({
      downloadDir: tempDir,
      downloadRemoteUrls: true,
      maxDownloadBytes: 10,
      fetch: fetchMock as FetchLike,
    })

    await expect(
      resolver.resolve(
        {
          type: "url",
          value: "https://cdn.example.com/input.mp4",
          name: "input.mp4",
        },
        {
          workflow: { source: "telegram" },
          request: { source: "bot", output: { format: "mp4" } },
          index: 0,
        },
      ),
    ).rejects.toThrow("Bot media is too large: 11 bytes exceeds configured limit 10 bytes")
    expect(fetchMock).toHaveBeenCalledWith("https://cdn.example.com/input.mp4")
    expect(arrayBuffer).not.toHaveBeenCalled()
  })

  it("resolves Telegram file ids through getFile and downloads the file path", async () => {
    const fetchMock = vi.fn(async (_url: string) => responseWithBytes("telegram-video"))
    const telegramClient = {
      getFile: vi.fn(async () => ({ file_path: "videos/file_1.mp4" })),
    }
    const resolver = new NodeBotMediaResolver({
      downloadDir: tempDir,
      telegram: {
        botToken: "token-1",
        client: telegramClient,
      },
      fetch: fetchMock as FetchLike,
      idFactory: () => "download-2",
    })

    const resolved = await resolver.resolve(
      {
        type: "file",
        value: "telegram-file-id",
        name: "clip.mp4",
        metadata: {
          telegramFileId: "telegram-file-id",
        },
      },
      {
        workflow: { source: "telegram" },
        request: { source: "bot", output: { format: "mp4" } },
        index: 0,
      },
    )

    expect(telegramClient.getFile).toHaveBeenCalledWith("telegram-file-id")
    expect(fetchMock).toHaveBeenCalledWith("https://api.telegram.org/file/bottoken-1/videos/file_1.mp4")
    expect(resolved).toMatchObject({
      type: "file",
      value: path.join(tempDir, "download-2-clip.mp4"),
      metadata: {
        telegramFileId: "telegram-file-id",
        resolvedFrom: "telegram-file-id",
        telegramFilePath: "videos/file_1.mp4",
      },
    })
    await expect(fs.readFile(resolved.value, "utf-8")).resolves.toBe("telegram-video")
  })

  it("leaves media unchanged without enabled download or Telegram config", async () => {
    const resolver = new NodeBotMediaResolver({
      downloadDir: tempDir,
      fetch: vi.fn(),
    })
    const media = {
      type: "url" as const,
      value: "https://cdn.example.com/input.mp4",
    }

    await expect(
      resolver.resolve(media, {
        workflow: { source: "telegram" },
        request: { source: "bot", output: { format: "mp4" } },
        index: 0,
      }),
    ).resolves.toBe(media)
  })
})

function responseWithBytes(text: string, headers?: Record<string, string>) {
  const buffer = Buffer.from(text)

  return {
    ok: true,
    status: 200,
    ...(headers
      ? {
          headers: {
            get: (name: string) => headers[name.toLowerCase()] ?? null,
          },
        }
      : {}),
    async arrayBuffer() {
      return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer
    },
  }
}

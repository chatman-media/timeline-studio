import { describe, expect, it, vi } from "vitest"
import type { BotMediaResolver, BotRenderJobRequest, BotWorkflowRequest } from "../../types"
import { createNoopBotMediaResolver, resolveBotRenderJobMedia } from "../bot-media-resolver"

describe("bot media resolver", () => {
  const workflow: BotWorkflowRequest = { source: "telegram" }
  const request: BotRenderJobRequest = {
    source: "bot",
    media: [
      {
        type: "file",
        value: "telegram-file-id",
        name: "clip.mp4",
      },
    ],
    output: { format: "mp4" },
  }

  it("resolves each render job media item with context", async () => {
    const resolver: BotMediaResolver = {
      resolve: vi.fn(async (media, context) => ({
        ...media,
        value: `/tmp/${context.index}-${media.name}`,
      })),
    }

    const resolved = await resolveBotRenderJobMedia(request, resolver, { workflow })

    expect(resolved).toEqual({
      ...request,
      media: [
        {
          type: "file",
          value: "/tmp/0-clip.mp4",
          name: "clip.mp4",
        },
      ],
    })
    expect(resolver.resolve).toHaveBeenCalledWith(request.media?.[0], {
      workflow,
      request,
      index: 0,
    })
  })

  it("returns the original request without resolver or media", async () => {
    await expect(resolveBotRenderJobMedia(request, undefined, { workflow })).resolves.toBe(request)
    await expect(
      resolveBotRenderJobMedia({ source: "bot", output: { format: "mp4" } }, createNoopBotMediaResolver(), {
        workflow,
      }),
    ).resolves.toEqual({ source: "bot", output: { format: "mp4" } })
  })
})

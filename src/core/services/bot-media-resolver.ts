import type { BotMediaResolveContext, BotMediaResolver, BotRenderJobRequest } from "../types"

export async function resolveBotRenderJobMedia(
  request: BotRenderJobRequest,
  resolver: BotMediaResolver | undefined,
  context: Omit<BotMediaResolveContext, "request" | "index">,
): Promise<BotRenderJobRequest> {
  if (!resolver || !request.media?.length) return request

  const media = await Promise.all(
    request.media.map((item, index) =>
      resolver.resolve(item, {
        ...context,
        request,
        index,
      }),
    ),
  )

  return {
    ...request,
    media,
  }
}

export function createNoopBotMediaResolver(): BotMediaResolver {
  return {
    async resolve(media) {
      return media
    },
  }
}

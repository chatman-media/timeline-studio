import type { BotPublishRequest, BotPublishResult, BotRenderJobDestination } from "../types"

export interface IPublishService {
  canPublish(destination: BotRenderJobDestination): boolean
  publish(request: BotPublishRequest): Promise<BotPublishResult>
}

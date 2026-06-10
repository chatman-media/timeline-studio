import type { IPublishService } from "../ports"
import type {
  BotDestinationCapability,
  BotDestinationCapabilityRegistry,
  BotRenderJobDestination,
  BotWorkflowValidationError,
} from "../types"

export interface BotDestinationCapabilityRegistryOptions {
  publisher?: Pick<IPublishService, "canPublish">
  supportedDestinations?: readonly BotRenderJobDestination[]
}

const ALL_DESTINATIONS = [
  "file",
  "telegram",
  "youtube",
  "tiktok",
  "vimeo",
] as const satisfies readonly BotRenderJobDestination[]
const DEFAULT_SUPPORTED_DESTINATIONS = [
  "file",
  "telegram",
  "youtube",
] as const satisfies readonly BotRenderJobDestination[]

export function createBotDestinationCapabilityRegistry(
  options: BotDestinationCapabilityRegistryOptions = {},
): BotDestinationCapabilityRegistry {
  const supported = new Set(options.supportedDestinations ?? DEFAULT_SUPPORTED_DESTINATIONS)
  const registry = {} as BotDestinationCapabilityRegistry

  for (const destination of ALL_DESTINATIONS) {
    const isSupported = supported.has(destination)
    const configured =
      destination === "file" ? true : Boolean(isSupported && options.publisher?.canPublish(destination))
    registry[destination] = createDestinationCapability(destination, isSupported, configured)
  }

  return registry
}

export function validateBotDestinationCapability(
  destination: BotRenderJobDestination | undefined,
  registry: BotDestinationCapabilityRegistry | undefined,
): BotWorkflowValidationError | undefined {
  if (!destination || !registry || destination === "file") return undefined

  const capability = registry[destination]
  if (!capability || capability.status === "available") return undefined

  return {
    code: "unsupported_destination",
    field: "output.destination",
    message: `Destination ${destination} is ${capability.status}`,
    userMessage: capability.userMessage,
  }
}

export function formatAvailableBotDestinations(registry: BotDestinationCapabilityRegistry): string {
  return ALL_DESTINATIONS.filter((destination) => registry[destination].status === "available").join(", ")
}

function createDestinationCapability(
  destination: BotRenderJobDestination,
  supported: boolean,
  configured: boolean,
): BotDestinationCapability {
  if (!supported) {
    return {
      destination,
      status: "unsupported",
      supported: false,
      configured: false,
      userMessage: `Publishing to ${destination} is not supported by this bot worker.`,
    }
  }

  if (!configured) {
    return {
      destination,
      status: "missing_auth",
      supported: true,
      configured: false,
      userMessage: `Publishing to ${destination} is not configured. Add the required credentials or choose another destination.`,
    }
  }

  return {
    destination,
    status: "available",
    supported: true,
    configured: true,
    userMessage: `Publishing to ${destination} is available.`,
  }
}

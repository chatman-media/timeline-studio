import { describe, expect, it, vi } from "vitest"

import {
  createBotDestinationCapabilityRegistry,
  formatAvailableBotDestinations,
  validateBotDestinationCapability,
} from "../bot-destination-capabilities"
import { createBotRenderJobRequest } from "../bot-workflow-intake"

describe("bot destination capabilities", () => {
  it("marks supported destinations available when the publisher can publish them", () => {
    const registry = createBotDestinationCapabilityRegistry({
      publisher: {
        canPublish: vi.fn((destination) => destination === "telegram"),
      },
    })

    expect(registry.file).toMatchObject({ status: "available", configured: true })
    expect(registry.telegram).toMatchObject({ status: "available", configured: true })
    expect(registry.youtube).toMatchObject({ status: "missing_auth", configured: false })
    expect(registry.tiktok).toMatchObject({ status: "unsupported", supported: false })
    expect(formatAvailableBotDestinations(registry)).toBe("file, telegram")
  })

  it("returns actionable validation errors for missing auth and unsupported destinations", () => {
    const registry = createBotDestinationCapabilityRegistry({
      publisher: {
        canPublish: vi.fn(() => false),
      },
    })

    expect(validateBotDestinationCapability("youtube", registry)).toMatchObject({
      code: "unsupported_destination",
      field: "output.destination",
      userMessage:
        "Publishing to youtube is not configured. Add the required credentials or choose another destination.",
    })
    expect(validateBotDestinationCapability("vimeo", registry)).toMatchObject({
      code: "unsupported_destination",
      userMessage: "Publishing to vimeo is not supported by this bot worker.",
    })
  })

  it("blocks unavailable destinations during bot workflow intake", () => {
    const registry = createBotDestinationCapabilityRegistry({
      publisher: {
        canPublish: vi.fn((destination) => destination === "telegram"),
      },
    })

    const result = createBotRenderJobRequest(
      {
        source: "telegram",
        text: "template=promo destination=youtube",
      },
      {
        destinationCapabilities: registry,
      },
    )

    expect(result).toMatchObject({
      ok: false,
      errors: [
        {
          code: "unsupported_destination",
          field: "output.destination",
          userMessage:
            "Publishing to youtube is not configured. Add the required credentials or choose another destination.",
        },
      ],
    })
  })
})

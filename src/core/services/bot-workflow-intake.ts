import type {
  BotMediaAttachment,
  BotWorkflowIntakeOptions,
  BotWorkflowIntakeResult,
  BotWorkflowOutput,
  BotWorkflowRequest,
  BotWorkflowValidationError,
  TelegramLikeBotFile,
  TelegramLikeBotPayload,
} from "../types"
import type { BotRenderJobDestination, BotRenderJobMediaInput, BotRenderJobRequest } from "../types/render-job"

const DESTINATIONS = new Set(["file", "telegram", "youtube", "tiktok", "vimeo"])
const RESOLUTIONS = new Set(["720p", "1080p", "4k"])
const DESTINATION_ALIASES: Record<string, BotRenderJobDestination> = {
  file: "file",
  telegram: "telegram",
  tg: "telegram",
  vimeo: "vimeo",
  youtube: "youtube",
  yt: "youtube",
  tiktok: "tiktok",
  tt: "tiktok",
}
const RESOLUTION_ALIASES: Record<string, BotWorkflowOutput["resolution"]> = {
  "720": "720p",
  "720p": "720p",
  "1080": "1080p",
  "1080p": "1080p",
  "4k": "4k",
}

export interface ParsedBotWorkflowText {
  templateId?: string
  projectPath?: string
  media: BotMediaAttachment[]
  output: BotWorkflowOutput
  params: Record<string, string>
}

export function createBotRenderJobRequest(
  workflow: BotWorkflowRequest,
  options: BotWorkflowIntakeOptions = {},
): BotWorkflowIntakeResult {
  const textHints = parseBotWorkflowText(workflow.text)
  const errors: BotWorkflowValidationError[] = []
  const warnings: BotWorkflowValidationError[] = []
  const templateId = firstNonEmpty(workflow.template?.id, textHints.templateId, options.defaultTemplateId)
  const project = workflow.project ?? workflow.template?.project ?? projectFromText(textHints.projectPath)
  const media = normalizeMedia([...(workflow.media ?? []), ...textHints.media], errors)
  const params = mergeParams(
    createWorkflowDefaultParams(workflow),
    textHints.params,
    workflow.template?.params,
    workflow.params,
  )
  const output = normalizeOutput(workflow, textHints.output, options, errors)

  if (workflow.template && !workflow.template.id.trim()) {
    errors.push(
      validationError(
        "invalid_template",
        "template.id",
        "Template id cannot be empty",
        "Choose a template before starting the render.",
      ),
    )
  }

  if (!templateId && !project && media.length === 0) {
    errors.push(
      validationError(
        "missing_input",
        "workflow",
        "Workflow requires a template, project, or media attachment",
        "Send a video file, link, project, or choose a template.",
      ),
    )
  }

  if (errors.length > 0) {
    return { ok: false, errors }
  }

  const renderJob: BotRenderJobRequest = {
    source: "bot",
    ...(templateId ? { templateId } : {}),
    ...(project ? { project } : {}),
    ...(media.length > 0 ? { media } : {}),
    ...(Object.keys(params).length > 0 ? { params } : {}),
    output,
  }

  return { ok: true, renderJob, warnings }
}

export function createBotWorkflowRequestFromTelegramLikePayload(payload: TelegramLikeBotPayload): BotWorkflowRequest {
  const media: BotMediaAttachment[] = [...(payload.attachments ?? [])]
  const appendFile = (file: TelegramLikeBotFile | undefined, fallbackName: string) => {
    const attachment = telegramFileToAttachment(file, fallbackName)
    if (attachment) media.push(attachment)
  }

  appendFile(payload.document, "document")
  appendFile(payload.video, "video")
  appendFile(payload.audio, "audio")
  appendFile(payload.animation, "animation")

  if (Array.isArray(payload.photo)) {
    appendFile(payload.photo.at(-1), "photo")
  } else {
    appendFile(payload.photo, "photo")
  }

  for (const file of payload.media ?? []) {
    appendFile(file, "media")
  }

  return {
    source: "telegram",
    chatId: stringifyId(payload.chat?.id),
    userId: stringifyId(payload.from?.id),
    messageId: stringifyId(payload.message_id),
    text: payload.text ?? payload.caption,
    media,
    raw: payload,
  }
}

export function parseBotWorkflowText(text = ""): ParsedBotWorkflowText {
  const parsed: ParsedBotWorkflowText = {
    media: [],
    output: {},
    params: {},
  }

  for (const token of tokenizeText(text)) {
    const valueToken = trimCommandValue(token)
    if (valueToken.startsWith("/")) continue

    const separatorIndex = findKeyValueSeparator(valueToken)
    if (separatorIndex <= 0) {
      applyShorthandTextHint(parsed, valueToken)
      continue
    }

    const key = normalizeKey(valueToken.slice(0, separatorIndex))
    const value = trimCommandValue(valueToken.slice(separatorIndex + 1))
    if (!value) continue

    switch (key) {
      case "media":
      case "url":
      case "input":
      case "source":
        parsed.media.push(textUrlToAttachment(value, "text-url"))
        break
      case "template":
      case "templateid":
        parsed.templateId = value
        break
      case "project":
      case "projectpath":
        parsed.projectPath = value
        break
      case "destination":
      case "dest":
        parsed.output.destination = value as BotRenderJobDestination
        break
      case "format":
        parsed.output.format = value as BotWorkflowOutput["format"]
        break
      case "output":
      case "outputpath":
        parsed.output.path = value
        break
      case "resolution":
        parsed.output.resolution = value as BotWorkflowOutput["resolution"]
        break
      default:
        parsed.params[key] = value
    }
  }

  return parsed
}

function normalizeMedia(
  attachments: BotMediaAttachment[],
  errors: BotWorkflowValidationError[],
): BotRenderJobMediaInput[] {
  return attachments
    .map((attachment, index) => {
      const value = attachment.value.trim()
      if (!value) {
        errors.push(
          validationError(
            "invalid_media",
            `media.${index}.value`,
            "Media attachment value cannot be empty",
            "One of the attached files is empty or unavailable. Send it again.",
          ),
        )
      }

      if (attachment.type !== "file" && attachment.type !== "url") {
        errors.push(
          validationError(
            "invalid_media",
            `media.${index}.type`,
            `Unsupported media attachment type: ${attachment.type}`,
            "One of the attached files has an unsupported type.",
          ),
        )
      }

      return {
        type: attachment.type,
        value,
        ...(attachment.name ? { name: attachment.name } : {}),
        ...(attachment.mimeType ? { mimeType: attachment.mimeType } : {}),
        ...(attachment.metadata ? { metadata: attachment.metadata } : {}),
      }
    })
    .filter((attachment) => attachment.value.length > 0)
}

function normalizeOutput(
  workflow: BotWorkflowRequest,
  textOutput: BotWorkflowOutput,
  options: BotWorkflowIntakeOptions,
  errors: BotWorkflowValidationError[],
): BotRenderJobRequest["output"] {
  const output: BotWorkflowOutput = {
    format: workflow.output?.format ?? textOutput.format ?? "mp4",
    path: workflow.output?.path ?? textOutput.path ?? options.defaultOutputPath,
    resolution: workflow.output?.resolution ?? textOutput.resolution ?? options.defaultResolution,
    destination:
      workflow.output?.destination ??
      textOutput.destination ??
      options.defaultDestination ??
      defaultDestination(workflow),
  }

  if (output.format !== "mp4") {
    errors.push(
      validationError(
        "invalid_output",
        "output.format",
        `Unsupported render output format: ${String(output.format)}`,
        "Only MP4 export is available right now.",
      ),
    )
  }

  if (output.destination && !DESTINATIONS.has(output.destination)) {
    errors.push(
      validationError(
        "unsupported_destination",
        "output.destination",
        `Unsupported render destination: ${String(output.destination)}`,
        "This publishing destination is not available yet.",
      ),
    )
  }

  if (output.resolution && !RESOLUTIONS.has(output.resolution)) {
    errors.push(
      validationError(
        "unsupported_resolution",
        "output.resolution",
        `Unsupported render resolution: ${String(output.resolution)}`,
        "Choose 720p, 1080p, or 4k.",
      ),
    )
  }

  return {
    format: "mp4",
    ...(output.path ? { path: output.path } : {}),
    ...(output.resolution ? { resolution: output.resolution } : {}),
    ...(output.destination ? { destination: output.destination } : {}),
  }
}

function telegramFileToAttachment(
  file: TelegramLikeBotFile | undefined,
  fallbackName: string,
): BotMediaAttachment | null {
  if (!file) return null

  const value = firstNonEmpty(file.url, file.file_path, file.file_id) ?? ""
  const metadata: Record<string, unknown> = {}

  if (file.file_id) metadata.telegramFileId = file.file_id
  if (file.file_unique_id) metadata.telegramFileUniqueId = file.file_unique_id

  return {
    id: file.file_unique_id ?? file.file_id,
    type: isUrl(value) ? "url" : "file",
    value,
    name: file.file_name ?? fallbackName,
    mimeType: file.mime_type,
    caption: file.caption,
    ...(Object.keys(metadata).length > 0 ? { metadata } : {}),
  }
}

function projectFromText(projectPath?: string): BotRenderJobRequest["project"] {
  return projectPath ? { type: "file", path: projectPath } : undefined
}

function mergeParams(...records: Array<Record<string, unknown> | undefined>): Record<string, unknown> {
  return Object.assign({}, ...records.filter(Boolean))
}

function createWorkflowDefaultParams(workflow: BotWorkflowRequest): Record<string, unknown> | undefined {
  if (!workflow.chatId && !workflow.messageId) return undefined

  return {
    ...(workflow.chatId ? { telegramChatId: workflow.chatId } : {}),
    ...(workflow.messageId ? { telegramReplyToMessageId: workflow.messageId } : {}),
  }
}

function validationError(
  code: BotWorkflowValidationError["code"],
  field: string,
  message: string,
  userMessage: string,
): BotWorkflowValidationError {
  return { code, field, message, userMessage }
}

function defaultDestination(workflow: BotWorkflowRequest): BotRenderJobDestination {
  return workflow.source === "telegram" ? "telegram" : "file"
}

function stringifyId(value: string | number | undefined): string | undefined {
  return value === undefined ? undefined : String(value)
}

function firstNonEmpty(...values: Array<string | undefined>): string | undefined {
  return values.find((value) => value !== undefined && value.trim().length > 0)?.trim()
}

function tokenizeText(text: string): string[] {
  return text.match(/(?:[^\s"']+|"[^"]*"|'[^']*')+/g) ?? []
}

function findKeyValueSeparator(token: string): number {
  if (isUrl(token)) return -1

  const equalsIndex = token.indexOf("=")
  const colonIndex = token.indexOf(":")
  if (equalsIndex === -1) return colonIndex
  if (colonIndex === -1) return equalsIndex
  return Math.min(equalsIndex, colonIndex)
}

function normalizeKey(key: string): string {
  return key.trim().toLowerCase().replace(/[_-]/g, "")
}

function trimCommandValue(value: string): string {
  const trimmed = value.trim()
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"') && trimmed.length >= 2) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'") && trimmed.length >= 2)
  ) {
    return trimmed.slice(1, -1).trim()
  }
  return trimmed
}

function applyShorthandTextHint(parsed: ParsedBotWorkflowText, token: string): void {
  const textUrl = normalizeTextUrl(token)
  if (textUrl) {
    parsed.media.push(textUrlToAttachment(textUrl, "text-url"))
    return
  }

  const normalizedToken = normalizeShorthandToken(token)
  const destination = DESTINATION_ALIASES[normalizedToken]
  if (destination) {
    parsed.output.destination = destination
    return
  }

  const resolution = RESOLUTION_ALIASES[normalizedToken]
  if (resolution) {
    parsed.output.resolution = resolution
  }
}

function textUrlToAttachment(value: string, fallbackName: string): BotMediaAttachment {
  const url = normalizeTextUrl(value) ?? value
  return {
    type: isUrl(url) ? "url" : "file",
    value: url,
    name: mediaNameFromUrl(url) ?? fallbackName,
    metadata: {
      source: "bot-text",
    },
  }
}

function normalizeTextUrl(value: string): string | null {
  const normalized = value
    .trim()
    .replace(/^<+/, "")
    .replace(/[>,.!?;:)\]]+$/, "")
  return isUrl(normalized) ? normalized : null
}

function normalizeShorthandToken(value: string): string {
  return normalizeKey(
    value
      .trim()
      .replace(/^[<([{}]+/, "")
      .replace(/[>,.!?;:)\]{}]+$/, ""),
  )
}

function mediaNameFromUrl(value: string): string | undefined {
  if (!isUrl(value)) return undefined

  try {
    const pathname = new URL(value).pathname
    const name = pathname.split("/").filter(Boolean).at(-1)
    return name ? decodeURIComponent(name) : undefined
  } catch {
    return undefined
  }
}

function isUrl(value: string): boolean {
  return value.startsWith("http://") || value.startsWith("https://")
}

import type { BotMediaAttachment, BotTemplateSelection, BotWorkflowDraft, BotWorkflowRequest } from "../types"

export interface BotWorkflowDraftMergeOptions {
  now?: () => string
}

export function createBotWorkflowDraftId(workflow: BotWorkflowRequest): string {
  return [workflow.source, workflow.chatId ?? "no-chat", workflow.userId ?? "no-user"].join(":")
}

export function mergeBotWorkflowDraft(
  existing: BotWorkflowDraft | undefined,
  workflow: BotWorkflowRequest,
  options: BotWorkflowDraftMergeOptions = {},
): BotWorkflowDraft {
  return {
    id: existing?.id ?? createBotWorkflowDraftId(workflow),
    workflow: mergeBotWorkflowRequests(existing?.workflow, workflow),
    updatedAt: options.now?.() ?? new Date().toISOString(),
  }
}

export function mergeBotWorkflowRequests(
  base: BotWorkflowRequest | undefined,
  next: BotWorkflowRequest,
): BotWorkflowRequest {
  if (!base) return next

  const text = mergeText(base.text, next.text)
  const media = mergeMedia(base.media, next.media)
  const params = mergeObject(base.params, next.params)
  const output = mergeObject(base.output, next.output)
  const template = mergeTemplate(base.template, next.template)

  return {
    source: next.source,
    chatId: next.chatId ?? base.chatId,
    userId: next.userId ?? base.userId,
    messageId: next.messageId ?? base.messageId,
    ...(text ? { text } : {}),
    ...(template ? { template } : {}),
    ...((next.project ?? base.project) ? { project: next.project ?? base.project } : {}),
    ...(media.length > 0 ? { media } : {}),
    ...(params ? { params } : {}),
    ...(output ? { output } : {}),
    ...((next.raw ?? base.raw) ? { raw: next.raw ?? base.raw } : {}),
  }
}

function mergeTemplate(
  base: BotTemplateSelection | undefined,
  next: BotTemplateSelection | undefined,
): BotTemplateSelection | undefined {
  if (!base) return next
  if (!next) return base

  const params = mergeObject(base.params, next.params)
  return {
    id: next.id || base.id,
    version: next.version ?? base.version,
    ...(params ? { params } : {}),
    ...((next.project ?? base.project) ? { project: next.project ?? base.project } : {}),
  }
}

function mergeText(...values: Array<string | undefined>): string | undefined {
  const text = values
    .map((value) => value?.trim())
    .filter((value): value is string => Boolean(value))
    .join(" ")
  return text.length > 0 ? text : undefined
}

function mergeMedia(
  base: BotMediaAttachment[] | undefined,
  next: BotMediaAttachment[] | undefined,
): BotMediaAttachment[] {
  return [...(base ?? []), ...(next ?? [])]
}

function mergeObject<T extends object>(base: T | undefined, next: T | undefined): T | undefined {
  const merged = {
    ...(base ?? {}),
    ...(next ?? {}),
  } as T
  return Object.keys(merged).length > 0 ? merged : undefined
}

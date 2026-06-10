const REDACTED_VALUE = "[redacted]"
const SENSITIVE_METADATA_KEY_PATTERN = /api[_-]?key|secret|password|authorization|bearer|credential/i

export function redactSensitiveMetadata<T>(value: T): T {
  return redactSensitiveValue(value) as T
}

function redactSensitiveValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => redactSensitiveValue(item))
  }

  if (!isPlainRecord(value)) {
    return value
  }

  return Object.fromEntries(
    Object.entries(value).map(([key, child]) => [
      key,
      isSensitiveMetadataKey(key) ? REDACTED_VALUE : redactSensitiveValue(child),
    ]),
  )
}

function isSensitiveMetadataKey(key: string): boolean {
  const normalized = key.toLowerCase()
  return (
    SENSITIVE_METADATA_KEY_PATTERN.test(key) ||
    normalized === "token" ||
    normalized.endsWith("token") ||
    normalized.endsWith("_token") ||
    normalized.endsWith("-token")
  )
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

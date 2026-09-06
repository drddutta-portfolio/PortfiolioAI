interface StructuredError {
  readonly message?: unknown
  readonly code?: unknown
  readonly details?: unknown
  readonly hint?: unknown
}

function nonEmptyString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null
}

export function displayError(error: unknown): string {
  if (error instanceof Error) return error.message
  if (!error || typeof error !== "object" || Array.isArray(error)) {
    return "The import operation failed unexpectedly."
  }

  const structured = error as StructuredError
  const fields = [
    ["message", nonEmptyString(structured.message)],
    ["code", nonEmptyString(structured.code)],
    ["details", nonEmptyString(structured.details)],
    ["hint", nonEmptyString(structured.hint)],
  ] as const
  const visible = fields.flatMap(([label, value]) => value ? [`${label}: ${value}`] : [])
  return visible.length ? visible.join(" | ") : "The import operation failed unexpectedly."
}

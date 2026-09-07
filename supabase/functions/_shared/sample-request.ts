export const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu

export function parseSampleSecurityIds(value: unknown):
  | { readonly specified: false }
  | { readonly specified: true; readonly valid: false }
  | { readonly specified: true; readonly valid: true; readonly ids: readonly string[] } {
  if (value === undefined) return { specified: false }
  if (!Array.isArray(value) || value.length < 1 || value.length > 5 || value.some((item) => typeof item !== "string" || !UUID_PATTERN.test(item))) {
    return { specified: true, valid: false }
  }
  return { specified: true, valid: true, ids: [...new Set(value as string[])] }
}

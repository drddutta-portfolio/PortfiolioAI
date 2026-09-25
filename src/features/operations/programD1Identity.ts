export function canonicalProgramD1Json(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value)
  if (Array.isArray(value)) return `[${value.map(canonicalProgramD1Json).join(",")}]`
  const record = value as Record<string, unknown>
  return `{${Object.keys(record).sort().map((key) => `${JSON.stringify(key)}:${canonicalProgramD1Json(record[key])}`).join(",")}}`
}

export async function programD1Sha256(value: unknown): Promise<string> {
  const encoded = new TextEncoder().encode(canonicalProgramD1Json(value))
  const digest = await crypto.subtle.digest("SHA-256", encoded)
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("")
}

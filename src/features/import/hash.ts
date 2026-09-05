function bytesToHex(bytes: Uint8Array) {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("")
}

export async function sha256Bytes(data: ArrayBuffer) {
  const digest = await crypto.subtle.digest("SHA-256", data)
  return bytesToHex(new Uint8Array(digest))
}

function stableValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stableValue)
  if (value !== null && typeof value === "object") {
    const entries = Object.entries(value).sort(([left], [right]) => left.localeCompare(right))
    return Object.fromEntries(entries.map(([key, child]) => [key, stableValue(child)]))
  }
  return value
}

export async function sha256Json(value: unknown) {
  const encoded = new TextEncoder().encode(JSON.stringify(stableValue(value)))
  return sha256Bytes(encoded.buffer)
}

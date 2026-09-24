function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize)
  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, child]) => [key, canonicalize(child)])
    return Object.fromEntries(entries)
  }
  return value
}

export function programCR8CanonicalJson(value: unknown) {
  return JSON.stringify(canonicalize(value))
}

function fnv1a32(value: string) {
  let hash = 0x811c9dc5
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 0x01000193)
  }
  return (hash >>> 0).toString(16).padStart(8, "0")
}

export function programCR8SemanticFingerprint(prefix: string, value: unknown) {
  const cleanPrefix = prefix.trim()
  if (!cleanPrefix) throw new Error("Program C R8 fingerprint prefix is required.")
  return `${cleanPrefix}::FNV1A32::${fnv1a32(programCR8CanonicalJson(value))}`
}

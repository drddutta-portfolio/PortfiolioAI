// Transport success does not establish successful provider tool execution.
export function readR4ProviderToolResult(value: unknown): string {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('PROVIDER_RESULT_MISSING')
  const result = value as {isError?: unknown; structuredContent?: {result?: unknown}; content?: {type?: unknown; text?: unknown}[]}
  if (result.isError === true) throw new Error('PROVIDER_TOOL_RESULT_ERROR')
  const text = result.structuredContent?.result ?? result.content?.find(x => x.type === 'text')?.text
  if (typeof text !== 'string') throw new Error('PROVIDER_RESULT_MISSING')
  const normalized = text.trim().toLowerCase()
  if (normalized.startsWith('unknown tool:') || normalized.includes('tool not found') || normalized.includes('method not found')) {
    throw new Error('PROVIDER_TOOL_CONTRACT_ERROR')
  }
  let decoded: unknown
  try { decoded = JSON.parse(text) } catch { decoded = null }
  if (decoded && typeof decoded === 'object' && !Array.isArray(decoded)) {
    const envelope = decoded as Record<string, unknown>
    if (envelope.error || envelope.isError === true || envelope.success === false || ['error','failed','failure'].includes(String(envelope.status ?? '').toLowerCase())) {
      throw new Error('PROVIDER_TOOL_RESULT_ERROR')
    }
  }
  if (/^(?:error|exception|failed)\b/.test(normalized)) throw new Error('PROVIDER_TOOL_RESULT_ERROR')
  if (/unauthori[sz]ed|authentication failed|invalid.{0,30}(?:token|api.?key)|(?:token|api.?key).{0,30}expired/.test(normalized)) {
    throw new Error('PROVIDER_AUTHENTICATION_ERROR')
  }
  return text
}

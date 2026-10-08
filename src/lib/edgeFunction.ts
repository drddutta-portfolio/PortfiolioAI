import { supabase } from "./supabase"

export interface EdgeFunctionResponse {
  readonly data: unknown
  readonly error: unknown
}

export async function invokeEdgeFunction(
  functionName: string,
  body: Readonly<Record<string, unknown>>,
): Promise<EdgeFunctionResponse> {
  const raw: unknown = await supabase.functions.invoke<unknown>(functionName, { body })
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    throw new Error(`Edge function ${functionName} returned an invalid transport response.`)
  }
  const record = raw as Record<string, unknown>
  return {
    data: record.data ?? null,
    error: record.error ?? null,
  }
}


export function asEdgeFunctionError(error: unknown, fallback = "Edge function request failed."): Error {
  if (error instanceof Error) return error
  if (typeof error === "string" && error.trim()) return new Error(error)
  if (error && typeof error === "object" && !Array.isArray(error)) {
    const record = error as Record<string, unknown>
    const message = typeof record.message === "string" && record.message.trim()
      ? record.message
      : typeof record.error === "string" && record.error.trim()
        ? record.error
        : fallback
    return new Error(message, { cause: error })
  }
  return new Error(fallback, { cause: error })
}

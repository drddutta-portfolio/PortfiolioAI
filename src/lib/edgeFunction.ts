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

import { supabase } from "./supabase"

export interface UnknownEdgeFunctionResult {
  readonly data: unknown
  readonly error: unknown
}

function record(value: unknown): Readonly<Record<string, unknown>> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Readonly<Record<string, unknown>>
    : null
}

export async function invokeEdgeFunctionUnknown(
  name: string,
  body: Readonly<Record<string, unknown>>,
): Promise<UnknownEdgeFunctionResult> {
  const raw: unknown = await supabase.functions.invoke(name, { body })
  const result = record(raw)
  if (!result) throw new Error(`Edge function ${name} returned an invalid connector response.`)
  return { data: result.data, error: result.error }
}

export function unknownErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message.trim()) return error.message
  const value = record(error)
  return typeof value?.message === "string" && value.message.trim()
    ? value.message
    : fallback
}

export function unknownRecord(value: unknown): Readonly<Record<string, unknown>> | null {
  return record(value)
}

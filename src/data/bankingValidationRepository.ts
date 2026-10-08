import { supabase } from "../lib/supabase"

const VALIDATE_ACTION = "P7_IC3_VALIDATE_CANONICAL_INPUTS"
const VALIDATOR_FUNCTION = "p7-ic2-materialize-readiness"

export type BankingReadOnlyRequest = {
  readonly action: typeof VALIDATE_ACTION
  readonly portfolioId: string
  readonly securityIds: readonly string[]
  readonly selectionRunId: string
  readonly evaluationAsOf: string
  readonly sourceCutoffAt: string
}

/** Repository boundary: never refresh providers or issue materialization action. */
export async function invokeBankingReadOnlyValidation(request: BankingReadOnlyRequest): Promise<unknown> {
  if (request.action !== VALIDATE_ACTION) throw new Error("Only read-only banking validation is allowed.")
  const { data: session, error: sessionError } = await supabase.auth.getSession()
  if (sessionError || !session.session) {
    throw new Error("Session unavailable or expired. Sign in again using the existing login page.")
  }
  const response: unknown = await supabase.functions.invoke(VALIDATOR_FUNCTION, { body: request })
  const { data, error } = response as { data: unknown; error: { message?: string } | null }
  if (error) throw new Error("Read-only validator failed. Confirm the Development session and function availability.")
  return data as unknown
}

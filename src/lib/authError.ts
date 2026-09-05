import { AuthError } from "@supabase/supabase-js"

const SAFE_AUTH_MESSAGES: Readonly<Record<string, string>> = {
  invalid_credentials: "The email or password is incorrect.",
  email_not_confirmed: "Confirm your email address before signing in.",
  over_request_rate_limit: "Too many attempts. Please wait and try again.",
  same_password: "Choose a password you have not used for this account.",
  weak_password: "Choose a stronger password and try again.",
}

export function getAuthErrorMessage(error: unknown) {
  if (error instanceof AuthError) {
    return SAFE_AUTH_MESSAGES[error.code ?? ""] ?? error.message
  }

  return "Something went wrong. Please try again."
}

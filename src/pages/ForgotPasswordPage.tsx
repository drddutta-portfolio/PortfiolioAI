import { useState, type FormEvent } from "react"
import { Link } from "react-router-dom"
import { useAuth } from "../auth/authContext"
import { AuthLayout } from "../components/AuthLayout"
import { getApplicationOrigin } from "../lib/config"
import { getAuthErrorMessage } from "../lib/authError"

export function ForgotPasswordPage() {
  const { sendPasswordReset } = useAuth()
  const [email, setEmail] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      await sendPasswordReset(
        email.trim(),
        `${getApplicationOrigin()}/auth/update-password`,
      )
      setSent(true)
    } catch (resetError) {
      setError(getAuthErrorMessage(resetError))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthLayout
      eyebrow="Account recovery"
      title="Reset your password"
      description="Enter the email for your PortfolioAI account."
      footer={<Link to="/login">Return to sign in</Link>}
    >
      {sent ? (
        <div className="notice notice-success" role="status">
          If an account exists for that email, a reset link has been sent. Check your inbox.
        </div>
      ) : (
        <form className="auth-form" onSubmit={(event) => void handleSubmit(event)}>
          {error ? <div className="notice notice-error" role="alert">{error}</div> : null}
          <label htmlFor="email">Email address</label>
          <input
            id="email"
            name="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            autoFocus
            required
          />
          <button className="button button-primary" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Sending reset link…" : "Send reset link"}
          </button>
        </form>
      )}
    </AuthLayout>
  )
}

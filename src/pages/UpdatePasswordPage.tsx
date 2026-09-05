import { useState, type FormEvent } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "../auth/authContext"
import { AuthLayout } from "../components/AuthLayout"
import { getAuthErrorMessage } from "../lib/authError"

export function UpdatePasswordPage() {
  const { user, loading, updatePassword } = useAuth()
  const navigate = useNavigate()
  const [password, setPassword] = useState("")
  const [confirmation, setConfirmation] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)

    if (password !== confirmation) {
      setError("The passwords do not match.")
      return
    }

    setIsSubmitting(true)

    try {
      await updatePassword(password)
      void navigate("/app", { replace: true })
    } catch (updateError) {
      setError(getAuthErrorMessage(updateError))
      setIsSubmitting(false)
    }
  }

  return (
    <AuthLayout
      eyebrow="Account recovery"
      title="Choose a new password"
      description="Use a strong, unique password for your PortfolioAI account."
      footer={<Link to="/login">Return to sign in</Link>}
    >
      {loading ? (
        <div className="notice" role="status">Validating your reset link…</div>
      ) : user ? (
        <form className="auth-form" onSubmit={(event) => void handleSubmit(event)}>
          {error ? <div className="notice notice-error" role="alert">{error}</div> : null}
          <label htmlFor="new-password">New password</label>
          <input
            id="new-password"
            name="new-password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="new-password"
            minLength={8}
            autoFocus
            required
          />
          <label htmlFor="confirm-password">Confirm new password</label>
          <input
            id="confirm-password"
            name="confirm-password"
            type="password"
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
            autoComplete="new-password"
            minLength={8}
            required
          />
          <button className="button button-primary" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Updating password…" : "Update password"}
          </button>
        </form>
      ) : (
        <div className="notice notice-error" role="alert">
          This reset link is invalid or has expired. Request a new link from the password reset page.
        </div>
      )}
    </AuthLayout>
  )
}

import { useState, type FormEvent } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { useAuth } from "../auth/authContext"
import { AuthLayout } from "../components/AuthLayout"
import { getAuthErrorMessage } from "../lib/authError"

interface LoginLocationState {
  readonly from?: string
  readonly message?: string
}

function getSafeDestination(value: unknown) {
  return typeof value === "string" && value.startsWith("/") && !value.startsWith("//")
    ? value
    : "/app"
}

export function LoginPage() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const state = location.state as LoginLocationState | null
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      await signIn(email.trim(), password)
      void navigate(getSafeDestination(state?.from), { replace: true })
    } catch (signInError) {
      setError(getAuthErrorMessage(signInError))
      setIsSubmitting(false)
    }
  }

  return (
    <AuthLayout
      eyebrow="Private access"
      title="Welcome back"
      description="Sign in to your private PortfolioAI workspace."
      footer={<span>Access is currently invite-only. Public registration is disabled.</span>}
    >
      {state?.message ? <div className="notice notice-success">{state.message}</div> : null}
      {error ? <div className="notice notice-error" role="alert">{error}</div> : null}
      <form className="auth-form" onSubmit={(event) => void handleSubmit(event)}>
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

        <div className="label-row">
          <label htmlFor="password">Password</label>
          <Link to="/forgot-password">Forgot password?</Link>
        </div>
        <input
          id="password"
          name="password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="current-password"
          required
        />

        <button className="button button-primary" type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </AuthLayout>
  )
}

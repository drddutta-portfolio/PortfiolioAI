import { cleanup, render, screen } from "@testing-library/react"
import type { User } from "@supabase/supabase-js"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { RedirectIfAuthenticated } from "./RedirectIfAuthenticated"
import { RequireAuth } from "./RequireAuth"
import { useAuth } from "./authContext"

vi.mock("./authContext", () => ({ useAuth: vi.fn() }))

const mockedUseAuth = vi.mocked(useAuth)

afterEach(cleanup)

function authState(user: User | null, loading = false) {
  mockedUseAuth.mockReturnValue({
    session: null,
    user,
    loading,
    signIn: vi.fn(),
    signOut: vi.fn(),
    sendPasswordReset: vi.fn(),
    updatePassword: vi.fn(),
  })
}

describe("authentication route guards", () => {
  beforeEach(() => vi.clearAllMocks())

  it("does not expose protected content while auth is loading", () => {
    authState(null, true)

    render(
      <MemoryRouter initialEntries={["/app"]}>
        <Routes>
          <Route element={<RequireAuth />}>
            <Route path="/app" element={<p>Private portfolio</p>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    )

    expect(screen.getByText(/restoring your secure session/i)).toBeInTheDocument()
    expect(screen.queryByText("Private portfolio")).not.toBeInTheDocument()
  })

  it("redirects an unauthenticated visitor to login", () => {
    authState(null)

    render(
      <MemoryRouter initialEntries={["/app"]}>
        <Routes>
          <Route element={<RequireAuth />}>
            <Route path="/app" element={<p>Private portfolio</p>} />
          </Route>
          <Route path="/login" element={<p>Login screen</p>} />
        </Routes>
      </MemoryRouter>,
    )

    expect(screen.getByText("Login screen")).toBeInTheDocument()
    expect(screen.queryByText("Private portfolio")).not.toBeInTheDocument()
  })

  it("allows an authenticated user into a protected route", () => {
    authState({ id: "user-a" } as User)

    render(
      <MemoryRouter initialEntries={["/app"]}>
        <Routes>
          <Route element={<RequireAuth />}>
            <Route path="/app" element={<p>Private portfolio</p>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    )

    expect(screen.getByText("Private portfolio")).toBeInTheDocument()
  })

  it("redirects an authenticated user away from login", () => {
    authState({ id: "user-a" } as User)

    render(
      <MemoryRouter initialEntries={["/login"]}>
        <Routes>
          <Route element={<RedirectIfAuthenticated />}>
            <Route path="/login" element={<p>Login screen</p>} />
          </Route>
          <Route path="/app" element={<p>Private portfolio</p>} />
        </Routes>
      </MemoryRouter>,
    )

    expect(screen.getByText("Private portfolio")).toBeInTheDocument()
    expect(screen.queryByText("Login screen")).not.toBeInTheDocument()
  })
})

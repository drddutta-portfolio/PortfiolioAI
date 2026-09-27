import type { Session } from "@supabase/supabase-js"
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react"
import { supabase } from "../lib/supabase"
import { AuthContext, type AuthContextValue } from "./authContext"

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    const resolveInitialSession = async () => {
      const { data, error } = await supabase.auth.getSession()

      if (!active) return

      if (error) {
        console.error("Unable to restore the Supabase session", {
          name: error.name,
          status: error.status,
        })
      }

      setSession(data.session)
      setLoading(false)
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!active) return
      setSession(nextSession)
      setLoading(false)
    })

    void resolveInitialSession()

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [])

  const signIn = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error

    // Commit the successful session synchronously before callers navigate.
    // Relying only on onAuthStateChange can race with RequireAuth and bounce
    // a valid sign-in back to /login on slower clients.
    setSession(data.session)
    setLoading(false)
  }, [])

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }, [])

  const sendPasswordReset = useCallback(
    async (email: string, redirectTo: string) => {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo,
      })
      if (error) throw error
    },
    [],
  )

  const updatePassword = useCallback(async (password: string) => {
    const { error } = await supabase.auth.updateUser({ password })
    if (error) throw error
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      loading,
      signIn,
      signOut,
      sendPasswordReset,
      updatePassword,
    }),
    [loading, sendPasswordReset, session, signIn, signOut, updatePassword],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

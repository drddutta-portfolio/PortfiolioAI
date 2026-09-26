import { describe, expect, it } from "vitest"
import {
  DEVELOPMENT_SUPABASE_PROJECT_REF,
  PRODUCTION_SUPABASE_PROJECT_REF,
  assertEnvironmentIsolation,
  getEnvironmentIdentity,
  getSupabaseProjectRef,
} from "./environment"

describe("environment isolation", () => {
  it("identifies the stable Development preview", () => {
    expect(
      getEnvironmentIdentity(
        "portfiolio-ai-git-portfolioai-development-dibyendu-dutta.vercel.app",
      ),
    ).toBe("DEVELOPMENT")
  })

  it("identifies local development", () => {
    expect(getEnvironmentIdentity("localhost")).toBe("LOCAL")
    expect(getEnvironmentIdentity("127.0.0.1")).toBe("LOCAL")
  })

  it("extracts a Supabase project ref", () => {
    expect(
      getSupabaseProjectRef(
        `https://${DEVELOPMENT_SUPABASE_PROJECT_REF}.supabase.co`,
      ),
    ).toBe(DEVELOPMENT_SUPABASE_PROJECT_REF)
  })

  it("rejects Production Supabase on Development", () => {
    expect(() =>
      assertEnvironmentIsolation(
        `https://${PRODUCTION_SUPABASE_PROJECT_REF}.supabase.co`,
        "portfiolio-ai-git-portfolioai-development-dibyendu-dutta.vercel.app",
      ),
    ).toThrow(/Production Supabase project/)
  })

  it("rejects a non-approved Supabase project on Development", () => {
    expect(() =>
      assertEnvironmentIsolation(
        "https://aaaaaaaaaaaaaaaaaaaa.supabase.co",
        "portfiolio-ai-git-portfolioai-development-dibyendu-dutta.vercel.app",
      ),
    ).toThrow(/approved Development Supabase project/)
  })

  it("accepts the approved Development Supabase project", () => {
    expect(() =>
      assertEnvironmentIsolation(
        `https://${DEVELOPMENT_SUPABASE_PROJECT_REF}.supabase.co`,
        "portfiolio-ai-git-portfolioai-development-dibyendu-dutta.vercel.app",
      ),
    ).not.toThrow()
  })
})

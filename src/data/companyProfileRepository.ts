import { publicConfig } from "../lib/config"
import { supabase } from "../lib/supabase"
import { invokeEdgeFunction } from "../lib/edgeFunction"
import { displayError } from "../lib/displayError"

export type CompanyProfile = {
  readonly profileStatus: "MISSING" | "PARTIAL" | "READY" | "FAILED"
  readonly aboutSummary: string | null
  readonly companyWebsiteUrl: string | null
  readonly logoStoragePath: string | null
  readonly sourceUrl: string | null
  readonly lastCheckedAt: string | null
  readonly lastSafeErrorCode: string | null
}

type CompanyProfileRow = {
  readonly profile_status: CompanyProfile["profileStatus"]
  readonly about_summary: string | null
  readonly company_website_url: string | null
  readonly logo_storage_path: string | null
  readonly source_url: string | null
  readonly last_checked_at: string | null
  readonly last_safe_error_code: string | null
}

function mapRow(row: CompanyProfileRow): CompanyProfile {
  return {
    profileStatus: row.profile_status,
    aboutSummary: row.about_summary,
    companyWebsiteUrl: row.company_website_url,
    logoStoragePath: row.logo_storage_path,
    sourceUrl: row.source_url,
    lastCheckedAt: row.last_checked_at,
    lastSafeErrorCode: row.last_safe_error_code,
  }
}

export async function getCachedCompanyProfile(securityId: string): Promise<CompanyProfile | null> {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error("Authentication is required to load the company profile.")

  const params = new URLSearchParams({
    select: "profile_status,about_summary,company_website_url,logo_storage_path,source_url,last_checked_at,last_safe_error_code",
    security_id: `eq.${securityId}`,
    limit: "1",
  })
  const response = await fetch(`${publicConfig.supabaseUrl}/rest/v1/security_company_profiles?${params.toString()}`, {
    headers: {
      apikey: publicConfig.supabasePublishableKey,
      Authorization: `Bearer ${session.access_token}`,
      Accept: "application/json",
    },
  })
  if (!response.ok) throw new Error("Cached company profile could not be loaded.")
  const rows = await response.json() as CompanyProfileRow[]
  return rows[0] ? mapRow(rows[0]) : null
}

export async function discoverCompanyProfile(portfolioId: string, securityId: string) {
  const result = await invokeEdgeFunction("discover-company-profile", { portfolioId, securityId },
  })
  if (result.error) throw new Error(displayError(result.error) || "Company profile discovery failed.")
  const payload = result.data as { readonly error?: string; readonly code?: string } | null
  if (payload?.error) throw new Error(payload.code ? `${payload.error} (${payload.code})` : payload.error)
}

export function companyLogoPublicUrl(path: string | null) {
  if (!path) return null
  const encodedPath = path.split("/").map((part) => encodeURIComponent(part)).join("/")
  return `${publicConfig.supabaseUrl}/storage/v1/object/public/company-assets/${encodedPath}`
}

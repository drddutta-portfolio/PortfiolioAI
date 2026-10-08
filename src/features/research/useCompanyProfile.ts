import { useCallback, useEffect, useState } from "react"
import { discoverCompanyProfile, getCachedCompanyProfile, type CompanyProfile } from "../../data/companyProfileRepository"

interface CompanyProfileLoadState {
  readonly securityId: string
  readonly data: CompanyProfile | null
  readonly error: string | null
}

export function useCompanyProfile(portfolioId: string, securityId: string) {
  const [loadState, setLoadState] = useState<CompanyProfileLoadState | null>(null)
  const [isDiscovering, setIsDiscovering] = useState(false)
  const [revision, setRevision] = useState(0)

  useEffect(() => {
    let active = true
    void getCachedCompanyProfile(securityId)
      .then((data) => {
        if (active) setLoadState({ securityId, data, error: null })
      })
      .catch((caught: unknown) => {
        if (active) {
          setLoadState({
            securityId,
            data: null,
            error: caught instanceof Error ? caught.message : "Cached company profile could not be loaded.",
          })
        }
      })
    return () => { active = false }
  }, [securityId, revision])

  const reload = useCallback(() => {
    setRevision((value) => value + 1)
  }, [])

  const discover = useCallback(async () => {
    setIsDiscovering(true)
    try {
      await discoverCompanyProfile(portfolioId, securityId)
      const data = await getCachedCompanyProfile(securityId)
      setLoadState({ securityId, data, error: null })
    } catch (caught) {
      setLoadState({
        securityId,
        data: null,
        error: caught instanceof Error ? caught.message : "Company profile discovery failed.",
      })
    } finally {
      setIsDiscovering(false)
    }
  }, [portfolioId, securityId])

  const current = loadState?.securityId === securityId ? loadState : null
  return {
    data: current?.data ?? null,
    isLoading: current === null,
    isDiscovering,
    error: current?.error ?? null,
    reload,
    discover,
  }
}

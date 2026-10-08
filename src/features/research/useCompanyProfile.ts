import { useCallback, useEffect, useState } from "react"
import { discoverCompanyProfile, getCachedCompanyProfile, type CompanyProfile } from "../../data/companyProfileRepository"

interface CompanyProfileState {
  readonly securityId: string
  readonly data: CompanyProfile | null
  readonly error: string | null
}

export function useCompanyProfile(portfolioId: string, securityId: string) {
  const [state, setState] = useState<CompanyProfileState | null>(null)
  const [isDiscovering, setIsDiscovering] = useState(false)
  const [revision, setRevision] = useState(0)

  useEffect(() => {
    let active = true
    void getCachedCompanyProfile(securityId)
      .then((data) => {
        if (active) setState({ securityId, data, error: null })
      })
      .catch((caught: unknown) => {
        if (active) setState({
          securityId,
          data: null,
          error: caught instanceof Error ? caught.message : "Cached company profile could not be loaded.",
        })
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
      setState({ securityId, data, error: null })
    } catch (caught) {
      setState({
        securityId,
        data: null,
        error: caught instanceof Error ? caught.message : "Company profile discovery failed.",
      })
    } finally {
      setIsDiscovering(false)
    }
  }, [portfolioId, securityId])

  const current = state?.securityId === securityId ? state : null
  return {
    data: current?.data ?? null,
    isLoading: current === null,
    isDiscovering,
    error: current?.error ?? null,
    reload,
    discover,
  }
}

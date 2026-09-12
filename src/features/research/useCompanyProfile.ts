import { useCallback, useEffect, useState } from "react"
import { discoverCompanyProfile, getCachedCompanyProfile, type CompanyProfile } from "../../data/companyProfileRepository"

export function useCompanyProfile(portfolioId: string, securityId: string) {
  const [data, setData] = useState<CompanyProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isDiscovering, setIsDiscovering] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      setData(await getCachedCompanyProfile(securityId))
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Cached company profile could not be loaded.")
    } finally {
      setIsLoading(false)
    }
  }, [securityId])

  useEffect(() => {
    void reload()
  }, [reload])

  const discover = useCallback(async () => {
    setIsDiscovering(true)
    setError(null)
    try {
      await discoverCompanyProfile(portfolioId, securityId)
      setData(await getCachedCompanyProfile(securityId))
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Company profile discovery failed.")
    } finally {
      setIsDiscovering(false)
    }
  }, [portfolioId, securityId])

  return { data, isLoading, isDiscovering, error, reload, discover }
}

// Restrict the R4 route to one repository, branch, workflow and signed event context.
export function validR4WorkflowClaims(header:Record<string,unknown>,claims:Record<string,unknown>,now:number):boolean {
  return header.alg==="RS256" && claims.iss==="https://token.actions.githubusercontent.com"
    && claims.aud==="portfolioai-results-r4" && claims.repository_id==="1357024254"
    && claims.repository==="drddutta-portfolio/PortfiolioAI"
    && claims.ref==="refs/heads/PortfolioAI-Development"
    && claims.workflow_ref==="drddutta-portfolio/PortfiolioAI/.github/workflows/results-r4-trendlyne-history.yml@refs/heads/PortfolioAI-Development"
    && (claims.event_name==="push" || claims.event_name==="workflow_dispatch")
    && typeof claims.exp==="number" && claims.exp>now
    && typeof claims.nbf==="number" && claims.nbf<=now+30
    && typeof claims.run_id==="string" && /^\d+$/.test(claims.run_id)
    && typeof claims.run_attempt==="string" && /^\d+$/.test(claims.run_attempt)
}

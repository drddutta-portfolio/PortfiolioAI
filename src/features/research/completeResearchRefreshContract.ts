export type CompleteResearchRefreshAction = "PLAN" | "EXECUTE"

export const completeResearchRefreshRequest = (
  action: CompleteResearchRefreshAction,
  portfolioId: string,
  securityId: string,
  profileCode: string,
): Record<string, unknown> => ({
  action,
  portfolioId,
  securityId,
  profileCode,
  ...(action === "EXECUTE" ? { confirmation: "OWNER_CONFIRMED_COMPLETE_RESEARCH_REFRESH" } : {}),
})

import policy from "./v14-bank-approved-delegation.json" with {type:"json"}
export const BANK_RESEARCH_DIRECTIVE_HASH="9a5aa51e99647e4b26faa800ea8383f5c87eb6b7e6269f079a65b886f8ac5762"
export const BANK_RESEARCH_PORTFOLIO=policy.portfolioId
export const BANK_RESEARCH_OWNER=policy.ownerId
export const BANK_RESEARCH_PROJECT=policy.developmentProject
export const BANK_RESEARCH_BATCH="V1_4_BANK_APPROVED_CURRENT_RESEARCH_V1"
export interface ResearchTarget {action:string;sliceId:string;scope:string;queryKey?:string}
export const BANK_RESEARCH_TARGETS:readonly ResearchTarget[]=[
 ...["BANK-P1-01","BANK-P1-02","BANK-P1-03","BANK-P1-04"].map(sliceId=>({action:"V1_4_BANK_FINANCIAL_CAPTURE_2026_10_09",sliceId,scope:sliceId+":BANK_FINANCIALS:2026-10-09"})),
 {action:"V1_4_BANK_PARAMETER_SEARCH_2026_10_09",sliceId:"BANK-P1-01",scope:"BANK_PARAMETER_SEARCH:BANK_MARGIN:2026-10-09",queryKey:"BANK_MARGIN"},
]
export function bankResearchExecutorQualified(p:Readonly<Record<string,unknown>>):boolean{
 return p.repository==="drddutta-portfolio/PortfiolioAI"&&p.repository_id==="1357024254"
  &&p.ref==="refs/heads/codex/banking-source-remediation"&&p.environment==="PortfolioAI-Development"
  &&p.sub==="repo:drddutta-portfolio@324877535/PortfiolioAI@1357024254:environment:PortfolioAI-Development"
  &&p.workflow_ref==="drddutta-portfolio/PortfiolioAI/.github/workflows/banking-v14-authorized-research.yml@refs/heads/codex/banking-source-remediation"
  &&["push","workflow_dispatch"].includes(String(p.event_name))&&typeof p.sha==="string"&&/^[a-f0-9]{40}$/.test(p.sha)
}
export function bankResearchGrantExternalId(day:string,target:ResearchTarget):string{
 if(!/^\d{4}-\d{2}-\d{2}$/.test(day)||!BANK_RESEARCH_TARGETS.some(t=>t.action===target.action&&t.scope===target.scope))throw Error("RESEARCH_SCOPE_INVALID")
 // Public idempotency identity, never an execution capability. Grant IDs are random.
 return BANK_RESEARCH_BATCH+":"+day+":"+target.scope
}

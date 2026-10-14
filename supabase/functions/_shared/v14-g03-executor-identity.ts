import {g02ExecutorIdentityQualified} from './v14-g02-executor-identity.ts'
export function g03SourceExecutorQualified(claims:Record<string,unknown>){return g02ExecutorIdentityQualified(claims)&&claims.workflow_ref==='drddutta-portfolio/PortfiolioAI/.github/workflows/g03-source-qualification.yml@refs/heads/codex/g02-industry-evidence'}
export const g03DocumentExecutorQualified=g03SourceExecutorQualified

import { useRef, useState } from "react"
import { Link } from "react-router-dom"
import { loadKvbRoaProposal, approveKvbRoaProposal, type KvbRoaProposal } from "../data/kvbRoaReviewRepository"
import { publicConfig } from "../lib/config"
import { DEVELOPMENT_SUPABASE_PROJECT_REF, getSupabaseProjectRef } from "../lib/environment"
export function KvbRoaReviewPage() {
 const [proposal, setProposal] = useState<KvbRoaProposal | null>(null)
 const [error, setError] = useState("")
 const [reviewId, setReviewId] = useState("")
 const [pending, setPending] = useState(false)
 const [confirmed, setConfirmed] = useState(false)
 const busy = useRef(false)
 const host = window.location.hostname
 const allowed = getSupabaseProjectRef(publicConfig.supabaseUrl) === DEVELOPMENT_SUPABASE_PROJECT_REF && ["portfiolio-ai-git-codex-banking-source-re-9b3df9-dibyendu-dutta.vercel.app", "localhost", "127.0.0.1"].includes(host)
 async function execute(approve: boolean) {
  if (!allowed || busy.current || (approve && (!proposal || !confirmed || reviewId))) return
  busy.current = true; setPending(true); setError("")
  try {
   if (approve && proposal) setReviewId(await approveKvbRoaProposal(proposal))
   else setProposal(await loadKvbRoaProposal())
  } catch (e) { setError(e instanceof Error ? e.message : "ROA review failed.") }
  finally { busy.current = false; setPending(false) }
 }
 if (!allowed) return <section className="panel"><h1>Development owner review</h1><p>This review is available only in the approved Development preview.</p></section>
 return <section className="panel"><h1>KVB annual ROA evidence review</h1>
  <p>Review the retained original documents for Karur Vysya Bank’s FY2025–26 standalone annual Return on Assets of 1.93%.</p>
  <button disabled={pending || Boolean(reviewId)} onClick={() => void execute(false)}>Load registered source evidence</button>
  {error && <p role="alert">{error}</p>}
  {proposal && <div>
   <p><a href={proposal.issuerUrl} target="_blank" rel="noreferrer">Original KVB financial schedules</a> · <a href={proposal.regulatorUrl} target="_blank" rel="noreferrer">Original RBI Directions</a></p>
   <pre style={{ whiteSpace: "pre-wrap" }}>{proposal.supportingQuote}</pre>
   <p>Reporting period: 1 April 2025–31 March 2026. Accounting scope: standalone. Publication timestamp: unknown; retrieval will not be treated as publication.</p>
   <p>The RBI Directions define ROA using average working funds and average total assets reported in Form X during the financial year. This review binds the separately retained RBI and issuer sources.</p>
   <label><input type="checkbox" checked={confirmed} disabled={pending || Boolean(reviewId)} onChange={e => setConfirmed(e.target.checked)} /> I have reviewed these sources and confirm the 1.93% annual ROA and applicable denominator for this period.</label>
   <p><button disabled={pending || !confirmed || Boolean(reviewId)} onClick={() => void execute(true)}>{pending ? "Submitting…" : "Approve source-bound ROA evidence"}</button></p>
  </div>}
  {reviewId && <p role="status">Accepted review: {reviewId}. Canonical validation and materialization still need to run; this acceptance alone does not establish FRESH or READY.</p>}
  <p><Link to="/app/settings/diagnostics/banking-v1-4">Banking read-only validator</Link></p>
 </section>
}

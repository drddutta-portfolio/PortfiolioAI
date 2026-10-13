import {useRef,useState} from 'react'
import {publicConfig} from '../lib/config'
import {DEVELOPMENT_SUPABASE_PROJECT_REF,getSupabaseProjectRef} from '../lib/environment'
import {loadKvbValuationBatch,approveKvbValuationBatch,refreshKvbValuationSessionEvidence,refreshKvbApprovedCurrentValuations,type KvbValuationBatch} from '../data/kvbValuationReviewRepository'
import {validateAndSaveKvbReadiness} from '../data/kvbRoaReviewRepository'
export default function KvbValuationReviewPage(){
 const [batch,setBatch]=useState<KvbValuationBatch|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState(''),[accepted,setAccepted]=useState(''),[basis,setBasis]=useState(false),[earnings,setEarnings]=useState(false),[activation,setActivation]=useState(false),[saved,setSaved]=useState('')
 const busyRef=useRef(false)
 const allowed=getSupabaseProjectRef(publicConfig.supabaseUrl)===DEVELOPMENT_SUPABASE_PROJECT_REF&&['portfiolio-ai-git-codex-banking-source-re-9b3df9-dibyendu-dutta.vercel.app','localhost','127.0.0.1'].includes(window.location.hostname)
 async function run(stage:string,operation:()=>Promise<void>){if(!allowed||busyRef.current)return;busyRef.current=true;setBusy(true);setError('');try{await operation()}catch(e){setError(`${stage}: ${e instanceof Error?e.message:'UNKNOWN_ERROR'}`)}finally{busyRef.current=false;setBusy(false)}}
 async function load(){const next=await loadKvbValuationBatch();if(next.batchHash!==batch?.batchHash){setAccepted('');setSaved('');setBasis(false);setEarnings(false);setActivation(false)}setBatch(next);if(next.currentPriceSourceRecordId!==batch?.currentPriceSourceRecordId)setSaved('');if(['ADMITTED_NOT_MATERIALIZED','FINANCIAL_APPROVED_CURRENT_PENDING'].includes(next.admissionState))setAccepted(next.acceptedBatchId??'')}
 function download(){if(!batch)return;const url=URL.createObjectURL(new Blob([JSON.stringify(batch,null,2)],{type:'application/json'}));const anchor=document.createElement('a');anchor.href=url;anchor.download='kvb-source-bound-pb-pe-owner-batch.json';anchor.click();URL.revokeObjectURL(url)}
 const resume=batch?.admissionState==='OWNER_APPROVED_PENDING_ADMISSION'
 if(!allowed)return <main><h1>Development owner review</h1><p>This review is available only in the approved Development preview.</p></main>
 return <main><h1>KVB historical P/B and P/E source review</h1>
  <p>This approval binds the exact historical and latest financial sources, not today’s stock price. It is reused when only the market price changes. New financial facts or source-basis changes require a new review. This is one owner approval for both qualified valuation histories. It preserves your existing ROA approval. KVB still needs every remaining requirement before it can become READY.</p>
  <button disabled={busy} onClick={()=>void run('LOAD',load)}>Load qualified source batch</button>
  {batch&&<section><p>Prepared source qualification: {batch.sourceQualificationAsOf}. Price session shown: {batch.currentPriceSession}.</p>{batch.currentState==='PENDING'&&<p role="status">Current valuation pending: {batch.currentReason}. You can review and approve these qualified financial sources now. Stale prices will not be admitted as current.</p>}
   {batch.metrics.map(m=><p key={m.requirementCode}>{m.requirementCode}: {m.eligibleMonths}/60 {['ADMITTED_NOT_MATERIALIZED','FINANCIAL_APPROVED_CURRENT_PENDING'].includes(batch.admissionState)?'owner-admitted historical observations; current canonical validation pending':'qualified candidates—not admitted'}; annual buckets {m.bands.join(', ')}; longest missing run {m.longestMissingRun} months.</p>)}
   <p>Batch fingerprint: {batch.batchHash}</p><button disabled={busy} onClick={download}>Download reviewable source evidence</button>
   <details><summary>Original source documents, hashes and publication dates</summary><ul>{batch.sourceEvidence.map(s=><li key={s.sourceRecordId}>{s.originalUrl?<a href={s.originalUrl} target="_blank" rel="noreferrer">{s.recordKind}</a>:s.recordKind}<br/>Original SHA-256: {s.originalSha256??'Original hash not supplied by this source record; payload hash shown in download.'}<br/>Published: {s.publishedAt??'UNKNOWN — retrieval is not publication'}; retrieved: {s.retrievedAt}<br/>Canonical source: {s.sourceRecordId}</li>)}</ul></details>
   <details><summary>P/B calculations and excluded months</summary><pre>{JSON.stringify(batch.valuationEvidence.pb,null,2)}</pre></details>
   <details><summary>Diluted four-quarter P/E calculations and excluded months</summary><pre>{JSON.stringify(batch.valuationEvidence.pe,null,2)}</pre></details>
   {accepted?<p role="status">These exact financial sources already have your recorded approval. Updating only current prices will reuse it.</p>:resume?<p role="status">Your genuine owner approval already exists ({batch.acceptedBatchId}). Admission did not finish. Resume the same approved batch; no repeat evidence approval is required.</p>:<>
    <label><input type="checkbox" checked={basis} disabled={busy||!!accepted} onChange={e=>setBasis(e.target.checked)}/>Approve statutory common equity and exact fully paid shares, with source-qualified corporate-action alignment.</label><br/>
    <label><input type="checkbox" checked={earnings} disabled={busy||!!accepted} onChange={e=>setEarnings(e.target.checked)}/>Approve diluted, nonannualized four-quarter EPS with original publication cutoffs and exclusions.</label><br/>
    <label><input type="checkbox" checked={activation} disabled={busy||!!accepted} onChange={e=>setActivation(e.target.checked)}/>Authorize conditional activation of the existing approved global P/B and P/E definitions after qualified KVB evidence; every other bank still requires independent evidence.</label><br/>
   </>}
   <button disabled={busy||(!resume&&(!basis||!earnings||!activation))||!!accepted} onClick={()=>void run(resume?'RESUME_ADMISSION':'OWNER_APPROVAL',async()=>{setAccepted(await approveKvbValuationBatch(batch));await load()})}>{resume?'Resume already-approved source admission':'Approve this P/B + P/E source batch'}</button>
  </section>}
  {accepted&&<p>Reusable financial source approval recorded: {accepted}. Canonical current valuation and persisted readback remain required.</p>}
  {accepted&&batch?.currentState==='PENDING'&&<button disabled={busy} onClick={()=>void run('REFRESH_APPROVED_CURRENT',async()=>{await refreshKvbApprovedCurrentValuations(batch);await load()})}>Refresh current valuation from approved facts</button>}
  {accepted&&<button disabled={busy||!!saved||batch?.currentState!=='ADMITTED_NOT_MATERIALIZED'} onClick={()=>void run('VALIDATE_AND_SAVE',async()=>{await refreshKvbValuationSessionEvidence();setSaved(await validateAndSaveKvbReadiness(['ROA_ANNUAL','PB_RELATIVE','PE_TTM_RELATIVE']))})}>Validate and save KVB readiness</button>}
  {saved&&<p>Saved snapshot: {saved}. Request independent canonical readback before declaring READY.</p>}{error&&<p role="alert">{error}</p>}
 </main>
}

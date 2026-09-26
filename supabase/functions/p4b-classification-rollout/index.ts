import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { consumeP4ExecutionGrant } from "../_shared/p4-execution-grant.ts"

const DEV_REF = "lrgpjimipfkyoqbpsqzz"
const PROD_REF = "uxiyufbsbgzzdujzcdxe"
const PORTFOLIO_ID = "6193a4aa-3235-4057-bddc-209fcf443fc2"
const SOURCE_CODE = "OWNER_REVIEWED_CLASSIFICATION"
const RECORD_KIND = "P4B_K1_INDUSTRY_MATERIALIZATION"
const DAY = 86_400_000

const reply = (status:number, body:Record<string,unknown>) => new Response(JSON.stringify(body), {
  status,
  headers: { "Content-Type":"application/json" },
})

function projectRef(value:string) {
  try { return new URL(value).hostname.match(/^([a-z0-9]+)\.supabase\.co$/u)?.[1] ?? null } catch { return null }
}
function decodeHtml(value:string) {
  return value
    .replace(/&amp;/giu,"&").replace(/&nbsp;/giu," ")
    .replace(/&#39;/giu,"'").replace(/&quot;/giu,'"')
    .replace(/&lt;/giu,"<").replace(/&gt;/giu,">")
}
function stripTags(value:string) {
  return decodeHtml(value.replace(/<[^>]+>/gu," ").replace(/\s+/gu," ").trim())
}
function normalize(value:string|null|undefined) {
  return typeof value === "string" ? value.trim().toUpperCase().replace(/[^A-Z0-9]+/gu,"_").replace(/^_+|_+$/gu,"") : ""
}
function parseClassification(html:string, symbol:string) {
  const plain=stripTags(html)
  const escaped=symbol.replace(/[.*+?^$()|[\]\\]/gu,"\\$&")
  if (!new RegExp(`NSE:\\s*${escaped}\\b`,"iu").test(plain)) throw new Error("SCREENER_IDENTITY_MISMATCH")
  const marker=html.search(/Peer\s+comparison/iu)
  const window=marker>=0?html.slice(marker,marker+18000):html
  const matches=[...window.matchAll(/<a\b[^>]*href=["']([^"']*\/market\/[^"']*)["'][^>]*>([\s\S]*?)<\/a>/giu)]
  const labels:{label:string,href:string|null}[]=[]
  for (const match of matches) {
    const label=stripTags(match[2]??"")
    if (!label) continue
    if (!labels.some(item=>item.label===label)) labels.push({label,href:match[1]??null})
    if (labels.length>=4) break
  }
  if (labels.length<3) throw new Error("SCREENER_CLASSIFICATION_PATH_MISSING")
  return {
    macroEconomicSector: labels[0]?.label ?? null,
    sourceSector: labels[1]?.label ?? null,
    industry: labels[2]?.label ?? null,
    basicIndustry: labels[3]?.label ?? null,
    classificationPath: labels.map(item=>item.label),
  }
}
async function sha256(value:unknown) {
  const data=new TextEncoder().encode(JSON.stringify(value))
  return Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256",data))).map(b=>b.toString(16).padStart(2,"0")).join("")
}
const sleep=(ms:number)=>new Promise(resolve=>setTimeout(resolve,ms))

Deno.serve(async request => {
  if (request.method!=="POST") return reply(405,{error:"Method not allowed."})
  const supabaseUrl=Deno.env.get("SUPABASE_URL")??""
  const serviceKey=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")??""
  const ref=projectRef(supabaseUrl)
  if (ref===PROD_REF) return reply(409,{error:"P4B classification rollout refuses Production.",code:"UNEXPECTED_PRODUCTION_DB_TARGET"})
  if (ref!==DEV_REF || !serviceKey) return reply(500,{error:"Development runtime configuration is incomplete."})

  try {
    const body=await request.json() as {action?:unknown,grantId?:unknown,afterSymbol?:unknown,limit?:unknown}
    if (body.action!=="P4B_CLASSIFY_BATCH") return reply(400,{error:"Unknown action."})
    const afterSymbol=typeof body.afterSymbol==="string"?body.afterSymbol.trim().toUpperCase():""
    const limit=Number(body.limit??10)
    if (!Number.isInteger(limit)||limit<1||limit>15) return reply(400,{error:"Batch limit must be 1..15."})
    const sentinel=`P4B_CLASSIFY_BATCH:${afterSymbol||"START"}:${limit}`

    const admin=createClient(supabaseUrl,serviceKey,{auth:{persistSession:false}})
    const grant=await consumeP4ExecutionGrant(admin,{
      grantId:body.grantId,
      action:"P4B_CLASSIFY_BATCH",
      portfolioId:PORTFOLIO_ID,
      securityId:sentinel,
    })
    if (!grant.ok) return reply(401,{error:grant.message,code:grant.code})

    const holdings=await admin.from("current_holdings").select("security_id,current_quantity").eq("portfolio_id",PORTFOLIO_ID)
    if (holdings.error) throw holdings.error
    const openIds=(holdings.data??[]).filter(row=>!/^[-+]?0(?:\.0+)?$/u.test(String(row.current_quantity))).map(row=>row.security_id)
    const securities=await admin.from("securities").select("id,symbol,name,isin,asset_class").in("id",openIds)
    if (securities.error) throw securities.error
    const equities=(securities.data??[]).filter(row=>row.asset_class==="EQUITY" && String(row.symbol)>afterSymbol).sort((a,b)=>String(a.symbol).localeCompare(String(b.symbol)))
    const ids=equities.map(row=>row.id)
    const cls=ids.length?await admin.from("current_security_classification_v1").select("security_id,sector,industry,has_conflict").in("security_id",ids):{data:[],error:null}
    if (cls.error) throw cls.error
    const byId=new Map((cls.data??[]).map(row=>[row.security_id,row]))
    const targets=equities.filter(row=>{
      const c=byId.get(row.id)
      return !c?.industry && !c?.has_conflict
    }).slice(0,limit)

    if (!targets.length) return reply(200,{status:"COMPLETE",processed:0,lastSymbol:afterSymbol,remaining:0,results:[]})

    const results:Record<string,unknown>[]=[]
    for (const security of targets) {
      const symbol=String(security.symbol)
      const canonical=byId.get(security.id)
      const sourceUrl=`https://www.screener.in/company/${encodeURIComponent(symbol)}/`
      try {
        const response=await fetch(sourceUrl,{
          headers:{
            "accept":"text/html,application/xhtml+xml",
            "user-agent":"Mozilla/5.0 PortfolioAI-P4B-Industry-Materialization/1.0",
          },
          redirect:"follow",
        })
        if (!response.ok) throw new Error(`SCREENER_HTTP_${response.status}`)
        const parsed=parseClassification(await response.text(),symbol)
        if (!parsed.industry) throw new Error("SCREENER_INDUSTRY_MISSING")

        const now=new Date().toISOString()
        const payload={
          contract:"PORTFOLIOAI_P4B_K1_INDUSTRY_MATERIALIZATION_V1",
          security_id:security.id,
          symbol,
          isin:security.isin??null,
          canonical_sector_preserved:canonical?.sector??null,
          source_macro_economic_sector:parsed.macroEconomicSector,
          source_sector:parsed.sourceSector,
          industry:parsed.industry,
          basic_industry:parsed.basicIndustry,
          classification_path:parsed.classificationPath,
          sector_comparison:normalize(canonical?.sector)===normalize(parsed.sourceSector)?"AGREE":"DIFF_PRESERVE_CANONICAL_SECTOR",
          source_url:sourceUrl,
          k1_policy:"INDUSTRY_ENRICHMENT_WITHOUT_SECTOR_OVERWRITE",
        }
        const payloadHash=await sha256(payload)
        const rec=await admin.from("data_source_records").upsert({
          source_code:SOURCE_CODE,
          record_kind:RECORD_KIND,
          external_record_id:`${symbol}:industry:${parsed.industry}`,
          payload_hash:payloadHash,
          raw_payload:payload,
          source_url:sourceUrl,
          retrieved_at:now,
          terms_snapshot:{mode:"POST_D_P4B_K1_MATERIALIZATION",owner_checkpoint:"4B",sector_overwrite:false},
        },{onConflict:"source_code,record_kind,external_record_id,payload_hash",ignoreDuplicates:true}).select("id,retrieved_at").maybeSingle()
        if (rec.error) throw rec.error
        let record=rec.data
        if (!record) {
          const found=await admin.from("data_source_records").select("id,retrieved_at")
            .eq("source_code",SOURCE_CODE).eq("record_kind",RECORD_KIND)
            .eq("external_record_id",`${symbol}:industry:${parsed.industry}`).eq("payload_hash",payloadHash).single()
          if (found.error) throw found.error
          record=found.data
        }
        const obs=await admin.from("security_attribute_observations").upsert({
          security_id:security.id,
          source_record_id:record.id,
          source_code:SOURCE_CODE,
          attribute_code:"INDUSTRY",
          text_value:parsed.industry,
          normalized_value:parsed.industry,
          observed_at:now,
          retrieved_at:record.retrieved_at,
          fresh_until:new Date(Date.now()+365*DAY).toISOString(),
          evidence_status:"AVAILABLE",
        },{onConflict:"source_record_id,security_id,attribute_code"}).select("id").single()
        if (obs.error) throw obs.error
        const decision=await admin.from("security_attribute_decisions").upsert({
          security_id:security.id,
          attribute_code:"INDUSTRY",
          selected_observation_id:obs.data.id,
          decision_basis:"MANUAL_REVIEW",
          decided_at:now,
          notes:"Materialized under owner-approved Gate K/P4B policy from exact-symbol public classification evidence; canonical sector preserved and no sector-only methodology routing allowed.",
        },{onConflict:"security_id,attribute_code"})
        if (decision.error) throw decision.error
        results.push({symbol,status:"ACCEPTED",industry:parsed.industry,sourceSector:parsed.sourceSector,canonicalSector:canonical?.sector??null})
      } catch (error) {
        results.push({symbol,status:"FAILED",code:error instanceof Error?error.message:"CLASSIFICATION_FETCH_FAILED"})
      }
      await sleep(350)
    }

    const lastSymbol=String(targets.at(-1)?.symbol??afterSymbol)
    const remaining=equities.filter(row=>String(row.symbol)>lastSymbol).filter(row=>{
      const c=byId.get(row.id)
      return !c?.industry && !c?.has_conflict
    }).length
    return reply(200,{status:"BATCH_COMPLETE",processed:targets.length,lastSymbol,remaining,results})
  } catch (error) {
    return reply(500,{error:"P4B classification batch failed safely.",code:error instanceof Error?error.message:"P4B_CLASSIFICATION_FAILED"})
  }
})

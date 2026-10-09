import { useEffect, useRef, useState } from "react"
import { getSupabaseProjectRef, DEVELOPMENT_SUPABASE_PROJECT_REF } from "../../lib/environment"
import { publicConfig } from "../../lib/config"
import { validateEffectiveBankReadOnly, type EffectiveBankReadOnlyResult } from "../../data/bankCurrentValidation"
import manifest from "../../../docs/private/v1-4-industry-batches/Banking_13_Read_Only_Request_Manifest.json"

function allowedDevelopmentBank(): boolean {
  if (typeof window === "undefined") return false
  if (getSupabaseProjectRef(publicConfig.supabaseUrl)!==DEVELOPMENT_SUPABASE_PROJECT_REF) return false
  const host = window.location.hostname.toLowerCase()
  const configured = typeof import.meta.env.VITE_V1_4_BANKING_ALLOWED_HOSTNAME==="string"
    ? import.meta.env.VITE_V1_4_BANKING_ALLOWED_HOSTNAME.trim().toLowerCase() : ""
  return host==="localhost" || host==="127.0.0.1" ||
    host==="portfolioai-development" || host.startsWith("portfolioai-development.") ||
    (configured.length>0 && host===configured)
}

export function useBankCurrentCanonicalReplay(
 portfolioId:string,securityId:string,bank:boolean,phase:string,enabled:boolean,
): { readonly status:"unavailable"|"pending"|"running"|"completed"|"failed"; readonly result:EffectiveBankReadOnlyResult|null; readonly error:string|null } {
  const scopeAllowed=bank && enabled && allowedDevelopmentBank() &&
    manifest.slices.some(slice => (slice.securityIds as readonly string[]).includes(securityId))
  const requestKey=scopeAllowed ? `${portfolioId}:${securityId}:${phase}` : ""
  const lastRequested=useRef("")
  const [state,setState]=useState<{key:string,status:"running"|"completed"|"failed",result:EffectiveBankReadOnlyResult|null,error:string|null}|null>(null)
  useEffect(()=>{
    if (!requestKey || lastRequested.current===requestKey) return
    lastRequested.current=requestKey
    let active=true
    setState({key:requestKey,status:"running",result:null,error:null})
    void validateEffectiveBankReadOnly(portfolioId,securityId,new Date().toISOString())
      .then(result=>{if(active)setState({key:requestKey,status:"completed",result,error:null})})
      .catch(()=>{if(active)setState({key:requestKey,status:"failed",result:null,error:"Read-only canonical evaluation failed or the owner session expired."})})
    return()=>{active=false}
  },[requestKey,portfolioId,securityId])
  if(!requestKey)return{status:"unavailable",result:null,error:null}
  if(state?.key!==requestKey)return{status:"pending",result:null,error:null}
  return{status:state.status,result:state.result,error:state.error}
}

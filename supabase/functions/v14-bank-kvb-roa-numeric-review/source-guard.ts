const HASH=/^[0-9a-f]{64}$/;
const str=(v:unknown)=>typeof v==="string"?v:"";
export function sourceEligible(source:Record<string,unknown>,fragment:string){
 const raw=source.raw_payload as Record<string,unknown>|null;
 if(!raw||!["COMPANY_EXCHANGE_FILING","NSE_OFFICIAL"].includes(str(source.source_code)))return false;
 const original=str(raw.original_sha256),url=str(raw.original_url);
 const inSource=Object.values(raw).some(x=>typeof x==="string"&&x.includes(fragment));
 if(!HASH.test(original)||!/^https:\/\/(www\.)?(kvb\.bank\.in|nsearchives\.nseindia\.com)\//.test(url)||!inSource)return false;
 return /return on assets/i.test(fragment)&&/1\.93(?:00)?\s*%?/.test(fragment)&&/average (?:total )?assets/i.test(fragment)&&/financial year|full.year|audited/i.test(fragment)
   &&/01-04-2025|2025-04-01/.test(fragment)&&/31-03-2026|2026-03-31/.test(fragment);
}

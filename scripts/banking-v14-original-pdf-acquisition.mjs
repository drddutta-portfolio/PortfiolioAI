#!/usr/bin/env node
// One-time public bank-regulatory PDF acquisition. No provider credentials, DB writes, or reviews.
import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
const targets = [
 {symbol:"ICICIBANK",url:"https://www.icici.bank.in/content/dam/icicibank/missing-assets/basel-pillar-3-disclosureat-june-30-2026.pdf"},
 {symbol:"BANDHANBNK",url:"https://www.bandhan.bank.in/sites/default/files/2026-07/Basel-III-Disclosure-as-on-June-30-2026.pdf"},
 {symbol:"KARURVYSYA",url:"https://www.kvb.bank.in/docs/disclosure-of-june-2026.pdf"}
];
const directory="bank-original-source-artifact";
await mkdir(directory,{recursive:true});
const results=[];
for (const target of targets){
 const started=new Date().toISOString();
 try{
  const controller=new AbortController();
  const timeout=setTimeout(()=>controller.abort(),25000);
  let response;
  try{response=await fetch(target.url,{redirect:"follow",signal:controller.signal,headers:{"User-Agent":"PortfolioAI-V1-4-OfficialSourceVerification/1.0","Accept":"application/pdf"}})}
  finally{clearTimeout(timeout)}
  const finalUrl=response.url;
  if(!response.ok)throw Error("HTTP_"+response.status);
  if(new URL(finalUrl).protocol!=="https:")throw Error("NON_HTTPS_FINAL_URL");
  // Redirect outside official source identity is recorded and blocked.
  const approvedHosts=new Set(["www.icici.bank.in","www.bandhan.bank.in","www.kvb.bank.in","icici.bank.in","bandhan.bank.in","kvb.bank.in"]);
  if(!approvedHosts.has(new URL(finalUrl).hostname))throw Error("UNAPPROVED_REDIRECT_HOST_"+new URL(finalUrl).hostname);
  const buffer=Buffer.from(await response.arrayBuffer());
  if(buffer.length<1024||buffer.length>35_000_000||buffer.subarray(0,5).toString()!=="%PDF-")throw Error("INVALID_OR_OVERSIZED_PDF");
  const hash=createHash("sha256").update(buffer).digest("hex");
  const name=target.symbol+"-BaselIII-June2026.pdf";
  await writeFile(join(directory,name),buffer);
  results.push({symbol:target.symbol,requestedUrl:target.url,finalUrl,httpStatus:response.status,contentType:response.headers.get("content-type"),retrievedAt:started,bytes:buffer.length,originalSha256:hash,filename:name,status:"ORIGINAL_BYTES_CAPTURED_NOT_ADMITTED"});
 }catch(e){
  results.push({symbol:target.symbol,requestedUrl:target.url,retrievedAt:started,status:"ACQUISITION_FAILED",error:String(e?.cause??e),message:String(e)});
 }
}
await writeFile(join(directory,"manifest.json"),JSON.stringify({version:"BANK_V1_4_PUBLIC_ORIGINAL_BYTES_V1",results},null,2)+"\n");
for(const row of results)console.log(JSON.stringify(row));
if(results.every(x=>x.status!=="ORIGINAL_BYTES_CAPTURED_NOT_ADMITTED"))process.exitCode=2;

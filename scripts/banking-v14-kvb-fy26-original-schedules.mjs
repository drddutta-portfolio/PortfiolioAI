#!/usr/bin/env node
// Banking V1-4: original FY2025-26 Karur Vysya Bank schedules, capture-only.
// No automatic factual acceptance, materialization, or Production operations.
import {createHash} from "node:crypto";
import {mkdir,writeFile} from "node:fs/promises";
const url="https://www.kvb.bank.in/ar-26/assets/pdfs/Karur_Vysya_Bank_IAR_Schedules.pdf";
const root="kvb-fy26-original-artifact";
await mkdir(root,{recursive:true});
const started=new Date().toISOString();
const manifest={version:"BANK_V14_KVB_FY26_ORIGINAL_SCHEDULES_V1",symbol:"KARURVYSYA",source_url:url,retrieved_at:started,canonical_admission:false};
try {
 const response=await fetch(url,{redirect:"follow",signal:AbortSignal.timeout(40000),headers:{"User-Agent":"PortfolioAI-V14-Official-Source/1.0","Accept":"application/pdf"}});
 const resolved=new URL(response.url);
 if(!response.ok)throw Error("HTTP_"+response.status);
 if(resolved.protocol!=="https:"||!["www.kvb.bank.in","kvb.bank.in"].includes(resolved.hostname)||resolved.username||resolved.password)throw Error("UNAPPROVED_FINAL_URL");
 const bytes=Buffer.from(await response.arrayBuffer());
 if(bytes.length<1024||bytes.length>50000000||bytes.subarray(0,5).toString()!=="%PDF-")throw Error("INVALID_PDF_BYTES");
 const originalSha256=createHash("sha256").update(bytes).digest("hex");
 await writeFile(root+"/KARURVYSYA-FY2025-26-Financial-Schedules.pdf",bytes);
 Object.assign(manifest,{status:"ORIGINAL_BYTES_CAPTURED_NOT_ADMITTED",final_url:response.url,http_status:response.status,content_type:response.headers.get("content-type"),bytes:bytes.length,original_sha256:originalSha256});
}catch(e){Object.assign(manifest,{status:"ACQUISITION_FAILED",error:String(e)});}
await writeFile(root+"/manifest.json",JSON.stringify(manifest,null,2)+"\n");
console.log(JSON.stringify(manifest));
if(manifest.status!=="ORIGINAL_BYTES_CAPTURED_NOT_ADMITTED")process.exitCode=2;

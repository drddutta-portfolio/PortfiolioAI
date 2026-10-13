#!/usr/bin/env node
// Official RBI source capture only; no factual admission or valuation writes.
import {createHash} from "node:crypto";
import {mkdir,writeFile} from "node:fs/promises";
const targets=[
 {id:"RBI_2010_DISCLOSURE_DEFINITION",url:"https://www.rbi.org.in/commonman/English/Scripts/Notification.aspx?Id=734",need:["Working funds","Return on Assets","Form X"]},
 {id:"RBI_2025_FINANCIAL_STATEMENTS_MASTER_DIRECTION",url:"https://www.rbi.org.in/scripts/NotificationUser.aspx?Id=12158",need:["Financial Statements","Commercial Banks"]}
];
const dir="kvb-rbi-original-artifact";await mkdir(dir,{recursive:true});let all=[];
for(const t of targets){
 const row={id:t.id,official_url:t.url,retrieved_at:new Date().toISOString(),status:"FAILED_NOT_ADMITTED"};
 try{
  const r=await fetch(t.url,{redirect:"follow",signal:AbortSignal.timeout(25000),headers:{"User-Agent":"PortfolioAI-Official-Regulator-Evidence/1.0"}});
  const u=new URL(r.url);
  if(!r.ok||u.protocol!=="https:"||!["www.rbi.org.in","rbi.org.in"].includes(u.hostname))throw Error("OFFICIAL_RBI_FETCH_OR_REDIRECT_FAILED_"+r.status);
  const bytes=Buffer.from(await r.arrayBuffer());
  if(bytes.length<1000||bytes.length>10000000)throw Error("INVALID_OR_EXCESSIVE_RBI_BYTES");
  const txt=bytes.toString("utf8");
  const anchors=t.need.map(s=>({anchor:s,found:txt.toLowerCase().includes(s.toLowerCase())}));
  if(!anchors.every(x=>x.found))throw Error("RBI_IDENTITY_OR_DEFINITION_ANCHOR_MISSING");
  const original_sha256=createHash("sha256").update(bytes).digest("hex");
  await writeFile(dir+"/"+t.id+".html",bytes);
  Object.assign(row,{status:"ORIGINAL_RBI_HTML_CAPTURED_NOT_ADMITTED",final_url:r.url,bytes:bytes.length,original_sha256,anchors});
 }catch(e){row.error=String(e)}
 all.push(row);
}
await writeFile(dir+"/manifest.json",JSON.stringify({version:"KVB_RBI_ORIGINAL_CAPTURE_V1",items:all},null,2)+"\n");
for(const row of all)console.log(JSON.stringify(row));
if(all.every(x=>x.status!=="ORIGINAL_RBI_HTML_CAPTURED_NOT_ADMITTED"))process.exitCode=2;

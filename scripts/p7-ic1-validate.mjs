#!/usr/bin/env node
import fs from "node:fs";
const registry=JSON.parse(fs.readFileSync(new URL("../docs/p7-ic/PortfolioAI_P7_IC1_METHODOLOGY_R7_REGISTRY_V1.json", import.meta.url),"utf8"));
const coverage=JSON.parse(fs.readFileSync(new URL("../docs/p7-ic/PortfolioAI_P7_IC1_PORTFOLIO_METHODOLOGY_COVERAGE_2026-09-29.json", import.meta.url),"utf8"));
const errors=[];
const sum=o=>Object.values(o).reduce((a,b)=>a+b,0);
if(coverage.summary.equities!==239) errors.push("expected 239 equities");
if(coverage.rows.length!==239) errors.push("coverage rows must equal 239");
if(coverage.summary.methodologyNotAvailableDeferredEngineering!==0) errors.push("deferred-engineering METHODOLOGY_NOT_AVAILABLE remains");
const rr=coverage.rows.filter(r=>r.ic1State==="REVIEW_REQUIRED");
if(rr.length!==1||rr[0]?.symbol!=="BLUEJET") errors.push("only BLUEJET may remain factual REVIEW_REQUIRED at IC1");
const profiles=new Map(registry.profiles.map(p=>[p.profileCode,p]));
const policies=new Map(registry.r7Policies.map(p=>[p.profileCode,p]));
for(const row of coverage.rows){
 if(row.ic1State==="RESOLVED"){
   if(!profiles.has(row.profileCode)) errors.push("missing methodology:"+row.symbol);
   if(!policies.has(row.profileCode)) errors.push("missing R7:"+row.symbol);
 }
}
for(const p of registry.profiles){
 if(p.methodologyState==="IC1_COMPLETE_CANDIDATE_AWAITING_IC_B"&&sum(p.dimensionWeights)!==100) errors.push("weight total:"+p.profileCode);
 if(p.isolationContract?.runtimeSymbolSpecific!==false) errors.push("runtime symbol-specific:"+p.profileCode);
}
if(registry.governance.runtimeActivationAuthorized!==false) errors.push("runtime activation must be false");
for(const k of ["providerCallsAuthorized","databaseWritesAuthorized","migrationCreationAuthorized","migrationApplicationAuthorized","deploymentAuthorized","mergeAuthorized","p8Authorized"]) if(registry.governance[k]!==false) errors.push(k+" must be false");
if(registry.r7Policies.some(p=>p.ownerActionProjectionAllowed!==false)) errors.push("IC1 R7 must not project owner-facing action");
if(errors.length){console.error(errors.join("\n"));process.exit(1)}
console.log(JSON.stringify({status:"PASS",equities:coverage.summary.equities,resolved:coverage.summary.resolved,reviewRequired:coverage.summary.reviewRequired,profiles:registry.profiles.length,r7Policies:registry.r7Policies.length,pharmaSubprofiles:registry.pharma.subprofiles.length,providerCalls:0,databaseWrites:0,migrations:0,deployments:0},null,2));

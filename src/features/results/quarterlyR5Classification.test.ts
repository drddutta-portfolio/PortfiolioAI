import { describe, expect, it } from "vitest"
import {
  buildIndustryR5Calibrations, buildRollingIndustryR5Calibrations, gradeQuarterR5, RESULTS_GRADING_VERSION,
  type R5IndustryCalibrations,
} from "./quarterlyR5Classification"
import type { ResultsSourceObservation } from "./resultsSourceRepository"

function fact(end:string, code:string, value:string, scope="CONSOLIDATED"):ResultsSourceObservation {
  const [year,month] = end.split("-").map(Number)
  return { id:end+code, securityId:"s1", code, value,
    unit:code==="EPS_DILUTED"?"INR_PER_SHARE":"INR_CRORE",
    periodEnd:end, periodStart:new Date(Date.UTC(year!,month!-3,1)).toISOString().slice(0,10),
    currency:"INR",scope,source:"COMPANY_EXCHANGE_FILING",
    sourceRecordId:end+"-issuer",publishedAt:null,retrievedAt:"2026-10-15T00:00:00Z",selected:true }
}
function history(topCode:string, currentTop:string, oldTop:string, currentPat:string, oldPat:string) {
  return [
    fact("2026-06-30",topCode,currentTop),
    fact("2026-03-31",topCode,oldTop),
    fact("2026-06-30","NET_PROFIT_QUARTER",currentPat),
    fact("2026-03-31","NET_PROFIT_QUARTER",oldPat),
  ]
}
function policy(sector: string, industry: string, bank=false): R5IndustryCalibrations {
  const key = sector.toUpperCase() + "::" + industry.toUpperCase()
  return new Map([[key,{
    group:key.replace("::"," / "), topCode: bank ? "NET_INTEREST_INCOME_QUARTER" as const : "OPERATING_REVENUE_QUARTER" as const,
    sampleSize:36, distinctIssuers:12, p25Top:"-5.0",p75Top:"12.0",
    p25Profit:"-20.0",p75Profit:"20.0",
  }]])
}
function graded(
  rows:readonly ResultsSourceObservation[], sector:string|null,
  industry:string|null, calibrated?:R5IndustryCalibrations,
) {
  return gradeQuarterR5(rows,"s1","2026-06-30",sector,industry,calibrated??new Map())
}
describe("R5 exact-industry quarterly operating signal", () => {
  it("returns Strong only when IT revenue and PAT meet calibrated exact-industry bounds",()=>{
    const rows=history("OPERATING_REVENUE_QUARTER","114","100","125","100")
    const a=graded(rows,"Information Technology","Computers - Software & Consulting",
      policy("Information Technology","Computers - Software & Consulting"))
    expect(a.status).toBe("STRONG")
    expect(a.policyVersion).toBe(RESULTS_GRADING_VERSION)
    expect(a.group).toContain("COMPUTERS - SOFTWARE & CONSULTING")
    expect(graded(rows,"Information Technology","IT Software Products",
      policy("Information Technology","Computers - Software & Consulting")).status).toBe("UNAVAILABLE")
  })
  it("scores real banks on NII and PAT rather than revenue and declines nonbank lender contracts",()=>{
    const rows=history("NET_INTEREST_INCOME_QUARTER","110","100","125","100")
    const bankPolicy = policy("Banking","Private Sector Bank",true)
    expect(graded(rows,"Banking","Private Sector Bank",bankPolicy).status).toBe("MIXED")
    expect(graded(rows,"Financial Services","Public Sector Bank",policy("Financial Services","Public Sector Bank",true)).basis).toBe("INDUSTRY_PEER")
    expect(graded(rows,"Financial Services","Public Sector Bank",policy("Financial Services","Public Sector Bank",true)).status).toBe("MIXED")
    expect(graded(rows,"Pharma","Pharmaceuticals",policy("Pharma","Pharmaceuticals")).status).toBe("UNAVAILABLE")
    expect(graded(rows,"Financial Services","NBFC",bankPolicy).status).toBe("UNAVAILABLE")
  })
  it("requires a reviewed industry, never substitutes sector-based calibration",()=>{
    const rows=history("OPERATING_REVENUE_QUARTER","130","100","145","100")
    expect(graded(rows,null,null).status).toBe("UNAVAILABLE")
    expect(graded(rows,"Pharma","Pharmaceuticals").status).toBe("UNAVAILABLE")
    expect(graded(rows,"Pharma","Pharmaceuticals",policy("Pharma","Pharmaceuticals")).status).toBe("STRONG")
    expect(graded(rows,"Pharma","Packaged Foods",policy("Pharma","Pharmaceuticals")).status).toBe("UNAVAILABLE")
  })
  it("rejects source incoherence in CURRENT and PREVIOUS quarterly evidence",()=>{
    const rows=history("OPERATING_REVENUE_QUARTER","130","100","145","100")
    const bounds=policy("Pharma","Pharmaceuticals")
    expect(graded([...rows.slice(0,2), {...rows[2]!,sourceRecordId:"different-current-filing"}, rows[3]!],
      "Pharma","Pharmaceuticals",bounds).status).toBe("UNAVAILABLE")
    expect(graded([...rows.slice(0,3), {...rows[3]!,sourceRecordId:"different-previous-filing"}],
      "Pharma","Pharmaceuticals",bounds).status).toBe("UNAVAILABLE")
  })
  it("assigns Weak for qualified material losses without implying sale advice",()=>{
    const rows=history("OPERATING_REVENUE_QUARTER","75","100","-3","100")
    const a=graded(rows,"Information Technology","Computers - Software & Consulting",
      policy("Information Technology","Computers - Software & Consulting"))
    expect(a.status).toBe("WEAK")
    expect(a.explanation).toContain("No YoY conclusion")
    expect(a.explanation).not.toContain("sell")
  })
  it("rejects unselected prerequisite facts, despite valid peer thresholds",()=>{
    const rows=history("NET_INTEREST_INCOME_QUARTER","110","100","125","100")
    const a=graded(rows.map((x,i)=>i===3?{...x,selected:false}:x),
      "Banking","Private Sector Bank",policy("Banking","Private Sector Bank",true))
    expect(a.status).toBe("UNAVAILABLE")
  })
  it("calibrates only the same industry using >=4 independent issuers and >=12 qualified pairs",()=>{
    const peers=[0,1,2,3].map(i=>({
      securityId:"issuer"+i, sector:"Information Technology",industry:"Computers - Software & Consulting",
    }))
    const quarters=["2025-09-30","2025-12-31","2026-03-31","2026-06-30"]
    const rows=peers.flatMap((peer,i)=>quarters.flatMap((q,j)=>[
      {...fact(q,"OPERATING_REVENUE_QUARTER",String(100+i*3+j*10)),securityId:peer.securityId,id:peer.securityId+q+"rev",sourceRecordId:peer.securityId+q},
      {...fact(q,"NET_PROFIT_QUARTER",String(50+i*2+j*5)),securityId:peer.securityId,id:peer.securityId+q+"pat",sourceRecordId:peer.securityId+q},
    ]))
    const group="INFORMATION TECHNOLOGY::COMPUTERS - SOFTWARE & CONSULTING"
    const full=buildIndustryR5Calibrations(rows,peers)
    expect(full.get(group)?.sampleSize).toBe(12)
    expect(full.get(group)?.distinctIssuers).toBe(4)
    const sparse=buildIndustryR5Calibrations(rows,peers.slice(0,3))
    expect(sparse.has(group)).toBe(false)
    expect(full.has("INFORMATION TECHNOLOGY::IT SOFTWARE PRODUCTS")).toBe(false)
    const badRows=rows.filter(r=>r.securityId!=="issuer3")
    expect(buildIndustryR5Calibrations(badRows,peers).has(group)).toBe(false)
  })
  it("grades a sparse-industry company on a separately labelled verified trajectory, not a fake peer rank",()=>{
    const quarters=["2025-09-30","2025-12-31","2026-03-31","2026-06-30"]
    const rows=quarters.flatMap((date,i)=>[
      fact(date,"OPERATING_REVENUE_QUARTER",String(100+i*10)),
      fact(date,"NET_PROFIT_QUARTER",String(20+i*5)),
    ])
    const result=graded(rows,"Waste Managment","Water Supply & Management")
    expect(result.status).toBe("STRONG")
    expect(result.basis).toBe("COMPANY_TREND")
    expect(result.sampleSize).toBe(3)
    expect(result.explanation).toContain("NOT an industry percentile")
    const peerResult=graded(rows,"Waste Managment","Water Supply & Management",
      policy("Waste Managment","Water Supply & Management"))
    expect(peerResult.basis).toBe("INDUSTRY_PEER")
  })
  it("cannot produce an own-trend grade with one comparison or no valid latest pair",()=>{
    const onePair=history("OPERATING_REVENUE_QUARTER","110","100","25","20")
    expect(graded(onePair,"Chemicals","Agrochemicals").status).toBe("UNAVAILABLE")
    const quarters=["2025-09-30","2025-12-31","2026-03-31","2026-06-30"]
    const rows=quarters.flatMap((date,i)=>[
      fact(date,"OPERATING_REVENUE_QUARTER",String(100+i*10)),
      fact(date,"NET_PROFIT_QUARTER",String(20+i*5)),
    ])
    const bad=rows.map(r=>r.periodEnd==="2026-03-31" && r.code==="NET_PROFIT_QUARTER"
      ? {...r,sourceRecordId:"unrelated"} : r)
    expect(graded(bad,"Chemicals","Agrochemicals").status).toBe("UNAVAILABLE")
    expect(gradeQuarterR5(rows,"s1","2025-09-30","Chemicals","Agrochemicals",new Map()).status).toBe("UNAVAILABLE")
  })
  it("marks sustained own-company contraction weak and alternating momentum mixed",()=>{
    const quarter=["2025-09-30","2025-12-31","2026-03-31","2026-06-30"]
    const make=(tops: number[],profits:number[])=>quarter.flatMap((q,i)=>[
      fact(q,"OPERATING_REVENUE_QUARTER",String(tops[i])),
      fact(q,"NET_PROFIT_QUARTER",String(profits[i])),
    ])
    const weak=graded(make([160,140,120,100],[50,40,30,20]),"Industrial","Civil Construction")
    expect(weak.status).toBe("WEAK")
    expect(weak.basis).toBe("COMPANY_TREND")
    const mixed=graded(make([100,130,120,140],[20,25,21,20]),"Industrial","Civil Construction")
    expect(mixed.status).toBe("MIXED")
  })
  it("does not grade unreviewed industries, lenders or competing original sources through fallback",()=>{
    const dates=["2025-09-30","2025-12-31","2026-03-31","2026-06-30"]
    const rows=dates.flatMap((date,i)=>[
      fact(date,"OPERATING_REVENUE_QUARTER",String(100+i*10)),
      fact(date,"NET_PROFIT_QUARTER",String(20+i*5)),
    ])
    expect(graded(rows,null,null).status).toBe("UNAVAILABLE")
    expect(graded(rows,"Financial Services","NBFC").status).toBe("UNAVAILABLE")
    const conflicting=rows.map(r=>r.periodEnd==="2025-12-31" && r.code==="NET_PROFIT_QUARTER"
      ? {...r,sourceRecordId:"another-issuer-original"} : r)
    // Second and third comparisons break; one remaining latest quarter pair is insufficient.
    expect(graded(conflicting,"Chemicals","Agrochemicals").status).toBe("UNAVAILABLE")
  })

  it("assesses a verified loss-to-profit turnaround by level signs without inventing PAT growth percentages",()=>{
    const dates=["2025-09-30","2025-12-31","2026-03-31","2026-06-30"]
    const pats=[10,-5,2,5]
    const rows=dates.flatMap((date,i)=>[
      fact(date,"OPERATING_REVENUE_QUARTER",String(100+i*10)),
      fact(date,"NET_PROFIT_QUARTER",String(pats[i])),
    ])
    const result=graded(rows,"Capital Goods","Heavy Electrical Equipment")
    expect(result.basis).toBe("COMPANY_TREND")
    expect(result.status).toBe("STRONG")
    expect(result.explanation).toContain("level changes")
  })
  it("permits operating Fintech/energy company-level signal but never an unreviewed lending bank proxy",()=>{
    const dates=["2025-09-30","2025-12-31","2026-03-31","2026-06-30"]
    const rows=dates.flatMap((date,i)=>[
      fact(date,"OPERATING_REVENUE_QUARTER",String(100+i*10)),
      fact(date,"NET_PROFIT_QUARTER",String(25+i*5)),
    ])
    for (const [sector,industry] of [
      ["Financial Services","Financial Technology (Fintech)"],
      ["Financial Services","Stockbroking & Allied"],
      ["Energy","Power Generation"],
    ] as const) {
      const assessment=graded(rows,sector,industry)
      expect(assessment.basis).toBe("COMPANY_TREND")
      expect(assessment.status).toBe("STRONG")
    }
    expect(graded(rows,"Financial Services","NBFC").status).toBe("UNAVAILABLE")
    expect(graded(rows,"Energy","Solar Mining").status).toBe("UNAVAILABLE")
  })

  it("grades March, June and September 2025 using only earlier source-coherent company evidence",()=>{
    const dates=["2024-09-30","2024-12-31","2025-03-31","2025-06-30","2025-09-30"]
    const rows=dates.flatMap((q,i)=>[
      fact(q,"OPERATING_REVENUE_QUARTER",String(100+i*10)),
      fact(q,"NET_PROFIT_QUARTER",String(20+i*5)),
    ])
    for(const end of ["2025-03-31","2025-06-30","2025-09-30"]){
      const grade=gradeQuarterR5(rows,"s1",end,"Capital Goods","Industrial Products",new Map())
      expect(grade.status).toBe("STRONG")
      expect(grade.basis).toBe("COMPANY_TREND")
      expect(grade.sampleSize).toBeGreaterThanOrEqual(2)
      expect(grade.sampleSize).toBeLessThanOrEqual(3)
    }
    const older=gradeQuarterR5(rows,"s1","2024-12-31","Capital Goods","Industrial Products",new Map())
    expect(older.status).toBe("UNAVAILABLE")
    expect(gradeQuarterR5(rows,"s1","2025-03-30","Capital Goods","Industrial Products",new Map()).status).toBe("UNAVAILABLE")
  })

  it("never calibrates a historical quarter using future reports or future peer distributions",()=>{
    const dates=["2024-09-30","2024-12-31","2025-03-31","2025-06-30","2025-09-30","2025-12-31","2026-03-31","2026-06-30"]
    const peers=[0,1,2,3].map(i=>({securityId:"issuer"+i,sector:"Capital Goods",industry:"Industrial Products"}))
    const make=(leak:boolean)=>peers.flatMap((p,i)=>dates.flatMap((q,j)=>{
      const future=j>=5
      const sourceId=p.securityId+q
      const rev=String(future&&leak?999999+i*100:100+i*5+j*7)
      const pat=String(future&&leak?9999+i*50:30+i*3+j*2)
      return [
        {...fact(q,"OPERATING_REVENUE_QUARTER",rev),securityId:p.securityId,id:sourceId+"top",sourceRecordId:sourceId},
        {...fact(q,"NET_PROFIT_QUARTER",pat),securityId:p.securityId,id:sourceId+"pat",sourceRecordId:sourceId},
      ]
    }))
    const a=make(false), b=make(true)
    const historicalEnd="2025-09-30"
    const ca=buildIndustryR5Calibrations(a,peers,historicalEnd)
    const cb=buildIndustryR5Calibrations(b,peers,historicalEnd)
    expect([...ca]).toEqual([...cb])
    expect(ca.size).toBe(1)
    const rolling=buildRollingIndustryR5Calibrations(b,peers,["2025-09-30","2026-06-30"])
    expect(rolling.get("2025-09-30|CAPITAL GOODS::INDUSTRIAL PRODUCTS")).toEqual(ca.get("CAPITAL GOODS::INDUSTRIAL PRODUCTS"))
    const grade=gradeQuarterR5(a,peers[0]!.securityId,historicalEnd,"Capital Goods","Industrial Products",rolling)
    expect(grade.basis).toBe("INDUSTRY_PEER")
    expect(grade.sampleSize).toBe(12)
  })

  it("fails closed when an older source or quarter is absent, conflicted or not selected",()=>{
    const dates=["2024-09-30","2024-12-31","2025-03-31"]
    const rows=dates.flatMap((q,i)=>[
      fact(q,"OPERATING_REVENUE_QUARTER",String(100+i*10)),
      fact(q,"NET_PROFIT_QUARTER",String(10+i*4)),
    ])
    const grade=(data:readonly ResultsSourceObservation[])=>gradeQuarterR5(data,"s1","2025-03-31","Capital Goods","Industrial Products",new Map())
    expect(grade(rows).status).toBe("STRONG")
    expect(grade(rows.filter(r=>r.periodEnd!=="2024-09-30")).status).toBe("UNAVAILABLE")
    expect(grade(rows.map(r=>r.periodEnd==="2024-12-31"&&r.code==="NET_PROFIT_QUARTER"?{...r,selected:false}:r)).status).toBe("UNAVAILABLE")
    expect(grade(rows.map(r=>r.periodEnd==="2024-12-31"&&r.code==="NET_PROFIT_QUARTER"?{...r,sourceRecordId:"other-original"}:r)).status).toBe("UNAVAILABLE")
  })

  it("uses the pre-approved own-company trend, never peer percentiles, if a calibrated group's PAT baseline cannot support a growth percentage",()=>{
    const dates=["2025-09-30","2025-12-31","2026-03-31","2026-06-30"]
    const revenues=[100,112,126,140]
    const profits=[-4,2,-2,7]
    const rows=dates.flatMap((date,i)=>[
      fact(date,"OPERATING_REVENUE_QUARTER",String(revenues[i])),
      fact(date,"NET_PROFIT_QUARTER",String(profits[i])),
    ])
    const result=gradeQuarterR5(rows,"s1","2026-06-30","Pharma","Pharmaceuticals",policy("Pharma","Pharmaceuticals"))
    expect(result.basis).toBe("COMPANY_TREND")
    expect(result.status).not.toBe("UNAVAILABLE")
    expect(result.sampleSize).toBeGreaterThanOrEqual(2)
    expect(result.explanation).toContain("no peer percentile assigned")
    expect(result.explanation).toContain("NOT an industry percentile")
  })
  it("does not allow a peer-comparison fallback to evade missing-source or one-comparison requirements",()=>{
    const dates=["2025-09-30","2025-12-31","2026-03-31","2026-06-30"]
    const rows=dates.flatMap((date,i)=>[
      fact(date,"OPERATING_REVENUE_QUARTER",String(110+i*10)),
      fact(date,"NET_PROFIT_QUARTER",String(i%2===0?-5:5)),
    ])
    const withoutBaseline=rows.filter(row=>row.periodEnd!=="2025-12-31")
    const graded=(data:readonly ResultsSourceObservation[])=>gradeQuarterR5(data,"s1","2026-06-30","Pharma","Pharmaceuticals",policy("Pharma","Pharmaceuticals"))
    expect(graded(withoutBaseline).status).toBe("UNAVAILABLE")
    const inconsistent=rows.map(row=>row.periodEnd==="2026-03-31"&&row.code==="NET_PROFIT_QUARTER"?
      {...row,sourceRecordId:"unrelated-issuer-document"}:row)
    expect(graded(inconsistent).status).toBe("UNAVAILABLE")
    expect(graded(rows.map(row=>row.periodEnd==="2026-06-30"&&row.code==="NET_PROFIT_QUARTER"?
      {...row,selected:false}:row)).status).toBe("UNAVAILABLE")
  })

  it("grades insurance only with its own verified original operating metric and two historical comparisons",()=>{
    const dates=["2024-09-30","2024-12-31","2025-03-31","2025-06-30"]
    const premium=dates.flatMap((date,i)=>[
      fact(date,"NET_PREMIUM_EARNED_QUARTER",String(100+i*20),"STANDALONE"),
      fact(date,"NET_PROFIT_QUARTER",String(20+i*5),"STANDALONE"),
    ])
    const insurance=gradeQuarterR5(premium,"s1","2025-06-30","Financial Services","General Insurance",new Map())
    expect(insurance.status).toBe("STRONG")
    expect(insurance.basis).toBe("COMPANY_TREND")
    expect(insurance.supportingMetrics).toContain("NET_PREMIUM_EARNED_QUARTER")
    expect(insurance.explanation).toContain("underwriting quality are NOT assessed")
    const revenueOnly=premium.map(r=>r.code==="NET_PREMIUM_EARNED_QUARTER"
      ? {...r,code:"OPERATING_REVENUE_QUARTER"}:r)
    expect(gradeQuarterR5(revenueOnly,"s1","2025-06-30","Financial Services","General Insurance",new Map()).status).toBe("UNAVAILABLE")
    const incoherent=premium.map(r=>r.periodEnd==="2025-03-31"&&r.code==="NET_PROFIT_QUARTER"
      ? {...r,sourceRecordId:"other-original"}:r)
    expect(gradeQuarterR5(incoherent,"s1","2025-06-30","Financial Services","General Insurance",new Map()).status).toBe("UNAVAILABLE")
    const life=dates.flatMap((date,i)=>[
      fact(date,"OPERATING_REVENUE_QUARTER",String(200+i*10)),
      fact(date,"NET_PROFIT_QUARTER",String(30+i*3)),
    ])
    const lifeGrade=gradeQuarterR5(life,"s1","2025-06-30","Financial Services","Life Insurance",new Map())
    expect(lifeGrade.status).toBe("STRONG")
    expect(lifeGrade.explanation).toContain("solvency")
    expect(lifeGrade.explanation).toContain("No insurer-strength, peer or investment rating")
  })

  it("supports evidence-only Revenue/PAT company trends for explicitly reviewed non-bank finance without bank-NII proxies",()=>{
    const dates=["2025-09-30","2025-12-31","2026-03-31","2026-06-30"]
    const rows=dates.flatMap((date,i)=>[
      fact(date,"OPERATING_REVENUE_QUARTER",String(100+i*20)),
      fact(date,"NET_PROFIT_QUARTER",String(20+i*5)),
    ])
    for(const group of ["Non Banking Financial Company (NBFC)","Asset Management Company",
      "Asset Management Cos.","Financial Institutions","Investment Company","Housing Finance Company"]){
      const result=graded(rows,"Financial Services",group,
        policy("Financial Services",group))
      expect(result.status).toBe("STRONG")
      expect(result.basis).toBe("COMPANY_TREND")
      expect(result.explanation).toContain("LIMITED NON-BANK FINANCIAL OPERATING TREND")
      expect(result.explanation).toContain("prudential strength are NOT assessed")
      expect(result.explanation).toContain("NOT an industry percentile")
    }
    const incomplete=rows.filter(r=>r.periodEnd!=="2025-12-31")
    expect(graded(incomplete,"Financial Services","Non Banking Financial Company (NBFC)").status).toBe("UNAVAILABLE")
    expect(graded(rows,"Financial Services","General Insurance").status).toBe("UNAVAILABLE")
    expect(graded(rows,"Financial Services","Life Insurance").status).toBe("STRONG")
    expect(graded(rows,"Financial Services","Unknown Lender").status).toBe("UNAVAILABLE")
  })

})

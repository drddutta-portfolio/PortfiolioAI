import {describe,expect,it} from "vitest"
import {parseOverview} from "./trendlyne"

describe("P7 IC2 MAXHEALTH remediation contract",()=>{
  it("recognizes the exact frozen Trendlyne identity",()=>{
    const result=parseOverview("stockData:\nMax Healthcare Institute Ltd.,276825,x,MAXHEALTH,543220,INE027H01010,x,x,x,x,x,x,x,x,x,x,x,Healthcare Facilities")
    expect(result.identity).toMatchObject({stockId:"276825",symbol:"MAXHEALTH",isin:"INE027H01010"})
  })
  it("rejects a wrong Trendlyne stock id from exact-remediation comparison",()=>{
    const result=parseOverview("stockData:\nMax Healthcare Institute Ltd.,9999,x,MAXHEALTH,543220,INE027H01010,x,x,x,x,x,x,x,x,x,x,x,Healthcare Facilities")
    expect(result.identity.stockId).not.toBe("276825")
  })
})

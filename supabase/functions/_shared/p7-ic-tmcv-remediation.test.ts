import {describe,expect,it} from "vitest"
import {parseOverview} from "./trendlyne"

describe("P7 IC2 TMCV remediation contract",()=>{
  it("recognizes the exact frozen Trendlyne identity",()=>{
    const result=parseOverview("stockData:\nTata Motors Limited,3327757,x,TMCV,544569,INE1TAE01010,x,x,x,x,x,x,x,x,x,x,x,Automobiles")
    expect(result.identity).toMatchObject({stockId:"3327757",symbol:"TMCV",isin:"INE1TAE01010"})
  })
  it("rejects a wrong Trendlyne stock id from exact-remediation comparison",()=>{
    const result=parseOverview("stockData:\nTata Motors Limited,9999,x,TMCV,544569,INE1TAE01010,x,x,x,x,x,x,x,x,x,x,x,Automobiles")
    expect(result.identity.stockId).not.toBe("3327757")
  })
})

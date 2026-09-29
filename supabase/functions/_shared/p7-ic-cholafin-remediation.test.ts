import {describe,expect,it} from "vitest"
import {parseOverview} from "./trendlyne"

describe("P7 IC2 CHOLAFIN remediation contract",()=>{
  it("recognizes exact Trendlyne identity despite canonical display-name alias",()=>{
    const result=parseOverview("stockData:\nCholamandalam Investment & Finance Company Ltd.,262,x,CHOLAFIN,511243,INE121A01024,x,x,x,x,x,x,x,x,x,x,x,Finance")
    expect(result.identity).toMatchObject({stockId:"262",symbol:"CHOLAFIN",isin:"INE121A01024"})
  })
  it("rejects wrong stock id",()=>{
    const result=parseOverview("stockData:\nCholamandalam Investment & Finance Company Ltd.,9999,x,CHOLAFIN,511243,INE121A01024,x,x,x,x,x,x,x,x,x,x,x,Finance")
    expect(result.identity.stockId).not.toBe("262")
  })
})

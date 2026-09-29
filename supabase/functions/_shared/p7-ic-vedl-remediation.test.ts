import {describe,expect,it} from "vitest"
import {parseOverview} from "./trendlyne"

describe("P7 IC2 VEDL remediation contract",()=>{
  it("recognizes the exact frozen Trendlyne identity",()=>{
    const result=parseOverview("stockData:\nVedanta Ltd.,1289,x,VEDL,500295,INE205A01025,x,x,x,x,x,x,x,x,x,x,x,Mining")
    expect(result.identity).toMatchObject({stockId:"1289",symbol:"VEDL",isin:"INE205A01025"})
  })
  it("rejects a wrong Trendlyne stock id from exact-remediation comparison",()=>{
    const result=parseOverview("stockData:\nVedanta Ltd.,9999,x,VEDL,500295,INE205A01025,x,x,x,x,x,x,x,x,x,x,x,Mining")
    expect(result.identity.stockId).not.toBe("1289")
  })
})

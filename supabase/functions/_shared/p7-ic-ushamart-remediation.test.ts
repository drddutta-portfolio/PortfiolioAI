import {describe,expect,it} from "vitest"
import {parseOverview} from "./trendlyne"

describe("P7 IC2 USHAMART remediation contract",()=>{
  it("recognizes the exact frozen Trendlyne identity",()=>{
    const result=parseOverview("stockData:\nUsha Martin Ltd.,1456,x,USHAMART,517146,INE228A01035,x,x,x,x,x,x,x,x,x,x,x,Metals")
    expect(result.identity).toMatchObject({stockId:"1456",symbol:"USHAMART",isin:"INE228A01035"})
  })
  it("rejects a wrong Trendlyne stock id from exact-remediation comparison",()=>{
    const result=parseOverview("stockData:\nUsha Martin Ltd.,9999,x,USHAMART,517146,INE228A01035,x,x,x,x,x,x,x,x,x,x,x,Metals")
    expect(result.identity.stockId).not.toBe("1456")
  })
})

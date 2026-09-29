import {describe,expect,it} from "vitest"
import {parseOverview} from "./trendlyne"

describe("P7 IC2 HAL remediation contract",()=>{
  it("recognizes the exact frozen Trendlyne identity",()=>{
    const result=parseOverview("stockData:\nHindustan Aeronautics Ltd.,80502,x,HAL,541154,INE066F01020,x,x,x,x,x,x,x,x,x,x,x,Aerospace & Defence")
    expect(result.identity).toMatchObject({stockId:"80502",symbol:"HAL",isin:"INE066F01020"})
  })
  it("rejects a wrong Trendlyne stock id",()=>{
    const result=parseOverview("stockData:\nHindustan Aeronautics Ltd.,9999,x,HAL,541154,INE066F01020,x,x,x,x,x,x,x,x,x,x,x,Aerospace & Defence")
    expect(result.identity.stockId).not.toBe("80502")
  })
})

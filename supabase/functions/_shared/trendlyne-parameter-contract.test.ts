import {describe,expect,it,vi} from "vitest"
import {TrendlyneMcpClient} from "./trendlyne"
import {TRENDLYNE_PARAMETER_TARGETS,TRENDLYNE_PARAMETER_TOOLS,hasVerifiedTrendlyneFieldName,trendlyneParameterTarget} from "./trendlyne-parameter-contract"

function mockMcpFetcher(toolResult:string){
  const responses=[
    new Response(JSON.stringify({jsonrpc:"2.0",id:1,result:{}}),{status:200,headers:{"mcp-session-id":"session-1"}}),
    new Response("",{status:200,headers:{"mcp-session-id":"session-1"}}),
    new Response(JSON.stringify({jsonrpc:"2.0",id:2,result:{structuredContent:{result:toolResult}}}),{status:200,headers:{"mcp-session-id":"session-1"}}),
  ]
  return vi.fn(async()=>responses.shift()??new Response("",{status:500}))
}

describe("Trendlyne parameter discovery contract",()=>{
  it("keeps every target field name unverified until subscribed discovery is reviewed",()=>{
    expect(TRENDLYNE_PARAMETER_TARGETS.length).toBeGreaterThan(10)
    expect(TRENDLYNE_PARAMETER_TARGETS.every(target=>target.verifiedFieldName===null)).toBe(true)
    expect(hasVerifiedTrendlyneFieldName("ROCE_ANNUAL")).toBe(false)
  })

  it("keeps ROCE distinct from ROIC and industry ROCE",()=>{
    const target=trendlyneParameterTarget("ROCE_ANNUAL")
    expect(target?.searchQuery).toBe("ROCE Annual %")
    expect(target?.expectedVerboseNames).toEqual(["ROCE Annual %"])
  })

  it("does not silently equate long-term debt/equity with a generic total debt/equity contract",()=>{
    const target=trendlyneParameterTarget("DEBT_EQUITY")
    expect(target?.notes).toMatch(/not automatically equivalent/i)
    expect(target?.verifiedFieldName).toBeNull()
  })

  it("uses the documented search_parameters MCP tool without promoting the returned text",async()=>{
    const fetcher=mockMcpFetcher("field_name | verbose_name\nroce_field | ROCE Annual %")
    const client=new TrendlyneMcpClient("https://provider.invalid",fetcher as unknown as typeof fetch)
    const result=await client.searchParameters("ROCE Annual %")
    expect(result).toContain("ROCE Annual %")
    const bodies=fetcher.mock.calls.map(call=>JSON.parse(String((call[1] as RequestInit).body)) as {method?:string;params?:{name?:string;arguments?:Record<string,unknown>}})
    expect(bodies.at(-1)?.params).toEqual({name:TRENDLYNE_PARAMETER_TOOLS.searchParameters,arguments:{query:"ROCE Annual %",source_table:"stockprofile"}})
    expect(hasVerifiedTrendlyneFieldName("ROCE_ANNUAL")).toBe(false)
  })

  it("uses get_parameter_values only with explicit provider source refs and reviewed field-name inputs",async()=>{
    const fetcher=mockMcpFetcher("value")
    const client=new TrendlyneMcpClient("https://provider.invalid",fetcher as unknown as typeof fetch)
    await client.getParameterValues([{source_table:"stockprofile",source_id:533}],["reviewed_field_name"])
    const body=JSON.parse(String((fetcher.mock.calls.at(-1)?.[1] as RequestInit).body)) as {params?:{name?:string;arguments?:Record<string,unknown>}}
    expect(body.params).toEqual({name:TRENDLYNE_PARAMETER_TOOLS.getParameterValues,arguments:{stocks:[{source_table:"stockprofile",source_id:533}],parameters:["reviewed_field_name"]}})
  })
})

import {describe,expect,it} from "vitest"
import {TrendlyneObservedMcpClient} from "./trendlyne-observed"

const jsonResponse=(body:unknown,headers:Record<string,string>={})=>new Response(JSON.stringify(body),{status:200,headers})

describe("observed Trendlyne MCP adapter",()=>{
  it("lists and validates native capabilities without executing a provider tool",async()=>{
    const calls:Record<string,unknown>[]=[]
    let valid=true
    const fetcher:typeof fetch=async(_input,init)=>{
      const payload=JSON.parse(String(init?.body));calls.push(payload)
      if(payload.method==="initialize")return jsonResponse({jsonrpc:"2.0",id:1,result:{}},{"mcp-session-id":"s1"})
      if(payload.method==="notifications/initialized")return new Response("",{status:200})
      return jsonResponse({jsonrpc:"2.0",id:2,result:{tools:valid?[{name:"native_financial",inputSchema:{type:"object"}}]:[]}})
    }
    const client=new TrendlyneObservedMcpClient("https://example.invalid",fetcher)
    expect(JSON.parse(await client.listAvailableTools()).tools[0].name).toBe("native_financial")
    expect(calls.at(-1)?.method).toBe("tools/list")
    expect(calls.some(p=>p.method==="tools/call")).toBe(false)
    valid=false;await expect(client.listAvailableTools()).rejects.toThrow("PROVIDER_TOOL_CATALOG_MISSING")
  })
  it("calls the production-observed parameter tool name and schema",async()=>{
    const calls:unknown[]=[]
    const fetcher:typeof fetch=async(_input,init)=>{
      const payload=JSON.parse(String(init?.body))
      calls.push(payload)
      if(payload.method==="initialize") return jsonResponse({jsonrpc:"2.0",id:1,result:{}},{"mcp-session-id":"s1"})
      if(payload.method==="notifications/initialized") return new Response("",{status:200})
      return jsonResponse({jsonrpc:"2.0",id:2,result:{structuredContent:{result:"ok"}}})
    }
    const client=new TrendlyneObservedMcpClient("https://example.invalid",fetcher)
    await expect(client.getParameterValuesMultiStock("HDFCBANK ROCE","stock")).resolves.toBe("ok")
    expect(calls.at(-1)).toMatchObject({method:"tools/call",params:{name:"get_parameter_values_multi_stock",arguments:{query:"HDFCBANK ROCE",type:"stock"}}})
  })

  it("uses source-discovered exact tokens and NSE selectors within provider limits",async()=>{
    const calls:Record<string,unknown>[]=[]
    const fetcher:typeof fetch=async(_input,init)=>{
      const payload=JSON.parse(String(init?.body));calls.push(payload)
      if(payload.method==="initialize")return jsonResponse({result:{}},{"mcp-session-id":"exact"})
      if(payload.method==="notifications/initialized")return new Response("",{status:200})
      return jsonResponse({result:{structuredContent:{result:"ok"}}})
    }
    const client=new TrendlyneObservedMcpClient("https://example.invalid",fetcher)
    await client.searchFinancialParameters("ROE Annual percent")
    expect(calls.at(-1)).toMatchObject({params:{name:"search_financial_parameters",arguments:{query:"ROE Annual percent"}}})
    await client.getStockParameterValues(["SBIN"],["roea","roaa"])
    expect(calls.at(-1)).toMatchObject({params:{name:"get_stock_parameter_values",arguments:{stock_codes:["SBIN"],parameters:["roea","roaa"]}}})
    const before=calls.length
    await expect(client.getStockParameterValues([], ["roea"])).rejects.toThrow("PROVIDER_EXACT_PARAMETER_SCOPE_INVALID")
    await expect(client.getStockParameterValues(["SBIN"],Array(11).fill("roea"))).rejects.toThrow("PROVIDER_EXACT_PARAMETER_SCOPE_INVALID")
    expect(calls.length).toBe(before)
  })

  it("rejects text-level unknown-tool responses as provider contract failures",async()=>{
    const fetcher:typeof fetch=async(_input,init)=>{
      const payload=JSON.parse(String(init?.body))
      if(payload.method==="initialize") return jsonResponse({jsonrpc:"2.0",id:1,result:{}},{"mcp-session-id":"s1"})
      if(payload.method==="notifications/initialized") return new Response("",{status:200})
      return jsonResponse({jsonrpc:"2.0",id:2,result:{structuredContent:{result:"Unknown tool: 'something'"}}})
    }
    const client=new TrendlyneObservedMcpClient("https://example.invalid",fetcher)
    await expect(client.getParameterValuesMultiStock("HDFCBANK ROCE")).rejects.toThrow("PROVIDER_TOOL_CONTRACT_ERROR")
  })
})

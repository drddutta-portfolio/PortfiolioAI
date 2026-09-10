import {describe,expect,it} from "vitest"
import {TrendlyneObservedMcpClient} from "./trendlyne-observed"

const jsonResponse=(body:unknown,headers:Record<string,string>={})=>new Response(JSON.stringify(body),{status:200,headers})

describe("observed Trendlyne MCP adapter",()=>{
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

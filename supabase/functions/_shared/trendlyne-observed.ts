export type TrendlyneEntityType = "stock" | "etf" | "index"

const decodeMcpResult = (body: string): unknown => {
  let payload: Record<string, unknown>
  try {
    const events = body.split(/\r?\n/).map(x => x.trim()).filter(x => x.startsWith("data:")).map(x => x.slice(5).trim()).filter(x => x && x !== "[DONE]")
    payload = (events.length ? events.map(JSON.parse).at(-1) : JSON.parse(body)) as Record<string, unknown>
  } catch {
    throw new Error("PROVIDER_PROTOCOL_ERROR")
  }
  if (!payload) throw new Error("PROVIDER_PROTOCOL_ERROR")
  if (payload.error) throw new Error("PROVIDER_RPC_ERROR")
  return payload.result
}

const assertBusinessSuccess = (text: string) => {
  const normalized = text.trim().toLowerCase()
  if (normalized.startsWith("unknown tool:") || normalized.includes("tool not found") || normalized.includes("method not found")) {
    throw new Error("PROVIDER_TOOL_CONTRACT_ERROR")
  }
}

export class TrendlyneObservedMcpClient {
  #session: string | null = null
  #next = 1

  constructor(private readonly endpoint: string, private readonly fetcher: typeof fetch = fetch) {}

  async #post(payload: unknown): Promise<unknown> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "Accept": "application/json, text/event-stream",
      "User-Agent": "PortfolioAI/1.0",
    }
    if (this.#session) headers["Mcp-Session-Id"] = this.#session

    let response: Response
    try {
      response = await this.fetcher(this.endpoint, { method: "POST", headers, body: JSON.stringify(payload) })
    } catch {
      throw new Error("PROVIDER_NETWORK_ERROR")
    }
    if (!response.ok) throw new Error(`PROVIDER_HTTP_${response.status}`)
    this.#session = response.headers.get("mcp-session-id") ?? this.#session
    const body = await response.text()
    return body.trim() ? decodeMcpResult(body) : null
  }

  async initialize(): Promise<void> {
    await this.#post({
      jsonrpc: "2.0",
      id: this.#next++,
      method: "initialize",
      params: {
        protocolVersion: "2025-03-26",
        capabilities: {},
        clientInfo: { name: "PortfolioAI", version: "1" },
      },
    })
    await this.#post({ jsonrpc: "2.0", method: "notifications/initialized", params: {} })
  }


  async call(name: string, args: Readonly<Record<string, unknown>>): Promise<string> {
    if (!this.#session) await this.initialize()
    const result = await this.#post({ jsonrpc: "2.0", id: this.#next++, method: "tools/call", params: { name, arguments: args } }) as {
      content?: { type: string; text?: string }[]
      structuredContent?: { result?: string }
    }
    const text = result?.structuredContent?.result ?? result?.content?.find(x => x.type === "text")?.text
    if (typeof text !== "string") throw new Error("PROVIDER_RESULT_MISSING")
    assertBusinessSuccess(text)
    return text
  }

  async searchEntities(query: string, entityType: TrendlyneEntityType = "stock", limit = 10): Promise<string> {
    return this.call("search_entities", { query, entity_type: entityType, limit })
  }

  async getParameterValuesMultiStock(query: string, type: TrendlyneEntityType = "stock"): Promise<string> {
    return this.call("get_parameter_values_multi_stock", { query, type })
  }

  async getOverviewNewsCorpEvents(stockCode: string, type: "overview" | "technical" | "news" | "events"): Promise<string> {
    return this.call("get_overview_news_corp_events", { stock_code: stockCode, type })
  }

  async getOwnershipDealsInsiderSast(stockCode: string, type: "shareholding" | "sast" | "bulblockdeal"): Promise<string> {
    return this.call("get_ownership_deals_insider_sast", { stock_code: stockCode, type })
  }

  async getDocumentSearchResults(query: string): Promise<string> {
    return this.call("get_document_search_results", { query })
  }
}

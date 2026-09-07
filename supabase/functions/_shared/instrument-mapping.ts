export interface CanonicalSecurity {
  readonly id: string
  readonly symbol: string
  readonly exchange: string
  readonly assetClass: string
}

interface AngelInstrument {
  readonly token?: unknown
  readonly symbol?: unknown
  readonly name?: unknown
  readonly expiry?: unknown
  readonly strike?: unknown
  readonly lotsize?: unknown
  readonly instrumenttype?: unknown
  readonly exch_seg?: unknown
  readonly tick_size?: unknown
}

export interface InstrumentMappingCandidate {
  readonly securityId: string
  readonly providerInstrumentId: string | null
  readonly exchange: string | null
  readonly tradingSymbol: string | null
  readonly providerInstrumentType: string | null
  readonly mappingStatus: "VERIFIED" | "UNRESOLVED" | "AMBIGUOUS"
  readonly matchBasis: "EXCHANGE_SYMBOL_EXACT" | null
  readonly evidence: Readonly<Record<string, unknown>>
}

function text(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null
}

function supportedCashInstrument(instrument: AngelInstrument) {
  const exchange = text(instrument.exch_seg)
  const expiry = text(instrument.expiry)
  return (exchange === "NSE" || exchange === "BSE") && expiry === null
}

export function mapAngelInstruments(
  securities: readonly CanonicalSecurity[],
  master: readonly AngelInstrument[],
  instrumentMasterRetrievedAt: string,
): InstrumentMappingCandidate[] {
  const eligible = securities.filter((security) =>
    (security.assetClass === "EQUITY" || security.assetClass === "ETF")
    && (security.exchange === "NSE" || security.exchange === "BSE"))
  const candidates = new Map<string, AngelInstrument[]>()
  master.forEach((instrument) => {
    if (!supportedCashInstrument(instrument)) return
    const exchange = text(instrument.exch_seg)
    const canonicalSymbol = text(instrument.name)
    if (!exchange || !canonicalSymbol) return
    const key = `${exchange}:${canonicalSymbol.toUpperCase()}`
    candidates.set(key, [...(candidates.get(key) ?? []), instrument])
  })
  return eligible.map((security) => {
    const matches = candidates.get(`${security.exchange}:${security.symbol.toUpperCase()}`) ?? []
    const evidence = {
      method: "Exact equality of canonical exchange + canonical symbol to Angel One exch_seg + name",
      canonical_exchange: security.exchange,
      canonical_symbol: security.symbol,
      instrument_master_retrieved_at: instrumentMasterRetrievedAt,
      candidate_count: matches.length,
      candidates: matches.slice(0, 10).map((instrument) => ({
        token: text(instrument.token), symbol: text(instrument.symbol), name: text(instrument.name),
        exchange: text(instrument.exch_seg), instrument_type: text(instrument.instrumenttype),
      })),
    }
    if (matches.length !== 1) return {
      securityId: security.id,
      providerInstrumentId: null,
      exchange: security.exchange,
      tradingSymbol: null,
      providerInstrumentType: null,
      mappingStatus: matches.length ? "AMBIGUOUS" as const : "UNRESOLVED" as const,
      matchBasis: null,
      evidence,
    }
    const match = matches[0]!
    return {
      securityId: security.id,
      providerInstrumentId: text(match.token),
      exchange: text(match.exch_seg),
      tradingSymbol: text(match.symbol),
      providerInstrumentType: text(match.instrumenttype),
      mappingStatus: "VERIFIED" as const,
      matchBasis: "EXCHANGE_SYMBOL_EXACT" as const,
      evidence,
    }
  })
}

import { afterEach, describe, expect, it, vi } from "vitest"
import { AngelOneProvider, clearAngelSession, nextKolkataMidnight, sessionExpiresAt } from "./angel-one.ts"

const config = { apiKey: "key", clientCode: "client", pin: "pin", totpSecret: "JBSWY3DPEHPK3PXP", clientLocalIp: "127.0.0.1", clientPublicIp: "203.0.113.1", macAddress: "00:00:00:00:00:00" }
const instrument = { mappingId: "m", securityId: "s", providerInstrumentId: "1", exchange: "NSE", tradingSymbol: "ABC-EQ" }

function jwt(expSeconds: number) {
  return `x.${btoa(JSON.stringify({ exp: expSeconds })).replace(/=/gu, "")}.x`
}

afterEach(() => { vi.restoreAllMocks(); clearAngelSession() })

describe("Angel One session lifecycle", () => {
  it("expires at the earliest of JWT exp, short TTL, and Kolkata midnight", () => {
    const now = Date.parse("2026-09-07T18:20:00.000Z") // 23:50 IST
    expect(nextKolkataMidnight(now)).toBe(Date.parse("2026-09-07T18:30:00.000Z"))
    expect(sessionExpiresAt(jwt((now + 60_000) / 1000), now)).toBe(now + 60_000)
    expect(sessionExpiresAt(jwt((now + 60 * 60_000) / 1000), now)).toBe(nextKolkataMidnight(now))
  })

  it("reauthenticates exactly once after a recognized expired session", async () => {
    const token = jwt(Date.now() / 1000 + 3600)
    const fetchMock = vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(new Response(JSON.stringify({ status: true, data: { jwtToken: token } }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ status: false, errorcode: "AG8001", message: "expired" }), { status: 403 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ status: true, data: { jwtToken: token } }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ status: true, data: { fetched: [] } }), { status: 200 }))
    await expect(new AngelOneProvider(config).getLatestPrices([instrument])).resolves.toEqual([])
    expect(fetchMock).toHaveBeenCalledTimes(4)
  })

  it("does not retry a second session failure", async () => {
    const token = jwt(Date.now() / 1000 + 3600)
    const fetchMock = vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(new Response(JSON.stringify({ status: true, data: { jwtToken: token } }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ status: false, errorcode: "AG8001" }), { status: 403 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ status: true, data: { jwtToken: token } }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ status: false, errorcode: "AG8001" }), { status: 403 }))
    const request = new AngelOneProvider(config).getLatestPrices([instrument])
    await expect(request).rejects.toMatchObject({ code: "ANGEL_SESSION_EXPIRED", message: "Market-data provider request failed." })
    expect(fetchMock).toHaveBeenCalledTimes(4)
  })
})

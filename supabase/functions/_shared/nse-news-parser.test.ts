import { describe, expect, it } from "vitest"
import { buildHeadline, categoryFromSubject, normalizeCompanyName, parseNseCorporateAnnouncements, parseNsePublishedAt } from "./nse-news-parser.ts"

describe("NSE news parser", () => {
  it("normalizes conservative legal suffixes", () => {
    expect(normalizeCompanyName("HDFC Bank Limited")).toBe("HDFC BANK")
    expect(normalizeCompanyName("HDFC Bank Ltd.")).toBe("HDFC BANK")
  })

  it("parses NSE local publication time exactly", () => {
    expect(parseNsePublishedAt("12-Sep-2026 20:39:47")).toBe("2026-09-12T15:09:47.000Z")
    expect(parseNsePublishedAt("bad-date")).toBeNull()
  })

  it("maps observed management subject deterministically", () => {
    expect(categoryFromSubject("Change in Directors/KMP/SMP/Auditor/RTA")).toBe("MANAGEMENT")
  })

  it("parses observed HDFC Bank RSS item without inference", () => {
    const xml = `<rss><channel><item><title>HDFC Bank Limited</title><link>https://nsearchives.nseindia.com/corporate/xbrl/CIM_797_WebXMLFile_20260912_203946350.xml</link><description>HDFC Bank Limited has informed the Exchange about Change in Directors/KMP/SMP/Auditor/RTA |SUBJECT: Change in Directors/KMP/SMP/Auditor/RTA</description><pubDate>12-Sep-2026 20:39:47</pubDate></item></channel></rss>`
    const rows = parseNseCorporateAnnouncements(xml)
    expect(rows).toHaveLength(1)
    expect(rows[0]).toEqual({
      companyName: "HDFC Bank Limited",
      sourceUrl: "https://nsearchives.nseindia.com/corporate/xbrl/CIM_797_WebXMLFile_20260912_203946350.xml",
      description: "HDFC Bank Limited has informed the Exchange about Change in Directors/KMP/SMP/Auditor/RTA",
      subject: "Change in Directors/KMP/SMP/Auditor/RTA",
      publishedAt: "2026-09-12T15:09:47.000Z",
      publicationPrecision: "DATETIME",
      category: "MANAGEMENT",
    })
    expect(buildHeadline(rows[0])).toBe("HDFC Bank Limited: Change in Directors/KMP/SMP/Auditor/RTA")
  })

  it("rejects malformed and non-NSE archive items", () => {
    const xml = `<rss><channel>
      <item><title>A</title><link>https://example.com/a.pdf</link><description>Hello |SUBJECT: General Updates</description><pubDate>12-Sep-2026 20:39:47</pubDate></item>
      <item><title>B</title><link>https://nsearchives.nseindia.com/corporate/b.pdf</link><description>Hello</description></item>
    </channel></rss>`
    expect(parseNseCorporateAnnouncements(xml)).toHaveLength(0)
  })
})

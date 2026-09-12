import { describe, expect, it } from "vitest"
import { buildHeadline, categoryFromSubject, importanceFromItem, normalizeCompanyName, parseNseCorporateAnnouncements, parseNsePublishedAt, toneFromItem } from "./nse-news-parser.ts"

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
    expect(importanceFromItem(rows[0])).toBe("NOTABLE")
    expect(toneFromItem(rows[0])).toEqual({
      state: "NEUTRAL",
      method: "DETERMINISTIC",
      confidence: 0.9,
      reason: "Management-change disclosure without explicit positive or negative language.",
    })
  })

  it("classifies only explicit positive and negative event language", () => {
    const positive = {
      companyName: "Example Limited",
      sourceUrl: "https://nsearchives.nseindia.com/corporate/order.pdf",
      description: "Example Limited has received an order from a customer",
      subject: "Order Received",
      publishedAt: "2026-09-12T15:09:47.000Z",
      publicationPrecision: "DATETIME" as const,
      category: "ORDER_CONTRACT" as const,
    }
    const negative = {
      ...positive,
      sourceUrl: "https://nsearchives.nseindia.com/corporate/rating.pdf",
      description: "Credit rating downgraded following default",
      subject: "Credit Rating Downgrade",
      category: "CREDIT_RATING" as const,
    }
    const ambiguous = {
      ...positive,
      sourceUrl: "https://nsearchives.nseindia.com/corporate/results.pdf",
      description: "Financial results for the quarter",
      subject: "Financial Results",
      category: "RESULTS" as const,
    }

    expect(toneFromItem(positive).state).toBe("POSITIVE")
    expect(importanceFromItem(positive)).toBe("NOTABLE")
    expect(toneFromItem(negative).state).toBe("NEGATIVE")
    expect(importanceFromItem(negative)).toBe("IMPORTANT")
    expect(toneFromItem(ambiguous).state).toBe("UNCLASSIFIED")
    expect(importanceFromItem(ambiguous)).toBe("IMPORTANT")
  })

  it("rejects malformed and non-NSE archive items", () => {
    const xml = `<rss><channel>
      <item><title>A</title><link>https://example.com/a.pdf</link><description>Hello |SUBJECT: General Updates</description><pubDate>12-Sep-2026 20:39:47</pubDate></item>
      <item><title>B</title><link>https://nsearchives.nseindia.com/corporate/b.pdf</link><description>Hello</description></item>
    </channel></rss>`
    expect(parseNseCorporateAnnouncements(xml)).toHaveLength(0)
  })
})

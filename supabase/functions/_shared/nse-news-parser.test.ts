import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts"
import { buildHeadline, categoryFromSubject, normalizeCompanyName, parseNseCorporateAnnouncements, parseNsePublishedAt } from "./nse-news-parser.ts"

Deno.test("normalizes conservative legal suffixes", () => {
  assertEquals(normalizeCompanyName("HDFC Bank Limited"), "HDFC BANK")
  assertEquals(normalizeCompanyName("HDFC Bank Ltd."), "HDFC BANK")
})

Deno.test("parses NSE local publication time exactly", () => {
  assertEquals(parseNsePublishedAt("12-Sep-2026 20:39:47"), "2026-09-12T15:09:47.000Z")
  assertEquals(parseNsePublishedAt("bad-date"), null)
})

Deno.test("maps observed management subject deterministically", () => {
  assertEquals(categoryFromSubject("Change in Directors/KMP/SMP/Auditor/RTA"), "MANAGEMENT")
})

Deno.test("parses observed HDFC Bank RSS item without inference", () => {
  const xml = `<rss><channel><item><title>HDFC Bank Limited</title><link>https://nsearchives.nseindia.com/corporate/xbrl/CIM_797_WebXMLFile_20260912_203946350.xml</link><description>HDFC Bank Limited has informed the Exchange about Change in Directors/KMP/SMP/Auditor/RTA |SUBJECT: Change in Directors/KMP/SMP/Auditor/RTA</description><pubDate>12-Sep-2026 20:39:47</pubDate></item></channel></rss>`
  const rows = parseNseCorporateAnnouncements(xml)
  assertEquals(rows.length, 1)
  assertEquals(rows[0], {
    companyName: "HDFC Bank Limited",
    sourceUrl: "https://nsearchives.nseindia.com/corporate/xbrl/CIM_797_WebXMLFile_20260912_203946350.xml",
    description: "HDFC Bank Limited has informed the Exchange about Change in Directors/KMP/SMP/Auditor/RTA",
    subject: "Change in Directors/KMP/SMP/Auditor/RTA",
    publishedAt: "2026-09-12T15:09:47.000Z",
    publicationPrecision: "DATETIME",
    category: "MANAGEMENT",
  })
  assertEquals(buildHeadline(rows[0]), "HDFC Bank Limited: Change in Directors/KMP/SMP/Auditor/RTA")
})

Deno.test("rejects malformed and non-NSE archive items", () => {
  const xml = `<rss><channel>
    <item><title>A</title><link>https://example.com/a.pdf</link><description>Hello |SUBJECT: General Updates</description><pubDate>12-Sep-2026 20:39:47</pubDate></item>
    <item><title>B</title><link>https://nsearchives.nseindia.com/corporate/b.pdf</link><description>Hello</description></item>
  </channel></rss>`
  assertEquals(parseNseCorporateAnnouncements(xml).length, 0)
})

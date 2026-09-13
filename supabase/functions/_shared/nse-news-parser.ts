export interface ParsedNseNewsItem {
  readonly companyName: string
  readonly sourceUrl: string
  readonly description: string
  readonly subject: string | null
  readonly publishedAt: string
  readonly publicationPrecision: "DATETIME"
  readonly category: "RESULTS" | "CORPORATE_ACTION" | "MANAGEMENT" | "ORDER_CONTRACT" | "FUND_RAISE" | "MA_INVESTMENT" | "CREDIT_RATING" | "SHAREHOLDING_INSIDER" | "LITIGATION_GOVERNANCE" | "UNCLASSIFIED"
}

export type NewsImportanceState = "UNCLASSIFIED" | "ROUTINE" | "NOTABLE" | "IMPORTANT"
export type NewsToneState = "POSITIVE" | "NEUTRAL" | "NEGATIVE" | "UNCLASSIFIED"

export interface DeterministicToneResult {
  readonly state: NewsToneState
  readonly method: "DETERMINISTIC" | "UNCLASSIFIED"
  readonly confidence: number | null
  readonly reason: string | null
}

const MONTHS: Readonly<Record<string, string>> = {
  Jan: "01", Feb: "02", Mar: "03", Apr: "04", May: "05", Jun: "06",
  Jul: "07", Aug: "08", Sep: "09", Oct: "10", Nov: "11", Dec: "12",
}

function decodeXml(value: string): string {
  return value
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&apos;", "'")
    .replace(/&#(\d+);/g, (_match, code) => String.fromCharCode(Number(code)))
    .trim()
}

function text(tag: string, item: string): string | null {
  const match = item.match(new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`, "i"))
  return match ? decodeXml(match[1]) : null
}

function classifierText(item: ParsedNseNewsItem): string {
  return `${item.subject ?? ""} ${item.description}`.toUpperCase()
}

export function normalizeCompanyName(value: string): string {
  return value
    .toUpperCase()
    .replace(/&/g, " AND ")
    .replace(/\b(LIMITED|LTD|LTD\.)\b/g, " ")
    .replace(/[^A-Z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

export function parseNsePublishedAt(value: string): string | null {
  const match = value.trim().match(/^(\d{2})-([A-Za-z]{3})-(\d{4})\s+(\d{2}):(\d{2}):(\d{2})$/)
  if (!match) return null
  const [, day, monthName, year, hour, minute, second] = match
  const month = MONTHS[monthName[0].toUpperCase() + monthName.slice(1, 3).toLowerCase()]
  if (!month) return null
  const localIso = `${year}-${month}-${day}T${hour}:${minute}:${second}+05:30`
  const date = new Date(localIso)
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

export function categoryFromSubject(subject: string | null): ParsedNseNewsItem["category"] {
  if (!subject) return "UNCLASSIFIED"
  const value = subject.toUpperCase()
  if (/FINANCIAL RESULTS|RESULTS/.test(value)) return "RESULTS"
  if (/CHANGE IN DIRECTORS|KMP|SMP|AUDITOR|RTA/.test(value)) return "MANAGEMENT"
  if (/RECORD DATE|CORPORATE ACTION|DIVIDEND/.test(value)) return "CORPORATE_ACTION"
  if (/CREDIT RATING|RATING/.test(value)) return "CREDIT_RATING"
  if (/ORDER|CONTRACT|LETTER OF AWARD|LOA/.test(value)) return "ORDER_CONTRACT"
  if (/FUND RAIS|PREFERENTIAL|QIP/.test(value)) return "FUND_RAISE"
  if (/ACQUISITION|MERGER|INVESTMENT/.test(value)) return "MA_INVESTMENT"
  if (/SHAREHOLDING|INSIDER TRADING/.test(value)) return "SHAREHOLDING_INSIDER"
  if (/LITIGATION|FINE|PENALTY|GOVERNANCE/.test(value)) return "LITIGATION_GOVERNANCE"
  return "UNCLASSIFIED"
}

export function importanceFromItem(item: ParsedNseNewsItem): NewsImportanceState {
  const value = classifierText(item)
  if (/DOWNGRADE|DEFAULT|FRAUD|INSOLVENC|LIQUIDATION|PENALTY|\bFINE\b/.test(value)) return "IMPORTANT"
  if (item.category === "RESULTS" || item.category === "FUND_RAISE" || item.category === "MA_INVESTMENT") return "IMPORTANT"
  if (item.category === "MANAGEMENT" && /\b(CEO|CHIEF EXECUTIVE OFFICER|MD|MANAGING DIRECTOR|CFO|CHIEF FINANCIAL OFFICER|CHAIRMAN|WHOLE[- ]TIME DIRECTOR)\b/.test(value)) return "IMPORTANT"
  if (["CORPORATE_ACTION", "MANAGEMENT", "ORDER_CONTRACT", "CREDIT_RATING", "LITIGATION_GOVERNANCE"].includes(item.category)) return "NOTABLE"
  if (item.category === "SHAREHOLDING_INSIDER") return "ROUTINE"
  return "UNCLASSIFIED"
}

export function toneFromItem(item: ParsedNseNewsItem): DeterministicToneResult {
  const value = classifierText(item)
  if (/DOWNGRADE|DEFAULT|PENALTY|\bFINE\b|FRAUD|INSOLVENC|LIQUIDATION|CANCELLATION|TERMINATION|ADVERSE ORDER/.test(value)) {
    return { state: "NEGATIVE", method: "DETERMINISTIC", confidence: 0.95, reason: "Explicit negative event language in NSE announcement." }
  }
  if (/RATING UPGRADE|UPGRADED.*RATING|ORDER RECEIVED|RECEIVED.*ORDER|CONTRACT AWARDED|AWARDED.*CONTRACT|LETTER OF AWARD|DIVIDEND DECLARED|DIVIDEND RECOMMENDED|RECOMMENDED.*DIVIDEND/.test(value)) {
    return { state: "POSITIVE", method: "DETERMINISTIC", confidence: 0.95, reason: "Explicit positive event language in NSE announcement." }
  }
  if (/RECORD DATE|SHAREHOLDING PATTERN|BOARD MEETING|ANALYST.*MEET|INVESTOR.*MEET/.test(value)) {
    return { state: "NEUTRAL", method: "DETERMINISTIC", confidence: 0.9, reason: "Explicit administrative or informational event language in NSE announcement." }
  }
  if (item.category === "MANAGEMENT" && /CHANGE IN DIRECTORS|KMP|SMP|AUDITOR|RTA/.test(value)) {
    return { state: "NEUTRAL", method: "DETERMINISTIC", confidence: 0.9, reason: "Management-change disclosure without explicit positive or negative language." }
  }
  return { state: "UNCLASSIFIED", method: "UNCLASSIFIED", confidence: null, reason: null }
}

export function parseNseCorporateAnnouncements(xml: string): ParsedNseNewsItem[] {
  const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)]
  const parsed: ParsedNseNewsItem[] = []
  for (const match of items) {
    const body = match[1]
    const companyName = text("title", body)
    const sourceUrl = text("link", body)
    const rawDescription = text("description", body)
    const rawPublishedAt = text("pubDate", body)
    if (!companyName || !sourceUrl || !rawDescription || !rawPublishedAt) continue
    if (!sourceUrl.startsWith("https://nsearchives.nseindia.com/")) continue
    const publishedAt = parseNsePublishedAt(rawPublishedAt)
    if (!publishedAt) continue
    const subjectMatch = rawDescription.match(/\s*\|SUBJECT:\s*(.+?)\s*$/i)
    const subject = subjectMatch?.[1]?.trim() || null
    const description = subjectMatch ? rawDescription.slice(0, subjectMatch.index).trim() : rawDescription.trim()
    if (!description) continue
    parsed.push({
      companyName,
      sourceUrl,
      description,
      subject,
      publishedAt,
      publicationPrecision: "DATETIME",
      category: categoryFromSubject(subject),
    })
  }
  return parsed
}

export function buildHeadline(item: ParsedNseNewsItem): string {
  if (item.subject) return `${item.companyName}: ${item.subject}`.slice(0, 1000)
  return `${item.companyName}: ${item.description}`.slice(0, 1000)
}

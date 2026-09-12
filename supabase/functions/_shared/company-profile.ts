export type ScreenerCompanyProfile = {
  readonly about: string | null
  readonly websiteUrl: string | null
}

const MAX_ABOUT_LENGTH = 3000

export function decodeHtmlEntities(value: string) {
  return value
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code: string) => String.fromCodePoint(Number.parseInt(code, 16)))
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
}

export function htmlToPlainText(value: string) {
  return decodeHtmlEntities(
    value
      .replace(/<script\b[\s\S]*?<\/script>/gi, " ")
      .replace(/<style\b[\s\S]*?<\/style>/gi, " ")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/p\s*>/gi, "\n")
      .replace(/<[^>]+>/g, " "),
  )
    .replace(/[\t\r ]+/g, " ")
    .replace(/\n\s+/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
}

function clampAbout(value: string) {
  const cleaned = value
    .replace(/^About\s*/i, "")
    .replace(/\s+/g, " ")
    .trim()
  if (!cleaned) return null
  if (cleaned.length <= MAX_ABOUT_LENGTH) return cleaned
  const clipped = cleaned.slice(0, MAX_ABOUT_LENGTH)
  const sentence = clipped.lastIndexOf(". ")
  return `${(sentence > 400 ? clipped.slice(0, sentence + 1) : clipped).trim()}`
}

function extractAboutFragment(html: string) {
  const classPattern = /<div\b[^>]*class=["'][^"']*\bsub\b[^"']*\bshow-more-box\b[^"']*\babout\b[^"']*["'][^>]*>([\s\S]*?)<\/div>\s*<\/div>/i
  const classMatch = html.match(classPattern)
  if (classMatch?.[1]) return classMatch[1]

  const aboutClassPattern = /<(?:div|section)\b[^>]*class=["'][^"']*\babout\b[^"']*["'][^>]*>([\s\S]*?)(?=<(?:div|section|h2|h3)\b[^>]*(?:class=["'][^"']*(?:key-points|company-ratios)|id=["'](?:peers|quarters|profit-loss))|$)/i
  const aboutClassMatch = html.match(aboutClassPattern)
  if (aboutClassMatch?.[1]) return aboutClassMatch[1]

  const headingPattern = /<(?:h2|h3|div)\b[^>]*>\s*About\s*<\/(?:h2|h3|div)>([\s\S]*?)(?=<(?:h2|h3|div)\b[^>]*>\s*(?:Key Points|Peer comparison|Quarterly Results)\s*<|$)/i
  const headingMatch = html.match(headingPattern)
  return headingMatch?.[1] ?? null
}

function safeExternalHttpUrl(raw: string, baseUrl: string) {
  try {
    const url = new URL(decodeHtmlEntities(raw), baseUrl)
    if (url.protocol !== "https:" && url.protocol !== "http:") return null
    if (url.username || url.password) return null
    const host = url.hostname.toLocaleLowerCase()
    if (!host || host === "localhost" || host.endsWith(".local") || host.endsWith(".internal")) return null
    if (/^(?:127\.|10\.|0\.|169\.254\.|192\.168\.)/.test(host)) return null
    if (/^172\.(?:1[6-9]|2\d|3[01])\./.test(host)) return null
    if (host === "::1" || host.startsWith("fc") || host.startsWith("fd") || host.startsWith("fe80:")) return null
    return url.toString()
  } catch {
    return null
  }
}

export function extractScreenerCompanyProfile(html: string, pageUrl: string): ScreenerCompanyProfile {
  const fragment = extractAboutFragment(html)
  const about = fragment ? clampAbout(htmlToPlainText(fragment)) : null

  let websiteUrl: string | null = null
  const companyInfo = html.match(/<div\b[^>]*id=["']company-info["'][^>]*>([\s\S]*?)(?=<section\b|<div\b[^>]*id=["']company-ratios["']|$)/i)?.[1] ?? html.slice(0, Math.min(html.length, 150_000))
  const anchors = [...companyInfo.matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)]
  for (const anchor of anchors) {
    const href = anchor[1] ?? ""
    const label = htmlToPlainText(anchor[2] ?? "").toLocaleLowerCase()
    const candidate = safeExternalHttpUrl(href, pageUrl)
    if (!candidate) continue
    const host = new URL(candidate).hostname.toLocaleLowerCase()
    if (host.endsWith("screener.in") || host.endsWith("bseindia.com") || host.endsWith("nseindia.com")) continue
    if (label.includes("website") || !websiteUrl) websiteUrl = candidate
    if (label.includes("website")) break
  }

  return { about, websiteUrl }
}

function attribute(tag: string, name: string) {
  const quoted = tag.match(new RegExp(`${name}\\s*=\\s*["']([^"']+)["']`, "i"))
  if (quoted?.[1]) return quoted[1]
  return tag.match(new RegExp(`${name}\\s*=\\s*([^\\s>]+)`, "i"))?.[1] ?? null
}

export function extractLogoCandidates(html: string, websiteUrl: string) {
  const candidates: string[] = []
  const add = (raw: string | null) => {
    if (!raw) return
    const resolved = safeExternalHttpUrl(raw, websiteUrl)
    if (!resolved || candidates.includes(resolved)) return
    candidates.push(resolved)
  }

  const imageTags = [...html.matchAll(/<img\b[^>]*>/gi)].map(match => match[0])
  for (const tag of imageTags) {
    const signature = `${attribute(tag, "src") ?? ""} ${attribute(tag, "alt") ?? ""} ${attribute(tag, "class") ?? ""} ${attribute(tag, "id") ?? ""}`.toLocaleLowerCase()
    if (signature.includes("logo") || signature.includes("brand")) add(attribute(tag, "src"))
  }

  const linkTags = [...html.matchAll(/<link\b[^>]*>/gi)].map(match => match[0])
  for (const tag of linkTags) {
    const rel = (attribute(tag, "rel") ?? "").toLocaleLowerCase()
    if (rel.includes("icon")) add(attribute(tag, "href"))
  }

  const metaTags = [...html.matchAll(/<meta\b[^>]*>/gi)].map(match => match[0])
  for (const tag of metaTags) {
    const property = `${attribute(tag, "property") ?? ""} ${attribute(tag, "name") ?? ""}`.toLocaleLowerCase()
    if (property.includes("og:image") || property.includes("twitter:image")) add(attribute(tag, "content"))
  }

  try {
    const root = new URL(websiteUrl)
    add(new URL("/favicon.ico", root).toString())
  } catch {
    // ignored
  }

  return candidates.slice(0, 8)
}

export function publicHttpUrl(value: string) {
  return safeExternalHttpUrl(value, value)
}

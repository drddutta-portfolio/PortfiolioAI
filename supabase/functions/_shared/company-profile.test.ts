import { describe, expect, it } from "vitest"
import { extractLogoCandidates, extractScreenerCompanyProfile, extractWebsiteDescription, htmlToPlainText, publicHttpUrl } from "./company-profile.ts"

describe("company profile helpers", () => {
  it("extracts Screener About and official website", () => {
    const html = `
      <div id="company-info">
        <div class="company-links">
          <a href="https://examplebank.test">Website</a>
          <a href="https://www.bseindia.com/stock-share-price/x/1">BSE</a>
        </div>
        <div class="sub show-more-box about">
          <div class="title">About</div>
          <p>Example Bank provides retail &amp; corporate banking services.</p>
          <p>It operates across India.</p>
        </div>
      </div>
      <section id="peers"></section>
    `
    const profile = extractScreenerCompanyProfile(html, "https://www.screener.in/company/EXAMPLE/")
    expect(profile.about).toBe("Example Bank provides retail & corporate banking services. It operates across India.")
    expect(profile.websiteUrl).toBe("https://examplebank.test/")
  })

  it("extracts official website description fallback", () => {
    expect(
      extractWebsiteDescription('<meta name="description" content="Example &amp; Company makes useful products for customers across India.">'),
    ).toBe("Example & Company makes useful products for customers across India.")
  })

  it("extracts likely company logo candidates in priority order", () => {
    const html = `
      <html><head>
        <link rel="icon" href="/favicon.png">
        <meta property="og:image" content="/social-card.jpg">
      </head><body>
        <img class="header-logo" alt="Example logo" src="/assets/logo.svg">
      </body></html>
    `
    expect(extractLogoCandidates(html, "https://example.com/investors")).toEqual([
      "https://example.com/assets/logo.svg",
      "https://example.com/favicon.png",
      "https://example.com/social-card.jpg",
      "https://example.com/favicon.ico",
    ])
  })

  it("rejects private or local URLs", () => {
    expect(publicHttpUrl("http://127.0.0.1/a")).toBeNull()
    expect(publicHttpUrl("http://192.168.1.5/a")).toBeNull()
    expect(publicHttpUrl("https://company.example/a")).toBe("https://company.example/a")
  })

  it("plain text decoder removes markup and entities", () => {
    expect(htmlToPlainText("<p>A &amp; B</p><p>C&nbsp;D</p>")).toBe("A & B\nC D")
  })
})

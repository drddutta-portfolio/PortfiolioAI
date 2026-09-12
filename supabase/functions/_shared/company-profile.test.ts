import { assertEquals } from "jsr:@std/assert@1"
import { extractLogoCandidates, extractScreenerCompanyProfile, htmlToPlainText, publicHttpUrl } from "./company-profile.ts"

Deno.test("extracts Screener About and official website", () => {
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
  assertEquals(profile.about, "Example Bank provides retail & corporate banking services. It operates across India.")
  assertEquals(profile.websiteUrl, "https://examplebank.test/")
})

Deno.test("extracts likely company logo candidates in priority order", () => {
  const html = `
    <html><head>
      <link rel="icon" href="/favicon.png">
      <meta property="og:image" content="/social-card.jpg">
    </head><body>
      <img class="header-logo" alt="Example logo" src="/assets/logo.svg">
    </body></html>
  `
  assertEquals(extractLogoCandidates(html, "https://example.com/investors"), [
    "https://example.com/assets/logo.svg",
    "https://example.com/favicon.png",
    "https://example.com/social-card.jpg",
    "https://example.com/favicon.ico",
  ])
})

Deno.test("rejects private or local URLs", () => {
  assertEquals(publicHttpUrl("http://127.0.0.1/a"), null)
  assertEquals(publicHttpUrl("http://192.168.1.5/a"), null)
  assertEquals(publicHttpUrl("https://company.example/a"), "https://company.example/a")
})

Deno.test("plain text decoder removes markup and entities", () => {
  assertEquals(htmlToPlainText("<p>A &amp; B</p><p>C&nbsp;D</p>"), "A & B\n C D")
})

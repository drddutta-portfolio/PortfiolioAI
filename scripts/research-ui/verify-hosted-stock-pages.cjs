/* Hosted-only UI acceptance. Read temporary access/app credentials from stdin;
   never write cookies, tokens, passwords or network traces to artifacts. */
const fs = require('node:fs/promises')
const path = require('node:path')
const readline = require('node:readline/promises')
const { chromium } = require('playwright')

const ORIGIN = 'https://portfiolio-ai-git-portfolioai-development-dibyendu-dutta.vercel.app'
const STOCKS = [
  { symbol: 'HDFCBANK', id: 'b47b007d-1990-4504-a5a2-4391c07687c5' },
  { symbol: 'TORNTPHARM', id: 'da69b3eb-0343-44f8-912c-288b826118cc' },
]
const WIDTHS = [390, 768, 1024, 1440]

async function main() {
  const input = readline.createInterface({ input: process.stdin, terminal: false })
  console.log('Awaiting one JSON line on stdin: shareUrl, email, password, outputDir, optional additionalStocks.')
  const { value: line } = await input[Symbol.asyncIterator]().next()
  input.close()
  const config = JSON.parse(line)
  const access = new URL(config.shareUrl || ORIGIN)
  if (access.origin !== ORIGIN || access.username || access.password) throw new Error('Only the Development origin is permitted')
  const output = path.resolve(config.outputDir || '/tmp/portfolioai-g5-hosted')
  if (!output.startsWith('/tmp/')) throw new Error('Private visual artifacts must stay outside the repository in /tmp')
  await fs.mkdir(output, { recursive: true, mode: 0o700 })
  const report = { origin: ORIGIN, startedAt: new Date().toISOString(), status: 'INCOMPLETE', scope: 'Authenticated hosted application; no local server and no provider execution', checks: [], screenshots: [], runtimeErrors: 0, blockedProviderRequests: 0 }
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_EXECUTABLE_PATH || '/usr/bin/chromium', headless: true, proxy: process.env.HTTPS_PROXY || process.env.HTTP_PROXY ? { server: process.env.HTTPS_PROXY || process.env.HTTP_PROXY } : undefined, args: ['--no-sandbox', '--disable-dev-shm-usage'] })
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' })
  const page = await context.newPage()
  page.on('pageerror', () => { report.runtimeErrors += 1 })
  await context.route('**/functions/v1/**', route => {
    const request = route.request()
    const endpoint = new URL(request.url()).pathname.split('/').pop()
    const body = request.postData() ? request.postDataJSON() : null
    if (request.method() === 'OPTIONS' || endpoint === 'p6-terminal-disposition-read' || (endpoint === 'refresh-market-data' && body?.action === 'READ_CACHE')) return route.continue()
    report.blockedProviderRequests += 1; return route.abort()
  })
  const check = (name, pass, detail = undefined) => report.checks.push({ name, pass: Boolean(pass), ...(detail === undefined ? {} : { detail }) })
  async function capture(name) {
    const file = `${name}.png`
    await page.screenshot({ path: path.join(output, file), fullPage: true })
    await page.screenshot({ path: path.join(output, `${name}-viewport.png`), fullPage: false })
    report.screenshots.push(file)
  }
  async function layout(name) {
    const measured = await page.evaluate(() => {
      const title = document.querySelector('.research-title h1')
      const style = title ? getComputedStyle(title) : null
      return { viewport: window.innerWidth, pageWidth: document.documentElement.scrollWidth, title: title ? { width: title.clientWidth, scrollWidth: title.scrollWidth, whiteSpace: style.whiteSpace, textOverflow: style.textOverflow, maxHeight: style.maxHeight, overflowWrap: style.overflowWrap, lineClamp: style.webkitLineClamp } : null }
    })
    check(`${name}: no page overflow`, measured.pageWidth <= measured.viewport + 1, measured)
    check(`${name}: complete wrapping title`, measured.title && measured.title.scrollWidth <= measured.title.width + 1 && measured.title.whiteSpace !== 'nowrap' && measured.title.textOverflow !== 'ellipsis' && ['none', ''].includes(measured.title.lineClamp))
  }
  async function jump(label, expectedId) {
    await page.getByRole('navigation', { name: 'Stock page sections' }).getByRole('link', { name: label, exact: true }).click()
    const focused = await page.waitForFunction(id => document.activeElement?.id === id, expectedId, { timeout: 8000 }).then(() => true, () => false)
    check(`Jump ${label}: focus`, focused)
    const geometry = await page.evaluate(id => {
      const menu = document.querySelector('.stock-section-navigator').getBoundingClientRect()
      const target = document.getElementById(id).getBoundingClientRect()
      return { menuBottom: menu.bottom, targetTop: target.top, targetHeight: target.height }
    }, expectedId)
    check(`Jump ${label}: focus and sticky clearance`, geometry.targetHeight > 0 && geometry.targetTop >= geometry.menuBottom - 1, geometry)
  }
  try {
    await page.goto(access.href, { waitUntil: 'domcontentloaded', timeout: 45000 })
    if (new URL(page.url()).origin !== ORIGIN) {
      report.status = 'BLOCKED_VERCEL_AUTH'
      check('Development access', false, 'Redirected to Vercel authentication; application not inspected')
      return
    }
    await page.goto(`${ORIGIN}/app/research/${STOCKS[0].id}`, { waitUntil: 'domcontentloaded' })
    await page.waitForFunction(() => location.pathname === '/login' || document.querySelector('.research-title h1'), null, { timeout: 30000 })
    if (new URL(page.url()).pathname === '/login') {
      if (!config.email || !config.password) { report.status = 'BLOCKED_APP_AUTH'; return }
      await page.locator('input[name="email"]').fill(config.email)
      await page.locator('input[name="password"]').fill(config.password)
      await page.getByRole('button', { name: /sign in|log in/i }).click()
      await page.waitForURL(url => url.origin === ORIGIN && url.pathname.startsWith('/app/'), { timeout: 30000 })
    }
    const additional = config.additionalStocks || []
    if (!Array.isArray(additional) || additional.some(stock => !/^[a-zA-Z0-9-]+$/.test(stock.id) || !/^[a-zA-Z0-9_-]+$/.test(stock.symbol))) throw new Error('Additional stocks must use validated IDs and artifact labels')
    for (const stock of [...STOCKS, ...additional]) {
      await page.goto(`${ORIGIN}/app/research/${stock.id}`, { waitUntil: 'domcontentloaded' })
      await page.locator('.research-title h1').waitFor({ timeout: 30000 })
      await page.waitForFunction(() => ![...document.querySelectorAll('.research-page .portfolio-loading')].some(el => el.getClientRects().length), null, { timeout: 30000 })
      const title = await page.locator('.research-title h1').textContent()
      check(`${stock.symbol}: common shell`, await page.locator('.research-workspace-shell').count() === 1 && await page.getByRole('tab').count() === 7)
      for (const width of WIDTHS) {
        await page.setViewportSize({ width, height: 1000 })
        await page.evaluate(() => window.scrollTo(0, 0))
        await layout(`${stock.symbol}-${width}`)
        await capture(`${stock.symbol}-${width}-overview`)
      }
      await page.setViewportSize({ width: 1440, height: 1000 })
      for (const [label, id] of [['Summary', 'stock-summary'], ['Position', 'stock-position'], ['Owner plan & suggestion', 'stock-plan'], ['Refresh', 'stock-refresh'], ['Research health', 'stock-health'], ['Documents', 'stock-documents'], ['Evidence', 'stock-evidence']]) await jump(label, id)
      await page.getByRole('tab', { name: 'Overview', exact: true }).click()
      await page.getByRole('tab', { name: 'Overview', exact: true }).focus()
      await page.keyboard.press('End')
      check(`${stock.symbol}: keyboard tabs`, await page.getByRole('tab', { name: 'Evidence', exact: true }).getAttribute('aria-selected') === 'true' && await page.getByRole('tab', { name: 'Evidence', exact: true }).evaluate(el => el === document.activeElement))
      const status = page.getByLabel('Status', { exact: true })
      if (await status.count()) await status.selectOption('CONFLICTING')
      await capture(`${stock.symbol}-evidence`)
      await page.getByRole('tab', { name: 'Documents', exact: true }).click()
      await capture(`${stock.symbol}-documents`)
      await page.getByRole('tab', { name: 'Overview', exact: true }).click()
      const capabilities = page.locator('.refresh-capabilities')
      if (await capabilities.count()) await capabilities.evaluate(el => { el.open = true })
      await page.setViewportSize({ width: 390, height: 1000 })
      await layout(`${stock.symbol}-390-expanded-refresh`)
      await capture(`${stock.symbol}-390-expanded-refresh`)
      await page.evaluate(() => window.scrollTo(0, 0))
      for (const [index, stressName] of ['SRHHYPLTD', 'EXTREMELYLONGUNBROKENSTOCKSYMBOLFORWRAPPING', 'International Speciality Research and Manufacturing Company Limited'].entries()) {
        await page.locator('.research-title h1').evaluate((el, text) => { el.textContent = text }, stressName)
        await layout(`${stock.symbol}-long-name-${index}`)
        await capture(`${stock.symbol}-long-name-${index}`)
      }
      await page.locator('.research-title h1').evaluate((el, text) => { el.textContent = text }, title)
      await page.setViewportSize({ width: 1440, height: 1000 })
      await page.evaluate(() => { document.body.style.zoom = '200%' })
      await layout(`${stock.symbol}-200-percent-css-zoom-stress`)
      await capture(`${stock.symbol}-200-percent-css-zoom-stress`)
      await page.evaluate(() => { document.body.style.zoom = '' })
      // Inspect a cached-read failure in the hosted build without altering storage.
      await context.route('**/rest/v1/fundamental_observations?**', route => route.abort())
      await page.reload({ waitUntil: 'domcontentloaded' })
      await page.getByText('Cached research could not be loaded.', { exact: true }).waitFor({ timeout: 30000 })
      check(`${stock.symbol}: injected cached-read error retains shell`, await page.getByRole('tab').count() === 7 && await page.locator('#stock-specialist').count() === 1)
      await capture(`${stock.symbol}-injected-cache-error`)
      await context.unroute('**/rest/v1/fundamental_observations?**')
    }
    check('No automatic provider execution', report.blockedProviderRequests === 0)
    check('No browser runtime errors', report.runtimeErrors === 0)
    report.status = report.checks.every(item => item.pass) ? 'AUTOMATED_CHECKS_PASS_VISUAL_REVIEW_REQUIRED' : 'FAIL'
  } catch (error) {
    report.status = 'INCOMPLETE'
    check('Browser workflow completed', false, { error: error.name, pathname: new URL(page.url()).pathname })
    await capture('workflow-stopped').catch(() => {})
  } finally {
    report.finishedAt = new Date().toISOString()
    await fs.writeFile(path.join(output, 'report.json'), JSON.stringify(report, null, 2), { mode: 0o600 })
    console.log(JSON.stringify({ status: report.status, checks: report.checks.length, failed: report.checks.filter(item => !item.pass).map(item => item.name), reportPath: path.join(output, 'report.json') }))
    await browser.close()
    if (!report.status.startsWith('AUTOMATED_CHECKS_PASS')) process.exitCode = 1
  }
}
main().catch(() => { console.error('Hosted verification could not initialise; no credentials were logged.'); process.exitCode = 1 })

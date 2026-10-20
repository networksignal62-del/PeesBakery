import { chromium } from 'playwright-core'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

const base = process.env.QA_BASE_URL || 'http://localhost:3005'
const browserPath = process.env.QA_BROWSER_PATH || 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
const output = path.resolve('work', 'browser-qa')
await mkdir(output, { recursive: true })

const browser = await chromium.launch({ executablePath: browserPath, headless: true })
const cases = [
  { width: 320, height: 568, routes: ['/', '/menu', '/contact'] },
  { width: 390, height: 844, routes: ['/', '/menu', '/contact', '/about'] },
  { width: 768, height: 1024, routes: ['/', '/menu', '/contact'] },
  { width: 1024, height: 600, routes: ['/', '/menu'] },
  { width: 1440, height: 900, routes: ['/', '/menu', '/contact', '/about', '/cart', '/wishlist', '/no-such-page'] },
]
const results = []

for (const test of cases) {
  const context = await browser.newContext({ viewport: { width: test.width, height: test.height }, deviceScaleFactor: 1 })
  for (const route of test.routes) {
    const page = await context.newPage()
    const issues = []
    page.on('pageerror', error => issues.push(`page: ${error.message}`))
    page.on('console', message => { if (message.type() === 'error') issues.push(`console: ${message.text()}`) })
    let status = null
    try {
      const response = await page.goto(new URL(route, base).href, { waitUntil: 'domcontentloaded', timeout: 45000 })
      status = response?.status() ?? null
      await page.waitForTimeout(1500)
      const details = await page.evaluate(() => ({
        title: document.title,
        description: document.querySelector('meta[name="description"]')?.getAttribute('content') || '',
        canonical: document.querySelector('link[rel="canonical"]')?.getAttribute('href') || '',
        ogImage: document.querySelector('meta[property="og:image"]')?.getAttribute('content') || '',
        icon: document.querySelector('link[rel="icon"]')?.getAttribute('href') || '',
        h1: [...document.querySelectorAll('h1')].map(node => node.textContent?.trim()),
        overflow: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) - innerWidth,
        brokenImages: [...document.images].filter(image => !image.complete || image.naturalWidth === 0).map(image => image.getAttribute('src')),
        missingAlt: [...document.images].filter(image => !image.hasAttribute('alt')).map(image => image.getAttribute('src')),
        localLinks: [...document.querySelectorAll('a[href]')].map(link => link.getAttribute('href')).filter(href => href?.startsWith('/')),
      }))
      const label = route === '/' ? 'home' : route.replaceAll('/', '-').replace(/^-/, '')
      if (['/', '/menu', '/contact'].includes(route)) {
        await page.screenshot({ path: path.join(output, `${test.width}-${label}.png`), fullPage: true })
      }
      results.push({ width: test.width, route, status, ...details, issues })
    } catch (error) {
      results.push({ width: test.width, route, status, error: String(error), issues })
    }
    await page.close()
  }
  await context.close()
}

for (const route of ['/admin', '/admin/login', '/robots.txt', '/sitemap.xml', '/opengraph-image']) {
  const response = await browser.newPage().then(async page => {
    const result = await page.request.get(new URL(route, base).href)
    await page.close()
    return result
  })
  results.push({ route, status: response.status(), contentType: response.headers()['content-type'] })
}

await browser.close()
await writeFile(path.join(output, 'results.json'), JSON.stringify(results, null, 2))
for (const result of results) {
  console.log(JSON.stringify({ width: result.width, route: result.route, status: result.status, overflow: result.overflow, brokenImages: result.brokenImages?.length, missingAlt: result.missingAlt?.length, h1: result.h1?.length, issues: result.issues?.length, error: result.error, contentType: result.contentType }))
}

import { gzipSync } from 'node:zlib'
import { chromium } from 'playwright-core'

const base = process.env.QA_BASE_URL || 'http://localhost:3006'
const browserPath = process.env.QA_BROWSER_PATH || 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
const browser = await chromium.launch({ executablePath: browserPath, headless: true })
try {
  for (const route of ['/', '/menu', '/contact', '/cart']) {
    const page = await browser.newPage()
    const scripts = []
    const pending = []
    page.on('response', response => {
      if (response.status() !== 200 || !response.url().startsWith(base) || !response.url().includes('/_next/static/') || !response.url().endsWith('.js')) return
      pending.push((async () => {
        try {
          const body = await response.body()
          scripts.push({ file: new URL(response.url()).pathname.split('/').at(-1), rawKB: Math.round(body.length / 1024), gzipKB: Math.round(gzipSync(body).length / 1024) })
        } catch { /* Ignore a response cancelled by navigation. */ }
      })())
    })
    await page.goto(new URL(route, base).href, { waitUntil: 'networkidle' })
    await Promise.allSettled(pending)
    const totalGzipKB = scripts.reduce((sum, script) => sum + script.gzipKB, 0)
    const largest = [...scripts].sort((a, b) => b.gzipKB - a.gzipKB).slice(0, 3)
    console.log(JSON.stringify({ route, scriptCount: scripts.length, totalGzipKB, largest }))
    await page.close()
  }
} finally {
  await browser.close()
}

import assert from 'node:assert/strict'
import { chromium } from 'playwright-core'

const base = process.env.QA_BASE_URL || 'http://localhost:3005'
const browserPath = process.env.QA_BROWSER_PATH || 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
const browser = await chromium.launch({ executablePath: browserPath, headless: true })
try {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
  await page.addInitScript(() => {
    window.__capturedWhatsAppUrl = ''
    window.open = url => { window.__capturedWhatsAppUrl = String(url); return null }
  })
  await page.goto(new URL('/contact', base).href)
  await page.getByRole('button', { name: 'Toggle menu' }).click()
  assert.equal(await page.getByRole('banner').getByRole('link', { name: 'Menu', exact: true }).isVisible(), true)
  await page.getByRole('button', { name: 'Toggle menu' }).click()
  await page.locator('#contact-name').fill('Test Customer')
  await page.locator('#contact-subject').fill('Opening hours')
  await page.locator('#contact-message').fill('Are you open tomorrow?')
  await page.getByRole('button', { name: 'Continue in WhatsApp' }).click()
  const captured = await page.evaluate(() => window.__capturedWhatsAppUrl)
  assert.match(captured, /^https:\/\/wa\.me\/23278891638\?text=/)
  const message = new URL(captured).searchParams.get('text') || ''
  assert.match(message, /Opening hours/)
  assert.match(message, /Are you open tomorrow\?/)
  assert.match(message, /Test Customer/)
  assert.equal(await page.getByRole('link', { name: 'Open WhatsApp and press send' }).isVisible(), true)
  await page.close()

  const missing = await browser.newPage()
  const response = await missing.goto(new URL('/missing-page-for-qa', base).href)
  assert.equal(response.status(), 404)
  await missing.getByRole('link', { name: 'Browse the menu' }).click()
  await missing.waitForURL('**/menu')
  await missing.close()
  console.log('Mobile navigation, contact WhatsApp draft, and 404 recovery link passed. No message was sent.')
} finally {
  await browser.close()
}

import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/admin', '/cart', '/checkout', '/wishlist', '/api/'] },
    sitemap: 'https://peesbakery.rest/sitemap.xml',
    host: 'https://peesbakery.rest',
  }
}

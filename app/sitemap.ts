import type { MetadataRoute } from 'next'
import { getProducts } from '@/lib/actions/products'

export const dynamic = 'force-dynamic'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const origin = 'https://peesbakery.rest'
  const pages: MetadataRoute.Sitemap = ['/', '/about', '/menu', '/contact'].map(path => ({
    url: origin + path,
    lastModified: new Date(),
    changeFrequency: path === '/menu' ? 'daily' : 'monthly',
    priority: path === '/' ? 1 : path === '/menu' ? 0.9 : 0.6,
  }))
  try {
    const products = await getProducts()
    if (products.success) {
      pages.push(...products.data.map(product => ({
        url: `${origin}/product/${product.id}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      })))
    }
  } catch {
    // Keep the public pages listed if the catalog is temporarily unavailable.
  }
  return pages
}

import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { getProductById } from '@/lib/actions/products'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const canonical = `/product/${encodeURIComponent(id)}`
  const productId = Number(id)
  const result = Number.isSafeInteger(productId) && productId > 0
    ? await getProductById(productId).catch(() => null)
    : null
  if (!result?.success || !result.data) return { title: 'Product unavailable', robots: { index: false, follow: false } }
  const product = result.data
  const description = product.description || `Explore ${product.name} on the Pee's Bakery menu in Freetown.`
  const image = product.image !== '/placeholder.svg' ? product.image : '/opengraph-image'
  return {
    title: product.name,
    description,
    alternates: { canonical },
    openGraph: { title: product.name, description, url: canonical, images: [{ url: image, alt: product.name }] },
    twitter: { card: 'summary_large_image', images: [image] },
  }
}

export default function ProductLayout({ children }: { children: ReactNode }) { return children }

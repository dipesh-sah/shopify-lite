
import { MetadataRoute } from 'next'
import { getProducts } from '@/lib/products'
import { getActiveCollections } from '@/lib/collections'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'

  // Fetch all active products
  const products = await getProducts({ status: 'active', limit: 1000 })
  const productEntries: MetadataRoute.Sitemap = products.map((product) => ({
    url: `${baseUrl}/products/${product.slug}`,
    lastModified: product.updatedAt,
    changeFrequency: 'daily',
    priority: 0.8,
  }))

  // Fetch all active collections
  const collections = await getActiveCollections()
  const collectionEntries: MetadataRoute.Sitemap = collections.map((collection) => ({
    url: `${baseUrl}/collections/${collection.slug}`,
    lastModified: collection.updatedAt,
    changeFrequency: 'weekly',
    priority: 0.7,
  }))

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/collections`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    // Add other static pages like about, contact if they exist
  ]

  return [...staticPages, ...collectionEntries, ...productEntries]
}

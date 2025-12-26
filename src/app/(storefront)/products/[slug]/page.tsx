
import { notFound } from "next/navigation"
import { getProductBySlugAction } from "@/actions/products"
import { getReviewsAction, getReviewStatsAction } from "@/actions/reviews"
import { getMetafieldsAction } from "@/actions/metadata"
import { ProductDetailClient } from "@/components/storefront/ProductDetailClient"
import { getSeoMetadata } from "@/lib/seo"
import { JsonLd } from "@/components/seo/JsonLd"
import { Metadata, ResolvingMetadata } from 'next'

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata(
  { params }: PageProps,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const resolvedParams = await params
  const product = await getProductBySlugAction(resolvedParams.slug)

  if (!product) {
    return {
      title: 'Product Not Found',
    }
  }

  const seo = await getSeoMetadata('product', product.id)

  return {
    title: seo?.title || product.title,
    description: seo?.description || product.description,
    openGraph: {
      title: seo?.title || product.title,
      description: seo?.description || product.description,
      images: product.images?.length > 0 ? [product.images[0].url] : [],
    },
    alternates: {
      canonical: (seo as any)?.alternates?.canonical || `${process.env.NEXT_PUBLIC_BASE_URL}/products/${product.slug}`
    }
  }
}

export default async function ProductPage({ params }: PageProps) {
  const resolvedParams = await params
  const product = await getProductBySlugAction(resolvedParams.slug)

  if (!product) {
    notFound()
  }

  const [reviews, reviewStats, metafieldsResult] = await Promise.all([
    getReviewsAction(product.id),
    getReviewStatsAction(product.id),
    getMetafieldsAction('product', product.id)
  ])

  const metafields = metafieldsResult.success ? metafieldsResult.data : []

  const seo = await getSeoMetadata('product', product.id)

  // JSON-LD for Product
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.title,
    image: product.images?.map((img: any) => img.url),
    description: product.description,
    sku: product.sku,
    brand: {
      '@type': 'Brand',
      name: product.vendor || 'Store',
    },
    offers: {
      '@type': 'Offer',
      url: `${process.env.NEXT_PUBLIC_BASE_URL}/products/${product.slug}`,
      priceCurrency: 'USD',
      price: product.price,
      itemCondition: 'https://schema.org/NewCondition',
      availability: product.quantity > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
    }
  }

  return (
    <>
      <JsonLd data={jsonLd} />
      <ProductDetailClient
        product={product}
        initialReviews={reviews}
        initialStats={reviewStats}
        metafields={metafields}
      />
    </>
  )
}

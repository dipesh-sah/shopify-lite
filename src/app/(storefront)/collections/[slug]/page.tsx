import { getCollectionBySlug } from "@/lib/collections"
import { notFound } from "next/navigation"
import { ShopClient } from "@/components/storefront/ShopClient"

interface CategoryPageProps {
  params: {
    slug: string
  }
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params
  const category = await getCollectionBySlug(resolvedParams.slug)

  if (!category) {
    notFound()
  }

  return (
    <ShopClient initialCategoryId={category.id} initialTitle={category.name} />
  )
}

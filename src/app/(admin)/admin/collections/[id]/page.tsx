import { getCollectionAction, getCollectionsAction } from "@/actions/collections"
import { getProductsAction } from "@/actions/products"
import { CollectionForm } from "@/components/admin/CollectionForm"
import { notFound } from "next/navigation"

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function EditCollectionPage({ params }: PageProps) {
  const { id } = await params
  const collection = await getCollectionAction(id)

  if (!collection) {
    notFound()
  }

  const products = collection.productIds && collection.productIds.length > 0
    ? await getProductsAction({ ids: collection.productIds }).then(res => res.products || [])
    : []

  return <CollectionForm collection={collection} initialSelectedProducts={products} />
}

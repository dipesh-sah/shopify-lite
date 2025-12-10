import { getCollectionAction, getCollectionsAction } from "@/actions/collections"
import { getProductsAction } from "@/actions/products"
import { CollectionForm } from "@/components/admin/CollectionForm"
import { notFound } from "next/navigation"

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function EditCollectionPage({ params }: PageProps) {
  const { id } = await params
  const [collection, products] = await Promise.all([
    getCollectionAction(id),
    getProductsAction()
  ])

  if (!collection) {
    notFound()
  }

  return <CollectionForm collection={collection} availableProducts={products} />
}

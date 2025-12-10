import { getProductsAction } from "@/actions/products"
import { CollectionForm } from "@/components/admin/CollectionForm"

export default async function NewCollectionPage() {
  const products = await getProductsAction()

  return <CollectionForm availableProducts={products} />
}

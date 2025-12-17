import { getProductsAction } from '@/actions/products'
import { InventoryTable } from '@/components/admin/InventoryTable'

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function InventoryPage(props: Props) {
  const searchParams = await props.searchParams
  const search = typeof searchParams.q === 'string' ? searchParams.q : undefined

  // Fetch products with search if needed
  const data = await getProductsAction({ search })
  const products = data.products || []

  // Build flattened inventory list
  const items = products.flatMap((p: any) => {
    const pImage = p.images && p.images[0] ? p.images[0].url : undefined

    if (p.variants && p.variants.length > 0) {
      return p.variants.map((v: any) => ({
        productId: p.id,
        productName: p.title, // Variant name usually constructed on UI, but passing Product title is fine
        variantId: v.id,
        sku: v.sku || '',
        stock: v.inventoryQuantity || 0,
        imageUrl: pImage, // Variants might have own images, but falling back to product image
        // Mocked fields
        unavailable: 0,
        committed: 0,
        incoming: 0
      }))
    } else {
      return [{
        productId: p.id,
        productName: p.title,
        variantId: null,
        sku: p.sku || '',
        stock: p.quantity || 0,
        imageUrl: pImage,
        unavailable: 0,
        committed: 0,
        incoming: 0
      }]
    }
  })

  // Sort items? API returns sorted by created_at.
  // Maybe robust sorting locally if needed, but for now simple list.

  return (
    <div className="max-w-[1600px] mx-auto">
      <InventoryTable
        items={items}
        locations={["Alkaline Inc"]}
      />
    </div>
  )
}

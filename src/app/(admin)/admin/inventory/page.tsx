import { getProducts, getCategories } from '@/lib/firestore'
import Link from 'next/link'

type Props = {
  searchParams?: { [key: string]: string | string[] | undefined }
}

export default async function InventoryPage({ searchParams }: Props) {
  const products = await getProducts()
  const categories = await getCategories()

  const selectedCategory = typeof searchParams?.categoryId === 'string' ? searchParams.categoryId : undefined
  const lowStock = searchParams?.lowStock === '1'
  const threshold = searchParams?.threshold ? parseInt(String(searchParams.threshold)) : undefined

  // Build a flattened list of variant rows
  const rows: Array<any> = []
  products.forEach((p: any) => {
    const vs = p.variants || []
    if (vs.length === 0) {
      rows.push({ productId: p.id, productName: p.name, variantId: null, sku: p.sku || '', stock: p.stock || 0 })
    } else {
      vs.forEach((v: any) => rows.push({ productId: p.id, productName: p.name, variantId: v.id, sku: v.sku || '', stock: v.stock || 0 }))
    }
  })

  return (
    <div className="max-w-5xl">
      <h1 className="text-2xl font-bold mb-6">Inventory Report</h1>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <select id="categoryId" name="categoryId" className="px-2 py-1 border rounded" defaultValue={selectedCategory || ''} onChange={(e) => {
            const params = new URLSearchParams(window.location.search)
            if (e.target.value) params.set('categoryId', e.target.value)
            else params.delete('categoryId')
            window.location.search = params.toString()
          }}>
            <option value="">All categories</option>
            {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>

          <label className="flex items-center gap-2">
            <input type="checkbox" defaultChecked={!!lowStock} onChange={(e) => {
              const params = new URLSearchParams(window.location.search)
              if (e.currentTarget.checked) params.set('lowStock', '1')
              else params.delete('lowStock')
              window.location.search = params.toString()
            }} />
            Low stock only
          </label>

          <input type="number" defaultValue={threshold ?? 5} className="px-2 py-1 border rounded w-20" onBlur={(e) => {
            const params = new URLSearchParams(window.location.search)
            const val = e.currentTarget.value
            if (val) params.set('threshold', val)
            else params.delete('threshold')
            window.location.search = params.toString()
          }} />
        </div>

        <div className="flex gap-2">
          <a href={`/api/inventory/csv?${new URLSearchParams({
            ...(selectedCategory ? { categoryId: String(selectedCategory) } : {}),
            ...(lowStock ? { lowStock: '1' } : {}),
            ...(threshold ? { threshold: String(threshold) } : {}),
          }).toString()}`} className="px-3 py-2 bg-primary text-white rounded hover:bg-primary/90">Download CSV</a>
          <Link href="/admin/inventory/import" className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Import CSV</Link>
        </div>
      </div>
      <div className="overflow-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left">
              <th className="px-3 py-2">Product</th>
              <th className="px-3 py-2">Variant ID</th>
              <th className="px-3 py-2">SKU</th>
              <th className="px-3 py-2">Stock</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={`${r.productId}-${r.variantId || 'base'}`} className="border-t">
                <td className="px-3 py-2">{r.productName}</td>
                <td className="px-3 py-2">{r.variantId || '-'}</td>
                <td className="px-3 py-2">{r.sku}</td>
                <td className="px-3 py-2">{r.stock}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

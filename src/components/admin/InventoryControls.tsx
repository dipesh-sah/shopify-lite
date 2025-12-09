'use client'

import { useRouter } from 'next/navigation'

interface InventoryControlsProps {
  categories: any[]
  selectedCategory?: string
  lowStock: boolean
  threshold: number
  csvUrl: string
}

export function InventoryControls({
  categories,
  selectedCategory,
  lowStock,
  threshold,
  csvUrl
}: InventoryControlsProps) {
  const router = useRouter()

  const updateParam = (key: string, value: string | null) => {
    const params = new URLSearchParams(window.location.search)
    if (value) params.set(key, value)
    else params.delete(key)
    router.replace(`?${params.toString()}`)
    router.refresh()
  }

  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-3">
        <select
          id="categoryId"
          name="categoryId"
          className="px-2 py-1 border rounded"
          defaultValue={selectedCategory || ''}
          onChange={(e) => updateParam('categoryId', e.target.value)}
        >
          <option value="">All categories</option>
          {categories.map((c: any) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            defaultChecked={lowStock}
            onChange={(e) => updateParam('lowStock', e.currentTarget.checked ? '1' : null)}
          />
          Low stock only
        </label>

        <input
          type="number"
          defaultValue={threshold}
          className="px-2 py-1 border rounded w-20"
          onBlur={(e) => updateParam('threshold', e.currentTarget.value)}
        />
      </div>

      <div className="flex gap-2">
        <a
          href={csvUrl}
          className="px-3 py-2 bg-primary text-white rounded hover:bg-primary/90"
        >
          Download CSV
        </a>
        <a
          href="/admin/inventory/import"
          className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Import CSV
        </a>
      </div>
    </div>
  )
}

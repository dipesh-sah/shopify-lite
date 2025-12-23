'use client'

import { useState, useEffect } from 'react'
import { CategoryTree } from '@/components/admin/categories/CategoryTree'
import { CategoryForm } from '@/components/admin/categories/CategoryForm'
import { Category } from '@/lib/categories'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'

export default function CategoriesPage() {
  const [tree, setTree] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [isAdding, setIsAdding] = useState(false)

  const locales = ['en-GB', 'de-DE']
  const [currentLocale, setCurrentLocale] = useState('en-GB')

  const fetchTree = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/categories?locale=${currentLocale}`)
      const data = await res.json()
      setTree(data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTree()
  }, [currentLocale])

  const handleSave = async (data: any) => {
    const url = editingCategory
      ? `/api/admin/categories/${editingCategory.id}`
      : '/api/admin/categories'

    const method = editingCategory ? 'PUT' : 'POST'

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })

    if (res.ok) {
      setEditingCategory(null)
      setIsAdding(false)
      fetchTree()
    }
  }

  if (isAdding || editingCategory) {
    return (
      <div className="p-8 max-w-5xl mx-auto">
        <CategoryForm
          category={editingCategory || undefined}
          locales={locales}
          onSave={handleSave}
          onCancel={() => {
            setEditingCategory(null)
            setIsAdding(false)
          }}
        />
      </div>
    )
  }

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      <div className="flex items-center gap-4 justify-end p-2 bg-muted/20 rounded-lg">
        <Label>View Locale:</Label>
        <select
          className="bg-background border rounded px-2 py-1 outline-none"
          value={currentLocale}
          onChange={(e) => setCurrentLocale(e.target.value)}
        >
          {locales.map(l => <option key={l} value={l}>{l}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center p-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <CategoryTree initialTree={tree} locale={currentLocale} />
      )}
    </div>
  )
}

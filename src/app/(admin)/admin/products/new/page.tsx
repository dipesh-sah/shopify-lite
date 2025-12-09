'use client'

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createProductAction } from "@/actions/products"
import { getCollectionsAction, getSubcategoriesAction } from "@/actions/collections"
import { getAttributeGroupsAction } from "@/actions/attributes"
import { showToast } from '@/components/ui/Toast'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Spinner from '@/components/ui/Spinner'
import { ImagePicker } from "@/components/admin/ImagePicker"
import { MultiSelect } from "@/components/ui/multi-select"
import { ArrowLeft } from "lucide-react"

export default function NewProductPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [images, setImages] = useState<string[]>([])
  // const [tags, setTags, setTags] = useState<string[]>([])
  // const [tagInput, setTagInput] = useState("")
  const [categories, setCategories] = useState<any[]>([])
  const [categoriesLoading, setCategoriesLoading] = useState(true)
  const [subcategories, setSubcategories] = useState<any[]>([])
  const [subsLoading, setSubsLoading] = useState(false)
  const [selectedCollections, setSelectedCollections] = useState<string[]>([])
  const [variants, setVariants] = useState<any[]>([])
  const [variantForm, setVariantForm] = useState({ sku: '', priceDelta: '', stock: '', optionsSelected: {} as Record<string, string>, image: '' })
  const [attributeGroups, setAttributeGroups] = useState<any[]>([])
  const [attrsLoading, setAttrsLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        const [cats, attrs] = await Promise.all([
          getCollectionsAction(),
          getAttributeGroupsAction()
        ])
        setCategories(cats)
        setAttributeGroups(attrs)
      } catch (error) {
        console.error('Failed to load initial data:', error)
      } finally {
        setCategoriesLoading(false)
        setAttrsLoading(false)
      }
    }
    loadData()
  }, [])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    formData.append('images', JSON.stringify(images))
    // formData.append('tags', JSON.stringify(tags))
    formData.append('variants', JSON.stringify(variants))
    formData.append('collectionIds', JSON.stringify(selectedCollections))

    try {
      await createProductAction(formData)
      showToast('Product created successfully', 'success')
      router.push('/admin/products')
    } catch (error) {
      console.error(error)
      showToast('Failed to create product', 'error')
    } finally {
      setLoading(false)
    }
  }

  function addVariant() {
    const options = { ...variantForm.optionsSelected }
    const priceDelta = variantForm.priceDelta ? parseFloat(variantForm.priceDelta) : 0
    const stock = variantForm.stock ? parseInt(variantForm.stock) : 0
    const v = { id: `tmp-${Date.now()}`, sku: variantForm.sku, priceDelta, stock, options, images: [] }
    setVariants([...variants, v])
    setVariantForm({ sku: '', priceDelta: '', stock: '', optionsSelected: {}, image: '' })
  }

  function removeVariant(idx: number) {
    setVariants(variants.filter((_, i) => i !== idx))
  }

  return (
    <div className="max-w-4xl">
      <div className="flex items-center gap-4 mb-6">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold">Add Product</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="rounded-lg border bg-card p-6">
          <h2 className="text-lg font-semibold mb-4">Basic Information</h2>

          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-2">
                Product Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                required
                className="w-full px-3 py-2 border rounded-md"
                placeholder="e.g. Summer T-Shirt"
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium mb-2">
                Description *
              </label>
              <textarea
                id="description"
                name="description"
                required
                rows={4}
                className="w-full px-3 py-2 border rounded-md"
                placeholder="Describe your product..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Collections
                </label>
                <MultiSelect
                  options={categories.map(c => ({ label: c.name, value: c.id }))}
                  selected={selectedCollections}
                  onChange={setSelectedCollections}
                  placeholder="Select collections..."
                />
              </div>

              <div>
                <label htmlFor="sku" className="block text-sm font-medium mb-2">
                  SKU
                </label>
                <input
                  type="text"
                  id="sku"
                  name="sku"
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="Optional"
                />
              </div>
            </div>

            {/* Subcategory selector */}
            <div className="mt-3">
              <label htmlFor="subcategoryId" className="block text-sm font-medium mb-2">
                Subcategory
              </label>
              <select id="subcategoryId" name="subcategoryId" disabled={subsLoading} className="w-full px-3 py-2 border rounded-md bg-white">
                <option value="">Select a subcategory (optional)</option>
                {subcategories.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            <div className="mt-3">
              <label htmlFor="status" className="block text-sm font-medium mb-2">
                Status
              </label>
              <select id="status" name="status" className="w-full px-3 py-2 border rounded-md bg-white">
                <option value="active">Active</option>
                <option value="draft">Draft</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>
        </div>

        {/* Pricing */}
        <div className="rounded-lg border bg-card p-6">
          <h2 className="text-lg font-semibold mb-4">Pricing</h2>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label htmlFor="price" className="block text-sm font-medium mb-2">
                Price ($) *
              </label>
              <input
                type="number"
                id="price"
                name="price"
                required
                step="0.01"
                min="0"
                className="w-full px-3 py-2 border rounded-md"
                placeholder="0.00"
              />
            </div>

            <div>
              <label htmlFor="compareAtPrice" className="block text-sm font-medium mb-2">
                Compare at Price ($)
              </label>
              <input
                type="number"
                id="compareAtPrice"
                name="compareAtPrice"
                step="0.01"
                min="0"
                className="w-full px-3 py-2 border rounded-md"
                placeholder="0.00"
              />
            </div>

            <div>
              <label htmlFor="costPrice" className="block text-sm font-medium mb-2">
                Cost Price ($)
              </label>
              <input
                type="number"
                id="costPrice"
                name="costPrice"
                step="0.01"
                min="0"
                className="w-full px-3 py-2 border rounded-md"
                placeholder="0.00"
              />
            </div>
          </div>
        </div>

        {/* Variants */}
        <div className="rounded-lg border bg-card p-6">
          <h2 className="text-lg font-semibold mb-4">Variants</h2>

          <div className="space-y-3">
            <div className="grid grid-cols-4 gap-3">
              <input value={variantForm.sku} onChange={(e) => setVariantForm(prev => ({ ...prev, sku: e.target.value }))} placeholder="SKU" className="px-3 py-2 border rounded-md col-span-1" />
              <input value={variantForm.priceDelta} onChange={(e) => setVariantForm(prev => ({ ...prev, priceDelta: e.target.value }))} placeholder="Price delta (e.g., 10 or -5)" className="px-3 py-2 border rounded-md col-span-1" />
              <input value={variantForm.stock} onChange={(e) => setVariantForm(prev => ({ ...prev, stock: e.target.value }))} placeholder="Stock" className="px-3 py-2 border rounded-md col-span-1" />
              <div className="col-span-1">
                {attrsLoading ? (
                  <div className="text-sm text-muted-foreground">Loading attributes...</div>
                ) : (
                  <div className="space-y-1">
                    {attributeGroups.map((g) => (
                      <div key={g.id} className="flex items-center gap-2">
                        <label className="text-xs w-24">{g.name}</label>
                        <select value={variantForm.optionsSelected[g.name] || ''} onChange={(e) => setVariantForm(prev => ({ ...prev, optionsSelected: { ...prev.optionsSelected, [g.name]: e.target.value } }))} className="px-2 py-1 border rounded-md">
                          <option value="">—</option>
                          {(g.options || []).map((opt: string) => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div>
              <Button type="button" onClick={addVariant} variant="outline">Add Variant</Button>
            </div>

            {variants.length > 0 && (
              <div className="space-y-2">
                {variants.map((v, idx) => (
                  <div key={v.id} className="flex items-center justify-between p-3 border rounded-md">
                    <div>
                      <p className="font-medium">{v.sku} {v.priceDelta ? `(${v.priceDelta >= 0 ? '+' : ''}${v.priceDelta})` : ''}</p>
                      <p className="text-xs text-muted-foreground">Stock: {v.stock} — Options: {Object.entries(v.options || {}).map(([k, val]) => `${k}:${val}`).join(', ')}</p>
                    </div>
                    <div>
                      <Button type="button" variant="ghost" onClick={() => removeVariant(idx)}>Remove</Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Inventory */}
        <div className="rounded-lg border bg-card p-6">
          <h2 className="text-lg font-semibold mb-4">Inventory</h2>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label htmlFor="stock" className="block text-sm font-medium mb-2">
                Stock Quantity
              </label>
              <input
                type="number"
                id="stock"
                name="stock"
                min="0"
                defaultValue="0"
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>

            <div>
              <label htmlFor="lowStockThreshold" className="block text-sm font-medium mb-2">
                Low Stock Alert
              </label>
              <input
                type="number"
                id="lowStockThreshold"
                name="lowStockThreshold"
                min="0"
                defaultValue="5"
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>

            <div>
              <label htmlFor="barcode" className="block text-sm font-medium mb-2">
                Barcode
              </label>
              <input
                type="text"
                id="barcode"
                name="barcode"
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
          </div>
        </div>

        {/* Images */}
        <div className="rounded-lg border bg-card p-6">
          <h2 className="text-lg font-semibold mb-4">Product Images</h2>
          <ImagePicker images={images} onChange={setImages} />
        </div>

        {/* Shipping */}
        <div className="rounded-lg border bg-card p-6">
          <h2 className="text-lg font-semibold mb-4">Shipping</h2>

          <div className="grid grid-cols-4 gap-4">
            <div>
              <label htmlFor="weight" className="block text-sm font-medium mb-2">
                Weight (kg)
              </label>
              <input
                type="number"
                id="weight"
                name="weight"
                step="0.01"
                min="0"
                defaultValue="0.00"
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>

            {/* Dimensions section removed as it is not supported by backend yet */}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4">
          <Button type="submit" disabled={loading}>
            {loading ? "Creating..." : "Create Product"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}
